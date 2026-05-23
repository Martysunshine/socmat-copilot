# Changelog — SOC Copilot Workbench

All notable changes are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [v1.0.0-local] — 2026-05-24

### Summary
First stable local-first release. All 33 planned phases complete. Full validation, test suite expansion, Docker fixes, and portfolio certification.

### Added
- `docs/local-validation-audit.md` — full codebase reality check with findings
- `docs/fresh-clone-runbook.md` — step-by-step guide from clone to demo
- `docs/module-validation.md` — per-module status for all 27 features
- `docs/frontend-action-audit.md` — every button and route audited
- `docs/everything-test-matrix.md` — complete feature coverage matrix
- `docs/final-local-certification.md` — release certification report
- `docs/screenshots.md` — recommended screenshot list for portfolio
- `scripts/smoke_backend.py` — 22-section backend API smoke test
- `scripts/smoke_advanced_features.py` — advanced feature API contract test
- `scripts/certify_local_release.py` — end-to-end local certification script
- `CHANGELOG.md` — this file
- Advanced feature controls section in `docs/security-model.md`
- Phase 26–33 demo seeding in `scripts/seed_demo.py`
- 3 new test files: `test_playbook_seeds.py`, `test_report_readiness.py`, `test_ioc_extractor.py`

### Fixed
- `apps/web/src/api/readiness.ts` — was hardcoding `http://localhost:8000`; changed to `/api` to use Vite proxy
- `apps/web/vite.config.ts` — proxy target now reads `VITE_BACKEND_URL` env var (defaults to `http://localhost:8000`), enabling Docker container-to-container routing
- `docker-compose.yml` — added Docker bridge network; sets `VITE_BACKEND_URL=http://backend:8000`; added `AI_PROVIDER=mock` to backend env
- `services/api/requirements.txt` — added `pydantic>=2.0` and `python-dotenv>=1.0.0`
- `services/api/main.py` — added `load_dotenv()` so `.env` is loaded in local dev
- `integrations/windows_logs/parser.py` — fixed `ENCODED_CMD_RE` to match full `-EncodedCommand` flag; fixed certutil urlcache finding ordering (specific rule now takes priority over generic LOLBIN rule)
- `services/api/report_readiness.py` — replaced deprecated `datetime.utcnow()` with `datetime.now(timezone.utc)`

### Changed
- `README.md` — updated demo scenario description; fixed stale "all 15 modules" claim; added smoke test / advanced test / certification commands to Testing section
- `scripts/seed_demo.py` — now seeds Phase 26–33 features (IOC extraction, playbooks, analyst notes, finding dispositions)
- Tests: 76 total (was 48) — all passing

---

## [0.33.0] — 2026-05-23

Phase 33: Report Readiness Score.

### Added
- 22-check completeness scoring system across 10 sections
- `GET /cases/{id}/report/readiness` endpoint
- `ReadinessWidget` component in case detail
- Warning banner in `ReportPanel` when score < 70
- Section 23 "Report Completeness" in generated Markdown reports
- `report_readiness` AI context key

---

## [0.32.0] — 2026-05-23

Phase 32: Finding Disposition and False Positive Review.

### Added
- Analyst-controlled disposition workflow for all finding types
- 8 disposition values, confidence levels, reason, analyst name, follow-up action
- Summary metric cards, filter by disposition
- Section 17 in generated reports
- `finding_dispositions` AI context key (advisory only)

---

## [0.31.0] — 2026-05-22

Phase 31: Detection Coverage and Telemetry Gap Analysis.

### Added
- Global `/coverage` rule browser with MITRE tags and logsource
- Per-case coverage analysis (triggered/not-triggered/blocked)
- 7-gap telemetry gap catalogue
- Section 16 "Detection Coverage" in generated reports
- `coverage_gaps` AI context key

---

## [0.30.0] — 2026-05-22

Phase 30: Attack Timeline Replay Mode.

### Added
- Interactive timeline replay modal with play/pause/speed controls
- Per-event explanations, recommended focus, MITRE mappings
- Keyboard shortcuts (← → space)
- Section 13 "Attack Narrative" in generated reports
- `timeline_narrative` AI context key

---

## [0.29.0] — 2026-05-21

Phase 29: Entity Graph and Investigation Map.

### Added
- React Flow interactive entity graph built from all case data
- 14+ node types, 14 edge types, per-type filter toggles
- Node/edge detail panel, export graph JSON
- Entity map summary section in generated reports

---

## [0.28.0] — 2026-05-20

Phase 28: IOC Extraction and IOC Basket.

### Added
- Automatic IOC extraction from all case data sources
- 16 IOC types with deduplication and confidence levels
- Analyst tagging, CSV/JSON export, manual add
- IOC section in generated reports

---

## [0.27.0] — 2026-05-19

Phase 27: Analyst Notes and Evidence Annotations.

### Added
- Polymorphic analyst notes attached to any case entity
- 7 note types with filter tabs
- Notes section in generated reports
- AI context treats notes as analyst opinion, not verified evidence

---

## [0.26.0] — 2026-05-18

Phase 26: Analyst Playbooks and Guided Investigation.

### Added
- 10 built-in step-by-step investigation playbooks
- Per-step status tracking, analyst notes per step
- Auto-suggestion from case findings
- Playbook progress section in generated reports

---

## [0.25.0] — 2026-05-17

Phase 25: Detection Rule Authoring Assistant.

### Added
- Template-based Sigma YAML, Splunk SPL, Elastic KQL/ES|QL drafts
- Auto event-type detection, false positive notes, validation warnings

---

## [0.24.0] — 2026-05-16

Phase 24: PCAP Network Traffic Analysis.

---

## [0.23.0] — 2026-05-15

Phase 23: Live Elastic Connector.

---

## [0.22.0] — 2026-05-14

Phase 22: Live Splunk Connector.

---

## [0.21.0] — 2026-05-13

Phase 21: PDF Report Export.

---

## [0.20.0] — 2026-05-12

Phase 20: GitHub-Ready README and Open Source Polish.

---

## [0.19.0] — 2026-05-11

Phase 19: Security Hardening and Safe Defaults.

---

## Earlier phases (1–18)

Phases 1–18 covered: Architecture, Case Management, Evidence/Timeline, Windows/Sysmon, Suricata, Sigma library, Sigma detection, YARA triage, Zeek, Correlation Engine, MITRE ATT&CK, Report Generator, AI Assistant, MCP Server, Splunk Export, Elastic Export, Dashboard, Testing/Demo.
