import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  runSigmaRules,
  getSigmaFindings,
  type DetectionFinding,
  type SigmaRunResult,
} from '../api/sigma'

const LEVEL_COLORS: Record<string, string> = {
  informational: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

function SeverityTag({ severity }: { severity: string }) {
  return (
    <span
      className="sigma-level-badge"
      style={{ color: LEVEL_COLORS[severity] ?? 'var(--text-muted)', fontWeight: 700, fontSize: 11 }}
    >
      {severity.toUpperCase()}
    </span>
  )
}

interface Props {
  caseId: number
  onRunComplete?: () => void
}

export default function SigmaRunPanel({ caseId, onRunComplete }: Props) {
  const [findings, setFindings] = useState<DetectionFinding[]>([])
  const [loadingFindings, setLoadingFindings] = useState(true)
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<SigmaRunResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSigmaFindings(caseId)
      .then(setFindings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingFindings(false))
  }, [caseId])

  async function handleRun() {
    setRunning(true)
    setError(null)
    setLastRun(null)
    try {
      const result = await runSigmaRules(caseId)
      setLastRun(result)
      setFindings(result.findings)
      onRunComplete?.()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Run failed')
    } finally {
      setRunning(false)
    }
  }

  function formatTs(ts: string | null): string {
    if (!ts) return '—'
    try {
      return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    } catch {
      return ts
    }
  }

  return (
    <div className="analysis-panel">
      <div className="analysis-panel-header">
        <div>
          <div className="analysis-panel-title">Sigma Detection Findings</div>
          <div className="analysis-panel-subtitle">
            Run loaded Sigma rules against normalised Windows/Sysmon events for this case.
          </div>
        </div>
        <div className="analysis-run-row">
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={running}
          >
            {running ? 'Running…' : 'Run Sigma Rules'}
          </button>
        </div>
      </div>

      {error && (
        <div className="state-box state-error" style={{ marginBottom: 12 }}>
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {lastRun && (
        <div className="analysis-summary" style={{ marginBottom: 12 }}>
          <span className="summary-chip">{lastRun.rules_run} rules run</span>
          <span className="summary-chip">{lastRun.events_scanned} events scanned</span>
          <span
            className="summary-chip"
            style={{ color: lastRun.findings_created > 0 ? 'var(--red)' : 'var(--green)' }}
          >
            {lastRun.findings_created} finding{lastRun.findings_created !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {loadingFindings ? (
        <div className="state-box" style={{ padding: '12px 0' }}>Loading findings…</div>
      ) : findings.length === 0 ? (
        <div className="state-box" style={{ padding: '12px 0' }}>
          No findings yet. Click <strong>Run Sigma Rules</strong> to scan normalized events.
        </div>
      ) : (
        <div className="finding-list">
          {findings.map(f => (
            <div key={f.id} className="finding-item">
              <div className="finding-header">
                <SeverityTag severity={f.severity} />
                <Link
                  to={`/sigma/${encodeURIComponent(f.rule_id)}`}
                  className="finding-rule-link"
                >
                  {f.rule_title}
                </Link>
                {f.event_id_str && (
                  <span className="finding-event-id">Event {f.event_id_str}</span>
                )}
              </div>
              <div className="finding-reason">{f.match_reason}</div>
              {f.event_timestamp && (
                <div className="finding-ts">{formatTs(f.event_timestamp)}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
