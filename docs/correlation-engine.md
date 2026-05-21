# Investigation Correlation Engine

## Overview

SOC Copilot Workbench Phase 10 adds a deterministic correlation engine that connects signals from
multiple analysis modules inside a single investigation case.

Correlation runs on demand — the analyst clicks **Run Correlation** on the case detail page.
Results are stored and shown as explainable investigation cards with recommended next steps.

> **No AI involved.** All correlation is rule-based and deterministic. Every finding includes
> the exact data sources it was derived from.

---

## Data Sources

The engine reads from five tables for the case:

| Table | Source module |
|-------|---------------|
| `normalized_events` | Windows/Sysmon log parser, Suricata alert parser |
| `malware_triage_results` | YARA static triage |
| `network_analysis_results` | Zeek network log analysis |
| `detection_findings` | Sigma rule matching |
| `evidence` | Uploaded files |

---

## Correlation Patterns

Six deterministic patterns are evaluated on every run.

### 1. Brute Force → Successful Authentication

**Data:** `normalized_events` (Windows logs)

| Condition | Action |
|-----------|--------|
| ≥ 3 failed logon events (EID 4625/4776/4771) on the same host | Check for successful logon (4624/4648) from that host |
| Both conditions met | Emit finding |
| ≥ 5 failed logons | Confidence = `high`; otherwise `medium` |

Also flags if process execution (EID 4688/Sysmon 1) follows on the same host.

**Severity:** High

---

### 2. Script Interpreter Execution → Suspicious Network

**Data:** `normalized_events` + `network_analysis_results`

| Condition | Action |
|-----------|--------|
| Case has events where `process_name` matches a scripting interpreter | Check for network results with `risk_score > 0` |
| Both present | Emit finding |
| Same host appears in both | Confidence = `high`; otherwise `medium` |

Scripting processes detected: `powershell`, `cmd`, `wscript`, `cscript`, `mshta`, `regsvr32`, `rundll32`, `bitsadmin`.

**Severity:** High

---

### 3. YARA Hit → Process Execution

**Data:** `malware_triage_results` + `normalized_events`

| Condition | Action |
|-----------|--------|
| YARA result with `risk_score > 0` and non-empty `yara_matches` | Check for process execution events |
| Both present | Emit finding |

Entities include truncated SHA-256 hashes and matched YARA rule names.

**Severity:** High | **Confidence:** Medium

---

### 4. IDS Alert → Zeek Network Activity

**Data:** `normalized_events` (source = `suricata`) + `network_analysis_results`

| Condition | Action |
|-----------|--------|
| Any Suricata events present | Check for Zeek results with `risk_score > 0` |
| Both present | Emit finding |
| Source/destination IP from Suricata matches a host in Zeek findings | Confidence = `high`; otherwise `medium` |

**Severity:** High

---

### 5. Suspicious DNS → Suspicious HTTP

**Data:** `network_analysis_results` (dns type + http type)

| Condition | Action |
|-----------|--------|
| DNS result with `suspicious_tld` or `long_domain_query` finding | Check for HTTP result with `suspicious_uri` finding |
| Both present | Emit finding |
| Suspicious domain appears inside a flagged URI | Confidence = `high`; otherwise `medium` |

Requires both a `dns.log` and `http.log` to have been analyzed for the case.

**Severity:** High

---

### 6. Service Installation → Privileged Account Activity

**Data:** `normalized_events` (Windows logs)

| Condition | Action |
|-----------|--------|
| Event with EID 4697/7045 or `event_name` contains "Service" | Check for EID 4672/4673 (privilege use) on the same host |
| Both on same host | Emit finding |

**Severity:** Medium | **Confidence:** Medium

---

## Risk and Confidence

| Severity | Meaning |
|----------|---------|
| Critical | Confirmed attack chain (not currently emitted — reserved for future) |
| High     | Strong correlation between attacker-relevant signals |
| Medium   | Suspicious co-occurrence requiring further investigation |
| Low      | Weak or circumstantial overlap |

| Confidence | Meaning |
|------------|---------|
| High   | Exact entity overlap (same host/IP/domain) confirmed across modules |
| Medium | Case-level correlation — signals present but no direct entity link |
| Low    | Partial or inconclusive match |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cases/{id}/correlate` | Run correlation; replaces previous results |
| `GET`  | `/cases/{id}/correlate` | List existing correlated findings |

### POST response

```json
[
  {
    "id": 1,
    "case_id": 5,
    "title": "Repeated Failed Logons Followed by Successful Authentication",
    "severity": "high",
    "confidence": "high",
    "entities": [{"type": "hostname", "value": "WORKSTATION-01"}],
    "related_event_ids": [12, 13, 14, 15, 16, 22, 23],
    "related_finding_ids": [],
    "summary": "7 failed logon attempts on host \"WORKSTATION-01\", followed by a successful authentication. Process execution also observed on the same host.",
    "recommended_action": "Review Active Directory for account lockout events on this host. ...",
    "created_at": "2024-01-15T12:01:00"
  }
]
```

Running correlation twice on the same case replaces the previous results (idempotent).

---

## Data Model

Results are stored in the `correlated_findings` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `case_id` | INTEGER | FK → cases.id |
| `title` | TEXT | Short finding title |
| `severity` | TEXT | `low` / `medium` / `high` / `critical` |
| `confidence` | TEXT | `low` / `medium` / `high` |
| `entities` | TEXT | JSON array of `{type, value}` objects |
| `related_event_ids` | TEXT | JSON array of `normalized_events.id` |
| `related_finding_ids` | TEXT | JSON array of analysis result IDs |
| `summary` | TEXT | Human-readable explanation |
| `recommended_action` | TEXT | Analyst next steps |
| `created_at` | DATETIME | Correlation timestamp |

---

## Timeline Integration

If one or more findings are generated, a timeline entry is added automatically:

```
source: correlation
event_type: Investigation Correlation
severity: high (if any finding is high/critical) | medium
description: "Correlation engine found N correlated findings across case modules."
```

---

## Limitations

- Correlation is entirely case-scoped — no cross-case correlation
- Host matching between modules depends on consistent hostname formatting
- Suricata events must be normalized via the Suricata parser (not raw log uploads)
- YARA-to-process correlation is case-level only (no file path linking to process)
- Patterns fire once per case run, not per individual event pair
- Thresholds are constants in `correlation_engine.py` — not yet exposed via API
- Pattern 5 (DNS → HTTP) requires both `dns.log` and `http.log` to be analyzed
