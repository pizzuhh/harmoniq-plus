import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { User } from './types'
import './App.css'

import DashboardPage from './pages/DashboardPage'
import QuestionsHealth from './pages/QuestionsHealth'
// import DailyQuestionnaire from './pages/DailyQuestionnaire'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

function App() {
  const [user, setUser] = useState<User | null>(null)

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/dashboard"
          element={user ? <DashboardPage user={user} /> : <Navigate to="/login" replace />}
        />
        <Route path="/health-check" element={<QuestionsHealth />} />
        {/* <Route path="/challenge" element={<DailyQuestionnaire />} /> */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<LoginPage setUser={(u: User) => setUser(u)} />} />
        <Route path="/register" element={<RegisterPage setUser={(u: User) => setUser(u)} />} />
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
