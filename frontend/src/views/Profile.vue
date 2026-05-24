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
            <h2 class="display-name">{{ auth.user?.display_name || auth.user?.username }}</h2>
            <p class="user-email">{{ auth.user?.email }}</p>
            <span :class="['role-badge', auth.user?.role]">{{ roleLabel }}</span>
          </div>
          <button class="btn-logout" @click="handleLogout">退出登录</button>
        </div>

        <div class="profile-right">
          <div class="profile-tabs">
            <button :class="['profile-tab', { active: profileTab === 'overview' }]" @click="profileTab = 'overview'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              概览
            </button>
            <button :class="['profile-tab', { active: profileTab === 'passkeys' }]" @click="profileTab = 'passkeys'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
              通行密钥
            </button>
            <button :class="['profile-tab', { active: profileTab === 'consents' }]" @click="profileTab = 'consents'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              已授权应用
            </button>
            <button :class="['profile-tab', { active: profileTab === 'social' }]" @click="profileTab = 'social'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              社交绑定
            </button>
            <button :class="['profile-tab', { active: profileTab === 'activities' }]" @click="profileTab = 'activities'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="tab-icon"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              账户活动
            </button>
          </div>

          <div class="profile-panel" v-if="profileTab === 'overview'">
            <div class="details-card">
              <div class="section-title-row">
                <h3 class="section-title" style="margin-bottom:0">账号信息</h3>
                <button class="btn-edit" @click="openEditProfile">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  编辑
                </button>
              </div>
              <div class="detail-row"><span class="detail-label">用户名</span><span class="detail-value">{{ auth.user?.username }}</span></div>
              <div class="detail-row"><span class="detail-label">邮箱</span><span class="detail-value">{{ auth.user?.email }}</span></div>
              <div class="detail-row"><span class="detail-label">QQ号</span><span class="detail-value">{{ auth.user?.qq || '-' }}</span></div>
              <div class="detail-row"><span class="detail-label">角色</span><span class="detail-value">{{ roleLabel }}</span></div>
            </div>
            <div class="details-card" style="margin-top:20px">
              <h3 class="section-title">双因素认证</h3>
              <div v-if="totpStatus === null" class="empty-state"><p>加载中...</p></div>
              <div v-else-if="!totpStatus">
                <p style="font-size:14px;color:#6B7280;margin-bottom:16px">启用双因素认证(TOTP)可以为您的账户增加一层安全保护。</p>
                <button class="btn-register-key" @click="setupTotp" :disabled="totpLoading">{{ totpLoading ? '生成中...' : '启用 2FA' }}</button>
                <div v-if="totpSetupData" class="totp-setup">
                  <div class="totp-qr-wrap">
                    <img :src="totpSetupData.qr_code" class="totp-qr" alt="2FA QR Code" />
                  </div>
                  <div class="totp-secret-wrap">
                    <span class="totp-secret-label">手动输入密钥</span>
                    <div class="totp-secret-row">
                      <code class="totp-secret">{{ totpSetupData.secret }}</code>
                      <button class="cred-copy" @click="copyText(totpSetupData.secret)" title="复制密钥"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                    </div>
                  </div>
                  <div class="form-group" style="margin-top:12px">
                    <label class="form-label">输入验证码确认</label>
                    <div class="totp-verify-row">
                      <input v-model="totpVerifyCode" type="text" class="form-input" placeholder="000000" maxlength="6" style="flex:1;text-align:center;font-size:20px;letter-spacing:6px;font-family:monospace" />
                      <button class="btn-register-key" @click="confirmTotp" :disabled="totpVerifying" style="white-space:nowrap">{{ totpVerifying ? '验证中...' : '确认' }}</button>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else>
                <div class="totp-enabled">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="totp-shield"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  <div>
                    <span style="font-size:15px;font-weight:600;color:#6EE7B7">双因素认证已启用</span>
                    <span style="font-size:13px;color:#6B7280;margin-top:2px">登录时需要输入身份验证器应用中的动态码</span>
                  </div>
                </div>
                <button class="btn-register-key" style="margin-top:16px;border-color:rgba(239,68,68,0.2);color:#FCA5A5" @click="disableTotp">关闭 2FA</button>
              </div>
            </div>
          </div>

          <div class="profile-panel" v-if="profileTab === 'passkeys'">
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
          </div>

          <div class="profile-panel" v-if="profileTab === 'consents'">
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

          <div class="profile-panel" v-if="profileTab === 'social'">
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
              <div class="social-bind-btns">
                <button v-if="!socialConnections.find(c => c.provider === 'github')" class="btn-register-key" :disabled="bindLoading === 'github'" @click="bindSocial('github')">
                  {{ bindLoading === 'github' ? '绑定中...' : '绑定 GitHub' }}
                </button>
                <button v-if="!socialConnections.find(c => c.provider === 'qq')" class="btn-register-key" :disabled="bindLoading === 'qq'" @click="bindSocial('qq')">
                  {{ bindLoading === 'qq' ? '绑定中...' : '绑定 QQ' }}
                </button>
              </div>
            </div>
          </div>

          <div class="profile-panel" v-if="profileTab === 'activities'">
            <div class="activities-card">
              <h3 class="section-title">账户活动</h3>
              <div v-if="activities.length === 0" class="empty-state"><p>暂无活动记录</p></div>
              <div v-else class="activities-list">
                <div v-for="act in activities" :key="act.id" class="activity-item">
                  <div class="activity-icon-wrap">
                    <svg v-if="act.action === 'login'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon login"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                    <svg v-else-if="act.action === 'logout'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon logout"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    <svg v-else-if="act.action === 'register'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon register"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                    <svg v-else-if="act.action === 'change_password'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon password"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <svg v-else-if="act.action === 'register_passkey' || act.action === 'delete_passkey'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon passkey"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
                    <svg v-else-if="act.action === 'upload_avatar' || act.action === 'delete_avatar'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon avatar"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                    <svg v-else-if="act.action === 'bind_social' || act.action === 'unbind_social'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon social"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                    <svg v-else-if="act.action === 'revoke_consent'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon revoke"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="activity-icon default"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </div>
                  <div class="activity-info">
                    <span class="activity-action">{{ activityLabel(act.action) }}</span>
                    <span class="activity-detail">{{ activityDetail(act) }}</span>
                  </div>
                  <span class="activity-time">{{ formatTime(act.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="modal-overlay" v-if="showVerifyModal" @click.self="closeVerifyModal">
    <div class="modal modal-edit">
      <div class="modal-header">
        <h4>安全验证</h4>
        <button class="modal-close" @click="closeVerifyModal">&times;</button>
      </div>
      <div class="modal-body">
        <p class="verify-desc">请选择验证方式以继续操作</p>
        <div class="verify-methods" v-if="verifyStep === 'select'">
          <button v-for="m in verifyMethods" :key="m" class="verify-method-btn" @click="selectVerifyMethod(m)">
            <svg v-if="m === 'email'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vm-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <svg v-else-if="m === 'totp'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vm-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vm-icon"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            {{ m === 'email' ? '邮箱验证码' : m === 'totp' ? '身份验证器' : '通行密钥' }}
          </button>
        </div>
        <div v-if="verifyMethod === 'email' && verifyStep === 'input'" class="form-group">
          <label class="form-label">邮箱验证码</label>
          <p class="verify-email-hint">已发送至 {{ auth.user?.email }}</p>
          <div class="verify-code-row">
            <input v-model="verifyCode" type="text" class="form-input verify-code-input" placeholder="000000" maxlength="6" />
            <button class="btn-send" @click="sendVerifyEmail" :disabled="verifySending">{{ verifySending ? '发送中' : '重发' }}</button>
          </div>
          <button class="btn-primary btn-full" @click="submitVerify" :disabled="verifyChecking">{{ verifyChecking ? '验证中...' : '验证' }}</button>
          <button class="btn-back" @click="verifyStep = 'select'">返回选择其他方式</button>
        </div>
        <div v-if="verifyMethod === 'totp' && verifyStep === 'input'" class="form-group">
          <label class="form-label">身份验证器动态码</label>
          <input v-model="verifyCode" type="text" class="form-input verify-code-input" placeholder="000000" maxlength="6" />
          <button class="btn-primary btn-full" @click="submitVerify" :disabled="verifyChecking">{{ verifyChecking ? '验证中...' : '验证' }}</button>
          <button class="btn-back" @click="verifyStep = 'select'">返回选择其他方式</button>
        </div>
        <div v-if="verifyMethod === 'passkey' && verifyStep === 'input'" class="verify-passkey-section">
          <p style="font-size:14px;color:#6B7280;text-align:center">使用浏览器通行密钥验证身份</p>
          <button class="btn-primary btn-full" @click="verifyWithPasskey" :disabled="verifyChecking">{{ verifyChecking ? '验证中...' : '使用通行密钥验证' }}</button>
          <button class="btn-back" @click="verifyStep = 'select'">返回选择其他方式</button>
        </div>
      </div>
      <div v-if="verifyError" class="verify-error" style="padding:0 28px 16px">{{ verifyError }}</div>
    </div>
  </div>

  <div class="modal-overlay" v-if="showEditModal" @click.self="closeEditModal">
    <div class="modal modal-edit">
      <div class="modal-header">
        <h4>{{ editVerifyStep ? '安全验证' : '编辑资料' }}</h4>
        <button class="modal-close" @click="closeEditModal">&times;</button>
      </div>

      <div class="modal-body" v-if="!editVerifyStep">
        <div class="form-group">
          <label class="form-label">QQ号码</label>
          <input v-model="editForm.qq" type="text" class="form-input" placeholder="您的QQ号码" />
        </div>
        <div class="form-group">
          <label class="form-label">邮箱</label>
          <div class="edit-email-row">
            <input v-model="editForm.email" type="email" class="form-input" placeholder="new@example.com" />
            <span v-if="editEmailChanged && !editEmailVerified" class="edit-email-warn">修改邮箱需验证</span>
          </div>
        </div>
        <div class="edit-actions">
          <button class="btn-cancel" @click="closeEditModal">取消</button>
          <button class="btn-primary" @click="saveProfile" :disabled="editSaving">{{ editSaving ? '保存中...' : '保存' }}</button>
        </div>
      </div>

      <div class="modal-body" v-if="editVerifyStep">
        <p class="verify-desc">修改邮箱需要先验证身份</p>
        <div class="verify-methods" v-if="editVerifyStep === 'select'">
          <button v-for="m in verifyMethods" :key="m" class="verify-method-btn" @click="selectEditVerifyMethod(m)">
            <svg v-if="m === 'email'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vm-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <svg v-else-if="m === 'totp'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vm-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="vm-icon"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            {{ m === 'email' ? '邮箱验证码' : m === 'totp' ? '身份验证器' : '通行密钥' }}
          </button>
        </div>
        <div v-if="editVerifyStep === 'email-input'" class="form-group">
          <label class="form-label">邮箱验证码</label>
          <p class="verify-email-hint">已发送至 {{ auth.user?.email }}</p>
          <div class="verify-code-row">
            <input v-model="editVerifyCode" type="text" class="form-input verify-code-input" placeholder="000000" maxlength="6" />
            <button class="btn-send" @click="sendEditVerifyEmail" :disabled="editVerifySending">{{ editVerifySending ? '发送中' : '重发' }}</button>
          </div>
          <button class="btn-primary btn-full" @click="submitEditVerify" :disabled="editVerifyChecking">{{ editVerifyChecking ? '验证中...' : '验证' }}</button>
          <button class="btn-back" @click="editVerifyStep = 'select'">返回选择其他方式</button>
        </div>
        <div v-if="editVerifyStep === 'totp-input'" class="form-group">
          <label class="form-label">身份验证器动态码</label>
          <input v-model="editVerifyCode" type="text" class="form-input verify-code-input" placeholder="000000" maxlength="6" />
          <button class="btn-primary btn-full" @click="submitEditVerify" :disabled="editVerifyChecking">{{ editVerifyChecking ? '验证中...' : '验证' }}</button>
          <button class="btn-back" @click="editVerifyStep = 'select'">返回选择其他方式</button>
        </div>
        <div v-if="editVerifyStep === 'passkey-input'" class="verify-passkey-section">
          <p style="font-size:14px;color:#6B7280;text-align:center">使用浏览器通行密钥验证身份</p>
          <button class="btn-primary btn-full" @click="verifyEditWithPasskey" :disabled="editVerifyChecking">{{ editVerifyChecking ? '验证中...' : '使用通行密钥验证' }}</button>
          <button class="btn-back" @click="editVerifyStep = 'select'">返回选择其他方式</button>
        </div>
        <div v-if="editVerifyError" class="verify-error">{{ editVerifyError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { apiGet, apiPost, clearTokens, API_BASE } from '@/utils/api'

const auth = useAuthStore()
const profileTab = ref('overview')
const credentials = ref<any[]>([])
const socialConnections = ref<any[]>([])
const consents = ref<any[]>([])
const regKeyLoading = ref(false)
const keyRegResult = ref('')
const uploadingAvatar = ref(false)
const avatarInputRef = ref<HTMLInputElement | null>(null)
const activities = ref<any[]>([])
const totpStatus = ref<boolean | null>(null)
const totpLoading = ref(false)
const totpVerifying = ref(false)
const bindLoading = ref('')
const totpSetupData = ref<any>(null)
const totpVerifyCode = ref('')
const showVerifyModal = ref(false)
const verifyMethods = ref<string[]>([])
const verifyMethod = ref('')
const verifyStep = ref<'select' | 'input'>('select')
const verifyCode = ref('')
const verifySending = ref(false)
const verifyChecking = ref(false)
const verifyError = ref('')
const verifyPendingAction = ref('')
const verifyTicket = ref('')
const showEditModal = ref(false)
const editForm = reactive({ qq: '', email: '' })
const editEmailChanged = computed(() => editForm.email !== auth.user?.email)
const editEmailVerified = ref(false)
const editSaving = ref(false)
const editVerifyStep = ref<string | null>(null)
const editVerifyCode = ref('')
const editVerifySending = ref(false)
const editVerifyChecking = ref(false)
const editVerifyError = ref('')

const roleLabel = computed(() => {
  const map: Record<string, string> = { user: '普通用户', developer: '开发者', admin: '管理员' }
  return map[auth.user?.role] || '普通用户'
})

onMounted(async () => {
  if (auth.isLoggedIn) {
    const bindSuccess = new URLSearchParams(window.location.search).get('bind_success')
    const bindError = new URLSearchParams(window.location.search).get('bind_error')
    if (bindSuccess) {
      alert('社交账号绑定成功')
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
    if (bindError) {
      alert(decodeURIComponent(bindError))
      window.history.replaceState({}, '', window.location.pathname + window.location.hash)
    }
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
    try {
      const actData = await apiGet('/api/auth/user/activities?limit=50')
      if (actData.activities) activities.value = actData.activities
    } catch {}
    try {
      const totpRes = await apiGet('/api/auth/totp/status')
      totpStatus.value = totpRes.enabled
    } catch { totpStatus.value = false }
  }
})

function formatTime(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function activityLabel(action: string) {
  const map: Record<string, string> = {
    login: '登录',
    logout: '登出',
    register: '注册',
    change_password: '修改密码',
    revoke_consent: '撤销授权',
    register_passkey: '注册通行密钥',
    delete_passkey: '删除通行密钥',
    bind_social: '绑定社交账号',
    unbind_social: '解绑社交账号',
    update_profile: '更新资料',
    upload_avatar: '更换头像',
    delete_avatar: '删除头像',
    reset_secret: '重置客户端密钥',
    enable_2fa: '启用双因素认证',
    disable_2fa: '关闭双因素认证'
  }
  return map[action] || action
}

function activityDetail(act: any) {
  if (!act.detail) {
    if (act.action === 'enable_2fa') {
      const loc = act.ip_location
      return loc || '已启用'
    }
    if (act.action === 'disable_2fa') {
      const loc = act.ip_location
      return loc || '已关闭'
    }
    return ''
  }
  try {
    const d = typeof act.detail === 'string' ? JSON.parse(act.detail) : act.detail
    if (act.action === 'login') {
      const parts = []
      if (d.method === 'passkey') parts.push('通行密钥')
      else parts.push('密码')
      const loc = act.ip_location || d.location
      if (loc) parts.push(loc)
      if (d.ip) parts.push(d.ip)
      return parts.join(' · ')
    }
    if (act.action === 'register') {
      const loc = act.ip_location || d.location
      return loc || (d.email || '')
    }
    if (act.action === 'change_password') {
      return '密码已修改'
    }
    if (act.action === 'register_passkey') {
      return d.nickname || ''
    }
    if (act.action === 'delete_passkey') {
      return ''
    }
    if (act.action === 'bind_social' || act.action === 'unbind_social') {
      const provider = d.provider === 'github' ? 'GitHub' : d.provider === 'qq' ? 'QQ' : d.provider
      return d.username ? `${provider} (${d.username})` : provider
    }
    if (act.action === 'revoke_consent') {
      return ''
    }
    if (act.action === 'reset_secret') {
      return d.client_name || ''
    }
    return ''
  } catch {
    return ''
  }
}

async function setupTotp() {
  startVerify('enable_2fa', async () => {
    totpLoading.value = true
    try {
      const res = await fetch(`${API_BASE}/api/auth/totp/setup`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      })
      const data = await res.json()
      if (data.secret) {
        totpSetupData.value = data
      } else {
        alert(data.message || '设置失败')
      }
    } catch { alert('设置失败') }
    finally { totpLoading.value = false }
  })
}

async function confirmTotp() {
  if (!totpVerifyCode.value || totpVerifyCode.value.length !== 6) { alert('请输入6位验证码'); return }
  totpVerifying.value = true
  try {
    const res = await fetch(`${API_BASE}/api/auth/totp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({ code: totpVerifyCode.value })
    })
    const data = await res.json()
    if (data.enabled) {
      totpStatus.value = true
      totpSetupData.value = null
      totpVerifyCode.value = ''
      alert('2FA 已启用')
    } else {
      alert(data.message || '验证失败')
    }
  } catch { alert('验证失败') }
  finally { totpVerifying.value = false }
}

async function disableTotp() {
  if (!confirm('确定要关闭双因素认证吗？')) return
  startVerify('disable_2fa', async (ticket) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/totp/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
        body: JSON.stringify({ ticket })
      })
      const data = await res.json()
      if (!data.enabled) {
        totpStatus.value = false
        alert('2FA 已关闭')
      }
    } catch { alert('关闭失败') }
  })
}

async function handleLogout() {
  await auth.logout()
  clearTokens()
  window.location.hash = '#/login'
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    alert('已复制到剪贴板')
  })
}

function closeVerifyModal() {
  showVerifyModal.value = false
  verifyStep.value = 'select'
  verifyCode.value = ''
  verifyError.value = ''
  verifyCallback = null
}

async function startVerify(action: string, callback: (ticket: string) => void) {
  verifyPendingAction.value = action
  verifyCallback = callback
  verifyMethod.value = ''
  verifyStep.value = 'select'
  verifyCode.value = ''
  verifyError.value = ''
  verifyTicket.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify/methods`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    const data = await res.json()
    verifyMethods.value = data.methods || []
    if (verifyMethods.value.length === 0) {
      alert('没有可用的验证方式，请先配置邮箱或 2FA')
      return
    }
    showVerifyModal.value = true
  } catch { alert('获取验证方式失败') }
}

let verifyCallback: ((ticket: string) => void) | null = null

function selectVerifyMethod(m: string) {
  verifyMethod.value = m
  verifyStep.value = 'input'
  verifyCode.value = ''
  verifyError.value = ''
  if (m === 'email') {
    sendVerifyEmail()
  }
}

async function sendVerifyEmail() {
  verifySending.value = true
  verifyError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify/send-email`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    const data = await res.json()
    if (!data.sent) { verifyError.value = data.message || '发送失败' }
  } catch { verifyError.value = '发送失败' }
  finally { verifySending.value = false }
}

async function submitVerify() {
  if (!verifyCode.value) { verifyError.value = '请输入验证码'; return }
  verifyChecking.value = true
  verifyError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({ method: verifyMethod.value, code: verifyCode.value, action: verifyPendingAction.value })
    })
    const data = await res.json()
    if (data.verified && data.ticket) {
      verifyTicket.value = data.ticket
      showVerifyModal.value = false
      if (verifyCallback) {
        verifyCallback(data.ticket)
        verifyCallback = null
      }
    } else {
      verifyError.value = data.message || '验证失败'
    }
  } catch { verifyError.value = '验证失败' }
  finally { verifyChecking.value = false }
}

async function verifyWithPasskey() {
  if (!window.PublicKeyCredential) { verifyError.value = '当前浏览器不支持通行密钥'; return }
  verifyChecking.value = true
  try {
    const beginData = await apiPost('/api/webauthn/login/begin', { username: null })
    const publicKey = beginData.publicKey
    publicKey.challenge = base64URLToBuffer(publicKey.challenge)
    if (publicKey.allowCredentials) {
      publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({ ...c, id: base64URLToBuffer(c.id) }))
    }
    const cred = await navigator.credentials.get({ publicKey }) as any
    const verifyRes = await fetch(`${API_BASE}/api/auth/verify/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({
        method: 'passkey',
        code: JSON.stringify({
          id: cred.id,
          rawId: bufferToBase64URL(cred.rawId),
          response: {
            clientDataJSON: bufferToBase64URL(cred.response.clientDataJSON),
            authenticatorData: bufferToBase64URL(cred.response.authenticatorData),
            signature: bufferToBase64URL(cred.response.signature),
            userHandle: cred.response.userHandle ? bufferToBase64URL(cred.response.userHandle) : null
          },
          type: cred.type
        }),
        action: verifyPendingAction.value
      })
    })
    const data = await verifyRes.json()
    if (data.verified && data.ticket) {
      verifyTicket.value = data.ticket
      showVerifyModal.value = false
      if (verifyCallback) {
        verifyCallback(data.ticket)
        verifyCallback = null
      }
    } else {
      verifyError.value = data.message || '验证失败'
    }
  } catch (e: any) {
    if (e.name !== 'NotAllowedError') verifyError.value = e.message || '验证失败'
  }
  finally { verifyChecking.value = false }
}

function openEditProfile() {
  editForm.qq = auth.user?.qq || ''
  editForm.email = auth.user?.email || ''
  editEmailVerified.value = false
  editVerifyStep.value = null
  editVerifyCode.value = ''
  editVerifyError.value = ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editVerifyStep.value = null
  editVerifyCode.value = ''
  editVerifyError.value = ''
}

async function saveProfile() {
  const changed: any = {}
  if (editForm.qq !== (auth.user?.qq || '')) changed.qq = editForm.qq
  if (editForm.email !== auth.user?.email) {
    changed.email = editForm.email
    if (!editEmailVerified.value) {
      try {
        const res = await fetch(`${API_BASE}/api/auth/verify/methods`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        })
        const data = await res.json()
        verifyMethods.value = data.methods || []
        if (verifyMethods.value.length === 0) {
          alert('没有可用的验证方式，请先配置邮箱或 2FA')
          return
        }
      } catch { alert('获取验证方式失败'); return }
      editVerifyStep.value = 'select'
      return
    }
  }
  if (Object.keys(changed).length === 0) { closeEditModal(); return }
  await doSaveProfile('', changed)
}

function selectEditVerifyMethod(m: string) {
  if (m === 'email') {
    editVerifyStep.value = 'email-input'
    editVerifyCode.value = ''
    editVerifyError.value = ''
    sendEditVerifyEmail()
  } else if (m === 'totp') {
    editVerifyStep.value = 'totp-input'
    editVerifyCode.value = ''
    editVerifyError.value = ''
  } else if (m === 'passkey') {
    editVerifyStep.value = 'passkey-input'
    editVerifyError.value = ''
  }
}

async function sendEditVerifyEmail() {
  editVerifySending.value = true
  editVerifyError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify/send-email`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    const data = await res.json()
    if (!data.sent) { editVerifyError.value = data.message || '发送失败' }
  } catch { editVerifyError.value = '发送失败' }
  finally { editVerifySending.value = false }
}

async function submitEditVerify() {
  if (!editVerifyCode.value) { editVerifyError.value = '请输入验证码'; return }
  const method = editVerifyStep.value?.startsWith('email') ? 'email' : editVerifyStep.value?.startsWith('totp') ? 'totp' : 'passkey'
  editVerifyChecking.value = true
  editVerifyError.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/auth/verify/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({ method, code: editVerifyCode.value, action: 'change_email' })
    })
    const data = await res.json()
    if (data.verified && data.ticket) {
      editEmailVerified.value = true
      editVerifyStep.value = null
      editVerifyCode.value = ''
      const changed: any = { qq: editForm.qq !== auth.user?.qq ? editForm.qq : undefined }
      if (editForm.email !== auth.user?.email) changed.email = editForm.email
      await doSaveProfile(data.ticket, changed)
    } else {
      editVerifyError.value = data.message || '验证失败'
    }
  } catch { editVerifyError.value = '验证失败' }
  finally { editVerifyChecking.value = false }
}

async function verifyEditWithPasskey() {
  if (!window.PublicKeyCredential) { editVerifyError.value = '当前浏览器不支持通行密钥'; return }
  editVerifyChecking.value = true
  try {
    const beginData = await apiPost('/api/webauthn/login/begin', { username: null })
    const publicKey = beginData.publicKey
    publicKey.challenge = base64URLToBuffer(publicKey.challenge)
    if (publicKey.allowCredentials) {
      publicKey.allowCredentials = publicKey.allowCredentials.map((c: any) => ({ ...c, id: base64URLToBuffer(c.id) }))
    }
    const cred = await navigator.credentials.get({ publicKey }) as any
    const verifyRes = await fetch(`${API_BASE}/api/auth/verify/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({
        method: 'passkey',
        code: JSON.stringify({
          id: cred.id, rawId: bufferToBase64URL(cred.rawId),
          response: {
            clientDataJSON: bufferToBase64URL(cred.response.clientDataJSON),
            authenticatorData: bufferToBase64URL(cred.response.authenticatorData),
            signature: bufferToBase64URL(cred.response.signature),
            userHandle: cred.response.userHandle ? bufferToBase64URL(cred.response.userHandle) : null
          },
          type: cred.type
        }),
        action: 'change_email'
      })
    })
    const data = await verifyRes.json()
    if (data.verified && data.ticket) {
      editEmailVerified.value = true
      editVerifyStep.value = null
      const changed: any = { qq: editForm.qq !== auth.user?.qq ? editForm.qq : undefined }
      if (editForm.email !== auth.user?.email) changed.email = editForm.email
      await doSaveProfile(data.ticket, changed)
    } else {
      editVerifyError.value = data.message || '验证失败'
    }
  } catch (e: any) {
    if (e.name !== 'NotAllowedError') editVerifyError.value = e.message || '验证失败'
  }
  finally { editVerifyChecking.value = false }
}

async function doSaveProfile(ticket: string, data: any) {
  editSaving.value = true
  try {
    const res = await fetch(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      body: JSON.stringify({ ...data, ticket })
    })
    const result = await res.json()
    if (result.user) {
      if (auth.user) {
        auth.user.display_name = result.user.display_name
        auth.user.email = result.user.email
        auth.user.picture = result.user.picture
      }
      localStorage.setItem('user', JSON.stringify(auth.user))
      closeEditModal()
      alert('更新成功')
    } else {
      alert(result.message || '更新失败')
    }
  } catch { alert('更新失败') }
  finally { editSaving.value = false }
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

async function registerPasskey() {
  if (!window.PublicKeyCredential) { alert('当前浏览器不支持通行密钥'); return }
  startVerify('register_passkey', async (ticket) => {
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
        nickname: '我的密钥',
        ticket
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
  })
}

async function deleteCredential(credId: string) {
  if (!confirm('确定要删除此通行密钥吗？')) return
  startVerify('delete_passkey', async (ticket) => {
    try {
      await fetch(`${API_BASE}/api/webauthn/credentials/${credId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}`, 'x-verify-ticket': ticket }
      })
      credentials.value = credentials.value.filter(c => c.id !== credId)
    } catch { alert('删除失败') }
  })
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

async function bindSocial(provider: string) {
  bindLoading.value = provider
  try {
    const res = await fetch(`${API_BASE}/api/auth/social/${provider}/bind`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
    })
    const data = await res.json()
    if (data.redirect_url) {
      window.open(data.redirect_url, '_blank')
    }
  } catch { }
  finally { bindLoading.value = '' }
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
.profile-container { max-width: 1000px; margin: 0 auto; padding: 0 24px 80px; position: relative; z-index: 1; }
.profile-grid { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }

.profile-right { grid-column: 2; display: flex; flex-direction: column; gap: 24px; }

.profile-tabs {
  display: flex; gap: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 5px;
  overflow-x: auto;
  position: relative;
}
.profile-tab {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 16px;
  border: none; border-radius: 9px;
  background: transparent;
  color: #6B7280;
  font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); font-family: inherit;
  white-space: nowrap;
  position: relative;
  overflow: hidden;
  -webkit-tap-highlight-color: transparent;
}
.profile-tab .tab-icon { width: 18px; height: 18px; flex-shrink: 0; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.profile-tab.active { background: rgba(230, 57, 70, 0.12); color: #E63946; }
.profile-tab.active .tab-icon { transform: scale(1.1); }
.profile-tab:hover:not(.active) { color: #9CA3AF; }
.profile-tab:hover:not(.active) .tab-icon { transform: translateY(-2px); }

.profile-tab::after {
  content: '';
  position: absolute; bottom: 4px; left: 50%;
  width: 0; height: 2px;
  background: #E63946;
  border-radius: 1px;
  transform: translateX(-50%);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.profile-tab.active::after { width: 24px; }

.profile-panel { animation: panelIn 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes panelIn {
  from { opacity: 0; transform: translateY(28px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.profile-card, .details-card, .webauthn-card, .social-card, .consents-card, .activities-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 36px;
  position: relative;
  will-change: transform, box-shadow;
  transition: border-color 0.6s ease, box-shadow 0.6s ease, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.6s ease;
}
.profile-card { grid-column: 1; text-align: center; position: sticky; top: 24px; padding: 36px 28px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }

.profile-card:hover, .details-card:hover, .webauthn-card:hover,
.social-card:hover, .consents-card:hover, .activities-card:hover {
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.03);
}

.avatar-section { position: relative; }
.avatar-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 6px 30px rgba(230, 57, 70, 0.2);
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.6s ease;
  animation: avatarPulse 4s ease-in-out infinite;
  will-change: transform;
}
@keyframes avatarPulse {
  0%, 100% { transform: scale(1); box-shadow: 0 6px 30px rgba(230, 57, 70, 0.2); }
  50% { transform: scale(1.02); box-shadow: 0 6px 40px rgba(230, 57, 70, 0.3); }
}
.avatar-wrapper:hover { transform: scale(1.05); animation: none; box-shadow: 0 8px 40px rgba(230, 57, 70, 0.35); }
.avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
.avatar-wrapper:hover .avatar-img { transform: scale(1.1); }
.avatar-letter {
  width: 120px; height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(230, 57, 70, 0.2), rgba(230, 57, 70, 0.08));
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; font-weight: 700; color: #E63946; margin: 0 auto;
}
.avatar-overlay {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(0,0,0,0.55);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.5s ease; gap: 4px;
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
.avatar-wrapper:hover .avatar-overlay { opacity: 1; }
.camera-icon { width: 24px; height: 24px; color: #fff; transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
.avatar-wrapper:hover .camera-icon { transform: rotate(-15deg) scale(1.1); }
.avatar-overlay span { font-size: 12px; color: #fff; white-space: nowrap; letter-spacing: 0.5px; }

.display-name {
  font-size: 24px; font-weight: 700; color: #F5F5F5; margin-bottom: 6px;
  background: linear-gradient(135deg, #F5F5F5, #9CA3AF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.user-email { font-size: 14px; color: #6B7280; margin-bottom: 20px; }
.role-badge {
  display: inline-block; padding: 6px 18px; border-radius: 50px;
  font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.role-badge:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.role-badge.admin { background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.05)); color: #FCA5A5; border: 1px solid rgba(239,68,68,0.2); }
.role-badge.developer { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.05)); color: #93C5FD; border: 1px solid rgba(59,130,246,0.2); }
.role-badge.user { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05)); color: #6EE7B7; border: 1px solid rgba(16,185,129,0.2); }

.btn-logout {
  width: 100%; margin-top: 28px; padding: 14px;
  background: rgba(239, 68, 68, 0.06);
  border: 1px solid rgba(239, 68, 68, 0.1);
  border-radius: 10px;
  color: #9CA3AF; font-size: 15px; font-weight: 600;
  cursor: pointer; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); font-family: inherit;
  position: relative; overflow: hidden;
}
.btn-logout::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(239,68,68,0.08), transparent);
  opacity: 0; transition: opacity 0.5s ease;
}
.btn-logout:hover::before { opacity: 1; }
.btn-logout:hover {
  background: rgba(239, 68, 68, 0.1); color: #FCA5A5;
  border-color: rgba(239,68,68,0.2); transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(239,68,68,0.1);
}
.btn-logout:active { transform: translateY(0); }

.section-title {
  font-size: 13px; font-weight: 700; color: #7C8290;
  text-transform: uppercase; letter-spacing: 1.5px;
  margin-bottom: 24px;
  display: flex; align-items: center; gap: 10px;
}
.section-title::before {
  content: '';
  display: inline-block;
  width: 4px; height: 18px;
  background: linear-gradient(180deg, #E63946, rgba(230,57,70,0.4));
  border-radius: 2px;
  flex-shrink: 0;
}
.section-title-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.btn-edit { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; background: rgba(230,57,70,0.08); border: 1px solid rgba(230,57,70,0.15); border-radius: 8px; color: #E63946; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-edit:hover { background: rgba(230,57,70,0.12); }

.detail-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: all 0.5s ease;
}
.detail-row:hover {
  padding-left: 10px;
  border-bottom-color: rgba(230,57,70,0.1);
}
.detail-row:last-child { border-bottom: none; }
.detail-row:hover:last-child { border-bottom: none; }
.detail-label { font-size: 15px; color: #6B7280; transition: color 0.5s ease; }
.detail-row:hover .detail-label { color: #9CA3AF; }
.detail-value { font-size: 15px; color: #E5E7EB; font-weight: 600; transition: color 0.5s ease; }
.detail-row:hover .detail-value { color: #fff; }

.empty-state {
  text-align: center; padding: 48px 0;
  position: relative;
}
.empty-state::before {
  content: '☁️';
  display: block;
  font-size: 40px;
  margin-bottom: 12px;
  animation: emptyFloat 3s ease-in-out infinite;
}
@keyframes emptyFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.empty-state p { font-size: 15px; color: #6B7280; }

.totp-setup { margin-top: 20px; padding: 20px; background: rgba(0,0,0,0.15); border-radius: 12px; }
.totp-qr-wrap { display: flex; justify-content: center; margin-bottom: 16px; }
.totp-qr { width: 180px; height: 180px; border-radius: 12px; image-rendering: pixelated; }
.totp-secret-wrap { text-align: center; margin-bottom: 8px; }
.totp-secret-label { font-size: 11px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
.totp-secret-row { display: flex; align-items: center; justify-content: center; gap: 8px; }
.totp-secret { font-size: 14px; color: #93C5FD; font-family: monospace; letter-spacing: 2px; user-select: all; }
.cred-copy { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: #6B7280; cursor: pointer; transition: all 0.3s ease; }
.cred-copy:hover { background: rgba(230,57,70,0.1); border-color: rgba(230,57,70,0.2); color: #E63946; }
.copy-icon { width: 16px; height: 16px; }
.totp-verify-row { display: flex; gap: 10px; }
.totp-enabled { display: flex; align-items: center; gap: 14px; padding: 16px; background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.1); border-radius: 12px; }
.totp-shield { width: 36px; height: 36px; color: #6EE7B7; flex-shrink: 0; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: overlayFade 0.25s ease;
}
@keyframes overlayFade { from { opacity: 0; } to { opacity: 1; } }

.modal {
  background: linear-gradient(145deg, rgba(20, 20, 22, 0.98), rgba(16, 16, 18, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  width: 100%;
  max-width: 520px;
  padding: 0;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: modalSlide 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
@keyframes modalSlide {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 24px 28px 0;
}
.modal-header h4 {
  font-size: 17px; font-weight: 700; color: #F5F5F5; margin: 0;
  letter-spacing: 0.3px;
}
.modal-close {
  width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.04);
  border: none; border-radius: 10px;
  color: #6B7280; font-size: 16px;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}
.modal-close:hover { background: rgba(239,68,68,0.1); color: #FCA5A5; }

.modal-body { padding: 20px 28px 28px; display: flex; flex-direction: column; gap: 16px; }
.modal-footer { display: flex; gap: 12px; padding: 0 28px 24px; }

.btn-cancel {
  padding: 11px 24px; background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
  color: #6B7280; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}
.btn-cancel:hover { background: rgba(255,255,255,0.06); color: #9CA3AF; border-color: rgba(255,255,255,0.1); }

.modal-edit { max-width: 520px !important; }

.verify-methods { display: flex; flex-direction: column; gap: 8px; }
.verify-method-btn {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px;
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 12px;
  color: #9CA3AF;
  font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}
.verify-method-btn:hover {
  border-color: rgba(230,57,70,0.2);
  color: #E5E7EB;
  background: rgba(230,57,70,0.04);
  transform: translateX(4px);
}
.verify-desc { font-size: 14px; color: #6B7280; margin-bottom: 4px; line-height: 1.5; }
.verify-email-hint { font-size: 12px; color: #4B5058; margin-bottom: 8px; }
.verify-code-row { display: flex; gap: 10px; }
.verify-code-input {
  flex: 1; text-align: center; font-size: 24px !important; letter-spacing: 10px;
  font-family: monospace !important; padding: 14px 12px !important;
  background: rgba(0,0,0,0.2) !important;
  border-color: rgba(255,255,255,0.04) !important;
}
.verify-code-input:focus { border-color: rgba(230,57,70,0.3) !important; }

.edit-email-row { display: flex; align-items: center; gap: 10px; }
.edit-email-warn { font-size: 11px; color: #F59E0B; white-space: nowrap; flex-shrink: 0; }
.edit-actions { display: flex; gap: 12px; margin-top: 4px; }

.btn-primary {
  flex: 1; padding: 12px 24px;
  background: rgba(230,57,70,0.1);
  border: 1px solid rgba(230,57,70,0.2);
  border-radius: 10px;
  color: #E63946; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit;
}
.btn-primary:hover { background: rgba(230,57,70,0.15); border-color: rgba(230,57,70,0.3); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-full { width: 100%; margin-top: 4px; }
.btn-send {
  padding: 12px 20px; background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
  color: #6B7280; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.25s ease; font-family: inherit; white-space: nowrap;
}
.btn-send:hover { background: rgba(255,255,255,0.05); color: #9CA3AF; }
.btn-send:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-back {
  background: none; border: none; color: #4B5058; font-size: 12px;
  cursor: pointer; margin-top: 4px; font-family: inherit;
  transition: color 0.25s ease; display: block; width: 100%; text-align: center; padding: 8px;
}
.btn-back:hover { color: #6B7280; }
.vm-icon { width: 20px; height: 20px; flex-shrink: 0; }
.verify-error { font-size: 12px; color: #FCA5A5; text-align: center; }
.verify-passkey-section { text-align: center; }

.btn-register-key {
  padding: 12px 32px;
  background: linear-gradient(135deg, rgba(230,57,70,0.1), rgba(230,57,70,0.05));
  border: 1px solid rgba(230,57,70,0.2);
  border-radius: 10px;
  color: #E63946; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); font-family: inherit;
  position: relative; overflow: hidden;
}
.btn-register-key::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(230,57,70,0.1), transparent);
  opacity: 0; transition: opacity 0.5s ease;
}
.btn-register-key:hover::before { opacity: 1; }
.btn-register-key:hover {
  background: rgba(230,57,70,0.15); box-shadow: 0 6px 24px rgba(230,57,70,0.15);
  transform: translateY(-2px);
}
.btn-register-key:active { transform: translateY(0); }
.btn-register-key:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; transform: none; }

.cred-list, .social-list, .consents-list { display: flex; flex-direction: column; gap: 10px; }

.cred-item, .social-item, .consent-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: itemIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.cred-item:nth-child(1) { animation-delay: 0.04s; }
.cred-item:nth-child(2) { animation-delay: 0.10s; }
.cred-item:nth-child(3) { animation-delay: 0.16s; }
.cred-item:nth-child(4) { animation-delay: 0.22s; }
.cred-item:nth-child(5) { animation-delay: 0.28s; }
.social-item:nth-child(1) { animation-delay: 0.04s; }
.social-item:nth-child(2) { animation-delay: 0.10s; }
.consent-item:nth-child(1) { animation-delay: 0.04s; }
.consent-item:nth-child(2) { animation-delay: 0.10s; }
.consent-item:nth-child(3) { animation-delay: 0.16s; }
.consent-item:nth-child(4) { animation-delay: 0.22s; }
.consent-item:nth-child(5) { animation-delay: 0.28s; }

@keyframes itemIn {
  from { opacity: 0; transform: translateX(-18px) scale(0.95); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

.cred-item:hover, .social-item:hover, .consent-item:hover {
  border-color: rgba(255,255,255,0.08);
  background: rgba(0,0,0,0.22);
  transform: translateX(6px) translateY(-1px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.18);
}

.cred-icon { width: 24px; height: 24px; color: #6B7280; flex-shrink: 0; transition: all 0.5s ease; }
.cred-item:hover .cred-icon { color: #E63946; transform: scale(1.15); }
.cred-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.cred-name { font-size: 16px; font-weight: 600; color: #E5E7EB; transition: color 0.5s ease; }
.cred-item:hover .cred-name { color: #fff; }
.cred-date { font-size: 13px; color: #6B7280; }
.cred-delete {
  padding: 8px 18px; background: transparent;
  border: 1px solid rgba(239,68,68,0.1);
  border-radius: 8px;
  color: #9CA3AF; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); font-family: inherit;
  position: relative; overflow: hidden;
}
.cred-delete::before {
  content: ''; position: absolute; inset: 0;
  background: rgba(239,68,68,0.06);
  opacity: 0; transition: opacity 0.5s ease;
  border-radius: 8px;
}
.cred-delete:hover::before { opacity: 1; }
.cred-delete:hover { background: transparent; color: #FCA5A5; border-color: rgba(239,68,68,0.2); transform: scale(1.03); }
.cred-add-bar { margin-top: 24px; text-align: center; }
.social-bind-btns { margin-top: 24px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.social-provider { font-size: 16px; font-weight: 600; color: #E5E7EB; flex: 1; transition: color 0.5s ease; }
.social-item:hover .social-provider { color: #fff; }
.social-username { font-size: 14px; color: #6B7280; margin-right: 12px; }

.consent-logo { width: 40px; height: 40px; border-radius: 10px; object-fit: contain; flex-shrink: 0; transition: transform 0.5s ease; }
.consent-item:hover .consent-logo { transform: scale(1.08); }
.consent-logo-fallback { width: 40px; height: 40px; color: #6B7280; flex-shrink: 0; transition: all 0.5s ease; }
.consent-item:hover .consent-logo-fallback { transform: scale(1.05); color: #9CA3AF; }
.consent-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.consent-name { font-size: 16px; font-weight: 600; color: #E5E7EB; transition: color 0.5s ease; }
.consent-item:hover .consent-name { color: #fff; }
.consent-scopes { font-size: 13px; color: #6B7280; }

.activities-list { display: flex; flex-direction: column; gap: 4px; max-height: 420px; overflow-y: auto; padding-right: 6px; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.06) transparent; }
.activities-list::-webkit-scrollbar { width: 5px; }
.activities-list::-webkit-scrollbar-track { background: transparent; }
.activities-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.06); border-radius: 3px; transition: background 0.5s ease; }
.activities-list::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }

.activity-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  animation: activityIn 0.6s cubic-bezier(0.4, 0, 0.2, 1) both;
}
.activity-item:nth-child(1) { animation-delay: 0.04s; }
.activity-item:nth-child(2) { animation-delay: 0.08s; }
.activity-item:nth-child(3) { animation-delay: 0.12s; }
.activity-item:nth-child(4) { animation-delay: 0.16s; }
.activity-item:nth-child(5) { animation-delay: 0.20s; }
.activity-item:nth-child(6) { animation-delay: 0.24s; }
.activity-item:nth-child(7) { animation-delay: 0.28s; }
.activity-item:nth-child(8) { animation-delay: 0.32s; }

@keyframes activityIn {
  from { opacity: 0; transform: translateX(-18px) scale(0.95); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

.activity-item:hover {
  background: rgba(255,255,255,0.03);
  transform: translateX(6px);
}
.activity-icon-wrap {
  flex-shrink: 0; width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: rgba(0,0,0,0.15);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.activity-item:hover .activity-icon-wrap {
  background: rgba(0,0,0,0.3);
  transform: scale(1.08);
}
.activity-icon { width: 20px; height: 20px; transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.activity-item:hover .activity-icon { transform: scale(1.15) rotate(-3deg); }
.activity-icon.login { color: #6EE7B7; }
.activity-icon.logout { color: #FCA5A5; }
.activity-icon.register { color: #93C5FD; }
.activity-icon.password { color: #FCD34D; }
.activity-icon.passkey { color: #A78BFA; }
.activity-icon.avatar { color: #6EE7B7; }
.activity-icon.social { color: #93C5FD; }
.activity-icon.revoke { color: #FCA5A5; }
.activity-icon.default { color: #6B7280; }
.activity-info { flex: 1; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.activity-action { font-size: 15px; font-weight: 600; color: #E5E7EB; transition: color 0.5s ease; }
.activity-item:hover .activity-action { color: #fff; }
.activity-detail { font-size: 13px; color: #6B7280; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.activity-time { font-size: 13px; color: #4B5058; white-space: nowrap; flex-shrink: 0; }

@media (max-width: 700px) {
  .profile-grid { grid-template-columns: 1fr; }
  .profile-card { grid-column: 1; position: static; }
  .profile-right { grid-column: 1; }
  .profile-tabs { overflow-x: auto; gap: 2px; padding: 3px; }
  .profile-tab { flex: 0 0 auto; padding: 10px 14px; font-size: 13px; }
  .profile-tab .tab-icon { display: none; }
  .profile-container { padding: 0 16px 60px; }
  .profile-card, .details-card, .webauthn-card, .social-card, .consents-card, .activities-card { padding: 24px 20px; }
}
</style>
