import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import PostCard from '../components/PostCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const MOCK_POSTS = [
  {
    id: '1',
    content: '🎉 Excited to announce that our research paper on ML-based traffic prediction has been accepted at IEEE! Huge thanks to the entire team for making this happen.',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likesCount: 42,
    commentsCount: 8,
    author: { firstName: 'Dr. Anjali', lastName: 'Perera', role: 'Faculty', avatar: '' },
  },
  {
    id: '2',
    content: 'Just completed my final year project presentation. The panel loved the blockchain-based supply chain solution we built! Now waiting for results 🤞',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    likesCount: 28,
    commentsCount: 14,
    author: { firstName: 'Kasun', lastName: 'Silva', role: 'Student', avatar: '' },
  },
  {
    id: '3',
    content: 'Great opportunity for CS students! Our company is hiring software interns for the summer batch. Drop your CV at careers@techcorp.lk — Remote-friendly positions available!',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    likesCount: 67,
    commentsCount: 23,
    author: { firstName: 'Tharaka', lastName: 'Weerasinghe', role: 'Alumni', avatar: '' },
  },
  {
    id: '4',
    content: 'Reminder: The Annual Engineering Symposium registration deadline is this Friday! Link in profile. Last year we had 300+ attendees 🏛️',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likesCount: 55,
    commentsCount: 5,
    author: { firstName: 'Prof. Nimal', lastName: 'Bandara', role: 'Faculty', avatar: '' },
  },
]

function getInitials(firstName?: string, lastName?: string): string {
  if (!firstName) return 'U'
  return `${firstName[0]}${lastName?.[0] || ''}`.toUpperCase()
}

function getAvatarColor(name: string): string {
  const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b']
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return colors[Math.abs(h) % colors.length]
}

export default function FeedScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newPost, setNewPost] = useState('')
  const [posting, setPosting] = useState(false)

  const fetchPosts = async () => {
    try {
      const res = await api.get('/posts?page=1&limit=20')
      const data = res.data?.posts || res.data?.data || res.data
      if (Array.isArray(data) && data.length > 0) {
        setPosts(data)
      } else {
        setPosts(MOCK_POSTS)
      }
    } catch {
      setPosts(MOCK_POSTS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleCreatePost = async () => {
    if (!newPost.trim()) return
    setPosting(true)
    try {
      const res = await api.post('/posts', { content: newPost })
      const created = res.data?.post || res.data
      setPosts((prev) => [{ ...created, author: user, createdAt: new Date().toISOString() }, ...prev])
      setNewPost('')
      setShowCreate(false)
    } catch {
      // On failure, add mock
      setPosts((prev) => [{
        id: Date.now().toString(),
        content: newPost,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        commentsCount: 0,
        author: user,
      }, ...prev])
      setNewPost('')
      setShowCreate(false)
    }
    setPosting(false)
  }

  const userInitials = getInitials(user?.firstName, user?.lastName)
  const userColor = getAvatarColor(user?.firstName || 'U')

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <TopBar
        title="DECP"
        rightAction={
          <button
            onClick={() => navigate('/profile')}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: userColor,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {userInitials}
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 8px' }}>
        {/* Create post prompt */}
        <div
          onClick={() => setShowCreate(true)}
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #f3f4f6',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
            cursor: 'pointer',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: userColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {userInitials}
          </div>
          <div
            style={{
              flex: 1,
              padding: '9px 14px',
              borderRadius: 20,
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              fontSize: 13,
              color: '#9ca3af',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Share something with your network…
          </div>
        </div>

        {/* Create post modal */}
        {showCreate && (
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              border: '1px solid #e5e7eb',
              padding: 14,
              marginBottom: 14,
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
          >
            <textarea
              autoFocus
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              style={{
                width: '100%',
                minHeight: 80,
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: 14,
                color: '#111827',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1.5,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => setShowCreate(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={!newPost.trim() || posting}
                style={{
                  padding: '8px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: newPost.trim() ? 'linear-gradient(135deg, #059669, #10b981)' : '#e5e7eb',
                  fontSize: 13,
                  fontWeight: 600,
                  color: newPost.trim() ? '#fff' : '#9ca3af',
                  cursor: newPost.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        )}

        {/* Posts list */}
        {loading ? (
          <LoadingSpinner />
        ) : posts.length === 0 ? (
          <EmptyState icon="📭" title="No posts yet" subtitle="Be the first to share something!" />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  )
}
