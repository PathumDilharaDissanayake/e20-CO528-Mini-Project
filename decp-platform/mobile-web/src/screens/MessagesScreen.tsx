import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const MOCK_CONVERSATIONS = [
  {
    id: '1',
    participant: { id: 'u2', firstName: 'Dr. Anjali', lastName: 'Perera', role: 'Faculty', avatar: '' },
    lastMessage: { content: 'Your research proposal looks great! Let\'s discuss further.', createdAt: new Date(Date.now() - 1800000).toISOString(), isRead: false },
  },
  {
    id: '2',
    participant: { id: 'u3', firstName: 'Tharaka', lastName: 'Weerasinghe', role: 'Alumni', avatar: '' },
    lastMessage: { content: 'I can refer you to the hiring manager at my company.', createdAt: new Date(Date.now() - 3600000).toISOString(), isRead: true },
  },
  {
    id: '3',
    participant: { id: 'u4', firstName: 'Kasun', lastName: 'Silva', role: 'Student', avatar: '' },
    lastMessage: { content: 'Are you going to the hackathon this weekend?', createdAt: new Date(Date.now() - 7200000).toISOString(), isRead: true },
  },
  {
    id: '4',
    participant: { id: 'u5', firstName: 'Nimal', lastName: 'Bandara', role: 'Faculty', avatar: '' },
    lastMessage: { content: 'Please submit your assignment before Friday.', createdAt: new Date(Date.now() - 86400000).toISOString(), isRead: true },
  },
  {
    id: '5',
    participant: { id: 'u6', firstName: 'Amaya', lastName: 'Fernando', role: 'Student', avatar: '' },
    lastMessage: { content: 'Thanks for sharing the lecture notes!', createdAt: new Date(Date.now() - 172800000).toISOString(), isRead: true },
  },
]

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4']
function getColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function MessagesScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/conversations')
        const data = res.data?.conversations || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          setConversations(data)
        } else {
          setConversations(MOCK_CONVERSATIONS)
        }
      } catch {
        setConversations(MOCK_CONVERSATIONS)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const filtered = conversations.filter((c) => {
    if (!search) return true
    const name = `${c.participant?.firstName || ''} ${c.participant?.lastName || ''}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <TopBar
        title="Messages"
        rightAction={
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="8" x2="12" y2="12" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
              <line x1="10" y1="10" x2="14" y2="10" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Search */}
        <div style={{ padding: '12px 14px 8px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: '#111827',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon="💬" title="No conversations" subtitle="Start a new conversation with someone" />
        ) : (
          <div style={{ padding: '0 0 8px' }}>
            {filtered.map((conv) => {
              const participant = conv.participant || conv.otherUser || conv.user
              const firstName = participant?.firstName || 'Unknown'
              const lastName = participant?.lastName || ''
              const fullName = `${firstName} ${lastName}`.trim()
              const initials = `${firstName[0]}${lastName[0] || ''}`.toUpperCase()
              const color = getColor(fullName)
              const lastMsg = conv.lastMessage || conv.lastMsg
              const isUnread = lastMsg && !lastMsg.isRead

              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/messages/${conv.id}`, { state: { participant, convId: conv.id } })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f9fafb',
                    background: isUnread ? 'rgba(16,185,129,0.03)' : '#fff',
                    transition: 'background 0.15s',
                    gap: 12,
                  }}
                >
                  {/* Avatar */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {participant?.avatar ? (
                      <img
                        src={participant.avatar}
                        alt={fullName}
                        style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 50,
                          height: 50,
                          borderRadius: '50%',
                          background: color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 17,
                          color: '#fff',
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    {/* Online indicator */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: '#22c55e',
                        border: '2px solid #fff',
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span
                        style={{
                          fontWeight: isUnread ? 700 : 600,
                          fontSize: 14,
                          color: '#111827',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        {fullName}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', flexShrink: 0, marginLeft: 8 }}>
                        {lastMsg && timeAgo(lastMsg.createdAt)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span
                        style={{
                          fontSize: 12,
                          color: isUnread ? '#374151' : '#9ca3af',
                          fontFamily: 'Inter, sans-serif',
                          fontWeight: isUnread ? 500 : 400,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 200,
                        }}
                      >
                        {lastMsg?.content || 'Start a conversation'}
                      </span>
                      {isUnread && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#10b981',
                            flexShrink: 0,
                            marginLeft: 8,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
