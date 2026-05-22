"""
Built-in playbook templates for SOC Copilot Workbench.

Seeded once on startup if no templates exist.
Each template defines a structured investigation checklist for a common alert type.
"""

import json

PLAYBOOK_SEEDS = [
    {
        "name": "Brute Force / Successful Login After Failures",
        "description": "Investigate repeated failed login attempts followed by a successful authentication event. Determine whether an account was compromised and assess the impact of post-authentication activity.",
        "alert_type": "brute_force",
        "severity": "high",
        "required_data_sources": ["Windows Security Event Logs (EID 4624, 4625)", "Sysmon (EID 1, 3)", "Zeek conn.log"],
        "steps": [
            {"order": 1, "title": "Review Failed Login Volume", "description": "Count failed logins (EID 4625) grouped by source IP and target account. Note timestamps, frequency, and whether the pattern suggests automation or manual attempts."},
            {"order": 2, "title": "Confirm Successful Login", "description": "Identify any successful logon (EID 4624) from the same source IP or for the same account following the failures. Note LogonType and authentication package."},
            {"order": 3, "title": "Investigate Source IP", "description": "Determine whether the source IP is internal, a VPN endpoint, or an unexpected external address. Check whether it is associated with known users or services."},
            {"order": 4, "title": "Review Post-Authentication Activity", "description": "Examine process creation events and network connections on the affected host in the window immediately following successful login."},
            {"order": 5, "title": "Check for Lateral Movement", "description": "Look for network logons (LogonType=3) or remote interactive sessions originating from the authenticated host to other internal systems."},
            {"order": 6, "title": "Review Account Privilege Level", "description": "Determine whether the affected account holds administrative rights, access to sensitive data, or service account privileges."},
            {"order": 7, "title": "Identify Scope", "description": "Determine how many accounts were targeted and whether any additional accounts were successfully accessed during the same attack window."},
            {"order": 8, "title": "Document and Disposition", "description": "Record all findings, mark false positives with clear reasoning, and escalate confirmed account compromise to the IR team for containment."},
        ],
    },
    {
        "name": "Suspicious PowerShell Execution",
        "description": "Investigate a PowerShell execution that was flagged as suspicious. Determine whether the activity is authorized admin automation or malicious scripting.",
        "alert_type": "suspicious_powershell",
        "severity": "high",
        "required_data_sources": ["Sysmon (EID 1, 3, 11)", "Windows Security (EID 4688)", "PowerShell Script Block Logging (EID 4103/4104)"],
        "steps": [
            {"order": 1, "title": "Examine PowerShell Command Line", "description": "Review the full command line including any -EncodedCommand flags. Note the parent process that launched PowerShell."},
            {"order": 2, "title": "Decode Encoded Content", "description": "If base64-encoded content is present via -EncodedCommand, decode it and document the plaintext command for analysis."},
            {"order": 3, "title": "Identify Execution Context", "description": "Determine which user account and host ran PowerShell. Verify whether this is a known admin, service account, or unexpected user."},
            {"order": 4, "title": "Check for Network Connections", "description": "Review Sysmon EID 3 events for outbound connections initiated by PowerShell or any child processes it spawned."},
            {"order": 5, "title": "Check for File Creation", "description": "Review Sysmon EID 11 events for files written to disk by PowerShell or its child processes, particularly in Temp or AppData directories."},
            {"order": 6, "title": "Correlate with Detection Findings", "description": "Review which Sigma rules were triggered by this activity and what patterns they identified. Cross-reference with YARA findings if a file was dropped."},
            {"order": 7, "title": "Assess Legitimacy", "description": "Determine whether this is authorized IT automation or approved admin scripting. If uncertain, contact the responsible team before taking action."},
            {"order": 8, "title": "Document and Disposition", "description": "Record the full command, execution context, and analyst judgment. Escalate to IR if the activity is confirmed malicious."},
        ],
    },
    {
        "name": "Malware / Suspicious File Triage",
        "description": "Perform static triage on a file that triggered YARA rules or other suspicious indicators. Determine whether the file is malicious, assess the risk, and identify potential execution and spread.",
        "alert_type": "malware_triage",
        "severity": "critical",
        "required_data_sources": ["YARA static triage", "Sysmon (EID 1, 11)", "Windows Security Event Logs", "Zeek conn.log"],
        "steps": [
            {"order": 1, "title": "Review YARA Rule Matches", "description": "Note which YARA signatures matched and what each signature category indicates about the file's behavior or family."},
            {"order": 2, "title": "Examine File Metadata", "description": "Review the file hash (MD5, SHA1, SHA256), MIME type, file size, and creation timestamp. Note whether the hash is already known in this environment."},
            {"order": 3, "title": "Analyze Extracted Strings", "description": "Look for C2 indicators, registry key paths, suspicious file paths, encoded payloads, and hardcoded credentials in extracted strings."},
            {"order": 4, "title": "Determine File Origin", "description": "Identify how and when the file arrived: email attachment, web download, lateral movement, USB, or dropped by another process."},
            {"order": 5, "title": "Check for Process Execution", "description": "Verify whether the file was executed by reviewing process creation events (Sysmon EID 1, Windows EID 4688) for the same filename or hash."},
            {"order": 6, "title": "Check for Post-Execution Artifacts", "description": "If the file was executed, review outbound network connections, registry modifications, and files dropped by the malware process."},
            {"order": 7, "title": "Check for Additional Instances", "description": "Determine whether the same file or similar hashes appear on other hosts in the environment by reviewing evidence and timeline events."},
            {"order": 8, "title": "Identify Scope", "description": "Assess how many hosts and user accounts may be affected by this file."},
            {"order": 9, "title": "Document and Disposition", "description": "Record all indicators, file metadata, and analysis conclusions. Escalate to IR immediately if execution is confirmed."},
        ],
    },
    {
        "name": "IDS/IPS High-Severity Alert",
        "description": "Investigate a high-severity alert from Suricata or another IDS/IPS sensor. Determine whether the alert represents real malicious activity or a false positive.",
        "alert_type": "ids_high_severity",
        "severity": "high",
        "required_data_sources": ["Suricata eve.json", "Zeek conn.log", "Windows Security Event Logs", "Sysmon"],
        "steps": [
            {"order": 1, "title": "Review Suricata Alert Details", "description": "Note the signature name, category, severity, source IP, destination IP, protocol, and any application-layer metadata in the eve.json record."},
            {"order": 2, "title": "Assess Signature Context", "description": "Research what the Suricata signature is designed to detect, its confidence level, and its typical false-positive rate in similar environments."},
            {"order": 3, "title": "Determine if Known False Positive", "description": "Check whether this signature regularly fires on legitimate traffic in your environment, such as vulnerability scanners, monitoring tools, or specific applications."},
            {"order": 4, "title": "Correlate with Endpoint Logs", "description": "Verify whether the destination or source host shows related process creation or file activity around the same time as the alert."},
            {"order": 5, "title": "Review Alert Frequency and Pattern", "description": "Check whether this is an isolated single alert or part of a pattern of repeated alerts indicating sustained activity from the same source."},
            {"order": 6, "title": "Review Related Network Traffic", "description": "Examine Zeek conn.log or http.log for related connections in the same time window that may provide additional context."},
            {"order": 7, "title": "Identify Affected Hosts and Users", "description": "Determine the internal host involved, its role in the environment, and any associated user accounts."},
            {"order": 8, "title": "Document and Disposition", "description": "Record analysis findings and mark the alert as true positive or false positive with clear justification. Escalate confirmed incidents."},
        ],
    },
    {
        "name": "Possible Command-and-Control Traffic",
        "description": "Investigate suspected command-and-control communication between an internal host and an external endpoint. Determine whether beaconing activity is present and identify the responsible process.",
        "alert_type": "c2_traffic",
        "severity": "critical",
        "required_data_sources": ["Zeek conn.log", "Suricata eve.json", "Sysmon (EID 3, 22)", "DNS logs"],
        "steps": [
            {"order": 1, "title": "Identify the Suspected C2 Endpoint", "description": "Note the external IP address and/or domain observed in IDS alerts or network logs as the suspected C2 destination."},
            {"order": 2, "title": "Analyze Beacon Pattern", "description": "Check for regular periodic connection intervals in Zeek conn.log. Consistent timing with low jitter is a strong indicator of automated C2 beaconing."},
            {"order": 3, "title": "Review Connection Metadata", "description": "Examine byte volumes, session duration, and total connection count via Zeek conn.log. C2 beacons often show consistent small byte counts."},
            {"order": 4, "title": "Identify the Communicating Process", "description": "Determine which process on the internal host is initiating the connections using Sysmon EID 3 (NetworkConnect) events."},
            {"order": 5, "title": "Check DNS Resolution", "description": "Review DNS logs (Sysmon EID 22 or Zeek dns.log) for resolution of the suspected C2 domain. Note timing, frequency, and TTL values."},
            {"order": 6, "title": "Review HTTP/TLS Metadata", "description": "Examine HTTP user agents, URI patterns, and TLS SNI values from proxy or TLS logs to identify C2 framework fingerprints."},
            {"order": 7, "title": "Correlate with Malware and Detection Findings", "description": "Cross-reference the C2 IP/domain against YARA findings, Sigma detections, and correlated findings already present in the case."},
            {"order": 8, "title": "Identify Scope", "description": "Determine whether other internal hosts are communicating with the same external endpoint, which may indicate broader compromise."},
            {"order": 9, "title": "Document and Disposition", "description": "Record all C2 indicators, the communicating process, and affected hosts. Escalate to IR immediately if beaconing is confirmed."},
        ],
    },
    {
        "name": "DNS Tunneling Suspicion",
        "description": "Investigate anomalous DNS query volume or patterns that may indicate DNS tunneling for data exfiltration or C2 communication.",
        "alert_type": "dns_tunneling",
        "severity": "high",
        "required_data_sources": ["Zeek dns.log", "Sysmon (EID 22)", "Windows DNS Server logs"],
        "steps": [
            {"order": 1, "title": "Identify the Suspicious Domain", "description": "Note the domain or subdomain pattern generating anomalous query volume. Tunneling typically uses a single parent domain with many unique subdomains."},
            {"order": 2, "title": "Analyze Query Frequency", "description": "Review the number of queries per minute or hour and compare to the expected baseline for DNS traffic in your environment."},
            {"order": 3, "title": "Examine Subdomain Entropy", "description": "High-entropy (random-looking) subdomains such as 'a1b2c3d4.evil.com' are a strong indicator of DNS tunneling. Calculate string entropy if possible."},
            {"order": 4, "title": "Review DNS Query Types", "description": "Check for unusual record types (TXT, NULL, CNAME, MX) being used in addition to standard A/AAAA queries, which are common in tunneling tools."},
            {"order": 5, "title": "Estimate Data Volume", "description": "Compare the size of DNS request payloads vs. responses. Tunneling sends encoded data in both directions, resulting in unusually large DNS messages."},
            {"order": 6, "title": "Identify the Source Host", "description": "Determine which internal host is generating the anomalous queries using Zeek dns.log or Sysmon EID 22 records."},
            {"order": 7, "title": "Correlate with Endpoint Activity", "description": "Check endpoint logs for processes on the source host that may be responsible for the DNS tunneling activity."},
            {"order": 8, "title": "Document and Disposition", "description": "Record all DNS indicators, the source host, and the analyst decision. Escalate if tunneling is confirmed."},
        ],
    },
    {
        "name": "Lateral Movement Suspicion",
        "description": "Investigate suspected lateral movement between internal hosts. Map the movement chain and determine the scope of potential compromise.",
        "alert_type": "lateral_movement",
        "severity": "high",
        "required_data_sources": ["Windows Security (EID 4624, 4648, 4672)", "Sysmon (EID 1, 3)", "Zeek conn.log"],
        "steps": [
            {"order": 1, "title": "Identify Source and Destination Hosts", "description": "Note the originating host and the destination host for the suspected lateral movement event."},
            {"order": 2, "title": "Review Authentication Method", "description": "Check logon events for LogonType (3=Network, 10=RemoteInteractive) and the credentials used. Note whether explicit credentials (EID 4648) were specified."},
            {"order": 3, "title": "Check for Remote Execution Tools", "description": "Look for PsExec, WMI (wmiprvse.exe), PowerShell Remoting (wsmprovhost.exe), RDP, or SMB-based execution indicators in process creation events."},
            {"order": 4, "title": "Review Processes on Destination Host", "description": "Examine process creation events (Sysmon EID 1) on the destination host in the window following the authentication event."},
            {"order": 5, "title": "Check for Credential Harvesting", "description": "Look for LSASS access attempts (EID 4663), known credential dumping tool process names (e.g., mimikatz, procdump), or Volume Shadow Copy deletion."},
            {"order": 6, "title": "Map the Movement Chain", "description": "Build a timeline from the initial access point through each lateral movement hop to understand the full scope of the attacker's reach."},
            {"order": 7, "title": "Identify All Affected Hosts", "description": "List every host that was accessed during lateral movement, including intermediate hops and final destinations."},
            {"order": 8, "title": "Document and Disposition", "description": "Record the full movement chain with timestamps, credentials, and methods used. Escalate to IR immediately for containment."},
        ],
    },
    {
        "name": "Privilege Escalation / Admin Logon",
        "description": "Investigate a privilege escalation event or unexpected administrative logon. Determine whether the escalation is authorized and assess any actions taken under elevated context.",
        "alert_type": "privilege_escalation",
        "severity": "high",
        "required_data_sources": ["Windows Security (EID 4624, 4672, 4698, 7045)", "Sysmon (EID 1, 11, 13)"],
        "steps": [
            {"order": 1, "title": "Review the Escalation Event", "description": "Identify the account, host, timestamp, and method of the privilege escalation or admin logon from security event logs."},
            {"order": 2, "title": "Check EID 4672", "description": "Review Special Privileges Assigned events to understand exactly which sensitive privileges were granted to the session."},
            {"order": 3, "title": "Validate Expected Behavior", "description": "Determine whether this account normally holds administrative access. Check with the IT team if the logon was from an unexpected host or time."},
            {"order": 4, "title": "Review Actions Under Elevated Context", "description": "Examine process creation, file operations, and network connections that occurred while the account was operating with elevated privileges."},
            {"order": 5, "title": "Check for Persistence Mechanisms", "description": "Look for new services (EID 7045), scheduled tasks (EID 4698), registry run key modifications (Sysmon EID 13), or new local accounts created under elevated context."},
            {"order": 6, "title": "Correlate with Other Findings", "description": "Cross-reference with lateral movement, malware triage, or brute force findings to understand whether this escalation is part of a broader attack chain."},
            {"order": 7, "title": "Assess Insider Threat Risk", "description": "Consider whether unauthorized escalation could represent a compromised account, insider threat, or accidental privilege abuse."},
            {"order": 8, "title": "Document and Disposition", "description": "Record the full escalation context and all actions taken. Escalate if unauthorized privileged access is confirmed."},
        ],
    },
    {
        "name": "Suspicious Service Installation",
        "description": "Investigate the installation of a new Windows service that was not expected or authorized. Determine whether the service represents a persistence mechanism.",
        "alert_type": "service_installation",
        "severity": "high",
        "required_data_sources": ["Windows System (EID 7045)", "Windows Security (EID 4697)", "Sysmon (EID 1, 11)", "YARA triage"],
        "steps": [
            {"order": 1, "title": "Review Service Installation Details", "description": "Note the service name, binary path, service type, and start type from EID 7045. Capture the full binary path for analysis."},
            {"order": 2, "title": "Determine if Legitimate", "description": "Check the service name and binary path against a baseline of approved services in your environment. Contact the responsible team if uncertain."},
            {"order": 3, "title": "Analyze the Service Binary", "description": "If the service binary was uploaded as evidence, review YARA triage results and file metadata including hash values and suspicious strings."},
            {"order": 4, "title": "Identify the Installing Account", "description": "Note which user account installed the service and verify whether that account has the right to install services in your environment."},
            {"order": 5, "title": "Inspect the Service Binary Path", "description": "Verify the binary is not located in a suspicious directory such as Temp, AppData, or a user profile folder, which would indicate a non-standard installation."},
            {"order": 6, "title": "Correlate with Surrounding Events", "description": "Check for other suspicious events near the installation time: failed logins, PowerShell execution, lateral movement, or file drops."},
            {"order": 7, "title": "Verify Persistence Configuration", "description": "Confirm whether the service start type is set to Automatic or Automatic (Delayed), which would indicate it is being used as a persistence mechanism."},
            {"order": 8, "title": "Document and Disposition", "description": "Record all service details, the installing account, and analysis conclusions. Escalate if unauthorized persistence is confirmed."},
        ],
    },
    {
        "name": "Generic Unknown Alert",
        "description": "Perform a comprehensive investigation for an alert that does not match a specific known pattern. Run all available analysis modules and build a full picture of the case before making a disposition.",
        "alert_type": "generic",
        "severity": "medium",
        "required_data_sources": ["Any available evidence"],
        "steps": [
            {"order": 1, "title": "List Available Evidence", "description": "Review all uploaded evidence files and their types to understand what data is available for analysis."},
            {"order": 2, "title": "Run Windows/Sysmon Log Analysis", "description": "If Windows event log or Sysmon evidence exists, run the Windows log analysis module to normalize events and detect suspicious patterns."},
            {"order": 3, "title": "Run Suricata Analysis", "description": "If Suricata eve.json evidence exists, run the Suricata analysis module to surface high-severity IDS alerts."},
            {"order": 4, "title": "Run Zeek Analysis", "description": "If Zeek network logs (conn.log, dns.log, http.log) exist, run the Zeek analysis module to identify network anomalies."},
            {"order": 5, "title": "Run PCAP Analysis", "description": "If PCAP or PCAPNG evidence exists, run the PCAP analysis module to extract network conversations and detect beaconing or DGA activity."},
            {"order": 6, "title": "Run Sigma Detection", "description": "Run all Sigma rules against normalized events to identify known suspicious patterns in the available log data."},
            {"order": 7, "title": "Run YARA Triage", "description": "Run YARA static analysis against any uploaded suspicious files to identify malware signatures and suspicious indicators."},
            {"order": 8, "title": "Run Correlation Engine", "description": "Run the correlation engine to identify multi-source attack patterns and relationships between findings from different modules."},
            {"order": 9, "title": "Run MITRE ATT&CK Mapping", "description": "Map all findings to ATT&CK techniques to understand the scope and category of the observed activity."},
            {"order": 10, "title": "Document Assessment", "description": "Record your investigation conclusions, key findings, recommended next steps, and final disposition for this case."},
        ],
    },
]


def seed_playbook_templates() -> None:
    """Seed built-in playbook templates if none exist. Safe to call on every startup."""
    from database import SessionLocal
    from models.playbook_template import PlaybookTemplate
    import json

    db = SessionLocal()
    try:
        if db.query(PlaybookTemplate).count() > 0:
            return
        for seed in PLAYBOOK_SEEDS:
            template = PlaybookTemplate(
                name=seed["name"],
                description=seed["description"],
                alert_type=seed["alert_type"],
                severity=seed["severity"],
                required_data_sources=json.dumps(seed["required_data_sources"]),
                steps_json=json.dumps(seed["steps"]),
            )
            db.add(template)
        db.commit()
    finally:
        db.close()
