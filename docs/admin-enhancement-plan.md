# 管理后台功能增强计划

## 一、功能需求概述

### 1. 用户管理增强
| 功能 | 描述 | 优先级 |
|------|------|--------|
| 清除2FA认证 | 管理员可清除用户的TOTP双因素认证绑定 | 高 |
| 撤销用户授权 | 管理员可撤销用户对某个OIDC客户端的授权同意 | 高 |
| 查看活动日志 | 管理员可查看指定用户的活动日志记录 | 高 |

### 2. 用户组增强
| 功能 | 描述 | 优先级 |
|------|------|--------|
| 默认组设置 | 用户组增加`is_default`字段，新用户注册时自动加入 | 高 |
| 批量添加用户 | 改进成员管理，支持搜索和批量添加用户到组 | 高 |

---

## 二、数据库变更

### 新增字段：groups表
```sql
ALTER TABLE `groups`
ADD COLUMN `is_default` BOOLEAN DEFAULT FALSE 
COMMENT '新用户注册时是否自动加入此组' AFTER `description`;
```

### 迁移脚本位置
- `src/database/update_groups_default.sql`

---

## 三、后端API规划

### 1. 用户活动日志
```
GET /api/admin/users/:id/activity-logs
Query: ?limit=50&offset=0&action=login
Response: { logs: [...], total: number }
```

### 2. 撤销用户授权
```
DELETE /api/admin/users/:id/consents/:clientId
Response: { message: '已撤销授权' }
```

### 3. 用户组默认设置
```
PUT /api/groups/:id
Body: { is_default: boolean }
Response: { ...group }
```

---

## 四、前端界面规划

### 1. 用户详情模态框（新增）
在用户管理中点击"编辑"时，增加操作按钮区域：
- 清除2FA按钮
- 撤销授权（展开显示已授权客户端列表）
- 查看活动日志（展开显示日志列表）

### 2. 用户组管理改进
- 创建/编辑组时增加"默认组"开关
- 成员管理模态框改为搜索式选择器，支持批量添加

---

## 五、实施顺序

| 阶段 | 内容 | 状态 |
|------|------|------|
| 1 | 数据库迁移（groups表增加is_default字段） | ⏳ 等待执行 |
| 2 | Group模型更新 | 待开始 |
| 3 | 后端API开发 | 待开始 |
| 4 | 前端界面开发 | 待开始 |
| 5 | 注册流程集成默认组 | 待开始 |

---

## 六、注意事项

1. 数据库迁移后，需要用户手动执行SQL或通过迁移脚本
2. 现有用户不会自动加入任何默认组（仅对新注册用户生效）
3. 撤销授权不会影响用户当前的登录状态
4. 活动日志查询需要管理员权限

---

## 七、实施代办清单

### 阶段一：数据库

- [x] `src/database/update_groups_default.sql` — groups 表增加 `is_default` 字段
- [ ] 执行数据库迁移（手动执行 SQL 或通过迁移脚本）

### 阶段二：后端模型更新

- [ ] `src/models/Group.js` — create/update 方法支持 `is_default` 字段
- [ ] `src/database/schema.sql` — 同步更新 groups 表定义

### 阶段三：后端 API 开发

- [ ] `src/routes/admin.js` — 新增 `GET /api/admin/users/:id/activity-logs` 获取用户活动日志
  - Query 参数：limit, offset, action（可选筛选）
  - 需要 admin 角色权限
  - 调用 ActivityLogService 查询
- [ ] `src/routes/admin.js` — 新增 `DELETE /api/admin/users/:id/consents/:clientId` 撤销用户授权
  - 从 user_consents 表删除对应记录
  - 记录操作日志
- [ ] `src/routes/groups.js` — PUT /api/groups/:id 支持 `is_default` 字段
- [ ] `src/routes/auth.js` — 注册流程中自动加入 `is_default=1` 的组
  - 用户注册成功后查询默认组
  - 自动将用户添加到所有默认组

### 阶段四：前端界面开发

#### 4.1 用户详情模态框

- [ ] 用户列表增加"详情"按钮
- [ ] 新建用户详情模态框组件
- [ ] 清除2FA功能（调用已有 `POST /api/users/:id/clear-2fa`）
- [ ] 已授权客户端列表
  - 调用新 API 获取用户授权列表
  - 显示客户端名称、授权时间、scope
  - 支持单个撤销操作
- [ ] 活动日志列表
  - 分页展示日志记录
  - 支持按操作类型筛选
  - 显示时间、操作类型、IP、详情

#### 4.2 用户组管理改进

- [ ] 创建/编辑组表单增加"默认组"开关
- [ ] 组列表显示是否为默认组（Badge 标签）
- [ ] 成员管理模态框改进：
  - 用户选择器改为搜索式（支持按用户名/邮箱搜索）
  - 支持批量选择用户
  - 一键添加选中用户到组

### 阶段五：验证

- [ ] 执行数据库迁移验证
- [ ] 后端 API 测试
  - 测试获取活动日志接口
  - 测试撤销授权接口
  - 测试默认组设置
  - 测试注册时自动加入默认组
- [ ] 前端功能验证
  - 用户详情模态框各功能正常
  - 用户组默认组设置正常
  - 批量添加用户正常

---

## 八、Commit Message

```
feat: 管理后台功能增强

- groups 表增加 is_default 字段，支持新用户注册时自动加入默认组
- 新增管理员清除用户 2FA 认证接口
- 新增管理员撤销用户授权接口
- 新增用户活动日志查询接口
- 前端用户管理增加详情模态框，支持查看/操作：
  - 清除 2FA 绑定
  - 查看已授权客户端并撤销授权
  - 查看用户活动日志
- 前端用户组管理增加默认组设置和批量添加用户功能
```
