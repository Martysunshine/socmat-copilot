# Screenshots Guide — SOC Copilot Workbench

This document lists the recommended screenshots for the GitHub repository page, README, and portfolio presentations.

Screenshots should be taken against the demo case created by `python scripts/seed_demo.py`.

---

## Recommended Screenshots

### 1. Dashboard
**File:** `screenshots/01-dashboard.png`  
**URL:** `http://localhost:5173/`  
**Shows:** Case count, open alerts, recent activity, severity distribution

### 2. Case List
**File:** `screenshots/02-case-list.png`  
**URL:** `http://localhost:5173/cases`  
**Shows:** List of cases with severity badges and status

### 3. Case Detail — Overview
**File:** `screenshots/03-case-detail-overview.png`  
**URL:** `http://localhost:5173/cases/1`  
**Shows:** Case header with severity badge, affected host/user/IP, status badge

### 4. Timeline
**File:** `screenshots/04-timeline.png`  
**URL:** Case detail → Timeline section  
**Shows:** Chronological timeline events from all analysis modules

### 5. Timeline Replay Modal
**File:** `screenshots/05-timeline-replay.png`  
**URL:** Case detail → Timeline → Replay Mode  
**Shows:** Replay modal with play/pause controls, event explanation, MITRE mapping

### 6. Windows/Sysmon Analysis
**File:** `screenshots/06-windows-analysis.png`  
**URL:** Case detail → Analysis → Windows/Sysmon  
**Shows:** Normalized events with EIDs, severity flags

### 7. Sigma Detection Findings
**File:** `screenshots/07-sigma-findings.png`  
**URL:** Case detail → Analysis → Sigma  
**Shows:** Matched detection rules with finding cards

### 8. YARA Triage
**File:** `screenshots/08-yara-triage.png`  
**URL:** Case detail → Analysis → YARA  
**Shows:** Rule matches, matched strings, risk score

### 9. MITRE ATT&CK Mapping
**File:** `screenshots/09-mitre-mapping.png`  
**URL:** Case detail → Correlation & Intelligence → MITRE  
**Shows:** Technique list with IDs, tactic grouping

### 10. IOC Basket
**File:** `screenshots/10-ioc-basket.png`  
**URL:** Case detail → IOC Basket  
**Shows:** Extracted IOC list with types, values, confidence, analyst tags

### 11. Analyst Playbooks
**File:** `screenshots/11-playbooks.png`  
**URL:** Case detail → Analyst Playbooks  
**Shows:** Attached playbook with step checklist and progress bar

### 12. Entity Graph / Investigation Map
**File:** `screenshots/12-entity-graph.png`  
**URL:** Case detail → Investigation Map  
**Shows:** React Flow graph with host, user, IP, process, and detection nodes

### 13. Detection Coverage
**File:** `screenshots/13-coverage.png`  
**URL:** `http://localhost:5173/coverage`  
**Shows:** Rule browser with MITRE tags; telemetry gap catalogue

### 14. Finding Disposition
**File:** `screenshots/14-disposition.png`  
**URL:** Case detail → Finding Disposition  
**Shows:** Disposition workflow with TP/FP/benign metric cards

### 15. Report Readiness Score
**File:** `screenshots/15-readiness.png`  
**URL:** Case detail → Report Readiness  
**Shows:** Score percentage, grade badge, section progress bars, missing checks

### 16. Incident Report (Markdown Preview)
**File:** `screenshots/16-report.png`  
**URL:** Case detail → Reporting & AI → Preview Report  
**Shows:** Multi-section Markdown report preview

### 17. AI Investigation Assistant
**File:** `screenshots/17-ai-assistant.png`  
**URL:** Case detail → Reporting & AI → AI Assistant  
**Shows:** AI case summary and recommended next steps

### 18. MCP Tools
**File:** `screenshots/18-mcp-tools.png`  
**URL:** `http://localhost:5173/mcp`  
**Shows:** Registered MCP tool list

---

## Screenshot Directory

Place screenshots in: `screenshots/`

The `screenshots/` directory is gitignored to keep the repository lightweight. To add screenshots to a fork or fork-based portfolio, either:
1. Add them to `screenshots/` locally and update `.gitignore` to un-ignore them
2. Host them externally (GitHub issues image upload) and reference them in the README

---

## README Image Block (template)

After taking screenshots, add an image block to README.md:

```markdown
## Screenshots

| Dashboard | Timeline Replay | IOC Basket |
|-----------|----------------|-----------|
| ![Dashboard](screenshots/01-dashboard.png) | ![Replay](screenshots/05-timeline-replay.png) | ![IOC](screenshots/10-ioc-basket.png) |

| Entity Graph | Report Readiness | Incident Report |
|-------------|-----------------|----------------|
| ![Graph](screenshots/12-entity-graph.png) | ![Readiness](screenshots/15-readiness.png) | ![Report](screenshots/16-report.png) |
```
