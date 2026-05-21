import { useState } from 'react'
import { runSuricataAnalysis, type SuricataAnalysisResult, type SuricataFinding, type TopEntry } from '../api/suricata'
import { type Evidence } from '../api/evidence'

const SEVERITY_COLORS: Record<string, string> = {
  info: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

const SURICATA_EXTENSIONS = new Set(['json', 'log', 'txt'])

function isSuricataFile(ev: Evidence): boolean {
  const ext = ev.original_filename.split('.').pop()?.toLowerCase() ?? ''
  const name = ev.original_filename.toLowerCase()
  return SURICATA_EXTENSIONS.has(ext) || name.includes('eve') || name.includes('suricata')
}

interface Props {
  caseId: number
  evidence: Evidence[]
  onAnalysisComplete: () => void
}

export default function SuricataAnalysisPanel({ caseId, evidence, onAnalysisComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<SuricataAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eligibleFiles = evidence.filter(isSuricataFile)

  async function handleRun() {
    if (!selectedId) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const r = await runSuricataAnalysis(caseId, Number(selectedId))
      setResult(r)
      onAnalysisComplete()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-title">Suricata IDS/IPS Alert Analysis</div>

      {eligibleFiles.length === 0 ? (
        <div className="state-box">
          <p>No eligible evidence files. Upload a Suricata <code>eve.json</code> file first.</p>
        </div>
      ) : (
        <div className="analysis-run-row">
          <select
            className="inline-select"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Select evidence file…</option>
            {eligibleFiles.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.original_filename}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={!selectedId || running}
          >
            {running ? 'Analysing…' : 'Run Analysis'}
          </button>
        </div>
      )}

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {result && (
        <div className="analysis-result">
          <div className="analysis-summary-row">
            <div className="analysis-stat">
              <div className="stat-label">Total Alerts</div>
              <div className="stat-value">{result.total_alerts}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Unique Signatures</div>
              <div className="stat-value">{result.unique_signatures}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Suspicious Findings</div>
              <div className="stat-value stat-value--red">{result.suspicious_findings.length}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Timeline Events Added</div>
              <div className="stat-value stat-value--accent">{result.timeline_events_added}</div>
            </div>
          </div>

          <div className="suricata-tables-row">
            {result.top_src_ips.length > 0 && (
              <div className="suricata-table-block">
                <div className="analysis-section-label">Top Source IPs</div>
                <table className="suricata-table">
                  <thead>
                    <tr><th>IP Address</th><th>Alerts</th></tr>
                  </thead>
                  <tbody>
                    {result.top_src_ips.map((e: TopEntry) => (
                      <tr key={e.value}>
                        <td className="ip-cell">{e.value}</td>
                        <td className="count-cell">{e.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.top_dest_ips.length > 0 && (
              <div className="suricata-table-block">
                <div className="analysis-section-label">Top Destination IPs</div>
                <table className="suricata-table">
                  <thead>
                    <tr><th>IP Address</th><th>Alerts</th></tr>
                  </thead>
                  <tbody>
                    {result.top_dest_ips.map((e: TopEntry) => (
                      <tr key={e.value}>
                        <td className="ip-cell">{e.value}</td>
                        <td className="count-cell">{e.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {result.top_signatures.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="analysis-section-label">Top Signatures</div>
              <div className="sig-list">
                {result.top_signatures.map((e: TopEntry) => (
                  <div key={e.value} className="sig-row">
                    <span className="sig-name">{e.value}</span>
                    <span className="sig-count">{e.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suspicious_findings.length > 0 ? (
            <div>
              <div className="analysis-section-label">Suspicious Findings</div>
              <div className="findings-list">
                {result.suspicious_findings.map((f: SuricataFinding, i: number) => (
                  <SuricataFindingCard key={i} finding={f} />
                ))}
              </div>
            </div>
          ) : (
            <div className="state-box" style={{ marginTop: 12 }}>
              <p>No suspicious patterns detected in this file.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SuricataFindingCard({ finding }: { finding: SuricataFinding }) {
  const color = SEVERITY_COLORS[finding.severity] ?? 'var(--text-muted)'
  return (
    <div className="finding-card">
      <div className="finding-header">
        <span className="finding-severity" style={{ color }}>{finding.severity.toUpperCase()}</span>
        {finding.src_ip && <span className="finding-meta">{finding.src_ip}</span>}
        {finding.dest_ip && <span className="finding-meta">→ {finding.dest_ip}</span>}
      </div>
      {finding.signature && (
        <div className="finding-sig">{finding.signature}</div>
      )}
      <div className="finding-desc">{finding.description}</div>
    </div>
  )
}
