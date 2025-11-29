import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { User } from '../types'

interface LoginPageProps {
  setUser: (user: User) => void
}

export default function LoginPage({ setUser }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
            const data = await api.login(email, password)
            localStorage.setItem('authToken', data.token)

            // Fetch real user from backend /api/me using the stored token (user id)
            let realUser = data.user
            try {
              const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/me`, {
                headers: { user_id: data.token },
              })
              if (res.ok) {
                const backendUser = await res.json()

                // Map backend user shape to frontend `User` shape
                const mapped: User = {
                  id: backendUser.id,
                  username: backendUser.name || data.user.username,
                  email: backendUser.mail || data.user.email,
                  // Derive level from points (simple rule: 100 XP per level)
                  totalXp: backendUser.points || 0,
                  currentXp: (backendUser.points || 0) % 100,
                  level: Math.floor((backendUser.points || 0) / 100) + 1,
                  createdAt: backendUser.created_at || new Date().toISOString(),
                }

                realUser = mapped
              }
            } catch (e) {
              // ignore and fallback to synthetic user
            }

            setUser(realUser)
            navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div>
            <h1 style={styles.title}>Mindful City</h1>
            <div style={styles.subtitle}>Sign in to continue</div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={styles.footerRow}>
          <span style={{ color: '#666' }}>Don't have an account?</span>
          <a onClick={() => navigate('/register')} style={styles.link}>
            Create one
          </a>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f3f6f8',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'white',
    padding: '28px',
    borderRadius: '12px',
    boxShadow: '0 6px 24px rgba(12,40,60,0.08)',
    width: '100%',
    maxWidth: '420px',
  } as React.CSSProperties,
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  } as React.CSSProperties,
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg,#6ee7b7,#34d399)',
    fontSize: 24,
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: 20,
    color: '#0b3340',
  } as React.CSSProperties,
  subtitle: {
    fontSize: 12,
    color: '#5b6b72',
  } as React.CSSProperties,
  form: {
    marginTop: 8,
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '14px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: 13,
    color: '#334155',
    marginBottom: 6,
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #e6eef2',
    outline: 'none',
    fontSize: 14,
    boxSizing: 'border-box',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#16a34a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 600,
  } as React.CSSProperties,
  error: {
    color: '#7f1d1d',
    marginBottom: '12px',
    padding: '10px 12px',
    backgroundColor: '#fff1f2',
    borderRadius: '8px',
    border: '1px solid #ffccd5',
  } as React.CSSProperties,
  link: {
    color: '#0b5cff',
    cursor: 'pointer',
    textDecoration: 'underline',
    marginLeft: 8,
  } as React.CSSProperties,
  footerRow: {
    marginTop: 12,
    display: 'flex',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
}
