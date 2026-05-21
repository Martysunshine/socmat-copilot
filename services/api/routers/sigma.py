"""
Sigma rule library endpoints.

GET  /sigma/rules           — list all loaded rules (filterable)
GET  /sigma/rules/{rule_id} — rule detail with explanation
POST /sigma/rules/reload    — reload rules from disk

POST   /cases/{case_id}/sigma/rules                   — attach rule to case
GET    /cases/{case_id}/sigma/rules                   — list attached rules
DELETE /cases/{case_id}/sigma/rules/{rule_sigma_id}   — detach rule from case
"""

import sys
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from integrations.sigma.loader import get_cached_rules, get_rule_by_id, load_rules  # noqa: E402
from integrations.sigma.explainer import explain  # noqa: E402

from database import get_db
from models.case import Case
from models.case_sigma_rule import CaseSigmaRule
from schemas.sigma import (
    AttachRuleRequest,
    CaseSigmaRuleResponse,
    RuleExplanation,
    SigmaRuleResponse,
)

router = APIRouter(tags=["sigma"])


@router.get("/sigma/rules", response_model=List[SigmaRuleResponse])
def list_sigma_rules(
    level: Optional[str] = Query(None, description="Filter by rule level"),
    logsource_product: Optional[str] = Query(None, description="Filter by logsource product"),
    logsource_category: Optional[str] = Query(None, description="Filter by logsource category"),
    tag: Optional[str] = Query(None, description="Filter by tag substring"),
):
    rules = get_cached_rules()
    if level:
        rules = [r for r in rules if r["level"].lower() == level.lower()]
    if logsource_product:
        rules = [r for r in rules
                 if r["logsource"].get("product", "").lower() == logsource_product.lower()]
    if logsource_category:
        rules = [r for r in rules
                 if r["logsource"].get("category", "").lower() == logsource_category.lower()]
    if tag:
        tag_lower = tag.lower()
        rules = [r for r in rules
                 if any(tag_lower in t.lower() for t in r["tags"])]
    return [SigmaRuleResponse(**r) for r in rules]


@router.post("/sigma/rules/reload")
def reload_sigma_rules():
    rules = load_rules()
    return {"loaded": len(rules)}


@router.get("/sigma/rules/{rule_id}", response_model=SigmaRuleResponse)
def get_sigma_rule(rule_id: str):
    rule = get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Sigma rule not found")
    return SigmaRuleResponse(**rule, explanation=RuleExplanation(**explain(rule)))


@router.post("/cases/{case_id}/sigma/rules", response_model=CaseSigmaRuleResponse, status_code=201)
def attach_sigma_rule(
    case_id: int,
    body: AttachRuleRequest,
    db: Session = Depends(get_db),
):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    if not get_rule_by_id(body.rule_sigma_id):
        raise HTTPException(status_code=404, detail="Sigma rule not found")

    existing = db.query(CaseSigmaRule).filter(
        CaseSigmaRule.case_id == case_id,
        CaseSigmaRule.rule_sigma_id == body.rule_sigma_id,
    ).first()
    if existing:
        return CaseSigmaRuleResponse(
            id=existing.id,
            case_id=existing.case_id,
            rule_sigma_id=existing.rule_sigma_id,
            rule_title=existing.rule_title,
            rule_level=existing.rule_level,
            attached_at=existing.attached_at.isoformat(),
        )

    row = CaseSigmaRule(
        case_id=case_id,
        rule_sigma_id=body.rule_sigma_id,
        rule_title=body.rule_title,
        rule_level=body.rule_level,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return CaseSigmaRuleResponse(
        id=row.id,
        case_id=row.case_id,
        rule_sigma_id=row.rule_sigma_id,
        rule_title=row.rule_title,
        rule_level=row.rule_level,
        attached_at=row.attached_at.isoformat(),
    )


@router.get("/cases/{case_id}/sigma/rules", response_model=List[CaseSigmaRuleResponse])
def list_case_sigma_rules(case_id: int, db: Session = Depends(get_db)):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    rows = db.query(CaseSigmaRule).filter(CaseSigmaRule.case_id == case_id).all()
    return [
        CaseSigmaRuleResponse(
            id=r.id,
            case_id=r.case_id,
            rule_sigma_id=r.rule_sigma_id,
            rule_title=r.rule_title,
            rule_level=r.rule_level,
            attached_at=r.attached_at.isoformat(),
        )
        for r in rows
    ]


@router.delete("/cases/{case_id}/sigma/rules/{rule_sigma_id}", status_code=204)
def detach_sigma_rule(
    case_id: int,
    rule_sigma_id: str,
    db: Session = Depends(get_db),
):
    if not db.query(Case).filter(Case.id == case_id).first():
        raise HTTPException(status_code=404, detail="Case not found")
    row = db.query(CaseSigmaRule).filter(
        CaseSigmaRule.case_id == case_id,
        CaseSigmaRule.rule_sigma_id == rule_sigma_id,
    ).first()
    if not row:
        raise HTTPException(status_code=404, detail="Rule not attached to this case")
    db.delete(row)
    db.commit()
