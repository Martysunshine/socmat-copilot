export interface MCPTool {
  name: string
  description: string
  requires_case_id: boolean
  requires_evidence_id: boolean
  category: string
}

export interface MCPToolCall {
  tool_name: string
  case_id: number | null
  timestamp: string
  success: boolean
  error: string | null
}

export async function getMCPTools(): Promise<MCPTool[]> {
  const res = await fetch('/api/mcp/tools')
  if (!res.ok) throw new Error(`Failed to fetch MCP tools: ${res.status}`)
  return res.json()
}

export async function getMCPToolCalls(): Promise<MCPToolCall[]> {
  const res = await fetch('/api/mcp/tool-calls')
  if (!res.ok) throw new Error(`Failed to fetch tool call log: ${res.status}`)
  return res.json()
}
