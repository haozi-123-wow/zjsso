import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { clearTokens, setTokens, apiGet, apiPost, API_BASE, restoreSession } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const isLoggedIn = computed(() => !!user.value)

  function loadUser() {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { user.value = JSON.parse(stored) } catch { user.value = null }
    }
  }

  async function initSession() {
    loadUser()
    if (user.value) {
      const ok = await restoreSession()
      if (!ok) {
        user.value = null
        localStorage.removeItem('user')
      }
    }
  }

  async function login(username: string, password: string, geetest?: { lot_number: string; captcha_output: string; pass_token: string; gen_time: string }) {
    const body: any = { username, password }
    if (geetest) Object.assign(body, geetest)
    const data = await apiPost('/api/auth/login', body)
    if (data.access_token) {
      setTokens(data.access_token, '', data.expires_in)
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
    }
    return data
  }

  async function register(formData: any, geetest?: { lot_number: string; captcha_output: string; pass_token: string; gen_time: string }) {
    const body: any = { ...formData }
    if (geetest) Object.assign(body, geetest)
    return apiPost('/api/auth/register', body)
  }

  async function logout() {
    await apiPost('/api/auth/logout')
    clearTokens()
    user.value = null
  }

  async function fetchUserInfo() {
    const data = await apiGet('/userinfo')
    if (data.sub) {
      user.value = {
        id: data.sub,
        username: data.preferred_username || data.sub,
        email: data.email,
        display_name: data.name,
        picture: data.picture,
        role: data.role || 'user',
        qq: data.qq,
        sub: data.sub
      }
      localStorage.setItem('user', JSON.stringify(user.value))
    }
    return data
  }

  async function sendActivationEmail(email: string) {
    console.log('[AuthStore] sendActivationEmail - email:', email)
    return apiPost('/api/email/send-activation', { email })
  }

  async function sendResetPasswordEmail(email: string) {
    console.log('[AuthStore] sendResetPasswordEmail - email:', email)
    return apiPost('/api/email/send-reset-password', { email })
  }

  async function verifyActivation(code: string, email: string) {
    console.log('[AuthStore] verifyActivation - email:', email, 'codePrefix:', code.substring(0, 2) + '***')
    const res = await fetch(`${API_BASE}/api/email/verify-activation?code=${code}&email=${encodeURIComponent(email)}`)
    const data = await res.json()
    console.log('[AuthStore] verifyActivation response:', data)
    return data
  }

  async function resetPassword(email: string, resetCode: string, newPassword: string) {
    console.log('[AuthStore] resetPassword - email:', email, 'codePrefix:', resetCode.substring(0, 2) + '***')
    return apiPost('/api/email/reset-password', { email, reset_code: resetCode, new_password: newPassword, confirm_password: newPassword })
  }

  async function sendLoginCode(email: string, geetest?: { lot_number: string; captcha_output: string; pass_token: string; gen_time: string }) {
    console.log('[AuthStore] sendLoginCode - email:', email)
    const body: any = { email }
    if (geetest) Object.assign(body, geetest)
    return apiPost('/api/auth/send-login-code', body)
  }

  async function loginWithCode(email: string, code: string) {
    console.log('[AuthStore] loginWithCode - email:', email, 'codePrefix:', code.substring(0, 2) + '***')
    const data = await apiPost('/api/auth/login-with-code', { email, code })
    console.log('[AuthStore] loginWithCode response:', JSON.stringify(data))
    if (data.access_token) {
      setTokens(data.access_token, '', data.expires_in)
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
      console.log('[AuthStore] loginWithCode - tokens set, user stored in localStorage')
    }
    return data
  }

  initSession()

  return { user, isLoggedIn, login, register, logout, fetchUserInfo, loadUser, sendActivationEmail, sendResetPasswordEmail, verifyActivation, resetPassword, sendLoginCode, loginWithCode }
})
