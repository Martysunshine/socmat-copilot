#!/usr/bin/env python3
"""
Seed script — Operation: Midnight Blue demo.

Creates a demo case, uploads all demo-incident evidence files,
runs every analysis module automatically, and seeds all Phase 26–33
advanced analyst-workflow features with realistic demo data.

Requirements:
    pip install requests

Usage:
    python scripts/seed_demo.py
    python scripts/seed_demo.py --api http://localhost:8000 --verbose
"""

import argparse
import json
import sys
import time
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' library not found. Install it with: pip install requests")
    sys.exit(1)


DEMO_DIR = Path(__file__).resolve().parent.parent / "sample-data" / "demo-incident"

DEMO_CASE = {
    "title": "Operation: Midnight Blue",
    "description": (
        "Multi-stage compromise — credential spray against jsmith on WORKSTATION-42, "
        "encoded PowerShell execution, C2 beacon to 192.168.1.200, "
        "lateral movement attempt via MS17-010."
    ),
    "severity": "critical",
    "status": "investigating",
    "source": "windows_logs",
    "affected_host": "WORKSTATION-42",
    "affected_user": "jsmith",
    "affected_ip": "10.10.50.201",
}

EVIDENCE_FILES = [
    ("windows-security.json", "application/json"),
    ("sysmon-events.json", "application/json"),
    ("suricata-alerts.json", "application/json"),
    ("zeek-conn.log", "text/plain"),
    ("zeek-dns.log", "text/plain"),
    ("zeek-http.log", "text/plain"),
    ("suspicious-payload.ps1.txt", "text/plain"),
]


def _ok(resp: requests.Response, label: str):
    if not resp.ok:
        print(f"  FAIL [{resp.status_code}] {label}: {resp.text[:200]}")
        return None
    return resp.json() if resp.content else {}


def run(api: str, verbose: bool) -> None:
    base = api.rstrip("/")
    session = requests.Session()
    session.headers["Content-Type"] = "application/json"

    # ── health check ────────────────────────────────────────────────────────
    print(f"Connecting to {base} …")
    try:
        r = session.get(f"{base}/health", timeout=5)
        if not r.ok:
            print(f"ERROR: Backend health check failed ({r.status_code}). Is it running?")
            sys.exit(1)
    except requests.ConnectionError:
        print(f"ERROR: Cannot connect to {base}. Start the backend first.")
        sys.exit(1)
    print("  API online")

    # ── create case ──────────────────────────────────────────────────────────
    print("\nCreating demo case …")
    session.headers.pop("Content-Type", None)
    r = session.post(f"{base}/cases", json=DEMO_CASE)
    case = _ok(r, "create case")
    if not case:
        sys.exit(1)
    case_id = case["id"]
    print(f"  Case created — id={case_id}: {case['title']}")

    # ── upload evidence ──────────────────────────────────────────────────────
    print("\nUploading evidence files …")
    evidence_ids: dict[str, int] = {}
    for filename, mime in EVIDENCE_FILES:
        fpath = DEMO_DIR / filename
        if not fpath.exists():
            print(f"  SKIP (not found): {filename}")
            continue
        with open(fpath, "rb") as fh:
            r = session.post(
                f"{base}/cases/{case_id}/evidence",
                files={"file": (filename, fh, mime)},
            )
        ev = _ok(r, f"upload {filename}")
        if ev:
            evidence_ids[filename] = ev["id"]
            print(f"  Uploaded {filename} (evidence id={ev['id']})")

    def ev_id(name: str) -> int | None:
        return evidence_ids.get(name)

    # ── windows / sysmon analysis ────────────────────────────────────────────
    print("\nRunning Windows / Sysmon analysis …")
    for fname in ("windows-security.json", "sysmon-events.json"):
        eid = ev_id(fname)
        if eid is None:
            continue
        r = session.post(
            f"{base}/cases/{case_id}/analyze/windows-logs",
            params={"evidence_id": eid},
        )
        res = _ok(r, f"windows-logs {fname}")
        if res and verbose:
            print(f"    {fname}: {res.get('events_count', '?')} events, "
                  f"{res.get('findings_count', '?')} findings")
        elif res:
            print(f"  Done — {fname}")

    # ── suricata analysis ────────────────────────────────────────────────────
    print("\nRunning Suricata analysis …")
    eid = ev_id("suricata-alerts.json")
    if eid:
        r = session.post(
            f"{base}/cases/{case_id}/analyze/suricata",
            params={"evidence_id": eid},
        )
        res = _ok(r, "suricata")
        if res:
            print(f"  Done — {res.get('alerts_count', '?')} alerts, "
                  f"{res.get('findings_count', '?')} findings")

    # ── zeek analysis ────────────────────────────────────────────────────────
    print("\nRunning Zeek analysis …")
    for fname in ("zeek-conn.log", "zeek-dns.log", "zeek-http.log"):
        eid = ev_id(fname)
        if eid is None:
            continue
        r = session.post(
            f"{base}/cases/{case_id}/analyze/zeek",
            json={"evidence_id": eid},
        )
        res = _ok(r, f"zeek {fname}")
        if res:
            print(f"  Done — {fname}: {res.get('records_count', '?')} records")

    # ── YARA triage ──────────────────────────────────────────────────────────
    print("\nRunning YARA static triage …")
    eid = ev_id("suspicious-payload.ps1.txt")
    if eid:
        r = session.post(
            f"{base}/cases/{case_id}/analyze/yara",
            json={"evidence_id": eid},
        )
        res = _ok(r, "yara")
        if res:
            print(f"  Done — {res.get('matches_count', '?')} rule matches")

    # ── sigma run ────────────────────────────────────────────────────────────
    print("\nRunning Sigma rules …")
    r = session.post(f"{base}/cases/{case_id}/sigma/run")
    res = _ok(r, "sigma run")
    if res:
        print(f"  Done — {res.get('findings_count', '?')} sigma findings")

    # ── correlation ──────────────────────────────────────────────────────────
    print("\nRunning investigation correlation …")
    r = session.post(f"{base}/cases/{case_id}/correlate")
    res = _ok(r, "correlate")
    if res is not None:
        count = len(res) if isinstance(res, list) else res.get('findings_count', '?')
        print(f"  Done — {count} correlated findings")

    # ── MITRE mapping ────────────────────────────────────────────────────────
    print("\nRunning MITRE ATT&CK mapping …")
    r = session.post(f"{base}/cases/{case_id}/mitre/map")
    res = _ok(r, "mitre map")
    if res is not None:
        count = len(res) if isinstance(res, list) else res.get('mappings_count', '?')
        print(f"  Done — {count} technique mappings")

    # ── IOC extraction ───────────────────────────────────────────────────────
    print("\nExtracting IOCs …")
    r = session.post(f"{base}/cases/{case_id}/iocs/extract")
    res = _ok(r, "ioc extract")
    if res is not None:
        count = res.get("extracted_count", "?")
        print(f"  Done — {count} IOCs extracted")

    # ── Phase 26: Analyst Playbooks ──────────────────────────────────────────
    print("\nSeeding analyst playbooks …")
    r = session.get(f"{base}/playbooks/templates")
    templates = _ok(r, "get playbook templates")
    pb_id = None
    if templates:
        # Attach "Brute Force" playbook (most relevant for this demo case)
        brute_force = next(
            (t for t in templates if "brute" in t["name"].lower()),
            templates[0],
        )
        r = session.post(
            f"{base}/cases/{case_id}/playbooks",
            json={"template_id": brute_force["id"]},
        )
        pb = _ok(r, "attach brute-force playbook")
        if pb:
            pb_id = pb["id"]
            print(f"  Attached: {brute_force['name']}")
            # Mark first 3 steps done to show progress
            steps = pb.get("steps", [])
            for step in steps[:3]:
                session.patch(
                    f"{base}/cases/{case_id}/playbooks/{pb_id}/steps/{step['id']}",
                    json={"status": "done", "analyst_notes": "Confirmed — see Windows Security log evidence."},
                )
            if steps:
                print(f"  Marked {min(3, len(steps))} of {len(steps)} steps as done")

        # Also attach PowerShell playbook
        ps_tmpl = next(
            (t for t in templates if "powershell" in t["name"].lower()),
            None,
        )
        if ps_tmpl:
            r = session.post(
                f"{base}/cases/{case_id}/playbooks",
                json={"template_id": ps_tmpl["id"]},
            )
            pb2 = _ok(r, "attach powershell playbook")
            if pb2:
                print(f"  Attached: {ps_tmpl['name']}")

    # ── Phase 27: Analyst Notes ───────────────────────────────────────────────
    print("\nSeeding analyst notes …")
    demo_notes = [
        {
            "entity_type": "case",
            "entity_id": case_id,
            "note_type": "observation",
            "content": (
                "Initial triage of WORKSTATION-42. Multiple failed logins (EID 4625) "
                "from 203.0.113.45 between 02:11–02:18 UTC. Successful logon (EID 4624) "
                "at 02:18:43 UTC under jsmith account. Possible credential spray."
            ),
        },
        {
            "entity_type": "case",
            "entity_id": case_id,
            "note_type": "hypothesis",
            "content": (
                "Hypothesis: Attacker obtained jsmith credentials via credential spray, "
                "then used encoded PowerShell to download and execute a second-stage payload. "
                "C2 beacon observed to 192.168.1.200 (suspicious internal IP)."
            ),
        },
        {
            "entity_type": "case",
            "entity_id": case_id,
            "note_type": "recommendation",
            "content": (
                "Recommended actions: (1) Isolate WORKSTATION-42 immediately. "
                "(2) Reset jsmith credentials. "
                "(3) Inspect 192.168.1.200 for C2 infrastructure. "
                "(4) Review all hosts that authenticated from 203.0.113.45."
            ),
        },
        {
            "entity_type": "case",
            "entity_id": case_id,
            "note_type": "assessment",
            "content": (
                "FINAL ASSESSMENT: Confirmed multi-stage compromise. "
                "Attacker achieved initial access via credential spray, executed encoded PowerShell "
                "(MITRE T1059.001), and established C2 communication (MITRE T1071). "
                "Lateral movement attempted via MS17-010 (T1210). "
                "Severity: CRITICAL. Escalate to IR team."
            ),
        },
    ]
    notes_created = 0
    for note_data in demo_notes:
        r = session.post(f"{base}/cases/{case_id}/notes", json=note_data)
        if _ok(r, f"note ({note_data['note_type']})"):
            notes_created += 1
    print(f"  Created {notes_created} analyst notes")

    # ── Phase 28: IOC tagging (already extracted above) ──────────────────────
    print("\nTagging demo IOCs …")
    r = session.get(f"{base}/cases/{case_id}/iocs")
    iocs = _ok(r, "get iocs")
    if iocs:
        tagged = 0
        for ioc in iocs[:5]:
            ioc_id = ioc.get("id")
            ioc_val = ioc.get("value", "")
            # Tag external IP as suspicious, C2 IP as confirmed malicious
            if "203.0.113" in ioc_val:
                tag = "suspicious"
            elif "192.168.1.200" in ioc_val:
                tag = "confirmed_malicious"
            elif ioc.get("ioc_type") in ("sha256", "md5"):
                tag = "confirmed_malicious"
            else:
                continue
            r = session.patch(
                f"{base}/cases/{case_id}/iocs/{ioc_id}",
                json={"analyst_tag": tag},
            )
            if r.ok:
                tagged += 1
        print(f"  Tagged {tagged} IOCs with analyst disposition")

    # ── Phase 32: Finding Dispositions ───────────────────────────────────────
    print("\nSeeding finding dispositions …")
    demo_dispositions = [
        {
            "finding_type": "sigma",
            "finding_id": "brute_force_failed_logons",
            "finding_title": "Multiple Failed Logon Attempts",
            "disposition": "true_positive",
            "confidence": "high",
            "reason": "14 failed logons in 7 minutes from 203.0.113.45 — confirmed brute force.",
            "analyst_name": "jdoe",
            "follow_up_action": "Block 203.0.113.45 at perimeter firewall.",
        },
        {
            "finding_type": "sigma",
            "finding_id": "suspicious_powershell_encoded",
            "finding_title": "Suspicious Encoded PowerShell",
            "disposition": "true_positive",
            "confidence": "high",
            "reason": "Decoded command downloads and executes payload from external URL.",
            "analyst_name": "jdoe",
            "follow_up_action": "Image WORKSTATION-42. Preserve memory dump.",
        },
        {
            "finding_type": "suricata",
            "finding_id": "ET-POLICY-C2-beacon",
            "finding_title": "ET POLICY Possible C2 Beacon",
            "disposition": "true_positive",
            "confidence": "medium",
            "reason": "Regular 60-second interval connections to 192.168.1.200:4444 from infected host.",
            "analyst_name": "jdoe",
            "follow_up_action": "Investigate 192.168.1.200 as potential C2 pivot host.",
        },
    ]
    disps_created = 0
    for disp_data in demo_dispositions:
        r = session.post(f"{base}/cases/{case_id}/dispositions", json=disp_data)
        if _ok(r, f"disposition ({disp_data['finding_title'][:30]})"):
            disps_created += 1
    print(f"  Created {disps_created} finding dispositions")

    # ── generate final report (includes all advanced feature sections) ────────
    print("\nGenerating final incident report …")
    r = session.post(f"{base}/cases/{case_id}/report/generate")
    res = _ok(r, "report generate")
    if res:
        print(f"  Done — report saved")

    # ── report readiness check ────────────────────────────────────────────────
    print("\nChecking report readiness …")
    r = session.get(f"{base}/cases/{case_id}/report/readiness")
    readiness = _ok(r, "report readiness")
    if readiness:
        score = readiness.get("total_score", 0)
        grade = readiness.get("grade", "?")
        missing = len(readiness.get("missing_checks", []))
        print(f"  Score: {score:.0f}% ({grade.upper()}) — {missing} checks still missing")
        if verbose and readiness.get("missing_checks"):
            for mc in readiness["missing_checks"][:5]:
                print(f"    · Missing: {mc['name']}")

    # ── summary ─────────────────────────────────────────────────────────────
    print(f"""
------------------------------------------------------
 Demo case ready!

 Case ID  : {case_id}
 Case URL : http://localhost:5173/cases/{case_id}

 What was seeded:
   ✓ Case: Operation — Midnight Blue (critical)
   ✓ 7 evidence files (Windows, Suricata, Zeek, YARA)
   ✓ Windows/Sysmon, Suricata, Zeek analysis
   ✓ YARA static triage
   ✓ Sigma detection run
   ✓ Correlation engine
   ✓ MITRE ATT&CK mapping
   ✓ IOC extraction and tagging
   ✓ Analyst playbooks (brute force + PowerShell)
   ✓ Analyst notes (observation, hypothesis, recommendation, assessment)
   ✓ Finding dispositions (3 confirmed true positives)
   ✓ Incident report generated

 To see advanced features:
   - Timeline Replay: click "Replay Mode" on the Timeline tab
   - Entity Graph: scroll to "Investigation Map"
   - Detection Coverage: scroll to "Detection Coverage"
   - Report Readiness: scroll to "Report Readiness"
------------------------------------------------------
""")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the SOC Copilot demo case")
    parser.add_argument("--api", default="http://localhost:8000", help="Backend API base URL")
    parser.add_argument("--verbose", action="store_true", help="Print extra detail")
    args = parser.parse_args()
    run(args.api, args.verbose)


if __name__ == "__main__":
    main()
