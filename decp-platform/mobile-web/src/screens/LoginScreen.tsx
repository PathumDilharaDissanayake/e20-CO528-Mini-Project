import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/feed', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Login failed. Check your credentials.')
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
      {/* Top decorative gradient */}
      <div
        style={{
          height: 220,
          background: 'linear-gradient(160deg, #064e3b 0%, #065f46 40%, #059669 70%, #10b981 100%)',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{
          position: 'absolute', top: -40, right: -40,
          width: 150, height: 150, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }}/>
        <div style={{
          position: 'absolute', bottom: -20, left: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)'
        }}/>

        {/* Logo */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid rgba(255,255,255,0.25)',
          }}
        >
          <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', fontFamily: 'Inter, sans-serif', letterSpacing: '-2px' }}>
            D
          </span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.5px' }}>
            DECP
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif' }}>
            Digital Education & Career Platform
          </div>
        </div>
      </div>

      {/* Form area */}
      <div style={{ padding: '32px 24px 24px', flex: 1 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#111827', fontFamily: 'Inter, sans-serif', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
          Welcome back
        </h2>
        <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'Inter, sans-serif', margin: '0 0 28px' }}>
          Sign in to your account to continue
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#9ca3af" strokeWidth="2"/>
                  <polyline points="22,6 12,13 2,6" stroke="#9ca3af" strokeWidth="2"/>
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  padding: '13px 14px 13px 40px',
                  borderRadius: 16,
                  background: '#f9fafb',
                  border: '1.5px solid #e5e7eb',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'Inter, sans-serif', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#9ca3af" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#9ca3af" strokeWidth="2"/>
                </svg>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%',
                  padding: '13px 44px 13px 40px',
                  borderRadius: 16,
                  background: '#f9fafb',
                  border: '1.5px solid #e5e7eb',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  color: '#111827',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 2 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  {showPass ? (
                    <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/></>
                  ) : (
                    <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9ca3af" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#9ca3af" strokeWidth="2"/></>
                  )}
                </svg>
              </button>
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
                fontSize: 13,
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
              letterSpacing: '0.01em',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                Signing in…
              </>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
          <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'Inter, sans-serif' }}>or</span>
          <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
        </div>

        {/* Register link */}
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#6b7280', fontFamily: 'Inter, sans-serif' }}>
            Don't have an account?{' '}
          </span>
          <Link
            to="/register"
            style={{ fontSize: 13, fontWeight: 700, color: '#059669', fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
