import { useEffect, useState } from 'react'
import {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
  ENTITY_TYPES,
  NOTE_TYPES,
  type AnalystNote,
} from '../api/notes'

const NOTE_TYPE_COLOR: Record<string, string> = {
  escalation_note: 'var(--red)',
  decision: 'var(--green)',
  false_positive_reason: 'var(--text-muted)',
  report_note: 'var(--orange)',
  hypothesis: 'var(--yellow)',
  observation: 'var(--accent)',
  general: 'var(--border)',
}

const NOTE_TYPE_LABEL: Record<string, string> = {
  escalation_note: 'Escalation',
  decision: 'Decision',
  false_positive_reason: 'False Positive',
  report_note: 'Report Note',
  hypothesis: 'Hypothesis',
  observation: 'Observation',
  general: 'General',
}

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'observation', label: 'Observations' },
  { key: 'hypothesis', label: 'Hypotheses' },
  { key: 'decision', label: 'Decisions' },
  { key: 'false_positive_reason', label: 'False Positives' },
  { key: 'escalation_note', label: 'Escalations' },
  { key: 'report_note', label: 'Report Notes' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  caseId: number
}

export default function NotesPanel({ caseId }: Props) {
  const [notes, setNotes] = useState<AnalystNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add form
  const [showAdd, setShowAdd] = useState(false)
  const [addEntityType, setAddEntityType] = useState('case')
  const [addEntityId, setAddEntityId] = useState('')
  const [addNoteType, setAddNoteType] = useState('general')
  const [addBody, setAddBody] = useState('')
  const [addAuthor, setAddAuthor] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  // Filter
  const [filterType, setFilterType] = useState('')

  // Edit state
  const [editId, setEditId] = useState<number | null>(null)
  const [editBody, setEditBody] = useState('')
  const [editNoteType, setEditNoteType] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    try {
      const data = await getNotes(caseId)
      setNotes(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load notes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [caseId])

  async function handleAdd() {
    if (!addBody.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const note = await createNote(caseId, {
        entity_type: addEntityType,
        entity_id: addEntityType !== 'case' && addEntityId ? Number(addEntityId) : null,
        note_type: addNoteType,
        body: addBody.trim(),
        author_name: addAuthor.trim() || undefined,
      })
      setNotes(prev => [note, ...prev])
      setShowAdd(false)
      setAddBody('')
      setAddEntityId('')
      setAddAuthor('')
      setAddNoteType('general')
      setAddEntityType('case')
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to add note')
    } finally {
      setAdding(false)
    }
  }

  function startEdit(note: AnalystNote) {
    setEditId(note.id)
    setEditBody(note.body)
    setEditNoteType(note.note_type)
  }

  async function handleSaveEdit(note: AnalystNote) {
    setSaving(true)
    try {
      const updated = await updateNote(caseId, note.id, {
        body: editBody.trim(),
        note_type: editNoteType,
      })
      setNotes(prev => prev.map(n => n.id === updated.id ? updated : n))
      setEditId(null)
    } catch {
      // leave edit open
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(note: AnalystNote) {
    if (!window.confirm('Delete this note? This cannot be undone.')) return
    try {
      await deleteNote(caseId, note.id)
      setNotes(prev => prev.filter(n => n.id !== note.id))
    } catch {
      // silently fail
    }
  }

  const filtered = filterType ? notes.filter(n => n.note_type === filterType) : notes

  return (
    <div className="detail-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="detail-card-title">Analyst Notes</div>
        <button
          className="btn btn-primary"
          style={{ fontSize: 12, padding: '4px 12px' }}
          onClick={() => setShowAdd(v => !v)}
        >
          {showAdd ? 'Cancel' : '+ Add Note'}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{
          marginTop: 10,
          padding: '12px 14px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 6,
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Entity Type</div>
              <select
                className="inline-select"
                value={addEntityType}
                onChange={e => { setAddEntityType(e.target.value); setAddEntityId('') }}
                style={{ width: '100%' }}
              >
                {ENTITY_TYPES.map(et => (
                  <option key={et.value} value={et.value}>{et.label}</option>
                ))}
              </select>
            </div>
            {addEntityType !== 'case' && (
              <div style={{ width: 110 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Entity ID</div>
                <input
                  type="number"
                  className="inline-select"
                  placeholder="e.g. 3"
                  value={addEntityId}
                  onChange={e => setAddEntityId(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Note Type</div>
              <select
                className="inline-select"
                value={addNoteType}
                onChange={e => setAddNoteType(e.target.value)}
                style={{ width: '100%' }}
              >
                {NOTE_TYPES.map(nt => (
                  <option key={nt.value} value={nt.value}>{nt.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Author (optional)</div>
              <input
                type="text"
                className="inline-select"
                placeholder="Your name"
                value={addAuthor}
                onChange={e => setAddAuthor(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>
          </div>
          <textarea
            style={{
              width: '100%',
              minHeight: 72,
              background: 'var(--bg-primary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              padding: '6px 8px',
              fontSize: 13,
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
            placeholder="Write your note here…"
            value={addBody}
            onChange={e => setAddBody(e.target.value)}
          />
          {addError && <div className="upload-error" style={{ marginTop: 4 }}>{addError}</div>}
          <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: 12 }}
              disabled={!addBody.trim() || adding}
              onClick={handleAdd}
            >
              {adding ? 'Saving…' : 'Save Note'}
            </button>
          </div>
        </div>
      )}

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>Loading…</div>}
      {error && <div className="upload-error" style={{ marginTop: 8 }}>{error}</div>}

      {/* Filter tabs */}
      {!loading && notes.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 12, marginBottom: 8 }}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              className="btn btn-secondary"
              style={{
                fontSize: 11,
                padding: '3px 10px',
                opacity: filterType === tab.key ? 1 : 0.55,
                borderColor: filterType === tab.key ? 'var(--accent)' : undefined,
                color: filterType === tab.key ? 'var(--accent)' : undefined,
              }}
              onClick={() => setFilterType(tab.key)}
            >
              {tab.label}
              {tab.key === '' ? ` (${notes.length})` : ` (${notes.filter(n => n.note_type === tab.key).length})`}
            </button>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && !showAdd && (
        <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>
          {filterType ? 'No notes of this type.' : 'No notes yet. Add the first note above.'}
        </div>
      )}

      {/* Note list */}
      <div style={{ marginTop: 4 }}>
        {filtered.map(note => {
          const isEditing = editId === note.id
          const color = NOTE_TYPE_COLOR[note.note_type] ?? 'var(--border)'
          const typeLabel = NOTE_TYPE_LABEL[note.note_type] ?? note.note_type
          const entityLabel = ENTITY_TYPES.find(e => e.value === note.entity_type)?.label ?? note.entity_type

          return (
            <div
              key={note.id}
              style={{
                marginBottom: 10,
                padding: '10px 12px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                borderLeft: `3px solid ${color}`,
                borderRadius: '0 4px 4px 0',
              }}
            >
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {/* Type badge */}
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 3,
                    background: 'rgba(0,0,0,0.2)',
                    color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {typeLabel}
                  </span>
                  {/* Entity reference */}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {entityLabel}{note.entity_id != null ? ` #${note.entity_id}` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {note.author_name || 'Analyst'} · {formatDate(note.created_at)}
                  </span>
                  {!isEditing && (
                    <>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '2px 8px' }}
                        onClick={() => startEdit(note)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: 11, padding: '2px 8px', color: 'var(--red)' }}
                        onClick={() => handleDelete(note)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              {isEditing ? (
                <div style={{ marginTop: 8 }}>
                  <select
                    className="inline-select"
                    value={editNoteType}
                    onChange={e => setEditNoteType(e.target.value)}
                    style={{ marginBottom: 6, fontSize: 12 }}
                  >
                    {NOTE_TYPES.map(nt => (
                      <option key={nt.value} value={nt.value}>{nt.label}</option>
                    ))}
                  </select>
                  <textarea
                    style={{
                      width: '100%',
                      minHeight: 72,
                      background: 'var(--bg-primary)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 4,
                      padding: '6px 8px',
                      fontSize: 13,
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box',
                    }}
                    value={editBody}
                    onChange={e => setEditBody(e.target.value)}
                  />
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: 11 }}
                      disabled={!editBody.trim() || saving}
                      onClick={() => handleSaveEdit(note)}
                    >
                      {saving ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      className="btn btn-secondary"
                      style={{ fontSize: 11 }}
                      onClick={() => setEditId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {note.body}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
