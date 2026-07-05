# Google 登录替换 QQ 登录 规范文档

## 为什么
将 QQ 登录替换为 Google 登录（保留 QQ 登录后端逻辑），并获取用户的 Google 邮箱和头像。

## 变更内容
- **SOCKS5 代理** 新增 SOCKS5 代理配置，GoogleProvider 通过代理与 Google 服务器通信
- **后端新增** `GoogleProvider` 服务（OAuth 2.0 + OpenID Connect），通过 Google 的 `userinfo` 端点获取用户邮箱和头像
- **后端配置** 新增 Google OAuth 环境变量（`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_CALLBACK_URL`）和 SOCKS5 代理环境变量
- **后端路由** 在 `social.js` 的 provider map 中注册 GoogleProvider
- **后端 Provider 列表** 在 `getAllProviders()` 中添加 Google 条目
- **用户头像处理** Google 登录时，头像 URL 存入 `users.picture`；绑定时若用户已有头像则不覆盖
- **用户邮箱处理** Google 登录时，邮箱存入 `users.email`；绑定时若用户已有邮箱则不覆盖
- **前端登录页** 将 QQ 登录按钮替换为 Google 登录按钮（图标、文字、点击事件）
- **前端个人中心** 将"绑定 QQ"替换为"绑定 Google"
- **QQ 后端逻辑完整保留**，QQProvider.js、配置段、路由等均不删除

## 影响范围
- 影响模块: 后端 social 模块、前端 Login.vue、Profile.vue、config、npm 依赖
- 受影响代码:
  - `package.json` — 新增 `socks-proxy-agent` 依赖
  - `src/config/index.js` — 新增 google 配置段和 socks5 配置段
  - `src/routes/social.js` — 引入 googleProvider、更新 bind 回调逻辑
  - `src/services/social/Provider.js` — getAllProviders 中添加 google
  - `src/services/social/GoogleProvider.js` — **新建** Google OAuth provider（使用 SOCKS5 代理）
  - `.env.example` — 新增 Google 和 SOCKS5 环境变量说明
  - `frontend/src/views/Login.vue` — 替换 QQ 按钮为 Google 按钮
  - `frontend/src/views/Profile.vue` — 替换 QQ 绑定为 Google 绑定
- QQ 社交登录逻辑保留，相关文件不变
- 用户注册表单中的"QQ 号码"选填字段、Admin 管理中的 QQ 字段等与 QQ 社交登录无关的功能不受影响

## 新增需求

### 需求: SOCKS5 代理通信
系统必须支持通过 SOCKS5 代理与 Google 服务器通信。

#### 场景: 代理配置启用
- **WHEN** `SOCKS5_PROXY_HOST` 环境变量已设置
- **THEN** GoogleProvider 的所有 HTTPS 请求都通过 SOCKS5 代理发出
- **AND** 代理地址为 `{SOCKS5_PROXY_HOST}:{SOCKS5_PROXY_PORT}`（默认 1080）
- **AND** 若 `SOCKS5_PROXY_USERNAME` 和 `SOCKS5_PROXY_PASSWORD` 已设置，则使用代理认证

#### 场景: 代理未配置
- **WHEN** `SOCKS5_PROXY_HOST` 环境变量为空或未设置
- **THEN** GoogleProvider 直接发起 HTTPS 请求（不通过代理）

### 需求: Google OAuth Provider
系统必须支持 Google OAuth 2.0 登录，scope 为 `openid email profile`。

#### 场景: Google 登录成功
- **WHEN** 用户在登录页点击"Google"按钮
- **THEN** 用户被重定向到 Google 授权页面
- **AND** 授权后 Google 返回 authorization code
- **AND** 后端通过 SOCKS5 代理（如有配置）将 code 交换为 access token
- **AND** 后端从 Google `https://www.googleapis.com/oauth2/v3/userinfo` 获取用户资料（含邮箱和头像）
- **AND** 后端查找或创建用户，将 Google 邮箱和头像存入用户记录
- **AND** 用户完成登录

#### 场景: Google 邮箱获取
- **WHEN** Google `userinfo` 端点返回 `email` 和 `email_verified`
- **THEN** 邮箱存入 `social_connections.provider_email` 字段
- **AND** 创建新用户时，邮箱写入 `users.email` 字段
- **AND** `email_verified` 设置为 Google 返回的 `email_verified` 值（Google 已验证的邮箱视为可信）
- **AND** Google 邮箱格式如 `user@gmail.com`

#### 场景: Google 头像获取
- **WHEN** Google `userinfo` 端点返回 `picture`
- **THEN** 头像 URL 存入 `social_connections.provider_avatar` 字段
- **AND** 创建新用户时，头像 URL 写入 `users.picture` 字段
- **AND** Google 头像 URL 格式如 `https://lh3.googleusercontent.com/...`

### 需求: 绑定 Google 时不覆盖已有头像
绑定 Google 账号到已有用户时，如果用户已设置了头像，则不要用 Google 头像覆盖。

#### 场景: 用户已有头像时绑定
- **WHEN** 用户已存在且 `users.picture` 不为空
- **AND** 用户绑定 Google 账号
- **THEN** `users.picture` 保持不变
- **AND** `social_connections.provider_avatar` 仍保存 Google 头像 URL

#### 场景: 用户无头像时绑定
- **WHEN** 用户已存在且 `users.picture` 为空
- **AND** 用户绑定 Google 账号
- **THEN** `users.picture` 更新为 Google 头像 URL

### 需求: 绑定 Google 时不覆盖已有邮箱
绑定 Google 账号到已有用户时，如果用户已设置了邮箱，则不要用 Google 邮箱覆盖。

#### 场景: 用户已有邮箱时绑定
- **WHEN** 用户已存在且 `users.email` 不为空
- **AND** 用户绑定 Google 账号
- **THEN** `users.email` 保持不变
- **AND** `social_connections.provider_email` 仍保存 Google 邮箱

#### 场景: 用户无邮箱时绑定
- **WHEN** 用户已存在且 `users.email` 为空
- **AND** 用户绑定 Google 账号
- **THEN** `users.email` 更新为 Google 邮箱
- **AND** `users.email_verified` 设置为 `true`

### 需求: 前端 Google 登录按钮
登录页必须显示 Google 登录按钮替换 QQ 登录按钮。

#### 场景: Google 按钮展示
- **WHEN** 登录页渲染社交登录区域
- **THEN** 显示带有 Google "G" 图标和"Google"文字的按钮
- **AND** QQ 按钮从登录页移除

### 需求: 个人中心 Google 绑定
个人中心的社交绑定区域必须显示"绑定 Google"替换"绑定 QQ"。

## 移除的需求
### 需求: QQ 前端按钮
**原因**: 按用户要求替换为 Google 登录
**迁移**: QQ 后端逻辑完整保留，配置 QQ 环境变量后仍可启用

### 需求: QQ 个人中心绑定
**原因**: 按用户要求替换为 Google 绑定
**迁移**: QQ 绑定后端逻辑仍可使用，配置 QQ 环境变量后仍可绑定
