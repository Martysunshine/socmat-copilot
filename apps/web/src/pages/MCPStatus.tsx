import { useEffect, useState } from 'react'
import { getMCPTools, getMCPToolCalls, type MCPTool, type MCPToolCall } from '../api/mcp'

const CATEGORY_LABEL: Record<string, string> = {
  read: 'Read',
  analysis: 'Analysis',
  detection: 'Detection',
  reporting: 'Reporting',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function MCPStatus() {
  const [tools, setTools] = useState<MCPTool[]>([])
  const [calls, setCalls] = useState<MCPToolCall[]>([])
  const [toolsLoading, setToolsLoading] = useState(true)
  const [callsLoading, setCallsLoading] = useState(true)
  const [toolsError, setToolsError] = useState<string | null>(null)

  useEffect(() => {
    getMCPTools()
      .then(setTools)
      .catch((e: Error) => setToolsError(e.message))
      .finally(() => setToolsLoading(false))
    getMCPToolCalls()
      .then(setCalls)
      .catch(() => setCalls([]))
      .finally(() => setCallsLoading(false))
  }, [])

  return (
    <>
      <div className="page-header">
        <div>
          <h1 className="page-title">MCP Tool Server</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6, marginBottom: 0 }}>
            Model Context Protocol — expose SOC analysis tools to AI agents
          </p>
        </div>
        <span className="phase-badge">Phase 14</span>
      </div>

      {/* Connection instructions */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">How to Connect</div>
        </div>

        <div className="mcp-connect-block">
          <div className="mcp-connect-section">
            <div className="mcp-connect-label">Start the MCP server (FastAPI backend must be running first)</div>
            <code className="mcp-code">cd services/mcp-server &amp;&amp; pip install -r requirements.txt &amp;&amp; python server.py</code>
          </div>

          <div className="mcp-connect-section">
            <div className="mcp-connect-label">
              Claude Desktop — add to <code style={{ fontSize: 11 }}>claude_desktop_config.json</code>
            </div>
            <pre className="mcp-code mcp-code--block">{`{
  "mcpServers": {
    "soc-copilot": {
      "command": "python",
      "args": ["server.py"],
      "cwd": "/absolute/path/to/services/mcp-server"
    }
  }
}`}</pre>
          </div>

          <div className="mcp-connect-section">
            <div className="mcp-connect-label">Environment variables (optional)</div>
            <code className="mcp-code">
              MCP_BACKEND_URL=http://localhost:8000&nbsp;&nbsp;# FastAPI backend (default)
            </code>
          </div>

          <div className="mcp-connect-section" style={{ marginBottom: 0 }}>
            <div className="mcp-connect-label">Transport</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
              stdio (default) — compatible with Claude Desktop, Cursor, VS Code Copilot, and any MCP-aware client.
              See <code style={{ fontSize: 11 }}>docs/mcp-tools.md</code> for full documentation.
            </p>
          </div>
        </div>
      </div>

      {/* Available tools */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">
            Available Tools{tools.length > 0 ? ` (${tools.length})` : ''}
          </div>
        </div>

        {toolsLoading && <div className="state-box">Loading tools…</div>}
        {toolsError && (
          <div className="state-box state-error">
            <strong>Error</strong>
            <p>{toolsError}</p>
          </div>
        )}
        {!toolsLoading && !toolsError && (
          <div className="mcp-tool-list">
            {tools.map(tool => (
              <div key={tool.name} className="mcp-tool-row">
                <div className="mcp-tool-info">
                  <code className="mcp-tool-name">{tool.name}</code>
                  <span className="mcp-tool-desc">{tool.description}</span>
                </div>
                <div className="mcp-tool-tags">
                  <span className={`mcp-tag mcp-tag--category mcp-tag--category-${tool.category}`}>
                    {CATEGORY_LABEL[tool.category] ?? tool.category}
                  </span>
                  {tool.requires_evidence_id && (
                    <span className="mcp-tag mcp-tag--param">evidence_id</span>
                  )}
                  {tool.requires_case_id && !tool.requires_evidence_id && (
                    <span className="mcp-tag mcp-tag--caseid">case_id</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tool call log */}
      <div className="panel-section">
        <div className="panel-section-header">
          <div className="panel-section-title">Recent Tool Calls</div>
          {calls.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {calls.filter(c => c.success).length} ok · {calls.filter(c => !c.success).length} failed
            </span>
          )}
        </div>

        {callsLoading && <div className="state-box">Loading call log…</div>}
        {!callsLoading && calls.length === 0 && (
          <div className="state-box">
            No tool calls logged yet. Connect an MCP client and invoke a tool to see activity here.
          </div>
        )}
        {!callsLoading && calls.length > 0 && (
          <div className="evidence-table-wrap">
            <table className="evidence-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Tool</th>
                  <th>Case ID</th>
                  <th>Status</th>
                  <th>Error</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {formatDate(call.timestamp)}
                    </td>
                    <td>
                      <code style={{ fontSize: 12 }}>{call.tool_name}</code>
                    </td>
                    <td style={{ fontSize: 12 }}>{call.case_id ?? '—'}</td>
                    <td>
                      <span className={call.success ? 'mcp-status-ok' : 'mcp-status-fail'}>
                        {call.success ? 'OK' : 'FAIL'}
                      </span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {call.error ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
