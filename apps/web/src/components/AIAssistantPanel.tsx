import { useState } from 'react'
import { aiSummarize, aiRecommend, type AIAnalysis } from '../api/ai'

interface Props {
  caseId: number
}

type Mode = 'summarize' | 'recommend'

const CONFIDENCE_LABEL: Record<string, string> = {
  insufficient: 'Insufficient data',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

const CONFIDENCE_CLASS: Record<string, string> = {
  insufficient: 'ai-confidence ai-confidence--insufficient',
  low: 'ai-confidence ai-confidence--low',
  medium: 'ai-confidence ai-confidence--medium',
  high: 'ai-confidence ai-confidence--high',
}

export default function AIAssistantPanel({ caseId }: Props) {
  const [result, setResult] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeMode, setActiveMode] = useState<Mode | null>(null)

  async function run(mode: Mode) {
    setLoading(true)
    setError(null)
    setActiveMode(mode)
    try {
      const data = mode === 'summarize'
        ? await aiSummarize(caseId)
        : await aiRecommend(caseId)
      setResult(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'AI analysis failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <div className="panel-section-title" style={{ marginBottom: 0 }}>AI Investigation Assistant</div>
        <span className="ai-provider-badge">
          {result ? result.provider : 'mock'}
        </span>
      </div>

      <div className="ai-actions">
        <button
          className={`btn btn-secondary${activeMode === 'summarize' && result ? ' btn-secondary--active' : ''}`}
          onClick={() => run('summarize')}
          disabled={loading}
        >
          {loading && activeMode === 'summarize' ? 'Analyzing…' : 'Summarize Case'}
        </button>
        <button
          className={`btn btn-secondary${activeMode === 'recommend' && result ? ' btn-secondary--active' : ''}`}
          onClick={() => run('recommend')}
          disabled={loading}
        >
          {loading && activeMode === 'recommend' ? 'Analyzing…' : 'Recommend Next Steps'}
        </button>
        <button
          className={`btn btn-secondary${activeMode === 'recommend' && result ? ' btn-secondary--active' : ''}`}
          onClick={() => run('recommend')}
          disabled={loading}
          title="Uses the Recommend endpoint to identify evidence gaps"
        >
          {loading && activeMode === 'recommend' ? 'Analyzing…' : 'Identify Missing Evidence'}
        </button>
      </div>

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {!result && !loading && !error && (
        <div className="state-box" style={{ marginTop: 12 }}>
          Select an analysis mode above. The AI assistant uses only stored case data — it does not connect to external systems or invent evidence.
        </div>
      )}

      {result && (
        <div className="ai-result">
          <div className="ai-result-header">
            <span className={CONFIDENCE_CLASS[result.confidence] ?? 'ai-confidence'}>
              Confidence: {CONFIDENCE_LABEL[result.confidence] ?? result.confidence}
            </span>
            <span className="ai-incident-type">{result.likely_incident_type}</span>
          </div>

          <div className="ai-section">
            <div className="ai-section-label">Summary</div>
            <p className="ai-summary">{result.summary}</p>
          </div>

          {result.key_evidence.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-label">Key Evidence</div>
              <ul className="ai-list">
                {result.key_evidence.map((ev, i) => (
                  <li key={i}>{ev}</li>
                ))}
              </ul>
            </div>
          )}

          {result.recommended_next_steps.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-label">Recommended Next Steps</div>
              <ol className="ai-list">
                {result.recommended_next_steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {result.missing_evidence.length > 0 && (
            <div className="ai-section">
              <div className="ai-section-label">Missing Evidence / Gaps</div>
              <ul className="ai-list ai-list--gap">
                {result.missing_evidence.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="ai-disclaimer">{result.disclaimer}</div>
        </div>
      )}
    </div>
  )
}
