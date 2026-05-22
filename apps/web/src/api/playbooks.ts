export interface PlaybookStep {
  id: number
  step_order: number
  title: string
  description: string | null
  status: string
  analyst_notes: string | null
  evidence_reference: string | null
  created_at: string
  updated_at: string
}

export interface CasePlaybook {
  id: number
  case_id: number
  template_id: number | null
  name: string
  status: string
  assigned_to: string | null
  progress_percent: number
  steps: PlaybookStep[]
  created_at: string
  updated_at: string
}

export interface PlaybookTemplateSummary {
  id: number
  name: string
  description: string | null
  alert_type: string
  severity: string
  step_count: number
}

export interface PlaybookTemplateDetail {
  id: number
  name: string
  description: string | null
  alert_type: string
  severity: string
  required_data_sources: string[]
  steps: { order: number; title: string; description: string }[]
  step_count: number
}

export interface PlaybookSuggestion {
  template_id: number
  name: string
  alert_type: string
  reason: string
}

export interface CasePlaybooksListResponse {
  playbooks: CasePlaybook[]
  suggestions: PlaybookSuggestion[]
}

export async function getCasePlaybooks(caseId: number): Promise<CasePlaybooksListResponse> {
  const res = await fetch(`/api/cases/${caseId}/playbooks`)
  if (!res.ok) throw new Error(`Failed to load playbooks: ${res.status}`)
  return res.json()
}

export async function attachPlaybook(caseId: number, templateId: number): Promise<CasePlaybook> {
  const res = await fetch(`/api/cases/${caseId}/playbooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ template_id: templateId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to attach playbook')
  }
  return res.json()
}

export async function updatePlaybookStep(
  caseId: number,
  playbookId: number,
  stepId: number,
  data: { status?: string; analyst_notes?: string; evidence_reference?: string },
): Promise<PlaybookStep> {
  const res = await fetch(`/api/cases/${caseId}/playbooks/${playbookId}/steps/${stepId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Failed to update step')
  }
  return res.json()
}

export async function getPlaybookTemplates(): Promise<PlaybookTemplateSummary[]> {
  const res = await fetch('/api/playbooks/templates')
  if (!res.ok) throw new Error(`Failed to load playbook templates: ${res.status}`)
  return res.json()
}

export async function getPlaybookTemplate(id: number): Promise<PlaybookTemplateDetail> {
  const res = await fetch(`/api/playbooks/templates/${id}`)
  if (!res.ok) throw new Error(`Failed to load playbook template: ${res.status}`)
  return res.json()
}
