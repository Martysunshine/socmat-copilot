# Splunk Module

## Overview

SOC Copilot Workbench Phase 15 adds Splunk investigation support using an
**export-first approach** — no live Splunk instance required.

Analysts upload Splunk search results as CSV or JSON exports, normalize them
into a common field model, and generate SPL queries using a built-in template
library and query assistant.

---

## Export-First Approach

Connecting to a live Splunk instance requires API credentials, firewall rules,
and enterprise licensing. This module solves the common scenario where analysts:

- Have an exported CSV or JSON file from a Splunk search
- Need to review it in context with other evidence in a case
- Want quick SPL query starters without building them from scratch

A future live Splunk connector is planned (see **Future Work** below).

---

## Supported Export Formats

| Format | Splunk Export Path | Notes |
|--------|--------------------|-------|
| CSV | Search → Save As → CSV | Most common; includes all fields |
| JSON | Search → Export Results → JSON | Array of result objects |
| NDJSON | Direct API output | One JSON object per line |
| JSONL | Bulk API export | Same as NDJSON |

Format is detected by file extension, then by content sniffing.

---

## Normalized Fields

Eleven common Splunk fields are extracted and stored:

| Splunk Field | Normalized Name | Description |
|--------------|-----------------|-------------|
| `_time` | `event_time` | Event timestamp |
| `index` | `index` | Splunk index |
| `sourcetype` | `sourcetype` | Data source type |
| `host` | `host` | Hostname that generated the event |
| `source` | `source` | Log file or input path |
| `user` | `user` | Username |
| `src_ip` | `src_ip` | Source IP address |
| `dest_ip` | `dest_ip` | Destination IP address |
| `process_name` | `process_name` | Process name |
| `command_line` | `command_line` | Full command line |
| `EventCode` | `event_code` | Windows Event ID |

All other fields are preserved in the `raw` column as a JSON string.

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/cases/{id}/analyze/splunk-export` | POST | Parse and store a Splunk export |
| `/cases/{id}/analyze/splunk-export` | GET | List normalized Splunk events for a case |
| `/splunk/query-templates` | GET | Return all 7 SPL query templates |
| `/splunk/query-assistant` | POST | Match free-text intent to a template |

### POST `/cases/{id}/analyze/splunk-export`

Query parameter: `evidence_id=N` (must be uploaded via Evidence first)

Returns:
```json
{
  "evidence_id": 5,
  "total_events": 1200,
  "sourcetypes": ["WinEventLog:Security", "WinEventLog:System"],
  "top_hosts": ["DC01", "WS-ADMIN", "WS-USER01"],
  "timeline_events_added": 20,
  "normalized_events_saved": 1200
}
```

### POST `/splunk/query-assistant`

Request body:
```json
{
  "intent": "find failed logins from external IPs",
  "case_id": null
}
```

Returns the best-matching SPL template plus full analyst guidance.

---

## SPL Query Templates

Seven templates covering the most common SOC investigation patterns:

| ID | Title | Detection Focus |
|----|-------|----------------|
| `failed_logins` | Failed Logins | Brute-force / password spray (EventCode 4625) |
| `success_after_failures` | Successful Login After Failed Logins | Credential compromise (4625 → 4624) |
| `powershell_encoded` | PowerShell Encoded Command | `-EncodedCommand` obfuscation (Sysmon 1) |
| `new_service` | New Service Installation | Persistence via services (EventCode 4697) |
| `suspicious_process` | Suspicious Process Execution | LOLBin abuse (Sysmon 1) |
| `rare_parent_child` | Rare Parent-Child Process Pairs | Anomalous process lineage (Sysmon 1) |
| `outbound_connections` | Outbound Network Connections | C2 / exfiltration (Sysmon 3) |

Each template includes:
- SPL query ready to paste into Splunk
- Required index and sourcetype assumptions
- What the query detects
- Expected fields
- Possible false positives
- Investigation steps

---

## Query Assistant

The query assistant matches a free-text investigation intent against the
template library using keyword matching. No AI or external service is required.

Example intents and their matches:

| Intent phrase | Matched template |
|---------------|-----------------|
| "brute force" | failed_logins |
| "credential compromise" | success_after_failures |
| "encoded powershell" | powershell_encoded |
| "service persistence" | new_service |
| "lolbin abuse" | suspicious_process |
| "process lineage" | rare_parent_child |
| "c2 beacon" | outbound_connections |

If no keyword matches, the first template (failed_logins) is returned as the
default.

---

## Timeline Integration

High-signal EventCodes are automatically added to the case timeline during
analysis (up to 20 events per run):

| EventCode | Signal |
|-----------|--------|
| 4625 | Failed logon |
| 4624 | Successful logon |
| 4648 | Explicit credential logon |
| 4697 | New service installed |
| 4688 | Process created |
| 4719 | Audit policy changed |
| 4732/4756 | Privileged group membership change |

Process creation events (process_name field present) are also added regardless
of EventCode.

---

## Frontend

The Splunk module adds two UI surfaces:

### Splunk Page (`/splunk`)
- **SPL Query Assistant** — free-text input → structured SPL query with full guidance
- **Template Library** — expandable list of all 7 templates

### Case Detail page
- **Splunk Export Analysis panel** — select an uploaded CSV/JSON export,
  click Analyze, see normalized event counts and sourcetypes

---

## Known Limitations

- Export-first only — no live Splunk API connection
- Field extraction covers 11 common fields; rare custom fields are stored in `raw` only
- Query assistant uses keyword matching, not semantic search
- Templates assume Splunk with Windows Security log and Sysmon sourcetypes

---

## Future Work

- Live Splunk connector via Splunk REST API with token authentication
- SPL execution against stored events (offline replay)
- Attach generated SPL queries to cases as saved notes
- Expand template library with network and endpoint detection patterns
