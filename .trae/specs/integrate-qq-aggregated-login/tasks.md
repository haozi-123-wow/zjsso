# Tasks

- [ ] Task 1: 新增环境变量和配置
  - [ ] 在 `.env` 添加 `QQ_AGG_BASE_URL`、`QQ_AGG_APP_ID`、`QQ_AGG_APP_KEY`
  - [ ] 在 `src/config/index.js` social 下新增 `qq_agg` 配置段（baseUrl, appId, appKey, callbackUrl）

- [ ] Task 2: 创建 QQAggregatedProvider
  - [ ] 创建 `src/services/social/QQAggregatedProvider.js`
  - [ ] 继承 SocialProvider，configKey='qq_agg'
  - [ ] 实现 `isEnabled()` 检查 appId 是否非空
  - [ ] 实现 `getAuthorizationUrl(state)`：调用聚合平台 `act=login` API，返回响应中的 `url`
  - [ ] 覆盖 `handleCallback(code, state)`：直接调用聚合平台 `act=callback` API 获取用户信息
  - [ ] 用户信息映射：social_uid→id, nickname→username/display_name, faceimg→avatar

- [ ] Task 3: 修改 social.js 实现智能路由
  - [ ] 导入 `QQAggregatedProvider`
  - [ ] `getProvider('qq')` 改为：官方启用→官方；聚合启用→聚合；null
  - [ ] 绑定流程中 `qq_agg` 同样支持头像/邮箱条件写入（'google'→'qq_agg' 加入条件列表）

- [ ] Task 4: 修改 Provider.js getAllProviders 用同一逻辑决定 QQ 展示
  - [ ] 导入 `QQAggregatedProvider`
  - [ ] QQ 条目判断：`qqConfig.appId || qqAggConfig.appId`

- [ ] Task 5: 前端登录页恢复 QQ 按钮
  - [ ] Login.vue 的社交按钮区域增加 QQ 按钮（图标 + "QQ" 文字）
  - [ ] 点击调用 `handleQqLogin` 跳转 `/api/auth/social/qq/login`

- [ ] Task 6: 前端个人页增加绑定 QQ 按钮
  - [ ] Profile.vue 社交绑定区域增加 "绑定 QQ" 按钮
  - [ ] 调用 `bindSocial('qq')`

- [ ] Task 7: 删除 `聚合登录.md`
- [ ] Task 8: 验证测试
  - [ ] 启动后端，确认 `/api/auth/social/providers` 返回 qq
  - [ ] 前端 QQ 按钮正常显示
  - [ ] 官方 QQ 已配时走官方流程
  - [ ] 官方未配、聚合已配时走聚合流程
  - [ ] 回调后用户信息正确入库

# Task Dependencies

- [Task 1] - 无依赖
- [Task 2] - 依赖 [Task 1]
- [Task 3] - 依赖 [Task 2]
- [Task 4] - 依赖 [Task 1]
- [Task 5] - 依赖 [Task 4]
- [Task 6] - 依赖 [Task 4]
- [Task 7] - 无依赖
- [Task 8] - 依赖 [Task 3, Task 4, Task 5, Task 6, Task 7]
