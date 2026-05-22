# Security Policy — SOC Copilot Workbench

## Supported Versions

This project is in active development. Security fixes are applied to the latest version on `master` only.

| Version | Supported |
|---------|-----------|
| Latest (`master`) | Yes |
| Older commits | No |

---

## Scope

SOC Copilot Workbench is a **local single-analyst tool** intended to run on `localhost` only.

The following are **in scope** for security reports:

- Path traversal vulnerabilities in the file upload handler
- Arbitrary file write or read via the API
- Injection vulnerabilities (SQL, command, template) in the backend
- Hardcoded credentials or secrets in source code
- Parser vulnerabilities that could allow code execution from a crafted log file
- CORS misconfiguration that could expose the API to untrusted origins

The following are **out of scope** (by design for a local dev tool):

- No authentication — the tool is localhost-only; there are no user sessions to attack
- No HTTPS — expected for local development; use a reverse proxy for network deployment
- No rate limiting — a local single-user tool; add at the proxy layer for shared deployments

See [docs/threat-model.md](docs/threat-model.md) for the full threat model and [docs/security-model.md](docs/security-model.md) for implemented controls.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

To report a vulnerability, email:

**smrdici.koala@gmail.com**

Please include:

1. A description of the vulnerability
2. Steps to reproduce it
3. The potential impact
4. Your suggested fix (optional)

You will receive a response within 7 days. If the report is confirmed, a fix will be issued on `master` as soon as practical. You will be credited in the release notes unless you prefer to remain anonymous.

---

## Security Design Principles

- **Static analysis only** — uploaded files are read but never executed
- **No outbound calls** except to AI providers you explicitly configure
- **No telemetry** — nothing is sent anywhere without your configuration
- **Path traversal protected** — filename sanitization + `Path.is_relative_to()` check
- **Upload size capped** — 50 MB hard limit before disk write
- **Input validated** — Pydantic v2 constraints on all API inputs
- **Secrets in environment only** — `.env` is gitignored; no credentials in source

---

## Defensive Tool Notice

This project is built for **blue-team SOC analysts** only. It contains no offensive functionality, exploit code, or malware execution capability. If you discover code that could be used offensively, please report it as a security issue.
