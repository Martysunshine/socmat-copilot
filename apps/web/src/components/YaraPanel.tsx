import { useEffect, useState } from 'react'
import { runYaraTriage, getYaraResults, type MalwareTriageResult } from '../api/yara'
import { type Evidence } from '../api/evidence'

const RISK_COLOR = (score: number) =>
  score >= 76 ? 'var(--red)'
  : score >= 51 ? '#f0883e'
  : score >= 26 ? 'var(--yellow)'
  : 'var(--green)'

const RISK_LABEL = (score: number) =>
  score >= 76 ? 'CRITICAL'
  : score >= 51 ? 'HIGH'
  : score >= 26 ? 'MEDIUM'
  : score === 0 ? 'CLEAN' : 'LOW'

function formatSize(bytes: number | null): string {
  if (bytes === null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface Props {
  caseId: number
  evidence: Evidence[]
  onAnalysisComplete: () => void
}

export default function YaraPanel({ caseId, evidence, onAnalysisComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<MalwareTriageResult[]>([])
  const [loadingResults, setLoadingResults] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getYaraResults(caseId)
      .then(setResults)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoadingResults(false))
  }, [caseId])

  async function handleRun() {
    if (!selectedId) return
    setRunning(true)
    setError(null)
    try {
      const result = await runYaraTriage(caseId, Number(selectedId))
      setResults(prev => {
        const without = prev.filter(r => r.evidence_id !== result.evidence_id)
        return [result, ...without]
      })
      onAnalysisComplete()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Triage failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-title">YARA Static Malware Triage</div>

      <div className="yara-safety-banner" style={{ marginBottom: 16 }}>
        Static analysis only — files are <strong>never executed</strong>.
        Hashes, strings, and YARA rule matches are computed from file bytes.
      </div>

      {evidence.length === 0 ? (
        <div className="state-box">
          <p>No evidence files uploaded. Upload a file first, then run YARA triage.</p>
        </div>
      ) : (
        <div className="analysis-run-row">
          <select
            className="inline-select"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Select evidence file…</option>
            {evidence.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.original_filename}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={!selectedId || running}
          >
            {running ? 'Scanning…' : 'Run YARA Scan'}
          </button>
        </div>
      )}

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {loadingResults ? (
        <div className="state-box" style={{ padding: '12px 0', marginTop: 8 }}>Loading results…</div>
      ) : results.length > 0 ? (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {results.map(r => (
            <TriageResultCard key={r.id} result={r} />
          ))}
        </div>
      ) : (
        <div className="state-box" style={{ marginTop: 12 }}>
          No triage results yet. Select a file and click <strong>Run YARA Scan</strong>.
        </div>
      )}
    </div>
  )
}

function TriageResultCard({ result }: { result: MalwareTriageResult }) {
  const [showStrings, setShowStrings] = useState(false)
  const riskColor = RISK_COLOR(result.risk_score)
  const riskLabel = RISK_LABEL(result.risk_score)

  const suspCount =
    result.suspicious_strings.powershell.length +
    result.suspicious_strings.lolbas.length +
    result.suspicious_strings.base64.length +
    result.suspicious_strings.urls.length +
    result.suspicious_strings.ips.length

  return (
    <div className="yara-result-card">
      {/* Header row */}
      <div className="yara-result-header">
        <div>
          <span className="yara-filename">{result.original_filename}</span>
          {result.file_type && (
            <span className="yara-filetype">{result.file_type}</span>
          )}
        </div>
        <div className="yara-risk-badge" style={{ color: riskColor }}>
          <span className="yara-risk-score">{result.risk_score}</span>
          <span className="yara-risk-label">{riskLabel}</span>
        </div>
      </div>

      {/* Hashes */}
      <div className="yara-hashes">
        {result.sha256 && <HashRow label="SHA-256" value={result.sha256} />}
        {result.sha1   && <HashRow label="SHA-1"   value={result.sha1} />}
        {result.md5    && <HashRow label="MD5"     value={result.md5} />}
        {result.file_size !== null && (
          <div className="yara-hash-row">
            <span className="yara-hash-label">Size</span>
            <span className="yara-hash-value" style={{ fontFamily: 'inherit', color: 'var(--text-muted)' }}>
              {formatSize(result.file_size)}
            </span>
          </div>
        )}
      </div>

      {/* YARA matches */}
      {result.yara_matches.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div className="analysis-section-label">
            YARA Matches ({result.yara_matches.length})
          </div>
          <div className="yara-matches-list">
            {result.yara_matches.map((m, i) => (
              <div key={i} className="yara-match-item">
                <div className="yara-match-rule">{m.rule.replace(/_/g, ' ')}</div>
                {m.meta.description && (
                  <div className="yara-match-desc">{m.meta.description}</div>
                )}
                {m.strings_matched.length > 0 && (
                  <div className="yara-match-strings">
                    {m.strings_matched.map((s, j) => (
                      <code key={j} className="yara-match-string">{s}</code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suspicious strings */}
      {suspCount > 0 && (
        <div>
          <button
            className="yara-toggle-btn"
            onClick={() => setShowStrings(v => !v)}
          >
            {showStrings ? '▾' : '▸'} Suspicious strings ({suspCount})
          </button>
          {showStrings && (
            <div className="yara-susp-groups">
              <SuspGroup label="PowerShell" items={result.suspicious_strings.powershell} />
              <SuspGroup label="LOLBAS"     items={result.suspicious_strings.lolbas} />
              <SuspGroup label="Base64"     items={result.suspicious_strings.base64} />
              <SuspGroup label="URLs"       items={result.suspicious_strings.urls} />
              <SuspGroup label="IPs"        items={result.suspicious_strings.ips} />
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="yara-summary">{result.summary}</div>
    </div>
  )
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="yara-hash-row">
      <span className="yara-hash-label">{label}</span>
      <span className="yara-hash-value" title={value}>{value}</span>
    </div>
  )
}

function SuspGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="yara-susp-group">
      <div className="yara-susp-label">{label} ({items.length})</div>
      <div className="yara-susp-items">
        {items.slice(0, 10).map((s, i) => (
          <code key={i} className="yara-susp-item">{s}</code>
        ))}
        {items.length > 10 && (
          <span className="yara-susp-more">+{items.length - 10} more</span>
        )}
      </div>
    </div>
  )
}
