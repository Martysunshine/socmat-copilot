const BASE = '/api'

export interface Ioc {
  id: number
  case_id: number
  ioc_type: string
  value: string
  normalized_value: string
  source_type: string | null
  source_id: number | null
  confidence: string
  tags: string[]
  first_seen: string | null
  last_seen: string | null
  created_at: string
}

export interface ExtractIocsResponse {
  extracted: number
  total: number
}

export const IOC_TYPES = [
  { value: 'ipv4',          label: 'IPv4 Address' },
  { value: 'ipv6',          label: 'IPv6 Address' },
  { value: 'domain',        label: 'Domain' },
  { value: 'url',           label: 'URL' },
  { value: 'md5',           label: 'MD5 Hash' },
  { value: 'sha1',          label: 'SHA1 Hash' },
  { value: 'sha256',        label: 'SHA256 Hash' },
  { value: 'email',         label: 'Email Address' },
  { value: 'hostname',      label: 'Hostname' },
  { value: 'username',      label: 'Username' },
  { value: 'process_name',  label: 'Process Name' },
  { value: 'file_path',     label: 'File Path' },
  { value: 'registry_path', label: 'Registry Path' },
  { value: 'mutex',         label: 'Mutex' },
  { value: 'port',          label: 'Port' },
  { value: 'user_agent',    label: 'User Agent' },
]

export const IOC_TAGS = [
  { value: 'suspicious',         label: 'Suspicious' },
  { value: 'confirmed_malicious', label: 'Confirmed Malicious' },
  { value: 'benign',             label: 'Benign' },
  { value: 'needs_review',       label: 'Needs Review' },
  { value: 'internal',           label: 'Internal' },
  { value: 'external',           label: 'External' },
]

export const IOC_TYPE_GROUPS = [
  { key: 'ip_addresses', label: 'IP Addresses',      types: ['ipv4', 'ipv6'] },
  { key: 'domains',      label: 'Domains',           types: ['domain'] },
  { key: 'urls',         label: 'URLs',              types: ['url'] },
  { key: 'hashes',       label: 'File Hashes',       types: ['md5', 'sha1', 'sha256'] },
  { key: 'hosts_users',  label: 'Hosts / Users',     types: ['hostname', 'username', 'email'] },
  { key: 'processes',    label: 'Processes & Paths', types: ['process_name', 'file_path', 'registry_path'] },
  { key: 'other',        label: 'Other',             types: ['port', 'user_agent', 'mutex'] },
]

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(text || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

export function extractIocs(caseId: number): Promise<ExtractIocsResponse> {
  return req(`${BASE}/cases/${caseId}/iocs/extract`, { method: 'POST' })
}

export function getIocs(
  caseId: number,
  opts?: { ioc_type?: string; tag?: string; search?: string },
): Promise<Ioc[]> {
  const params = new URLSearchParams()
  if (opts?.ioc_type) params.set('ioc_type', opts.ioc_type)
  if (opts?.tag) params.set('tag', opts.tag)
  if (opts?.search) params.set('search', opts.search)
  const qs = params.toString()
  return req(`${BASE}/cases/${caseId}/iocs${qs ? `?${qs}` : ''}`)
}

export function createIoc(
  caseId: number,
  data: { ioc_type: string; value: string; confidence: string; tags: string[] },
): Promise<Ioc> {
  return req(`${BASE}/cases/${caseId}/iocs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function updateIoc(
  caseId: number,
  iocId: number,
  data: { confidence?: string; tags?: string[] },
): Promise<Ioc> {
  return req(`${BASE}/cases/${caseId}/iocs/${iocId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function deleteIoc(caseId: number, iocId: number): Promise<void> {
  return fetch(`${BASE}/cases/${caseId}/iocs/${iocId}`, { method: 'DELETE' }).then(() => undefined)
}

export function exportIocsUrl(caseId: number, format: 'csv' | 'json'): string {
  return `${BASE}/cases/${caseId}/iocs/export?format=${format}`
}
