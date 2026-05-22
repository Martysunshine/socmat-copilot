const API = '/api'

export interface GraphNode {
  id: string
  type: string
  label: string
  description: string | null
  severity: string
  confidence: string
  source_ids: number[]
  properties: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: string
  label: string
  confidence: string
  evidence_reference: string | null
  properties: Record<string, unknown>
}

export interface GraphMetadata {
  total_nodes: number
  total_edges: number
  node_type_counts: Record<string, number>
  case_id: number
  filters_applied: Record<string, boolean>
}

export interface GraphResponse {
  nodes: GraphNode[]
  edges: GraphEdge[]
  metadata: GraphMetadata
}

export interface GraphFilters {
  show_hosts?: boolean
  show_users?: boolean
  show_ips?: boolean
  show_domains?: boolean
  show_processes?: boolean
  show_detections?: boolean
  show_mitre?: boolean
  show_iocs?: boolean
  show_evidence?: boolean
  only_suspicious?: boolean
}

export async function getCaseGraph(caseId: number, filters: GraphFilters = {}): Promise<GraphResponse> {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined) params.set(k, String(v))
  }
  const qs = params.toString()
  const res = await fetch(`${API}/cases/${caseId}/graph${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Graph fetch failed: ${res.status}`)
  return res.json()
}

export function exportGraphJson(graphData: GraphResponse): void {
  const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `case_${graphData.metadata.case_id}_graph.json`
  a.click()
  URL.revokeObjectURL(url)
}
