#!/usr/bin/env python3
"""
Local release certification — SOC Copilot Workbench.

End-to-end validation of the complete local-first workflow.
Creates a fresh certification case, runs all modules, validates all
advanced features, generates a report, and writes a JSON result.

Exits 0 for CERTIFIED or CERTIFIED_WITH_WARNINGS, 1 for FAILED.

Output:
    reports/generated/local-certification-result.json

Usage:
    python scripts/certify_local_release.py
    BASE_URL=http://localhost:8000 python scripts/certify_local_release.py
"""

import json
import os
import sys
import traceback
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
DEMO_DIR = Path(__file__).resolve().parent.parent / "sample-data" / "demo-incident"
RESULTS_DIR = Path(__file__).resolve().parent.parent / "reports" / "generated"

PASS = "\033[92m✓\033[0m"
FAIL = "\033[91m✗\033[0m"
WARN = "\033[93m⚠\033[0m"
SKIP_SYM = "\033[93m–\033[0m"

checks: list[dict] = []


def record(name: str, result: str, detail: str = ""):
    """result: pass | fail | warning | skip"""
    sym = {"pass": PASS, "fail": FAIL, "warning": WARN, "skip": SKIP_SYM}.get(result, "?")
    suffix = f"  ({detail})" if detail else ""
    print(f"  [{sym}] {name}{suffix}")
    checks.append({"name": name, "result": result, "detail": detail})


def get(path, **kw): return requests.get(f"{BASE_URL}{path}", timeout=15, **kw)
def post(path, **kw): return requests.post(f"{BASE_URL}{path}", timeout=15, **kw)
def patch(path, **kw): return requests.patch(f"{BASE_URL}{path}", timeout=15, **kw)
def delete(path, **kw): return requests.delete(f"{BASE_URL}{path}", timeout=15, **kw)


def section(title):
    print(f"\n{'─' * 62}")
    print(f"  {title}")
    print(f"{'─' * 62}")


print("\n" + "=" * 62)
print("  SOC Copilot Workbench — Local Release Certification")
print("=" * 62)
print(f"  Backend: {BASE_URL}")
print(f"  Time:    {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")

# ── 1. Health ──────────────────────────────────────────────────────────────────

section("1. Backend Health")
try:
    r = get("/health")
    if r.status_code == 200 and r.json().get("status") == "ok":
        record("GET /health", "pass", r.json().get("version", ""))
    else:
        record("GET /health", "fail", f"status={r.status_code}")
        sys.exit(1)
except requests.ConnectionError:
    record("Backend reachable", "fail", f"Cannot connect to {BASE_URL}")
    sys.exit(1)

# ── 2. Case creation ────────────────────────────────────────────────────────────

section("2. Case Management")
r = post("/cases", json={
    "title": "CERT — Operation: Midnight Blue",
    "description": "Certification run — multi-stage compromise scenario.",
    "severity": "critical",
    "status": "investigating",
    "source": "windows_logs",
    "affected_host": "WORKSTATION-42",
    "affected_user": "jsmith",
    "affected_ip": "10.10.50.201",
})
if r.status_code == 201:
    case_id = r.json()["id"]
    record("Create certification case", "pass", f"id={case_id}")
else:
    record("Create case", "fail", str(r.status_code))
    sys.exit(1)

# ── 3. Evidence upload ─────────────────────────────────────────────────────────

section("3. Evidence Upload")
evidence_ids: dict[str, int] = {}
EVIDENCE_FILES = [
    ("windows-security.json", "application/json"),
    ("sysmon-events.json", "application/json"),
    ("suricata-alerts.json", "application/json"),
    ("zeek-conn.log", "text/plain"),
    ("zeek-dns.log", "text/plain"),
    ("zeek-http.log", "text/plain"),
    ("suspicious-payload.ps1.txt", "text/plain"),
]
uploaded = 0
for fname, mime in EVIDENCE_FILES:
    fp = DEMO_DIR / fname
    if not fp.exists():
        record(f"Upload {fname}", "skip", "demo file not found")
        continue
    with open(fp, "rb") as fh:
        r = requests.post(f"{BASE_URL}/cases/{case_id}/evidence",
                          files={"file": (fname, fh, mime)}, timeout=15)
    if r.ok:
        evidence_ids[fname] = r.json()["id"]
        uploaded += 1
    else:
        record(f"Upload {fname}", "fail", str(r.status_code))

record("Evidence files uploaded", "pass" if uploaded >= 5 else "warning",
       f"{uploaded}/{len(EVIDENCE_FILES)} files")

# ── 4. Windows/Sysmon analysis ─────────────────────────────────────────────────

section("4. Windows / Sysmon Analysis")
windows_ok = False
for fname in ("windows-security.json", "sysmon-events.json"):
    eid = evidence_ids.get(fname)
    if not eid:
        record(f"Windows analysis — {fname}", "skip", "evidence missing")
        continue
    r = post(f"/cases/{case_id}/analyze/windows-logs", params={"evidence_id": eid})
    if r.ok:
        res = r.json()
        record(f"Analyze {fname}", "pass",
               f"{res.get('events_count', '?')} events, {res.get('findings_count', '?')} findings")
        windows_ok = True
    else:
        record(f"Analyze {fname}", "fail", str(r.status_code))

# ── 5. Suricata ────────────────────────────────────────────────────────────────

section("5. Suricata Analysis")
eid = evidence_ids.get("suricata-alerts.json")
if eid:
    r = post(f"/cases/{case_id}/analyze/suricata", params={"evidence_id": eid})
    if r.ok:
        res = r.json()
        record("Suricata analysis", "pass",
               f"{res.get('alerts_count', '?')} alerts, {res.get('findings_count', '?')} findings")
    else:
        record("Suricata analysis", "fail", str(r.status_code))
else:
    record("Suricata analysis", "skip", "evidence missing")

# ── 6. Zeek ────────────────────────────────────────────────────────────────────

section("6. Zeek Analysis")
zeek_ok = False
for fname in ("zeek-conn.log", "zeek-dns.log", "zeek-http.log"):
    eid = evidence_ids.get(fname)
    if not eid:
        record(f"Zeek {fname}", "skip", "evidence missing")
        continue
    r = post(f"/cases/{case_id}/analyze/zeek", json={"evidence_id": eid})
    if r.ok:
        res = r.json()
        record(f"Zeek {fname}", "pass", f"{res.get('records_count', '?')} records")
        zeek_ok = True
    else:
        record(f"Zeek {fname}", "fail", str(r.status_code))

# ── 7. Sigma ───────────────────────────────────────────────────────────────────

section("7. Sigma Detection")
r = get("/sigma/rules")
rules = r.json() if r.ok else []
record("Load Sigma rules", "pass" if len(rules) > 0 else "warning",
       f"{len(rules)} rules loaded")

r = post(f"/cases/{case_id}/sigma/run")
if r.ok:
    res = r.json()
    record("Run Sigma detection", "pass", f"{res.get('findings_count', '?')} findings")
else:
    record("Run Sigma detection", "fail", str(r.status_code))

# ── 8. YARA ────────────────────────────────────────────────────────────────────

section("8. YARA Static Triage")
eid = evidence_ids.get("suspicious-payload.ps1.txt")
if eid:
    r = post(f"/cases/{case_id}/analyze/yara", json={"evidence_id": eid})
    if r.ok:
        res = r.json()
        record("YARA triage", "pass", f"{res.get('matches_count', '?')} rule matches")
    else:
        record("YARA triage", "warning", f"status={r.status_code} (yara-python may not be installed)")
else:
    record("YARA triage", "skip", "evidence missing")

# ── 9. PCAP ────────────────────────────────────────────────────────────────────

section("9. PCAP Analysis")
r = get(f"/cases/{case_id}/analyze/pcap")
if r.ok:
    record("PCAP endpoint reachable", "pass", f"{len(r.json())} existing results")
else:
    record("PCAP endpoint reachable", "fail", str(r.status_code))
record("PCAP file analysis", "skip", "no PCAP sample in demo-incident/ — manual test required")

# ── 10. Correlation ────────────────────────────────────────────────────────────

section("10. Investigation Correlation")
r = post(f"/cases/{case_id}/correlate")
if r.ok:
    count = len(r.json()) if isinstance(r.json(), list) else "?"
    record("Correlation engine", "pass", f"{count} correlated findings")
else:
    record("Correlation engine", "fail", str(r.status_code))

# ── 11. MITRE mapping ──────────────────────────────────────────────────────────

section("11. MITRE ATT&CK Mapping")
r = post(f"/cases/{case_id}/mitre/map")
if r.ok:
    count = len(r.json()) if isinstance(r.json(), list) else "?"
    record("MITRE mapping", "pass", f"{count} technique mappings")
else:
    record("MITRE mapping", "fail", str(r.status_code))

# ── 12. Playbooks ──────────────────────────────────────────────────────────────

section("12. Analyst Playbooks (Phase 26)")
r = get("/playbooks/templates")
templates = r.json() if r.ok else []
record("10 playbook templates loaded", "pass" if len(templates) == 10 else "fail",
       f"{len(templates)} templates")
if templates:
    r = post(f"/cases/{case_id}/playbooks", json={"template_id": templates[0]["id"]})
    if r.ok:
        pb = r.json()
        pb_id = pb["id"]
        record("Attach playbook", "pass", pb.get("name", ""))
        # mark first step
        if pb.get("steps"):
            sid = pb["steps"][0]["id"]
            r2 = requests.patch(
                f"{BASE_URL}/cases/{case_id}/playbooks/{pb_id}/steps/{sid}",
                json={"status": "done"}, timeout=10)
            record("Update step status", "pass" if r2.ok else "fail")
    else:
        record("Attach playbook", "fail", str(r.status_code))

# ── 13. Analyst notes ──────────────────────────────────────────────────────────

section("13. Analyst Notes (Phase 27)")
r = post(f"/cases/{case_id}/notes", json={
    "entity_type": "case", "entity_id": case_id,
    "note_type": "assessment",
    "content": "CERT: Confirmed multi-stage compromise via credential spray and encoded PowerShell.",
})
record("Create assessment note", "pass" if r.status_code == 201 else "fail")

# ── 14. IOC extraction ─────────────────────────────────────────────────────────

section("14. IOC Extraction (Phase 28)")
r = post(f"/cases/{case_id}/iocs/extract")
if r.ok:
    count = r.json().get("extracted_count", 0)
    record("IOC extraction", "pass", f"{count} IOCs extracted")
    r2 = get(f"/cases/{case_id}/iocs/export?format=csv")
    record("IOC CSV export", "pass" if r2.ok else "fail")
    r3 = get(f"/cases/{case_id}/iocs/export?format=json")
    record("IOC JSON export", "pass" if r3.ok else "fail")
else:
    record("IOC extraction", "fail", str(r.status_code))

# ── 15. Entity graph ───────────────────────────────────────────────────────────

section("15. Entity Graph (Phase 29)")
r = get(f"/cases/{case_id}/graph")
if r.ok:
    graph = r.json()
    node_count = len(graph.get("nodes", []))
    edge_count = len(graph.get("edges", []))
    record("Entity graph generated", "pass", f"{node_count} nodes, {edge_count} edges")
else:
    record("Entity graph", "fail", str(r.status_code))

# ── 16. Timeline replay ────────────────────────────────────────────────────────

section("16. Timeline Replay (Phase 30)")
r = get(f"/cases/{case_id}/timeline/replay")
if r.ok:
    events = r.json().get("events", [])
    record("Timeline replay endpoint", "pass", f"{len(events)} replay events")
else:
    record("Timeline replay", "fail", str(r.status_code))

# ── 17. Detection coverage ─────────────────────────────────────────────────────

section("17. Detection Coverage (Phase 31)")
r = get("/coverage/rules")
record("Coverage rule browser", "pass" if r.ok else "fail")
r = get(f"/cases/{case_id}/coverage")
record("Case coverage analysis", "pass" if r.ok else "fail")
r = get(f"/cases/{case_id}/telemetry-gaps")
if r.ok:
    gaps = r.json().get("gaps", [])
    record("Telemetry gaps", "pass", f"{len(gaps)} gap categories")
else:
    record("Telemetry gaps", "fail")

# ── 18. Finding dispositions ───────────────────────────────────────────────────

section("18. Finding Dispositions (Phase 32)")
r = post(f"/cases/{case_id}/dispositions", json={
    "finding_type": "sigma", "finding_id": "cert-test",
    "finding_title": "CERT Test Finding",
    "disposition": "true_positive",
    "confidence": "high",
    "reason": "Certification run verification",
    "analyst_name": "cert-bot",
})
record("Create disposition", "pass" if r.status_code == 201 else "fail")
r = get(f"/cases/{case_id}/dispositions")
record("List dispositions", "pass" if r.ok else "fail")

# ── 19. Report readiness ───────────────────────────────────────────────────────

section("19. Report Readiness (Phase 33)")
r = get(f"/cases/{case_id}/report/readiness")
if r.ok:
    rd = r.json()
    score = rd.get("total_score", 0)
    grade = rd.get("grade", "?")
    missing = len(rd.get("missing_checks", []))
    record("Report readiness score", "pass", f"{score:.0f}% {grade.upper()} ({missing} missing)")
else:
    record("Report readiness", "fail", str(r.status_code))

# ── 20. Markdown report ────────────────────────────────────────────────────────

section("20. Markdown Report Generation")
r = post(f"/cases/{case_id}/report/generate")
if r.ok:
    r2 = get(f"/cases/{case_id}/report/content")
    if r2.ok and len(r2.text) > 500:
        record("Generate Markdown report", "pass", f"{len(r2.text)} chars")
    else:
        record("Generate Markdown report", "warning", "report too short")
else:
    record("Generate Markdown report", "fail", str(r.status_code))

# ── 21. PDF export ─────────────────────────────────────────────────────────────

section("21. PDF Report Export")
r = get(f"/cases/{case_id}/report/pdf")
if r.ok and len(r.content) > 100:
    record("PDF report export", "pass", f"{len(r.content)} bytes")
elif r.status_code == 404:
    record("PDF report export", "warning", "no report generated yet — generate first")
else:
    record("PDF report export", "warning", f"status={r.status_code}")

# ── 22. AI mock summary ────────────────────────────────────────────────────────

section("22. AI Assistant (mock)")
r = post(f"/cases/{case_id}/ai/summarize")
if r.ok and r.json().get("content"):
    record("AI mock summarize", "pass")
else:
    record("AI mock summarize", "fail", str(r.status_code))

r = post(f"/cases/{case_id}/ai/recommend")
record("AI mock recommend", "pass" if r.ok else "fail")

# ── 23. MCP tools ──────────────────────────────────────────────────────────────

section("23. MCP Tool Server")
r = get("/mcp/tools")
if r.ok and len(r.json()) > 0:
    record("MCP tools listed", "pass", f"{len(r.json())} tools")
else:
    record("MCP tools", "fail" if not r.ok else "warning", "no tools registered")

# ── 24. Splunk / Elastic templates ────────────────────────────────────────────

section("24. Splunk / Elastic Export Endpoints")
r = get("/splunk/query-templates")
record("Splunk templates", "pass" if r.ok and len(r.json()) > 0 else "fail")
r = get("/elastic/hunt-templates")
record("Elastic hunt templates", "pass" if r.ok and len(r.json()) > 0 else "fail")
r = get("/splunk/live/status")
record("Live Splunk status", "pass" if r.ok else "fail")
r = get("/elastic/live/status")
record("Live Elastic status", "pass" if r.ok else "fail")

# ── 25. Cleanup ────────────────────────────────────────────────────────────────

section("25. Cleanup")
r = delete(f"/cases/{case_id}")
record("Delete certification case", "pass" if r.status_code == 204 else "warning")

# ── Evaluate result ────────────────────────────────────────────────────────────

passes = sum(1 for c in checks if c["result"] == "pass")
warnings = sum(1 for c in checks if c["result"] == "warning")
skips = sum(1 for c in checks if c["result"] == "skip")
failures = sum(1 for c in checks if c["result"] == "fail")
total = len(checks)

if failures == 0 and warnings == 0:
    final_result = "CERTIFIED"
elif failures == 0:
    final_result = "CERTIFIED_WITH_WARNINGS"
else:
    final_result = "FAILED"

# ── Write JSON certification result ───────────────────────────────────────────

RESULTS_DIR.mkdir(parents=True, exist_ok=True)
result_path = RESULTS_DIR / "local-certification-result.json"
cert_data = {
    "result": final_result,
    "timestamp": datetime.now(timezone.utc).isoformat(),
    "backend_url": BASE_URL,
    "summary": {
        "total": total,
        "pass": passes,
        "warning": warnings,
        "skip": skips,
        "fail": failures,
    },
    "checks": checks,
}
result_path.write_text(json.dumps(cert_data, indent=2))

# ── Print final report ─────────────────────────────────────────────────────────

color = {"CERTIFIED": "\033[92m", "CERTIFIED_WITH_WARNINGS": "\033[93m", "FAILED": "\033[91m"}
reset = "\033[0m"

print(f"\n{'═' * 62}")
print(f"  {color[final_result]}{final_result}{reset}")
print(f"  {passes}/{total} checks passed  |  {warnings} warnings  |  {skips} skipped  |  {failures} failed")
print(f"  Result saved: {result_path}")

if failures:
    print(f"\n  FAILURES:")
    for c in checks:
        if c["result"] == "fail":
            suffix = f"  [{c['detail']}]" if c["detail"] else ""
            print(f"    ✗ {c['name']}{suffix}")

if warnings:
    print(f"\n  WARNINGS:")
    for c in checks:
        if c["result"] == "warning":
            suffix = f"  [{c['detail']}]" if c["detail"] else ""
            print(f"    ⚠ {c['name']}{suffix}")

print(f"{'═' * 62}\n")

sys.exit(0 if final_result != "FAILED" else 1)
