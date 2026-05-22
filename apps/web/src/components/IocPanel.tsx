import { useEffect, useState } from 'react'
import {
  getIocs,
  extractIocs,
  createIoc,
  updateIoc,
  deleteIoc,
  exportIocsUrl,
  IOC_TYPES,
  IOC_TAGS,
  IOC_TYPE_GROUPS,
  type Ioc,
} from '../api/iocs'

const CONFIDENCE_COLOR: Record<string, string> = {
  high:   'var(--green)',
  medium: 'var(--yellow)',
  low:    'var(--text-muted)',
}

const TAG_COLOR: Record<string, string> = {
  confirmed_malicious: 'var(--red)',
  suspicious:          'var(--orange)',
  needs_review:        'var(--yellow)',
  benign:              'var(--green)',
  internal:            'var(--text-muted)',
  external:            'var(--accent)',
}

function iocTypeLabel(type: string): string {
  return IOC_TYPES.find(t => t.value === type)?.label ?? type
}

function copyToClipboard(text: string) {
  navigator.clipboard?.writeText(text).catch(() => undefined)
}

interface Props {
  caseId: number
}

export default function IocPanel({ caseId }: Props) {
  const [iocs, setIocs] = useState<Ioc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract
  const [extracting, setExtracting] = useState(false)
  const [extractMsg, setExtractMsg] = useState<string | null>(null)

  // Group tab: '' = All, or one of IOC_TYPE_GROUPS[].key
  const [activeGroup, setActiveGroup] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [search, setSearch] = useState('')

  // Manual add form
  const [showAdd, setShowAdd] = useState(false)
  const [addType, setAddType] = useState('ipv4')
  const [addValue, setAddValue] = useState('')
  const [addConf, setAddConf] = useState('medium')
  const [addTags, setAddTags] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Inline tag editing
  const [editTagsId, setEditTagsId] = useState<number | null>(null)
  const [editTagsValue, setEditTagsValue] = useState<string[]>([])

  async function load() {
    try {
      const data = await getIocs(caseId)
      setIocs(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load IOCs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [caseId])

  async function handleExtract() {
    setExtracting(true)
    setExtractMsg(null)
    try {
      const res = await extractIocs(caseId)
      setExtractMsg(`Extracted ${res.extracted} new IOC${res.extracted !== 1 ? 's' : ''} (${res.total} total)`)
      await load()
    } catch (e: unknown) {
      setExtractMsg(e instanceof Error ? e.message : 'Extraction failed')
    } finally {
      setExtracting(false)
    }
  }

  async function handleAdd() {
    if (!addValue.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const ioc = await createIoc(caseId, {
        ioc_type: addType,
        value: addValue.trim(),
        confidence: addConf,
        tags: addTags,
      })
      setIocs(prev => [ioc, ...prev])
      setShowAdd(false)
      setAddValue('')
      setAddTags([])
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to add IOC')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(ioc: Ioc) {
    if (!window.confirm(`Delete IOC "${ioc.value}"?`)) return
    try {
      await deleteIoc(caseId, ioc.id)
      setIocs(prev => prev.filter(i => i.id !== ioc.id))
    } catch {
      // silently fail
    }
  }

  async function handleSaveTags(ioc: Ioc) {
    try {
      const updated = await updateIoc(caseId, ioc.id, { tags: editTagsValue })
      setIocs(prev => prev.map(i => i.id === updated.id ? updated : i))
      setEditTagsId(null)
    } catch {
      // leave edit open
    }
  }

  function handleCopyAll() {
    const text = filtered.map(i => i.value).join('\n')
    copyToClipboard(text)
  }

  // Filter
  const activeGroupTypes = IOC_TYPE_GROUPS.find(g => g.key === activeGroup)?.types ?? null
  const filtered = iocs.filter(ioc => {
    if (activeGroupTypes && !activeGroupTypes.includes(ioc.ioc_type)) return false
    if (tagFilter && !ioc.tags.includes(tagFilter)) return false
    if (search) {
      const s = search.toLowerCase()
      if (!ioc.value.toLowerCase().includes(s) && !ioc.normalized_value.includes(s)) return false
    }
    return true
  })

  // Group counts for tabs
  function groupCount(groupKey: string) {
    const types = IOC_TYPE_GROUPS.find(g => g.key === groupKey)?.types
    if (!types) return iocs.length
    return iocs.filter(i => types.includes(i.ioc_type)).length
  }

  return (
    <div className="detail-card">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div className="detail-card-title">IOC Basket</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            style={{ fontSize: 12 }}
            disabled={extracting}
            onClick={handleExtract}
          >
            {extracting ? 'Extracting…' : '⚡ Extract IOCs'}
          </button>
          {iocs.length > 0 && (
            <>
              <button className="btn btn-secondary" style={{ fontSize: 12 }} onClick={handleCopyAll}>
                Copy All
              </button>
              <a
                href={exportIocsUrl(caseId, 'csv')}
                download
                className="btn btn-secondary"
                style={{ fontSize: 12, textDecoration: 'none', display: 'inline-block', lineHeight: '1.4' }}
              >
                Export CSV
              </a>
              <a
                href={exportIocsUrl(caseId, 'json')}
                download
                className="btn btn-secondary"
                style={{ fontSize: 12, textDecoration: 'none', display: 'inline-block', lineHeight: '1.4' }}
              >
                Export JSON
              </a>
            </>
          )}
          <button
            className="btn btn-secondary"
            style={{ fontSize: 12 }}
            onClick={() => setShowAdd(v => !v)}
          >
            {showAdd ? 'Cancel' : '+ Add IOC'}
          </button>
        </div>
      </div>

      {/* Extract result */}
      {extractMsg && (
        <div style={{ fontSize: 12, color: 'var(--accent)', marginBottom: 8 }}>{extractMsg}</div>
      )}

      {/* Manual add form */}
      {showAdd && (
        <div style={{
          marginBottom: 12,
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>IOC Type</div>
              <select className="inline-select" value={addType} onChange={e => setAddType(e.target.value)} style={{ width: '100%' }}>
                {IOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Value</div>
              <input
                type="text"
                className="inline-select"
                placeholder="e.g. 192.168.1.100"
                value={addValue}
                onChange={e => setAddValue(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 110 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Confidence</div>
              <select className="inline-select" value={addConf} onChange={e => setAddConf(e.target.value)} style={{ width: '100%' }}>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Tags</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {IOC_TAGS.map(t => (
                <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={addTags.includes(t.value)}
                    onChange={e => setAddTags(prev =>
                      e.target.checked ? [...prev, t.value] : prev.filter(x => x !== t.value)
                    )}
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>
          {addError && <div className="upload-error" style={{ marginBottom: 6 }}>{addError}</div>}
          <button
            className="btn btn-primary"
            style={{ fontSize: 12 }}
            disabled={!addValue.trim() || adding}
            onClick={handleAdd}
          >
            {adding ? 'Adding…' : 'Add IOC'}
          </button>
        </div>
      )}

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>}
      {error && <div className="upload-error">{error}</div>}

      {!loading && iocs.length === 0 && !showAdd && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          No IOCs yet. Click "Extract IOCs" to automatically extract indicators from case data.
        </div>
      )}

      {!loading && iocs.length > 0 && (
        <>
          {/* Group tabs */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
            <button
              className="btn btn-secondary"
              style={{ fontSize: 11, padding: '3px 10px', opacity: activeGroup === '' ? 1 : 0.55, borderColor: activeGroup === '' ? 'var(--accent)' : undefined, color: activeGroup === '' ? 'var(--accent)' : undefined }}
              onClick={() => setActiveGroup('')}
            >
              All ({iocs.length})
            </button>
            {IOC_TYPE_GROUPS.map(g => {
              const count = groupCount(g.key)
              if (count === 0) return null
              return (
                <button
                  key={g.key}
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: '3px 10px', opacity: activeGroup === g.key ? 1 : 0.55, borderColor: activeGroup === g.key ? 'var(--accent)' : undefined, color: activeGroup === g.key ? 'var(--accent)' : undefined }}
                  onClick={() => setActiveGroup(g.key)}
                >
                  {g.label} ({count})
                </button>
              )
            })}
          </div>

          {/* Search + tag filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="inline-select"
              placeholder="Search IOCs…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
            <select
              className="inline-select"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
              style={{ width: 140 }}
            >
              <option value="">All tags</option>
              {IOC_TAGS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {filtered.length === 0 && (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No IOCs match the current filter.</div>
          )}

          {/* IOC table */}
          {filtered.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '4px 8px', fontWeight: 600 }}>Type</th>
                    <th style={{ padding: '4px 8px', fontWeight: 600 }}>Value</th>
                    <th style={{ padding: '4px 8px', fontWeight: 600 }}>Conf.</th>
                    <th style={{ padding: '4px 8px', fontWeight: 600 }}>Tags</th>
                    <th style={{ padding: '4px 8px', fontWeight: 600 }}>Source</th>
                    <th style={{ padding: '4px 8px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(ioc => (
                    <tr key={ioc.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '5px 8px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: 10, background: 'rgba(0,0,0,0.2)', padding: '1px 6px', borderRadius: 3 }}>
                          {iocTypeLabel(ioc.ioc_type)}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', maxWidth: 340, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <code style={{ fontSize: 11, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                          {ioc.value}
                        </code>
                      </td>
                      <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                        <span style={{ color: CONFIDENCE_COLOR[ioc.confidence] ?? 'var(--text-muted)', fontSize: 11 }}>
                          {ioc.confidence}
                        </span>
                      </td>
                      <td style={{ padding: '5px 8px', minWidth: 160 }}>
                        {editTagsId === ioc.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                              {IOC_TAGS.map(t => (
                                <label key={t.value} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={editTagsValue.includes(t.value)}
                                    onChange={e => setEditTagsValue(prev =>
                                      e.target.checked ? [...prev, t.value] : prev.filter(x => x !== t.value)
                                    )}
                                  />
                                  {t.label}
                                </label>
                              ))}
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button className="btn btn-primary" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => handleSaveTags(ioc)}>Save</button>
                              <button className="btn btn-secondary" style={{ fontSize: 10, padding: '2px 7px' }} onClick={() => setEditTagsId(null)}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                            {ioc.tags.length > 0
                              ? ioc.tags.map(tag => (
                                  <span key={tag} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'rgba(0,0,0,0.2)', color: TAG_COLOR[tag] ?? 'var(--text-muted)' }}>
                                    {tag.replace(/_/g, ' ')}
                                  </span>
                                ))
                              : <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>—</span>
                            }
                            <button
                              className="btn btn-secondary"
                              style={{ fontSize: 10, padding: '1px 6px', marginLeft: 2 }}
                              onClick={() => { setEditTagsId(ioc.id); setEditTagsValue([...ioc.tags]) }}
                            >
                              Tag
                            </button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '5px 8px', color: 'var(--text-muted)', fontSize: 11, whiteSpace: 'nowrap' }}>
                        {ioc.source_type ? ioc.source_type.replace(/_/g, ' ') : 'manual'}
                      </td>
                      <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: 10, padding: '2px 7px' }}
                            onClick={() => copyToClipboard(ioc.value)}
                            title="Copy value"
                          >
                            Copy
                          </button>
                          <button
                            className="btn btn-secondary"
                            style={{ fontSize: 10, padding: '2px 7px', color: 'var(--red)' }}
                            onClick={() => handleDelete(ioc)}
                            title="Delete IOC"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length < iocs.length && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Showing {filtered.length} of {iocs.length} IOCs
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
