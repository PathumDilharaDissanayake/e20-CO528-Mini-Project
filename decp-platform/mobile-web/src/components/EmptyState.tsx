interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}

export default function EmptyState({ title, subtitle, action }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#4B5A6A" strokeWidth="1.5"/>
          <path d="M8 10h8M8 14h5" stroke="#4B5A6A" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <h3 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 16, fontWeight: 700, color: '#94A3B8', margin: '0 0 6px' }}>{title}</h3>
      {subtitle && <p style={{ fontSize: 13, color: '#4B5A6A', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>{subtitle}</p>}
      {action && (
        <button
          onClick={action.onClick}
          style={{ marginTop: 16, padding: '10px 20px', borderRadius: 12, background: 'linear-gradient(135deg, #3B82F6, #6366F1)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 44 }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
