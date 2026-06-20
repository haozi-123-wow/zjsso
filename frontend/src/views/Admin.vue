<template>
  <div v-if="!auth.isLoggedIn" class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">ADMIN</span>
        <h1 class="page-title">管理后台</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">请先登录</p>
      </div>
    </div>
    <div class="auth-container">
      <div class="auth-card" style="text-align:center;padding:60px 44px">
        <p style="color:#6B7280;margin-bottom:20px">需要管理员权限</p>
        <a href="#/login" class="auth-link" style="color:#E63946;font-size:15px;font-weight:600">前往登录 →</a>
      </div>
    </div>
  </div>

  <div v-else-if="!isAdmin" class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">ADMIN</span>
        <h1 class="page-title">管理后台</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">需要管理员权限</p>
      </div>
    </div>
    <div class="auth-container">
      <div class="auth-card" style="text-align:center;padding:60px 44px">
        <p style="color:#6B7280;margin-bottom:20px">当前角色为 <strong>{{ auth.user?.role }}</strong>，无权访问管理后台</p>
        <a href="#/profile" class="auth-link" style="color:#E63946;font-size:15px;font-weight:600">返回个人中心 →</a>
      </div>
    </div>
  </div>

  <div v-else class="auth-page">
    <div class="page-header">
      <div class="header-glow"></div>
      <div class="header-content">
        <span class="page-tag">ADMIN</span>
        <h1 class="page-title">管理后台</h1>
        <div class="title-line"></div>
        <p class="page-subtitle">ADMIN PANEL</p>
      </div>
    </div>

    <div class="admin-container">
      <div class="admin-tabs">
        <button :class="['admin-tab', { active: tab === 'overview' }]" @click="tab = 'overview'">概览</button>
        <button :class="['admin-tab', { active: tab === 'clients' }]" @click="tab = 'clients'">客户端管理</button>
        <button v-if="auth.user?.role === 'admin'" :class="['admin-tab', { active: tab === 'users' }]" @click="tab = 'users'">用户管理</button>
        <button v-if="auth.user?.role === 'admin'" :class="['admin-tab', { active: tab === 'groups' }]" @click="tab = 'groups'">用户组</button>
      </div>

      <div v-if="tab === 'overview'" class="admin-section">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon stat-icon-users">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.userCount }}</span>
              <span class="stat-label">注册用户</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-clients">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.clientCount }}</span>
              <span class="stat-label">OIDC 客户端</span>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon stat-icon-keys">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.credentialCount }}</span>
              <span class="stat-label">通行密钥</span>
            </div>
          </div>
        </div>

        <div class="quick-links">
          <h3 class="section-title">快捷操作</h3>
          <div class="quick-grid">
            <button class="quick-btn" @click="tab = 'clients'; showClientForm = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
              新建客户端
            </button>
            <button v-if="auth.user?.role === 'admin'" class="quick-btn" @click="tab = 'users'; showUserForm = true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              创建用户
            </button>
            <a href="#/profile" class="quick-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              个人中心
            </a>
          </div>
        </div>

        <div v-if="auth.user?.role !== 'admin'" class="role-notice">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="notice-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span>当前为开发者角色，仅可管理自己创建的客户端。用户管理功能仅管理员可用。</span>
        </div>
      </div>

      <div v-if="tab === 'clients'" class="admin-section">
        <div class="section-header">
          <h3 class="section-title">OIDC 客户端</h3>
          <div class="header-actions">
            <label class="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="clientSearch" class="search-input" placeholder="搜索客户端..." />
            </label>
            <button class="btn-add" @click="showClientForm = true; editingClient = null">新建客户端</button>
          </div>
        </div>

        <div class="modal-overlay" v-if="showClientForm || editingClient" @click.self="cancelClientForm">
          <div class="modal">
            <div class="modal-header">
              <h4>{{ editingClient ? '编辑客户端' : '新建客户端' }}</h4>
              <div class="header-right">
                <button class="btn-help" @click.stop="showHelp = true" title="字段说明帮助">?</button>
                <button class="modal-close" @click="cancelClientForm">&times;</button>
              </div>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">应用名称 *</label>
                <input v-model="clientForm.client_name" class="form-input" placeholder="如：My App" />
              </div>
              <div class="form-group">
                <label class="form-label">应用描述</label>
                <textarea v-model="clientForm.client_description" class="form-input" placeholder="应用用途说明" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label class="form-label">应用图标</label>
                <div class="logo-upload">
                  <div v-if="logoPreview" class="logo-preview-wrap">
                    <img :src="logoPreview" class="logo-preview" alt="应用图标" />
                    <button class="logo-remove" @click="removeLogo" title="移除图标">&times;</button>
                  </div>
                  <div class="logo-upload-actions">
                    <label class="btn-upload">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      <span>{{ logoUploading ? '上传中...' : (logoPreview ? '更换图标' : '上传图标') }}</span>
                      <input type="file" accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp" class="file-input" @change="uploadLogo" :disabled="logoUploading" />
                    </label>
                    <span class="logo-hint">支持 PNG/JPG/GIF/SVG/Wep，最大 2MB</span>
                  </div>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">回调地址 *</label>
                <div v-for="(uri, i) in clientForm.redirect_uris" :key="i" class="uri-row">
                  <input v-model="clientForm.redirect_uris[i]" class="form-input" placeholder="https://myapp.com/callback" />
                  <button v-if="clientForm.redirect_uris.length > 1" class="btn-remove-uri" @click="clientForm.redirect_uris.splice(i, 1)">&times;</button>
                </div>
                <button class="btn-add-uri" @click="clientForm.redirect_uris.push('')">+ 添加回调地址</button>
              </div>
              <div class="form-group">
                <label class="form-label">登出回调地址</label>
                <div v-for="(uri, i) in clientForm.post_logout_redirect_uris" :key="i" class="uri-row">
                  <input v-model="clientForm.post_logout_redirect_uris[i]" class="form-input" placeholder="https://myapp.com/logout" />
                  <button v-if="clientForm.post_logout_redirect_uris.length > 1" class="btn-remove-uri" @click="clientForm.post_logout_redirect_uris.splice(i, 1)">&times;</button>
                </div>
                <button class="btn-add-uri" @click="clientForm.post_logout_redirect_uris.push('')">+ 添加登出回调地址</button>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">认证方式</label>
                  <select v-model="clientForm.token_endpoint_auth_method" class="form-input">
                    <option value="client_secret_basic">client_secret_basic</option>
                    <option value="client_secret_post">client_secret_post</option>
                    <option value="none">none（公开客户端）</option>
                  </select>
                </div>
                <div class="form-group" style="flex:1">
                  <label class="form-label">授权类型</label>
                  <div class="checkbox-group">
                    <label class="checkbox-label"><input type="checkbox" value="authorization_code" v-model="clientForm.grant_types" /> authorization_code</label>
                    <label class="checkbox-label"><input type="checkbox" value="refresh_token" v-model="clientForm.grant_types" /> refresh_token</label>
                    <label class="checkbox-label"><input type="checkbox" value="client_credentials" v-model="clientForm.grant_types" /> client_credentials</label>
                  </div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">Token 端点认证方式</label>
                  <label class="checkbox-label" style="padding-top:6px">
                    <input type="checkbox" v-model="clientForm.pkce_required" /> 强制 PKCE
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">允许访问的用户组</label>
                <div class="checkbox-group" style="max-height:160px;overflow-y:auto;padding:8px;background:rgba(0,0,0,0.2);border-radius:6px">
                  <p v-if="allGroups.length === 0" style="color:#4B5058;font-size:12px;margin:0">暂无用户组（不勾选 = 允许所有用户访问）</p>
                  <label v-for="g in allGroups" :key="g.id" class="checkbox-label">
                    <input type="checkbox" :value="g.id" v-model="clientForm.allowed_groups" /> {{ g.name }}
                  </label>
                </div>
                <span style="font-size:11px;color:#6B7280;margin-top:4px">不勾选任何组 = 不限制；勾选后仅这些组中的用户可登录</span>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="cancelClientForm">取消</button>
              <button class="btn-submit" style="flex:1" @click="editingClient ? updateClient() : createClient()">
                {{ editingClient ? '保存修改' : '创建客户端' }}
              </button>
            </div>
          </div>
        </div>

        <div class="modal-overlay" v-if="showHelp" @click.self="showHelp = false">
          <div class="modal modal-help">
            <div class="modal-header">
              <h4>客户端字段说明</h4>
              <button class="modal-close" @click="showHelp = false">&times;</button>
            </div>
            <div class="modal-body">
              <div class="help-section">
                <div class="help-item">
                  <div class="help-term">
                    <span class="help-badge required">必填</span>
                    <strong>应用名称</strong>
                    <code class="help-code">client_name</code>
                  </div>
                  <p class="help-desc">你的应用的显示名称。用户在授权页面同意授权时，会看到这个名称。建议使用你的应用完整名称，如 "我的博客系统"、"公司内部 CRM" 等。</p>
                </div>

                <div class="help-item">
                  <div class="help-term">
                    <strong>应用描述</strong>
                    <code class="help-code">client_description</code>
                  </div>
                  <p class="help-desc">应用的用途说明，方便自己在管理后台中识别不同客户端。不会展示给最终用户。</p>
                </div>

                <div class="help-item">
                  <div class="help-term">
                    <span class="help-badge required">必填</span>
                    <strong>回调地址</strong>
                    <code class="help-code">redirect_uris</code>
                  </div>
                  <p class="help-desc">授权完成后，用户将被重定向到这个地址。必须填写你的应用中用于接收 OIDC 回调的完整 URL（含协议和路径）。可以添加多个地址以支持不同的环境（如开发、生产）。</p>
                  <div class="help-example">
                    <div class="example-label">示例：</div>
                    <code>https://myapp.com/api/auth/callback</code>
                    <code>http://localhost:8080/callback</code>
                  </div>
                  <div class="help-note">安全提示：只填写你信任的、属于你自己的应用的地址。地址中的域名/端口需与最终用户访问的一致。</div>
                </div>

                <div class="help-item">
                  <div class="help-term">
                    <strong>登出回调地址</strong>
                    <code class="help-code">post_logout_redirect_uris</code>
                  </div>
                  <p class="help-desc">用户从此 SSO 系统登出后，将被重定向到的地址。与回调地址类似，可以添加多个。如果不需要登出重定向功能，可以不填。</p>
                  <div class="help-note">与回调地址的区别：回调地址是登录/授权成功后跳转，登出回调地址是登出后跳转。</div>
                </div>

                <div class="help-item">
                  <div class="help-term">
                    <strong>认证方式</strong>
                    <code class="help-code">token_endpoint_auth_method</code>
                  </div>
                  <p class="help-desc">指定客户端在调用 Token 端点获取令牌时，如何证明自己的身份。三种方式的区别：</p>
                  <div class="help-options">
                    <div class="help-option">
                      <code>client_secret_basic</code>
                      <span>（推荐）使用 HTTP Basic Auth 方式，将 Client ID 和 Client Secret 放在请求头的 Authorization 字段中。标准安全，适用于绝大部分后端应用。</span>
                    </div>
                    <div class="help-option">
                      <code>client_secret_post</code>
                      <span>将 Client ID 和 Client Secret 放在请求体（POST body）中发送。兼容性更好但安全性略低于 Basic 方式。</span>
                    </div>
                    <div class="help-option">
                      <code>none（公开客户端）</code>
                      <span>不需要 Client Secret，适用于纯前端应用（SPA、移动端 App）。必须配合 PKCE 使用以保证安全。</span>
                    </div>
                  </div>
                </div>

                <div class="help-item">
                  <div class="help-term">
                    <strong>授权类型</strong>
                    <code class="help-code">grant_types</code>
                  </div>
                  <p class="help-desc">指定客户端允许使用的 OAuth 2.0 / OIDC 授权流程。可多选：</p>
                  <div class="help-options">
                    <div class="help-option">
                      <code>authorization_code</code>
                      <span>（最常用）授权码模式。客户端先获取授权码（authorization code），再用授权码换取令牌。支持完整的 OIDC 流程。适用于有后端服务器的应用、SPA（配合 PKCE）、移动应用（配合 PKCE）。</span>
                    </div>
                    <div class="help-option">
                      <code>refresh_token</code>
                      <span>允许客户端使用 refresh token 自动刷新 access token，无需用户重新登录。通常与 authorization_code 配合使用。如果应用需要长时间运行（如后台服务），建议勾选此项。</span>
                    </div>
                    <div class="help-option">
                      <code>client_credentials</code>
                      <span>客户端凭证模式。客户端直接使用自己的 Client ID 和 Client Secret 获取令牌，不需要用户参与。适用于 M2M（机器对机器）场景，如定时任务、后台服务调用 API。</span>
                    </div>
                  </div>
                  <div class="help-recommend">推荐：后端 Web 应用勾选 <strong>authorization_code + refresh_token</strong>；纯前端 SPA 勾选 <strong>authorization_code + refresh_token</strong> 并配合 PKCE；服务端 API 勾选 <strong>client_credentials</strong>。</div>
                </div>

                <div class="help-item">
                  <div class="help-term">
                    <span class="help-badge new">可选</span>
                    <strong>强制 PKCE</strong>
                    <code class="help-code">pkce_required</code>
                  </div>
                  <p class="help-desc">PKCE（Proof Key for Code Exchange）是一种增强安全性的机制，防止授权码被拦截后被盗用。启用后，客户端在授权码流程中必须使用 code_challenge 和 code_verifier。</p>
                  <div class="help-note">如果选择了 <code>none（公开客户端）</code> 认证方式，系统会自动强制要求 PKCE。对于有后端服务器的常规应用，打开此选项可以增加一层安全保障。</div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-submit" style="flex:1" @click="showHelp = false">知道了</button>
            </div>
          </div>
        </div>

        <div class="modal-overlay" v-if="showCreatedModal" @click.self="showCreatedModal = false">
          <div class="modal modal-credentials">
            <div class="modal-header">
              <h4>{{ credModalTitle }}</h4>
              <button class="modal-close" @click="showCreatedModal = false">&times;</button>
            </div>
            <div class="modal-body">
              <div class="cred-warning">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="warn-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>请妥善保管 Client Secret，关闭后将不再完整显示。</span>
              </div>
              <div class="cred-field">
                <label class="cred-label">Client ID</label>
                <div class="cred-value-row">
                  <code class="cred-code">{{ createdClientData.client_id }}</code>
                  <button class="cred-copy" @click="copyText(createdClientData.client_id)" title="复制 Client ID">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </div>
              <div v-if="createdClientData.client_secret" class="cred-field">
                <label class="cred-label">Client Secret</label>
                <div class="cred-value-row">
                  <code class="cred-code cred-secret">{{ createdClientData.client_secret }}</code>
                  <button class="cred-copy" @click="copyText(createdClientData.client_secret)" title="复制 Client Secret">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="copy-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="showCreatedModal = false">关闭</button>
              <button class="btn-submit" style="flex:1" @click="showCreatedModal = false">我已保存</button>
            </div>
          </div>
        </div>

        <div v-if="filteredClients.length === 0" class="empty"><p>暂无客户端，点击上方按钮创建一个</p></div>

        <div v-for="c in filteredClients" :key="c.id" class="client-card">
          <div class="client-main">
            <div class="client-info">
              <div class="client-name-row">
                <img v-if="c.logo_uri" :src="c.logo_uri" class="client-logo-sm" alt="" />
                <h4 class="client-name">{{ c.client_name }}</h4>
              </div>
              <p v-if="c.client_description" class="client-desc">{{ c.client_description }}</p>
              <div class="client-meta">
                <span class="meta-tag">{{ c.token_endpoint_auth_method }}</span>
                <span v-if="c.pkce_required" class="meta-tag meta-pkce">PKCE</span>
                <span :class="['meta-tag', c.enabled ? 'meta-enabled' : 'meta-disabled']">{{ c.enabled ? '启用' : '禁用' }}</span>
              </div>
              <div class="client-uris">
                <span v-for="uri in c.redirect_uris" :key="uri" class="uri-badge">{{ uri }}</span>
              </div>
              <div class="client-id-display">
                <span class="id-label">Client ID:</span>
                <code class="id-value">{{ c.client_id }}</code>
                <button class="btn-copy" @click="copyText(c.client_id)" title="复制">📋</button>
              </div>
              <div class="client-time">创建于 {{ new Date(c.created_at).toLocaleString() }}</div>
            </div>
            <div class="client-actions">
              <button class="btn-table btn-edit" @click="editClient(c)">编辑</button>
              <button class="btn-table btn-warn" @click="resetClientSecret(c)">重置 Secret</button>
              <button class="btn-table btn-danger" @click="deleteClient(c.id)">删除</button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="tab === 'users'" class="admin-section">
        <div class="section-header">
          <h3 class="section-title">用户管理 <span class="title-count">({{ stats.userCount }})</span></h3>
          <div class="header-actions">
            <label class="search-input-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="userSearch" class="search-input" placeholder="搜索用户名/邮箱..." @input="debouncedSearchUsers" />
            </label>
            <button class="btn-add" @click="showUserForm = true; editingUser = null">创建用户</button>
          </div>
        </div>

        <div class="modal-overlay" v-if="showUserForm || editingUser" @click.self="cancelUserForm">
          <div class="modal">
            <div class="modal-header">
              <h4>{{ editingUser ? '编辑用户' : '创建用户' }}</h4>
              <button class="modal-close" @click="cancelUserForm">&times;</button>
            </div>
            <div class="modal-body">
              <div v-if="!editingUser">
                <div class="form-group">
                  <label class="form-label">用户名 *</label>
                  <input v-model="userForm.username" class="form-input" placeholder="3-50字符，字母数字下划线" />
                </div>
                <div class="form-group">
                  <label class="form-label">邮箱 *</label>
                  <input v-model="userForm.email" class="form-input" placeholder="user@example.com" />
                </div>
              </div>
              <div v-else class="user-edit-info">
                <div class="info-row"><span class="info-label">用户名</span><span>{{ editingUser.username }}</span></div>
                <div class="info-row"><span class="info-label">邮箱</span><span>{{ editingUser.email }}</span></div>
                <div class="info-row"><span class="info-label">注册时间</span><span>{{ new Date(editingUser.created_at).toLocaleString() }}</span></div>
                <div class="info-row" v-if="editingUser.last_login_at"><span class="info-label">最后登录</span><span>{{ new Date(editingUser.last_login_at).toLocaleString() }}</span></div>
              </div>
              <div class="form-group">
                <label class="form-label">{{ editingUser ? '新密码（留空不修改）' : '密码 *' }}</label>
                <input v-model="userForm.password" type="password" class="form-input" :placeholder="editingUser ? '留空则不修改密码' : '至少8位'" :minlength="editingUser ? 0 : 8" />
              </div>
              <div class="form-group">
                <label class="form-label">显示名称</label>
                <input v-model="userForm.display_name" class="form-input" placeholder="选填" />
              </div>
              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">QQ号</label>
                  <input v-model="userForm.qq" class="form-input" placeholder="QQ号码" />
                </div>
                <div class="form-group" style="flex:1">
                  <label class="form-label">手机号</label>
                  <input v-model="userForm.phone" class="form-input" placeholder="手机号码" />
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="flex:1">
                  <label class="form-label">角色</label>
                  <select v-model="userForm.role" class="form-input">
                    <option value="user">普通用户</option>
                    <option value="developer">开发者</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <div class="form-group" style="flex:1">
                  <label class="form-label">状态</label>
                  <label class="checkbox-label" style="padding-top:6px">
                    <input type="checkbox" v-model="userForm.enabled" /> 启用
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">邮箱验证</label>
                <label class="checkbox-label">
                  <input type="checkbox" v-model="userForm.email_verified" /> 邮箱已验证
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="cancelUserForm">取消</button>
              <button class="btn-submit" style="flex:1" @click="editingUser ? updateUser() : createUser()">
                {{ editingUser ? '保存修改' : '创建用户' }}
              </button>
            </div>
          </div>
        </div>

        <div class="data-table" v-if="users.length > 0">
          <div class="table-header">
            <span class="th-name">用户</span>
            <span class="th-email">邮箱</span>
            <span class="th-qq">QQ号</span>
            <span class="th-role">角色</span>
            <span class="th-status">状态</span>
            <span class="th-login">最后登录</span>
            <span class="th-actions">操作</span>
          </div>
          <div v-for="u in displayedUsers" :key="u.id" class="table-row">
            <span class="th-name">
              <span class="user-avatar-sm">{{ (u.display_name || u.username).charAt(0).toUpperCase() }}</span>
              <span class="user-name-text">{{ u.display_name || u.username }}</span>
            </span>
            <span class="th-email">{{ u.email }}</span>
            <span class="th-qq">{{ u.qq || '-' }}</span>
            <span class="th-role">
              <span :class="['role-tag', u.role]">{{ u.role }}</span>
            </span>
            <span class="th-status">
              <span :class="['status-dot', u.enabled ? 'active' : 'inactive']"></span>
              {{ u.enabled ? '启用' : '禁用' }}
            </span>
            <span class="th-login">{{ u.last_login_at ? new Date(u.last_login_at).toLocaleString() : '-' }}</span>
            <span class="th-actions">
              <button class="btn-table btn-edit" @click="editUser(u)">编辑</button>
              <button :class="['btn-table', u.enabled ? 'btn-warn' : 'btn-success']" @click="toggleUserStatus(u)">
                {{ u.enabled ? '禁用' : '启用' }}
              </button>
              <button class="btn-table btn-danger" @click="deleteUser(u)" :disabled="u.id === auth.user?.id">删除</button>
            </span>
          </div>
        </div>
        <div v-else class="empty"><p>{{ userSearch ? '未找到匹配的用户' : '暂无用户数据' }}</p></div>

        <div class="pagination" v-if="totalUsers > pageSize">
          <button class="page-btn" :disabled="currentPage <= 1" @click="currentPage--; loadUsers()">上一页</button>
          <span class="page-info">第 {{ currentPage }} / {{ Math.ceil(totalUsers / pageSize) }} 页（共 {{ totalUsers }} 条）</span>
          <button class="page-btn" :disabled="currentPage >= Math.ceil(totalUsers / pageSize)" @click="currentPage++; loadUsers()">下一页</button>
        </div>
      </div>

      <div v-if="tab === 'groups'" class="admin-section">
        <div class="section-header">
          <h3 class="section-title">用户组 <span class="title-count">({{ groups.length }})</span></h3>
          <div class="header-actions">
            <button class="btn-add" @click="openGroupCreate">新建用户组</button>
          </div>
        </div>

        <!-- 组编辑/创建模态框 -->
        <div class="modal-overlay" v-if="showGroupForm" @click.self="cancelGroupForm">
          <div class="modal">
            <div class="modal-header">
              <h4>{{ editingGroup ? '编辑用户组' : '创建用户组' }}</h4>
              <button class="modal-close" @click="cancelGroupForm">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">组名称 *</label>
                <input v-model="groupForm.name" class="form-input" placeholder="如：内网用户、外包人员" />
              </div>
              <div class="form-group">
                <label class="form-label">组描述</label>
                <textarea v-model="groupForm.description" class="form-input" rows="3" placeholder="选填，描述组用途"></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="cancelGroupForm">取消</button>
              <button class="btn-submit" style="flex:1" @click="editingGroup ? updateGroup() : createGroup()">
                {{ editingGroup ? '保存修改' : '创建' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 组成员管理模态框 -->
        <div class="modal-overlay" v-if="showGroupMembers" @click.self="closeGroupMembers">
          <div class="modal modal-help">
            <div class="modal-header">
              <h4>成员管理 - {{ groupMembersOf?.name }}</h4>
              <button class="modal-close" @click="closeGroupMembers">&times;</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">添加用户</label>
                <select v-model="userToAdd" class="form-input">
                  <option value="">选择用户...</option>
                  <option v-for="u in availableUsersToAdd" :key="u.id" :value="u.id">
                    {{ u.username }} ({{ u.email }})
                  </option>
                </select>
                <button class="btn-submit" style="margin-top:8px" :disabled="!userToAdd" @click="addUserToGroup">添加到组</button>
              </div>
              <div class="form-group">
                <label class="form-label">当前成员 ({{ groupMembersOf?.users?.length || 0 }})</label>
                <div v-if="groupMembersOf && groupMembersOf.users && groupMembersOf.users.length > 0" style="display:flex;flex-direction:column;gap:6px">
                  <div v-for="m in groupMembersOf.users" :key="m.id" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:rgba(0,0,0,0.2);border-radius:6px">
                    <span style="font-size:13px;color:#E5E7EB">{{ m.username }} <span style="color:#6B7280;font-size:11px">({{ m.email }})</span></span>
                    <button class="btn-table btn-danger" @click="removeUserFromGroup(m.id)">移除</button>
                  </div>
                </div>
                <p v-else style="color:#6B7280;font-size:13px;margin:0">该组暂无成员</p>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn-cancel" @click="closeGroupMembers">关闭</button>
            </div>
          </div>
        </div>

        <div class="data-table" v-if="groups.length > 0">
          <div class="table-header" style="grid-template-columns:1fr 2fr 1fr 1.5fr">
            <span>组名称</span>
            <span>描述</span>
            <span>成员数</span>
            <span>操作</span>
          </div>
          <div v-for="g in groups" :key="g.id" class="table-row" style="grid-template-columns:1fr 2fr 1fr 1.5fr">
            <span style="font-weight:600;color:#E5E7EB">{{ g.name }}</span>
            <span style="color:#9CA3AF">{{ g.description || '-' }}</span>
            <span style="color:#9CA3AF">{{ g.user_count || 0 }}</span>
            <span class="th-actions">
              <button class="btn-table btn-edit" @click="openGroupMembers(g)">成员</button>
              <button class="btn-table btn-edit" @click="editGroup(g)">编辑</button>
              <button class="btn-table btn-danger" @click="deleteGroup(g)">删除</button>
            </span>
          </div>
        </div>
        <div v-else class="empty"><p>暂无用户组，点击"新建用户组"开始创建</p></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { apiGet, apiPost, apiPut, apiDelete, API_BASE, getAccessToken } from '@/utils/api'

const router = useRouter()
const auth = useAuthStore()

const isAdmin = computed(() => auth.user?.role === 'admin' || auth.user?.role === 'developer')

const tab = ref('overview')

const stats = reactive({ userCount: 0, clientCount: 0, credentialCount: 0 })

const clients = ref<any[]>([])
const clientSearch = ref('')
const showClientForm = ref(false)
const editingClient = ref<any>(null)
const showHelp = ref(false)
const logoUploading = ref(false)
const logoPreview = ref<string | null>(null)
const showCreatedModal = ref(false)
const createdClientData = ref<any>({})
const credModalTitle = ref('')
const clientForm = reactive({
  client_name: '',
  client_description: '',
  redirect_uris: [''],
  post_logout_redirect_uris: [''],
  grant_types: ['authorization_code', 'refresh_token'],
  response_types: ['code'],
  token_endpoint_auth_method: 'client_secret_basic',
  pkce_required: false,
  allowed_groups: [] as string[]
})

const filteredClients = computed(() => {
  if (!clientSearch.value) return clients.value
  const q = clientSearch.value.toLowerCase()
  return clients.value.filter(c =>
    c.client_name.toLowerCase().includes(q) ||
    c.client_id.toLowerCase().includes(q) ||
    (c.client_description || '').toLowerCase().includes(q)
  )
})

const users = ref<any[]>([])
const userSearch = ref('')
const showUserForm = ref(false)
const editingUser = ref<any>(null)
const userForm = reactive({
  username: '', email: '', password: '', display_name: '',
  qq: '', phone: '', email_verified: false,
  role: 'user', enabled: true
})

const currentPage = ref(1)
const totalUsers = ref(0)
const pageSize = 20
let searchTimer: any = null

const displayedUsers = computed(() => users.value)

// 用户组状态
const groups = ref<any[]>([])
const allGroups = ref<any[]>([])
const showGroupForm = ref(false)
const editingGroup = ref<any>(null)
const groupForm = reactive({ name: '', description: '' })
const showGroupMembers = ref(false)
const groupMembersOf = ref<any>(null)
const userToAdd = ref('')

const availableUsersToAdd = computed(() => {
  if (!groupMembersOf.value || !users.value) return []
  const memberIds = new Set((groupMembersOf.value.users || []).map((u: any) => u.id))
  return users.value.filter(u => !memberIds.has(u.id))
})

function debouncedSearchUsers() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 400)
}

async function loadStats() {
  try {
    const usersRes = await apiGet('/api/users?limit=1')
    stats.userCount = usersRes.total || 0
  } catch {}
  try {
    const clientsRes = await apiGet('/api/clients')
    stats.clientCount = clientsRes.total || 0
  } catch {}
  try {
    const credRes = await apiGet('/api/webauthn/credentials')
    stats.credentialCount = credRes.credentials?.length || 0
  } catch {}
}

async function loadClients() {
  try {
    const data = await apiGet('/api/clients')
    clients.value = data.clients || []
  } catch { clients.value = [] }
}

async function loadUsers() {
  if (auth.user?.role !== 'admin') return
  try {
    const offset = (currentPage.value - 1) * pageSize
    let url = `/api/users?limit=${pageSize}&offset=${offset}`
    if (userSearch.value) url += `&search=${encodeURIComponent(userSearch.value)}`
    const data = await apiGet(url)
    users.value = data.users || []
    totalUsers.value = data.total || 0
  } catch { users.value = [] }
}

function cancelClientForm() {
  showClientForm.value = false
  editingClient.value = null
  logoPreview.value = null
  clientForm.client_name = ''
  clientForm.client_description = ''
  clientForm.redirect_uris = ['']
  clientForm.post_logout_redirect_uris = ['']
  clientForm.grant_types = ['authorization_code', 'refresh_token']
  clientForm.response_types = ['code']
  clientForm.token_endpoint_auth_method = 'client_secret_basic'
  clientForm.pkce_required = false
  clientForm.allowed_groups = []
}

function editClient(c: any) {
  editingClient.value = c
  clientForm.client_name = c.client_name
  clientForm.client_description = c.client_description || ''
  clientForm.redirect_uris = [...(c.redirect_uris || [''])]
  clientForm.post_logout_redirect_uris = [...(c.post_logout_redirect_uris || [''])]
  clientForm.grant_types = [...(c.grant_types || ['authorization_code'])]
  clientForm.response_types = [...(c.response_types || ['code'])]
  clientForm.token_endpoint_auth_method = c.token_endpoint_auth_method
  clientForm.pkce_required = c.pkce_required
  clientForm.allowed_groups = Array.isArray(c.allowed_groups) ? [...c.allowed_groups] : []
  logoPreview.value = c.logo_uri || null
  showClientForm.value = true
}

async function createClient() {
  if (!clientForm.client_name || !clientForm.redirect_uris[0]) {
    alert('请填写应用名称和回调地址'); return
  }
  try {
    const data = await apiPost('/api/clients/register', {
      client_name: clientForm.client_name,
      client_description: clientForm.client_description,
      redirect_uris: clientForm.redirect_uris.filter(Boolean),
      post_logout_redirect_uris: clientForm.post_logout_redirect_uris.filter(Boolean),
      grant_types: clientForm.grant_types,
      response_types: clientForm.response_types,
      token_endpoint_auth_method: clientForm.token_endpoint_auth_method,
      pkce_required: clientForm.pkce_required,
      allowed_groups: clientForm.allowed_groups.length > 0 ? clientForm.allowed_groups : null
    })
    if (data.client_id) {
      clients.value.unshift(data)
      cancelClientForm()
      stats.clientCount++
      createdClientData.value = data
      credModalTitle.value = '客户端创建成功'
      showCreatedModal.value = true
    } else {
      alert(data.message || '创建失败')
    }
  } catch { alert('创建失败') }
}

async function updateClient() {
  if (!editingClient.value) return
  try {
    const data = await apiPut(`/api/clients/${editingClient.value.id}`, {
      client_name: clientForm.client_name,
      client_description: clientForm.client_description,
      redirect_uris: clientForm.redirect_uris.filter(Boolean),
      post_logout_redirect_uris: clientForm.post_logout_redirect_uris.filter(Boolean),
      grant_types: clientForm.grant_types,
      response_types: clientForm.response_types,
      token_endpoint_auth_method: clientForm.token_endpoint_auth_method,
      pkce_required: clientForm.pkce_required,
      allowed_groups: clientForm.allowed_groups.length > 0 ? clientForm.allowed_groups : null
    })
    if (data && data.id) {
      const idx = clients.value.findIndex(c => c.id === editingClient.value.id)
      if (idx >= 0) clients.value[idx] = data
      cancelClientForm()
    } else {
      alert((data && data.message) || '更新失败')
    }
  } catch { alert('更新失败') }
}

async function deleteClient(id: string) {
  if (!confirm('确定删除此客户端吗？此操作不可撤销。')) return
  try {
    await apiDelete(`/api/clients/${id}`)
    clients.value = clients.value.filter(c => c.id !== id)
    stats.clientCount--
  } catch (e: any) {
    alert((e && e.message) || '删除失败')
  }
}

async function resetClientSecret(c: any) {
  if (!confirm(`确定要重置 "${c.client_name}" 的 Client Secret 吗？\n\n重置后，使用旧 Secret 的应用将立即无法获取令牌。`)) return
  try {
    const res = await fetch(`${API_BASE}/api/clients/${c.id}/reset-secret`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getAccessToken()}` },
      credentials: 'include'
    })
    const data = await res.json()
    if (res.ok && data.client_secret) {
      createdClientData.value = data
      credModalTitle.value = 'Client Secret 已重置'
      showCreatedModal.value = true
    } else {
      alert(data.message || '重置失败')
    }
  } catch { alert('重置失败') }
}

function cancelUserForm() {
  showUserForm.value = false
  editingUser.value = null
  userForm.username = ''
  userForm.email = ''
  userForm.password = ''
  userForm.display_name = ''
  userForm.qq = ''
  userForm.phone = ''
  userForm.email_verified = false
  userForm.role = 'user'
  userForm.enabled = true
}

function editUser(u: any) {
  editingUser.value = u
  userForm.password = ''
  userForm.display_name = u.display_name || ''
  userForm.qq = u.qq || ''
  userForm.phone = u.phone || ''
  userForm.email_verified = !!u.email_verified
  userForm.role = u.role
  userForm.enabled = u.enabled
  showUserForm.value = true
}

async function createUser() {
  if (!userForm.username || !userForm.email || !userForm.password) {
    alert('用户名、邮箱和密码为必填项'); return
  }
  try {
    const data = await apiPost('/api/users', {
      username: userForm.username,
      email: userForm.email,
      password: userForm.password,
      display_name: userForm.display_name,
      role: userForm.role,
      enabled: userForm.enabled
    })
    if (data.id) {
      users.value.unshift(data)
      cancelUserForm()
      stats.userCount++
      alert('用户创建成功！')
    } else {
      alert(data.message || '创建失败')
    }
  } catch { alert('创建失败') }
}

async function updateUser() {
  if (!editingUser.value) return
  try {
    const body: any = {
      display_name: userForm.display_name,
      qq: userForm.qq,
      phone: userForm.phone,
      email_verified: userForm.email_verified,
      role: userForm.role,
      enabled: userForm.enabled
    }
    if (userForm.password) body.password = userForm.password

    const res = await fetch(`${API_BASE}/api/users/${editingUser.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(body),
      credentials: 'include'
    })
    const data = await res.json()
    if (res.ok) {
      const idx = users.value.findIndex(u => u.id === editingUser.value.id)
      if (idx >= 0) users.value[idx] = { ...users.value[idx], ...data }
      cancelUserForm()
    } else {
      alert(data.message || '更新失败')
    }
  } catch { alert('更新失败') }
}

function toggleUserStatus(u: any) {
  const action = u.enabled ? '禁用' : '启用'
  if (!confirm(`确定${action}用户 "${u.username}" 吗？`)) return
  fetch(`${API_BASE}/api/users/${u.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAccessToken()}`
    },
    body: JSON.stringify({ enabled: !u.enabled }),
    credentials: 'include'
  })
    .then(res => res.json())
    .then(data => {
      if (data.enabled !== undefined) {
        u.enabled = data.enabled
      }
    })
    .catch(() => alert('操作失败'))
}

async function deleteUser(u: any) {
  if (u.id === auth.user?.id) { alert('不能删除自己的账号'); return }
  if (!confirm(`确定删除用户 "${u.username}" 吗？此操作不可撤销，该用户的所有关联数据将被级联删除。`)) return
  try {
    const res = await fetch(`${API_BASE}/api/users/${u.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getAccessToken()}` },
      credentials: 'include'
    })
    if (res.ok || res.status === 204) {
      users.value = users.value.filter(x => x.id !== u.id)
      stats.userCount--
    } else {
      const data = await res.json()
      alert(data.message || '删除失败')
    }
  } catch { alert('删除失败') }
}

// ─── 用户组管理 ───

async function loadAllGroups() {
  try {
    const data = await apiGet('/api/groups')
    allGroups.value = data.groups || []
  } catch { allGroups.value = [] }
}

async function loadGroups() {
  if (auth.user?.role !== 'admin') return
  try {
    const data = await apiGet('/api/groups')
    groups.value = data.groups || []
  } catch { groups.value = [] }
}

function openGroupCreate() {
  editingGroup.value = null
  groupForm.name = ''
  groupForm.description = ''
  showGroupForm.value = true
}

function editGroup(g: any) {
  editingGroup.value = g
  groupForm.name = g.name
  groupForm.description = g.description || ''
  showGroupForm.value = true
}

function cancelGroupForm() {
  showGroupForm.value = false
  editingGroup.value = null
  groupForm.name = ''
  groupForm.description = ''
}

async function createGroup() {
  if (!groupForm.name.trim()) { alert('组名称不能为空'); return }
  try {
    const data = await apiPost('/api/groups', { name: groupForm.name.trim(), description: groupForm.description })
    if (data && data.id) {
      groups.value.unshift(data)
      allGroups.value.unshift(data)
      cancelGroupForm()
    } else {
      alert((data && data.message) || '创建失败')
    }
  } catch { alert('创建失败') }
}

async function updateGroup() {
  if (!editingGroup.value) return
  try {
    const data = await apiPut(`/api/groups/${editingGroup.value.id}`, {
      name: groupForm.name.trim(),
      description: groupForm.description
    })
    if (data && data.id) {
      const idx = groups.value.findIndex(g => g.id === data.id)
      if (idx >= 0) groups.value[idx] = data
      cancelGroupForm()
    } else {
      alert((data && data.message) || '更新失败')
    }
  } catch { alert('更新失败') }
}

async function deleteGroup(g: any) {
  if (!confirm(`确定删除组 "${g.name}" 吗？该组的所有成员关联将被自动解除。`)) return
  try {
    await apiDelete(`/api/groups/${g.id}`)
    groups.value = groups.value.filter(x => x.id !== g.id)
    allGroups.value = allGroups.value.filter(x => x.id !== g.id)
  } catch (e: any) {
    alert((e && e.message) || '删除失败')
  }
}

async function openGroupMembers(g: any) {
  try {
    const data = await apiGet(`/api/groups/${g.id}`)
    groupMembersOf.value = data
    userToAdd.value = ''
    showGroupMembers.value = true
  } catch { alert('加载成员失败') }
}

function closeGroupMembers() {
  showGroupMembers.value = false
  groupMembersOf.value = null
  userToAdd.value = ''
}

async function addUserToGroup() {
  if (!userToAdd.value || !groupMembersOf.value) return
  try {
    await apiPost(`/api/groups/${groupMembersOf.value.id}/users`, { user_ids: [userToAdd.value] })
    await openGroupMembers(groupMembersOf.value)
    loadGroups()
  } catch (e: any) {
    alert((e && e.message) || '添加失败')
  }
}

async function removeUserFromGroup(userId: string) {
  if (!groupMembersOf.value) return
  if (!confirm('确定移除该用户吗？')) return
  try {
    await apiDelete(`/api/groups/${groupMembersOf.value.id}/users/${userId}`)
    await openGroupMembers(groupMembersOf.value)
    loadGroups()
  } catch (e: any) {
    alert((e && e.message) || '移除失败')
  }
}

async function uploadLogo(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || !input.files[0]) return
  const file = input.files[0]
  const allowed = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp']
  if (!allowed.includes(file.type)) { alert('仅支持 PNG/JPG/GIF/SVG/WebP 格式'); return }
  if (file.size > 2 * 1024 * 1024) { alert('Logo 文件大小不能超过 2MB'); return }
  const clientId = editingClient.value?.id
  if (!clientId) return
  logoUploading.value = true
  try {
    const sigRes = await fetch(`${API_BASE}/api/upload/client-logo-signature?clientId=${clientId}&filename=${encodeURIComponent(file.name)}`, {
      headers: { 'Authorization': `Bearer ${getAccessToken()}` },
      credentials: 'include'
    })
    if (!sigRes.ok) { const d = await sigRes.json(); alert(d.message || '获取签名失败'); return }
    const sigData = await sigRes.json()
    const fd = new FormData()
    if (sigData.formData) {
      Object.entries(sigData.formData).forEach(([k, v]) => fd.append(k, v as string))
    }
    fd.append('file', file)
    const uploadRes = await fetch(sigData.uploadUrl, { method: 'POST', body: fd, credentials: 'include' })
    if (!uploadRes.ok) { alert('上传到 COS 失败'); return }
    const confirmRes = await fetch(`${API_BASE}/api/upload/client-logo-confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAccessToken()}` },
      body: JSON.stringify({ key: sigData.key, clientId }),
      credentials: 'include'
    })
    if (!confirmRes.ok) { alert('确认上传失败'); return }
    const confirmData = await confirmRes.json()
    if (confirmData.logo_uri) {
      logoPreview.value = confirmData.logo_uri
      const idx = clients.value.findIndex(c => c.id === clientId)
      if (idx >= 0) clients.value[idx].logo_uri = confirmData.logo_uri
      showToast('图标上传成功', 'success')
    }
  } catch { alert('上传失败') }
  finally { logoUploading.value = false; input.value = '' }
}

async function removeLogo() {
  const clientId = editingClient.value?.id
  if (!clientId) return
  if (!confirm('确定移除应用图标吗？')) return
  try {
    const res = await fetch(`${API_BASE}/api/upload/client-logo`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getAccessToken()}` },
      body: JSON.stringify({ clientId }),
      credentials: 'include'
    })
    if (res.ok) {
      logoPreview.value = null
      const idx = clients.value.findIndex(c => c.id === clientId)
      if (idx >= 0) clients.value[idx].logo_uri = null
      showToast('图标已移除', 'success')
    } else {
      alert('移除失败')
    }
  } catch { alert('移除失败') }
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).then(() => {
    showToast('已复制到剪贴板', 'success')
  })
}

const toast = reactive({ show: false, message: '', type: 'info' })

function showToast(msg: string, type = 'success') {
  toast.message = msg; toast.type = type; toast.show = true
  setTimeout(() => toast.show = false, 3000)
}

onMounted(() => {
  if (auth.isLoggedIn && isAdmin.value) {
    loadStats()
    loadClients()
    loadAllGroups()
    if (auth.user?.role === 'admin') {
      loadUsers()
      loadGroups()
    }
  }
})
</script>

<style scoped>
.admin-container { max-width: 1000px; margin: 0 auto; padding: 0 24px 80px; position: relative; z-index: 1; }

.admin-tabs { display: flex; gap: 4px; margin-bottom: 32px; background: rgba(0, 0, 0, 0.2); border-radius: 10px; padding: 4px; }
.admin-tab { flex: 1; padding: 12px; border: none; border-radius: 8px; background: transparent; color: #6B7280; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.admin-tab.active { background: rgba(230, 57, 70, 0.12); color: #E63946; }
.admin-tab:hover:not(.active) { color: #9CA3AF; }

.admin-section { background: rgba(255, 255, 255, 0.015); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 16px; padding: 28px; }

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.header-actions { display: flex; align-items: center; gap: 12px; }
.section-title { font-size: 12px; font-weight: 600; color: #7C8290; text-transform: uppercase; letter-spacing: 1px; }
.title-count { color: #4B5058; font-weight: 400; }

.search-input-wrap { position: relative; }
.search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 14px; height: 14px; color: #4B5058; pointer-events: none; }
.search-input { padding: 8px 12px 8px 32px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; color: #E5E7EB; font-size: 13px; font-family: inherit; width: 200px; transition: border-color 0.3s ease; }
.search-input:focus { outline: none; border-color: rgba(230, 57, 70, 0.4); }
.search-input::placeholder { color: #4B5058; }

.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; background: rgba(0, 0, 0, 0.15); border-radius: 12px; }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.stat-icon svg { width: 22px; height: 22px; }
.stat-icon-users { background: rgba(59, 130, 246, 0.1); color: #93C5FD; }
.stat-icon-clients { background: rgba(16, 185, 129, 0.1); color: #6EE7B7; }
.stat-icon-keys { background: rgba(245, 158, 11, 0.1); color: #FCD34D; }
.stat-info { display: flex; flex-direction: column; }
.stat-value { font-size: 28px; font-weight: 700; color: #F5F5F5; line-height: 1; }
.stat-label { font-size: 12px; color: #6B7280; margin-top: 4px; }

.quick-links { margin-bottom: 20px; }
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
.quick-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; background: rgba(0, 0, 0, 0.15); border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 10px; color: #9CA3AF; font-size: 13px; font-weight: 500; cursor: pointer; text-decoration: none; transition: all 0.3s ease; font-family: inherit; }
.quick-btn svg { width: 18px; height: 18px; }
.quick-btn:hover { background: rgba(230, 57, 70, 0.08); border-color: rgba(230, 57, 70, 0.15); color: #E63946; }

.role-notice { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.1); border-radius: 8px; font-size: 12px; color: #D4A853; line-height: 1.5; }
.role-notice .notice-icon { width: 16px; height: 16px; flex-shrink: 0; margin-top: 2px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(4px); z-index: 9999; display: flex; align-items: flex-start; justify-content: center; padding: 60px 20px; overflow-y: auto; }
.modal { background: #111; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 16px; width: 100%; max-width: 600px; padding: 0; }
.modal-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-header h4 { font-size: 16px; font-weight: 600; color: #E5E7EB; margin: 0; }
.modal-close { background: none; border: none; color: #6B7280; font-size: 24px; cursor: pointer; padding: 0 4px; font-family: inherit; }
.modal-close:hover { color: #9CA3AF; }
.modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-footer { display: flex; gap: 12px; padding: 0 24px 20px; }

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 12px; font-weight: 500; color: #7C8290; text-transform: uppercase; letter-spacing: 1px; }
.form-input {
  padding: 10px 14px; background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px;
  color: #E5E7EB; font-size: 14px; font-family: inherit;
  transition: border-color 0.3s ease, background 0.3s ease;
}
.form-input:focus { outline: none; border-color: rgba(230, 57, 70, 0.4); background: rgba(0, 0, 0, 0.5); }
.form-input::placeholder { color: #4B5058; }
select.form-input { cursor: pointer; }
textarea.form-input { resize: vertical; }
.form-row { display: flex; gap: 12px; }

.checkbox-group { display: flex; flex-direction: column; gap: 6px; padding-top: 4px; }
.checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #9CA3AF; cursor: pointer; }
.checkbox-label input[type="checkbox"] { accent-color: #E63946; }

.uri-row { display: flex; gap: 8px; }
.uri-row .form-input { flex: 1; }
.btn-remove-uri { background: none; border: none; color: #6B7280; font-size: 18px; cursor: pointer; padding: 0 4px; font-family: inherit; }
.btn-remove-uri:hover { color: #FCA5A5; }
.btn-add-uri { background: none; border: 1px dashed rgba(255, 255, 255, 0.08); border-radius: 6px; color: #6B7280; font-size: 12px; padding: 8px; cursor: pointer; font-family: inherit; transition: all 0.3s ease; }
.btn-add-uri:hover { border-color: rgba(230, 57, 70, 0.3); color: #E63946; }

.user-edit-info { background: rgba(0, 0, 0, 0.15); border-radius: 8px; padding: 12px 16px; }
.info-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; font-size: 13px; color: #E5E7EB; }
.info-label { color: #6B7280; }

.btn-add { padding: 8px 18px; background: rgba(230, 57, 70, 0.12); border: 1px solid rgba(230, 57, 70, 0.25); border-radius: 8px; color: #E63946; font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.3s ease; font-family: inherit; white-space: nowrap; }
.btn-add:hover { background: rgba(230, 57, 70, 0.2); }

.header-right { display: flex; align-items: center; gap: 8px; }
.btn-help { width: 26px; height: 26px; border-radius: 50%; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08); color: #6B7280; font-size: 14px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; font-family: inherit; transition: all 0.3s ease; padding: 0; line-height: 1; }
.btn-help:hover { background: rgba(230, 57, 70, 0.1); border-color: rgba(230, 57, 70, 0.25); color: #E63946; }

.modal-help { max-width: 720px !important; max-height: 85vh; display: flex; flex-direction: column; }
.modal-help .modal-body { overflow-y: auto; flex: 1; min-height: 0; }
.modal-help .modal-footer { flex-shrink: 0; }
.help-section { display: flex; flex-direction: column; gap: 24px; }
.help-item { padding-bottom: 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.04); }
.help-item:last-child { border-bottom: none; padding-bottom: 0; }
.help-term { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.help-term strong { font-size: 15px; color: #E5E7EB; }
.help-code { font-size: 12px; color: #9CA3AF; background: rgba(0, 0, 0, 0.2); padding: 2px 8px; border-radius: 4px; font-family: monospace; }
.help-badge { display: inline-flex; padding: 1px 8px; border-radius: 50px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.help-badge.required { background: rgba(239, 68, 68, 0.1); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.15); }
.help-badge.new { background: rgba(59, 130, 246, 0.1); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.15); }
.help-desc { font-size: 13px; color: #9CA3AF; line-height: 1.7; margin: 0 0 10px; }
.help-example { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.help-example code { font-size: 12px; color: #6EE7B7; background: rgba(16, 185, 129, 0.06); padding: 4px 10px; border-radius: 4px; font-family: monospace; display: inline-block; }
.example-label { font-size: 11px; color: #6B7280; margin-bottom: 2px; }
.help-note { font-size: 12px; color: #D4A853; background: rgba(245, 158, 11, 0.05); padding: 6px 10px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.08); line-height: 1.5; }
.help-recommend { font-size: 12px; color: #6EE7B7; background: rgba(16, 185, 129, 0.06); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(16, 185, 129, 0.1); line-height: 1.6; margin-top: 8px; }
.help-options { display: flex; flex-direction: column; gap: 10px; margin-bottom: 6px; }
.help-option { display: flex; flex-direction: column; gap: 3px; padding: 8px 12px; background: rgba(0, 0, 0, 0.1); border-radius: 8px; }
.help-option code { font-size: 12px; color: #93C5FD; font-family: monospace; font-weight: 500; }
.help-option span { font-size: 12px; color: #9CA3AF; line-height: 1.5; }
.btn-submit { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; background: rgba(230, 57, 70, 0.12); border: 1px solid rgba(230, 57, 70, 0.25); border-radius: 8px; color: #E63946; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-submit:hover { background: rgba(230, 57, 70, 0.2); border-color: rgba(230, 57, 70, 0.4); }
.btn-cancel { padding: 10px 20px; background: transparent; border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; color: #6B7280; font-size: 14px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-cancel:hover { color: #9CA3AF; }

.client-card { background: rgba(0, 0, 0, 0.15); border-radius: 12px; padding: 20px; margin-bottom: 12px; }
.client-main { display: flex; justify-content: space-between; gap: 16px; }
.client-info { flex: 1; min-width: 0; }
.client-name { font-size: 15px; font-weight: 600; color: #E5E7EB; margin: 0 0 4px; }
.client-desc { font-size: 13px; color: #6B7280; margin: 0 0 10px; }
.client-meta { display: flex; gap: 6px; margin-bottom: 10px; flex-wrap: wrap; }
.meta-tag { display: inline-flex; padding: 2px 10px; border-radius: 50px; font-size: 11px; font-weight: 500; background: rgba(255, 255, 255, 0.04); color: #6B7280; border: 1px solid rgba(255, 255, 255, 0.06); }
.meta-pkce { background: rgba(16, 185, 129, 0.08); color: #6EE7B7; border-color: rgba(16, 185, 129, 0.15); }
.meta-enabled { background: rgba(16, 185, 129, 0.08); color: #6EE7B7; border-color: rgba(16, 185, 129, 0.15); }
.meta-disabled { background: rgba(239, 68, 68, 0.08); color: #FCA5A5; border-color: rgba(239, 68, 68, 0.15); }
.client-uris { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.uri-badge { padding: 3px 10px; background: rgba(255, 255, 255, 0.03); border-radius: 6px; font-size: 12px; color: #9CA3AF; font-family: monospace; }
.client-id-display { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.id-label { font-size: 11px; color: #6B7280; }
.id-value { font-size: 12px; color: #9CA3AF; font-family: monospace; background: rgba(0, 0, 0, 0.2); padding: 2px 8px; border-radius: 4px; }
.btn-copy { background: none; border: none; color: #6B7280; cursor: pointer; font-size: 14px; padding: 2px; line-height: 1; }
.btn-copy:hover { color: #E5E7EB; }
.client-time { font-size: 11px; color: #4B5058; }
.client-actions { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }

.data-table { border: 1px solid rgba(255, 255, 255, 0.04); border-radius: 12px; overflow: hidden; }
.table-header, .table-row { display: flex; align-items: center; padding: 12px 16px; gap: 8px; }
.table-header { background: rgba(0, 0, 0, 0.2); font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; }
.table-row { border-top: 1px solid rgba(255, 255, 255, 0.03); font-size: 13px; color: #E5E7EB; }
.table-row:hover { background: rgba(255, 255, 255, 0.02); }

.th-name { flex: 2; display: flex; align-items: center; gap: 8px; }
.th-email { flex: 1.5; }
.th-qq { flex: 1; text-align: center; font-family: monospace; font-size: 12px; }
.th-role { flex: 0.8; text-align: center; }
.th-status { flex: 0.8; text-align: center; display: flex; align-items: center; justify-content: center; gap: 6px; }
.th-login { flex: 1.5; text-align: center; font-size: 12px; }
.th-actions { flex: 0 0 200px; text-align: right; display: flex; gap: 4px; justify-content: flex-end; }

.user-avatar-sm { width: 28px; height: 28px; border-radius: 50%; background: rgba(230, 57, 70, 0.12); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #E63946; flex-shrink: 0; }
.user-name-text { font-weight: 500; }

.role-tag { display: inline-block; padding: 2px 10px; border-radius: 50px; font-size: 11px; font-weight: 500; }
.role-tag.admin { background: rgba(239, 68, 68, 0.08); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.15); }
.role-tag.developer { background: rgba(59, 130, 246, 0.08); color: #93C5FD; border: 1px solid rgba(59, 130, 246, 0.15); }
.role-tag.user { background: rgba(16, 185, 129, 0.08); color: #6EE7B7; border: 1px solid rgba(16, 185, 129, 0.15); }

.status-dot { width: 7px; height: 7px; border-radius: 50%; display: inline-block; }
.status-dot.active { background: #6EE7B7; box-shadow: 0 0 6px rgba(16, 185, 129, 0.4); }
.status-dot.inactive { background: #FCA5A5; box-shadow: 0 0 6px rgba(239, 68, 68, 0.3); }

.btn-table { padding: 5px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; font-family: inherit; border: none; transition: all 0.3s ease; }
.btn-edit { background: rgba(59, 130, 246, 0.08); color: #93C5FD; }
.btn-edit:hover { background: rgba(59, 130, 246, 0.15); }
.btn-danger { background: rgba(239, 68, 68, 0.08); color: #FCA5A5; }
.btn-danger:hover:not(:disabled) { background: rgba(239, 68, 68, 0.15); }
.btn-danger:disabled { opacity: 0.3; cursor: not-allowed; }
.btn-warn { background: rgba(245, 158, 11, 0.08); color: #FCD34D; }
.btn-warn:hover { background: rgba(245, 158, 11, 0.15); }
.btn-success { background: rgba(16, 185, 129, 0.08); color: #6EE7B7; }
.btn-success:hover { background: rgba(16, 185, 129, 0.15); }

.pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 20px; }
.page-btn { padding: 8px 16px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 8px; color: #9CA3AF; font-size: 13px; cursor: pointer; font-family: inherit; transition: all 0.3s ease; }
.page-btn:hover:not(:disabled) { background: rgba(230, 57, 70, 0.08); color: #E63946; border-color: rgba(230, 57, 70, 0.2); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 12px; color: #6B7280; }

.empty { text-align: center; padding: 48px 20px; color: #6B7280; font-size: 13px; }

.client-name-row { display: flex; align-items: center; gap: 10px; }
.client-logo-sm { width: 24px; height: 24px; border-radius: 6px; object-fit: contain; flex-shrink: 0; }

.logo-upload { display: flex; flex-direction: column; gap: 10px; }
.logo-preview-wrap { position: relative; display: inline-flex; align-self: flex-start; }
.logo-preview { width: 72px; height: 72px; border-radius: 12px; object-fit: contain; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.06); }
.logo-remove { position: absolute; top: -8px; right: -8px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239,68,68,0.9); border: none; color: #fff; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0; font-family: inherit; }
.logo-remove:hover { background: #ef4444; }
.logo-upload-actions { display: flex; flex-direction: column; gap: 4px; }
.btn-upload { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; color: #9CA3AF; font-size: 13px; cursor: pointer; transition: all 0.3s ease; font-family: inherit; }
.btn-upload:hover { background: rgba(230,57,70,0.08); border-color: rgba(230,57,70,0.2); color: #E63946; }
.upload-icon { width: 16px; height: 16px; }
.file-input { position: absolute; width: 0; height: 0; opacity: 0; overflow: hidden; }
.logo-hint { font-size: 11px; color: #4B5058; }

.toast { position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 99999; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; animation: fadeIn 0.3s ease; }
.toast.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6EE7B7; }

.modal-credentials { max-width: 520px !important; }
.cred-warning { display: flex; align-items: flex-start; gap: 10px; padding: 12px 16px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.12); border-radius: 8px; margin-bottom: 4px; }
.cred-warning .warn-icon { width: 18px; height: 18px; color: #FCD34D; flex-shrink: 0; margin-top: 1px; }
.cred-warning span { font-size: 12px; color: #D4A853; line-height: 1.5; }
.cred-field { padding: 12px 0; }
.cred-field + .cred-field { border-top: 1px solid rgba(255,255,255,0.04); }
.cred-label { font-size: 11px; font-weight: 600; color: #7C8290; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 8px; }
.cred-value-row { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.04); border-radius: 8px; padding: 10px 14px; }
.cred-code { flex: 1; font-size: 13px; color: #93C5FD; font-family: 'Cascadia Code', 'Fira Code', monospace; word-break: break-all; line-height: 1.5; user-select: all; }
.cred-secret { color: #6EE7B7; }
.cred-copy { flex-shrink: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); border-radius: 6px; color: #6B7280; cursor: pointer; transition: all 0.3s ease; padding: 0; font-family: inherit; }
.cred-copy:hover { background: rgba(230,57,70,0.1); border-color: rgba(230,57,70,0.2); color: #E63946; }
.copy-icon { width: 16px; height: 16px; }

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: 1fr; }
  .quick-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; }
  .client-main { flex-direction: column; }
  .client-actions { flex-direction: row; }
  .table-header, .table-row { font-size: 12px; padding: 10px 12px; }
  .th-qq { display: none; }
  .th-login { display: none; }
  .th-actions { flex: 0 0 140px; flex-wrap: wrap; }
  .admin-section { padding: 20px 16px; }
  .section-header { flex-direction: column; align-items: stretch; }
  .header-actions { flex-direction: column; }
  .search-input { width: 100%; }
  .modal { margin: 20px auto; max-width: 100%; }
}
</style>
