import { Link, NavLink, Outlet } from 'react-router-dom'
import '../App.css'

const DISABLED_NAV: { label: string; icon: string; phase: number }[] = []

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
            <NavLink
              to="/sigma"
              className={({ isActive }) =>
                `nav-item nav-link${isActive ? ' nav-item--active' : ''}`
              }
            >
              📋 Sigma Rules
            </NavLink>
            <NavLink
              to="/yara"
              className={({ isActive }) =>
                `nav-item nav-link${isActive ? ' nav-item--active' : ''}`
              }
            >
              🧬 YARA Rules
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `nav-item nav-link${isActive ? ' nav-item--active' : ''}`
              }
            >
              📄 Reports
            </NavLink>
            <NavLink
              to="/mcp"
              className={({ isActive }) =>
                `nav-item nav-link${isActive ? ' nav-item--active' : ''}`
              }
            >
              🔌 MCP Tools
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
        SOC Copilot Workbench — defensive cybersecurity automation &nbsp;|&nbsp; Phase 14
      </footer>
    </div>
  )
}
