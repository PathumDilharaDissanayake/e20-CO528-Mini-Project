import { ReactNode } from 'react'
import NeuralNetworkBg from './NeuralNetworkBg'

interface PhoneFrameProps {
  children: ReactNode
}

export default function PhoneFrame({ children }: PhoneFrameProps) {
  return (
    <div
      style={{
        minHeight: '100svh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #1C1D20 0%, #18191C 50%, #1A1B1E 100%)',
        padding: '20px 0',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Neural network animation */}
      <NeuralNetworkBg nodeCount={65} distThresh={170} />

      {/* Subtle vignette corners */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(10,11,13,0.6) 100%)',
      }} />

      {/* Ambient green glow behind phone */}
      <div style={{
        position: 'absolute',
        width: 480, height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(0,217,138,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
        left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(20px)',
      }} />

      {/* Phone bezel */}
      <div
        style={{
          width: 390,
          height: 844,
          borderRadius: 44,
          border: '1.5px solid rgba(255,255,255,0.1)',
          background: '#060C09',
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          zIndex: 2,
          boxShadow: [
            '0 0 0 1px rgba(0,217,138,0.06)',
            '0 0 0 4px rgba(15,16,18,0.95)',
            '0 0 0 5.5px rgba(255,255,255,0.06)',
            '0 50px 120px rgba(0,0,0,0.9)',
            '0 0 80px rgba(0,217,138,0.06)',
            '0 20px 60px rgba(0,0,0,0.7)',
            'inset 0 0 0 1px rgba(255,255,255,0.02)',
          ].join(','),
        }}
      >
        {/* Physical buttons */}
        <div style={{ position: 'absolute', left: -3, top: 108, width: 3, height: 28, background: 'rgba(255,255,255,0.12)', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', left: -3, top: 148, width: 3, height: 28, background: 'rgba(255,255,255,0.12)', borderRadius: '2px 0 0 2px' }} />
        <div style={{ position: 'absolute', right: -3, top: 130, width: 3, height: 56, background: 'rgba(255,255,255,0.12)', borderRadius: '0 2px 2px 0' }} />

        {/* Status bar */}
        <div
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 44,
            zIndex: 50,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            padding: '0 22px 6px',
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(6,12,9,0.8), transparent)',
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(232,255,244,0.9)', fontFamily: 'Space Grotesk, sans-serif' }}>9:41</span>
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 120, height: 34, background: '#000', borderRadius: 20, zIndex: 60 }} />
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="16" height="11" viewBox="0 0 17 12" fill="rgba(232,255,244,0.85)">
              <rect x="0" y="4" width="3" height="8" rx="1"/>
              <rect x="4.5" y="2.5" width="3" height="9.5" rx="1"/>
              <rect x="9" y="1" width="3" height="11" rx="1"/>
              <rect x="13.5" y="0" width="3" height="12" rx="1" opacity="0.3"/>
            </svg>
            <svg width="15" height="11" viewBox="0 0 16 12" fill="none">
              <circle cx="8" cy="10.5" r="1.5" fill="rgba(232,255,244,0.85)"/>
              <path d="M4.5 7.5a4.95 4.95 0 0 1 7 0" stroke="rgba(232,255,244,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M1.5 4.5a9 9 0 0 1 13 0" stroke="rgba(232,255,244,0.85)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <svg width="24" height="11" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="rgba(232,255,244,0.4)" strokeWidth="1"/>
              <rect x="2" y="2" width="16" height="8" rx="2" fill="rgba(232,255,244,0.85)"/>
              <path d="M22.5 4v4a2 2 0 0 0 0-4z" fill="rgba(232,255,244,0.4)"/>
            </svg>
          </div>
        </div>

        {/* App content */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: '#060C09', borderRadius: 42, overflow: 'hidden' }}>
          <div style={{ height: '100%', paddingTop: 44, boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', width: 134, height: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 3, zIndex: 60, pointerEvents: 'none' }} />
      </div>

      {/* Caption */}
      <div style={{
        position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
        color: 'rgba(0,217,138,0.25)',
        fontSize: 11, fontFamily: 'Space Grotesk, sans-serif',
        letterSpacing: '0.16em', whiteSpace: 'nowrap', textTransform: 'uppercase',
        zIndex: 3,
      }}>
        DECP Mobile Platform
      </div>
    </div>
  )
}
