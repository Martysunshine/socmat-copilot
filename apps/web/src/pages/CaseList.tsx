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

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Cases</h1>
          <p className="page-subtitle">Investigation cases — {cases.length} total</p>
        </div>
        <Link to="/cases/new" className="btn btn-primary">
          + New Case
        </Link>
      </div>

      {loading && (
        <div className="state-box">
          <div>Loading cases…</div>
        </div>
      )}

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
            <Link to="/cases/new" className="btn btn-primary">
              + New Case
            </Link>
          </div>
        </div>
      )}

      {!loading && !error && cases.length > 0 && (
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
              {cases.map((c) => (
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
