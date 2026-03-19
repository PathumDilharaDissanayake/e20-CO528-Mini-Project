import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Student: { bg: '#dcfce7', text: '#16a34a' },
  Faculty: { bg: '#dbeafe', text: '#1d4ed8' },
  Alumni: { bg: '#f3e8ff', text: '#7c3aed' },
  Admin: { bg: '#fef3c7', text: '#d97706' },
}

function getRoleStyle(role?: string) {
  return ROLE_COLORS[role || ''] || { bg: '#f3f4f6', text: '#6b7280' }
}

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b']
function getColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ posts: 0, connections: 0, research: 0 })
  const [profile, setProfile] = useState<any>(null)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  const initials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase()
  const avatarColor = getColor(fullName)
  const roleStyle = getRoleStyle(user?.role)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, postsRes] = await Promise.allSettled([
          api.get('/users/me'),
          api.get('/posts?userId=' + user?.id + '&limit=1'),
        ])
        if (profileRes.status === 'fulfilled') {
          setProfile(profileRes.value.data)
        }
        if (postsRes.status === 'fulfilled') {
          const total = postsRes.value.data?.total || postsRes.value.data?.count || 0
          setStats((prev) => ({ ...prev, posts: total }))
        }
      } catch {
        // Use defaults
      }
    }
    if (user) fetchProfile()
  }, [user])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const MENU_ITEMS = [
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="7" r="4" stroke="#374151" strokeWidth="2"/>
        </svg>
      ),
      label: 'Edit Profile',
      sublabel: 'Update your information',
      action: () => {},
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          <line x1="6" y1="1" x2="6" y2="4" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          <line x1="10" y1="1" x2="10" y2="4" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
          <line x1="14" y1="1" x2="14" y2="4" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      label: 'My Posts',
      sublabel: `${stats.posts} posts`,
      action: () => navigate('/feed'),
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="#374151" strokeWidth="2"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#374151" strokeWidth="2"/>
        </svg>
      ),
      label: 'Settings',
      sublabel: 'Notifications, privacy',
      action: () => {},
    },
    {
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#374151" strokeWidth="2"/>
          <path d="M12 8v4M12 16h.01" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
      label: 'Help & Support',
      sublabel: 'FAQ and contact us',
      action: () => {},
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Scrollable */}
      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Cover gradient */}
        <div
          style={{
            height: 140,
            background: 'linear-gradient(135deg, #064e3b 0%, #059669 50%, #10b981 100%)',
            position: 'relative',
          }}
        >
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }}/>
          <div style={{ position: 'absolute', bottom: -10, left: 20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>

          {/* Settings / back button */}
          <div style={{ position: 'absolute', top: 12, right: 12 }}>
            <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="3" stroke="#fff" strokeWidth="2"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="#fff" strokeWidth="2"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Avatar + info */}
        <div style={{ padding: '0 20px 0', background: '#fff', position: 'relative', paddingBottom: 20 }}>
          {/* Avatar */}
          <div style={{ position: 'relative', display: 'inline-block', marginTop: -36 }}>
            {user?.avatar || profile?.avatar ? (
              <img
                src={user?.avatar || profile?.avatar}
                alt={fullName}
                style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff' }}
              />
            ) : (
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: avatarColor,
                  border: '3px solid #fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 26,
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {initials}
              </div>
            )}
            {/* Edit button */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: 20, color: '#111827', fontFamily: 'Inter, sans-serif', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
              {fullName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  background: roleStyle.bg,
                  color: roleStyle.text,
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {user?.role || 'Member'}
              </span>
              <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
                {user?.email}
              </span>
            </div>
            {profile?.headline && (
              <p style={{ marginTop: 8, fontSize: 13, color: '#6b7280', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
                {profile.headline}
              </p>
            )}
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              marginTop: 18,
              background: '#f9fafb',
              borderRadius: 16,
              padding: '14px 0',
            }}
          >
            {[
              { label: 'Posts', value: stats.posts || 12 },
              { label: 'Connections', value: profile?.connectionsCount || 47 },
              { label: 'Research', value: profile?.researchCount || 3 },
            ].map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderRight: i < 2 ? '1px solid #e5e7eb' : 'none',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 20, color: '#111827', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginTop: 3 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 8, background: '#f9fafb' }} />

        {/* Menu items */}
        <div style={{ background: '#fff' }}>
          {MENU_ITEMS.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 20px',
                border: 'none',
                borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid #f9fafb' : 'none',
                background: '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: '#f9fafb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111827', fontFamily: 'Inter, sans-serif' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
                  {item.sublabel}
                </div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 18l6-6-6-6" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          ))}
        </div>

        <div style={{ height: 8, background: '#f9fafb' }} />

        {/* Logout */}
        <div style={{ padding: '16px 20px 24px', background: '#fff' }}>
          {!showLogoutConfirm ? (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 16,
                border: '1.5px solid #fecaca',
                background: '#fff',
                color: '#dc2626',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="16 17 21 12 16 7" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
                <line x1="21" y1="12" x2="9" y2="12" stroke="#dc2626" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Sign Out
            </button>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#374151', fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>
                Are you sure you want to sign out?
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 14,
                    border: '1px solid #e5e7eb',
                    background: '#fff',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#374151',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  style={{
                    flex: 1,
                    padding: '12px 0',
                    borderRadius: 14,
                    border: 'none',
                    background: '#dc2626',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
