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

    <div class="auth-container">
      <div class="auth-card">
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
              <svg class="scope-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div>
                <span class="scope-name">{{ scope.label }}</span>
                <span class="scope-desc">{{ scope.desc }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="consent-actions">
          <button class="btn-cancel" @click="deny">拒绝</button>
          <button class="btn-approve" @click="approve">授权</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAccessToken, loadTokens } from '@/utils/api'
import { API_BASE } from '@/utils/api'

const router = useRouter()
const client = ref<any>(null)
const params = ref<any>({})

const scopeMap: Record<string, { label: string; desc: string }> = {
  openid: { label: 'OpenID', desc: '使用您的身份登录' },
  profile: { label: '个人信息', desc: '查看昵称、头像、用户名' },
  email: { label: '邮箱', desc: '查看您的邮箱地址' },
  phone: { label: '手机号', desc: '查看您的手机号码' }
}

const scopes = computed(() => {
  if (!params.value.scope) return [scopeMap.openid]
  return params.value.scope.split(' ').filter(Boolean).map((s: string) => scopeMap[s] || { label: s, desc: '未声明的权限' })
})

onMounted(async () => {
  loadTokens()
  if (!getAccessToken()) {
    window.location.href = `/#/login?redirect=${encodeURIComponent(window.location.hash)}`
    return
  }

  const hash = window.location.hash.split('?')
  const queryStr = hash[1] || ''
  const searchParams = new URLSearchParams(queryStr)
  params.value = Object.fromEntries(searchParams.entries())

  if (params.value.client_id) {
    try {
      const res = await fetch(`${API_BASE}/api/auth/client-info?client_id=${params.value.client_id}`)
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

  const queryParams = new URLSearchParams({
    ...params.value,
    response_type: 'code',
    state: params.value.state || Math.random().toString(36).substring(2)
  })

  window.location.href = `${API_BASE}/oauth/authorize?${queryParams}&access_token=${token}`
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
.consent-header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
.app-icon { width: 52px; height: 52px; display: flex; align-items: center; justify-content: center; background: rgba(230, 57, 70, 0.08); border-radius: 14px; color: #E63946; flex-shrink: 0; overflow: hidden; }
.app-icon svg { width: 26px; height: 26px; }
.app-logo { width: 52px; height: 52px; object-fit: contain; border-radius: 14px; }
.app-info { flex: 1; }
.app-name { font-size: 18px; font-weight: 600; color: #F5F5F5; margin-bottom: 4px; }
.app-desc { font-size: 13px; color: #6B7280; line-height: 1.4; }

.scope-section { margin-bottom: 32px; }
.scope-title { font-size: 12px; font-weight: 600; color: #7C8290; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }
.scope-list { display: flex; flex-direction: column; gap: 12px; }
.scope-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: rgba(0, 0, 0, 0.15); border-radius: 8px; }
.scope-check { width: 18px; height: 18px; color: #10B981; flex-shrink: 0; margin-top: 1px; }
.scope-name { display: block; font-size: 14px; font-weight: 500; color: #E5E7EB; }
.scope-desc { display: block; font-size: 12px; color: #6B7280; margin-top: 2px; }

.consent-actions { display: flex; gap: 12px; }
.btn-approve { flex: 1; padding: 12px; background: rgba(230, 57, 70, 0.12); border: 1px solid rgba(230, 57, 70, 0.25); border-radius: 8px; color: #E63946; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-approve:hover { background: rgba(230, 57, 70, 0.2); }
.btn-cancel { flex: 1; padding: 12px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; color: #6B7280; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-cancel:hover { color: #9CA3AF; border-color: rgba(255, 255, 255, 0.1); }
</style>
