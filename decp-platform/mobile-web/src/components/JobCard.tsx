interface SalaryObj { min?: number; max?: number; period?: string; currency?: string }

interface Job {
  id: string
  title: string
  company?: string
  location?: string
  type?: string
  jobType?: string
  employmentType?: string
  description?: string
  salary?: string | SalaryObj
  postedAt?: string
  createdAt?: string
}

function formatSalary(salary?: string | SalaryObj): string | null {
  if (!salary) return null
  if (typeof salary === 'string') return salary
  const { min, max, currency = 'USD', period = 'year' } = salary
  if (min && max) return `${currency} ${min.toLocaleString()} – ${max.toLocaleString()} / ${period}`
  if (min) return `${currency} ${min.toLocaleString()}+ / ${period}`
  if (max) return `Up to ${currency} ${max.toLocaleString()} / ${period}`
  return null
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  'Full-time': { bg: '#dcfce7', text: '#16a34a' },
  'Part-time': { bg: '#dbeafe', text: '#1d4ed8' },
  'Contract': { bg: '#fef3c7', text: '#d97706' },
  'Internship': { bg: '#f3e8ff', text: '#7c3aed' },
  'Remote': { bg: '#f0fdf4', text: '#059669' },
}

function getTypeColor(type?: string) {
  if (!type) return { bg: '#f3f4f6', text: '#6b7280' }
  return TYPE_COLORS[type] || { bg: '#f3f4f6', text: '#6b7280' }
}

function getCompanyInitials(company?: string): string {
  if (!company) return '?'
  return company.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
}

const COMPANY_COLORS = ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#06b6d4']
function getCompanyColor(name?: string): string {
  if (!name) return '#6b7280'
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length]
}

export default function JobCard({ job }: { job: Job }) {
  const type = job.type || job.jobType || job.employmentType
  const typeStyle = getTypeColor(type)
  const companyColor = getCompanyColor(job.company)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        marginBottom: 12,
        padding: '16px',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Company logo placeholder */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: companyColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 16,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          {getCompanyInitials(job.company)}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#111827', fontFamily: 'Inter, sans-serif', lineHeight: 1.3 }}>
            {job.title}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            {job.company || 'Unknown Company'}
          </div>
        </div>
      </div>

      {/* Meta info */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {type && (
          <span
            style={{
              background: typeStyle.bg,
              color: typeStyle.text,
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {type}
          </span>
        )}
        {job.location && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#9ca3af" strokeWidth="2"/>
              <circle cx="12" cy="10" r="3" stroke="#9ca3af" strokeWidth="2"/>
            </svg>
            {job.location}
          </span>
        )}
        {formatSalary(job.salary) && (
          <span style={{ fontSize: 12, color: '#059669', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
            {formatSalary(job.salary)}
          </span>
        )}
      </div>

      {/* Description snippet */}
      {job.description && (
        <p
          style={{
            marginTop: 10,
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
          {job.description}
        </p>
      )}

      {/* Apply button */}
      <button
        style={{
          marginTop: 14,
          width: '100%',
          padding: '10px 0',
          borderRadius: 14,
          background: 'linear-gradient(135deg, #059669, #10b981)',
          color: '#fff',
          fontWeight: 600,
          fontSize: 14,
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.01em',
        }}
      >
        Apply Now
      </button>
    </div>
  )
}
