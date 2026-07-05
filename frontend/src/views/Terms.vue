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
          <span class="hero-tag">TERMS OF SERVICE</span>
          <h1 class="hero-title">服务条款</h1>
          <p class="hero-subtitle">请仔细阅读本条款。使用 ZJSSO 即表示您同意以下约定。</p>
          <div class="hero-meta">
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span>最后更新：{{ updatedAt }}</span>
            </div>
            <div class="meta-divider"></div>
            <div class="meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              <span>阅读约 7 分钟</span>
            </div>
          </div>
        </div>

        <div class="callout">
          <div class="callout-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </div>
          <div class="callout-body">
            <strong>重要提示</strong>
            <span>本条款是您与 ZJSSO 运营方之间就使用本服务所订立的具有法律约束力的协议。请在使用前完整阅读，不同意任一条款时应立即停止使用并注销账户。</span>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            </div>
            <div class="footer-text">
              <div class="footer-title">在使用前，请确保您已知晓并同意以上条款</div>
              <div class="footer-desc">如需了解我们如何收集与保护您的信息，请阅读配套的隐私政策。</div>
            </div>
            <router-link to="/privacy" class="footer-link">查看隐私政策 →</router-link>
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
  { id: 'acceptance', title: '条款的接受' },
  { id: 'service', title: '服务内容' },
  { id: 'account', title: '账户注册与使用' },
  { id: 'rules', title: '用户行为规范' },
  { id: 'oidc', title: '第三方应用授权' },
  { id: 'ip', title: '知识产权' },
  { id: 'sla', title: '服务可用性与免责' },
  { id: 'liability', title: '责任限制' },
  { id: 'suspension', title: '服务变更与中止' },
  { id: 'governing', title: '适用法律与争议解决' },
  { id: 'misc', title: '其他' }
]

const sections = [
  {
    id: 'acceptance',
    idx: 1,
    title: '条款的接受',
    content: `
      <p>本服务条款（以下简称"本条款"）适用于您访问、注册、登录或以任何方式使用 ZJSSO 提供的单点登录、身份认证及相关服务（以下简称"本服务"）的全部行为。一旦您完成注册、点击"同意"按钮或实际使用本服务，即视为您已充分阅读、理解并无保留地接受本条款全部内容。</p>
    `
  },
  {
    id: 'service',
    idx: 2,
    title: '服务内容',
    content: `
      <p>ZJSSO 是一款基于 OpenID Connect（OIDC）协议实现的单点登录与身份认证平台，主要提供：</p>
      <ul>
        <li>用户注册、登录、密码重置、邮箱验证等基础身份能力；</li>
        <li>双因素认证（TOTP）、WebAuthn 通行密钥等增强安全能力；</li>
        <li>OIDC 授权码、隐式、PKCE 等标准授权流程，向第三方应用颁发 ID Token / Access Token；</li>
        <li>社交账号绑定（GitHub / Google / QQ 等可选能力）。</li>
      </ul>
      <p>我们可能根据业务发展对服务内容进行调整，并以站内通知或公告的形式告知。</p>
    `
  },
  {
    id: 'account',
    idx: 3,
    title: '账户注册与使用',
    content: `
      <ul>
        <li>您应使用真实有效的邮箱完成注册，并妥善保管账号、密码及二次验证因素（如 TOTP 密钥、WebAuthn 通行密钥）。</li>
        <li>用户名应符合社区公序良俗，不得冒充他人或包含违法、违规、侮辱性内容。</li>
        <li>如发现账号被盗用、异常登录或凭证泄露，请立即通过密码重置或联系我们采取措施。</li>
        <li>您对您账号下发生的所有行为负责，因您主动泄露或未尽妥善保管义务造成的损失，由您自行承担。</li>
      </ul>
    `
  },
  {
    id: 'rules',
    idx: 4,
    title: '用户行为规范',
    content: `
      <p>您承诺不会利用本服务从事以下行为：</p>
      <ul>
        <li>违反中华人民共和国法律法规，危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一；</li>
        <li>损害国家荣誉和利益，煽动民族仇恨、民族歧视，破坏民族团结；</li>
        <li>散布谣言、淫秽、赌博、暴力、恐怖或教唆犯罪的内容；</li>
        <li>对系统实施攻击、扫描、爆破、注入，干扰或破坏本服务的正常运行；</li>
        <li>伪造、冒用他人身份注册或登录；</li>
        <li>利用本服务从事任何违反诚实信用原则的商业行为或不正当竞争；</li>
        <li>其他法律法规或本条款禁止的行为。</li>
      </ul>
      <p>如您违反上述规范，我们有权立即暂停或终止您的账号，并保留追究法律责任的权利。</p>
    `
  },
  {
    id: 'oidc',
    idx: 5,
    title: '第三方应用授权',
    content: `
      <ul>
        <li>当您授权第三方应用通过 ZJSSO 登录时，我们仅在您同意的 scope（openid / profile / email 等）范围内向该应用传递您的信息。</li>
        <li>第三方应用对您信息的处理由其自身负责，请在使用前阅读其隐私政策与服务条款。</li>
        <li>您可随时在"个人资料 → 社交绑定"或对应授权管理页面撤回对第三方应用的授权。</li>
      </ul>
    `
  },
  {
    id: 'ip',
    idx: 6,
    title: '知识产权',
    content: `
      <p>本服务涉及的所有代码、UI 设计、品牌标识、文档等知识产权归 ZJSSO 运营方或合法授权方所有。未经书面许可，您不得以任何形式复制、修改、传播或用于商业目的。</p>
      <p>您在本服务中提交的合法内容（如昵称、头像）仍归您本人所有，您授予我们一项在合理范围内用于为您提供服务的非独占使用许可。</p>
    `
  },
  {
    id: 'sla',
    idx: 7,
    title: '服务可用性与免责',
    content: `
      <p>我们致力于提供稳定、安全的服务，但不构成对服务可用性的绝对承诺。以下情形导致的暂时性不可用，我们不承担责任：</p>
      <ul>
        <li>不可抗力（包括但不限于自然灾害、网络运营商故障、战争、罢工等）；</li>
        <li>您自身的设备、网络故障或不当操作；</li>
        <li>第三方服务（如邮件发送、社交平台）中断导致的功能受限；</li>
        <li>为进行系统维护、升级而提前公告的合理停机。</li>
      </ul>
    `
  },
  {
    id: 'liability',
    idx: 8,
    title: '责任限制',
    content: `
      <p>在法律允许的最大范围内，ZJSSO 对因使用或无法使用本服务而导致的任何间接、偶然、特殊、惩罚性或衍生性损失（包括但不限于数据丢失、利润损失、商誉损失）不承担责任，即便我们已被告知发生该等损失的可能性。</p>
      <p>我们对您承担的累计赔偿责任，以您在过去 12 个月内为本服务实际支付的合理费用（如有）为上限。</p>
    `
  },
  {
    id: 'suspension',
    idx: 9,
    title: '服务变更与中止',
    content: `
      <p>我们保留根据业务策略、合规要求对服务进行变更、暂停或终止的权利。重大变更将提前通过公告或合理方式通知。对于违反本条款的账号，我们有权立即采取限制措施。</p>
      <p>您亦可随时申请注销账号。注销后，除法律规定的必要审计信息外，您的可识别个人信息将被删除或匿名化。</p>
    `
  },
  {
    id: 'governing',
    idx: 10,
    title: '适用法律与争议解决',
    content: `
      <p>本条款的订立、效力、解释、履行及争议解决均适用中华人民共和国法律。因本条款或本服务产生的争议，双方应友好协商解决；协商不成的，任何一方有权将争议提交至 ZJSSO 运营方所在地有管辖权的人民法院诉讼解决。</p>
    `
  },
  {
    id: 'misc',
    idx: 11,
    title: '其他',
    content: `
      <ul>
        <li>本条款中的任何条款被认定为无效或不可执行的，不影响其他条款的效力。</li>
        <li>我们未行使或延迟行使本条款项下的任何权利，不构成对该权利的放弃。</li>
        <li>本条款的标题仅为阅读便利，不影响对条款内容的解释。</li>
        <li>如您对本条款有任何疑问，可通过 <a href="mailto:haozi@haoziwan.cn">haozi@haoziwan.cn</a> 与我们联系。</li>
      </ul>
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

.legal-hero { text-align: center; padding-bottom: 28px; }
.hero-tag { display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, var(--primary-light), rgba(230,57,70,0.06)); color: var(--primary); font-size: 10px; font-weight: 700; letter-spacing: 2px; border-radius: 999px; margin-bottom: 16px; border: 1px solid rgba(230,57,70,0.2); }
.hero-title { font-size: 38px; font-weight: 800; margin: 0 0 12px; letter-spacing: -1px; background: linear-gradient(135deg, var(--text-primary) 0%, #c8c8c8 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.hero-subtitle { font-size: 15px; color: var(--text-secondary); margin: 0 0 20px; }
.hero-meta { display: inline-flex; align-items: center; gap: 14px; padding: 10px 16px; background: rgba(255, 255, 255, 0.025); border: 1px solid var(--border-subtle); border-radius: 12px; }
.meta-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }
.meta-item svg { width: 14px; height: 14px; }
.meta-divider { width: 1px; height: 14px; background: var(--border-subtle); }

.callout { display: flex; align-items: flex-start; gap: 14px; padding: 16px 20px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.03)); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 14px; margin-bottom: 28px; }
.callout-icon { width: 36px; height: 36px; background: rgba(245, 158, 11, 0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #F59E0B; flex-shrink: 0; }
.callout-icon svg { width: 18px; height: 18px; }
.callout-body { font-size: 13px; color: #FCD34D; line-height: 1.7; }
.callout-body strong { display: block; color: #FBBF24; font-size: 13px; margin-bottom: 2px; letter-spacing: 0.3px; }

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