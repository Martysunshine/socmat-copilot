# UI Overview — Phase 17

## Design System

The SOC Copilot Workbench uses a GitHub-inspired dark theme defined by CSS custom properties in `apps/web/src/index.css`. Key tokens:

| Token | Purpose |
|---|---|
| `--bg` | Page background |
| `--card-bg` | Card and panel backgrounds |
| `--border` | Dividers and input borders |
| `--text` | Primary text |
| `--text-secondary` | Secondary/label text |
| `--text-muted` | Muted/metadata text |
| `--accent` | Links and interactive highlights |

Severity colours: `--severity-critical` (red), `--severity-high` (orange), `--severity-medium` (yellow), `--severity-low` (green).

---

## Page Structure

All pages share a common shell rendered by `apps/web/src/components/Layout.tsx`:

```
Header (logo + nav)
  └── Main (page outlet)
Footer
```

Navigation links: Cases · Sigma Rules · YARA Rules · Reports · Splunk · Elastic · MCP Tools.

---

## Pages

### Dashboard (`/`)

- **Overview stat row** — 8 cards: Open Cases, Investigating, Critical, High Severity, Evidence Files, Timeline Events, Reports Generated, Total Cases. Counts come from `GET /dashboard/summary`.
- **Recent Activity grid** — two columns: Recent Cases (last 5, sorted by severity) and Recent Timeline Events (last 5).
- **Investigation Workflow** — linear step indicator.
- **Module grid** — all 15 completed modules shown with phase numbers.
- **Safety Principles** — core usage guidelines.

### Cases (`/cases`)

- Filterable table of all cases.
- **Filter row**: free-text search (title, host, user, source) + Severity dropdown + Status dropdown + Clear button.
- Click any row to open the case detail page.
- Empty state with "New Case" shortcut.
- "No matching cases" state when filters produce zero results.

### Case Detail (`/cases/:id`)

Panels are organised into four clearly labelled sections:

| Section | Panels |
|---|---|
| Evidence | EvidencePanel |
| Analysis | Windows · Suricata · Splunk · Elastic · YARA · Zeek · Sigma |
| Correlation & Intelligence | Correlation · MITRE ATT&CK |
| Timeline | TimelinePanel |
| Reporting & AI | ReportPanel · AIAssistantPanel |

Inline dropdowns allow updating severity and status without leaving the page.

### Sigma Rules (`/sigma`)

Browse, filter, and view YARA detection rules with full syntax display.

### YARA Rules (`/yara`)

Manage YARA rules; run static triage against uploaded evidence.

### Reports (`/reports`)

List all generated incident reports with download links.

### Splunk (`/splunk`)

SPL Query Assistant and SPL template library. Upload Splunk CSV/JSON exports for analysis from the Case Detail page.

### Elastic (`/elastic`)

KQL/ES|QL Hunt Assistant and hunt template library (7 templates). Upload Kibana/Elasticsearch exports for analysis from the Case Detail page.

### MCP Tools (`/mcp`)

MCP server status and tool catalogue for agent-driven workflows.

---

## Component Library

| Component | Purpose |
|---|---|
| `SeverityBadge` | Colour-coded critical/high/medium/low badge |
| `StatusBadge` | Colour-coded open/investigating/contained/escalated/closed badge |
| `EvidencePanel` | Upload and list evidence files |
| `TimelinePanel` | Chronological event feed |
| `WindowsAnalysisPanel` | Windows Event Log / Sysmon analysis |
| `SuricataAnalysisPanel` | Suricata eve.json alert analysis |
| `SplunkPanel` | Splunk export analysis |
| `ElasticPanel` | Kibana/Elasticsearch export analysis |
| `YaraPanel` | YARA static triage |
| `ZeekPanel` | Zeek log analysis |
| `SigmaRunPanel` | Sigma rule matching |
| `CorrelationPanel` | Cross-module correlation |
| `MitrePanel` | MITRE ATT&CK mapping |
| `ReportPanel` | Incident report generation |
| `AIAssistantPanel` | Grounded AI investigation summary |

---

## Key UX Patterns

- **Empty states** always explain the next action (e.g., "Upload a Kibana export first").
- **Loading states** show a `state-box` spinner message for every async operation.
- **Error states** show a red `state-box state-error` with the error detail.
- **Inline edit** — severity and status dropdowns PATCH immediately on change.
- **Analysis triggers** bump `timelineKey` to force TimelinePanel to refetch.
- **Evidence eligibility** — each analysis panel filters evidence to only show relevant file types.

---

## Screenshots Needed

For a portfolio-ready README, capture:

1. Dashboard with populated stats and recent activity grid
2. Cases list with filter row active
3. Case detail page showing Evidence + Analysis section labels
4. Elastic page — hunt assistant result with KQL/ES|QL tab toggle
5. Splunk page — SPL query result card
6. MITRE ATT&CK mapping panel

Add screenshots to `docs/screenshots/` and reference them from `README.md`.
