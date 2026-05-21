import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createCase } from '../api/cases'

export default function CreateCase() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    description: '',
    severity: 'medium',
    status: 'open',
    source: 'manual',
    affected_host: '',
    affected_user: '',
    affected_ip: '',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await createCase({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        severity: form.severity,
        status: form.status,
        source: form.source,
        affected_host: form.affected_host.trim() || undefined,
        affected_user: form.affected_user.trim() || undefined,
        affected_ip: form.affected_ip.trim() || undefined,
      })
      navigate(`/cases/${created.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create case')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Case</h1>
          <p className="page-subtitle">Open a new SOC investigation case</p>
        </div>
      </div>

      <div className="form-card">
        {error && (
          <div className="state-box state-error" style={{ marginBottom: 20, padding: '12px 16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Suspected lateral movement — FINANCE-PC01"
              required
            />
          </div>

          <div className="form-row">
            <label htmlFor="description">
              Description <span className="label-optional">optional</span>
            </label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief summary of the suspected incident…"
            />
          </div>

          <div className="form-row-group">
            <div>
              <label htmlFor="severity">Severity</label>
              <select id="severity" value={form.severity} onChange={(e) => set('severity', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label htmlFor="status">Status</label>
              <select id="status" value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="open">Open</option>
                <option value="investigating">Investigating</option>
                <option value="contained">Contained</option>
                <option value="escalated">Escalated</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="source">Source</label>
            <select id="source" value={form.source} onChange={(e) => set('source', e.target.value)}>
              <option value="manual">Manual</option>
              <option value="windows_logs">Windows Logs</option>
              <option value="suricata">Suricata</option>
              <option value="zeek">Zeek</option>
              <option value="splunk_export">Splunk Export</option>
              <option value="elastic_export">Elastic Export</option>
              <option value="yara">YARA</option>
            </select>
          </div>

          <div className="form-row-group">
            <div>
              <label htmlFor="affected_host">
                Affected Host <span className="label-optional">optional</span>
              </label>
              <input
                id="affected_host"
                type="text"
                value={form.affected_host}
                onChange={(e) => set('affected_host', e.target.value)}
                placeholder="e.g. FINANCE-PC01"
              />
            </div>
            <div>
              <label htmlFor="affected_user">
                Affected User <span className="label-optional">optional</span>
              </label>
              <input
                id="affected_user"
                type="text"
                value={form.affected_user}
                onChange={(e) => set('affected_user', e.target.value)}
                placeholder="e.g. john.doe"
              />
            </div>
          </div>

          <div className="form-row">
            <label htmlFor="affected_ip">
              Affected IP <span className="label-optional">optional</span>
            </label>
            <input
              id="affected_ip"
              type="text"
              value={form.affected_ip}
              onChange={(e) => set('affected_ip', e.target.value)}
              placeholder="e.g. 192.168.1.42"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting || !form.title.trim()}>
              {submitting ? 'Creating…' : 'Create Case'}
            </button>
            <Link to="/cases" className="btn btn-secondary">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </>
  )
}
