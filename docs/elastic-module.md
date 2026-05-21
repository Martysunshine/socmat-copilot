# Elastic Module — Phase 16

## Overview

The Elastic module enables threat hunting against uploaded Kibana/Elasticsearch exports
without requiring a live Elastic instance. Upload a CSV or JSON export from Kibana
Discover, run normalisation against 13 ECS fields, and generate KQL or ES|QL hunt
queries with full analyst guidance.

---

## Export-First Approach

No live Elastic connection is needed in Phase 16. Exports are uploaded as evidence
files and processed locally:

1. Export from Kibana: **Discover → Share → Export → CSV** or save a raw
   `_search` API response as JSON.
2. Upload the file to the case via the Evidence panel.
3. Open the Elastic Export Analysis panel on the case detail page.
4. Select the file and click **Analyze Elastic Export**.

This approach keeps the tool air-gapped and avoids credential management for
environments that restrict direct Elastic access.

---

## Supported Export Formats

| Format | Source | Detection |
|--------|--------|-----------|
| CSV | Kibana Discover export | `.csv` extension or fallback |
| JSON array | Elasticsearch `_search` response | `.json` extension or `[` first byte |
| `{"hits":{"hits":[...]}}` | ES `_search` wrapper | Parsed from nested structure |
| NDJSON | Kibana bulk export | `.ndjson` / `.jsonl` extension or line-by-line |
| Generic wrappers | `results`, `events`, `rows`, `data` keys | Resolved automatically |

**BOM handling:** UTF-8 BOM is stripped automatically from CSV files.

---

## Normalised ECS Fields

The parser maps 13 ECS fields (dotted paths) to flat internal columns:

| ECS Path | Internal Column | Description |
|---|---|---|
| `@timestamp` | `event_time` | Event timestamp |
| `host.name` | `host_name` | Hostname |
| `user.name` | `user_name` | Username |
| `source.ip` | `src_ip` | Source IP address |
| `destination.ip` | `dest_ip` | Destination IP address |
| `process.name` | `process_name` | Process image name |
| `process.parent.name` | `parent_process_name` | Parent process name |
| `process.command_line` | `command_line` | Full command line |
| `event.code` | `event_code` | Windows EventCode (e.g. 4625) |
| `event.category` | `event_category` | ECS event category |
| `event.action` | `event_action` | ECS event action |
| `file.hash.sha256` | `file_hash_sha256` | File SHA-256 hash |
| `dns.question.name` | `dns_question` | DNS query hostname |

Fields are resolved in this order:
1. Flat CSV header (e.g. header `host.name` → value)
2. Nested JSON traversal (e.g. `{"host": {"name": "..."}}`)
3. Snake_case aliases (e.g. `hostname`, `username`, `sha256`)

---

## API Endpoints

### POST `/cases/{case_id}/analyze/elastic-export?evidence_id=N`

Parse an uploaded Elastic/Kibana export and persist normalised events.

**Query parameter:** `evidence_id` — ID of an existing evidence record for this case.

**Response:**
```json
{
  "evidence_id": 5,
  "total_events": 1240,
  "event_categories": ["authentication", "process"],
  "top_hosts": ["WIN-DC01", "WIN-WS02"],
  "timeline_events_added": 14,
  "normalized_events_saved": 1240
}
```

**Timeline integration:** High-signal events (EventCodes 4625, 4648, 4697, 4688,
4719, 4732, 4756) and events with `event.category: authentication` or a non-null
`process.command_line` are automatically added to the case timeline (up to 20 per run).

---

### GET `/cases/{case_id}/analyze/elastic-export`

List all normalised Elastic events saved for a case, ordered by `analyzed_at` descending.

---

### GET `/elastic/hunt-templates`

Return all 7 KQL/ES|QL hunt templates as a JSON array.

---

### POST `/elastic/hunt-assistant`

Match a free-text intent to a hunt template.

**Request:**
```json
{
  "intent": "find encoded PowerShell",
  "case_id": 3
}
```

`case_id` is optional. When provided, a `hunt_generated` event is added to the case
timeline so analysts can track which hunts were run against each investigation.

**Response:** The matched `HuntTemplate` with an added `matched_by` field indicating
which keyword triggered the match (`"default"` if no keyword matched).

---

## Hunt Template Library

Seven templates covering common threat hunting scenarios:

| ID | Title | Primary Signal |
|----|-------|----------------|
| `encoded_powershell` | Encoded PowerShell Execution | `process.command_line` `-enc` |
| `suspicious_child_process` | Suspicious Child Process from Office/Browser | `process.parent.name` |
| `new_service_creation` | New Windows Service Created | EventCode 4697 |
| `rare_outbound_destination` | Rare Outbound Network Destination | `network.direction: egress` |
| `dns_tunneling` | DNS Tunneling Candidates | `dns.question.name` length > 40 |
| `auth_failure_then_success` | Auth Failures Followed by Success | EventCode 4625 + 4624 |
| `suspicious_script_interpreter` | Suspicious Script Interpreter Usage | LOLBin process names |

Each template includes:
- **KQL query** — for Kibana Discover filter bar
- **ES|QL query** — for Kibana ES|QL / Elasticsearch 8.11+
- Index pattern assumptions
- Required ECS fields
- Possible false positives
- Recommended investigation pivots

---

## Hunt Assistant Intent Examples

| Example intent | Matched template |
|---|---|
| "detect encoded powershell" | `encoded_powershell` |
| "find base64 obfuscation" | `encoded_powershell` |
| "office spawning cmd" | `suspicious_child_process` |
| "macro document execution" | `suspicious_child_process` |
| "new service persistence" | `new_service_creation` |
| "outbound c2 connections" | `rare_outbound_destination` |
| "dns tunneling candidates" | `dns_tunneling` |
| "brute force then login" | `auth_failure_then_success` |
| "mshta lolbin usage" | `suspicious_script_interpreter` |

---

## Limitations (Phase 16)

- No live Elasticsearch connection — export-based only.
- ES|QL `CIDR_MATCH` and `LENGTH` functions require Elasticsearch 8.11+.
- Nested ECS fields beyond two levels (e.g. `threat.indicator.type`) are not
  normalised in this phase.
- No persistent hunt result storage — hunts are recorded as timeline events only.
- No pagination on the events list endpoint.

---

## Future Work (Phase 17+)

- Live Elasticsearch API integration with credential management.
- Saved hunts with status tracking (open / in progress / closed).
- Alert rule generation from hunt templates.
- Cross-referencing Elastic events with Suricata/Zeek/Windows analysis results.
