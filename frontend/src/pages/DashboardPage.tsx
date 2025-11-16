import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User, GeneratedChallenges } from '../types'
import api from '../services/api'

interface DashboardPageProps {
  user: User | null
}

export default function DashboardPage({ user }: DashboardPageProps) {
  const [challenges, setChallenges] = useState<GeneratedChallenges | null>(null)
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const loadChallenges = async () => {
      if (!user) {
        // wait until we have a user to request a personalized challenge
        setLoading(false)
        return
      }

      try {
        // Use the project's API helper so VITE_API_URL and headers are applied
        const quest: any = await api.request('/challange/receive')

        if (quest) {
          const mapped: GeneratedChallenges = {
            date: new Date().toISOString(),
            challenges: [
              {
                id: quest.id,
                userId: user.id,
                challengeId: quest.id,
                challenge: {
                  id: quest.id,
                  title: quest.name || quest.title || 'Challenge',
                  description: quest.description || '',
                  category: 'mindfulness',
                  duration: 10,
                  xpReward: quest.points_received || 0,
                  difficulty: 'easy',
                },
                status: 'pending',
              },
            ],
          }

          setChallenges(mapped)
        }
      } catch (error) {
        console.error('Failed to load challenges:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChallenges()
  }, [user])

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setMenuOpen(false)
  }

  if (loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>Mindful City</h1>
          <button
            style={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰ Menu
          </button>
        </div>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.username}!</span>
          <span>Level {user?.level}</span>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </header>

      {menuOpen && (
        <nav style={styles.mobileMenu}>
          <button onClick={() => handleNavigation('/dashboard')} style={styles.navLink}>
            📊 Dashboard
          </button>
          <button onClick={() => handleNavigation('/challenges')} style={styles.navLink}>
            🎯 Challenges
          </button>
          <button onClick={() => handleNavigation('/profile')} style={styles.navLink}>
            👤 Profile
          </button>
          <button onClick={() => handleNavigation('/map')} style={styles.navLink}>
            🗺️ Mindful Map
          </button>
          <button onClick={() => handleNavigation('/community')} style={styles.navLink}>
            👥 Community
          </button>
          <button onClick={() => handleNavigation('/admin')} style={styles.navLink}>
            🛡️ Admin Panel
          </button>
          <button onClick={() => handleNavigation('/health-check')} style={styles.navLink}>
            🩺 Questioneer
          </button>
        </nav>
      )}

      <div style={styles.desktopNav}>
        <button onClick={() => handleNavigation('/dashboard')} style={styles.navLinkDesktop}>
          📊 Dashboard
        </button>
        <button onClick={() => handleNavigation('/challenges')} style={styles.navLinkDesktop}>
          🎯 Challenges
        </button>
        <button onClick={() => handleNavigation('/profile')} style={styles.navLinkDesktop}>
          👤 Profile
        </button>
        <button onClick={() => handleNavigation('/map')} style={styles.navLinkDesktop}>
          🗺️ Mindful Map
        </button>
        <button onClick={() => handleNavigation('/community')} style={styles.navLinkDesktop}>
          👥 Community
        </button>
        <button onClick={() => handleNavigation('/admin')} style={styles.navLinkDesktop}>
          🛡️ Admin Panel
        </button>
        <button onClick={() => handleNavigation('/health-check')} style={styles.navLinkDesktop}>
          🩺 Questioneer
        </button>
      </div>

      <main style={styles.main}>
        <section style={styles.section}>
          <h2>Your Stats</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Total XP</span>
              <span style={styles.statValue}>{user?.totalXp || 0}</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Current Level</span>
              <span style={styles.statValue}>{user?.level || 1}</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Progress to Next Level</span>
              <span style={styles.statValue}>{user?.currentXp || 0} XP</span>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2>Today's Challenges</h2>
          {challenges?.challenges && challenges.challenges.length > 0 ? (
            <div style={styles.challengesList}>
              {challenges.challenges.map((challenge) => (
                <div key={challenge.id} style={styles.challengeCard}>
                  <h3>{challenge.challenge.title}</h3>
                  <p>{challenge.challenge.description}</p>
                  <div style={styles.challengeMeta}>
                    <span>⏱️ {challenge.challenge.duration} mins</span>
                    <span>⭐ +{challenge.challenge.xpReward} XP</span>
                  </div>
                  <p style={styles.status}>Status: {challenge.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <p>No challenges available for today.</p>
          )}
        </section>
      </main>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    width: '100%',
  } as React.CSSProperties,
  header: {
    backgroundColor: '#4c6dafff',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  } as React.CSSProperties,
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
  } as React.CSSProperties,
  menuToggle: {
    display: 'none',
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '10px',
  } as React.CSSProperties,
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  } as React.CSSProperties,
  logoutBtn: {
    backgroundColor: 'white',
    color: '#2a4597ff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
  } as React.CSSProperties,
  desktopNav: {
    backgroundColor: '#5f86e1ff',
    display: 'flex',
    flexWrap: 'wrap',
    padding: '10px',
    gap: '5px',
  } as React.CSSProperties,
  navLinkDesktop: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    transition: 'background-color 0.3s',
  } as React.CSSProperties,
  mobileMenu: {
    backgroundColor: '#213a51ff',
    display: 'flex',
    flexDirection: 'column',
    padding: '10px',
    gap: '5px',
  } as React.CSSProperties,
  navLink: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    cursor: 'pointer',
    fontSize: '14px',
    borderRadius: '4px',
    textAlign: 'left',
  } as React.CSSProperties,
  main: {
    
    margin: '0 auto',
    padding: '20px',
  } as React.CSSProperties,
  section: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    color: "black",
  } as React.CSSProperties,
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  statBox: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '12px',
    color: '#000000ff',
  } as React.CSSProperties,
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#19c916ff',
  } as React.CSSProperties,
  challengesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  } as React.CSSProperties,
  challengeCard: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
  } as React.CSSProperties,
  challengeMeta: {
    display: 'flex',
    gap: '15px',
    margin: '10px 0',
    fontSize: '14px',
    color: '#666',
  } as React.CSSProperties,
  status: {
    marginTop: '10px',
    fontSize: '12px',
    color: '#37b324ff',
    fontWeight: 'bold',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
  } as React.CSSProperties,
}
