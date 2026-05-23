# SOC Copilot Workbench

**A local-first, open-source defensive cybersecurity automation platform for SOC analyst workflows.**

> **Defensive tool only.** Built for blue-team SOC analysts.
> No offensive functionality, exploit code, or malware execution capability.

---

## Why This Project Exists

Modern SOC analysts juggle a dozen tools simultaneously — log parsers, detection engines, threat intel lookups, MITRE mapping, and report writing — all in separate windows with no unified view. SOC Copilot Workbench brings these workflows into one local, privacy-first investigation workbench.

Every analysis runs on your machine. No cloud upload, no telemetry, no SaaS dependency.

---

## Features

| Feature | Description |
|---------|-------------|
| **Case Management** | Create and track investigation cases with severity, status, and affected assets |
| **Evidence Upload** | Attach log files, exports, and artifacts to cases (50 MB limit, path traversal protected) |
| **Windows / Sysmon Analysis** | Parse Windows Event Logs and Sysmon telemetry; normalize into a timeline |
| **Suricata IDS/IPS** | Ingest `eve.json` alert files; surface high-severity alerts and attacker IPs |
| **Zeek Network Logs** | Parse `conn.log`, `dns.log`, `http.log`; flag C2 beaconing and DNS tunneling |
| **Sigma Detection** | Load and run Sigma YAML rules against normalized events; human-readable explanations |
| **YARA Static Triage** | Scan uploaded artifacts against YARA rules without executing files |
| **Splunk Export** | Parse Splunk CSV/JSON exports; SPL query assistant for investigation pivoting |
| **Live Splunk Connector** | Query a live Splunk instance via REST API; run predefined SPL templates; env-var credentials only |
| **Live Elastic Connector** | Query a live Elasticsearch instance via ES\|QL; run predefined hunt templates; env-var credentials only |
| **PCAP Analysis** | Static PCAP/PCAPNG analysis — top talkers, protocol distribution, DNS, HTTP, TLS/SNI, beaconing and DGA detection |
| **Rule Authoring Assistant** | Draft Sigma YAML, Splunk SPL, and Elastic KQL/ES|QL from a detection description; false positive notes, log source requirements, and validation warnings |
| **Analyst Playbooks** | 10 built-in investigation playbooks for common alert types; step-by-step checklists; analyst notes per step; auto-suggestion from case findings; playbook progress in reports |
| **Analyst Notes** | Attach notes (observations, hypotheses, decisions, escalations, false-positive reasoning) to any case entity; filter by type; notes included in incident reports; AI assistant treats them as analyst opinion |
| **IOC Basket** | Auto-extract IOCs from all case data (IPs, domains, URLs, hashes, hosts, users, processes, paths, ports, user agents); 16 IOC types; analyst tagging; confidence levels; copy/CSV/JSON export; manual entry; IOC section in reports |
| **Investigation Map** | Interactive entity graph built from all case data; 14+ node types (hosts, users, IPs, domains, processes, hashes, Sigma/YARA/Suricata rules, MITRE techniques, correlated findings, IOCs); per-type filter toggles; node/edge click detail; export graph JSON |
| **Timeline Replay** | Interactive replay mode — step through timeline events with play/pause/next/prev/restart/speed controls; per-event "what this means" explanations, recommended focus, MITRE mappings, evidence links, and analyst notes; keyboard shortcuts (← → space); copy event summary; severity and source filters |
| **Detection Coverage** | Global Sigma rule browser with MITRE tags, logsource, and field metadata; per-case coverage analysis showing triggered/not-triggered/blocked rule counts; MITRE technique coverage percentage; 7-gap telemetry gap catalogue with why-it-matters and remediation recommendations; coverage section in reports; coverage_gaps AI context |
| **Finding Disposition** | Analyst-controlled disposition workflow for all finding types; 8 disposition values (true positive, false positive, benign, suspicious, needs review, escalated, duplicate, insufficient data); confidence level; reason, analyst name, follow-up action; summary metric cards; filter by disposition; disposition section in reports; AI advisory context (analyst decision is final) |
| **Elastic Export** | Parse Kibana/Elasticsearch NDJSON exports; KQL/ES\|QL hunt template assistant |
| **Investigation Correlation** | Cross-module correlation engine surfaces multi-source attack patterns |
| **MITRE ATT&CK Mapping** | Auto-map findings to ATT&CK techniques; view per-tactic coverage |
| **Incident Report Generator** | Produce structured Markdown security incident reports from all findings |
| **AI Investigation Assistant** | Grounded case summarization and next-step recommendations (Anthropic/OpenAI/mock) |
| **MCP Tool Server** | Model Context Protocol server — expose case data to LLM toolchains |
| **Analyst Dashboard** | Aggregate case metrics, recent activity, and open alert counts |

---

## Architecture

```
Browser (localhost:5173)
        │
        ▼  HTTP via Vite proxy
FastAPI API (localhost:8000)
        │
        ├── /cases                  Case CRUD → SQLite
        ├── /cases/{id}/evidence    File upload → ./uploads/
        ├── /cases/{id}/analyze/*   Parser pipeline → normalized events
        ├── /cases/{id}/sigma/*     Sigma detection findings
        ├── /cases/{id}/analyze/yara  YARA static triage
        ├── /cases/{id}/correlate   Cross-module correlation
        ├── /cases/{id}/mitre/map   MITRE ATT&CK mapping
        ├── /cases/{id}/report/*    Markdown report generation
        ├── /cases/{id}/ai/*        AI case summary and recommendations
        └── /mcp/*                  MCP tool server

All state is local. Nothing leaves the machine.
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + Vite |
| Backend | Python 3.11+ + FastAPI |
| Database | SQLite (local file) |
| Deployment | Docker Compose |
| Detection | Sigma YAML + YARA rules |
| Reports | Markdown |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- (Optional) Docker + Docker Compose

### Run with Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

### Run locally (development)

**Backend:**

```bash
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend (separate terminal):**

```bash
cd apps/web
npm install
npm run dev
```

### Environment variables

```bash
cp services/api/.env.example services/api/.env
# Edit .env — AI_PROVIDER defaults to "mock" (no API key needed)
```

---

## Demo Scenario — Operation: Midnight Blue

A pre-built fictional SOC incident scenario covering all 15 analysis modules.

**What it includes:**
- Lateral movement via PsExec and Mimikatz credential dumping (Windows/Sysmon logs)
- Suricata IDS alerts: EternalBlue exploit, C2 callbacks, Cobalt Strike beacon
- Zeek network logs: DNS tunneling, beaconing to a C2 server, failed port scans
- Sigma rule hits: PowerShell Empire, LSASS access, scheduled task creation
- YARA triage: Mimikatz and Empire payload signatures
- Full MITRE ATT&CK mapping across Initial Access → Lateral Movement → Exfiltration
- Auto-generated Markdown incident report

**Run the demo:**

```bash
# 1. Start the backend
cd services/api && uvicorn main:app --reload

# 2. Seed the demo case (new terminal)
pip install requests
python scripts/seed_demo.py
```

The script prints the URL to the populated case. See [docs/demo-walkthrough.md](docs/demo-walkthrough.md) for a manual step-by-step guide.

---

## Example Investigation Workflow

```
1. Create a case          → POST /cases
2. Upload evidence        → POST /cases/{id}/evidence
3. Run log analysis       → POST /cases/{id}/analyze/windows-logs
4. Run Sigma detection    → POST /cases/{id}/sigma/run
5. Run YARA triage        → POST /cases/{id}/analyze/yara
6. Correlate findings     → POST /cases/{id}/correlate
7. Map to MITRE ATT&CK    → POST /cases/{id}/mitre/map
8. Generate report        → POST /cases/{id}/report/generate
9. AI summary             → POST /cases/{id}/ai/summarize
```

Every step is also available via the React UI.

---

## Supported Data Sources

| Source | Format | Module |
|--------|--------|--------|
| Windows Event Logs | JSON/EVTX-export | `integrations/windows_logs` |
| Sysmon | JSON/EVTX-export | `integrations/windows_logs` |
| Suricata IDS/IPS | `eve.json` | `integrations/suricata` |
| Zeek | `conn.log`, `dns.log`, `http.log` | `integrations/zeek` |
| Splunk | CSV or JSON export | `integrations/splunk` |
| Elasticsearch / Kibana | NDJSON export | `integrations/elastic` |
| PCAP / PCAPNG | `.pcap`, `.pcapng`, `.cap` | `integrations/pcap` |

---

## Detection Modules

### Sigma Rules
- Loaded from `rules/sigma/*.yml`
- Matched against normalized Windows/Sysmon events
- Each rule includes a human-readable explanation
- Reload without restart: `POST /sigma/rules/reload`

### YARA Rules
- Loaded from `rules/yara/*.yar`
- Matched statically against uploaded artifact bytes
- Files are **never executed** — bytes only
- Reload without restart: `POST /yara/rules/reload`

### Built-in detection rules cover:
- PowerShell Empire and encoded commands
- LSASS memory dumping (Mimikatz)
- PsExec lateral movement
- Scheduled task persistence
- EternalBlue / MS17-010 exploit signatures
- Cobalt Strike beacon patterns
- DNS tunneling and C2 callback indicators

---

## AI and MCP Support

The investigation assistant (`/cases/{id}/ai/summarize` and `/cases/{id}/ai/recommend`) is **grounded** — it only references findings already stored in the case database. It does not hallucinate facts.

### Providers

| Provider | `AI_PROVIDER` value | Key required |
|----------|--------------------|----|
| Mock (default) | `mock` | No |
| Anthropic Claude | `anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `OPENAI_API_KEY` |

Set `AI_PROVIDER` in `services/api/.env`.

### MCP Tool Server

The `/mcp/tools` endpoint exposes case data as MCP tools, allowing Claude Desktop or any MCP-compatible LLM client to query case findings directly.

---

## Report Generation

`POST /cases/{id}/report/generate` produces a structured Markdown security incident report containing:

- Executive summary
- Affected assets
- Timeline of events
- Detection findings with severity
- MITRE ATT&CK technique coverage
- Recommended remediation steps

Reports are saved to `reports/generated/` and accessible via `GET /cases/{id}/report/content`.

A styled PDF version can be downloaded at any time via `GET /cases/{id}/report/pdf` — no separate generation step required. The PDF mirrors all 15 report sections with color-coded severity, tables, and a header/footer on every page.

---

## Security and Safety

This tool performs **static analysis only**. Uploaded files are read but never executed.

| Control | Implementation |
|---------|---------------|
| File execution | Never — no subprocess, exec, or eval on uploads |
| Path traversal | `_safe_filename()` + `Path.is_relative_to()` guard |
| Upload size limit | 50 MB hard cap before disk write (HTTP 413) |
| CORS | Restricted to `localhost:5173` only |
| Secrets | API keys from env only — `.env` is gitignored |
| Input validation | Pydantic v2 field constraints on all case fields |

**Do not:**
- Upload live malware outside an isolated lab environment
- Connect production SIEM credentials in development mode
- Expose port 8000 directly to a network

See [docs/security-model.md](docs/security-model.md) and [docs/threat-model.md](docs/threat-model.md) for full documentation.

---

## Project Structure

```
soc-copilot-workbench/
├── apps/
│   └── web/                  # React + Vite frontend
├── services/
│   └── api/                  # FastAPI backend
│       ├── routers/          # One router per feature
│       ├── models/           # SQLAlchemy ORM models
│       ├── schemas/          # Pydantic v2 schemas
│       ├── integrations/     # Log parsers
│       └── .env.example      # Environment variable template
├── integrations/             # Standalone parser modules (also importable)
├── rules/
│   ├── sigma/                # Sigma YAML detection rules
│   └── yara/                 # YARA static analysis rules
├── sample-data/
│   └── demo-incident/        # Operation: Midnight Blue demo files
├── reports/generated/        # Output Markdown reports
├── scripts/                  # seed_demo.py and utilities
├── tests/                    # pytest unit tests
└── docs/                     # Architecture, data model, module docs
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/cases` | GET / POST | List / create cases |
| `/cases/{id}` | GET / PATCH / DELETE | Get / update / delete case |
| `/cases/{id}/evidence` | GET / POST | List / upload evidence |
| `/cases/{id}/timeline` | GET / POST | List / add timeline events |
| `/cases/{id}/analyze/windows-logs` | POST / GET | Run / list Windows log analysis |
| `/cases/{id}/analyze/suricata` | POST / GET | Run / list Suricata analysis |
| `/cases/{id}/analyze/yara` | POST / GET | Run / list YARA triage |
| `/cases/{id}/analyze/zeek` | POST / GET | Run / list Zeek analysis |
| `/cases/{id}/analyze/splunk-export` | POST / GET | Run / list Splunk export analysis |
| `/cases/{id}/analyze/elastic-export` | POST / GET | Run / list Elastic export analysis |
| `/sigma/rules` | GET | List Sigma rules |
| `/cases/{id}/sigma/run` | POST | Run Sigma detection |
| `/cases/{id}/sigma/findings` | GET | List Sigma findings |
| `/yara/rules` | GET | List YARA rules |
| `/cases/{id}/correlate` | POST / GET | Run / list correlation |
| `/cases/{id}/mitre/map` | POST / GET | Run / list ATT&CK mapping |
| `/cases/{id}/report/generate` | POST | Generate incident report |
| `/cases/{id}/report/content` | GET | Return report Markdown |
| `/cases/{id}/ai/summarize` | POST | AI case summary |
| `/cases/{id}/ai/recommend` | POST | AI recommended next steps |
| `/mcp/tools` | GET | List MCP tools |
| `/dashboard/summary` | GET | Dashboard aggregate metrics |
| `/rules/author` | POST | Generate Sigma/SPL/KQL/ES\|QL rule drafts |
| `/rules/author/event-types` | GET | List supported event types |
| `/playbooks/templates` | GET | List all playbook templates |
| `/playbooks/templates/{id}` | GET | Get template detail with steps |
| `/cases/{id}/playbooks` | GET / POST | List case playbooks + suggestions / attach a playbook |
| `/cases/{id}/playbooks/{playbook_id}/steps/{step_id}` | PATCH | Update step status / analyst notes |
| `/cases/{id}/notes` | GET / POST | List (filterable) / create analyst notes |
| `/cases/{id}/notes/{note_id}` | PATCH / DELETE | Update / delete an analyst note |
| `/cases/{id}/iocs/extract` | POST | Extract IOCs from all case data |
| `/cases/{id}/iocs` | GET / POST | List (filterable) / manually add an IOC |
| `/cases/{id}/iocs/{ioc_id}` | PATCH / DELETE | Update confidence/tags / delete IOC |
| `/cases/{id}/iocs/export` | GET | Export IOCs as CSV or JSON (`?format=csv\|json`) |
| `/cases/{id}/graph` | GET | Build investigation entity graph (filter params: `show_hosts`, `show_users`, `show_ips`, `show_domains`, `show_processes`, `show_detections`, `show_mitre`, `show_iocs`, `show_evidence`, `only_suspicious`) |
| `/cases/{id}/timeline/replay` | GET | Replay-ready timeline events enriched with explanations, recommended focus, related evidence, findings, MITRE mappings, and analyst notes (`?severity=&source=`) |
| `/coverage/rules` | GET | All Sigma rules with MITRE tags, logsource, required fields, and severity (filter params: `rule_type`, `severity`, `logsource`, `tactic`) |
| `/cases/{id}/coverage` | GET | Per-case coverage — triggered/not-triggered/blocked rule counts, available log sources, MITRE coverage percentage |
| `/cases/{id}/telemetry-gaps` | GET | Telemetry gap analysis — missing log sources with why-it-matters and recommendations |
| `/cases/{id}/dispositions` | POST | Create a finding disposition (finding_type, finding_id, disposition, confidence, reason) |
| `/cases/{id}/dispositions` | GET | List all dispositions with summary counts (filter: `finding_type`, `finding_id`, `disposition`) |
| `/cases/{id}/dispositions/{did}` | PATCH | Update disposition, confidence, reason, analyst_name, or follow_up_action |
| `/cases/{id}/dispositions/{did}` | DELETE | Remove a disposition |

Interactive docs: http://localhost:8000/docs

---

## Testing

```bash
pip install pytest
pytest tests/ -v
```

Tests cover Windows/Sysmon and Suricata parser logic. Safe sample evidence files are in `sample-data/`.

---

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full planned roadmap.

- [x] Phase 1: Architecture skeleton
- [x] Phase 2: Case management
- [x] Phase 3: Evidence upload and timeline
- [x] Phase 4: Windows/Sysmon log parser
- [x] Phase 5: Suricata IDS alert analysis
- [x] Phase 6: Sigma rule library
- [x] Phase 7: Sigma detection matching
- [x] Phase 8: YARA static malware triage
- [x] Phase 9: Zeek network log analysis
- [x] Phase 10: Investigation correlation engine
- [x] Phase 11: MITRE ATT&CK mapping
- [x] Phase 12: Security Incident Report generator
- [x] Phase 13: AI investigation assistant
- [x] Phase 14: MCP tool server
- [x] Phase 15: Splunk export and SPL query assistant
- [x] Phase 16: Elastic export and KQL/ES\|QL hunt assistant
- [x] Phase 17: Analyst dashboard and UX polish
- [x] Phase 18: Testing, sample data, and demo scenario
- [x] Phase 19: Security hardening and safe defaults
- [x] Phase 20: GitHub-ready README and open source polish
- [x] Phase 21: PDF report export
- [x] Phase 22: Live Splunk connector
- [x] Phase 23: Live Elastic connector
- [x] Phase 24: PCAP / network traffic analysis
- [x] Phase 25: Detection rule authoring assistant
- [x] Phase 26: Analyst playbooks and guided investigation
- [x] Phase 27: Analyst notes and evidence annotations
- [x] Phase 28: IOC extraction and IOC basket
- [x] Phase 29: Entity graph and investigation map
- [x] Phase 30: Attack timeline replay mode
- [x] Phase 31: Detection coverage and telemetry gap analysis
- [x] Phase 32: Finding disposition and false positive review
- [ ] Phase 33: Report readiness score
- [ ] Phase 33: Report readiness score

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

This is a blue-team defensive tool. Contributions that introduce offensive functionality, exploit code, or malware execution capability will not be accepted.

---

## License

[MIT](LICENSE) — © 2025 Martin Matysek

---

## GitHub Topics

If you fork or star this repo, suggested topics:
`cybersecurity` · `soc` · `blue-team` · `threat-hunting` · `incident-response` · `sigma` · `yara` · `suricata` · `zeek` · `splunk` · `elasticsearch` · `fastapi` · `react` · `mcp` · `ai-security`
