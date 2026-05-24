import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loadTokens, clearTokens, setTokens, apiGet, apiPost, API_BASE } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<any>(null)
  const isLoggedIn = computed(() => !!user.value)

  function loadUser() {
    loadTokens()
    const stored = localStorage.getItem('user')
    if (stored) {
      try { user.value = JSON.parse(stored) } catch { user.value = null }
    }
  }

  async function login(username: string, password: string, geetest?: { lot_number: string; captcha_output: string; pass_token: string; gen_time: string }) {
    const body: any = { username, password }
    if (geetest) Object.assign(body, geetest)
    const data = await apiPost('/api/auth/login', body)
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token, data.expires_in)
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
    await apiPost('/api/auth/logout', { refresh_token: localStorage.getItem('refresh_token') })
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
    return apiPost('/api/email/send-activation', { email })
  }

  async function sendResetPasswordEmail(email: string) {
    return apiPost('/api/email/send-reset-password', { email })
  }

  async function verifyActivation(code: string, email: string) {
    const res = await fetch(`${API_BASE}/api/email/verify-activation?code=${code}&email=${encodeURIComponent(email)}`)
    return res.json()
  }

  async function resetPassword(email: string, resetCode: string, newPassword: string) {
    return apiPost('/api/email/reset-password', { email, reset_code: resetCode, new_password: newPassword, confirm_password: newPassword })
  }

  loadUser()

  return { user, isLoggedIn, login, register, logout, fetchUserInfo, loadUser, sendActivationEmail, sendResetPasswordEmail, verifyActivation, resetPassword }
})
