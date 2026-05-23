import { useEffect, useMemo, useRef, useState } from 'react'
import { getTimelineReplay, type ReplayEvent, type ReplayResponse } from '../api/replay'

const SEV_COLOR: Record<string, string> = {
  info: 'var(--text-muted)',
  low: 'var(--green)',
  medium: 'var(--yellow)',
  high: '#f0883e',
  critical: 'var(--red)',
}

const SEV_BG: Record<string, string> = {
  info: 'rgba(120,120,120,0.15)',
  low: 'rgba(63,185,80,0.15)',
  medium: 'rgba(229,192,40,0.15)',
  high: 'rgba(240,136,62,0.15)',
  critical: 'rgba(248,81,73,0.2)',
}

const SOURCE_COLORS: Record<string, string> = {
  windows_logs: '#60a5fa',
  suricata: '#f87171',
  zeek: '#34d399',
  sigma: '#a78bfa',
  yara: '#fb923c',
  correlation: '#f472b6',
  pcap: '#38bdf8',
  manual: '#94a3b8',
}

const SPEED_OPTIONS = [
  { label: '0.5×', ms: 4000 },
  { label: '1×', ms: 2000 },
  { label: '2×', ms: 1000 },
  { label: '4×', ms: 500 },
]

function formatTs(iso: string) {
  try {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch {
    return iso
  }
}

interface Props {
  caseId: number
  onClose: () => void
}

export default function TimelineReplayModal({ caseId, onClose }: Props) {
  const [data, setData] = useState<ReplayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speedMs, setSpeedMs] = useState(2000)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [copied, setCopied] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getTimelineReplay(caseId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  const filteredEvents = useMemo<ReplayEvent[]>(() => {
    if (!data) return []
    return data.events.filter(
      (e) =>
        (severityFilter === 'all' || e.severity === severityFilter) &&
        (sourceFilter === 'all' || e.source === sourceFilter),
    )
  }, [data, severityFilter, sourceFilter])

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0)
    setPlaying(false)
  }, [severityFilter, sourceFilter])

  // Auto-advance timer
  useEffect(() => {
    if (!playing) return
    const timer = setInterval(() => {
      setCurrentIndex((i) => {
        if (i >= filteredEvents.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, speedMs)
    return () => clearInterval(timer)
  }, [playing, speedMs, filteredEvents.length])

  // Scroll sidebar item into view
  useEffect(() => {
    if (!sidebarRef.current) return
    const item = sidebarRef.current.querySelector(`[data-idx="${currentIndex}"]`)
    item?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex])

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(i + 1, filteredEvents.length - 1))
      if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(i - 1, 0))
      if (e.key === ' ') { e.preventDefault(); setPlaying((p) => !p) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [filteredEvents.length, onClose])

  function handleCopy() {
    if (!current) return
    const text = [
      `[${current.severity.toUpperCase()}] ${current.title} (${current.source})`,
      `Timestamp: ${formatTs(current.timestamp)}`,
      `Order: ${current.order} of ${filteredEvents.length}`,
      '',
      current.description,
      '',
      `Explanation: ${current.explanation}`,
      `Recommended Focus: ${current.recommended_focus}`,
      current.affected_entities.length > 0 ? `Entities: ${current.affected_entities.join(', ')}` : '',
    ]
      .filter(Boolean)
      .join('\n')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }

  const current = filteredEvents[currentIndex] ?? null
  const progressPct = filteredEvents.length > 1 ? (currentIndex / (filteredEvents.length - 1)) * 100 : 100

  const allSeverities = data?.metadata.severities ?? []
  const allSources = data?.metadata.sources ?? []

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', flexDirection: 'column',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Modal container */}
      <div
        style={{
          margin: '24px auto',
          width: 'min(1100px, 96vw)',
          maxHeight: 'calc(100vh - 48px)',
          background: 'var(--bg-card)',
          borderRadius: 12,
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginRight: 8 }}>
            ▶ Attack Timeline Replay
          </span>
          {data && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {data.metadata.total_events} events total
              {data.metadata.date_range.start && (
                <> &nbsp;·&nbsp; {formatTs(data.metadata.date_range.start)} → {formatTs(data.metadata.date_range.end ?? '')}</>
              )}
            </span>
          )}

          <div style={{ flex: 1 }} />

          {/* Filters */}
          <select
            className="inline-select"
            style={{ fontSize: 12 }}
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All severities</option>
            {allSeverities.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            className="inline-select"
            style={{ fontSize: 12 }}
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
          >
            <option value="all">All sources</option>
            {allSources.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>

          <button
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: '2px 4px',
            }}
            onClick={onClose}
            title="Close replay (Esc)"
          >×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Sidebar — event list */}
          <div
            ref={sidebarRef}
            style={{
              width: 220,
              minWidth: 220,
              borderRight: '1px solid var(--border)',
              overflowY: 'auto',
              padding: '8px 0',
            }}
          >
            {loading && <div style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: 12 }}>Loading…</div>}
            {!loading && filteredEvents.length === 0 && (
              <div style={{ padding: '16px 12px', color: 'var(--text-muted)', fontSize: 12 }}>No events match filters.</div>
            )}
            {filteredEvents.map((ev, idx) => (
              <button
                key={ev.id}
                data-idx={idx}
                onClick={() => { setCurrentIndex(idx); setPlaying(false) }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 12px',
                  border: 'none',
                  cursor: 'pointer',
                  borderLeft: idx === currentIndex ? '3px solid var(--accent)' : '3px solid transparent',
                  background: idx === currentIndex ? 'rgba(88,166,255,0.08)' : 'transparent',
                  color: idx === currentIndex ? 'var(--text)' : 'var(--text-muted)',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                    background: SEV_COLOR[ev.severity] ?? 'var(--border)',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: SOURCE_COLORS[ev.source] ?? 'var(--text-muted)' }}>
                    {ev.source.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.3, wordBreak: 'break-word' }}>
                  {ev.title}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  #{ev.order}
                </div>
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>

            {/* Progress bar */}
            {filteredEvents.length > 0 && (
              <div style={{ padding: '12px 20px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Event {currentIndex + 1} of {filteredEvents.length}</span>
                  <span>{Math.round(progressPct)}% through timeline</span>
                </div>
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: 'var(--accent)',
                      borderRadius: 2,
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Event card */}
            <div style={{ padding: '16px 20px', flex: 1 }}>
              {loading && <div className="state-box">Loading replay data…</div>}
              {error && <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>}

              {!loading && !error && filteredEvents.length === 0 && (
                <div className="state-box">
                  <p>No events match the current filters. Try adjusting severity or source filters.</p>
                </div>
              )}

              {current && (
                <div
                  style={{
                    background: SEV_BG[current.severity] ?? 'var(--bg-card-2)',
                    border: `1px solid ${SEV_COLOR[current.severity] ?? 'var(--border)'}`,
                    borderRadius: 10,
                    padding: 20,
                  }}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, flex: 1 }}>{current.title}</h3>
                    <span
                      style={{
                        background: SEV_COLOR[current.severity] ?? 'var(--border)',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                        textTransform: 'uppercase',
                      }}
                    >
                      {current.severity}
                    </span>
                    <span
                      style={{
                        background: SOURCE_COLORS[current.source] ?? '#555',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {current.source.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                    {formatTs(current.timestamp)}
                  </div>

                  <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.6 }}>{current.description}</p>

                  {/* Explanation box */}
                  <div
                    style={{
                      background: 'rgba(88,166,255,0.07)',
                      border: '1px solid rgba(88,166,255,0.2)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      marginBottom: 12,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      What this means
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{current.explanation}</p>
                  </div>

                  {/* Recommended focus */}
                  <div
                    style={{
                      background: 'rgba(167,139,250,0.07)',
                      border: '1px solid rgba(167,139,250,0.2)',
                      borderRadius: 6,
                      padding: '10px 14px',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Recommended focus
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{current.recommended_focus}</p>
                  </div>

                  {/* Entities / Evidence / MITRE row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>

                    {current.affected_entities.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Affected Entities
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {current.affected_entities.map((e, i) => (
                            <span key={i} style={{ fontSize: 11, background: 'var(--bg-card-2)', border: '1px solid var(--border)', borderRadius: 4, padding: '2px 6px', fontFamily: 'monospace' }}>
                              {e}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {current.related_evidence.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Related Evidence
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {current.related_evidence.map((ev) => (
                            <span key={ev.id} style={{ fontSize: 11, color: 'var(--text)' }}>
                              📎 {ev.filename}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {current.related_findings.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Related Findings
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {current.related_findings.map((f, i) => (
                            <span key={i} style={{ fontSize: 11, color: SEV_COLOR[f.severity] ?? 'var(--text-muted)' }}>
                              [{f.severity.toUpperCase()}] {f.rule_title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {current.mitre_mappings.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          MITRE ATT&amp;CK
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          {current.mitre_mappings.slice(0, 4).map((m, i) => (
                            <span key={i} style={{ fontSize: 11, color: 'var(--text)' }}>
                              <span style={{ fontFamily: 'monospace', color: 'var(--accent)' }}>{m.technique_id}</span>
                              {' '}{m.technique_name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {current.analyst_notes.length > 0 && (
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Analyst Notes
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {current.analyst_notes.map((n, i) => (
                            <div key={i} style={{ fontSize: 11, background: 'var(--bg-card-2)', borderRadius: 4, padding: '4px 8px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>[{n.note_type}] {n.author}: </span>
                              {n.body}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy button */}
                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={handleCopy}>
                      {copied ? '✓ Copied!' : '📋 Copy event summary'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Playback controls ── */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              {/* Restart */}
              <button
                className="btn btn-secondary"
                style={{ fontSize: 13, minWidth: 36 }}
                title="Restart (go to first event)"
                onClick={() => { setCurrentIndex(0); setPlaying(false) }}
                disabled={filteredEvents.length === 0}
              >⏮</button>

              {/* Previous */}
              <button
                className="btn btn-secondary"
                style={{ fontSize: 13, minWidth: 36 }}
                title="Previous event (←)"
                onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
                disabled={currentIndex === 0 || filteredEvents.length === 0}
              >◀</button>

              {/* Play / Pause */}
              <button
                className="btn btn-primary"
                style={{ fontSize: 13, minWidth: 80 }}
                onClick={() => setPlaying((p) => !p)}
                disabled={filteredEvents.length === 0}
              >
                {playing ? '⏸ Pause' : '▶ Play'}
              </button>

              {/* Next */}
              <button
                className="btn btn-secondary"
                style={{ fontSize: 13, minWidth: 36 }}
                title="Next event (→)"
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, filteredEvents.length - 1))}
                disabled={currentIndex >= filteredEvents.length - 1 || filteredEvents.length === 0}
              >▶</button>

              {/* Speed selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Speed:</span>
                {SPEED_OPTIONS.map((opt) => (
                  <button
                    key={opt.ms}
                    onClick={() => setSpeedMs(opt.ms)}
                    style={{
                      padding: '3px 8px',
                      fontSize: 12,
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: speedMs === opt.ms ? 'var(--accent)' : 'var(--bg-card-2)',
                      color: speedMs === opt.ms ? '#fff' : 'var(--text-muted)',
                      fontWeight: speedMs === opt.ms ? 700 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1 }} />

              {/* Jump to event */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Jump to:</span>
                <input
                  type="number"
                  min={1}
                  max={filteredEvents.length}
                  value={currentIndex + 1}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    if (!isNaN(n) && n >= 1 && n <= filteredEvents.length) {
                      setCurrentIndex(n - 1)
                      setPlaying(false)
                    }
                  }}
                  style={{
                    width: 54,
                    padding: '3px 6px',
                    fontSize: 12,
                    background: 'var(--bg-card-2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    borderRadius: 4,
                    textAlign: 'center',
                  }}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/ {filteredEvents.length}</span>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                ← → space
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
