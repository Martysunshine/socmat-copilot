import { useEffect, useState } from 'react'
import {
  getCaseCoverage,
  getCaseTelemetryGaps,
  type CaseCoverageResponse,
  type TelemetryGapListResponse,
  type RuleCoverage,
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

function StatusDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: color,
        marginRight: 6,
        flexShrink: 0,
      }}
    />
  )
}

function RuleRow({ rule }: { rule: RuleCoverage }) {
  const [expanded, setExpanded] = useState(false)
  const color = rule.triggered_in_case
    ? 'var(--green)'
    : rule.blocked_by_missing_data
    ? 'var(--yellow)'
    : 'var(--text-muted)'

  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '6px 0' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}
      >
        <StatusDot color={color} />
        <span style={{ flex: 1, fontSize: 13 }}>{rule.rule_title}</span>
        <SevBadge severity={rule.severity} />
        <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 80, textAlign: 'right' }}>
          {rule.required_logsource}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div style={{ paddingLeft: 18, paddingTop: 6, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <div><strong>Rule ID:</strong> <code>{rule.rule_id}</code></div>
          <div><strong>Log Source:</strong> {rule.required_logsource || '—'}</div>
          {rule.required_fields.length > 0 && (
            <div><strong>Fields:</strong> {rule.required_fields.join(', ')}</div>
          )}
          {rule.mapped_mitre_techniques.length > 0 && (
            <div><strong>MITRE:</strong> {rule.mapped_mitre_techniques.join(', ')}</div>
          )}
          {rule.missing_fields.length > 0 && (
            <div style={{ color: 'var(--yellow)' }}>
              <strong>Blocked:</strong> {rule.missing_fields.join('; ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  caseId: number
}

export default function CoveragePanel({ caseId }: Props) {
  const [coverage, setCoverage] = useState<CaseCoverageResponse | null>(null)
  const [gaps, setGaps] = useState<TelemetryGapListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'summary' | 'triggered' | 'notTriggered' | 'blocked' | 'gaps'>(
    'summary'
  )
  const [severityFilter, setSeverityFilter] = useState('')
  const [logsourceFilter, setLogsourceFilter] = useState('')

  useEffect(() => {
    Promise.all([getCaseCoverage(caseId), getCaseTelemetryGaps(caseId)])
      .then(([cov, gapData]) => {
        setCoverage(cov)
        setGaps(gapData)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  if (loading) return <div className="state-box">Loading coverage analysis…</div>
  if (error) return <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>
  if (!coverage || !gaps) return null

  function filterRules(rules: RuleCoverage[]) {
    return rules.filter(r => {
      if (severityFilter && r.severity !== severityFilter) return false
      if (logsourceFilter && !r.required_logsource.toLowerCase().includes(logsourceFilter.toLowerCase())) return false
      return true
    })
  }

  const triggeredFiltered = filterRules(coverage.rules_triggered)
  const notTriggeredFiltered = filterRules(coverage.rules_not_triggered)
  const blockedFiltered = filterRules(coverage.rules_blocked)
  const totalFiltered = triggeredFiltered.length + notTriggeredFiltered.length + blockedFiltered.length

  const TABS = [
    { key: 'summary', label: 'Summary' },
    { key: 'triggered', label: `Triggered (${coverage.rules_triggered.length})` },
    { key: 'notTriggered', label: `Not Triggered (${coverage.rules_not_triggered.length})` },
    { key: 'blocked', label: `Blocked (${coverage.rules_blocked.length})` },
    { key: 'gaps', label: `Telemetry Gaps (${gaps.gap_count})` },
  ] as const

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <div className="panel-section-title">Detection Coverage</div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div className="detail-card" style={{ flex: '1 1 160px', padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>MITRE Coverage</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>
            {coverage.coverage_percent}%
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {coverage.mitre_covered_techniques} / {coverage.mitre_total_techniques} techniques
          </div>
        </div>
        <div className="detail-card" style={{ flex: '1 1 160px', padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Rules Triggered</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>
            {coverage.rules_triggered.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>of {totalFiltered} loaded rules</div>
        </div>
        <div className="detail-card" style={{ flex: '1 1 160px', padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Rules Blocked</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--yellow)' }}>
            {coverage.rules_blocked.length}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>missing telemetry</div>
        </div>
        <div className="detail-card" style={{ flex: '1 1 160px', padding: '12px 16px', minWidth: 140 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Telemetry Gaps</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: gaps.gap_count > 3 ? 'var(--red)' : 'var(--yellow)' }}>
            {gaps.gap_count}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>log sources missing</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button
            key={t.key}
            className={`btn ${activeTab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '4px 10px', borderRadius: '4px 4px 0 0', marginBottom: -1 }}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters (shown on rule tabs) */}
      {activeTab !== 'summary' && activeTab !== 'gaps' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
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
        </div>
      )}

      {/* Summary tab */}
      {activeTab === 'summary' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
              Available Log Sources
            </div>
            {coverage.available_log_sources.length > 0 ? (
              coverage.available_log_sources.map(src => (
                <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 13 }}>
                  <StatusDot color="var(--green)" />
                  {src}
                </div>
              ))
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No log sources collected yet.</div>
            )}
          </div>
          {coverage.missing_log_sources.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>
                Missing Log Sources
              </div>
              {coverage.missing_log_sources.map(src => (
                <div key={src} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: 13 }}>
                  <StatusDot color="var(--text-muted)" />
                  {src}
                </div>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 8 }}>
            Coverage is based on triggered Sigma rules and collected case evidence. Absence of coverage does not indicate absence of compromise.
          </div>
        </div>
      )}

      {/* Triggered tab */}
      {activeTab === 'triggered' && (
        <div>
          {triggeredFiltered.length === 0 ? (
            <div className="state-box">No triggered rules match the current filter.</div>
          ) : (
            triggeredFiltered.map(r => <RuleRow key={r.rule_id} rule={r} />)
          )}
        </div>
      )}

      {/* Not triggered tab */}
      {activeTab === 'notTriggered' && (
        <div>
          {notTriggeredFiltered.length === 0 ? (
            <div className="state-box">No rules match the current filter.</div>
          ) : (
            notTriggeredFiltered.slice(0, 100).map(r => <RuleRow key={r.rule_id} rule={r} />)
          )}
          {notTriggeredFiltered.length > 100 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
              Showing 100 of {notTriggeredFiltered.length} rules. Use filters to narrow results.
            </div>
          )}
        </div>
      )}

      {/* Blocked tab */}
      {activeTab === 'blocked' && (
        <div>
          {blockedFiltered.length === 0 ? (
            <div className="state-box">No blocked rules. All applicable rules have the required log sources.</div>
          ) : (
            blockedFiltered.map(r => <RuleRow key={r.rule_id} rule={r} />)
          )}
        </div>
      )}

      {/* Gaps tab */}
      {activeTab === 'gaps' && (
        <div>
          {gaps.gaps.length === 0 ? (
            <div className="state-box">No major telemetry gaps identified for this case.</div>
          ) : (
            gaps.gaps.map((gap, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid var(--yellow)',
                  borderRadius: 6,
                  padding: '12px 14px',
                  marginBottom: 10,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
                  {gap.missing_log_source}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.6 }}>
                  {gap.why_it_matters}
                </div>
                <div style={{ fontSize: 12, marginBottom: 4 }}>
                  <strong>Affected detections:</strong>{' '}
                  <span style={{ color: 'var(--text-muted)' }}>{gap.affected_detection_rules.join(', ')}</span>
                </div>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  <strong>Related MITRE techniques:</strong>{' '}
                  <span style={{ color: 'var(--accent)' }}>{gap.related_mitre_techniques.join(', ')}</span>
                </div>
                <div style={{ fontSize: 12, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '6px 10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <strong>Recommendation:</strong> {gap.recommendation}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
