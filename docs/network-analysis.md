# Network Log Analysis — Zeek

## Overview

SOC Copilot Workbench Phase 9 adds static analysis of Zeek network telemetry files.
The module parses uploaded Zeek log files, identifies suspicious network behavior, and
surfaces findings in the investigation timeline — without capturing or executing any traffic.

> **Safety guarantee:** No live traffic is captured. Only uploaded Zeek log files are analyzed.
> Files are never executed.

---

## Supported Log Types

| Log | File Pattern | Extracts |
|-----|-------------|----------|
| Connection log | `conn*.log`, `*conn*.log` | Source/dest hosts, ports, bytes, connection state |
| DNS log | `dns*.log`, `*dns*.log` | Query domains, response codes, answers |
| HTTP log | `http*.log`, `*http*.log` | Host, URI, user agent, status code |

Log type is auto-detected from the filename stem. Files named anything else are parsed
as unknown type — records are still stored but no behavior checks run.

---

## Detection Logic

### conn.log Checks

| Detection | Threshold | Severity |
|-----------|-----------|----------|
| Many destinations per host | ≥ 20 unique destinations | Medium |
| Many destinations per host | ≥ 50 unique destinations | High |
| High outbound volume | > 50 MB from one host | Medium |
| Failed/rejected connections | ≥ 10 REJ/RSTO/S0 per host | Low |
| Unusual port usage | ≥ 3 hosts on same non-standard port | Low |

Failed connection states detected: `REJ`, `RSTO`, `RSTOS0`, `OTH`, `S0`, `SHR`, `SH`

### dns.log Checks

| Detection | Threshold | Severity |
|-----------|-----------|----------|
| Long domain names | > 50 characters | Medium |
| Suspicious TLDs | `.xyz`, `.tk`, `.top`, `.pw`, `.cc`, `.bit`, `.onion`, `.info`, `.biz` | Medium |
| High NXDOMAIN rate | ≥ 20 NXDOMAIN/SERVFAIL from one host | Low |
| Repeated query | Same domain queried ≥ 50 times | Low |

### http.log Checks

| Detection | Pattern | Severity |
|-----------|---------|----------|
| Suspicious URIs | `/cmd`, `/shell`, `/exec`, `/webshell`, `/.env`, `/wp-login`, `/xmlrpc`, `/../`, `/etc/passwd`, `/bin/bash` | High |
| Suspicious user agents | sqlmap, nikto, masscan, zgrab, nuclei, python-requests, go-http-client, nmap, scanner, old MSIE 6.0 | Medium |
| Missing user agent | ≥ 5 requests with empty user agent | Low |

---

## Risk Scoring

| Severity | Points |
|----------|--------|
| Critical | 40 |
| High | 20 |
| Medium | 10 |
| Low | 5 |

Score is capped at 100. Risk score > 0 adds a timeline entry.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cases/{id}/analyze/zeek` | Run Zeek analysis on an evidence file |
| `GET` | `/cases/{id}/analyze/zeek` | List Zeek analysis results for a case |

### Request body

```json
{ "evidence_id": 42 }
```

Re-running analysis on the same evidence file replaces the previous result.

---

## Data Model

Results are stored in the `network_analysis_results` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `case_id` | INTEGER | FK → cases.id |
| `evidence_id` | INTEGER | FK → evidence.id |
| `log_type` | TEXT | `conn` / `dns` / `http` / `unknown` |
| `total_records` | INTEGER | Number of parsed log records |
| `findings` | TEXT | JSON array of finding objects |
| `summary_data` | TEXT | JSON object (top_talkers, dns_summary, http_summary) |
| `risk_score` | INTEGER | 0–100 |
| `summary` | TEXT | Human-readable analysis summary |
| `created_at` | DATETIME | Analysis timestamp |

---

## Limitations

- Maximum 50,000 records parsed per file to protect memory
- Log type detection is filename-based; rename files if auto-detection fails
- No live traffic capture — offline Zeek export only
- Thresholds are tunable but not yet exposed via API
- IPv6 addresses are parsed but not separately analyzed
- Zeek JSON format not supported — TSV only

---

## Sample Data

Safe synthesized test files are in `sample-data/zeek/`:

- `conn.log` — lateral movement, high-volume outbound, unusual ports
- `dns.log` — suspicious TLDs, DNS tunneling indicator, NXDOMAIN flood
- `http.log` — webshell URIs, suspicious user agents, missing user agents
