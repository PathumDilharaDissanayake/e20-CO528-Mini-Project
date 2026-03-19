export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 120,
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div
        className="spinner"
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid rgba(16,185,129,0.15)`,
          borderTopColor: '#10b981',
        }}
      />
      <span
        style={{
          fontSize: 13,
          color: '#9ca3af',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        Loading…
      </span>
    </div>
  )
}
