import { useState } from 'react'
import { analyzeElasticExport, type ElasticAnalysisResult } from '../api/elastic'
import { type Evidence } from '../api/evidence'

const ELASTIC_EXTENSIONS = new Set(['csv', 'json', 'ndjson', 'jsonl'])

function isElasticFile(ev: Evidence): boolean {
  const ext = ev.original_filename.split('.').pop()?.toLowerCase() ?? ''
  const name = ev.original_filename.toLowerCase()
  return (
    ELASTIC_EXTENSIONS.has(ext) ||
    name.includes('elastic') ||
    name.includes('kibana') ||
    name.includes('export') ||
    name.includes('search_results')
  )
}

interface Props {
  caseId: number
  evidence: Evidence[]
  onAnalysisComplete: () => void
}

export default function ElasticPanel({ caseId, evidence, onAnalysisComplete }: Props) {
  const [selectedId, setSelectedId] = useState<number | ''>('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<ElasticAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eligibleFiles = evidence.filter(isElasticFile)

  async function handleRun() {
    if (!selectedId) return
    setRunning(true)
    setError(null)
    setResult(null)
    try {
      const r = await analyzeElasticExport(caseId, Number(selectedId))
      setResult(r)
      onAnalysisComplete()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-title">Elastic Export Analysis</div>

      {eligibleFiles.length === 0 ? (
        <div className="state-box">
          <p>
            No eligible evidence files. Upload a Kibana CSV or JSON export first.
            Export from Kibana via <strong>Discover → Save → Export</strong> or use the
            Elasticsearch <code>_search</code> API and save the response as JSON.
          </p>
        </div>
      ) : (
        <div className="analysis-run-row">
          <select
            className="inline-select"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">Select evidence file…</option>
            {eligibleFiles.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.original_filename}</option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={!selectedId || running}
          >
            {running ? 'Analysing…' : 'Analyze Elastic Export'}
          </button>
        </div>
      )}

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {result && (
        <div className="analysis-result">
          <div className="analysis-summary-row">
            <div className="analysis-stat">
              <div className="stat-label">Total Events</div>
              <div className="stat-value">{result.total_events}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Event Categories</div>
              <div className="stat-value">{result.event_categories.length}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Events Saved</div>
              <div className="stat-value stat-value--accent">{result.normalized_events_saved}</div>
            </div>
            <div className="analysis-stat">
              <div className="stat-label">Timeline Events Added</div>
              <div className="stat-value stat-value--accent">{result.timeline_events_added}</div>
            </div>
          </div>

          {result.event_categories.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div className="analysis-section-label">Event Categories</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.event_categories.map(cat => (
                  <span key={cat} className="mcp-tag mcp-tag--category-analysis">{cat}</span>
                ))}
              </div>
            </div>
          )}

          {result.top_hosts.length > 0 && (
            <div>
              <div className="analysis-section-label">Top Hosts</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.top_hosts.map(h => (
                  <span key={h} className="mcp-tag mcp-tag--caseid">{h}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
