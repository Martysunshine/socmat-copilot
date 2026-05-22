import { useEffect, useState } from 'react'
import {
  authorRules,
  getEventTypes,
  type RuleDraftResponse,
  type EventTypeOption,
} from '../api/rule_authoring'

type Tab = 'sigma' | 'spl' | 'kql'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // clipboard not available in some environments
    }
  }
  return (
    <button
      className="btn btn-secondary"
      style={{ fontSize: 12, padding: '3px 10px' }}
      onClick={handleCopy}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: 14,
      marginTop: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
        <CopyButton text={code} />
      </div>
      <pre style={{
        margin: 0,
        fontSize: 12,
        color: 'var(--text-secondary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        fontFamily: 'monospace',
        maxHeight: 420,
        overflowY: 'auto',
      }}>
        {code}
      </pre>
    </div>
  )
}

export default function RuleAuthoringPage() {
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventTypes, setEventTypes] = useState<EventTypeOption[]>([])
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RuleDraftResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('sigma')

  useEffect(() => {
    getEventTypes().then(setEventTypes).catch(() => {})
  }, [])

  async function handleGenerate() {
    if (description.trim().length < 5) return
    setRunning(true)
    setError(null)
    try {
      const r = await authorRules({
        description: description.trim(),
        event_type: eventType || undefined,
      })
      setResult(r)
      setActiveTab('sigma')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setRunning(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleGenerate()
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'sigma', label: 'Sigma YAML' },
    { id: 'spl',   label: 'Splunk SPL' },
    { id: 'kql',   label: 'KQL / ES|QL' },
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Detection Rule Authoring Assistant</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 13 }}>
            Draft Sigma rules, Splunk SPL, and Elastic KQL/ES|QL from a detection description.
          </p>
        </div>
      </div>

      {/* Quality disclaimer banner */}
      <div className="state-box" style={{
        borderColor: 'var(--yellow)',
        background: 'rgba(210,153,34,0.07)',
        marginBottom: 20,
        padding: '10px 16px',
        fontSize: 13,
      }}>
        <strong style={{ color: 'var(--yellow)' }}>Draft Quality</strong>
        {' '}— Generated rules are starting templates only. Review detection logic,
        test against real log samples, and tune field values before deploying to production.
      </div>

      {/* Input form */}
      <div className="detail-card" style={{ marginBottom: 20 }}>
        <div className="detail-card-title">Describe What You Want to Detect</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Detection description <span style={{ color: 'var(--red)' }}>*</span>
            </label>
            <textarea
              style={{
                width: '100%',
                minHeight: 90,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '8px 12px',
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              value={description}
              onChange={e => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='e.g. "Detect PowerShell using Invoke-WebRequest to download files from external hosts"'
              maxLength={2000}
            />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
              {description.length}/2000 — Include specific process names, file paths, command patterns,
              or domain names for better results. Ctrl+Enter to generate.
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 240 }}>
              <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                Event type{' '}
                <span style={{ color: 'var(--text-muted)' }}>(optional — auto-detected from description)</span>
              </label>
              <select
                className="inline-select"
                value={eventType}
                onChange={e => setEventType(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">Auto-detect</option>
                {eventTypes.map(et => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={handleGenerate}
              disabled={description.trim().length < 5 || running}
            >
              {running ? 'Generating…' : 'Generate Rules'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="upload-error" style={{ marginBottom: 16 }}>{error}</div>
      )}

      {result && (
        <div className="panel-section">
          {/* Detection context row */}
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16, fontSize: 12 }}>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Detected type: </span>
              <strong style={{ color: 'var(--text-secondary)' }}>{result.event_type_label}</strong>
            </span>
            <span>
              <span style={{ color: 'var(--text-muted)' }}>Detection value: </span>
              <code style={{ fontSize: 12, color: 'var(--accent)' }}>{result.keyword_extracted}</code>
            </span>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 0 }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id ? 'var(--bg-secondary)' : 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id
                    ? '2px solid var(--accent)'
                    : '2px solid transparent',
                  color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  borderRadius: '4px 4px 0 0',
                  transition: 'color 0.1s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{
            border: '1px solid var(--border)',
            borderTop: 'none',
            borderRadius: '0 0 6px 6px',
            padding: 16,
            background: 'var(--bg-secondary)',
          }}>
            {activeTab === 'sigma' && (
              <CodeBlock code={result.sigma_yaml} />
            )}
            {activeTab === 'spl' && (
              <CodeBlock code={result.spl_query} />
            )}
            {activeTab === 'kql' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    KQL — Kibana Discover / Lens
                  </div>
                  <CodeBlock code={result.kql_query} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                    ES|QL — Elasticsearch REST API
                  </div>
                  <CodeBlock code={result.esql_query} />
                </div>
              </div>
            )}
          </div>

          {/* Validation warnings */}
          {result.validation_warnings.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div className="analysis-section-label">Validation Warnings</div>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {result.validation_warnings.map((w, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--yellow)', marginBottom: 5 }}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Log source requirements */}
          {result.log_source_notes.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="analysis-section-label">Log Source Requirements</div>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {result.log_source_notes.map((n, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>{n}</li>
                ))}
              </ul>
            </div>
          )}

          {/* False positives */}
          {result.false_positives.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div className="analysis-section-label">Known False Positives</div>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {result.false_positives.map((fp, i) => (
                  <li key={i} style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 5 }}>{fp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Quality disclaimer */}
          <div style={{
            marginTop: 20,
            padding: '10px 14px',
            background: 'rgba(139,148,158,0.06)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            <strong>Quality Disclaimer:</strong> {result.quality_disclaimer}
          </div>
        </div>
      )}
    </>
  )
}
