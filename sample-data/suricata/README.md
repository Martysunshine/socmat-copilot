# Sample Suricata Eve.json Data

This file contains **fictional, sanitised** Suricata IDS/IPS alert records for testing the Suricata parser.
No real hostnames, real IP addresses (RFC 5737 documentation ranges used), or real network captures are included.

## File

| File | Format | Description |
|------|--------|-------------|
| `demo-eve.json` | Newline-delimited JSON (EVE format) | 14 Suricata alert events covering scanning, malware, C2, and exploit activity |

## IP Addresses Used

| IP | Role |
|----|------|
| `203.0.113.45` | External attacker (TEST-NET-3, RFC 5737) |
| `10.10.10.50` | Victim / compromised internal host |
| `10.10.10.51–54` | Other internal targets |
| `10.10.10.100–101` | Internal lateral movement targets |
| `198.51.100.100` | C2 server (TEST-NET-2, RFC 5737) |
| `198.51.100.200` | DNS server |

## Detections the sample data triggers

- 6 alerts from `203.0.113.45` → sustained scanning detection
- `203.0.113.45` contacting 6 unique destinations → multi-destination scanning
- ET MALWARE: MSIL/GenericDownloader checkin (severity: critical)
- ET C2: CobaltStrike Beacon Checkin (severity: critical)
- Suspicious DNS query (long domain, .ru TLD)
- ET EXPLOIT EternalBlue MS17-010 inbound
- ET EXPLOIT Lateral Movement MS17-010 (internal)

## How to use

1. Create a case in the UI
2. Upload `demo-eve.json` as evidence
3. Open the Suricata IDS/IPS Alert Analysis panel on the case detail page
4. Select the uploaded file and click **Run Analysis**
5. Review findings and check the timeline

## Eve.json Format

Suricata writes one JSON object per line. Each object has an `event_type` field.
Only `event_type: "alert"` records are processed by this parser.
Key fields within alert records:

- `timestamp` — ISO 8601 UTC timestamp
- `src_ip` / `src_port` — source of the alert traffic
- `dest_ip` / `dest_port` — destination of the alert traffic
- `proto` — transport protocol (TCP/UDP)
- `app_proto` — application-layer protocol (http, tls, dns, smb, …)
- `alert.signature` — rule name that fired
- `alert.signature_id` — Suricata rule SID
- `alert.category` — classification category
- `alert.severity` — 1=high, 2=medium, 3=low
- `alert.action` — allowed or blocked
- `http` / `dns` / `tls` — optional protocol-specific metadata
