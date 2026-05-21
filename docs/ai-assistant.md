# AI Investigation Assistant

## Overview

SOC Copilot Workbench Phase 13 adds an AI-assisted investigation panel that analyzes
stored case data and produces structured analyst guidance.

> **Grounding guarantee:** The AI assistant only uses data already stored in the case.
> It does not access external systems, invent evidence, or fabricate findings.
> If insufficient data exists, the assistant explicitly says so.

---

## Grounding Behavior

The assistant builds a **case context object** from all available analysis data before
calling any AI provider:

- Case details (title, severity, status, affected assets)
- Evidence file metadata (filename, type, SHA-256 prefix)
- Timeline events (up to 30 most recent)
- Sigma detection findings (rule title, severity, match reason)
- YARA triage results (risk score, file type, summary)
- Network analysis results (log type, record count, risk score)
- Correlated findings (title, confidence, recommended action)
- MITRE ATT&CK mappings (technique ID/name, tactic, confidence)

This context is passed verbatim to the AI provider as the sole source of truth.
The system prompt explicitly instructs the AI not to fabricate evidence.

---

## Provider Configuration

### Default: Mock Provider

No configuration required. The mock provider runs deterministic rules-based analysis
against the case context. It is clearly labeled `mock` in the UI.

The mock provider:
- Assesses data sufficiency across 5 analysis sources
- Infers incident type from MITRE tactics and correlated finding titles
- Builds recommendations from correlated finding actions and ATT&CK technique guidance
- Identifies gaps for each analysis module that has not yet been run

### Optional: Anthropic (Claude)

```bash
export AI_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-...
```

Default model: `claude-haiku-4-5-20251001`. Override with:

```bash
export AI_MODEL=claude-sonnet-4-6
```

The `anthropic` package must be installed:

```bash
pip install anthropic
```

### Optional: OpenAI

```bash
export AI_PROVIDER=openai
export OPENAI_API_KEY=sk-...
export AI_MODEL=gpt-4o-mini  # optional, this is the default
```

The `openai` package must be installed:

```bash
pip install openai
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/cases/{id}/ai/summarize` | AI case summary grounded in stored data |
| `POST` | `/cases/{id}/ai/recommend` | AI recommended next steps and evidence gaps |

### Response Schema

```json
{
  "provider": "mock",
  "mode": "summarize",
  "case_id": 5,
  "generated_at": "2024-01-15T12:05:00",
  "summary": "Case '...' is a HIGH severity incident...",
  "key_evidence": ["[HIGH] Sigma: ...", "YARA triage: risk score 3..."],
  "likely_incident_type": "Malicious Code Execution",
  "confidence": "medium",
  "recommended_next_steps": ["Collect and preserve full event logs...", "..."],
  "missing_evidence": ["MITRE ATT&CK mapping not run — ..."],
  "disclaimer": "AI-generated analysis for analyst assistance only. ..."
}
```

**Confidence levels:**

| Level | Meaning |
|-------|---------|
| `insufficient` | No analysis modules have been run |
| `low` | Only one analysis source has data |
| `medium` | Two to three analysis sources have data |
| `high` | Four or more analysis sources have data |

---

## UI Behavior

The **AI Investigation Assistant** panel appears at the bottom of the case detail page.

Three action buttons are available:

| Button | Endpoint | Focus |
|--------|----------|-------|
| **Summarize Case** | `POST /ai/summarize` | Case overview, incident type, key evidence |
| **Recommend Next Steps** | `POST /ai/recommend` | Prioritized defensive actions |
| **Identify Missing Evidence** | `POST /ai/recommend` | Investigation gaps (missing_evidence field) |

Results are labeled with:
- **Provider badge** — `mock`, `anthropic`, or `openai`
- **Confidence level** — color-coded indicator
- **Incident type** — inferred classification
- **Disclaimer** — always shown, reminding analysts this is assistance not final truth

---

## Safety Constraints

- The system prompt instructs the AI to never fabricate evidence
- The system prompt requires defensive-only recommendations
- All content is derived from stored case data passed as context
- No tool use or external API calls occur during AI analysis
- The disclaimer is always included in every response and rendered in the UI
- If the AI provider returns malformed JSON, the raw text is shown as the summary
- If the provider returns a 503 (e.g., missing API key), the error is shown in the UI

---

## Limitations

- AI output is not stored in the database (generated on demand only)
- The mock provider is deterministic, not generative — it does not produce novel analysis
- Long context objects (many timeline events, findings) are truncated at source (30 events max)
- PDF or structured report export of AI output is not supported in Phase 13
- No conversation history — each button click is a fresh request
