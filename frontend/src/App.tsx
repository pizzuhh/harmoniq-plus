import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'  
import type { User } from './types'
import './App.css'
import api from './services/api'

import DashboardPage from './pages/DashboardPage'
import Challenges from './pages/Challenges'
import QuestionsHealth from './pages/QuestionsHealth'
import YourGoals from './pages/YourGoals'
// import DailyQuestionnaire from './pages/DailyQuestionnaire'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    // on app mount, restore user from backend if authToken exists
    const tryRestore = async () => {
      const token = localStorage.getItem('authToken')
      if (!token) return

      try {
        const me: any = await api.request('/api/me')
        if (me) {
          const backendUser: any = me
          const mapped: User = {
            id: backendUser.id,
            username: backendUser.name || '',
            email: backendUser.mail || '',
            totalXp: backendUser.points || 0,
            currentXp: (backendUser.points || 0) % 100,
            level: Math.floor((backendUser.points || 0) / 100) + 1,
            createdAt: backendUser.created_at || new Date().toISOString(),
          }
          setUser(mapped)
        }
      } catch (e) {
        // token invalid or backend unreachable — leave user null
        console.warn('Failed to restore user from token', e)
      }
    }

    tryRestore().finally(() => setRestoring(false))
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={
            restoring ? (
              <div style={{ padding: 40, textAlign: 'center' }}>Restoring session...</div>
            ) : user ? (
              <DashboardPage user={user} setUser={(u: User) => setUser(u)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="/health-check" element={<QuestionsHealth />} />
        <Route path="/your-goals" element={<YourGoals />} />
        {/* <Route path="/challenge" element={<DailyQuestionnaire />} /> */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage setUser={(u: User) => setUser(u)} />} />
        <Route path="/register" element={<RegisterPage setUser={(u: User) => setUser(u)} />} />
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
         <Route path="/map" element={<Map src={"https://maps.google.com/maps?q=Pazardzhik,Bulgaria&z=12&output=embed"} />} />
         <Route path="/challenges" element={<Challenges />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
