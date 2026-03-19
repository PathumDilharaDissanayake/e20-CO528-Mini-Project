import { useState } from 'react'

interface PostAuthor {
  firstName?: string
  lastName?: string
  role?: string
  avatar?: string
  name?: string
}

interface Post {
  id: string
  content: string
  image?: string
  createdAt: string
  likesCount?: number
  commentsCount?: number
  author?: PostAuthor
  user?: PostAuthor
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function getInitials(first?: string, last?: string, name?: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase()
  if (name) return name.slice(0, 2).toUpperCase()
  return 'U'
}

const AVATAR_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4',
]
function getColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likesCount ?? 0)

  const author = post.author || post.user
  const firstName = author?.firstName || ''
  const lastName = author?.lastName || ''
  const fullName = author?.name || `${firstName} ${lastName}`.trim() || 'Unknown User'
  const role = author?.role || 'Member'
  const initials = getInitials(firstName, lastName, fullName)
  const avatarColor = getColor(fullName)

  const handleLike = () => {
    setLiked((prev) => !prev)
    setLikes((prev) => (liked ? prev - 1 : prev + 1))
  }

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid #f3f4f6',
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', gap: 10 }}>
        {author?.avatar ? (
          <img
            src={author.avatar}
            alt={fullName}
            style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '50%',
              background: avatarColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 15,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
            {fullName}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
            <span
              style={{
                fontSize: 11,
                background: 'rgba(16,185,129,0.1)',
                color: '#059669',
                borderRadius: 6,
                padding: '1px 6px',
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {role}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
              · {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        {/* More options */}
        <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="#9ca3af"/>
            <circle cx="12" cy="12" r="1.5" fill="#9ca3af"/>
            <circle cx="12" cy="19" r="1.5" fill="#9ca3af"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 12px', fontSize: 14, color: '#374151', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
        {post.content}
      </div>

      {/* Image if present */}
      {post.image && (
        <img
          src={post.image}
          alt="post"
          style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }}
        />
      )}

      {/* Divider */}
      <div style={{ height: 1, background: '#f9fafb', margin: '0 16px' }} />

      {/* Actions */}
      <div style={{ display: 'flex', padding: '8px 8px 8px', gap: 0 }}>
        <button
          onClick={handleLike}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '8px 0',
            borderRadius: 10,
            transition: 'background 0.15s',
            color: liked ? '#10b981' : '#6b7280',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#10b981' : 'none'}>
            <path
              d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
              stroke={liked ? '#10b981' : '#9ca3af'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {likes > 0 && likes}
        </button>

        <button
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '8px 0',
            borderRadius: 10,
            color: '#6b7280',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {(post.commentsCount ?? 0) > 0 && post.commentsCount}
        </button>

        <button
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            padding: '8px 0',
            borderRadius: 10,
            color: '#6b7280',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 500,
            fontSize: 13,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="18" cy="5" r="3" stroke="#9ca3af" strokeWidth="2"/>
            <circle cx="6" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/>
            <circle cx="18" cy="19" r="3" stroke="#9ca3af" strokeWidth="2"/>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke="#9ca3af" strokeWidth="2"/>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke="#9ca3af" strokeWidth="2"/>
          </svg>
          Share
        </button>
      </div>
    </div>
  )
}
