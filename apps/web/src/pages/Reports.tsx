import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAllReports, type Report } from '../api/reports'

function formatTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAllReports()
      .then(setReports)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Generated Reports</h1>
      </div>

      {loading && <div className="state-box">Loading reports…</div>}
      {error && (
        <div className="state-box state-error">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && reports.length === 0 && (
        <div className="state-box">
          No reports generated yet. Open a case and click{' '}
          <strong>Generate Report</strong> to create a Markdown incident report.
        </div>
      )}

      {!loading && reports.length > 0 && (
        <div className="reports-list">
          {reports.map(r => (
            <div key={r.id} className="report-card">
              <div className="report-card-header">
                <Link to={`/cases/${r.case_id}`} className="report-card-case-link">
                  Case #{r.case_id}
                </Link>
                <span className="report-format-badge">{r.format}</span>
                <span className="report-card-ts">{formatTs(r.generated_at)}</span>
              </div>
              {r.summary && (
                <div className="report-card-summary">{r.summary}</div>
              )}
              <div className="report-card-path">
                <code>{r.report_path}</code>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
