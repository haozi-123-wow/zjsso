<template>
  <div v-if="!auth.isLoggedIn" class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">PROFILE</span>
        <h1 class="page-title">个人中心</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">请先登录</p>
      </div>
    </div>
    <div class="auth-container">
      <div class="auth-card" style="text-align:center;padding:60px 44px">
        <p style="color:#6B7280;margin-bottom:20px">您需要先登录才能访问个人中心</p>
        <a href="#/login" class="auth-link" style="color:#E63946;font-size:15px;font-weight:600">前往登录 →</a>
      </div>
    </div>
  </div>

  <div v-else class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">PROFILE</span>
        <h1 class="page-title">个人中心</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">MY ACCOUNT</p>
      </div>
    </div>

    <div class="profile-container">
      <div class="profile-grid">
        <div class="profile-card">
          <div class="avatar-section">
            <div class="avatar-wrapper" @click="triggerAvatarUpload">
              <img v-if="auth.user?.picture" :src="auth.user.picture" class="avatar-img" alt="头像" />
              <div v-else class="avatar-letter">{{ (auth.user?.display_name || auth.user?.username || 'U').charAt(0).toUpperCase() }}</div>
              <div class="avatar-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="camera-icon"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                <span>{{ uploadingAvatar ? '上传中...' : '更换头像' }}</span>
              </div>
            </div>
            <input ref="avatarInputRef" type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="handleAvatarChange" style="display:none" />
            <div v-if="auth.user?.picture" class="avatar-remove-link" @click="deleteAvatar">删除头像</div>
            <h2 class="display-name">{{ auth.user?.display_name || auth.user?.username }}</h2>
            <p class="user-email">{{ auth.user?.email }}</p>
            <span :class="['role-badge', auth.user?.role]">{{ roleLabel }}</span>
          </div>
          <button class="btn-logout" @click="handleLogout">退出登录</button>
        </div>

        <div class="details-card">
          <h3 class="section-title">账号信息</h3>
          <div class="detail-row"><span class="detail-label">用户名</span><span class="detail-value">{{ auth.user?.username }}</span></div>
          <div class="detail-row"><span class="detail-label">邮箱</span><span class="detail-value">{{ auth.user?.email }}</span></div>
          <div class="detail-row"><span class="detail-label">显示名称</span><span class="detail-value">{{ auth.user?.display_name || '-' }}</span></div>
          <div class="detail-row"><span class="detail-label">角色</span><span class="detail-value">{{ roleLabel }}</span></div>
        </div>

        <div class="webauthn-card">
          <h3 class="section-title">通行密钥</h3>
          <div v-if="credentials.length === 0" class="empty-state">
            <p>尚未注册通行密钥</p>
          </div>
          <div v-else class="cred-list">
            <div v-for="cred in credentials" :key="cred.id" class="cred-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="cred-icon"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              <div class="cred-info">
                <span class="cred-name">{{ cred.nickname || '通行密钥' }}</span>
                <span class="cred-date">{{ new Date(cred.created_at).toLocaleDateString() }}</span>
              </div>
              <button class="cred-delete" @click="deleteCredential(cred.id)">删除</button>
            </div>
          </div>
          <div class="cred-add-bar">
            <button class="btn-register-key" @click="registerPasskey" :disabled="regKeyLoading">
              {{ regKeyLoading ? '注册中...' : credentials.length === 0 ? '注册通行密钥' : '添加新密钥' }}
            </button>
          </div>
        </div>

        <div class="social-card">
          <h3 class="section-title">社交绑定</h3>
          <div v-if="socialConnections.length === 0" class="empty-state"><p>尚未绑定社交账号</p></div>
          <div v-else class="social-list">
            <div v-for="conn in socialConnections" :key="conn.id" class="social-item">
              <span class="social-provider">{{ conn.provider === 'github' ? 'GitHub' : conn.provider === 'qq' ? 'QQ' : conn.provider }}</span>
              <span class="social-username">{{ conn.provider_username }}</span>
              <button class="cred-delete" @click="unbindSocial(conn.id)">解绑</button>
            </div>
          </div>
        </div>

        <div class="consents-card">
          <h3 class="section-title">已授权应用</h3>
          <div v-if="consents.length === 0" class="empty-state"><p>尚未授权任何应用</p></div>
          <div v-else class="consents-list">
            <div v-for="item in consents" :key="item.id" class="consent-item">
              <img v-if="item.logo_uri" :src="item.logo_uri" class="consent-logo" alt="" />
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="consent-logo-fallback"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              <div class="consent-info">
                <span class="consent-name">{{ item.client_name }}</span>
                <span class="consent-scopes">{{ (item.scopes || []).join(', ') }}</span>
              </div>
              <button class="cred-delete" @click="revokeConsent(item)">撤销</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiGet, apiPost, clearTokens, API_BASE } from '@/utils/api'

const auth = useAuthStore()
const credentials = ref<any[]>([])
const socialConnections = ref<any[]>([])
const consents = ref<any[]>([])
const regKeyLoading = ref(false)
const keyRegResult = ref('')
const uploadingAvatar = ref(false)
const avatarInputRef = ref<HTMLInputElement | null>(null)

const roleLabel = computed(() => {
  const map: Record<string, string> = { user: '普通用户', developer: '开发者', admin: '管理员' }
  return map[auth.user?.role] || '普通用户'
})

onMounted(async () => {
  if (auth.isLoggedIn) {
    try {
      const credData = await apiGet('/api/webauthn/credentials')
      if (credData.credentials) credentials.value = credData.credentials
    } catch {}
    try {
      const socialData = await apiGet('/api/user/social/connections')
      if (socialData.connections) socialConnections.value = socialData.connections
    } catch {}
    try {
      const consentsData = await apiGet('/api/auth/user/consents')
      if (consentsData.consents) consents.value = consentsData.consents
    } catch {}
  }
})

async function handleLogout() {
  await auth.logout()
  clearTokens()
  window.location.hash = '#/login'
}

function triggerAvatarUpload() {
  avatarInputRef.value?.click()
}

async function handleAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) { alert('仅支持 JPG/PNG/GIF/WebP 格式'); return }
  if (file.size > 2 * 1024 * 1024) { alert('图片大小不能超过 2MB'); return }
  uploadingAvatar.value = true
  try {
    const sigRes = await fetch(`${API_BASE}/api/upload/avatar-signature?filename=${encodeURIComponent(file.name)}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    if (!sigRes.ok) { const d = await sigRes.json(); alert(d.message || '获取签名失败'); return }
    const sigData = await sigRes.json()
    const fd = new FormData()
    if (sigData.formData) {
      Object.entries(sigData.formData).forEach(([k, v]) => fd.append(k, v as string))
    }
    fd.append('file', file)
    const uploadRes = await fetch(sigData.uploadUrl, { method: 'POST', body: fd })
    if (!uploadRes.ok) { alert('上传到 COS 失败'); return }
    const confirmRes = await fetch(`${API_BASE}/api/upload/avatar-confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      },
      body: JSON.stringify({ key: sigData.key })
    })
    if (!confirmRes.ok) { alert('确认上传失败'); return }
    const confirmData = await confirmRes.json()
    if (confirmData.avatar) {
      if (auth.user) auth.user.picture = confirmData.avatar
      localStorage.setItem('user', JSON.stringify(auth.user))
      alert('头像上传成功')
    }
  } catch { alert('头像上传失败') }
  finally { uploadingAvatar.value = false; input.value = '' }
}

async function deleteAvatar() {
  if (!auth.user?.picture) return
  if (!confirm('确定要删除头像吗？')) return
  try {
    const res = await fetch(`${API_BASE}/api/upload/avatar`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    const data = await res.json()
    if (data.deleted) {
      if (auth.user) auth.user.picture = null
      localStorage.removeItem('user')
      localStorage.setItem('user', JSON.stringify(auth.user))
    }
  } catch { alert('删除头像失败') }
}

async function registerPasskey() {
  if (!window.PublicKeyCredential) { alert('当前浏览器不支持通行密钥'); return }
  regKeyLoading.value = true
  try {
    const beginData = await apiPost('/api/webauthn/register/begin', { nickname: '我的密钥' })
    const publicKey = beginData.publicKey || beginData
    publicKey.challenge = base64URLToBuffer(publicKey.challenge)
    publicKey.user.id = base64URLToBuffer(publicKey.user.id)
    if (publicKey.excludeCredentials) {
      publicKey.excludeCredentials = publicKey.excludeCredentials.map((c: any) => ({ ...c, id: base64URLToBuffer(c.id) }))
    }
    const cred = await navigator.credentials.create({ publicKey }) as any
    const result = await apiPost('/api/webauthn/register/complete', {
      id: cred.id,
      rawId: bufferToBase64URL(cred.rawId),
      response: {
        clientDataJSON: bufferToBase64URL(cred.response.clientDataJSON),
        attestationObject: bufferToBase64URL(cred.response.attestationObject),
        transports: cred.response.getTransports ? cred.response.getTransports() : []
      },
      type: cred.type,
      nickname: '我的密钥'
    })
    if (result.id) {
      credentials.value.push(result)
      alert('通行密钥注册成功！')
    }
  } catch (e: any) {
    if (e.name === 'NotAllowedError') { /* user cancelled */ }
    else { alert('注册失败: ' + (e.message || '未知错误')) }
  } finally {
    regKeyLoading.value = false
  }
}

async function deleteCredential(credId: string) {
  if (!confirm('确定要删除此通行密钥吗？')) return
  try {
    await fetch(`${API_BASE}/api/webauthn/credentials/${credId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    credentials.value = credentials.value.filter(c => c.id !== credId)
  } catch { alert('删除失败') }
}

async function unbindSocial(connId: string) {
  if (!confirm('确定要解绑此社交账号吗？')) return
  try {
    await fetch(`${API_BASE}/api/user/social/connections/${connId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    socialConnections.value = socialConnections.value.filter(c => c.id !== connId)
  } catch { alert('解绑失败') }
}

async function revokeConsent(item: any) {
  if (!confirm(`确定要撤销"${item.client_name}"的授权吗？撤销后该应用需要重新获得您的授权。`)) return
  try {
    await fetch(`${API_BASE}/api/auth/user/consents/${item.client_id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    consents.value = consents.value.filter(c => c.id !== item.id)
  } catch { alert('撤销授权失败') }
}

function bufferToBase64URL(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64URLToBuffer(base64url: string) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}
</script>

<style scoped>
.profile-container { max-width: 800px; margin: 0 auto; padding: 0 24px 80px; position: relative; z-index: 1; }
.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.profile-card, .details-card, .webauthn-card, .social-card, .consents-card { background: rgba(255, 255, 255, 0.015); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 32px; }
.profile-card { grid-column: 1; text-align: center; }
.details-card { grid-column: 2; }
.webauthn-card { grid-column: 1 / -1; }
.social-card { grid-column: 1 / -1; }
.consents-card { grid-column: 1 / -1; }

.avatar-section { position: relative; }
.avatar-wrapper { position: relative; width: 72px; height: 72px; margin: 0 auto 16px; cursor: pointer; border-radius: 50%; overflow: hidden; }
.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
.avatar-letter { width: 72px; height: 72px; border-radius: 50%; background: rgba(230, 57, 70, 0.15); display: flex; align-items: center; justify-content: center; font-size: 28px; font-weight: 700; color: #E63946; margin: 0 auto; }
.avatar-overlay { position: absolute; inset: 0; border-radius: 50%; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s ease; gap: 2px; }
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.camera-icon { width: 18px; height: 18px; color: #fff; }
.avatar-overlay span { font-size: 10px; color: #fff; white-space: nowrap; }
.avatar-remove-link { font-size: 11px; color: #6B7280; cursor: pointer; margin-bottom: 12px; display: inline-block; }
.avatar-remove-link:hover { color: #FCA5A5; }
.display-name { font-size: 20px; font-weight: 600; color: #F5F5F5; margin-bottom: 4px; }
.user-email { font-size: 13px; color: #6B7280; margin-bottom: 12px; }
.role-badge { display: inline-block; padding: 3px 12px; border-radius: 50px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
.role-badge.admin { background: rgba(239, 68, 68, 0.1); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.2); }
.role-badge.developer { background: rgba(59, 130, 246, 0.1); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.2); }
.role-badge.user { background: rgba(16, 185, 129, 0.1); color: #6EE7B7; border: 1px solid rgba(16, 185, 129, 0.2); }

.btn-logout { width: 100%; margin-top: 24px; padding: 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px; color: #FCA5A5; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-logout:hover { background: rgba(239, 68, 68, 0.15); }

.section-title { font-size: 12px; font-weight: 600; color: #7C8290; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.03); }
.detail-row:last-child { border-bottom: none; }
.detail-label { font-size: 13px; color: #6B7280; }
.detail-value { font-size: 13px; color: #E5E7EB; font-weight: 500; }

.empty-state { text-align: center; padding: 20px 0; }
.empty-state p { font-size: 13px; color: #6B7280; margin-bottom: 16px; }

.btn-register-key { padding: 10px 20px; background: rgba(230, 57, 70, 0.12); border: 1px solid rgba(230, 57, 70, 0.25); border-radius: 8px; color: #E63946; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-register-key:hover { background: rgba(230, 57, 70, 0.2); }
.btn-register-key:disabled { opacity: 0.5; cursor: not-allowed; }

.cred-list, .social-list { display: flex; flex-direction: column; gap: 8px; }
.cred-item, .social-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0, 0, 0, 0.15); border-radius: 8px; }
.cred-icon { width: 20px; height: 20px; color: #6B7280; flex-shrink: 0; }
.cred-info { flex: 1; display: flex; flex-direction: column; }
.cred-name { font-size: 14px; font-weight: 500; color: #E5E7EB; }
.cred-date { font-size: 11px; color: #6B7280; margin-top: 2px; }
.cred-delete { padding: 6px 14px; background: transparent; border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 6px; color: #FCA5A5; font-size: 12px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.cred-delete:hover { background: rgba(239, 68, 68, 0.1); }
.cred-add-bar { margin-top: 16px; text-align: center; }
.social-provider { font-size: 14px; font-weight: 500; color: #E5E7EB; flex: 1; }
.social-username { font-size: 13px; color: #6B7280; margin-right: 12px; }

.consents-list { display: flex; flex-direction: column; gap: 8px; }
.consent-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: rgba(0, 0, 0, 0.15); border-radius: 8px; }
.consent-logo { width: 28px; height: 28px; border-radius: 6px; object-fit: contain; flex-shrink: 0; }
.consent-logo-fallback { width: 28px; height: 28px; color: #6B7280; flex-shrink: 0; }
.consent-info { flex: 1; display: flex; flex-direction: column; }
.consent-name { font-size: 14px; font-weight: 500; color: #E5E7EB; }
.consent-scopes { font-size: 11px; color: #6B7280; margin-top: 2px; }

@media (max-width: 700px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-card, .details-card { grid-column: 1; }
}
</style>
