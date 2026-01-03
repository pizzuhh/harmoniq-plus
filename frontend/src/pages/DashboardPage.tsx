import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom' 
import type { User, GeneratedChallenges, UserChallenge } from '../types'
import api from '../services/api'
import heroImg from '../assets/12291047_Happy crowd greeting little winner of racing.jpg'
import React from 'react'

type LeaderboardEntry = {
  id: string
  username: string
  totalXp: number
  level: number
}

type StreakData = {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string
}

interface DashboardPageProps {
  user: User | null
  setUser?: (user: User) => void
}

export default function DashboardPage({ user, setUser }: DashboardPageProps) {
  const [challenges, setChallenges] = useState<GeneratedChallenges | null>(null)
  const [weeklyChallenge, setWeeklyChallenge] = useState<UserChallenge | null>(null)
  const [rawResponse, setRawResponse] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [noMore, setNoMore] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true)
  const [streak, setStreak] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, lastCompletedDate: '' })
  const [loadingStreak, setLoadingStreak] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()
  const [showPopup, setShowPopup] = useState(false)
  const popupRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const loadChallenges = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        const raw: any = await api.request('/challange/receive')
        console.debug('loadChallenges raw:', raw)
        let weeklyRaw: any = null
        try {
          weeklyRaw = await api.request('/api/get_weekly')
          console.debug('loadChallenges weeklyRaw:', weeklyRaw)
        } catch (e) {
          console.warn('Failed to fetch weekly challenges:', e)
        }

        setRawResponse({ daily: raw, weekly: weeklyRaw })

        const quest: any = Array.isArray(raw) && raw.length ? raw[0] : raw
        const emptyId = '00000000-0000-0000-0000-000000000000'
        const weeklyCandidates: any[] = []
        if (weeklyRaw) {
          if (Array.isArray(weeklyRaw)) weeklyCandidates.push(...weeklyRaw)
          else if (weeklyRaw?.challenges && Array.isArray(weeklyRaw.challenges)) weeklyCandidates.push(...weeklyRaw.challenges)
          else if (weeklyRaw?.id) weeklyCandidates.push(weeklyRaw)
        }

        const mapToUserChallenge = (item: any): UserChallenge => ({
          id: item.id || `${item.challengeId || item.challenge?.id || Math.random()}`,
          userId: user.id,
          challengeId: item.challengeId || item.id || item.challenge?.id || '',
          challenge: {
            id: item.challenge?.id || item.id || item.challengeId || '',
            title: item.name || item.title || item.challenge?.title || 'Challenge',
            description: item.description || item.challenge?.description || '',
            category: item.category || item.challenge?.category || 'mindfulness',
            duration: item.duration || item.challenge?.duration || '1 седмица',
            xpReward: item.points_received || item.xpReward || item.challenge?.xpReward || 0,
            difficulty: item.difficulty || item.challenge?.difficulty || 'easy',
          },
          status: item.status || 'Не е изпълнено',
        })

        // If no valid daily quest found, but weekly exists — show weekly
        if (!quest || !quest.id || quest.id === emptyId || !(quest.name || quest.title)) {
          if (weeklyCandidates.length) {
            setChallenges(null)
            setWeeklyChallenge(mapToUserChallenge(weeklyCandidates[0]))
            setNoMore(false)
            setLoading(false)
            return
          }

          setChallenges(null)
          setWeeklyChallenge(null)
          setNoMore(true)
          setLoading(false)
          return
        }

        // Map single daily quest (keep original behavior)
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
              status: quest.status || 'Не е изпълнено',
            },
          ],
        }

        setChallenges(mapped)
        setWeeklyChallenge(weeklyCandidates.length ? mapToUserChallenge(weeklyCandidates[0]) : null)
        setNoMore(false)
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

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const response = await api.request('/api/streak')
        if (response) {
          setStreak({
            currentStreak: response.current_streak || 0,
            longestStreak: response.longest_streak || 0,
            lastCompletedDate: response.last_completed_date || '',
          })
        }
      } catch (e) {
        console.warn('Failed to fetch streak', e)
      } finally {
        setLoadingStreak(false)
      }
    }

    fetchStreak()
  }, [])

  // Show popup only if navigated here from the questionnaire (state) or via session fallback
  useEffect(() => {
    const fromState = (location.state as any)?.showChallengePopup
    const fromSession = typeof window !== 'undefined' && sessionStorage.getItem('showChallengePopup') === '1'

    if (fromState || fromSession) {
      console.debug('Showing challenge popup via', { fromState, fromSession })
      setShowPopup(true)
      setTimeout(() => { try { popupRef.current?.focus() } catch(e) {} }, 60)
      const t = setTimeout(() => setShowPopup(false), 10000)
      if (fromState) navigate(location.pathname, { replace: true, state: {} })
      if (fromSession) sessionStorage.removeItem('showChallengePopup')
      return () => clearTimeout(t)
    }
  }, [location, navigate])

  const userRank = leaderboard.findIndex((entry) => entry.id === user?.id) + 1

  const handleLogout = () => {
    localStorage.removeItem('authToken')
    navigate('/login')
  }

  const handleNavigation = (path: string) => {
    navigate(path)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (showPopup) console.debug('Dashboard: popup visibility = true')
  }, [showPopup])

  if (loading) {
    return <div style={styles.loading}>Loading...</div>
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1>Хармония+</h1>
          <button
            style={styles.menuToggle}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            ☰ Menu
          </button>
        </div>
        <div style={styles.userInfo}>
          <span>Добре дошъл/а, {user?.username}!</span>
          <span>Ниво {user?.level}</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Излез от профила си
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <nav style={styles.mobileMenu}>
          <button onClick={() => handleNavigation('/dashboard')} style={styles.navLink}>
             Начална страница
          </button>
          <button onClick={() => handleNavigation('/challenges')} style={styles.navLink}>
             Колело на предизвикателствата
          </button>
          <button onClick={() => handleNavigation('/health-check')} style={styles.navLink}>
             Въпросници
          </button>
          <button onClick={() => handleNavigation('/your-goals')} style={styles.navLink}>
             Лични цели
          </button>
        </nav>
      )}

      <div style={styles.desktopNav}>
        <button onClick={() => handleNavigation('/dashboard')} style={styles.navLinkDesktop}>
           Начална страница
        </button>
        <button onClick={() => handleNavigation('/challenges')} style={styles.navLinkDesktop}>
            Колело на предизвикателствата
        </button>

        <button onClick={() => handleNavigation('/health-check')} style={styles.navLinkDesktop}>
            Въпросници
        </button>
         <button onClick={() => handleNavigation('/your-goals')} style={styles.navLinkDesktop}>
            Лични цели
        </button>
      </div>

      {showPopup && (
        <div ref={popupRef} tabIndex={-1} role="alert" aria-live="polite" style={{ position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', background: '#198754', color: 'white', padding: '16px 22px', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.28)', zIndex: 2147483647, border: '2px solid rgba(255,255,255,0.14)', maxWidth: 900, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>Благодарим Ви, под статуса Ви е вашето предизвикателството</div>
            <button aria-label="Close" onClick={() => setShowPopup(false)} style={{ marginLeft: 12, background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: 18 }}>✕</button>
          </div>
        </div>
      )} 

      <main style={styles.main}>
        <section style={{ ...styles.section, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <p>Здравейте! Ние сме Хармония+. Нашата мисия е да се превърнем в едно продуктивно, щастливо, екологично и хармонично общество! Живеем в забързан и натоварен свят, в които сме подложени на мръсен въздух, стрес и лошо качество на живот. Доста хора искат да „избягат“ от стреса и емоционалното си състояние и намират утеха в безкрайното скролване. Доста често не обръщаме внимание на себе си и на менталното ни състояние – не си даваме почивка, не излизаме сред природата без да сме с телефон в ръка, дори се храним с телефон в ръка, вместо да общуваме едни с други. Нашата цел е да решим тези проблеми и да създадем един по - екологичен свят и по-щастливи хора.</p>
              <p><strong>Как се използва нашият сайт?</strong> Попълнете въпросника и спрямо него ще получите предизвикателство, което се намира под статуса ви. Покачвате нива когато изпълнявате предизвикателствата и с времето те стават по-сложни. Пожелаваме Ви приятно прекарване в сайта ни!</p>
            </div>
            <div style={{ width: 320, textAlign: 'right' }}>
              <img src={heroImg} alt="Happy crowd greeting little winner" style={{ width: '100%', height: 'auto', borderRadius: 8, objectFit: 'cover' }} />
            </div>
          </div>
        </section>

        {/* Streak Section */}
        {!loadingStreak && (
          <section style={styles.streakSection}>
            <div style={styles.streakCard}>
              <div style={styles.streakHeader}>
                <h2 style={styles.streakTitle}>🔥 Вашата серия</h2>
              </div>

              <div style={styles.streakContent}>
                <div style={styles.streakStats}>
                  {/* Current Streak */}
                  <div style={{
                    ...styles.streakStatBox,
                    background: streak.currentStreak > 0
                      ? 'linear-gradient(135deg, #f45555ff, #ff8c8c)'
                      : 'linear-gradient(135deg, #e0e0e0, #f0f0f0)',
                  }}>
                    <div style={styles.streakFlame}>
                      {streak.currentStreak > 0 ? '🔥' : '❄️'}
                    </div>
                    <div style={styles.streakStatLabel}>Текуща серия</div>
                    <div style={{
                      ...styles.streakNumber,
                      color: streak.currentStreak > 0 ? '#fff' : '#666',
                    }}>
                      {streak.currentStreak}
                    </div>
                    <div style={{
                      ...styles.streakDays,
                      color: streak.currentStreak > 0 ? 'rgba(255,255,255,0.9)' : '#999',
                    }}>
                      дни подред
                    </div>
                  </div>

                  {/* Longest Streak */}
                  <div style={{
                    ...styles.streakStatBox,
                    background: 'linear-gradient(135deg, #ffd93d, #ffed4e)',
                  }}>
                    <div style={styles.streakFlame}>👑</div>
                    <div style={styles.streakStatLabel}>Най-дълга серия</div>
                    <div style={styles.streakNumber}>
                      {streak.longestStreak}
                    </div>
                    <div style={styles.streakDays}>всички времена</div>
                  </div>
                </div>

                {/* Motivational Message */}
                <div style={styles.motivationBox}>
                  {streak.currentStreak === 0 ? (
                    <p> Започнете вашата серия днес! Завършете предизвикателство сега.</p>
                  ) : streak.currentStreak < 7 ? (
                    <p> Продължавайте! Още {7 - streak.currentStreak} дни до първа неделя!</p>
                  ) : streak.currentStreak < 30 ? (
                    <p> Невероятно! Вече сте на пътя към месец пълен с постижения!</p>
                  ) : (
                    <p> Легенда! Месец или повече последователност — продължавайте така!</p>
                  )}
                </div>

                {/* Progress Bar */}
                <div style={styles.progressSection}>
                  <div style={styles.progressLabel}>Прогрес до 30 дни:</div>
                  <div style={styles.progressBarContainer}>
                    <div style={{
                      ...styles.progressBar,
                      width: `${Math.min((streak.currentStreak / 30) * 100, 100)}%`,
                      background: streak.currentStreak >= 30
                        ? 'linear-gradient(90deg, #ffd93d, #ffed4e)'
                        : 'linear-gradient(90deg, #ff6b6b, #ff8c8c)',
                    }} />
                  </div>
                  <div style={styles.progressText}>
                    {streak.currentStreak}/30 дни
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section style={styles.section}>
          <h2>Статус</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Total XP</span>
              <span style={styles.statValue}>{user?.totalXp || 0}</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Ниво</span>
              <span style={styles.statValue}>{user?.level || 1}</span>
            </div>
            <div style={styles.statBox}>
              <span style={styles.statLabel}>Прогрес до следващото ниво</span>
              <span style={styles.statValue}>{100 - (user?.currentXp || 0)} XP</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div style={styles.leaderboardContainer}>
            <h3 style={styles.leaderboardTitle}>Най-добрите ни потребители</h3>
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
          <h2>Днешното предизвикателство</h2>

          {/* Daily (single) challenge - preserve original UI/behavior */}
          {challenges?.challenges && challenges.challenges.length > 0 && (
            <div style={styles.challengesList}>
              {challenges.challenges.map((challenge) => (
                <div key={challenge.id} style={styles.challengeCard}>
                  <h3>{challenge.challenge.title}</h3>
                  <p>{challenge.challenge.description}</p>
                  <div style={styles.challengeMeta}>
                    {/*<span>⏱️ {challenge.challenge.duration} минути</span>*/}
                    <span>⭐ +{challenge.challenge.xpReward} XP</span>
                  </div>
                  <p style={styles.status}>Статус: {challenge.status}</p>
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

                          // Refresh streak
                          try {
                            const streakRes = await api.request('/api/streak')
                            if (streakRes) {
                              setStreak({
                                currentStreak: streakRes.current_streak || 0,
                                longestStreak: streakRes.longest_streak || 0,
                                lastCompletedDate: streakRes.last_completed_date || '',
                              })
                            }
                          } catch (e) {
                            // ignore
                          }
                        } catch (e) {
                          console.error('Failed to complete challenge', e)
                        }
                      }}
                    >
                      Готово
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weekly: show at most one weekly challenge inside the same box */}
          {weeklyChallenge && (
            <div style={{ marginTop: 16 }}>
              <h3>Седмично предизвикателство</h3>
              <div style={{ ...styles.challengeCard, border: '1px dashed #b3e5fc' }}>
                <h3>{weeklyChallenge.challenge.title} <small style={{ fontSize: 12, color: '#0b7285' }}>(Седмично)</small></h3>
                <p>{weeklyChallenge.challenge.description}</p>
                <div style={styles.challengeMeta}>
                  <span>⏱️ {weeklyChallenge.challenge.duration} </span>
                  <span>⭐ +{weeklyChallenge.challenge.xpReward} XP</span>
                </div>
                <p style={styles.status}>Status: {weeklyChallenge.status}</p>
                <div style={{ marginTop: 10, gap: 8 }}>
                  <button
                    style={styles.completeBtn}
                    onClick={async () => {
                      try {
                        await api.request(`/api/complete_challenge/${weeklyChallenge.challenge.id}`, { method: 'POST' })
                        setWeeklyChallenge(null)

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

                        // Refresh streak
                        try {
                          const streakRes = await api.request('/api/streak')
                          if (streakRes) {
                            setStreak({
                              currentStreak: streakRes.current_streak || 0,
                              longestStreak: streakRes.longest_streak || 0,
                              lastCompletedDate: streakRes.last_completed_date || '',
                            })
                          }
                        } catch (e) {
                          // ignore
                        }
                      } catch (e) {
                        console.error('Failed to complete challenge', e)
                      }
                    }}
                  >
                    Готово
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback message when neither daily nor weekly is present */}
          {!(challenges?.challenges && challenges.challenges.length > 0) && !weeklyChallenge && (
            <div>
              <p>{noMore ? 'Няма повече предизвикателства за днес.' : 'Няма налични предизвикателства за днес.'}</p>
              {rawResponse && ((rawResponse.daily && Array.isArray(rawResponse.daily) && rawResponse.daily.length > 0) || rawResponse.weekly) && (
                <div style={{ marginTop: 12 }}>
                  <strong style={{ fontSize: 13 }}>Backend payload (debug):</strong>
                  <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f4f4f4', padding: 8, borderRadius: 6 }}>{JSON.stringify(rawResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </section>
        <footer style={styles.community}>
          <h3>Присъединете се към нашата Хармония+ общност</h3>
          <a href="https://www.facebook.com/groups/1389511466204439/" target="_blank" rel="noopener noreferrer">Присъединете се във Фейсбук групата ни</a>
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
  streakSection: {
    marginBottom: '20px',
  } as React.CSSProperties,
  streakCard: {
    background: 'white',
    borderRadius: '14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    overflow: 'hidden',
  } as React.CSSProperties,
  streakHeader: {
    background: 'linear-gradient(135deg, #ff6b6b, #ff8c8c)',
    padding: '20px',
    color: 'white',
  } as React.CSSProperties,
  streakTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 'bold',
  } as React.CSSProperties,
  streakContent: {
    padding: '24px',
  } as React.CSSProperties,
  streakStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  } as React.CSSProperties,
  streakStatBox: {
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    color: '#333',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  } as React.CSSProperties,
  streakFlame: {
    fontSize: '48px',
    marginBottom: '8px',
  } as React.CSSProperties,
  streakStatLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'rgba(0,0,0,0.7)',
    marginBottom: '8px',
  } as React.CSSProperties,
  streakNumber: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
  } as React.CSSProperties,
  streakDays: {
    fontSize: '13px',
    color: '#666',
  } as React.CSSProperties,
  motivationBox: {
    background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
    padding: '16px',
    borderRadius: '10px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  } as React.CSSProperties,
  progressSection: {
    marginTop: '16px',
  } as React.CSSProperties,
  progressLabel: {
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '8px',
    color: '#666',
  } as React.CSSProperties,
  progressBarContainer: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    marginBottom: '8px',
  } as React.CSSProperties,
  progressBar: {
    height: '100%',
    borderRadius: '10px',
    transition: 'width 0.4s ease',
  } as React.CSSProperties,
  progressText: {
    fontSize: '12px',
    color: '#666',
    textAlign: 'right',
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