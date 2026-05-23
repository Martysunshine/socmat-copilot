export interface ReplayEvent {
  id: number
  timestamp: string
  order: number
  title: string
  description: string
  source: string
  severity: string
  affected_entities: string[]
  related_evidence: { id: number; filename: string; file_type: string | null }[]
  related_findings: { rule_title: string; severity: string; match_reason: string | null }[]
  mitre_mappings: { technique_id: string; technique_name: string; tactic: string }[]
  analyst_notes: { body: string; note_type: string; author: string }[]
  explanation: string
  recommended_focus: string
}

export interface ReplayMetadata {
  case_id: number
  total_events: number
  sources: string[]
  severities: string[]
  date_range: { start: string | null; end: string | null }
}

export interface ReplayResponse {
  events: ReplayEvent[]
  metadata: ReplayMetadata
}

export async function getTimelineReplay(
  caseId: number,
  filters: { severity?: string; source?: string } = {},
): Promise<ReplayResponse> {
  const params = new URLSearchParams()
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.source) params.set('source', filters.source)
  const qs = params.toString()
  const res = await fetch(`/api/cases/${caseId}/timeline/replay${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error(`Replay fetch failed: ${res.status}`)
  return res.json()
}
