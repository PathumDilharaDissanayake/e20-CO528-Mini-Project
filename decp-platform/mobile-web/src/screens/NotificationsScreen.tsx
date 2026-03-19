import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../api'

const TYPE_STYLES: Record<string, { color: string; bg: string; border: string; icon: JSX.Element }> = {
  like: {
    color: '#F066B0', bg: 'rgba(240,102,176,0.1)', border: 'rgba(240,102,176,0.2)',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="#F066B0"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  },
  comment: {
    color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.2)',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#4F8EF7" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  connection: {
    color: '#00D98A', bg: 'rgba(0,217,138,0.1)', border: 'rgba(0,217,138,0.2)',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#00D98A" strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke="#00D98A" strokeWidth="2"/></svg>,
  },
  message: {
    color: '#A066FA', bg: 'rgba(160,102,250,0.1)', border: 'rgba(160,102,250,0.2)',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#A066FA" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
  post: {
    color: '#00E5CC', bg: 'rgba(0,229,204,0.1)', border: 'rgba(0,229,204,0.2)',
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#00E5CC" strokeWidth="2"/><path d="M8 10h8M8 14h5" stroke="#00E5CC" strokeWidth="2" strokeLinecap="round"/></svg>,
  },
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/notifications?limit=50')
        const data = res.data?.notifications || res.data?.data?.notifications || res.data?.data || res.data
        if (Array.isArray(data)) setNotifications(data)
      } catch { /* silent */ } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const markAllRead = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch { /* silent */ }
  }

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id || n._id === id ? { ...n, isRead: true } : n))
    try { await api.put(`/notifications/${id}/read`) } catch { /* silent */ }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const filtered = notifications.filter((n) => filter === 'unread' ? !n.isRead : true)

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Notifications"
        rightAction={
          unreadCount > 0 ? (
            <button
              onClick={markAllRead}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#00D98A', fontSize: 11, fontWeight: 600, minHeight: 44, padding: '0 4px' }}
            >
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div style={{ borderRadius: 16, background: 'rgba(0,217,138,0.06)', border: '1px solid rgba(0,217,138,0.15)', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: '#E8FFF4' }}>
                {unreadCount} new {unreadCount === 1 ? 'notification' : 'notifications'}
              </div>
              <div style={{ fontSize: 12, color: '#7A9E8E' }}>Tap to dismiss</div>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,217,138,0.12)', border: '1px solid rgba(0,217,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {['all', 'unread'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ flex: 1, padding: '9px', borderRadius: 14, border: filter === f ? '1px solid rgba(0,217,138,0.35)' : '1px solid rgba(0,217,138,0.1)', minHeight: 44, background: filter === f ? 'rgba(0,217,138,0.1)' : 'transparent', color: filter === f ? '#00D98A' : '#2D4A3E', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'All' : `Unread (${unreadCount})`}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ color: '#7A9E8E', fontSize: 14 }}>{filter === 'unread' ? 'All caught up!' : 'No notifications yet'}</p>
          </div>
        ) : (
          filtered.map((n) => {
            const nId = n.id || n._id
            const type = (n.type || 'post').toLowerCase()
            const style = TYPE_STYLES[type] || TYPE_STYLES.post
            const isUnread = !n.isRead

            return (
              <div
                key={nId}
                onClick={() => markRead(nId)}
                className="animate-fade-in-up"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 14px',
                  background: isUnread ? 'rgba(0,217,138,0.04)' : 'rgba(8,18,12,0.6)',
                  backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(0,217,138,0.08)',
                  borderLeft: isUnread ? `3px solid ${style.color}` : '1px solid rgba(0,217,138,0.08)',
                  borderRadius: 14, marginBottom: 8, cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 11, background: style.bg, border: `1px solid ${style.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {style.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, color: '#A8C8BA', lineHeight: 1.5, margin: '0 0 4px', wordBreak: 'break-word' }}>
                    {n.message || n.title || n.body || `New ${type} notification`}
                  </p>
                  <span style={{ fontSize: 11, color: '#2D4A3E' }}>{timeAgo(n.createdAt)}</span>
                </div>
                {isUnread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: style.color, flexShrink: 0, marginTop: 5 }} />}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
