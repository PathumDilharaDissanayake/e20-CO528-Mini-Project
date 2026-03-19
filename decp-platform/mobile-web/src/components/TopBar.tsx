import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: ReactNode
}

export default function TopBar({ title, showBack, onBack, rightAction }: TopBarProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) onBack()
    else navigate(-1)
  }

  return (
    <div
      style={{
        height: 56,
        background: '#fff',
        borderBottom: '1px solid #f3f4f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Left: back button or spacer */}
      <div style={{ width: 40, display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <button
            onClick={handleBack}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              color: '#10b981',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Center: title */}
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 700,
          fontSize: 17,
          color: '#111827',
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </span>

      {/* Right: action */}
      <div style={{ width: 40, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
