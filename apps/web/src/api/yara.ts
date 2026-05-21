const BASE = '/api'

function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    return res.json().catch(() => ({})).then((body: { detail?: string }) => {
      throw new Error(body.detail ?? `HTTP ${res.status}`)
    })
  }
  return res.json() as Promise<T>
}

export interface YaraRuleInfo {
  name: string
  tags: string[]
  meta: Record<string, string>
}

export interface YaraMatch {
  rule: string
  tags: string[]
  meta: Record<string, string>
  strings_matched: string[]
}

export interface SuspiciousStrings {
  powershell: string[]
  lolbas: string[]
  base64: string[]
  urls: string[]
  ips: string[]
}

export interface MalwareTriageResult {
  id: number
  case_id: number
  evidence_id: number
  original_filename: string
  sha256: string | null
  sha1: string | null
  md5: string | null
  file_type: string | null
  file_size: number | null
  yara_matches: YaraMatch[]
  suspicious_strings: SuspiciousStrings
  risk_score: number
  summary: string
  created_at: string
}

export async function getYaraRules(): Promise<YaraRuleInfo[]> {
  const res = await fetch(`${BASE}/yara/rules`)
  return handleResponse<YaraRuleInfo[]>(res)
}

export async function reloadYaraRules(): Promise<{ loaded: number; yara_available: boolean }> {
  const res = await fetch(`${BASE}/yara/rules/reload`, { method: 'POST' })
  return handleResponse<{ loaded: number; yara_available: boolean }>(res)
}

export async function runYaraTriage(caseId: number, evidenceId: number): Promise<MalwareTriageResult> {
  const res = await fetch(`${BASE}/cases/${caseId}/analyze/yara`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidence_id: evidenceId }),
  })
  return handleResponse<MalwareTriageResult>(res)
}

export async function getYaraResults(caseId: number): Promise<MalwareTriageResult[]> {
  const res = await fetch(`${BASE}/cases/${caseId}/analyze/yara`)
  return handleResponse<MalwareTriageResult[]>(res)
}
