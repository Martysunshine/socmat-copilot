#!/usr/bin/env python3
"""
Seed script — Operation: Midnight Blue demo.

Creates a demo case, uploads all demo-incident evidence files,
and runs every analysis module automatically.

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


def _ok(resp: requests.Response, label: str) -> dict:
    if not resp.ok:
        print(f"  FAIL [{resp.status_code}] {label}: {resp.text[:200]}")
        return {}
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
            json={"evidence_id": eid},
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
            json={"evidence_id": eid},
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
    if res:
        print(f"  Done — {res.get('findings_count', '?')} correlated findings")

    # ── MITRE mapping ────────────────────────────────────────────────────────
    print("\nRunning MITRE ATT&CK mapping …")
    r = session.post(f"{base}/cases/{case_id}/mitre/map")
    res = _ok(r, "mitre map")
    if res:
        print(f"  Done — {res.get('mappings_count', '?')} technique mappings")

    # ── generate report ──────────────────────────────────────────────────────
    print("\nGenerating incident report …")
    r = session.post(f"{base}/cases/{case_id}/report/generate")
    res = _ok(r, "report generate")
    if res:
        print(f"  Done — report saved")

    # ── summary ─────────────────────────────────────────────────────────────
    print(f"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 Demo case ready!

 Case ID  : {case_id}
 Case URL : http://localhost:5173/cases/{case_id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed the SOC Copilot demo case")
    parser.add_argument("--api", default="http://localhost:8000", help="Backend API base URL")
    parser.add_argument("--verbose", action="store_true", help="Print extra detail")
    args = parser.parse_args()
    run(args.api, args.verbose)


if __name__ == "__main__":
    main()
