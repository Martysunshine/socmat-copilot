const API = '/api'

export const DISPOSITIONS = [
  'needs_review',
  'true_positive',
  'false_positive',
  'benign',
  'suspicious',
  'escalated',
  'duplicate',
  'insufficient_data',
] as const

export type DispositionValue = typeof DISPOSITIONS[number]

export const DISPOSITION_LABELS: Record<DispositionValue, string> = {
  needs_review: 'Needs Review',
  true_positive: 'True Positive',
  false_positive: 'False Positive',
  benign: 'Benign',
  suspicious: 'Suspicious',
  escalated: 'Escalated',
  duplicate: 'Duplicate',
  insufficient_data: 'Insufficient Data',
}

export const FINDING_TYPES = [
  'sigma', 'yara', 'suricata', 'zeek', 'splunk',
  'elastic', 'pcap', 'correlation', 'mitre', 'timeline',
] as const

export type FindingType = typeof FINDING_TYPES[number]

export interface FindingDisposition {
  id: number
  case_id: number
  finding_type: string
  finding_id: string
  disposition: DispositionValue
  confidence: 'low' | 'medium' | 'high'
  reason: string | null
  analyst_name: string | null
  follow_up_action: string | null
  created_at: string
  updated_at: string
}

export interface DispositionSummary {
  total: number
  true_positive: number
  false_positive: number
  benign: number
  suspicious: number
  needs_review: number
  escalated: number
  duplicate: number
  insufficient_data: number
}

export interface CaseDispositionsResponse {
  case_id: number
  dispositions: FindingDisposition[]
  summary: DispositionSummary
}

export interface CreateDispositionRequest {
  finding_type: string
  finding_id: string
  disposition?: DispositionValue
  confidence?: 'low' | 'medium' | 'high'
  reason?: string
  analyst_name?: string
  follow_up_action?: string
}

export interface UpdateDispositionRequest {
  disposition?: DispositionValue
  confidence?: 'low' | 'medium' | 'high'
  reason?: string
  analyst_name?: string
  follow_up_action?: string
}

export async function getCaseDispositions(
  caseId: number,
  filters?: { finding_type?: string; finding_id?: string; disposition?: string },
): Promise<CaseDispositionsResponse> {
  const params = new URLSearchParams()
  if (filters?.finding_type) params.set('finding_type', filters.finding_type)
  if (filters?.finding_id) params.set('finding_id', filters.finding_id)
  if (filters?.disposition) params.set('disposition', filters.disposition)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await fetch(`${API}/cases/${caseId}/dispositions${qs}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function createDisposition(
  caseId: number,
  data: CreateDispositionRequest,
): Promise<FindingDisposition> {
  const res = await fetch(`${API}/cases/${caseId}/dispositions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function updateDisposition(
  caseId: number,
  dispositionId: number,
  data: UpdateDispositionRequest,
): Promise<FindingDisposition> {
  const res = await fetch(`${API}/cases/${caseId}/dispositions/${dispositionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function deleteDisposition(caseId: number, dispositionId: number): Promise<void> {
  const res = await fetch(`${API}/cases/${caseId}/dispositions/${dispositionId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(await res.text())
}
