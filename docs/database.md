# 数据库设计文档

## 概述

- **数据库引擎**: MySQL 5.7+
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci
- **缓存**: Redis 6.x+ (用于会话管理、Token黑名单、速率限制)

---

## 1. 数据库ER图

```
┌──────────────────┐       ┌──────────────────┐       ┌────────────────────────┐
│      users       │       │     clients      │       │  social_connections    │
├──────────────────┤       ├──────────────────┤       ├────────────────────────┤
│ id (PK)          │       │ id (PK)          │       │ id (PK)                │
│ username (UNIQUE)│       │ client_id (UNIQUE)│      │ user_id (FK)           │
│ email (UNIQUE)   │       │ client_secret    │       │ provider               │
│ password_hash    │──┐    │ client_name      │       │ provider_user_id       │
│ display_name     │  │    │ redirect_uris    │       │ provider_username      │
│ picture          │  │    │ grant_types      │       │ provider_email         │
│ email_verified   │  │    │ response_types   │       │ provider_avatar        │
│ phone            │  │    │ ...              │       │ raw_profile            │
│ phone_verified   │  │    │ enabled          │       │ access_token           │
│ locale           │  │    │ created_at       │       │ refresh_token          │
│ zoneinfo         │  │    │ updated_at       │       │ token_expires_at       │
│ qq               │  │    └────────┬─────────┘       │ linked_at              │
│ enabled          │  │             │                 │ updated_at             │
│ created_at       │  │             │                 │ UNIQUE: provider+      │
│ updated_at       │  │             │                 │   provider_user_id     │
└────────┬─────────┘  │             │                 └────────────────────────┘
         │            │             │
         │            │             │                 ├────────────────────────┤
         │            │             │                 │ id (PK)                │
         │            │             │                 │ user_id (FK)           │
         │            │             │                 │ credential_id          │
         │            ▼             │                 │ credential_public_key  │
         │    ┌───────────────┐     │                 │ counter                │
         │    │ authorization_│     │                 │ credential_type        │
         │    │ codes         │     │                 │ attestation_type       │
         │    ├───────────────┤     │                 │ transports (JSON)      │
         │    │ code (PK)     │     │                 │ aaguid                 │
         │    │ client_id (FK)│─────┘                 │ nickname               │
         │    │ user_id (FK)  │                       │ device_name            │
         │    │ redirect_uri  │                       │ created_at             │
         │    │ scope         │                       │ last_used_at           │
         │    │ state         │                       └────────────────────────┘
         │    │ nonce         │
         │    │ code_challenge│       ┌──────────────────┐
         │    │ code_challenge│       │  user_consents   │
         │    │   method      │       ├──────────────────┤
         │    │ expires_at    │       │ id (PK)          │
         │    │ used          │       │ user_id (FK)     │
         │    │ created_at    │       │ client_id (FK)   │
         │    └───────────────┘       │ scopes (JSON)    │
         │                           │ granted_at       │
         │    ┌───────────────┐       │ expires_at       │
         │    │ access_tokens │       │ UNIQUE: user_id+ │
         │    ├───────────────┤       │   client_id      │
         │    │ id (PK)       │       └──────────────────┘
         │    │ token_hash    │
         │    │ client_id (FK)│──────┐
         │    │ user_id (FK)  │      │
         │    │ scopes        │      │
         │    │ expires_at    │      │
         │    │ created_at    │      │
         │    └───────────────┘      │
         │                           │
         │    ┌───────────────┐      │
         │    │ refresh_tokens│      │
         │    ├───────────────┤      │
         │    │ id (PK)       │      │
         │    │ token_hash    │      │
         │    │ client_id (FK)│──────┘
         │    │ user_id (FK)  │
         │    │ scopes        │
         │    │ expires_at    │
         │    │ used          │
         │    │ revoked       │
         │    │ created_at    │
         │    └───────────────┘
         │
         │    ┌──────────────────┐
         │    │  oidc_sessions   │
         │    ├──────────────────┤
         │    │ id (PK)          │
         └────│ session_id(UNIQUE)│
              │ user_id (FK)     │
              │ client_id (FK)   │
              │ state            │
              │ nonce            │
              │ oauth_state      │
              │ redirect_uri     │
              │ scopes           │
              │ expires_at       │
              │ created_at       │
              │ updated_at       │
              └──────────────────┘
```

---

## 2. 表结构详细说明

### 2.1 `users` - 用户表

核心用户账户表，存储认证基础信息和OIDC标准claims。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| username | VARCHAR(255) | UNIQUE, NOT NULL | 用户名，用于登录 |
| email | VARCHAR(255) | UNIQUE, NOT NULL | 邮箱，用于登录和OIDC claims |
| password_hash | VARCHAR(255) | NULLABLE | bcrypt密码哈希（第三方登录用户可为空） |
| display_name | VARCHAR(255) | NULLABLE | 显示名称 |
| picture | VARCHAR(512) | NULLABLE | 头像URL |
| email_verified | BOOLEAN | DEFAULT FALSE | 邮箱是否已验证 |
| phone | VARCHAR(20) | NULLABLE | 电话号码 |
| phone_verified | BOOLEAN | DEFAULT FALSE | 电话是否已验证 |
| locale | VARCHAR(10) | DEFAULT 'zh-CN' | 语言区域 |
| zoneinfo | VARCHAR(50) | NULLABLE | 时区 |
| qq | VARCHAR(20) | NULLABLE | QQ号 |
| enabled | BOOLEAN | DEFAULT TRUE | 账户是否启用 |
| role | VARCHAR(20) | NOT NULL, DEFAULT 'user' | 角色: user(普通用户), developer(开发者), admin(管理员) |
| register_ip | VARCHAR(45) | NULLABLE | 注册时的IP地址 |
| register_ip_location | VARCHAR(255) | NULLABLE | 注册IP的归属地（如"中国 天津市 联通"） |
| last_login_ip | VARCHAR(45) | NULLABLE | 最后一次登录IP地址 |
| last_login_ip_location | VARCHAR(255) | NULLABLE | 最后一次登录IP归属地 |
| last_login_at | TIMESTAMP | NULLABLE | 最后一次登录时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE | 更新时间 |

**索引:**
- PRIMARY KEY (`id`)
- UNIQUE KEY `idx_email` (`email`)
- UNIQUE KEY `idx_username` (`username`)

> `password_hash` 允许为 NULL：支持纯第三方登录用户（通过GitHub/QQ登录的用户不需要密码）

---

### 2.2 `clients` - OIDC客户端表

注册的OIDC客户端应用信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| client_id | VARCHAR(255) | UNIQUE, NOT NULL | 客户端标识符 |
| client_secret | VARCHAR(255) | NULLABLE | bcrypt哈希后的客户端密钥 |
| client_name | VARCHAR(255) | NOT NULL | 客户端名称 |
| client_description | TEXT | NULLABLE | 客户端描述 |
| logo_uri | VARCHAR(512) | NULLABLE | Logo URL |
| homepage_uri | VARCHAR(512) | NULLABLE | 主页URL |
| redirect_uris | JSON | NOT NULL | 允许的重定向URI列表 |
| post_logout_redirect_uris | JSON | NULLABLE | 登出后重定向URI列表 |
| grant_types | JSON | NOT NULL | 允许的授权类型 |
| response_types | JSON | NOT NULL | 允许的响应类型 |
| token_endpoint_auth_method | VARCHAR(50) | DEFAULT 'client_secret_basic' | Token端点认证方式 |
| pkce_required | BOOLEAN | DEFAULT FALSE | 是否强制PKCE |
| access_token_expires_in | INT | DEFAULT 3600 | access_token过期时间(秒) |
| refresh_token_expires_in | INT | DEFAULT 604800 | refresh_token过期时间(秒) |
| created_by | VARCHAR(36) | NULLABLE, FK | 创建者用户ID（关联users.id），用于开发者角色数据隔离 |
| enabled | BOOLEAN | DEFAULT TRUE | 是否启用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE | 更新时间 |

**索引:**
- PRIMARY KEY (`id`)
- INDEX `idx_client_id` (`client_id`)
- INDEX `idx_created_by` (`created_by`)

**JSON字段示例:**
```json
-- redirect_uris
["http://localhost:8080/callback", "http://localhost:3001/callback"]

-- grant_types
["authorization_code", "refresh_token"]

-- response_types
["code"]
```

---

### 2.3 `authorization_codes` - 授权码表

授权码流程中临时存储授权码信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| code | VARCHAR(255) | PK | 授权码 |
| client_id | VARCHAR(36) | FK, NOT NULL | 关联客户端ID |
| user_id | VARCHAR(36) | FK, NOT NULL | 关联用户ID |
| redirect_uri | VARCHAR(512) | NOT NULL | 原始重定向URI |
| scope | VARCHAR(512) | NULLABLE | 请求的scope |
| state | VARCHAR(255) | NULLABLE | CSRF保护state值 |
| nonce | VARCHAR(255) | NULLABLE | 防重放nonce值 |
| code_challenge | VARCHAR(255) | NULLABLE | PKCE challenge值 |
| code_challenge_method | VARCHAR(10) | NULLABLE | PKCE方法(S256/plain) |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| used | BOOLEAN | DEFAULT FALSE | 是否已使用 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**外键:**
- `client_id` → `clients(id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE CASCADE

---

### 2.4 `access_tokens` - 访问令牌表

有状态模式下存储access_token信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | SHA256(token)哈希值 |
| client_id | VARCHAR(36) | FK, NOT NULL | 关联客户端ID |
| user_id | VARCHAR(36) | FK, NULLABLE | 关联用户ID(client_credentials时为空) |
| scopes | TEXT | NULLABLE | 授权scope列表 |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

---

### 2.5 `refresh_tokens` - 刷新令牌表

存储refresh_token用于token续期。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| token_hash | VARCHAR(255) | UNIQUE, NOT NULL | SHA256(token)哈希值 |
| client_id | VARCHAR(36) | FK, NULLABLE | 关联客户端ID（直接登录时为NULL） |
| user_id | VARCHAR(36) | FK, NOT NULL | 关联用户ID |
| scopes | TEXT | NULLABLE | 授权scope列表 |
| expires_at | TIMESTAMP | NOT NULL | 过期时间 |
| used | BOOLEAN | DEFAULT FALSE | 是否已使用 |
| revoked | BOOLEAN | DEFAULT FALSE | 是否已撤销 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

**安全说明:** refresh_token使用后标记`used=true`并轮换生成新的refresh_token

---

### 2.6 `oidc_sessions` - OIDC会话表

跟踪OIDC授权流程中的会话状态。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| session_id | VARCHAR(255) | UNIQUE, NOT NULL | 会话标识符 |
| user_id | VARCHAR(36) | FK, NULLABLE | 关联用户ID(未登录时为空) |
| client_id | VARCHAR(36) | FK, NOT NULL | 关联客户端ID |
| state | VARCHAR(255) | NULLABLE | OAuth state参数 |
| nonce | VARCHAR(255) | NULLABLE | OIDC nonce参数 |
| oauth_state | VARCHAR(255) | NULLABLE | 流程状态(pending_login/pending_consent/completed) |
| redirect_uri | VARCHAR(512) | NULLABLE | 重定向URI |
| scopes | TEXT | NULLABLE | 请求的scope |
| expires_at | TIMESTAMP | NOT NULL | 会话过期时间 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE | 更新时间 |

---

### 2.7 `user_consents` - 用户授权同意表

记录用户对某个客户端授权的scope，避免每次授权都弹出确认页面。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| user_id | VARCHAR(36) | FK, NOT NULL | 关联用户ID |
| client_id | VARCHAR(36) | FK, NOT NULL | 关联客户端ID |
| scopes | JSON | NOT NULL | 授权scope列表 |
| granted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 授权时间 |
| expires_at | TIMESTAMP | NULLABLE | 授权过期时间(NULL=永不过期) |

**唯一索引:** UNIQUE KEY `unique_user_client` (`user_id`, `client_id`)

---

### 2.8 `social_connections` - 第三方登录关联表

记录用户绑定的第三方社交账号（GitHub、QQ、微信、抖音等）。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | UUID主键 |
| user_id | VARCHAR(36) | FK, NOT NULL | 关联用户ID |
| provider | VARCHAR(50) | NOT NULL | 第三方提供商(github/qq/wechat/douyin/weibo) |
| provider_user_id | VARCHAR(255) | NOT NULL | 第三方用户唯一ID |
| provider_username | VARCHAR(255) | NULLABLE | 第三方用户名 |
| provider_email | VARCHAR(255) | NULLABLE | 第三方邮箱 |
| provider_avatar | VARCHAR(512) | NULLABLE | 第三方头像URL |
| raw_profile | TEXT | NULLABLE | 第三方原始资料(JSON) |
| access_token | TEXT | NULLABLE | 第三方access_token(用于API调用) |
| refresh_token | TEXT | NULLABLE | 第三方refresh_token |
| token_expires_at | TIMESTAMP | NULLABLE | 第三方token过期时间 |
| linked_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 绑定时间 |
| updated_at | TIMESTAMP | ON UPDATE | 更新时间 |

**外键:**
- `user_id` → `users(id)` ON DELETE CASCADE

**唯一索引:** UNIQUE KEY `unique_provider_account` (`provider`, `provider_user_id`)

**支持提供商列表:**
| provider值 | 平台 | 说明 |
|---|---|---|
| `github` | GitHub | OAuth2 + 用户API |
| `qq` | QQ互联 | OAuth2 + OpenID |
| `wechat` | 微信开放平台 | OAuth2 + UnionID |
| `wechat_work` | 企业微信 | OAuth2 |
| `dingtalk` | 钉钉 | OAuth2 |
| `douyin` | 抖音 | OAuth2 |
| `weibo` | 微博 | OAuth2 |
| `google` | Google | OpenID Connect |
| `apple` | Apple | Sign in with Apple |

---

### 2.9 `user_credentials` - 用户密钥表（WebAuthn/Passkeys）

存储WebAuthn/FIDO2浏览器密钥凭证，支持无密码登录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(255) | PK | 凭证唯一ID（由WebAuthn生成） |
| user_id | VARCHAR(36) | FK, NOT NULL | 关联用户ID |
| credential_id | VARCHAR(512) | NOT NULL | 凭证ID(Base64URL) |
| credential_public_key | TEXT | NOT NULL | 公钥(PEM格式) |
| counter | BIGINT | DEFAULT 0 | 签名计数器(防克隆) |
| credential_type | VARCHAR(50) | DEFAULT 'public-key' | 凭证类型 |
| attestation_type | VARCHAR(50) | NULLABLE |  attestation类型(none/indirect/direct) |
| transports | JSON | NULLABLE | 支持的传输方式(usb/nfc/ble/internal) |
| aaguid | VARCHAR(36) | NULLABLE | 认证器GUID(识别设备型号) |
| nickname | VARCHAR(255) | NULLABLE | 用户自定义名称(如"我的YubiKey") |
| device_name | VARCHAR(255) | NULLABLE | 设备名称(自动识别) |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 绑定时间 |
| last_used_at | TIMESTAMP | NULLABLE | 最后使用时间 |

**外键:**
- `user_id` → `users(id)` ON DELETE CASCADE

**支持场景:**
- 平台认证器: Windows Hello, Touch ID, 人脸识别
- 漫游认证器: YubiKey, Google Titan Key
- 混合认证器: iCloud Keychain, Google Password Manager
- 跨设备认证: 手机扫描二维码 + 蓝牙验证

---

## 3. Redis数据结构

### 3.1 有状态模式 - 会话存储

```
Session:
  Key:   session:{session_id}
  Value: {
    user_id: "uuid",
    client_id: "uuid",
    created_at: 1735689600,
    expires_at: 1735776000
  }
  TTL: 86400 (SESSION_EXPIRES_IN)

Access Token:
  Key:   access_token:{token_hash}
  Value: {
    client_id: "uuid",
    user_id: "uuid",
    scopes: "openid profile",
    expires_at: 1735689600
  }
  TTL: 3600 (JWT_EXPIRES_IN)
```

### 3.2 无状态模式 - Token黑名单

```
Token Blacklist:
  Key:   blacklist:jti:{jti}
  Value: "revoked"
  TTL: 剩余有效期 (用于JWT登出/撤销)

Refresh Token Blacklist:
  Key:   blacklist:refresh:{token_hash}
  Value: "revoked"
  TTL: 剩余有效期
```

### 3.3 第三方登录临时状态

```
OAuth State:
  Key:   oauth:{provider}:{state}
  Value: {
    provider: "github",
    redirect_uri: "http://localhost:3000/oauth/authorize?...",
    session_id: "sess_xxx"
  }
  TTL: 600 (10分钟)
```

### 3.4 WebAuthn挑战码

```
WebAuthn Challenge:
  Key:   webauthn:challenge:{user_id}:{session_id}
  Value: {
    challenge: "base64url-challenge",
    rp_id: "localhost",
    allowed_credentials: ["cred_id_1", ...]
  }
  TTL: 300 (5分钟)
```

### 3.5 速率限制

```
Rate Limit:
  Key:   ratelimit:{endpoint}:{ip}:{window}
  Value: counter
  TTL: 窗口大小(秒)
```

### 3.6 授权码缓存（无状态加速）

```
Authorization Code:
  Key:   auth_code:{code}
  Value: {
    client_id: "uuid",
    user_id: "uuid",
    redirect_uri: "http://...",
    scope: "openid profile",
    nonce: "...",
    code_challenge: "...",
    code_challenge_method: "S256"
  }
  TTL: 300 (授权码有效期5分钟)
```

### 3.7 邮件验证码

存储邮箱激活和找回密码的验证码。

```
Email Verification Code:
  Key:   email:code:{email}
  Value: {
    code: "6位数字或UUID",
    type: "activation | reset_password",
    expires_at: 1735689600
  }
  TTL: 3600 (1小时)

Email Attempts (防暴力破解):
  Key:   email:attempt:{email}
  Value: counter
  TTL: 86400 (24小时)
```

### 3.8 极验行为验证状态

```
Geetest Challenge:
  Key:   geetest:challenge:{challenge}
  Value: {
    gt: "captcha_id",
    challenge: "challenge字符串",
    success: 1
  }
  TTL: 300 (5分钟)

Geetest Validate (二次校验防重用):
  Key:   geetest:validate:{seccode}
  Value: "used"
  TTL: 86400 (24小时)
```

### 3.9 Redis Key 汇总表

| Key模式 | 用途 | TTL |
|---------|------|-----|
| `session:{session_id}` | 有状态会话 | SESSION_EXPIRES_IN |
| `token:{token_hash}` | 有状态access_token | JWT_EXPIRES_IN |
| `blacklist:jti:{jti}` | JWT黑名单 | 剩余有效期 |
| `blacklist:refresh:{hash}` | refresh_token黑名单 | 剩余有效期 |
| `ratelimit:{path}:{ip}:{window}` | 速率限制 | 窗口时间 |
| `auth_code:{code}` | 授权码缓存 | 300秒 |
| `oauth:{provider}:{state}` | 第三方OAuth临时状态 | 600秒 |
| `webauthn:challenge:{uid}:{sid}` | WebAuthn挑战码 | 300秒 |
| `email:code:{email}` | 邮件验证码 | 3600秒 |
| `email:attempt:{email}` | 邮件发送计数 | 86400秒 |
| `geetest:challenge:{challenge}` | 极验挑战码 | 300秒 |
| `geetest:validate:{seccode}` | 极验二次校验防重用 | 86400秒 |

---

## 4. 索引策略

| 表 | 索引 | 类型 | 作用 |
|----|------|------|------|
| users | email | UNIQUE | 邮箱登录快速查找 |
| users | username | UNIQUE | 用户名登录快速查找 |
| clients | client_id | INDEX | OAuth流程中快速查找客户端 |
| clients | created_by | INDEX | 按创建者查找客户端（开发者数据隔离） |
| authorization_codes | expires_at | INDEX | 清理过期授权码 |
| access_tokens | token_hash | UNIQUE | Token验证快速查找 |
| access_tokens | expires_at | INDEX | 清理过期token |
| refresh_tokens | token_hash | UNIQUE | Refresh token验证 |
| refresh_tokens | expires_at | INDEX | 清理过期refresh token |
| user_consents | user_id+client_id | UNIQUE | 快速查找用户授权记录 |
| oidc_sessions | session_id | UNIQUE | 会话查找 |
| oidc_sessions | expires_at | INDEX | 清理过期会话 |
| social_connections | provider+provider_user_id | UNIQUE | 第三方账号唯一约束 |
| social_connections | user_id | INDEX | 查找用户绑定的第三方账号 |
| social_connections | provider | INDEX | 按提供商查找 |
| user_credentials | credential_id | INDEX | WebAuthn凭证ID查找 |
| user_credentials | user_id | INDEX | 查找用户的所有凭证 |

---

## 5. 数据清理策略

| 数据 | 清理方式 | 执行频率 |
|------|----------|----------|
| 过期授权码 | DELETE FROM authorization_codes WHERE expires_at < NOW() | 每小时 |
| 过期access_token | DELETE FROM access_tokens WHERE expires_at < NOW() | 每小时 |
| 过期refresh_token | DELETE FROM refresh_tokens WHERE expires_at < NOW() | 每日 |
| 过期OIDC会话 | DELETE FROM oidc_sessions WHERE expires_at < NOW() | 每小时 |
| Redis过期key | Redis自动驱逐(基于TTL) | 自动 |
| Redis黑名单 | Redis自动驱逐(基于TTL) | 自动 |
| 第三方token过期 | 应用层按需刷新 | 按需 |

---

## 6. Redis vs MySQL 职责划分

| 数据 | 存储位置 | 原因 |
|------|----------|------|
| 用户资料 | MySQL | 持久化，支持复杂查询 |
| 客户端注册信息 | MySQL | 持久化，变更频率低 |
| 授权码 | MySQL + Redis(缓存) | 短暂存储，Redis加速验证 |
| access_token(有状态) | Redis | 高频访问，需要快速过期 |
| access_token(无状态) | JWT本身 | 自包含，无需服务端存储 |
| refresh_token | MySQL | 需要持久化和撤销跟踪 |
| 会话(有状态) | Redis | 频繁读写，需要TTL |
| Token黑名单 | Redis | 短暂存储，自动过期 |
| 速率限制计数 | Redis | 高频读写，自动过期 |
| consent记录 | MySQL | 持久化，变更频率低 |
| 第三方OAuth state | Redis | 短暂存储，快速过期 |
| WebAuthn挑战码 | Redis | 短暂存储，高安全性需求 |
| 第三方access_token | MySQL | 持久化，用于API调用 |
| 邮件验证码 | Redis | 短暂存储，自动过期 |
| 极验挑战码 | Redis | 短暂存储，快速过期 |
| 极验二次校验结果 | Redis | 防重用校验，自动过期 |
