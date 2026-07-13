# 集成 QQ 聚合登录（兜底） Spec

## Why

前端的 QQ 登录按钮统一为一个，后端根据配置自动选择登录实现。当官方 QQ（`graph.qq.com`）未配置时，自动降级使用聚合登录平台 `https://u.52ip.com` 的 QQ 登录，保证用户始终可用。

## What Changes

- 新增 `QQAggregatedProvider` 类（不修改现有 `QQProvider`）
- `social.js` 的 `getProvider('qq')` 逻辑改为：官方可用→官方；官方不可用但聚合可用→聚合；都不可用→null
- `getAllProviders()` 同理用同一逻辑决定是否展示 QQ
- 新增 `.env` 配置项：`QQ_AGG_BASE_URL`、`QQ_AGG_APP_ID`、`QQ_AGG_APP_KEY`
- config/index.js social 增加 `qq_agg` 配置段
- 绑定流程中 `qq_agg` 同样支持头像/邮箱条件写入
- 删除 `聚合登录.md` 文档（已实现，无需文档占位）

## Impact

- 原有 QQProvider 代码完全不变
- 前端无感知，QQ 按钮始终只有一个
- GitHub、Google 登录不受影响
- 数据库中 social_connections 新增 provider='qq_agg' 的记录（仅当走聚合登录时）

## 聚合登录 API 流程

### Step1: 获取跳转地址（getAuthorizationUrl）
GET `{baseUrl}/connect.php?act=login&appid={appid}&appkey={appkey}&type=qq&redirect_uri={callbackUrl}`
→ `{"code":0, "url":"https://graph.qq.com/oauth2.0/..."}`

### Step2: 用户授权后回调
回调携带 `?type=qq&code=AuthorizationCode`

### Step3: 换取用户信息（handleCallback 一步完成）
GET `{baseUrl}/connect.php?act=callback&appid={appid}&appkey={appkey}&type=qq&code={code}`
→ `{"code":0, "social_uid":"...", "access_token":"...", "faceimg":"...", "nickname":"...", ...}`

## 用户信息映射

| 聚合返回字段 | QQAggregatedProvider 输出 |
|------------|--------------------------|
| social_uid | id (provider_user_id)    |
| nickname   | username, display_name   |
| faceimg    | avatar                   |
| access_token | 存入 social_connections |

## Config 新增

```env
QQ_AGG_BASE_URL=https://u.52ip.com       # 聚合登录平台地址
QQ_AGG_APP_ID=your_appid                  # 聚合平台分配的 appid
QQ_AGG_APP_KEY=your_appkey                # 聚合平台分配的 appkey
QQ_AGG_CALLBACK_URL=https://.../api/auth/social/qq/callback
```

注意：聚合登录和官方 QQ 共用同一个 callback 路由 `/api/auth/social/qq/callback`，因为前端只会有一个 QQ 按钮。

## 选择逻辑

```
function getProvider('qq'):
  if QQProvider.isEnabled() → 返回 QQProvider（走官方 graph.qq.com）
  if QQAggregatedProvider.isEnabled() → 返回 QQAggregatedProvider（走聚合平台）
  → null（都未配置）
```

## ADDED Requirements

### Requirement: QQAggregatedProvider

新增类继承 SocialProvider，覆盖 handleCallback 方法。

#### Scenario: 聚合登录成功
- **WHEN** 用户在聚合平台完成 QQ 授权，回调带 code
- **THEN** handleCallback 一步调用聚合平台 callback 接口→获取用户信息→返回 profile

#### Scenario: 配置为空时禁用
- **WHEN** QQ_AGG_APP_ID 为空
- **THEN** isEnabled() 返回 false

### Requirement: getProvider 智能路由

#### Scenario: 官方未配、聚合已配
- **WHEN** 前端请求 /api/auth/social/qq/login
- **THEN** getProvider('qq') 返回 QQAggregatedProvider 实例

### Requirement: 前端 QQ 按钮保持不变

- 前端只有一个 QQ 按钮，图标、文案不变
- 仅当官方和聚合都未配置时 QQ 按钮不显示
