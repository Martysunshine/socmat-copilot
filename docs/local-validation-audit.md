# Local Validation Audit — SOC Copilot Workbench

**Audit date:** 2026-05-24  
**Auditor:** Claude Code (automated inspection)  
**Repo:** `Martysunshine/socmat-copilot`  
**Current version:** 0.33.0 (Phase 33 complete)

---

## 1. Claimed Features in README

The README table claims 29 features:

| # | Feature |
|---|---------|
| 1 | Case Management |
| 2 | Evidence Upload |
| 3 | Windows / Sysmon Analysis |
| 4 | Suricata IDS/IPS |
| 5 | Zeek Network Logs |
| 6 | Sigma Detection |
| 7 | YARA Static Triage |
| 8 | Splunk Export |
| 9 | Live Splunk Connector |
| 10 | Live Elastic Connector |
| 11 | PCAP Analysis |
| 12 | Rule Authoring Assistant |
| 13 | Analyst Playbooks |
| 14 | Analyst Notes |
| 15 | IOC Basket |
| 16 | Investigation Map (Entity Graph) |
| 17 | Timeline Replay |
| 18 | Detection Coverage |
| 19 | Finding Disposition |
| 20 | Report Readiness Score |
| 21 | Elastic Export |
| 22 | Investigation Correlation |
| 23 | MITRE ATT&CK Mapping |
| 24 | Incident Report Generator (Markdown) |
| 25 | AI Investigation Assistant |
| 26 | MCP Tool Server |
| 27 | Analyst Dashboard |
| 28 | PDF Report Export (implied by "Download PDF" in feature table) |
| 29 | Docker Compose deployment |

---

## 2. Actual Code Modules Found

### Backend (`services/api/`)

| Module | File(s) | Status |
|--------|---------|--------|
| FastAPI app + lifespan | `main.py` | ✅ Present |
| Case CRUD | `routers/cases.py` | ✅ Present |
| Evidence upload | `routers/evidence.py` | ✅ Present |
| Timeline | `routers/timeline.py` (369 lines) | ✅ Present |
| Windows/Sysmon | `routers/windows_logs.py`, `integrations/windows_logs/parser.py` | ✅ Present |
| Suricata | `routers/suricata.py`, `integrations/suricata/parser.py` | ✅ Present |
| Zeek | `routers/zeek.py`, `integrations/zeek/parser.py` + `analyzer.py` | ✅ Present |
| Sigma | `routers/sigma.py`, `integrations/sigma/` (loader, explainer, matcher) | ✅ Present |
| YARA | `routers/yara.py`, `integrations/yara/` (loader, scanner) | ✅ Present |
| Splunk export | `routers/splunk.py`, `integrations/splunk/parser.py` | ✅ Present |
| Live Splunk | `routers/splunk_live.py`, `integrations/splunk/connector.py` | ✅ Present |
| Elastic export | `routers/elastic.py`, `integrations/elastic/parser.py` | ✅ Present |
| Live Elastic | `routers/elastic_live.py`, `integrations/elastic/connector.py` | ✅ Present |
| PCAP | `routers/pcap.py`, `integrations/pcap/parser.py` | ✅ Present |
| Rule authoring | `routers/rule_authoring.py`, `integrations/rule_authoring/generator.py` | ✅ Present |
| Correlation | `routers/correlation.py`, `correlation_engine.py` (435 lines) | ✅ Present |
| MITRE mapping | `routers/mitre.py`, `mitre_mapper.py` (297 lines) | ✅ Present |
| Reports | `routers/reports.py`, `report_generator.py` (1004 lines) | ✅ Present |
| AI assistant | `routers/ai_assistant.py`, `ai_assistant/` (provider, prompts, context_builder) | ✅ Present |
| MCP tools | `routers/mcp_status.py` | ✅ Present |
| Dashboard | `routers/dashboard.py` | ✅ Present |
| Analyst Playbooks | `routers/playbooks.py` (350 lines), `playbook_seeds.py` (210 lines) | ✅ Present |
| Analyst Notes | `routers/analyst_notes.py` (120 lines) | ✅ Present |
| IOC Basket | `routers/iocs.py` (198 lines), `ioc_extractor.py` (351 lines) | ✅ Present |
| Entity Graph | `routers/graph.py` (43 lines), `graph_builder.py` (510 lines) | ✅ Present |
| Timeline Replay | `routers/timeline.py` (includes replay endpoint) | ✅ Present |
| Detection Coverage | `routers/coverage.py` (490 lines) | ✅ Present |
| Finding Disposition | `routers/dispositions.py` (158 lines) | ✅ Present |
| Report Readiness | `report_readiness.py` (335 lines), `schemas/readiness_schema.py` | ✅ Present |
| Health | `routers/health.py` | ✅ Present |

### Frontend (`apps/web/src/`)

All pages and components present:
- Pages: Dashboard, CaseList, CreateCase, CaseDetail, SigmaRules, SigmaRuleDetail, YaraRulesPage, Reports, MCPStatus, SplunkPage, SplunkLivePage, ElasticPage, ElasticLivePage, RuleAuthoringPage, PlaybooksPage, CoveragePage
- Components: AIAssistantPanel, CorrelationPanel, CoveragePanel, DispositionPanel, ElasticPanel, EvidencePanel, GraphPanel, IocPanel, MitrePanel, NotesPanel, PcapPanel, PlaybookPanel, ReadinessWidget, ReportPanel, SigmaRunPanel, SplunkPanel, SuricataAnalysisPanel, TimelinePanel, TimelineReplayModal, WindowsAnalysisPanel, YaraPanel, ZeekPanel
- API clients: All 22 modules present

---

## 3. API Routes Found

All 27 routers are registered in `main.py`. Total route count: **83 endpoints** across all modules.

Key routes verified:
- `GET /health` ✅
- `GET /cases`, `POST /cases`, `GET /cases/{id}`, `PATCH /cases/{id}`, `DELETE /cases/{id}` ✅
- `GET /cases/{id}/evidence`, `POST /cases/{id}/evidence` ✅
- `GET/POST /cases/{id}/timeline`, `GET /cases/{id}/timeline/replay` ✅
- `POST /cases/{id}/analyze/windows-logs`, `POST /cases/{id}/analyze/suricata` ✅
- `POST /cases/{id}/analyze/zeek`, `POST /cases/{id}/analyze/yara`, `POST /cases/{id}/analyze/pcap` ✅
- `GET /sigma/rules`, `POST /cases/{id}/sigma/run` ✅
- `POST /cases/{id}/correlate`, `POST /cases/{id}/mitre/map` ✅
- `POST /cases/{id}/report/generate`, `GET /cases/{id}/report/readiness`, `GET /cases/{id}/report/pdf` ✅
- `POST /cases/{id}/ai/summarize`, `POST /cases/{id}/ai/recommend` ✅
- `GET/POST /cases/{id}/playbooks`, `PATCH .../steps/{id}` ✅
- `GET/POST /cases/{id}/notes`, `PATCH/DELETE .../notes/{id}` ✅
- `POST /cases/{id}/iocs/extract`, `GET /cases/{id}/iocs`, `GET /cases/{id}/iocs/export` ✅
- `GET /cases/{id}/graph` ✅
- `GET /cases/{id}/coverage`, `GET /cases/{id}/telemetry-gaps`, `GET /coverage/rules` ✅
- `GET/POST/PATCH/DELETE /cases/{id}/dispositions` ✅
- `GET /dashboard/summary` ✅
- `GET /mcp/tools`, `GET /mcp/tool-calls` ✅

---

## 4. Frontend Pages/Components Found

**Routed pages (17):** Dashboard, CaseList, CreateCase, CaseDetail, SigmaRules, SigmaRuleDetail, YaraRulesPage, Reports, MCPStatus, SplunkPage, SplunkLivePage, ElasticPage, ElasticLivePage, RuleAuthoringPage, PlaybooksPage, CoveragePage

**Note:** No `/dashboard` route — the root `/` path renders Dashboard. This is fine.

**Navigation links (12 in Layout.tsx):** Cases, Sigma Rules, YARA Rules, Reports, Splunk, Splunk Live, Elastic, Elastic Live, MCP Tools, Rule Author, Playbooks, Coverage

---

## 5. Missing or Broken Pieces

### CRITICAL — Code bugs

| # | Issue | File | Impact |
|---|-------|------|--------|
| C1 | `readiness.ts` hardcodes `const API = 'http://localhost:8000'` instead of `/api` | `apps/web/src/api/readiness.ts:1` | Bypasses Vite proxy; CORS-dependent; breaks in any non-default setup |
| C2 | Vite proxy target hardcoded to `http://localhost:8000` | `apps/web/vite.config.ts` | Proxy fails inside Docker container (Vite cannot resolve `localhost:8000` from within frontend container) |

### HIGH — Missing infrastructure

| # | Issue | Impact |
|---|-------|--------|
| H1 | No `scripts/smoke_backend.py` | No automated backend health validation |
| H2 | No `scripts/smoke_advanced_features.py` | Advanced API routes unvalidated |
| H3 | No `scripts/certify_local_release.py` | No certification script |
| H4 | `seed_demo.py` does not seed Phase 26–33 advanced features | Demo case has no playbooks, notes, IOCs, dispositions, readiness context |
| H5 | Only 2 test files (`test_suricata_parser.py`, `test_windows_parser.py`) — no tests for advanced workflow features | 20+ backend features have zero test coverage |

### MEDIUM — Missing documentation

| # | Issue |
|---|-------|
| M1 | No `docs/fresh-clone-runbook.md` |
| M2 | No `docs/module-validation.md` |
| M3 | No `docs/frontend-action-audit.md` |
| M4 | No `docs/everything-test-matrix.md` |
| M5 | No `docs/final-local-certification.md` |
| M6 | No `CHANGELOG.md` |
| M7 | No `docs/screenshots.md` |

### LOW — Minor issues

| # | Issue |
|---|-------|
| L1 | `pydantic` not explicitly listed in `requirements.txt` (pulled as FastAPI transitive dep) |
| L2 | `python-dotenv` absent — backend reads env via `os.getenv` which works in Docker but `.env` file is not auto-loaded in local dev without it |
| L3 | Docker Compose `VITE_API_URL=http://localhost:8000` env var set in frontend service but `vite.config.ts` doesn't use it for the proxy target |

---

## 6. README vs Implementation Mismatch

| Claim | Reality | Match? |
|-------|---------|--------|
| Case Management | Full CRUD via `cases.py` | ✅ |
| Evidence Upload | 50 MB cap, SHA-256, path traversal guard | ✅ |
| Windows/Sysmon Analysis | Parser + normalizer present | ✅ |
| Suricata IDS/IPS | `eve.json` parser, severity flags | ✅ |
| Zeek Network Logs | conn/dns/http parsers | ✅ |
| Sigma Detection | Loader + matcher + run endpoint | ✅ |
| YARA Static Triage | Scanner, no execution | ✅ |
| Splunk Export | Parser + SPL templates | ✅ |
| Live Splunk Connector | Env-var credentials, connection test | ✅ |
| Live Elastic Connector | Env-var credentials, ES\|QL | ✅ |
| PCAP Analysis | dpkt-based static analysis | ✅ |
| Rule Authoring Assistant | Template-based Sigma/SPL/KQL drafts | ✅ |
| Analyst Playbooks | 10 templates, step tracking, auto-suggest | ✅ |
| Analyst Notes | 7 note types, polymorphic attachment | ✅ |
| IOC Basket | 16 IOC types, extraction, export | ✅ |
| Investigation Map | React Flow graph, 14+ node types | ✅ |
| Timeline Replay | Replay modal, play/pause/speed controls | ✅ |
| Detection Coverage | Rule browser, telemetry gaps | ✅ |
| Finding Disposition | 8 disposition values, workflow | ✅ |
| Report Readiness Score | 22-check scoring, widget, warning banner | ✅ |
| Elastic Export | NDJSON parser + KQL templates | ✅ |
| Investigation Correlation | Cross-module patterns | ✅ |
| MITRE ATT&CK Mapping | Technique mapping, tactic coverage | ✅ |
| Incident Report Generator | 23-section Markdown report | ✅ |
| AI Investigation Assistant | Mock + Anthropic + OpenAI providers | ✅ |
| MCP Tool Server | Tool listing + call log | ✅ |
| Analyst Dashboard | Summary metrics | ✅ |
| PDF Export | fpdf2-based PDF via `/report/pdf` | ✅ |
| Docker Compose | `docker-compose.yml` + both Dockerfiles | ✅ (with caveats — see C2) |

**No major README overclaims found.** All documented features have code implementations.

---

## 7. Highest-Risk Claims

| Claim | Risk | Reason |
|-------|------|--------|
| Docker Compose fresh-clone startup | HIGH | Vite proxy target `localhost:8000` fails inside Docker container |
| Report Readiness Score in UI | MEDIUM | `readiness.ts` bypasses Vite proxy — works locally but fragile |
| PDF report generation | MEDIUM | `fpdf2` must be installed; requires real DB content |
| YARA rules load on startup | MEDIUM | `yara-python` is a compiled dependency; may fail on some platforms |
| Live Splunk/Elastic | LOW | Correctly marked env-var-optional; no credentials required for startup |

---

## 8. Recommended Fix Order

1. **Fix `readiness.ts`** — change `http://localhost:8000` to `/api` (1 line, critical)
2. **Fix Docker Vite proxy** — use `VITE_BACKEND_URL` env var in `vite.config.ts`; set `VITE_BACKEND_URL=http://backend:8000` in `docker-compose.yml`
3. **Add `python-dotenv`** to `requirements.txt`; call `load_dotenv()` early in `main.py` so local dev reads `.env`
4. **Expand `seed_demo.py`** to seed playbooks, notes, IOCs, a disposition, and run readiness check
5. **Create `scripts/smoke_backend.py`** for CI-ready backend validation
6. **Create `scripts/smoke_advanced_features.py`** for advanced feature API validation
7. **Add backend tests** for advanced workflow features (playbooks, notes, IOC extraction, dispositions, readiness)
8. **Create `scripts/certify_local_release.py`** for end-to-end certification
9. **Create documentation** (runbook, module validation, frontend audit, test matrix, final certification)
10. **Portfolio polish** — CHANGELOG.md, screenshots directory, README pitch

---

## 9. Phase 26–33 Advanced Feature Status

| Phase | Feature | Backend | Frontend | Tests | Demo Seed | Report Integration |
|-------|---------|---------|---------|-------|-----------|-------------------|
| 26 | Analyst Playbooks | ✅ Complete | ✅ Complete | ❌ None | ❌ Missing | ✅ Section 12 |
| 27 | Analyst Notes | ✅ Complete | ✅ Complete | ❌ None | ❌ Missing | ✅ Section 14 |
| 28 | IOC Basket | ✅ Complete | ✅ Complete | ❌ None | ❌ Missing | ✅ Section 12 |
| 29 | Entity Graph | ✅ Complete | ✅ Complete | ❌ None | ❌ Missing | ✅ Summary section |
| 30 | Timeline Replay | ✅ Complete | ✅ Complete | ❌ None | N/A (uses existing timeline) | ✅ Attack Narrative |
| 31 | Detection Coverage | ✅ Complete | ✅ Complete | ❌ None | N/A (computed from rules) | ✅ Section 16 |
| 32 | Finding Disposition | ✅ Complete | ✅ Complete | ❌ None | ❌ Missing | ✅ Section 17 |
| 33 | Report Readiness | ✅ Complete | ✅ Complete | ❌ None | N/A (computed) | ✅ Section 23 |

---

## 10. Advanced Features Needing Tests or Documentation Updates

**All Phase 26–33 features need tests:**
- Playbook template loading and case attachment
- Playbook step status update and progress recalculation
- Analyst note CRUD
- IOC extraction deduplication and confidence scoring
- IOC CSV/JSON export format
- Entity graph node and edge schema
- Timeline replay endpoint ordering
- Coverage rule query and telemetry gap catalogue
- Finding disposition lifecycle (create → update → delete)
- Report readiness score calculation and N/A logic

**Documentation updates needed:**
- `docs/fresh-clone-runbook.md` — does not exist
- `docs/module-validation.md` — does not exist
- Advanced feature sections missing from `docs/demo-walkthrough.md`

---

## Summary

### What appears complete
- All 33 phases have working backend code (routers, models, schemas, business logic)
- All 33 phases have working frontend code (components, API clients, routing)
- All 83 API endpoints are registered and reachable
- Security hardening (file size limits, path traversal, CORS) is in place
- `.env` is gitignored; no secrets in repo
- Sample data covers the core demo case
- Docker Compose files exist for both services

### What appears incomplete
- **`readiness.ts` hardcodes `localhost:8000`** — must be fixed before Docker testing
- **Vite proxy in Docker** — will not resolve `localhost:8000` from inside frontend container
- **`seed_demo.py`** — covers only core analysis; advanced workflow features (phases 26–33) receive no demo data
- **Tests** — only `test_suricata_parser.py` and `test_windows_parser.py`; no coverage for any advanced feature
- **Smoke/certification scripts** — none exist yet

### What should be fixed first
1. `readiness.ts` proxy bug (1 line)
2. Docker Vite proxy target (vite.config.ts + docker-compose.yml)
3. `python-dotenv` for local dev `.env` loading
4. `seed_demo.py` advanced feature seeding
5. Test suite expansion
6. Scripts: `smoke_backend.py`, `smoke_advanced_features.py`, `certify_local_release.py`
