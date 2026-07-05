<template>
  <div class="legal-page">
    <div class="legal-bg">
      <div class="bg-grid"></div>
      <div class="bg-aurora"></div>
    </div>

    <div class="legal-container">
      <header class="legal-header">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>返回</span>
        </button>
        <div class="legal-brand">
          <img src="/favicon.png" alt="ZJSSO" />
          <span>ZJSSO</span>
        </div>
        <div class="header-meta">{{ updatedAt }}</div>
      </header>

      <main class="legal-card">
        <div class="card-glow"></div>
        <div class="card-grid"></div>

        <div class="legal-hero">
          <span class="hero-tag">PRIVACY POLICY</span>
          <h1 class="hero-title">隐私政策</h1>
          <p class="hero-subtitle">ZJSSO 致力于保护您的个人信息安全与隐私权利</p>
          <div class="hero-meta">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span>最后更新：{{ updatedAt }}</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>阅读约 8 分钟</span>
            </div>
          </div>
        </div>

        <nav class="toc">
          <div class="toc-title">目录</div>
          <ol>
            <li v-for="item in toc" :key="item.id">
              <a :href="`#${item.id}`">{{ item.title }}</a>
            </li>
          </ol>
        </nav>

        <article class="legal-content">
          <section v-for="item in sections" :key="item.id" :id="item.id">
            <h2 class="section-title">
              <span class="section-num">{{ String(item.idx).padStart(2, '0') }}</span>
              {{ item.title }}
            </h2>
            <div class="section-body" v-html="item.content"></div>
          </section>
        </article>

        <footer class="legal-footer">
          <div class="footer-card">
            <div class="footer-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </div>
            <div class="footer-text">
              <div class="footer-title">您的隐私，由我们守护</div>
              <div class="footer-desc">如对本政策有任何疑问，请通过页面底部邮箱联系我们。</div>
            </div>
            <router-link to="/terms" class="footer-link">查看服务条款 →</router-link>
          </div>
        </footer>
      </main>

      <footer class="page-footer">
        <div class="footer-left">© {{ year }} ZJSSO · Single Sign-On Platform</div>
        <div class="footer-right">
          <router-link to="/privacy">隐私政策</router-link>
          <span class="dot">·</span>
          <router-link to="/terms">服务条款</router-link>
          <span class="dot">·</span>
          <a href="mailto:haozi@haoziwan.cn">联系我们</a>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const year = new Date().getFullYear()
const updatedAt = '2026-07-05'

const toc = [
  { id: 'collect', title: '我们收集哪些信息' },
  { id: 'usage', title: '我们如何使用信息' },
  { id: 'storage', title: '信息存储与保护' },
  { id: 'sharing', title: '信息的共享与披露' },
  { id: 'cookies', title: 'Cookie 与同类技术' },
  { id: 'rights', title: '您的权利' },
  { id: 'thirdparty', title: '第三方服务' },
  { id: 'transfer', title: '数据跨境传输' },
  { id: 'minors', title: '未成年人保护' },
  { id: 'changes', title: '政策变更' },
  { id: 'contact', title: '联系我们' }
]

const sections = [
  {
    id: 'collect',
    idx: 1,
    title: '我们收集哪些信息',
    content: `
      <p>ZJSSO（以下简称"我们"）作为基于 OIDC 协议的单点登录服务提供者，在您注册、登录、使用本平台及相关服务的过程中，会按照如下规则收集您的个人信息：</p>
      <ul>
        <li><strong>账户基础信息</strong>：用户名、邮箱地址、QQ 号（选填）、加密后的登录密码（使用 bcrypt 等单向哈希算法存储，绝不以明文保存）。</li>
        <li><strong>身份验证信息</strong>：您在启用双因素认证（2FA / TOTP / WebAuthn 通行密钥）时提交的密钥种子与公凭据数据。</li>
        <li><strong>设备与日志信息</strong>：登录时间、IP 地址、User-Agent、浏览器指纹（用于异常登录检测与风控）。</li>
        <li><strong>第三方账号信息</strong>：当您使用 GitHub、Google 等第三方登录时，我们仅获取您授权范围内的公开资料字段（如昵称、头像、邮箱）。</li>
      </ul>
      <p class="note">我们不会收集与服务目的无关的个人敏感信息，亦不会通过隐蔽技术手段获取您的设备通讯录、相册、位置等权限。</p>
    `
  },
  {
    id: 'usage',
    idx: 2,
    title: '我们如何使用信息',
    content: `
      <p>我们仅在为您提供身份认证服务所必需的范围内使用您的个人信息：</p>
      <ul>
        <li>创建并维护您的账户，验证您的登录凭证。</li>
        <li>基于 OIDC 协议向您授权接入的第三方应用提供身份令牌（ID Token）与用户信息（UserInfo）。</li>
        <li>发送与账号安全相关的通知邮件（验证码、异常登录提醒、密码重置链接等）。</li>
        <li>检测、预防和应对欺诈、账号被盗用、滥用等安全事件。</li>
        <li>满足适用的法律法规及监管要求。</li>
      </ul>
    `
  },
  {
    id: 'storage',
    idx: 3,
    title: '信息存储与保护',
    content: `
      <p>我们采用业界通行的安全措施保护您的个人信息：</p>
      <ul>
        <li>密码使用 bcrypt 等单向哈希算法加密存储，密钥（JWT_SECRET）通过环境变量加载，不落地于源码。</li>
        <li>敏感通信全程使用 HTTPS / TLS 加密。</li>
        <li>数据库采用最小权限账号，应用层具备 SQL 注入防护与参数化查询。</li>
        <li>会话与令牌具备有效期，过期后自动失效；会话数据按需保存在 Redis 中。</li>
        <li>关键操作（修改密码、绑定/解绑社交账号等）进行二次验证与日志记录。</li>
      </ul>
      <p>尽管我们已尽最大努力保护您的信息安全，但请理解，互联网环境并非绝对安全。如发生信息安全事件，我们将依法及时通知您。</p>
    `
  },
  {
    id: 'sharing',
    idx: 4,
    title: '信息的共享与披露',
    content: `
      <p>我们承诺不会出售您的个人信息，也不会出于商业营销目的与第三方共享。以下情形除外：</p>
      <ul>
        <li><strong>基于您的授权</strong>：当您使用本平台登录第三方应用时，我们仅在您同意的 OIDC 授权范围内（如 openid、profile、email）向该应用传递必要信息。</li>
        <li><strong>服务提供方</strong>：向为我们提供基础设施（云服务器、邮件发送、验证码）的合作方提供最少必要信息，并签署保密协议。</li>
        <li><strong>法律要求</strong>：根据法律法规、诉讼争议、政府强制要求进行必要披露。</li>
        <li><strong>安全保障</strong>：为维护 ZJSSO、其他用户或社会公众的合法权益、人身或财产安全。</li>
      </ul>
    `
  },
  {
    id: 'cookies',
    idx: 5,
    title: 'Cookie 与同类技术',
    content: `
      <p>我们使用必要的 Cookie 与本地存储来维持您的登录状态，包括：</p>
      <ul>
        <li>用于保存刷新令牌（refresh_token）的 HttpOnly Cookie，您无法通过脚本读取，杜绝 XSS 窃取。</li>
        <li>用于防止 CSRF 攻击的会话标识。</li>
        <li>用于记住界面偏好（如主题、登录方式）的本地存储。</li>
      </ul>
      <p>您可以通过浏览器设置清除或禁用 Cookie，但这可能导致部分功能无法正常使用。</p>
    `
  },
  {
    id: 'rights',
    idx: 6,
    title: '您的权利',
    content: `
      <p>依据相关法律法规，您对自己的个人信息享有以下权利：</p>
      <ul>
        <li><strong>查询、更正</strong>：登录后可在"个人资料"页面查看并修改昵称、邮箱、头像等基本信息。</li>
        <li><strong>删除</strong>：您可以申请注销账户，注销后我们将删除您的可识别个人信息，法律规定的必要审计日志除外。</li>
        <li><strong>撤回授权</strong>：您可在授权页面拒绝第三方应用的权限申请，亦可在"社交绑定"中解除已绑定的第三方账号。</li>
        <li><strong>投诉举报</strong>：如您认为我们的处理行为违反法律法规或本政策，可通过下方联系方式向我们投诉。</li>
      </ul>
    `
  },
  {
    id: 'thirdparty',
    idx: 7,
    title: '第三方服务',
    content: `
      <p>为向您提供完整的服务，我们可能集成以下第三方服务（具体以您实际启用的功能为准）：</p>
      <ul>
        <li>社交登录：GitHub、Google 等 OAuth 提供方。</li>
        <li>邮件发送：用于发送验证码与安全通知。</li>
        <li>人机验证：用于抵御恶意注册与登录爆破。</li>
      </ul>
      <p>上述第三方在为您提供服务时可能直接收集您的部分信息，其行为适用其自身的隐私政策，我们鼓励您在使用前阅读相应条款。</p>
    `
  },
  {
    id: 'transfer',
    idx: 8,
    title: '数据跨境传输',
    content: `
      <p>原则上，我们在中华人民共和国境内收集和产生的个人信息将存储于境内。如因业务需要发生跨境传输，我们会事先取得您的单独同意，并满足法律法规规定的前提条件，确保您的信息受到不低于本地法律标准的保护。</p>
    `
  },
  {
    id: 'minors',
    idx: 9,
    title: '未成年人保护',
    content: `
      <p>本平台面向具备完全民事行为能力的用户。如您为未成年人，请在监护人陪同下阅读本政策并在征得监护人同意后使用本服务。我们不会主动收集未成年人的个人信息，如发现相关情况将及时删除。</p>
    `
  },
  {
    id: 'changes',
    idx: 10,
    title: '政策变更',
    content: `
      <p>为给您提供更优质的服务，本政策可能会适时修订。重大变更将在页面显著位置进行公告或通过站内通知、邮件等方式告知。如您不同意变更后的内容，可以选择停止使用我们的服务；继续使用即视为接受修订。</p>
    `
  },
  {
    id: 'contact',
    idx: 11,
    title: '联系我们',
    content: `
      <p>如您对本政策或您的个人信息保护有任何疑问、意见或建议，可通过以下方式联系我们：</p>
      <ul>
        <li>邮箱：<a href="mailto:haozi@haoziwan.cn">haozi@haoziwan.cn</a></li>
        <li>反馈入口：登录后进入"个人资料 → 反馈与建议"。</li>
      </ul>
      <p>我们将在收到您的反馈后 15 个工作日内予以回复。</p>
    `
  }
]

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/login')
}
</script>

<style scoped>
:root {
  --primary: #E63946;
  --primary-dark: #c62a35;
  --primary-light: rgba(230, 57, 70, 0.12);
  --primary-glow: rgba(230, 57, 70, 0.35);
  --bg-base: #0a0b0f;
  --bg-elevated: #15171d;
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.12);
  --text-primary: #F5F5F5;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-faint: #4B5058;
}

.legal-page {
  min-height: 100vh;
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow-x: hidden;
}

.legal-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.bg-aurora { position: absolute; width: 900px; height: 900px; top: -300px; left: 50%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, rgba(230, 57, 70, 0.15), transparent 60%); filter: blur(80px); opacity: 0.6; }
.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px); background-size: 80px 80px; mask-image: radial-gradient(ellipse at center, black 15%, transparent 85%); -webkit-mask-image: radial-gradient(ellipse at center, black 15%, transparent 85%); }

.legal-container { position: relative; z-index: 1; max-width: 880px; margin: 0 auto; padding: 32px 20px 60px; }

.legal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; margin-bottom: 28px;
  background: rgba(18, 20, 26, 0.55); backdrop-filter: blur(20px);
  border: 1px solid var(--border-subtle); border-radius: 16px;
}
.back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1px solid var(--border-subtle); color: var(--text-secondary); padding: 8px 14px; border-radius: 10px; cursor: pointer; font-size: 13px; font-family: inherit; transition: all 0.25s ease; }
.back-btn svg { width: 16px; height: 16px; transition: transform 0.25s ease; }
.back-btn:hover { color: var(--primary); border-color: rgba(230, 57, 70, 0.4); background: rgba(230, 57, 70, 0.05); }
.back-btn:hover svg { transform: translateX(-3px); }

.legal-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; letter-spacing: 0.5px; color: var(--text-primary); }
.legal-brand img { width: 32px; height: 32px; border-radius: 8px; }

.header-meta { font-size: 12px; color: var(--text-muted); letter-spacing: 0.5px; }

.legal-card {
  position: relative;
  background: rgba(18, 20, 26, 0.7);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  padding: 56px 56px 48px;
  box-shadow: 0 50px 120px -30px rgba(0, 0, 0, 0.7), 0 24px 60px -20px rgba(230, 57, 70, 0.12);
  overflow: hidden; isolation: isolate;
}
.legal-card > *:not(.card-glow):not(.card-grid) { position: relative; z-index: 2; }
.card-glow { position: absolute; width: 320px; height: 320px; top: -120px; right: -100px; background: radial-gradient(circle, rgba(230, 57, 70, 0.18), transparent 70%); border-radius: 50%; filter: blur(60px); pointer-events: none; z-index: 0; }
.card-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 32px 32px; mask-image: radial-gradient(ellipse at top right, black 20%, transparent 70%); -webkit-mask-image: radial-gradient(ellipse at top right, black 20%, transparent 70%); pointer-events: none; z-index: 0; opacity: 0.6; }

.legal-hero { text-align: center; padding-bottom: 36px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 36px; }
.hero-tag { display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, var(--primary-light), rgba(230,57,70,0.06)); color: var(--primary); font-size: 10px; font-weight: 700; letter-spacing: 2px; border-radius: 999px; margin-bottom: 16px; border: 1px solid rgba(230,57,70,0.2); }
.hero-title { font-size: 38px; font-weight: 800; margin: 0 0 12px; letter-spacing: -1px; background: linear-gradient(135deg, var(--text-primary) 0%, #c8c8c8 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 15px; color: var(--text-secondary); margin: 0 0 20px; }
.hero-meta { display: inline-flex; align-items: center; gap: 14px; padding: 10px 16px; background: rgba(255, 255, 255, 0.025); border: 1px solid var(--border-subtle); border-radius: 12px; }
.meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.meta-item svg { width: 14px; height: 14px; }
.meta-divider { width: 1px; height: 14px; background: var(--border-subtle); }

.toc {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 20px 24px;
  margin-bottom: 40px;
}
.toc-title { font-size: 11px; font-weight: 700; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 12px; }
.toc ol { list-style: none; padding: 0; margin: 0; counter-reset: section; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; }
.toc li { counter-increment: section; }
.toc a { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); text-decoration: none; padding: 6px 8px; border-radius: 8px; transition: all 0.25s ease; }
.toc a::before { content: counter(section, decimal-leading-zero); color: var(--text-faint); font-family: 'Courier New', monospace; font-weight: 700; font-size: 11px; min-width: 24px; }
.toc a:hover { color: var(--primary); background: rgba(230, 57, 70, 0.06); }

.legal-content { line-height: 1.8; }
.legal-content section { padding: 28px 0; border-bottom: 1px dashed var(--border-subtle); scroll-margin-top: 24px; }
.legal-content section:last-child { border-bottom: none; }
.section-title { display: flex; align-items: center; gap: 14px; font-size: 22px; font-weight: 700; margin: 0 0 18px; color: var(--text-primary); letter-spacing: -0.3px; }
.section-num { display: inline-flex; align-items: center; justify-content: center; min-width: 40px; height: 32px; padding: 0 10px; background: linear-gradient(135deg, var(--primary-light), rgba(230,57,70,0.04)); border: 1px solid rgba(230,57,70,0.25); color: var(--primary); border-radius: 8px; font-family: 'Courier New', monospace; font-size: 13px; font-weight: 700; letter-spacing: 0; }
.section-body { color: var(--text-secondary); font-size: 14.5px; }
.section-body :deep(p) { margin: 0 0 14px; }
.section-body :deep(p:last-child) { margin-bottom: 0; }
.section-body :deep(ul) { margin: 0 0 14px; padding: 0; list-style: none; }
.section-body :deep(li) { position: relative; padding: 6px 0 6px 24px; color: var(--text-secondary); }
.section-body :deep(li)::before { content: ''; position: absolute; left: 6px; top: 17px; width: 6px; height: 6px; border-radius: 50%; background: var(--primary); box-shadow: 0 0 6px rgba(230, 57, 70, 0.6); }
.section-body :deep(strong) { color: var(--text-primary); font-weight: 600; }
.section-body :deep(a) { color: var(--primary); text-decoration: none; border-bottom: 1px solid rgba(230, 57, 70, 0.3); transition: all 0.25s ease; }
.section-body :deep(a:hover) { color: #ff6b75; border-bottom-color: rgba(230, 57, 70, 0.6); }
.section-body :deep(.note) { padding: 12px 16px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 10px; color: #FCD34D; font-size: 13px; margin-top: 8px; }

.legal-footer { margin-top: 36px; padding-top: 28px; border-top: 1px solid var(--border-subtle); }
.footer-card { display: flex; align-items: center; gap: 16px; padding: 18px 20px; background: linear-gradient(135deg, rgba(230, 57, 70, 0.06), rgba(230, 57, 70, 0.02)); border: 1px solid rgba(230, 57, 70, 0.18); border-radius: 14px; }
.footer-icon { width: 44px; height: 44px; background: linear-gradient(135deg, rgba(230,57,70,0.2), rgba(198,42,53,0.08)); border: 1px solid rgba(230,57,70,0.25); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
.footer-icon svg { width: 22px; height: 22px; }
.footer-text { flex: 1; min-width: 0; }
.footer-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.footer-desc { font-size: 12px; color: var(--text-muted); }
.footer-link { color: var(--primary); font-size: 13px; font-weight: 600; text-decoration: none; padding: 6px 12px; border-radius: 8px; transition: all 0.25s ease; white-space: nowrap; }
.footer-link:hover { background: rgba(230, 57, 70, 0.1); }

.page-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 28px; padding: 0 8px; font-size: 12px; color: var(--text-muted); flex-wrap: wrap; gap: 12px; }
.page-footer a { color: var(--text-secondary); text-decoration: none; transition: color 0.25s ease; }
.page-footer a:hover { color: var(--primary); }
.page-footer .dot { color: var(--text-faint); margin: 0 6px; }

@media (max-width: 720px) {
  .legal-container { padding: 20px 14px 40px; }
  .legal-card { padding: 36px 22px 32px; border-radius: 18px; }
  .hero-title { font-size: 28px; }
  .toc ol { grid-template-columns: 1fr; }
  .footer-card { flex-direction: column; align-items: flex-start; text-align: left; }
  .page-footer { justify-content: center; text-align: center; }
}
</style>