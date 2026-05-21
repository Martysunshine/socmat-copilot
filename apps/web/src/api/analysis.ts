export interface SuspiciousFinding {
  event_id: string
  severity: string
  description: string
  host: string | null
  user: string | null
  count: number
}

export interface WindowsAnalysisResult {
  evidence_id: number
  total_events: number
  events_by_id: Record<string, number>
  suspicious_findings: SuspiciousFinding[]
  timeline_events_added: number
  normalized_events_saved: number
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export async function runWindowsAnalysis(
  caseId: number,
  evidenceId: number,
): Promise<WindowsAnalysisResult> {
  const res = await fetch(
    `/api/cases/${caseId}/analyze/windows-logs?evidence_id=${evidenceId}`,
    { method: 'POST' },
  )
  return handleResponse<WindowsAnalysisResult>(res)
}
