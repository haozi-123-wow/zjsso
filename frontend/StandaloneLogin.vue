<template>
  <div id="standalone-login">
    <div class="global-bg">
      <div class="bg-gradient"></div>
      <div class="bg-grid"></div>
      <div class="bg-noise"></div>
      <div class="glow-orb glow-orb-1"></div>
      <div class="glow-orb glow-orb-2"></div>
      <div class="bg-watermark">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 8.5c-1.5 0-2.5-1.5-2.5-3s1-2.5 2.5-2.5 2.5 1 2.5 2.5-1 3-2.5 3zm-5.5 3c-1.2 0-2.2-1.3-2.2-2.5s1-2.5 2.2-2.5 2.2 1 2.2 2.5-1 2.5-2.2 2.5zm11 0c-1.2 0-2.2-1.3-2.2-2.5s1-2.5 2.2-2.5 2.2 1 2.2 2.5-1 2.5-2.2 2.5zM12 11c-2.8 0-5 2.5-5 5.5 0 2.5 1.5 4.5 5 4.5s5-2 5-4.5c0-3-2.2-5.5-5-5.5z"/>
        </svg>
      </div>
      <div class="ember ember-1"></div>
      <div class="ember ember-2"></div>
      <div class="ember ember-3"></div>
      <div class="ember ember-4"></div>
      <div class="ember ember-5"></div>
      <div class="ember ember-6"></div>
      <div class="ember ember-7"></div>
      <div class="ember ember-8"></div>
    </div>

    <header class="navbar">
      <div class="navbar-container">
        <a href="/" class="brand">
          <div class="avatar-wrapper">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="12" fill="rgba(221,54,64,0.15)"/>
              <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" fill="#DD3640" font-size="20" font-weight="700" font-family="Inter">H</text>
            </svg>
            <div class="avatar-glow"></div>
          </div>
          <div class="brand-text">
            <span class="brand-name">Hao Zi</span>
            <span class="brand-tagline">DevOps & Furry</span>
          </div>
        </a>

        <nav class="nav-links">
          <a href="/" class="nav-link">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            <span>首页</span>
          </a>
          <a href="/articles" class="nav-link">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span>文章</span>
          </a>
          <a href="/guestbook" class="nav-link">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>留言</span>
          </a>
          <a href="/links" class="nav-link">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>友联</span>
          </a>
          <a href="/galleries" class="nav-link">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>图库</span>
          </a>
          <a href="/about" class="nav-link">
            <svg class="link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>关于</span>
          </a>
        </nav>

        <div class="nav-actions">
          <a href="/login" class="btn-login">登录</a>
        </div>

        <button class="mobile-menu-btn" @click="toggleMobile">
          <span class="menu-line"></span>
          <span class="menu-line"></span>
          <span class="menu-line"></span>
        </button>
      </div>

      <div class="mobile-menu" :class="{ active: mobileOpen }">
        <a href="/" class="mobile-link">首页</a>
        <a href="/articles" class="mobile-link">文章</a>
        <a href="/guestbook" class="mobile-link">留言</a>
        <a href="/links" class="mobile-link">友联</a>
        <a href="/galleries" class="mobile-link">图库</a>
        <a href="/about" class="mobile-link">关于</a>
        <div class="mobile-divider"></div>
        <a href="/login" class="mobile-link">登录</a>
      </div>
    </header>

    <main class="auth-page">
      <div class="page-header">
        <div class="header-glow"></div>
        <div class="header-content">
          <span class="page-tag">LOGIN</span>
          <h1 class="page-title">欢迎回来</h1>
          <div class="title-line"></div>
          <p class="page-subtitle">SIGN IN</p>
        </div>
      </div>

      <div class="auth-container">
        <div class="auth-card">
          <form class="auth-form" @submit.prevent="handleSubmit">
            <div class="form-group">
              <label class="form-label">用户名 / 邮箱</label>
              <input v-model="formData.username" type="text" class="form-input" placeholder="请输入用户名或邮箱" required />
            </div>

            <div class="form-group">
              <label class="form-label">密码</label>
              <input v-model="formData.password" type="password" class="form-input" placeholder="请输入密码" required />
            </div>

            <div class="form-actions">
              <a href="/forgot-password" class="forgot-link">忘记密码？</a>
            </div>

            <button type="submit" class="btn-submit" :disabled="loading">
              <svg v-if="loading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
              </svg>
              {{ loading ? '验证中...' : '登录' }}
            </button>
          </form>

          <div class="auth-divider"><span>其他方式</span></div>

          <button type="button" class="btn-passkey" :disabled="passkeyLoading" @click="handlePasskeyLogin">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon">
              <path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
            </svg>
            {{ passkeyLoading ? '验证中...' : '通行密钥登录' }}
          </button>

          <button type="button" class="btn-github" :disabled="githubLoading" @click="handleGithubLogin">
            <svg viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            {{ githubLoading ? '跳转中...' : 'GitHub 登录' }}
          </button>

          <div class="auth-footer">
            <p>还没有账号？<a href="/register" class="auth-link">立即注册</a></p>
          </div>
        </div>
      </div>
    </main>

    <footer class="footer">
      <div class="footer-bg">
        <div class="footer-grid"></div>
        <div class="footer-glow"></div>
        <div class="footer-scan-line"></div>
      </div>

      <div class="footer-container">
        <div class="footer-main">
          <div class="footer-brand">
            <div class="brand-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <h3 class="footer-brand-name">Hao Zi</h3>
            <p class="footer-brand-desc">Stay home, stay cozy. 服务器运维 & 代码爱好者</p>
            <div class="footer-social">
              <a href="https://github.com/haozi-123-wow" target="_blank" rel="noopener noreferrer" class="social-icon" title="GitHub">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
              <a href="mailto:haozi@haoziwan.cn" class="social-icon" title="Email">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M22 6l-10 7L2 6"/>
                </svg>
              </a>
            </div>
          </div>

          <div class="footer-links">
            <div class="footer-column">
              <h4>探索</h4>
              <ul class="column-links">
                <li><a href="/galleries">图库</a></li>
                <li><a href="/about">关于我</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h4>内容</h4>
              <ul class="column-links">
                <li><a href="/articles">最新文章</a></li>
                <li><a href="/guestbook">留言板</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div class="footer-divider">
          <div class="divider-line"></div>
          <div class="divider-dot"></div>
          <div class="divider-line"></div>
        </div>

        <div class="footer-bottom">
          <div class="icp-info">
            <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" class="icp-link">津ICP备2024013161号-1</a>
          </div>
          <div class="bottom-row">
            <span class="copyright-text">&copy; 2026 haoziwan.cn. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const loading = ref(false)
const passkeyLoading = ref(false)
const githubLoading = ref(false)
const mobileOpen = ref(false)
let captchaInstance = null

const formData = ref({ username: '', password: '' })

const API_BASE = '/api'

async function apiPost(path, data) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data)
  })
  return res.json()
}

async function apiGet(path) {
  const token = localStorage.getItem('token')
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}${path}`, { headers })
  return res.json()
}

const doLogin = async (captchaVal) => {
  try {
    loading.value = true
    const res = await apiPost('/auth/login', { ...formData.value, captcha: captchaVal })
    if (res.success) {
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect') || '/'
      window.location.href = redirect
    } else {
      alert(res.message || '登录失败')
    }
  } catch (err) {
    alert(err || '登录失败，请重试')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  if (!formData.value.username || !formData.value.password) {
    alert('请输入用户名和密码')
    return
  }

  const res = await apiGet('/auth/captcha-id')
  const testCaptcha = { lot_number: 'test_lot_' + Date.now(), captcha_output: 'test_output', pass_token: 'test_token', gen_time: Date.now().toString() }

  if (!res.success || !res.data?.captchaId) { await doLogin(testCaptcha); return }

  const captchaId = res.data.captchaId
  if (typeof initGeetest4 !== 'function') { await doLogin(testCaptcha); return }
  if (captchaInstance) { captchaInstance.destroy(); captchaInstance = null }

  initGeetest4({ captchaId, product: 'bind' }, function (captcha) {
    captchaInstance = captcha
    captcha.onSuccess(async () => {
      const result = captcha.getValidate()
      await doLogin({ lot_number: result.lot_number, captcha_output: result.captcha_output, pass_token: result.pass_token, gen_time: result.gen_time })
    })
    captcha.showCaptcha()
  })
}

const handlePasskeyLogin = async () => {
  if (!window.PublicKeyCredential) { alert('当前浏览器不支持通行密钥'); return }
  try {
    passkeyLoading.value = true
    const optionsRes = await apiPost('/webauthn/login/begin', { username: formData.value.username })
    console.log(`[WebAuthn FE] /login/begin response: session_id=${optionsRes.session_id ? optionsRes.session_id.substring(0,8)+'...' : 'N/A'}, challenge=${((optionsRes.publicKey || optionsRes).challenge || '').substring(0,8)}...`)
    const options = optionsRes.data || optionsRes
    const publicKey = options.publicKey || options
    publicKey.challenge = base64URLToBuffer(publicKey.challenge)
    if (publicKey.allowCredentials) {
      publicKey.allowCredentials = publicKey.allowCredentials.map(c => ({ ...c, id: base64URLToBuffer(c.id) }))
    }
    const credential = await navigator.credentials.get({ publicKey })
    const credentialData = {
      session_id: optionsRes.session_id || options.session_id,
      id: bufferToBase64URL(credential.rawId),
      rawId: bufferToBase64URL(credential.rawId),
      response: {
        clientDataJSON: bufferToBase64URL(credential.response.clientDataJSON),
        authenticatorData: bufferToBase64URL(credential.response.authenticatorData),
        signature: bufferToBase64URL(credential.response.signature),
        userHandle: credential.response.userHandle ? bufferToBase64URL(credential.response.userHandle) : null
      },
      type: credential.type
    }
    console.log(`[WebAuthn FE] POST /login/complete: session_id=${credentialData.session_id ? credentialData.session_id.substring(0,8)+'...' : 'MISSING'}`)
    const res = await apiPost('/webauthn/login/complete', credentialData)
    if (res.user_id) {
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify({ id: res.user_id, username: res.username, email: res.email, display_name: res.display_name, picture: res.picture, role: res.role || 'user' }))
      window.location.href = '/'
    } else {
      alert(res.message || '通行密钥登录失败')
    }
  } catch (err) { console.error(err); alert(err || '通行密钥登录失败') }
  finally { passkeyLoading.value = false }
}

const handleGithubLogin = async () => {
  try {
    githubLoading.value = true
    const res = await apiGet('/github/authorize')
    if (res.success && res.data?.url) { window.location.href = res.data.url }
  } catch (err) { alert(err || '获取 GitHub 授权链接失败'); githubLoading.value = false }
}

const bufferToBase64URL = (buffer) => {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const base64URLToBuffer = (base64url) => {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

const toggleMobile = () => {
  mobileOpen.value = !mobileOpen.value
}
</script>

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --primary: #DD3640;
  --primary-dark: #E3000E;
  --bg-dark: #0A0A0A;
  --text-primary: #F5F5F5;
  --text-secondary: rgba(245, 245, 245, 0.55);
  --accent-pink: #FFB7C5;
  --accent-red: #E3000E;
  --font-inter: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

body {
  margin: 0;
  padding: 0;
  font-family: var(--font-inter);
  background-color: var(--bg-dark);
  color: var(--text-primary);
  line-height: 1.6;
  min-height: 100vh;
}

a { text-decoration: none; color: inherit; }
ul, ol { list-style: none; }

#standalone-login {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main { flex: 1; }

/* ========== 全局固定背景 ========== */
.global-bg {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  z-index: -9999 !important;
  pointer-events: none !important;
  overflow: hidden !important;
  background-color: #0A0A0A !important;
}

.bg-gradient {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #0A0A0A 0%, #1a0508 15%, #0f0508 45%, #0d0305 55%, #0f0508 85%, #0A0A0A 100%);
}

.bg-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(230, 57, 70, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(230, 57, 70, 0.025) 1px, transparent 1px);
  background-size: 80px 80px;
  animation: gridPulse 8s ease-in-out infinite;
  -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
}

.bg-grid::after {
  content: '';
  position: absolute; inset: 0;
  background-image: radial-gradient(circle, rgba(230, 57, 70, 0.06) 1px, transparent 1px);
  background-size: 80px 80px;
  background-position: 40px 40px;
}

@keyframes gridPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.bg-noise {
  position: absolute; inset: 0; opacity: 0.018;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  mix-blend-mode: overlay;
}

.glow-orb { position: absolute; border-radius: 50%; filter: blur(120px); }

.glow-orb-1 {
  width: 50vw; height: 50vw; max-width: 600px; max-height: 600px;
  background: radial-gradient(circle, rgba(230, 57, 70, 0.08) 0%, transparent 70%);
  top: 5%; right: 5%; animation: float1 12s ease-in-out infinite;
}

.glow-orb-2 {
  width: 40vw; height: 40vw; max-width: 500px; max-height: 500px;
  background: radial-gradient(circle, rgba(230, 57, 70, 0.05) 0%, transparent 70%);
  bottom: 10%; left: 5%; animation: float2 15s ease-in-out infinite;
}

@keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(-50px, 30px) scale(1.05); } }
@keyframes float2 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(40px, -40px) scale(1.1); } }

.bg-watermark {
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  width: 50vw; height: 50vw; max-width: 600px; max-height: 600px;
  opacity: 0.025; color: #E63946;
  animation: watermarkPulse 10s ease-in-out infinite;
}

.bg-watermark svg { width: 100%; height: 100%; }

@keyframes watermarkPulse { 0%, 100% { opacity: 0.02; transform: translate(-50%, -50%) scale(1); } 50% { opacity: 0.04; transform: translate(-50%, -50%) scale(1.05); } }

.ember { position: absolute; background: #E63946; border-radius: 50%; filter: blur(1px); box-shadow: 0 0 8px 2px rgba(230, 57, 70, 0.8), 0 0 15px rgba(230, 57, 70, 0.5); opacity: 0; }

.ember-1 { bottom: -5%; left: 10%; width: 4px; height: 4px; animation: floatEmber 9s ease-in infinite; }
.ember-2 { bottom: -5%; left: 30%; width: 3px; height: 3px; animation: floatEmber 7s ease-in infinite 2s; }
.ember-3 { bottom: -5%; left: 60%; width: 5px; height: 5px; animation: floatEmber 11s ease-in infinite 1s; }
.ember-4 { bottom: -5%; left: 80%; width: 4px; height: 4px; animation: floatEmber 8s ease-in infinite 4s; }
.ember-5 { bottom: -5%; left: 45%; width: 3px; height: 3px; animation: floatEmber 10s ease-in infinite 3s; }
.ember-6 { bottom: -5%; left: 20%; width: 5px; height: 5px; animation: floatEmber 8.5s ease-in infinite 5s; }
.ember-7 { bottom: -5%; left: 75%; width: 3px; height: 3px; animation: floatEmber 12s ease-in infinite 0.5s; }
.ember-8 { bottom: -5%; left: 90%; width: 4px; height: 4px; animation: floatEmber 9.5s ease-in infinite 2.5s; }

@keyframes floatEmber {
  0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
  20% { opacity: 0.9; }
  50% { transform: translateY(-40vh) translateX(30px) scale(0.8); }
  80% { opacity: 0.6; }
  100% { transform: translateY(-110vh) translateX(-20px) scale(0.5); opacity: 0; }
}

/* ========== 顶部导航栏 ========== */
.navbar {
  position: sticky; top: 0; z-index: 100;
  background: linear-gradient(90deg, rgba(10, 10, 10, 0.95) 0%, rgba(67, 5, 10, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 183, 197, 0.1);
}

.navbar-container {
  max-width: 1440px; margin: 0 auto; height: 72px; padding: 0 48px;
  display: flex; align-items: center; justify-content: space-between;
}

.brand { display: flex; align-items: center; gap: 14px; text-decoration: none; }
.avatar-wrapper { position: relative; width: 44px; height: 44px; flex-shrink: 0; }

.avatar-wrapper svg { width: 44px; height: 44px; border-radius: 12px; }

.avatar-glow {
  position: absolute; inset: -4px;
  background: radial-gradient(circle, rgba(221, 54, 64, 0.3) 0%, transparent 70%);
  border-radius: 16px; opacity: 0; transition: opacity 0.3s ease;
}

.avatar-wrapper:hover .avatar-glow { opacity: 1; }
.brand-text { display: flex; flex-direction: column; }
.brand-name { font-size: 18px; font-weight: 700; color: white; line-height: 1.2; }
.brand-tagline { font-size: 11px; color: var(--accent-pink); font-weight: 500; }

.nav-links { display: flex; gap: 8px; }

.nav-link {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; border-radius: 10px;
  font-size: 14px; font-weight: 500; color: rgba(255, 255, 255, 0.7);
  text-decoration: none; transition: all 0.3s ease;
}

.nav-link:hover { color: white; background: rgba(255, 183, 197, 0.1); }
.nav-link:hover .link-icon { opacity: 0.85; }
.link-icon { width: 18px; height: 18px; opacity: 0.6; transition: opacity 0.3s ease; flex-shrink: 0; }

.nav-actions { display: flex; align-items: center; gap: 12px; position: relative; }

.btn-login {
  display: flex; align-items: center; padding: 10px 20px;
  background: linear-gradient(135deg, var(--primary) 0%, #ff4757 100%);
  border-radius: 10px; font-size: 14px; font-weight: 600; color: white;
  text-decoration: none; transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(221, 54, 64, 0.3);
}

.btn-login:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(221, 54, 64, 0.4); }

.mobile-menu-btn {
  display: none; flex-direction: column; justify-content: center; gap: 5px;
  width: 32px; height: 32px; background: transparent; border: none; cursor: pointer; padding: 4px;
}

.menu-line { width: 100%; height: 2px; background: white; border-radius: 2px; transition: all 0.3s ease; }

.mobile-menu {
  display: none; position: absolute; top: 72px; left: 0; right: 0;
  background: rgba(10, 10, 10, 0.98); backdrop-filter: blur(20px);
  padding: 16px 24px; border-bottom: 1px solid rgba(255, 183, 197, 0.1);
  opacity: 0; transform: translateY(-10px); pointer-events: none; transition: all 0.3s ease;
}

.mobile-menu.active { opacity: 1; transform: translateY(0); pointer-events: auto; display: block; }

.mobile-link {
  display: block; padding: 14px 0; font-size: 15px; font-weight: 500;
  color: rgba(255, 255, 255, 0.8); text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: none; width: 100%; text-align: left; cursor: pointer;
  border: none; border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: color 0.3s ease;
}

.mobile-link:hover { color: var(--accent-pink); }
.mobile-divider { height: 1px; background: rgba(255, 255, 255, 0.1); margin: 8px 0; }

@media (max-width: 1024px) {
  .nav-links { display: none; }
  .nav-actions { display: none; }
  .mobile-menu-btn { display: flex; }
}

@media (max-width: 768px) {
  .navbar-container { padding: 0 20px; }
  .brand-text { display: none; }
}

/* ========== Auth 页面样式 ========== */
.auth-page { min-height: calc(100vh - 72px); padding-bottom: 80px; position: relative; }

.page-header {
  position: relative; z-index: 1; background: transparent;
  padding: 56px 20px 52px; text-align: center; overflow: hidden;
}

.page-header::before {
  content: '';
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 200px; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(230, 57, 70, 0.15) 30%, rgba(230, 57, 70, 0.3) 50%, rgba(230, 57, 70, 0.15) 70%, transparent 100%);
}

.header-glow {
  position: absolute; top: -120px; left: 50%; transform: translateX(-50%);
  width: 500px; height: 300px;
  background: radial-gradient(ellipse at center, rgba(230, 57, 70, 0.025) 0%, transparent 60%);
  pointer-events: none;
}

.header-content { position: relative; z-index: 1; max-width: 560px; margin: -24px auto 0; padding: 0 48px; }

.page-tag {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 14px; background: rgba(230, 57, 70, 0.07);
  border: 1px solid rgba(230, 57, 70, 0.12); border-radius: 50px;
  font-size: 11px; font-weight: 500; color: #E63946;
  text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px;
  animation: fadeInDown 0.5s ease-out;
}

.page-tag::before {
  content: ''; width: 5px; height: 5px; background: #E63946;
  border-radius: 50%; box-shadow: 0 0 6px rgba(230, 57, 70, 0.5);
}

@keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

.page-title {
  font-size: 40px; font-weight: 700; color: #FFFFFF; letter-spacing: 4px;
  margin-bottom: 16px; line-height: 1.2;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.85) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; animation: titleReveal 0.7s ease-out 0.05s both;
}

@keyframes titleReveal { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

.title-line {
  width: 50px; height: 3px; background: #E63946; margin: 0 auto 20px;
  border-radius: 2px; opacity: 0.6;
  animation: lineExpand 0.6s ease-out 0.2s both; transform-origin: center;
}

@keyframes lineExpand { from { transform: scaleX(0); opacity: 0; } to { transform: scaleX(1); opacity: 0.6; } }

.page-subtitle { font-size: 14px; color: #6B7280; letter-spacing: 2px; animation: fadeIn 0.5s ease-out 0.3s both; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.auth-container { max-width: 480px; margin: 0 auto; padding: 40px 24px; position: relative; z-index: 1; }

.auth-card {
  background: rgba(255, 255, 255, 0.015);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 16px; padding: 44px;
}

.auth-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }

.form-label { font-size: 12px; font-weight: 500; color: #7C8290; text-transform: uppercase; letter-spacing: 1px; }

.form-input {
  padding: 13px 16px; background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px;
  color: #E5E7EB; font-size: 15px; font-family: inherit;
  transition: border-color 0.3s ease, background 0.3s ease;
}

.form-input:focus { outline: none; border-color: rgba(230, 57, 70, 0.4); background: rgba(0, 0, 0, 0.5); }
.form-input::placeholder { color: #4B5058; }

.form-actions { display: flex; justify-content: flex-end; }

.forgot-link { font-size: 13px; color: #6B7280; text-decoration: none; transition: color 0.3s ease; }
.forgot-link:hover { color: #E63946; }

.btn-submit {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 12px;
  background: rgba(230, 57, 70, 0.12); border: 1px solid rgba(230, 57, 70, 0.25);
  border-radius: 8px; color: #E63946; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.3s ease; font-family: inherit;
}

.btn-submit:hover:not(:disabled) { background: rgba(230, 57, 70, 0.2); border-color: rgba(230, 57, 70, 0.4); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-spin { width: 16px; height: 16px; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.auth-divider { text-align: center; margin: 24px 0; position: relative; }
.auth-divider::before, .auth-divider::after {
  content: ''; position: absolute; top: 50%; width: calc(50% - 36px); height: 1px; background: rgba(255, 255, 255, 0.06);
}
.auth-divider::before { left: 0; }
.auth-divider::after { right: 0; }
.auth-divider span { color: #4B5058; font-size: 12px; }

.btn-passkey, .btn-github {
  display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px;
  border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px;
  background: rgba(255, 255, 255, 0.03); color: #9CA3AF;
  font-size: 14px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.3s ease;
}

.btn-passkey { margin-bottom: 10px; }
.btn-passkey:hover:not(:disabled), .btn-github:hover:not(:disabled) { background: rgba(255, 255, 255, 0.06); color: #E5E7EB; border-color: rgba(255, 255, 255, 0.1); }
.btn-passkey:disabled, .btn-github:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-icon { width: 18px; height: 18px; flex-shrink: 0; }

.auth-footer { text-align: center; margin-top: 24px; }
.auth-footer p { font-size: 14px; color: #6B7280; margin: 0; }
.auth-link { color: #E63946; text-decoration: none; margin-left: 4px; }
.auth-link:hover { text-decoration: underline; }

/* ========== Footer ========== */
.footer { background: #070707; border-top: 1px solid rgba(230, 57, 70, 0.06); padding: 72px 0 32px; position: relative; overflow: hidden; }
.footer-bg { position: absolute; inset: 0; pointer-events: none; }

.footer-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(230, 57, 70, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(230, 57, 70, 0.012) 1px, transparent 1px);
  background-size: 72px 72px; opacity: 0.5;
}

.footer-glow {
  position: absolute; top: -60%; left: 50%; transform: translateX(-50%);
  width: 700px; height: 400px;
  background: radial-gradient(ellipse at center, rgba(230, 57, 70, 0.03) 0%, rgba(230, 57, 70, 0.008) 50%, transparent 75%);
}

.footer-scan-line {
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(230, 57, 70, 0.08) 25%, rgba(230, 57, 70, 0.18) 50%, rgba(230, 57, 70, 0.08) 75%, transparent 100%);
  animation: footerScan 10s ease-in-out infinite;
}

@keyframes footerScan { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.75; } }

.footer::before {
  content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
  width: 300px; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(230, 57, 70, 0.2), rgba(230, 57, 70, 0.45), rgba(230, 57, 70, 0.2), transparent);
}

.footer-container { max-width: 1000px; margin: 0 auto; padding: 0 40px; position: relative; z-index: 1; }
.footer-main { display: flex; justify-content: space-between; gap: 72px; margin-bottom: 52px; }
.footer-brand { max-width: 260px; flex-shrink: 0; }

.brand-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(230, 57, 70, 0.08); border: 1px solid rgba(230, 57, 70, 0.15);
  display: flex; align-items: center; justify-content: center; color: #E63946; margin-bottom: 20px;
}

.footer-brand-name { font-size: 22px; font-weight: 700; color: #FFFFFF; margin-bottom: 10px; letter-spacing: -0.5px; }
.footer-brand-desc { font-size: 13px; color: #5B626E; line-height: 1.7; margin-bottom: 22px; }
.footer-social { display: flex; gap: 10px; }

.social-icon {
  width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px; color: #5B626E; text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.social-icon:hover { background: rgba(230, 57, 70, 0.1); border-color: rgba(230, 57, 70, 0.25); color: #E63946; transform: translateY(-2px); box-shadow: 0 6px 16px rgba(230, 57, 70, 0.08); }
.social-icon svg { width: 16px; height: 16px; }

.footer-links { display: flex; gap: 56px; flex: 1; justify-content: flex-end; }
.footer-column h4 { font-size: 12px; font-weight: 600; color: #7C8290; margin-bottom: 18px; letter-spacing: 2px; text-transform: uppercase; }
.column-links li { margin-bottom: 10px; }

.column-links a {
  font-size: 14px; color: #4B5058; transition: all 0.25s ease;
  display: inline-block; position: relative; text-decoration: none;
}

.column-links a::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1px; background: #E63946; transition: width 0.25s ease; }
.column-links a:hover { color: #E5E7EB; }
.column-links a:hover::after { width: 100%; }

.footer-divider { display: flex; align-items: center; gap: 14px; margin-bottom: 28px; }

.divider-line {
  flex: 1; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.04), rgba(230, 57, 70, 0.08), rgba(255, 255, 255, 0.04), transparent);
}

.divider-dot { width: 5px; height: 5px; border-radius: 50%; background: #E63946; opacity: 0.5; animation: dotFade 3s ease-in-out infinite; }
@keyframes dotFade { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }

.footer-bottom { text-align: center; }
.icp-info { display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 12px; margin-bottom: 10px; }
.icp-link { color: #5B626E; text-decoration: none; transition: color 0.3s ease; }
.icp-link:hover { color: #E63946; }

.bottom-row { display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; }
.copyright-text { font-size: 12px; color: #40464E; }

@media (max-width: 900px) {
  .footer-main { flex-direction: column; align-items: center; text-align: center; gap: 44px; }
  .footer-brand { max-width: 100%; }
  .footer-social { justify-content: center; }
  .footer-links { gap: 40px; flex-wrap: wrap; justify-content: center; }
}

@media (max-width: 640px) {
  .footer { padding: 52px 0 24px; }
  .footer-container { padding: 0 20px; }
  .footer-main { margin-bottom: 36px; }
  .footer-links { flex-direction: column; align-items: center; gap: 28px; }
  .footer-column { text-align: center; }
  .bottom-row { flex-direction: column; gap: 6px; }
}

@media (max-width: 768px) {
  .page-header { padding: 48px 16px 36px; }
  .header-content { padding: 0 20px; margin-top: -16px; }
  .page-title { font-size: 28px; letter-spacing: 3px; }
  .title-line { width: 40px; }
  .auth-container { padding: 20px 16px; }
  .auth-card { padding: 28px 24px; }
}
</style>
