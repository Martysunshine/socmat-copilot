import { useCallback, useState } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
  MarkerType,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  getCaseGraph,
  exportGraphJson,
  type GraphNode,
  type GraphEdge,
  type GraphResponse,
  type GraphFilters,
} from '../api/graph'

// ── Node type colors ─────────────────────────────────────────────────────────

const NODE_COLORS: Record<string, string> = {
  case:                 '#8b5cf6',
  host:                 '#58a6ff',
  user:                 '#34d399',
  ip_address:           '#f0883e',
  domain:               '#d29922',
  process:              '#67e8f9',
  file_hash:            '#f85149',
  evidence_file:        '#6b7280',
  sigma_rule:           '#f85149',
  yara_rule:            '#f472b6',
  suricata_signature:   '#f97316',
  mitre_technique:      '#dc2626',
  correlated_finding:   '#ef4444',
  ioc:                  '#f59e0b',
}

const NODE_ICONS: Record<string, string> = {
  case:                '📁',
  host:                '🖥',
  user:                '👤',
  ip_address:          '🌐',
  domain:              '🔗',
  process:             '⚙',
  file_hash:           '#',
  evidence_file:       '📄',
  sigma_rule:          '📋',
  yara_rule:           '🧬',
  suricata_signature:  '🚨',
  mitre_technique:     '🎯',
  correlated_finding:  '🔴',
  ioc:                 '⚠',
}

const SEV_BORDER: Record<string, string> = {
  critical: '#f85149',
  high:     '#f0883e',
  medium:   '#d29922',
  low:      '#3fb950',
  info:     '#30363d',
}

// ── Custom node component ────────────────────────────────────────────────────

function GraphNodeComponent({ data }: NodeProps) {
  const color = NODE_COLORS[data.nodeType] || '#58a6ff'
  const icon = NODE_ICONS[data.nodeType] || '●'
  const border = SEV_BORDER[data.severity] || '#30363d'

  return (
    <div
      style={{
        background: '#161b22',
        border: `2px solid ${border}`,
        borderRadius: 8,
        minWidth: 120,
        maxWidth: 180,
        fontSize: 11,
        cursor: 'pointer',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <div
        style={{
          background: color + '22',
          borderBottom: `1px solid ${color}40`,
          padding: '4px 8px',
          borderRadius: '6px 6px 0 0',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ color, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {data.nodeType.replace(/_/g, ' ')}
        </span>
      </div>
      <div style={{ padding: '6px 8px', color: '#e6edf3', wordBreak: 'break-word', lineHeight: 1.4 }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
    </div>
  )
}

const nodeTypes = { graphNode: GraphNodeComponent }

// ── Filter toggle labels ─────────────────────────────────────────────────────

const FILTER_LABELS: { key: keyof GraphFilters; label: string }[] = [
  { key: 'show_hosts',      label: 'Hosts' },
  { key: 'show_users',      label: 'Users' },
  { key: 'show_ips',        label: 'IPs' },
  { key: 'show_domains',    label: 'Domains' },
  { key: 'show_processes',  label: 'Processes' },
  { key: 'show_detections', label: 'Detections' },
  { key: 'show_mitre',      label: 'MITRE' },
  { key: 'show_iocs',       label: 'IOCs' },
  { key: 'show_evidence',   label: 'Evidence files' },
  { key: 'only_suspicious', label: 'Suspicious only' },
]

// ── Layout helper (simple force-free grid layout) ────────────────────────────

function layoutNodes(graphNodes: GraphNode[]): Node[] {
  const TYPE_ORDER = [
    'case', 'host', 'user', 'process', 'ip_address', 'domain',
    'sigma_rule', 'yara_rule', 'suricata_signature', 'correlated_finding',
    'mitre_technique', 'file_hash', 'ioc', 'evidence_file',
  ]

  const byType: Record<string, GraphNode[]> = {}
  for (const n of graphNodes) {
    if (!byType[n.type]) byType[n.type] = []
    byType[n.type].push(n)
  }

  const result: Node[] = []
  let row = 0

  for (const typeName of TYPE_ORDER) {
    const group = byType[typeName]
    if (!group || group.length === 0) continue
    const cols = Math.min(group.length, 5)
    for (let i = 0; i < group.length; i++) {
      const col = i % cols
      const subRow = Math.floor(i / cols)
      result.push({
        id: group[i].id,
        type: 'graphNode',
        position: { x: col * 220 + 40, y: (row + subRow) * 120 + 40 },
        data: {
          label: group[i].label,
          nodeType: group[i].type,
          severity: group[i].severity,
          description: group[i].description,
          properties: group[i].properties,
          source_ids: group[i].source_ids,
        },
      })
    }
    row += Math.ceil(group.length / cols) + 1
  }

  // Any types not in TYPE_ORDER
  for (const [typeName, group] of Object.entries(byType)) {
    if (TYPE_ORDER.includes(typeName)) continue
    const cols = Math.min(group.length, 5)
    for (let i = 0; i < group.length; i++) {
      result.push({
        id: group[i].id,
        type: 'graphNode',
        position: { x: (i % cols) * 220 + 40, y: row * 120 + 40 },
        data: {
          label: group[i].label,
          nodeType: group[i].type,
          severity: group[i].severity,
          description: group[i].description,
          properties: group[i].properties,
          source_ids: group[i].source_ids,
        },
      })
    }
    row += Math.ceil(group.length / cols) + 1
  }

  return result
}

function toFlowEdges(graphEdges: GraphEdge[]): Edge[] {
  const EDGE_COLORS: Record<string, string> = {
    matched_rule:     '#f85149',
    triggered_alert:  '#f97316',
    connected_to:     '#58a6ff',
    logged_into:      '#3fb950',
    spawned:          '#d29922',
    executed:         '#67e8f9',
    mapped_to_mitre:  '#8b5cf6',
    correlated_with:  '#ef4444',
    extracted_from:   '#6b7280',
    observed_in:      '#9ca3af',
    related_to:       '#30363d',
  }

  return graphEdges.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    type: 'smoothstep',
    style: { stroke: EDGE_COLORS[e.type] || '#8b949e', strokeWidth: 1.5 },
    markerEnd: { type: MarkerType.ArrowClosed, color: EDGE_COLORS[e.type] || '#8b949e' },
    data: { edgeType: e.type, confidence: e.confidence, evidence_reference: e.evidence_reference },
    labelStyle: { fill: '#8b949e', fontSize: 10 },
    labelBgStyle: { fill: '#161b22', fillOpacity: 0.85 },
  }))
}

// ── Main component ───────────────────────────────────────────────────────────

interface Props {
  caseId: number
}

export default function GraphPanel({ caseId }: Props) {
  const [filters, setFilters] = useState<GraphFilters>({
    show_hosts: true,
    show_users: true,
    show_ips: true,
    show_domains: true,
    show_processes: true,
    show_detections: true,
    show_mitre: true,
    show_iocs: true,
    show_evidence: false,
    only_suspicious: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<GraphResponse | null>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const handleBuildGraph = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSelectedNode(null)
    setSelectedEdge(null)
    try {
      const data = await getCaseGraph(caseId, filters)
      setGraphData(data)
      setNodes(layoutNodes(data.nodes))
      setEdges(toFlowEdges(data.edges))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to build graph')
    } finally {
      setLoading(false)
    }
  }, [caseId, filters, setNodes, setEdges])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
    setSelectedEdge(null)
  }, [])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge)
    setSelectedNode(null)
  }, [])

  const handlePaneClick = useCallback(() => {
    setSelectedNode(null)
    setSelectedEdge(null)
  }, [])

  function toggleFilter(key: keyof GraphFilters) {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="detail-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span className="detail-card-title" style={{ margin: 0 }}>Investigation Map</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {graphData && (
              <button
                className="btn btn-secondary"
                style={{ fontSize: 12, padding: '4px 10px' }}
                onClick={() => exportGraphJson(graphData)}
              >
                Export JSON
              </button>
            )}
            <button
              className="btn btn-primary"
              style={{ fontSize: 12, padding: '4px 12px' }}
              onClick={handleBuildGraph}
              disabled={loading}
            >
              {loading ? 'Building…' : graphData ? 'Rebuild Graph' : 'Build Graph'}
            </button>
          </div>
        </div>

        {/* Filter toggles */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {FILTER_LABELS.map(({ key, label }) => {
            const active = !!filters[key]
            return (
              <button
                key={key}
                onClick={() => toggleFilter(key)}
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 4,
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-dim)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="state-box state-error" style={{ margin: 12 }}>
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      )}

      {!graphData && !loading && !error && (
        <div className="state-box" style={{ margin: 0, borderRadius: 0 }}>
          Click <strong>Build Graph</strong> to generate an interactive entity map from case data.
        </div>
      )}

      {graphData && (
        <>
          {/* Metadata bar */}
          <div style={{ display: 'flex', gap: 16, padding: '6px 18px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
            <span>{graphData.metadata.total_nodes} nodes</span>
            <span>{graphData.metadata.total_edges} edges</span>
            {Object.entries(graphData.metadata.node_type_counts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([type, count]) => (
              <span key={type}>{type.replace(/_/g, ' ')}: {count}</span>
            ))}
          </div>

          <div style={{ display: 'flex', height: 600 }}>
            {/* React Flow canvas */}
            <div style={{ flex: 1, position: 'relative' }}>
              {graphData.nodes.length === 0 ? (
                <div className="state-box" style={{ margin: 0, borderRadius: 0, height: '100%' }}>
                  No nodes to display with the current filters.
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onNodeClick={handleNodeClick}
                  onEdgeClick={handleEdgeClick}
                  onPaneClick={handlePaneClick}
                  nodeTypes={nodeTypes}
                  fitView
                  minZoom={0.1}
                  maxZoom={2}
                  attributionPosition="bottom-right"
                >
                  <Background color="#30363d" gap={20} />
                  <Controls />
                  <MiniMap
                    style={{ background: '#0d1117', border: '1px solid var(--border)' }}
                    nodeColor={(n) => NODE_COLORS[n.data?.nodeType] || '#58a6ff'}
                  />
                </ReactFlow>
              )}
            </div>

            {/* Detail panel */}
            {(selectedNode || selectedEdge) && (
              <div
                style={{
                  width: 260,
                  borderLeft: '1px solid var(--border)',
                  padding: 14,
                  overflowY: 'auto',
                  fontSize: 12,
                  background: 'var(--surface)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                    {selectedNode ? 'Node Detail' : 'Edge Detail'}
                  </span>
                  <button
                    onClick={() => { setSelectedNode(null); setSelectedEdge(null) }}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14 }}
                  >
                    ✕
                  </button>
                </div>

                {selectedNode && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {selectedNode.data.nodeType?.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: 'var(--text)', fontWeight: 600, marginTop: 2, wordBreak: 'break-word' }}>
                        {selectedNode.data.label}
                      </div>
                    </div>

                    {selectedNode.data.description && (
                      <div style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        {selectedNode.data.description}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 6px', borderRadius: 3,
                        background: (SEV_BORDER[selectedNode.data.severity] || '#30363d') + '33',
                        color: SEV_BORDER[selectedNode.data.severity] || 'var(--text-muted)',
                        border: `1px solid ${SEV_BORDER[selectedNode.data.severity] || '#30363d'}`,
                      }}>
                        {selectedNode.data.severity}
                      </span>
                      <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, background: 'var(--surface-hover)', color: 'var(--text-muted)' }}>
                        conf: {selectedNode.data.confidence}
                      </span>
                    </div>

                    {selectedNode.data.properties && Object.keys(selectedNode.data.properties).length > 0 && (
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 4 }}>Properties</div>
                        {Object.entries(selectedNode.data.properties as Record<string, unknown>).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', gap: 6, marginBottom: 2 }}>
                            <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>{k}:</span>
                            <span style={{ color: 'var(--text)', wordBreak: 'break-word' }}>{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedNode.data.source_ids?.length > 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                        Source IDs: {(selectedNode.data.source_ids as number[]).join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {selectedEdge && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase' }}>Edge type</div>
                      <div style={{ color: 'var(--text)', fontWeight: 600, marginTop: 2 }}>
                        {selectedEdge.data?.edgeType?.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>
                      <span style={{ color: 'var(--text)' }}>{selectedEdge.source}</span>
                      {' → '}
                      <span style={{ color: 'var(--text)' }}>{selectedEdge.target}</span>
                    </div>
                    {selectedEdge.data?.confidence && (
                      <div style={{ color: 'var(--text-muted)' }}>Confidence: {selectedEdge.data.confidence}</div>
                    )}
                    {selectedEdge.data?.evidence_reference && (
                      <div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 10, textTransform: 'uppercase', marginBottom: 2 }}>Evidence</div>
                        <div style={{ color: 'var(--accent)', wordBreak: 'break-word' }}>
                          {selectedEdge.data.evidence_reference}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
