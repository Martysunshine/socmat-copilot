import { Link, NavLink, Outlet } from 'react-router-dom'
import '../App.css'

const DISABLED_NAV = [
  { label: 'Evidence', icon: '🔍', phase: 3 },
  { label: 'Sigma Rules', icon: '📋', phase: 6 },
  { label: 'YARA Rules', icon: '🧬', phase: 8 },
  { label: 'Reports', icon: '📄', phase: 12 },
]

export default function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo logo-link">
            <span className="logo-icon">🛡</span>
            <span className="logo-text">SOC Copilot Workbench</span>
          </Link>
          <nav className="nav">
            <NavLink
              to="/cases"
              className={({ isActive }) =>
                `nav-item nav-link${isActive ? ' nav-item--active' : ''}`
              }
            >
              📁 Cases
            </NavLink>
            {DISABLED_NAV.map((item) => (
              <button
                key={item.label}
                className="nav-item nav-item--disabled"
                disabled
                title={`Coming in Phase ${item.phase}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        SOC Copilot Workbench — defensive cybersecurity automation &nbsp;|&nbsp; Phase 2
      </footer>
    </div>
  )
}
