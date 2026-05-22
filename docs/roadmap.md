# Roadmap — SOC Copilot Workbench

This document describes the full planned build progression. Each phase produces working, shippable code before the next phase begins.

---

## Completed Phases (MVP)

| Phase | Name | Key Deliverable |
|-------|------|----------------|
| 1 | Architecture Skeleton | FastAPI health endpoint, React landing page, Docker Compose |
| 2 | Case Management | SQLite database, full CRUD API and UI for investigation cases |
| 3 | Evidence Upload and Timeline | File upload with SHA-256 tracking, manual timeline events |
| 4 | Windows / Sysmon Log Parser | Normalize Event Log JSON; detect process creation, network, registry events |
| 5 | Suricata IDS Alert Analysis | Parse `eve.json`; surface high-severity alerts, attacker IPs, protocols |
| 6 | Sigma Rule Library | Load Sigma YAML rules from disk; human-readable explanations |
| 7 | Sigma Detection Matching | Run Sigma rules against normalized events; store findings |
| 8 | YARA Static Malware Triage | Scan uploaded files against YARA rules; no execution |
| 9 | Zeek Network Log Analysis | Parse `conn.log`, `dns.log`, `http.log`; flag C2 and tunneling |
| 10 | Investigation Correlation Engine | Cross-module findings correlation; multi-source pattern detection |
| 11 | MITRE ATT&CK Mapping | Map findings to ATT&CK techniques; per-tactic coverage view |
| 12 | Security Incident Report Generator | Produce structured Markdown reports from all case findings |
| 13 | AI Investigation Assistant | Grounded case summarization and next-step recommendations |
| 14 | MCP Tool Server | Expose case data as Model Context Protocol tools |
| 15 | Splunk Export and SPL Query Assistant | Parse Splunk CSV/JSON exports; SPL template matching |
| 16 | Elastic Export and KQL Hunt Assistant | Parse Kibana NDJSON exports; KQL/ES\|QL template matching |
| 17 | Analyst Dashboard and UX Polish | Aggregate metrics, recent activity, per-module status |
| 18 | Testing, Sample Data, and Demo Scenario | pytest unit tests, demo case seed script, safe sample evidence |
| 19 | Security Hardening and Safe Defaults | 50 MB upload cap, path traversal guard, Pydantic field constraints, security docs |
| 20 | GitHub-Ready README and Open Source Polish | Rewritten README, CONTRIBUTING.md, SECURITY.md, roadmap |
| 21 | PDF Report Export | `GET /cases/{id}/report/pdf` endpoint; fpdf2-based styled PDF; Download PDF button in UI |
| 22 | Live Splunk Connector | `SPLUNK_URL`/`SPLUNK_TOKEN` env-var credentials; connection test; predefined SPL template runner; custom SPL; query history with sample storage |

---

## Planned Phases

### Phase 23 — Live Elastic Connector

Query a live Elasticsearch/Kibana instance directly from the workbench.

- Elastic REST API with `ELASTIC_URL`/`ELASTIC_API_KEY` env vars
- Connection test endpoint
- Run predefined KQL/ES|QL hunt templates against live data
- Store only query metadata and selected results
- Credential input via environment variables only — never stored in SQLite

### Phase 24 — PCAP / Network Traffic Analysis

Passive analysis of PCAP files without executing payloads.

- Library: `scapy` or `dpkt`
- Extract connection metadata, DNS queries, HTTP requests, TLS handshakes
- Flag suspicious patterns: beaconing, DGA domains, cleartext credentials
- Integrate with existing timeline and correlation engine

---

## Design Principles (for all future phases)

- **Static analysis by default.** No phase should execute or detonate uploaded content.
- **Local-first.** External API calls only when the analyst explicitly configures a provider.
- **One phase at a time.** Each phase is complete and testable before the next begins.
- **No overbuild.** Only implement what is listed in the current phase scope.
- **Defensive tool only.** No offensive functionality will be added at any phase.
