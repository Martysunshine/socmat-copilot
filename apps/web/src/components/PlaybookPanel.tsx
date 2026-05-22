import { useEffect, useState } from 'react'
import {
  getCasePlaybooks,
  attachPlaybook,
  updatePlaybookStep,
  getPlaybookTemplates,
  type CasePlaybook,
  type PlaybookSuggestion,
  type PlaybookTemplateSummary,
} from '../api/playbooks'

const STATUS_COLOR: Record<string, string> = {
  done: 'var(--green)',
  skipped: 'var(--text-muted)',
  needs_review: 'var(--yellow)',
  pending: 'var(--border)',
}

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
}

interface Props {
  caseId: number
}

export default function PlaybookPanel({ caseId }: Props) {
  const [playbooks, setPlaybooks] = useState<CasePlaybook[]>([])
  const [suggestions, setSuggestions] = useState<PlaybookSuggestion[]>([])
  const [templates, setTemplates] = useState<PlaybookTemplateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [attaching, setAttaching] = useState(false)
  const [attachTemplate, setAttachTemplate] = useState('')
  const [attachError, setAttachError] = useState<string | null>(null)
  const [savingStep, setSavingStep] = useState<number | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<number, string>>({})

  async function refresh() {
    try {
      const data = await getCasePlaybooks(caseId)
      setPlaybooks(data.playbooks)
      setSuggestions(data.suggestions)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load playbooks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    getPlaybookTemplates().then(setTemplates).catch(() => {})
  }, [caseId])

  async function handleAttach(templateId: number) {
    setAttaching(true)
    setAttachError(null)
    try {
      const pb = await attachPlaybook(caseId, templateId)
      setPlaybooks(prev => [...prev, pb])
      setSuggestions(prev => prev.filter(s => s.template_id !== templateId))
      setAttachTemplate('')
      setExpandedId(pb.id)
    } catch (e: unknown) {
      setAttachError(e instanceof Error ? e.message : 'Failed to attach playbook')
    } finally {
      setAttaching(false)
    }
  }

  async function handleStepStatus(playbookId: number, stepId: number, status: string) {
    setSavingStep(stepId)
    try {
      await updatePlaybookStep(caseId, playbookId, stepId, { status })
      await refresh()
    } finally {
      setSavingStep(null)
    }
  }

  async function handleSaveNotes(playbookId: number, stepId: number) {
    setSavingStep(stepId)
    try {
      await updatePlaybookStep(caseId, playbookId, stepId, { analyst_notes: notesDraft[stepId] ?? '' })
      await refresh()
    } finally {
      setSavingStep(null)
    }
  }

  const attachedTemplateIds = new Set(playbooks.map(pb => pb.template_id))
  const availableTemplates = templates.filter(t => !attachedTemplateIds.has(t.id))

  return (
    <div className="detail-card">
      <div className="detail-card-title">Analyst Playbooks</div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>Loading…</div>}
      {error && <div className="upload-error" style={{ marginTop: 8 }}>{error}</div>}

      {/* Suggestions */}
      {!loading && suggestions.length > 0 && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: 'rgba(210,153,34,0.07)',
          border: '1px solid var(--yellow)',
          borderRadius: 6,
        }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--yellow)', marginBottom: 8 }}>
            Suggested Playbooks for This Case
          </div>
          {suggestions.map(s => (
            <div key={s.template_id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 10, marginBottom: 6, flexWrap: 'wrap',
            }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{s.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{s.reason}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ fontSize: 12, padding: '4px 12px' }}
                onClick={() => handleAttach(s.template_id)}
                disabled={attaching}
              >
                Attach
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Attached playbooks */}
      {!loading && playbooks.length === 0 && suggestions.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>
          No playbooks attached. Attach one below to guide your investigation.
        </div>
      )}

      {playbooks.map(pb => (
        <div key={pb.id} style={{
          marginTop: 12,
          border: '1px solid var(--border)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {/* Playbook header */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
              background: 'var(--bg-secondary)', cursor: 'pointer', flexWrap: 'wrap',
            }}
            onClick={() => setExpandedId(expandedId === pb.id ? null : pb.id)}
          >
            <span style={{ flex: 1, fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{pb.name}</span>
            <span style={{
              fontSize: 11, padding: '2px 8px', borderRadius: 3,
              background: 'rgba(0,0,0,0.2)',
              color: pb.status === 'completed' ? 'var(--green)' : pb.status === 'in_progress' ? 'var(--yellow)' : 'var(--text-muted)',
            }}>
              {STATUS_LABEL[pb.status] ?? pb.status}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 40 }}>{pb.progress_percent}%</span>
            {/* Progress bar */}
            <div style={{
              width: 80, height: 6, borderRadius: 3,
              background: 'var(--border)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0,
                width: `${pb.progress_percent}%`,
                background: pb.progress_percent === 100 ? 'var(--green)' : 'var(--accent)',
                borderRadius: 3,
                transition: 'width 0.3s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {expandedId === pb.id ? '▲' : '▼'}
            </span>
          </div>

          {/* Steps */}
          {expandedId === pb.id && (
            <div style={{ padding: '12px 14px' }}>
              {pb.steps.map(step => {
                const isDirty = notesDraft[step.id] !== undefined && notesDraft[step.id] !== (step.analyst_notes ?? '')
                return (
                  <div key={step.id} style={{
                    marginBottom: 14,
                    padding: '10px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${STATUS_COLOR[step.status] ?? 'var(--border)'}`,
                    borderRadius: '0 4px 4px 0',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {step.step_order}. {step.title}
                        </div>
                        {step.description && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{step.description}</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                        {(['done', 'skipped', 'needs_review'] as const).map(s => (
                          <button
                            key={s}
                            className="btn btn-secondary"
                            style={{
                              fontSize: 11,
                              padding: '3px 8px',
                              opacity: step.status === s ? 1 : 0.5,
                              borderColor: step.status === s ? (STATUS_COLOR[s] || 'var(--border)') : undefined,
                              color: step.status === s ? (STATUS_COLOR[s] || 'var(--text-muted)') : undefined,
                            }}
                            disabled={savingStep === step.id}
                            onClick={() => handleStepStatus(pb.id, step.id, s)}
                          >
                            {s === 'done' ? '✓ Done' : s === 'skipped' ? '⏭ Skip' : '🔍 Review'}
                          </button>
                        ))}
                        {step.status !== 'pending' && (
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: '3px 8px', opacity: 0.5 }}
                            disabled={savingStep === step.id}
                            onClick={() => handleStepStatus(pb.id, step.id, 'pending')}
                            title="Reset to pending"
                          >
                            ↺
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Notes */}
                    <div style={{ marginTop: 8 }}>
                      <textarea
                        style={{
                          width: '100%',
                          minHeight: 48,
                          background: 'var(--bg-primary)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)',
                          borderRadius: 4,
                          padding: '5px 8px',
                          fontSize: 12,
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Analyst notes for this step…"
                        value={notesDraft[step.id] !== undefined ? notesDraft[step.id] : (step.analyst_notes ?? '')}
                        onChange={e => setNotesDraft(prev => ({ ...prev, [step.id]: e.target.value }))}
                      />
                      {isDirty && (
                        <button
                          className="btn btn-secondary"
                          style={{ fontSize: 11, marginTop: 4 }}
                          disabled={savingStep === step.id}
                          onClick={() => handleSaveNotes(pb.id, step.id)}
                        >
                          {savingStep === step.id ? 'Saving…' : 'Save Notes'}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ))}

      {/* Attach playbook form */}
      {!loading && availableTemplates.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            className="inline-select"
            value={attachTemplate}
            onChange={e => setAttachTemplate(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          >
            <option value="">Select a playbook to attach…</option>
            {availableTemplates.map(t => (
              <option key={t.id} value={String(t.id)}>
                {t.name} ({t.step_count} steps, {t.severity})
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12 }}
            disabled={!attachTemplate || attaching}
            onClick={() => handleAttach(Number(attachTemplate))}
          >
            {attaching ? 'Attaching…' : 'Attach Playbook'}
          </button>
        </div>
      )}
      {attachError && <div className="upload-error" style={{ marginTop: 6 }}>{attachError}</div>}
    </div>
  )
}
