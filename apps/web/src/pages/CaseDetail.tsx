import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCase, updateCase, deleteCase, type Case } from '../api/cases'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import EvidencePanel from '../components/EvidencePanel'
import TimelinePanel from '../components/TimelinePanel'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caseData, setCaseData] = useState<Case | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    getCase(Number(id))
      .then(setCaseData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  async function handleFieldUpdate(field: string, value: string) {
    if (!caseData) return
    try {
      const updated = await updateCase(caseData.id, { [field]: value })
      setCaseData(updated)
    } catch {
      // silently ignore — field reverts on next re-render
    }
  }

  async function handleDelete() {
    if (!caseData) return
    if (!window.confirm(`Delete case "${caseData.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      await deleteCase(caseData.id)
      navigate('/cases')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete case')
      setDeleting(false)
    }
  }

  if (loading) return <div className="state-box">Loading case…</div>
  if (error) return <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>
  if (!caseData) return null

  return (
    <>
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Link to="/cases" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13 }}>
              ← Cases
            </Link>
          </div>
          <h1 className="page-title">{caseData.title}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <SeverityBadge severity={caseData.severity} />
            <StatusBadge status={caseData.status} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>#{caseData.id}</span>
          </div>
        </div>
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? 'Deleting…' : 'Delete Case'}
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-card-title">Case Details</div>

          <div className="detail-field">
            <div className="detail-label">Status</div>
            <select
              className="inline-select"
              value={caseData.status}
              onChange={(e) => handleFieldUpdate('status', e.target.value)}
            >
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="contained">Contained</option>
              <option value="escalated">Escalated</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="detail-field">
            <div className="detail-label">Severity</div>
            <select
              className="inline-select"
              value={caseData.severity}
              onChange={(e) => handleFieldUpdate('severity', e.target.value)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="detail-field">
            <div className="detail-label">Source</div>
            <div className="detail-value">{caseData.source.replace(/_/g, ' ')}</div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Created</div>
            <div className="detail-value">{formatDate(caseData.created_at)}</div>
          </div>

          <div className="detail-field">
            <div className="detail-label">Last Updated</div>
            <div className="detail-value">{formatDate(caseData.updated_at)}</div>
          </div>
        </div>

        <div className="detail-card">
          <div className="detail-card-title">Affected Assets</div>

          <div className="detail-field">
            <div className="detail-label">Host</div>
            <div className={`detail-value${!caseData.affected_host ? ' detail-value--empty' : ''}`}>
              {caseData.affected_host ?? 'Not specified'}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">User</div>
            <div className={`detail-value${!caseData.affected_user ? ' detail-value--empty' : ''}`}>
              {caseData.affected_user ?? 'Not specified'}
            </div>
          </div>

          <div className="detail-field">
            <div className="detail-label">IP Address</div>
            <div className={`detail-value${!caseData.affected_ip ? ' detail-value--empty' : ''}`}>
              {caseData.affected_ip ?? 'Not specified'}
            </div>
          </div>

          {caseData.description && (
            <div className="detail-field" style={{ marginTop: 16 }}>
              <div className="detail-label">Description</div>
              <div className="detail-value" style={{ lineHeight: 1.6 }}>{caseData.description}</div>
            </div>
          )}
        </div>
      </div>

      <div className="section-title" style={{ marginBottom: 16 }}>Investigation</div>

      <EvidencePanel caseId={caseData.id} />

      <TimelinePanel caseId={caseData.id} />

      <div className="future-section">
        <strong>Detection Findings</strong>
        Sigma rule matches, YARA hits, and suspicious pattern detections — coming in Phases 6–8
      </div>

      <div className="future-section">
        <strong>MITRE ATT&amp;CK Mapping</strong>
        Tactics and techniques mapped from findings — coming in Phase 11
      </div>

      <div className="future-section">
        <strong>Incident Report</strong>
        Generate a structured Security Incident Report — coming in Phase 12
      </div>
    </>
  )
}
