import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import api from '../api'

interface Message {
  id: string
  content: string
  senderId: string
  createdAt: string
  sender?: { id: string; firstName: string; lastName: string }
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Hi! I saw your research on smart traffic systems. Very impressive work!',
    senderId: 'other',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: '2',
    content: 'Thank you! It took about 6 months of data collection and model training.',
    senderId: 'me',
    createdAt: new Date(Date.now() - 3540000).toISOString(),
  },
  {
    id: '3',
    content: 'Would you be interested in collaborating on extending it to public transport?',
    senderId: 'other',
    createdAt: new Date(Date.now() - 3480000).toISOString(),
  },
  {
    id: '4',
    content: 'That sounds like a great idea! I\'ve been thinking about that too.',
    senderId: 'me',
    createdAt: new Date(Date.now() - 3420000).toISOString(),
  },
  {
    id: '5',
    content: 'Let\'s schedule a meeting this week to discuss the proposal.',
    senderId: 'other',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
]

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b']
function getColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function ChatScreen() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const { user } = useAuth()
  const participant = location.state?.participant || { firstName: 'Unknown', lastName: '' }
  const participantName = `${participant.firstName} ${participant.lastName || ''}`.trim()
  const avatarColor = getColor(participantName)
  const initials = `${participant.firstName[0]}${(participant.lastName || '')[0] || ''}`.toUpperCase()

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/conversations/${id}/messages`)
        const data = res.data?.messages || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          setMessages(data)
        } else {
          setMessages(MOCK_MESSAGES)
        }
      } catch {
        setMessages(MOCK_MESSAGES)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    const newMsg: Message = {
      id: Date.now().toString(),
      content,
      senderId: user?.id || 'me',
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, newMsg])
    setSending(true)
    try {
      await api.post(`/conversations/${id}/messages`, { content })
    } catch {
      // Keep optimistic update
    }
    setSending(false)
  }

  const isOwn = (msg: Message): boolean => {
    return msg.senderId === user?.id || msg.senderId === 'me' || msg.sender?.id === user?.id
  }

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = []
  messages.forEach((msg) => {
    const dateStr = new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const last = groupedMessages[groupedMessages.length - 1]
    if (last && last.date === dateStr) {
      last.msgs.push(msg)
    } else {
      groupedMessages.push({ date: dateStr, msgs: [msg] })
    }
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <TopBar
        title={participantName}
        showBack
        rightAction={
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 12,
              color: '#fff',
            }}
          >
            {initials}
          </div>
        }
      />

      {/* Messages area */}
      <div
        className="phone-content scrollbar-hide"
        style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {groupedMessages.map(({ date, msgs }) => (
              <div key={date}>
                {/* Date separator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0' }}>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                  <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>
                    {date}
                  </span>
                  <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
                </div>

                {msgs.map((msg, i) => {
                  const own = isOwn(msg)
                  const showAvatar = !own && (i === 0 || isOwn(msgs[i - 1]))
                  return (
                    <div
                      key={msg.id}
                      className="msg-animate"
                      style={{
                        display: 'flex',
                        justifyContent: own ? 'flex-end' : 'flex-start',
                        marginBottom: 4,
                        alignItems: 'flex-end',
                        gap: 6,
                      }}
                    >
                      {/* Other avatar */}
                      {!own && (
                        <div style={{ width: 28, flexShrink: 0 }}>
                          {showAvatar && (
                            <div
                              style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                background: avatarColor,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: 10,
                                color: '#fff',
                              }}
                            >
                              {initials}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Bubble */}
                      <div style={{ maxWidth: '75%' }}>
                        <div
                          style={{
                            padding: '10px 14px',
                            borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: own ? 'linear-gradient(135deg, #059669, #10b981)' : '#fff',
                            color: own ? '#fff' : '#111827',
                            fontSize: 13.5,
                            lineHeight: 1.45,
                            fontFamily: 'Inter, sans-serif',
                            boxShadow: own ? '0 2px 8px rgba(16,185,129,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
                            border: own ? 'none' : '1px solid #f3f4f6',
                            wordBreak: 'break-word',
                          }}
                        >
                          {msg.content}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: '#9ca3af',
                            fontFamily: 'Inter, sans-serif',
                            marginTop: 3,
                            textAlign: own ? 'right' : 'left',
                          }}
                        >
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: '10px 14px 12px',
          background: '#fff',
          borderTop: '1px solid #f3f4f6',
          display: 'flex',
          gap: 10,
          alignItems: 'flex-end',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            background: '#f9fafb',
            borderRadius: 20,
            border: '1.5px solid #e5e7eb',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Type a message…"
            rows={1}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              resize: 'none',
              fontSize: 13.5,
              fontFamily: 'Inter, sans-serif',
              color: '#111827',
              lineHeight: 1.5,
              maxHeight: 80,
              overflow: 'auto',
            }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            border: 'none',
            background: text.trim() ? 'linear-gradient(135deg, #059669, #10b981)' : '#e5e7eb',
            cursor: text.trim() ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.2s',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke={text.trim() ? '#fff' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
            <polygon
              points="22 2 15 22 11 13 2 9 22 2"
              stroke={text.trim() ? '#fff' : '#9ca3af'}
              strokeWidth="2"
              strokeLinecap="round"
              fill={text.trim() ? 'rgba(255,255,255,0.15)' : 'none'}
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
