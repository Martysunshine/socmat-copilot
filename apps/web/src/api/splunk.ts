export interface SplunkEvent {
  id: number
  case_id: number
  evidence_id: number | null
  event_time: string | null
  index: string | null
  sourcetype: string | null
  host: string | null
  source: string | null
  user: string | null
  src_ip: string | null
  dest_ip: string | null
  process_name: string | null
  command_line: string | null
  event_code: string | null
  analyzed_at: string
}

export interface SplunkAnalysisResult {
  evidence_id: number
  total_events: number
  sourcetypes: string[]
  top_hosts: string[]
  timeline_events_added: number
  normalized_events_saved: number
}

export interface SPLTemplate {
  id: string
  title: string
  description: string
  spl_query: string
  index_sourcetype: string
  detects: string
  expected_fields: string[]
  false_positives: string[]
  investigation_steps: string[]
}

export interface SPLAssistantResult extends SPLTemplate {
  matched_by: string
}

export async function analyzeSplunkExport(
  caseId: number,
  evidenceId: number,
): Promise<SplunkAnalysisResult> {
  const res = await fetch(
    `/api/cases/${caseId}/analyze/splunk-export?evidence_id=${evidenceId}`,
    { method: 'POST' },
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Splunk analysis failed')
  }
  return res.json()
}

export async function getSplunkEvents(caseId: number): Promise<SplunkEvent[]> {
  const res = await fetch(`/api/cases/${caseId}/analyze/splunk-export`)
  if (!res.ok) throw new Error(`Failed to fetch Splunk events: ${res.status}`)
  return res.json()
}

export async function getSPLTemplates(): Promise<SPLTemplate[]> {
  const res = await fetch('/api/splunk/query-templates')
  if (!res.ok) throw new Error(`Failed to fetch SPL templates: ${res.status}`)
  return res.json()
}

export async function runQueryAssistant(
  intent: string,
  caseId?: number,
): Promise<SPLAssistantResult> {
  const res = await fetch('/api/splunk/query-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ intent, case_id: caseId ?? null }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Query assistant failed')
  }
  return res.json()
}
