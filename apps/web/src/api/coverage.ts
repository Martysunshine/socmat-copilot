const BASE = '/api'

export interface RuleCoverage {
  rule_id: string
  rule_title: string
  rule_type: string
  required_logsource: string
  required_fields: string[]
  mapped_mitre_techniques: string[]
  severity: string
  triggered_in_case: boolean
  blocked_by_missing_data: boolean
  missing_fields: string[]
}

export interface TelemetryGap {
  missing_log_source: string
  why_it_matters: string
  affected_detection_rules: string[]
  related_mitre_techniques: string[]
  recommendation: string
}

export interface CaseCoverageResponse {
  case_id: number
  rules_triggered: RuleCoverage[]
  rules_not_triggered: RuleCoverage[]
  rules_blocked: RuleCoverage[]
  available_log_sources: string[]
  missing_log_sources: string[]
  mitre_covered_techniques: number
  mitre_total_techniques: number
  coverage_percent: number
}

export interface RuleCoverageListResponse {
  rules: RuleCoverage[]
  total_count: number
}

export interface TelemetryGapListResponse {
  case_id: number
  gaps: TelemetryGap[]
  available_log_sources: string[]
  gap_count: number
}

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function getRuleCoverage(filters: {
  rule_type?: string
  severity?: string
  logsource?: string
  tactic?: string
} = {}): Promise<RuleCoverageListResponse> {
  const params = new URLSearchParams()
  if (filters.rule_type) params.set('rule_type', filters.rule_type)
  if (filters.severity) params.set('severity', filters.severity)
  if (filters.logsource) params.set('logsource', filters.logsource)
  if (filters.tactic) params.set('tactic', filters.tactic)
  const qs = params.toString()
  return apiFetch(`/coverage/rules${qs ? `?${qs}` : ''}`)
}

export async function getCaseCoverage(caseId: number): Promise<CaseCoverageResponse> {
  return apiFetch(`/cases/${caseId}/coverage`)
}

export async function getCaseTelemetryGaps(caseId: number): Promise<TelemetryGapListResponse> {
  return apiFetch(`/cases/${caseId}/telemetry-gaps`)
}
