# Frontend Action Audit — SOC Copilot Workbench

Every major page, button, and API-backed action is documented here with current status and any fixes applied.

**Status key:** ✅ Working | ⚠️ Partial | ❌ Broken | N/A Not applicable

---

## Dashboard (`/`)

| Action | API Call | Success State | Error State | Status | Fix Applied |
|--------|----------|--------------|------------|--------|-------------|
| Load dashboard stats | `GET /api/dashboard/summary` | Case counts, alert counts, chart data render | Error banner shown | ✅ | — |
| Severity distribution chart | Derived from dashboard summary | Bar chart renders | Empty chart with label | ✅ | — |
| Recent cases list | Derived from dashboard summary | Last 5 cases listed | "No recent cases" label | ✅ | — |

---

## Case List (`/cases`)

| Action | API Call | Success State | Error State | Status | Fix Applied |
|--------|----------|--------------|------------|--------|-------------|
| Load case list | `GET /api/cases` | Table of cases with severity/status badges | Error message shown | ✅ | — |
| Create New Case button | Navigates to `/cases/new` | Create form appears | — | ✅ | — |
| Click case row | Navigates to `/cases/{id}` | Case detail page loads | — | ✅ | — |
| Severity badge rendering | Display-only | Colour-coded badge per severity | — | ✅ | — |
| Status badge rendering | Display-only | Colour-coded badge per status | — | ✅ | — |

---

## Create Case (`/cases/new`)

| Action | API Call | Success State | Error State | Status | Fix Applied |
|--------|----------|--------------|------------|--------|-------------|
| Submit create form | `POST /api/cases` | Redirect to new case detail | Inline validation / API error | ✅ | — |
| Required field validation | Client-side | Form prevents submission without title/severity | Fields highlighted | ✅ | — |

---

## Case Detail (`/cases/{id}`)

### Header / Meta

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load case data | `GET /api/cases/{id}` | Title, severity badge, status badge, host/user/IP render | "Case not found" | ✅ |
| Change status (PATCH) | `PATCH /api/cases/{id}` | Status badge updates immediately | Inline error | ✅ |
| Change severity (PATCH) | `PATCH /api/cases/{id}` | Severity badge updates | Inline error | ✅ |

### Evidence Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load evidence list | `GET /api/cases/{id}/evidence` | File table with name, type, size, SHA-256 | "No evidence uploaded" | ✅ |
| Upload evidence file | `POST /api/cases/{id}/evidence` | New row appears in table | Upload error shown | ✅ |
| Delete evidence | `DELETE /api/cases/{id}/evidence/{eid}` | Row removed from table | Error shown | ✅ |

### Timeline Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load timeline | `GET /api/cases/{id}/timeline` | Chronological event list | "No timeline events" | ✅ |
| Open Replay Mode button | Opens `TimelineReplayModal` | Modal with play/pause/step | "No events to replay" | ✅ |

### Timeline Replay Modal

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load replay events | `GET /api/cases/{id}/timeline/replay` | Ordered events with explanation + MITRE mapping | Error message | ✅ |
| Play / Pause button | Client-side timer | Steps auto-advance | — | ✅ |
| Previous / Next buttons | Client-side | Navigate one step | Disabled at boundaries | ✅ |
| Speed control | Client-side | Changes playback interval | — | ✅ |
| Keyboard shortcuts (← → space) | Client-side | Navigate / toggle play | — | ✅ |
| Close modal | Client-side | Modal dismissed | — | ✅ |

### Windows / Sysmon Analysis Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run Analysis button | `POST /api/cases/{id}/analyze/windows` | Events table populates; timeline updated | "No compatible evidence" | ✅ |
| Load existing results | `GET /api/cases/{id}/analysis/windows` | Normalised event rows with EIDs | "No results yet" | ✅ |

### Suricata Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run Suricata Analysis | `POST /api/cases/{id}/analyze/suricata` | Alert table populates | "No Suricata evidence" | ✅ |
| Load existing results | `GET /api/cases/{id}/analysis/suricata` | Alert rows with severity | "No results" | ✅ |

### Zeek Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run Zeek Analysis | `POST /api/cases/{id}/analyze/zeek` | Network summary renders | "No Zeek evidence" | ✅ |
| Load existing results | `GET /api/cases/{id}/analysis/zeek` | Summary + findings | "No results" | ✅ |

### PCAP Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run PCAP Analysis | `POST /api/cases/{id}/analyze/pcap` | DNS/HTTP/connection summary | "No PCAP evidence" | ✅ |
| Load existing results | `GET /api/cases/{id}/analysis/pcap` | Protocol breakdown | "No results" | ✅ |

### Sigma Detection Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run Sigma Detection | `POST /api/cases/{id}/sigma/run` | Finding cards with rule name, severity, EID | "No normalised events" | ✅ |
| Load existing findings | `GET /api/cases/{id}/sigma/findings` | Finding list | "No detections" | ✅ |

### YARA Triage Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run YARA Triage | `POST /api/cases/{id}/yara/run` | Risk score, matched rules | "No file evidence" | ✅ |
| Load existing results | `GET /api/cases/{id}/yara/results` | Triage result per file | "No results" | ✅ |

### Correlation Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run Correlation | `POST /api/cases/{id}/correlate` | Correlated findings list with confidence | "No findings to correlate" | ✅ |
| Load existing findings | `GET /api/cases/{id}/correlate` | Finding cards | "No correlations" | ✅ |

### MITRE ATT&CK Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Run MITRE Mapping | `POST /api/cases/{id}/mitre/map` | Technique list grouped by tactic | "No findings to map" | ✅ |
| Load existing mappings | `GET /api/cases/{id}/mitre/mappings` | Technique table | "No mappings" | ✅ |

### Analyst Playbooks Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load playbooks | `GET /api/cases/{id}/playbooks` | Attached playbooks + suggestions | "No playbooks" | ✅ |
| Attach playbook (suggestion) | `POST /api/cases/{id}/playbooks` | New playbook card appears | Error shown | ✅ |
| Attach playbook (dropdown) | `POST /api/cases/{id}/playbooks` | New playbook card appears | Error shown | ✅ |
| Expand/collapse steps | Client-side | Steps list toggles | — | ✅ |
| Mark step Done | `PATCH .../steps/{id}` with `{status:"done"}` | Step badge turns green; progress bar updates | Error shown | ✅ |
| Mark step Skip | `PATCH .../steps/{id}` with `{status:"skipped"}` | Step badge shows skipped | Error shown | ✅ |
| Mark step Needs Review | `PATCH .../steps/{id}` with `{status:"needs_review"}` | Step badge turns yellow | Error shown | ✅ |
| Save step notes | `PATCH .../steps/{id}` with `{analyst_notes}` | Notes saved; button resets | Error shown | ✅ |

### Analyst Notes Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load notes | `GET /api/cases/{id}/notes` | Notes grouped by type | "No notes" | ✅ |
| Create note | `POST /api/cases/{id}/notes` | New note card appears | Inline error | ✅ |
| Edit note | `PATCH /api/cases/{id}/notes/{nid}` | Note content updates | Error shown | ✅ |
| Delete note | `DELETE /api/cases/{id}/notes/{nid}` | Note removed | Error shown | ✅ |
| Filter by type tab | `GET /api/cases/{id}/notes?note_type=X` | Filtered note list | Empty state | ✅ |

### IOC Basket Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load IOCs | `GET /api/cases/{id}/iocs` | IOC table with type/value/confidence | "No IOCs" | ✅ |
| Extract IOCs button | `POST /api/cases/{id}/iocs/extract` | New IOC rows appear; count shown | Error shown | ✅ |
| Add manual IOC | `POST /api/cases/{id}/iocs` | New IOC row appears | Validation error | ✅ |
| Update analyst tag | `PATCH /api/cases/{id}/iocs/{iid}` | Tag cell updates | Error shown | ✅ |
| Delete IOC | `DELETE /api/cases/{id}/iocs/{iid}` | Row removed | Error shown | ✅ |
| Export CSV | `GET /api/cases/{id}/iocs/export?format=csv` | Browser downloads `.csv` | Error shown | ✅ |
| Export JSON | `GET /api/cases/{id}/iocs/export?format=json` | Browser downloads `.json` | Error shown | ✅ |

### Entity Graph Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load graph | `GET /api/cases/{id}/graph` | React Flow canvas with nodes and edges | "No graph data" | ✅ |
| Node type filter toggles | `GET /api/cases/{id}/graph?node_types=X` | Graph filters to selected types | — | ✅ |
| Click node | Client-side | Detail panel shows node info | — | ✅ |
| Click edge | Client-side | Edge detail / relationship type shown | — | ✅ |
| Export graph JSON button | Client-side JSON download | `graph.json` downloaded | — | ✅ |

### Coverage Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load case coverage | `GET /api/cases/{id}/coverage` | Triggered / not-triggered rule count | Error shown | ✅ |
| Load telemetry gaps | `GET /api/cases/{id}/telemetry-gaps` | Gap catalogue with 7 categories | Error shown | ✅ |

### Finding Disposition Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load dispositions | `GET /api/cases/{id}/dispositions` | Disposition list + metric summary cards | "No dispositions" | ✅ |
| Create disposition | `POST /api/cases/{id}/dispositions` | New disposition row + summary updates | Validation error | ✅ |
| Edit disposition | `PATCH /api/cases/{id}/dispositions/{did}` | Row updates | Error shown | ✅ |
| Delete disposition | `DELETE /api/cases/{id}/dispositions/{did}` | Row removed; summary recalculates | Error shown | ✅ |
| Filter by disposition type | `GET /api/cases/{id}/dispositions?disposition=X` | Filtered list | Empty state | ✅ |

### Report Readiness Widget

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load readiness score | `GET /api/cases/{id}/report/readiness` | Score %, grade badge, section bars, missing checks list | Error shown | ✅ |
| Warning banner in ReportPanel | Derived from readiness response | Banner shown if score < 70 | — | ✅ |

### Report Panel (Reporting & AI)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Generate Report button | `POST /api/cases/{id}/report/generate` | Markdown preview populates | Error shown | ✅ |
| Download PDF button | `GET /api/cases/{id}/report/pdf` | PDF downloaded | "PDF unavailable" message | ✅ |
| Reload preview | `GET /api/cases/{id}/report/latest` | Latest report shown | — | ✅ |

### AI Assistant Panel

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Generate AI summary | `POST /api/cases/{id}/ai/summary` | Summary text rendered | Error shown | ✅ (mock) |
| Get recommendations | `GET /api/cases/{id}/ai/recommendations` | Recommendations list | Error shown | ✅ (mock) |

---

## Sigma Rules (`/sigma`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load rule list | `GET /api/sigma/rules` | Table of all loaded Sigma rules | Error shown | ✅ |
| Click rule for detail | `GET /api/sigma/rules/{id}` | Rule YAML + metadata | "Rule not found" | ✅ |
| Filter / search rules | Client-side | Filtered list | — | ✅ |

---

## YARA Rules (`/yara`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load YARA rule list | `GET /api/yara/rules` | Table of compiled rules | Error shown | ✅ |

---

## Detection Coverage (`/coverage`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load global rule browser | `GET /api/coverage/rules` | Rules table with MITRE tags and logsource | Error shown | ✅ |
| Filter by MITRE tag | Client-side | Filtered rule list | — | ✅ |

---

## Splunk Export (`/splunk`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Analyze Splunk log | `POST /api/cases/{id}/splunk/analyze` | Parsed event count + findings | "No Splunk evidence" | ✅ |
| Splunk Live Search | `POST /api/splunk/live/search` | Results from live Splunk instance | "Splunk not configured" | ⚠️ Requires live credentials |

---

## Elastic Export (`/elastic`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Analyze Elastic log | `POST /api/cases/{id}/elastic/analyze` | Parsed event count + findings | "No Elastic evidence" | ✅ |
| Elastic Live Query | `POST /api/elastic/live/query` | Results from live Elasticsearch | "Elastic not configured" | ⚠️ Requires live credentials |

---

## Rule Authoring (`/rule-author`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Generate Sigma draft | `POST /api/rules/draft` | YAML draft rendered | Error shown | ✅ |
| Generate Splunk SPL draft | `POST /api/rules/draft` with `format=splunk` | SPL draft rendered | Error shown | ✅ |
| Generate Elastic KQL draft | `POST /api/rules/draft` with `format=elastic` | KQL draft rendered | Error shown | ✅ |

---

## Playbooks Page (`/playbooks`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load template list | `GET /api/playbooks/templates` | 10 template cards render | Error shown | ✅ |
| Expand / View Steps | `GET /api/playbooks/templates/{id}` | Steps list shown inline | Error shown | ✅ |

---

## MCP Tools (`/mcp`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load tool list | `GET /api/mcp/tools` | Registered tool cards | Error shown | ✅ |

---

## Reports (`/reports`)

| Action | API Call | Success State | Error State | Status |
|--------|----------|--------------|------------|--------|
| Load report list | `GET /api/reports` | Generated report links | "No reports yet" | ✅ |

---

## Layout / Navigation

| Item | Status | Notes |
|------|--------|-------|
| Sidebar navigation links | ✅ | All routes registered in App.tsx |
| Active link highlighting | ✅ | `NavLink` active class |
| Footer version display | ✅ | Shows current phase |
| Mobile responsiveness | ⚠️ Partial | Not a primary focus for local-first portfolio use |

---

## Fixes Applied During This Audit

| Issue | File | Fix |
|-------|------|-----|
| `readiness.ts` hardcoded `http://localhost:8000` | `apps/web/src/api/readiness.ts` | Changed to `const API = '/api'` |
| Vite proxy Docker failure | `apps/web/vite.config.ts` | Reads `VITE_BACKEND_URL` env var |
| Docker frontend → backend networking | `docker-compose.yml` | Added bridge network + service name URL |

No additional broken buttons or routes found. All major actions either return visible success/error states or have documented empty states.
