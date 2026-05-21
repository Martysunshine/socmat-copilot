# Sample Zeek Log Files

Safe sample Zeek network telemetry files for testing SOC Copilot Workbench's Zeek Network Log Analysis module.

These files contain **synthesized, non-real traffic** with embedded indicators of compromise for testing the detection engine.

---

## Files

| File | Type | Contains |
|------|------|----------|
| `conn.log` | Connection log | Lateral movement attempts, high-volume outbound, unusual port connections |
| `dns.log` | DNS log | Suspicious TLDs (.tk, .xyz), long domain names (DNS tunneling indicator), NXDOMAIN flood |
| `http.log` | HTTP log | Webshell URIs, SQLmap user agent, missing user agents, go-http-client (malware download) |

---

## How to Use

1. Open a case in SOC Copilot Workbench
2. Upload one of these files as evidence
3. Scroll to **Zeek Network Log Analysis** in the case detail view
4. Select the uploaded file and click **Run Zeek Analysis**

---

## Log Format

Zeek logs use tab-separated values with metadata headers:

```
#separator \x09
#fields  ts  uid  id.orig_h  ...
#types   time  string  addr  ...
[data rows]
```

The parser handles the `#fields` header automatically to map column names.
