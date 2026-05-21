const BASE = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
  return res.json() as Promise<T>
}

export interface RuleExplanation {
  summary: string
  log_source: string
  detection_fields: string[]
  mitre_tactics: string[]
  mitre_techniques: string[]
  false_positives: string[]
  investigation_steps: string[]
}

export interface SigmaRule {
  id: string
  title: string
  status: string
  description: string
  author: string
  date: string
  modified: string
  level: string
  tags: string[]
  logsource: Record<string, string>
  detection: Record<string, unknown>
  falsepositives: string[]
  references: string[]
  explanation?: RuleExplanation
}

export interface CaseAttachedRule {
  id: number
  case_id: number
  rule_sigma_id: string
  rule_title: string
  rule_level: string
  attached_at: string
}

export async function getSigmaRules(params?: {
  level?: string
  logsource_product?: string
  logsource_category?: string
  tag?: string
}): Promise<SigmaRule[]> {
  const qs = new URLSearchParams()
  if (params?.level) qs.set('level', params.level)
  if (params?.logsource_product) qs.set('logsource_product', params.logsource_product)
  if (params?.logsource_category) qs.set('logsource_category', params.logsource_category)
  if (params?.tag) qs.set('tag', params.tag)
  const res = await fetch(`${BASE}/sigma/rules${qs.toString() ? '?' + qs : ''}`)
  return handleResponse<SigmaRule[]>(res)
}

export async function getSigmaRule(ruleId: string): Promise<SigmaRule> {
  const res = await fetch(`${BASE}/sigma/rules/${encodeURIComponent(ruleId)}`)
  return handleResponse<SigmaRule>(res)
}

export async function reloadSigmaRules(): Promise<{ loaded: number }> {
  const res = await fetch(`${BASE}/sigma/rules/reload`, { method: 'POST' })
  return handleResponse<{ loaded: number }>(res)
}

export async function attachRuleToCase(
  caseId: number,
  rule: { rule_sigma_id: string; rule_title: string; rule_level: string },
): Promise<CaseAttachedRule> {
  const res = await fetch(`${BASE}/cases/${caseId}/sigma/rules`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rule),
  })
  return handleResponse<CaseAttachedRule>(res)
}

export async function getCaseAttachedRules(caseId: number): Promise<CaseAttachedRule[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/sigma/rules`)
  return handleResponse<CaseAttachedRule[]>(res)
}

export async function detachRuleFromCase(caseId: number, ruleSigmaId: string): Promise<void> {
  const res = await fetch(
    `${BASE}/cases/${caseId}/sigma/rules/${encodeURIComponent(ruleSigmaId)}`,
    { method: 'DELETE' },
  )
  if (!res.ok && res.status !== 204) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
}

export interface DetectionFinding {
  id: number
  case_id: number
  rule_id: string
  rule_title: string
  severity: string
  matched_event_id: number
  match_reason: string
  event_id_str: string | null
  event_timestamp: string | null
  created_at: string
}

export interface SigmaRunResult {
  rules_run: number
  events_scanned: number
  findings_created: number
  findings: DetectionFinding[]
}

export async function runSigmaRules(caseId: number, ruleId?: string): Promise<SigmaRunResult> {
  const qs = ruleId ? `?rule_id=${encodeURIComponent(ruleId)}` : ''
  const res = await fetch(`${BASE}/cases/${caseId}/sigma/run${qs}`, { method: 'POST' })
  return handleResponse<SigmaRunResult>(res)
}

export async function getSigmaFindings(caseId: number): Promise<DetectionFinding[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/sigma/findings`)
  return handleResponse<DetectionFinding[]>(res)
}
