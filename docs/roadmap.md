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
| 23 | Live Elastic Connector | `ELASTIC_URL`/`ELASTIC_API_KEY` env-var credentials; connection test via `/_cluster/health`; predefined ES\|QL hunt template runner; custom ES\|QL; query history with sample storage |
| 24 | PCAP Network Traffic Analysis | Static-only PCAP/PCAPNG analysis via `dpkt`; top talkers, protocol distribution, DNS, HTTP, TLS/SNI; beaconing, DGA, port-scan, large-transfer detection; findings added to timeline |
| 25 | Detection Rule Authoring Assistant | Template-based Sigma YAML, Splunk SPL, and Elastic KQL/ES|QL drafts from a description; auto event-type detection; false positive notes, log source requirements, and validation warnings |
| 26 | Analyst Playbooks and Guided Investigation | 10 built-in step-by-step investigation playbooks for common alert types; per-step status tracking; analyst notes; auto-suggestion from case findings; playbook progress in reports and AI context |
| 27 | Analyst Notes and Evidence Annotations | Polymorphic analyst notes attached to any case entity; 7 note types; filter tabs; inline edit/delete; notes section in reports; AI context labels notes as analyst-written, not verified evidence |
| 28 | IOC Extraction and IOC Basket | Automatic IOC extraction from all case data sources; 16 IOC types (IPs, domains, URLs, hashes, users, hosts, processes, paths, ports, user agents); deduplication; confidence levels; analyst tagging (suspicious/confirmed malicious/benign/needs review/internal/external); CSV/JSON export; copy; manual add; IOC section in reports; IOC context in AI assistant |
| 29 | Entity Graph and Investigation Map | Interactive React Flow entity graph built from all case data; 14+ node types (hosts, users, IPs, domains, processes, hashes, Sigma/YARA/Suricata detections, MITRE techniques, correlated findings, IOCs); 14 edge types; per-type filter toggles; node/edge detail panel; export graph JSON; entity map summary section in reports; graph summary in AI context |
| 30 | Attack Timeline Replay Mode | Interactive timeline replay modal; step through all timeline events with play/pause/next/prev/restart/speed controls; per-event explanations ("what this means"), recommended focus, affected entities, related evidence, related findings, and MITRE mappings; event list sidebar with severity highlight; keyboard shortcuts; copy event summary; severity and source filters; Attack Narrative report section; timeline_narrative AI context |
| 31 | Detection Coverage and Telemetry Gap Analysis | Global `/coverage` rule browser showing all Sigma rules with MITRE tags, logsource, and detection fields; per-case coverage panel showing triggered/not-triggered/blocked rule counts; MITRE coverage percentage; available vs missing log sources; 7-gap telemetry gap catalogue (PowerShell script block logs, Sysmon EID 1/3, DNS, HTTP/proxy, EDR, auth logs) with why-it-matters and recommendations; new report section "Detection Coverage and Telemetry Gaps"; coverage_gaps AI context key |
| 32 | Finding Disposition and False Positive Review | Analyst-controlled disposition workflow for all finding types (Sigma, YARA, Suricata, Zeek, PCAP, correlation, Splunk, Elastic); 8 disposition values (true_positive, false_positive, benign, suspicious, needs_review, escalated, duplicate, insufficient_data); confidence level (low/medium/high); reason, analyst name, follow-up action per disposition; summary metric cards (TP/FP/Benign/Review/Escalated); filter by disposition; add/edit/delete dispositions; report section 17 "Finding Review and Disposition"; finding_dispositions AI context (advisory only — AI cannot auto-apply dispositions) |

---

## Planned Phases

| Phase | Name |
|-------|------|
| 33 | Report Readiness Score |

---

## Design Principles (for all future phases)

- **Static analysis by default.** No phase should execute or detonate uploaded content.
- **Local-first.** External API calls only when the analyst explicitly configures a provider.
- **One phase at a time.** Each phase is complete and testable before the next begins.
- **No overbuild.** Only implement what is listed in the current phase scope.
- **Defensive tool only.** No offensive functionality will be added at any phase.
