const API = '/api'

export interface ReadinessCheck {
  id: string
  section: string
  name: string
  description: string
  status: 'pass' | 'fail' | 'na'
  weight: number
  optional: boolean
}

export interface SectionScore {
  name: string
  score: number
  achieved: number
  max_score: number
}

export interface ReadinessResult {
  case_id: number
  total_score: number
  grade: 'poor' | 'fair' | 'good' | 'excellent'
  completed_checks: ReadinessCheck[]
  missing_checks: ReadinessCheck[]
  na_checks: ReadinessCheck[]
  warnings: string[]
  recommendations: string[]
  section_scores: Record<string, SectionScore>
  checked_at: string
}

export async function getReadiness(caseId: number): Promise<ReadinessResult> {
  const res = await fetch(`${API}/cases/${caseId}/report/readiness`)
  if (!res.ok) throw new Error(`Readiness check failed: ${res.status}`)
  return res.json()
}
