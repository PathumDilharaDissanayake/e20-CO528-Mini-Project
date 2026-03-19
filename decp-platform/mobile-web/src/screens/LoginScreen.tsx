import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NeuralNetworkBg from '../components/NeuralNetworkBg'

export default function LoginScreen() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/feed', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#060C09', overflowY: 'auto', position: 'relative' }}>
      {/* Neural network background */}
      <NeuralNetworkBg nodeCount={42} distThresh={130} opacity={0.85} />

      {/* Radial gradient overlays */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 10%, rgba(0,217,138,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(0,229,204,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />

      <div style={{ position: 'relative', zIndex: 1, padding: '48px 24px 32px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(0,217,138,0.12)', border: '1px solid rgba(0,217,138,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', boxShadow: '0 0 30px rgba(0,217,138,0.12)' }}>
            <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="14" fill="rgba(0,217,138,0.12)"/>
              <path d="M13 20l5 5 9-10" stroke="#00D98A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 32, fontWeight: 900, margin: '0 0 6px', color: '#E8FFF4', letterSpacing: '-1px' }}>
            DECP
          </h1>
          <p style={{ fontSize: 13, color: '#7A9E8E', fontFamily: 'Space Grotesk, sans-serif', margin: 0 }}>
            Digital Education &amp; Career Platform
          </p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(8,18,12,0.88)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(0,217,138,0.1)', borderRadius: 22, padding: '28px 22px' }}>
          <h2 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 21, fontWeight: 800, color: '#E8FFF4', margin: '0 0 4px' }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: '#7A9E8E', margin: '0 0 22px' }}>Sign in to continue your journey</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: focused === 'email' ? '#00D98A' : '#7A9E8E', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.2s' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={focused === 'email' ? '#00D98A' : '#2D4A3E'} strokeWidth="2" style={{ transition: 'stroke 0.2s' }}/>
                    <polyline points="22,6 12,13 2,6" stroke={focused === 'email' ? '#00D98A' : '#2D4A3E'} strokeWidth="2" style={{ transition: 'stroke 0.2s' }}/>
                  </svg>
                </div>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '13px 14px 13px 44px', borderRadius: 14, background: 'rgba(0,217,138,0.04)', border: focused === 'email' ? '1.5px solid rgba(0,217,138,0.5)' : '1px solid rgba(0,217,138,0.1)', fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box', boxShadow: focused === 'email' ? '0 0 0 3px rgba(0,217,138,0.08)' : 'none', transition: 'all 0.2s' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: focused === 'password' ? '#00E5CC' : '#7A9E8E', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.2s' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="11" width="18" height="11" rx="2" stroke={focused === 'password' ? '#00E5CC' : '#2D4A3E'} strokeWidth="2" style={{ transition: 'stroke 0.2s' }}/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={focused === 'password' ? '#00E5CC' : '#2D4A3E'} strokeWidth="2" style={{ transition: 'stroke 0.2s' }}/>
                  </svg>
                </div>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused(null)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '13px 44px 13px 44px', borderRadius: 14, background: 'rgba(0,217,138,0.04)', border: focused === 'password' ? '1.5px solid rgba(0,229,204,0.5)' : '1px solid rgba(0,217,138,0.1)', fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box', boxShadow: focused === 'password' ? '0 0 0 3px rgba(0,229,204,0.08)' : 'none', transition: 'all 0.2s' }}
                />
                <button type="button" onClick={() => setShowPass((p) => !p)} aria-label="Toggle password" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    {showPass
                      ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/></>
                      : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#2D4A3E" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#2D4A3E" strokeWidth="2"/></>
                    }
                  </svg>
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(255,95,109,0.08)', border: '1px solid rgba(255,95,109,0.25)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#FF8F9A' }}>
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className={loading ? '' : 'btn-primary'}
              style={loading ? { width: '100%', padding: '15px 0', borderRadius: 16, background: 'rgba(255,255,255,0.04)', color: '#2D4A3E', fontWeight: 700, fontSize: 15, border: '1px solid rgba(0,217,138,0.08)', cursor: 'not-allowed', fontFamily: 'Space Grotesk, sans-serif', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50 } : { width: '100%', padding: '15px 0', borderRadius: 16, fontSize: 15, fontFamily: 'Space Grotesk, sans-serif', marginTop: 4, letterSpacing: '0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50 }}
            >
              {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,217,138,0.1)' }} />
            <span style={{ fontSize: 12, color: '#2D4A3E' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(0,217,138,0.1)' }} />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 13, color: '#7A9E8E' }}>Don't have an account?{' '}</span>
            <Link to="/register" style={{ fontSize: 13, fontWeight: 700, color: '#00D98A', textDecoration: 'none' }}>
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
