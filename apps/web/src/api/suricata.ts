const BASE = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
  return res.json() as Promise<T>
}

export interface TopEntry {
  value: string
  count: number
}

export interface SuricataFinding {
  severity: string
  description: string
  src_ip: string
  dest_ip: string
  signature: string
}

export interface SuricataAnalysisResult {
  evidence_id: number
  total_alerts: number
  unique_signatures: number
  top_src_ips: TopEntry[]
  top_dest_ips: TopEntry[]
  top_signatures: TopEntry[]
  suspicious_findings: SuricataFinding[]
  timeline_events_added: number
  normalized_events_saved: number
}

export async function runSuricataAnalysis(
  caseId: number,
  evidenceId: number,
): Promise<SuricataAnalysisResult> {
  const res = await fetch(
    `${BASE}/cases/${caseId}/analyze/suricata?evidence_id=${evidenceId}`,
    { method: 'POST' },
  )
  return handleResponse<SuricataAnalysisResult>(res)
}
