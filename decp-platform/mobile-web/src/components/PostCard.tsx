import { useState } from 'react'
import api, { resolveImageUrl } from '../api'
import Avatar from './Avatar'

interface Post {
  id?: string; _id?: string; content: string; createdAt: string
  likesCount?: number; commentsCount?: number; isLiked?: boolean
  author?: any; user?: any
}

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  student:  { color: '#00D98A', bg: 'rgba(0,217,138,0.1)' },
  alumni:   { color: '#00E5CC', bg: 'rgba(0,229,204,0.1)' },
  faculty:  { color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)' },
  industry: { color: '#B5E853', bg: 'rgba(181,232,83,0.1)' },
}
const AVATAR_COLORS = ['#00D98A','#00E5CC','#4F8EF7','#A066FA','#F066B0','#B5E853']
function getColor(s: string) { let h=0; for(let i=0;i<s.length;i++) h=s.charCodeAt(i)+((h<<5)-h); return AVATAR_COLORS[Math.abs(h)%AVATAR_COLORS.length] }

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}

export default function PostCard({ post }: { post: Post }) {
  const author = post.author || post.user || {}
  const firstName = author.firstName || 'Anonymous'
  const lastName = author.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const role = (author.role || 'student').toLowerCase()
  const initials = `${firstName[0]}${lastName[0]||''}`.toUpperCase()
  const avatarColor = getColor(fullName)
  const roleStyle = ROLE_COLORS[role] || ROLE_COLORS.student
  const postId = post.id || post._id

  const [liked, setLiked] = useState(post.isLiked || false)
  const [likes, setLikes] = useState(post.likesCount || 0)
  const [likeAnim, setLikeAnim] = useState(false)

  const handleLike = async () => {
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikes((c) => wasLiked ? c-1 : c+1)
    if (!wasLiked) { setLikeAnim(true); setTimeout(() => setLikeAnim(false), 400) }
    try {
      if (wasLiked) await api.delete(`/posts/${postId}/like`)
      else await api.post(`/posts/${postId}/like`)
    } catch { setLiked(wasLiked); setLikes((c) => wasLiked ? c+1 : c-1) }
  }

  return (
    <div
      className="animate-card-appear"
      style={{
        background: 'rgba(8,18,12,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,217,138,0.08)',
        borderRadius: 18,
        marginBottom: 10,
        overflow: 'hidden',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Role accent bar */}
      <div style={{ height: 2, background: roleStyle.color, opacity: 0.6 }} />

      <div style={{ padding: '14px 16px 12px' }}>
        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Avatar src={author.avatar || author.profilePicture} name={fullName} size={40} style={{ border: `1.5px solid ${avatarColor}40` }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: roleStyle.color, textTransform: 'capitalize' }}>{role}</span>
              <span style={{ fontSize: 10, color: '#2D4A3E' }}>·</span>
              <span style={{ fontSize: 11, color: '#2D4A3E' }}>{timeAgo(post.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <p style={{ fontSize: 14, color: '#A8C8BA', lineHeight: 1.65, margin: '0 0 12px', wordBreak: 'break-word' }}>
          {post.content}
        </p>

        {/* Post media images — field is mediaUrls (array of /uploads/... paths) */}
        {(() => {
          const p = post as any
          const urls: string[] = Array.isArray(p.mediaUrls) ? p.mediaUrls
            : Array.isArray(p.media) ? p.media
            : p.imageUrl ? [p.imageUrl]
            : p.image ? [p.image]
            : []
          return urls.map((url, i) => {
            const src = resolveImageUrl(url)
            if (!src) return null
            return (
              <img
                key={i}
                src={src}
                alt="Post image"
                style={{ width: '100%', borderRadius: 12, objectFit: 'cover', maxHeight: 240, display: 'block', marginBottom: 10, border: '1px solid rgba(0,217,138,0.08)' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )
          })
        })()}

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(0,217,138,0.06)', marginBottom: 8 }} />

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={handleLike}
            aria-label={liked ? 'Unlike' : 'Like'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              border: 'none',
              background: liked ? 'rgba(240,102,176,0.08)' : 'transparent',
              cursor: 'pointer', padding: '6px 12px', borderRadius: 20, minHeight: 44,
              transition: 'all 0.2s',
            }}
          >
            <svg
              width="17" height="17" viewBox="0 0 24 24"
              fill={liked ? '#F066B0' : 'none'}
              style={{ transform: likeAnim ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke={liked ? '#F066B0' : '#2D4A3E'} strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, color: liked ? '#F066B0' : '#2D4A3E', fontWeight: 600 }}>
              {likes > 0 ? likes : 'Like'}
            </span>
          </button>

          <button aria-label="Comment" style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 12px', borderRadius: 20, minHeight: 44 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, color: '#2D4A3E', fontWeight: 600 }}>{post.commentsCount || 0}</span>
          </button>

          <button aria-label="Share" style={{ display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent', cursor: 'pointer', padding: '6px 12px', borderRadius: 20, minHeight: 44, marginLeft: 'auto' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
              <circle cx="18" cy="5" r="3" stroke="#2D4A3E" strokeWidth="2"/>
              <circle cx="6" cy="12" r="3" stroke="#2D4A3E" strokeWidth="2"/>
              <circle cx="18" cy="19" r="3" stroke="#2D4A3E" strokeWidth="2"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="#2D4A3E" strokeWidth="2"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="#2D4A3E" strokeWidth="2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
