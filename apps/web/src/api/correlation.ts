const BASE = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
  return res.json() as Promise<T>
}

export interface CorrelationEntity {
  type: string
  value: string
}

export interface CorrelatedFinding {
  id: number
  case_id: number
  title: string
  severity: string
  confidence: string
  entities: CorrelationEntity[]
  related_event_ids: number[]
  related_finding_ids: number[]
  summary: string
  recommended_action: string
  created_at: string
}

export async function runCorrelation(caseId: number): Promise<CorrelatedFinding[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/correlate`, { method: 'POST' })
  return handleResponse<CorrelatedFinding[]>(res)
}

export async function getCorrelatedFindings(caseId: number): Promise<CorrelatedFinding[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/correlate`)
  return handleResponse<CorrelatedFinding[]>(res)
}
