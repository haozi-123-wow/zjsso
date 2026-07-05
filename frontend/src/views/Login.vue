<template>
  <div class="auth-page">
    <!-- 背景装饰 -->
    <div class="bg-decor">
      <!-- 顶部中央柔和光晕（不开三角） -->
      <div class="bg-aurora"></div>
      <!-- 星点 -->
      <div class="bg-stars"></div>
      <!-- 网格 -->
      <div class="bg-grid"></div>
      <!-- 角落装饰圆点 -->
      <div class="bg-dots">
        <span style="--x: 6%; --y: 75%; --d: 4px;"></span>
        <span style="--x: 10%; --y: 88%; --d: 6px;"></span>
        <span style="--x: 3%; --y: 92%; --d: 3px;"></span>
        <span style="--x: 94%; --y: 72%; --d: 5px;"></span>
        <span style="--x: 90%; --y: 88%; --d: 3px;"></span>
        <span style="--x: 97%; --y: 92%; --d: 4px;"></span>
      </div>
    </div>

    <!-- 主体双栏布局 -->
    <div class="auth-layout">
      <!-- 左侧品牌区 -->
      <aside class="auth-brand">
        <div class="brand-glow"></div>
        <!-- 完整 Logo：图标 + 文字 + 副标题 -->
        <div class="brand-logo-full">
          <div class="brand-logo-icon">
            <img src="/favicon.png" alt="ZJSSO Logo" />
          </div>
          <div class="brand-logo-text">
            <div class="brand-logo-name">ZJSSO</div>
            <div class="brand-logo-slogan">Single Sign-On Platform</div>
          </div>
        </div>

        <div class="brand-pitch">
          <h2 class="brand-headline">一站式身份认证</h2>
          <p class="brand-desc">基于 OIDC 标准协议构建<br/>让登录回归简单与安全</p>
        </div>

        <div class="brand-features">
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">OIDC 标准</div>
              <div class="feature-desc">OpenID Connect 完整实现</div>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">多重验证</div>
              <div class="feature-desc">2FA / WebAuthn / 邮箱</div>
            </div>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <div class="feature-content">
              <div class="feature-title">极速接入</div>
              <div class="feature-desc">分钟级集成所有应用</div>
            </div>
          </div>
        </div>

        <div class="brand-stats">
          <div class="stat-item">
            <div class="stat-value">99.9%</div>
            <div class="stat-label">可用性</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">&lt;100ms</div>
            <div class="stat-label">响应</div>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <div class="stat-value">256-bit</div>
            <div class="stat-label">加密</div>
          </div>
        </div>
      </aside>

      <!-- 右侧表单卡片 -->
      <main class="auth-main">
        <div class="auth-card">
          <!-- 卡片装饰光斑 -->
          <div class="card-glow card-glow-1"></div>
          <div class="card-glow card-glow-2"></div>
          <div class="card-grid"></div>
          <!-- 顶部装饰条 -->
          <div class="card-accent"></div>
          <!-- 头部标题 -->
          <header class="card-header">
            <span class="card-tag">{{ pageTag }}</span>
            <h2 class="card-title">{{ pageTitle }}</h2>
            <p class="card-subtitle">{{ pageSubtitle }}</p>
          </header>

          <!-- Tab 切换 -->
          <div class="tab-bar" v-if="!totpStep">
            <button :class="['tab-btn', { active: activeTab === 'login' }]" @click="activeTab = 'login'">
              <span>登录</span>
            </button>
            <button :class="['tab-btn', { active: activeTab === 'register' }]" @click="activeTab = 'register'">
              <span>注册</span>
            </button>
            <button :class="['tab-btn', { active: activeTab === 'reset' }]" @click="activeTab = 'reset'">
              <span>找回密码</span>
            </button>
            <div class="tab-indicator" :style="tabIndicatorStyle"></div>
          </div>

          <!-- ============ 登录态 ============ -->
          <div v-if="activeTab === 'login' && !totpStep" class="tab-content">
            <!-- 密码登录 -->
            <transition name="fade-slide" mode="out-in">
              <div v-if="loginMode === 'password'" key="password">
                <form class="auth-form" @submit.prevent="handleLogin">
                  <div class="form-group">
                    <label class="form-label">用户名 / 邮箱</label>
                    <div class="input-wrapper">
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <input v-model="loginForm.username" type="text" class="form-input" placeholder="请输入用户名或邮箱" required autocomplete="username" />
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">密码</label>
                    <div class="input-wrapper">
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input v-model="loginForm.password" :type="showPassword ? 'text' : 'password'" class="form-input" placeholder="请输入密码" required autocomplete="current-password" />
                      <button type="button" class="input-toggle" @click="showPassword = !showPassword" tabindex="-1">
                        <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      </button>
                    </div>
                  </div>

                  <div v-if="securityNotice" class="security-notice">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notice-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    <span>{{ securityNotice.message }}</span>
                  </div>

                  <button type="submit" class="btn-submit" :disabled="loading">
                    <svg v-if="loading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                    </svg>
                    <span v-else>登录</span>
                    <span v-if="!loading">→</span>
                  </button>
                </form>

                <div class="alt-action">
                  <span>无密码？</span>
                  <button class="link-btn" @click="switchToEmailCode">使用邮箱验证码登录</button>
                </div>

                <div class="auth-divider"><span>其他方式</span></div>

                <div class="social-grid">
                  <button type="button" class="btn-social" @click="handleGithubLogin" :disabled="githubLoading">
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    <span>GitHub</span>
                  </button>
                  <button type="button" class="btn-social" @click="handleGoogleLogin" :disabled="googleLoading">
                    <svg viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    <span>Google</span>
                  </button>
                  <button type="button" class="btn-social" @click="handleWebAuthnLogin" :disabled="webauthnLoading">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    <span>通行密钥</span>
                  </button>
                </div>
              </div>

              <!-- 邮箱验证码登录 -->
              <div v-else key="email-code" class="email-code-mode">
                <button class="back-btn" @click="switchToPassword">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  返回密码登录
                </button>

                <div class="email-code-hero">
                  <div class="email-code-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                  </div>
                  <h3 class="email-code-title">邮箱验证码登录</h3>
                  <p class="email-code-desc">{{ emailCodeStep === 'send' ? '输入邮箱接收验证码，无需密码即可登录' : '请输入邮件中的 6 位验证码' }}</p>
                </div>

                <transition name="fade-slide" mode="out-in">
                  <form v-if="emailCodeStep === 'send'" key="send" class="auth-form" @submit.prevent="sendEmailCode">
                    <div class="form-group">
                      <label class="form-label">邮箱</label>
                      <div class="input-wrapper">
                        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        <input v-model="emailCodeForm.email" type="email" class="form-input" placeholder="请输入邮箱地址" required autocomplete="email" />
                      </div>
                    </div>
                    <button type="submit" class="btn-submit" :disabled="emailCodeSending">
                      <svg v-if="emailCodeSending" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                      </svg>
                      <span v-else>发送验证码</span>
                      <span v-if="!emailCodeSending">→</span>
                    </button>
                  </form>

                  <form v-else key="verify" class="auth-form" @submit.prevent="loginWithEmailCode">
                    <div class="verify-info">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      <span>已发送至 <strong>{{ emailCodeForm.email }}</strong></span>
                    </div>
                    <div class="form-group">
                      <label class="form-label">验证码</label>
                      <div class="code-boxes">
                        <input
                          v-for="(char, i) in codeChars"
                          :key="i"
                          v-model="codeChars[i]"
                          :ref="el => codeInputs[i] = el"
                          type="text"
                          class="code-box"
                          maxlength="1"
                          inputmode="numeric"
                          @input="onCodeInput(i, $event)"
                          @keydown="onCodeKeydown(i, $event)"
                          @paste="onCodePaste"
                        />
                      </div>
                      <div class="code-actions">
                        <button type="button" class="link-btn" :disabled="emailCodeResendCooldown > 0" @click="resendEmailCode">
                          {{ emailCodeResendCooldown > 0 ? `${emailCodeResendCooldown}s 后重发` : '重新发送' }}
                        </button>
                      </div>
                    </div>
                    <button type="submit" class="btn-submit" :disabled="emailCodeLoggingIn">
                      <svg v-if="emailCodeLoggingIn" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                      </svg>
                      <span v-else>登录</span>
                      <span v-if="!emailCodeLoggingIn">→</span>
                    </button>
                  </form>
                </transition>
              </div>
            </transition>
          </div>

          <!-- ============ 2FA 验证 ============ -->
          <div v-if="activeTab === 'login' && totpStep" class="totp-verify">
            <div class="totp-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <h3 class="totp-title">双因素认证</h3>
            <p class="totp-desc">请输入您身份验证器应用中的 6 位动态码</p>
            <form class="auth-form" @submit.prevent="verifyTotp">
              <div class="form-group">
                <div class="code-boxes">
                  <input
                    v-for="(char, i) in totpChars"
                    :key="i"
                    v-model="totpChars[i]"
                    :ref="el => totpInputs[i] = el"
                    type="text"
                    class="code-box"
                    maxlength="1"
                    inputmode="numeric"
                    @input="onTotpInput(i, $event)"
                    @keydown="onTotpKeydown(i, $event)"
                    @paste="onTotpPaste"
                  />
                </div>
              </div>
              <button type="submit" class="btn-submit" :disabled="totpLoading">
                <svg v-if="totpLoading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                </svg>
                <span v-else>验证</span>
                <span v-if="!totpLoading">→</span>
              </button>
            </form>
            <button class="link-btn link-btn--center" @click="cancelTotp">返回登录</button>
          </div>

          <!-- ============ 注册 ============ -->
          <form v-if="activeTab === 'register'" class="tab-content auth-form" @submit.prevent="handleRegister">
            <div class="form-group">
              <label class="form-label">用户名</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input v-model="regForm.username" type="text" class="form-input" placeholder="3-50字符，字母数字下划线" required />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">邮箱</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input v-model="regForm.email" type="email" class="form-input" placeholder="请输入邮箱地址" required autocomplete="email" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">密码</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input v-model="regForm.password" type="password" class="form-input" placeholder="至少8位" required minlength="8" autocomplete="new-password" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">确认密码</label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.5 0 4.77 1.02 6.41 2.67"/></svg>
                <input v-model="regForm.confirm_password" type="password" class="form-input" placeholder="再次输入密码" required autocomplete="new-password" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">QQ 号码 <span class="label-optional">（选填）</span></label>
              <div class="input-wrapper">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                <input v-model="regForm.qq" type="text" class="form-input" placeholder="方便联系" />
              </div>
            </div>
            <button type="submit" class="btn-submit" :disabled="regLoading">
              <svg v-if="regLoading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
              </svg>
              <span v-else>创建账号</span>
              <span v-if="!regLoading">→</span>
            </button>
          </form>

          <!-- ============ 找回密码 ============ -->
          <div v-if="activeTab === 'reset'" class="tab-content">
            <!-- 步骤指示器 -->
            <div class="step-indicator">
              <div :class="['step-dot', { active: resetStep >= 1, done: resetStep > 1 }]">
                <span class="step-num">1</span>
              </div>
              <div class="step-line" :class="{ active: resetStep > 1 }"></div>
              <div :class="['step-dot', { active: resetStep >= 2 }]">
                <span class="step-num">2</span>
              </div>
            </div>

            <transition name="fade-slide" mode="out-in">
              <!-- Step 1: 输入邮箱 -->
              <div v-if="resetStep === 1" key="reset-send" class="reset-step">
                <div class="reset-hero">
                  <div class="reset-hero-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg>
                  </div>
                  <h3 class="reset-hero-title">忘记密码？</h3>
                  <p class="reset-hero-desc">输入注册邮箱，我们将向您发送重置链接和验证码</p>
                </div>

                <form class="auth-form" @submit.prevent="handleResetPassword">
                  <div class="form-group">
                    <label class="form-label">注册邮箱</label>
                    <div class="input-wrapper">
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      <input v-model="resetForm.email" type="email" class="form-input" placeholder="name@example.com" required autocomplete="email" />
                    </div>
                  </div>
                  <button type="submit" class="btn-submit" :disabled="resetLoading">
                    <svg v-if="resetLoading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                    </svg>
                    <span v-else>发送重置验证码</span>
                    <span v-if="!resetLoading">→</span>
                  </button>
                </form>

                <div class="reset-tips">
                  <div class="reset-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                    <span>确保是该邮箱的注册账号</span>
                  </div>
                  <div class="reset-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg>
                    <span>验证码 10 分钟内有效</span>
                  </div>
                </div>
              </div>

              <!-- Step 2: 验证码 + 新密码 -->
              <div v-else key="reset-do" class="reset-step">
                <div class="verify-info">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>已发送至 <strong>{{ resetForm.email }}</strong></span>
                </div>

                <form class="auth-form" @submit.prevent="handleResetPassword">
                  <div class="form-group">
                    <label class="form-label">邮箱验证码</label>
                    <div class="code-boxes">
                      <input
                        v-for="(char, i) in resetCodeChars"
                        :key="i"
                        v-model="resetCodeChars[i]"
                        :ref="el => resetCodeInputs[i] = el"
                        type="text"
                        class="code-box"
                        maxlength="1"
                        inputmode="numeric"
                        @input="onResetCodeInput(i, $event)"
                        @keydown="onResetCodeKeydown(i, $event)"
                        @paste="onResetCodePaste"
                      />
                    </div>
                    <div class="code-actions">
                      <button type="button" class="link-btn" :disabled="resetResendCooldown > 0" @click="resendResetCode">
                        {{ resetResendCooldown > 0 ? `${resetResendCooldown}s 后重新发送` : '重新发送验证码' }}
                      </button>
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">设置新密码</label>
                    <div class="input-wrapper">
                      <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <input v-model="resetForm.password" :type="showResetPassword ? 'text' : 'password'" class="form-input" placeholder="至少8位字符" required minlength="8" autocomplete="new-password" />
                      <button type="button" class="input-toggle" @click="showResetPassword = !showResetPassword" tabindex="-1">
                        <svg v-if="!showResetPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      </button>
                    </div>
                    <!-- 密码强度 -->
                    <div class="password-strength" v-if="resetForm.password">
                      <div class="strength-bars">
                        <div :class="['strength-bar', { filled: passwordStrength >= 1, weak: passwordStrength === 1 }]"></div>
                        <div :class="['strength-bar', { filled: passwordStrength >= 2, weak: passwordStrength === 2, medium: passwordStrength === 2 }]"></div>
                        <div :class="['strength-bar', { filled: passwordStrength >= 3, medium: passwordStrength === 3, strong: passwordStrength >= 4 }]"></div>
                        <div :class="['strength-bar', { filled: passwordStrength >= 4, strong: passwordStrength >= 4 }]"></div>
                      </div>
                      <span class="strength-label" :class="passwordStrengthClass">{{ passwordStrengthText }}</span>
                    </div>
                  </div>

                  <button type="submit" class="btn-submit" :disabled="resetLoading">
                    <svg v-if="resetLoading" class="btn-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
                    </svg>
                    <span v-else>重置密码</span>
                    <span v-if="!resetLoading">→</span>
                  </button>
                  <button type="button" class="link-btn link-btn--center" @click="backToResetStep1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:-2px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    返回上一步
                  </button>
                </form>
              </div>
            </transition>
          </div>

          <div class="toast" v-if="toast.show" :class="toast.type">{{ toast.message }}</div>
        </div>
      </main>
    </div>

    <!-- 跳转遮罩 -->
    <transition name="fade">
      <div class="redirect-overlay" v-if="redirecting">
        <div class="redirect-content">
          <div class="redirect-spinner"></div>
          <div class="redirect-text">正在安全跳转...</div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { getAccessToken, setTokens, apiPost, apiGet, restoreSession } from '@/utils/api'
import { API_BASE } from '@/utils/api'

declare function initGeetest4(config: { captchaId: string; product?: string }, callback: (captcha: any) => void): void

interface GeetestResult {
  lot_number: string; captcha_output: string; pass_token: string; gen_time: string
}

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref<'login' | 'register' | 'reset'>('login')
const loginMode = ref<'password' | 'email_code'>('password')
const loading = ref(false)
const regLoading = ref(false)
const resetLoading = ref(false)
const githubLoading = ref(false)
const googleLoading = ref(false)
const webauthnLoading = ref(false)
const securityNotice = ref<any>(null)
const showPassword = ref(false)

const loginForm = reactive({ username: '', password: '' })
const regForm = reactive({ username: '', email: '', password: '', confirm_password: '', qq: '' })
const resetStep = ref(1)
const resetForm = reactive({ email: '', code: '', password: '' })
const resetCodeChars = ref<string[]>(['', '', '', '', '', ''])
const resetCodeInputs = ref<any[]>([])
const resetResendCooldown = ref(0)
const showResetPassword = ref(false)
let resetResendTimer: ReturnType<typeof setInterval> | null = null

const emailCodeStep = ref<'send' | 'verify'>('send')
const emailCodeForm = reactive({ email: '', code: '' })
const emailCodeSending = ref(false)
const emailCodeLoggingIn = ref(false)
const emailCodeResendCooldown = ref(0)
const codeChars = ref<string[]>(['', '', '', '', '', ''])
const codeInputs = ref<any[]>([])
let emailCodeResendTimer: ReturnType<typeof setInterval> | null = null

const toast = reactive({ show: false, message: '', type: 'info' })
const redirecting = ref(false)

const totpStep = ref(false)
const totpCode = ref('')
const totpChars = ref<string[]>(['', '', '', '', '', ''])
const totpInputs = ref<any[]>([])
const totpLoading = ref(false)
const tempToken = ref('')
const tempUser = ref<any>(null)

let captchaInstance: any = null

const pageTag = computed(() => {
  if (totpStep.value) return '2FA'
  if (activeTab.value === 'login' && loginMode.value === 'email_code') return 'EMAIL CODE'
  return activeTab.value === 'login' ? 'SIGN IN' : activeTab.value === 'register' ? 'SIGN UP' : 'RESET'
})
const pageTitle = computed(() => {
  if (totpStep.value) return '验证身份'
  if (activeTab.value === 'login' && loginMode.value === 'email_code') return '邮箱验证码登录'
  return activeTab.value === 'login' ? '欢迎回来' : activeTab.value === 'register' ? '创建账号' : '找回密码'
})
const pageSubtitle = computed(() => {
  if (totpStep.value) return '请完成双因素认证'
  if (activeTab.value === 'login' && loginMode.value === 'email_code') return '无密码，邮件直达'
  return activeTab.value === 'login' ? '请登录您的账号' : activeTab.value === 'register' ? '加入我们，开启 SSO' : '通过邮箱重置密码'
})

const tabIndicatorStyle = computed(() => {
  const map = { login: 0, register: 1, reset: 2 }
  return { transform: `translateX(${map[activeTab.value] * 100}%)` }
})

function showToast(msg: string, type = 'error') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => toast.show = false, 4000)
}

function getTestCaptcha(): GeetestResult {
  return { lot_number: 'test_lot_' + Date.now(), captcha_output: 'test_output', pass_token: 'test_token', gen_time: Date.now().toString() }
}

function triggerGeetest(): Promise<GeetestResult> {
  const testCaptcha = getTestCaptcha()
  return fetch(`${API_BASE}/api/geetest/register`, { method: 'POST' })
    .then(res => res.json()).then(res => {
      if (!res.captcha_id || res.mock) return testCaptcha
      return new Promise<GeetestResult>((resolve) => {
        if (typeof initGeetest4 !== 'function') { resolve(testCaptcha); return }
        if (captchaInstance) { captchaInstance.destroy(); captchaInstance = null }
        initGeetest4({ captchaId: res.captcha_id, product: 'bind' }, function (captcha: any) {
          captchaInstance = captcha
          captcha.onSuccess(() => {
            const result = captcha.getValidate()
            resolve({ lot_number: result.lot_number, captcha_output: result.captcha_output, pass_token: result.pass_token, gen_time: result.gen_time })
          })
          captcha.showCaptcha()
        })
      })
    }).catch(() => testCaptcha)
}

function joinCode(arr: string[]) { return arr.join('').toUpperCase() }

function focusCodeInput(idx: number, total: number = 6) {
  nextTick(() => {
    const el = codeInputs.value[idx] || totpInputs.value[idx] || resetCodeInputs.value[idx]
    if (el && typeof el.focus === 'function') el.focus()
  })
}

function focusResetCodeInput(idx: number) {
  nextTick(() => {
    const el = resetCodeInputs.value[idx]
    if (el && typeof el.focus === 'function') el.focus()
  })
}

const passwordStrength = computed(() => {
  const pwd = resetForm.password
  if (!pwd) return 0
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return Math.min(4, Math.max(1, Math.ceil(score * 0.8)))
})

const passwordStrengthText = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return '弱'
  if (s === 2) return '一般'
  if (s === 3) return '良好'
  return '强'
})

const passwordStrengthClass = computed(() => {
  const s = passwordStrength.value
  if (s <= 1) return 'weak'
  if (s === 2) return 'medium'
  return 'strong'
})

function onCodeInput(idx: number, e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/[^0-9A-Za-z]/g, '').slice(-1).toUpperCase()
  codeChars.value[idx] = val
  input.value = val
  emailCodeForm.code = joinCode(codeChars.value)
  if (val && idx < 5) focusCodeInput(idx + 1)
}

function onCodeKeydown(idx: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !codeChars.value[idx] && idx > 0) {
    focusCodeInput(idx - 1)
  } else if (e.key === 'ArrowLeft' && idx > 0) {
    e.preventDefault(); focusCodeInput(idx - 1)
  } else if (e.key === 'ArrowRight' && idx < 5) {
    e.preventDefault(); focusCodeInput(idx + 1)
  }
}

function onCodePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = (e.clipboardData?.getData('text') || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase()
  if (!text) return
  for (let i = 0; i < 6; i++) codeChars.value[i] = text[i] || ''
  emailCodeForm.code = joinCode(codeChars.value)
  focusCodeInput(Math.min(text.length, 5))
}

function onTotpInput(idx: number, e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/\D/g, '').slice(-1)
  totpChars.value[idx] = val
  input.value = val
  totpCode.value = joinCode(totpChars.value)
  if (val && idx < 5) focusCodeInput(idx + 1)
}

function onTotpKeydown(idx: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !totpChars.value[idx] && idx > 0) {
    focusCodeInput(idx - 1)
  } else if (e.key === 'ArrowLeft' && idx > 0) {
    e.preventDefault(); focusCodeInput(idx - 1)
  } else if (e.key === 'ArrowRight' && idx < 5) {
    e.preventDefault(); focusCodeInput(idx + 1)
  }
}

function onTotpPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = (e.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  if (!text) return
  for (let i = 0; i < 6; i++) totpChars.value[i] = text[i] || ''
  totpCode.value = joinCode(totpChars.value)
  focusCodeInput(Math.min(text.length, 5))
}

function onResetCodeInput(idx: number, e: Event) {
  const input = e.target as HTMLInputElement
  const val = input.value.replace(/[^0-9A-Za-z]/g, '').slice(-1).toUpperCase()
  resetCodeChars.value[idx] = val
  input.value = val
  resetForm.code = joinCode(resetCodeChars.value)
  if (val && idx < 5) focusResetCodeInput(idx + 1)
}

function onResetCodeKeydown(idx: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !resetCodeChars.value[idx] && idx > 0) {
    focusResetCodeInput(idx - 1)
  } else if (e.key === 'ArrowLeft' && idx > 0) {
    e.preventDefault(); focusResetCodeInput(idx - 1)
  } else if (e.key === 'ArrowRight' && idx < 5) {
    e.preventDefault(); focusResetCodeInput(idx + 1)
  }
}

function onResetCodePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = (e.clipboardData?.getData('text') || '').replace(/[^0-9A-Za-z]/g, '').slice(0, 6).toUpperCase()
  if (!text) return
  for (let i = 0; i < 6; i++) resetCodeChars.value[i] = text[i] || ''
  resetForm.code = joinCode(resetCodeChars.value)
  focusResetCodeInput(Math.min(text.length, 5))
}

function startResetResendCooldown() {
  resetResendCooldown.value = 60
  if (resetResendTimer) clearInterval(resetResendTimer)
  resetResendTimer = setInterval(() => {
    resetResendCooldown.value--
    if (resetResendCooldown.value <= 0) {
      if (resetResendTimer) clearInterval(resetResendTimer)
      resetResendTimer = null
    }
  }, 1000)
}

async function resendResetCode() {
  if (resetResendCooldown.value > 0) return
  resetLoading.value = true
  try {
    const geetest = await triggerGeetest()
    await auth.sendResetPasswordEmail(resetForm.email)
    showToast('重置邮件已重新发送', 'success')
    startResetResendCooldown()
  } catch (e: any) {
    showToast(e.message || '发送失败')
  } finally {
    resetLoading.value = false
  }
}

function backToResetStep1() {
  resetStep.value = 1
  resetCodeChars.value = ['', '', '', '', '', '']
  resetForm.code = ''
  if (resetResendTimer) {
    clearInterval(resetResendTimer)
    resetResendTimer = null
  }
  resetResendCooldown.value = 0
}

async function handleLogin() {
  if (!loginForm.username || !loginForm.password) { showToast('请输入用户名和密码'); return }
  loading.value = true
  try {
    const geetest = await triggerGeetest()
    const data = await auth.login(loginForm.username, loginForm.password, geetest)
    if (data.require_2fa) {
      tempToken.value = data.temp_token
      tempUser.value = data.user
      totpStep.value = true
      nextTick(() => focusCodeInput(0))
      return
    }
    if (data.access_token) {
      if (data.security_notice) securityNotice.value = data.security_notice
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else {
      showToast(data.message || '登录失败')
    }
  } catch (e: any) {
    showToast(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

async function verifyTotp() {
  const code = joinCode(totpChars.value)
  if (code.length !== 6) { showToast('请输入6位验证码'); return }
  totpLoading.value = true
  try {
    const res = await fetch(`${API_BASE}/api/auth/totp/login-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ temp_token: tempToken.value, code })
    })
    const data = await res.json()
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token, data.expires_in)
      localStorage.setItem('user', JSON.stringify(data.user))
      auth.user = data.user
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else {
      showToast(data.message || '验证码错误')
    }
  } catch { showToast('验证失败') }
  finally { totpLoading.value = false }
}

function cancelTotp() {
  totpStep.value = false
  totpChars.value = ['', '', '', '', '', '']
  totpCode.value = ''
  tempToken.value = ''
  tempUser.value = null
}

async function handleRegister() {
  if (!regForm.username || !regForm.email || !regForm.password) { showToast('请填写所有必填项'); return }
  if (regForm.password !== regForm.confirm_password) { showToast('两次密码不一致'); return }
  if (regForm.password.length < 8) { showToast('密码至少8位'); return }
  regLoading.value = true
  try {
    const geetest = await triggerGeetest()
    const data = await auth.register({ ...regForm }, geetest)
    if (data.user_id) {
      showToast('注册成功！请查收激活邮件完成账户激活。', 'success')
      activeTab.value = 'login'
    } else {
      showToast(data.message || '注册失败')
    }
  } catch (e: any) { showToast(e.message || '注册失败') }
  finally { regLoading.value = false }
}

async function handleResetPassword() {
  if (resetStep.value === 1) {
    if (!resetForm.email) { showToast('请输入邮箱'); return }
    resetLoading.value = true
    try {
      const geetest = await triggerGeetest()
      const data = await auth.sendResetPasswordEmail(resetForm.email)
      if (data.message) { showToast('重置邮件已发送，请查收', 'success'); resetStep.value = 2 }
      else { showToast(data.message || '发送失败') }
    } catch { showToast('发送失败') }
    finally { resetLoading.value = false }
  } else {
    if (!resetForm.code || !resetForm.password) { showToast('请填写验证码和新密码'); return }
    resetLoading.value = true
    try {
      const data = await auth.resetPassword(resetForm.email, resetForm.code, resetForm.password)
      if (data.message) {
        showToast('密码已重置成功', 'success')
        resetStep.value = 1; resetForm.email = ''; resetForm.code = ''; resetForm.password = ''
        activeTab.value = 'login'
      } else { showToast(data.message || '重置失败') }
    } catch { showToast('重置失败') }
    finally { resetLoading.value = false }
  }
}

function handleGithubLogin() {
  githubLoading.value = true
  const redirect = encodeURIComponent(`${window.location.origin}${window.location.hash ? window.location.hash.replace('#', '') : '/login'}`)
  window.location.href = `${API_BASE}/api/auth/social/github/login?redirect_uri=${redirect}`
}

function handleGoogleLogin() {
  googleLoading.value = true
  const redirect = encodeURIComponent(`${window.location.origin}${window.location.hash ? window.location.hash.replace('#', '') : '/login'}`)
  window.location.href = `${API_BASE}/api/auth/social/google/login?redirect_uri=${redirect}`
}

async function handleWebAuthnLogin() {
  if (!window.PublicKeyCredential) { showToast('当前浏览器不支持通行密钥'); return }
  webauthnLoading.value = true
  try {
    const beginData = await apiPost('/api/webauthn/login/begin', { username: null })
    const publicKey = beginData.publicKey
    publicKey.challenge = base64URLToBuffer(publicKey.challenge)
    if (publicKey.allowCredentials) {
      publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({ ...c, id: base64URLToBuffer(c.id) }))
    }
    const cred = await navigator.credentials.get({ publicKey }) as any
    const completeBody = {
      session_id: beginData.session_id,
      id: cred.id, rawId: bufferToBase64URL(cred.rawId),
      response: { clientDataJSON: bufferToBase64URL(cred.response.clientDataJSON), authenticatorData: bufferToBase64URL(cred.response.authenticatorData), signature: bufferToBase64URL(cred.response.signature), userHandle: cred.response.userHandle ? bufferToBase64URL(cred.response.userHandle) : null },
      type: cred.type
    }
    const data = await apiPost('/api/webauthn/login/complete', completeBody)
    if (data.access_token) {
      setTokens(data.access_token, data.refresh_token, data.expires_in)
      localStorage.setItem('user', JSON.stringify(data.user))
      auth.user = data.user
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else { showToast(data.message || '认证失败') }
  } catch (e: any) { if (e.name !== 'NotAllowedError') { showToast(e.message || '认证失败') } }
  finally { webauthnLoading.value = false }
}

function switchToEmailCode() {
  loginMode.value = 'email_code'
  emailCodeStep.value = 'send'
  emailCodeForm.email = ''
  emailCodeForm.code = ''
  codeChars.value = ['', '', '', '', '', '']
}

function switchToPassword() {
  loginMode.value = 'password'
  emailCodeStep.value = 'send'
  emailCodeForm.email = ''
  emailCodeForm.code = ''
  codeChars.value = ['', '', '', '', '', '']
  if (emailCodeResendTimer) {
    clearInterval(emailCodeResendTimer)
    emailCodeResendTimer = null
  }
  emailCodeResendCooldown.value = 0
}

function startResendCooldown() {
  emailCodeResendCooldown.value = 60
  if (emailCodeResendTimer) clearInterval(emailCodeResendTimer)
  emailCodeResendTimer = setInterval(() => {
    emailCodeResendCooldown.value--
    if (emailCodeResendCooldown.value <= 0) {
      if (emailCodeResendTimer) clearInterval(emailCodeResendTimer)
      emailCodeResendTimer = null
    }
  }, 1000)
}

async function sendEmailCode() {
  if (!emailCodeForm.email) { showToast('请输入邮箱'); return }
  console.log('[Login] sendEmailCode - email:', emailCodeForm.email)
  emailCodeSending.value = true
  try {
    const geetest = await triggerGeetest()
    console.log('[Login] sendEmailCode - geetest done, calling sendLoginCode...')
    await auth.sendLoginCode(emailCodeForm.email, geetest)
    console.log('[Login] sendEmailCode - sendLoginCode succeeded')
    emailCodeStep.value = 'verify'
    codeChars.value = ['', '', '', '', '', '']
    showToast('如果该邮箱已注册，验证码已发送', 'success')
    startResendCooldown()
    nextTick(() => focusCodeInput(0))
  } catch (e: any) {
    console.error('[Login] sendEmailCode error:', e)
    showToast(e.message || '发送失败')
  } finally {
    emailCodeSending.value = false
  }
}

async function resendEmailCode() {
  if (emailCodeResendCooldown.value > 0) return
  console.log('[Login] resendEmailCode - email:', emailCodeForm.email)
  emailCodeSending.value = true
  try {
    const geetest = await triggerGeetest()
    await auth.sendLoginCode(emailCodeForm.email, geetest)
    console.log('[Login] resendEmailCode succeeded')
    showToast('如果该邮箱已注册，验证码已发送', 'success')
    startResendCooldown()
  } catch (e: any) {
    console.error('[Login] resendEmailCode error:', e)
    showToast(e.message || '发送失败')
  } finally {
    emailCodeSending.value = false
  }
}

async function loginWithEmailCode() {
  const code = joinCode(codeChars.value)
  if (!code || code.length < 4) { showToast('请输入完整验证码'); return }
  console.log('[Login] loginWithEmailCode - email:', emailCodeForm.email, 'codePrefix:', code.substring(0, 2) + '***')
  emailCodeLoggingIn.value = true
  try {
    const data = await auth.loginWithCode(emailCodeForm.email, code)
    console.log('[Login] loginWithEmailCode response:', JSON.stringify({ require_2fa: data.require_2fa, hasToken: !!data.access_token, security_notice: !!data.security_notice }))
    if (data.require_2fa) {
      tempToken.value = data.temp_token
      tempUser.value = data.user
      totpStep.value = true
      totpChars.value = ['', '', '', '', '', '']
      nextTick(() => focusCodeInput(0))
      return
    }
    if (data.access_token) {
      if (data.security_notice) securityNotice.value = data.security_notice
      const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
      const redirect = params.get('redirect') || '#/profile'
      redirecting.value = true
      setTimeout(() => { window.location.hash = redirect }, 400)
    } else {
      showToast(data.message || '登录失败')
    }
  } catch (e: any) {
    console.error('[Login] loginWithEmailCode error:', e)
    showToast(e.message || '登录失败')
  } finally {
    emailCodeLoggingIn.value = false
  }
}

function bufferToBase64URL(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer); let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64URLToBuffer(base64url: string) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64); const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes.buffer
}

onMounted(async () => {
  // 处理社交媒体登录/绑定错误回传
  const loginError = new URLSearchParams(window.location.search).get('login_error')
  if (loginError) {
    showToast(decodeURIComponent(loginError))
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
  }

  const bindSuccess = new URLSearchParams(window.location.search).get('bind_success')
  if (bindSuccess) {
    showToast('社交账号绑定成功', 'success')
    window.history.replaceState({}, '', window.location.pathname + window.location.hash)
  }

  if (getAccessToken()) {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const redirect = params.get('redirect') || '#/profile'
    redirecting.value = true
    setTimeout(() => { window.location.hash = redirect }, 300)
    return
  }
  const restored = await restoreSession()
  if (restored) {
    auth.loadUser()
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '')
    const redirect = params.get('redirect') || '#/profile'
    redirecting.value = true
    setTimeout(() => { window.location.hash = redirect }, 300)
  }
})
</script>

<style scoped>
:root {
  --primary: #E63946;
  --primary-dark: #c62a35;
  --primary-darker: #9d2029;
  --primary-light: rgba(230, 57, 70, 0.12);
  --primary-glow: rgba(230, 57, 70, 0.35);
  --bg-base: #0a0b0f;
  --bg-elevated: #15171d;
  --bg-input: rgba(255, 255, 255, 0.04);
  --bg-input-hover: rgba(255, 255, 255, 0.06);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-medium: rgba(255, 255, 255, 0.12);
  --border-focus: rgba(230, 57, 70, 0.45);
  --text-primary: #F5F5F5;
  --text-secondary: #9CA3AF;
  --text-muted: #6B7280;
  --text-faint: #4B5058;
}

.auth-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top left, rgba(230, 57, 70, 0.08), transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(198, 42, 53, 0.06), transparent 50%),
    var(--bg-base);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
  overflow-x: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

/* 背景装饰 - 极简版 */
.bg-decor { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }

/* 单一顶部中央光晕 */
.bg-aurora { position: absolute; width: 800px; height: 800px; top: -300px; left: 50%; transform: translateX(-50%); border-radius: 50%; background: radial-gradient(circle, rgba(230, 57, 70, 0.18), transparent 60%); filter: blur(80px); opacity: 0.7; animation: aurora 20s ease-in-out infinite; }
@keyframes aurora { 0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.7; } 50% { transform: translateX(-50%) scale(1.1); opacity: 0.85; } }

.bg-stars { position: absolute; inset: 0; background-image: radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 60% 70%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 80% 20%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 30% 80%, rgba(255,255,255,0.4), transparent), radial-gradient(1px 1px at 90% 50%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 10% 60%, rgba(255,255,255,0.5), transparent), radial-gradient(1px 1px at 50% 10%, rgba(255,255,255,0.3), transparent), radial-gradient(1px 1px at 70% 90%, rgba(255,255,255,0.4), transparent); }

.bg-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px); background-size: 80px 80px; mask-image: radial-gradient(ellipse at center, black 15%, transparent 85%); -webkit-mask-image: radial-gradient(ellipse at center, black 15%, transparent 85%); }

.bg-dots { position: absolute; inset: 0; }
.bg-dots span { position: absolute; left: var(--x); top: var(--y); width: var(--d); height: var(--d); border-radius: 50%; background: rgba(230, 57, 70, 0.4); box-shadow: 0 0 8px rgba(230, 57, 70, 0.5); }

/* 双栏布局 */
.auth-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr 1fr; max-width: 1120px; width: 100%; gap: 48px; align-items: stretch; }

/* 左侧品牌区 */
.auth-brand { position: relative; padding: 48px 40px; display: flex; flex-direction: column; animation: fadeInLeft 0.9s cubic-bezier(0.22, 1, 0.36, 1); overflow: hidden; }
.brand-glow { position: absolute; top: -100px; left: -100px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(230,57,70,0.25), transparent 70%); filter: blur(40px); pointer-events: none; }
.brand-logo-full { display: flex; align-items: center; gap: 14px; margin-bottom: 48px; position: relative; z-index: 1; }
.brand-logo-icon { width: 56px; height: 56px; border-radius: 14px; overflow: hidden; filter: drop-shadow(0 6px 20px rgba(230,57,70,0.4)); animation: logoPulse 3s ease-in-out infinite; background: rgba(255,255,255,0.04); padding: 4px; }
.brand-logo-icon img { width: 100%; height: 100%; object-fit: contain; display: block; }
@keyframes logoPulse { 0%, 100% { filter: drop-shadow(0 6px 20px rgba(230,57,70,0.4)); } 50% { filter: drop-shadow(0 6px 28px rgba(230,57,70,0.7)); } }
.brand-logo-text { display: flex; flex-direction: column; gap: 2px; }
.brand-logo-name { font-size: 24px; font-weight: 800; background: linear-gradient(135deg, var(--primary) 0%, #ff6b75 50%, var(--primary) 100%); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.3px; animation: shimmer 4s ease-in-out infinite; line-height: 1.1; }
@keyframes shimmer { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
.brand-logo-slogan { font-size: 10px; color: var(--text-muted); letter-spacing: 1.5px; text-transform: uppercase; font-weight: 500; }

.brand-pitch { margin-bottom: 40px; position: relative; z-index: 1; }
.brand-headline { font-size: 32px; font-weight: 700; margin: 0 0 12px; color: var(--text-primary); letter-spacing: -0.8px; line-height: 1.3; }
.brand-desc { font-size: 15px; color: var(--text-secondary); line-height: 1.7; margin: 0; }

.brand-features { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; position: relative; z-index: 1; }
.feature-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; transition: all 0.3s ease; }
.feature-card:hover { background: rgba(230,57,70,0.05); border-color: rgba(230,57,70,0.2); transform: translateX(4px); }
.feature-icon { width: 36px; height: 36px; background: linear-gradient(135deg, rgba(230,57,70,0.15), rgba(198,42,53,0.08)); border: 1px solid rgba(230,57,70,0.2); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: var(--primary); flex-shrink: 0; }
.feature-icon svg { width: 18px; height: 18px; }
.feature-content { flex: 1; min-width: 0; }
.feature-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 2px; }
.feature-desc { font-size: 12px; color: var(--text-muted); }

.brand-stats { display: flex; align-items: center; gap: 20px; padding: 16px 20px; background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.06); border-radius: 14px; position: relative; z-index: 1; }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-size: 18px; font-weight: 700; background: linear-gradient(135deg, var(--text-primary), var(--text-secondary)); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 2px; }
.stat-label { font-size: 11px; color: var(--text-muted); letter-spacing: 0.5px; }
.stat-divider { width: 1px; height: 32px; background: var(--border-subtle); }
@keyframes fadeInLeft { from { opacity: 0; transform: translateX(-40px); } to { opacity: 1; transform: translateX(0); } }

/* 右侧卡片 */
.auth-main { display: flex; align-items: center; animation: fadeInRight 0.9s cubic-bezier(0.22, 1, 0.36, 1); }
.auth-card { width: 100%; position: relative; background: rgba(18, 20, 26, 0.65); backdrop-filter: blur(40px) saturate(180%); -webkit-backdrop-filter: blur(40px) saturate(180%); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 44px 40px; box-shadow: 0 50px 120px -30px rgba(0,0,0,0.7), 0 24px 60px -20px rgba(230,57,70,0.12), 0 1px 0 rgba(255,255,255,0.12) inset, 0 -1px 0 rgba(0,0,0,0.4) inset; overflow: hidden; isolation: isolate; }

/* 卡片内部装饰光斑 */
.card-glow { position: absolute; border-radius: 50%; filter: blur(60px); pointer-events: none; z-index: 0; }
.card-glow-1 { width: 280px; height: 280px; background: radial-gradient(circle, rgba(230, 57, 70, 0.18), transparent 70%); top: -100px; right: -80px; }
.card-glow-2 { width: 200px; height: 200px; background: radial-gradient(circle, rgba(99, 102, 241, 0.1), transparent 70%); bottom: -60px; left: -40px; }

/* 卡片内部网格 */
.card-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px); background-size: 32px 32px; mask-image: radial-gradient(ellipse at top right, black 20%, transparent 70%); -webkit-mask-image: radial-gradient(ellipse at top right, black 20%, transparent 70%); pointer-events: none; z-index: 0; opacity: 0.6; }

.card-accent { position: absolute; top: 0; left: 40px; right: 40px; height: 1px; background: linear-gradient(90deg, transparent 0%, rgba(230,57,70,0.6) 50%, transparent 100%); z-index: 1; }

.auth-card > *:not(.card-glow):not(.card-grid):not(.card-accent) { position: relative; z-index: 2; }

@keyframes fadeInRight { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }

/* 头部标题 */
.card-header { text-align: center; margin-bottom: 28px; }
.card-tag { display: inline-block; padding: 4px 12px; background: linear-gradient(135deg, var(--primary-light), rgba(230,57,70,0.06)); color: var(--primary); font-size: 10px; font-weight: 700; letter-spacing: 2px; border-radius: 999px; margin-bottom: 14px; border: 1px solid rgba(230,57,70,0.2); }
.card-title { font-size: 26px; font-weight: 700; margin: 0 0 8px; color: var(--text-primary); letter-spacing: -0.5px; }
.card-subtitle { font-size: 13px; color: var(--text-muted); margin: 0; }

/* Tab 栏 */
.tab-bar { position: relative; display: flex; gap: 4px; margin-bottom: 28px; background: rgba(0,0,0,0.4); border-radius: 12px; padding: 4px; border: 1px solid rgba(255,255,255,0.04); }
.tab-btn { flex: 1; padding: 10px; border: none; border-radius: 10px; background: transparent; color: var(--text-muted); font-size: 14px; font-weight: 500; cursor: pointer; transition: color 0.3s ease; font-family: inherit; position: relative; z-index: 2; }
.tab-btn:hover:not(.active) { color: var(--text-secondary); }
.tab-btn.active { color: var(--text-primary); font-weight: 600; }
.tab-indicator { position: absolute; top: 4px; left: 4px; width: calc((100% - 8px) / 3); height: calc(100% - 8px); background: linear-gradient(135deg, rgba(230,57,70,0.25), rgba(198,42,53,0.18)); border: 1px solid rgba(230,57,70,0.3); border-radius: 10px; transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1); z-index: 1; box-shadow: 0 4px 16px rgba(230,57,70,0.2), 0 1px 0 rgba(255,255,255,0.1) inset; }

/* 表单 */
.tab-content { animation: fadeInUp 0.45s ease; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
.auth-form { display: flex; flex-direction: column; gap: 18px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); letter-spacing: 0.3px; text-transform: uppercase; }
.label-optional { color: var(--text-faint); font-weight: 400; text-transform: none; letter-spacing: 0; }
.input-wrapper { position: relative; display: flex; align-items: center; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 12px; transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); overflow: hidden; }
.input-wrapper:hover { background: var(--bg-input-hover); border-color: var(--border-medium); }
.input-wrapper:focus-within { border-color: var(--border-focus); background: rgba(230, 57, 70, 0.05); box-shadow: 0 0 0 4px rgba(230,57,70,0.1), 0 4px 12px rgba(230,57,70,0.08); }
.input-icon { width: 18px; height: 18px; margin-left: 16px; color: var(--text-faint); flex-shrink: 0; transition: color 0.25s ease, transform 0.25s ease; }
.input-wrapper:focus-within .input-icon { color: var(--primary); transform: scale(1.05); }
.form-input { flex: 1; padding: 14px 16px; border: none; background: transparent; color: var(--text-primary); font-size: 14px; outline: none; font-family: inherit; }
.form-input::placeholder { color: var(--text-faint); }
.form-input:-webkit-autofill { -webkit-text-fill-color: var(--text-primary); -webkit-box-shadow: 0 0 0 1000px rgba(255,255,255,0.02) inset; transition: background-color 5000s ease-in-out 0s; }
.input-toggle { background: none; border: none; padding: 0 16px; color: var(--text-faint); cursor: pointer; display: flex; align-items: center; transition: color 0.25s ease; }
.input-toggle:hover { color: var(--primary); }
.input-toggle svg { width: 18px; height: 18px; }

/* 安全提示 */
.security-notice { display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(245, 158, 11, 0.04)); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; font-size: 12px; color: #F59E0B; line-height: 1.5; }
.notice-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

/* 验证信息 */
.verify-info { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.04)); border: 1px solid rgba(59,130,246,0.2); border-radius: 12px; font-size: 13px; color: #93C5FD; }
.verify-info svg { width: 16px; height: 16px; flex-shrink: 0; }
.verify-info strong { color: #DBEAFE; font-weight: 600; }

/* 验证码方框 */
.code-boxes { display: flex; gap: 8px; justify-content: space-between; }
.code-box { width: 100%; aspect-ratio: 1; max-width: 52px; text-align: center; font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 12px; color: var(--text-primary); outline: none; transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1); caret-color: var(--primary); padding: 0; }
.code-box:hover { background: var(--bg-input-hover); border-color: var(--border-medium); }
.code-box:focus { border-color: var(--primary); background: rgba(230,57,70,0.1); box-shadow: 0 0 0 4px rgba(230,57,70,0.12), 0 4px 16px rgba(230,57,70,0.15); transform: translateY(-3px); }
.code-box:not(:placeholder-shown) { background: rgba(230,57,70,0.06); border-color: rgba(230,57,70,0.3); }

/* 主按钮 */
.btn-submit { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: none; border-radius: 12px; background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); color: white; font-size: 15px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); box-shadow: 0 6px 20px rgba(230,57,70,0.35), 0 1px 0 rgba(255,255,255,0.15) inset, 0 -1px 0 rgba(0,0,0,0.1) inset; position: relative; overflow: hidden; margin-top: 4px; }
.btn-submit::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%); transform: translateX(-100%); transition: transform 0.7s ease; }
.btn-submit::after { content: ''; position: absolute; top: 50%; left: 50%; width: 0; height: 0; background: rgba(255,255,255,0.3); border-radius: 50%; transform: translate(-50%, -50%); transition: width 0.6s, height 0.6s; }
.btn-submit:hover:not(:disabled)::before { transform: translateX(100%); }
.btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(230,57,70,0.45), 0 1px 0 rgba(255,255,255,0.15) inset; }
.btn-submit:hover:not(:disabled)::after { width: 400px; height: 400px; opacity: 0; transition: width 0.6s, height 0.6s, opacity 0.6s; }
.btn-submit:active:not(:disabled) { transform: translateY(0); box-shadow: 0 4px 12px rgba(230,57,70,0.3); }
.btn-submit > * { position: relative; z-index: 1; }
.btn-submit > span:last-child { transition: transform 0.3s ease; }
.btn-submit:hover:not(:disabled) > span:last-child { transform: translateX(4px); }
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-spin { width: 18px; height: 18px; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* 替代操作链接 */
.alt-action { text-align: center; margin-top: 18px; font-size: 13px; color: var(--text-muted); }
.link-btn { background: none; border: none; color: var(--primary); font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: color 0.25s ease; padding: 4px 8px; position: relative; }
.link-btn::after { content: ''; position: absolute; bottom: 2px; left: 8px; right: 8px; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 0.25s ease; }
.link-btn:hover:not(:disabled)::after { transform: scaleX(1); }
.link-btn:hover:not(:disabled) { color: #ff6b75; }
.link-btn:disabled { color: var(--text-faint); cursor: not-allowed; }
.link-btn:disabled::after { display: none; }
.link-btn--center { display: block; margin: 12px auto 0; }

/* 返回按钮 */
.back-btn { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; color: var(--text-muted); font-size: 13px; cursor: pointer; padding: 4px 0; margin-bottom: 16px; font-family: inherit; transition: color 0.25s ease; }
.back-btn svg { width: 16px; height: 16px; transition: transform 0.25s ease; }
.back-btn:hover { color: var(--primary); }
.back-btn:hover svg { transform: translateX(-3px); }

/* 邮箱验证码 hero */
.email-code-hero { text-align: center; padding: 8px 0 24px; }
.email-code-icon-wrap { width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, rgba(230,57,70,0.2), rgba(198,42,53,0.1)); border: 1px solid rgba(230,57,70,0.25); border-radius: 18px; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 8px 24px rgba(230,57,70,0.15); position: relative; }
.email-code-icon-wrap::before { content: ''; position: absolute; inset: -1px; border-radius: 18px; background: linear-gradient(135deg, rgba(230,57,70,0.4), transparent, rgba(230,57,70,0.4)); opacity: 0.5; z-index: -1; filter: blur(4px); }
.email-code-icon-wrap svg { width: 28px; height: 28px; }
.email-code-title { font-size: 20px; font-weight: 600; margin: 0 0 6px; color: var(--text-primary); }
.email-code-desc { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.5; }
.code-actions { display: flex; justify-content: flex-end; margin-top: 8px; }

/* 找回密码 */
.reset-step { display: flex; flex-direction: column; gap: 20px; }
.step-indicator { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 8px; }
.step-dot { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.04); border: 1px solid var(--border-medium); display: flex; align-items: center; justify-content: center; color: var(--text-faint); font-size: 13px; font-weight: 600; transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1); position: relative; z-index: 2; }
.step-dot.active { background: linear-gradient(135deg, var(--primary), var(--primary-dark)); border-color: var(--primary); color: white; box-shadow: 0 4px 12px rgba(230,57,70,0.4); }
.step-dot.done { background: var(--primary); border-color: var(--primary); color: white; }
.step-dot.done .step-num::before { content: '✓'; }
.step-dot.done .step-num { font-size: 0; }
.step-dot.done .step-num::before { font-size: 16px; }
.step-line { width: 80px; height: 2px; background: var(--border-medium); margin: 0 -1px; transition: background 0.4s ease; position: relative; z-index: 1; }
.step-line.active { background: linear-gradient(90deg, var(--primary), var(--primary)); }

.reset-hero { text-align: center; padding: 4px 0 4px; }
.reset-hero-icon { width: 60px; height: 60px; margin: 0 auto 14px; background: linear-gradient(135deg, rgba(230,57,70,0.15), rgba(198,42,53,0.08)); border: 1px solid rgba(230,57,70,0.2); border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 6px 20px rgba(230,57,70,0.12); }
.reset-hero-icon svg { width: 28px; height: 28px; }
.reset-hero-title { font-size: 22px; font-weight: 700; margin: 0 0 6px; color: var(--text-primary); letter-spacing: -0.3px; }
.reset-hero-desc { font-size: 13px; color: var(--text-muted); margin: 0; line-height: 1.6; }

.reset-tips { display: flex; flex-direction: column; gap: 8px; padding: 14px 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: 12px; margin-top: 4px; }
.reset-tip { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-muted); }
.reset-tip svg { width: 14px; height: 14px; color: var(--text-faint); flex-shrink: 0; }

.password-strength { display: flex; align-items: center; gap: 10px; margin-top: 4px; }
.strength-bars { display: flex; gap: 4px; flex: 1; }
.strength-bar { height: 4px; flex: 1; background: rgba(255,255,255,0.06); border-radius: 2px; transition: all 0.3s ease; }
.strength-bar.filled.weak { background: #EF4444; box-shadow: 0 0 8px rgba(239,68,68,0.4); }
.strength-bar.filled.medium { background: #F59E0B; box-shadow: 0 0 8px rgba(245,158,11,0.4); }
.strength-bar.filled.strong { background: #10B981; box-shadow: 0 0 8px rgba(16,185,129,0.4); }
.strength-label { font-size: 11px; font-weight: 600; letter-spacing: 0.5px; min-width: 32px; text-align: right; }
.strength-label.weak { color: #EF4444; }
.strength-label.medium { color: #F59E0B; }
.strength-label.strong { color: #10B981; }

/* 分隔线 */
.auth-divider { text-align: center; margin: 26px 0 18px; position: relative; }
.auth-divider::before, .auth-divider::after { content: ''; position: absolute; top: 50%; width: calc(50% - 32px); height: 1px; background: linear-gradient(90deg, transparent, var(--border-subtle), transparent); }
.auth-divider::before { left: 0; }
.auth-divider::after { right: 0; }
.auth-divider span { color: var(--text-faint); font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; padding: 0 8px; background: rgba(22,24,30,0.96); }

/* 第三方登录网格 */
.social-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.btn-social { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; padding: 16px 8px; border: 1px solid var(--border-subtle); border-radius: 14px; background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01)); color: var(--text-secondary); font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit; transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1); position: relative; overflow: hidden; }
.btn-social::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at center, rgba(230,57,70,0.15), transparent 70%); opacity: 0; transition: opacity 0.3s ease; }
.btn-social svg { width: 22px; height: 22px; position: relative; z-index: 1; transition: transform 0.3s ease; }
.btn-social > span { position: relative; z-index: 1; }
.btn-social:hover:not(:disabled) { background: linear-gradient(180deg, rgba(230,57,70,0.08), rgba(230,57,70,0.03)); border-color: rgba(230,57,70,0.3); color: var(--text-primary); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(230,57,70,0.15); }
.btn-social:hover:not(:disabled)::before { opacity: 1; }
.btn-social:hover:not(:disabled) svg { transform: scale(1.1); }
.btn-social:disabled { opacity: 0.5; cursor: not-allowed; }

/* TOTP 2FA */
.totp-verify { text-align: center; padding: 12px 0 8px; }
.totp-icon { width: 68px; height: 68px; margin: 0 auto 18px; background: linear-gradient(135deg, rgba(230,57,70,0.18), rgba(198,42,53,0.08)); border: 1px solid rgba(230,57,70,0.25); border-radius: 20px; display: flex; align-items: center; justify-content: center; color: var(--primary); box-shadow: 0 8px 24px rgba(230,57,70,0.15); }
.totp-icon svg { width: 32px; height: 32px; }
.totp-title { font-size: 22px; font-weight: 600; margin: 0 0 6px; color: var(--text-primary); }
.totp-desc { font-size: 13px; color: var(--text-muted); margin: 0 0 24px; line-height: 1.5; }

/* Toast */
.toast { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 9999; padding: 12px 24px; border-radius: 12px; font-size: 14px; font-weight: 500; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); box-shadow: 0 12px 32px rgba(0,0,0,0.4); animation: toastIn 0.4s cubic-bezier(0.22, 1, 0.36, 1); }
.toast.error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.35); color: #FCA5A5; }
.toast.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.35); color: #6EE7B7; }
.toast.info { background: rgba(59, 130, 246, 0.15); border: 1px solid rgba(59, 130, 246, 0.35); color: #93C5FD; }
@keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(-16px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* 跳转遮罩 */
.redirect-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); z-index: 99999; display: flex; align-items: center; justify-content: center; }
.redirect-content { text-align: center; animation: contentBounce 0.5s cubic-bezier(0.22, 1, 0.36, 1); }
@keyframes contentBounce { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }
.redirect-spinner { width: 56px; height: 56px; margin: 0 auto; border: 2px solid rgba(230,57,70,0.15); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.7s linear infinite; box-shadow: 0 0 24px rgba(230,57,70,0.3); }
.redirect-text { margin-top: 20px; font-size: 13px; color: var(--text-secondary); letter-spacing: 2px; }

/* 过渡 */
.fade-slide-enter-active, .fade-slide-leave-active { transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.fade-slide-enter-from { opacity: 0; transform: translateX(20px); }
.fade-slide-leave-to { opacity: 0; transform: translateX(-20px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* 响应式 */
@media (max-width: 960px) {
  .auth-layout { grid-template-columns: 1fr; gap: 32px; max-width: 480px; }
  .auth-brand { padding: 0 20px; text-align: center; align-items: center; }
  .brand-header { justify-content: center; }
  .brand-features { display: none; }
  .brand-headline { font-size: 26px; }
  .brand-stats { max-width: 360px; margin: 0 auto; }
  .auth-card { padding: 36px 28px; }
}
@media (max-width: 480px) {
  .auth-page { padding: 20px 12px; }
  .auth-card { padding: 28px 22px; border-radius: 20px; }
  .card-title { font-size: 22px; }
  .code-box { font-size: 20px; max-width: 44px; }
  .social-grid { gap: 8px; }
  .btn-social { padding: 14px 6px; font-size: 11px; }
  .btn-social svg { width: 20px; height: 20px; }
  .brand-headline { font-size: 22px; }
  .brand-stats { padding: 12px; gap: 12px; }
  .stat-value { font-size: 15px; }
}
</style>