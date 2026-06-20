# AGENTS.md — ZJSSO OIDC 单点登录系统

## 项目概述

基于 OIDC 协议的单点登录系统。后端 Node.js/Express (CommonJS)，前端 Vue 3 + TypeScript + Vite (ES modules)。

## 快速启动命令

```bash
# 后端
npm install
npm run migrate    # 初始化数据库（必须先执行）
npm run dev        # 后端开发服务器，默认 http://localhost:6873

# 前端（独立终端）
cd frontend && npm install && npm run dev   # 默认 http://localhost:5173
```

## 关键配置

- **环境变量**：根目录 `.env`，从 `.env.example` 复制。`JWT_SECRET` 必须设置，否则后端启动失败
- **默认端口**：后端 6873（非 3000），前端 5173
- **前端 API 地址**：`frontend/.env.development` 中 `VITE_API_BASE=http://localhost:6873`
- **生产构建**：`VITE_API_BASE=` 为空，依赖 Nginx 反代 `/api/` 到后端

## 架构要点

### 后端 (`src/`)

- **入口**：`src/index.js`，所有路由在此注册
- **配置**：`src/config/index.js`，从 `process.env` 加载，含速率限制硬编码参数
- **数据库**：`src/database/connection.js` (MySQL 连接池)、`src/database/redis.js` (Redis 客户端)
- **迁移**：`src/database/schema.sql` 建表，`src/database/migrate.js` 执行迁移
- **中间件**：`src/middleware/auth.js` 支持双模式会话（stateful/stateless），`rateLimiter.js` 基于 Redis 滑动窗口
- **OIDC 核心**：`src/services/oidc/` 目录，含 AuthorizationService、TokenService、UserInfoService、Provider
- **路由**：`src/routes/` 按功能拆分（auth、oidc、admin、social、webauthn、totp 等）

### 前端 (`frontend/`)

- **路由**：Hash 模式 (`createWebHashHistory`)，配置在 `src/router/index.ts`
- **状态管理**：Pinia store 在 `src/stores/auth.ts`
- **API 封装**：`src/utils/api.ts`，access_token 仅存内存，通过 refresh_token cookie 恢复会话
- **独立页面**：`StandaloneLogin.vue`、`StandaloneRegister.vue` 在 frontend 根目录，可独立访问
- **Tailwind CSS**：暗色模式用 `class` 策略，配置在 `tailwind.config.js`

### 双模式会话

`SESSION_MODE` 环境变量控制：
- `stateful`：Redis 存储完整会话数据
- `stateless`：JWT 签名验证，Redis 仅存 jti 黑名单

## 前端检查

```bash
cd frontend && npm run check    # TypeScript 类型检查
cd frontend && npm run lint     # ESLint 检查
cd frontend && npm run lint:fix # ESLint 自动修复
```

## 数据库

- **MySQL 5.7+**：11 张表，主键均为 UUID (VARCHAR(36))
- **Redis**：会话存储、速率限制、挑战码缓存
- **自动清理**：MySQL EVENT 定时清理过期 token/会话（需确保事件调度器开启）

## 注意事项

- 后端无测试框架，无 lint 脚本。前端有 ESLint 和 vue-tsc
- 前端 `tsconfig.json` 中 `strict: false`，类型检查较宽松
- 所有环境变量在根目录 `.env` 中统一配置，前端通过 `VITE_` 前缀变量传递
- 社交登录（GitHub/QQ）、极验验证、邮件服务等为可选功能，对应环境变量留空即禁用
