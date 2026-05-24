const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6873'

let accessToken: string | null = null
let refreshToken: string | null = null
let tokenExpiresAt: number | null = null

export function setTokens(access: string, refresh: string, expiresIn: number) {
  accessToken = access
  refreshToken = refresh
  tokenExpiresAt = Date.now() + expiresIn * 1000
  localStorage.setItem('access_token', access)
  localStorage.setItem('refresh_token', refresh)
  localStorage.setItem('token_expires_at', String(tokenExpiresAt))
}

export function loadTokens() {
  accessToken = localStorage.getItem('access_token')
  refreshToken = localStorage.getItem('refresh_token')
  const exp = localStorage.getItem('token_expires_at')
  tokenExpiresAt = exp ? Number(exp) : null
}

export function clearTokens() {
  accessToken = null
  refreshToken = null
  tokenExpiresAt = null
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('token_expires_at')
  localStorage.removeItem('user')
}

export function getAccessToken() {
  return accessToken
}

export function isTokenExpired() {
  if (!tokenExpiresAt) return true
  return Date.now() >= tokenExpiresAt - 300000
}

export async function ensureValidToken() {
  loadTokens()
  if (!accessToken || !refreshToken) return false
  if (!isTokenExpired()) return true
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = await res.json()
    setTokens(data.access_token, data.refresh_token, data.expires_in)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function apiGet(path: string) {
  await ensureValidToken()
  loadTokens()
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const res = await fetch(`${API_BASE}${path}`, { headers })
  return res.json()
}

export async function apiPost(path: string, body?: any) {
  await ensureValidToken()
  loadTokens()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined
  })
  return res.json()
}

export { API_BASE }
