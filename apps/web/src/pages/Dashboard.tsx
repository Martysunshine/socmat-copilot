import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardSummary, type DashboardSummary } from '../api/dashboard'
import SeverityBadge from '../components/SeverityBadge'
import StatusBadge from '../components/StatusBadge'

type ApiStatus = 'checking' | 'online' | 'offline'

function formatRelative(iso: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 2) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }


export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch(() => {})
  }, [])

  const hasCases = (summary?.total_cases ?? 0) > 0

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <h1 className="hero-title">SOC Analyst Workbench</h1>
        <p className="hero-subtitle">
          Local-first defensive cybersecurity automation — alert investigation, log analysis,
          detection rules, static malware triage, and incident report generation.
        </p>
        <div className="status-row">
          <ApiStatusBadge status={apiStatus} />
          <span className="phase-badge">Phase 17 — Dashboard &amp; UX Polish</span>
        </div>
      </section>

      {/* Summary stats — always shown, zeroes when empty */}
      <section className="section">
        <h2 className="section-title">Overview</h2>
        <div className="dashboard-stat-grid">
          <StatCard
            label="Open Cases"
            value={summary?.open_cases ?? 0}
            accent={summary?.open_cases ? 'yellow' : undefined}
            link="/cases"
          />
          <StatCard
            label="Investigating"
            value={summary?.investigating_cases ?? 0}
            accent={summary?.investigating_cases ? 'yellow' : undefined}
            link="/cases"
          />
          <StatCard
            label="Critical"
            value={summary?.critical_cases ?? 0}
            accent={summary?.critical_cases ? 'red' : undefined}
            link="/cases"
          />
          <StatCard
            label="High Severity"
            value={summary?.high_cases ?? 0}
            accent={summary?.high_cases ? 'orange' : undefined}
            link="/cases"
          />
          <StatCard
            label="Evidence Files"
            value={summary?.total_evidence ?? 0}
          />
          <StatCard
            label="Timeline Events"
            value={summary?.total_timeline_events ?? 0}
          />
          <StatCard
            label="Reports Generated"
            value={summary?.total_reports ?? 0}
          />
          <StatCard
            label="Total Cases"
            value={summary?.total_cases ?? 0}
            link="/cases"
          />
        </div>

        {!hasCases && (
          <div className="state-box" style={{ marginTop: 20 }}>
            <strong style={{ color: 'var(--text)', fontSize: 15 }}>No cases yet</strong>
            <p>Create your first investigation case to start using the workbench.</p>
            <div style={{ marginTop: 14 }}>
              <Link to="/cases/new" className="btn btn-primary">+ New Case</Link>
            </div>
          </div>
        )}
      </section>

      {/* Recent activity — only when there is data */}
      {hasCases && (
        <section className="section">
          <h2 className="section-title">Recent Activity</h2>
          <div className="dashboard-activity-grid">

            {/* Recent cases */}
            <div className="dashboard-activity-col">
              <div className="dashboard-activity-header">
                <span>Recent Cases</span>
                <Link to="/cases" className="dashboard-activity-link">View all →</Link>
              </div>
              {(summary?.recent_cases ?? []).length === 0 ? (
                <div className="dashboard-activity-empty">No cases</div>
              ) : (
                <div className="dashboard-recent-list">
                  {(summary?.recent_cases ?? [])
                    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))
                    .map(c => (
                      <Link key={c.id} to={`/cases/${c.id}`} className="dashboard-recent-row">
                        <div className="dashboard-recent-row-main">
                          <span className="dashboard-recent-title">{c.title}</span>
                          <span className="dashboard-recent-meta">#{c.id} · {formatDate(c.created_at)}</span>
                        </div>
                        <div className="dashboard-recent-row-badges">
                          <SeverityBadge severity={c.severity} />
                          <StatusBadge status={c.status} />
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </div>

            {/* Recent timeline events */}
            <div className="dashboard-activity-col">
              <div className="dashboard-activity-header">
                <span>Recent Timeline Events</span>
              </div>
              {(summary?.recent_timeline ?? []).length === 0 ? (
                <div className="dashboard-activity-empty">No timeline events yet — run an analysis to populate</div>
              ) : (
                <div className="dashboard-recent-list">
                  {(summary?.recent_timeline ?? []).map(ev => (
                    <Link key={ev.id} to={`/cases/${ev.case_id}`} className="dashboard-recent-row">
                      <div className="dashboard-recent-row-main">
                        <span className="dashboard-recent-title">{ev.description}</span>
                        <span className="dashboard-recent-meta">
                          Case #{ev.case_id} · {ev.source} · {formatRelative(ev.timestamp)}
                        </span>
                      </div>
                      <span className={`dashboard-severity-dot dashboard-severity-dot--${ev.severity}`} />
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </section>
      )}

      {/* Investigation workflow */}
      <section className="section">
        <h2 className="section-title">Investigation Workflow</h2>
        <div className="workflow-steps">
          {[
            { step: '01', title: 'Create a Case', desc: 'Open a new investigation case. Set severity, status, and affected assets to scope the incident.' },
            { step: '02', title: 'Upload Evidence', desc: 'Attach log files, PCAP captures, Splunk/Elastic exports, or suspicious artifacts to the case.' },
            { step: '03', title: 'Parse Log Sources', desc: 'Run Windows/Sysmon, Suricata, Zeek, or PCAP analysis. Events are normalized into a unified timeline.' },
            { step: '04', title: 'Run Detections', desc: 'Execute Sigma rules against normalized events and YARA triage against uploaded files.' },
            { step: '05', title: 'Query Live SIEMs', desc: 'Run SPL queries against live Splunk or ES|QL queries against Elasticsearch using pre-approved templates.' },
            { step: '06', title: 'Correlate Findings', desc: 'The correlation engine surfaces multi-source attack patterns and chains across all analysis modules.' },
            { step: '07', title: 'Map to MITRE ATT&CK', desc: 'Auto-map all findings to ATT&CK techniques and tactics. Review technique and tactic coverage.' },
            { step: '08', title: 'Review & Disposition', desc: 'Mark findings as true positive, false positive, or escalated. Attach analyst notes and IOCs.' },
            { step: '09', title: 'Generate Report', desc: 'Produce a structured Markdown + PDF incident report covering all findings, timeline, and MITRE mappings.' },
            { step: '10', title: 'AI Summary', desc: 'Get a grounded AI investigation summary and recommended next steps based on your case data.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="workflow-step-card">
              <span className="workflow-step-num">{step}</span>
              <div className="workflow-step-body">
                <span className="workflow-step-title">{title}</span>
                <span className="workflow-step-desc">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety */}
      <section className="section">
        <h2 className="section-title">Safety Principles</h2>
        <ul className="safety-list">
          <li>Uploaded files are <strong>never executed</strong> — static analysis only</li>
          <li>No offensive functionality, exploit code, or malware generation</li>
          <li>Local-first — no cloud dependencies in the MVP</li>
          <li>All detections are grounded in uploaded evidence</li>
        </ul>
      </section>
    </>
  )
}

function StatCard({
  label, value, accent, link,
}: {
  label: string
  value: number
  accent?: 'red' | 'orange' | 'yellow' | 'green'
  link?: string
}) {
  const valueClass = accent
    ? `stat-value stat-value--${accent}`
    : value > 0 ? 'stat-value stat-value--accent' : 'stat-value'

  const inner = (
    <div className="dashboard-stat-card">
      <div className="stat-label">{label}</div>
      <div className={valueClass}>{value}</div>
    </div>
  )

  return link
    ? <Link to={link} className="dashboard-stat-card-link">{inner}</Link>
    : inner
}

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const config = {
    checking: { dot: 'dot--yellow', label: 'API checking…' },
    online: { dot: 'dot--green', label: 'API online' },
    offline: { dot: 'dot--red', label: 'API offline — run: cd services/api && uvicorn main:app --reload' },
  }
  const { dot, label } = config[status]
  return (
    <span className="status-badge">
      <span className={`dot ${dot}`} />
      {label}
    </span>
  )
}
