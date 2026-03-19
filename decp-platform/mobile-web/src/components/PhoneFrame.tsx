import { ReactNode } from 'react'

interface PhoneFrameProps {
  children: ReactNode
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    /* Full viewport — deep space background */
    <div
      className="min-h-screen w-full flex items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 50% 30%, #0f2027 0%, #1a1a2e 50%, #0d0d1a 100%)',
        padding: '20px 0',
      }}
    >
      {/* Subtle ambient glow behind phone */}
      <div
        style={{
          position: 'absolute',
          width: 480,
          height: 900,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse, rgba(16,185,129,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Phone bezel */}
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          border: '3px solid #2a2a2a',
          background: '#000',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          /* Layered shadows for realism */
          boxShadow: `
            0 0 0 1px #111,
            0 0 0 4px #1c1c1e,
            0 0 0 5px #2a2a2a,
            0 40px 80px rgba(0,0,0,0.9),
            0 20px 40px rgba(0,0,0,0.7),
            inset 0 0 0 1px rgba(255,255,255,0.05)
          `,
        }}
      >
        {/* Side buttons (decorative) */}
        {/* Volume up */}
        <div
          style={{
            position: 'absolute',
            left: -5,
            top: 120,
            width: 4,
            height: 32,
            background: '#2a2a2a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        {/* Volume down */}
        <div
          style={{
            position: 'absolute',
            left: -5,
            top: 162,
            width: 4,
            height: 32,
            background: '#2a2a2a',
            borderRadius: '2px 0 0 2px',
          }}
        />
        {/* Power button */}
        <div
          style={{
            position: 'absolute',
            right: -5,
            top: 140,
            width: 4,
            height: 60,
            background: '#2a2a2a',
            borderRadius: '0 2px 2px 0',
          }}
        />

        {/* Status bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 44,
            background: 'transparent',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            padding: '0 24px 6px',
            pointerEvents: 'none',
          }}
        >
          {/* Time */}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#000', fontFamily: 'Inter, sans-serif' }}>
            9:41
          </span>
          {/* Dynamic island / notch */}
          <div
            style={{
              position: 'absolute',
              top: 10,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 120,
              height: 34,
              background: '#000',
              borderRadius: 20,
              zIndex: 60,
              pointerEvents: 'none',
            }}
          />
          {/* Icons */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Signal */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="#000">
              <rect x="0" y="4" width="3" height="8" rx="1"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1"/>
            </svg>
            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="#000" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 10.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill="#000" stroke="none"/>
              <path d="M4.5 7.5a4.95 4.95 0 0 1 7 0"/>
              <path d="M1.5 4.5a9 9 0 0 1 13 0"/>
            </svg>
            {/* Battery */}
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="#000" strokeWidth="1"/>
              <rect x="2" y="2" width="16" height="8" rx="2" fill="#000"/>
              <path d="M22.5 4v4a2 2 0 0 0 0-4z" fill="#000"/>
            </svg>
          </div>
        </div>

        {/* App content area */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#f9fafb',
            borderRadius: 42,
            overflow: 'hidden',
          }}
        >
          {/* Padding top for status bar */}
          <div style={{ height: '100%', paddingTop: 44, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>

        {/* Bottom home indicator */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 134,
            height: 5,
            background: 'rgba(0,0,0,0.25)',
            borderRadius: 3,
            zIndex: 60,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Label below phone */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(255,255,255,0.3)',
          fontSize: 12,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.1em',
          whiteSpace: 'nowrap',
        }}
      >
        DECP Mobile · Demo
      </div>
    </div>
  )
}
