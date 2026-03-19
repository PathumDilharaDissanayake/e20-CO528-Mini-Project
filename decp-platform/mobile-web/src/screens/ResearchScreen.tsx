import { useState, useEffect } from 'react'
import TopBar from '../components/TopBar'
import ResearchCard from '../components/ResearchCard'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import { useAuth } from '../context/AuthContext'
import api from '../api'

const MOCK_RESEARCH = [
  {
    id: '1',
    title: 'Smart Traffic Management Using Deep Reinforcement Learning',
    description: 'Developing an adaptive traffic signal control system using DRL to reduce congestion in urban areas.',
    field: 'Artificial Intelligence',
    status: 'Active',
    progress: 65,
    membersCount: 4,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '2',
    title: 'Blockchain-Based Academic Credential Verification',
    description: 'A decentralized system for issuing and verifying academic credentials using Ethereum smart contracts.',
    field: 'Blockchain',
    status: 'Recruiting',
    progress: 20,
    membersCount: 2,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: '3',
    title: 'Sinhala NLP: Sentiment Analysis for Social Media',
    description: 'Building NLP models capable of performing sentiment analysis on Sinhala text from social media platforms.',
    field: 'Natural Language Processing',
    status: 'Active',
    progress: 48,
    membersCount: 3,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: '4',
    title: 'IoT-Based Smart Agriculture Monitoring System',
    description: 'Low-cost IoT sensors and cloud platform for real-time monitoring of soil moisture, temperature and crop health.',
    field: 'Internet of Things',
    status: 'Completed',
    progress: 100,
    membersCount: 5,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: '5',
    title: 'Cybersecurity Framework for Critical Infrastructure',
    description: 'Designing a comprehensive cybersecurity framework to protect national critical infrastructure from advanced threats.',
    field: 'Cybersecurity',
    status: 'Planning',
    progress: 10,
    membersCount: 1,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
]

const TABS = ['All', 'My Projects']

export default function ResearchScreen() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('All')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchResearch = async () => {
      try {
        const res = await api.get('/research')
        const data = res.data?.projects || res.data?.data || res.data
        if (Array.isArray(data) && data.length > 0) {
          setProjects(data)
        } else {
          setProjects(MOCK_RESEARCH)
        }
      } catch {
        setProjects(MOCK_RESEARCH)
      } finally {
        setLoading(false)
      }
    }
    fetchResearch()
  }, [])

  const filtered = projects.filter((p) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      (p.field || p.researchField || '').toLowerCase().includes(search.toLowerCase())
    const matchTab =
      activeTab === 'All' ||
      (activeTab === 'My Projects' &&
        (p.userId === user?.id || p.createdById === user?.id || p.ownerId === user?.id))
    return matchSearch && matchTab
  })

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <TopBar
        title="Research"
        rightAction={
          <button style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 4 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#374151" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="16" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="12" x2="16" y2="12" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        }
      />

      <div className="phone-content scrollbar-hide" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, padding: '12px 14px 0', background: '#f9fafb' }}>
          <div
            style={{
              display: 'flex',
              background: '#fff',
              borderRadius: 14,
              border: '1px solid #f3f4f6',
              padding: 3,
              gap: 0,
              width: '100%',
            }}
          >
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: 11,
                  border: 'none',
                  background: activeTab === tab ? '#10b981' : 'transparent',
                  color: activeTab === tab ? '#fff' : '#6b7280',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: 13,
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s',
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{ padding: '10px 14px 0' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects or fields…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 36px',
                borderRadius: 14,
                background: '#fff',
                border: '1px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: '#111827',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Count */}
        <div style={{ padding: '8px 14px 6px' }}>
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>
            {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
          </span>
        </div>

        {/* Research list */}
        <div style={{ padding: '0 14px 8px' }}>
          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="🔬"
              title={activeTab === 'My Projects' ? 'No projects yet' : 'No research found'}
              subtitle={activeTab === 'My Projects' ? 'Create or join a research project' : 'Try different search terms'}
            />
          ) : (
            filtered.map((p) => <ResearchCard key={p.id} project={p} />)
          )}
        </div>
      </div>
    </div>
  )
}
