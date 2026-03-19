import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import PostCard from '../components/PostCard'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import api, { resolveImageUrl } from '../api'

const AVATAR_COLORS = ['#00D98A','#00E5CC','#4F8EF7','#A066FA','#F066B0','#B5E853']
function getColor(s: string) { let h=0; for(let i=0;i<s.length;i++) h=s.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length] }

const NAV_CHIPS = [
  { label: 'Jobs',     path: '/jobs',     color: '#00D98A', bg: 'rgba(0,217,138,0.08)',  border: 'rgba(0,217,138,0.2)'  },
  { label: 'Events',   path: '/events',   color: '#00E5CC', bg: 'rgba(0,229,204,0.08)',  border: 'rgba(0,229,204,0.2)'  },
  { label: 'Research', path: '/research', color: '#4F8EF7', bg: 'rgba(79,142,247,0.08)', border: 'rgba(79,142,247,0.2)' },
  { label: 'Messages', path: '/messages', color: '#B5E853', bg: 'rgba(181,232,83,0.08)', border: 'rgba(181,232,83,0.2)' },
]

export default function FeedScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    api.get('/posts?page=1&limit=30')
      .then((res) => {
        const d = res.data?.posts || res.data?.data?.posts || res.data?.data || res.data
        if (Array.isArray(d) && d.length > 0) setPosts(d)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handlePost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const res = await api.post('/posts', { content: newPost })
      const created = res.data?.post || res.data?.data?.post || res.data
      setPosts((p) => [{ ...created, author: user, createdAt: new Date().toISOString(), likesCount: 0, commentsCount: 0 }, ...p])
    } catch {
      setPosts((p) => [{ id: Date.now().toString(), content: newPost, createdAt: new Date().toISOString(), likesCount: 0, commentsCount: 0, author: user }, ...p])
    }
    setNewPost(''); setShowCreate(false); setPosting(false)
  }

  const userInitials = `${user?.firstName?.[0]||'U'}${user?.lastName?.[0]||''}`.toUpperCase()
  const userColor = getColor(user?.firstName || 'U')

  return (
    <div style={{ minHeight: '100%' }}>
      <TopBar
        title="DECP"
        rightAction={
          <button onClick={() => navigate('/profile')} aria-label="Profile"
            style={{ width: 36, height: 36, borderRadius: '50%', background: userColor, border: '2px solid rgba(0,217,138,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#060C09', minWidth: 44, minHeight: 44, boxSizing: 'border-box', overflow: 'hidden', padding: 0 }}
          >
            {resolveImageUrl(user?.avatar)
              ? <img src={resolveImageUrl(user?.avatar)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : userInitials
            }
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ overflowY: 'auto', padding: '12px 12px 16px' }}>
        {/* Hero banner */}
        <div style={{ borderRadius: 20, background: 'rgba(0,217,138,0.06)', border: '1px solid rgba(0,217,138,0.12)', padding: '18px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 12, color: '#7A9E8E', margin: '0 0 3px', letterSpacing: '0.04em' }}>Good day,</p>
            <h2 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 20, fontWeight: 900, color: '#E8FFF4', margin: 0 }}>
              {user?.firstName || 'Welcome'}{' '}
              <span style={{ color: '#00D98A' }}>Back!</span>
            </h2>
            <p style={{ fontSize: 12, color: '#7A9E8E', margin: '6px 0 0', textTransform: 'capitalize' }}>
              {user?.role || 'Member'} · See what's happening
            </p>
          </div>
        </div>

        {/* Quick nav chips */}
        <div className="scrollbar-hide" style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
          {NAV_CHIPS.map((c) => (
            <button key={c.path} onClick={() => navigate(c.path)}
              style={{ padding: '8px 16px', borderRadius: 20, minHeight: 44, border: `1px solid ${c.border}`, background: c.bg, color: c.color, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Space Grotesk, sans-serif', transition: 'all 0.2s' }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Create post prompt */}
        <div
          onClick={() => setShowCreate(true)}
          style={{ background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,217,138,0.1)', borderRadius: 18, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, cursor: 'pointer', transition: 'border-color 0.2s' }}
        >
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: userColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#060C09', flexShrink: 0 }}>
            {userInitials}
          </div>
          <div style={{ flex: 1, padding: '9px 14px', borderRadius: 12, background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.08)', fontSize: 13, color: '#2D4A3E' }}>
            Share something with your network…
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(0,217,138,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><line x1="12" y1="5" x2="12" y2="19" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/><line x1="5" y1="12" x2="19" y2="12" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
        </div>

        {/* Create post form */}
        {showCreate && (
          <div style={{ background: 'rgba(8,18,12,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(0,217,138,0.2)', borderRadius: 18, padding: '16px', marginBottom: 14 }}>
            <textarea
              autoFocus
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              style={{ width: '100%', minHeight: 80, border: 'none', outline: 'none', resize: 'none', fontSize: 15, color: '#E8FFF4', background: 'transparent', lineHeight: 1.6, boxSizing: 'border-box', fontFamily: 'Space Grotesk, sans-serif' }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid rgba(0,217,138,0.08)', paddingTop: 10 }}>
              <button onClick={() => setShowCreate(false)} style={{ padding: '9px 18px', borderRadius: 12, border: '1px solid rgba(0,217,138,0.1)', background: 'transparent', fontSize: 13, fontWeight: 600, color: '#7A9E8E', cursor: 'pointer', minHeight: 44 }}>
                Cancel
              </button>
              <button
                onClick={handlePost}
                disabled={!newPost.trim() || posting}
                className={newPost.trim() && !posting ? 'btn-primary' : ''}
                style={newPost.trim() && !posting ? { padding: '9px 22px', borderRadius: 12, minHeight: 44, fontSize: 13, fontWeight: 700 } : { padding: '9px 22px', borderRadius: 12, minHeight: 44, border: 'none', background: 'rgba(255,255,255,0.04)', fontSize: 13, fontWeight: 700, color: '#2D4A3E', cursor: 'not-allowed' }}
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Posts */}
        {loading ? <LoadingSpinner /> : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="#00D98A" strokeWidth="1.5"/>
                <path d="M8 10h8M8 14h5" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ color: '#7A9E8E', fontSize: 14 }}>No posts yet. Be the first!</p>
          </div>
        ) : (
          posts.map((post) => <PostCard key={post.id || post._id} post={post} />)
        )}
      </div>
    </div>
  )
}
