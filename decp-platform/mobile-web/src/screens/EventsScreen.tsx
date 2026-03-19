import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api, { resolveImageUrl } from '../api'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const EVENT_COLORS = ['#00D98A','#00E5CC','#4F8EF7','#A066FA','#F066B0','#B5E853']
function getColor(s: string) {
  let h = 0; for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h)
  return EVENT_COLORS[Math.abs(h) % EVENT_COLORS.length]
}

const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.12)', fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box' as const }

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('upcoming')
  const [rsvped, setRsvped] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '', type: 'seminar' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/events?limit=30')
        const data = res.data?.events || res.data?.data?.events || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) setEvents(data)
      } catch { /* silent */ } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleRsvp = async (eventId: string) => {
    setRsvped((p) => new Set(p).add(eventId))
    try { await api.post(`/events/${eventId}/rsvp`) } catch { /* silent */ }
  }

  const handleCreate = async () => {
    if (!newEvent.title || !newEvent.date) return
    setPosting(true)
    try {
      const res = await api.post('/events', newEvent)
      const created = res.data?.event || res.data?.data?.event || res.data
      setEvents((p) => [created, ...p])
      setShowCreate(false)
      setNewEvent({ title: '', description: '', date: '', location: '', type: 'seminar' })
    } catch { /* silent */ } finally { setPosting(false) }
  }

  const FILTERS = ['upcoming', 'ongoing', 'past']
  const now = Date.now()
  const filtered = events.filter((e) => {
    const d = new Date(e.date || e.startDate).getTime()
    if (filter === 'upcoming') return d > now
    if (filter === 'past') return d < now
    return true
  })

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Events"
        rightAction={
          <button onClick={() => setShowCreate(true)} aria-label="Create event" style={{ border: '1px solid rgba(0,229,204,0.2)', background: 'rgba(0,229,204,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#00E5CC', fontSize: 12, fontWeight: 700, minHeight: 44 }}>
            Create
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {/* Hero */}
        <div style={{ borderRadius: 18, background: 'rgba(0,229,204,0.05)', border: '1px solid rgba(0,229,204,0.12)', padding: '16px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 17, color: '#E8FFF4', margin: '0 0 3px' }}>Campus Events</h2>
            <p style={{ fontSize: 12, color: '#7A9E8E', margin: 0 }}>{events.length} events listed</p>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex: 1, padding: '9px 0', borderRadius: 14, border: filter === f ? '1px solid rgba(0,217,138,0.35)' : '1px solid rgba(0,217,138,0.1)', minHeight: 44, background: filter === f ? 'rgba(0,217,138,0.1)' : 'transparent', color: filter === f ? '#00D98A' : '#2D4A3E', fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {f}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A9E8E', fontSize: 14 }}>No events found</div>
        ) : (
          filtered.map((event) => {
            const eventId = event.id || event._id
            const color = getColor(event.title || eventId)
            const isRsvped = rsvped.has(eventId) || event.isRsvped

            return (
              <div key={eventId} className="animate-fade-in-up" style={{ background: 'rgba(8,18,12,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 18, marginBottom: 10, overflow: 'hidden' }}>
                {/* Event banner image */}
                {resolveImageUrl(event.image || event.imageUrl || event.banner || event.coverImage) ? (
                  <img
                    src={resolveImageUrl(event.image || event.imageUrl || event.banner || event.coverImage)}
                    alt={event.title}
                    style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                ) : (
                  <div style={{ height: 2, background: color, opacity: 0.7 }} />
                )}
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: '#E8FFF4', margin: 0, flex: 1 }}>{event.title}</h3>
                    {event.type && <span style={{ padding: '3px 10px', borderRadius: 20, background: `${color}15`, color, border: `1px solid ${color}30`, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', marginLeft: 8, flexShrink: 0 }}>{event.type}</span>}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {(event.date || event.startDate) && <span style={{ fontSize: 12, color: '#7A9E8E' }}>📅 {formatDate(event.date || event.startDate)}</span>}
                    {event.location && <span style={{ fontSize: 12, color: '#7A9E8E' }}>📍 {event.location}</span>}
                    {event.attendeesCount !== undefined && <span style={{ fontSize: 12, color: '#7A9E8E' }}>👥 {event.attendeesCount} attending</span>}
                  </div>

                  {event.description && <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{event.description}</p>}

                  <button
                    onClick={() => handleRsvp(eventId)}
                    disabled={isRsvped}
                    className={isRsvped ? '' : 'btn-primary'}
                    style={isRsvped ? { width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(0,217,138,0.2)', background: 'rgba(0,217,138,0.06)', color: '#00D98A', fontWeight: 700, fontSize: 13, cursor: 'default', minHeight: 44 } : { width: '100%', padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 700, minHeight: 44 }}
                  >
                    {isRsvped ? '✓ RSVP\'d' : 'RSVP'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="animate-slide-up" style={{ background: '#080E0B', border: '1px solid rgba(0,217,138,0.15)', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(0,217,138,0.3)', margin: '12px auto 0' }} />
            <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,217,138,0.08)' }}>
              <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 17, color: '#E8FFF4', margin: 0 }}>Create Event</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Close" style={{ border: 'none', background: 'rgba(0,217,138,0.08)', cursor: 'pointer', borderRadius: 10, padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {[{ key: 'title', label: 'Event Title', placeholder: 'e.g. Tech Symposium 2026', type: 'text' }, { key: 'location', label: 'Location', placeholder: 'e.g. Lecture Hall A', type: 'text' }, { key: 'date', label: 'Date & Time', placeholder: '', type: 'datetime-local' }].map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input type={f.type} value={(newEvent as any)[f.key]} onChange={(e) => setNewEvent((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea value={newEvent.description} onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))} placeholder="Event details…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <button onClick={handleCreate} disabled={!newEvent.title || !newEvent.date || posting} className={newEvent.title && newEvent.date && !posting ? 'btn-primary' : ''} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, ...((!newEvent.title || !newEvent.date || posting) ? { background: 'rgba(255,255,255,0.04)', color: '#2D4A3E' } : {}) }}>
                {posting ? 'Creating…' : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
