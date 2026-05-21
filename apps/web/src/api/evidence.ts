export interface Evidence {
  id: number
  case_id: number
  filename: string
  original_filename: string
  file_type: string | null
  file_size: number
  sha256: string
  uploaded_at: string
  notes: string | null
}

export interface TimelineEvent {
  id: number
  case_id: number
  timestamp: string
  source: string
  event_type: string
  description: string
  severity: string
  raw_reference: string | null
  created_at: string
}

export interface TimelineEventCreate {
  timestamp: string
  source: string
  event_type: string
  description: string
  severity: string
  raw_reference?: string
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function getEvidence(caseId: number): Promise<Evidence[]> {
  return fetch(`/api/cases/${caseId}/evidence`).then(handleResponse<Evidence[]>)
}

export async function uploadEvidence(caseId: number, file: File, notes: string): Promise<Evidence> {
  const form = new FormData()
  form.append('file', file)
  form.append('notes', notes)
  const res = await fetch(`/api/cases/${caseId}/evidence`, { method: 'POST', body: form })
  return handleResponse<Evidence>(res)
}

export function getTimeline(caseId: number): Promise<TimelineEvent[]> {
  return fetch(`/api/cases/${caseId}/timeline`).then(handleResponse<TimelineEvent[]>)
}

export async function createTimelineEvent(caseId: number, data: TimelineEventCreate): Promise<TimelineEvent> {
  const res = await fetch(`/api/cases/${caseId}/timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<TimelineEvent>(res)
}
