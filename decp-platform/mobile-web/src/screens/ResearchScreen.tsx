import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api, { resolveImageUrl } from '../api'

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  ongoing:    { color: '#00D98A', bg: 'rgba(0,217,138,0.1)',  border: 'rgba(0,217,138,0.2)' },
  completed:  { color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.2)' },
  proposed:   { color: '#B5E853', bg: 'rgba(181,232,83,0.1)', border: 'rgba(181,232,83,0.2)' },
  recruiting: { color: '#A066FA', bg: 'rgba(160,102,250,0.1)', border: 'rgba(160,102,250,0.2)' },
}

const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.12)', fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box' as const }

export default function ResearchScreen() {
  const [papers, setPapers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [collaborated, setCollaborated] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [newPaper, setNewPaper] = useState({ title: '', abstract: '', keywords: '', status: 'ongoing', collaborators: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/research?limit=30')
        const data = res.data?.papers || res.data?.data?.papers || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) setPapers(data)
      } catch { /* silent */ } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleCollaborate = async (id: string) => {
    setCollaborated((p) => new Set(p).add(id))
    try { await api.post(`/research/${id}/collaborate`) } catch { /* silent */ }
  }

  const handleCreate = async () => {
    if (!newPaper.title) return
    setPosting(true)
    try {
      const res = await api.post('/research', { ...newPaper, keywords: newPaper.keywords.split(',').map((s) => s.trim()).filter(Boolean) })
      const created = res.data?.paper || res.data?.data?.paper || res.data
      setPapers((p) => [created, ...p])
      setShowCreate(false)
    } catch { /* silent */ } finally { setPosting(false) }
  }

  const STATUSES = ['all', 'ongoing', 'completed', 'proposed', 'recruiting']
  const filtered = papers.filter((p) => filter === 'all' || (p.status || '').toLowerCase() === filter)

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Research"
        rightAction={
          <button onClick={() => setShowCreate(true)} aria-label="Add paper" style={{ border: '1px solid rgba(0,229,204,0.2)', background: 'rgba(0,229,204,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#00E5CC', fontSize: 12, fontWeight: 700, minHeight: 44 }}>
            Add
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {/* Hero */}
        <div style={{ borderRadius: 18, background: 'rgba(0,229,204,0.05)', border: '1px solid rgba(0,229,204,0.12)', padding: '16px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 17, color: '#E8FFF4', margin: '0 0 3px' }}>Research Hub</h2>
            <p style={{ fontSize: 12, color: '#7A9E8E', margin: 0 }}>{papers.length} projects listed</p>
          </div>
        </div>

        {/* Status filters */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }} className="scrollbar-hide">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              style={{ padding: '6px 12px', borderRadius: 20, border: filter === s ? '1px solid rgba(0,217,138,0.35)' : '1px solid rgba(0,217,138,0.1)', minHeight: 44, background: filter === s ? 'rgba(0,217,138,0.1)' : 'transparent', color: filter === s ? '#00D98A' : '#2D4A3E', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' }}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A9E8E', fontSize: 14 }}>No research found</div>
        ) : (
          filtered.map((paper) => {
            const paperId = paper.id || paper._id
            const status = (paper.status || 'ongoing').toLowerCase()
            const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.ongoing
            const keywords: string[] = Array.isArray(paper.keywords) ? paper.keywords : typeof paper.keywords === 'string' ? paper.keywords.split(',').map((s: string) => s.trim()).filter(Boolean) : []
            const isCollaborated = collaborated.has(paperId)

            return (
              <div key={paperId} className="animate-fade-in-up" style={{ background: 'rgba(8,18,12,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 18, marginBottom: 10, overflow: 'hidden' }}>
                {resolveImageUrl(paper.image || paper.imageUrl || paper.thumbnail || paper.coverImage) && (
                  <img
                    src={resolveImageUrl(paper.image || paper.imageUrl || paper.thumbnail || paper.coverImage)}
                    alt={paper.title}
                    style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                )}
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: '#E8FFF4', margin: 0, flex: 1, lineHeight: 1.4 }}>{paper.title}</h3>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}`, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>{status}</span>
                  </div>

                  {paper.abstract && <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{paper.abstract}</p>}

                  {keywords.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {keywords.slice(0, 4).map((kw, i) => (
                        <span key={i} style={{ padding: '3px 9px', borderRadius: 20, background: 'rgba(0,229,204,0.08)', color: '#00E5CC', border: '1px solid rgba(0,229,204,0.15)', fontSize: 10, fontWeight: 600 }}>{kw}</span>
                      ))}
                    </div>
                  )}

                  {paper.author && (
                    <span style={{ fontSize: 12, color: '#7A9E8E' }}>
                      by {typeof paper.author === 'string' ? paper.author : `${paper.author.firstName || ''} ${paper.author.lastName || ''}`.trim()}
                    </span>
                  )}

                  <button
                    onClick={() => handleCollaborate(paperId)}
                    disabled={isCollaborated}
                    className={isCollaborated ? '' : 'btn-primary'}
                    style={isCollaborated ? { width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(0,217,138,0.2)', background: 'rgba(0,217,138,0.06)', color: '#00D98A', fontWeight: 700, fontSize: 13, cursor: 'default', minHeight: 44 } : { width: '100%', padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 700, minHeight: 44 }}
                  >
                    {isCollaborated ? '✓ Collaborating' : 'Collaborate'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="animate-slide-up" style={{ background: '#080E0B', border: '1px solid rgba(0,217,138,0.15)', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(0,217,138,0.3)', margin: '12px auto 0' }} />
            <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,217,138,0.08)' }}>
              <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 17, color: '#E8FFF4', margin: 0 }}>Add Research</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Close" style={{ border: 'none', background: 'rgba(0,217,138,0.08)', cursor: 'pointer', borderRadius: 10, padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {[{ key: 'title', label: 'Paper Title', placeholder: 'Research paper title…' }, { key: 'keywords', label: 'Keywords (comma-separated)', placeholder: 'ML, AI, NLP' }].map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input type="text" value={(newPaper as any)[f.key]} onChange={(e) => setNewPaper((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Abstract</label>
                <textarea value={newPaper.abstract} onChange={(e) => setNewPaper((p) => ({ ...p, abstract: e.target.value }))} placeholder="Brief description…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</label>
                <select value={newPaper.status} onChange={(e) => setNewPaper((p) => ({ ...p, status: e.target.value }))} style={inputStyle}>
                  {['ongoing', 'completed', 'proposed', 'recruiting'].map((s) => <option key={s} value={s} style={{ background: '#080E0B' }}>{s}</option>)}
                </select>
              </div>
              <button onClick={handleCreate} disabled={!newPaper.title || posting} className={newPaper.title && !posting ? 'btn-primary' : ''} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, ...((!newPaper.title || posting) ? { background: 'rgba(255,255,255,0.04)', color: '#2D4A3E' } : {}) }}>
                {posting ? 'Adding…' : 'Add Research'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
