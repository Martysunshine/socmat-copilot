import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getCases, type Case } from '../api/cases'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function CaseList() {
  const navigate = useNavigate()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = cases.filter(c => {
    const q = query.toLowerCase()
    const matchesQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      (c.affected_host ?? '').toLowerCase().includes(q) ||
      (c.affected_user ?? '').toLowerCase().includes(q) ||
      c.source.toLowerCase().includes(q)
    const matchesSeverity = !severityFilter || c.severity === severityFilter
    const matchesStatus = !statusFilter || c.status === statusFilter
    return matchesQuery && matchesSeverity && matchesStatus
  })

  const hasFilters = !!query || !!severityFilter || !!statusFilter

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">
            {loading ? 'Loading…' : `${filtered.length} of ${cases.length} case${cases.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Link to="/cases/new" className="btn btn-primary">+ New Case</Link>
      </div>

      {/* Search and filter row */}
      {!loading && !error && cases.length > 0 && (
        <div className="filter-row">
          <input
            className="filter-input"
            type="search"
            placeholder="Search by title, host, user, source…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="inline-select"
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
          >
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            className="inline-select"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="contained">Contained</option>
            <option value="escalated">Escalated</option>
            <option value="closed">Closed</option>
          </select>
          {hasFilters && (
            <button
              className="btn btn-ghost"
              onClick={() => { setQuery(''); setSeverityFilter(''); setStatusFilter('') }}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {loading && <div className="state-box">Loading cases…</div>}

      {error && (
        <div className="state-box state-error">
          <strong>Failed to load cases</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && cases.length === 0 && (
        <div className="state-box">
          <strong style={{ color: 'var(--text)', fontSize: 15 }}>No cases yet</strong>
          <p>Create your first investigation case to get started.</p>
          <div style={{ marginTop: 16 }}>
            <Link to="/cases/new" className="btn btn-primary">+ New Case</Link>
          </div>
        </div>
      )}

      {!loading && !error && cases.length > 0 && filtered.length === 0 && (
        <div className="state-box">
          <strong style={{ color: 'var(--text)', fontSize: 15 }}>No matching cases</strong>
          <p>Try adjusting your search or filter criteria.</p>
          <button
            className="btn btn-ghost"
            style={{ marginTop: 12 }}
            onClick={() => { setQuery(''); setSeverityFilter(''); setStatusFilter('') }}
          >
            Clear filters
          </button>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="case-table-wrap">
          <table className="case-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Source</th>
                <th>Affected Host</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)}>
                  <td className="case-title-cell">{c.title}</td>
                  <td><SeverityBadge severity={c.severity} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>{c.source.replace(/_/g, ' ')}</td>
                  <td>{c.affected_host ?? <span style={{ color: 'var(--border)' }}>—</span>}</td>
                  <td>{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
