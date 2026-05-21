import { useEffect, useState } from 'react'
import { getTimeline, createTimelineEvent, type TimelineEvent, type TimelineEventCreate } from '../api/evidence'

const SEVERITY_COLORS: Record<string, string> = {
  info: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

const EMPTY_FORM: TimelineEventCreate = {
  timestamp: '',
  source: 'manual',
  event_type: '',
  description: '',
  severity: 'info',
  raw_reference: '',
}

interface Props {
  caseId: number
}

export default function TimelinePanel({ caseId }: Props) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<TimelineEventCreate>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    getTimeline(caseId)
      .then(setEvents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  function setField(key: keyof TimelineEventCreate, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!form.timestamp || !form.event_type.trim() || !form.description.trim()) {
      setFormError('Timestamp, event type, and description are required.')
      return
    }
    setSubmitting(true)
    try {
      const payload: TimelineEventCreate = {
        ...form,
        raw_reference: form.raw_reference?.trim() || undefined,
      }
      const ev = await createTimelineEvent(caseId, payload)
      setEvents(prev => [...prev, ev].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ))
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to add event')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <div className="panel-section-title">Investigation Timeline</div>
        <button className="btn btn-secondary" onClick={() => { setShowForm(f => !f); setFormError(null) }}>
          {showForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {showForm && (
        <form className="timeline-form" onSubmit={handleSubmit}>
          <div className="form-row-group">
            <div className="form-row">
              <label>Timestamp</label>
              <input
                type="datetime-local"
                value={form.timestamp}
                onChange={e => setField('timestamp', e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>Severity</label>
              <select value={form.severity} onChange={e => setField('severity', e.target.value)}>
                <option value="info">Info</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>
          <div className="form-row-group">
            <div className="form-row">
              <label>Event Type</label>
              <input
                type="text"
                value={form.event_type}
                onChange={e => setField('event_type', e.target.value)}
                placeholder="e.g. Logon, Process Creation, Alert"
                required
              />
            </div>
            <div className="form-row">
              <label>Source</label>
              <select value={form.source} onChange={e => setField('source', e.target.value)}>
                <option value="manual">Manual</option>
                <option value="windows_logs">Windows Logs</option>
                <option value="suricata">Suricata</option>
                <option value="zeek">Zeek</option>
                <option value="sigma">Sigma</option>
                <option value="yara">YARA</option>
                <option value="correlation">Correlation</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setField('description', e.target.value)}
              placeholder="Describe what happened"
              required
            />
          </div>
          <div className="form-row">
            <label>Raw Reference <span className="label-optional">(optional)</span></label>
            <textarea
              value={form.raw_reference}
              onChange={e => setField('raw_reference', e.target.value)}
              placeholder="Paste raw log line or reference text"
              style={{ minHeight: 60 }}
            />
          </div>
          {formError && <div className="upload-error">{formError}</div>}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Adding…' : 'Add Event'}
            </button>
          </div>
        </form>
      )}

      {loading && <div className="state-box">Loading timeline…</div>}
      {error && <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>}

      {!loading && !error && events.length === 0 && (
        <div className="state-box">
          <p>No timeline events yet. Add events manually or run analysis modules in later phases.</p>
        </div>
      )}

      {events.length > 0 && (
        <div className="timeline">
          {events.map(ev => (
            <div key={ev.id} className="timeline-event">
              <div className="timeline-dot" style={{ background: SEVERITY_COLORS[ev.severity] ?? 'var(--border)' }} />
              <div className="timeline-content">
                <div className="timeline-meta">
                  <span className="timeline-time">{formatDate(ev.timestamp)}</span>
                  <span className="timeline-source">{ev.source.replace(/_/g, ' ')}</span>
                  <span className="timeline-type">{ev.event_type}</span>
                  <span
                    className="timeline-severity"
                    style={{ color: SEVERITY_COLORS[ev.severity] ?? 'var(--text-muted)' }}
                  >
                    {ev.severity}
                  </span>
                </div>
                <div className="timeline-desc">{ev.description}</div>
                {ev.raw_reference && (
                  <pre className="timeline-raw">{ev.raw_reference}</pre>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
