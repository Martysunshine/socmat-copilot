import { useEffect, useState } from 'react'
import {
  runPcapAnalysis,
  getPcapResults,
  type PcapAnalysisResult,
  type PcapFinding,
} from '../api/pcap'
import { type Evidence } from '../api/evidence'

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--red)',
  high:     '#f0883e',
  medium:   'var(--yellow)',
  low:      'var(--text-muted)',
}

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

interface Props {
  caseId: number
  evidence: Evidence[]
  onAnalysisComplete: () => void
}

export default function PcapPanel({ caseId, evidence, onAnalysisComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<PcapAnalysisResult[]>([])
  const [loadingResults, setLoadingResults] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getPcapResults(caseId)
      .then(setResults)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingResults(false))
  }, [caseId])

  async function handleRun() {
    if (!selectedId) return
    setRunning(true)
    setError(null)
    try {
      const result = await runPcapAnalysis(caseId, Number(selectedId))
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
      <div className="panel-section-title">PCAP Network Traffic Analysis</div>

      {evidence.length === 0 ? (
        <div className="state-box">
          <p>No evidence files uploaded. Upload a PCAP or PCAPNG file to begin.</p>
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
            {running ? 'Analyzing…' : 'Run PCAP Analysis'}
          </button>
        </div>
      )}

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {loadingResults ? (
        <div className="state-box" style={{ padding: '12px 0', marginTop: 8 }}>Loading results…</div>
      ) : results.length > 0 ? (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {results.map(r => <PcapResultCard key={r.id} result={r} />)}
        </div>
      ) : (
        <div className="state-box" style={{ marginTop: 12 }}>
          No analysis results yet. Select a PCAP file (.pcap / .pcapng / .cap) and click{' '}
          <strong>Run PCAP Analysis</strong>. Files are read but never executed.
        </div>
      )}
    </div>
  )
}

function PcapResultCard({ result }: { result: PcapAnalysisResult }) {
  const [showDns, setShowDns] = useState(false)
  const [showHttp, setShowHttp] = useState(false)
  const [showTls, setShowTls] = useState(false)

  const highCount = result.findings.filter(
    f => f.severity === 'high' || f.severity === 'critical',
  ).length

  const protoEntries = Object.entries(result.protocol_counts).filter(([, v]) => v > 0)

  return (
    <div className="zeek-result-card">
      {/* Header */}
      <div className="zeek-result-header">
        <div>
          <span className="zeek-filename">{result.original_filename}</span>
          <span className="zeek-log-type">PCAP</span>
        </div>
        <div className="zeek-stats">
          <span className="zeek-stat">{result.total_packets.toLocaleString()} pkts</span>
          <span className="zeek-stat">{fmtBytes(result.total_bytes)}</span>
          {result.duration_seconds > 0 && (
            <span className="zeek-stat">{result.duration_seconds}s capture</span>
          )}
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

      {/* Protocol distribution */}
      {protoEntries.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">Protocol Distribution</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 6 }}>
            {protoEntries.map(([proto, count]) => (
              <span key={proto} style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{proto}: </span>
                {count.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious findings */}
      {result.findings.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">
            Suspicious Findings ({result.findings.length})
          </div>
          <div className="zeek-findings-list">
            {result.findings.map((f, i) => <FindingRow key={i} finding={f} />)}
          </div>
        </div>
      )}

      {/* Top talkers */}
      {result.top_talkers.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">Top Talkers</div>
          <div className="zeek-table-wrap">
            <table className="zeek-table">
              <thead>
                <tr>
                  <th>Host</th>
                  <th>Packets</th>
                  <th>Bytes Sent</th>
                  <th>Destinations</th>
                </tr>
              </thead>
              <tbody>
                {result.top_talkers.map((t, i) => (
                  <tr key={i}>
                    <td><code>{t.host}</code></td>
                    <td>{t.packets.toLocaleString()}</td>
                    <td>{fmtBytes(t.bytes_sent)}</td>
                    <td>{t.destinations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DNS queries */}
      {result.dns_queries.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            className="analysis-section-label"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowDns(v => !v)}
          >
            DNS Queries ({result.dns_queries.length}) {showDns ? '▲' : '▼'}
          </div>
          {showDns && (
            <div className="zeek-table-wrap" style={{ marginTop: 6 }}>
              <table className="zeek-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Query</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {result.dns_queries.slice(0, 50).map((q, i) => (
                    <tr key={i}>
                      <td><code>{q.src_ip}</code></td>
                      <td><code>{q.query}</code></td>
                      <td>{q.query_type}</td>
                    </tr>
                  ))}
                  {result.dns_queries.length > 50 && (
                    <tr>
                      <td colSpan={3} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        …and {result.dns_queries.length - 50} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* HTTP requests */}
      {result.http_requests.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            className="analysis-section-label"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowHttp(v => !v)}
          >
            HTTP Requests ({result.http_requests.length}) {showHttp ? '▲' : '▼'}
          </div>
          {showHttp && (
            <div className="zeek-table-wrap" style={{ marginTop: 6 }}>
              <table className="zeek-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Host</th>
                    <th>URI</th>
                    <th>User-Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {result.http_requests.slice(0, 40).map((h, i) => (
                    <tr key={i}>
                      <td><code>{h.method}</code></td>
                      <td><code>{h.host}</code></td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <code>{h.uri}</code>
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>
                        {h.user_agent}
                      </td>
                    </tr>
                  ))}
                  {result.http_requests.length > 40 && (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        …and {result.http_requests.length - 40} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TLS / SNI */}
      {result.tls_hosts.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div
            className="analysis-section-label"
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowTls(v => !v)}
          >
            TLS / SNI Hostnames ({result.tls_hosts.length}) {showTls ? '▲' : '▼'}
          </div>
          {showTls && (
            <div className="zeek-tag-list" style={{ marginTop: 6 }}>
              {result.tls_hosts.map((t, i) => (
                <code key={i} className="zeek-tag" title={`→ ${t.dst_ip}`}>{t.host}</code>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="zeek-summary-text">{result.summary}</div>
    </div>
  )
}

function FindingRow({ finding }: { finding: PcapFinding }) {
  return (
    <div className="zeek-finding-row">
      <span
        className="zeek-finding-sev"
        style={{ color: SEV_COLOR[finding.severity] ?? 'var(--text-muted)' }}
      >
        {finding.severity.toUpperCase()}
      </span>
      <span className="zeek-finding-desc">{finding.description}</span>
      {finding.details && <code className="zeek-finding-detail">{finding.details}</code>}
    </div>
  )
}
