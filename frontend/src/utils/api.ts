const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:6873'

let accessToken: string | null = null
let tokenExpiresAt: number | null = null
let csrfToken: string | null = null

// access_token 仅保存在内存中，页面刷新后通过 refresh_token cookie 恢复
export function setTokens(access: string, _refresh: string, expiresIn: number) {
  accessToken = access
  tokenExpiresAt = Date.now() + expiresIn * 1000
}

export function clearTokens() {
  accessToken = null
  tokenExpiresAt = null
  csrfToken = null
  localStorage.removeItem('user')
}

export function getAccessToken() {
  return accessToken
}

export function isTokenExpired() {
  if (!tokenExpiresAt) return true
  return Date.now() >= tokenExpiresAt - 300000
}

function storeCsrfFromResponse(data: any) {
  if (data?.csrf_token) {
    csrfToken = data.csrf_token
  }
}

// 页面刷新后通过 refresh_token cookie 恢复会话
export async function restoreSession(): Promise<boolean> {
  if (accessToken && !isTokenExpired()) return true
  try {
    const headers: Record<string, string> = {}
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      method: 'POST',
      headers,
      credentials: 'include',
    })
    if (!res.ok) return false
    const data = await res.json()
    storeCsrfFromResponse(data)
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
    const headers: Record<string, string> = {}
    if (csrfToken) headers['X-CSRF-Token'] = csrfToken
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers,
      credentials: 'include',
    })
    if (!res.ok) {
      clearTokens()
      return false
    }
    const data = await res.json()
    storeCsrfFromResponse(data)
    setTokens(data.access_token, '', data.expires_in)
    return true
  } catch {
    clearTokens()
    return false
  }
}

class ApiError extends Error {
  statusCode: number
  errorCode: string
  constructor(message: string, statusCode: number, errorCode: string) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

async function checkRes(res: Response) {
  const data = await res.json()
  storeCsrfFromResponse(data)
  if (!res.ok) {
    throw new ApiError(data.message || '请求失败', res.status, data.error || 'unknown')
  }
  return data
}

export async function apiGet(path: string) {
  await ensureValidToken()
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  console.log(`[API] GET ${path}`)
  const res = await fetch(`${API_BASE}${path}`, { headers, credentials: 'include' })
  const data = await checkRes(res)
  console.log(`[API] GET ${path} ->`, res.status, JSON.stringify(data).substring(0, 200))
  return data
}

export async function apiPost(path: string, body?: any) {
  await ensureValidToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  console.log(`[API] POST ${path}`, body ? JSON.stringify(body).substring(0, 200) : '')
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
  const data = await checkRes(res)
  console.log(`[API] POST ${path} ->`, res.status, JSON.stringify(data).substring(0, 200))
  return data
}

export async function apiPut(path: string, body?: any) {
  await ensureValidToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
  if (res.status === 204) return null
  return checkRes(res)
}

export async function apiDelete(path: string) {
  await ensureValidToken()
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  })
  if (res.status === 204) return null
  return checkRes(res)
}

export { API_BASE }
