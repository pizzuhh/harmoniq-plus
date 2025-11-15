import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { User } from './types'
import './App.css'

import DashboardPage from './pages/DashboardPage'
import QuestionsHealth from './pages/QuestionsHealth'
import DailyQuestionnaire from './pages/DailyQuestionnaire'

function App() {
  const [user] = useState<User>({
    id: '1',
    username: 'TestUser',
    email: 'test@example.com',
    level: 5,
    totalXp: 2500,
    currentXp: 1200,
    createdAt: new Date().toISOString(),
  })

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage user={user} />} />
        <Route path="/health-check" element={<QuestionsHealth />} />
        <Route path="/challange" element={<DailyQuestionnaire />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
