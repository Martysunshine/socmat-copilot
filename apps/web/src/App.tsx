import { useEffect, useState } from 'react'
import './App.css'

type ApiStatus = 'checking' | 'online' | 'offline'

const NAV_ITEMS = [
  { label: 'Cases', icon: '📁', phase: 2 },
  { label: 'Evidence', icon: '🔍', phase: 3 },
  { label: 'Sigma Rules', icon: '📋', phase: 6 },
  { label: 'YARA Rules', icon: '🧬', phase: 8 },
  { label: 'Reports', icon: '📄', phase: 12 },
]

const MODULES = [
  { name: 'Case Management', phase: 2, description: 'Create and track SOC investigation cases with severity, status, and affected assets.' },
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

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.ok ? setApiStatus('online') : setApiStatus('offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🛡</span>
            <span className="logo-text">SOC Copilot Workbench</span>
          </div>
          <nav className="nav">
            {NAV_ITEMS.map((item) => (
              <button key={item.label} className="nav-item nav-item--disabled" disabled title={`Coming in Phase ${item.phase}`}>
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <section className="hero">
          <h1 className="hero-title">SOC Analyst Workbench</h1>
          <p className="hero-subtitle">
            Local-first defensive cybersecurity automation — alert investigation, log analysis,
            detection rules, static malware triage, and incident report generation.
          </p>
          <div className="status-row">
            <StatusBadge status={apiStatus} />
            <span className="phase-badge">Phase 1 — Architecture Skeleton</span>
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Investigation Workflow</h2>
          <div className="workflow">
            {['Create Case', 'Upload Evidence', 'Run Parsers', 'Run Detections', 'Correlate', 'MITRE Map', 'Generate Report'].map((step, i, arr) => (
              <span key={step} className="workflow-row">
                <span className="workflow-step">{step}</span>
                {i < arr.length - 1 && <span className="workflow-arrow">→</span>}
              </span>
            ))}
          </div>
        </section>

        <section className="section">
          <h2 className="section-title">Planned Modules</h2>
          <div className="module-grid">
            {MODULES.map((mod) => (
              <div key={mod.name} className="module-card">
                <div className="module-header">
                  <span className="module-name">{mod.name}</span>
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
      </main>

      <footer className="footer">
        SOC Copilot Workbench — defensive cybersecurity automation &nbsp;|&nbsp; Phase 1
      </footer>
    </div>
  )
}

function StatusBadge({ status }: { status: ApiStatus }) {
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
