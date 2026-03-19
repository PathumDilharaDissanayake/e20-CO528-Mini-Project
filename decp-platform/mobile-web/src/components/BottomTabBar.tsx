import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  {
    key: 'feed',
    label: 'Home',
    path: '/feed',
    color: '#00D98A',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke={active ? '#00D98A' : '#2D4A3E'}
          strokeWidth="2"
          strokeLinecap="round"
          fill={active ? 'rgba(0,217,138,0.15)' : 'none'}
        />
        <polyline points="9 22 9 12 15 12 15 22" stroke={active ? '#00D98A' : '#2D4A3E'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'search',
    label: 'Search',
    path: '/search',
    color: '#00E5CC',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="11" cy="11" r="8" stroke={active ? '#00E5CC' : '#2D4A3E'} strokeWidth="2" fill={active ? 'rgba(0,229,204,0.12)' : 'none'}/>
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke={active ? '#00E5CC' : '#2D4A3E'} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'messages',
    label: 'Messages',
    path: '/messages',
    color: '#4F8EF7',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke={active ? '#4F8EF7' : '#2D4A3E'}
          strokeWidth="2"
          strokeLinecap="round"
          fill={active ? 'rgba(79,142,247,0.15)' : 'none'}
        />
      </svg>
    ),
  },
  {
    key: 'notifications',
    label: 'Alerts',
    path: '/notifications',
    color: '#B5E853',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
          stroke={active ? '#B5E853' : '#2D4A3E'}
          strokeWidth="2"
          strokeLinecap="round"
          fill={active ? 'rgba(181,232,83,0.12)' : 'none'}
        />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" stroke={active ? '#B5E853' : '#2D4A3E'} strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    color: '#00D98A',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={active ? '#00D98A' : '#2D4A3E'} strokeWidth="2" strokeLinecap="round"/>
        <circle cx="12" cy="7" r="4" stroke={active ? '#00D98A' : '#2D4A3E'} strokeWidth="2" fill={active ? 'rgba(0,217,138,0.12)' : 'none'}/>
      </svg>
    ),
  },
]

export default function BottomTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div
      style={{
        height: 64,
        background: 'rgba(6,12,9,0.96)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        borderTop: '1px solid rgba(0,217,138,0.1)',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexShrink: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        position: 'relative',
        zIndex: 30,
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname === tab.path ||
          (tab.path !== '/feed' && location.pathname.startsWith(tab.path))

        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 10px',
              border: 'none',
              background: active ? `${tab.color}10` : 'none',
              cursor: 'pointer',
              borderRadius: 14,
              transition: 'all 0.2s',
              minWidth: 52,
              minHeight: 48,
              position: 'relative',
            }}
          >
            {/* Active indicator */}
            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  background: tab.color,
                  boxShadow: `0 0 8px ${tab.color}`,
                }}
              />
            )}

            {tab.icon(active)}

            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 700 : 500,
                color: active ? tab.color : '#2D4A3E',
                fontFamily: 'Space Grotesk, sans-serif',
                lineHeight: 1,
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
