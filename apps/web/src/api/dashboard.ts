export interface RecentCase {
  id: number
  title: string
  severity: string
  status: string
  created_at: string
}

export interface RecentTimelineEvent {
  id: number
  case_id: number
  event_type: string
  description: string
  severity: string
  timestamp: string
  source: string
}

export interface DashboardSummary {
  total_cases: number
  open_cases: number
  investigating_cases: number
  critical_cases: number
  high_cases: number
  total_evidence: number
  total_timeline_events: number
  total_reports: number
  recent_cases: RecentCase[]
  recent_timeline: RecentTimelineEvent[]
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch('/api/dashboard/summary')
  if (!res.ok) throw new Error(`Dashboard summary failed: ${res.status}`)
  return res.json()
}
