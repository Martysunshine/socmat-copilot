import { useEffect, useState } from 'react'
import {
  getPlaybookTemplates,
  getPlaybookTemplate,
  type PlaybookTemplateSummary,
  type PlaybookTemplateDetail,
} from '../api/playbooks'

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--red)',
  high: 'var(--orange)',
  medium: 'var(--yellow)',
  low: 'var(--green)',
}

export default function PlaybooksPage() {
  const [templates, setTemplates] = useState<PlaybookTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [detail, setDetail] = useState<Record<number, PlaybookTemplateDetail>>({})
  const [detailLoading, setDetailLoading] = useState<number | null>(null)

  useEffect(() => {
    getPlaybookTemplates()
      .then(setTemplates)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleViewSteps(id: number) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (!detail[id]) {
      setDetailLoading(id)
      try {
        const d = await getPlaybookTemplate(id)
        setDetail(prev => ({ ...prev, [id]: d }))
      } catch {
        // keep expanded, just no steps shown
      } finally {
        setDetailLoading(null)
      }
    }
  }

  if (loading) return <div className="loading-state">Loading playbook templates…</div>
  if (error) return <div className="upload-error">{error}</div>

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Investigation Playbooks</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: 13 }}>
            Built-in step-by-step checklists for common alert types. Attach a playbook to a case from the case detail page.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {templates.map(t => (
          <div key={t.id} className="detail-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{t.name}</span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 3,
                    background: 'rgba(0,0,0,0.2)',
                    color: SEV_COLOR[t.severity] || 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}>
                    {t.severity}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.step_count} steps</span>
                </div>
                {t.description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0 }}>
                    {t.description}
                  </p>
                )}
              </div>
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                onClick={() => handleViewSteps(t.id)}
              >
                {expandedId === t.id ? 'Hide Steps' : 'View Steps'}
              </button>
            </div>

            {expandedId === t.id && (
              <div style={{ marginTop: 14, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                {detailLoading === t.id ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading steps…</div>
                ) : detail[t.id] ? (
                  <>
                    {detail[t.id].required_data_sources.length > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div className="analysis-section-label" style={{ marginBottom: 4 }}>Required Data Sources</div>
                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                          {detail[t.id].required_data_sources.map((src, i) => (
                            <li key={i} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>{src}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="analysis-section-label" style={{ marginBottom: 6 }}>Investigation Steps</div>
                    <ol style={{ margin: 0, paddingLeft: 20 }}>
                      {detail[t.id].steps.map(step => (
                        <li key={step.order} style={{ marginBottom: 10 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{step.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{step.description}</div>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Steps not available.</div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="state-box">
          No playbook templates found. Make sure the backend is running and seeded correctly.
        </div>
      )}
    </>
  )
}
