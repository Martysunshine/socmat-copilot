# Module Validation — SOC Copilot Workbench

**Validated:** 2026-05-24  
**Version:** 0.33.0

Each module is assessed against: input, endpoint, frontend location, expected output, test data, and status. Status values: `working` | `partial` | `broken`.

---

## 1. Windows / Sysmon Log Parser

| Field | Value |
|-------|-------|
| Input required | JSON file — Windows Event Log or Sysmon events (array of objects with EventID, TimeCreated, etc.) |
| Endpoint | `POST /cases/{id}/analyze/windows-logs?evidence_id={eid}` |
| Frontend | Case detail → Analysis → Windows/Sysmon tab |
| Expected output | Normalized events, detection findings (EID 4625/4688/4624 etc.), timeline additions |
| Test data | `sample-data/demo-incident/windows-security.json`, `sysmon-events.json` |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ✅ `tests/test_windows_parser.py` |
| Manual verification | ✅ Demo seed populates data |
| Included in report | ✅ Section 6 (Evidence Reviewed) + timeline events |

---

## 2. Suricata IDS Alert Analysis

| Field | Value |
|-------|-------|
| Input required | Suricata `eve.json` (NDJSON lines with `event_type: "alert"`) |
| Endpoint | `POST /cases/{id}/analyze/suricata?evidence_id={eid}` |
| Frontend | Case detail → Analysis → Suricata tab |
| Expected output | Alert summaries, high-severity flags, attacker IPs, finding cards |
| Test data | `sample-data/demo-incident/suricata-alerts.json` |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ✅ `tests/test_suricata_parser.py` |
| Manual verification | ✅ Demo seed populates data |
| Included in report | ✅ Section 8 (Network Analysis) |

---

## 3. Zeek Network Log Analysis

| Field | Value |
|-------|-------|
| Input required | Zeek `conn.log`, `dns.log`, or `http.log` (TSV format) |
| Endpoint | `POST /cases/{id}/analyze/zeek` (body: `{"evidence_id": N}`) |
| Frontend | Case detail → Analysis → Zeek tab |
| Expected output | Connection records, C2 beacon flags, DNS anomalies, HTTP user agents |
| Test data | `sample-data/demo-incident/zeek-conn.log`, `zeek-dns.log`, `zeek-http.log` |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Demo seed populates data |
| Included in report | ✅ Section 8 (Network Analysis) |

---

## 4. Sigma Rule Library

| Field | Value |
|-------|-------|
| Input required | YAML rule files in `rules/sigma/custom/` |
| Endpoint | `GET /sigma/rules`, `GET /sigma/rules/{id}`, `POST /sigma/rules/reload` |
| Frontend | Top nav → Sigma Rules; Case detail → Sigma tab |
| Expected output | List of loaded rules with ID, title, level, tags, description |
| Test data | 5 built-in rules in `rules/sigma/custom/` |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None (loader logic covered indirectly by sigma/run tests) |
| Manual verification | ✅ `/sigma/rules` returns 5 rules after startup |
| Included in report | ✅ Section 7 (Detection Findings) |

---

## 5. Sigma Detection Matching

| Field | Value |
|-------|-------|
| Input required | Normalized events (from Windows/Sysmon parser); Sigma rules loaded |
| Endpoint | `POST /cases/{id}/sigma/run`, `GET /cases/{id}/sigma/findings` |
| Frontend | Case detail → Analysis → Sigma tab → Run Sigma Rules button |
| Expected output | Detection findings per matched rule, severity, matched fields |
| Test data | Demo incident Windows events |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Demo seed triggers run |
| Included in report | ✅ Section 7 (Detection Findings) |

---

## 6. YARA Static Malware Triage

| Field | Value |
|-------|-------|
| Input required | Any uploaded file (the bytes are scanned — file is never executed) |
| Endpoint | `POST /cases/{id}/analyze/yara` (body: `{"evidence_id": N}`) |
| Frontend | Case detail → Analysis → YARA tab |
| Expected output | Rule match list, risk score, matched strings |
| Test data | `sample-data/demo-incident/suspicious-payload.ps1.txt` |
| Current status | **working** (requires `yara-python` compiled dependency) |
| Fixes applied | None required |
| Automated test | ❌ None (safe mock-free test difficult without yara-python) |
| Manual verification | ✅ Demo seed triggers triage |
| Included in report | ✅ Section 8 (Malware Triage Findings) |
| Notes | If `yara-python` install fails on a platform, backend logs a warning and YARA triage returns empty results gracefully |

---

## 7. Splunk Export Analysis

| Field | Value |
|-------|-------|
| Input required | Splunk CSV or JSON export file |
| Endpoint | `POST /cases/{id}/analyze/splunk-export?evidence_id={eid}`, `GET /splunk/query-templates` |
| Frontend | Top nav → Splunk; Case detail → Splunk Export tab |
| Expected output | Parsed event table, SPL template list, query assistant |
| Test data | None included — analyst uploads their own export |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | Manual only — requires a Splunk export file |
| Included in report | ✅ If Splunk findings exist |

---

## 8. Live Splunk Connector

| Field | Value |
|-------|-------|
| Input required | `SPLUNK_URL` and `SPLUNK_TOKEN` environment variables |
| Endpoint | `GET /splunk/live/status`, `POST /splunk/live/search`, `POST /splunk/live/templates/{id}/run` |
| Frontend | Top nav → Splunk Live |
| Expected output | Connection status, search results, query history |
| Test data | N/A — requires live Splunk instance |
| Current status | **working** (returns `unconfigured` when env vars absent) |
| Fixes applied | None required |
| Automated test | ❌ None (requires live Splunk) |
| Manual verification | ✅ Status endpoint returns `unconfigured` without credentials |
| Included in report | ❌ Not applicable |

---

## 9. Elastic Export Analysis

| Field | Value |
|-------|-------|
| Input required | Kibana/Elasticsearch NDJSON export file |
| Endpoint | `POST /cases/{id}/analyze/elastic-export?evidence_id={eid}`, `GET /elastic/hunt-templates` |
| Frontend | Top nav → Elastic; Case detail → Elastic Export tab |
| Expected output | Parsed event table, ES\|QL template list |
| Test data | None included — analyst uploads their own export |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | Manual only — requires an Elastic export file |
| Included in report | ✅ If Elastic findings exist |

---

## 10. Live Elastic Connector

| Field | Value |
|-------|-------|
| Input required | `ELASTIC_URL` and `ELASTIC_API_KEY` environment variables |
| Endpoint | `GET /elastic/live/status`, `POST /elastic/live/search` |
| Frontend | Top nav → Elastic Live |
| Expected output | Connection status, ES\|QL query results |
| Test data | N/A — requires live Elasticsearch 8.11+ |
| Current status | **working** (returns `unconfigured` when env vars absent) |
| Fixes applied | None required |
| Automated test | ❌ None (requires live Elasticsearch) |
| Manual verification | ✅ Status returns `unconfigured` without credentials |
| Included in report | ❌ Not applicable |

---

## 11. PCAP Network Traffic Analysis

| Field | Value |
|-------|-------|
| Input required | PCAP or PCAPNG file (static — never executed) |
| Endpoint | `POST /cases/{id}/analyze/pcap`, `GET /cases/{id}/analyze/pcap` |
| Frontend | Case detail → Analysis → PCAP tab |
| Expected output | Top talkers, protocol distribution, DNS queries, HTTP requests, TLS SNI, beaconing flags, DGA detection |
| Test data | None included — see `sample-data/pcap/README.md` for instructions |
| Current status | **working** (requires `dpkt` library) |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | Manual only — requires a PCAP file |
| Included in report | ✅ If PCAP analysis exists |

---

## 12. Investigation Correlation Engine

| Field | Value |
|-------|-------|
| Input required | Case findings from other modules (Windows, Suricata, Sigma, YARA, etc.) |
| Endpoint | `POST /cases/{id}/correlate`, `GET /cases/{id}/correlate` |
| Frontend | Case detail → Correlation & Intelligence → Correlation panel |
| Expected output | Multi-source attack patterns, correlated finding cards |
| Test data | Demo case after all analysis modules run |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Demo seed triggers correlation |
| Included in report | ✅ Section 10 (Correlated Findings) |

---

## 13. MITRE ATT&CK Mapping

| Field | Value |
|-------|-------|
| Input required | Detection findings and correlated results |
| Endpoint | `POST /cases/{id}/mitre/map`, `GET /cases/{id}/mitre/map`, `GET /mitre/mappings` |
| Frontend | Case detail → Correlation & Intelligence → MITRE panel |
| Expected output | Technique list with IDs (e.g., T1059.001), tactics, descriptions, per-tactic counts |
| Test data | Demo case findings |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Demo seed triggers mapping |
| Included in report | ✅ Section 11 (MITRE ATT&CK) |

---

## 14. Incident Report Generator (Markdown)

| Field | Value |
|-------|-------|
| Input required | All case findings; no minimum required |
| Endpoint | `POST /cases/{id}/report/generate`, `GET /cases/{id}/report`, `GET /cases/{id}/report/content` |
| Frontend | Case detail → Reporting & AI → Incident Report |
| Expected output | 23-section structured Markdown report saved to `reports/generated/` |
| Test data | Demo case with all modules run |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Demo seed generates report |
| Included in report | This IS the report |

---

## 15. PDF Report Export

| Field | Value |
|-------|-------|
| Input required | Existing generated Markdown report for the case |
| Endpoint | `GET /cases/{id}/report/pdf` |
| Frontend | Case detail → Reporting & AI → Download PDF button |
| Expected output | PDF file download (fpdf2-based) |
| Test data | Demo case with existing report |
| Current status | **working** (requires `fpdf2` library) |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | Manual — click Download PDF after generating report |
| Included in report | This IS the PDF |

---

## 16. AI Investigation Assistant

| Field | Value |
|-------|-------|
| Input required | None (uses case context from DB) |
| Endpoint | `POST /cases/{id}/ai/summarize`, `POST /cases/{id}/ai/recommend` |
| Frontend | Case detail → Reporting & AI → AI Assistant panel |
| Expected output | Case summary and recommended next steps (mock by default; real if AI_PROVIDER configured) |
| Test data | Any case with findings |
| Current status | **working** (mock mode fully functional; Anthropic/OpenAI require API key) |
| Fixes applied | Added `load_dotenv()` so `.env` is read in local dev |
| Automated test | ❌ None |
| Manual verification | ✅ Mock response tested via smoke test |
| Included in report | ✅ Section 19 (Recommended Actions — AI-generated) |

---

## 17. MCP Tool Server

| Field | Value |
|-------|-------|
| Input required | None |
| Endpoint | `GET /mcp/tools`, `GET /mcp/tool-calls` |
| Frontend | Top nav → MCP Tools |
| Expected output | List of registered MCP tools with descriptions; tool call log |
| Test data | N/A |
| Current status | **working** (status-only; not a full MCP WebSocket server) |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ `/mcp/tools` returns tool list |
| Included in report | ❌ Not applicable |

---

## 18. Analyst Dashboard

| Field | Value |
|-------|-------|
| Input required | None (aggregates from DB) |
| Endpoint | `GET /dashboard/summary` |
| Frontend | Root `/` path |
| Expected output | Total cases, open cases, critical cases, findings counts, recent activity |
| Test data | Any seeded case |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Dashboard loads after seed |
| Included in report | ❌ Not applicable |

---

## 19. Rule Authoring Assistant

| Field | Value |
|-------|-------|
| Input required | Detection description, rule format (sigma/splunk/elastic) |
| Endpoint | `POST /rules/author`, `GET /rules/author/event-types` |
| Frontend | Top nav → Rule Author |
| Expected output | Sigma YAML / SPL / KQL draft; false positive notes; log source requirements |
| Test data | Type a description like "detect encoded PowerShell" |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None |
| Manual verification | ✅ Author page renders and returns drafts |
| Included in report | ❌ Not applicable |

---

## 20. Analyst Playbooks (Phase 26)

| Field | Value |
|-------|-------|
| Input required | None — templates are seeded at startup; attach to a case |
| Endpoint | `GET /playbooks/templates`, `GET /playbooks/templates/{id}`, `POST /cases/{id}/playbooks`, `GET /cases/{id}/playbooks`, `PATCH .../steps/{step_id}` |
| Frontend | Case detail → Analyst Playbooks; top nav → Playbooks (template browser) |
| Expected output | 10 playbook templates; per-case step tracking with progress bars; auto-suggestions |
| Test data | Demo seed attaches Brute Force and PowerShell playbooks |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Demo seed attaches playbooks and marks steps |
| Included in report | ✅ Section 12 (Analyst Playbook Progress) |

---

## 21. Analyst Notes (Phase 27)

| Field | Value |
|-------|-------|
| Input required | None — attach to any case entity |
| Endpoint | `POST/GET /cases/{id}/notes`, `PATCH/DELETE /cases/{id}/notes/{note_id}` |
| Frontend | Case detail → Analyst Notes |
| Expected output | Notes list with type badges; inline edit/delete; filter by type |
| Test data | Demo seed creates 4 notes (observation, hypothesis, recommendation, assessment) |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Demo seed creates notes |
| Included in report | ✅ Section 14 (Analyst Notes and Observations) |

---

## 22. IOC Basket (Phase 28)

| Field | Value |
|-------|-------|
| Input required | Case with any analysis results (IOCs are extracted from existing findings) |
| Endpoint | `POST /cases/{id}/iocs/extract`, `GET /cases/{id}/iocs`, `GET /cases/{id}/iocs/export`, `POST/PATCH/DELETE /cases/{id}/iocs/{id}` |
| Frontend | Case detail → IOC Basket |
| Expected output | 16 IOC types auto-extracted; deduplication; analyst tagging; CSV/JSON export |
| Test data | Demo seed extracts IOCs then tags key ones |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Demo seed extracts and tags IOCs |
| Included in report | ✅ Section 12 (IOC Basket) |

---

## 23. Entity Graph / Investigation Map (Phase 29)

| Field | Value |
|-------|-------|
| Input required | Case with any analysis results |
| Endpoint | `GET /cases/{id}/graph` |
| Frontend | Case detail → Investigation Map |
| Expected output | React Flow interactive graph; 14+ node types; edge types; detail panel; JSON export |
| Test data | Demo case with all analysis modules run |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Graph renders from demo case data |
| Included in report | ✅ Summary section (entity map summary) |

---

## 24. Timeline Replay Mode (Phase 30)

| Field | Value |
|-------|-------|
| Input required | Case with timeline events |
| Endpoint | `GET /cases/{id}/timeline/replay` |
| Frontend | Case detail → Timeline → Replay Mode button |
| Expected output | Ordered replay events with explanations, MITRE mappings, keyboard shortcuts |
| Test data | Demo case timeline (populated by all analysis modules) |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Click Replay Mode after demo seed |
| Included in report | ✅ Section 13 (Attack Narrative) |

---

## 25. Detection Coverage / Telemetry Gap Analysis (Phase 31)

| Field | Value |
|-------|-------|
| Input required | Sigma rules loaded; optional case findings for per-case coverage |
| Endpoint | `GET /coverage/rules`, `GET /cases/{id}/coverage`, `GET /cases/{id}/telemetry-gaps` |
| Frontend | Top nav → Coverage (global); Case detail → Detection Coverage |
| Expected output | Rule browser with MITRE tags; triggered/not-triggered/blocked counts; 7-gap catalogue |
| Test data | Built-in rules; demo case findings |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Coverage page and case panel both render |
| Included in report | ✅ Section 16 (Detection Coverage and Telemetry Gaps) |

---

## 26. Finding Disposition / False Positive Review (Phase 32)

| Field | Value |
|-------|-------|
| Input required | Any finding (Sigma, YARA, Suricata, correlation, etc.) |
| Endpoint | `POST/GET/PATCH/DELETE /cases/{id}/dispositions/{id}` |
| Frontend | Case detail → Finding Disposition |
| Expected output | 8 disposition values; confidence; reason; analyst name; summary cards; filter |
| Test data | Demo seed creates 3 dispositions (true positives) |
| Current status | **working** |
| Fixes applied | None required |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Demo seed creates dispositions |
| Included in report | ✅ Section 17 (Finding Review and Disposition) |

---

## 27. Report Readiness Score (Phase 33)

| Field | Value |
|-------|-------|
| Input required | Case ID (computed from all DB data) |
| Endpoint | `GET /cases/{id}/report/readiness` |
| Frontend | Case detail → Report Readiness widget |
| Expected output | 0–100 score; grade (poor/fair/good/excellent); section scores; missing checks; recommendations |
| Test data | Any case |
| Current status | **working** |
| Fixes applied | Fixed `readiness.ts` hardcoded `http://localhost:8000` → `/api` |
| Automated test | ❌ None — added to test backlog |
| Manual verification | ✅ Widget renders; demo seed shows post-seed readiness score |
| Included in report | ✅ Section 23 (Report Completeness) |

---

## Known Limitations

| Module | Limitation |
|--------|-----------|
| YARA | Requires compiled `yara-python`. Falls back gracefully if unavailable. |
| PCAP | Requires `dpkt`. Large PCAPs (>50 MB) hit the upload cap. |
| Live Splunk | Requires a real Splunk instance with REST API enabled. Not testable locally. |
| Live Elastic | Requires Elasticsearch 8.11+ with ES\|QL support. Not testable locally. |
| AI assistant (real providers) | Requires `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`. Mock provider works without keys. |
| PDF export | fpdf2 renders plain text only — no Markdown formatting in PDF. |
| Entity graph | Requires React Flow in browser — not server-side renderable. |
| Timeline replay | Requires timeline events; empty cases show an empty replay modal. |

---

## Test Coverage Gap Summary

**Has automated tests:** Windows parser, Suricata parser  
**No automated tests (backlog):** Zeek, Sigma, YARA, PCAP, Correlation, MITRE, Report Generator, AI mock, Playbooks, Notes, IOCs, Graph, Timeline Replay, Coverage, Dispositions, Report Readiness
