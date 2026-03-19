import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface TopBarProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: ReactNode
  transparent?: boolean
}

export default function TopBar({ title, showBack, onBack, rightAction, transparent }: TopBarProps) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        height: 56,
        background: transparent ? 'transparent' : 'rgba(6,12,9,0.85)',
        backdropFilter: transparent ? 'none' : 'blur(24px) saturate(140%)',
        WebkitBackdropFilter: transparent ? 'none' : 'blur(24px) saturate(140%)',
        borderBottom: transparent ? 'none' : '1px solid rgba(0,217,138,0.08)',
        boxShadow: transparent ? 'none' : '0 1px 0 rgba(0,217,138,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      {/* Left */}
      <div style={{ width: 44, display: 'flex', alignItems: 'center' }}>
        {showBack && (
          <button
            onClick={() => { if (onBack) onBack(); else navigate(-1) }}
            aria-label="Go back"
            style={{
              border: 'none',
              background: 'rgba(0,217,138,0.08)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 44,
              minHeight: 44,
              transition: 'background 0.2s',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#7A9E8E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Title */}
      <span
        style={{
          fontFamily: 'Archivo, sans-serif',
          fontWeight: 800,
          fontSize: 17,
          color: '#E8FFF4',
          letterSpacing: '-0.3px',
        }}
      >
        {title}
      </span>

      {/* Right */}
      <div style={{ width: 44, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        {rightAction}
      </div>
    </div>
  )
}
