import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../api'

const JOB_TYPES: Record<string, { color: string; bg: string; border: string }> = {
  'full-time': { color: '#00D98A', bg: 'rgba(0,217,138,0.1)', border: 'rgba(0,217,138,0.2)' },
  'part-time': { color: '#00E5CC', bg: 'rgba(0,229,204,0.1)', border: 'rgba(0,229,204,0.2)' },
  internship:  { color: '#4F8EF7', bg: 'rgba(79,142,247,0.1)', border: 'rgba(79,142,247,0.2)' },
  remote:      { color: '#B5E853', bg: 'rgba(181,232,83,0.1)', border: 'rgba(181,232,83,0.2)' },
  contract:    { color: '#A066FA', bg: 'rgba(160,102,250,0.1)', border: 'rgba(160,102,250,0.2)' },
}

function formatSalary(salary: any): string | null {
  if (!salary) return null
  if (typeof salary === 'string') return salary
  if (typeof salary === 'number') return `$${salary.toLocaleString()}`
  if (typeof salary === 'object') {
    const cur = salary.currency || '$'
    const period = salary.period ? `/${salary.period}` : ''
    if (salary.min && salary.max) return `${cur}${Number(salary.min).toLocaleString()} – ${cur}${Number(salary.max).toLocaleString()}${period}`
    if (salary.min) return `${cur}${Number(salary.min).toLocaleString()}+${period}`
    if (salary.max) return `Up to ${cur}${Number(salary.max).toLocaleString()}${period}`
  }
  return null
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.12)', fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box' as const }

export default function JobsScreen() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', type: 'full-time', description: '' })
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/jobs?limit=30')
        const data = res.data?.jobs || res.data?.data?.jobs || res.data?.data || res.data
        if (Array.isArray(data)) setJobs(data)
      } catch { /* silent */ } finally { setLoading(false) }
    }
    fetch()
  }, [])

  const handleApply = async (jobId: string) => {
    setApplied((p) => new Set(p).add(jobId))
    try { await api.post(`/jobs/${jobId}/apply`) } catch { /* silent */ }
  }

  const handleCreate = async () => {
    if (!newJob.title || !newJob.company) return
    setPosting(true)
    try {
      const res = await api.post('/jobs', newJob)
      const created = res.data?.job || res.data?.data?.job || res.data
      setJobs((p) => [created, ...p])
      setShowCreate(false)
      setNewJob({ title: '', company: '', location: '', type: 'full-time', description: '' })
    } catch { /* silent */ } finally { setPosting(false) }
  }

  const FILTERS = ['all', 'full-time', 'part-time', 'internship', 'remote']
  const filtered = jobs.filter((j) => {
    if (filter !== 'all' && j.type !== filter) return false
    if (search && !`${j.title} ${j.company}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <TopBar
        title="Jobs"
        rightAction={
          <button onClick={() => setShowCreate(true)} aria-label="Post a job" style={{ border: '1px solid rgba(0,217,138,0.2)', background: 'rgba(0,217,138,0.08)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', color: '#00D98A', fontSize: 12, fontWeight: 700, minHeight: 44 }}>
            Post
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {/* Hero */}
        <div style={{ borderRadius: 18, background: 'rgba(0,217,138,0.05)', border: '1px solid rgba(0,217,138,0.1)', padding: '16px 18px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
          <div className="dot-grid" style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 800, fontSize: 17, color: '#E8FFF4', margin: '0 0 3px' }}>Career Opportunities</h2>
            <p style={{ fontSize: 12, color: '#7A9E8E', margin: 0 }}>{jobs.length} positions available</p>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 10 }}>
          <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="#2D4A3E" strokeWidth="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search jobs or companies…" style={{ width: '100%', padding: '11px 14px 11px 36px', borderRadius: 14, background: 'rgba(0,217,138,0.04)', border: '1px solid rgba(0,217,138,0.1)', fontSize: 13, color: '#E8FFF4', boxSizing: 'border-box' }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', marginBottom: 14, paddingBottom: 4 }} className="scrollbar-hide">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '6px 14px', borderRadius: 20, border: filter === f ? '1px solid rgba(0,217,138,0.4)' : '1px solid rgba(0,217,138,0.1)', minHeight: 44, background: filter === f ? 'rgba(0,217,138,0.12)' : 'transparent', color: filter === f ? '#00D98A' : '#2D4A3E', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', textTransform: 'capitalize' }}
            >
              {f === 'all' ? 'All Jobs' : f}
            </button>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#00D98A" strokeWidth="1.5"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#00D98A" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <p style={{ color: '#7A9E8E', fontSize: 14, margin: '0 0 4px' }}>{search || filter !== 'all' ? 'No matching jobs' : 'No jobs posted yet'}</p>
            <p style={{ color: '#2D4A3E', fontSize: 12, margin: 0 }}>Be the first to post an opportunity</p>
          </div>
        ) : (
          filtered.map((job) => {
            const jobId = job.id || job._id
            const type = (job.type || 'full-time').toLowerCase()
            const typeStyle = JOB_TYPES[type] || JOB_TYPES['full-time']
            const isApplied = applied.has(jobId) || job.isApplied

            return (
              <div key={jobId} className="animate-fade-in-up" style={{ background: 'rgba(8,18,12,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 18, marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: '#E8FFF4', margin: '0 0 3px' }}>{job.title}</h3>
                      <div style={{ fontSize: 13, color: '#7A9E8E' }}>{job.company}</div>
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}`, fontSize: 10, fontWeight: 700, textTransform: 'capitalize', flexShrink: 0 }}>{type}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    {job.location && <span style={{ fontSize: 11, color: '#7A9E8E' }}>{job.location}</span>}
                    {formatSalary(job.salary) && <span style={{ fontSize: 11, color: '#00D98A', fontWeight: 600 }}>{formatSalary(job.salary)}</span>}
                    <span style={{ fontSize: 11, color: '#2D4A3E', marginLeft: 'auto' }}>{timeAgo(job.createdAt)}</span>
                  </div>

                  {job.description && (
                    <p style={{ fontSize: 13, color: '#7A9E8E', margin: 0, lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{job.description}</p>
                  )}

                  <button
                    onClick={() => handleApply(jobId)}
                    disabled={isApplied}
                    className={isApplied ? '' : 'btn-primary'}
                    style={isApplied ? { width: '100%', padding: '11px', borderRadius: 12, border: '1px solid rgba(0,217,138,0.2)', background: 'rgba(0,217,138,0.06)', color: '#00D98A', fontWeight: 700, fontSize: 13, cursor: 'default', minHeight: 44 } : { width: '100%', padding: '11px', borderRadius: 12, fontSize: 13, fontWeight: 700, minHeight: 44 }}
                  >
                    {isApplied ? '✓ Applied' : 'Apply Now'}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Job Modal */}
      {showCreate && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div className="animate-slide-up" style={{ background: '#080E0B', border: '1px solid rgba(0,217,138,0.15)', borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '80%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'rgba(0,217,138,0.3)', margin: '12px auto 0' }} />
            <div style={{ padding: '14px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,217,138,0.08)' }}>
              <h3 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 17, color: '#E8FFF4', margin: 0 }}>Post a Job</h3>
              <button onClick={() => setShowCreate(false)} aria-label="Close" style={{ border: 'none', background: 'rgba(0,217,138,0.08)', cursor: 'pointer', borderRadius: 10, padding: 8, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><line x1="18" y1="6" x2="6" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              {[{ key: 'title', label: 'Job Title', placeholder: 'e.g. Software Engineer' }, { key: 'company', label: 'Company', placeholder: 'e.g. TechCorp' }, { key: 'location', label: 'Location', placeholder: 'e.g. Colombo / Remote' }].map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
                  <input type="text" value={(newJob as any)[f.key]} onChange={(e) => setNewJob((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</label>
                <select value={newJob.type} onChange={(e) => setNewJob((p) => ({ ...p, type: e.target.value }))} style={{ ...inputStyle }}>
                  {['full-time', 'part-time', 'internship', 'remote', 'contract'].map((t) => <option key={t} value={t} style={{ background: '#080E0B' }}>{t}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</label>
                <textarea value={newJob.description} onChange={(e) => setNewJob((p) => ({ ...p, description: e.target.value }))} placeholder="Describe the role…" rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <button onClick={handleCreate} disabled={!newJob.title || !newJob.company || posting} className={newJob.title && newJob.company && !posting ? 'btn-primary' : ''} style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', minHeight: 44, ...((!newJob.title || !newJob.company || posting) ? { background: 'rgba(255,255,255,0.04)', color: '#2D4A3E' } : {}) }}>
                {posting ? 'Posting…' : 'Post Job'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
