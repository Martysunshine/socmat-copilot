"""
Builds a serializable case context dict from all analysis data stored in the DB.
This context is passed to AI providers as grounding material.
"""

import json
from sqlalchemy.orm import Session

from models.case import Case
from models.evidence import Evidence
from models.timeline_event import TimelineEvent
from models.detection_finding import DetectionFinding
from models.malware_triage_result import MalwareTriageResult
from models.network_analysis_result import NetworkAnalysisResult
from models.correlated_finding import CorrelatedFinding
from models.case_mitre_mapping import CaseMitreMapping


def _load_json(value, fallback=None):
    if fallback is None:
        fallback = []
    if value is None:
        return fallback
    if isinstance(value, (list, dict)):
        return value
    try:
        return json.loads(value)
    except Exception:
        return fallback


def build_case_context(db: Session, case_id: int) -> dict:
    """Query all case data and return as a plain serializable dict."""
    case = db.query(Case).filter(Case.id == case_id).first()
    evidence = (
        db.query(Evidence)
        .filter(Evidence.case_id == case_id)
        .order_by(Evidence.uploaded_at)
        .all()
    )
    timeline = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.case_id == case_id)
        .order_by(TimelineEvent.timestamp)
        .all()
    )
    det_findings = (
        db.query(DetectionFinding)
        .filter(DetectionFinding.case_id == case_id)
        .order_by(DetectionFinding.created_at)
        .all()
    )
    yara_results = (
        db.query(MalwareTriageResult)
        .filter(MalwareTriageResult.case_id == case_id)
        .order_by(MalwareTriageResult.created_at)
        .all()
    )
    net_results = (
        db.query(NetworkAnalysisResult)
        .filter(NetworkAnalysisResult.case_id == case_id)
        .order_by(NetworkAnalysisResult.created_at)
        .all()
    )
    corr_findings = (
        db.query(CorrelatedFinding)
        .filter(CorrelatedFinding.case_id == case_id)
        .order_by(CorrelatedFinding.created_at)
        .all()
    )
    mitre_mappings = (
        db.query(CaseMitreMapping)
        .filter(CaseMitreMapping.case_id == case_id)
        .order_by(CaseMitreMapping.tactic, CaseMitreMapping.technique_id)
        .all()
    )

    return {
        "case": {
            "id": case.id,
            "title": case.title,
            "description": case.description,
            "severity": case.severity,
            "status": case.status,
            "source": case.source,
            "affected_host": case.affected_host,
            "affected_user": case.affected_user,
            "affected_ip": case.affected_ip,
            "created_at": str(case.created_at),
            "updated_at": str(case.updated_at),
        },
        "evidence": [
            {
                "filename": ev.original_filename,
                "file_type": ev.file_type,
                "sha256_prefix": (ev.sha256[:16] + "…") if ev.sha256 else None,
                "uploaded_at": str(ev.uploaded_at),
            }
            for ev in evidence
        ],
        "timeline_events": [
            {
                "timestamp": str(te.timestamp),
                "event_type": te.event_type,
                "source": te.source,
                "description": te.description,
                "severity": te.severity,
            }
            for te in timeline[:30]
        ],
        "detection_findings": [
            {
                "rule_title": df.rule_title,
                "severity": df.severity,
                "match_reason": df.match_reason,
                "event_id": df.event_id_str,
            }
            for df in det_findings
        ],
        "yara_results": [
            {
                "risk_score": r.risk_score,
                "file_type": r.file_type,
                "summary": r.summary,
                "yara_matches_count": len(_load_json(r.yara_matches, [])),
            }
            for r in yara_results
        ],
        "network_results": [
            {
                "log_type": r.log_type,
                "total_records": r.total_records,
                "risk_score": r.risk_score,
                "summary": r.summary,
            }
            for r in net_results
        ],
        "correlated_findings": [
            {
                "title": cf.title,
                "confidence": cf.confidence,
                "summary": cf.summary,
                "recommended_action": cf.recommended_action,
            }
            for cf in corr_findings
        ],
        "mitre_mappings": [
            {
                "technique_id": m.technique_id,
                "technique_name": m.technique_name,
                "tactic": m.tactic,
                "confidence": m.confidence,
            }
            for m in mitre_mappings
        ],
    }
