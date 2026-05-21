import { useState } from 'react'
import { runWindowsAnalysis, type WindowsAnalysisResult, type SuspiciousFinding } from '../api/analysis'
import { type Evidence } from '../api/evidence'

const SEVERITY_COLORS: Record<string, string> = {
  info: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

const WINDOWS_EXTENSIONS = new Set([
  'json', 'csv', 'txt', 'log', 'evtx', 'xml',
])

function isWindowsLog(ev: Evidence): boolean {
  const ext = ev.original_filename.split('.').pop()?.toLowerCase() ?? ''
  return WINDOWS_EXTENSIONS.has(ext)
}

interface Props {
  caseId: number
  evidence: Evidence[]
  onAnalysisComplete: () => void
}

export default function WindowsAnalysisPanel({ caseId, evidence, onAnalysisComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<WindowsAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eligibleFiles = evidence.filter(isWindowsLog)

  async function handleRun() {
    if (!selectedId) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const r = await runWindowsAnalysis(caseId, Number(selectedId))
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
      <div className="panel-section-title">Windows / Sysmon Log Analysis</div>

      {eligibleFiles.length === 0 ? (
        <div className="state-box">
          <p>No eligible evidence files. Upload a Windows Event Log or Sysmon export (JSON or CSV) first.</p>
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
              <div className="stat-label">Total Events</div>
              <div className="stat-value">{result.total_events}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Unique Event IDs</div>
              <div className="stat-value">{Object.keys(result.events_by_id).length}</div>
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

          {Object.keys(result.events_by_id).length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div className="analysis-section-label">Event ID Breakdown</div>
              <div className="event-id-grid">
                {Object.entries(result.events_by_id).map(([eid, count]) => (
                  <div key={eid} className="event-id-chip">
                    <span className="event-id-num">{eid}</span>
                    <span className="event-id-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.suspicious_findings.length > 0 ? (
            <div>
              <div className="analysis-section-label">Suspicious Findings</div>
              <div className="findings-list">
                {result.suspicious_findings.map((f, i) => (
                  <FindingCard key={i} finding={f} />
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

function FindingCard({ finding }: { finding: SuspiciousFinding }) {
  const color = SEVERITY_COLORS[finding.severity] ?? 'var(--text-muted)'
  return (
    <div className="finding-card">
      <div className="finding-header">
        <span className="finding-severity" style={{ color }}>{finding.severity.toUpperCase()}</span>
        {finding.event_id && (
          <span className="finding-event-id">Event {finding.event_id}</span>
        )}
        {finding.host && <span className="finding-meta">{finding.host}</span>}
        {finding.user && <span className="finding-meta">{finding.user}</span>}
      </div>
      <div className="finding-desc">{finding.description}</div>
    </div>
  )
}
