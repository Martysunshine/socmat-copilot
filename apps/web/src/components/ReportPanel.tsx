import { useEffect, useState } from 'react'
import { generateReport, getReport, getReportContent, downloadReportPdf, type Report } from '../api/reports'

interface Props {
  caseId: number
  caseTitle: string
}

export default function ReportPanel({ caseId, caseTitle }: Props) {
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getReport(caseId)
      .then(setReport)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [caseId])

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    setPreviewContent(null)
    setPreviewing(false)
    try {
      const r = await generateReport(caseId)
      setReport(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Report generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePreview() {
    if (previewing) {
      setPreviewing(false)
      return
    }
    try {
      const content = await getReportContent(caseId)
      setPreviewContent(content)
      setPreviewing(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load report content')
    }
  }

  async function handleDownload() {
    try {
      const content = previewContent ?? await getReportContent(caseId)
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `incident-report-case-${caseId}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Download failed')
    }
  }

  async function handleDownloadPdf() {
    setDownloadingPdf(true)
    setError(null)
    try {
      await downloadReportPdf(caseId)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'PDF generation failed')
    } finally {
      setDownloadingPdf(false)
    }
  }

  function formatTs(iso: string) {
    return new Date(iso).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="panel-section">
      <div className="panel-section-header">
        <div className="panel-section-title" style={{ marginBottom: 0 }}>Incident Report</div>
        <button
          className="btn btn-primary"
          onClick={handleGenerate}
          disabled={generating}
        >
          {generating ? 'Generating…' : report ? 'Regenerate Report' : 'Generate Report'}
        </button>
      </div>

      {error && <div className="upload-error" style={{ marginTop: 12 }}>{error}</div>}

      {loading ? (
        <div className="state-box" style={{ padding: '12px 0', marginTop: 8 }}>Loading report…</div>
      ) : report ? (
        <div className="report-meta">
          <div className="report-meta-row">
            <span className="report-meta-label">Generated</span>
            <span className="report-meta-value">{formatTs(report.generated_at)}</span>
          </div>
          <div className="report-meta-row">
            <span className="report-meta-label">Format</span>
            <span className="report-meta-value report-format-badge">Markdown</span>
          </div>
          {report.summary && (
            <div className="report-meta-row report-summary-row">
              <span className="report-meta-label">Summary</span>
              <span className="report-meta-value report-summary-text">{report.summary}</span>
            </div>
          )}
          <div className="report-actions">
            <button
              className="btn btn-secondary"
              onClick={handlePreview}
            >
              {previewing ? 'Hide Preview' : 'Preview Report'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDownload}
            >
              Download .md
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? 'Generating PDF…' : 'Download PDF'}
            </button>
          </div>

          {previewing && previewContent && (
            <div className="report-preview">
              <pre className="report-preview-content">{previewContent}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="state-box" style={{ marginTop: 12 }}>
          No report generated yet for <strong>{caseTitle}</strong>. Click{' '}
          <strong>Generate Report</strong> to create a structured Markdown incident report
          from all case findings.
        </div>
      )}
    </div>
  )
}
