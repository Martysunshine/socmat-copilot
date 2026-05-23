import { useEffect, useState } from 'react'
import { getReadiness, type ReadinessResult, type SectionScore } from '../api/readiness'

interface Props {
  caseId: number
}

const GRADE_COLORS: Record<string, string> = {
  excellent: 'var(--severity-low)',
  good:      '#4caf50',
  fair:      'var(--severity-medium)',
  poor:      'var(--severity-high)',
}

const SECTION_ORDER = [
  'case_metadata', 'evidence', 'timeline', 'detections',
  'network_analysis', 'malware_triage', 'correlation', 'mitre_mapping',
  'analyst_review', 'report_content',
]

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 90 ? 'var(--severity-low)'
    : score >= 70 ? '#4caf50'
    : score >= 50 ? 'var(--severity-medium)'
    : 'var(--severity-high)'
  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
      <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width 0.4s' }} />
    </div>
  )
}

export default function ReadinessWidget({ caseId }: Props) {
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    getReadiness(caseId)
      .then(setReadiness)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  if (loading) return <div className="state-box">Calculating readiness score…</div>
  if (error)   return <div className="state-box state-error"><strong>Readiness Error</strong><p>{error}</p></div>
  if (!readiness) return null

  const gradeColor = GRADE_COLORS[readiness.grade] ?? 'var(--text-muted)'

  return (
    <div className="detail-card">
      <div className="detail-card-title">Report Readiness Score</div>

      {/* Score summary row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 16 }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: gradeColor, lineHeight: 1 }}>
            {readiness.total_score}%
          </div>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            color: gradeColor, marginTop: 4, letterSpacing: 1,
          }}>
            {readiness.grade}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <ScoreBar score={readiness.total_score} />
          <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            {readiness.completed_checks.length} of{' '}
            {readiness.completed_checks.length + readiness.missing_checks.length} checks passed
            {readiness.na_checks.length > 0 && ` · ${readiness.na_checks.length} not applicable`}
          </div>
        </div>
      </div>

      {/* Warnings inline */}
      {readiness.warnings.length > 0 && (
        <div style={{
          background: 'rgba(255,165,0,0.08)', border: '1px solid rgba(255,165,0,0.3)',
          borderRadius: 6, padding: '10px 14px', marginBottom: 12,
        }}>
          {readiness.warnings.map((w, i) => (
            <div key={i} style={{ fontSize: 12, color: 'var(--severity-medium)', marginBottom: i < readiness.warnings.length - 1 ? 4 : 0 }}>
              ⚠ {w}
            </div>
          ))}
        </div>
      )}

      {/* Missing checks summary */}
      {readiness.missing_checks.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
            MISSING ({readiness.missing_checks.length})
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {readiness.missing_checks.map(c => (
              <span key={c.id} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 12,
                background: 'rgba(239,83,80,0.12)', color: 'var(--severity-high)',
                border: '1px solid rgba(239,83,80,0.3)',
              }}>
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Toggle details */}
      <button
        className="btn btn-secondary"
        style={{ fontSize: 12, padding: '4px 12px', marginBottom: showDetails ? 12 : 0 }}
        onClick={() => setShowDetails(d => !d)}
      >
        {showDetails ? 'Hide Details' : 'Show Details'}
      </button>

      {showDetails && (
        <>
          {/* Section scores */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>
              SECTION SCORES
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SECTION_ORDER.map(key => {
                const s: SectionScore | undefined = readiness.section_scores[key]
                if (!s || s.max_score === 0) return null
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12 }}>{s.name}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {s.achieved}/{s.max_score} ({s.score}%)
                      </span>
                    </div>
                    <ScoreBar score={s.score} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Recommendations */}
          {readiness.recommendations.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
                RECOMMENDED IMPROVEMENTS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {readiness.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0 }}>→</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full check list */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
              ALL CHECKS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[...readiness.completed_checks, ...readiness.missing_checks, ...readiness.na_checks].map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 10, fontSize: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    flexShrink: 0, width: 16, textAlign: 'center',
                    color: c.status === 'pass' ? 'var(--severity-low)'
                         : c.status === 'na'   ? 'var(--text-muted)'
                         : 'var(--severity-high)',
                  }}>
                    {c.status === 'pass' ? '✓' : c.status === 'na' ? '—' : '✗'}
                  </span>
                  <div>
                    <span style={{ fontWeight: 500 }}>{c.name}</span>
                    {c.optional && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>(optional)</span>
                    )}
                    {c.status === 'na' && (
                      <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text-muted)' }}>(N/A)</span>
                    )}
                    <div style={{ color: 'var(--text-muted)', marginTop: 1 }}>{c.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
