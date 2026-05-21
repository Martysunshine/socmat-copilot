import { useEffect, useState } from 'react'
import { runMitreMapping, getMitreMappings, type MitreMapping, type EvidenceRef } from '../api/mitre'

const CONF_COLOR: Record<string, string> = {
  high:   'var(--green)',
  medium: 'var(--yellow)',
  low:    'var(--text-muted)',
}

const SOURCE_LABEL: Record<string, string> = {
  windows_event: 'Windows Event',
  sigma_rule:    'Sigma Rule',
  yara:          'YARA',
  zeek:          'Zeek',
  suricata:      'Suricata',
  correlation:   'Correlation',
}

function groupByTactic(mappings: MitreMapping[]): [string, MitreMapping[]][] {
  const map = new Map<string, MitreMapping[]>()
  for (const m of mappings) {
    const group = map.get(m.tactic) ?? []
    group.push(m)
    map.set(m.tactic, group)
  }
  return Array.from(map.entries())
}

interface Props {
  caseId: number
  onAnalysisComplete: () => void
}

export default function MitrePanel({ caseId, onAnalysisComplete }: Props) {
  const [running, setRunning] = useState(false)
  const [mappings, setMappings] = useState<MitreMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMitreMappings(caseId)
      .then(setMappings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  async function handleRun() {
    setRunning(true)
    setError(null)
    try {
      const result = await runMitreMapping(caseId)
      setMappings(result)
      onAnalysisComplete()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'MITRE mapping failed')
    } finally {
      setRunning(false)
    }
  }

  const tacticGroups = groupByTactic(mappings)

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <div className="panel-section-title" style={{ marginBottom: 0 }}>MITRE ATT&amp;CK Mapping</div>
        <button
          className="btn btn-primary"
          onClick={handleRun}
          disabled={running}
        >
          {running ? 'Mapping…' : 'Run ATT&CK Mapping'}
        </button>
      </div>

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="state-box" style={{ padding: '12px 0', marginTop: 8 }}>Loading mappings…</div>
      ) : mappings.length > 0 ? (
        <>
          <div className="mitre-summary">
            <span>{mappings.length} technique{mappings.length !== 1 ? 's' : ''} mapped</span>
            <span className="mitre-summary-sep">·</span>
            <span>{tacticGroups.length} tactic{tacticGroups.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="mitre-groups">
            {tacticGroups.map(([tactic, items]) => (
              <TacticGroup key={tactic} tactic={tactic} items={items} />
            ))}
          </div>
        </>
      ) : (
        <div className="state-box" style={{ marginTop: 12 }}>
          No ATT&amp;CK mappings yet. Click <strong>Run ATT&amp;CK Mapping</strong> to map case findings
          to MITRE ATT&amp;CK tactics and techniques based on stored evidence.
        </div>
      )}
    </div>
  )
}

function TacticGroup({ tactic, items }: { tactic: string; items: MitreMapping[] }) {
  return (
    <div className="mitre-tactic-group">
      <div className="mitre-tactic-header">{tactic}</div>
      <div className="mitre-techniques">
        {items.map(m => <TechniqueCard key={m.id} mapping={m} />)}
      </div>
    </div>
  )
}

function TechniqueCard({ mapping }: { mapping: MitreMapping }) {
  const [expanded, setExpanded] = useState(false)
  const confColor = CONF_COLOR[mapping.confidence] ?? 'var(--text-muted)'

  return (
    <div className="mitre-technique">
      <div className="mitre-technique-header">
        <span className="mitre-technique-id">{mapping.technique_id}</span>
        <span className="mitre-technique-name">{mapping.technique_name}</span>
        <span
          className="mitre-conf-badge"
          style={{ color: confColor, borderColor: confColor }}
        >
          {mapping.confidence.toUpperCase()} CONF
        </span>
      </div>

      {mapping.evidence_reference.length > 0 && (
        <div className="mitre-evidence">
          <button
            className="mitre-evidence-toggle"
            onClick={() => setExpanded(e => !e)}
          >
            {mapping.evidence_reference.length} evidence ref{mapping.evidence_reference.length !== 1 ? 's' : ''}
            {' '}{expanded ? '▲' : '▼'}
          </button>
          {expanded && (
            <ul className="mitre-evidence-list">
              {mapping.evidence_reference.map((ref, i) => (
                <EvidenceRefRow key={i} ref_={ref} />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function EvidenceRefRow({ ref_ }: { ref_: EvidenceRef }) {
  return (
    <li className="mitre-evidence-item">
      <span className="mitre-evidence-source">
        {SOURCE_LABEL[ref_.source] ?? ref_.source}
      </span>
      <span className="mitre-evidence-detail">{ref_.detail}</span>
    </li>
  )
}
