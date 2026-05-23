# 头像直传腾讯云 COS 功能文档

## 概述

本项目采用**前端直传**方案将用户头像上传到腾讯云对象存储（COS），即：前端将文件直接上传到 COS，后端只负责**签名发放**和**上传确认**，文件数据不经过应用服务器。该方案有效减轻服务器带宽压力，提升上传速度。

---

## 一、架构总览

```
 ┌─────────────────────────────────────────────────────────────┐
 │                        浏览器前端                            │
 │  Profile.vue  ──→  uploadAPI  ──→  fetch() 到 COS          │
 │                      (axios)         (直传)                  │
 └──────┬───────────────────────────────────┬──────────────────┘
        │ (1) 获取签名                        │ (3) 确认上传
        ▼                                    ▼
 ┌─────────────────┐              ┌──────────────────────┐
 │  后端 Express    │              │   腾讯云 COS          │
 │  (签名发放+确认)  │              │  (文件存储+图片处理)  │
 └─────────────────┘              └──────────────────────┘
        │                                    ▲
        │ (2) FormData 直传                   │
        └────────────────────────────────────┘
```

**核心流程三步走：**

1. **前端请求签名** -- 后端生成带时效的 COS 表单上传签名
2. **前端直传 COS** -- 浏览器将文件直接 POST 到腾讯云 COS
3. **前端确认通知** -- 后端更新数据库中的用户头像 URL

---

## 二、涉及文件清单

| 文件 | 作用 |
|------|------|
| `frontend/src/api/index.js` | 定义上传 API（获取签名、确认、删除） |
| `frontend/src/utils/avatar.js` | 头像 URL 处理工具函数 |
| `frontend/src/views/Profile.vue` | 个人中心页面，包含完整上传 UI 和逻辑 |
| `server/routes/upload.js` | 后端路由定义及参数校验 |
| `server/controllers/uploadController.js` | 核心业务逻辑：签名生成、确认、删除 |
| `server/app.js` | 路由挂载到 Express 应用 |
| `server/.env.example` | COS 配置项模板 |
| `server/package.json` | `cos-nodejs-sdk-v5` 依赖 |

---

## 三、后端实现细节

### 3.1 环境变量配置

```ini
# server/.env  (从 .env.example 复制并填写)
COS_SECRET_ID=your_secret_id
COS_SECRET_KEY=your_secret_key
COS_BUCKET=your-bucket-name
COS_REGION=ap-guangzhou
COS_CUSTOM_DOMAIN=https://cdn.example.com        # 可选，CDN加速域名
COS_UPLOAD_DOMAIN=https://your-bucket.cos.ap-guangzhou.myqcloud.com  # 可选
```

### 3.2 路由定义 (`server/routes/upload.js`)

```javascript
const express = require('express')
const router = express.Router()
const uploadController = require('../controllers/uploadController')
const auth = require('../middleware/auth')

// 头像相关路由（需登录）
router.get('/avatar-signature', auth, uploadController.getAvatarUploadSignature)
router.post('/avatar-confirm', auth, uploadController.confirmAvatarUpload)
router.delete('/avatar', auth, uploadController.deleteOldAvatar)

module.exports = router
```

### 3.3 表单签名算法 (`uploadController.js`)

后端**不依赖 COS SDK** 生成上传签名，而是严格按照腾讯云官方的**手动签名算法**实现，确保与浏览器端 FormData 上传兼容：

```javascript
const crypto = require('crypto')

function generateCosFormSignature(options) {
  const { SecretId, SecretKey, Bucket, Region, Key, Expires = 300 } = options
  const now = Math.floor(Date.now() / 1000)
  const exp = now + Expires
  const keyTime = `${now};${exp}`

  // 1. 构建 Policy（签名策略）
  const policy = {
    expiration: new Date(exp * 1000).toISOString(),
    conditions: [
      { bucket: Bucket },
      { key: Key },
      { 'q-sign-algorithm': 'sha1' },
      { 'q-ak': SecretId },
      { 'q-sign-time': keyTime }
    ]
  }
  const policyStr = JSON.stringify(policy)

  // 2. 计算签名各个组成部分
  const policyBase64 = Buffer.from(policyStr).toString('base64')           // → policy 表单字段
  const signKey = crypto.createHmac('sha1', SecretKey).update(keyTime).digest('hex')  // → SignKey
  const stringToSign = crypto.createHash('sha1').update(policyStr).digest('hex')      // → StringToSign
  const signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex')  // → q-signature

  return {
    policy: policyBase64,
    'q-sign-algorithm': 'sha1',
    'q-ak': SecretId,
    'q-key-time': keyTime,
    'q-signature': signature
  }
}
```

**签名组成说明：**

| 表单字段 | 含义 | 计算方式 |
|---------|------|---------|
| `policy` | 上传策略（Base64） | `Base64(JSON.stringify(Policy))` |
| `q-sign-algorithm` | 签名算法 | 固定为 `sha1` |
| `q-ak` | 密钥 ID | 即 `COS_SECRET_ID` |
| `q-key-time` | 密钥有效时间 | `startTimestamp;endTimestamp` |
| `q-signature` | 最终签名值 | `HMAC-SHA1(SignKey, SHA1(Policy))` |

### 3.4 获取上传签名接口

**请求：** `GET /api/upload/avatar-signature?filename=myavatar.jpg`

**处理逻辑：**

```javascript
async getAvatarUploadSignature(req, res) {
  // 1. 检查 COS 配置是否完整
  const { SecretId, SecretKey, Bucket, Region } = cosConfig
  if (!SecretId || !SecretKey || !Bucket || !Region) {
    return res.status(500).json({ success: false, message: 'COS 未配置' })
  }

  // 2. 生成唯一 COS 对象键
  //    格式: avatars/{userId}_{timestamp}_{4位随机数}.webp
  const ext = path.extname(req.query.filename).toLowerCase()
  const userId = req.user.id
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6)
  const key = `avatars/${userId}_${timestamp}_${random}${ext}`
  //    注意：实际代码中扩展名统一为 .webp（配合图片处理）

  // 3. 生成表单签名（有效期 300 秒）
  const signatureFields = generateCosFormSignature({
    SecretId, SecretKey, Bucket, Region, Key: key, Expires: 300
  })

  // 4. 构建 Pic-Operations（自动转 webp + quality 85）
  const picOperations = JSON.stringify({
    is_pic_info: 1,
    rules: [{ fileid: '/' + key, rule: 'imageMogr2/format/webp/quality/85' }]
  })

  // 5. 构建上传 URL（优先使用自定义上传域名）
  const uploadDomain = process.env.COS_UPLOAD_DOMAIN
    || `https://${Bucket}.cos.${Region}.myqcloud.com`
  const customDomain = process.env.COS_CUSTOM_DOMAIN

  // 6. 返回给前端
  res.json({
    success: true,
    data: {
      uploadUrl: `${uploadDomain}/${Bucket}/`,
      key,
      expired: Math.floor(Date.now() / 1000) + 300,
      formData: {
        key,
        ...signatureFields,
        'pic-operations': picOperations
      },
      constraints: {
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxFileSize: 2 * 1024 * 1024
      },
      customDomain,
      uploadDomain
    }
  })
}
```

### 3.5 确认上传接口

**请求：** `POST /api/upload/avatar-confirm`  
**请求体：** `{ "key": "avatars/1_1234567890_abcd.webp" }`

**处理逻辑：**

```javascript
async confirmAvatarUpload(req, res) {
  const { key } = req.body
  const userId = req.user.id

  // 安全校验
  if (!key || !key.startsWith('avatars/') || !key.includes(`_${userId}_`)) {
    return res.status(400).json({ success: false, message: '无效的 key' })
  }

  // 构建头像访问 URL（支持自定义 CDN 域名）
  const avatarUrl = getAvatarUrl(key)

  // 更新数据库
  await db.query('UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, userId])

  res.json({ success: true, data: { avatar: avatarUrl } })
}
```

**`getAvatarUrl` 函数：**

```javascript
function getAvatarUrl(key) {
  const customDomain = process.env.COS_CUSTOM_DOMAIN
  if (customDomain) return `${customDomain}/${key}`
  return `https://${Bucket}.cos.${Region}.myqcloud.com/${key}`
}
```

### 3.6 删除头像接口

**请求：** `DELETE /api/upload/avatar`  
**请求体：** `{ "key": "avatars/1_1234567890_abcd.webp" }`

```javascript
async deleteOldAvatar(req, res) {
  const { key } = req.body
  const userId = req.user.id

  // 安全校验
  if (!key || !key.startsWith('avatars/') || !key.includes(`_${userId}_`)) {
    return res.status(400).json({ success: false, message: '无效的 key' })
  }

  // 使用 COS SDK 删除对象
  const cos = new COS({ SecretId: cosConfig.SecretId, SecretKey: cosConfig.SecretKey })
  await cos.deleteObject({
    Bucket: cosConfig.Bucket,
    Region: cosConfig.Region,
    Key: key
  }).promise()

  res.json({ success: true, message: '旧头像已删除' })
}
```

---

## 四、前端实现细节

### 4.1 API 封装 (`frontend/src/api/index.js`)

```javascript
export const uploadAPI = {
  // 获取上传签名
  getAvatarSignature: (filename) =>
    api.get('/upload/avatar-signature', { params: { filename } }),

  // 确认上传完成
  confirmAvatar: (key) =>
    api.post('/upload/avatar-confirm', { key }),

  // 删除旧头像
  deleteAvatar: (key) =>
    api.delete('/upload/avatar', { data: { key } })
}
```

### 4.2 头像 URL 处理 (`frontend/src/utils/avatar.js`)

```javascript
const DEFAULT_AVATAR = 'https://picsum.photos/seed/avatar/100/100'

export function getQQAvatarUrl(qq) {
  if (!qq) return null
  return `http://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(qq)}&s=100`
}

export function getAvatarUrl(user) {
  if (!user) return DEFAULT_AVATAR
  if (user.avatar) return user.avatar          // 1. 自定义头像
  if (user.qq) return getQQAvatarUrl(user.qq)  // 2. QQ 头像
  return DEFAULT_AVATAR                         // 3. 默认占位
}
```

**显示优先级：** 用户上传自定义头像 > QQ 头像（通过 QQ 号获取）> 随机占位图

### 4.3 完整上传流程 (`frontend/src/views/Profile.vue`)

```vue
<template>
  <div class="avatar-section">
    <div class="avatar-wrapper" @click="triggerAvatarUpload">
      <img :src="previewAvatar" alt="头像" />
      <div class="avatar-overlay">
        <svg><!-- 相机图标 --></svg>
        <span>{{ uploadingAvatar ? '上传中...' : '更换头像' }}</span>
      </div>
    </div>
    <input
      ref="avatarInputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      @change="handleAvatarChange"
      style="display: none"
    />
  </div>
</template>

<script setup>
const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  // 前端校验
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showToast('仅支持 JPG、PNG、GIF、WebP 格式', 'error')
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    showToast('图片大小不能超过 2MB', 'error')
    return
  }

  try {
    uploadingAvatar.value = true

    // 第 1 步：获取 COS 上传签名
    const sigRes = await uploadAPI.getAvatarSignature(file.name)
    const sigData = sigRes.data || sigRes

    // 第 2 步：直传文件到腾讯云 COS
    const fd = new FormData()
    if (sigData.formData) {
      Object.entries(sigData.formData).forEach(([key, value]) => {
        fd.append(key, value)
      })
    }
    fd.append('file', file)
    await fetch(sigData.uploadUrl, { method: 'POST', body: fd })

    // 第 3 步：确认上传，更新用户头像
    const confirmRes = await uploadAPI.confirmAvatar(sigData.key)
    const newAvatar = confirmRes.data?.avatar || confirmRes.avatar
    previewAvatar.value = newAvatar
    profile.value.avatar = newAvatar
    showToast('头像上传成功')
  } catch (err) {
    showToast(err || '头像上传失败', 'error')
  } finally {
    uploadingAvatar.value = false
    event.target.value = ''
  }
}
</script>
```

### 4.4 上传流程图

```
用户点击头像区域
       │
       ▼
triggerAvatarUpload()
  → 触发隐藏的 <input type="file">
       │
       ▼
用户选择图片文件
       │
       ▼
handleAvatarChange(event)
       │
       ├── 前端校验：文件类型(JPG/PNG/GIF/WebP) 和 大小(≤2MB)
       │     └── 不通过 → 弹 Toast 提示
       │
       ├── Step 1 ── GET /api/upload/avatar-signature?filename=xxx
       │     └── 返回 { uploadUrl, key, formData, ... }
       │
       ├── Step 2 ── POST {uploadUrl} (FormData)
       │     ├── 携带 formData 中的签名字段
       │     ├── 携带 file 文件
       │     └── 腾讯云 COS 验签并保存文件（自动转 webp）
       │
       ├── Step 3 ── POST /api/upload/avatar-confirm { key }
       │     └── 后端更新数据库 users.avatar = 新URL
       │
       └── 成功 → 更新头像预览
```

---

## 五、安全设计

| 安全措施 | 实现方式 | 目的 |
|---------|---------|------|
| **服务端签名** | 密钥仅在后端，前端不持有 `SecretKey` | 防止密钥泄露 |
| **JWT 认证** | 所有接口需要 `auth` 中间件验证登录 | 防止未授权上传 |
| **路径校验** | 确认时检查 `key` 是否包含当前 `userId` | 防止越权覆盖他人头像 |
| **类型双重校验** | 前端选择器 + 后端正则校验扩展名 | 防止恶意文件上传 |
| **短时效签名** | 签名有效期仅 300 秒（5 分钟） | 降低重放攻击风险 |
| **唯一文件名** | `{userId}_{timestamp}_{random}.webp` | 防止文件名冲突/覆盖 |

---

## 六、关键特点

**1. 前端直传，服务器零负担**

文件直接上传到 COS，不经过 Node.js 应用服务器，节省带宽和 CPU 资源。

**2. 自动图片压缩**

借助腾讯云 COS 的 [Pic-Operations](https://cloud.tencent.com/document/product/436/46488) 功能，上传后自动执行：
- 转换为 WebP 格式（比 JPEG 小 25-35%）
- quality 85（视觉无损压缩）

**3. 支持 CDN 加速**

通过配置 `COS_CUSTOM_DOMAIN`，头像 URL 可指向 CDN 加速域名，提升全球访问速度。

**4. 手动签名算法**

上传签名使用腾讯云官方文档的**手动签名**方式生成，而非 SDK 的 `postObject` 方法，更便于理解和调试。

**5. 与文章图片共用架构**

文章图片上传复用相同的三步架构（获取签名 → 直传 COS → 确认通知），区别在于：
- 存储路径不同：头像存 `avatars/`，文章图片存 `articles/content/` 或 `articles/cover/`
- 权限不同：头像需登录，文章图片需管理员权限
- 文件大小限制不同：头像 2MB，文章图片 10MB
