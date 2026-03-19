import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NeuralNetworkBg from '../components/NeuralNetworkBg'

const ROLES = [
  { value: 'student',  label: 'Student',  color: '#00D98A', gradient: 'linear-gradient(135deg, #00D98A, #00C47C)', glow: 'rgba(0,217,138,0.35)',  desc: 'Currently studying' },
  { value: 'alumni',   label: 'Alumni',   color: '#00E5CC', gradient: 'linear-gradient(135deg, #00E5CC, #00B8A9)', glow: 'rgba(0,229,204,0.35)',  desc: 'Graduated professional' },
  { value: 'faculty',  label: 'Faculty',  color: '#4F8EF7', gradient: 'linear-gradient(135deg, #4F8EF7, #3B72D4)', glow: 'rgba(79,142,247,0.35)', desc: 'Academic staff' },
  { value: 'industry', label: 'Industry', color: '#B5E853', gradient: 'linear-gradient(135deg, #B5E853, #8FC22A)', glow: 'rgba(181,232,83,0.35)',  desc: 'Industry professional' },
]

const ROLE_ICONS: Record<string, JSX.Element> = {
  student: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#060C09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3.53 3.53 8.47 3.53 12 0v-5" stroke="#060C09" strokeWidth="2" strokeLinecap="round"/></svg>,
  alumni: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="6" stroke="#060C09" strokeWidth="2"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke="#060C09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  faculty: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#060C09" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  industry: <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" stroke="#060C09" strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke="#060C09" strokeWidth="2" strokeLinecap="round"/></svg>,
}

export default function RegisterScreen() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'student' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const setField = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setError('')
    if (!form.firstName || !form.email || !form.password) { setError('Please fill in all fields'); return }
    setLoading(true)
    try {
      await register(form)
      navigate('/feed', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find((r) => r.value === form.role) || ROLES[0]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto', position: 'relative', background: '#060C09' }}>
      <NeuralNetworkBg nodeCount={38} distThresh={125} opacity={0.8} />

      <div style={{ position: 'relative', zIndex: 1, padding: '36px 24px 32px', flex: 1 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <button
            onClick={() => step === 2 ? setStep(1) : navigate('/login')}
            aria-label="Go back"
            style={{ border: 'none', background: 'rgba(0,217,138,0.08)', cursor: 'pointer', borderRadius: 14, padding: 10, display: 'flex', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18l-6-6 6-6" stroke="#7A9E8E" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div>
            <h2 style={{ fontFamily: 'Archivo, sans-serif', fontSize: 20, fontWeight: 800, color: '#E8FFF4', margin: 0 }}>
              {step === 1 ? 'Choose your role' : 'Create account'}
            </h2>
            <p style={{ fontSize: 12, color: '#2D4A3E', fontFamily: 'Space Grotesk, sans-serif', margin: '2px 0 0' }}>
              Step {step} of 2
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(0,217,138,0.1)', borderRadius: 2, marginBottom: 22, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: step === 1 ? '50%' : '100%',
              background: 'linear-gradient(90deg, #00D98A, #00E5CC)',
              borderRadius: 2,
              transition: 'width 0.4s cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 0 10px rgba(0,217,138,0.4)',
            }}
          />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {step === 1 ? (
            <>
              <p style={{ fontSize: 13, color: '#7A9E8E', fontFamily: 'Space Grotesk, sans-serif', margin: '0 0 6px' }}>
                Select your role in the community:
              </p>
              {ROLES.map((r) => {
                const isSelected = form.role === r.value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setField('role', r.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '15px 16px',
                      borderRadius: 18,
                      border: isSelected ? `1.5px solid ${r.color}50` : '1px solid rgba(0,217,138,0.1)',
                      background: isSelected ? `${r.color}12` : 'rgba(8,18,12,0.7)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.25s',
                      boxShadow: isSelected ? `0 0 20px ${r.glow}` : 'none',
                    }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: 14,
                      background: isSelected ? r.gradient : 'rgba(0,217,138,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      transition: 'all 0.25s',
                    }}>
                      {isSelected
                        ? ROLE_ICONS[r.value]
                        : <svg width="22" height="22" viewBox="0 0 24 24" fill="none">{r.value === 'student'
                            ? <><path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke={r.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 12v5c3.53 3.53 8.47 3.53 12 0v-5" stroke={r.color} strokeWidth="2" strokeLinecap="round"/></>
                            : r.value === 'alumni'
                            ? <><circle cx="12" cy="8" r="6" stroke={r.color} strokeWidth="2"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke={r.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></>
                            : r.value === 'faculty'
                            ? <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke={r.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            : <><rect x="2" y="7" width="20" height="14" rx="2" stroke={r.color} strokeWidth="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" stroke={r.color} strokeWidth="2" strokeLinecap="round"/></>
                          }</svg>
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 700, fontSize: 15, color: isSelected ? '#E8FFF4' : '#7A9E8E', transition: 'color 0.2s' }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: 12, color: '#2D4A3E', fontFamily: 'Space Grotesk, sans-serif', marginTop: 2 }}>
                        {r.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill={r.color} opacity="0.2"/>
                          <path d="M8 12l3 3 5-5" stroke={r.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </button>
                )
              })}
            </>
          ) : (
            <>
              {/* Name fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'firstName', label: 'First Name', placeholder: 'John' },
                  { key: 'lastName', label: 'Last Name', placeholder: 'Doe' },
                ].map((f) => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: focused === f.key ? '#00D98A' : '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.2s' }}>
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={(form as any)[f.key]}
                      onChange={(e) => setField(f.key, e.target.value)}
                      onFocus={() => setFocused(f.key)}
                      onBlur={() => setFocused(null)}
                      placeholder={f.placeholder}
                      style={{
                        width: '100%', padding: '12px 12px',
                        borderRadius: 14,
                        background: 'rgba(0,217,138,0.04)',
                        border: focused === f.key ? '1.5px solid rgba(0,217,138,0.5)' : '1px solid rgba(0,217,138,0.12)',
                        fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box',
                        boxShadow: focused === f.key ? '0 0 0 3px rgba(0,217,138,0.08)' : 'none',
                        transition: 'all 0.2s',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: focused === 'email' ? '#00D98A' : '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.2s' }}>
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
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    placeholder="you@example.com"
                    style={{
                      width: '100%', padding: '13px 14px 13px 44px',
                      borderRadius: 14,
                      background: 'rgba(0,217,138,0.04)',
                      border: focused === 'email' ? '1.5px solid rgba(0,217,138,0.5)' : '1px solid rgba(0,217,138,0.12)',
                      fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box',
                      boxShadow: focused === 'email' ? '0 0 0 3px rgba(0,217,138,0.08)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: focused === 'password' ? '#00D98A' : '#7A9E8E', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', transition: 'color 0.2s' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="11" width="18" height="11" rx="2" stroke={focused === 'password' ? '#00D98A' : '#2D4A3E'} strokeWidth="2" style={{ transition: 'stroke 0.2s' }}/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={focused === 'password' ? '#00D98A' : '#2D4A3E'} strokeWidth="2" style={{ transition: 'stroke 0.2s' }}/>
                    </svg>
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setField('password', e.target.value)}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    placeholder="Min. 8 characters"
                    style={{
                      width: '100%', padding: '13px 44px 13px 44px',
                      borderRadius: 14,
                      background: 'rgba(0,217,138,0.04)',
                      border: focused === 'password' ? '1.5px solid rgba(0,217,138,0.5)' : '1px solid rgba(0,217,138,0.12)',
                      fontSize: 14, color: '#E8FFF4', boxSizing: 'border-box',
                      boxShadow: focused === 'password' ? '0 0 0 3px rgba(0,217,138,0.08)' : 'none',
                      transition: 'all 0.2s',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    aria-label="Toggle password"
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', padding: 4, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      {showPass
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="#2D4A3E" strokeWidth="2" strokeLinecap="round"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#2D4A3E" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="#2D4A3E" strokeWidth="2"/></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              {/* Role badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: `${selectedRole.color}10`, border: `1px solid ${selectedRole.color}30` }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: selectedRole.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {ROLE_ICONS[selectedRole.value]}
                </div>
                <span style={{ fontSize: 13, color: selectedRole.color, fontWeight: 600 }}>Joining as {selectedRole.label}</span>
                <button type="button" onClick={() => setStep(1)} style={{ marginLeft: 'auto', border: 'none', background: 'none', color: '#7A9E8E', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>Change</button>
              </div>
            </>
          )}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 14, padding: '10px 14px', fontSize: 13, color: '#FCA5A5' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={loading ? '' : 'btn-primary'}
            style={{
              width: '100%',
              padding: '15px 0',
              borderRadius: 16,
              background: loading ? 'rgba(0,217,138,0.08)' : undefined,
              color: loading ? '#2D4A3E' : undefined,
              fontWeight: 800, fontSize: 15,
              border: loading ? '1px solid rgba(0,217,138,0.15)' : 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Space Grotesk, sans-serif',
              marginTop: 4, letterSpacing: '0.02em',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              minHeight: 52,
            }}
          >
            {loading ? <><div className="spinner" style={{ width: 20, height: 20 }} /> Creating…</> : step === 1 ? 'Continue' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, rgba(0,217,138,0.15))' }} />
          <span style={{ fontSize: 12, color: '#2D4A3E' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, rgba(0,217,138,0.15))' }} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 13, color: '#7A9E8E', fontFamily: 'Space Grotesk, sans-serif' }}>
            Already have an account?{' '}
          </span>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 700, color: '#00D98A', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
