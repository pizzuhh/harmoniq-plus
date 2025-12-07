import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { User, GeneratedChallenges } from '../types'
import api from '../services/api'
import React from 'react'

type LeaderboardEntry = {
  id: string
  username: string
  totalXp: number
  level: number
}

interface DashboardPageProps {
  user: User | null
  setUser?: (user: User) => void
}

export default function DashboardPage({ user, setUser }: DashboardPageProps) {
  const [challenges, setChallenges] = useState<GeneratedChallenges | null>(null)
  const [loading, setLoading] = useState(true)
  const [noMore, setNoMore] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const loadChallenges = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const quest: any = await api.request('/challange/receive')
        const emptyId = '00000000-0000-0000-0000-000000000000'
        if (!quest || !quest.id || quest.id === emptyId || !quest.name) {
          setChallenges(null)
          setNoMore(true)
          setLoading(false)
          return
        }

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
          setNoMore(false)
        }
      } catch (error) {
        console.error('Failed to load challenges:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChallenges()
  }, [user])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.request('/api/leaderboard')
        console.log(response);
        if (response && Array.isArray(response)) {
          const mapped: LeaderboardEntry[] = response.map((entry: any) => ({
            id: entry[2],
            username: entry[0] || 'Unknown',
            totalXp: entry[1] || 0,
            level: Math.floor((entry[1] || 0) / 100) + 1,
          }))
          setLeaderboard(mapped)
        }
      } catch (e) {
        console.warn('Failed to fetch leaderboard', e)
        setLeaderboard([])
      } finally {
        setLoadingLeaderboard(false)
      }
    }

    fetchLeaderboard()
  }, [])

  const userRank = leaderboard.findIndex((entry) => entry.id === user?.id) + 1

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
          <h1>Harmony+</h1>
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
             Dashboard
          </button>
          <button onClick={() => handleNavigation('/challenges')} style={styles.navLink}>
             Challenges
          </button>
          <button onClick={() => handleNavigation('/map')} style={styles.navLink}>
             Mindful Map
          </button>
          <button onClick={() => handleNavigation('/health-check')} style={styles.navLink}>
             Questioneer
          </button>
        </nav>
      )}

      <div style={styles.desktopNav}>
        <button onClick={() => handleNavigation('/dashboard')} style={styles.navLinkDesktop}>
           Dashboard
        </button>
        <button onClick={() => handleNavigation('/challenges')} style={styles.navLinkDesktop}>
           Challenges
        </button>
        <button onClick={() => handleNavigation('/map')} style={styles.navLinkDesktop}>
           Mindful Map
        </button>
        <button onClick={() => handleNavigation('/health-check')} style={styles.navLinkDesktop}>
           Questioneer
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
              <span style={styles.statValue}>{100 - (user?.currentXp || 0)} XP</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={styles.leaderboardContainer}>
            <h3 style={styles.leaderboardTitle}>Top Players Leaderboard</h3>
            {loadingLeaderboard ? (
              <div style={{ color: '#666', fontSize: '13px' }}>Loading leaderboard...</div>
            ) : leaderboard.length === 0 ? (
              <div style={{ color: '#666', fontSize: '13px' }}>No leaderboard data available</div>
            ) : (
              <div style={styles.leaderboardList}>
                {leaderboard.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.id}
                    style={{
                      ...styles.leaderboardItem,
                      background: entry.id === user?.id ? '#e8f5e9' : 'transparent',
                      borderLeft: entry.id === user?.id ? '4px solid #19c916ff' : '4px solid transparent',
                    }}
                  >
                    <div style={styles.leaderboardRank}>
                      <span style={{
                        ...styles.leaderboardRankBadge,
                        background: index === 0 ? '#fbbf24' : index === 1 ? '#c0cfe2' : index === 2 ? '#d97706' : '#9ca3af',
                      }}>
                        {index + 1}
                      </span>
                    </div>
                    <div style={styles.leaderboardInfo}>
                      <div style={styles.leaderboardName}>
                        {entry.username}
                        {entry.id === user?.id && ' (You)'}
                      </div>
                      <div style={styles.leaderboardLevel}>Lvl {entry.level}</div>
                    </div>
                    <div style={styles.leaderboardXp}>
                      {entry.totalXp} XP
                    </div>
                  </div>
                ))}
              </div>
            )}
            {userRank > 10 && (
              <div style={styles.yourRank}>
                Your Rank: #{userRank}
              </div>
            )}
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
                  <div style={{ marginTop: 10, gap: 8 }}>
                    <button
                      style={styles.completeBtn}
                      onClick={async () => {
                        try {
                          await api.request(`/api/complete_challenge/${challenge.challenge.id}`, { method: 'POST' })
                          setChallenges((prev) => {
                            if (!prev) return prev
                            return { ...prev, challenges: prev.challenges.filter((c) => c.id !== challenge.id) }
                          })

                          try {
                            const me = await api.request('/api/me')
                            if (me) {
                              const backendUser: any = me
                              const mapped: User = {
                                id: backendUser.id,
                                username: backendUser.name || user?.username || '',
                                email: backendUser.mail || user?.email || '',
                                totalXp: backendUser.points || 0,
                                currentXp: (backendUser.points || 0) % 100,
                                level: Math.floor((backendUser.points || 0) / 100) + 1,
                                createdAt: backendUser.created_at || new Date().toISOString(),
                              }
                              if (setUser) setUser(mapped)
                            }
                          } catch (e) {
                            // ignore
                          }
                        } catch (e) {
                          console.error('Failed to complete challenge', e)
                        }
                      }}
                    >
                      Complete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>{noMore ? 'No more challenges for today.' : 'No challenges available for today.'}</p>
          )}
        </section>
        <footer style={styles.community}>
          <h3>Присъединете се към нашата Mundful City общност</h3>
          <a href="https://discord.gg/qMssPdrr" target="_blank" rel="noopener noreferrer">Присъединете се в Discord</a>
        </footer>
      </main>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  } as React.CSSProperties,
  header: {
    backgroundColor: '#32b879ff',
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
    color: '#14b9acff',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
  } as React.CSSProperties,
  desktopNav: {
    backgroundColor: '#20c96cff',
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
    fontSize: '1.1em',
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
    marginBottom: '30px',
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
  leaderboardContainer: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #ddd',
  } as React.CSSProperties,
  leaderboardTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  leaderboardList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  } as React.CSSProperties,
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    borderLeft: '4px solid transparent',
  } as React.CSSProperties,
  leaderboardRank: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  leaderboardRankBadge: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  leaderboardInfo: {
    flex: 1,
  } as React.CSSProperties,
  leaderboardName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  } as React.CSSProperties,
  leaderboardLevel: {
    fontSize: '12px',
    color: '#666',
  } as React.CSSProperties,
  leaderboardXp: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#19c916ff',
    minWidth: '80px',
    textAlign: 'right',
  } as React.CSSProperties,
  yourRank: {
    marginTop: '12px',
    padding: '10px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#666',
    borderTop: '1px solid #ddd',
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
  completeBtn: {
    padding: '8px 12px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  } as React.CSSProperties,
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
  } as React.CSSProperties,
  community: {
    color: 'black',
    textAlign: 'center',
  } as React.CSSProperties,
}