import { useEffect, useMemo, useState } from 'react'
import {
  getRuleCoverage,
  type RuleCoverage,
  type RuleCoverageListResponse,
} from '../api/coverage'

const SEV_COLORS: Record<string, string> = {
  critical: 'var(--red)',
  high: '#f0883e',
  medium: 'var(--yellow)',
  low: 'var(--green)',
  informational: 'var(--text-muted)',
}

function SevBadge({ severity }: { severity: string }) {
  return (
    <span
      style={{
        background: SEV_COLORS[severity] ?? 'var(--surface-2)',
        color: severity === 'medium' || severity === 'low' ? '#000' : 'var(--text)',
        padding: '1px 7px',
        borderRadius: 4,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {severity}
    </span>
  )
}

function RuleCard({ rule }: { rule: RuleCoverage }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        marginBottom: 6,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <SevBadge severity={rule.severity} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{rule.rule_title}</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 200, textAlign: 'right' }}>
          {rule.required_logsource}
        </span>
        {rule.mapped_mitre_techniques.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--accent)' }}>
            {rule.mapped_mitre_techniques.length} MITRE
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div
          style={{
            borderTop: '1px solid var(--border)',
            padding: '10px 14px',
            fontSize: 12,
            lineHeight: 1.7,
            color: 'var(--text-muted)',
          }}
        >
          <div><strong style={{ color: 'var(--text)' }}>Rule ID:</strong> <code>{rule.rule_id}</code></div>
          <div><strong style={{ color: 'var(--text)' }}>Log Source:</strong> {rule.required_logsource || '—'}</div>
          {rule.required_fields.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text)' }}>Detection Fields:</strong>{' '}
              {rule.required_fields.map(f => <code key={f} style={{ marginRight: 4 }}>{f}</code>)}
            </div>
          )}
          {rule.mapped_mitre_techniques.length > 0 && (
            <div>
              <strong style={{ color: 'var(--text)' }}>MITRE Techniques:</strong>{' '}
              {rule.mapped_mitre_techniques.map(t => (
                <span key={t} style={{ marginRight: 6, color: 'var(--accent)', fontWeight: 600 }}>{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function CoveragePage() {
  const [data, setData] = useState<RuleCoverageListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [severityFilter, setSeverityFilter] = useState('')
  const [logsourceFilter, setLogsourceFilter] = useState('')
  const [tacticFilter, setTacticFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getRuleCoverage()
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.rules.filter((r: RuleCoverage) => {
      if (severityFilter && r.severity !== severityFilter) return false
      if (logsourceFilter && !r.required_logsource.toLowerCase().includes(logsourceFilter.toLowerCase())) return false
      if (tacticFilter && !r.mapped_mitre_techniques.some(t => t.toLowerCase().includes(tacticFilter.toLowerCase()))) return false
      if (search && !r.rule_title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [data, severityFilter, logsourceFilter, tacticFilter, search])

  const withMitre = useMemo(() => filtered.filter(r => r.mapped_mitre_techniques.length > 0), [filtered])
  const tacticCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach(r => r.mapped_mitre_techniques.forEach(t => {
      counts[t] = (counts[t] || 0) + 1
    }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10)
  }, [filtered])

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Detection Coverage</h1>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Global rule library — {data?.total_count ?? 0} Sigma rules loaded
        </div>
      </div>

      {loading && <div className="state-box">Loading rule library…</div>}
      {error && <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>}

      {data && (
        <>
          {/* Summary row */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="detail-card" style={{ flex: '1 1 140px', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Total Rules</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{data.total_count}</div>
            </div>
            <div className="detail-card" style={{ flex: '1 1 140px', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>With MITRE Tags</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
                {data.rules.filter(r => r.mapped_mitre_techniques.length > 0).length}
              </div>
            </div>
            <div className="detail-card" style={{ flex: '1 1 140px', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Showing</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{filtered.length}</div>
            </div>
            <div className="detail-card" style={{ flex: '1 1 140px', padding: '12px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>With MITRE (filtered)</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>{withMitre.length}</div>
            </div>
          </div>

          {/* Top MITRE techniques */}
          {tacticCounts.length > 0 && (
            <div className="detail-card" style={{ marginBottom: 20 }}>
              <div className="detail-card-title">Top MITRE Techniques in Rule Library</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {tacticCounts.map(([tech, cnt]) => (
                  <span
                    key={tech}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--accent)',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 12,
                      color: 'var(--accent)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setTacticFilter(tac => tac === tech ? '' : tech)}
                    title={`Filter by ${tech} (${cnt} rules)`}
                  >
                    {tech} <span style={{ opacity: 0.6 }}>×{cnt}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <input
              type="text"
              placeholder="Search rule title…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', width: 200 }}
            />
            <select
              className="inline-select"
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              style={{ fontSize: 12 }}
            >
              <option value="">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
              <option value="informational">Informational</option>
            </select>
            <input
              type="text"
              placeholder="Filter by log source…"
              value={logsourceFilter}
              onChange={e => setLogsourceFilter(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', width: 180 }}
            />
            <input
              type="text"
              placeholder="Filter by MITRE (e.g. T1059)…"
              value={tacticFilter}
              onChange={e => setTacticFilter(e.target.value)}
              style={{ fontSize: 12, padding: '4px 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', width: 200 }}
            />
            {(severityFilter || logsourceFilter || tacticFilter || search) && (
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => { setSeverityFilter(''); setLogsourceFilter(''); setTacticFilter(''); setSearch('') }}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Rule list */}
          {filtered.length === 0 ? (
            <div className="state-box">No rules match the current filters.</div>
          ) : (
            <>
              {filtered.slice(0, 200).map(r => <RuleCard key={r.rule_id} rule={r} />)}
              {filtered.length > 200 && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
                  Showing 200 of {filtered.length} rules. Use filters to narrow results.
                </div>
              )}
            </>
          )}
        </>
      )}
    </>
  )
}
