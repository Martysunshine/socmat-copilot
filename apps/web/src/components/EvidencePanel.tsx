import { useRef, useState } from 'react'
import { uploadEvidence, type Evidence } from '../api/evidence'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

interface Props {
  caseId: number
  items: Evidence[]
  loading: boolean
  error: string | null
  onUpload: (ev: Evidence) => void
}

export default function EvidencePanel({ caseId, items, loading, error, onUpload }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const ev = await uploadEvidence(caseId, file, notes)
      onUpload(ev)
      setNotes('')
      if (fileRef.current) fileRef.current.value = ''
    } catch (e: unknown) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="panel-section">
      <div className="panel-section-title">Evidence &amp; Files</div>

      <div className="evidence-upload-area">
        <div className="form-row">
          <label>File</label>
          <input type="file" ref={fileRef} className="file-input" />
        </div>
        <div className="form-row">
          <label>Notes <span className="label-optional">(optional)</span></label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Brief description of this file"
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : 'Upload Evidence'}
        </button>
        {uploadError && <div className="upload-error">{uploadError}</div>}
      </div>

      {loading && <div className="state-box">Loading evidence…</div>}
      {error && <div className="state-box state-error"><strong>Error</strong><p>{error}</p></div>}

      {!loading && !error && items.length === 0 && (
        <div className="state-box">
          <p>No evidence uploaded yet. Use the form above to attach files to this case.</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="evidence-table-wrap">
          <table className="evidence-table">
            <thead>
              <tr>
                <th>Filename</th>
                <th>Type</th>
                <th>Size</th>
                <th>SHA-256</th>
                <th>Uploaded</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {items.map(ev => (
                <tr key={ev.id}>
                  <td className="evidence-filename">{ev.original_filename}</td>
                  <td>{ev.file_type ?? '—'}</td>
                  <td>{formatBytes(ev.file_size)}</td>
                  <td className="evidence-hash" title={ev.sha256}>
                    {ev.sha256.slice(0, 16)}…
                  </td>
                  <td>{formatDate(ev.uploaded_at)}</td>
                  <td>{ev.notes ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
