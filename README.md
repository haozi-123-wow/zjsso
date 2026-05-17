# ZJSSO — 基于 OIDC 协议的单点登录系统

基于 **OpenID Connect (OIDC)** 协议的单点登录系统，提供统一的身份认证和授权管理服务。支持密码登录、通行密钥（WebAuthn Passkey）、社交账号（GitHub/QQ）等多种认证方式，并集成行为验证、邮件服务等配套功能。

---

## 功能特性

### 核心功能
- **OIDC Provider** — 完整实现 OpenID Connect 协议，支持 authorization code + PKCE、refresh_token、client_credentials 三种授权模式
- **用户认证** — 注册（邮箱激活）、登录（含安全提示）、登出、Token 刷新（轮换机制）
- **多因素认证** — 极验 Geetest v4 行为验证（登录/注册时人机验证）
- **无密码登录** — WebAuthn 通行密钥，支持指纹、面部识别、硬件安全密钥（YubiKey 等）

### 第三方集成
- **社交登录** — GitHub OAuth、QQ 互联，支持绑定/解绑
- **邮件服务** — 阿里云 DirectMail，含注册激活、密码重置邮件模板

### 管理功能
- **管理后台** — 概览看板、客户端管理（CRUD）、用户管理（CRUD/搜索/分页/状态控制）
- **角色权限** — 三级角色体系：普通用户、开发者（客户端数据隔离）、管理员（全权限）

### 安全特性
- **双模式会话** — 支持无状态（JWT 签名）和有状态（Redis 集中存储）两种会话模式
- **速率限制** — 基于 Redis 滑动窗口的多维度频率控制
- **安全头** — Helmet 防护、CORS 白名单
- **Token 黑名单** — 登出即失效，支持 JWT jti 黑名单
- **PKCE 强制** — 公开客户端自动要求 Proof Key for Code Exchange

---

## 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 后端 | Node.js + Express | 18+ / 4.x | HTTP 服务 |
| 前端 | Vue 3 + TypeScript | 3.4+ | SPA 管理界面 |
| 前端构建 | Vite | 5.x | 构建工具 |
| 数据库 | MySQL | 5.7+ | 持久化存储（9 张表） |
| 缓存 | Redis | 6.x+ | 会话管理 / 速率限制 / 挑战码 |
| JWT | jsonwebtoken | 9.x | 令牌签名与验证 |
| 密码 | bcryptjs | 2.x | 密码哈希 |
| 状态管理 | Pinia | - | 前端状态管理 |
| 路由 | vue-router | 4.x | 前端路由 |

---

## 快速开始

### 环境要求

- Node.js 18+
- MySQL 5.7+
- Redis 6.x+

### 安装与启动

```bash
# 1. 克隆仓库
git clone <repo-url> zjsso
cd zjsso

# 2. 安装后端依赖
npm install

# 3. 安装前端依赖
cd frontend && npm install && cd ..

# 4. 配置环境变量
cp .env.example .env
# 编辑 .env 填写数据库、Redis 等配置

# 5. 初始化数据库
npm run migrate

# 6. （可选）填充测试数据
npm run seed

# 7. 启动后端服务
npm run dev

# 8. 新开终端，启动前端开发服务器
cd frontend && npm run dev
```

后端默认运行在 `http://localhost:3000`，前端默认运行在 `http://localhost:5173`。

### 环境变量配置

在项目根目录 `.env` 文件中配置所有环境变量，完整配置项见 `.env` 文件内注释。关键变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `APP_PORT` | 3000 | 后端服务端口 |
| `APP_HOST` | localhost | 后端监听地址 |
| `SESSION_MODE` | stateful | 会话模式：`stateless` / `stateful` |
| `JWT_SECRET` | - | JWT 签名密钥（务必修改为随机字符串） |
| `ISSUER` | http://localhost:3000 | OIDC 发行人标识 |

其他配置项（邮件、极验、社交登录等）按需填写，留空则对应功能自动禁用。

---

## 项目结构

```
zjsso/
├── src/                          # 后端源码
│   ├── index.js                  # 服务入口，路由注册
│   ├── config/index.js           # 配置加载（从环境变量）
│   ├── database/                 # 数据库
│   │   ├── connection.js         # MySQL 连接池
│   │   ├── redis.js              # Redis 客户端
│   │   ├── schema.sql            # 数据库建表语句
│   │   ├── migration_patch.sql   # 结构升级补丁
│   │   ├── migrate.js            # 迁移脚本
│   │   └── seed.js               # 测试数据
│   ├── middleware/                # 中间件
│   │   ├── auth.js               # Token 认证（支持双模式）
│   │   ├── role.js               # 角色权限控制
│   │   └── rateLimiter.js        # 速率限制
│   ├── models/User.js            # 用户模型
│   ├── routes/                   # 路由层
│   │   ├── auth.js               # 注册/登录/登出/刷新
│   │   ├── admin.js              # 管理 API（客户端/用户 CRUD）
│   │   ├── email.js              # 邮件发送
│   │   ├── geetest.js            # 极验验证
│   │   ├── oidc.js               # OIDC 授权/Token/UserInfo
│   │   ├── social.js             # 社交登录
│   │   ├── webauthn.js           # WebAuthn 通行密钥
│   │   └── wellknown.js          # OIDC 发现文档/JWKS
│   └── services/                 # 服务层
│       ├── GeetestService.js     # 极验 v4 验证
│       ├── EmailService.js       # 邮件发送
│       ├── IpLocationService.js  # IP 归属地
│       ├── oidc/                 # OIDC 核心服务
│       │   ├── AuthorizationService.js
│       │   ├── TokenService.js
│       │   ├── UserInfoService.js
│       │   └── Provider.js
│       ├── social/               # 社交登录服务
│       │   ├── Provider.js       # 抽象基类
│       │   ├── GitHubProvider.js
│       │   └── QQProvider.js
│       └── webauthn/WebAuthnService.js  # 通行密钥（含 CBOR/COSE 解析）
├── frontend/                     # 前端 SPA
│   ├── index.html
│   ├── vite.config.ts
│   ├── StandaloneLogin.vue       # 独立登录页
│   ├── StandaloneRegister.vue    # 独立注册页
│   └── src/
│       ├── main.ts               # 应用入口
│       ├── App.vue               # 根组件
│       ├── router/index.ts       # 路由配置
│       ├── stores/auth.ts        # Pinia 认证状态
│       ├── utils/api.ts          # HTTP 请求封装
│       └── views/
│           ├── Login.vue         # 登录/注册/找回密码
│           ├── Authorize.vue     # OIDC 授权确认
│           ├── Callback.vue      # OIDC 回调处理
│           ├── Profile.vue       # 个人中心
│           └── Admin.vue         # 管理后台
├── docs/                         # 文档
│   ├── api.md                    # 完整 API 接口文档
│   ├── database.md               # 数据库设计文档
│   ├── geetest.md                # 极验接入指南
│   ├── 客户端接入指南.md          # 第三方客户端集成指南
│   ├── yj.md                     # 阿里云邮件接口文档
│   └── 开发计划.md               # 开发计划与进度
└── .env                          # 环境变量配置
```

---

## API 概览

核心 API 端点（完整文档见 [docs/api.md](docs/api.md)）：

### OIDC 协议端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/.well-known/openid-configuration` | OIDC 发现文档 |
| GET | `/.well-known/jwks.json` | JWKS 公钥 |
| GET | `/oauth/authorize` | 授权端点（支持 PKCE） |
| POST | `/oauth/token` | Token 端点（三种 grant_type） |
| GET | `/userinfo` | 用户信息 |
| GET | `/oauth/logout` | 登出 |

### 认证端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/logout` | 登出 |
| POST | `/api/auth/refresh` | Token 刷新 |

### 管理端点

| 方法 | 路径 | 权限 | 说明 |
|------|------|------|------|
| GET | `/api/clients` | 登录 | 客户端列表 |
| POST | `/api/clients/register` | 登录 | 创建客户端 |
| PUT | `/api/clients/:id` | 登录 | 更新客户端 |
| DELETE | `/api/clients/:id` | 登录 | 删除客户端 |
| GET | `/api/users` | admin | 用户列表（搜索+分页） |
| POST | `/api/users` | admin | 创建用户 |
| PUT | `/api/users/:id` | admin | 更新用户 |
| DELETE | `/api/users/:id` | admin | 删除用户 |

### 其他端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/geetest/register` | 极验初始化 |
| POST | `/api/email/send-activation` | 发送激活邮件 |
| POST | `/api/email/send-reset-password` | 发送重置密码邮件 |
| POST | `/api/webauthn/register/begin` | WebAuthn 注册开始 |
| POST | `/api/webauthn/register/complete` | WebAuthn 注册完成 |
| POST | `/api/webauthn/login/begin` | WebAuthn 认证开始 |
| POST | `/api/webauthn/login/complete` | WebAuthn 认证完成 |
| GET | `/api/auth/social/:provider/login` | 第三方登录跳转 |
| GET | `/api/auth/social/:provider/callback` | 第三方登录回调 |

---

## 数据库

支持 **MySQL 9 张表** + **Redis 多用途缓存**，详细设计见 [docs/database.md](docs/database.md)。

### MySQL 核心表

| 表名 | 说明 |
|------|------|
| `users` | 用户（含角色、注册IP、登录信息） |
| `clients` | OIDC 客户端 |
| `authorization_codes` | 授权码 |
| `access_tokens` | 访问令牌 |
| `refresh_tokens` | 刷新令牌 |
| `oidc_sessions` | OIDC 会话 |
| `user_consents` | 用户授权同意 |
| `social_connections` | 社交账号绑定 |
| `user_credentials` | WebAuthn 凭证 |

---

## 第三方服务配置说明

### 极验行为验证（Geetest v4）

注册地址：[https://www.geetest.com/](https://www.geetest.com/)

```env
GEETEST_CAPTCHA_ID=你的captchaId
GEETEST_CAPTCHA_KEY=你的captchaKey
GEETEST_API_URL=http://gcaptcha4.geetest.com
```

### 阿里云邮件推送（DirectMail）

开通地址：[https://www.aliyun.com/product/directmail](https://www.aliyun.com/product/directmail)

```env
ALIYUN_DM_ACCESS_KEY_ID=LTAI...
ALIYUN_DM_ACCESS_KEY_SECRET=...
ALIYUN_DM_ACCOUNT_NAME=noreply@yourdomain.com
ALIYUN_DM_FROM_ALIAS=你的系统名称
ALIYUN_DM_REGION=cn-hangzhou
```

### GitHub 第三方登录

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers) → OAuth Apps → New OAuth App
2. Authorization callback URL 填写 `http://your-domain:3000/api/auth/social/github/callback`
3. 获取 Client ID 和 Client Secret 填入 `.env`

```env
GITHUB_CLIENT_ID=你的ClientID
GITHUB_CLIENT_SECRET=你的ClientSecret
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/social/github/callback
```

### QQ 互联登录

1. 访问 [QQ 互联](https://connect.qq.com/) 注册开发者并创建网站应用
2. 网站回调域填写域名+端口（如 `localhost:3000`）
3. 获取 APP ID 和 APP Key 填入 `.env`

```env
QQ_APP_ID=你的APPID
QQ_APP_KEY=你的APPKey
QQ_CALLBACK_URL=http://localhost:3000/api/auth/social/qq/callback
```

### WebAuthn 通行密钥

```env
WEBAUTHN_RP_ID=localhost                    # 必须与浏览器访问域名一致
WEBAUTHN_RP_NAME=ZJSSO System               # 浏览器弹窗中显示的名称
WEBAUTHN_ALLOWED_ORIGINS=http://localhost,http://localhost:5173
```

---

## 角色权限说明

| 角色 | 层级 | 权限范围 |
|------|------|---------|
| `user` | 1 | 登录、管理个人资料和通行密钥、社交绑定 |
| `developer` | 2 | 包含 user 权限 + 管理**自己创建**的 OIDC 客户端（数据隔离） |
| `admin` | 3 | 包含 developer 权限 + 管理所有客户端和用户、角色分配 |

---

## 前端说明

前端为 Vue 3 + TypeScript SPA，采用 Hash 路由模式。

### 路由表

| 路径 | 页面 | 说明 |
|------|------|------|
| `#/login` | 登录/注册/找回密码 | 含极验行为验证 |
| `#/authorize` | OIDC 授权确认 | 用户确认授权 |
| `#/callback` | OIDC 回调处理 | 处理授权码 |
| `#/profile` | 个人中心 | 需登录 |
| `#/admin` | 管理后台 | 需 admin/developer 角色 |

### 独立页面

另有 `StandaloneLogin.vue` 和 `StandaloneRegister.vue` 可直接访问，适用于独立部署场景。

---

## 部署

### 生产环境后端

```bash
NODE_ENV=production npm start
```

建议使用 PM2 进行进程管理：

```bash
npm install -g pm2
pm2 start src/index.js --name zjsso
```

### 生产环境前端

```bash
cd frontend
npm run build
# 输出在 frontend/dist/，部署到 Nginx 等静态服务器
```

### Nginx 反向代理示例

```nginx
server {
    listen 443 ssl;
    server_name sso.yourdomain.com;

    # 前端静态文件
    root /path/to/frontend/dist;
    index index.html;
    try_files $uri $uri/ /index.html;

    # API 反向代理
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /oauth/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /.well-known/ {
        proxy_pass http://127.0.0.1:3000;
    }
}
```

---

## 开发

```bash
# 后端热重载
npm run dev

# 前端热重载
cd frontend && npm run dev

# 数据库迁移
npm run migrate

# 填充测试数据
npm run seed
```

### TypeScript 检查

```bash
cd frontend && npm run check
```

---

## 文档

- [API 接口文档](docs/api.md) — 所有 API 端点的详细说明
- [数据库设计文档](docs/database.md) — 表结构、索引、Redis 数据结构
- [客户端接入指南](docs/客户端接入指南.md) — 第三方应用集成 OIDC 的完整指南
- [极验接入说明](docs/geetest.md) — 行为验证集成技术细节
- [开发计划](docs/开发计划.md) — 项目规划与进度跟踪

---

## 许可

MIT
