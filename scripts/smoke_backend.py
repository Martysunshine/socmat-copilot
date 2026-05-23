#!/usr/bin/env python3
"""
Backend smoke test — SOC Copilot Workbench.

Tests every major endpoint category against a running backend.
Exits non-zero on any FAIL. Safe to run against a fresh (empty) backend.

Usage:
    python scripts/smoke_backend.py
    BASE_URL=http://localhost:8000 python scripts/smoke_backend.py
"""

import json
import os
import sys
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' not installed. Run: pip install requests")
    sys.exit(1)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")

PASS = "\033[92mPASS\033[0m"
FAIL = "\033[91mFAIL\033[0m"
SKIP = "\033[93mSKIP\033[0m"

results: list[tuple[str, bool, str]] = []


def check(label: str, ok: bool, detail: str = "") -> bool:
    tag = PASS if ok else FAIL
    suffix = f"  ({detail})" if detail else ""
    print(f"  [{tag}] {label}{suffix}")
    results.append((label, ok, detail))
    return ok


def get(path: str, **kwargs):
    return requests.get(f"{BASE_URL}{path}", timeout=10, **kwargs)


def post(path: str, **kwargs):
    return requests.post(f"{BASE_URL}{path}", timeout=10, **kwargs)


def patch(path: str, **kwargs):
    return requests.patch(f"{BASE_URL}{path}", timeout=10, **kwargs)


def delete(path: str, **kwargs):
    return requests.delete(f"{BASE_URL}{path}", timeout=10, **kwargs)


# ── helpers ──────────────────────────────────────────────────────────────────

def section(title: str):
    print(f"\n{'─' * 55}")
    print(f"  {title}")
    print(f"{'─' * 55}")


# ── 1. health ─────────────────────────────────────────────────────────────────

section("1. Health")
try:
    r = get("/health")
    check("GET /health returns 200", r.status_code == 200)
    data = r.json()
    check("health.status == 'ok'", data.get("status") == "ok", str(data))
except requests.ConnectionError:
    print(f"  [{FAIL}] Cannot connect to {BASE_URL}")
    print("  Start the backend first: uvicorn main:app --reload")
    sys.exit(1)

# ── 2. cases ──────────────────────────────────────────────────────────────────

section("2. Case Management")
r = get("/cases")
check("GET /cases returns 200", r.status_code == 200)
check("GET /cases returns list", isinstance(r.json(), list))

r = post("/cases", json={
    "title": "Smoke Test Case",
    "severity": "low",
    "status": "open",
    "source": "manual",
})
check("POST /cases returns 201", r.status_code == 201)
case = r.json()
case_id = case.get("id")
check("POST /cases returns id", isinstance(case_id, int))

r = get(f"/cases/{case_id}")
check("GET /cases/{id} returns 200", r.status_code == 200)
check("GET /cases/{id} returns correct id", r.json().get("id") == case_id)

r = patch(f"/cases/{case_id}", json={"severity": "medium"})
check("PATCH /cases/{id} returns 200", r.status_code == 200)
check("PATCH /cases/{id} updates severity", r.json().get("severity") == "medium")

# ── 3. dashboard ──────────────────────────────────────────────────────────────

section("3. Dashboard")
r = get("/dashboard/summary")
check("GET /dashboard/summary returns 200", r.status_code == 200)
data = r.json()
check("dashboard has total_cases", "total_cases" in data)

# ── 4. evidence ───────────────────────────────────────────────────────────────

section("4. Evidence Upload")
r = get(f"/cases/{case_id}/evidence")
check("GET /cases/{id}/evidence returns 200", r.status_code == 200)
check("evidence list is empty for new case", r.json() == [])

# Upload a small safe text file
sample = Path(__file__).resolve().parent.parent / "sample-data" / "demo-incident" / "suspicious-payload.ps1.txt"
if sample.exists():
    with open(sample, "rb") as fh:
        r = requests.post(
            f"{BASE_URL}/cases/{case_id}/evidence",
            files={"file": (sample.name, fh, "text/plain")},
            timeout=15,
        )
    check("POST /cases/{id}/evidence returns 201", r.status_code == 201)
    ev = r.json()
    ev_id = ev.get("id")
    check("evidence has sha256", bool(ev.get("sha256")))
else:
    print(f"  [{SKIP}] sample file not found — skipping evidence upload")
    ev_id = None

# ── 5. timeline ───────────────────────────────────────────────────────────────

section("5. Timeline")
r = get(f"/cases/{case_id}/timeline")
check("GET /cases/{id}/timeline returns 200", r.status_code == 200)
r = post(f"/cases/{case_id}/timeline", json={
    "timestamp": "2024-01-01T00:00:00Z",
    "event_type": "manual",
    "title": "Test event",
    "description": "Smoke test",
    "severity": "low",
})
check("POST /cases/{id}/timeline returns 201", r.status_code == 201)

r = get(f"/cases/{case_id}/timeline/replay")
check("GET /cases/{id}/timeline/replay returns 200", r.status_code == 200)

# ── 6. sigma ──────────────────────────────────────────────────────────────────

section("6. Sigma Rules")
r = get("/sigma/rules")
check("GET /sigma/rules returns 200", r.status_code == 200)
rules = r.json()
check("sigma rules list is non-empty", len(rules) > 0, f"{len(rules)} rules")

r = post(f"/cases/{case_id}/sigma/run")
check("POST /cases/{id}/sigma/run returns 200", r.status_code == 200)

# ── 7. yara ───────────────────────────────────────────────────────────────────

section("7. YARA Rules")
r = get("/yara/rules")
check("GET /yara/rules returns 200", r.status_code == 200)

if ev_id:
    r = post(f"/cases/{case_id}/analyze/yara", json={"evidence_id": ev_id})
    check("POST /cases/{id}/analyze/yara returns 200", r.status_code == 200)
else:
    print(f"  [{SKIP}] No evidence — skipping YARA triage")

# ── 8. correlation ────────────────────────────────────────────────────────────

section("8. Correlation Engine")
r = post(f"/cases/{case_id}/correlate")
check("POST /cases/{id}/correlate returns 200", r.status_code == 200)

r = get(f"/cases/{case_id}/correlate")
check("GET /cases/{id}/correlate returns 200", r.status_code == 200)

# ── 9. mitre ──────────────────────────────────────────────────────────────────

section("9. MITRE ATT&CK")
r = get("/mitre/mappings")
check("GET /mitre/mappings returns 200", r.status_code == 200)

r = post(f"/cases/{case_id}/mitre/map")
check("POST /cases/{id}/mitre/map returns 200", r.status_code == 200)

# ── 10. report ────────────────────────────────────────────────────────────────

section("10. Report Generation")
r = post(f"/cases/{case_id}/report/generate")
check("POST /cases/{id}/report/generate returns 200", r.status_code == 200)

r = get(f"/cases/{case_id}/report")
check("GET /cases/{id}/report returns 200", r.status_code == 200)
check("report is non-null", r.json() is not None)

r = get(f"/cases/{case_id}/report/content")
check("GET /cases/{id}/report/content returns 200", r.status_code == 200)
check("report content is non-empty", len(r.text) > 100)

r = get(f"/cases/{case_id}/report/readiness")
check("GET /cases/{id}/report/readiness returns 200", r.status_code == 200)
readiness = r.json()
check("readiness has total_score", "total_score" in readiness)
check("readiness has grade", readiness.get("grade") in ("poor", "fair", "good", "excellent"))

# ── 11. ai assistant ──────────────────────────────────────────────────────────

section("11. AI Assistant (mock)")
r = post(f"/cases/{case_id}/ai/summarize")
check("POST /cases/{id}/ai/summarize returns 200", r.status_code == 200)
check("AI response has content", bool(r.json().get("content")))

r = post(f"/cases/{case_id}/ai/recommend")
check("POST /cases/{id}/ai/recommend returns 200", r.status_code == 200)

# ── 12. mcp ───────────────────────────────────────────────────────────────────

section("12. MCP Tools")
r = get("/mcp/tools")
check("GET /mcp/tools returns 200", r.status_code == 200)
tools = r.json()
check("mcp tools list is non-empty", len(tools) > 0, f"{len(tools)} tools")

# ── 13. playbooks ─────────────────────────────────────────────────────────────

section("13. Analyst Playbooks")
r = get("/playbooks/templates")
check("GET /playbooks/templates returns 200", r.status_code == 200)
templates = r.json()
check("10 playbook templates loaded", len(templates) == 10, f"{len(templates)} templates")

if templates:
    tmpl_id = templates[0]["id"]
    r = get(f"/playbooks/templates/{tmpl_id}")
    check("GET /playbooks/templates/{id} returns 200", r.status_code == 200)
    check("template has steps", len(r.json().get("steps", [])) > 0)

    r = post(f"/cases/{case_id}/playbooks", json={"template_id": tmpl_id})
    check("POST /cases/{id}/playbooks returns 200", r.status_code in (200, 201))
    pb = r.json()
    pb_id = pb.get("id")

    r = get(f"/cases/{case_id}/playbooks")
    check("GET /cases/{id}/playbooks returns 200", r.status_code == 200)
    data = r.json()
    check("playbooks list is non-empty", len(data.get("playbooks", [])) > 0)

    if pb_id and pb.get("steps"):
        step_id = pb["steps"][0]["id"]
        r = requests.patch(
            f"{BASE_URL}/cases/{case_id}/playbooks/{pb_id}/steps/{step_id}",
            json={"status": "done"},
            timeout=10,
        )
        check("PATCH step status to done returns 200", r.status_code == 200)
        check("step status updated", r.json().get("status") == "done")

# ── 14. analyst notes ─────────────────────────────────────────────────────────

section("14. Analyst Notes")
r = post(f"/cases/{case_id}/notes", json={
    "entity_type": "case",
    "entity_id": case_id,
    "note_type": "observation",
    "content": "Smoke test observation note",
})
check("POST /cases/{id}/notes returns 201", r.status_code == 201)
note = r.json()
note_id = note.get("id")

r = get(f"/cases/{case_id}/notes")
check("GET /cases/{id}/notes returns 200", r.status_code == 200)
check("notes list non-empty", len(r.json()) > 0)

if note_id:
    r = patch(f"/cases/{case_id}/notes/{note_id}", json={"content": "Updated note"})
    check("PATCH /notes/{id} returns 200", r.status_code == 200)

# ── 15. IOC basket ────────────────────────────────────────────────────────────

section("15. IOC Basket")
r = post(f"/cases/{case_id}/iocs/extract")
check("POST /cases/{id}/iocs/extract returns 200", r.status_code == 200)

r = get(f"/cases/{case_id}/iocs")
check("GET /cases/{id}/iocs returns 200", r.status_code == 200)
check("iocs list returned", isinstance(r.json(), list))

r = get(f"/cases/{case_id}/iocs/export?format=csv")
check("GET /cases/{id}/iocs/export?format=csv returns 200", r.status_code == 200)

r = get(f"/cases/{case_id}/iocs/export?format=json")
check("GET /cases/{id}/iocs/export?format=json returns 200", r.status_code == 200)

# ── 16. entity graph ──────────────────────────────────────────────────────────

section("16. Entity Graph")
r = get(f"/cases/{case_id}/graph")
check("GET /cases/{id}/graph returns 200", r.status_code == 200)
graph = r.json()
check("graph has nodes key", "nodes" in graph)
check("graph has edges key", "edges" in graph)

# ── 17. coverage ──────────────────────────────────────────────────────────────

section("17. Detection Coverage")
r = get("/coverage/rules")
check("GET /coverage/rules returns 200", r.status_code == 200)

r = get(f"/cases/{case_id}/coverage")
check("GET /cases/{id}/coverage returns 200", r.status_code == 200)

r = get(f"/cases/{case_id}/telemetry-gaps")
check("GET /cases/{id}/telemetry-gaps returns 200", r.status_code == 200)
gaps = r.json()
check("telemetry gaps returned", "gaps" in gaps)

# ── 18. dispositions ─────────────────────────────────────────────────────────

section("18. Finding Dispositions")
r = post(f"/cases/{case_id}/dispositions", json={
    "finding_type": "manual",
    "finding_id": "smoke-1",
    "finding_title": "Smoke test finding",
    "disposition": "needs_review",
    "confidence": "medium",
    "reason": "Smoke test",
    "analyst_name": "smoke-tester",
})
check("POST /cases/{id}/dispositions returns 201", r.status_code == 201)
disp = r.json()
disp_id = disp.get("id")

r = get(f"/cases/{case_id}/dispositions")
check("GET /cases/{id}/dispositions returns 200", r.status_code == 200)

if disp_id:
    r = patch(f"/cases/{case_id}/dispositions/{disp_id}", json={"disposition": "false_positive"})
    check("PATCH disposition returns 200", r.status_code == 200)

# ── 19. splunk & elastic export ───────────────────────────────────────────────

section("19. Splunk / Elastic Export Endpoints")
r = get("/splunk/query-templates")
check("GET /splunk/query-templates returns 200", r.status_code == 200)
check("splunk templates non-empty", len(r.json()) > 0)

r = get("/elastic/hunt-templates")
check("GET /elastic/hunt-templates returns 200", r.status_code == 200)
check("elastic templates non-empty", len(r.json()) > 0)

# ── 20. live connector status ─────────────────────────────────────────────────

section("20. Live Connector Status (no credentials)")
r = get("/splunk/live/status")
check("GET /splunk/live/status returns 200", r.status_code == 200)
check("splunk status is unconfigured", r.json().get("status") in ("unconfigured", "error", "connected"))

r = get("/elastic/live/status")
check("GET /elastic/live/status returns 200", r.status_code == 200)
check("elastic status is unconfigured", r.json().get("status") in ("unconfigured", "error", "connected"))

# ── 21. rule authoring ────────────────────────────────────────────────────────

section("21. Rule Authoring Assistant")
r = get("/rules/author/event-types")
check("GET /rules/author/event-types returns 200", r.status_code == 200)
check("event types non-empty", len(r.json()) > 0)

r = post("/rules/author", json={
    "description": "Detect PowerShell with encoded command",
    "rule_format": "sigma",
})
check("POST /rules/author returns 200", r.status_code == 200)
check("draft has sigma_yaml", bool(r.json().get("sigma_yaml")))

# ── 22. cleanup ───────────────────────────────────────────────────────────────

section("22. Cleanup")
r = delete(f"/cases/{case_id}")
check("DELETE /cases/{id} returns 204", r.status_code == 204)

# ── summary ───────────────────────────────────────────────────────────────────

total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
failed = total - passed

print(f"\n{'═' * 55}")
print(f"  SMOKE TEST SUMMARY: {passed}/{total} passed")
if failed:
    print(f"\n  FAILED ({failed}):")
    for label, ok, detail in results:
        if not ok:
            suffix = f"  [{detail}]" if detail else ""
            print(f"    ✗ {label}{suffix}")
print(f"{'═' * 55}\n")

sys.exit(0 if failed == 0 else 1)
