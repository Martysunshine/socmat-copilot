# SOC Copilot Workbench

A local-first, open-source defensive cybersecurity automation platform for SOC analyst workflows.

> **Defensive tool only.** This project is built for blue-team SOC analysts. It does not contain offensive functionality, exploit code, or malware execution.

---

## What Is This?

SOC Copilot Workbench is an interactive analyst workbench where you can:

- Create and manage investigation cases
- Upload and triage evidence (Windows logs, Sysmon, Suricata, Zeek, suspicious files)
- Run Sigma detection rules and YARA static triage
- Build investigation timelines
- Correlate findings across modules
- Map findings to MITRE ATT&CK
- Generate structured Security Incident Reports

**Status:** Phase 8 — YARA static malware triage. Zeek and other modules coming in subsequent phases.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | TypeScript + React + Vite |
| Backend | Python + FastAPI |
| Database | SQLite (Phase 2+) |
| Deployment | Docker Compose |
| Reports | Markdown (Phase 12+) |

---

## Quick Start — Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- (Optional) Docker + Docker Compose

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

Opens at http://localhost:5173

### Backend

```bash
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload
```

API available at http://localhost:8000  
Health check: http://localhost:8000/health

---

## Quick Start — Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000

---

## Project Structure

```
soc-copilot-workbench/
├── apps/
│   └── web/                  # React + Vite frontend
├── services/
│   ├── api/                  # FastAPI backend
│   └── workers/              # Background analysis workers (Phase 2+)
├── integrations/             # Log source parsers (Phases 4–9)
│   ├── splunk/
│   ├── elastic/
│   ├── sigma/
│   ├── yara/
│   ├── suricata/
│   └── zeek/
├── rules/
│   ├── sigma/                # Sigma YAML rules
│   └── yara/                 # YARA rules
├── sample-data/              # Safe sample evidence files
├── reports/generated/        # Generated incident reports
└── docs/                     # Architecture and module documentation
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/cases` | GET | List all cases |
| `/cases` | POST | Create a new case |
| `/cases/{id}` | GET | Get case by ID |
| `/cases/{id}` | PATCH | Update case fields |
| `/cases/{id}` | DELETE | Delete a case |
| `/cases/{id}/evidence` | GET | List evidence for a case |
| `/cases/{id}/evidence` | POST | Upload evidence file (multipart) |
| `/cases/{id}/timeline` | GET | List timeline events (chronological) |
| `/cases/{id}/timeline` | POST | Add a manual timeline event |
| `/cases/{id}/analyze/windows-logs` | POST | Run Windows/Sysmon log analysis on evidence file |
| `/cases/{id}/analyze/windows-logs` | GET | List normalized events for a case |
| `/cases/{id}/analyze/suricata` | POST | Run Suricata IDS/IPS alert analysis on evidence file |
| `/cases/{id}/analyze/suricata` | GET | List Suricata normalized events for a case |
| `/sigma/rules` | GET | List all Sigma rules (filterable by level, logsource, tag) |
| `/sigma/rules/{rule_id}` | GET | Get Sigma rule detail with human-readable explanation |
| `/sigma/rules/reload` | POST | Reload Sigma rules from disk |
| `/cases/{id}/sigma/rules` | POST | Attach Sigma rule to a case |
| `/cases/{id}/sigma/rules` | GET | List Sigma rules attached to a case |
| `/cases/{id}/sigma/run` | POST | Run Sigma rules against normalized events (`?rule_id=` optional) |
| `/cases/{id}/sigma/findings` | GET | List Sigma detection findings for a case |
| `/yara/rules` | GET | List all loaded YARA rules |
| `/yara/rules/reload` | POST | Reload YARA rules from disk |
| `/cases/{id}/analyze/yara` | POST | Run YARA static triage on an evidence file |
| `/cases/{id}/analyze/yara` | GET | List YARA triage results for a case |

Interactive API docs available at http://localhost:8000/docs

---

## Safety Notes

- This tool analyzes evidence **statically**. Uploaded files are never executed.
- Do not upload live malware outside of an isolated lab environment.
- Do not connect production SIEM credentials in development mode.
- This project is for **defensive** SOC workflows only.

---

## Roadmap

See [docs/architecture.md](docs/architecture.md) for the full planned architecture.

- [x] Phase 1: Architecture skeleton
- [x] Phase 2: Case management
- [x] Phase 3: Evidence upload and timeline
- [x] Phase 4: Windows/Sysmon log parser
- [x] Phase 5: Suricata IDS alert analysis
- [x] Phase 6: Sigma rule library
- [x] Phase 7: Basic Sigma matching
- [x] Phase 8: YARA static malware triage
- [ ] Phase 9: Zeek network log analysis
- [ ] Phase 10: Investigation correlation engine
- [ ] Phase 11: MITRE ATT&CK mapping
- [ ] Phase 12: Security Incident Report generator
- [ ] Phase 13: AI investigation assistant
- [ ] Phase 14: MCP tool server

---

## License

MIT
