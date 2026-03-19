import { useNavigate, useLocation } from 'react-router-dom'

const tabs = [
  {
    key: 'feed',
    label: 'Feed',
    path: '/feed',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(16,185,129,0.1)' : 'none'}
        />
        <polyline
          points="9 22 9 12 15 12 15 22"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: 'jobs',
    label: 'Jobs',
    path: '/jobs',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="2" y="7" width="20" height="14" rx="2"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          fill={active ? 'rgba(16,185,129,0.1)' : 'none'}
        />
        <path
          d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <line x1="12" y1="12" x2="12" y2="16" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
        <line x1="2" y1="12" x2="22" y2="12" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2"/>
      </svg>
    ),
  },
  {
    key: 'events',
    label: 'Events',
    path: '/events',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect
          x="3" y="4" width="18" height="18" rx="2"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          fill={active ? 'rgba(16,185,129,0.1)' : 'none'}
        />
        <line x1="16" y1="2" x2="16" y2="6" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="2" x2="8" y2="6" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
        <line x1="3" y1="10" x2="21" y2="10" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2"/>
        <rect x="8" y="14" width="3" height="3" rx="0.5" fill={active ? '#10b981' : '#9ca3af'}/>
      </svg>
    ),
  },
  {
    key: 'research',
    label: 'Research',
    path: '/research',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle
          cx="11" cy="11" r="8"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          fill={active ? 'rgba(16,185,129,0.1)' : 'none'}
        />
        <line x1="21" y1="21" x2="16.65" y2="16.65" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="2" strokeLinecap="round"/>
        <line x1="8" y1="11" x2="14" y2="11" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="11" y1="8" x2="11" y2="14" stroke={active ? '#10b981' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: 'messages',
    label: 'Messages',
    path: '/messages',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke={active ? '#10b981' : '#9ca3af'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill={active ? 'rgba(16,185,129,0.1)' : 'none'}
        />
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
        background: '#fff',
        borderTop: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        flexShrink: 0,
        paddingBottom: 4,
      }}
    >
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path)
        return (
          <button
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '4px 12px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              borderRadius: 12,
              transition: 'background 0.15s',
              minWidth: 56,
            }}
          >
            {tab.icon(active)}
            <span
              style={{
                fontSize: 10,
                fontWeight: active ? 600 : 400,
                color: active ? '#10b981' : '#9ca3af',
                fontFamily: 'Inter, sans-serif',
                lineHeight: 1,
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
