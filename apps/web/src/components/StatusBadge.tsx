import './StatusBadge.css'

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-chip status-chip--${status}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
