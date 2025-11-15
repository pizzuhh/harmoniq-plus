import type { AuthResponse, User } from '../types'

// Base URL can be set with VITE_API_URL, otherwise requests go to the same origin.
const API_BASE = import.meta.env.VITE_API_URL || ''

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken')

  // Don't override Content-Type when body is FormData
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  }

  // Backend expects a header named `user_id` containing the user's id string
  if (token) headers['user_id'] = token

  const url = `${API_BASE}${path}`
  const res = await fetch(url, { ...options, headers })

  if (!res.ok) {
    // Try to extract message from JSON or fallback to text/status
    try {
      const body = await res.json()
      throw new Error(body?.message || res.statusText)
    } catch (e) {
      const text = await res.text()
      throw new Error(text || res.statusText)
    }
  }

  // Try to parse JSON, otherwise return text
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()
  // fallback to text
  // @ts-ignore
  return res.text()
}

// The backend login/register endpoints return a plain user id string on success.
// We normalize that into the frontend's AuthResponse shape so existing UI can work.
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: email, email, password }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }

  const id = await res.text()
  localStorage.setItem('authToken', id)

  // Minimal user object — backend currently doesn't expose a /me endpoint.
  const user: User = {
    id,
    username: email.split('@')[0],
    email,
    level: 1,
    totalXp: 0,
    currentXp: 0,
    createdAt: new Date().toISOString(),
  }

  return { token: id, user }
}

export async function register(username: string, email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/api/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: username, email, password }),
  })

  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || res.statusText)
  }

  const id = await res.text()
  localStorage.setItem('authToken', id)

  const user: User = {
    id,
    username,
    email,
    level: 1,
    totalXp: 0,
    currentXp: 0,
    createdAt: new Date().toISOString(),
  }

  return { token: id, user }
}

export default { login, register, request }
