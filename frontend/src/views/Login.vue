<template>
  <div class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">{{ pageTag }}</span>
        <h1 class="page-title">{{ pageTitle }}</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">{{ pageSubtitle }}</p>
      </div>
    </div>

    <div class="auth-container">
      <div class="auth-card">
        <div class="tab-bar" v-if="!totpStep">
          <button :class="['tab-btn', { active: activeTab === 'login' }]" @click="activeTab = 'login'">登录</button>
          <button :class="['tab-btn', { active: activeTab === 'register' }]" @click="activeTab = 'register'">注册</button>
          <button :class="['tab-btn', { active: activeTab === 'reset' }]" @click="activeTab = 'reset'">找回密码</button>
        </div>

        <div v-if="activeTab === 'login' && !totpStep">
          <form class="auth-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">用户名 / 邮箱</label>
              <input v-model="loginForm.username" type="text" class="form-input" placeholder="请输入用户名或邮箱" required />
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <input v-model="loginForm.password" type="password" class="form-input" placeholder="请输入密码" required />
            </div>
            <button type="submit" class="btn-submit" :disabled="loading">
              <svg v-if="loading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
              </svg>
              {{ loading ? '验证中...' : '登录' }}
            </button>
          </form>

          <div v-if="securityNotice" class="security-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notice-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>{{ securityNotice.message }}</span>
          </div>

          <div class="auth-divider"><span>其他方式</span></div>

          <div class="social-btns">
            <button type="button" class="btn-social" @click="handleGithubLogin" :disabled="githubLoading">
              <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              GitHub 登录
            </button>
            <button type="button" class="btn-social" @click="handleQQLogin" :disabled="qqLoading">
              <svg viewBox="0 0 1024 1024" fill="currentColor" class="btn-icon"><path d="M802.952533 341.265067C798.378667 166.229333 673.792 34.747733 512.136533 34.133333 350.208 34.747733 225.621333 166.229333 221.047467 341.1968a154.897067 154.897067 0 0 0-29.696 117.623467C140.629333 520.260267 107.861333 582.656 102.673067 654.7456c-1.6384 34.269867 4.096 70.2464 19.2512 90.862933 25.8048 35.157333 62.190933 25.668267 93.047466-6.485333 4.778667 9.079467 10.0352 18.363733 15.906134 27.8528-47.035733 32.904533-64.3072 95.163733-36.181334 141.312 23.210667 38.0928 70.519467 59.665067 133.666134 59.665067 87.927467 0 146.773333-19.182933 183.637333-51.2 37.819733 32.290133 96.324267 51.2 183.637333 51.2 63.146667 0 110.455467-21.572267 133.597867-59.5968 28.125867-46.216533 10.922667-108.475733-36.181333-141.380267 5.9392-9.557333 11.264-18.773333 15.9744-27.8528 30.856533 32.085333 67.242667 41.642667 93.047466 6.485333 15.223467-20.6848 20.957867-56.661333 19.319467-90.112-5.188267-72.840533-37.956267-135.304533-88.746667-196.608a154.965333 154.965333 0 0 0-29.696-117.623466z m49.152 343.586133a152.234667 152.234667 0 0 1-19.2512-32.426667l-39.1168-86.698666-24.917333 91.818666c-7.7824 28.740267-24.849067 63.488-53.998933 103.424l-30.446934 41.642667 50.176 11.741867c33.1776 7.7824 47.445333 40.277333 36.386134 58.504533-9.489067 15.5648-34.2016 26.8288-75.3664 26.8288-76.1856 0-119.466667-15.428267-142.336-37.6832a55.978667 55.978667 0 0 0-41.1648-16.042667 56.661333 56.661333 0 0 0-42.120534 16.861867c-22.1184 21.435733-65.3312 36.864-141.585066 36.864-41.096533 0-65.877333-11.264-75.298134-26.8288-11.0592-18.158933 3.208533-50.722133 36.386134-58.504533l50.176-11.741867-30.446934-41.642667c-29.149867-39.867733-46.216533-74.683733-53.998933-103.424l-24.917333-91.818666-39.1168 86.698666a152.1664 152.1664 0 0 1-19.2512 32.426667 157.4912 157.4912 0 0 1-1.092267-26.0096c4.164267-58.368 35.293867-113.322667 83.899733-169.096533l13.858134-15.9744-8.055467-19.524267c-6.144-14.9504-2.730667-54.340267 18.8416-76.049067l10.8544-10.922666-1.024-15.36c0-144.1792 97.006933-249.0368 222.958933-249.514667 125.610667 0.477867 222.685867 105.335467 222.685867 248.763733 0 1.092267-1.024 16.110933-1.024 16.110934l10.8544 10.922666c21.572267 21.7088 25.053867 61.166933 18.8416 75.9808l-8.123733 19.592534 13.9264 15.9744c48.469333 55.569067 79.598933 110.523733 83.899733 169.437866 0.4096 8.533333-0.136533 17.749333-1.092267 25.668267z"/></svg>
              QQ 登录
            </button>
            <button type="button" class="btn-social btn-passkey" @click="handleWebAuthnLogin" :disabled="webauthnLoading">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              通行密钥登录
            </button>
          </div>
        </div>

        <div v-if="activeTab === 'login' && totpStep" class="totp-verify">
          <div class="totp-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <h3 class="totp-title">双因素认证</h3>
          <p class="totp-desc">请输入您身份验证器应用中的 6 位动态码</p>
          <form class="auth-form" @submit.prevent="verifyTotp">
            <div class="form-group">
              <input v-model="totpCode" type="text" class="form-input totp-input" placeholder="000000" maxlength="6" inputmode="numeric" autocomplete="one-time-code" />
            </div>
            <button type="submit" class="btn-submit" :disabled="totpLoading">
              <svg v-if="totpLoading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
              </svg>
              {{ totpLoading ? '验证中...' : '验证' }}
            </button>
          </form>
          <button class="totp-back" @click="cancelTotp">返回登录</button>
        </div>

        <form v-if="activeTab === 'register'" class="auth-form" @submit.prevent="handleRegister">
          <div class="form-group">
            <label class="form-label">用户名</label>
            <input v-model="regForm.username" type="text" class="form-input" placeholder="3-50字符，字母数字下划线" required />
          </div>
          <div class="form-group">
            <label class="form-label">邮箱</label>
            <input v-model="regForm.email" type="email" class="form-input" placeholder="请输入邮箱地址" required />
          </div>
          <div class="form-group">
            <label class="form-label">密码</label>
            <input v-model="regForm.password" type="password" class="form-input" placeholder="至少8位" required minlength="8" />
          </div>
          <div class="form-group">
            <label class="form-label">确认密码</label>
            <input v-model="regForm.confirm_password" type="password" class="form-input" placeholder="再次输入密码" required />
          </div>
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input v-model="regForm.display_name" type="text" class="form-input" placeholder="选填" />
          </div>
          <button type="submit" class="btn-submit" :disabled="regLoading">
            <svg v-if="regLoading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            {{ regLoading ? '注册中...' : '注册' }}
          </button>
        </form>

        <form v-if="activeTab === 'reset'" class="auth-form" @submit.prevent="handleResetPassword">
          <template v-if="resetStep === 1">
            <div class="form-group">
              <label class="form-label">邮箱</label>
              <input v-model="resetForm.email" type="email" class="form-input" placeholder="请输入注册邮箱" required />
            </div>
            <button type="submit" class="btn-submit" :disabled="resetLoading">{{ resetLoading ? '发送中...' : '发送重置邮件' }}</button>
          </template>
          <template v-if="resetStep === 2">
            <div class="form-group">
              <label class="form-label">验证码</label>
              <input v-model="resetForm.code" type="text" class="form-input" placeholder="邮件中的验证码" required />
            </div>
            <div class="form-group">
              <label class="form-label">新密码</label>
              <input v-model="resetForm.password" type="password" class="form-input" placeholder="至少8位" required minlength="8" />
            </div>
            <button type="submit" class="btn-submit" :disabled="resetLoading">{{ resetLoading ? '重置中...' : '重置密码' }}</button>
          </template>
        </form>

        <div class="toast" v-if="toast.show" :class="toast.type">{{ toast.message }}</div>
      </div>
    </div>
  </div>

  <div class="redirect-overlay" v-if="redirecting">
    <div class="redirect-content">
      <div class="redirect-spinner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>
      </div>
      <div class="redirect-text">正在安全跳转...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAccessToken, loadTokens, setTokens, apiPost, apiGet } from '@/utils/api'
import { API_BASE } from '@/utils/api'

declare function initGeetest4(config: { captchaId: string; product?: string }, callback: (captcha: any) => void): void

interface GeetestResult {
  lot_number: string; captcha_output: string; pass_token: string; gen_time: string
}

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref<'login' | 'register' | 'reset'>('login')
const loading = ref(false)
const regLoading = ref(false)
const resetLoading = ref(false)
const githubLoading = ref(false)
const qqLoading = ref(false)
const webauthnLoading = ref(false)
const securityNotice = ref<any>(null)

const loginForm = reactive({ username: '', password: '' })
const regForm = reactive({ username: '', email: '', password: '', confirm_password: '', qq: '' })
const resetStep = ref(1)
const resetForm = reactive({ email: '', code: '', password: '' })

const toast = reactive({ show: false, message: '', type: 'info' })
const redirecting = ref(false)

const totpStep = ref(false)
const totpCode = ref('')
const totpLoading = ref(false)
const tempToken = ref('')
const tempUser = ref<any>(null)

let captchaInstance: any = null

const pageTag = computed(() => {
  if (totpStep.value) return '2FA'
  return activeTab.value === 'login' ? 'LOGIN' : activeTab.value === 'register' ? 'JOIN' : 'RESET'
})
const pageTitle = computed(() => {
  if (totpStep.value) return '验证身份'
  return activeTab.value === 'login' ? '欢迎回来' : activeTab.value === 'register' ? '创建账号' : '找回密码'
})
const pageSubtitle = computed(() => {
  if (totpStep.value) return 'TWO-FACTOR AUTH'
  return activeTab.value === 'login' ? 'SIGN IN' : activeTab.value === 'register' ? 'SIGN UP' : 'RESET PASSWORD'
})

function showToast(msg: string, type = 'error') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => toast.show = false, 4000)
}

function getTestCaptcha(): GeetestResult {
  return { lot_number: 'test_lot_' + Date.now(), captcha_output: 'test_output', pass_token: 'test_token', gen_time: Date.now().toString() }
}

function triggerGeetest(): Promise<GeetestResult> {
  const testCaptcha = getTestCaptcha()
  return fetch(`${API_BASE}/api/geetest/register`, { method: 'POST' })
    .then(res => res.json()).then(res => {
      if (!res.captcha_id || res.mock) return testCaptcha
      return new Promise<GeetestResult>((resolve) => {
        if (typeof initGeetest4 !== 'function') { resolve(testCaptcha); return }
        if (captchaInstance) { captchaInstance.destroy(); captchaInstance = null }
        initGeetest4({ captchaId: res.captcha_id, product: 'bind' }, function (captcha: any) {
          captchaInstance = captcha
          captcha.onSuccess(() => {
            const result = captcha.getValidate()
            resolve({ lot_number: result.lot_number, captcha_output: result.captcha_output, pass_token: result.pass_token, gen_time: result.gen_time })
          })
          captcha.showCaptcha()
        })
      })
    }).catch(() => testCaptcha)
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) { showToast('请输入用户名和密码'); return }
  loading.value = true
  try {
    const geetest = await triggerGeetest()
    const data = await auth.login(loginForm.username, loginForm.password, geetest)
    if (data.require_2fa) {
      tempToken.value = data.temp_token
      tempUser.value = data.user
      totpStep.value = true
      return
    }
    if (data.access_token) {
      if (data.security_notice) securityNotice.value = data.security_notice
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else {
      showToast(data.message || '登录失败')
    }
  } catch (e: any) {
    showToast(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

async function verifyTotp() {
  if (!totpCode.value || totpCode.value.length !== 6) { showToast('请输入6位验证码'); return }
  totpLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/auth/totp/login-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_token: tempToken.value, code: totpCode.value })
    })
    const data = await res.json()
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token, data.expires_in)
      localStorage.setItem('user', JSON.stringify(data.user))
      auth.user = data.user
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else {
      showToast(data.message || '验证码错误')
    }
  } catch { showToast('验证失败') }
  finally { totpLoading.value = false }
}

function cancelTotp() {
  totpStep.value = false
  totpCode.value = ''
  tempToken.value = ''
  tempUser.value = null
}

async function handleRegister() {
  if (!regForm.username || !regForm.email || !regForm.password) { showToast('请填写所有必填项'); return }
  if (regForm.password !== regForm.confirm_password) { showToast('两次密码不一致'); return }
  if (regForm.password.length < 8) { showToast('密码至少8位'); return }
  regLoading.value = true
  try {
    const geetest = await triggerGeetest()
    const data = await auth.register({ ...regForm }, geetest)
    if (data.user_id) {
      showToast('注册成功！请查收激活邮件完成账户激活。', 'success')
      activeTab.value = 'login'
    } else {
      showToast(data.message || '注册失败')
    }
  } catch (e: any) { showToast(e.message || '注册失败') }
  finally { regLoading.value = false }
}

async function handleResetPassword() {
  if (resetStep.value === 1) {
    if (!resetForm.email) { showToast('请输入邮箱'); return }
    resetLoading.value = true
    try {
      const geetest = await triggerGeetest()
      const data = await auth.sendResetPasswordEmail(resetForm.email)
      if (data.message) { showToast('重置邮件已发送，请查收', 'success'); resetStep.value = 2 }
      else { showToast(data.message || '发送失败') }
    } catch { showToast('发送失败') }
    finally { resetLoading.value = false }
  } else {
    if (!resetForm.code || !resetForm.password) { showToast('请填写验证码和新密码'); return }
    resetLoading.value = true
    try {
      const data = await auth.resetPassword(resetForm.email, resetForm.code, resetForm.password)
      if (data.message) {
        showToast('密码已重置成功', 'success')
        resetStep.value = 1; resetForm.email = ''; resetForm.code = ''; resetForm.password = ''
        activeTab.value = 'login'
      } else { showToast(data.message || '重置失败') }
    } catch { showToast('重置失败') }
    finally { resetLoading.value = false }
  }
}

function handleGithubLogin() {
  githubLoading.value = true
  const redirect = encodeURIComponent(`${window.location.origin}${window.location.hash ? window.location.hash.replace('#', '') : '/login'}`)
  window.location.href = `${API_BASE}/api/auth/social/github/login?redirect_uri=${redirect}`
}

function handleQQLogin() {
  qqLoading.value = true
  const redirect = encodeURIComponent(`${window.location.origin}${window.location.hash ? window.location.hash.replace('#', '') : '/login'}`)
  window.location.href = `${API_BASE}/api/auth/social/qq/login?redirect_uri=${redirect}`
}

async function handleWebAuthnLogin() {
  if (!window.PublicKeyCredential) { showToast('当前浏览器不支持通行密钥'); return }
  webauthnLoading.value = true
  try {
    const beginData = await apiPost('/api/webauthn/login/begin', { username: null })
    const publicKey = beginData.publicKey
    publicKey.challenge = base64URLToBuffer(publicKey.challenge)
    if (publicKey.allowCredentials) {
      publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({ ...c, id: base64URLToBuffer(c.id) }))
    }
    const cred = await navigator.credentials.get({ publicKey }) as any
    const data = await apiPost('/api/webauthn/login/complete', {
      id: cred.id, rawId: bufferToBase64URL(cred.rawId),
      response: { clientDataJSON: bufferToBase64URL(cred.response.clientDataJSON), authenticatorData: bufferToBase64URL(cred.response.authenticatorData), signature: bufferToBase64URL(cred.response.signature), userHandle: cred.response.userHandle ? bufferToBase64URL(cred.response.userHandle) : null },
      type: cred.type
    })
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token, data.expires_in)
      localStorage.setItem('user', JSON.stringify(data.user))
      auth.user = data.user
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else { showToast(data.message || '认证失败') }
  } catch (e: any) { if (e.name !== 'NotAllowedError') { showToast(e.message || '认证失败') } }
  finally { webauthnLoading.value = false }
}

function bufferToBase64URL(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer); let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64URLToBuffer(base64url: string) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64); const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

onMounted(() => {
  loadTokens()
  if (getAccessToken()) {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const redirect = params.get('redirect') || '#/profile'
    redirecting.value = true
    setTimeout(() => { window.location.hash = redirect }, 300)
  }
})
</script>

<style scoped>
.tab-bar { display: flex; gap: 4px; margin-bottom: 28px; background: rgba(0, 0, 0, 0.2); border-radius: 10px; padding: 4px; }
.tab-btn { flex: 1; padding: 10px; border: none; border-radius: 8px; background: transparent; color: #6B7280; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.4s ease; font-family: inherit; }
.tab-btn.active { background: rgba(230, 57, 70, 0.12); color: #E63946; box-shadow: 0 1px 8px rgba(230,57,70,0.06); }
.tab-btn:hover:not(.active) { color: #9CA3AF; }

.security-notice { display: flex; align-items: flex-start; gap: 8px; padding: 12px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 8px; font-size: 12px; color: #F59E0B; line-height: 1.5; margin-top: 12px; }
.notice-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

.auth-divider { text-align: center; margin: 24px 0; position: relative; }
.auth-divider::before, .auth-divider::after { content: ''; position: absolute; top: 50%; width: calc(50% - 36px); height: 1px; background: rgba(255, 255, 255, 0.06); }
.auth-divider::before { left: 0; }
.auth-divider::after { right: 0; }
.auth-divider span { color: #4B5058; font-size: 12px; }

.social-btns { display: flex; flex-direction: column; gap: 10px; }
.btn-social { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; background: rgba(255, 255, 255, 0.03); color: #9CA3AF; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.4s ease; }
.btn-social:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); color: #E5E7EB; border-color: rgba(255, 255, 255, 0.1); }
.btn-social:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; flex-shrink: 0; }

.totp-verify { text-align: center; padding: 8px 0; }
.totp-icon { width: 56px; height: 56px; margin: 0 auto 16px; background: rgba(230,57,70,0.1); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: #E63946; }
.totp-icon svg { width: 28px; height: 28px; }
.totp-title { font-size: 20px; font-weight: 600; color: #F5F5F5; margin-bottom: 8px; }
.totp-desc { font-size: 13px; color: #6B7280; margin-bottom: 24px; line-height: 1.5; }
.totp-input { text-align: center; font-size: 28px !important; letter-spacing: 10px; font-weight: 700; padding: 16px !important; font-family: 'Courier New', monospace !important; }
.totp-back { background: none; border: none; color: #6B7280; font-size: 13px; cursor: pointer; margin-top: 16px; font-family: inherit; transition: color 0.3s ease; }
.totp-back:hover { color: #9CA3AF; }

.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; animation: fadeIn 0.3s ease; }
.toast.error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; }
.toast.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6EE7B7; }
.toast.info { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93C5FD; }
@keyframes fadeIn { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

.redirect-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: overlayIn 0.3s ease;
}
@keyframes overlayIn { from { opacity: 0; } to { opacity: 1; } }

.redirect-content {
  text-align: center;
  animation: contentBounce 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes contentBounce {
  from { opacity: 0; transform: scale(0.9) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.redirect-spinner {
  width: 56px; height: 56px; margin: 0 auto;
  border: 2px solid rgba(230,57,70,0.1);
  border-top-color: #E63946;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.redirect-text {
  margin-top: 20px;
  font-size: 14px; color: #6B7280;
  letter-spacing: 2px;
}

@media (max-width: 768px) { .auth-card { padding: 24px 20px; } }
</style>
