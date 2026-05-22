# Contributing to SOC Copilot Workbench

Thank you for your interest in contributing. This project is a local-first defensive SOC automation platform. Contributions that help blue-team analysts investigate incidents more effectively are welcome.

---

## Scope

This is a **defensive tool only**.

Contributions that introduce any of the following will not be accepted:
- Offensive functionality or exploit code
- Malware execution or detonation capability
- Active attack tooling of any kind
- Capability to bypass detection or evasion techniques

If you are unsure whether a contribution is in scope, open an issue first.

---

## What We Welcome

- Bug fixes and correctness improvements
- New log source parsers (Syslog, CEF, Windows Security events, etc.)
- Additional Sigma rules for defensive detection
- Additional YARA rules for malware artifact detection
- MITRE ATT&CK coverage improvements
- Frontend UX improvements
- Documentation and example evidence files
- Test coverage improvements

---

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a feature branch: `git checkout -b feature/my-improvement`
4. Make your changes
5. Run the tests: `pytest tests/ -v`
6. Push and open a pull request against `master`

---

## Development Setup

**Backend:**

```bash
cd services/api
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend:**

```bash
cd apps/web
npm install
npm run dev
```

**Tests:**

```bash
pytest tests/ -v
```

---

## Code Style

- **Python:** follow PEP 8; use `black` for formatting if available
- **TypeScript/React:** follow the existing component patterns; no new UI libraries
- **No comments explaining what the code does** — use clear names instead
- **No placeholder code** — all contributions must be functional

---

## Commit Messages

Use the format:

```
short description of change

Optional longer explanation if the why is non-obvious.
```

Keep the first line under 72 characters.

---

## Safe Sample Data

If your contribution includes sample evidence files:
- Use only **synthetic** or **sanitized** data — no real IP addresses, hostnames, or credentials
- Do not include live malware or shellcode in any form
- Place sample files in `sample-data/` with a README explaining the scenario

---

## Security Issues

Do not open a public issue for security vulnerabilities. See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
