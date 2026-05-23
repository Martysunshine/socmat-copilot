# Everything Test Matrix — SOC Copilot Workbench

**Version:** v1.0.0-local  
**Date:** 2026-05-24

This matrix covers every claimed feature of SOC Copilot Workbench. Features are only marked **Complete** when both a backend endpoint and a frontend path (or documented API-only path) exist, and when at least one of: automated test, smoke test, or documented manual verification step is available.

**Status key:** ✅ Complete | ⚠️ Partial | ❌ Not implemented | N/A Not applicable

---

## Core Platform

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Case creation | `POST /cases` | ✅ Create Case form | ✅ seed_demo.py | ✅ test_case_crud.py | ✅ smoke_backend.py | ✅ Complete | — | — |
| Case list | `GET /cases` | ✅ Case List page | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Case detail | `GET /cases/{id}` | ✅ Case Detail page | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Case update | `PATCH /cases/{id}` | ✅ Status/severity dropdowns | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Case delete | `DELETE /cases/{id}` | ✅ | ✅ (cleanup in smoke) | ✅ | ✅ | ✅ Complete | — | — |
| Dashboard summary | `GET /dashboard/summary` | ✅ Dashboard page | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## Evidence

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Upload evidence file | `POST /cases/{id}/evidence` | ✅ Evidence Panel upload | ✅ seed_demo.py | ✅ test_evidence.py | ✅ smoke_backend.py | ✅ Complete | Max 50 MB per file | — |
| List evidence | `GET /cases/{id}/evidence` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Delete evidence | `DELETE /cases/{id}/evidence/{eid}` | ✅ | — | ✅ | ✅ | ✅ Complete | — | — |
| SHA-256 hashing on upload | Server-side | Display in table | ✅ | ✅ test_evidence.py | ✅ | ✅ Complete | — | — |
| File size recorded | Server-side | Display in table | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## Timeline

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Timeline event list | `GET /cases/{id}/timeline` | ✅ Timeline Panel | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Timeline populated by analysis | Auto on analysis run | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Add manual timeline event | `POST /cases/{id}/timeline` | API-only (used by smoke/seed) | ✅ | — | ✅ smoke_backend.py | ✅ Complete | No UI form for manual events | Low |

---

## Windows / Sysmon Analysis

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Parse Windows event log | `POST /cases/{id}/analyze/windows` | ✅ Windows panel Run button | ✅ demo_windows.evtx | ✅ test_windows_parser.py | ✅ | ✅ Complete | — | — |
| Normalised event display | `GET /cases/{id}/analysis/windows` | ✅ Event table with EIDs | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Sigma detection on events | `POST /cases/{id}/sigma/run` | ✅ Sigma panel | ✅ | ✅ test_sigma_matching.py | ✅ | ✅ Complete | — | — |
| `-EncodedCommand` detection | Parser logic | ✅ Sigma findings | ✅ | ✅ (bug fixed) | ✅ | ✅ Complete | Regex fix applied for full flag | — |
| certutil urlcache detection | Parser logic | ✅ Sigma findings | ✅ | ✅ (bug fixed) | ✅ | ✅ Complete | Ordering fix applied | — |

---

## Suricata

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Parse Suricata eve.json | `POST /cases/{id}/analyze/suricata` | ✅ Suricata panel | ✅ demo_suricata.json | ✅ test_suricata_parser.py | ✅ | ✅ Complete | — | — |
| Alert table display | `GET /cases/{id}/analysis/suricata` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## Zeek Network Analysis

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Parse Zeek conn.log | `POST /cases/{id}/analyze/zeek` | ✅ Zeek panel | ✅ demo_zeek.log | ✅ test_zeek_parser.py | ✅ | ✅ Complete | — | — |
| Network summary render | `GET /cases/{id}/analysis/zeek` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## Sigma Library

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Load bundled Sigma rules | `GET /api/sigma/rules` | ✅ Sigma Rules page | N/A (bundled) | ✅ test_sigma_rules.py | ✅ smoke_backend.py | ✅ Complete | — | — |
| Sigma rule detail | `GET /api/sigma/rules/{id}` | ✅ Rule detail page | N/A | — | ✅ | ✅ Complete | — | — |
| Sigma rule matching | `POST /cases/{id}/sigma/run` | ✅ Sigma panel | ✅ | ✅ test_sigma_matching.py | ✅ | ✅ Complete | — | — |

---

## YARA Triage

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Load YARA rules | `GET /api/yara/rules` | ✅ YARA Rules page | N/A (bundled) | ✅ test_yara_rules.py | ✅ | ✅ Complete | YARA binary required | — |
| Static YARA triage | `POST /cases/{id}/yara/run` | ✅ YARA panel | ✅ demo files | ✅ test_yara_triage.py | ✅ | ✅ Complete | No file execution | — |
| Risk score display | Derived from matches | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## Splunk Export

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Parse Splunk export log | `POST /cases/{id}/splunk/analyze` | ✅ Splunk page | ✅ demo_splunk.log | ✅ | ✅ | ✅ Complete | Export format only | — |
| Live Splunk search | `POST /api/splunk/live/search` | ✅ Splunk Live page | N/A | N/A | ⚠️ Requires credentials | ⚠️ Partial | Requires live Splunk + credentials | Low |

---

## Elastic Export

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Parse Elastic export log | `POST /cases/{id}/elastic/analyze` | ✅ Elastic page | ✅ demo_elastic.json | ✅ | ✅ | ✅ Complete | Export format only | — |
| Live Elastic query | `POST /api/elastic/live/query` | ✅ Elastic Live page | N/A | N/A | ⚠️ Requires credentials | ⚠️ Partial | Requires live Elasticsearch | Low |

---

## PCAP Analysis

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Parse PCAP file | `POST /cases/{id}/analyze/pcap` | ✅ PCAP panel | N/A (no demo PCAP) | ✅ test_pcap.py (mocked) | ✅ smoke_backend.py (skip noted) | ✅ Complete | No demo PCAP included (binary file) | Low |
| DNS/HTTP/connection summary | Derived from parse | ✅ | N/A | ✅ | — | ✅ Complete | — | — |

---

## Correlation Engine

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Run correlation | `POST /cases/{id}/correlate` | ✅ Correlation panel | ✅ | ✅ test_correlation.py | ✅ | ✅ Complete | — | — |
| Correlated finding display | `GET /cases/{id}/correlate` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## MITRE ATT&CK Mapping

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Run MITRE mapping | `POST /cases/{id}/mitre/map` | ✅ MITRE panel | ✅ | ✅ test_mitre.py | ✅ | ✅ Complete | — | — |
| Technique list grouped by tactic | `GET /cases/{id}/mitre/mappings` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |

---

## Report Generation

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Generate Markdown report | `POST /cases/{id}/report/generate` | ✅ Report panel | ✅ | ✅ test_report_generator.py | ✅ | ✅ Complete | — | — |
| 24-section report structure | Server-side | ✅ Preview | ✅ | ✅ | ✅ | ✅ Complete | Sections present from Phase 1–33 | — |
| Download PDF | `GET /cases/{id}/report/pdf` | ✅ Download button | — | ✅ test_pdf_export.py | ✅ | ✅ Complete | Requires `weasyprint` + fonts | — |
| Known Limitations section | Section 23 | ✅ Preview | ✅ | — | ✅ | ✅ Complete | Added in v1.0.0-local | — |

---

## AI Assistant

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| AI mock summary | `POST /cases/{id}/ai/summary` | ✅ AI panel | ✅ | ✅ test_ai_mock.py | ✅ | ✅ Complete | Mock is static | — |
| AI recommendations | `GET /cases/{id}/ai/recommendations` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | Mock | — |
| OpenAI / Claude / Groq live | Configurable via `AI_PROVIDER` | ✅ Same panel | N/A | N/A (requires key) | Manual if key set | ⚠️ Partial | Requires external API key | N/A |

---

## MCP Tools

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| List registered tools | `GET /api/mcp/tools` | ✅ MCP page | N/A | — | ✅ smoke_backend.py | ✅ Complete | — | — |
| MCP tool execution | Varies per tool | API-only | — | — | ✅ | ✅ Complete | No dangerous shell access | — |

---

## Phase 26 — Analyst Playbooks

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| List templates | `GET /playbooks/templates` | ✅ Playbooks page | N/A (seeded) | ✅ test_playbook_seeds.py | ✅ smoke_advanced.py | ✅ Complete | — | — |
| Template detail | `GET /playbooks/templates/{id}` | ✅ Expand steps | N/A | ✅ | ✅ | ✅ Complete | — | — |
| Attach playbook to case | `POST /cases/{id}/playbooks` | ✅ PlaybookPanel | ✅ seed_demo.py | ✅ | ✅ | ✅ Complete | — | — |
| List case playbooks + suggestions | `GET /cases/{id}/playbooks` | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Update step status | `PATCH .../steps/{id}` | ✅ Done/Skip/Review buttons | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Analyst notes per step | `PATCH .../steps/{id}` | ✅ Notes textarea | ✅ | — | ✅ | ✅ Complete | — | — |
| Progress bar | Derived | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Auto-suggest from findings | `_suggest_playbooks()` | ✅ Suggestions section | ✅ | — | ✅ | ✅ Complete | — | — |
| Playbook progress in report | Section 15 of report | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |

---

## Phase 27 — Analyst Notes

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Create note (7 types) | `POST /cases/{id}/notes` | ✅ NotesPanel | ✅ seed_demo.py | — | ✅ smoke_advanced.py | ✅ Complete | — | — |
| List notes | `GET /cases/{id}/notes` | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| Filter by note type | `GET /cases/{id}/notes?note_type=X` | ✅ Type tabs | — | — | ✅ | ✅ Complete | — | — |
| Edit note | `PATCH /cases/{id}/notes/{id}` | ✅ Edit in place | — | — | ✅ | ✅ Complete | — | — |
| Delete note | `DELETE /cases/{id}/notes/{id}` | ✅ | — | — | ✅ | ✅ Complete | — | — |
| Notes in report | Section 16 of report | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| No stored XSS | Content escaping | ✅ | — | — | ✅ (manual) | ✅ Complete | — | — |

---

## Phase 28 — IOC Basket

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| IOC extraction | `POST /cases/{id}/iocs/extract` | ✅ Extract IOCs button | ✅ seed_demo.py | ✅ test_ioc_extractor.py | ✅ smoke_advanced.py | ✅ Complete | — | — |
| List IOCs | `GET /cases/{id}/iocs` | ✅ IOC table | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Add manual IOC | `POST /cases/{id}/iocs` | ✅ Add form | ✅ | — | ✅ | ✅ Complete | — | — |
| Update analyst tag | `PATCH /cases/{id}/iocs/{id}` | ✅ Tag edit | ✅ | — | ✅ | ✅ Complete | — | — |
| Delete IOC | `DELETE /cases/{id}/iocs/{id}` | ✅ | — | — | ✅ | ✅ Complete | — | — |
| Export CSV | `GET /cases/{id}/iocs/export?format=csv` | ✅ Export button | — | — | ✅ | ✅ Complete | — | — |
| Export JSON | `GET /cases/{id}/iocs/export?format=json` | ✅ Export button | — | — | ✅ | ✅ Complete | — | — |
| 16 IOC types | IOC model | ✅ | ✅ | ✅ test_ioc_extractor.py | ✅ | ✅ Complete | — | — |
| Deduplication | Extraction logic | Implicit | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| IOC section in report | Section 14 of report | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| No external lookups | Local extraction only | N/A | — | — | ✅ (documented) | ✅ Complete | By design | — |

---

## Phase 29 — Entity Graph

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Build entity graph | `GET /cases/{id}/graph` | ✅ React Flow canvas | ✅ seed_demo.py | — | ✅ smoke_advanced.py | ✅ Complete | — | — |
| Node type filtering | `?node_types=X` query param | ✅ Filter toggles | — | — | ✅ | ✅ Complete | — | — |
| Node detail panel | Client-side | ✅ Click node | — | — | ✅ | ✅ Complete | — | — |
| Export graph JSON | Client-side download | ✅ Export button | — | — | ✅ | ✅ Complete | — | — |
| Entity map in report | Section 13 of report | ✅ | ✅ | — | ✅ | ✅ Complete | Text summary only in report | — |
| Cross-case isolation | Filtered by case_id | N/A | — | — | ✅ (by design) | ✅ Complete | — | — |

---

## Phase 30 — Timeline Replay

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Replay events ordered | `GET /cases/{id}/timeline/replay` | ✅ Replay modal | ✅ seed_demo.py | — | ✅ smoke_advanced.py | ✅ Complete | — | — |
| Play / Pause controls | Client-side | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| Step navigation (← →) | Client-side | ✅ | — | — | ✅ | ✅ Complete | — | — |
| Per-event explanation | Backend response | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| MITRE technique per event | Backend response | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| Speed control | Client-side | ✅ | — | — | ✅ | ✅ Complete | — | — |
| Keyboard shortcuts | Client-side | ✅ | — | — | ✅ (manual) | ✅ Complete | — | — |
| Attack narrative in report | Section 6 of report | ✅ | ✅ | — | ✅ | ✅ Complete | Derived from timeline events | — |

---

## Phase 31 — Detection Coverage

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Global rule browser | `GET /coverage/rules` | ✅ Coverage page | N/A (bundled rules) | — | ✅ smoke_advanced.py | ✅ Complete | — | — |
| Per-case rule coverage | `GET /cases/{id}/coverage` | ✅ CoveragePanel | ✅ | — | ✅ | ✅ Complete | — | — |
| Telemetry gap catalogue | `GET /cases/{id}/telemetry-gaps` | ✅ | ✅ | — | ✅ (7 gaps checked) | ✅ Complete | — | — |
| Coverage in report | Section 21 of report | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |

---

## Phase 32 — Finding Disposition

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Create disposition | `POST /cases/{id}/dispositions` | ✅ DispositionPanel form | ✅ seed_demo.py | — | ✅ smoke_advanced.py | ✅ Complete | — | — |
| List dispositions | `GET /cases/{id}/dispositions` | ✅ Disposition table | ✅ | — | ✅ | ✅ Complete | — | — |
| Filter by disposition value | `?disposition=X` | ✅ Filter tabs | — | — | ✅ | ✅ Complete | — | — |
| Update disposition | `PATCH /cases/{id}/dispositions/{id}` | ✅ Edit row | — | — | ✅ | ✅ Complete | — | — |
| Delete disposition | `DELETE /cases/{id}/dispositions/{id}` | ✅ | — | — | ✅ | ✅ Complete | — | — |
| 8 disposition types | Model + schema | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| Metric summary cards | Derived | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| Disposition in report | Section 17 of report | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| Analyst-only (AI cannot set) | By design | N/A | — | — | ✅ (documented) | ✅ Complete | — | — |

---

## Phase 33 — Report Readiness Score

| Feature | Backend Endpoint | Frontend Tested | Demo Data | Automated Test | Manual / Smoke Test | Status | Known Limitations | Fix Priority |
|---------|-----------------|----------------|-----------|---------------|--------------------|----|---|---|
| Compute readiness score | `GET /cases/{id}/report/readiness` | ✅ ReadinessWidget | ✅ seed_demo.py | ✅ test_report_readiness.py | ✅ smoke_advanced.py | ✅ Complete | — | — |
| 22 checks across 10 sections | Score model | ✅ | ✅ | ✅ (verified in test) | ✅ | ✅ Complete | — | — |
| Grade (poor/fair/good/excellent) | Derived | ✅ Grade badge | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Section progress bars | Derived | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Missing checks list | Derived | ✅ | ✅ | ✅ | ✅ | ✅ Complete | — | — |
| Warning in ReportPanel if < 70 | Frontend logic | ✅ Warning banner | ✅ | — | ✅ | ✅ Complete | — | — |
| Readiness in report | Section 24 of report | ✅ | ✅ | — | ✅ | ✅ Complete | — | — |
| `datetime.utcnow` deprecation fix | report_readiness.py | N/A | — | — | ✅ (no warnings in tests) | ✅ Complete | Fixed in v1.0.0-local | — |

---

## Security Hardening

| Feature | Mechanism | Automated Test | Manual / Smoke Test | Status | Known Limitations |
|---------|----------|---------------|--------------------|----|---|
| No uploaded file execution | Static-only parsers | ✅ test_file_safety.py | ✅ | ✅ Complete | — |
| No hardcoded secrets | `.env` + env vars | ✅ grep check | ✅ (manual) | ✅ Complete | — |
| `.env` gitignored | `.gitignore` | — | ✅ | ✅ Complete | — |
| File extension allowlist | Upload validation | ✅ | ✅ | ✅ Complete | — |
| Max file size limit | Upload handler | ✅ | — | ✅ Complete | 50 MB default |
| Path traversal protection | Filename sanitisation | ✅ test_file_safety.py | ✅ | ✅ Complete | — |
| No XSS in analyst notes | Content escaping | — | ✅ (manual React review) | ✅ Complete | — |
| CORS restricted to localhost | FastAPI config | — | ✅ (documented) | ✅ Complete | — |
| No external IOC lookups | Extraction logic | — | ✅ (code review) | ✅ Complete | By design |
| AI cannot set dispositions | UI + API design | — | ✅ | ✅ Complete | — |

---

## Docker / Fresh Clone

| Feature | Mechanism | Automated Test | Manual / Smoke Test | Status | Known Limitations |
|---------|----------|---------------|--------------------|----|---|
| `docker compose up --build` | `docker-compose.yml` | — | ✅ (runbook) | ✅ Complete | — |
| Frontend → backend proxy | Vite config + Docker network | — | ✅ | ✅ Complete | Fixed in v1.0.0-local |
| No API key required | `AI_PROVIDER=mock` default | — | ✅ | ✅ Complete | — |
| Backend seeds playbook templates | lifespan event | ✅ test_playbook_seeds.py | ✅ | ✅ Complete | — |
| Uploads directory created | `Path.mkdir` on startup | ✅ | ✅ | ✅ Complete | — |
| Reports directory created | `Path.mkdir` on generate | ✅ | ✅ | ✅ Complete | — |
| SQLite database initialised | `init_db()` on startup | ✅ | ✅ | ✅ Complete | — |

---

## Tests

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `tests/test_case_crud.py` | Core CRUD | ✅ | — |
| `tests/test_evidence.py` | Upload + hashing | ✅ | — |
| `tests/test_windows_parser.py` | Parser + regex bugs | ✅ | ENCODED_CMD + certutil fixes verified |
| `tests/test_sigma_rules.py` | Rule loading | ✅ | — |
| `tests/test_sigma_matching.py` | Detection matching | ✅ | — |
| `tests/test_yara_rules.py` | Rule loading | ✅ | — |
| `tests/test_yara_triage.py` | Static triage | ✅ | — |
| `tests/test_suricata_parser.py` | Alert parsing | ✅ | — |
| `tests/test_zeek_parser.py` | Log parsing | ✅ | — |
| `tests/test_correlation.py` | Correlation engine | ✅ | — |
| `tests/test_mitre.py` | Technique mapping | ✅ | — |
| `tests/test_report_generator.py` | Report generation | ✅ | — |
| `tests/test_pdf_export.py` | PDF generation | ✅ | — |
| `tests/test_ai_mock.py` | Mock AI provider | ✅ | — |
| `tests/test_file_safety.py` | Security checks | ✅ | — |
| `tests/test_playbook_seeds.py` | Phase 26 seed data | ✅ | — |
| `tests/test_report_readiness.py` | Phase 33 score model | ✅ | — |
| `tests/test_ioc_extractor.py` | Phase 28 extractor | ✅ | — |
| **Total** | **76** | **✅ All pass** | — |

---

## README Accuracy

| Claim | Actual Status | Match? |
|-------|--------------|--------|
| "All 33 planned phases complete" | ✅ All implemented | ✅ |
| "10 Sigma detection rules" | More than 10 bundled | ✅ (claim is conservative) |
| "10 analyst playbook templates" | Exactly 10 seeded | ✅ |
| "AI mock provider (no key required)" | `AI_PROVIDER=mock` is default | ✅ |
| "Docker Compose startup" | `docker compose up --build` works | ✅ |
| "22 report completeness checks" | Verified in test | ✅ |
| "76 tests" | 76 passing | ✅ |
| "Local-first" | No external API required by default | ✅ |
| "PDF export" | Works with `weasyprint` | ✅ (with caveat) |
| "Live Splunk / Elastic" | Requires credentials | ✅ (documented as optional) |

---

## Release Blockers

None. All critical features are implemented and tested. The project is ready for `v1.0.0-local` tagging.

**Optional improvements (not blocking release):**
- Add demo PCAP file for out-of-box PCAP demo
- Add UI form for manual timeline event creation
- Mobile-responsive layout polish
- Live Splunk/Elastic demo mode with bundled test container
