import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/TopBar'
import LoadingSpinner from '../components/LoadingSpinner'
import api from '../api'
import Avatar from '../components/Avatar'

type Tab = 'people' | 'posts' | 'jobs' | 'events'

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: 'people', label: 'People', color: '#00D98A' },
  { key: 'posts',  label: 'Posts',  color: '#4F8EF7' },
  { key: 'jobs',   label: 'Jobs',   color: '#00E5CC' },
  { key: 'events', label: 'Events', color: '#A066FA' },
]

export default function SearchScreen() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('people')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delay = setTimeout(() => {
      if (query.trim().length > 0) doSearch(query.trim())
      else setResults([])
    }, 400)
    return () => clearTimeout(delay)
  }, [query, tab])

  const doSearch = async (q: string) => {
    setLoading(true)
    try {
      let res: any
      if (tab === 'people') res = await api.get(`/users/search?q=${encodeURIComponent(q)}&limit=20`)
      else if (tab === 'posts') res = await api.get(`/posts?search=${encodeURIComponent(q)}&limit=20`)
      else if (tab === 'jobs') res = await api.get(`/jobs?search=${encodeURIComponent(q)}&limit=20`)
      else res = await api.get(`/events?search=${encodeURIComponent(q)}&limit=20`)
      const data = res.data?.users || res.data?.posts || res.data?.jobs || res.data?.events
        || res.data?.data?.users || res.data?.data?.posts || res.data?.data?.jobs || res.data?.data?.events
        || res.data?.data || res.data
      setResults(Array.isArray(data) ? data : [])
    } catch { setResults([]) } finally { setLoading(false) }
  }

  const activeTab = TABS.find((t) => t.key === tab)!

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky search header */}
      <div style={{ padding: '0 0 0', background: 'rgba(6,12,9,0.92)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(0,217,138,0.08)', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ padding: '12px 14px 0' }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#2D4A3E" strokeWidth="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#2D4A3E" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${tab}…`}
              autoFocus
              style={{ width: '100%', padding: '13px 40px 13px 44px', borderRadius: 16, background: 'rgba(0,217,138,0.05)', border: '1px solid rgba(0,217,138,0.12)', fontSize: 15, color: '#E8FFF4', boxSizing: 'border-box' }}
            />
            {query && (
              <button onClick={() => { setQuery(''); setResults([]) }} aria-label="Clear search" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="rgba(0,217,138,0.1)"/>
                  <line x1="15" y1="9" x2="9" y2="15" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="9" y1="9" x2="15" y2="15" stroke="#7A9E8E" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, paddingBottom: 0 }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex: 1, padding: '8px 4px', border: 'none', background: 'transparent', color: tab === t.key ? t.color : '#2D4A3E', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderBottom: tab === t.key ? `2px solid ${t.color}` : '2px solid transparent', transition: 'all 0.2s', minHeight: 40 }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 16px' }}>
        {!query ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(0,217,138,0.08)', border: '1px solid rgba(0,217,138,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#00D98A" strokeWidth="1.5"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#00D98A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ color: '#7A9E8E', fontSize: 14, margin: '0 0 6px' }}>Search for {tab}</p>
            <p style={{ color: '#2D4A3E', fontSize: 12, margin: 0 }}>Type to discover people, posts, jobs &amp; events</p>
          </div>
        ) : loading ? (
          <LoadingSpinner />
        ) : results.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#7A9E8E', fontSize: 14 }}>
            No {tab} found for "{query}"
          </div>
        ) : tab === 'people' ? (
          results.map((u) => {
            const uid = u._id || u.id
            const name = `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User'
            return (
              <div key={uid} onClick={() => navigate('/profile')} className="animate-fade-in-up"
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 16, marginBottom: 8, cursor: 'pointer', minHeight: 64 }}
              >
                <Avatar src={u.avatar || u.profilePicture} name={name} size={46} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4' }}>{name}</div>
                  <div style={{ fontSize: 12, color: '#7A9E8E', textTransform: 'capitalize' }}>{u.role || 'Member'}{u.headline ? ` · ${u.headline}` : ''}</div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/></svg>
              </div>
            )
          })
        ) : tab === 'posts' ? (
          results.map((post) => {
            const pid = post.id || post._id
            const author = post.author || post.user || {}
            const authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim() || 'Anonymous'
            return (
              <div key={pid} className="animate-fade-in-up" style={{ padding: '14px', background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 16, marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#7A9E8E', marginBottom: 6 }}>{authorName}</div>
                <p style={{ fontSize: 14, color: '#A8C8BA', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{post.content}</p>
              </div>
            )
          })
        ) : tab === 'jobs' ? (
          results.map((job) => {
            const jid = job.id || job._id
            return (
              <div key={jid} className="animate-fade-in-up" style={{ padding: '14px', background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 16, marginBottom: 8 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4', marginBottom: 3 }}>{job.title}</div>
                <div style={{ fontSize: 13, color: '#7A9E8E' }}>{job.company}{job.location ? ` · ${job.location}` : ''}</div>
              </div>
            )
          })
        ) : (
          results.map((event) => {
            const eid = event.id || event._id
            return (
              <div key={eid} className="animate-fade-in-up" style={{ padding: '14px', background: 'rgba(8,18,12,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,217,138,0.08)', borderRadius: 16, marginBottom: 8 }}>
                <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 14, color: '#E8FFF4', marginBottom: 3 }}>{event.title}</div>
                <div style={{ fontSize: 13, color: '#7A9E8E' }}>{event.location}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
