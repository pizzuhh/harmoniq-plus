import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import type { User } from '../types'

interface RegisterPageProps {
  setUser: (user: User) => void
}

export default function RegisterPage({ setUser }: RegisterPageProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
        const data = await api.register(username, email, password)
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
      setError(err instanceof Error ? err.message : 'Registration failed')
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
            <div style={styles.subtitle}>Create your account</div>
          </div>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              required
            />
          </div>

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

          <div style={styles.twoCols}>
            <div style={{ flex: 1, marginRight: 8 }}>
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
            <div style={{ flex: 1 }}>
              <label style={styles.label}>Confirm</label>
              <input
                style={styles.input}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <div style={styles.footerRow}>
          <span style={{ color: '#666' }}>Already have an account?</span>
          <a onClick={() => navigate('/login')} style={styles.link}>
            Login
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
    minHeight: '156vh',
    backgroundColor: '#ffffffff',
  } as React.CSSProperties,
  card: {
    backgroundColor: '#ffffff',
    padding: '32px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '800px',
  } as React.CSSProperties,
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  } as React.CSSProperties,
  logo: {
    width: 52,
    height: 52,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg,#2f9e44,#60a5fa)',
    color: 'white',
    fontSize: 24,
  } as React.CSSProperties,
  title: {
    margin: 0,
    fontSize: '20px',
    color: '#183a1b',
  } as React.CSSProperties,
  subtitle: {
    fontSize: '13px',
    color: '#546e5a',
  } as React.CSSProperties,
  form: {
    marginTop: '6px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#234522',
    fontSize: '13px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e6eee6',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  twoCols: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#18961dff',
    color: 'white',
     display: 'flex',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  } as React.CSSProperties,
  error: {
    color: 'red',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#36c47aff',
    borderRadius: '5px',
  } as React.CSSProperties,
  link: {
    color: '#1e5c20ff',
    cursor: 'pointer',
    textDecoration: 'underline',
  } as React.CSSProperties,
  footerRow: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,
}
