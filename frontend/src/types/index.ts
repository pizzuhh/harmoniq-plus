export interface User {
  id: string
  username: string
  email: string
  level: number
  totalXp: number
  currentXp: number
  createdAt: string
}

export interface AuthResponse {
  token: string
  user: User
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: 'digital-detox' | 'nature' | 'mindfulness' | 'eco-action'
  duration: number
  xpReward: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface UserChallenge {
  id: string
  userId: string
  challengeId: string
  challenge: Challenge
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  photoUrl?: string
  submittedAt?: string
  xpEarned?: number
}

export interface GeneratedChallenges {
  date: string
  challenges: UserChallenge[]
}
