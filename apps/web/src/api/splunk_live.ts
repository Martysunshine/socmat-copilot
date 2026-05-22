export interface SplunkLiveStatus {
  configured: boolean
  connected: boolean
  server_info: {
    version: string
    product_name: string
    server_name: string
    os: string
  } | null
  error: string | null
  warning: string
}

export interface SplunkLiveQuery {
  id: number
  case_id: number | null
  spl_query: string
  template_id: string | null
  earliest_time: string | null
  latest_time: string | null
  result_count: number
  result_sample: string | null
  status: string
  error_message: string | null
  splunk_host: string | null
  executed_at: string
  warning: string
}

export interface SplunkLiveSearchRequest {
  spl_query: string
  case_id?: number
  earliest_time?: string
  latest_time?: string
  max_results?: number
}

export interface SplunkLiveTemplateRunRequest {
  case_id?: number
  earliest_time?: string
  latest_time?: string
  max_results?: number
}

export async function getSplunkLiveStatus(): Promise<SplunkLiveStatus> {
  const res = await fetch('/api/splunk/live/status')
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return res.json()
}

export async function runSplunkLiveSearch(
  req: SplunkLiveSearchRequest,
): Promise<SplunkLiveQuery> {
  const res = await fetch('/api/splunk/live/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Live search failed')
  }
  return res.json()
}

export async function runSplunkLiveTemplate(
  templateId: string,
  req: SplunkLiveTemplateRunRequest = {},
): Promise<SplunkLiveQuery> {
  const res = await fetch(`/api/splunk/live/templates/${templateId}/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Template run failed')
  }
  return res.json()
}

export async function getSplunkLiveQueries(caseId?: number): Promise<SplunkLiveQuery[]> {
  const url = caseId
    ? `/api/splunk/live/queries?case_id=${caseId}`
    : '/api/splunk/live/queries'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch query history: ${res.status}`)
  return res.json()
}
