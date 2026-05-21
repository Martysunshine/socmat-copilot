# Sample Windows / Sysmon Log Data

These files contain **fictional, sanitised** log entries for testing the Windows log parser.
No real hostnames, usernames, or IP addresses are used. No real malware is included.

## Files

| File | Format | Description |
|------|--------|-------------|
| `demo-security-events.json` | JSON array | Windows Security Event Log export — contains brute-force logon, special privileges, process creation with encoded PowerShell, service install, scheduled task |
| `demo-sysmon-events.json` | JSON array | Sysmon log export — contains process creation, network connection, file creation, DNS query, LOLBIN execution |

## Detections the sample data triggers

- 5 failed logons → successful logon (brute force + credential spray)
- Successful logon after failures
- Special privileges assigned to non-machine account
- cmd.exe → powershell.exe with encoded command
- PowerShell with `-EncodedCommand` flag
- certutil used for URL cache (file download)
- New service installed
- Scheduled task created
- Sysmon: outbound connection by powershell.exe
- Sysmon: outbound connection by mshta.exe
- Sysmon: long DNS query (possible DGA)
- Sysmon: LOLBIN (mshta.exe) execution
- Account reconnaissance via net.exe

## How to use

1. Create a case in the UI
2. Upload `demo-security-events.json` or `demo-sysmon-events.json` as evidence
3. Open the Windows / Sysmon Log Analysis panel on the case detail page
4. Select the uploaded file and click **Run Analysis**
5. Review findings and check the timeline
