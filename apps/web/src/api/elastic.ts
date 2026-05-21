export interface ElasticEvent {
  id: number
  case_id: number
  evidence_id: number | null
  event_time: string | null
  host_name: string | null
  user_name: string | null
  src_ip: string | null
  dest_ip: string | null
  process_name: string | null
  parent_process_name: string | null
  command_line: string | null
  event_code: string | null
  event_category: string | null
  event_action: string | null
  file_hash_sha256: string | null
  dns_question: string | null
  analyzed_at: string
}

export interface ElasticAnalysisResult {
  evidence_id: number
  total_events: number
  event_categories: string[]
  top_hosts: string[]
  timeline_events_added: number
  normalized_events_saved: number
}

export interface HuntTemplate {
  id: string
  title: string
  description: string
  kql_query: string
  esql_query: string
  index_pattern: string
  detects: string
  required_ecs_fields: string[]
  false_positives: string[]
  recommended_pivots: string[]
}

export interface HuntAssistantResult extends HuntTemplate {
  matched_by: string
}

export async function analyzeElasticExport(
  caseId: number,
  evidenceId: number,
): Promise<ElasticAnalysisResult> {
  const res = await fetch(
    `/api/cases/${caseId}/analyze/elastic-export?evidence_id=${evidenceId}`,
    { method: 'POST' },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Elastic analysis failed')
  }
  return res.json()
}

export async function getElasticEvents(caseId: number): Promise<ElasticEvent[]> {
  const res = await fetch(`/api/cases/${caseId}/analyze/elastic-export`)
  if (!res.ok) throw new Error(`Failed to fetch Elastic events: ${res.status}`)
  return res.json()
}

export async function getHuntTemplates(): Promise<HuntTemplate[]> {
  const res = await fetch('/api/elastic/hunt-templates')
  if (!res.ok) throw new Error(`Failed to fetch hunt templates: ${res.status}`)
  return res.json()
}

export async function runHuntAssistant(
  intent: string,
  caseId?: number,
): Promise<HuntAssistantResult> {
  const res = await fetch('/api/elastic/hunt-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, case_id: caseId ?? null }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Hunt assistant failed')
  }
  return res.json()
}
