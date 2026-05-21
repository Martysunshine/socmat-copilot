# Data Model

## Phase 2 — Cases

### `cases` table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NO | autoincrement | Primary key |
| `title` | VARCHAR | NO | — | Case title |
| `description` | TEXT | YES | NULL | Optional description |
| `severity` | VARCHAR | NO | `medium` | `low` \| `medium` \| `high` \| `critical` |
| `status` | VARCHAR | NO | `open` | `open` \| `investigating` \| `contained` \| `escalated` \| `closed` |
| `source` | VARCHAR | NO | `manual` | `manual` \| `windows_logs` \| `suricata` \| `zeek` \| `splunk_export` \| `elastic_export` \| `yara` |
| `affected_host` | VARCHAR | YES | NULL | Hostname of affected system |
| `affected_user` | VARCHAR | YES | NULL | Username of affected account |
| `affected_ip` | VARCHAR | YES | NULL | IP address of affected asset |
| `created_at` | DATETIME | NO | `now()` | Creation timestamp (UTC) |
| `updated_at` | DATETIME | NO | `now()` | Last update timestamp (UTC) |

---

## Phase 3 — Evidence & Timeline

### `evidence` table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NO | autoincrement | Primary key |
| `case_id` | INTEGER | NO | — | FK → cases.id (CASCADE DELETE) |
| `filename` | VARCHAR | NO | — | UUID-prefixed stored filename |
| `original_filename` | VARCHAR | NO | — | Filename as uploaded |
| `file_type` | VARCHAR | YES | NULL | MIME type |
| `file_size` | INTEGER | NO | — | File size in bytes |
| `sha256` | VARCHAR | NO | — | SHA-256 hex digest |
| `storage_path` | VARCHAR | NO | — | Absolute path on local disk |
| `uploaded_at` | DATETIME | NO | `now()` | Upload timestamp (UTC) |
| `notes` | TEXT | YES | NULL | Optional analyst notes |

### `timeline_events` table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NO | autoincrement | Primary key |
| `case_id` | INTEGER | NO | — | FK → cases.id (CASCADE DELETE) |
| `timestamp` | DATETIME | NO | — | When the event occurred |
| `source` | VARCHAR | NO | `manual` | `manual` \| `windows_logs` \| `suricata` \| `zeek` \| `sigma` \| `yara` \| `correlation` |
| `event_type` | VARCHAR | NO | — | Short label (e.g. Logon, Process Creation) |
| `description` | TEXT | NO | — | Human-readable event description |
| `severity` | VARCHAR | NO | `info` | `info` \| `low` \| `medium` \| `high` \| `critical` |
| `raw_reference` | TEXT | YES | NULL | Original log line or supporting text |
| `created_at` | DATETIME | NO | `now()` | DB insertion timestamp (UTC) |

---

## Future Phases

### Phase 3 — Evidence & Timeline

**`evidence`** — uploaded files attached to a case (filename, sha256, storage_path, file_type, notes)

**`timeline_events`** — chronological events built from parsed evidence (timestamp, source, event_type, description, severity)

---

## Phase 4 — Windows / Sysmon Log Parser

### `normalized_events` table

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | INTEGER | NO | autoincrement | Primary key |
| `case_id` | INTEGER | NO | — | FK → cases.id (CASCADE DELETE) |
| `evidence_id` | INTEGER | NO | — | FK → evidence.id (CASCADE DELETE) |
| `timestamp` | DATETIME | YES | NULL | Event timestamp (parsed from log) |
| `source` | VARCHAR | NO | `windows_logs` | Log source type |
| `host` | VARCHAR | YES | NULL | Hostname |
| `user` | VARCHAR | YES | NULL | Account name |
| `event_id` | VARCHAR | YES | NULL | Windows/Sysmon Event ID |
| `event_name` | VARCHAR | YES | NULL | Human-readable event name |
| `process_name` | VARCHAR | YES | NULL | Process image path |
| `parent_process_name` | VARCHAR | YES | NULL | Parent process image path |
| `command_line` | TEXT | YES | NULL | Full command line |
| `source_ip` | VARCHAR | YES | NULL | Source IP address |
| `destination_ip` | VARCHAR | YES | NULL | Destination IP address |
| `destination_port` | VARCHAR | YES | NULL | Destination port |
| `severity` | VARCHAR | NO | `info` | Normalised severity |
| `description` | TEXT | YES | NULL | Event description |
| `raw_json` | TEXT | YES | NULL | Original raw record as JSON |
| `created_at` | DATETIME | NO | `now()` | DB insertion timestamp (UTC) |

---

## Phase 5 — Suricata IDS/IPS Alert Analysis

Suricata alert records are stored in the existing `normalized_events` table with `source = "suricata"`.

Column mapping for Suricata records:

| `normalized_events` column | Suricata eve.json field |
|---------------------------|------------------------|
| `source` | `"suricata"` (literal) |
| `host` | `dest_ip` |
| `event_id` | `alert.signature_id` |
| `event_name` | `alert.signature` |
| `process_name` | `app_proto` |
| `source_ip` | `src_ip` |
| `destination_ip` | `dest_ip` |
| `destination_port` | `dest_port` |
| `severity` | mapped from `alert.severity` (1→high, 2→medium, 3→low) |
| `description` | `alert.category` |
| `raw_json` | full raw JSON line |

---

## Future Phases

### Phase 6–9 — Parsed Events & Findings

**`normalized_events`** (extended) — structured events extracted from Zeek logs

**`detection_findings`** — Sigma rule matches and suspicious pattern detections

**`malware_triage_results`** — YARA scan results and static file analysis

**`network_analysis_results`** — Zeek/Suricata network behavior summaries

### Phase 10–12 — Correlation & Reporting

**`correlated_findings`** — cross-module findings correlated by shared entities

**`case_mitre_mappings`** — MITRE ATT&CK technique mappings per case

**`reports`** — generated incident report metadata and file paths
