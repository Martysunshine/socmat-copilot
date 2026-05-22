export const ENTITY_TYPES = [
  { value: 'case', label: 'Case (general)' },
  { value: 'evidence', label: 'Evidence file' },
  { value: 'timeline_event', label: 'Timeline event' },
  { value: 'normalized_event', label: 'Normalized event' },
  { value: 'detection_finding', label: 'Detection finding' },
  { value: 'malware_triage_result', label: 'Malware triage result' },
  { value: 'network_analysis_result', label: 'Network analysis result' },
  { value: 'correlated_finding', label: 'Correlated finding' },
  { value: 'mitre_mapping', label: 'MITRE mapping' },
  { value: 'report', label: 'Report' },
] as const

export const NOTE_TYPES = [
  { value: 'general', label: 'General' },
  { value: 'observation', label: 'Observation' },
  { value: 'hypothesis', label: 'Hypothesis' },
  { value: 'decision', label: 'Decision' },
  { value: 'false_positive_reason', label: 'False Positive' },
  { value: 'escalation_note', label: 'Escalation' },
  { value: 'report_note', label: 'Report Note' },
] as const

export interface AnalystNote {
  id: number
  case_id: number
  entity_type: string
  entity_id: number | null
  note_type: string
  body: string
  author_name: string | null
  created_at: string
  updated_at: string
}

export async function getNotes(
  caseId: number,
  entityType?: string,
  entityId?: number,
): Promise<AnalystNote[]> {
  const params = new URLSearchParams()
  if (entityType) params.set('entity_type', entityType)
  if (entityId != null) params.set('entity_id', String(entityId))
  const qs = params.toString()
  const res = await fetch(`/api/cases/${caseId}/notes${qs ? '?' + qs : ''}`)
  if (!res.ok) throw new Error(`Failed to load notes: ${res.status}`)
  return res.json()
}

export async function createNote(
  caseId: number,
  data: {
    entity_type: string
    entity_id?: number | null
    note_type: string
    body: string
    author_name?: string
  },
): Promise<AnalystNote> {
  const res = await fetch(`/api/cases/${caseId}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to create note')
  }
  return res.json()
}

export async function updateNote(
  caseId: number,
  noteId: number,
  data: { note_type?: string; body?: string; author_name?: string },
): Promise<AnalystNote> {
  const res = await fetch(`/api/cases/${caseId}/notes/${noteId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to update note')
  }
  return res.json()
}

export async function deleteNote(caseId: number, noteId: number): Promise<void> {
  const res = await fetch(`/api/cases/${caseId}/notes/${noteId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete note: ${res.status}`)
}
