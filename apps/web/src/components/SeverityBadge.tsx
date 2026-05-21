import './SeverityBadge.css'

type Severity = 'low' | 'medium' | 'high' | 'critical'

export default function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={`severity-badge severity-badge--${severity as Severity}`}>
      {severity}
    </span>
  )
}
