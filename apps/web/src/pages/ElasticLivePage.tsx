import { useEffect, useState } from 'react'
import { getHuntTemplates, type HuntTemplate } from '../api/elastic'
import {
  getElasticLiveStatus,
  runElasticLiveSearch,
  runElasticLiveTemplate,
  getElasticLiveQueries,
  type ElasticLiveStatus,
  type ElasticLiveQuery,
} from '../api/elastic_live'

export default function ElasticLivePage() {
  const [status, setStatus] = useState<ElasticLiveStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  const [templates, setTemplates] = useState<HuntTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [maxResults, setMaxResults] = useState(50)
  const [templateRunning, setTemplateRunning] = useState(false)
  const [templateResult, setTemplateResult] = useState<ElasticLiveQuery | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  const [customEsql, setCustomEsql] = useState('')
  const [customRunning, setCustomRunning] = useState(false)
  const [customResult, setCustomResult] = useState<ElasticLiveQuery | null>(null)
  const [customError, setCustomError] = useState<string | null>(null)

  const [history, setHistory] = useState<ElasticLiveQuery[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    getElasticLiveStatus()
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setStatusLoading(false))

    getHuntTemplates()
      .then(t => {
        setTemplates(t)
        if (t.length > 0) setSelectedTemplate(t[0].id)
      })
      .catch(() => setTemplates([]))

    refreshHistory()
  }, [])

  function refreshHistory() {
    setHistoryLoading(true)
    getElasticLiveQueries()
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false))
  }

  async function handleTestConnection() {
    setStatusLoading(true)
    try {
      const s = await getElasticLiveStatus()
      setStatus(s)
    } finally {
      setStatusLoading(false)
    }
  }

  async function handleRunTemplate() {
    if (!selectedTemplate) return
    setTemplateRunning(true)
    setTemplateError(null)
    setTemplateResult(null)
    try {
      const r = await runElasticLiveTemplate(selectedTemplate, { max_results: maxResults })
      setTemplateResult(r)
      refreshHistory()
    } catch (e: unknown) {
      setTemplateError(e instanceof Error ? e.message : 'Template run failed')
    } finally {
      setTemplateRunning(false)
    }
  }

  async function handleRunCustom() {
    if (!customEsql.trim()) return
    setCustomRunning(true)
    setCustomError(null)
    setCustomResult(null)
    try {
      const r = await runElasticLiveSearch({ esql_query: customEsql.trim(), max_results: maxResults })
      setCustomResult(r)
      refreshHistory()
    } catch (e: unknown) {
      setCustomError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setCustomRunning(false)
    }
  }

  const notConfigured = status && !status.configured

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Live Elastic Connector</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Run ES|QL hunt queries against a live Elasticsearch instance using your environment credentials
          </p>
        </div>
        <span className="phase-badge">Phase 23</span>
      </div>

      {/* Safety warning — always visible */}
      <div style={{
        background: 'rgba(210, 90, 0, 0.12)',
        border: '1px solid rgba(210, 90, 0, 0.4)',
        borderRadius: 6,
        padding: '12px 16px',
        marginBottom: 20,
        fontSize: 13,
        color: 'var(--text-primary)',
        lineHeight: 1.5,
      }}>
        <strong style={{ color: '#d85f00' }}>⚠  Security Notice</strong>
        {'  '}Set <code>ELASTIC_URL</code> and <code>ELASTIC_API_KEY</code> in{' '}
        <code>services/api/.env</code> to enable this connector.
        Only read-only ES|QL queries are submitted. Requires Elasticsearch 8.11+.{' '}
        <strong>Do not use production credentials in development or demo environments.</strong>
        {' '}Credentials are read from environment variables and are never stored in the database.
      </div>

      {/* Connection Status */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">Connection Status</div>
          <button
            className="btn btn-secondary"
            onClick={handleTestConnection}
            disabled={statusLoading}
          >
            {statusLoading ? 'Checking…' : 'Test Connection'}
          </button>
        </div>

        {statusLoading && <div className="state-box" style={{ marginTop: 8 }}>Checking…</div>}

        {!statusLoading && status && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12 }}>
              <StatusPill label="Configured" ok={status.configured} />
              <StatusPill label="Connected" ok={status.connected} />
              {status.cluster_info && (
                <StatusPill
                  label={`Cluster: ${status.cluster_info.status}`}
                  ok={status.cluster_info.status === 'green'}
                />
              )}
            </div>

            {status.cluster_info && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, marginTop: 8 }}>
                {Object.entries(status.cluster_info).map(([k, v]) => (
                  <div key={k} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {k.replace(/_/g, ' ')}: </span>
                    {String(v)}
                  </div>
                ))}
              </div>
            )}

            {status.error && (
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-danger, #d85f00)' }}>
                {status.error}
              </div>
            )}

            {notConfigured && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-muted)' }}>
                Set <code>ELASTIC_URL</code> and <code>ELASTIC_API_KEY</code> in your{' '}
                <code>.env</code> file, then restart the backend.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Template Runner */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">Run ES|QL Hunt Template</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Select a pre-built hunt template and run its ES|QL query against your live Elasticsearch instance.
          Results are stored as metadata only — up to 20 sample rows are saved.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
          <select
            className="form-input"
            style={{ flex: 2, minWidth: 200 }}
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            disabled={notConfigured || templates.length === 0}
          >
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <input
            className="form-input"
            style={{ width: 90 }}
            type="number"
            min={1}
            max={500}
            value={maxResults}
            onChange={e => setMaxResults(Number(e.target.value))}
            title="Max results (1–500)"
            disabled={!!notConfigured}
          />
          <button
            className="btn btn-primary"
            onClick={handleRunTemplate}
            disabled={!selectedTemplate || templateRunning || !!notConfigured}
          >
            {templateRunning ? 'Running…' : 'Run Template'}
          </button>
        </div>

        {selectedTemplate && templates.length > 0 && (
          <TemplateDetail template={templates.find(t => t.id === selectedTemplate) ?? null} />
        )}

        {templateError && (
          <div className="state-box state-error" style={{ marginBottom: 12 }}>
            <strong>Error</strong><p>{templateError}</p>
          </div>
        )}
        {templateResult && <QueryResultCard result={templateResult} templates={templates} />}
      </div>

      {/* Custom ES|QL Query */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">Custom ES|QL Query</div>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
          Enter any ES|QL query. A <code>LIMIT</code> clause is appended automatically if absent.
          Requires Elasticsearch 8.11+. Only read-only queries are permitted.
        </p>

        <textarea
          className="form-input"
          style={{ width: '100%', minHeight: 90, fontFamily: 'monospace', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
          placeholder={'FROM logs-*,winlogbeat-*\n| WHERE process.name == "powershell.exe"\n| KEEP @timestamp, host.name, user.name, process.command_line\n| SORT @timestamp DESC'}
          value={customEsql}
          onChange={e => setCustomEsql(e.target.value)}
          disabled={!!notConfigured}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
          <input
            className="form-input"
            style={{ width: 90 }}
            type="number"
            min={1}
            max={500}
            value={maxResults}
            onChange={e => setMaxResults(Number(e.target.value))}
            title="Max results (1–500)"
            disabled={!!notConfigured}
          />
          <button
            className="btn btn-primary"
            onClick={handleRunCustom}
            disabled={!customEsql.trim() || customRunning || !!notConfigured}
          >
            {customRunning ? 'Running…' : 'Run Query'}
          </button>
        </div>

        {customError && (
          <div className="state-box state-error" style={{ marginTop: 12 }}>
            <strong>Error</strong><p>{customError}</p>
          </div>
        )}
        {customResult && (
          <div style={{ marginTop: 12 }}>
            <QueryResultCard result={customResult} templates={templates} />
          </div>
        )}
      </div>

      {/* Query History */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">
            Query History{history.length > 0 ? ` (${history.length})` : ''}
          </div>
          <button className="btn btn-secondary" onClick={refreshHistory} disabled={historyLoading}>
            {historyLoading ? 'Loading…' : 'Refresh'}
          </button>
        </div>

        {historyLoading && <div className="state-box" style={{ marginTop: 8 }}>Loading…</div>}

        {!historyLoading && history.length === 0 && (
          <div className="state-box" style={{ marginTop: 8 }}>
            No queries have been run yet. Use the template runner or custom ES|QL above.
          </div>
        )}

        {!historyLoading && history.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {history.map(q => (
              <HistoryRow key={q.id} query={q} templates={templates} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function TemplateDetail({ template }: { template: HuntTemplate | null }) {
  if (!template) return null
  return (
    <div style={{
      background: 'var(--bg-secondary, #161b22)',
      border: '1px solid var(--border-color, #30363d)',
      borderRadius: 6,
      padding: '12px 14px',
      marginBottom: 14,
      fontSize: 12,
    }}>
      <div style={{ color: 'var(--text-secondary)', marginBottom: 6 }}>{template.description}</div>
      <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>
        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Index: </span>
        {template.index_pattern}
      </div>
      {template.false_positives.length > 0 && (
        <div style={{ color: 'var(--text-muted)' }}>
          <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>False positives: </span>
          {template.false_positives[0]}
          {template.false_positives.length > 1 && ` (+${template.false_positives.length - 1} more)`}
        </div>
      )}
    </div>
  )
}

function StatusPill({ label, ok }: { label: string; ok: boolean }) {
  const color = ok ? '#1a7a3a' : '#8a2020'
  const bg = ok ? 'rgba(26,122,58,0.12)' : 'rgba(138,32,32,0.12)'
  const dot = ok ? '●' : '○'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color, border: `1px solid ${color}40`,
      borderRadius: 4, padding: '3px 10px', fontSize: 13, fontWeight: 500,
    }}>
      {dot} {label}
    </span>
  )
}

function QueryResultCard({ result, templates }: { result: ElasticLiveQuery; templates: HuntTemplate[] }) {
  const [showSample, setShowSample] = useState(false)
  const templateName = result.template_id
    ? templates.find(t => t.id === result.template_id)?.title ?? result.template_id
    : null
  const sampleRows = result.result_sample ? JSON.parse(result.result_sample) : []

  return (
    <div style={{
      background: 'var(--bg-secondary, #161b22)',
      border: '1px solid var(--border-color, #30363d)',
      borderRadius: 6,
      padding: 16,
      marginTop: 12,
    }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
        <StatusChip status={result.status} />
        {templateName && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Template: <strong style={{ color: 'var(--text-secondary)' }}>{templateName}</strong>
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {result.result_count} row{result.result_count !== 1 ? 's' : ''}
        </span>
        {result.index_pattern && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Index: {result.index_pattern}
          </span>
        )}
        {result.elastic_host && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Host: {result.elastic_host}
          </span>
        )}
      </div>

      {result.error_message && (
        <div style={{ fontSize: 13, color: '#d85f00', marginBottom: 8 }}>
          {result.error_message}
        </div>
      )}

      <pre style={{
        background: 'var(--bg-tertiary, #0d1117)',
        border: '1px solid var(--border-color, #30363d)',
        borderRadius: 4,
        padding: '10px 12px',
        fontSize: 12,
        overflowX: 'auto',
        margin: 0,
        marginBottom: sampleRows.length > 0 ? 10 : 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {result.esql_query}
      </pre>

      {sampleRows.length > 0 && (
        <>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '2px 10px', marginBottom: 8 }}
            onClick={() => setShowSample(s => !s)}
          >
            {showSample ? 'Hide Sample' : `Show Sample (${sampleRows.length} rows)`}
          </button>
          {showSample && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr>
                    {Object.keys(sampleRows[0]).slice(0, 8).map((col: string) => (
                      <th key={col} style={{
                        background: 'var(--bg-tertiary, #0d1117)',
                        border: '1px solid var(--border-color, #30363d)',
                        padding: '4px 8px',
                        textAlign: 'left',
                        color: 'var(--text-secondary)',
                        whiteSpace: 'nowrap',
                      }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row: Record<string, unknown>, i: number) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                      {Object.values(row).slice(0, 8).map((val, j) => (
                        <td key={j} style={{
                          border: '1px solid var(--border-color, #30363d)',
                          padding: '3px 8px',
                          color: 'var(--text-primary)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>{String(val ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function HistoryRow({ query, templates }: { query: ElasticLiveQuery; templates: HuntTemplate[] }) {
  const [expanded, setExpanded] = useState(false)
  const templateName = query.template_id
    ? templates.find(t => t.id === query.template_id)?.title ?? query.template_id
    : null

  return (
    <div style={{
      border: '1px solid var(--border-color, #30363d)',
      borderRadius: 6,
      marginBottom: 8,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', textAlign: 'left',
          background: 'var(--bg-secondary, #161b22)',
          border: 'none', cursor: 'pointer',
          padding: '10px 14px',
          display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        }}
      >
        <StatusChip status={query.status} />
        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>
          {new Date(query.executed_at).toLocaleString('en-GB', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </span>
        {templateName && (
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{templateName}</span>
        )}
        <span style={{
          fontSize: 12, color: 'var(--text-muted)',
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          maxWidth: 400,
        }}>
          {query.esql_query.replace(/\n/g, ' ')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
          {query.result_count} row{query.result_count !== 1 ? 's' : ''} {expanded ? '▲' : '▼'}
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-color, #30363d)' }}>
          <QueryResultCard result={query} templates={templates} />
        </div>
      )}
    </div>
  )
}

function StatusChip({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: 'rgba(26,122,58,0.15)', color: '#1a7a3a', label: 'Completed' },
    error:     { bg: 'rgba(138,32,32,0.15)', color: '#c03030', label: 'Error' },
    pending:   { bg: 'rgba(100,100,30,0.15)', color: '#a09020', label: 'Pending' },
  }
  const s = map[status] ?? { bg: 'rgba(80,80,80,0.15)', color: '#888', label: status }
  return (
    <span style={{
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}40`,
      borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
    }}>
      {s.label}
    </span>
  )
}
