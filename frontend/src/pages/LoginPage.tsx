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
        <h1> Mindful City</h1>
        <h2>Login</h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label>Password</label>
            <input
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

        <p>
          Don't have an account?{' '}
          <a onClick={() => navigate('/register')} style={styles.link}>
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '150vh',
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'green',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '800px',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px',

  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '10px',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
  } as React.CSSProperties,
  error: {
    color: 'red',
    marginBottom: '15px',
    padding: '10px',
    backgroundColor: '#ffebee',
    borderRadius: '5px',
  } as React.CSSProperties,
  link: {
    color: '#0f4271ff',
    cursor: 'pointer',
    textDecoration: 'underline',
  } as React.CSSProperties,
}
