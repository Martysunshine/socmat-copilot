"""Unit tests for the Suricata eve.json parser."""

import json

import pytest

from integrations.suricata.parser import parse_suricata


# ── helpers ──────────────────────────────────────────────────────────────────

def _alert(
    src_ip: str,
    dest_ip: str,
    signature: str = "Test Sig",
    category: str = "Attempted Information Leak",
    severity: int = 2,
    ts: str = "2024-01-01T00:00:00+0000",
) -> str:
    return json.dumps(
        {
            "timestamp": ts,
            "flow_id": 12345,
            "event_type": "alert",
            "src_ip": src_ip,
            "src_port": 54321,
            "dest_ip": dest_ip,
            "dest_port": 80,
            "proto": "TCP",
            "app_proto": "http",
            "alert": {
                "action": "allowed",
                "gid": 1,
                "signature_id": 99999,
                "rev": 1,
                "signature": signature,
                "category": category,
                "severity": severity,
            },
        }
    )


def _lines(*args: str) -> bytes:
    return "\n".join(args).encode()


# ── basic parsing ─────────────────────────────────────────────────────────────

def test_empty_content_returns_empty():
    alerts, findings = parse_suricata(b"", "test.json")
    assert alerts == []
    assert findings == []


def test_blank_lines_are_skipped():
    content = b"\n\n\n"
    alerts, findings = parse_suricata(content, "test.json")
    assert alerts == []
    assert findings == []


def test_non_alert_event_type_is_filtered_out():
    line = json.dumps({"event_type": "flow", "timestamp": "2024-01-01T00:00:00+0000"})
    alerts, _ = parse_suricata(line.encode(), "test.json")
    assert alerts == []


def test_stats_event_type_is_filtered_out():
    line = json.dumps({"event_type": "stats", "timestamp": "2024-01-01T00:00:00+0000"})
    alerts, _ = parse_suricata(line.encode(), "test.json")
    assert alerts == []


def test_malformed_json_line_is_skipped():
    content = b'{"event_type": "alert", incomplete\n' + _alert("1.2.3.4", "5.6.7.8").encode()
    alerts, _ = parse_suricata(content, "test.json")
    assert len(alerts) == 1


# ── alert normalisation ───────────────────────────────────────────────────────

def test_alert_fields_are_normalised():
    content = _lines(_alert("10.0.0.1", "8.8.8.8", signature="ET TEST Rule", severity=2))
    alerts, _ = parse_suricata(content, "test.json")
    assert len(alerts) == 1
    a = alerts[0]
    assert a["src_ip"] == "10.0.0.1"
    assert a["dest_ip"] == "8.8.8.8"
    assert a["signature"] == "ET TEST Rule"
    assert a["severity"] == "medium"


def test_severity_mapping_high():
    content = _lines(_alert("10.0.0.1", "8.8.8.8", severity=1))
    alerts, _ = parse_suricata(content, "test.json")
    assert alerts[0]["severity"] == "high"


def test_severity_mapping_medium():
    content = _lines(_alert("10.0.0.1", "8.8.8.8", severity=2))
    alerts, _ = parse_suricata(content, "test.json")
    assert alerts[0]["severity"] == "medium"


def test_severity_mapping_low():
    content = _lines(_alert("10.0.0.1", "8.8.8.8", severity=3))
    alerts, _ = parse_suricata(content, "test.json")
    assert alerts[0]["severity"] == "low"


# ── category detections ───────────────────────────────────────────────────────

def test_malware_category_triggers_critical_finding():
    content = _lines(
        _alert("10.0.0.1", "8.8.8.8",
               signature="ET MALWARE Dropper",
               category="A Network Trojan was Detected",
               severity=1)
    )
    _, findings = parse_suricata(content, "test.json")
    critical = [f for f in findings if f["severity"] == "critical"]
    assert len(critical) >= 1
    assert "malware" in critical[0]["description"].lower()


def test_c2_category_triggers_critical_finding():
    content = _lines(
        _alert("10.0.0.1", "8.8.8.8",
               signature="ET C2 Beacon",
               category="Command and Control Activity Detected",
               severity=1)
    )
    _, findings = parse_suricata(content, "test.json")
    critical = [f for f in findings if f["severity"] == "critical"]
    assert len(critical) >= 1
    assert "c2" in critical[0]["description"].lower()


def test_exploit_category_triggers_critical_finding():
    content = _lines(
        _alert("10.0.0.1", "8.8.8.8",
               signature="ET EXPLOIT EternalBlue",
               category="Attempted User Privilege Gain via exploit",
               severity=1)
    )
    # Category contains neither "malware" nor "c2" keywords — only high from sev=1
    _, findings = parse_suricata(content, "test.json")
    high = [f for f in findings if f["severity"] in ("high", "critical")]
    assert len(high) >= 1


def test_dns_category_triggers_medium_finding():
    content = _lines(
        _alert("10.0.0.1", "8.8.8.8",
               signature="ET DNS Suspicious Query",
               category="Potentially Bad DNS Traffic",
               severity=2)
    )
    _, findings = parse_suricata(content, "test.json")
    dns_findings = [f for f in findings if "dns" in f["description"].lower()]
    assert len(dns_findings) >= 1
    assert dns_findings[0]["severity"] == "medium"


# ── volume-based detections ───────────────────────────────────────────────────

def test_five_alerts_same_src_triggers_scan_finding():
    lines = "\n".join(
        _alert("203.0.113.1", f"10.0.0.{i}") for i in range(5)
    )
    _, findings = parse_suricata(lines.encode(), "test.json")
    scan = [f for f in findings if "ids alerts" in f["description"].lower()]
    assert len(scan) >= 1
    assert scan[0]["severity"] == "high"
    assert scan[0]["src_ip"] == "203.0.113.1"


def test_four_alerts_same_src_no_scan_finding():
    lines = "\n".join(
        _alert("203.0.113.1", f"10.0.0.{i}") for i in range(4)
    )
    _, findings = parse_suricata(lines.encode(), "test.json")
    scan = [f for f in findings if "ids alerts" in f["description"].lower()]
    assert scan == []


def test_four_unique_destinations_triggers_multi_dest_finding():
    lines = "\n".join(
        _alert("203.0.113.1", f"10.0.0.{i}") for i in range(4)
    )
    _, findings = parse_suricata(lines.encode(), "test.json")
    multi = [f for f in findings if "unique destinations" in f["description"].lower()]
    assert len(multi) >= 1
    assert multi[0]["severity"] == "high"


# ── deduplication ─────────────────────────────────────────────────────────────

def test_same_high_severity_sig_deduplicated():
    line = _alert("10.0.0.1", "8.8.8.8", signature="ET SCAN SSH Brute", severity=1)
    content = _lines(line, line, line)
    _, findings = parse_suricata(content, "test.json")
    high_sig = [
        f for f in findings
        if "ET SCAN SSH Brute" in f.get("description", "")
    ]
    assert len(high_sig) == 1


def test_same_malware_category_deduplicated():
    line = _alert("10.0.0.1", "8.8.8.8",
                  signature="ET MALWARE X",
                  category="A Network Trojan was Detected",
                  severity=1)
    content = _lines(line, line, line)
    _, findings = parse_suricata(content, "test.json")
    critical = [f for f in findings if f["severity"] == "critical"]
    assert len(critical) == 1
