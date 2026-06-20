# ZJSSO 用户组功能设计文档

## 概述

为 SSO 系统增加用户组（User Group）功能，实现**基于组的应用访问控制**。

核心逻辑：管理员创建用户组 → 将用户分配到组 → OIDC 客户端配置允许的组 → 用户登录应用时校验所属组。

---

## 一、数据模型

### 实体关系

```
┌──────────┐     N ─────────── M    ┌──────────┐
│  users   │────────────────────────│ groups   │
│          │    user_groups (关联表)  │          │
│  + id    │                        │  + id    │
│  + name  │                        │  + name  │
│  + role  │                        │  + desc  │
└──────────┘                        └────┬─────┘
                                         │
                                         │ 1:N (allowed_groups)
                                         │
                                    ┌────┴─────┐
                                    │ clients  │
                                    │          │
                                    │  + client_id
                                    │  + allowed_groups (JSON, NULL=不限制)
                                    └──────────┘
```

### 三张表职责

| 表 | 职责 | 主键 |
|----|------|------|
| `groups` | 存储组的基本信息（名称、描述） | UUID |
| `user_groups` | 用户与组的多对多关联 | UUID，联合唯一(user_id, group_id) |
| `clients` | 新增 `allowed_groups` 字段（JSON 数组，存组 ID 列表） | UUID |

### `clients.allowed_groups` 字段语义

| 值 | 含义 |
|----|------|
| `NULL`（默认） | 不限制，任何用户均可登录该应用（完全向后兼容） |
| `[]`（空数组） | 禁止所有用户登录（该应用暂时关闭访问） |
| `["id1", "id2"]` | 仅这些组中的用户可登录该应用 |

---

## 二、用户登录应用鉴权流程

用户从第三方应用点击"SSO 登录"开始，完整的 OIDC 授权码流程中新增组权限校验的介入点。

### 2.1 流程概览

```
Client App            ZJSSO (/oauth/authorize)          ZJSSO (/oauth/token)
    │                          │                              │
    │  ① GET /authorize        │                              │
    │  (重定向到 SSO 登录)       │                              │
    │                          │                              │
    │                          │  ② 用户登录（前端）             │
    │                          │                              │
    │                          │  ③ 校验用户 enabled           │
    │                          │                              │
    │                          │  ④ ★ 新：校验 allowed_groups   │
    │                          │     用户所在组 ∩ 客户端允许组    │
    │                          │     → 交集非空才放行           │
    │                          │                              │
    │                          │  ⑤ 记录 consent              │
    │                          │                              │
    │                          │  ⑥ 签发 authorization_code   │
    │  ← 302 redirect + code   │                              │
    │                          │                              │
    │  ⑦ POST /token           │                              │
    │  (携带 code)              │           ⑧ 兑取授权码        │
    │                          │                              │
    │                          │           ⑨ ★ 再次校验组权限   │
    │                          │                              │
    │                          │           ⑩ 签发 token        │
    │  ← access/id/refresh     │                              │
    │                          │                              │
```

### 2.2 步骤④：授权端点组校验（`/oauth/authorize`）

在现有的 "用户是否启用" 检查通过后，系统执行以下判断链：

1. 读取客户端的 `allowed_groups` 字段
2. 若为 `NULL` → **跳过校验**，走原有流程（向后兼容）
3. 若为 `[]` 或非数组 → **拒绝**，返回 `access_denied`
4. 若为组 ID 数组 → 查询当前用户所属的组 ID 列表（`user_groups` 表）
5. 取交集：`allowedGroupIds ∩ userGroupIds`
6. 交集为空 → **拒绝**，返回 `access_denied`（提示"您所在的用户组无权访问此应用"）
7. 交集非空 → **放行**，继续签发授权码

### 2.3 步骤⑨：Token 端点二次校验（`/oauth/token`）

在兑取授权码阶段再次执行相同的组权限校验，**防止前端构造 authorization_code 绕过授权端点直接请求 token**。

### 2.4 校验失败时的用户反馈

用户端收到的 OIDC 标准错误重定向：

```
{redirect_uri}?error=access_denied&error_description=您所在的用户组无权访问此应用&state={state}
```

### 2.5 流程图

```
                    ┌──────────────────────────┐
                    │ 用户发起 SSO 登录请求       │
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼───────────────┐
                    │ ① 客户端认证 + 参数校验     │
                    │   (client_id/redirect/scopes)│
                    └──────────┬───────────────┘
                               │
                    ┌──────────▼───────────────┐
                    │ ② 用户已登录？              │
                    └────┬─────────────┬───────┘
                         │ 否          │ 是
              ┌──────────▼───┐  ┌──────▼─────────────┐
              │ 重定向登录页   │  │ ③ 校验用户 enabled    │
              └──────────────┘  └──────┬─────────────┘
                                       │
                              ┌────────▼───────────┐
                              │ ④ 客户端有组限制？     │
                              └──┬──────────┬──────┘
                                 │ 否       │ 是
                        ┌────────▼───┐ ┌───▼─────────────┐
                        │ 跳过校验    │ │ 用户属于允许组？   │
                        └──┬─────────┘ └──┬──────┬───────┘
                           │              │ 是   │ 否
                           │     ┌────────▼──┐ ┌─▼──────────┐
                           │     │ 放行      │ │ access_denied│
                           │     └──┬───────┘ └─────────────┘
                           │        │
                    ┌──────▼────────▼──────┐
                    │ ⑤ 记录consent+签发code │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │ ⑥ Client 用code换token│
                    │    再次校验组权限       │
                    └──────────────────────┘
```

---

## 三、用户组信息的传播路径

用户组信息需要在整个系统中贯通，确保下游应用可以获取到用户所属组。

### 3.1 传播链路

```
   MySQL (user_groups)
         │
         │ 查询
         ▼
  ┌─────────────────┐
  │ OIDC 授权流程    │──→ 组权限校验（决定放行/拒绝）
  └────────┬────────┘
           │
           │ 签发 token 时注入 groups
           ▼
  ┌─────────────────────────────────────────────┐
  │               Token（JWT / Redis）           │
  │                                             │
  │  access_token payload / stateful session:   │
  │    {                                         │
  │      groups: [{ id, name }, ...]             │
  │    }                                         │
  └────────┬────────────────────────────────────┘
           │
           │ 认证中间件解析
           ▼
  ┌─────────────────┐
  │   req.user       │──→ 路由层可直接使用 req.user.groups
  └────────┬────────┘
           │
           │ UserInfo 端点查询
           ▼
  ┌─────────────────┐
  │  /userinfo       │──→ 返回给第三方的 claims 中包含 groups
  └─────────────────┘
```

### 3.2 关键改造点

| 环节 | 位置 | 改造内容 |
|------|------|----------|
| 签发 token | `oidc/TokenService.js` (JWT payload) + `TokenService.js` (登录用) | payload 中新增 `groups` 字段 |
| Redis session | `oidc/TokenService.js` + `TokenService.js` | stateful 模式的 session JSON 新增 `groups` |
| 解码 token | `oidc/TokenService.js` (stateless 模式) | 解析 JWT 时提取 `groups`，兜底空数组 |
| /userinfo | `oidc/UserInfoService.js` | SQL 查询 JOIN `user_groups` → `groups` 表，`profile` scope 下返回 |
| OIDC 发现文档 | `oidc/Provider.js` | `scopes_supported` 添加 `groups`，`claims_supported` 添加 `groups` |

---

## 四、管理端 API 设计

### 4.1 用户组管理 (`/api/groups`)

所有端点均需 `admin` 角色。鉴权方式沿用现有 `authenticate` + `requireRole('admin')` 中间件。

| 方法 | 路径 | 说明 | 请求/响应要点 |
|------|------|------|--------------|
| GET | `/api/groups` | 组列表 | 返回 `{ groups: [...] }`，按创建时间倒序 |
| POST | `/api/groups` | 创建组 | body: `{ name, description? }`，名称唯一校验 |
| GET | `/api/groups/:id` | 组详情+成员 | 返回组信息 + `users` 数组（含 username/email/role） |
| PUT | `/api/groups/:id` | 更新组 | body: `{ name?, description? }` |
| DELETE | `/api/groups/:id` | 删除组 | `user_groups` 关联由外键 CASCADE 自动清理 |

### 4.2 组成员管理

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/groups/:id/users` | 批量添加用户，body: `{ user_ids: [...] }`，INSERT IGNORE 防重复 |
| DELETE | `/api/groups/:id/users/:userId` | 从组中移除单个用户 |

### 4.3 客户端管理增强 (`/api/clients`)

在现有客户端 CRUD 的基础上，增加 `allowed_groups` 字段支持：

- `GET /api/clients` 响应中返回 `allowed_groups`（JSON 数组或 null）
- `POST /api/clients/register` 允许传入 `allowed_groups`
- `PUT /api/clients/:id` 允许修改 `allowed_groups`（加入 `allowedFields` 白名单）
- `formatClient` 函数自动处理 JSON 解析

### 4.4 用户详情增强 (`/api/users/:id`)

`GET /api/users/:id` 响应中新增 `groups` 字段，返回用户所属组列表 `[{ id, name }, ...]`。

---

## 五、前端管理面板变更

### 5.1 新 Tab：用户组管理

在 [Admin.vue](file:///d:/phpstudy_pro/WWW/zjsso/frontend/src/views/Admin.vue) 中新增第 4 个 Tab（仅 `admin` 角色可见）：

- **组列表**：表格/卡片展示名称、描述、成员数、创建时间
- **新建/编辑组**：模态框表单，名称+描述
- **删除组**：二次确认弹窗
- **成员管理面板**：点击组展开，显示组内用户列表
  - 搜索用户并添加（多选下拉）
  - 逐行移除用户

### 5.2 客户端管理 Tab 增强

在新建/编辑 OIDC 客户端的模态框中，新增"允许访问的用户组"多选下拉：

- 数据来源：`GET /api/groups`
- 未选择任何组 → `null`（不限制，默认行为）
- 选择组后 → 提交时发送组 ID 数组

### 5.3 用户管理 Tab 增强

用户列表每行展示所属组标签（Badge），编辑用户表单中可修改组归属。

### 5.4 API 工具新增

`src/utils/api.ts` 新增 `apiPut` 和 `apiDelete` 两个函数，复用现有 token 管理和 fetch 封装模式。

---

## 六、数据库迁移

### 迁移内容

在 [migrate.js](file:///d:/phpstudy_pro/WWW/zjsso/src/database/migrate.js) 的 `runMigrations` 函数末尾追加：

1. **CREATE TABLE IF NOT EXISTS `groups`** — 用户组表
2. **CREATE TABLE IF NOT EXISTS `user_groups`** — 用户-组关联表（外键 CASCADE 删除）
3. **ALTER TABLE `clients` ADD COLUMN `allowed_groups`** — 仅在字段不存在时添加

### 用户删除时的级联清理

`DELETE /api/users/:id` 路由中增加 `DELETE FROM user_groups WHERE user_id = ?`（与外键 CASCADE 双保险）。

### Schema 更新

[schema.sql](file:///d:/phpstudy_pro/WWW/zjsso/src/database/schema.sql) 同步追加重建表时的建表语句。

---

## 七、涉及文件清单

### 后端

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/database/schema.sql` | 修改 | 添加 groups、user_groups 表定义（共 13 张表） |
| `src/database/migrate.js` | 修改 | 追加增量迁移逻辑 |
| `src/index.js` | 修改 | 注册 groups 路由 |
| `src/models/Group.js` | **新建** | 组模型类（CRUD + 用户关联操作） |
| `src/routes/groups.js` | **新建** | 组管理 API 路由（6 个端点） |
| `src/routes/oidc.js` | 修改 | authorize + token 两端点增加组权限校验 |
| `src/routes/admin.js` | 修改 | clients CRUD 增加 `allowed_groups`；users/:id 返回 groups |
| `src/services/oidc/TokenService.js` | 修改 | generateAccessToken / issueTokens / validateAccessToken 增加 groups |
| `src/services/TokenService.js` | 修改 | generateTokens 增加 groups |
| `src/services/oidc/UserInfoService.js` | 修改 | SQL JOIN groups 表，profile scope 返回 groups |
| `src/services/oidc/Provider.js` | 修改 | OIDC 发现文档增加 groups scope + groups claim |

### 前端

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `frontend/src/utils/api.ts` | 修改 | 新增 `apiPut`、`apiDelete` 函数 |
| `frontend/src/views/Admin.vue` | 修改 | 新增用户组管理 Tab；客户端管理增加组选择；用户管理展示组标签 |

---

## 八、向后兼容性保证

| 场景 | 行为 |
|------|------|
| 现有客户端（`allowed_groups` 为 NULL） | 不触发组校验，行为与升级前完全一致 |
| 现有用户（无组归属） | `getUserGroups` 返回空数组，JWT 中 `groups: []` |
| 旧版 token（不含 `groups` 字段） | 解析时兜底 `\|\| []`，不会报错 |
| groups 表初始为空 | 管理端显示空列表，不影响任何现有流程 |

---

## 九、实施代办清单

### 阶段一：数据库

- [x] `src/database/schema.sql` — 追加 `groups` 表、`user_groups` 表定义（备注改 13 张表）
- [x] `src/database/update_groups.sql` — 新建增量迁移 SQL 脚本（3 条语句）
- [x] `src/database/migrate.js` — 追加 CREATE TABLE IF NOT EXISTS + ALTER TABLE 迁移逻辑
- [x] 执行 `npm run migrate` 验证迁移成功

### 阶段二：后端 Model

- [x] 新建 `src/models/Group.js` — Group 类（create / findById / findByName / listAll / update / delete / getUserGroups / getUserGroupIds / addUserToGroup / removeUserFromGroup / getGroupUsers）

### 阶段三：后端路由

- [x] 新建 `src/routes/groups.js` — 组管理路由（6 个端点，全局 requireRole('admin')）
- [x] 修改 `src/index.js` — 注册 `app.use('/api', groupRoutes)`
- [x] 修改 `src/routes/admin.js` — `formatClient` 增加 allowed_groups、POST/PUT clients 支持 allowed_groups、DELETE users 级联清理 user_groups、GET users/:id 返回 groups

### 阶段四：OIDC 鉴权流程

- [x] 修改 `src/routes/oidc.js` — authorize 端点：用户 enabled 校验后增加 allowed_groups 交集判断
- [x] 修改 `src/routes/oidc.js` — handleAuthorizationCodeGrant：兑取授权码后增加组二次校验

### 阶段五：Token & UserInfo 数据贯通

- [x] 修改 `src/services/oidc/TokenService.js` — generateAccessToken 写入 groups、issueTokens 写入 Redis、validateAccessToken 解析 groups
- [x] 修改 `src/services/TokenService.js` — generateTokens JWT + Redis 写入 groups
- [x] 修改 `src/services/oidc/UserInfoService.js` — SQL JOIN user_groups/groups，profile scope 返回 groups
- [x] 修改 `src/services/oidc/Provider.js` — scopes_supported 加 groups、claims_supported 加 groups

### 阶段六：前端

- [x] 修改 `frontend/src/utils/api.ts` — 新增 apiPut、apiDelete 函数
- [x] 修改 `frontend/src/views/Admin.vue` — 新增"用户组管理"Tab（组 CRUD + 成员管理）
- [x] 修改 `frontend/src/views/Admin.vue` — 客户端管理模态框增加"允许访问的组"多选下拉
- [x] 修改 `frontend/src/views/Admin.vue` — 用户管理列表/编辑表单展示所属组标签
- [x] 新建 `src/routes/groups.js` — 组管理路由（6 个端点，全局 requireRole('admin')）
- [x] 修改 `src/index.js` — 注册 `app.use('/api', groupRoutes)`

### 阶段七：验证

- [ ] `npm run migrate` 验证数据库变更
- [ ] `npm run dev` 启动后端，验证 /api/groups 端点
- [ ] `npm run check`（前端）类型检查通过
- [ ] 功能验证：创建组 → 分配用户 → 配置客户端 allowed_groups → 用户登录被正确拦截/放行

---

## 十、Commit Message

```
feat: 新增用户组功能，支持基于组的应用访问控制

- 数据库新增 groups 表、user_groups 关联表，clients 表增加 allowed_groups 字段
- 新增 Group 模型 (src/models/Group.js)，支持组的 CRUD 和用户-组关联管理
- 新增 Admin API /api/groups，提供组的完整管理接口
- OIDC 授权流程增加组权限校验：用户登录应用时验所属组是否在客户端允许列表中
- Token JWT payload 和 Redis session 中写入用户组信息
- UserInfo 端点返回用户所属组列表（profile scope）
- OIDC 发现文档添加 groups scope 和 groups claim
- 前端 Admin 面板新增用户组管理 Tab，客户端管理中支持设置允许访问的组
- 前端 API 工具新增 apiPut/apiDelete 函数
```
