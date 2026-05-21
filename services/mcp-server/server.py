"""
SOC Copilot Workbench — MCP Tool Server (Phase 14)

Exposes 12 safe defensive SOC analysis tools via the Model Context Protocol.
Transport: stdio — compatible with Claude Desktop, Cursor, VS Code, and any
MCP-aware AI client.

Security restrictions (enforced here and in the FastAPI backend):
  - No destructive actions — no delete or wipe endpoints exposed
  - No arbitrary shell command execution
  - No direct filesystem or database access — all I/O through FastAPI
  - No offensive analysis capabilities

Environment variables:
  MCP_BACKEND_URL  — FastAPI backend URL  (default: http://localhost:8000)
  MCP_LOG_FILE     — Tool call log path   (default: ./mcp_tool_calls.jsonl)

Run:
    cd services/mcp-server
    pip install -r requirements.txt
    python server.py
"""

from mcp.server.fastmcp import FastMCP

import client as _c

mcp = FastMCP(
    "SOC Copilot Workbench",
    description=(
        "Defensive SOC analysis tools for investigation assistance. "
        "All tools operate on stored case data. "
        "No offensive capabilities or arbitrary command execution."
    ),
)


# ── Read-only tools ──────────────────────────────────────────────────────────────

@mcp.tool()
def list_cases() -> dict:
    """List all investigation cases with their severity, status, and metadata."""
    try:
        result = _c.api_get("/cases")
        _c.log_tool_call("list_cases", None, True)
        return {"cases": result}
    except Exception as exc:
        _c.log_tool_call("list_cases", None, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def get_case_summary(case_id: int) -> dict:
    """
    Return a structured summary of a case including case details, correlated
    findings, and MITRE ATT&CK mappings. Use list_cases first to find case IDs.
    """
    try:
        case = _c.api_get(f"/cases/{case_id}")
        correlations = _c.api_get(f"/cases/{case_id}/correlate")
        mitre = _c.api_get(f"/cases/{case_id}/mitre/map")
        result = {
            "case": case,
            "correlated_findings": correlations,
            "mitre_mappings": mitre,
        }
        _c.log_tool_call("get_case_summary", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("get_case_summary", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def list_case_evidence(case_id: int) -> dict:
    """
    List all evidence files uploaded to a case. Returns file metadata including
    evidence IDs needed by analysis tools.
    """
    try:
        result = _c.api_get(f"/cases/{case_id}/evidence")
        _c.log_tool_call("list_case_evidence", case_id, True)
        return {"evidence": result}
    except Exception as exc:
        _c.log_tool_call("list_case_evidence", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def get_case_timeline(case_id: int) -> dict:
    """Return the full chronological investigation timeline for a case."""
    try:
        result = _c.api_get(f"/cases/{case_id}/timeline")
        _c.log_tool_call("get_case_timeline", case_id, True)
        return {"timeline": result}
    except Exception as exc:
        _c.log_tool_call("get_case_timeline", case_id, False, str(exc))
        return {"error": str(exc)}


# ── Analysis tools ───────────────────────────────────────────────────────────────

@mcp.tool()
def run_windows_log_analysis(case_id: int, evidence_id: int) -> dict:
    """
    Run Windows/Sysmon event log analysis on an uploaded evidence file.
    The file is analyzed statically — it is never executed.
    Use list_case_evidence to obtain a valid evidence_id first.
    """
    try:
        result = _c.api_post(
            f"/cases/{case_id}/analyze/windows-logs",
            params={"evidence_id": evidence_id},
        )
        _c.log_tool_call("run_windows_log_analysis", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("run_windows_log_analysis", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def run_suricata_analysis(case_id: int, evidence_id: int) -> dict:
    """
    Run Suricata IDS/IPS alert log analysis on an uploaded evidence file.
    The file is analyzed statically — it is never executed.
    Use list_case_evidence to obtain a valid evidence_id first.
    """
    try:
        result = _c.api_post(
            f"/cases/{case_id}/analyze/suricata",
            params={"evidence_id": evidence_id},
        )
        _c.log_tool_call("run_suricata_analysis", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("run_suricata_analysis", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def run_zeek_analysis(case_id: int, evidence_id: int) -> dict:
    """
    Run Zeek network log analysis on an uploaded evidence file.
    The file is analyzed statically — it is never executed.
    Use list_case_evidence to obtain a valid evidence_id first.
    """
    try:
        result = _c.api_post(
            f"/cases/{case_id}/analyze/zeek",
            body={"evidence_id": evidence_id},
        )
        _c.log_tool_call("run_zeek_analysis", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("run_zeek_analysis", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def run_sigma_rules(case_id: int) -> dict:
    """
    Run all Sigma detection rules attached to this case against its normalized
    events. Attach rules first via the Sigma Rules UI before calling this tool.
    """
    try:
        result = _c.api_post(f"/cases/{case_id}/sigma/run")
        _c.log_tool_call("run_sigma_rules", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("run_sigma_rules", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def run_yara_scan(case_id: int, evidence_id: int) -> dict:
    """
    Run YARA static malware triage on an uploaded evidence file.
    The file is analyzed statically — it is never executed.
    Use list_case_evidence to obtain a valid evidence_id first.
    """
    try:
        result = _c.api_post(
            f"/cases/{case_id}/analyze/yara",
            body={"evidence_id": evidence_id},
        )
        _c.log_tool_call("run_yara_scan", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("run_yara_scan", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def run_correlation(case_id: int) -> dict:
    """
    Run the investigation correlation engine across all analysis modules.
    Identifies cross-module patterns and multi-stage attack indicators.
    Run analysis modules first before correlating.
    """
    try:
        result = _c.api_post(f"/cases/{case_id}/correlate")
        _c.log_tool_call("run_correlation", case_id, True)
        return {"correlated_findings": result}
    except Exception as exc:
        _c.log_tool_call("run_correlation", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def run_mitre_mapping(case_id: int) -> dict:
    """
    Map all case findings to MITRE ATT&CK techniques and tactics.
    Returns technique IDs, names, tactic categories, and confidence scores.
    """
    try:
        result = _c.api_post(f"/cases/{case_id}/mitre/map")
        _c.log_tool_call("run_mitre_mapping", case_id, True)
        return {"mitre_mappings": result}
    except Exception as exc:
        _c.log_tool_call("run_mitre_mapping", case_id, False, str(exc))
        return {"error": str(exc)}


@mcp.tool()
def generate_incident_report(case_id: int) -> dict:
    """
    Generate a structured Markdown security incident report for a case.
    The report covers all analysis modules with a complete findings summary.
    Returns report metadata including file path and generation timestamp.
    """
    try:
        result = _c.api_post(f"/cases/{case_id}/report/generate")
        _c.log_tool_call("generate_incident_report", case_id, True)
        return result
    except Exception as exc:
        _c.log_tool_call("generate_incident_report", case_id, False, str(exc))
        return {"error": str(exc)}


if __name__ == "__main__":
    mcp.run()
