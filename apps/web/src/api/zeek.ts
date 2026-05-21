const BASE = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
  return res.json() as Promise<T>
}

export interface ZeekFinding {
  category: string
  severity: string
  description: string
  host: string | null
  count: number | null
  details: string | null
}

export interface TopTalker {
  host: string
  connection_count: number
  total_bytes: number
  destinations: number
}

export interface DnsSummary {
  total_queries: number
  unique_domains: number
  top_queried: string[]
  suspicious_domains: string[]
}

export interface HttpSummary {
  total_requests: number
  unique_hosts: number
  top_hosts: string[]
  suspicious_agents: string[]
}

export interface NetworkAnalysisResult {
  id: number
  case_id: number
  evidence_id: number
  original_filename: string
  log_type: string
  total_records: number
  findings: ZeekFinding[]
  top_talkers: TopTalker[]
  dns_summary: DnsSummary | null
  http_summary: HttpSummary | null
  risk_score: number
  summary: string
  created_at: string
}

export async function runZeekAnalysis(caseId: number, evidenceId: number): Promise<NetworkAnalysisResult> {
  const res = await fetch(`${BASE}/cases/${caseId}/analyze/zeek`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidence_id: evidenceId }),
  })
  return handleResponse<NetworkAnalysisResult>(res)
}

export async function getZeekResults(caseId: number): Promise<NetworkAnalysisResult[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/analyze/zeek`)
  return handleResponse<NetworkAnalysisResult[]>(res)
}
