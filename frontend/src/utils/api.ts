const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6873'

let accessToken: string | null = null
let tokenExpiresAt: number | null = null

// access_token 仅保存在内存中，页面刷新后通过 refresh_token cookie 恢复
export function setTokens(access: string, _refresh: string, expiresIn: number) {
  accessToken = access
  tokenExpiresAt = Date.now() + expiresIn * 1000
}

export function clearTokens() {
  accessToken = null
  tokenExpiresAt = null
  localStorage.removeItem('user')
}

export function getAccessToken() {
  return accessToken
}

export function isTokenExpired() {
  if (!tokenExpiresAt) return true
  return Date.now() >= tokenExpiresAt - 300000
}

// 页面刷新后通过 refresh_token cookie 恢复会话
export async function restoreSession(): Promise<boolean> {
  if (accessToken && !isTokenExpired()) return true
  try {
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) return false
    const data = await res.json()
    if (data.access_token) {
      setTokens(data.access_token, '', data.expires_in)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function ensureValidToken() {
  if (accessToken && !isTokenExpired()) return true
  // 无内存令牌或已过期，尝试通过 cookie 刷新
  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = await res.json()
    setTokens(data.access_token, '', data.expires_in)
    return true
  } catch {
    clearTokens()
    return false
  }
}

export async function apiGet(path: string) {
  await ensureValidToken()
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const res = await fetch(`${API_BASE}${path}`, { headers, credentials: 'include' })
  return res.json()
}

export async function apiPost(path: string, body?: any) {
  await ensureValidToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
  return res.json()
}

export { API_BASE }
