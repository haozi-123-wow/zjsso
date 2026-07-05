# 任务列表

- [ ] Task 1: 安装 `socks-proxy-agent` npm 依赖
  - [ ] 在 `package.json` 中添加 `socks-proxy-agent` 依赖
  - [ ] 运行 `npm install`

- [ ] Task 2: 配置 SOCKS5 代理和 Google OAuth 环境变量
  - [ ] `src/config/index.js` 的 `social` 对象中添加 `google` 配置段（`clientId`、`clientSecret`、`callbackUrl`）
  - [ ] `src/config/index.js` 中添加 `socks5` 配置段（`host`、`port`、`username`、`password`）
  - [ ] `.env.example` 添加 `GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`GOOGLE_CALLBACK_URL` 环境变量说明
  - [ ] `.env.example` 添加 `SOCKS5_PROXY_HOST`、`SOCKS5_PROXY_PORT`、`SOCKS5_PROXY_USERNAME`、`SOCKS5_PROXY_PASSWORD` 环境变量说明

- [ ] Task 3: 创建 GoogleProvider 后端服务
  - [ ] 新建 `src/services/social/GoogleProvider.js`，继承 `SocialProvider`
  - [ ] 构造函数中获取 SOCKS5 代理配置
  - [ ] 实现 `_createHttpsAgent()` 方法 — 根据是否配置了 SOCKS5 代理，返回带代理的 Agent 或默认 Agent
  - [ ] 实现 `getAuthorizationUrl(state)` — 使用 Google OAuth 2.0 端点，scope 为 `openid email profile`
  - [ ] 实现 `getAccessToken(code)` — POST 到 `https://oauth2.googleapis.com/token`（使用 SOCKS5 代理）
  - [ ] 实现 `getUserProfile(accessToken)` — GET `https://www.googleapis.com/oauth2/v3/userinfo`，返回包含 `sub`、`email`、`email_verified`、`name`、`picture` 的用户资料
  - [ ] 回调 URL 格式: `http://localhost:6873/api/auth/social/google/callback`

- [ ] Task 4: 注册 GoogleProvider 到路由和 Provider 列表
  - [ ] `src/routes/social.js` — 引入 `googleProvider`，在 `getProvider()` map 中添加 `google`
  - [ ] `src/services/social/Provider.js` — `getAllProviders()` 中添加 Google 提供方，通过 `clientId` 判断是否启用

- [ ] Task 5: 更新绑定回调逻辑，支持条件性更新用户头像和邮箱
  - [ ] `src/routes/social.js` — 在 Google 绑定回调中（bind_user_id 存在时），查询用户当前的 `picture` 和 `email`
  - [ ] 若 `users.picture` 为空，则将 Google 头像 URL 更新到 `users.picture`
  - [ ] 若 `users.email` 为空，则将 Google 邮箱更新到 `users.email`（`email_verified` 设为 `true`）

- [ ] Task 6: 替换前端登录页 QQ 按钮为 Google 按钮
  - [ ] `frontend/src/views/Login.vue` — 将 QQ 按钮（QQ 企鹅图标 + "QQ" 文本）替换为 Google 按钮（Google 彩色 "G" 图标 + "Google" 文本）
  - [ ] 修改 `handleQQLogin` 为 `handleGoogleLogin`，重定向地址改为 `/api/auth/social/google/login`
  - [ ] 移除 `qqLoading` ref 相关代码，添加 `googleLoading` ref

- [ ] Task 7: 替换前端个人中心 QQ 绑定为 Google 绑定
  - [ ] `frontend/src/views/Profile.vue` — 在社交绑定区域，将 `provider === 'qq'` 的判断改为 `provider === 'google'`，按钮文字改为 "绑定 Google"
  - [ ] 将 `bindSocial('qq')` 改为 `bindSocial('google')`

# 任务依赖
- [Task 2] 依赖于 [Task 1]
- [Task 3] 依赖于 [Task 1] 和 [Task 2]
- [Task 4] 依赖于 [Task 2] 和 [Task 3]
- [Task 5] 依赖于 [Task 4]（绑定逻辑修改需要路由已注册）
- [Task 6] 无后端依赖，可独立进行
- [Task 7] 无后端依赖，可独立进行
