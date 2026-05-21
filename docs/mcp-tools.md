# MCP Tool Server

## Overview

SOC Copilot Workbench Phase 14 adds a Model Context Protocol (MCP) server that
exposes safe SOC analysis tools to any MCP-compatible AI agent or client.

This allows AI agents (Claude Desktop, Cursor, VS Code Copilot, etc.) to
orchestrate SOC investigations by calling structured tools that operate on
stored case data — without any offensive capability or arbitrary code execution.

---

## Security Restrictions

| Restriction | Detail |
|-------------|--------|
| No destructive actions | No delete, wipe, or reset endpoints are exposed |
| No shell execution | Tools call the FastAPI backend only — no subprocess or OS commands |
| No direct filesystem access | All I/O is mediated by the FastAPI backend |
| No offensive capability | All tools are read or defensive-analysis only |
| Static analysis only | Uploaded files are never executed by any tool |
| Logged | Every tool call is logged with timestamp, case_id, success, and error |

---

## Prerequisites

1. FastAPI backend must be running: `cd services/api && uvicorn main:app --reload`
2. Python 3.11+ installed in the MCP server environment

---

## Running the MCP Server

```bash
cd services/mcp-server
pip install -r requirements.txt
python server.py
```

The server communicates via **stdio** (standard input/output), which is the
standard transport for local MCP integrations.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MCP_BACKEND_URL` | `http://localhost:8000` | FastAPI backend URL |
| `MCP_LOG_FILE` | `./mcp_tool_calls.jsonl` | Tool call log file path |

---

## Connecting a Client

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "soc-copilot": {
      "command": "python",
      "args": ["server.py"],
      "cwd": "/absolute/path/to/services/mcp-server"
    }
  }
}
```

Restart Claude Desktop after editing. The tools will appear in the tool
selector during conversations.

### Cursor / VS Code

Add an MCP server entry in your IDE's MCP configuration pointing to
`python server.py` with the working directory set to `services/mcp-server`.

---

## Available Tools

### Read-Only Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_cases` | List all investigation cases | none |
| `get_case_summary` | Case details + correlations + MITRE mappings | `case_id` |
| `list_case_evidence` | Evidence files for a case (returns evidence IDs) | `case_id` |
| `get_case_timeline` | Chronological investigation timeline | `case_id` |

### Analysis Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `run_windows_log_analysis` | Windows/Sysmon event log analysis (static) | `case_id`, `evidence_id` |
| `run_suricata_analysis` | Suricata IDS/IPS alert analysis (static) | `case_id`, `evidence_id` |
| `run_zeek_analysis` | Zeek network log analysis (static) | `case_id`, `evidence_id` |
| `run_sigma_rules` | Run attached Sigma detection rules | `case_id` |
| `run_yara_scan` | YARA malware triage (static) | `case_id`, `evidence_id` |
| `run_correlation` | Cross-module investigation correlation | `case_id` |
| `run_mitre_mapping` | MITRE ATT&CK technique mapping | `case_id` |
| `generate_incident_report` | Generate Markdown incident report | `case_id` |

> **Note:** Tools requiring `evidence_id` analyze already-uploaded files
> stored in the backend. Call `list_case_evidence` first to retrieve valid IDs.
> Files are never executed — all analysis is static.

---

## Typical Agent Workflow

```
1. list_cases                          → find relevant case_id
2. get_case_summary(case_id)           → review existing findings
3. list_case_evidence(case_id)         → get evidence_id values
4. run_windows_log_analysis(...)       → analyze log evidence
5. run_sigma_rules(case_id)            → run detections
6. run_correlation(case_id)            → find cross-module patterns
7. run_mitre_mapping(case_id)          → map to ATT&CK
8. generate_incident_report(case_id)   → produce final report
```

---

## Tool Call Logging

Every tool invocation is written to `mcp_tool_calls.jsonl`:

```json
{
  "tool_name": "get_case_summary",
  "case_id": 3,
  "timestamp": "2024-01-15T12:05:00+00:00",
  "success": true,
  "error": null
}
```

The log is readable from the SOC Copilot web UI at **MCP Tools → Recent Tool Calls**,
and via `GET /mcp/tool-calls` on the FastAPI backend.

---

## Known Limitations

- The MCP server calls the FastAPI backend over HTTP — both must be running locally
- No authentication between MCP server and backend (local-only deployment assumed)
- Evidence files must be uploaded via the web UI before analysis tools can reference them
- `run_sigma_rules` requires Sigma rules to be attached to the case first via the UI

---

## What Needs Improvement (Future Phases)

- Add authentication/token between MCP server and FastAPI backend
- Support SSE/HTTP transport in addition to stdio for remote deployments
- Add `ai_summarize` and `ai_recommend` as MCP tools
- Persist tool call logs to the SQLite database for richer querying
