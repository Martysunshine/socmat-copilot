import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getSigmaRules, reloadSigmaRules, type SigmaRule } from '../api/sigma'

const LEVEL_COLORS: Record<string, string> = {
  informational: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

const LEVELS = ['', 'informational', 'low', 'medium', 'high', 'critical']

function LogsourceBadge({ logsource }: { logsource: Record<string, string> }) {
  const parts = [logsource.product, logsource.category, logsource.service]
    .filter(Boolean)
    .map(s => s!.replace(/_/g, ' '))
  if (!parts.length) return null
  return <span className="sigma-logsource">{parts.join(' / ')}</span>
}

export default function SigmaRules() {
  const [rules, setRules] = useState<SigmaRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [levelFilter, setLevelFilter] = useState('')
  const [search, setSearch] = useState('')
  const [reloading, setReloading] = useState(false)

  useEffect(() => {
    getSigmaRules()
      .then(setRules)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = rules.filter(r => {
    if (levelFilter && r.level !== levelFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        r.title.toLowerCase().includes(s) ||
        r.description.toLowerCase().includes(s) ||
        r.tags.some(t => t.toLowerCase().includes(s))
      )
    }
    return true
  })

  async function handleReload() {
    setReloading(true)
    try {
      const { loaded } = await reloadSigmaRules()
      const fresh = await getSigmaRules()
      setRules(fresh)
      setError(null)
      // Brief message via console; toast system deferred to Phase 17
      console.info(`Reloaded ${loaded} Sigma rules`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Reload failed')
    } finally {
      setReloading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sigma Rule Library</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Browse and filter detection rules. Open a rule to view its explanation and attach it to a case.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={handleReload}
          disabled={reloading}
        >
          {reloading ? 'Reloading…' : 'Reload Rules'}
        </button>
      </div>

      <div className="sigma-filters">
        <input
          className="sigma-search"
          type="text"
          placeholder="Search by title, description, or tag…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="inline-select"
          value={levelFilter}
          onChange={e => setLevelFilter(e.target.value)}
        >
          <option value="">All levels</option>
          {LEVELS.filter(Boolean).map(l => (
            <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <span className="sigma-count">{filtered.length} rule{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {error && <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>}

      {loading ? (
        <div className="state-box">Loading rules…</div>
      ) : filtered.length === 0 ? (
        <div className="state-box">
          {rules.length === 0
            ? 'No Sigma rules found. Add .yml files to rules/sigma/custom/ and click Reload Rules.'
            : 'No rules match the current filter.'}
        </div>
      ) : (
        <div className="sigma-rules-grid">
          {filtered.map(rule => (
            <Link key={rule.id} to={`/sigma/${encodeURIComponent(rule.id)}`} className="sigma-rule-card">
              <div className="sigma-rule-card-header">
                <span
                  className="sigma-level-badge"
                  style={{ color: LEVEL_COLORS[rule.level] ?? 'var(--text-muted)' }}
                >
                  {rule.level.toUpperCase()}
                </span>
                <span className="sigma-status">{rule.status}</span>
              </div>
              <div className="sigma-rule-title">{rule.title}</div>
              {rule.description && (
                <div className="sigma-rule-desc">{rule.description}</div>
              )}
              <div className="sigma-rule-meta">
                <LogsourceBadge logsource={rule.logsource} />
                <div className="sigma-tags-row">
                  {rule.tags.slice(0, 4).map(t => (
                    <span key={t} className="sigma-tag">{t}</span>
                  ))}
                  {rule.tags.length > 4 && (
                    <span className="sigma-tag sigma-tag--more">+{rule.tags.length - 4}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
