<template>
  <div class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">ACTIVATION</span>
        <h1 class="page-title">{{ status === 'success' ? '激活成功' : status === 'error' ? '激活失败' : '正在激活' }}</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">EMAIL VERIFICATION</p>
      </div>
    </div>

    <div class="auth-container">
      <div class="auth-card">
        <div class="activation-status">
          <div v-if="loading" class="spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
              <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
            </svg>
            <p>正在验证激活码...</p>
          </div>

          <div v-else-if="status === 'success'" class="result-success">
            <div class="result-icon success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h3 class="result-title">账号已成功激活</h3>
            <p class="result-desc">{{ message }}</p>
            <button class="btn-submit" @click="goLogin">前往登录</button>
          </div>

          <div v-else class="result-error">
            <div class="result-icon error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <h3 class="result-title error-title">激活失败</h3>
            <p class="result-desc">{{ message }}</p>
            <button class="btn-submit" @click="goLogin">返回登录</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { API_BASE } from '@/utils/api'

const loading = ref(true)
const status = ref<'success' | 'error'>('success')
const message = ref('')

function goLogin() {
  window.location.hash = '#/login'
}

onMounted(async () => {
  const hash = window.location.hash.split('?')
  const queryStr = hash[1] || ''
  const params = new URLSearchParams(queryStr)
  const code = params.get('code')
  const email = params.get('email')

  if (!code || !email) {
    loading.value = false
    status.value = 'error'
    message.value = '缺少必要的激活参数'
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/email/verify-activation?code=${encodeURIComponent(code)}&email=${encodeURIComponent(email)}`)
    const data = await res.json()
    if (data.message && !data.error) {
      status.value = 'success'
      message.value = data.message
    } else {
      status.value = 'error'
      message.value = data.message || '激活失败，激活码无效或已过期'
    }
  } catch {
    status.value = 'error'
    message.value = '网络错误，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.activation-status { text-align: center; padding: 40px 0; }

.spinner svg { width: 40px; height: 40px; animation: spin 0.8s linear infinite; color: #E63946; margin-bottom: 16px; }
@keyframes spin { to { transform: rotate(360deg); } }
.spinner p { font-size: 14px; color: #6B7280; }

.result-icon { width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 16px; display: flex; align-items: center; justify-content: center; }
.result-icon svg { width: 28px; height: 28px; }
.success-icon { background: rgba(16, 185, 129, 0.1); color: #34D399; }
.error-icon { background: rgba(239, 68, 68, 0.1); color: #F87171; }

.result-title { font-size: 20px; font-weight: 600; color: #F5F5F5; margin-bottom: 8px; }
.error-title { color: #FCA5A5; }
.result-desc { font-size: 14px; color: #6B7280; margin-bottom: 24px; line-height: 1.5; }

.btn-submit { width: auto; min-width: 180px; padding: 12px 32px; border: none; border-radius: 8px; background: linear-gradient(135deg, #E63946, #c62a35); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.4s ease; }
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(230, 57, 70, 0.3); }
</style>
