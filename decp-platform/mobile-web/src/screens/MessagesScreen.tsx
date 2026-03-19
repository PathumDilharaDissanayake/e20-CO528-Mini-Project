import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import api, { resolveImageUrl } from '../api'
import Avatar from '../components/Avatar'

const AVATAR_COLORS = ['#00D98A','#00E5CC','#4F8EF7','#A066FA','#F066B0','#B5E853']
function getColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function resolveChatParticipant(conv: any, userId: string) {
  const participants = conv.participants || []
  if (conv.type === 'group') {
    return { name: conv.title || 'Group Chat', isGroup: true, members: participants.length, avatar: null }
  }
  const other = participants.find((p: any) => {
    const pid = p._id || p.id || p.userId || p
    return pid !== userId
  })
  if (!other || typeof other === 'string') {
    const participant = conv.participant || conv.otherUser
    if (participant) {
      return {
        name: `${participant.firstName || ''} ${participant.lastName || ''}`.trim() || 'User',
        isGroup: false,
        avatar: participant.avatar,
      }
    }
    return { name: 'Unknown User', isGroup: false, avatar: null }
  }
  return {
    name: `${other.firstName || ''} ${other.lastName || ''}`.trim() || 'User',
    isGroup: false,
    avatar: other.avatar,
    role: other.role,
  }
}

export default function MessagesScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations')
      const data = res.data?.conversations || res.data?.data?.conversations || res.data?.data || res.data
      if (Array.isArray(data)) setConversations(data)
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const fetchUsers = async (q: string) => {
    try {
      const res = await api.get(`/users/search?q=${encodeURIComponent(q)}&limit=20`)
      const data = res.data?.users || res.data?.data?.users || res.data?.data || []
      setUsers(Array.isArray(data) ? data : [])
    } catch { setUsers([]) }
  }

  useEffect(() => { fetchConversations() }, [])
  useEffect(() => { if (showNewChat) fetchUsers(userSearch) }, [userSearch, showNewChat])

  const startChat = async (otherUserId: string) => {
    try {
      const res = await api.post('/conversations', { type: 'direct', participants: [otherUserId] })
      const conv = res.data?.data?.conversation || res.data?.conversation || res.data?.data || res.data
      const convId = conv?.id || conv?._id
      setShowNewChat(false)
      if (convId) navigate(`/messages/${convId}`, { state: { conv } })
    } catch { /* ignore */ }
  }

  const filtered = conversations.filter((c) => {
    if (!search) return true
    const info = resolveChatParticipant(c, user?.id || '')
    return info.name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Messages"
        rightAction={
          <button
            onClick={() => setShowNewChat(true)}
            aria-label="New message"
            style={{
              width: 36, height: 36, borderRadius: 12,
              background: 'rgba(0,217,138,0.12)',
              border: '1px solid rgba(0,217,138,0.25)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 44, minHeight: 44, boxSizing: 'border-box',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#00D98A" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <line x1="12" y1="9" x2="12" y2="13" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="11" x2="14" y2="11" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Search */}
        <div style={{ padding: '12px 14px 8px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#2D4A3E" strokeWidth="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{
                width: '100%',
                padding: '11px 14px 11px 36px',
                borderRadius: 16,
                background: 'rgba(0,217,138,0.05)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(0,217,138,0.12)',
                fontSize: 13,
                color: '#E8FFF4',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ color: '#7A9E8E', fontSize: 14, marginBottom: 14 }}>No conversations yet</p>
            <button
              onClick={() => setShowNewChat(true)}
              className="btn-primary"
              style={{ padding: '11px 24px', borderRadius: 14, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, minHeight: 44 }}
            >
              Start a conversation
            </button>
          </div>
        ) : (
          <div>
            {filtered.map((conv) => {
              const info = resolveChatParticipant(conv, user?.id || '')
              const convId = conv.id || conv._id
              const lastMsg = conv.lastMessage || conv.lastMsg
              const color = getColor(info.name)
              const initials = info.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

              return (
                <div
                  key={convId}
                  onClick={() => navigate(`/messages/${convId}`, { state: { conv } })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(0,217,138,0.06)',
                    transition: 'background 0.15s',
                    gap: 12,
                    minHeight: 72,
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {resolveImageUrl(info.avatar) ? (
                      <img src={resolveImageUrl(info.avatar)} alt={info.name} style={{ width: 50, height: 50, borderRadius: info.isGroup ? '16px' : '50%', objectFit: 'cover', border: `2px solid ${color}40` }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : (
                      <div
                        style={{
                          width: 50, height: 50,
                          borderRadius: info.isGroup ? '16px' : '50%',
                          background: info.isGroup ? 'linear-gradient(135deg, #00D98A, #4F8EF7)' : color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 16, color: '#060C09',
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    <div style={{ position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: '50%', background: '#00D98A', border: '2px solid #060C09' }} />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {info.name}
                      </span>
                      <span style={{ fontSize: 11, color: '#2D4A3E', flexShrink: 0, marginLeft: 8, fontFamily: 'Space Grotesk, sans-serif' }}>
                        {lastMsg ? timeAgo(lastMsg.createdAt) : ''}
                      </span>
                    </div>
                    <span style={{ fontSize: 12, color: '#2D4A3E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontFamily: 'Space Grotesk, sans-serif' }}>
                      {lastMsg?.content || 'Start a conversation'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            className="animate-slide-up"
            style={{
              background: 'rgba(6,12,9,0.98)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(0,217,138,0.15)',
              borderTopLeftRadius: 30,
              borderTopRightRadius: 30,
              maxHeight: '75%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Handle */}
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(0,217,138,0.25)', margin: '12px auto 0' }} />

            <div style={{ padding: '14px 20px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,217,138,0.08)' }}>
              <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 17, color: '#E8FFF4', margin: 0 }}>New Message</h3>
              <button onClick={() => setShowNewChat(false)} aria-label="Close" style={{ border: 'none', background: 'rgba(0,217,138,0.08)', cursor: 'pointer', borderRadius: 12, padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '12px 16px 8px' }}>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search people…"
                autoFocus
                style={{ width: '100%', padding: '11px 14px', borderRadius: 16, background: 'rgba(0,217,138,0.05)', border: '1px solid rgba(0,217,138,0.15)', fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box' }}
              />
            </div>
            <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '0 0 16px' }}>
              {users.map((u) => {
                const uid = u._id || u.id
                const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'User'
                return (
                  <div
                    key={uid}
                    onClick={() => startChat(uid)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(0,217,138,0.06)', minHeight: 62, transition: 'background 0.15s' }}
                  >
                    <Avatar src={u.avatar || u.profilePicture} name={name} size={44} />
                    <div>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#7A9E8E', textTransform: 'capitalize', fontFamily: 'Space Grotesk, sans-serif' }}>{u.role || 'Member'}</div>
                    </div>
                  </div>
                )
              })}
              {users.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 16px', color: '#2D4A3E', fontSize: 13, fontFamily: 'Space Grotesk, sans-serif' }}>
                  {userSearch ? 'No users found' : 'Search for someone to message'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
