import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import Avatar from '../components/Avatar'

const SOCKET_URL = 'http://localhost:3007'
const AVATAR_COLORS = ['#00D98A','#00E5CC','#4F8EF7','#A066FA','#F066B0','#B5E853']
function getColor(name: string): string {
  let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function timeStr(d: string) { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }

let _socketSingleton: Socket | null = null

export default function ChatScreen() {
  const { id: convId } = useParams<{ id: string }>()
  const location = useLocation()
  const { user, token } = useAuth()
  const conv = (location.state as any)?.conv
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<any[]>([])
  const [localMessages, setLocalMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const participants = conv?.participants || []
  const isGroup = conv?.type === 'group'
  const chatName = isGroup
    ? conv?.title || 'Group Chat'
    : (() => {
        const other = participants.find((p: any) => (p._id || p.id) !== user?.id)
        return other ? `${other.firstName || ''} ${other.lastName || ''}`.trim() : 'Chat'
      })()
  const otherParticipant = participants.find((p: any) => (p._id || p.id) !== user?.id)
  const otherAvatar = !isGroup ? (otherParticipant?.avatar || otherParticipant?.profilePicture) : null

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/conversations/${convId}/messages?limit=50`)
      const data = res.data?.data || res.data?.messages || res.data
      if (Array.isArray(data)) { setMessages(data); setLocalMessages([]) }
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!_socketSingleton) {
      _socketSingleton = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'], reconnection: true })
    }
    const socket = _socketSingleton
    const onConnect = () => { setIsConnected(true); socket.emit('join-chat', convId); socket.emit('joinChat', convId) }
    const onDisconnect = () => setIsConnected(false)
    if (socket.connected) { onConnect() } else { socket.connect() }
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    const seen = new Set<string>()
    const onNewMessage = (payload: any) => {
      const msg = payload?.message || payload
      const msgId = msg?.id || msg?._id || JSON.stringify(msg)
      if (seen.has(msgId)) return
      const msgConvId = msg?.conversationId || payload?.conversationId
      if (msgConvId && msgConvId !== convId) return
      seen.add(msgId)
      setLocalMessages((prev) => [...prev, msg])
      fetchMessages()
    }
    socket.on('new-message', onNewMessage)
    socket.on('new_message', onNewMessage)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('new-message', onNewMessage)
      socket.off('new_message', onNewMessage)
      socket.emit('leave-chat', convId)
    }
  }, [convId, token])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 4000)
    return () => clearInterval(interval)
  }, [convId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, localMessages])

  const resolveSender = (msg: any) => {
    const rawSender = msg.sender
    if (rawSender?.firstName && rawSender.firstName !== 'Unknown') return rawSender
    const pid = msg.senderId || rawSender?._id || rawSender?.id
    if (!pid) return rawSender || {}
    const found = participants.find((p: any) => (p._id || p.id) === pid)
    return found || rawSender || { firstName: 'User', lastName: '' }
  }

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    const optimistic = { id: `opt-${Date.now()}`, content, senderId: user?.id, createdAt: new Date().toISOString(), sender: user }
    setLocalMessages((p) => [...p, optimistic])
    try {
      await api.post(`/conversations/${convId}/messages`, { content })
      await fetchMessages()
    } catch { /* silent */ } finally { setSending(false) }
  }

  const allMessages = [...messages, ...localMessages.filter((lm) => !messages.some((m) => m.id === lm.id || m._id === lm._id))]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#060C09' }}>
      <TopBar
        showBack
        title={chatName}
        rightAction={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: isConnected ? '#00D98A' : '#2D4A3E', boxShadow: isConnected ? '0 0 6px #00D98A' : 'none' }} />
          </div>
        }
      />

      {/* Chat sub-header */}
      <div style={{ padding: '8px 16px 10px', background: 'rgba(6,12,9,0.8)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(0,217,138,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar src={otherAvatar} name={chatName} size={36} borderRadius={isGroup ? '11px' : '50%'} style={isGroup ? { background: 'linear-gradient(135deg, #00D98A, #4F8EF7)' } : {}} />
        <div>
          <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4' }}>{chatName}</div>
          <div style={{ fontSize: 11, color: isConnected ? '#00D98A' : '#2D4A3E' }}>
            {isConnected ? 'Connected' : 'Connecting…'}
            {isGroup && ` · ${participants.length} members`}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 8px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <div className="spinner" />
          </div>
        ) : allMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ color: '#7A9E8E', fontSize: 13 }}>Start the conversation!</p>
          </div>
        ) : (
          allMessages.map((msg, i) => {
            const sender = resolveSender(msg)
            const isMe = (msg.senderId || msg.sender?.id || msg.sender?._id) === user?.id
            const isOpt = msg.id?.startsWith('opt-')
            const senderName = `${sender?.firstName || ''} ${sender?.lastName || ''}`.trim() || 'User'
            const prevMsg = allMessages[i - 1]
            const sameGroupPrev = !isMe && prevMsg && (prevMsg.senderId || prevMsg.sender?.id) === (msg.senderId || msg.sender?.id)
            return (
              <div key={msg.id || msg._id || i} style={{ marginBottom: 4, display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 6 }}>
                {!isMe && (
                  <div style={{ visibility: sameGroupPrev ? 'hidden' : 'visible', flexShrink: 0, marginBottom: 2 }}>
                    <Avatar src={sender?.avatar || sender?.profilePicture} name={senderName} size={26} />
                  </div>
                )}
                <div style={{ maxWidth: '72%' }}>
                  {!isMe && isGroup && !sameGroupPrev && (
                    <div style={{ fontSize: 10, color: getColor(senderName), fontWeight: 600, marginBottom: 2, marginLeft: 2 }}>{senderName}</div>
                  )}
                  <div style={{ padding: '9px 12px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? 'rgba(0,217,138,0.15)' : 'rgba(8,18,12,0.9)', border: isMe ? '1px solid rgba(0,217,138,0.25)' : '1px solid rgba(0,217,138,0.08)', fontSize: 14, color: '#E8FFF4', lineHeight: 1.5, wordBreak: 'break-word', opacity: isOpt ? 0.6 : 1 }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 10, color: '#2D4A3E', marginTop: 3, textAlign: isMe ? 'right' : 'left', marginLeft: 2, marginRight: 2 }}>
                    {timeStr(msg.createdAt)}{isOpt ? ' · Sending…' : ''}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: '10px 12px', background: 'rgba(6,12,9,0.9)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderTop: '1px solid rgba(0,217,138,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Type a message…"
          style={{ flex: 1, padding: '11px 16px', borderRadius: 20, background: 'rgba(0,217,138,0.05)', border: '1px solid rgba(0,217,138,0.12)', fontSize: 14, color: '#E8FFF4', fontFamily: 'Space Grotesk, sans-serif' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          aria-label="Send message"
          style={{ width: 44, height: 44, borderRadius: '50%', background: text.trim() ? '#00D98A' : 'rgba(0,217,138,0.08)', border: text.trim() ? 'none' : '1px solid rgba(0,217,138,0.15)', cursor: text.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s', boxShadow: text.trim() ? '0 0 12px rgba(0,217,138,0.3)' : 'none' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" stroke={text.trim() ? '#060C09' : '#2D4A3E'} strokeWidth="2" strokeLinecap="round"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" stroke={text.trim() ? '#060C09' : '#2D4A3E'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
