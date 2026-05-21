import { useEffect, useState } from 'react'
import { getYaraRules, reloadYaraRules, type YaraRuleInfo } from '../api/yara'

const SEVERITY_COLORS: Record<string, string> = {
  informational: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

export default function YaraRulesPage() {
  const [rules, setRules] = useState<YaraRuleInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloading, setReloading] = useState(false)
  const [reloadMsg, setReloadMsg] = useState<string | null>(null)

  useEffect(() => {
    getYaraRules()
      .then(setRules)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  async function handleReload() {
    setReloading(true)
    setReloadMsg(null)
    try {
      const r = await reloadYaraRules()
      const msg = r.yara_available
        ? `${r.loaded} rule${r.loaded !== 1 ? 's' : ''} loaded.`
        : 'yara-python not installed — YARA matching disabled.'
      setReloadMsg(msg)
      const fresh = await getYaraRules()
      setRules(fresh)
    } catch (e: unknown) {
      setReloadMsg(e instanceof Error ? e.message : 'Reload failed')
    } finally {
      setReloading(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">YARA Rules</h1>
          <p className="page-subtitle">
            Static malware triage rules. Files are analyzed statically — never executed.
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleReload} disabled={reloading}>
          {reloading ? 'Reloading…' : 'Reload Rules'}
        </button>
      </div>

      {reloadMsg && (
        <div className="state-box" style={{ marginBottom: 16, padding: '10px 16px' }}>
          {reloadMsg}
        </div>
      )}

      {loading && <div className="state-box">Loading rules…</div>}
      {error && (
        <div className="state-box state-error">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && rules.length === 0 && (
        <div className="state-box">
          <p>No YARA rules loaded. Add <code>.yar</code> or <code>.yara</code> files to <code>rules/yara/</code> and click Reload Rules.</p>
          <p style={{ marginTop: 8 }}>Make sure <code>yara-python</code> is installed: <code>pip install yara-python</code></p>
        </div>
      )}

      {rules.length > 0 && (
        <>
          <div style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 13 }}>
            {rules.length} rule{rules.length !== 1 ? 's' : ''} loaded
          </div>

          <div className="yara-safety-banner">
            Static analysis only — uploaded files are <strong>never executed</strong>.
            YARA rules match byte patterns and strings in file content.
          </div>

          <div className="sigma-rules-grid">
            {rules.map(rule => (
              <div key={rule.name} className="sigma-rule-card" style={{ cursor: 'default' }}>
                <div className="sigma-rule-card-header">
                  <span
                    className="sigma-level-badge"
                    style={{
                      color: SEVERITY_COLORS[rule.meta.severity?.toLowerCase() ?? ''] ?? 'var(--text-muted)',
                    }}
                  >
                    {(rule.meta.severity ?? 'unknown').toUpperCase()}
                  </span>
                  {rule.tags.length > 0 && (
                    <div className="sigma-tags-row">
                      {rule.tags.slice(0, 3).map(t => (
                        <span key={t} className="sigma-tag">{t}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="sigma-rule-title">{rule.name.replace(/_/g, ' ')}</div>

                {rule.meta.description && (
                  <div className="sigma-rule-desc">{rule.meta.description}</div>
                )}

                <div className="sigma-rule-meta">
                  {rule.meta.mitre && (
                    <div className="sigma-logsource">MITRE: {rule.meta.mitre}</div>
                  )}
                  {rule.meta.author && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {rule.meta.author}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  )
}
