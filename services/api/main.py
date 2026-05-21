from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import health, cases, evidence, timeline, windows_logs, suricata, sigma, yara as yara_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from integrations.yara.loader import load_yara_rules
    load_yara_rules()
    yield


app = FastAPI(
    title="SOC Copilot Workbench API",
    description="Local-first defensive SOC automation platform",
    version="0.8.0",
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
