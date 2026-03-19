import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'
import api, { resolveImageUrl } from '../api'
import Avatar from '../components/Avatar'

const ROLE_COLORS: Record<string, { color: string; gradient: string }> = {
  student:  { color: '#00D98A', gradient: 'linear-gradient(135deg, #00D98A, #00B87C)' },
  alumni:   { color: '#00E5CC', gradient: 'linear-gradient(135deg, #00E5CC, #00B8A0)' },
  faculty:  { color: '#4F8EF7', gradient: 'linear-gradient(135deg, #4F8EF7, #6D6FF5)' },
  industry: { color: '#B5E853', gradient: 'linear-gradient(135deg, #B5E853, #7CB800)' },
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.12)',
  fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box' as const,
}

type Tab = 'posts' | 'about' | 'connections'

export default function ProfileScreen() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('posts')
  const [posts, setPosts] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [showEdit, setShowEdit] = useState(false)
  const [editForm, setEditForm] = useState({ firstName: '', lastName: '', headline: '', bio: '' })
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me')
        const p = res.data?.data?.profile || res.data?.data?.user || res.data?.user || res.data?.data || res.data
        if (p) {
          setProfile(p)
          setEditForm({
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            headline: p.headline || '',
            bio: p.bio || '',
          })
          // Sync avatar and name into AuthContext so they show in FeedScreen top bar
          const resolvedAvatar = p.avatar || p.profilePicture || (user as any)?.profilePicture || undefined
          updateUser({
            firstName: p.firstName || user?.firstName || '',
            lastName: p.lastName || user?.lastName || '',
            avatar: resolvedAvatar,
          })
          const uid = p.userId || p._id || p.id || user?.id
          fetchPosts(uid)
        }
      } catch {
        if (user) {
          setProfile(user)
          setEditForm({ firstName: user.firstName || '', lastName: user.lastName || '', headline: '', bio: '' })
        }
      } finally {
        setLoading(false)
      }
    }

    const fetchPosts = async (uid: string) => {
      try {
        const res = await api.get(`/posts?userId=${uid}&limit=20`)
        const data = res.data?.data
        if (Array.isArray(data)) { setPosts(data); return }
        const alt = res.data?.posts || res.data?.data?.posts
        if (Array.isArray(alt)) setPosts(alt)
      } catch { /* silent */ }
    }

    const fetchConnections = async () => {
      try {
        const res = await api.get('/users/connections')
        const data = res.data?.data?.connections || res.data?.data || res.data?.connections || res.data
        if (Array.isArray(data)) setConnections(data)
      } catch { /* silent */ }
    }

    fetchProfile()
    fetchConnections()
  }, [user?.id])

  const handleSave = async () => {
    if (!editForm.firstName.trim()) { setSaveError('First name is required'); return }
    setSaving(true); setSaveError('')
    try {
      const res = await api.put('/users/me', editForm)
      const updated = res.data?.data?.profile || res.data?.data?.user || res.data?.user || res.data?.data || editForm
      const merged = { ...profile, ...editForm, ...updated }
      setProfile(merged)
      // Keep AuthContext in sync
      updateUser({ firstName: merged.firstName, lastName: merged.lastName })
      setShowEdit(false)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || 'Failed to save. Try again.')
    } finally { setSaving(false) }
  }

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploadRes = await api.post('/posts/upload', formData)
      const avatarUrl = uploadRes.data?.data?.url || uploadRes.data?.url
      if (avatarUrl) {
        await api.put('/users/me', { avatar: avatarUrl })
        setProfile((prev: any) => ({ ...prev, avatar: avatarUrl }))
        updateUser({ avatar: avatarUrl })
      }
    } catch { /* silent */ } finally { setUploadingAvatar(false) }
  }

  const p = profile || user
  const firstName = p?.firstName || 'User'
  const lastName = p?.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const role = (p?.role || 'student').toLowerCase()
  const roleColors = ROLE_COLORS[role] || ROLE_COLORS.student
  const initials = `${firstName[0] || 'U'}${lastName?.[0] || ''}`.toUpperCase()

  const skills: string[] = Array.isArray(p?.skills) ? p.skills : []
  const interests: string[] = Array.isArray(p?.interests) ? p.interests : []
  const education: any[] = Array.isArray(p?.education) ? p.education : []
  const experience: any[] = Array.isArray(p?.experience) ? p.experience : []

  if (loading) return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Profile" />
      <LoadingSpinner />
    </div>
  )

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Profile"
        rightAction={
          <button onClick={() => navigate('/settings')} aria-label="Settings"
            style={{ border: 'none', background: 'rgba(0,217,138,0.08)', borderRadius: 12, padding: 8, cursor: 'pointer', minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" stroke="#7A9E8E" strokeWidth="2"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#7A9E8E" strokeWidth="2"/>
            </svg>
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover banner */}
        <div style={{ height: 110, background: roleColors.gradient, opacity: 0.85, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
        </div>

        <div style={{ padding: '0 16px 0', position: 'relative' }}>
          {/* Avatar + Edit row */}
          <div style={{ marginTop: -38, marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            {/* Tappable avatar */}
            <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setShowEdit(true)}>
              <Avatar
                src={p?.avatar || p?.profilePicture}
                name={fullName}
                size={76}
                style={{ border: '3px solid #060C09', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 24 }}
              />
              {/* Camera overlay badge */}
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                width: 22, height: 22, borderRadius: '50%',
                background: '#00D98A', border: '2px solid #060C09',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="#060C09" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="12" cy="13" r="4" stroke="#060C09" strokeWidth="2.5"/>
                </svg>
              </div>
            </div>
            <button onClick={() => setShowEdit(true)} className="btn-ghost"
              style={{ padding: '8px 16px', borderRadius: 12, fontSize: 13, minHeight: 44 }}>
              Edit Profile
            </button>
          </div>

          {/* Name + role badge */}
          <h2 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 21, color: '#E8FFF4', margin: '0 0 6px' }}>{fullName}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${roleColors.color}15`, color: roleColors.color, border: `1px solid ${roleColors.color}30`, textTransform: 'capitalize' }}>
              {role}
            </span>
            {p?.email && <span style={{ fontSize: 12, color: '#2D4A3E' }}>{p.email}</span>}
          </div>
          {p?.headline && <p style={{ fontSize: 13, color: '#7A9E8E', margin: '4px 0 0', lineHeight: 1.5 }}>{p.headline}</p>}

          {/* Stats row */}
          <div style={{ display: 'flex', marginTop: 16, paddingBottom: 16, borderBottom: '1px solid rgba(0,217,138,0.08)' }}>
            {[
              { label: 'Posts', value: posts.length },
              { label: 'Connections', value: connections.length },
              { label: 'Skills', value: skills.length },
            ].map((stat, i) => (
              <div key={stat.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(0,217,138,0.08)' : 'none' }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 20, color: '#E8FFF4' }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: '#2D4A3E', marginTop: 1 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,217,138,0.08)', marginTop: 4, marginBottom: 14 }}>
            {(['posts', 'about', 'connections'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                style={{ flex: 1, padding: '11px 0', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize', color: activeTab === t ? '#00D98A' : '#2D4A3E', borderBottom: activeTab === t ? '2px solid #00D98A' : '2px solid transparent', transition: 'all 0.2s', minHeight: 44 }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Posts tab */}
          {activeTab === 'posts' && (
            posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="4" stroke="#00D98A" strokeWidth="1.5"/><path d="M8 10h8M8 14h5" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <p style={{ color: '#7A9E8E', fontSize: 13, margin: 0 }}>No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id || post._id} style={{ background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 14, marginBottom: 10, padding: '14px', overflow: 'hidden' }}>
                  {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (
                    <img src={resolveImageUrl(post.mediaUrls[0])!} alt="" style={{ width: '100%', borderRadius: 10, objectFit: 'cover', maxHeight: 180, display: 'block', marginBottom: 10 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  <p style={{ fontSize: 13, color: '#A8C8BA', lineHeight: 1.55, margin: '0 0 8px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{post.content}</p>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <span style={{ fontSize: 11, color: '#2D4A3E' }}>{post.likes ?? post.likesCount ?? 0} likes</span>
                    <span style={{ fontSize: 11, color: '#2D4A3E' }}>{post.comments ?? post.commentsCount ?? 0} comments</span>
                  </div>
                </div>
              ))
            )
          )}

          {/* About tab */}
          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {p?.bio && (
                <div>
                  <h4 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700, color: '#7A9E8E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>About</h4>
                  <p style={{ fontSize: 13, color: '#A8C8BA', lineHeight: 1.65, margin: 0 }}>{p.bio}</p>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700, color: '#7A9E8E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {skills.map((s, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(0,217,138,0.08)', color: '#00D98A', border: '1px solid rgba(0,217,138,0.2)', fontSize: 12, fontWeight: 600 }}>{s}</span>)}
                  </div>
                </div>
              )}
              {interests.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700, color: '#7A9E8E', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Interests</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {interests.map((s, i) => <span key={i} style={{ padding: '4px 10px', borderRadius: 20, background: 'rgba(0,229,204,0.08)', color: '#00E5CC', border: '1px solid rgba(0,229,204,0.2)', fontSize: 12, fontWeight: 600 }}>{s}</span>)}
                  </div>
                </div>
              )}
              {experience.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700, color: '#7A9E8E', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Experience</h4>
                  {experience.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#4F8EF7" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#4F8EF7" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8FFF4' }}>{exp.position || exp.title}</div>
                        <div style={{ fontSize: 12, color: '#7A9E8E' }}>{exp.company}</div>
                        {exp.description && <div style={{ fontSize: 12, color: '#2D4A3E', marginTop: 3, lineHeight: 1.5 }}>{exp.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {education.length > 0 && (
                <div>
                  <h4 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 12, fontWeight: 700, color: '#7A9E8E', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Education</h4>
                  {education.map((edu, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,229,204,0.1)', border: '1px solid rgba(0,229,204,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#00E5CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3.53 3.53 8.47 3.53 12 0v-5" stroke="#00E5CC" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8FFF4' }}>{edu.institution || edu.school}</div>
                        <div style={{ fontSize: 12, color: '#7A9E8E' }}>{edu.degree}{edu.field || edu.fieldOfStudy ? ` · ${edu.field || edu.fieldOfStudy}` : ''}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!p?.bio && skills.length === 0 && interests.length === 0 && education.length === 0 && experience.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#7A9E8E', fontSize: 13 }}>
                  No info added yet. Tap Edit Profile to fill in your details.
                </div>
              )}
            </div>
          )}

          {/* Connections tab */}
          {activeTab === 'connections' && (
            connections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#00D98A" strokeWidth="1.5"/><circle cx="12" cy="7" r="4" stroke="#00D98A" strokeWidth="1.5"/></svg>
                </div>
                <p style={{ color: '#7A9E8E', fontSize: 13, margin: 0 }}>No connections yet</p>
              </div>
            ) : (
              connections.map((conn: any) => {
                const name = `${conn.firstName || ''} ${conn.lastName || ''}`.trim() || 'User'
                return (
                  <div key={conn.id || conn._id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(8,18,12,0.7)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 14, marginBottom: 8, padding: '12px 14px', minHeight: 62 }}>
                    <Avatar src={conn.avatar || conn.profilePicture} name={name} size={42} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4' }}>{name}</div>
                      <div style={{ fontSize: 12, color: '#7A9E8E', textTransform: 'capitalize' }}>{conn.role || 'Member'}{conn.headline ? ` · ${conn.headline}` : ''}</div>
                    </div>
                  </div>
                )
              })
            )
          )}

          <div style={{ height: 24 }} />
        </div>
      </div>

      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleAvatarUpload(file)
          e.target.value = ''
        }}
      />

      {/* Edit Profile Modal */}
      {showEdit && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="animate-slide-up" style={{ background: '#080E0B', border: '1px solid rgba(0,217,138,0.15)', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '85%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(0,217,138,0.3)', margin: '12px auto 0' }} />
            <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,217,138,0.08)' }}>
              <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 17, color: '#E8FFF4', margin: 0 }}>Edit Profile</h3>
              <button onClick={() => { setShowEdit(false); setSaveError('') }} aria-label="Close"
                style={{ border: 'none', background: 'rgba(0,217,138,0.08)', cursor: 'pointer', borderRadius: 10, padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

              {/* Avatar upload section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px', borderRadius: 16, background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.1)' }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <Avatar
                    src={p?.avatar || p?.profilePicture}
                    name={fullName}
                    size={58}
                    style={{ fontWeight: 800, fontSize: 20 }}
                  />
                  {uploadingAvatar && (
                    <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="spinner" style={{ width: 20, height: 20 }} />
                    </div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#E8FFF4', marginBottom: 4 }}>Profile Photo</div>
                  <div style={{ fontSize: 12, color: '#7A9E8E', marginBottom: 8 }}>Upload a clear photo of yourself</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    style={{ padding: '7px 16px', borderRadius: 10, border: '1px solid rgba(0,217,138,0.3)', background: 'rgba(0,217,138,0.08)', color: '#00D98A', fontSize: 12, fontWeight: 700, cursor: uploadingAvatar ? 'not-allowed' : 'pointer', opacity: uploadingAvatar ? 0.5 : 1 }}
                  >
                    {uploadingAvatar ? 'Uploading…' : 'Change Photo'}
                  </button>
                </div>
              </div>

              {[
                { key: 'firstName', label: 'First Name', placeholder: 'First name' },
                { key: 'lastName',  label: 'Last Name',  placeholder: 'Last name' },
                { key: 'headline',  label: 'Headline',   placeholder: 'e.g. CS Student at UCSC' },
              ].map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input type="text" value={(editForm as any)[f.key]} onChange={(e) => setEditForm((ef) => ({ ...ef, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bio</label>
                <textarea value={editForm.bio} onChange={(e) => setEditForm((ef) => ({ ...ef, bio: e.target.value }))} placeholder="Tell people about yourself…" rows={4} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              {saveError && (
                <div style={{ background: 'rgba(255,95,109,0.08)', border: '1px solid rgba(255,95,109,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#FF8F9A', marginBottom: 14 }}>{saveError}</div>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className={saving ? '' : 'btn-primary'}
                style={saving ? { width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.04)', color: '#2D4A3E', fontWeight: 700, fontSize: 14, cursor: 'not-allowed', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } : { width: '100%', padding: '14px', borderRadius: 14, fontSize: 14, fontWeight: 700, minHeight: 48 }}
              >
                {saving ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Saving…</> : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
