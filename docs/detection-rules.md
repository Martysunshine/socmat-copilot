# Detection Rules — Sigma Rule Library

## Overview

SOC Copilot Workbench includes a Sigma rule library module for browsing, filtering, and understanding detection rules. This is the foundation for Phase 7 Sigma matching against normalized events.

## What Is Sigma?

Sigma is an open, vendor-agnostic rule format for writing generic detection rules that can be converted to platform-specific query languages (Splunk SPL, Elastic KQL, Microsoft Sentinel KQL, etc.).

A Sigma rule describes suspicious behavior using field-value conditions, a log source specification, and metadata like MITRE ATT&CK tags and severity level.

**MVP Scope:** Phase 6 covers rule loading, display, filtering, and explanation. Full Sigma execution against all log formats is not yet supported — that comes in Phase 7.

---

## Rule Format

Each Sigma rule is a YAML file with these key fields:

| Field | Description |
|-------|-------------|
| `title` | Short descriptive name |
| `id` | UUID uniquely identifying the rule |
| `status` | `stable`, `experimental`, `test`, or `deprecated` |
| `description` | Explanation of what the rule detects |
| `references` | Links to MITRE, Microsoft, vendor docs |
| `author` | Rule author |
| `date` / `modified` | Creation and last-modified dates (YYYY/MM/DD) |
| `tags` | MITRE ATT&CK tags (`attack.tXXXX`, `attack.tactic`) |
| `logsource` | Required log type (`product`, `category`, `service`) |
| `detection` | Field conditions + `condition` logic |
| `falsepositives` | Known benign causes |
| `level` | `informational` / `low` / `medium` / `high` / `critical` |

---

## Rule Storage

Place Sigma YAML files in the `rules/sigma/` directory tree:

```
rules/
└── sigma/
    ├── custom/       ← project-specific rules
    └── community/    ← rules from Sigma community (e.g. SigmaHQ)
```

The backend loader scans `rules/sigma/` recursively for `.yml` and `.yaml` files. Rules are loaded at startup and cached in memory. Use the **Reload Rules** button in the UI (or `POST /sigma/rules/reload`) to pick up newly added files without restarting the server.

---

## Included Sample Rules

| Rule | Level | Logsource | MITRE |
|------|-------|-----------|-------|
| Suspicious PowerShell Encoded Command | High | Windows / process_creation | T1059.001, T1027 |
| cmd.exe Spawning PowerShell | Medium | Windows / process_creation | T1059.003, T1059.001 |
| Multiple Failed Logon Attempts | Medium | Windows / security | T1110 |
| New Windows Service Installed | Low | Windows / system | T1543.003 |
| Suspiciously Long DNS Query | Medium | Windows / dns | T1071.004, T1048 |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/sigma/rules` | List all rules. Supports query params: `level`, `logsource_product`, `logsource_category`, `tag` |
| `GET` | `/sigma/rules/{rule_id}` | Rule detail with human-readable explanation |
| `POST` | `/sigma/rules/reload` | Reload rules from disk |
| `POST` | `/cases/{id}/sigma/rules` | Attach a rule to a case as detection context |
| `GET` | `/cases/{id}/sigma/rules` | List rules attached to a case |
| `DELETE` | `/cases/{id}/sigma/rules/{rule_sigma_id}` | Detach a rule from a case |

---

## Rule Explanation

The explainer module (`integrations/sigma/explainer.py`) generates a structured, human-readable explanation for each rule without AI:

- **Summary** — description or synthesised sentence
- **Log Source** — required platform and log category
- **Detection Conditions** — field/value conditions in readable form
- **MITRE Tactics & Techniques** — extracted from `tags`
- **False Positives** — from rule YAML
- **Investigation Steps** — contextual next steps generated from logsource, tags, and severity

---

## Phase 7: Sigma Matching

Phase 7 adds basic rule matching against normalized Windows/Sysmon events stored by the Phase 4 Windows log parser.

### New Endpoint

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cases/{id}/sigma/run` | Run all loaded rules (or one via `?rule_id=`) against normalized events |
| `GET` | `/cases/{id}/sigma/findings` | List Sigma detection findings for a case |

### How Matching Works

1. The endpoint loads all `normalized_events` rows for the case (populated by Windows log analysis).
2. Each event is tested against each rule's `detection` block.
3. Matches are stored in the `detection_findings` table and added to the case timeline.
4. Re-running replaces previous findings for the targeted rule(s).

### Supported Operators

| Operator | Example | Supported |
|----------|---------|-----------|
| Exact match | `EventID: 4625` | Yes |
| `\|contains` | `CommandLine\|contains: '-enc'` | Yes |
| `\|endswith` | `Image\|endswith: '\powershell.exe'` | Yes |
| `\|startswith` | `Image\|startswith: 'C:\Windows'` | Yes |
| `\|contains\|all` | list: all items must match | Yes |
| List (OR) | field: [val1, val2] | Yes — any value matches |
| AND within selection | multiple fields in one group | Yes |
| `condition: selection` | simple single-group | Yes |
| `\|re` regex | `QueryName\|re: '^...'` | Skipped (no match, logged as limitation) |
| Multi-group conditions | `1 of selection*`, `sel1 and sel2` | Not supported in Phase 7 |

---

## MVP Sigma Matching Limitations

The Phase 7 matcher is an intentional subset of the full Sigma specification:

- **Single selection only** — only `condition: <name>` where `<name>` is one named detection group. Rules with compound conditions (`1 of selection*`, `selection1 and not filter`, etc.) are skipped.
- **No regex** — the `|re` modifier is not evaluated. Fields with only regex conditions are skipped, preventing those rules from firing.
- **Unknown fields skipped** — Sigma fields not present in the `normalized_events` schema (e.g. `LogonType`, `ServiceName`, `QueryName`) are silently skipped. A rule passes only if at least one *known* field was evaluated and matched.
- **No keywords block** — top-level `keywords:` detection entries are not supported.
- **No filter negation** — `condition: selection and not filter` is skipped (treated as complex condition).
- **Windows/Sysmon events only** — matching runs against `normalized_events` rows with `source = windows_logs`. Suricata and Zeek events are not yet matched.
- **No automatic conversion** — rules cannot be exported to Splunk SPL or Elastic KQL yet (Phase 15/16).

---

## Adding Community Rules

To use rules from the [SigmaHQ](https://github.com/SigmaHQ/sigma) community repository:

1. Clone or download the SigmaHQ rules.
2. Copy relevant `.yml` files into `rules/sigma/community/`.
3. Click **Reload Rules** in the UI.

Not all community rules will parse cleanly — the loader skips files that cannot be parsed rather than crashing.
