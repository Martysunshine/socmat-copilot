# Architecture Overview

SOC Copilot Workbench is a local-first SOC analyst automation platform built in phases.

## Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React + Vite + TypeScript | Analyst workbench UI |
| Backend | Python FastAPI | REST API, analysis orchestration |
| Database | SQLite (MVP), PostgreSQL (later) | Case and evidence storage |
| Workers | Python async tasks | Background log analysis |
| Reports | Markdown → PDF | Incident report generation |
| Deployment | Docker Compose | Local development and demo |

## Service Layout

```
apps/web          →  TypeScript React SPA
services/api      →  FastAPI REST API (port 8000)
services/workers  →  Background analysis jobs (Phase 2+)
```

## Integration Modules (Phases 4–9)

Each integration is an isolated Python module under `integrations/`:

| Module | Phase | Purpose |
|--------|-------|---------|
| `integrations/windows_logs` | Phase 4 | Windows Event Log + Sysmon parser |
| `integrations/suricata` | Phase 5 | Suricata eve.json alert parser |
| `integrations/sigma` | Phase 6 | Sigma rule loader and explainer |
| `integrations/yara` | Phase 8 | YARA static file scanner |
| `integrations/zeek` | Phase 9 | Zeek conn/dns/http log parser |
| `integrations/splunk` | Phase 15 | Splunk CSV/JSON export parser |
| `integrations/elastic` | Phase 16 | Elastic NDJSON/JSON export parser |

## Data Flow (Target MVP)

```
Evidence Upload
      ↓
Parser (Windows / Suricata / Zeek / YARA)
      ↓
Normalized Events Table
      ↓
Sigma Matching + YARA Scan
      ↓
Detection Findings Table
      ↓
Correlation Engine
      ↓
MITRE ATT&CK Mapping
      ↓
Security Incident Report (Markdown)
```

## Frontend Pages (Target MVP)

| Page | Phase | Description |
|------|-------|-------------|
| Landing Dashboard | Phase 1 | Status overview and nav |
| Case List | Phase 2 | All investigation cases |
| Case Detail | Phase 2 | Evidence, timeline, findings |
| Sigma Rules | Phase 6 | Rule browser and explainer |
| YARA Rules | Phase 8 | Rule browser |
| Reports | Phase 12 | Generated incident reports |
| AI Assistant | Phase 13 | Case summarization panel |
| MCP Status | Phase 14 | Tool server status |

## Security Principles

- Uploaded files are **never executed** — static analysis only
- Path traversal protection on all file operations
- No hardcoded credentials
- CORS restricted to localhost in development
- SQLite database is local-only

## Phase 1 Current State

Only the skeleton exists. The frontend shows a landing dashboard. The backend exposes a single `/health` endpoint. No database, no case management, no analysis modules.
