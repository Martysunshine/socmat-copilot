from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import health, cases, evidence, timeline, windows_logs, suricata, sigma, yara as yara_router, zeek as zeek_router, correlation as correlation_router, mitre as mitre_router, reports as reports_router, ai_assistant as ai_assistant_router, mcp_status as mcp_status_router, splunk as splunk_router, splunk_live as splunk_live_router, elastic as elastic_router, elastic_live as elastic_live_router, dashboard as dashboard_router, pcap as pcap_router, rule_authoring as rule_authoring_router, playbooks as playbooks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from integrations.yara.loader import load_yara_rules
    load_yara_rules()
    from playbook_seeds import seed_playbook_templates
    seed_playbook_templates()
    yield


app = FastAPI(
    title="SOC Copilot Workbench API",
    description="Local-first defensive SOC automation platform",
    version="0.26.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(cases.router)
app.include_router(evidence.router)
app.include_router(timeline.router)
app.include_router(windows_logs.router)
app.include_router(suricata.router)
app.include_router(sigma.router)
app.include_router(yara_router.router)
app.include_router(zeek_router.router)
app.include_router(correlation_router.router)
app.include_router(mitre_router.router)
app.include_router(reports_router.router)
app.include_router(ai_assistant_router.router)
app.include_router(mcp_status_router.router)
app.include_router(splunk_router.router)
app.include_router(splunk_live_router.router)
app.include_router(elastic_router.router)
app.include_router(elastic_live_router.router)
app.include_router(pcap_router.router)
app.include_router(rule_authoring_router.router)
app.include_router(playbooks_router.router)
app.include_router(dashboard_router.router)
