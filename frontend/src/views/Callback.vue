<template>
  <div class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">CALLBACK</span>
        <h1 class="page-title">正在处理</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">AUTHENTICATING...</p>
      </div>
    </div>

    <div class="auth-container">
      <div class="auth-card">
        <div class="callback-status">
          <div v-if="loading" class="spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            <p>正在处理授权回调...</p>
          </div>
          <div v-if="error" class="error-msg">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="error-icon"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <p>{{ error }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { setTokens } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const loading = ref(true)
const error = ref('')
const auth = useAuthStore()

onMounted(() => {
  const query = new URLSearchParams(window.location.search)

  // 社交登录回调：携带 access_token 直接登录
  const accessToken = query.get('access_token')
  const refreshToken = query.get('refresh_token')
  const expiresIn = query.get('expires_in')
  const userJson = query.get('user')

  if (accessToken && expiresIn) {
    setTokens(accessToken, refreshToken || '', parseInt(expiresIn))
    if (userJson) {
      try {
        const userData = JSON.parse(decodeURIComponent(userJson))
        auth.user = userData
        localStorage.setItem('user', JSON.stringify(userData))
      } catch {}
    }
    window.location.hash = '#/profile'
    return
  }

  // OIDC 授权码回调
  const code = query.get('code')
  const err = query.get('error')

  loading.value = false

  if (err) {
    error.value = query.get('error_description') || '授权失败'
    return
  }

  if (code) {
    router.push('/login')
  } else {
    error.value = '缺少授权参数'
  }
})
</script>

<style scoped>
.callback-status { text-align: center; padding: 40px 0; }
.spinner svg { width: 40px; height: 40px; animation: spin 0.8s linear infinite; color: #E63946; margin-bottom: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner p { font-size: 14px; color: #6B7280; }

.error-msg { text-align: center; }
.error-icon { width: 40px; height: 40px; color: #EF4444; margin-bottom: 12px; }
.error-msg p { font-size: 14px; color: #FCA5A5; }
</style>
