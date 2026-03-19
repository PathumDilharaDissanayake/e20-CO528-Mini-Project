export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        gap: 12,
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '2.5px solid rgba(255,255,255,0.08)',
          borderTopColor: '#3B82F6',
          animation: 'spin 0.7s linear infinite',
        }}
      />
      <span style={{ fontSize: 12, color: '#4B5A6A', fontFamily: 'Space Grotesk, sans-serif' }}>
        Loading…
      </span>
    </div>
  )
}
