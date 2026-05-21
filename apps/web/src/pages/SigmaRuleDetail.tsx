import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getSigmaRule, attachRuleToCase, type SigmaRule } from '../api/sigma'
import { getCases, type Case } from '../api/cases'

const LEVEL_COLORS: Record<string, string> = {
  informational: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

export default function SigmaRuleDetail() {
  const { ruleId } = useParams<{ ruleId: string }>()
  const [rule, setRule] = useState<SigmaRule | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [cases, setCases] = useState<Case[]>([])
  const [selectedCaseId, setSelectedCaseId] = useState<number | ''>('')
  const [attaching, setAttaching] = useState(false)
  const [attachMsg, setAttachMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!ruleId) return
    getSigmaRule(decodeURIComponent(ruleId))
      .then(setRule)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
    getCases()
      .then(setCases)
      .catch(() => {/* non-critical */})
  }, [ruleId])

  async function handleAttach() {
    if (!rule || !selectedCaseId) return
    setAttaching(true)
    setAttachMsg(null)
    try {
      await attachRuleToCase(Number(selectedCaseId), {
        rule_sigma_id: rule.id,
        rule_title: rule.title,
        rule_level: rule.level,
      })
      setAttachMsg('Rule attached to case successfully.')
    } catch (e: unknown) {
      setAttachMsg(e instanceof Error ? e.message : 'Attach failed')
    } finally {
      setAttaching(false)
    }
  }

  if (loading) return <div className="state-box">Loading rule…</div>
  if (error) return <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>
  if (!rule) return null

  const exp = rule.explanation
  const levelColor = LEVEL_COLORS[rule.level] ?? 'var(--text-muted)'

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: 6 }}>
            <Link to="/sigma" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>
              ← Sigma Rules
            </Link>
          </div>
          <h1 className="page-title">{rule.title}</h1>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="sigma-level-badge" style={{ color: levelColor, fontWeight: 700 }}>
              {rule.level.toUpperCase()}
            </span>
            <span className="sigma-status">{rule.status}</span>
            {rule.logsource.product && (
              <span className="sigma-logsource">
                {[rule.logsource.product, rule.logsource.category, rule.logsource.service]
                  .filter(Boolean).map(s => s!.replace(/_/g, ' ')).join(' / ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {rule.description && (
        <div className="detail-card" style={{ marginBottom: 16 }}>
          <div className="detail-card-title">Description</div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            {rule.description}
          </p>
        </div>
      )}

      {exp && (
        <>
          <div className="detail-card" style={{ marginBottom: 16 }}>
            <div className="detail-card-title">What This Rule Detects</div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 12px' }}>
              {exp.summary}
            </p>
            <div className="detail-field">
              <div className="detail-label">Required Log Source</div>
              <div className="detail-value">{exp.log_source}</div>
            </div>
            {exp.detection_fields.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div className="analysis-section-label">Detection Conditions</div>
                <ul className="sigma-condition-list">
                  {exp.detection_fields.map((f, i) => (
                    <li key={i} className="sigma-condition-item">{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {(exp.mitre_techniques.length > 0 || exp.mitre_tactics.length > 0) && (
            <div className="detail-card" style={{ marginBottom: 16 }}>
              <div className="detail-card-title">MITRE ATT&CK</div>
              {exp.mitre_tactics.length > 0 && (
                <div className="detail-field">
                  <div className="detail-label">Tactics</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {exp.mitre_tactics.map(t => (
                      <span key={t} className="sigma-tag sigma-tag--tactic">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {exp.mitre_techniques.length > 0 && (
                <div className="detail-field">
                  <div className="detail-label">Techniques</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                    {exp.mitre_techniques.map(t => (
                      <span key={t} className="sigma-tag sigma-tag--technique">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {exp.investigation_steps.length > 0 && (
            <div className="detail-card" style={{ marginBottom: 16 }}>
              <div className="detail-card-title">Suggested Investigation Steps</div>
              <ol className="sigma-steps-list">
                {exp.investigation_steps.map((s, i) => (
                  <li key={i} className="sigma-step-item">{s}</li>
                ))}
              </ol>
            </div>
          )}

          {exp.false_positives.length > 0 && (
            <div className="detail-card" style={{ marginBottom: 16 }}>
              <div className="detail-card-title">Known False Positives</div>
              <ul className="sigma-condition-list">
                {exp.false_positives.map((fp, i) => (
                  <li key={i} className="sigma-condition-item">{fp}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {rule.tags.length > 0 && (
        <div className="detail-card" style={{ marginBottom: 16 }}>
          <div className="detail-card-title">Tags</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            {rule.tags.map(t => <span key={t} className="sigma-tag">{t}</span>)}
          </div>
        </div>
      )}

      <div className="detail-card" style={{ marginBottom: 16 }}>
        <div className="detail-card-title">Attach to Case</div>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px' }}>
          Attach this rule to an active case as detection context for Phase 7 Sigma matching.
        </p>
        <div className="analysis-run-row">
          <select
            className="inline-select"
            value={selectedCaseId}
            onChange={e => setSelectedCaseId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Select a case…</option>
            {cases.map(c => (
              <option key={c.id} value={c.id}>#{c.id} — {c.title}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleAttach}
            disabled={!selectedCaseId || attaching}
          >
            {attaching ? 'Attaching…' : 'Attach to Case'}
          </button>
        </div>
        {attachMsg && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: attachMsg.includes('success') ? 'var(--green)' : 'var(--red)',
            }}
          >
            {attachMsg}
          </div>
        )}
        {cases.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 8 }}>
            No cases found. <Link to="/cases/new">Create a case</Link> first.
          </p>
        )}
      </div>

      {(rule.author || rule.date || rule.references.length > 0) && (
        <div className="detail-card" style={{ marginBottom: 16 }}>
          <div className="detail-card-title">Rule Metadata</div>
          {rule.author && (
            <div className="detail-field">
              <div className="detail-label">Author</div>
              <div className="detail-value">{rule.author}</div>
            </div>
          )}
          {rule.date && (
            <div className="detail-field">
              <div className="detail-label">Date</div>
              <div className="detail-value">{rule.date}</div>
            </div>
          )}
          {rule.modified && rule.modified !== rule.date && (
            <div className="detail-field">
              <div className="detail-label">Modified</div>
              <div className="detail-value">{rule.modified}</div>
            </div>
          )}
          {rule.references.length > 0 && (
            <div className="detail-field">
              <div className="detail-label">References</div>
              <ul className="sigma-ref-list">
                {rule.references.map((r, i) => (
                  <li key={i}>
                    <a href={r} target="_blank" rel="noopener noreferrer" className="sigma-ref-link">
                      {r}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  )
}
