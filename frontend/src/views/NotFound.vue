<template>
  <div class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">404</span>
        <h1 class="page-title404">页面未找到</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">PAGE NOT FOUND</p>
      </div>
    </div>
    <div class="auth-container">
      <div class="auth-card" style="text-align:center;padding:60px 44px">
        <div class="nf404-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
        </div>
        <p style="color:#6B7280;margin-bottom:24px;font-size:15px;line-height:1.6">您访问的页面不存在或已被移除</p>
        <a href="#/login" class="nf404-link">返回首页</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title404 {
  font-size: 36px; font-weight: 700; letter-spacing: 3px;
  margin-bottom: 10px; line-height: 1.2;
  background: linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0.85) 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.nf404-icon { margin: 0 auto 24px; width: 72px; height: 72px; color: rgba(230,57,70,0.3); }
.nf404-icon svg { width: 100%; height: 100%; }
.nf404-link {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 36px;
  background: rgba(230,57,70,0.1);
  border: 1px solid rgba(230,57,70,0.2);
  border-radius: 10px;
  color: #E63946; font-size: 15px; font-weight: 600;
  text-decoration: none; transition: all 0.25s ease;
}
.nf404-link:hover { background: rgba(230,57,70,0.15); }
</style>
