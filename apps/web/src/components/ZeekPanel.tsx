import { useEffect, useState } from 'react'
import { runZeekAnalysis, getZeekResults, type NetworkAnalysisResult, type ZeekFinding } from '../api/zeek'
import { type Evidence } from '../api/evidence'

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--red)',
  high:     '#f0883e',
  medium:   'var(--yellow)',
  low:      'var(--text-muted)',
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  caseId: number
  evidence: Evidence[]
  onAnalysisComplete: () => void
}

export default function ZeekPanel({ caseId, evidence, onAnalysisComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<NetworkAnalysisResult[]>([])
  const [loadingResults, setLoadingResults] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getZeekResults(caseId)
      .then(setResults)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingResults(false))
  }, [caseId])

  async function handleRun() {
    if (!selectedId) return
    setRunning(true)
    setError(null)
    try {
      const result = await runZeekAnalysis(caseId, Number(selectedId))
      setResults(prev => {
        const without = prev.filter(r => r.evidence_id !== result.evidence_id)
        return [result, ...without]
      })
      onAnalysisComplete()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-title">Zeek Network Log Analysis</div>

      {evidence.length === 0 ? (
        <div className="state-box">
          <p>No evidence files uploaded. Upload a Zeek log file (conn.log, dns.log, http.log) to begin.</p>
        </div>
      ) : (
        <div className="analysis-run-row">
          <select
            className="inline-select"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Select evidence file…</option>
            {evidence.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.original_filename}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={!selectedId || running}
          >
            {running ? 'Analyzing…' : 'Run Zeek Analysis'}
          </button>
        </div>
      )}

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {loadingResults ? (
        <div className="state-box" style={{ padding: '12px 0', marginTop: 8 }}>Loading results…</div>
      ) : results.length > 0 ? (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {results.map(r => <ZeekResultCard key={r.id} result={r} />)}
        </div>
      ) : (
        <div className="state-box" style={{ marginTop: 12 }}>
          No analysis results yet. Select a Zeek log file and click <strong>Run Zeek Analysis</strong>.
        </div>
      )}
    </div>
  )
}

function ZeekResultCard({ result }: { result: NetworkAnalysisResult }) {
  const logLabel =
    result.log_type === 'conn' ? 'Connection Log'
    : result.log_type === 'dns' ? 'DNS Log'
    : result.log_type === 'http' ? 'HTTP Log'
    : 'Unknown Log'

  const highCount = result.findings.filter(f => f.severity === 'high' || f.severity === 'critical').length

  return (
    <div className="zeek-result-card">
      <div className="zeek-result-header">
        <div>
          <span className="zeek-filename">{result.original_filename}</span>
          <span className="zeek-log-type">{logLabel}</span>
        </div>
        <div className="zeek-stats">
          <span className="zeek-stat">{result.total_records.toLocaleString()} records</span>
          {result.findings.length > 0 && (
            <span
              className="zeek-finding-count"
              style={{ color: highCount > 0 ? 'var(--red)' : 'var(--yellow)' }}
            >
              {result.findings.length} finding{result.findings.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {result.findings.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">Suspicious Findings ({result.findings.length})</div>
          <div className="zeek-findings-list">
            {result.findings.map((f, i) => <FindingRow key={i} finding={f} />)}
          </div>
        </div>
      )}

      {result.top_talkers.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">Top Talkers</div>
          <div className="zeek-table-wrap">
            <table className="zeek-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Connections</th>
                  <th>Destinations</th>
                  <th>Bytes Out</th>
                </tr>
              </thead>
              <tbody>
                {result.top_talkers.map((t, i) => (
                  <tr key={i}>
                    <td><code>{t.host}</code></td>
                    <td>{t.connection_count}</td>
                    <td>{t.destinations}</td>
                    <td>{formatBytes(t.total_bytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result.dns_summary && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">DNS Summary</div>
          <div className="zeek-kv-grid">
            <span className="zeek-kv-label">Total Queries</span>
            <span className="zeek-kv-value">{result.dns_summary.total_queries.toLocaleString()}</span>
            <span className="zeek-kv-label">Unique Domains</span>
            <span className="zeek-kv-value">{result.dns_summary.unique_domains.toLocaleString()}</span>
          </div>
          {result.dns_summary.top_queried.length > 0 && (
            <TagRow label="TOP QUERIED" items={result.dns_summary.top_queried.slice(0, 6)} />
          )}
          {result.dns_summary.suspicious_domains.length > 0 && (
            <TagRow
              label="SUSPICIOUS DOMAINS"
              items={result.dns_summary.suspicious_domains.slice(0, 5)}
              danger
            />
          )}
        </div>
      )}

      {result.http_summary && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">HTTP Summary</div>
          <div className="zeek-kv-grid">
            <span className="zeek-kv-label">Total Requests</span>
            <span className="zeek-kv-value">{result.http_summary.total_requests.toLocaleString()}</span>
            <span className="zeek-kv-label">Unique Hosts</span>
            <span className="zeek-kv-value">{result.http_summary.unique_hosts.toLocaleString()}</span>
          </div>
          {result.http_summary.top_hosts.length > 0 && (
            <TagRow label="TOP HOSTS" items={result.http_summary.top_hosts.slice(0, 5)} />
          )}
          {result.http_summary.suspicious_agents.length > 0 && (
            <TagRow
              label="SUSPICIOUS AGENTS"
              items={result.http_summary.suspicious_agents.slice(0, 3)}
              warn
            />
          )}
        </div>
      )}

      <div className="zeek-summary-text">{result.summary}</div>
    </div>
  )
}

function FindingRow({ finding }: { finding: ZeekFinding }) {
  return (
    <div className="zeek-finding-row">
      <span className="zeek-finding-sev" style={{ color: SEV_COLOR[finding.severity] ?? 'var(--text-muted)' }}>
        {finding.severity.toUpperCase()}
      </span>
      <span className="zeek-finding-desc">{finding.description}</span>
      {finding.details && <code className="zeek-finding-detail">{finding.details}</code>}
    </div>
  )
}

function TagRow({ label, items, danger, warn }: { label: string; items: string[]; danger?: boolean; warn?: boolean }) {
  const color = danger ? 'var(--red)' : warn ? 'var(--yellow)' : 'var(--text-muted)'
  const borderColor = danger ? 'var(--red)' : warn ? 'var(--yellow)' : undefined
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ fontSize: 11, color, marginBottom: 4 }}>{label}</div>
      <div className="zeek-tag-list">
        {items.map((item, i) => (
          <code key={i} className="zeek-tag" style={borderColor ? { borderColor } : undefined}>{item}</code>
        ))}
      </div>
    </div>
  )
}
