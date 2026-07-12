# 集成 QQ 聚合登录 - 验证检查清单

- [x] `.env` 已添加 `QQ_AGG_BASE_URL`、`QQ_AGG_APP_ID`、`QQ_AGG_APP_KEY`
- [x] `config/index.js` social 下新增 `qq_agg` 配置段
- [x] `QQAggregatedProvider.js` 已创建，正确实现 `getAuthorizationUrl`、`handleCallback`、`isEnabled`
- [x] `social.js` getProvider('qq') 实现智能路由：官方优先→聚合兜底→null
- [x] `Provider.js` getAllProviders 返回 QQ 的逻辑已同步（官方或聚合任一配了就展示）
- [x] `social.js` 绑定数据更新条件已包含 `qq_agg`
- [x] 后端语法检查通过（`node -e "require(...)"` 无报错）
- [x] 前端 Login.vue 显示 QQ 登录按钮
- [x] 前端 Profile.vue 显示绑定 QQ 按钮
- [x] 前端构建通过（`npm run build` exit code 0）
- [x] `聚合登录.md` 已删除
