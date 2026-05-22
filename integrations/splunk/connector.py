"""
Optional live Splunk REST API connector.

Credentials are read exclusively from environment variables — never hardcoded.

Environment variables:
  SPLUNK_URL        — e.g. https://splunk.example.com:8089
  SPLUNK_TOKEN      — Splunk bearer token (from a search role service account)
  SPLUNK_VERIFY_SSL — "true" (default) or "false" to skip cert verification

WARNING: Do not use production credentials in development or demo environments.
         Only read-only SPL search queries are sent. No data is written to Splunk.
"""

import json
import os
import time

import requests

SAFETY_WARNING = (
    "WARNING: This connector queries a live Splunk instance. "
    "Do not use production credentials in development or demo environments. "
    "Only read-only SPL search queries are sent. No data is written to Splunk."
)


def _get_config() -> tuple:
    """Return (url, token, verify_ssl). url/token are None if not set."""
    url = os.environ.get("SPLUNK_URL", "").strip().rstrip("/")
    token = os.environ.get("SPLUNK_TOKEN", "").strip()
    verify_ssl_str = os.environ.get("SPLUNK_VERIFY_SSL", "true").strip().lower()
    verify_ssl = verify_ssl_str not in ("false", "0", "no")
    return (url or None, token or None, verify_ssl)


def is_configured() -> bool:
    """Return True if SPLUNK_URL and SPLUNK_TOKEN are both set."""
    url, token, _ = _get_config()
    return bool(url and token)


def test_connection() -> dict:
    """
    Test the Splunk REST API connection.
    Returns: {configured, connected, server_info, error, warning}.
    """
    url, token, verify = _get_config()
    if not url or not token:
        return {
            "configured": False,
            "connected": False,
            "server_info": None,
            "error": "SPLUNK_URL and SPLUNK_TOKEN environment variables are not set.",
            "warning": SAFETY_WARNING,
        }
    try:
        resp = requests.get(
            f"{url}/services/server/info",
            headers={"Authorization": f"Bearer {token}"},
            params={"output_mode": "json"},
            timeout=10,
            verify=verify,
        )
        if resp.status_code == 401:
            return {
                "configured": True,
                "connected": False,
                "server_info": None,
                "error": "Authentication failed. Verify SPLUNK_TOKEN is correct.",
                "warning": SAFETY_WARNING,
            }
        resp.raise_for_status()
        data = resp.json()
        entry = data.get("entry", [{}])[0].get("content", {})
        server_info = {
            "version": entry.get("version", "unknown"),
            "product_name": entry.get("product_name", "Splunk"),
            "server_name": entry.get("serverName", "unknown"),
            "os": entry.get("os_name_extended", "unknown"),
        }
        return {
            "configured": True,
            "connected": True,
            "server_info": server_info,
            "error": None,
            "warning": SAFETY_WARNING,
        }
    except requests.exceptions.ConnectionError:
        return {
            "configured": True,
            "connected": False,
            "server_info": None,
            "error": f"Could not connect to {url}. Verify the host is reachable.",
            "warning": SAFETY_WARNING,
        }
    except requests.exceptions.Timeout:
        return {
            "configured": True,
            "connected": False,
            "server_info": None,
            "error": "Connection timed out (10 s).",
            "warning": SAFETY_WARNING,
        }
    except Exception as exc:
        return {
            "configured": True,
            "connected": False,
            "server_info": None,
            "error": str(exc),
            "warning": SAFETY_WARNING,
        }


def run_search(
    spl: str,
    earliest: str = "-24h",
    latest: str = "now",
    max_results: int = 50,
) -> dict:
    """
    Submit a blocking Splunk search job and return results.
    Polls until complete (max 30 s) then fetches up to max_results rows.

    Returns: {result_count, results, sid, error, warning}.
    Results are capped at 500. Only read-only searches are submitted.
    """
    url, token, verify = _get_config()
    if not url or not token:
        return {
            "result_count": 0,
            "results": [],
            "sid": None,
            "error": "Splunk connector is not configured.",
            "warning": SAFETY_WARNING,
        }

    max_results = min(max(1, max_results), 500)
    headers = {"Authorization": f"Bearer {token}"}

    try:
        # Create search job
        create_resp = requests.post(
            f"{url}/services/search/jobs",
            headers=headers,
            data={
                "search": f"search {spl}",
                "earliest_time": earliest,
                "latest_time": latest,
                "output_mode": "json",
                "count": max_results,
            },
            timeout=30,
            verify=verify,
        )
        if create_resp.status_code == 401:
            return {
                "result_count": 0, "results": [], "sid": None,
                "error": "Authentication failed. Verify SPLUNK_TOKEN.",
                "warning": SAFETY_WARNING,
            }
        create_resp.raise_for_status()
        sid = create_resp.json().get("sid")
        if not sid:
            return {
                "result_count": 0, "results": [], "sid": None,
                "error": "Splunk did not return a search job ID.",
                "warning": SAFETY_WARNING,
            }

        # Poll for completion
        job_url = f"{url}/services/search/jobs/{sid}"
        dispatch_state = "UNKNOWN"
        for _ in range(30):
            poll_resp = requests.get(
                job_url,
                headers=headers,
                params={"output_mode": "json"},
                timeout=15,
                verify=verify,
            )
            poll_resp.raise_for_status()
            entry_content = poll_resp.json().get("entry", [{}])[0].get("content", {})
            dispatch_state = entry_content.get("dispatchState", "UNKNOWN")
            if dispatch_state in ("DONE", "FAILED"):
                break
            time.sleep(1)
        else:
            return {
                "result_count": 0, "results": [], "sid": sid,
                "error": "Search job did not complete within 30 seconds.",
                "warning": SAFETY_WARNING,
            }

        if dispatch_state == "FAILED":
            return {
                "result_count": 0, "results": [], "sid": sid,
                "error": "Splunk reported the search job as FAILED.",
                "warning": SAFETY_WARNING,
            }

        # Fetch results
        results_resp = requests.get(
            f"{job_url}/results",
            headers=headers,
            params={"output_mode": "json", "count": max_results},
            timeout=30,
            verify=verify,
        )
        results_resp.raise_for_status()
        results = results_resp.json().get("results", [])

        return {
            "result_count": len(results),
            "results": results,
            "sid": sid,
            "error": None,
            "warning": SAFETY_WARNING,
        }

    except requests.exceptions.ConnectionError:
        return {
            "result_count": 0, "results": [], "sid": None,
            "error": f"Could not connect to {url}.",
            "warning": SAFETY_WARNING,
        }
    except requests.exceptions.Timeout:
        return {
            "result_count": 0, "results": [], "sid": None,
            "error": "Request timed out.",
            "warning": SAFETY_WARNING,
        }
    except Exception as exc:
        return {
            "result_count": 0, "results": [], "sid": None,
            "error": str(exc),
            "warning": SAFETY_WARNING,
        }
