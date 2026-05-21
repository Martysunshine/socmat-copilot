export interface Report {
  id: number
  case_id: number
  report_path: string
  format: string
  generated_at: string
  summary: string | null
}

export async function generateReport(caseId: number): Promise<Report> {
  const res = await fetch(`/api/cases/${caseId}/report/generate`, { method: 'POST' })
  if (!res.ok) throw new Error(`Generate report failed: ${res.status}`)
  return res.json()
}

export async function getReport(caseId: number): Promise<Report | null> {
  const res = await fetch(`/api/cases/${caseId}/report`)
  if (!res.ok) throw new Error(`Get report failed: ${res.status}`)
  return res.json()
}

export async function getReportContent(caseId: number): Promise<string> {
  const res = await fetch(`/api/cases/${caseId}/report/content`)
  if (!res.ok) throw new Error(`Get report content failed: ${res.status}`)
  return res.text()
}

export async function listAllReports(): Promise<Report[]> {
  const res = await fetch('/api/reports')
  if (!res.ok) throw new Error(`List reports failed: ${res.status}`)
  return res.json()
}
