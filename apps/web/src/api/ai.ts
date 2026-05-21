export interface AIAnalysis {
  provider: string
  mode: string
  case_id: number
  generated_at: string
  summary: string
  key_evidence: string[]
  likely_incident_type: string
  confidence: string
  recommended_next_steps: string[]
  missing_evidence: string[]
  disclaimer: string
}

export async function aiSummarize(caseId: number): Promise<AIAnalysis> {
  const res = await fetch(`/api/cases/${caseId}/ai/summarize`, { method: 'POST' })
  if (!res.ok) throw new Error(`AI summarize failed: ${res.status}`)
  return res.json()
}

export async function aiRecommend(caseId: number): Promise<AIAnalysis> {
  const res = await fetch(`/api/cases/${caseId}/ai/recommend`, { method: 'POST' })
  if (!res.ok) throw new Error(`AI recommend failed: ${res.status}`)
  return res.json()
}
