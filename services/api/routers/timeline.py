from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.case import Case
from models.timeline_event import TimelineEvent
from schemas.evidence import TimelineEventCreate, TimelineEventResponse

router = APIRouter(prefix="/cases", tags=["timeline"])


@router.get("/{case_id}/timeline", response_model=List[TimelineEventResponse])
def list_timeline(case_id: int, db: Session = Depends(get_db)):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    return (
        db.query(TimelineEvent)
        .filter(TimelineEvent.case_id == case_id)
        .order_by(TimelineEvent.timestamp.asc())
        .all()
    )


@router.post("/{case_id}/timeline", response_model=TimelineEventResponse, status_code=status.HTTP_201_CREATED)
def create_timeline_event(case_id: int, data: TimelineEventCreate, db: Session = Depends(get_db)):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    event = TimelineEvent(case_id=case_id, **data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
