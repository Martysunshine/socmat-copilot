import { useEffect, useState } from 'react'
import { getSPLTemplates, runQueryAssistant, type SPLTemplate, type SPLAssistantResult } from '../api/splunk'

export default function SplunkPage() {
  const [templates, setTemplates] = useState<SPLTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [intent, setIntent] = useState('')
  const [assisting, setAssisting] = useState(false)
  const [assistResult, setAssistResult] = useState<SPLAssistantResult | null>(null)
  const [assistError, setAssistError] = useState<string | null>(null)

  useEffect(() => {
    getSPLTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false))
  }, [])

  async function handleAssist() {
    if (!intent.trim()) return
    setAssisting(true)
    setAssistError(null)
    setAssistResult(null)
    try {
      const r = await runQueryAssistant(intent.trim())
      setAssistResult(r)
    } catch (e: unknown) {
      setAssistError(e instanceof Error ? e.message : 'Query assistant failed')
    } finally {
      setAssisting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Splunk Module</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Analyze Splunk exports and generate SPL investigation queries
          </p>
        </div>
        <span className="phase-badge">Phase 15</span>
      </div>

      {/* SPL Query Assistant */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">SPL Query Assistant</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Describe what you want to investigate and get a structured SPL query with
          analyst guidance. Examples: "find failed logins", "detect encoded PowerShell",
          "suspicious outbound network connections".
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            type="text"
            placeholder="Describe your investigation intent…"
            value={intent}
            onChange={e => setIntent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAssist()}
          />
          <button
            className="btn btn-primary"
            onClick={handleAssist}
            disabled={!intent.trim() || assisting}
          >
            {assisting ? 'Generating…' : 'Generate Query'}
          </button>
        </div>

        {assistError && (
          <div className="state-box state-error" style={{ marginBottom: 16 }}>
            <strong>Error</strong><p>{assistError}</p>
          </div>
        )}

        {assistResult && <SPLResultCard result={assistResult} />}
      </div>

      {/* Template Library */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">
            SPL Query Templates{templates.length > 0 ? ` (${templates.length})` : ''}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Pre-built queries for common SOC investigation patterns. Click a template
          to expand the full query and analyst guidance.
        </p>

        {templatesLoading && <div className="state-box">Loading templates…</div>}

        {!templatesLoading && (
          <div className="splunk-template-list">
            {templates.map(t => (
              <TemplateRow
                key={t.id}
                template={t}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId(expandedId === t.id ? null : t.id)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TemplateRow({
  template,
  expanded,
  onToggle,
}: {
  template: SPLTemplate
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`splunk-template-row${expanded ? ' splunk-template-row--open' : ''}`}>
      <button className="splunk-template-header" onClick={onToggle}>
        <div className="splunk-template-header-left">
          <span className="splunk-template-title">{template.title}</span>
          <span className="splunk-template-desc">{template.description}</span>
        </div>
        <span className="splunk-template-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && <SPLResultCard result={template} />}
    </div>
  )
}

function SPLResultCard({ result }: { result: SPLTemplate & { matched_by?: string } }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(result.spl_query).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="splunk-result-card">
      {'matched_by' in result && result.matched_by && result.matched_by !== 'default' && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Matched on: <code style={{ fontSize: 12 }}>{result.matched_by}</code>
          {' → '}<strong style={{ color: 'var(--text-primary)' }}>{result.title}</strong>
        </div>
      )}

      <div className="splunk-result-section">
        <div className="splunk-result-label">What it detects</div>
        <p className="splunk-result-text">{result.detects}</p>
      </div>

      <div className="splunk-result-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="splunk-result-label" style={{ marginBottom: 0 }}>SPL Query</div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 10px' }} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="splunk-spl-block">{result.spl_query}</pre>
      </div>

      <div className="splunk-result-section">
        <div className="splunk-result-label">Index / Sourcetype Assumptions</div>
        <code className="splunk-spl-inline">{result.index_sourcetype}</code>
      </div>

      <div className="splunk-result-section">
        <div className="splunk-result-label">Expected Fields</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {result.expected_fields.map(f => (
            <span key={f} className="mcp-tag mcp-tag--caseid">{f}</span>
          ))}
        </div>
      </div>

      <div className="splunk-two-col">
        <div className="splunk-result-section">
          <div className="splunk-result-label">Possible False Positives</div>
          <ul className="splunk-list">
            {result.false_positives.map((fp, i) => <li key={i}>{fp}</li>)}
          </ul>
        </div>

        <div className="splunk-result-section">
          <div className="splunk-result-label">Investigation Steps</div>
          <ol className="splunk-list">
            {result.investigation_steps.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      </div>
    </div>
  )
}
