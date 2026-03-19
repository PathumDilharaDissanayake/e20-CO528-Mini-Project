interface Research {
  id: string
  title: string
  description?: string
  field?: string
  researchField?: string
  status?: string
  progress?: number
  membersCount?: number
  _count?: { members?: number }
  createdAt?: string
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
  ongoing: { bg: '#dcfce7', text: '#16a34a', dot: '#22c55e' },
  completed: { bg: '#dbeafe', text: '#1d4ed8', dot: '#3b82f6' },
  planning: { bg: '#fef3c7', text: '#d97706', dot: '#f59e0b' },
  paused: { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' },
  recruiting: { bg: '#f3e8ff', text: '#7c3aed', dot: '#8b5cf6' },
}

function getStatusStyle(status?: string) {
  const key = (status || '').toLowerCase()
  return STATUS_STYLES[key] || { bg: '#f3f4f6', text: '#6b7280', dot: '#9ca3af' }
}

const FIELD_COLORS = [
  { bg: '#eff6ff', text: '#1d4ed8' },
  { bg: '#f0fdf4', text: '#15803d' },
  { bg: '#fdf4ff', text: '#7e22ce' },
  { bg: '#fff7ed', text: '#c2410c' },
  { bg: '#f0fdfa', text: '#0f766e' },
]

function getFieldColor(field?: string) {
  if (!field) return FIELD_COLORS[0]
  let hash = 0
  for (let i = 0; i < field.length; i++) hash = field.charCodeAt(i) + ((hash << 5) - hash)
  return FIELD_COLORS[Math.abs(hash) % FIELD_COLORS.length]
}

export default function ResearchCard({ project }: { project: Research }) {
  const field = project.field || project.researchField
  const statusStyle = getStatusStyle(project.status)
  const fieldColor = getFieldColor(field)
  const progress = project.progress ?? Math.floor(Math.random() * 80 + 10)
  const members = project.membersCount ?? project._count?.members ?? 0

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        marginBottom: 12,
        padding: '16px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: '#111827',
            fontFamily: 'Inter, sans-serif',
            margin: 0,
            lineHeight: 1.3,
            flex: 1,
          }}
        >
          {project.title}
        </h3>

        {/* Status badge */}
        <span
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 20,
            fontFamily: 'Inter, sans-serif',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusStyle.dot, flexShrink: 0 }} />
          {project.status ? project.status.charAt(0).toUpperCase() + project.status.slice(1) : 'Unknown'}
        </span>
      </div>

      {/* Field chip */}
      {field && (
        <span
          style={{
            display: 'inline-block',
            marginTop: 8,
            background: fieldColor.bg,
            color: fieldColor.text,
            fontSize: 11,
            fontWeight: 500,
            padding: '2px 10px',
            borderRadius: 8,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {field}
        </span>
      )}

      {/* Description */}
      {project.description && (
        <p
          style={{
            marginTop: 8,
            fontSize: 13,
            color: '#6b7280',
            lineHeight: 1.5,
            fontFamily: 'Inter, sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {project.description}
        </p>
      )}

      {/* Progress bar */}
      <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>Progress</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
            {progress}%
          </span>
        </div>
        <div
          style={{
            height: 6,
            borderRadius: 3,
            background: '#f3f4f6',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 3,
              background: 'linear-gradient(90deg, #059669, #10b981)',
              transition: 'width 0.5s ease',
            }}
          />
        </div>
      </div>

      {/* Footer */}
      {members > 0 && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="#9ca3af" strokeWidth="2"/>
          </svg>
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
            {members} {members === 1 ? 'member' : 'members'}
          </span>
        </div>
      )}
    </div>
  )
}
