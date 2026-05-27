# OIDC 单点登录系统 - API 接口文档

> **实现状态:** ✅ OIDC 3.0 标准端点已全部实现（/oauth/authorize, /oauth/token, /userinfo, /.well-known/openid-configuration, /.well-known/jwks.json）
> 支持三种 grant_type: `authorization_code`（含PKCE）、`refresh_token`（轮换机制）、`client_credentials`

## 基础地址

```
http://localhost:3000
```

***

## 1. OIDC 发现端点

### 1.1 OpenID 配置发现

获取 OpenID Connect 元数据文档。

```
GET /.well-known/openid-configuration
```

**响应 200:**

```json
{
  "issuer": "http://localhost:3000",
  "authorization_endpoint": "http://localhost:3000/oauth/authorize",
  "token_endpoint": "http://localhost:3000/oauth/token",
  "userinfo_endpoint": "http://localhost:3000/userinfo",
  "jwks_uri": "http://localhost:3000/.well-known/jwks.json",
  "registration_endpoint": "http://localhost:3000/clients/register",
  "scopes_supported": ["openid", "profile", "email", "phone", "offline_access"],
  "response_types_supported": ["code", "token", "id_token", "code token", "code id_token", "token id_token", "code token id_token"],
  "grant_types_supported": ["authorization_code", "implicit", "refresh_token", "client_credentials"],
  "token_endpoint_auth_methods_supported": ["client_secret_basic", "client_secret_post", "none"],
  "claims_supported": ["sub", "name", "preferred_username", "email", "email_verified", "picture", "phone", "locale", "qq"],
  "code_challenge_methods_supported": ["S256", "plain"],
  "subject_types_supported": ["public"],
  "id_token_signing_alg_values_supported": ["RS256", "HS256"]
}
```

### 1.2 JWKS (JSON Web Key Set)

获取用于验证 JWT 签名的公钥。

```
GET /.well-known/jwks.json
```

**响应 200:**

```C
{
  "keys": [
    {
      "kty": "RSA",
      "use": "sig",
      "kid": "key-id-1",
      "n": "base64url-encoded-modulus",
      "e": "AQAB",
      "alg": "RS256"
    }
  ]
}
```

***

## 2. 用户注册与登录

### 角色说明

系统内置三种角色，权限层级依次递增：

| 角色          | 层级 | 说明   | 权限                                                       |
| ----------- | -- | ---- | -------------------------------------------------------- |
| `user`      | 1  | 普通用户 | 登录、管理个人资料                                                |
| `developer` | 2  | 开发者  | 包含 user 权限 + 注册和管理 **自己创建** 的 OIDC 客户端（无法查看或操作其他开发者的客户端） |
| `admin`     | 3  | 管理员  | 包含 developer 权限 + 管理所有用户和客户端、系统配置                        |

> 新注册用户默认为 `user` 角色，管理员可在用户管理界面调整角色。JWT 的 access\_token 中携带 `role` 字段用于接口鉴权。`developer` 角色在客户端管理上受 `created_by` 数据隔离约束。详见 [客户端注册与管理](#5-客户端注册与管理)。

### 2.1 用户注册

创建新的用户账号。

```
POST /api/auth/register
Content-Type: application/json
```

**请求体:**

```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securePassword123",
  "confirm_password": "securePassword123",
  "display_name": "新用户",
  "phone": "13800138000",
  "qq": "123456789",
  "lot_number": "4dc3cfc2cdff448cad8d13107198d473",
  "captcha_output": "uj8Xx...",
  "pass_token": "f06f3a0c...",
  "gen_time": "1715850000"
}
```

**参数说明:**

| 参数                | 必填 | 说明                     |
| ----------------- | -- | ---------------------- |
| username          | 是  | 用户名，唯一                 |
| email             | 是  | 邮箱，唯一                  |
| password          | 是  | 密码（至少8位）               |
| confirm\_password | 是  | 确认密码，需与password一致      |
| display\_name     | 否  | 显示名称                   |
| phone             | 否  | 手机号                    |
| qq                | 否  | QQ号                    |
| lot\_number       | 是  | 极验行为验证流水号，完成验证后由前端获取   |
| captcha\_output   | 是  | 极验行为验证输出信息，完成验证后由前端获取  |
| pass\_token       | 是  | 极验行为验证通过标识，完成验证后由前端获取  |
| gen\_time         | 是  | 极验行为验证通过时间戳，完成验证后由前端获取 |

**响应 201:**

```json
{
  "message": "注册成功",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email_verified": false,
  "need_activation": true
}
```

**响应 400:**

```json
{
  "error": "Validation Error",
  "message": "用户名已被使用",
  "statusCode": 400
}
```

### 2.2 用户登录

使用用户名/邮箱 + 密码进行登录。

```
POST /api/auth/login
Content-Type: application/json
```

**请求体:**

```json
{
  "username": "admin@example.com",
  "password": "admin123",
  "lot_number": "4dc3cfc2cdff448cad8d13107198d473",
  "captcha_output": "uj8Xx...",
  "pass_token": "f06f3a0c...",
  "gen_time": "1715850000"
}
```

| 参数              | 必填 | 说明                     |
| --------------- | -- | ---------------------- |
| username        | 是  | 用户名或邮箱                 |
| password        | 是  | 密码                     |
| lot\_number     | 是  | 极验行为验证流水号，完成验证后由前端获取   |
| captcha\_output | 是  | 极验行为验证输出信息，完成验证后由前端获取  |
| pass\_token     | 是  | 极验行为验证通过标识，完成验证后由前端获取  |
| gen\_time       | 是  | 极验行为验证通过时间戳，完成验证后由前端获取 |

**响应 200（登录成功，无 2FA）:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@example.com",
    "display_name": "System Administrator",
    "picture": null,
    "role": "admin",
    "qq": "123456789"
  },
  "security_notice": {
    "message": "本次登录 IP 归属地与上次不同，如非本人操作请及时修改密码",
    "previous_location": "北京市 电信",
    "current_location": "上海市 电信",
    "previous_ip": "1.2.3.4",
    "current_ip": "5.6.7.8"
  }
}
```

> `security_notice` 字段仅在本次登录 IP 归属地与上次不同时返回，否则不包含该字段。

**响应 200（登录成功，需要 2FA）:**

```json
{
  "require_2fa": true,
  "temp_token": "aes-256-cbc-encrypted-temp-token",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@example.com",
    "display_name": "System Administrator",
    "picture": null,
    "role": "admin"
  }
}
```

> 当用户启用了 TOTP 双因素认证时，登录接口返回 `require_2fa: true` 和 `temp_token`，前端需引导用户输入 TOTP 验证码并调用 `POST /api/auth/totp/login-check` 完成登录。

**响应 401:**

```json
{
  "error": "invalid_grant",
  "message": "用户名或密码错误"
}
```

**响应 403（未激活）:**

```json
{
  "error": "account_not_activated",
  "message": "账号尚未激活，请先查收激活邮件"
}
```

**响应 403（账号已禁用）:**

```json
{
  "error": "account_disabled",
  "message": "账号已被禁用"
}
```

### 2.3 退出登录

使当前 access\_token 失效（登出）。

```
POST /api/auth/logout
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "refresh_token": "8xLOxBtZp8"
}
```

| 参数             | 必填 | 说明                    |
| -------------- | -- | --------------------- |
| refresh\_token | 否  | 同时使 refresh\_token 失效 |

**响应 200:**

```json
{
  "message": "已成功退出登录"
}
```

### 2.4 刷新令牌

使用 refresh\_token 获取新的 access\_token。

```
POST /api/auth/refresh
Content-Type: application/json
```

**请求体:**

```json
{
  "refresh_token": "8xLOxBtZp8"
}
```

**响应 200:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "new-refresh-token",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### 2.5 检查用户名/邮箱是否可用

注册前检查用户名或邮箱是否已被注册。

```
GET /api/auth/check-available?username=newuser&email=new@example.com
```

**查询参数:**

| 参数       | 必填 | 说明      |
| -------- | -- | ------- |
| username | 否  | 要检查的用户名 |
| email    | 否  | 要检查的邮箱  |

**响应 200:**

```json
{
  "username_available": true,
  "email_available": false
}
```

### 2.6 获取客户端登录页信息

获取 OIDC 客户端信息用于登录页展示。

```
GET /api/auth/client-info?client_id=xxx
```

**查询参数:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| client\_id | 是 | OIDC 客户端标识符 |

**响应 200:**

```json
{
  "client_id": "generated-client-id",
  "client_name": "My Application",
  "client_description": "Description of my app",
  "logo_uri": "https://example.com/logo.png",
  "homepage_uri": "https://example.com"
}
```

**响应 404:**

```json
{
  "error": "not_found",
  "message": "客户端不存在或已禁用"
}
```

### 2.7 检查用户授权状态

检查当前已登录用户是否已授权指定 OIDC 客户端。

```
GET /api/auth/check-consent?client_id=xxx
Authorization: Bearer {access_token}
```

**查询参数:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| client\_id | 是 | OIDC 客户端标识符 |

**响应 200:**

```json
{
  "consented": true
}
```

### 2.8 获取已授权的应用列表

列出当前用户已授权过的所有 OIDC 客户端。

```
GET /api/auth/user/consents
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "consents": [
    {
      "id": "consent-uuid",
      "client_id": "internal-client-uuid",
      "client_key": "client_abc123...",
      "client_name": "My Application",
      "client_description": "Description of my app",
      "logo_uri": "https://example.com/logo.png",
      "scopes": ["openid", "profile", "email"],
      "granted_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### 2.9 撤销授权

撤销当前用户对指定客户端的授权。

```
DELETE /api/auth/user/consents/:internalClientId
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "deleted": true
}
```

### 2.10 获取用户活动记录

获取当前用户的操作活动日志。

```
GET /api/auth/user/activities
Authorization: Bearer {access_token}
```

**查询参数:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| limit | 否 | 返回条数（默认 50，最大 200） |
| offset | 否 | 偏移量（默认 0） |

**响应 200:**

```json
{
  "activities": [
    {
      "id": "log-uuid",
      "action": "login",
      "detail": null,
      "ip_address": "1.2.3.4",
      "ip_location": "上海市 电信",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 42
}
```

**操作类型列表:**

| action | 说明 |
| --- | --- |
| `login` | 登录 |
| `register` | 注册 |
| `change_password` | 修改密码 |
| `revoke_consent` | 撤销授权 |
| `register_passkey` | 注册通行密钥 |
| `delete_passkey` | 删除通行密钥 |
| `bind_social` | 绑定社交账号 |
| `unbind_social` | 解绑社交账号 |
| `update_profile` | 更新个人资料 |
| `upload_avatar` | 上传头像 |
| `delete_avatar` | 删除头像 |
| `reset_secret` | 重置客户端密钥 |
| `change_email` | 修改邮箱 |
| `enable_2fa` | 启用双因素认证 |
| `disable_2fa` | 关闭双因素认证 |
| `admin_clear_2fa` | 管理员清除用户 2FA |

### 2.11 更新个人资料

更新当前用户的个人资料（邮箱、QQ号）。修改邮箱需要通过安全验证。

```
PUT /api/auth/profile
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "ticket": "security-ticket-from-verify",
  "email": "newemail@example.com",
  "qq": "987654321"
}
```

**参数说明:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| ticket | 修改邮箱时必填 | 安全验证凭据，通过验证接口获取 |
| email | 否 | 新邮箱地址（修改后 email_verified 重置为 false） |
| qq | 否 | QQ号 |

**响应 200:**

```json
{
  "message": "更新成功",
  "user": {
    "id": "user-uuid",
    "username": "testuser",
    "email": "newemail@example.com",
    "display_name": "Test User",
    "picture": null,
    "role": "user",
    "qq": "987654321"
  }
}
```

### 2.12 获取邮箱状态

获取当前用户的邮箱地址和验证状态。

```
GET /api/auth/profile/email-status
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "email": "user@example.com",
  "verified": true,
  "is_social_email": false
}
```

> `is_social_email` 为 `true` 表示该邮箱来自第三方社交账号（以 `@social.local` 结尾），不可用于接收系统邮件。

### 2.13 登录+注册流程说明

```
注册流程:
  用户填写注册表单
    → 前端调用 POST /api/geetest/register 获取初始化参数
    → 前端加载极验 v4 组件（initGeetest4），展示滑块/点击验证
    → 用户完成行为验证，前端获取 lot_number / captcha_output / pass_token / gen_time
    → POST /api/auth/register（带上上述验证参数 + 注册信息）
    → 后端先进行极验二次校验（POST http://gcaptcha4.geetest.com/validate）
    → 二次校验通过 → 验证参数（用户名唯一、邮箱唯一、密码强度）
    → bcrypt哈希密码 → 创建用户（email_verified=false）
    → 生成激活码 → 存入Redis → 调用阿里云DirectMail发送激活邮件
    → 返回注册成功（前端提示用户查收邮件激活）

登录流程:
  用户填写登录表单
    → 前端调用 POST /api/geetest/register 获取初始化参数
    → 前端加载极验 v4 组件（initGeetest4），展示滑块/点击验证
    → 用户完成行为验证，前端获取 lot_number / captcha_output / pass_token / gen_time
    → POST /api/auth/login（带上上述验证参数 + 账号密码）
    → 后端先进行极验二次校验（POST http://gcaptcha4.geetest.com/validate）
    → 二次校验通过 → 支持用户名或邮箱登录
    → 验证密码 → 检查email_verified
    → 检查账号是否启用
    → 检查是否启用 TOTP 2FA（若启用则返回 require_2fa: true）
    → 签发 access_token + refresh_token + id_token
    → 返回token + 用户基本信息
```

***

## 3. OIDC 认证端点

### 3.1 授权端点

发起 OAuth 2.0 / OIDC 授权流程。

```
GET /oauth/authorize
```

**查询参数:**

| 参数                      | 必填     | 说明                                           |
| ----------------------- | ------ | -------------------------------------------- |
| client\_id              | 是      | 已注册的客户端标识符                                   |
| redirect\_uri           | 是      | 授权完成后的重定向URI                                 |
| response\_type          | 是      | 响应类型: `code`, `token`, `id_token`            |
| scope                   | 是      | 空格分隔的作用域（必须包含 `openid`）                      |
| state                   | 是      | 用于 CSRF 防护的不透明值                              |
| nonce                   | 是      | 将会话与 id\_token 关联的值                          |
| code\_challenge         | PKCE必填 | code\_verifier 的 S256 哈希值                    |
| code\_challenge\_method | PKCE必填 | `S256` 或 `plain`                             |
| prompt                  | 否      | `none`, `login`, `consent`, `select_account` |

**重定向成功 (code):**

```
HTTP/1.1 302 Found
Location: {redirect_uri}?code={authorization_code}&state={state}
```

**重定向成功 (implicit):**

```
HTTP/1.1 302 Found
Location: {redirect_uri}#access_token={token}&token_type=bearer&expires_in=3600&state={state}
```

### 3.2 Token 端点

用授权码或刷新令牌换取令牌。

```
POST /oauth/token
Content-Type: application/x-www-form-urlencoded
Authorization: Basic {base64(client_id:client_secret)}
```

**请求体（授权码流程）:**

| 参数             | 必填     | 说明                       |
| -------------- | ------ | ------------------------ |
| grant\_type    | 是      | `authorization_code`     |
| code           | 是      | 来自授权端点的授权码               |
| redirect\_uri  | 是      | 必须与授权请求一致                |
| client\_id     | 是      | 客户端标识符（认证方式为 `none` 时必填） |
| code\_verifier | PKCE必填 | 原始的 code verifier        |

**请求体（刷新令牌流程）:**

| 参数             | 必填 | 说明              |
| -------------- | -- | --------------- |
| grant\_type    | 是  | `refresh_token` |
| refresh\_token | 是  | 刷新令牌            |
| scope          | 否  | 可选的 scope 子集    |

**响应 200:**

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "refresh_token": "8xLOxBtZp8",
  "scope": "openid profile email"
}
```

### 3.3 UserInfo 端点

获取已认证用户的声明信息。

```
GET /userinfo
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test User",
  "preferred_username": "testuser",
  "email": "test@example.com",
  "email_verified": true,
  "picture": null,
  "phone": "13800138000",
  "phone_verified": true,
  "locale": "zh-CN",
  "qq": "123456789"
}
```

### 3.4 登出端点

登出用户并重定向到指定的 post-logout URI。

```
GET /logout?post_logout_redirect_uri={uri}&id_token_hint={id_token}
```

**查询参数:**

| 参数                          | 必填 | 说明             |
| --------------------------- | -- | -------------- |
| post\_logout\_redirect\_uri | 否  | 登出后的重定向URI     |
| id\_token\_hint             | 否  | 之前签发的 ID Token |

**重定向成功:**

```
HTTP/1.1 302 Found
Location: {post_logout_redirect_uri}
```

***

## 4. 会话模式 API

### 4.1 会话信息（有状态模式）

获取当前会话信息（仅在有状态模式有效）。

```
GET /session/info
Authorization: Bearer {access_token}
```

**响应 200（有状态）:**

```json
{
  "mode": "stateful",
  "session_id": "sess_abc123...",
  "user_id": "550e8400-...",
  "created_at": "2025-01-01T00:00:00Z",
  "expires_at": "2025-01-02T00:00:00Z"
}
```

**响应 200（无状态）:**

```json
{
  "mode": "stateless",
  "message": "无状态模式：会话信息包含在 JWT 中，请使用 /userinfo 获取令牌声明"
}
```

***

## 5. 客户端注册与管理

> 本节接口需要 `admin` 或 `developer` 角色。详见 [角色说明](#角色说明)。
>
> **数据隔离说明：** `developer` 角色只能查看、修改和删除**自己创建**的客户端。`admin` 角色可查看和管理**所有**客户端。每个客户端创建时自动记录创建者的用户 ID（`created_by`），作为数据隔离的依据。

### 5.1 注册客户端

```
POST /api/clients/register
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "client_name": "My Application",
  "client_description": "Description of my app",
  "redirect_uris": ["https://client.example.com/callback"],
  "post_logout_redirect_uris": ["https://client.example.com/logout"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "homepage_uri": "https://client.example.com",
  "logo_uri": "https://client.example.com/logo.png",
  "pkce_required": false
}
```

**处理说明:**

- 创建时后端自动将当前登录用户的 ID 记录到 `created_by` 字段
- `developer` 角色创建后只能自己管理该客户端
- `admin` 角色创建后可以管理该客户端，也可授权给其他用户

**响应 201:**

```json
{
  "id": "client-uuid",
  "client_id": "generated-client-id",
  "client_secret": "generated-secret",
  "client_name": "My Application",
  "client_description": "Description of my app",
  "redirect_uris": ["https://client.example.com/callback"],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "client_secret_basic",
  "pkce_required": false,
  "enabled": true,
  "created_by": "user-uuid",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 5.2 获取客户端列表

```
GET /api/clients
Authorization: Bearer {access_token}
```

**处理说明:**

- `developer` 角色仅返回自己创建的客户端列表（`WHERE created_by = 'user_id'`）
- `admin` 角色返回所有客户端列表

**响应 200:**

```json
{
  "clients": [
    {
      "id": "client-uuid",
      "client_id": "public-client-app",
      "client_name": "Public Client Application",
      "redirect_uris": ["http://localhost:8080/callback"],
      "grant_types": ["authorization_code", "implicit"],
      "response_types": ["code", "token", "id_token"],
      "token_endpoint_auth_method": "none",
      "pkce_required": true,
      "enabled": true,
      "created_by": "user-uuid",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "total": 2
}
```

### 5.3 获取客户端详情

```
GET /api/clients/:id
Authorization: Bearer {access_token}
```

**处理说明:**

- `developer` 角色只能查看自己创建的客户端详情
- `admin` 角色可以查看任意客户端详情

**响应 200:** 返回客户端对象，结构同上。

### 5.4 更新客户端

```
PUT /api/clients/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**处理说明:**

- `developer` 角色只能更新自己创建的客户端
- `admin` 角色可以更新任意客户端

**请求体:** 需要更新的部分字段。

**响应 200:** 更新后的客户端对象。

### 5.5 删除客户端

```
DELETE /api/clients/:id
Authorization: Bearer {access_token}
```

**处理说明:**

- `developer` 角色只能删除自己创建的客户端
- `admin` 角色可以删除任意客户端

**响应 204:** 无内容。

### 5.6 重置客户端密钥

重置指定客户端的 `client_secret`。重置后旧的 `client_secret` 立即失效。

```
POST /api/clients/:id/reset-secret
Authorization: Bearer {access_token}
```

**处理说明:**

- `developer` 角色只能重置自己创建的客户端的密钥
- `admin` 角色可以重置任意客户端的密钥

**响应 200:**

```json
{
  "client_id": "client_abc123...",
  "client_secret": "new-generated-secret"
}
```

***



## 6. 用户管理 API

> 本节接口需要 `admin` 角色。详见 [角色说明](#角色说明)。

### 6.1 获取用户列表

```
GET /api/users
Authorization: Bearer {admin_access_token}
```

**查询参数:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| limit | 否 | 返回条数（默认 50，最大 200） |
| offset | 否 | 偏移量（默认 0） |
| search | 否 | 搜索关键词（按用户名、邮箱、显示名称模糊匹配） |

**响应 200:**

```json
{
  "users": [
    {
      "id": "user-uuid",
      "username": "admin",
      "email": "admin@example.com",
      "display_name": "System Administrator",
      "picture": null,
      "email_verified": true,
      "phone": "13800138000",
      "qq": "123456789",
      "enabled": true,
      "role": "admin",
      "locale": "zh-CN",
      "zoneinfo": "Asia/Shanghai",
      "register_ip": "1.2.3.4",
      "register_ip_location": "北京市 电信",
      "last_login_ip": "5.6.7.8",
      "last_login_ip_location": "上海市 电信",
      "last_login_at": "2025-01-02T00:00:00Z",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-02T00:00:00Z"
    }
  ],
  "total": 2,
  "limit": 50,
  "offset": 0
}
```

### 6.2 获取用户详情

```
GET /api/users/:id
Authorization: Bearer {admin_access_token}
```

**响应 200:** 用户对象，返回字段同 6.1 列表中的完整用户信息（含 register_ip、last_login_ip 等全部字段）。

### 6.3 创建用户

```
POST /api/users
Content-Type: application/json
Authorization: Bearer {admin_access_token}
```

**请求体:**

```json
{
  "username": "newuser",
  "email": "new@example.com",
  "password": "securePassword123",
  "display_name": "New User",
  "role": "user",
  "enabled": true
}
```

**参数说明:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| username | 是 | 用户名 |
| email | 是 | 邮箱 |
| password | 是 | 密码 |
| display\_name | 否 | 显示名称 |
| role | 否 | 角色（默认 `user`） |
| enabled | 否 | 是否启用（默认 `true`） |

**响应 201:** 创建的用户对象。

### 6.4 更新用户

```
PUT /api/users/:id
Content-Type: application/json
Authorization: Bearer {admin_access_token}
```

**请求体:**

```json
{
  "display_name": "New Name",
  "email_verified": true,
  "enabled": true,
  "role": "developer",
  "password": "newPassword123",
  "phone": "13900139000",
  "qq": "987654321",
  "locale": "en-US",
  "zoneinfo": "America/New_York"
}
```

**可更新字段:** `display_name`, `email_verified`, `enabled`, `role`, `password`, `phone`, `qq`, `locale`, `zoneinfo`

**响应 200:** 更新后的用户对象。

### 6.5 删除用户

```
DELETE /api/users/:id
Authorization: Bearer {admin_access_token}
```

**注意:** 管理员不能删除自己的账号（返回 400 错误）。

**响应 204:** 无内容。

### 6.6 清除用户 2FA 绑定

管理员清除指定用户的 TOTP 双因素认证绑定，用于用户丢失验证设备时恢复账号访问。

```
POST /api/users/:id/clear-2fa
Authorization: Bearer {admin_access_token}
```

**响应 200:**

```json
{
  "message": "已清除该用户的 2FA 绑定"
}
```

***

## 7. 行为验证（极验 Geetest v4）

使用极验（Geetest）行为验证 v4 版本，在登录、注册、找回密码等敏感操作前进行人机验证。详细接入说明见 [geetest.md](geetest.md)。

### 7.1 获取极验验证初始化参数

前端加载极验 v4 组件前，先获取初始化参数。

```
POST /api/geetest/register
```

**响应 200:**

```json
{
  "captcha_id": "647f5ed2ed8acb4be36784e01556bb71",
  "success": 1
}
```

### 7.2 极验二次校验（服务端代理方式）

用户完成行为验证后，前端将验证结果提交到后端，由后端代理请求极验二次校验接口。

```
POST /api/geetest/validate
Content-Type: application/json
```

**请求体:**

```json
{
  "lot_number": "4dc3cfc2cdff448cad8d13107198d473",
  "captcha_output": "uj8Xx...",
  "pass_token": "f06f3a0c...",
  "gen_time": "1715850000"
}
```

**参数说明:**

| 参数              | 必填 | 说明                   |
| --------------- | -- | -------------------- |
| lot\_number     | 是  | 验证流水号，用户完成验证后由前端获取   |
| captcha\_output | 是  | 验证输出信息，用户完成验证后由前端获取  |
| pass\_token     | 是  | 验证通过标识，用户完成验证后由前端获取  |
| gen\_time       | 是  | 验证通过时间戳，用户完成验证后由前端获取 |

**响应 200（校验成功）:**

```json
{
  "status": "success",
  "result": "success",
  "reason": ""
}
```

**响应 200（校验失败）:**

```json
{
  "status": "success",
  "result": "fail",
  "reason": "pass_token expire"
}
```

**响应 200（请求异常）:**

```json
{
  "status": "error",
  "code": "-50005",
  "msg": "illegal gen_time",
  "desc": {
    "type": "defined error"
  }
}
```

> 注意：当请求极验二次校验接口异常或响应状态非 200 时，为保证业务流程不被阻塞，应默认放行并记录日志。

### 7.3 极验验证流程说明

```
1. 用户访问需要验证的页面（登录/注册/找回密码）
2. 前端调用 POST /api/geetest/register 获取 captcha_id
3. 前端加载极验 v4 组件：initGeetest4({ captchaId }, callback)
4. 用户完成行为验证（滑块/点击/无感）
5. 极验组件回调返回 lot_number / captcha_output / pass_token / gen_time
6. 前端将上述 4 个参数随业务请求一起提交
    - POST /api/auth/register（注册）
    - POST /api/auth/login（登录）
    - （或其他需要验证的接口）
7. 后端使用这 4 个参数 + captcha_id + sign_token（后端生成）
   POST 到极验服务端 http://gcaptcha4.geetest.com/validate 进行二次校验
   sign_token = HMAC-SHA256(lot_number, captcha_key)
8. 二次校验通过后，执行后续业务逻辑
9. 若二次校验失败，拒绝请求并提示用户重新验证
```

***

## 8. 邮件服务（阿里云邮件推送）

使用阿里云邮件推送（Direct Mail）服务发送激活邮件和找回密码邮件。

### 8.1 发送激活邮件

用户注册后，向用户邮箱发送激活链接。

```
POST /api/email/send-activation
Content-Type: application/json
```

**请求体:**

```json
{
  "email": "user@example.com"
}
```

**响应 200:**

```json
{
  "message": "激活邮件已发送",
  "expires_in": 3600
}
```

### 8.2 发送找回密码邮件

用户忘记密码时，向邮箱发送找回密码链接。

```
POST /api/email/send-reset-password
Content-Type: application/json
```

**请求体:**

```json
{
  "email": "user@example.com"
}
```

**响应 200:**

```json
{
  "message": "密码重置邮件已发送",
  "expires_in": 3600
}
```

### 8.3 验证激活码

用户点击邮件中的激活链接，验证激活码并激活账号。

```
GET /api/email/verify-activation?code={activation_code}&email={email}
```

**响应 200:**

```json
{
  "message": "账号已成功激活",
  "redirect_uri": "/login"
}
```

**响应 400:**

```json
{
  "error": "invalid_activation_code",
  "message": "激活码无效或已过期"
}
```

### 8.4 重置密码

用户点击邮件中的找回密码链接，提交新密码完成重置。

```
POST /api/email/reset-password
Content-Type: application/json
```

**请求体:**

```json
{
  "email": "user@example.com",
  "reset_code": "邮件中的重置码",
  "new_password": "newSecurePassword123",
  "confirm_password": "newSecurePassword123"
}
```

**响应 200:**

```json
{
  "message": "密码已重置成功",
  "redirect_uri": "/login"
}
```

**响应 400:**

```json
{
  "error": "invalid_reset_code",
  "message": "重置码无效或已过期"
}
```

### 8.5 邮件发送流程说明

```
用户注册/找回密码
  → 后端生成随机验证码/令牌（6位数字或UUID）
  → 验证码存入Redis（key: email:code:{email}, TTL: 3600秒）
  → 调用阿里云Direct Mail API发送邮件
  → 用户点击邮件中的链接或输入验证码
  → 后端校验Redis中的验证码
  → 验证通过后执行激活/重置密码操作
  → 清除Redis中的验证码（一次性使用）
```

***

## 9. 第三方登录

> **实现状态:** ✅ GitHub + QQ 第三方登录已完成
> 环境变量配置：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`QQ_APP_ID`、`QQ_APP_KEY`

### 9.1 获取第三方登录提供商列表

返回已配置的第三方登录提供商列表。

```
GET /api/auth/social/providers
```

**响应 200:**

```json
{
  "providers": [
    {
      "provider": "github",
      "name": "GitHub",
      "icon": "github",
      "authorization_url": "/api/auth/social/github/login",
      "enabled": true
    },
    {
      "provider": "qq",
      "name": "QQ",
      "icon": "qq",
      "authorization_url": "/api/auth/social/qq/login",
      "enabled": true
    },
    {
      "provider": "wechat",
      "name": "微信",
      "icon": "wechat",
      "authorization_url": "/api/auth/social/wechat/login",
      "enabled": false
    }
  ]
}
```

### 9.2 发起第三方登录

将用户重定向到第三方 OAuth 授权页面。

```
GET /api/auth/social/:provider/login
```

**查询参数:**

| 参数            | 必填 | 说明                              |
| ------------- | -- | ------------------------------- |
| redirect\_uri | 是  | 第三方登录完成后的重定向URI                 |
| state         | 是  | OAuth state（base64 JSON，包含会话信息） |

**响应:** HTTP 302 重定向到第三方 OAuth 授权页面。

### 9.3 绑定第三方账号（已登录用户）

当前已登录用户绑定第三方社交账号。

```
GET /api/auth/social/:provider/bind
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "redirect_url": "https://github.com/login/oauth/authorize?client_id=xxx&state=yyy&redirect_uri=..."
}
```

> 前端收到 `redirect_url` 后，将用户重定向到该地址完成第三方 OAuth 授权流程。授权完成后自动绑定到当前用户账号。

### 9.5 第三方登录回调

用户在第三方平台授权后，由第三方 OAuth 提供者回调到此地址。

```
GET /api/auth/social/:provider/callback?code={code}&state={state}
```

**响应 302 重定向:**

```
HTTP/1.1 302 Found
Location: {original_redirect_uri}?code={oidc_authorization_code}&state={original_state}
```

**处理流程:**

1. 验证 Redis 中的 OAuth state
2. 用 `code` 向第三方提供商换取 `access_token`
3. 调用第三方 API 获取用户资料
4. 在 `social_connections` 表中查找或创建本地用户
5. 生成 OIDC 授权码
6. 重定向回原始的 `redirect_uri`

### 9.6 获取用户的社交账号绑定

列出当前认证用户已绑定的所有社交账号。

```
GET /api/user/social/connections
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "connections": [
    {
      "id": "conn-uuid",
      "provider": "github",
      "provider_username": "octocat",
      "provider_email": "octocat@github.com",
      "provider_avatar": "https://avatars.githubusercontent.com/u/1",
      "linked_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

### 9.7 解绑社交账号

从用户解绑指定的社交账号。

```
DELETE /api/user/social/connections/:connectionId
Authorization: Bearer {access_token}
```

**响应 204:** 无内容。

***

## 10. WebAuthn / Passkeys（浏览器密钥）

> **实现状态:** ✅ 全部 6 个端点已完成
> 支持平台认证器（Windows Hello / Mac Touch ID / 手机人脸）和漫游认证器（YubiKey / Google Titan）
> 算法支持：ES256(P-256) 和 RS256
> 安全特性：挑战码防重放、Origin/RPID 校验、防克隆计数器检测

### 10.1 获取用户的凭证列表

列出当前认证用户已注册的所有 WebAuthn 凭证。

```
GET /api/webauthn/credentials
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "credentials": [
    {
      "id": "cred-id-base64",
      "nickname": "我的YubiKey",
      "device_name": "YubiKey 5 NFC",
      "credential_type": "public-key",
      "transports": ["usb", "nfc"],
      "created_at": "2025-01-01T00:00:00Z",
      "last_used_at": "2025-01-02T00:00:00Z"
    }
  ]
}
```

### 10.2 开始 WebAuthn 注册

生成用于创建新凭证的注册选项。

```
POST /api/webauthn/register/begin
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "nickname": "我的YubiKey",
  "discoverable": true
}
```

**响应 200:**

```json
{
  "publicKey": {
    "rp": {
      "name": "ZJSSO System",
      "id": "localhost"
    },
    "user": {
      "id": "base64url-user-id",
      "name": "user@example.com",
      "displayName": "Test User"
    },
    "challenge": "base64url-challenge",
    "pubKeyCredParams": [
      {"type": "public-key", "alg": -7},
      {"type": "public-key", "alg": -257}
    ],
    "timeout": 60000,
    "excludeCredentials": [],
    "authenticatorSelection": {
      "residentKey": "required",
      "userVerification": "preferred"
    },
    "attestation": "none"
  }
}
```

### 10.3 完成 WebAuthn 注册

用认证器的响应完成新凭证的注册。

```
POST /api/webauthn/register/complete
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "id": "credential-id",
  "rawId": "base64url-raw-id",
  "response": {
    "clientDataJSON": "base64url...",
    "attestationObject": "base64url...",
    "transports": ["usb", "nfc"]
  },
  "type": "public-key"
}
```

**响应 201:**

```json
{
  "id": "credential-id",
  "nickname": "我的YubiKey",
  "device_name": "YubiKey 5 NFC",
  "created_at": "2025-01-01T00:00:00Z"
}
```

### 10.4 开始 WebAuthn 认证

生成用于验证用户身份的认证选项。

```
POST /api/webauthn/login/begin
Content-Type: application/json
```

**请求体（可选，用于可发现凭证）:**

```json
{
  "username": "testuser"
}
```

**响应 200:**

```json
{
  "publicKey": {
    "challenge": "base64url-challenge",
    "timeout": 60000,
    "rpId": "localhost",
    "allowCredentials": [
      {
        "type": "public-key",
        "id": "base64url-cred-id",
        "transports": ["usb", "nfc"]
      }
    ],
    "userVerification": "preferred"
  }
}
```

### 10.5 完成 WebAuthn 认证

验证认证器响应并签发 OIDC 授权码。

```
POST /api/webauthn/login/complete
Content-Type: application/json
```

**请求体:**

```json
{
  "id": "credential-id",
  "rawId": "base64url-raw-id",
  "response": {
    "clientDataJSON": "base64url...",
    "authenticatorData": "base64url...",
    "signature": "base64url...",
    "userHandle": "base64url..."
  },
  "type": "public-key"
}
```

**响应 200:**

```json
{
  "code": "oidc-authorization-code",
  "redirect_uri": "/oauth/authorize?..."
}
```

### 10.6 删除 WebAuthn 凭证

删除已注册的凭证。

```
DELETE /api/webauthn/credentials/:credentialId
Authorization: Bearer {access_token}
```

**响应 204:** 无内容。

***

## 11. 错误响应

### 11.1 OAuth 错误响应

```json
{
  "error": "invalid_grant",
  "error_description": "授权码已过期或已被使用"
}
```

常见错误码:

| 错误码                      | 说明             |
| ------------------------ | -------------- |
| `invalid_request`        | 缺少必要参数         |
| `invalid_client`         | 客户端认证失败        |
| `invalid_grant`          | 授权码/刷新令牌无效或已过期 |
| `unauthorized_client`    | 客户端未获授权使用该授权类型 |
| `unsupported_grant_type` | 不支持的授权类型       |
| `invalid_scope`          | 作用域无效或未授权      |
| `access_denied`          | 资源所有者拒绝请求      |
| `login_required`         | 需要用户登录         |

### 11.2 API 错误响应

```json
{
  "error": "Validation Error",
  "message": "邮箱已被使用",
  "statusCode": 409
}
```

### 11.3 WebAuthn 错误响应

```json
{
  "error": "WebAuthn Error",
  "message": "凭证验证失败：签名不匹配",
  "statusCode": 401
}
```

***

## 12. 认证模式

### 12.1 会话模式

| 模式  | 说明                                     | 配置值                      |
| --- | -------------------------------------- | ------------------------ |
| 有状态 | 会话存储在 Redis 中，access\_token 为随机字符串     | `SESSION_MODE=stateful`  |
| 无状态 | 会话包含在 JWT 中，access\_token 为签名的 JWT（默认） | `SESSION_MODE=stateless` |

### 12.2 客户端认证方式

| 方式                    | 说明                     | 适用场景          |
| --------------------- | ---------------------- | ------------- |
| `client_secret_basic` | HTTP Basic Auth 头部（默认） | 机密客户端         |
| `client_secret_post`  | 客户端凭证放在 POST 请求体中      | 机密客户端         |
| `none`                | 无需客户端认证                | 公开客户端（需 PKCE） |

### 12.3 用户角色鉴权

JWT 的 access\_token 中包含 `role` 字段，用于接口级权限控制。

| 角色   | 层级 | JWT 中的 role 值 | 说明                                                |
| ---- | -- | ------------- | ------------------------------------------------- |
| 普通用户 | 1  | `user`        | 默认角色，可登录、管理个人资料                                   |
| 开发者  | 2  | `developer`   | 可注册和管理 **自己创建** 的 OIDC 客户端（受 `created_by` 数据隔离约束） |
| 管理员  | 3  | `admin`       | 可管理所有用户、客户端和系统配置                                  |

接口权限遵循层级包含关系：`admin` 可访问所有接口，`developer` 可访问 developer 及以下接口，`user` 仅可访问基础接口。权限不足时返回 403。详见 [角色说明](#角色说明)。

***

## 13. 第三方登录配置（环境变量）

每个第三方登录提供商需要特定的环境变量配置。

### GitHub

```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/social/github/callback
```

### QQ

```
QQ_APP_ID=your-qq-app-id
QQ_APP_KEY=your-qq-app-key
QQ_CALLBACK_URL=http://localhost:3000/api/auth/social/qq/callback
```

### 微信

```
WECHAT_APP_ID=your-wechat-app-id
WECHAT_APP_SECRET=your-wechat-app-secret
WECHAT_CALLBACK_URL=http://localhost:3000/api/auth/social/wechat/callback
```

***

## 14. 邮件服务配置（阿里云DirectMail）

```
ALIYUN_DM_ACCESS_KEY_ID=your-aliyun-access-key-id
ALIYUN_DM_ACCESS_KEY_SECRET=your-aliyun-access-key-secret
ALIYUN_DM_ACCOUNT_NAME=no-reply@example.com
ALIYUN_DM_FROM_ALIAS=ZJSSO系统
ALIYUN_DM_REGION=cn-hangzhou
EMAIL_VERIFICATION_EXPIRES=3600
```

## 15. 极验配置（Geetest v4）

```
GEETEST_CAPTCHA_ID=your-geetest-captcha-id
GEETEST_CAPTCHA_KEY=your-geetest-captcha-key
GEETEST_API_URL=http://gcaptcha4.geetest.com
```

> 二次校验签名算法：`sign_token = HMAC-SHA256(lot_number, captcha_key)`，使用标准 hmac 算法，以 `lot_number` 作为原始消息，以 `captcha_key`（GEETEST\_CAPTCHA\_KEY）作为密钥，采用 sha256 散列算法生成。详见 [geetest.md](geetest.md)。

***

## 16. 速率限制

详见 [第 26 节 - 速率限制（完整版）](#26-%E9%80%9F%E7%8E%87%E9%99%90%E5%88%B6%E5%AE%8C%E6%95%B4%E7%89%88)。

***

## 17. CORS

所有端点支持 CORS，可配置允许的来源。开发环境下默认允许所有来源。

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

***

## 18. 身份验证 API

> **实现状态:** ✅ 全部 3 个端点已完成
> 支持三种验证方式：邮箱验证码、TOTP、通行密钥（Passkey）
> 验证通过后颁发安全凭据（ticket），用于修改邮箱等敏感操作

### 18.1 获取可用验证方式

获取当前用户可用的身份验证方式列表。

```
GET /api/auth/verify/methods
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "methods": ["email", "totp", "passkey"]
}
```

> 根据用户配置返回可用方式，可能的值：`email`（邮箱验证码）、`totp`（身份验证器）、`passkey`（通行密钥）。

### 18.2 发送邮箱验证码

向当前用户的邮箱发送 6 位数字验证码。

```
POST /api/auth/verify/send-email
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "sent": true
}
```

### 18.3 验证身份

验证用户身份并返回安全凭据（ticket），用于后续敏感操作（如修改邮箱）。

```
POST /api/auth/verify/check
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体（邮箱验证码）:**

```json
{
  "method": "email",
  "code": "123456",
  "action": "change_email"
}
```

**请求体（TOTP 验证码）:**

```json
{
  "method": "totp",
  "code": "123456",
  "action": "change_email"
}
```

**请求体（通行密钥）:**

```json
{
  "method": "passkey",
  "code": "{JSON-serialized-credential-data}",
  "action": "change_email"
}
```

**参数说明:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| method | 是 | 验证方式：`email`、`totp`、`passkey` |
| code | 是 | 验证码或通行密钥凭证数据 |
| action | 否 | 操作标识（如 `change_email`、`disable_2fa`、`generic`），默认 `generic` |

**响应 200:**

```json
{
  "verified": true,
  "ticket": "encrypted-security-ticket"
}
```

> `ticket` 有效期为 5 分钟，仅可用于指定的 `action` 操作。

***

## 19. TOTP 双因素认证 API

> **实现状态:** ✅ 全部 5 个端点已完成
> 基于 RFC 6238（TOTP）标准，使用 30 秒窗口期
> 支持 Google Authenticator / Microsoft Authenticator 等标准 TOTP 应用

### 19.1 检查 TOTP 状态

检查当前用户是否已启用 TOTP 双因素认证。

```
GET /api/auth/totp/status
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "enabled": false
}
```

### 19.2 设置 TOTP

开始设置 TOTP 双因素认证，生成密钥和 QR 码。

```
POST /api/auth/totp/setup
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "otpauth_url": "otpauth://totp/ZJSSO:username?secret=JBSWY3DPEHPK3PXP&issuer=ZJSSO",
  "qr_code": "data:image/png;base64,iVBORw0KGgo..."
}
```

> 前端应将 `qr_code`（Base64 PNG）显示为二维码供用户扫描，或提示用户手动输入 `secret`。调用此接口会覆盖之前的未验证设置。

### 19.3 验证并启用 TOTP

使用 TOTP 验证码验证并启用双因素认证。需先调用 `19.2` 完成设置。

```
POST /api/auth/totp/verify
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "code": "123456"
}
```

**参数说明:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| code | 是 | 认证器应用中的 6 位数字验证码 |

**响应 200:**

```json
{
  "enabled": true,
  "message": "2FA 已启用"
}
```

### 19.4 关闭 TOTP

关闭当前用户的 TOTP 双因素认证。需提供 TOTP 验证码或安全凭据（ticket）。

```
POST /api/auth/totp/disable
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体（使用 TOTP 验证码）:**

```json
{
  "code": "123456"
}
```

**请求体（使用安全凭据）:**

```json
{
  "ticket": "security-ticket-from-verify"
}
```

**参数说明:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| code | 二选一 | TOTP 验证码 |
| ticket | 二选一 | 通过 `POST /api/auth/verify/check` 获取的安全凭据 |

**响应 200:**

```json
{
  "enabled": false
}
```

### 19.5 使用 TOTP 完成登录

在登录接口返回 `require_2fa: true` 后，使用临时令牌和 TOTP 验证码完成登录。

```
POST /api/auth/totp/login-check
Content-Type: application/json
```

**请求体:**

```json
{
  "temp_token": "encrypted-temp-token-from-login",
  "code": "123456"
}
```

**参数说明:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| temp\_token | 是 | 登录接口返回的临时令牌（5 分钟有效） |
| code | 是 | 认证器应用中的 6 位数字验证码 |

**响应 200（验证成功）:**

```json
{
  "verified": true,
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "8xLOxBtZp8",
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "admin",
    "email": "admin@example.com",
    "display_name": "System Administrator",
    "picture": null,
    "role": "admin",
    "qq": "123456789"
  }
}
```

***

## 20. 头像/Logo 上传 API（腾讯云 COS）

> **实现状态:** ✅ 全部 6 个端点已完成
> 使用腾讯云对象存储（COS）存储头像和客户端 Logo
> 上传方式：前端先获取签名，然后直接 POST 到腾讯云 COS，最后确认上传

### 20.1 获取头像上传签名

获取用于上传头像到腾讯云 COS 的签名参数。

```
GET /api/upload/avatar-signature?filename=avatar.jpg
Authorization: Bearer {access_token}
```

**查询参数:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| filename | 是 | 上传的文件名（用于推断扩展名） |

**响应 200:**

```json
{
  "uploadUrl": "https://bucket.cos.region.myqcloud.com/",
  "avatar_url": "https://bucket.cos.region.myqcloud.com/avatars/user-id-123.jpg",
  "key": "avatars/user-id_1715850000_abcd.jpg",
  "expired": 1715850300,
  "formData": {
    "key": "avatars/user-id_1715850000_abcd.jpg",
    "policy": "base64-encoded-policy",
    "q-sign-algorithm": "sha1",
    "q-ak": "AKIDxxxxx",
    "q-key-time": "1715850000;1715850300",
    "q-signature": "hex-signature",
    "pic-operations": "{\"is_pic_info\":1,\"rules\":[{\"fileid\":\"/avatars/user-id_1715850000_abcd.jpg\",\"rule\":\"imageMogr2/format/webp/quality/85\"}]}"
  },
  "constraints": {
    "allowedExtensions": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    "maxFileSize": 2097152
  }
}
```

> 前端使用 `uploadUrl` + `formData` 以 POST 表单方式上传文件到腾讯云 COS。`pic-operations` 指定了上传后自动转 WebP 格式。

### 20.2 确认头像上传

上传头像到 COS 后，通知后端更新用户头像。

```
POST /api/upload/avatar-confirm
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "key": "avatars/user-id_1715850000_abcd.jpg"
}
```

**响应 200:**

```json
{
  "avatar": "https://bucket.cos.region.myqcloud.com/avatars/user-id_1715850000_abcd.jpg"
}
```

### 20.3 删除头像

删除当前用户的头像（同时删除 COS 中的文件）。

```
DELETE /api/upload/avatar
Authorization: Bearer {access_token}
```

**响应 200:**

```json
{
  "deleted": true
}
```

### 20.4 获取客户端 Logo 上传签名

获取用于上传客户端 Logo 到腾讯云 COS 的签名参数。

```
GET /api/upload/client-logo-signature?clientId=xxx&filename=logo.png
Authorization: Bearer {access_token}
```

**查询参数:**

| 参数 | 必填 | 说明 |
| --- | --- | --- |
| clientId | 是 | 客户端内部 ID（UUID） |
| filename | 是 | 上传的文件名（用于推断扩展名） |

**响应 200:** 结构与 20.1 类似，包含 `uploadUrl`、`logo_url`、`key`（以 `logos/` 开头）、`formData`、`constraints`。

### 20.5 确认客户端 Logo 上传

上传客户端 Logo 到 COS 后，通知后端更新客户端 Logo 地址。自动删除旧的 Logo 文件。

```
POST /api/upload/client-logo-confirm
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "key": "logos/client-id_1715850000_abcd.png",
  "clientId": "client-internal-uuid"
}
```

**响应 200:**

```json
{
  "logo_uri": "https://bucket.cos.region.myqcloud.com/logos/client-id_1715850000_abcd.png"
}
```

### 20.6 删除客户端 Logo

删除指定客户端的 Logo（同时删除 COS 中的文件）。

```
DELETE /api/upload/client-logo
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体:**

```json
{
  "clientId": "client-internal-uuid"
}
```

**响应 200:**

```json
{
  "logo_uri": null
}
```

***

## 21. 健康检查

```
GET /health
```

**响应 200:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

***

## 22. IP 地理定位配置（环境变量）

系统使用 IP 归属地 API 获取登录/注册时的 IP 地理位置信息。

```
IP_API_ID=your-ip-api-id
IP_API_KEY=your-ip-api-key
```

> 用于记录用户注册 IP 归属地和登录 IP 归属地，在安全通知（异地登录提醒）中使用。

***

## 23. 腾讯云 COS 配置（环境变量）

用于存储用户头像和客户端 Logo。

```
COS_SECRET_ID=your-cos-secret-id
COS_SECRET_KEY=your-cos-secret-key
COS_BUCKET=your-bucket-name
COS_REGION=ap-guangzhou
COS_CUSTOM_DOMAIN=https://cdn.example.com
```

> `COS_CUSTOM_DOMAIN` 可选，设置后头像和 Logo 使用自定义域名访问。

***

## 24. WebAuthn 配置（环境变量）

```
WEBAUTHN_RP_ID=localhost
WEBAUTHN_RP_NAME=ZJSSO System
WEBAUTHN_ALLOWED_ORIGINS=http://localhost,http://localhost:5173,http://localhost:5174,http://localhost:4173
```

***

## 25. 其他环境变量

### JWT 配置

```
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_EXPIRES_IN=604800
```

### 会话配置

```
SESSION_MODE=stateless
SESSION_SECRET=your-session-secret
SESSION_EXPIRES_IN=86400
```

### 前端地址配置

```
FRONTEND_URL=http://localhost:6873
```

> `FRONTEND_URL` 用于社交登录回调时重定向回前端页面。

---

## 26. 速率限制（完整版）

| 端点 / 限制 | 限制 | 窗口 | 说明 |
| --- | --- | --- | --- |
| `/oauth/token` | 20 次请求 | 1 分钟 | Token 端点 |
| `/oauth/authorize` | 30 次请求 | 1 分钟 | 授权端点 |
| `/api/auth/register` | 3 次请求 | 1 小时 | 注册（按 IP） |
| `/api/auth/login` | 10 次请求 | 15 分钟 | 登录（按 IP） |
| `/api/email/send-*` | 5 次请求 | 1 小时 | 邮件发送（按 IP） |
| `/api/email/send-*` | 3 次请求 | 24 小时 | 邮件发送（按收件邮箱） |
| `/api/geetest/*` | 30 次请求 | 1 分钟 | 极验验证 |
| `/api/clients/register` | 20 次请求 | 1 分钟 | 注册客户端 |
| `/api/webauthn/*` | 10 次请求 | 1 分钟 | WebAuthn 操作 |
| `/api/*` | 100 次请求 | 1 分钟 | 通用 API 限制 |
| `/*` | 200 次请求 | 1 分钟 | 全局限制 |

