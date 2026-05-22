export interface PcapFinding {
  category: string
  severity: string
  description: string
  host: string | null
  details: string | null
}

export interface PcapTopTalker {
  host: string
  packets: number
  bytes_sent: number
  destinations: number
}

export interface PcapDnsQuery {
  src_ip: string
  query: string
  query_type: string
}

export interface PcapHttpRequest {
  src_ip: string
  dst_ip: string
  method: string
  host: string
  uri: string
  user_agent: string
}

export interface PcapTlsHost {
  host: string
  dst_ip: string
}

export interface PcapAnalysisResult {
  id: number
  case_id: number
  evidence_id: number
  original_filename: string
  total_packets: number
  total_bytes: number
  duration_seconds: number
  start_time: string | null
  protocol_counts: Record<string, number>
  top_talkers: PcapTopTalker[]
  dns_queries: PcapDnsQuery[]
  http_requests: PcapHttpRequest[]
  tls_hosts: PcapTlsHost[]
  findings: PcapFinding[]
  risk_score: number
  summary: string
  created_at: string
}

export async function runPcapAnalysis(
  caseId: number,
  evidenceId: number,
): Promise<PcapAnalysisResult> {
  const res = await fetch(`/api/cases/${caseId}/analyze/pcap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidence_id: evidenceId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'PCAP analysis failed')
  }
  return res.json()
}

export async function getPcapResults(caseId: number): Promise<PcapAnalysisResult[]> {
  const res = await fetch(`/api/cases/${caseId}/analyze/pcap`)
  if (!res.ok) throw new Error(`Failed to load PCAP results: ${res.status}`)
  return res.json()
}
