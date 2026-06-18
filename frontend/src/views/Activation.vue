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
      <div class="auth-card activation-card">
        <div class="activation-status">
          <!-- 加载中 -->
          <div v-if="loading" class="state-block">
            <div class="icon-stage">
              <div class="halo-ring ring-1"></div>
              <div class="halo-ring ring-2"></div>
              <div class="halo-ring ring-3"></div>
              <div class="orb-core orb-loading">
                <svg viewBox="0 0 60 60" fill="none">
                  <defs>
                    <linearGradient id="envelopeGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#FCA5A5"/>
                      <stop offset="100%" stop-color="#E63946"/>
                    </linearGradient>
                  </defs>
                  <rect x="14" y="20" width="32" height="22" rx="3" stroke="url(#envelopeGrad)" stroke-width="2" fill="none"/>
                  <path d="M14 23 L30 33 L46 23" stroke="url(#envelopeGrad)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="30" cy="13" r="2" fill="#E63946">
                    <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
            </div>
            <h3 class="state-title">正在验证激活链接</h3>
            <p class="state-desc">请稍候，我们正在校验您的激活码...</p>
            <div class="loading-dots">
              <span></span><span></span><span></span>
            </div>
          </div>

          <!-- 成功 -->
          <div v-else-if="status === 'success'" class="state-block state-success">
            <div class="icon-stage">
              <div class="halo-ring ring-1"></div>
              <div class="halo-ring ring-2"></div>
              <div class="halo-ring ring-3"></div>
              <div class="orb-core orb-success">
                <svg viewBox="0 0 80 80" fill="none">
                  <defs>
                    <linearGradient id="successGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#34D399"/>
                      <stop offset="100%" stop-color="#059669"/>
                    </linearGradient>
                    <linearGradient id="successShine" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#A7F3D0"/>
                      <stop offset="100%" stop-color="#34D399"/>
                    </linearGradient>
                  </defs>
                  <!-- 信封底 -->
                  <rect x="18" y="26" width="44" height="30" rx="4" stroke="url(#successGrad)" stroke-width="2.5" fill="rgba(16, 185, 129, 0.08)"/>
                  <path d="M18 30 L40 44 L62 30" stroke="url(#successGrad)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <!-- 圆形徽章 + 对勾 -->
                  <circle cx="58" cy="22" r="11" fill="url(#successShine)"/>
                  <path d="M52 22 L56 26 L64 18" stroke="#0A0A0A" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round" class="checkmark-path"/>
                </svg>
              </div>
            </div>
            <h3 class="state-title">账号已成功激活</h3>
            <p class="state-desc">{{ message || '欢迎加入！您的账号已激活完成，现在可以登录使用了。' }}</p>
            <button class="action-btn btn-success" @click="goLogin">
              <span>前往登录</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- 失败 -->
          <div v-else class="state-block state-error">
            <div class="icon-stage">
              <div class="halo-ring ring-1"></div>
              <div class="halo-ring ring-2"></div>
              <div class="halo-ring ring-3"></div>
              <div class="orb-core orb-error">
                <svg viewBox="0 0 80 80" fill="none">
                  <defs>
                    <linearGradient id="errorGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#F87171"/>
                      <stop offset="100%" stop-color="#DC2626"/>
                    </linearGradient>
                    <linearGradient id="errorShine" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stop-color="#FCA5A5"/>
                      <stop offset="100%" stop-color="#F87171"/>
                    </linearGradient>
                  </defs>
                  <!-- 信封底 -->
                  <rect x="18" y="26" width="44" height="30" rx="4" stroke="url(#errorGrad)" stroke-width="2.5" fill="rgba(239, 68, 68, 0.08)"/>
                  <path d="M18 30 L40 44 L62 30" stroke="url(#errorGrad)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                  <!-- 圆形徽章 + 叉 -->
                  <circle cx="58" cy="22" r="11" fill="url(#errorShine)"/>
                  <path d="M53 17 L63 27 M63 17 L53 27" stroke="#0A0A0A" stroke-width="2.8" fill="none" stroke-linecap="round" class="cross-path"/>
                </svg>
              </div>
            </div>
            <h3 class="state-title">激活未能完成</h3>
            <p class="state-desc">{{ message || '激活码无效或已过期，请检查邮件中的链接后重试。' }}</p>
            <div class="error-tips">
              <div class="tip-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01" stroke-linecap="round"/></svg>
                <span>链接有效期为 24 小时</span>
              </div>
              <div class="tip-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01" stroke-linecap="round"/></svg>
                <span>每个链接仅可使用一次</span>
              </div>
            </div>
            <button class="action-btn btn-error" @click="goLogin">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <span>返回登录</span>
            </button>
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
      message.value = data.message || '激活码无效或已过期'
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
/* ===== 卡片整体放大 ===== */
.activation-card {
  padding: 56px 44px 48px !important;
  min-height: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activation-status {
  width: 100%;
  text-align: center;
}

.state-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  animation: stateFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes stateFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ===== 图标舞台（光晕 + 核心球） ===== */
.icon-stage {
  position: relative;
  width: 160px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.halo-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid transparent;
  pointer-events: none;
  animation: ringPulse 3s ease-in-out infinite;
}

.halo-ring.ring-1 {
  width: 160px; height: 160px;
  border-color: rgba(230, 57, 70, 0.18);
  animation-delay: 0s;
}
.halo-ring.ring-2 {
  width: 200px; height: 200px;
  border-color: rgba(230, 57, 70, 0.10);
  animation-delay: 0.6s;
}
.halo-ring.ring-3 {
  width: 240px; height: 240px;
  border-color: rgba(230, 57, 70, 0.05);
  animation-delay: 1.2s;
}

.state-success .halo-ring { border-color: rgba(16, 185, 129, 0.18); }
.state-success .halo-ring.ring-2 { border-color: rgba(16, 185, 129, 0.10); }
.state-success .halo-ring.ring-3 { border-color: rgba(16, 185, 129, 0.05); }
.state-error .halo-ring { border-color: rgba(239, 68, 68, 0.18); }
.state-error .halo-ring.ring-2 { border-color: rgba(239, 68, 68, 0.10); }
.state-error .halo-ring.ring-3 { border-color: rgba(239, 68, 68, 0.05); }

@keyframes ringPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50%      { transform: scale(1.08); opacity: 0.4; }
}

.orb-core {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  animation: orbEntry 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.orb-core svg {
  width: 96px;
  height: 96px;
  filter: drop-shadow(0 4px 16px rgba(0, 0, 0, 0.4));
}

@keyframes orbEntry {
  0%   { opacity: 0; transform: scale(0.5) rotate(-20deg); }
  60%  { opacity: 1; transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0); }
}

/* 加载态球 */
.orb-loading {
  background: radial-gradient(circle at 30% 30%, rgba(252, 165, 165, 0.25) 0%, rgba(230, 57, 70, 0.15) 50%, rgba(127, 29, 29, 0.1) 100%);
  box-shadow:
    0 0 40px rgba(230, 57, 70, 0.25),
    inset 0 0 20px rgba(230, 57, 70, 0.15);
  animation: orbEntry 0.6s ease-out both, orbBreath 2.4s ease-in-out infinite 0.6s;
}
@keyframes orbBreath {
  0%, 100% { box-shadow: 0 0 40px rgba(230, 57, 70, 0.25), inset 0 0 20px rgba(230, 57, 70, 0.15); }
  50%      { box-shadow: 0 0 60px rgba(230, 57, 70, 0.4),  inset 0 0 30px rgba(230, 57, 70, 0.25); }
}

/* 成功球 */
.orb-success {
  background: radial-gradient(circle at 30% 30%, rgba(167, 243, 208, 0.3) 0%, rgba(16, 185, 129, 0.18) 50%, rgba(6, 78, 59, 0.15) 100%);
  box-shadow:
    0 0 50px rgba(16, 185, 129, 0.35),
    inset 0 0 24px rgba(16, 185, 129, 0.2);
}

/* 失败球 */
.orb-error {
  background: radial-gradient(circle at 30% 30%, rgba(252, 165, 165, 0.3) 0%, rgba(239, 68, 68, 0.18) 50%, rgba(127, 29, 29, 0.15) 100%);
  box-shadow:
    0 0 50px rgba(239, 68, 68, 0.35),
    inset 0 0 24px rgba(239, 68, 68, 0.2);
}

/* SVG 内对勾/叉的描线动画 */
.checkmark-path {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: drawStroke 0.6s ease-out 0.5s forwards;
}
.cross-path {
  stroke-dasharray: 18;
  stroke-dashoffset: 18;
  animation: drawStroke 0.45s ease-out 0.5s forwards;
}
@keyframes drawStroke {
  to { stroke-dashoffset: 0; }
}

/* ===== 文字 ===== */
.state-title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #F5F5F5;
  margin: 4px 0 0;
  line-height: 1.3;
}

.state-error .state-title { color: #FCA5A5; }
.state-success .state-title { color: #6EE7B7; }

.state-desc {
  font-size: 15px;
  color: #9CA3AF;
  line-height: 1.7;
  max-width: 360px;
  margin: 0;
}

/* ===== 错误提示列表 ===== */
.error-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 6px 0 4px;
  width: 100%;
  max-width: 320px;
}
.tip-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.12);
  border-radius: 10px;
  font-size: 13px;
  color: #D1D5DB;
  text-align: left;
}
.tip-item svg {
  width: 16px; height: 16px;
  color: #F87171;
  flex-shrink: 0;
}

/* ===== 加载点 ===== */
.loading-dots {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}
.loading-dots span {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #E63946;
  opacity: 0.4;
  animation: dotPulse 1.4s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.85); }
  40%           { opacity: 1;   transform: scale(1.15); }
}

/* ===== 按钮 ===== */
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 6px;
  padding: 14px 32px;
  min-width: 200px;
  border: none;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  letter-spacing: 0.5px;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  color: #fff;
}
.action-btn svg { width: 18px; height: 18px; }

.btn-success {
  background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
}
.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(16, 185, 129, 0.45);
}

.btn-error {
  background: linear-gradient(135deg, #E63946 0%, #B91C1C 100%);
  box-shadow: 0 6px 20px rgba(230, 57, 70, 0.3);
}
.btn-error:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(230, 57, 70, 0.45);
}

.action-btn:active { transform: translateY(0); }

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .activation-card { padding: 40px 24px 36px !important; min-height: 420px; }
  .icon-stage { width: 130px; height: 130px; }
  .halo-ring.ring-1 { width: 130px; height: 130px; }
  .halo-ring.ring-2 { width: 165px; height: 165px; }
  .halo-ring.ring-3 { width: 200px; height: 200px; }
  .orb-core { width: 96px; height: 96px; }
  .orb-core svg { width: 76px; height: 76px; }
  .state-title { font-size: 22px; }
  .state-desc { font-size: 14px; }
  .action-btn { min-width: 180px; padding: 12px 24px; }
}
</style>
