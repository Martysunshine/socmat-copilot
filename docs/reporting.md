# Security Incident Report Generator

## Overview

SOC Copilot Workbench Phase 12 adds a structured Markdown report generator that
compiles all case evidence, findings, and analysis results into a professional
Security Incident Report.

Reports are generated on demand — the analyst clicks **Generate Report** on the
case detail page. Each generation produces a new timestamped `.md` file saved
under `reports/generated/`.

> **All report content is derived from stored case data only.** No AI or
> inference is used. The report reflects exactly what was found by the analysis
> modules.

---

## Report Structure

A generated report contains 15 sections:

| # | Section | Content |
|---|---------|---------|
| 1 | Executive Summary | Case overview, status, counts of all findings |
| 2 | Incident Classification | Title, ID, source, status, timestamps |
| 3 | Severity | Severity level with supporting indicator counts |
| 4 | Affected Assets | Host, user, IP address |
| 5 | Timeline of Events | All chronological timeline entries |
| 6 | Evidence Reviewed | Uploaded files with filenames, hashes, sizes |
| 7 | Detection Findings (Sigma) | Sigma rule matches with severity and match reason |
| 8 | Malware Triage Findings (YARA) | YARA hits with rule names and risk scores |
| 9 | Network Analysis Findings (Zeek) | Zeek log summaries with risk scores |
| 10 | Correlated Findings | Correlation engine results with recommended actions |
| 11 | MITRE ATT&CK Mapping | Techniques grouped by tactic |
| 12 | Analyst Assessment | Auto-generated narrative from finding severity |
| 13 | Recommended Actions | Actions from correlated findings + per-technique guidance |
| 14 | Detection Opportunities | Monitoring improvements based on mapped techniques |
| 15 | Final Status | Case status with contextual description |

---

## Example Generated Report

```markdown
# Security Incident Report

**Case ID:** #5
**Generated:** 15 Jan 2024 12:05 UTC
**Report Format:** Markdown

---

## 1. Executive Summary

This report covers investigation case **Suspicious PowerShell Activity** (#5),
opened on 14 Jan 2024 09:00 UTC with a **HIGH** severity classification.

As of 15 Jan 2024 12:05 UTC, the case status is **INVESTIGATING**. The
investigation reviewed 2 evidence files, identified 3 Sigma detection findings,
1 YARA triage hit, and correlated 2 findings. MITRE ATT&CK mapping identified
4 techniques across 3 tactics.

## 2. Incident Classification

| Field | Value |
|-------|-------|
| Case Title | Suspicious PowerShell Activity |
| Case ID | #5 |
| Source | Windows Logs |
| Status | INVESTIGATING |
| Created | 14 Jan 2024 09:00 UTC |
| Last Updated | 15 Jan 2024 12:05 UTC |

...

## 11. MITRE ATT&CK Mapping

### Execution

| Technique ID | Technique Name | Confidence |
|-------------|----------------|------------|
| `T1059` | Command and Scripting Interpreter | MEDIUM |
| `T1059.001` | Command and Scripting Interpreter: PowerShell | HIGH |

### Defense Evasion

| Technique ID | Technique Name | Confidence |
|-------------|----------------|------------|
| `T1027` | Obfuscated Files or Information | HIGH |

...
```

---

## File Storage

Reports are saved to `reports/generated/` at the repository root, using the
naming convention:

```
case_{case_id}_report_{YYYYMMDD_HHMMSS}.md
```

Example: `reports/generated/case_5_report_20240115_120500.md`

Each generation creates a new file. Previous reports are not deleted. Report
metadata (path, format, summary, timestamp) is stored in the `reports` table.

---

## Data Model

Report metadata is stored in the `reports` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER | Primary key |
| `case_id` | INTEGER | FK → cases.id |
| `report_path` | TEXT | Relative path from repo root |
| `format` | TEXT | Always `markdown` for Phase 12 |
| `generated_at` | DATETIME | Generation timestamp |
| `summary` | TEXT | One-line summary of key findings |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cases/{id}/report/generate` | Generate a new Markdown report |
| `GET` | `/cases/{id}/report` | Get most recent report metadata |
| `GET` | `/cases/{id}/report/content` | Return raw Markdown content for download |
| `GET` | `/reports` | List all reports across all cases |

Calling `POST /cases/{id}/report/generate` always creates a new report file and
a new database row — it does not overwrite previous reports.

### POST response

```json
{
  "id": 1,
  "case_id": 5,
  "report_path": "reports/generated/case_5_report_20240115_120500.md",
  "format": "markdown",
  "generated_at": "2024-01-15T12:05:00",
  "summary": "HIGH severity incident. 3 Sigma detection(s), 1 YARA hit(s), 2 correlated finding(s), 4 ATT&CK technique(s) across 3 tactic(s)."
}
```

---

## UI Behavior

The **ReportPanel** on the case detail page:

1. On load — checks for an existing report and shows its metadata if present
2. **Generate Report** button — calls `POST /cases/{id}/report/generate`
3. **Preview Report** — fetches raw Markdown content and renders it in a
   scrollable monospace block
4. **Download .md** — creates a browser Blob download of the Markdown file
5. **Regenerate Report** — same as Generate when a report already exists
6. Report generation timestamp is always shown

The **Reports** nav page (`/reports`) lists all generated reports across all
cases with links to the originating case.

---

## Limitations

- Markdown only in Phase 12 — PDF export planned for a future phase
- Sections 12–14 (Analyst Assessment, Recommended Actions, Detection
  Opportunities) are template-driven from case data, not narrative AI
- `GET /cases/{id}/report` returns only the most recent report; prior versions
  are accessible via the file system only
- No report versioning or diff view
- Long reports may render slowly in the browser preview for very large cases
