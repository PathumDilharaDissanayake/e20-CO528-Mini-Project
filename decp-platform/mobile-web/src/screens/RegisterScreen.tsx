import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'Student', label: 'Student', emoji: '🎓' },
  { value: 'Faculty', label: 'Faculty', emoji: '👨‍🏫' },
  { value: 'Alumni', label: 'Alumni', emoji: '🏛️' },
]

export default function RegisterScreen() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'Student',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const { firstName, lastName, email, password } = form
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      await register(form)
      navigate('/feed', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        height: '100%',
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 160,
          background: 'linear-gradient(160deg, #064e3b 0%, #065f46 40%, #059669 70%, #10b981 100%)',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}/>
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 16,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.25)',
          }}
        >
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Inter, sans-serif' }}>D</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Inter, sans-serif' }}>
          Create Account
        </div>
      </div>

      {/* Form */}
      <div style={{ padding: '24px 24px 32px', flex: 1 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Name row */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 5 }}>
                First Name
              </label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="John"
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  borderRadius: 14,
                  background: '#f9fafb',
                  border: '1.5px solid #e5e7eb',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 5 }}>
                Last Name
              </label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="Doe"
                style={{
                  width: '100%',
                  padding: '12px 12px',
                  borderRadius: 14,
                  background: '#f9fafb',
                  border: '1.5px solid #e5e7eb',
                  fontSize: 13,
                  fontFamily: 'Inter, sans-serif',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 5 }}>
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 14,
                background: '#f9fafb',
                border: '1.5px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: '#111827',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 5 }}>
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Min. 6 characters"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 14,
                background: '#f9fafb',
                border: '1.5px solid #e5e7eb',
                fontSize: 13,
                fontFamily: 'Inter, sans-serif',
                color: '#111827',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Role selector */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 8 }}>
              I am a...
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => handleChange('role', r.value)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    borderRadius: 14,
                    border: form.role === r.value ? '2px solid #10b981' : '1.5px solid #e5e7eb',
                    background: form.role === r.value ? 'rgba(16,185,129,0.08)' : '#f9fafb',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{r.emoji}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: form.role === r.value ? '#059669' : '#6b7280',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {r.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                padding: '10px 14px',
                fontSize: 12,
                color: '#dc2626',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 16,
              background: loading ? '#a7f3d0' : 'linear-gradient(135deg, #064e3b, #10b981)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                Creating account…
              </>
            ) : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
            Already have an account?{' '}
          </span>
          <Link
            to="/login"
            style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
