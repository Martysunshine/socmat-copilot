# Demo Walkthrough — Operation: Midnight Blue

A step-by-step guide for demonstrating the SOC Copilot Workbench using the fictional demo incident.

---

## Prerequisites

- Python 3.11+ and Node.js 18+ installed
- Backend running at `http://localhost:8000`
- Frontend running at `http://localhost:5173`

Start both services:

```bash
# Terminal 1 — backend
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload

# Terminal 2 — frontend
cd apps/web
npm install
npm run dev
```

Or use Docker Compose:

```bash
docker compose up --build
```

---

## Automated Demo Setup

The fastest way to populate the workbench for a demo:

```bash
pip install requests
python scripts/seed_demo.py
```

This creates the demo case, uploads all evidence files, and runs every analysis automatically. Skip to [Step 6](#step-6-run-correlation--mitre-mapping) when done.

---

## Manual Walkthrough

### Step 1 — Create the Demo Case

1. Open `http://localhost:5173`
2. Click **Cases** in the navigation
3. Click **+ New Case**
4. Fill in:
   - **Title:** `Operation: Midnight Blue`
   - **Severity:** `Critical`
   - **Status:** `Investigating`
   - **Source:** `Windows Logs`
   - **Affected Host:** `WORKSTATION-42`
   - **Affected User:** `jsmith`
   - **Affected IP:** `10.10.50.201`
   - **Description:** `Multi-stage compromise — credential spray, encoded PowerShell, C2 beacon, lateral movement attempt`
5. Click **Create Case**

---

### Step 2 — Upload Evidence

From the Case Detail page, scroll to the **Evidence** panel and upload each file from `sample-data/demo-incident/`:

| File | Purpose |
|------|---------|
| `windows-security.json` | Windows Security Event Log |
| `sysmon-events.json` | Sysmon process/network/DNS events |
| `suricata-alerts.json` | Suricata IDS/IPS alerts (eve.json format) |
| `zeek-conn.log` | Zeek network connection log |
| `zeek-dns.log` | Zeek DNS query log |
| `zeek-http.log` | Zeek HTTP request log |
| `suspicious-payload.ps1.txt` | Static YARA triage target |

---

### Step 3 — Run Windows / Sysmon Analysis

1. Scroll to the **Analysis** section → **Windows Event Log / Sysmon Analysis** panel
2. Select `windows-security.json` from the evidence dropdown → click **Run Analysis**
3. Select `sysmon-events.json` → click **Run Analysis**

**Expected findings:**
- 5+ failed logons for jsmith from 10.10.50.201 → brute force (high)
- Successful logon after failures → credential spray success (high)
- Special privileges assigned to jsmith (medium)
- cmd.exe → powershell.exe process chain (medium)
- PowerShell with encoded command (high)
- PowerShell outbound network connection (high)
- New service installed: WindowsUpdateHelper (high)
- Scheduled task created (medium)
- certutil used for file download on DC-01 (high)
- mshta.exe LOLBAS execution on DC-01 (medium)
- Long DNS query — possible DGA/tunneling (medium)

---

### Step 4 — Run Suricata Analysis

1. **Suricata IDS/IPS Alert Analysis** panel
2. Select `suricata-alerts.json` → click **Run Analysis**

**Expected findings:**
- 6 IDS alerts from 203.0.113.45 → sustained attack (high)
- 203.0.113.45 contacted 6 unique destinations → scanning (high)
- ET MALWARE MSIL/GenericDownloader (critical)
- ET C2 CobaltStrike Beacon (critical)
- ET EXPLOIT EternalBlue MS17-010 (high)

---

### Step 5 — Run Zeek Analysis

Run separately for each log type:

1. **Zeek Network Log Analysis** panel
2. Select `zeek-conn.log` → **Run Analysis**
   - Expected: 12 failed/rejected connections from 10.10.50.201 (lateral scan)
3. Select `zeek-dns.log` → **Run Analysis**
   - Expected: long domain queries (DGA/tunneling), suspicious TLDs (.tk, .xyz)
4. Select `zeek-http.log` → **Run Analysis**
   - Expected: suspicious URIs (/shell.php, /cmd.php), suspicious UAs (sqlmap, python-requests)

---

### Step 6 — Run YARA Static Triage

1. **YARA Static Malware Triage** panel
2. Select `suspicious-payload.ps1.txt` → click **Run Triage**

**Expected YARA matches:**
- `PowerShell_Encoded_Command` — powershell + -EncodedCommand + -noprofile (high)
- `Suspicious_LOLBAS_Usage` — certutil + mshta references (medium)
- `Persistence_Registry_Run_Keys` — CurrentVersion\Run reference (medium)

---

### Step 7 — Run Sigma Detection Rules

1. **Sigma Rule Matching** panel
2. Click **Run Sigma Rules** (runs all attached rules against normalised events)
3. Review findings mapped to MITRE techniques

---

### Step 8 — Run Correlation

1. Scroll to **Correlation & Intelligence** → **Investigation Correlation** panel
2. Click **Run Correlation**
3. Review cross-module findings — the engine links Windows, Suricata, Zeek, and YARA evidence

---

### Step 9 — Run MITRE ATT&CK Mapping

1. **MITRE ATT&CK Mapping** panel → click **Map to ATT&CK**

**Expected techniques:**
- T1110 — Brute Force
- T1059.001 — PowerShell
- T1027 — Obfuscated Files (encoded command)
- T1218 — Signed Binary Proxy Execution (certutil, mshta)
- T1547.001 — Registry Run Keys / Startup Folder
- T1543.003 — Windows Service (persistence)
- T1071 — Application Layer Protocol (C2)

---

### Step 10 — Generate Report

1. Scroll to **Reporting & AI** → **Incident Report** panel
2. Click **Generate Report**
3. A Markdown incident report is saved to `reports/generated/`
4. Click **View Report Content** to review in the UI

---

### Step 11 — AI Investigation Summary (Optional)

1. **AI Investigation Assistant** panel
2. Click **Summarize Case** for a grounded AI summary of all findings
3. Click **Recommended Next Steps** for evidence gap analysis

> Requires `ANTHROPIC_API_KEY` environment variable set in `services/api/.env`.
> Skip this step for a purely local demo.

---

### Step 12 — Review the Timeline

The **Timeline** panel shows all analysis-generated and manually added events in chronological order. After running all analyses you should see 15–25 timeline entries covering the full 08:01–09:30 attack window.

---

## Frontend Smoke Tests

After making code changes, manually verify these paths:

| Check | Expected |
|-------|----------|
| `GET /` | Dashboard loads, API status shows online |
| `GET /cases` | Cases list loads with filter row |
| Create case via form | Redirected to case detail with correct data |
| Upload evidence file | File appears in evidence list |
| Run any analysis | Loading state → findings table |
| Delete case | Redirected to cases list, case gone |
| `GET /sigma` | Sigma rules list loads |
| `GET /yara` | YARA rules list loads |
| `GET /reports` | Reports list loads |
| `GET /splunk` | SPL assistant and templates load |
| `GET /elastic` | KQL hunt assistant and templates load |
| `GET /mcp` | MCP tool catalogue loads |

---

## Screenshots for Portfolio

Capture these with populated demo data:

1. **Dashboard** — overview stat row (8 cards) + recent activity columns
2. **Cases list** — filter row with severity filter active
3. **Case detail** — Evidence + Analysis section labels showing multiple panels
4. **MITRE ATT&CK panel** — technique cards populated
5. **Correlation panel** — cross-module findings table
6. **Generated report** — rendered Markdown in the UI

Save to `docs/screenshots/` and reference from `README.md`.
