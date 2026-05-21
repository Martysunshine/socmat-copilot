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

## Future Phases

### Phase 3 — Evidence & Timeline

**`evidence`** — uploaded files attached to a case (filename, sha256, storage_path, file_type, notes)

**`timeline_events`** — chronological events built from parsed evidence (timestamp, source, event_type, description, severity)

### Phase 4–9 — Parsed Events & Findings

**`normalized_events`** — structured events extracted from Windows/Sysmon/Suricata/Zeek logs

**`detection_findings`** — Sigma rule matches and suspicious pattern detections

**`malware_triage_results`** — YARA scan results and static file analysis

**`network_analysis_results`** — Zeek/Suricata network behavior summaries

### Phase 10–12 — Correlation & Reporting

**`correlated_findings`** — cross-module findings correlated by shared entities

**`case_mitre_mappings`** — MITRE ATT&CK technique mappings per case

**`reports`** — generated incident report metadata and file paths
