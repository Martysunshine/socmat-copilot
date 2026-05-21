import { useEffect, useState } from 'react'
import { runCorrelation, getCorrelatedFindings, type CorrelatedFinding, type CorrelationEntity } from '../api/correlation'

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--red)',
  high:     '#f0883e',
  medium:   'var(--yellow)',
  low:      'var(--text-muted)',
}

const CONF_COLOR: Record<string, string> = {
  high:   'var(--green)',
  medium: 'var(--yellow)',
  low:    'var(--text-muted)',
}

const ENTITY_LABEL: Record<string, string> = {
  hostname: 'HOST',
  username: 'USER',
  ip:       'IP',
  hash:     'HASH',
  domain:   'DOMAIN',
  process:  'PROCESS',
  service:  'SERVICE',
  port:     'PORT',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  caseId: number
  onAnalysisComplete: () => void
}

export default function CorrelationPanel({ caseId, onAnalysisComplete }: Props) {
  const [running, setRunning] = useState(false)
  const [findings, setFindings] = useState<CorrelatedFinding[]>([])
  const [loadingFindings, setLoadingFindings] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCorrelatedFindings(caseId)
      .then(setFindings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingFindings(false))
  }, [caseId])

  async function handleRun() {
    setRunning(true)
    setError(null)
    try {
      const result = await runCorrelation(caseId)
      setFindings(result)
      onAnalysisComplete()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Correlation failed')
    } finally {
      setRunning(false)
    }
  }

  const highCount = findings.filter(f => f.severity === 'high' || f.severity === 'critical').length

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <div className="panel-section-title" style={{ marginBottom: 0 }}>Investigation Correlation</div>
        <button
          className="btn btn-primary"
          onClick={handleRun}
          disabled={running}
        >
          {running ? 'Correlating…' : 'Run Correlation'}
        </button>
      </div>

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {loadingFindings ? (
        <div className="state-box" style={{ padding: '12px 0', marginTop: 8 }}>Loading findings…</div>
      ) : findings.length > 0 ? (
        <>
          <div className="corr-run-summary">
            <span>{findings.length} correlated finding{findings.length !== 1 ? 's' : ''}</span>
            {highCount > 0 && (
              <span className="corr-high-badge">{highCount} high-severity</span>
            )}
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {findings.map(f => <CorrelatedFindingCard key={f.id} finding={f} />)}
          </div>
        </>
      ) : (
        <div className="state-box" style={{ marginTop: 12 }}>
          No correlated findings yet. Click <strong>Run Correlation</strong> to analyze all evidence
          in this case across Windows logs, Suricata, YARA, Zeek, and Sigma.
        </div>
      )}
    </div>
  )
}

function CorrelatedFindingCard({ finding }: { finding: CorrelatedFinding }) {
  const sevColor = SEV_COLOR[finding.severity] ?? 'var(--text-muted)'
  const confColor = CONF_COLOR[finding.confidence] ?? 'var(--text-muted)'

  return (
    <div className="corr-card">
      <div className="corr-card-header">
        <span className="corr-title">{finding.title}</span>
        <div className="corr-badges">
          <span
            className="corr-badge"
            style={{ color: sevColor, borderColor: sevColor }}
          >
            {finding.severity.toUpperCase()}
          </span>
          <span
            className="corr-badge corr-badge--conf"
            style={{ color: confColor, borderColor: 'var(--border)' }}
          >
            {finding.confidence.toUpperCase()} CONF
          </span>
        </div>
      </div>

      {finding.entities.length > 0 && (
        <div className="corr-entities">
          {finding.entities.map((e, i) => (
            <EntityTag key={i} entity={e} />
          ))}
        </div>
      )}

      <p className="corr-summary">{finding.summary}</p>

      <div className="corr-action">
        <div className="corr-action-label">Recommended Action</div>
        <p className="corr-action-text">{finding.recommended_action}</p>
      </div>

      <div className="corr-meta">
        {finding.related_event_ids.length > 0 && (
          <span>{finding.related_event_ids.length} related event{finding.related_event_ids.length !== 1 ? 's' : ''}</span>
        )}
        {finding.related_finding_ids.length > 0 && (
          <span>{finding.related_finding_ids.length} related finding{finding.related_finding_ids.length !== 1 ? 's' : ''}</span>
        )}
        <span style={{ marginLeft: 'auto' }}>{formatDate(finding.created_at)}</span>
      </div>
    </div>
  )
}

function EntityTag({ entity }: { entity: CorrelationEntity }) {
  return (
    <span className="corr-entity">
      <span className="corr-entity-type">
        {ENTITY_LABEL[entity.type] ?? entity.type.toUpperCase()}
      </span>
      <code className="corr-entity-value">{entity.value}</code>
    </span>
  )
}
