import { useEffect, useState } from 'react'
import {
  getHuntTemplates,
  runHuntAssistant,
  type HuntTemplate,
  type HuntAssistantResult,
} from '../api/elastic'
import { getCases, type Case } from '../api/cases'

export default function ElasticPage() {
  const [templates, setTemplates] = useState<HuntTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [intent, setIntent] = useState('')
  const [selectedCaseId, setSelectedCaseId] = useState<number | ''>('')
  const [cases, setCases] = useState<Case[]>([])
  const [assisting, setAssisting] = useState(false)
  const [assistResult, setAssistResult] = useState<HuntAssistantResult | null>(null)
  const [assistError, setAssistError] = useState<string | null>(null)
  const [savedToCaseId, setSavedToCaseId] = useState<number | null>(null)

  useEffect(() => {
    getHuntTemplates()
      .then(setTemplates)
      .catch(() => setTemplates([]))
      .finally(() => setTemplatesLoading(false))
    getCases()
      .then(setCases)
      .catch(() => setCases([]))
  }, [])

  async function handleAssist() {
    if (!intent.trim()) return
    setAssisting(true)
    setAssistError(null)
    setAssistResult(null)
    setSavedToCaseId(null)
    try {
      const caseId = selectedCaseId !== '' ? Number(selectedCaseId) : undefined
      const r = await runHuntAssistant(intent.trim(), caseId)
      setAssistResult(r)
      if (caseId) setSavedToCaseId(caseId)
    } catch (e: unknown) {
      setAssistError(e instanceof Error ? e.message : 'Hunt assistant failed')
    } finally {
      setAssisting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Elastic Module</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Analyze Kibana exports and generate KQL/ES|QL threat hunting queries
          </p>
        </div>
        <span className="phase-badge">Phase 16</span>
      </div>

      {/* KQL/ES|QL Hunt Assistant */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">KQL / ES|QL Hunt Assistant</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Describe what you want to hunt for and get a structured KQL and ES|QL query
          with analyst guidance. Examples: "detect encoded PowerShell", "find DNS tunneling",
          "authentication failures followed by success".
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
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
            {assisting ? 'Generating…' : 'Generate Hunt Query'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <select
            className="inline-select"
            value={selectedCaseId}
            onChange={e => setSelectedCaseId(e.target.value === '' ? '' : Number(e.target.value))}
            style={{ width: 260 }}
          >
            <option value="">Save to case (optional)…</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>#{c.id} — {c.title}</option>
            ))}
          </select>
          {savedToCaseId && (
            <span style={{ fontSize: 13, color: 'var(--color-success, #3fb950)' }}>
              Hunt saved to case #{savedToCaseId} timeline
            </span>
          )}
        </div>

        {assistError && (
          <div className="state-box state-error" style={{ marginBottom: 16 }}>
            <strong>Error</strong><p>{assistError}</p>
          </div>
        )}

        {assistResult && <HuntResultCard result={assistResult} />}
      </div>

      {/* Hunt Template Library */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">
            Hunt Template Library{templates.length > 0 ? ` (${templates.length})` : ''}
          </div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Pre-built KQL and ES|QL queries for common threat hunting scenarios.
          Click a template to expand the full query and analyst guidance.
        </p>

        {templatesLoading && <div className="state-box">Loading templates…</div>}

        {!templatesLoading && (
          <div className="elastic-template-list">
            {templates.map(t => (
              <HuntTemplateRow
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

function HuntTemplateRow({
  template,
  expanded,
  onToggle,
}: {
  template: HuntTemplate
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className={`elastic-template-row${expanded ? ' elastic-template-row--open' : ''}`}>
      <button className="elastic-template-header" onClick={onToggle}>
        <div className="elastic-template-header-left">
          <span className="elastic-template-title">{template.title}</span>
          <span className="elastic-template-desc">{template.description}</span>
        </div>
        <span className="elastic-template-chevron">{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && <HuntResultCard result={template} />}
    </div>
  )
}

function HuntResultCard({ result }: { result: HuntTemplate & { matched_by?: string } }) {
  const [activeTab, setActiveTab] = useState<'kql' | 'esql'>('kql')
  const [copied, setCopied] = useState(false)

  const activeQuery = activeTab === 'kql' ? result.kql_query : result.esql_query

  function handleCopy() {
    navigator.clipboard.writeText(activeQuery).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="elastic-result-card">
      {'matched_by' in result && result.matched_by && result.matched_by !== 'default' && (
        <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-muted)' }}>
          Matched on: <code style={{ fontSize: 12 }}>{result.matched_by}</code>
          {' → '}<strong style={{ color: 'var(--text-primary)' }}>{result.title}</strong>
        </div>
      )}

      <div className="elastic-result-section">
        <div className="elastic-result-label">What it hunts for</div>
        <p className="elastic-result-text">{result.detects}</p>
      </div>

      <div className="elastic-result-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ display: 'flex', gap: 0 }}>
            <button
              className={`elastic-tab-btn${activeTab === 'kql' ? ' elastic-tab-btn--active' : ''}`}
              onClick={() => { setActiveTab('kql'); setCopied(false) }}
            >
              KQL
            </button>
            <button
              className={`elastic-tab-btn${activeTab === 'esql' ? ' elastic-tab-btn--active' : ''}`}
              onClick={() => { setActiveTab('esql'); setCopied(false) }}
            >
              ES|QL
            </button>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '2px 10px' }} onClick={handleCopy}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="elastic-query-block">{activeQuery}</pre>
      </div>

      <div className="elastic-result-section">
        <div className="elastic-result-label">Index Pattern</div>
        <code className="elastic-query-inline">{result.index_pattern}</code>
      </div>

      <div className="elastic-result-section">
        <div className="elastic-result-label">Required ECS Fields</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {result.required_ecs_fields.map(f => (
            <span key={f} className="mcp-tag mcp-tag--caseid">{f}</span>
          ))}
        </div>
      </div>

      <div className="elastic-two-col">
        <div className="elastic-result-section">
          <div className="elastic-result-label">Possible False Positives</div>
          <ul className="elastic-list">
            {result.false_positives.map((fp, i) => <li key={i}>{fp}</li>)}
          </ul>
        </div>

        <div className="elastic-result-section">
          <div className="elastic-result-label">Recommended Pivots</div>
          <ol className="elastic-list">
            {result.recommended_pivots.map((p, i) => <li key={i}>{p}</li>)}
          </ol>
        </div>
      </div>
    </div>
  )
}
