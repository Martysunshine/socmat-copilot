# Security Model — SOC Copilot Workbench

> **Defensive tool only.** This platform is built for blue-team SOC analysts.
> It contains no offensive functionality, exploit code, or malware execution capability.

---

## Design Principles

| Principle | Implementation |
|-----------|---------------|
| Static analysis only | Uploaded files are read but never executed or interpreted as code |
| Local-first | All data stays on the analyst's machine; no external telemetry |
| Minimal attack surface | No authentication layer (single-user local tool) — add a reverse proxy with auth for multi-user deployments |
| Fail safe | Parser errors are caught and logged; they do not crash the API or expose stack traces to clients |

---

## File Upload Security

### Size limit
Every upload is capped at **50 MB**. Files exceeding this limit are rejected with HTTP 413 before being written to disk.

### Path traversal protection
Uploaded filenames are sanitised by:
1. Stripping any directory component (`Path(original).name`)
2. Replacing all characters outside `[a-zA-Z0-9_\-.]` with underscores
3. Stripping leading dots (prevents hidden-file creation)
4. Prepending a UUID4 hex prefix to ensure uniqueness

After construction, the resolved destination path is checked with `is_relative_to(UPLOAD_DIR)`. Any path that escapes the upload directory is rejected with HTTP 400.

### Storage isolation
All uploads are written to `./uploads/` (relative to the running API process). This directory is gitignored. Uploaded files are never served back as executable content.

### Files are never executed
Parsers read file bytes and apply pattern matching or structured parsing. No subprocess calls, `exec()`, `eval()`, or dynamic imports use uploaded content.

---

## API Input Validation

Pydantic v2 schemas enforce:

| Field | Constraint |
|-------|-----------|
| `title` | 1–200 characters |
| `description` | max 10,000 characters |
| `affected_host` | max 253 characters (DNS label limit) |
| `affected_user` | max 256 characters |
| `affected_ip` | max 45 characters (IPv6 max length) |
| Severity / Status / Source | Enum — only allowed values accepted |

FastAPI returns HTTP 422 with field-level error detail for any validation failure.

---

## CORS Configuration

The API allows requests only from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

This is intentional for local development. If deploying behind a reverse proxy, update `allow_origins` in `services/api/main.py` to match your frontend origin.

---

## Secrets Handling

| Secret | How it's managed |
|--------|-----------------|
| `ANTHROPIC_API_KEY` | Read from environment variable only — never hardcoded |
| `OPENAI_API_KEY` | Read from environment variable only — never hardcoded |
| `.env` file | Listed in `.gitignore` — will never be committed |
| `.env.example` | Template with no real values — safe to commit |

The AI assistant defaults to a mock provider (`AI_PROVIDER=mock`) that requires no API key.

---

## What Is NOT Included in MVP

The following security controls are out of scope for the local development MVP and should be added before any multi-user or network-accessible deployment:

- **Authentication / authorisation** — no user sessions or access control
- **Rate limiting** — no per-IP or per-user request throttling
- **HTTPS / TLS** — not configured; use a reverse proxy (nginx, Caddy) in front of the API for HTTPS
- **Audit logging** — API calls are not logged to a security audit trail
- **Input sanitisation for stored content** — findings and timeline entries are stored as-is; sanitise before rendering in a non-React context

---

## Recommended Deployment Posture

For any deployment beyond a single analyst's laptop:

1. Place the API behind a reverse proxy with TLS termination
2. Add HTTP Basic Auth or OAuth2 at the proxy layer
3. Bind uvicorn to `127.0.0.1` only (`--host 127.0.0.1`)
4. Do not expose port 8000 directly to a network
5. Store `.env` with a real `ANTHROPIC_API_KEY` using your OS secret manager or CI vault — never in the repo

---

## Advanced Feature Security Controls (Phases 26–33)

| Feature | Security control |
|---------|----------------|
| Analyst Notes | Stored as plain text; frontend renders in React (no `dangerouslySetInnerHTML`) — no stored XSS risk |
| IOC Extraction | Purely local extraction from DB data — no external lookups, no DNS resolution, no threat intel API calls |
| IOC Basket | Manual analyst tags only — no automatic reputation lookup or external enrichment |
| Entity Graph | Reads only from the case's own DB rows — cannot leak data across cases |
| Timeline Replay | Explanations are generated server-side from DB events — AI cannot fabricate replay steps |
| Finding Dispositions | Analyst-controlled only — the AI assistant reads dispositions as advisory context but cannot set them |
| Report Readiness | Computed from DB queries — no fabrication; missing checks shown honestly as missing |
| AI context injection | `context_builder.py` labels all AI keys; analyst notes marked "analyst opinion — not verified"; dispositions marked "AI advisory only — analyst decision is final" |

---

## Safety Notes

- Do not upload live malware outside an isolated lab environment.
- Do not connect production SIEM credentials in development mode.
- This project is for **defensive** SOC workflows only.
- Static analysis means no dynamic execution — the tool cannot detonate payloads.
- Analyst notes, IOC tags, and dispositions are analyst-authored — the AI cannot modify them.
