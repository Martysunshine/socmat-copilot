"""
Builds a serializable case context dict from all analysis data stored in the DB.
This context is passed to AI providers as grounding material.
"""

import json
from sqlalchemy.orm import Session

from models.analyst_note import AnalystNote
from models.case import Case
from models.case_playbook import CasePlaybook
from models.ioc import Ioc
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
    playbooks = (
        db.query(CasePlaybook)
        .filter(CasePlaybook.case_id == case_id)
        .order_by(CasePlaybook.created_at)
        .all()
    )
    analyst_notes = (
        db.query(AnalystNote)
        .filter(AnalystNote.case_id == case_id)
        .order_by(AnalystNote.created_at)
        .all()
    )
    iocs = (
        db.query(Ioc)
        .filter(Ioc.case_id == case_id)
        .order_by(Ioc.ioc_type, Ioc.normalized_value)
        .limit(50)
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
        "playbook_progress": [
            {
                "name": pb.name,
                "status": pb.status,
                "progress_percent": pb.progress_percent,
                "pending_steps": [
                    {"title": s.title, "description": s.description}
                    for s in pb.steps
                    if s.status == "pending"
                ],
            }
            for pb in playbooks
        ],
        "analyst_notes": [
            {
                "note_type": n.note_type,
                "entity_type": n.entity_type,
                "body": n.body,
                "author": n.author_name or "analyst",
                "created_at": str(n.created_at),
                "_label": "analyst-written — treat as analyst opinion, not verified evidence",
            }
            for n in analyst_notes
        ],
        "iocs": [
            {
                "ioc_type": i.ioc_type,
                "value": i.value,
                "source_type": i.source_type,
                "confidence": i.confidence,
                "tags": json.loads(i.tags_json) if i.tags_json else [],
            }
            for i in iocs
        ],
        "entity_graph_summary": _build_entity_summary(case, db, case_id),
        "timeline_narrative": _build_timeline_narrative(timeline),
        "coverage_gaps": _build_coverage_gaps(db, case_id, det_findings),
    }


def _build_timeline_narrative(timeline: list) -> dict:
    """Summarise timeline events for AI context — ordered sequence with source and severity."""
    if not timeline:
        return {"summary": "No timeline events recorded.", "event_count": 0, "events": []}

    events = [
        {
            "order": i + 1,
            "timestamp": str(te.timestamp),
            "source": te.source,
            "event_type": te.event_type,
            "severity": te.severity,
            "description": te.description,
        }
        for i, te in enumerate(timeline[:40])
    ]

    sources = sorted({te.source for te in timeline})
    severities_present = sorted(
        {te.severity for te in timeline},
        key=lambda s: ["info", "low", "medium", "high", "critical"].index(s)
        if s in ["info", "low", "medium", "high", "critical"]
        else 99,
    )

    return {
        "event_count": len(timeline),
        "sources": sources,
        "severities_present": severities_present,
        "first_event_at": str(timeline[0].timestamp),
        "last_event_at": str(timeline[-1].timestamp),
        "events": events,
        "_label": "Timeline data only — treat as analyst-observed events, not AI-generated analysis.",
    }


def _build_coverage_gaps(db: Session, case_id: int, det_findings: list) -> dict:
    """Summarise telemetry gaps for AI context so it can recommend missing log sources."""
    from models.normalized_event import NormalizedEvent
    from models.network_analysis_result import NetworkAnalysisResult
    from models.pcap_analysis_result import PcapAnalysisResult

    event_ids: set = {
        str(eid)
        for (eid,) in db.query(NormalizedEvent.event_id).filter(
            NormalizedEvent.case_id == case_id
        ).all()
        if eid
    }

    net_types = {
        (lt or "").lower()
        for (lt,) in db.query(NetworkAnalysisResult.log_type).filter(
            NetworkAnalysisResult.case_id == case_id
        ).all()
    }

    has_dns = any("dns" in t for t in net_types) or bool(
        db.query(PcapAnalysisResult.id).filter(
            PcapAnalysisResult.case_id == case_id,
            PcapAnalysisResult.dns_queries.isnot(None),
        ).first()
    )
    has_http = any("http" in t for t in net_types) or bool(
        db.query(PcapAnalysisResult.id).filter(
            PcapAnalysisResult.case_id == case_id,
            PcapAnalysisResult.http_requests.isnot(None),
        ).first()
    )

    gaps = []
    if not {"4103", "4104"}.intersection(event_ids):
        gaps.append("PowerShell Script Block Logs (EID 4103/4104) not collected — T1059.001 detection is limited")
    if not {"1", "4688"}.intersection(event_ids):
        gaps.append("Sysmon/Windows process creation logs (EID 1/4688) not collected — most Sigma rules cannot run")
    if "3" not in event_ids:
        gaps.append("Sysmon network connection logs (EID 3) not collected — C2 process correlation not possible")
    if not has_dns:
        gaps.append("DNS query logs not available — T1071.004 (DNS C2) detection is limited")
    if not has_http:
        gaps.append("HTTP/proxy logs not available — web-based C2 and exfiltration detection is limited")
    if not {"4624", "4625", "4648", "4768", "4769", "4776"}.intersection(event_ids):
        gaps.append("Authentication event logs not collected — brute force and account compromise detection is limited")

    triggered_count = len({df.rule_id for df in det_findings})

    return {
        "telemetry_gaps": gaps,
        "gap_count": len(gaps),
        "triggered_sigma_rules": triggered_count,
        "_label": (
            "Coverage gap data is derived from case evidence only. "
            "Gaps indicate missing telemetry — they do not mean no attack occurred. "
            "Do not claim data exists if not present. Recommend collecting missing logs."
        ),
    }


def _build_entity_summary(case, db: Session, case_id: int) -> dict:
    from collections import Counter
    from models.normalized_event import NormalizedEvent

    norm_events = (
        db.query(NormalizedEvent)
        .filter(NormalizedEvent.case_id == case_id)
        .all()
    )
    hosts: Counter = Counter()
    users: Counter = Counter()
    ips: Counter = Counter()
    processes: Counter = Counter()
    for ev in norm_events:
        if ev.host:
            hosts[ev.host] += 1
        if ev.user:
            users[ev.user] += 1
        for ip in [ev.source_ip, ev.destination_ip]:
            if ip:
                ips[ip] += 1
        if ev.process_name:
            processes[ev.process_name] += 1

    return {
        "key_hosts": [h for h, _ in hosts.most_common(8)],
        "key_users": [u for u, _ in users.most_common(8)],
        "key_ips": [ip for ip, _ in ips.most_common(8)],
        "key_processes": [p for p, _ in processes.most_common(8)],
        "_note": "Derived from normalized events. Use GET /cases/{id}/graph for full interactive graph.",
    }
