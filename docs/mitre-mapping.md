# MITRE ATT&CK Mapping

## Overview

SOC Copilot Workbench Phase 11 adds deterministic MITRE ATT&CK mapping that ties case
evidence to tactics and techniques from the MITRE ATT&CK framework.

Mapping runs on demand — the analyst clicks **Run ATT&CK Mapping** on the case detail page.
Results are stored and displayed grouped by tactic, with collapsible evidence references
for every mapped technique.

> **No AI involved.** All mapping is rule-based and evidence-backed. Every technique entry
> includes the exact data sources that triggered it.

---

## Local Catalog

Technique definitions are stored in `data/mitre_mapping.json` at the repository root.
The file contains MVP mappings for the nine techniques most relevant to Windows endpoint
and network investigations:

| Technique ID | Name | Tactic |
|-------------|------|--------|
| T1110 | Brute Force | Credential Access |
| T1003 | OS Credential Dumping | Credential Access |
| T1059 | Command and Scripting Interpreter | Execution |
| T1059.001 | Command and Scripting Interpreter: PowerShell | Execution |
| T1543.003 | Create or Modify System Process: Windows Service | Persistence |
| T1053.005 | Scheduled Task/Job: Scheduled Task | Persistence |
| T1027 | Obfuscated Files or Information | Defense Evasion |
| T1071.004 | Application Layer Protocol: DNS | Command and Control |
| T1071.001 | Application Layer Protocol: Web Protocols | Command and Control |

The catalog is loaded from disk on each mapping run. New techniques can be added by
editing `data/mitre_mapping.json` — no code change required.

---

## Mapping Logic

The engine (`services/api/mitre_mapper.py`) inspects five data sources per case:

### 1. Normalized Events (Windows logs + Suricata)

| Signal | Technique |
|--------|-----------|
| EID 4625 / 4776 / 4771 (failed logon) | T1110 — Brute Force |
| `process_name` contains `powershell` / `pwsh` | T1059.001 — PowerShell |
| `process_name` contains `cmd.exe`, `wscript`, `cscript`, `mshta`, `regsvr32`, `rundll32`, `bitsadmin` | T1059 — Scripting Interpreter |
| `command_line` contains `-EncodedCommand`, `-enc`, `EncodedCommand` | T1027 — Obfuscation |
| EID 4697 / 7045, or event name contains "service" | T1543.003 — Windows Service |
| EID 4698–4701, or event name contains "scheduled task" | T1053.005 — Scheduled Task |
| EID 4648 | T1003 — OS Credential Dumping |
| Suricata alerts containing brute force keywords | T1110 |
| Suricata alerts containing DNS tunnel keywords | T1071.004 |
| Suricata alerts containing C2 / beacon keywords | T1071.001 |

Confidence is `high` if ≥ 5 failed logon events are present (brute force), or if
PowerShell or encoded-command evidence is found (direct indicator).

### 2. Sigma Detection Findings

Sigma rules carry `tags` in the `attack.t####` format (e.g. `attack.t1059.001`). For each
`DetectionFinding` in the case, the engine looks up the rule's tags via the Sigma loader
and records a `high`-confidence mapping for every ATT&CK technique tag found.

### 3. YARA Triage Results

Any YARA result with `risk_score > 0` maps to T1027 (Obfuscated Files or Information)
at `medium` confidence. The rule names that matched are included in the evidence reference.

### 4. Zeek Network Analysis

| Log type | risk_score > 0 | Technique |
|----------|----------------|-----------|
| dns | yes | T1071.004 — DNS |
| http | yes | T1071.001 — Web Protocols |

### 5. Correlated Findings

Titles from the correlation engine are keyword-matched to supplement the technique set:

| Title keyword | Technique(s) |
|---------------|-------------|
| brute force / failed logon | T1110 |
| script / powershell | T1059.001, T1059 |
| service | T1543.003 |
| dns | T1071.004 |
| http / ids alert | T1071.001 |
| yara / malicious file | T1027 |

Confidence is inherited from the correlated finding's own confidence field.

---

## Confidence

| Confidence | Meaning |
|------------|---------|
| High | Direct indicator — PowerShell execution, encoded command, or Sigma rule tag |
| Medium | Circumstantial or case-level signal — YARA hit, network log risk score, keyword match |
| Low | Weak or inherited signal |

Confidence is promoted (never demoted) if multiple sources report the same technique.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/mitre/mappings` | Return local technique catalog |
| `POST` | `/cases/{id}/mitre/map` | Run mapping; replaces previous results |
| `GET` | `/cases/{id}/mitre/map` | List existing mappings for a case |

Running mapping twice on the same case replaces the previous results (idempotent).

### POST response

```json
[
  {
    "id": 1,
    "case_id": 5,
    "tactic": "Credential Access",
    "technique_id": "T1110",
    "technique_name": "Brute Force",
    "evidence_reference": [
      {"source": "windows_event", "detail": "8 failed logon events on hosts: WORKSTATION-01"},
      {"source": "correlation", "detail": "Correlated finding: Repeated Failed Logons Followed by Successful Authentication"}
    ],
    "confidence": "high",
    "created_at": "2024-01-15T12:05:00"
  }
]
```

---

## Data Model

Results are stored in the `case_mitre_mappings` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `case_id` | INTEGER | FK → cases.id |
| `tactic` | TEXT | ATT&CK tactic name |
| `technique_id` | TEXT | ATT&CK technique ID (e.g. T1059.001) |
| `technique_name` | TEXT | Human-readable technique name |
| `evidence_reference` | TEXT | JSON array of `{source, detail}` objects |
| `confidence` | TEXT | `low` / `medium` / `high` |
| `created_at` | DATETIME | Mapping timestamp |

---

## Timeline Integration

If one or more mappings are generated, a timeline entry is added automatically:

```
source: mitre
event_type: MITRE ATT&CK Mapping
severity: medium
description: "MITRE ATT&CK mapping identified N techniques across M tactics."
```

---

## Limitations

- Catalog covers 9 MVP techniques — the full ATT&CK matrix has 600+
- Technique matching is keyword/EID-based; no semantic analysis
- Sub-technique promotion is not performed (T1059.001 does not imply T1059 automatically)
- Scheduled task and credential dumping detections depend on Windows Security log collection scope
- Zeek DNS/HTTP mapping is log-level (whole file), not per-connection
- YARA-to-technique mapping is generic (T1027) since YARA rules do not carry ATT&CK tags
- No cross-case or trending analysis
- `GET /mitre/mappings` returns only catalog entries; no technique frequency or coverage stats
