interface Event {
  id: string
  title: string
  description?: string
  date?: string
  startDate?: string
  location?: string
  venue?: string
  attendeesCount?: number
  _count?: { attendees?: number }
  coverImage?: string
  category?: string
}

const GRADIENTS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
]

function getGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export default function EventCard({ event }: { event: Event }) {
  const gradient = getGradient(event.id)
  const dateStr = event.date || event.startDate
  const location = event.location || event.venue
  const attendees = event.attendeesCount ?? event._count?.attendees ?? 0

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Gradient header */}
      <div
        style={{
          height: 100,
          background: event.coverImage ? `url(${event.coverImage}) center/cover` : gradient,
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          padding: '12px 16px',
        }}
      >
        {/* Overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />

        {event.category && (
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              background: 'rgba(255,255,255,0.25)',
              backdropFilter: 'blur(8px)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: 20,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {event.category}
          </span>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px' }}>
        <h3
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: '#111827',
            fontFamily: 'Inter, sans-serif',
            margin: '0 0 10px',
            lineHeight: 1.3,
          }}
        >
          {event.title}
        </h3>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {dateStr && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(16,185,129,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="18" rx="2" stroke="#10b981" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="8" y1="2" x2="8" y2="6" stroke="#10b981" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="3" y1="10" x2="21" y2="10" stroke="#10b981" strokeWidth="2"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                {formatDate(dateStr)}
                {formatTime(dateStr) && ` · ${formatTime(dateStr)}`}
              </span>
            </div>
          )}

          {location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(59,130,246,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="#3b82f6" strokeWidth="2"/>
                  <circle cx="12" cy="10" r="3" stroke="#3b82f6" strokeWidth="2"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                {location}
              </span>
            </div>
          )}

          {attendees > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background: 'rgba(139,92,246,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#8b5cf6" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: 12, color: '#374151', fontFamily: 'Inter, sans-serif' }}>
                {attendees} attending
              </span>
            </div>
          )}
        </div>

        {/* RSVP */}
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
          }}
        >
          RSVP
        </button>
      </div>
    </div>
  )
}
