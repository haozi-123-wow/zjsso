<template>
  <div class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">{{ activeTab === 'login' ? 'LOGIN' : activeTab === 'register' ? 'JOIN' : 'RESET' }}</span>
        <h1 class="page-title">{{ activeTab === 'login' ? '欢迎回来' : activeTab === 'register' ? '创建账号' : '找回密码' }}</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">{{ activeTab === 'login' ? 'SIGN IN' : activeTab === 'register' ? 'SIGN UP' : 'RESET PASSWORD' }}</p>
      </div>
    </div>

    <div class="auth-container">
      <div class="auth-card">
        <div class="tab-bar">
          <button :class="['tab-btn', { active: activeTab === 'login' }]" @click="activeTab = 'login'">登录</button>
          <button :class="['tab-btn', { active: activeTab === 'register' }]" @click="activeTab = 'register'">注册</button>
          <button :class="['tab-btn', { active: activeTab === 'reset' }]" @click="activeTab = 'reset'">找回密码</button>
        </div>

        <form v-if="activeTab === 'login'" class="auth-form" @submit.prevent="handleLogin">
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
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            {{ loading ? '验证中...' : '登录' }}
          </button>
          <div v-if="securityNotice" class="security-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notice-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>{{ securityNotice.message }}</span>
          </div>
        </form>

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
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
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
            <button type="submit" class="btn-submit" :disabled="resetLoading">
              {{ resetLoading ? '发送中...' : '发送重置邮件' }}
            </button>
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
            <button type="submit" class="btn-submit" :disabled="resetLoading">
              {{ resetLoading ? '重置中...' : '重置密码' }}
            </button>
          </template>
        </form>

        <div class="auth-divider" v-if="activeTab === 'login'"><span>其他方式</span></div>

        <div v-if="activeTab === 'login'" class="social-btns">
          <button type="button" class="btn-social" @click="handleGithubLogin" :disabled="githubLoading">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            {{ githubLoading ? '跳转中...' : 'GitHub 登录' }}
          </button>
          <button type="button" class="btn-social" @click="handleQQLogin" :disabled="qqLoading">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>
            {{ qqLoading ? '跳转中...' : 'QQ 登录' }}
          </button>
        </div>

        <div class="toast" v-if="toast.show" :class="toast.type">{{ toast.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { API_BASE } from '@/utils/api'

declare function initGeetest4(config: { captchaId: string; product?: string }, callback: (captcha: any) => void): void

interface GeetestResult {
  lot_number: string
  captcha_output: string
  pass_token: string
  gen_time: string
}

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref<'login' | 'register' | 'reset'>('login')
const loading = ref(false)
const regLoading = ref(false)
const resetLoading = ref(false)
const githubLoading = ref(false)
const qqLoading = ref(false)
const securityNotice = ref<any>(null)

const loginForm = reactive({ username: '', password: '' })
const regForm = reactive({ username: '', email: '', password: '', confirm_password: '', display_name: '' })

const resetStep = ref(1)
const resetForm = reactive({ email: '', code: '', password: '' })

const toast = reactive({ show: false, message: '', type: 'info' })

let captchaInstance: any = null

function showToast(msg: string, type = 'error') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => toast.show = false, 4000)
}

function getTestCaptcha(): GeetestResult {
  return {
    lot_number: 'test_lot_' + Date.now(),
    captcha_output: 'test_output',
    pass_token: 'test_token',
    gen_time: Date.now().toString()
  }
}

function triggerGeetest(): Promise<GeetestResult> {
  const testCaptcha = getTestCaptcha()

  return fetch(`${API_BASE}/api/geetest/register`, { method: 'POST' })
    .then(res => res.json())
    .then(res => {
      if (!res.captcha_id || res.mock) {
        return testCaptcha
      }
      return new Promise<GeetestResult>((resolve) => {
        if (typeof initGeetest4 !== 'function') {
          resolve(testCaptcha)
          return
        }
        if (captchaInstance) {
          captchaInstance.destroy()
          captchaInstance = null
        }
        initGeetest4({ captchaId: res.captcha_id, product: 'bind' }, function (captcha: any) {
          captchaInstance = captcha
          captcha.onSuccess(() => {
            const result = captcha.getValidate()
            resolve({
              lot_number: result.lot_number,
              captcha_output: result.captcha_output,
              pass_token: result.pass_token,
              gen_time: result.gen_time
            })
          })
          captcha.showCaptcha()
        })
      })
    })
    .catch(() => testCaptcha)
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) { showToast('请输入用户名和密码'); return }
  loading.value = true
  try {
    const geetest = await triggerGeetest()
    const data = await auth.login(loginForm.username, loginForm.password, geetest)
    if (data.access_token) {
      if (data.security_notice) securityNotice.value = data.security_notice
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      window.location.hash = redirect
    } else {
      showToast(data.message || '登录失败')
    }
  } catch (e: any) {
    showToast(e.message || '登录失败')
  } finally {
    loading.value = false
  }
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
  } catch (e: any) {
    showToast(e.message || '注册失败')
  } finally {
    regLoading.value = false
  }
}

async function handleResetPassword() {
  if (resetStep.value === 1) {
    if (!resetForm.email) { showToast('请输入邮箱'); return }
    resetLoading.value = true
    try {
      const geetest = await triggerGeetest()
      const data = await auth.sendResetPasswordEmail(resetForm.email)
      if (data.message) {
        showToast('重置邮件已发送，请查收', 'success')
        resetStep.value = 2
      } else {
        showToast(data.message || '发送失败')
      }
    } catch { showToast('发送失败') }
    finally { resetLoading.value = false }
  } else {
    if (!resetForm.code || !resetForm.password) { showToast('请填写验证码和新密码'); return }
    resetLoading.value = true
    try {
      const data = await auth.resetPassword(resetForm.email, resetForm.code, resetForm.password)
      if (data.message) {
        showToast('密码已重置成功', 'success')
        resetStep.value = 1
        resetForm.email = ''; resetForm.code = ''; resetForm.password = ''
        activeTab.value = 'login'
      } else {
        showToast(data.message || '重置失败')
      }
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
</script>

<style scoped>
.tab-bar { display: flex; gap: 4px; margin-bottom: 28px; background: rgba(0, 0, 0, 0.2); border-radius: 10px; padding: 4px; }
.tab-btn { flex: 1; padding: 10px; border: none; border-radius: 8px; background: transparent; color: #6B7280; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.tab-btn.active { background: rgba(230, 57, 70, 0.12); color: #E63946; }
.tab-btn:hover:not(.active) { color: #9CA3AF; }

.security-notice { display: flex; align-items: flex-start; gap: 8px; padding: 12px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 8px; font-size: 12px; color: #F59E0B; line-height: 1.5; }
.notice-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

.auth-divider { text-align: center; margin: 24px 0; position: relative; }
.auth-divider::before, .auth-divider::after { content: ''; position: absolute; top: 50%; width: calc(50% - 36px); height: 1px; background: rgba(255, 255, 255, 0.06); }
.auth-divider::before { left: 0; }
.auth-divider::after { right: 0; }
.auth-divider span { color: #4B5058; font-size: 12px; }

.social-btns { display: flex; flex-direction: column; gap: 10px; }
.btn-social { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; background: rgba(255, 255, 255, 0.03); color: #9CA3AF; font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.3s ease; }
.btn-social:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); color: #E5E7EB; border-color: rgba(255, 255, 255, 0.1); }
.btn-social:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; flex-shrink: 0; }

.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; animation: fadeIn 0.3s ease; }
.toast.error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #FCA5A5; }
.toast.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6EE7B7; }
.toast.info { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.3); color: #93C5FD; }

@media (max-width: 768px) { .auth-card { padding: 24px 20px; } }
</style>
