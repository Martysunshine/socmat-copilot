export interface ElasticLiveStatus {
  configured: boolean
  connected: boolean
  cluster_info: {
    cluster_name: string
    status: string
    number_of_nodes: number
    active_shards: number
  } | null
  error: string | null
  warning: string
}

export interface ElasticLiveQuery {
  id: number
  case_id: number | null
  esql_query: string
  template_id: string | null
  index_pattern: string | null
  max_results: number
  result_count: number
  result_sample: string | null
  status: string
  error_message: string | null
  elastic_host: string | null
  executed_at: string
  warning: string
}

export interface ElasticLiveSearchRequest {
  esql_query: string
  case_id?: number
  index_pattern?: string
  max_results?: number
}

export interface ElasticLiveTemplateRunRequest {
  case_id?: number
  max_results?: number
}

export async function getElasticLiveStatus(): Promise<ElasticLiveStatus> {
  const res = await fetch('/api/elastic/live/status')
  if (!res.ok) throw new Error(`Status check failed: ${res.status}`)
  return res.json()
}

export async function runElasticLiveSearch(
  req: ElasticLiveSearchRequest,
): Promise<ElasticLiveQuery> {
  const res = await fetch('/api/elastic/live/search', {
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

export async function runElasticLiveTemplate(
  templateId: string,
  req: ElasticLiveTemplateRunRequest = {},
): Promise<ElasticLiveQuery> {
  const res = await fetch(`/api/elastic/live/templates/${templateId}/run`, {
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

export async function getElasticLiveQueries(caseId?: number): Promise<ElasticLiveQuery[]> {
  const url = caseId
    ? `/api/elastic/live/queries?case_id=${caseId}`
    : '/api/elastic/live/queries'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch query history: ${res.status}`)
  return res.json()
}
