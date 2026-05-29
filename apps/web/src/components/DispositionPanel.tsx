import { useEffect, useState, useMemo } from 'react'
import {
  getCaseDispositions,
  createDisposition,
  updateDisposition,
  deleteDisposition,
  DISPOSITIONS,
  DISPOSITION_LABELS,
  FINDING_TYPES,
  type CaseDispositionsResponse,
  type FindingDisposition,
  type DispositionValue,
} from '../api/dispositions'

interface Props {
  caseId: number
}

const DISPOSITION_COLORS: Record<DispositionValue, string> = {
  true_positive: '#ef4444',
  false_positive: '#22c55e',
  benign: '#6b7280',
  suspicious: '#f59e0b',
  needs_review: '#3b82f6',
  escalated: '#a855f7',
  duplicate: '#14b8a6',
  insufficient_data: '#94a3b8',
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#94a3b8',
}

const ALL_FILTER = 'all'

interface NewFormState {
  finding_type: string
  finding_id: string
  disposition: DispositionValue
  confidence: 'low' | 'medium' | 'high'
  reason: string
  analyst_name: string
  follow_up_action: string
}

const EMPTY_FORM: NewFormState = {
  finding_type: 'sigma',
  finding_id: '',
  disposition: 'needs_review',
  confidence: 'medium',
  reason: '',
  analyst_name: '',
  follow_up_action: '',
}

function DispositionBadge({ value }: { value: DispositionValue }) {
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      padding: '2px 8px',
      borderRadius: 4,
      background: DISPOSITION_COLORS[value] + '22',
      color: DISPOSITION_COLORS[value],
      border: `1px solid ${DISPOSITION_COLORS[value]}55`,
      whiteSpace: 'nowrap',
    }}>
      {DISPOSITION_LABELS[value]}
    </span>
  )
}

interface EditState {
  disposition: DispositionValue
  confidence: 'low' | 'medium' | 'high'
  reason: string
  analyst_name: string
  follow_up_action: string
}

function DispositionRow({
  d,
  caseId,
  onUpdated,
  onDeleted,
}: {
  d: FindingDisposition
  caseId: number
  onUpdated: (d: FindingDisposition) => void
  onDeleted: (id: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditState>({
    disposition: d.disposition,
    confidence: d.confidence,
    reason: d.reason ?? '',
    analyst_name: d.analyst_name ?? '',
    follow_up_action: d.follow_up_action ?? '',
  })

  async function handleSave() {
    setSaving(true)
    try {
      const updated = await updateDisposition(caseId, d.id, {
        disposition: form.disposition,
        confidence: form.confidence,
        reason: form.reason || undefined,
        analyst_name: form.analyst_name || undefined,
        follow_up_action: form.follow_up_action || undefined,
      })
      onUpdated(updated)
      setEditing(false)
    } catch {
      // keep editing open on error
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this disposition?')) return
    await deleteDisposition(caseId, d.id)
    onDeleted(d.id)
  }

  return (
    <div style={{
      border: '1px solid var(--border)',
      borderRadius: 6,
      padding: '10px 14px',
      marginBottom: 8,
      background: 'var(--card-bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 80 }}>
          {d.finding_type.toUpperCase()} #{d.finding_id}
        </span>
        <DispositionBadge value={d.disposition} />
        <span style={{
          fontSize: 11,
          padding: '1px 6px',
          borderRadius: 4,
          background: CONFIDENCE_COLORS[d.confidence] + '22',
          color: CONFIDENCE_COLORS[d.confidence],
        }}>
          {d.confidence} confidence
        </span>
        {d.analyst_name && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>— {d.analyst_name}</span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" style={{ fontSize: 11, padding: '2px 8px' }}
            onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
          <button className="btn btn-danger" style={{ fontSize: 11, padding: '2px 8px' }}
            onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>

      {d.reason && !editing && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
          <strong>Reason:</strong> {d.reason}
        </div>
      )}
      {d.follow_up_action && !editing && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
          <strong>Follow-up:</strong> {d.follow_up_action}
        </div>
      )}

      {editing && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Disposition</div>
            <select className="inline-select" style={{ width: '100%' }}
              value={form.disposition}
              onChange={e => setForm(f => ({ ...f, disposition: e.target.value as DispositionValue }))}>
              {DISPOSITIONS.map(v => (
                <option key={v} value={v}>{DISPOSITION_LABELS[v]}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Confidence</div>
            <select className="inline-select" style={{ width: '100%' }}
              value={form.confidence}
              onChange={e => setForm(f => ({ ...f, confidence: e.target.value as 'low' | 'medium' | 'high' }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Reason</div>
            <input className="inline-select" style={{ width: '100%' }}
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder="Why this disposition?" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Analyst Name</div>
            <input className="inline-select" style={{ width: '100%' }}
              value={form.analyst_name}
              onChange={e => setForm(f => ({ ...f, analyst_name: e.target.value }))}
              placeholder="Analyst name" />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Follow-up Action</div>
            <input className="inline-select" style={{ width: '100%' }}
              value={form.follow_up_action}
              onChange={e => setForm(f => ({ ...f, follow_up_action: e.target.value }))}
              placeholder="Recommended next step" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button className="btn btn-primary" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DispositionPanel({ caseId }: Props) {
  const [data, setData] = useState<CaseDispositionsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>(ALL_FILTER)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<NewFormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    try {
      const res = await getCaseDispositions(caseId)
      setData(res)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load dispositions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [caseId])

  const filtered = useMemo(() => {
    if (!data) return []
    if (filter === ALL_FILTER) return data.dispositions
    return data.dispositions.filter(d => d.disposition === filter)
  }, [data, filter])

  function handleUpdated(updated: FindingDisposition) {
    setData(prev => {
      if (!prev) return prev
      const dispositions = prev.dispositions.map(d => d.id === updated.id ? updated : d)
      return rebuildSummary({ ...prev, dispositions })
    })
  }

  function handleDeleted(id: number) {
    setData(prev => {
      if (!prev) return prev
      const dispositions = prev.dispositions.filter(d => d.id !== id)
      return rebuildSummary({ ...prev, dispositions })
    })
  }

  function rebuildSummary(d: CaseDispositionsResponse): CaseDispositionsResponse {
    const s = { total: d.dispositions.length, true_positive: 0, false_positive: 0, benign: 0, suspicious: 0, needs_review: 0, escalated: 0, duplicate: 0, insufficient_data: 0 }
    for (const disp of d.dispositions) {
      const k = disp.disposition as keyof typeof s
      if (k in s) s[k] = (s[k] as number) + 1
    }
    return { ...d, summary: s }
  }

  async function handleSubmit() {
    if (!form.finding_id.trim()) return
    setSubmitting(true)
    try {
      await createDisposition(caseId, {
        finding_type: form.finding_type,
        finding_id: form.finding_id.trim(),
        disposition: form.disposition,
        confidence: form.confidence,
        reason: form.reason || undefined,
        analyst_name: form.analyst_name || undefined,
        follow_up_action: form.follow_up_action || undefined,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
      await load()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create disposition')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="state-box">Loading dispositions…</div>
  if (error) return <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>
  if (!data) return null

  const { summary } = data

  return (
    <div className="detail-card">
      <div className="detail-card-title">Finding Disposition</div>

      {/* Summary metrics */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        {([
          ['Total', summary.total, '#6b7280'],
          ['True Positive', summary.true_positive, '#ef4444'],
          ['False Positive', summary.false_positive, '#22c55e'],
          ['Benign', summary.benign, '#94a3b8'],
          ['Needs Review', summary.needs_review, '#3b82f6'],
          ['Escalated', summary.escalated, '#a855f7'],
          ['Suspicious', summary.suspicious, '#f59e0b'],
        ] as [string, number, string][]).map(([label, count, color]) => (
          <div key={label} style={{
            padding: '8px 14px',
            borderRadius: 6,
            background: color + '18',
            border: `1px solid ${color}44`,
            textAlign: 'center',
            minWidth: 80,
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color }}>{count}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Filter:</span>
        {[ALL_FILTER, ...DISPOSITIONS].map(v => (
          <button
            key={v}
            onClick={() => setFilter(v)}
            style={{
              fontSize: 11,
              padding: '2px 10px',
              borderRadius: 4,
              border: `1px solid ${filter === v ? 'var(--accent)' : 'var(--border)'}`,
              background: filter === v ? 'var(--accent)' : 'transparent',
              color: filter === v ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {v === ALL_FILTER ? 'All' : DISPOSITION_LABELS[v as DispositionValue]}
          </button>
        ))}
        <button
          className="btn btn-primary"
          style={{ marginLeft: 'auto', fontSize: 12, padding: '3px 12px' }}
          onClick={() => setShowForm(f => !f)}
        >
          {showForm ? 'Cancel' : '+ Add Disposition'}
        </button>
      </div>

      {/* Add disposition form */}
      {showForm && (
        <div style={{
          border: '1px solid var(--accent)',
          borderRadius: 6,
          padding: 14,
          marginBottom: 14,
          background: 'var(--card-bg)',
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Record Finding Disposition</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Finding Type</div>
              <select className="inline-select" style={{ width: '100%' }}
                value={form.finding_type}
                onChange={e => setForm(f => ({ ...f, finding_type: e.target.value }))}>
                {FINDING_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Finding ID</div>
              <input className="inline-select" style={{ width: '100%' }}
                value={form.finding_id}
                onChange={e => setForm(f => ({ ...f, finding_id: e.target.value }))}
                placeholder="e.g. 42 or rule-name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Disposition</div>
              <select className="inline-select" style={{ width: '100%' }}
                value={form.disposition}
                onChange={e => setForm(f => ({ ...f, disposition: e.target.value as DispositionValue }))}>
                {DISPOSITIONS.map(v => (
                  <option key={v} value={v}>{DISPOSITION_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Confidence</div>
              <select className="inline-select" style={{ width: '100%' }}
                value={form.confidence}
                onChange={e => setForm(f => ({ ...f, confidence: e.target.value as 'low' | 'medium' | 'high' }))}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Reason (required for false positive / benign)</div>
              <input className="inline-select" style={{ width: '100%' }}
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                placeholder="Analyst justification for this disposition" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Analyst Name</div>
              <input className="inline-select" style={{ width: '100%' }}
                value={form.analyst_name}
                onChange={e => setForm(f => ({ ...f, analyst_name: e.target.value }))}
                placeholder="Your name" />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Follow-up Action</div>
              <input className="inline-select" style={{ width: '100%' }}
                value={form.follow_up_action}
                onChange={e => setForm(f => ({ ...f, follow_up_action: e.target.value }))}
                placeholder="e.g. Escalate to IR team" />
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <button
              className="btn btn-primary"
              disabled={submitting || !form.finding_id.trim()}
              onClick={handleSubmit}
            >
              {submitting ? 'Saving…' : 'Save Disposition'}
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
            Only the analyst can set or change dispositions. AI recommendations are advisory only.
          </div>
        </div>
      )}

      {/* Disposition list */}
      {filtered.length === 0 ? (
        <div className="state-box" style={{ marginTop: 8 }}>
          {filter === ALL_FILTER
            ? 'No dispositions recorded. Add your first disposition above.'
            : `No ${DISPOSITION_LABELS[filter as DispositionValue]} dispositions.`}
        </div>
      ) : (
        <div>
          {filtered.map(d => (
            <DispositionRow
              key={d.id}
              d={d}
              caseId={caseId}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}
