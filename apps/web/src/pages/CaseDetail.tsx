import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getCase, updateCase, deleteCase, type Case } from '../api/cases'
import { getEvidence, type Evidence } from '../api/evidence'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'
import EvidencePanel from '../components/EvidencePanel'
import TimelinePanel from '../components/TimelinePanel'
import WindowsAnalysisPanel from '../components/WindowsAnalysisPanel'
import SuricataAnalysisPanel from '../components/SuricataAnalysisPanel'
import SigmaRunPanel from '../components/SigmaRunPanel'
import YaraPanel from '../components/YaraPanel'
import ZeekPanel from '../components/ZeekPanel'
import PcapPanel from '../components/PcapPanel'
import CorrelationPanel from '../components/CorrelationPanel'
import MitrePanel from '../components/MitrePanel'
import ReportPanel from '../components/ReportPanel'
import AIAssistantPanel from '../components/AIAssistantPanel'
import SplunkPanel from '../components/SplunkPanel'
import ElasticPanel from '../components/ElasticPanel'
import PlaybookPanel from '../components/PlaybookPanel'
import NotesPanel from '../components/NotesPanel'
import IocPanel from '../components/IocPanel'
import GraphPanel from '../components/GraphPanel'
import CoveragePanel from '../components/CoveragePanel'

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

  // Evidence state owned here and shared with EvidencePanel + analysis panels
  const [evidence, setEvidence] = useState<Evidence[]>([])
  const [evidenceLoading, setEvidenceLoading] = useState(true)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)

  // Incrementing key forces TimelinePanel to re-mount and refetch after analysis
  const [timelineKey, setTimelineKey] = useState(0)

  useEffect(() => {
    if (!id) return
    getCase(Number(id))
      .then(setCaseData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    getEvidence(Number(id))
      .then(setEvidence)
      .catch((e: Error) => setEvidenceError(e.message))
      .finally(() => setEvidenceLoading(false))
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

  function handleEvidenceUploaded(ev: Evidence) {
    setEvidence(prev => [ev, ...prev])
  }

  function handleAnalysisComplete() {
    setTimelineKey(k => k + 1)
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

      {/* Evidence */}
      <div className="case-section-label">Evidence</div>

      <EvidencePanel
        caseId={caseData.id}
        items={evidence}
        loading={evidenceLoading}
        error={evidenceError}
        onUpload={handleEvidenceUploaded}
      />

      {/* Analysis */}
      <div className="case-section-label">Analysis</div>

      <WindowsAnalysisPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <SuricataAnalysisPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <SplunkPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <ElasticPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <YaraPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <ZeekPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <PcapPanel
        caseId={caseData.id}
        evidence={evidence}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <SigmaRunPanel
        caseId={caseData.id}
        onRunComplete={handleAnalysisComplete}
      />

      {/* Correlation & Intelligence */}
      <div className="case-section-label">Correlation &amp; Intelligence</div>

      <CorrelationPanel
        caseId={caseData.id}
        onAnalysisComplete={handleAnalysisComplete}
      />

      <MitrePanel
        caseId={caseData.id}
        onAnalysisComplete={handleAnalysisComplete}
      />

      {/* Timeline */}
      <div className="case-section-label">Timeline</div>

      <TimelinePanel key={timelineKey} caseId={caseData.id} />

      {/* Analyst Playbooks */}
      <div className="case-section-label">Analyst Playbooks</div>

      <PlaybookPanel caseId={caseData.id} />

      {/* Analyst Notes */}
      <div className="case-section-label">Analyst Notes</div>

      <NotesPanel caseId={caseData.id} />

      {/* IOC Basket */}
      <div className="case-section-label">IOC Basket</div>

      <IocPanel caseId={caseData.id} />

      {/* Investigation Map */}
      <div className="case-section-label">Investigation Map</div>

      <GraphPanel caseId={caseData.id} />

      {/* Detection Coverage */}
      <div className="case-section-label">Detection Coverage</div>

      <CoveragePanel caseId={caseData.id} />

      {/* Reporting & AI */}
      <div className="case-section-label">Reporting &amp; AI</div>

      <ReportPanel
        caseId={caseData.id}
        caseTitle={caseData.title}
      />

      <AIAssistantPanel caseId={caseData.id} />
    </>
  )
}
