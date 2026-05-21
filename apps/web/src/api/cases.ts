export interface Case {
  id: number
  title: string
  description: string | null
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'investigating' | 'contained' | 'escalated' | 'closed'
  source: 'manual' | 'windows_logs' | 'suricata' | 'zeek' | 'splunk_export' | 'elastic_export' | 'yara'
  affected_host: string | null
  affected_user: string | null
  affected_ip: string | null
  created_at: string
  updated_at: string
}

export interface CaseCreate {
  title: string
  description?: string
  severity?: string
  status?: string
  source?: string
  affected_host?: string
  affected_user?: string
  affected_ip?: string
}

export interface CaseUpdate {
  title?: string
  description?: string
  severity?: string
  status?: string
  source?: string
  affected_host?: string
  affected_user?: string
  affected_ip?: string
}

const BASE = '/api/cases'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? 'Request failed')
  }
  return res.json()
}

export function getCases(): Promise<Case[]> {
  return fetch(BASE).then((r) => handleResponse<Case[]>(r))
}

export function getCase(id: number): Promise<Case> {
  return fetch(`${BASE}/${id}`).then((r) => handleResponse<Case>(r))
}

export function createCase(data: CaseCreate): Promise<Case> {
  return fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => handleResponse<Case>(r))
}

export function updateCase(id: number, data: CaseUpdate): Promise<Case> {
  return fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then((r) => handleResponse<Case>(r))
}

export async function deleteCase(id: number): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete case')
}
