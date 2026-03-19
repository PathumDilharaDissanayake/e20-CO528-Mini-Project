import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import { useAuth } from '../context/AuthContext'

const ROLE_COLORS: Record<string, string> = {
  student: '#00D98A', alumni: '#00E5CC', faculty: '#4F8EF7', industry: '#B5E853',
}

export default function SettingsScreen() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const roleColor = ROLE_COLORS[(user?.role || 'student').toLowerCase()] || '#00D98A'
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const sections = [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', subtitle: 'Update your information', color: '#00D98A', action: () => navigate('/profile'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#00D98A" strokeWidth="2"/><circle cx="12" cy="7" r="4" stroke="#00D98A" strokeWidth="2"/></svg> },
        { label: 'Notifications', subtitle: 'Configure alerts', color: '#B5E853', action: () => navigate('/notifications'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke="#B5E853" strokeWidth="2" strokeLinecap="round"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke="#B5E853" strokeWidth="2" strokeLinecap="round"/></svg> },
        { label: 'Privacy & Security', subtitle: 'Manage your privacy', color: '#4F8EF7', action: () => showToast('Coming soon'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" stroke="#4F8EF7" strokeWidth="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#4F8EF7" strokeWidth="2"/></svg> },
      ],
    },
    {
      title: 'Explore',
      items: [
        { label: 'Jobs', subtitle: 'Browse career opportunities', color: '#00D98A', action: () => navigate('/jobs'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#00D98A" strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/></svg> },
        { label: 'Events', subtitle: 'Upcoming campus events', color: '#00E5CC', action: () => navigate('/events'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="2" stroke="#00E5CC" strokeWidth="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="#00E5CC" strokeWidth="2" strokeLinecap="round"/><line x1="8" y1="2" x2="8" y2="6" stroke="#00E5CC" strokeWidth="2" strokeLinecap="round"/><line x1="3" y1="10" x2="21" y2="10" stroke="#00E5CC" strokeWidth="2"/></svg> },
        { label: 'Research', subtitle: 'Academic papers & projects', color: '#A066FA', action: () => navigate('/research'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#A066FA" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#A066FA" strokeWidth="2.5" strokeLinecap="round"/></svg> },
      ],
    },
    {
      title: 'Support',
      items: [
        { label: 'Help & FAQ', subtitle: 'Get assistance', color: '#7A9E8E', action: () => showToast('Help center coming soon'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#7A9E8E" strokeWidth="2"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/></svg> },
        { label: 'About DECP', subtitle: 'Version 1.0.0', color: '#2D4A3E', action: () => showToast('DECP Platform — Digital Engineering Community Platform v1.0.0'), icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="#2D4A3E" strokeWidth="2"/><line x1="12" y1="8" x2="12" y2="12" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/></svg> },
      ],
    },
    {
      title: '',
      items: [
        { label: 'Sign Out', color: '#FF5F6D', danger: true, action: () => { logout(); navigate('/login', { replace: true }) }, icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="#FF5F6D" strokeWidth="2" strokeLinecap="round"/><polyline points="16 17 21 12 16 7" stroke="#FF5F6D" strokeWidth="2" strokeLinecap="round"/><line x1="21" y1="12" x2="9" y2="12" stroke="#FF5F6D" strokeWidth="2" strokeLinecap="round"/></svg> },
      ],
    },
  ]

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Settings" />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 24px' }}>
        {/* User card */}
        <div style={{ background: 'rgba(8,18,12,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(0,217,138,0.1)', borderRadius: 18, padding: '18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: roleColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 20, color: '#060C09', flexShrink: 0, position: 'relative' }}>
            {`${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase()}
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
            <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 17, color: '#E8FFF4' }}>
              {user?.firstName} {user?.lastName}
            </div>
            <div style={{ fontSize: 12, color: '#7A9E8E', marginTop: 2 }}>{user?.email}</div>
            <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: `${roleColor}15`, color: roleColor, border: `1px solid ${roleColor}25`, textTransform: 'capitalize' }}>{user?.role || 'Member'}</span>
          </div>
        </div>

        {sections.map((section, si) => (
          <div key={si} style={{ marginBottom: 14 }}>
            {section.title && (
              <div style={{ fontSize: 11, fontWeight: 700, color: '#2D4A3E', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 7, paddingLeft: 4 }}>
                {section.title}
              </div>
            )}
            <div style={{ background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              {section.items.map((item: any, ii) => (
                <button
                  key={ii}
                  onClick={item.action}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', border: 'none', borderBottom: ii < section.items.length - 1 ? '1px solid rgba(0,217,138,0.06)' : 'none', background: 'none', cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left', minHeight: 58 }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: item.danger ? '#FF5F6D' : '#E8FFF4' }}>{item.label}</div>
                    {item.subtitle && <div style={{ fontSize: 11, color: '#2D4A3E', marginTop: 1 }}>{item.subtitle}</div>}
                  </div>
                  {!item.danger && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Toast notification */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(8,18,12,0.95)', border: '1px solid rgba(0,217,138,0.2)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 14, padding: '10px 18px',
          fontSize: 13, color: '#E8FFF4', fontFamily: 'Space Grotesk, sans-serif',
          zIndex: 200, maxWidth: '80%', textAlign: 'center',
          animation: 'fadeInUp 0.25s ease',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
