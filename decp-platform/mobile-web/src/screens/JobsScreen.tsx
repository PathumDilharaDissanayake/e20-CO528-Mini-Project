import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import JobCard from '../components/JobCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import api from '../api'

const MOCK_JOBS = [
  {
    id: '1',
    title: 'Software Engineer Intern',
    company: 'WSO2',
    location: 'Colombo, LK',
    type: 'Internship',
    description: 'Join our platform engineering team to work on cutting-edge API management and integration solutions.',
    salary: 'LKR 60,000/mo',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Full Stack Developer',
    company: 'IronOne Technologies',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build scalable web applications using React, Node.js and PostgreSQL. Work with a talented agile team.',
    salary: 'LKR 150,000–250,000/mo',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    title: 'Data Science Researcher',
    company: 'University of Peradeniya',
    location: 'Peradeniya, LK',
    type: 'Contract',
    description: 'Conduct research on NLP and machine learning for Sinhala language processing.',
    salary: 'LKR 80,000/mo',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: '4',
    title: 'Mobile Developer (React Native)',
    company: 'Dialog Axiata',
    location: 'Colombo, LK',
    type: 'Full-time',
    description: 'Develop and maintain mobile applications for millions of Sri Lankan users.',
    salary: 'LKR 200,000+/mo',
    createdAt: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: '5',
    title: 'UI/UX Design Intern',
    company: 'Orion City Tech',
    location: 'Hybrid',
    type: 'Internship',
    description: 'Design beautiful user interfaces for fintech products. Figma and prototyping experience preferred.',
    salary: 'LKR 40,000/mo',
    createdAt: new Date(Date.now() - 432000000).toISOString(),
  },
]

const FILTERS = ['All', 'Full-time', 'Part-time', 'Internship', 'Contract', 'Remote']

export default function JobsScreen() {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await api.get('/jobs')
        const data = res.data?.jobs || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          setJobs(data)
        } else {
          setJobs(MOCK_JOBS)
        }
      } catch {
        setJobs(MOCK_JOBS)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  const filtered = jobs.filter((j) => {
    const matchSearch =
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.company?.toLowerCase().includes(search.toLowerCase())
    const matchFilter =
      activeFilter === 'All' || j.type === activeFilter || j.jobType === activeFilter || j.employmentType === activeFilter
    return matchSearch && matchFilter
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <TopBar title="Jobs" />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Search */}
        <div style={{ padding: '12px 14px 0' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs or companies…"
              style={{
                width: '100%',
                padding: '11px 14px 11px 38px',
                borderRadius: 16,
                background: '#fff',
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: '#111827',
                boxSizing: 'border-box',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div
          className="scrollbar-hide"
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 14px',
            overflowX: 'auto',
          }}
        >
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                flexShrink: 0,
                padding: '6px 14px',
                borderRadius: 20,
                border: activeFilter === f ? 'none' : '1px solid #e5e7eb',
                background: activeFilter === f ? '#10b981' : '#fff',
                color: activeFilter === f ? '#fff' : '#6b7280',
                fontSize: 12,
                fontWeight: activeFilter === f ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                transition: 'all 0.15s',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{ padding: '0 14px 10px' }}>
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} {filtered.length === 1 ? 'opportunity' : 'opportunities'} found
          </span>
        </div>

        {/* Jobs list */}
        <div style={{ padding: '0 14px 8px' }}>
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState icon="💼" title="No jobs found" subtitle="Try adjusting your search or filters" />
          ) : (
            filtered.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
      </div>
    </div>
  )
}
