import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCases, type Case } from '../api/cases'

type ApiStatus = 'checking' | 'online' | 'offline'

const MODULES = [
  { name: 'Case Management', phase: 2, done: true, description: 'Create and track SOC investigation cases with severity, status, and affected assets.' },
  { name: 'Evidence Upload', phase: 3, description: 'Upload log files, PCAPs, and suspicious files. Auto-hashing and safe storage.' },
  { name: 'Windows / Sysmon Parser', phase: 4, description: 'Parse Windows Event Logs and Sysmon exports. Detect suspicious event patterns.' },
  { name: 'Suricata IDS Analysis', phase: 5, description: 'Analyze Suricata eve.json alert files. Summarize network threats.' },
  { name: 'Sigma Rule Library', phase: 6, description: 'Load, browse, and explain Sigma YAML detection rules.' },
  { name: 'YARA Static Triage', phase: 8, description: 'Run YARA rules against uploaded files. Extract strings. Never execute files.' },
  { name: 'Zeek Network Analysis', phase: 9, description: 'Parse Zeek conn.log, dns.log, http.log. Identify suspicious network behavior.' },
  { name: 'Correlation Engine', phase: 10, description: 'Correlate findings across all modules by shared IPs, hosts, hashes, and timestamps.' },
  { name: 'MITRE ATT&CK Mapping', phase: 11, description: 'Map findings to MITRE ATT&CK tactics and techniques.' },
  { name: 'Incident Report Generator', phase: 12, description: 'Generate structured Security Incident Reports as Markdown.' },
  { name: 'AI Investigation Assistant', phase: 13, description: 'Grounded AI summary using only stored case data. No hallucination.' },
  { name: 'MCP Tool Server', phase: 14, description: 'MCP-compatible tool server for agent-driven SOC workflows.' },
]

export default function Dashboard() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')
  const [cases, setCases] = useState<Case[]>([])

  useEffect(() => {
    fetch('/api/health')
      .then((r) => (r.ok ? setApiStatus('online') : setApiStatus('offline')))
      .catch(() => setApiStatus('offline'))
  }, [])

  useEffect(() => {
    getCases().then(setCases).catch(() => {})
  }, [])

  const openCases = cases.filter((c) => c.status === 'open').length
  const criticalCases = cases.filter((c) => c.severity === 'critical').length
  const highCases = cases.filter((c) => c.severity === 'high').length

  return (
    <>
      <section className="hero">
        <h1 className="hero-title">SOC Analyst Workbench</h1>
        <p className="hero-subtitle">
          Local-first defensive cybersecurity automation — alert investigation, log analysis,
          detection rules, static malware triage, and incident report generation.
        </p>
        <div className="status-row">
          <ApiStatusBadge status={apiStatus} />
          <span className="phase-badge">Phase 2 — Case Management</span>
        </div>
      </section>

      {cases.length > 0 && (
        <section className="section">
          <h2 className="section-title">Cases Overview</h2>
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Cases</div>
              <div className="stat-value stat-value--accent">{cases.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Open</div>
              <div className="stat-value">{openCases}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Critical</div>
              <div className="stat-value stat-value--red">{criticalCases}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">High</div>
              <div className="stat-value stat-value--yellow">{highCases}</div>
            </div>
          </div>
          <Link to="/cases" className="btn btn-secondary" style={{ fontSize: 13 }}>
            View all cases →
          </Link>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Investigation Workflow</h2>
        <div className="workflow">
          {['Create Case', 'Upload Evidence', 'Run Parsers', 'Run Detections', 'Correlate', 'MITRE Map', 'Generate Report'].map(
            (step, i, arr) => (
              <span key={step} className="workflow-row">
                <span className="workflow-step">{step}</span>
                {i < arr.length - 1 && <span className="workflow-arrow">→</span>}
              </span>
            )
          )}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Modules</h2>
        <div className="module-grid">
          {MODULES.map((mod) => (
            <div key={mod.name} className={`module-card${mod.done ? ' module-card--done' : ''}`}>
              <div className="module-header">
                <span className="module-name">{mod.done ? '✓ ' : ''}{mod.name}</span>
                <span className="module-phase">Phase {mod.phase}</span>
              </div>
              <p className="module-desc">{mod.description}</p>
            </div>
          ))}
        </div>
      </section>

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
