export interface RuleAuthorRequest {
  description: string
  event_type?: string
  example_fields?: Record<string, string>
}

export interface RuleDraftResponse {
  event_type_detected: string
  event_type_label: string
  keyword_extracted: string
  sigma_yaml: string
  spl_query: string
  kql_query: string
  esql_query: string
  false_positives: string[]
  log_source_notes: string[]
  validation_warnings: string[]
  quality_disclaimer: string
}

export interface EventTypeOption {
  value: string
  label: string
}

export async function authorRules(data: RuleAuthorRequest): Promise<RuleDraftResponse> {
  const res = await fetch('/api/rules/author', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Rule generation failed')
  }
  return res.json()
}

export async function getEventTypes(): Promise<EventTypeOption[]> {
  const res = await fetch('/api/rules/author/event-types')
  if (!res.ok) throw new Error(`Failed to load event types: ${res.status}`)
  return res.json()
}
