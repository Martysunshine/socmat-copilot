# Demo Incident — Operation: Midnight Blue

A fictional, sanitised multi-stage compromise scenario for demonstrating the SOC Copilot Workbench.

No real malware, no real hostnames, no real private data.
All IP addresses are RFC 1918 / RFC 5737 documentation ranges.

---

## Scenario Summary

**Organisation:** CorpNet (fictional)
**Date:** 2024-03-15
**Duration:** ~90 minutes (08:01–09:30)
**Outcome:** Initial access via credential spray → encoded PowerShell execution → C2 beacon established → lateral movement attempted

---

## Attack Narrative

| Time  | Event |
|-------|-------|
| 08:01 | Attacker (10.10.50.201) begins brute-force against jsmith on WORKSTATION-42 |
| 08:02 | Credential spray succeeds — jsmith logs in with special privileges |
| 08:03 | cmd.exe spawns PowerShell with Base64-encoded command (download stager) |
| 08:03 | PowerShell connects outbound to 192.168.1.200:443 (C2) |
| 08:03 | File created: `C:\ProgramData\update\payload.exe` |
| 08:04 | Persistence: new service `WindowsUpdateHelper` installed |
| 08:05 | Scheduled task created for persistence |
| 08:12 | Suricata: SSH brute force + port scan from 203.0.113.45 |
| 08:45 | Suricata: Malware downloader checkin (TLS to update.totally-legit-cdn.net) |
| 08:50 | Suricata: C2 beacon (CobaltStrike pattern) to 198.51.100.100 |
| 09:01 | Suricata: Long DNS query — possible DNS tunneling |
| 09:00 | Attacker pivots to DC-01 as Administrator from same IP |
| 09:01 | certutil used on DC-01 to download second payload |
| 09:15 | Suricata: EternalBlue exploit attempt blocked |
| 09:30 | Suricata: Lateral movement MS17-010 to 10.10.10.100–101 |

---

## Demo Evidence Files

| File | Parser | Description |
|------|--------|-------------|
| `windows-security.json` | Windows/Sysmon | Security Event Log — failed logons, process creation, service install |
| `sysmon-events.json` | Windows/Sysmon | Sysmon — PS execution, network connection, file creation, DNS |
| `suricata-alerts.json` | Suricata | 14 IDS/IPS alert events — scanning, malware, C2, exploits |
| `zeek-conn.log` | Zeek | Network connections — lateral movement scan, C2 beaconing |
| `zeek-dns.log` | Zeek | DNS queries — suspicious TLDs, long domain (DGA/tunneling) |
| `zeek-http.log` | Zeek | HTTP traffic — webshell access, sqlmap UA, payload download |
| `suspicious-payload.ps1.txt` | YARA | Static text artifact matching PowerShell/LOLBAS YARA rules |

---

## Detections Triggered

### Windows / Sysmon parser
- Brute force: 5 failed logons for jsmith from 10.10.50.201
- Credential spray success: login after 5 failures
- Special privileges assigned to jsmith
- cmd.exe → powershell.exe process chain
- PowerShell with Base64-encoded command (high)
- Outbound network connection from powershell.exe
- New service installed: WindowsUpdateHelper (persistence)
- Scheduled task created

### Suricata parser
- 7 alerts from 203.0.113.45 → sustained scanning/attack
- 203.0.113.45 contacted 5 unique destinations → scanning
- ET MALWARE MSIL/GenericDownloader (critical)
- ET C2 CobaltStrike Beacon (critical)
- ET EXPLOIT EternalBlue MS17-010

### Zeek parser
- `10.10.50.201`: 12 failed/rejected connections (SMB scan)
- Long DNS domain query (possible DGA / tunneling)
- Suspicious TLDs: .xyz, .tk
- Suspicious user agents: sqlmap, python-requests, go-http-client
- Suspicious URIs: /shell.php, /cmd.php, /exec

### YARA (suspicious-payload.ps1.txt)
- `PowerShell_Encoded_Command` — powershell + -EncodedCommand + -noprofile
- `Suspicious_LOLBAS_Usage` — certutil + mshta
- `Persistence_Registry_Run_Keys` — CurrentVersion\Run reference

---

## IP / Host Legend

| Address | Role |
|---------|------|
| 10.10.50.201 | Attacker source (internal pivot point) |
| WORKSTATION-42 | Victim endpoint — jsmith |
| DC-01 | Domain controller — pivoted to |
| 192.168.1.200 | C2 server (RFC 1918 documentation) |
| 203.0.113.45 | External attacker (TEST-NET-3, RFC 5737) |
| 10.10.10.50 | Victim / compromised internal host |
| 198.51.100.100 | C2 server (TEST-NET-2, RFC 5737) |

---

## How to Use

See [docs/demo-walkthrough.md](../../docs/demo-walkthrough.md) for step-by-step instructions.

For automated setup, run:
```bash
python scripts/seed_demo.py
```
