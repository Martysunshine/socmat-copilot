import hashlib
import re
import uuid
from pathlib import Path
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from database import get_db
from models.case import Case
from models.evidence import Evidence
from schemas.evidence import EvidenceResponse

UPLOAD_DIR = Path("./uploads").resolve()
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# 50 MB hard ceiling — evidence files are logs/text, not disk images
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

router = APIRouter(prefix="/cases", tags=["evidence"])


def _safe_filename(original: str) -> str:
    name = Path(original).name  # strip any directory component
    name = re.sub(r"[^\w\-\.]", "_", name)
    name = name.lstrip(".")
    return name or "upload"


@router.get("/{case_id}/evidence", response_model=List[EvidenceResponse])
def list_evidence(case_id: int, db: Session = Depends(get_db)):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    return (
        db.query(Evidence)
        .filter(Evidence.case_id == case_id)
        .order_by(Evidence.uploaded_at.desc())
        .all()
    )


@router.post("/{case_id}/evidence", response_model=EvidenceResponse, status_code=status.HTTP_201_CREATED)
async def upload_evidence(
    case_id: int,
    file: UploadFile = File(...),
    notes: str = Form(default=""),
    db: Session = Depends(get_db),
):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")

    original_name = file.filename or "upload"
    safe_name = _safe_filename(original_name)
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    dest = (UPLOAD_DIR / stored_name).resolve()

    # Path traversal guard — dest must remain inside UPLOAD_DIR
    if not dest.is_relative_to(UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Invalid filename")

    content = await file.read()

    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds the {MAX_UPLOAD_BYTES // (1024 * 1024)} MB upload limit",
        )

    dest.write_bytes(content)
    sha = hashlib.sha256(content).hexdigest()

    ev = Evidence(
        case_id=case_id,
        filename=stored_name,
        original_filename=original_name,
        file_type=file.content_type,
        file_size=len(content),
        sha256=sha,
        storage_path=str(dest),
        notes=notes or None,
    )
    db.add(ev)
    db.commit()
    db.refresh(ev)
    return ev
