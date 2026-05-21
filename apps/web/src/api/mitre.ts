const BASE = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
  return res.json() as Promise<T>
}

export interface EvidenceRef {
  source: string
  detail: string
}

export interface MitreMapping {
  id: number
  case_id: number
  tactic: string
  technique_id: string
  technique_name: string
  evidence_reference: EvidenceRef[]
  confidence: string
  created_at: string
}

export interface MitreTechniqueInfo {
  technique_id: string
  technique_name: string
  tactic: string
  description: string
}

export async function runMitreMapping(caseId: number): Promise<MitreMapping[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/mitre/map`, { method: 'POST' })
  return handleResponse<MitreMapping[]>(res)
}

export async function getMitreMappings(caseId: number): Promise<MitreMapping[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/mitre/map`)
  return handleResponse<MitreMapping[]>(res)
}

export async function getMitreCatalog(): Promise<MitreTechniqueInfo[]> {
  const res = await fetch(`${BASE}/mitre/mappings`)
  return handleResponse<MitreTechniqueInfo[]>(res)
}
