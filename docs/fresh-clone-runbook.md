# Fresh-Clone Validation Runbook

**SOC Copilot Workbench — local validation guide for analysts and recruiters**

This runbook walks you from a fresh `git clone` to a fully running demo. Every command is copy-pasteable. Estimated time: 10–15 minutes with Docker.

---

## 1. Prerequisites

| Requirement | Minimum version | Check command |
|-------------|----------------|---------------|
| Git | any | `git --version` |
| Docker | 24+ | `docker --version` |
| Docker Compose | V2 (bundled with Docker Desktop) | `docker compose version` |
| **OR** Python | 3.11+ | `python --version` |
| **OR** Node.js | 18+ | `node --version` |

Docker Compose is the recommended path. Python + Node are only needed for the local-dev fallback.

---

## 2. Clone the Repository

```bash
git clone https://github.com/Martysunshine/socmat-copilot.git
cd socmat-copilot
```

---

## 3. Docker Compose Startup (Recommended)

```bash
docker compose up --build
```

First build downloads base images and installs dependencies — allow 3–5 minutes.

**Expected output:**
```
backend   | INFO:     Application startup complete.
frontend  | VITE v5.x.x  ready in Xms
frontend  |   ➜  Local:   http://localhost:5173/
```

Leave this terminal open. All services log here.

---

## 4. Local Development Fallback (no Docker)

If Docker is unavailable, run backend and frontend in separate terminals.

**Terminal 1 — backend:**
```bash
cd services/api
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — frontend:**
```bash
cd apps/web
npm install
npm run dev
```

**Optional — create a `.env` file to configure AI provider:**
```bash
cp services/api/.env.example services/api/.env
# Edit services/api/.env — default AI_PROVIDER=mock works without any API key
```

---

## 5. Backend Health Check

```bash
curl http://localhost:8000/health
```

Expected:
```json
{"status": "ok", "version": "0.33.0"}
```

---

## 6. Frontend Check

Open [http://localhost:5173](http://localhost:5173) in your browser.

You should see the SOC Copilot Workbench dashboard with a navigation bar across the top.

---

## 7. API Docs Check

Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.

You should see the FastAPI interactive Swagger UI listing all 83 endpoints.

---

## 8. Demo Seed Script

The seed script creates a complete fictional incident case called **"Operation: Midnight Blue"** and runs all analysis modules automatically.

```bash
# Requires Python + requests library (already installed if you used the venv above)
pip install requests   # if running against Docker backend

python scripts/seed_demo.py
```

With verbose output:
```bash
python scripts/seed_demo.py --verbose
```

Point at a different backend:
```bash
python scripts/seed_demo.py --api http://localhost:8000
```

**Expected output:**
```
Connecting to http://localhost:8000 …
  API online
Creating demo case …
  Case ID: 1
Uploading evidence files …
  windows-security.json — evidence ID: 1
  sysmon-events.json — evidence ID: 2
  ...
Running Windows/Sysmon analysis …
  Done — 14 events, 3 findings
Running Suricata analysis …
  Done — 8 alerts, 4 findings
...
Generating incident report …
  Done — report saved

------------------------------------------------------
 Demo case ready!
 Case ID  : 1
 Case URL : http://localhost:5173/cases/1
------------------------------------------------------
```

---

## 9. Demo Case Walkthrough

Open [http://localhost:5173/cases/1](http://localhost:5173/cases/1) after running the seed script.

### 9.1 Core analysis tabs (auto-populated by seed)
- **Evidence** — 7 uploaded files with SHA-256 hashes
- **Timeline** — events from Windows, Suricata, and Zeek logs
- **Windows Analysis** — normalized Sysmon events, process trees
- **Suricata** — parsed IDS alerts with severity and attacker IPs
- **Zeek** — network connection, DNS, and HTTP log analysis
- **YARA Triage** — static match against the PowerShell payload
- **Sigma** — detection rule findings
- **Correlation** — cross-module attack pattern findings
- **MITRE ATT&CK** — technique mapping

### 9.2 Advanced workflow tabs (manual steps after seed)
These features require a few manual actions to populate:

| Feature | Where | Action |
|---------|-------|--------|
| Analyst Playbooks | Case detail → Analyst Playbooks | Click "Attach" on a suggested playbook |
| Analyst Notes | Case detail → Analyst Notes | Click "+ Add Note", choose type and content |
| IOC Basket | Case detail → IOC Basket | Click "Extract IOCs" to auto-populate |
| Entity Graph | Case detail → Investigation Map | Graph auto-builds from existing findings |
| Timeline Replay | Case detail → Timeline → "Replay Mode" | Click Replay Mode button |
| Detection Coverage | Case detail → Detection Coverage | Panel auto-loads from Sigma rules |
| Finding Disposition | Case detail → Finding Disposition | Click "Add Disposition" for any finding |
| Report Readiness | Case detail → Report Readiness | Widget auto-computes on page load |

### 9.3 Report generation
- Case detail → Incident Report → **Generate Report**
- After generation: Preview, Download .md, or Download PDF

---

## 10. Test Commands

```bash
# Backend unit tests (from repo root)
cd services/api
pip install pytest
pytest ../../tests/ -v

# Or from repo root with Python path:
python -m pytest tests/ -v
```

Expected output: all tests PASS. Tests cover:
- Suricata parser
- Windows/Sysmon parser
- (Advanced feature tests added in v1.0.0-local)

---

## 11. Common Troubleshooting

### Backend won't start

**Symptom:** `uvicorn: command not found` or import errors
```bash
pip install -r services/api/requirements.txt
```

**Symptom:** `yara-python` install fails  
`yara-python` requires a C compiler. On Windows, install Visual C++ Build Tools. On Ubuntu: `apt-get install build-essential`. Alternatively, the backend runs without YARA support if the import fails gracefully.

**Symptom:** Port 8000 already in use
```bash
# Kill whatever is on 8000, then restart
```

### Frontend won't start

**Symptom:** `npm install` errors
```bash
cd apps/web && rm -rf node_modules package-lock.json && npm install
```

**Symptom:** API calls fail with "Network Error"  
Verify the backend is running on port 8000. The Vite proxy forwards `/api/*` to the backend.

### Docker Compose issues

**Symptom:** Frontend `localhost:8000` connection refused inside container  
This is a known proxy issue if using an older image. Rebuild:
```bash
docker compose down && docker compose up --build
```

**Symptom:** Permission error on `uploads/` or `reports/generated/`  
```bash
mkdir -p uploads reports/generated
```

### Seed script fails

**Symptom:** `Cannot connect to http://localhost:8000`  
The backend must be running before you run the seed script.

**Symptom:** `requests` not found
```bash
pip install requests
```

---

## 12. Advanced Feature Validation

After running the seed script and opening the demo case:

### Analyst Playbooks
1. Open case → scroll to **Analyst Playbooks**
2. Verify suggested playbooks appear (based on brute-force and PowerShell findings)
3. Click **Attach** on "Brute Force / Successful Login After Failures"
4. Mark step 1 as **Done**, add an analyst note
5. Verify progress bar updates

### Analyst Notes
1. Open case → scroll to **Analyst Notes**
2. Click **+ Add Note**, type "observation", content "Initial triage complete"
3. Verify note appears in the list with timestamp

### IOC Basket
1. Open case → scroll to **IOC Basket**
2. Click **Extract IOCs**
3. Verify IPs, domains, hashes, and processes appear from the evidence
4. Try tagging one IOC as "confirmed_malicious"
5. Click **Export CSV**

### Entity Graph
1. Open case → scroll to **Investigation Map**
2. Verify nodes for host, user, IPs, processes, and MITRE techniques appear
3. Click a node to see the detail panel
4. Use filter toggles to show/hide node types

### Timeline Replay
1. Open case → **Timeline** → click **Replay Mode**
2. Press **Play** — events should advance with explanations
3. Use ← → keyboard shortcuts to step through events
4. Verify MITRE mappings appear per event

### Detection Coverage
1. Open case → scroll to **Detection Coverage**
2. Verify triggered/not-triggered rule counts appear
3. Check the telemetry gap catalogue (7 gaps)
4. Navigate to the global **Coverage** page in the top nav

### Finding Disposition
1. Open case → scroll to **Finding Disposition**
2. Click **Add Disposition**
3. Set disposition to "true_positive", confidence "high", add a reason
4. Verify it appears in the metric summary cards

### Report Readiness
1. Open case → scroll to **Report Readiness**
2. Check the score and grade (should be partial since manual steps are missing)
3. Review the missing check list
4. Complete some missing items, regenerate — score should improve

---

## 13. Expected Success Criteria

| Step | Success signal |
|------|---------------|
| `docker compose up --build` | Both services healthy, no crash loops |
| `GET /health` | `{"status": "ok"}` |
| `GET /docs` | Swagger UI loads with 83 endpoints |
| `python scripts/seed_demo.py` | "Demo case ready!" message, Case ID printed |
| Browser — case detail | All core analysis panels show data |
| Browser — report generation | Markdown report generated and downloadable |
| Browser — advanced features | Panels load without errors; manual steps produce output |
| `pytest tests/ -v` | All tests PASS |

---

## 14. Useful URLs (local)

| URL | Description |
|-----|-------------|
| `http://localhost:5173` | Frontend dashboard |
| `http://localhost:5173/cases` | Case list |
| `http://localhost:5173/cases/1` | Demo case (after seed) |
| `http://localhost:5173/coverage` | Detection coverage browser |
| `http://localhost:5173/playbooks` | Playbook template browser |
| `http://localhost:8000/docs` | FastAPI interactive docs |
| `http://localhost:8000/health` | Health check |
| `http://localhost:8000/playbooks/templates` | Raw playbook templates JSON |
