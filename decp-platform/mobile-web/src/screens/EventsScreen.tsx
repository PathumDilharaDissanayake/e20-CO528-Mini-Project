import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import EventCard from '../components/EventCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import api from '../api'

const MOCK_EVENTS = [
  {
    id: '1',
    title: 'Annual Engineering Symposium 2025',
    description: 'Join us for the biggest engineering event of the year featuring keynote speakers, workshops, and networking sessions.',
    date: new Date(Date.now() + 7 * 86400000).toISOString(),
    location: 'University Auditorium, Peradeniya',
    attendeesCount: 312,
    category: 'Symposium',
  },
  {
    id: '2',
    title: 'Hackathon: AI for Good',
    description: '48-hour hackathon focused on building AI solutions for social impact. Form a team of 2-4 members and compete.',
    date: new Date(Date.now() + 14 * 86400000).toISOString(),
    location: 'Faculty of Engineering',
    attendeesCount: 89,
    category: 'Hackathon',
  },
  {
    id: '3',
    title: 'Career Fair 2025',
    description: 'Meet representatives from 50+ top tech companies. Bring your CV and be ready for on-spot interviews.',
    date: new Date(Date.now() + 21 * 86400000).toISOString(),
    location: 'Engineering Faculty, Ground Floor',
    attendeesCount: 450,
    category: 'Career',
  },
  {
    id: '4',
    title: 'Research Paper Writing Workshop',
    description: 'Learn how to write and publish research papers in top-tier IEEE and ACM conferences.',
    date: new Date(Date.now() + 3 * 86400000).toISOString(),
    location: 'Seminar Room 3, New Block',
    attendeesCount: 45,
    category: 'Workshop',
  },
  {
    id: '5',
    title: 'Alumni Networking Evening',
    description: 'An exclusive evening for alumni and students to connect, share experiences and opportunities.',
    date: new Date(Date.now() + 30 * 86400000).toISOString(),
    location: 'Hotel Suisse, Kandy',
    attendeesCount: 120,
    category: 'Networking',
  },
]

const DATE_FILTERS = ['All', 'This Week', 'This Month']

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  return d >= now && d <= weekEnd
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export default function EventsScreen() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState('All')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get('/events')
        const data = res.data?.events || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data)
        } else {
          setEvents(MOCK_EVENTS)
        }
      } catch {
        setEvents(MOCK_EVENTS)
      } finally {
        setLoading(false)
      }
    }
    fetchEvents()
  }, [])

  const filtered = events.filter((e) => {
    const dateStr = e.date || e.startDate
    if (dateFilter === 'This Week') return dateStr && isThisWeek(dateStr)
    if (dateFilter === 'This Month') return dateStr && isThisMonth(dateStr)
    return true
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <TopBar
        title="Events"
        rightAction={
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Date filter chips */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 14px 0' }}>
          {DATE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setDateFilter(f)}
              style={{
                padding: '7px 16px',
                borderRadius: 20,
                border: dateFilter === f ? 'none' : '1px solid #e5e7eb',
                background: dateFilter === f ? '#10b981' : '#fff',
                color: dateFilter === f ? '#fff' : '#6b7280',
                fontSize: 12,
                fontWeight: dateFilter === f ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{ padding: '10px 14px 6px' }}>
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} upcoming {filtered.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        {/* Events list */}
        <div style={{ padding: '0 14px 8px' }}>
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState icon="🗓️" title="No events found" subtitle="Check back later for upcoming events" />
          ) : (
            filtered.map((event) => <EventCard key={event.id} event={event} />)
          )}
        </div>
      </div>
    </div>
  )
}
