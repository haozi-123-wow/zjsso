<template>
  <div class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">AUTHORIZE</span>
        <h1 class="page-title">授权确认</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">OAUTH CONSENT</p>
      </div>
    </div>

    <div class="auth-container" :class="{ 'consent-exiting': redirecting }">
      <div class="auth-card consent-card" :class="{ 'consent-fade-out': redirecting }">
        <div class="consent-header">
          <div class="app-icon">
            <img v-if="client?.logo_uri" :src="client.logo_uri" class="app-logo" alt="" />
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <div class="app-info">
            <h2 class="app-name">{{ client?.client_name || '应用名称' }}</h2>
            <p class="app-desc">{{ client?.client_description || '该应用请求访问您的账号信息' }}</p>
          </div>
        </div>

        <div class="scope-section">
          <h3 class="scope-title">请求权限范围</h3>
          <div class="scope-list">
            <div v-for="scope in scopes" :key="scope.name" class="scope-item">
              <div class="scope-check">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div class="scope-content">
                <span class="scope-name">{{ scope.label }}</span>
                <span class="scope-desc">{{ scope.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="consent-actions">
          <button class="btn-cancel" @click="deny" :disabled="redirecting">拒绝</button>
          <button class="btn-approve" @click="approve" :disabled="redirecting">
            <svg v-if="!redirecting" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-approve-icon"><polyline points="20 6 9 17 4 12"/></svg>
            <span v-if="redirecting" class="btn-spinner"></span>
            {{ redirecting ? '跳转中...' : '授权' }}
          </button>
        </div>
      </div>
    </div>

    <Transition name="redirect-overlay">
      <div v-if="redirecting" class="redirect-overlay">
        <div class="redirect-card">
          <div class="redirect-spinner">
            <div class="spinner-ring"></div>
          </div>
          <h3 class="redirect-title">授权成功</h3>
          <p class="redirect-desc">正在安全跳转至应用...</p>
          <div class="redirect-progress">
            <div class="progress-bar"></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccessToken, restoreSession } from '@/utils/api'
import { API_BASE } from '@/utils/api'

const router = useRouter()
const client = ref<any>(null)
const params = ref<any>({})
const redirecting = ref(false)

const scopeMap: Record<string, { label: string; desc: string }> = {
  openid: { label: 'OpenID', desc: '使用您的身份登录' },
  profile: { label: '个人信息', desc: '查看昵称、头像、用户名' },
  email: { label: '邮箱', desc: '查看您的邮箱地址' },
  phone: { label: '手机号', desc: '查看您的手机号码' }
}

const scopes = computed(() => {
  if (!params.value.scope) return [{ name: 'openid', ...scopeMap.openid }]
  return params.value.scope.split(' ').filter(Boolean).map((s: string) => ({
    name: s,
    ...(scopeMap[s] || { label: s, desc: '未声明的权限' })
  }))
})

onMounted(async () => {
  if (!getAccessToken()) {
    const restored = await restoreSession()
    if (!restored) {
      window.location.href = `/#/login?redirect=${encodeURIComponent(window.location.hash)}`
      return
    }
  }

  const hash = window.location.hash.split('?')
  const queryStr = hash[1] || ''
  const searchParams = new URLSearchParams(queryStr)
  params.value = Object.fromEntries(searchParams.entries())

  if (params.value.client_id) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/client-info?client_id=${params.value.client_id}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        client.value = data
      }
    } catch {}

    try {
      const token = getAccessToken()
      const consentRes = await fetch(`${API_BASE}/api/auth/check-consent?client_id=${params.value.client_id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (consentRes.ok) {
        const { consented } = await consentRes.json()
        if (consented) {
          redirecting.value = true
          await new Promise(r => setTimeout(r, 800))
          await approve()
          return
        }
      }
    } catch {}
  }
})

async function approve() {
  const token = getAccessToken()
  if (!token) {
    window.location.href = `/#/login?redirect=${encodeURIComponent(window.location.hash)}`
    return
  }

  redirecting.value = true
  await new Promise(r => setTimeout(r, 600))

  const queryParams = new URLSearchParams({
    ...params.value,
    response_type: 'code',
    state: params.value.state || Math.random().toString(36).substring(2)
  })

  try {
    const res = await fetch(`${API_BASE}/api/auth/token-session`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const { token_session } = await res.json()
      window.location.href = `${API_BASE}/oauth/authorize?${queryParams}&token_session=${token_session}`
    } else {
      window.location.href = `/#/login?redirect=${encodeURIComponent(window.location.hash)}`
    }
  } catch {
    window.location.href = `/#/login?redirect=${encodeURIComponent(window.location.hash)}`
  }
}

function deny() {
  const redirect = params.value.redirect_uri
  if (redirect) {
    window.location.href = `${redirect}?error=access_denied&error_description=用户拒绝了授权请求`
  } else {
    router.push('/login')
  }
}
</script>

<style scoped>
.consent-card { animation: consentIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes consentIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

.consent-exiting { animation: containerShrink 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes containerShrink { to { opacity: 0; transform: scale(0.96); } }

.consent-fade-out { animation: cardFadeOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes cardFadeOut { to { opacity: 0; transform: translateY(-10px) scale(0.98); } }

.btn-approve:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
.btn-cancel:disabled { opacity: 0.3; cursor: not-allowed; }

.btn-spinner { width: 18px; height: 18px; border: 2px solid rgba(230, 57, 70, 0.2); border-top-color: #E63946; border-radius: 50%; animation: spin 0.6s linear infinite; display: inline-block; }
@keyframes spin { to { transform: rotate(360deg); } }

.redirect-overlay { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(12px); }
.redirect-card { text-align: center; padding: 48px; }
.redirect-spinner { margin-bottom: 28px; display: flex; align-items: center; justify-content: center; }
.spinner-ring { width: 64px; height: 64px; border-radius: 50%; border: 4px solid rgba(230, 57, 70, 0.12); border-top-color: #E63946; border-right-color: #E63946; animation: ringSpin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite; }
@keyframes ringSpin { to { transform: rotate(360deg); } }
.redirect-title { font-size: 22px; font-weight: 700; color: #F5F5F5; margin: 0 0 8px; }
.redirect-desc { font-size: 14px; color: #6B7280; margin: 0 0 32px; }
.redirect-progress { width: 200px; height: 3px; background: rgba(255, 255, 255, 0.06); border-radius: 4px; margin: 0 auto; overflow: hidden; }
.progress-bar { height: 100%; background: linear-gradient(90deg, #E63946, #ff6b6b); border-radius: 4px; animation: progressSlide 1.2s ease-in-out infinite; }
@keyframes progressSlide { 0% { width: 0; transform: translateX(0); } 50% { width: 60%; } 100% { width: 100%; transform: translateX(200px); } }

.redirect-overlay-enter-active { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
.redirect-overlay-enter-from { opacity: 0; }
.redirect-overlay-enter-from .redirect-card { opacity: 0; transform: scale(0.9) translateY(10px); }
.redirect-overlay-enter-active .redirect-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }

.consent-header { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
.app-icon { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: rgba(230, 57, 70, 0.08); border-radius: 16px; color: #E63946; flex-shrink: 0; overflow: hidden; }
.app-icon svg { width: 28px; height: 28px; }
.app-logo { width: 56px; height: 56px; object-fit: contain; border-radius: 16px; }
.app-info { flex: 1; }
.app-name { font-size: 20px; font-weight: 700; color: #F5F5F5; margin-bottom: 4px; }
.app-desc { font-size: 14px; color: #6B7280; line-height: 1.5; }

.scope-section { margin-bottom: 32px; }
.scope-title { font-size: 12px; font-weight: 700; color: #7C8290; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.scope-title::before { content: ''; width: 3px; height: 14px; background: #E63946; border-radius: 2px; flex-shrink: 0; }
.scope-list { display: flex; flex-direction: column; gap: 10px; }
.scope-item { display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; background: rgba(0, 0, 0, 0.15); border: 1px solid rgba(255, 255, 255, 0.02); border-radius: 12px; transition: all 0.3s ease; }
.scope-item:hover { border-color: rgba(255,255,255,0.06); }
.scope-check { width: 24px; height: 24px; flex-shrink: 0; background: rgba(16, 185, 129, 0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-top: 1px; }
.scope-check svg { width: 14px; height: 14px; color: #34D399; }
.scope-content { flex: 1; }
.scope-name { display: block; font-size: 15px; font-weight: 600; color: #E5E7EB; }
.scope-desc { display: block; font-size: 13px; color: #6B7280; margin-top: 2px; }

.consent-actions { display: flex; gap: 12px; }
.btn-approve { flex: 1; padding: 12px 20px; background: rgba(230, 57, 70, 0.12); border: 1px solid rgba(230, 57, 70, 0.25); border-radius: 10px; color: #E63946; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.4s ease; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 8px; }
.btn-approve:hover:not(:disabled) { background: rgba(230, 57, 70, 0.2); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(230,57,70,0.1); }
.btn-approve-icon { width: 18px; height: 18px; }
.btn-cancel { flex: 1; padding: 12px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; color: #6B7280; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.4s ease; font-family: inherit; }
.btn-cancel:hover:not(:disabled) { color: #9CA3AF; border-color: rgba(255, 255, 255, 0.1); background: rgba(255,255,255,0.02); }
</style>
