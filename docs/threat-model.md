# Threat Model — SOC Copilot Workbench

> Scope: local single-analyst deployment on a trusted workstation.
> This document describes what the tool protects against, what it does not, and why.

---

## System Description

SOC Copilot Workbench is a FastAPI backend + React frontend running on `localhost`. It accepts log evidence files, applies static analysis, and displays findings. It stores all data in a local SQLite database.

**Out-of-scope for this threat model:**
- Network-accessible multi-user deployments (see [security-model.md](security-model.md))
- Browser security (depends on the analyst's browser and OS)
- Host-level security

---

## Assets to Protect

| Asset | Why it matters |
|-------|---------------|
| Uploaded evidence files | May contain sensitive log data, IP addresses, credentials visible in logs |
| Case notes and findings | Analyst work product — may reference sensitive infrastructure |
| `ANTHROPIC_API_KEY` (if set) | Billable credential — exposure leads to cost and data leakage |
| Local SQLite database | Contains all case data and analysis findings |

---

## Threat Actors

For a single-analyst local tool, the primary threat is **accidental exposure** rather than targeted attack:

| Actor | Scenario | Likelihood |
|-------|----------|-----------|
| Malicious evidence file | Attacker crafts log file to exploit parser | Low — parsers use stdlib JSON/CSV; no deserialisation of untrusted objects |
| Path traversal via filename | Attacker supplies a filename like `../../etc/passwd` to overwrite system files | Mitigated — filename sanitisation + `is_relative_to()` check |
| Oversized upload (DoS) | Attacker uploads multi-GB file to exhaust disk | Mitigated — 50 MB hard limit enforced before disk write |
| Secret leakage via git | Developer accidentally commits `.env` with API key | Mitigated — `.gitignore` includes `.env` |
| SSRF via AI provider | Malicious case input causes AI call to an attacker-controlled URL | N/A — AI calls go to fixed provider endpoints; user input is only embedded in prompt text |

---

## Attack Surface

```
Browser (localhost:5173)
    │
    ▼ HTTP (Vite dev proxy or direct)
FastAPI (localhost:8000)
    ├── /cases            — CRUD (SQLite write)
    ├── /cases/{id}/evidence — File upload → ./uploads/
    ├── /cases/{id}/analyze/* — Read from ./uploads/, write to SQLite
    ├── /cases/{id}/ai/*   — Optional: HTTP to Anthropic/OpenAI API
    └── /health, /docs    — Read-only
```

The API has no inbound network route other than localhost. All state is local.

---

## Mitigations in Place

| Threat | Mitigation |
|--------|-----------|
| Path traversal | `_safe_filename()` + `is_relative_to(UPLOAD_DIR)` |
| Oversized upload | `MAX_UPLOAD_BYTES = 50 MB` enforced before disk write |
| Malicious JSON/CSV | `json.loads()` + stdlib `csv` — no pickle, no exec |
| Arbitrary YARA execution | YARA rules are loaded from `rules/yara/` only; uploaded files are matched against rules, not compiled as rules |
| CORS abuse | `allow_origins` restricted to `localhost:5173` |
| Input length abuse | Pydantic field constraints on all case fields |
| Secret exposure | API keys from env only; `.env` gitignored; `.env.example` has no real values |
| File execution | Uploaded files are never passed to `subprocess`, `exec()`, or any interpreter |

---

## Known Limitations / Residual Risks

| Risk | Notes |
|------|-------|
| No authentication | Any local process or browser tab can call the API. Acceptable for single-analyst localhost use only. |
| No rate limiting | Rapid API calls could stress SQLite. Not a concern locally. |
| YARA rule files | `rules/yara/` is read from disk at startup. A compromised rules directory could cause unexpected YARA behaviour. Keep the repo clean. |
| AI prompt injection | A malicious log file could embed text that influences AI summary output. The AI response is read-only — it cannot modify case data. |
| Uploaded file retention | Evidence files persist in `./uploads/` indefinitely. Delete the uploads directory when decommissioning a lab instance. |
| SQLite in-process | No row-level locking or multi-process safety. Run one API instance only. |

---

## Out-of-Scope Threats

These are real threats in a production SOC platform but are explicitly outside the scope of this local-first MVP:

- Privilege escalation between analysts
- Insider threat / case data tampering
- Network interception of API traffic (no TLS in dev mode)
- Supply-chain attacks on Python/npm dependencies

Refer to [security-model.md](security-model.md) for hardening steps before any shared deployment.
