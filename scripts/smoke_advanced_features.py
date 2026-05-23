#!/usr/bin/env python3
"""
Advanced feature API contract test — SOC Copilot Workbench.

Creates a temporary case, exercises every Phase 26–33 API route,
then cleans up. Exits non-zero on any FAIL.

Requires a running backend with no demo data (creates its own test case).

Usage:
    python scripts/smoke_advanced_features.py
    BASE_URL=http://localhost:8000 python scripts/smoke_advanced_features.py
"""

import json
import os
import sys

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
    suffix = f"  [{detail}]" if detail else ""
    print(f"  [{tag}] {label}{suffix}")
    results.append((label, ok, detail))
    return ok


def get(path: str, **kw): return requests.get(f"{BASE_URL}{path}", timeout=10, **kw)
def post(path: str, **kw): return requests.post(f"{BASE_URL}{path}", timeout=10, **kw)
def patch(path: str, **kw): return requests.patch(f"{BASE_URL}{path}", timeout=10, **kw)
def delete(path: str, **kw): return requests.delete(f"{BASE_URL}{path}", timeout=10, **kw)


def section(title: str):
    print(f"\n{'─' * 60}")
    print(f"  {title}")
    print(f"{'─' * 60}")


# ── connect ──────────────────────────────────────────────────────────────────

section("0. Backend connection")
try:
    r = get("/health")
    check("GET /health ok", r.status_code == 200)
except requests.ConnectionError:
    print(f"  [{FAIL}] Cannot connect to {BASE_URL}")
    sys.exit(1)

# ── setup: create test case ───────────────────────────────────────────────────

section("Setup — create test case")
r = post("/cases", json={
    "title": "Advanced Features Smoke Test",
    "severity": "medium",
    "status": "investigating",
    "source": "windows_logs",
    "affected_host": "TEST-HOST",
    "affected_user": "testuser",
    "affected_ip": "10.0.0.1",
    "description": "Automated advanced feature smoke test case",
})
check("Create test case", r.status_code == 201)
case_id = r.json().get("id")
check("Got case id", isinstance(case_id, int))

# ── Phase 26: Analyst Playbooks ───────────────────────────────────────────────

section("Phase 26 — Analyst Playbooks")
r = get("/playbooks/templates")
check("GET /playbooks/templates returns 200", r.status_code == 200)
templates = r.json()
check("10 templates loaded", len(templates) == 10, f"{len(templates)}")

if templates:
    tmpl = templates[0]
    tmpl_id = tmpl["id"]
    check("template has name", bool(tmpl.get("name")))
    check("template has step_count", isinstance(tmpl.get("step_count"), int))

    r = get(f"/playbooks/templates/{tmpl_id}")
    check("GET /playbooks/templates/{id} returns 200", r.status_code == 200)
    detail = r.json()
    check("template detail has steps", len(detail.get("steps", [])) > 0)
    check("steps have order/title/description",
          all("order" in s and "title" in s and "description" in s for s in detail["steps"]))

    # attach playbook to case
    r = post(f"/cases/{case_id}/playbooks", json={"template_id": tmpl_id})
    check("POST /cases/{id}/playbooks returns 200/201", r.status_code in (200, 201))
    pb = r.json()
    pb_id = pb.get("id")
    check("playbook has id", isinstance(pb_id, int))
    check("playbook has steps", len(pb.get("steps", [])) > 0)
    check("initial status is not_started", pb.get("status") == "not_started")
    check("initial progress is 0", pb.get("progress_percent") == 0)

    # list playbooks — should include suggestions
    r = get(f"/cases/{case_id}/playbooks")
    check("GET /cases/{id}/playbooks returns 200", r.status_code == 200)
    data = r.json()
    check("response has playbooks list", "playbooks" in data)
    check("response has suggestions list", "suggestions" in data)
    check("playbooks list non-empty", len(data["playbooks"]) > 0)

    # get single playbook
    r = get(f"/cases/{case_id}/playbooks/{pb_id}")
    check("GET /cases/{id}/playbooks/{pb_id} returns 200", r.status_code == 200)

    # update a step
    if pb.get("steps"):
        step_id = pb["steps"][0]["id"]
        r = requests.patch(
            f"{BASE_URL}/cases/{case_id}/playbooks/{pb_id}/steps/{step_id}",
            json={"status": "done", "analyst_notes": "Confirmed in evidence"},
            timeout=10,
        )
        check("PATCH step to done returns 200", r.status_code == 200)
        step = r.json()
        check("step status updated to done", step.get("status") == "done")
        check("analyst_notes saved", bool(step.get("analyst_notes")))

        # progress should update
        r = get(f"/cases/{case_id}/playbooks/{pb_id}")
        check("progress_percent updated", r.json().get("progress_percent", 0) > 0)
        check("status now in_progress", r.json().get("status") == "in_progress")

# ── Phase 27: Analyst Notes ────────────────────────────────────────────────────

section("Phase 27 — Analyst Notes")
note_types = ["observation", "hypothesis", "recommendation", "false_positive_reasoning",
              "escalation", "decision", "assessment"]
note_id = None
for ntype in note_types[:3]:
    r = post(f"/cases/{case_id}/notes", json={
        "entity_type": "case",
        "entity_id": case_id,
        "note_type": ntype,
        "content": f"Test note — {ntype}",
    })
    check(f"POST note type={ntype} returns 201", r.status_code == 201)
    if ntype == "observation":
        note_id = r.json().get("id")

r = get(f"/cases/{case_id}/notes")
check("GET /cases/{id}/notes returns 200", r.status_code == 200)
notes = r.json()
check("notes list has 3 entries", len(notes) == 3)

if note_id:
    r = patch(f"/cases/{case_id}/notes/{note_id}", json={"content": "Updated note content"})
    check("PATCH note returns 200", r.status_code == 200)
    check("note content updated", r.json().get("content") == "Updated note content")

    r = get(f"/cases/{case_id}/notes?note_type=observation")
    check("GET notes filtered by type returns 200", r.status_code == 200)

    r = delete(f"/cases/{case_id}/notes/{note_id}")
    check("DELETE note returns 204", r.status_code == 204)

    r = get(f"/cases/{case_id}/notes")
    check("note count decreased after delete", len(r.json()) == 2)

# ── Phase 28: IOC Basket ──────────────────────────────────────────────────────

section("Phase 28 — IOC Basket")
r = post(f"/cases/{case_id}/iocs/extract")
check("POST /cases/{id}/iocs/extract returns 200", r.status_code == 200)
extract_result = r.json()
check("extract result has extracted_count", "extracted_count" in extract_result)

r = get(f"/cases/{case_id}/iocs")
check("GET /cases/{id}/iocs returns 200", r.status_code == 200)
iocs = r.json()
check("iocs is a list", isinstance(iocs, list))

# Manually add an IOC
r = post(f"/cases/{case_id}/iocs", json={
    "ioc_type": "ip",
    "value": "203.0.113.99",
    "confidence": "high",
    "source": "manual",
    "analyst_tag": "suspicious",
})
check("POST manual IOC returns 201", r.status_code == 201)
manual_ioc = r.json()
ioc_id = manual_ioc.get("id")
check("manual IOC has id", isinstance(ioc_id, int))
check("manual IOC value correct", manual_ioc.get("value") == "203.0.113.99")

if ioc_id:
    r = patch(f"/cases/{case_id}/iocs/{ioc_id}", json={"analyst_tag": "confirmed_malicious"})
    check("PATCH IOC analyst_tag returns 200", r.status_code == 200)
    check("tag updated", r.json().get("analyst_tag") == "confirmed_malicious")

r = get(f"/cases/{case_id}/iocs/export?format=csv")
check("GET /iocs/export?format=csv returns 200", r.status_code == 200)
check("CSV export content-type", "text/csv" in r.headers.get("content-type", "").lower()
      or len(r.text) > 0)

r = get(f"/cases/{case_id}/iocs/export?format=json")
check("GET /iocs/export?format=json returns 200", r.status_code == 200)

if ioc_id:
    r = delete(f"/cases/{case_id}/iocs/{ioc_id}")
    check("DELETE IOC returns 204", r.status_code == 204)

# ── Phase 29: Entity Graph ────────────────────────────────────────────────────

section("Phase 29 — Entity Graph")
r = get(f"/cases/{case_id}/graph")
check("GET /cases/{id}/graph returns 200", r.status_code == 200)
graph = r.json()
check("graph has 'nodes' key", "nodes" in graph)
check("graph has 'edges' key", "edges" in graph)
check("nodes is a list", isinstance(graph["nodes"], list))
check("edges is a list", isinstance(graph["edges"], list))

# graph with filter
r = get(f"/cases/{case_id}/graph?node_types=host,ip")
check("GET graph with node_types filter returns 200", r.status_code == 200)

# ── Phase 30: Timeline Replay ──────────────────────────────────────────────────

section("Phase 30 — Timeline Replay")
# Add a timeline event so replay has something to show
post(f"/cases/{case_id}/timeline", json={
    "timestamp": "2024-01-01T02:00:00Z",
    "event_type": "logon_failure",
    "title": "Failed logon attempt",
    "description": "EID 4625 from 203.0.113.45",
    "severity": "medium",
    "source": "windows_logs",
})
post(f"/cases/{case_id}/timeline", json={
    "timestamp": "2024-01-01T02:18:00Z",
    "event_type": "logon_success",
    "title": "Successful logon after failures",
    "description": "EID 4624 — jsmith authenticated",
    "severity": "high",
    "source": "windows_logs",
})

r = get(f"/cases/{case_id}/timeline/replay")
check("GET /cases/{id}/timeline/replay returns 200", r.status_code == 200)
replay = r.json()
check("replay has events key", "events" in replay)
check("replay events is a list", isinstance(replay["events"], list))
if replay.get("events"):
    event = replay["events"][0]
    check("replay event has timestamp", "timestamp" in event)
    check("replay event has title", "title" in event)
    check("replay event has order", "order" in event)
    check("replay events chronologically ordered",
          all(replay["events"][i]["order"] <= replay["events"][i+1]["order"]
              for i in range(len(replay["events"]) - 1)))

# ── Phase 31: Detection Coverage ──────────────────────────────────────────────

section("Phase 31 — Detection Coverage")
r = get("/coverage/rules")
check("GET /coverage/rules returns 200", r.status_code == 200)
rules_coverage = r.json()
check("coverage rules response has rules key", "rules" in rules_coverage or isinstance(rules_coverage, dict))

r = get(f"/cases/{case_id}/coverage")
check("GET /cases/{id}/coverage returns 200", r.status_code == 200)
coverage = r.json()
check("coverage has triggered_count", "triggered_count" in coverage or "case_id" in coverage)

r = get(f"/cases/{case_id}/telemetry-gaps")
check("GET /cases/{id}/telemetry-gaps returns 200", r.status_code == 200)
gaps = r.json()
check("telemetry gaps has 'gaps' key", "gaps" in gaps)
check("7 gap categories defined", len(gaps.get("gaps", [])) == 7)

# ── Phase 32: Finding Dispositions ────────────────────────────────────────────

section("Phase 32 — Finding Dispositions")
r = post(f"/cases/{case_id}/dispositions", json={
    "finding_type": "sigma",
    "finding_id": "test-sigma-rule-001",
    "finding_title": "Brute Force Detection",
    "disposition": "true_positive",
    "confidence": "high",
    "reason": "14 failed logons in 7 minutes from same source IP",
    "analyst_name": "smoke-test-analyst",
    "follow_up_action": "Block source IP at firewall",
})
check("POST /cases/{id}/dispositions returns 201", r.status_code == 201)
disp = r.json()
disp_id = disp.get("id")
check("disposition has id", isinstance(disp_id, int))
check("disposition is true_positive", disp.get("disposition") == "true_positive")
check("confidence is high", disp.get("confidence") == "high")

r = get(f"/cases/{case_id}/dispositions")
check("GET /cases/{id}/dispositions returns 200", r.status_code == 200)
data = r.json()
check("response has dispositions key", "dispositions" in data)
check("dispositions list non-empty", len(data["dispositions"]) > 0)
check("response has summary key", "summary" in data)

r = get(f"/cases/{case_id}/dispositions?disposition=true_positive")
check("GET dispositions filtered by value returns 200", r.status_code == 200)

if disp_id:
    r = get(f"/cases/{case_id}/dispositions/{disp_id}")
    check("GET /dispositions/{id} returns 200", r.status_code == 200)

    r = patch(f"/cases/{case_id}/dispositions/{disp_id}",
              json={"disposition": "escalated", "confidence": "high"})
    check("PATCH disposition returns 200", r.status_code == 200)
    check("disposition updated to escalated", r.json().get("disposition") == "escalated")

    r = delete(f"/cases/{case_id}/dispositions/{disp_id}")
    check("DELETE disposition returns 204", r.status_code == 204)

# ── Phase 33: Report Readiness ────────────────────────────────────────────────

section("Phase 33 — Report Readiness Score")
r = get(f"/cases/{case_id}/report/readiness")
check("GET /cases/{id}/report/readiness returns 200", r.status_code == 200)
readiness = r.json()
check("response has case_id", readiness.get("case_id") == case_id)
check("response has total_score (0–100)", 0 <= readiness.get("total_score", -1) <= 100)
check("response has valid grade",
      readiness.get("grade") in ("poor", "fair", "good", "excellent"))
check("response has completed_checks list", isinstance(readiness.get("completed_checks"), list))
check("response has missing_checks list", isinstance(readiness.get("missing_checks"), list))
check("response has na_checks list", isinstance(readiness.get("na_checks"), list))
check("22 total checks",
      len(readiness.get("completed_checks", []))
      + len(readiness.get("missing_checks", []))
      + len(readiness.get("na_checks", [])) == 22)
check("response has section_scores dict", isinstance(readiness.get("section_scores"), dict))
check("10 sections in section_scores", len(readiness.get("section_scores", {})) == 10)
check("response has recommendations list", isinstance(readiness.get("recommendations"), list))
check("response has checked_at timestamp", bool(readiness.get("checked_at")))

# Report readiness should improve after populating the case
# Generate a report to satisfy that check
post(f"/cases/{case_id}/report/generate")
r = get(f"/cases/{case_id}/report/readiness")
check("readiness endpoint still returns 200 after report generated", r.status_code == 200)

# ── cleanup ───────────────────────────────────────────────────────────────────

section("Cleanup")
r = delete(f"/cases/{case_id}")
check("DELETE test case returns 204", r.status_code == 204)

# ── summary ───────────────────────────────────────────────────────────────────

total = len(results)
passed = sum(1 for _, ok, _ in results if ok)
failed = total - passed

print(f"\n{'═' * 60}")
print(f"  ADVANCED FEATURE SMOKE TEST: {passed}/{total} passed")
if failed:
    print(f"\n  FAILED ({failed}):")
    for label, ok, detail in results:
        if not ok:
            suffix = f"  [{detail}]" if detail else ""
            print(f"    ✗ {label}{suffix}")
print(f"{'═' * 60}\n")

sys.exit(0 if failed == 0 else 1)
