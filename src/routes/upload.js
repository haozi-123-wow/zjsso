const express = require('express');
const crypto = require('crypto');
const path = require('path');
const COS = require('cos-nodejs-sdk-v5');
const db = require('../database/connection');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { log, ACTION } = require('../services/ActivityLogService');

const router = express.Router();

function getCosConfig() {
  const { secretId, secretKey, bucket, region } = config.cos;
  if (!secretId || !secretKey || !bucket || !region) return null;
  return { secretId, secretKey, bucket, region };
}

function getCosUrl(key) {
  if (config.cos.customDomain) {
    return `${config.cos.customDomain}/${key}`;
  }
  return `https://${config.cos.bucket}.cos.${config.cos.region}.myqcloud.com/${key}`;
}

function generateCosFormSignature(options) {
  const { SecretId, SecretKey, Bucket, Key, Expires = 300 } = options;
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Expires;
  const keyTime = `${now};${exp}`;

  const policy = {
    expiration: new Date(exp * 1000).toISOString(),
    conditions: [
      { bucket: Bucket },
      { key: Key },
      { 'q-sign-algorithm': 'sha1' },
      { 'q-ak': SecretId },
      { 'q-sign-time': keyTime }
    ]
  };
  const policyStr = JSON.stringify(policy);
  const policyBase64 = Buffer.from(policyStr).toString('base64');
  const signKey = crypto.createHmac('sha1', SecretKey).update(keyTime).digest('hex');
  const stringToSign = crypto.createHash('sha1').update(policyStr).digest('hex');
  const signature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

  return {
    policy: policyBase64,
    'q-sign-algorithm': 'sha1',
    'q-ak': SecretId,
    'q-key-time': keyTime,
    'q-signature': signature
  };
}

router.get('/avatar-signature', authenticate, async (req, res) => {
  try {
    console.log('[Avatar] GET /avatar-signature - user:', req.user.id, 'filename:', req.query.filename);

    const cosConfig = getCosConfig();
    if (!cosConfig) {
      console.warn('[Avatar] COS not configured - secretId:', !!config.cos.secretId, 'secretKey:', !!config.cos.secretKey, 'bucket:', !!config.cos.bucket, 'region:', !!config.cos.region);
      return res.status(500).json({ error: 'cos_not_configured', message: 'COS 未配置' });
    }
    console.log('[Avatar] COS config OK - bucket:', cosConfig.bucket, 'region:', cosConfig.region, 'customDomain:', config.cos.customDomain);

    const ext = path.extname(req.query.filename || '.jpg').toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    const key = `avatars/${req.user.id}_${timestamp}_${random}${ext}`;
    console.log('[Avatar] Generated key:', key, 'ext:', ext);

    const signatureFields = generateCosFormSignature({
      SecretId: cosConfig.secretId,
      SecretKey: cosConfig.secretKey,
      Bucket: cosConfig.bucket,
      Key: key,
      Expires: 300
    });
    console.log('[Avatar] Signature generated, hasPolicy:', !!signatureFields.policy);

    const picOperations = JSON.stringify({
      is_pic_info: 1,
      rules: [{ fileid: '/' + key, rule: 'imageMogr2/format/webp/quality/85' }]
    });

    const uploadUrl = `https://${cosConfig.bucket}.cos.${cosConfig.region}.myqcloud.com/`;
    const avatarUrl = getCosUrl(key);
    console.log('[Avatar] uploadUrl:', uploadUrl, 'avatarUrl:', avatarUrl);

    res.json({
      uploadUrl,
      avatar_url: avatarUrl,
      key,
      expired: Math.floor(Date.now() / 1000) + 300,
      formData: {
        key,
        ...signatureFields,
        'pic-operations': picOperations
      },
      constraints: {
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
        maxFileSize: 2 * 1024 * 1024
      }
    });
    console.log('[Avatar] Signature response sent successfully');
  } catch (err) {
    console.error('[Avatar] Signature error:', err.message, err.stack);
    res.status(500).json({ error: 'server_error', message: '获取签名失败' });
  }
});

router.post('/avatar-confirm', authenticate, async (req, res) => {
  try {
    const { key } = req.body;
    console.log('[Avatar] POST /avatar-confirm - user:', req.user.id, 'key:', key);

    if (!key || !key.startsWith('avatars/') || !key.includes(`/${req.user.id}_`)) {
      console.warn('[Avatar] Invalid key validation failed - key:', key, 'userId:', req.user.id);
      return res.status(400).json({ error: 'invalid_request', message: '无效的 key' });
    }

    const avatarUrl = getCosUrl(key);
    console.log('[Avatar] avatarUrl resolved:', avatarUrl);

    const result = await db.query('UPDATE users SET picture = ?, updated_at = NOW() WHERE id = ?', [avatarUrl, req.user.id]);
    console.log('[Avatar] DB update result - affectedRows:', result.affectedRows);

    log(req.user.id, ACTION.UPLOAD_AVATAR, { key }, req);
    console.log('[Avatar] Activity log recorded');

    res.json({ avatar: avatarUrl });
    console.log('[Avatar] Confirm response sent');
  } catch (err) {
    console.error('[Avatar] Confirm error:', err.message, err.stack);
    res.status(500).json({ error: 'server_error', message: '确认上传失败' });
  }
});

router.delete('/avatar', authenticate, async (req, res) => {
  try {
    console.log('[Avatar] DELETE /avatar - user:', req.user.id);

    const cosConfig = getCosConfig();
    if (!cosConfig) {
      console.warn('[Avatar] COS not configured for delete');
      return res.status(500).json({ error: 'cos_not_configured', message: 'COS 未配置' });
    }

    const users = await db.query('SELECT picture FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0 || !users[0].picture) {
      console.log('[Avatar] No avatar to delete - user:', req.user.id);
      return res.json({ deleted: false });
    }

    const oldUrl = users[0].picture;
    console.log('[Avatar] Old avatar URL:', oldUrl);
    const keyMatch = oldUrl.match(/\/avatars\/[^/]+$/);
    if (keyMatch) {
      const key = keyMatch[0].substring(1);
      console.log('[Avatar] Attempting COS delete - key:', key);
      try {
        const cosClient = new COS({
          SecretId: cosConfig.secretId,
          SecretKey: cosConfig.secretKey
        });
        await cosClient.deleteObject({
          Bucket: cosConfig.bucket,
          Region: cosConfig.region,
          Key: key
        });
        console.log('[Avatar] COS delete successful');
      } catch (e) {
        console.error('[Avatar] COS delete error:', e.message, e.stack);
      }
    } else {
      console.log('[Avatar] No COS key found in URL, skipping COS delete');
    }

    const result = await db.query('UPDATE users SET picture = NULL, updated_at = NOW() WHERE id = ?', [req.user.id]);
    console.log('[Avatar] DB update result - affectedRows:', result.affectedRows);

    log(req.user.id, ACTION.DELETE_AVATAR, null, req);
    console.log('[Avatar] Delete activity log recorded');

    res.json({ deleted: true });
    console.log('[Avatar] Delete response sent');
  } catch (err) {
    console.error('[Avatar] Delete error:', err.message, err.stack);
    res.status(500).json({ error: 'server_error', message: '删除头像失败' });
  }
});

router.get('/client-logo-signature', authenticate, async (req, res) => {
  try {
    const cosConfig = getCosConfig();
    if (!cosConfig) {
      return res.status(500).json({ error: 'cos_not_configured', message: 'COS 未配置' });
    }

    const { clientId, filename } = req.query;
    if (!clientId) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少 clientId' });
    }

    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];
    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权修改此客户端' });
    }

    const ext = path.extname(filename || '.png').toLowerCase();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6);
    const key = `logos/${clientId}_${timestamp}_${random}${ext}`;

    const signatureFields = generateCosFormSignature({
      SecretId: cosConfig.secretId,
      SecretKey: cosConfig.secretKey,
      Bucket: cosConfig.bucket,
      Key: key,
      Expires: 300
    });

    const picOperations = JSON.stringify({
      is_pic_info: 1,
      rules: [{ fileid: '/' + key, rule: 'imageMogr2/format/webp/quality/85' }]
    });

    const uploadUrl = `https://${cosConfig.bucket}.cos.${cosConfig.region}.myqcloud.com/`;
    const logoUrl = getCosUrl(key);

    res.json({
      uploadUrl,
      logo_url: logoUrl,
      key,
      expired: Math.floor(Date.now() / 1000) + 300,
      formData: {
        key,
        ...signatureFields,
        'pic-operations': picOperations
      },
      constraints: {
        allowedExtensions: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'],
        maxFileSize: 2 * 1024 * 1024
      }
    });
  } catch (err) {
    console.error('Client logo signature error:', err);
    res.status(500).json({ error: 'server_error', message: '获取签名失败' });
  }
});

router.post('/client-logo-confirm', authenticate, async (req, res) => {
  try {
    const cosConfig = getCosConfig();
    if (!cosConfig) {
      return res.status(500).json({ error: 'cos_not_configured', message: 'COS 未配置' });
    }

    const { key, clientId } = req.body;
    if (!key || !key.startsWith('logos/') || !clientId) {
      return res.status(400).json({ error: 'invalid_request', message: '无效的参数' });
    }

    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];
    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权修改此客户端' });
    }

    if (client.logo_uri) {
      const oldKeyMatch = client.logo_uri.match(/\/logos\/[^/]+$/);
      if (oldKeyMatch) {
        const oldKey = oldKeyMatch[0].substring(1);
        try {
          const cosClient = new COS({ SecretId: cosConfig.secretId, SecretKey: cosConfig.secretKey });
          await cosClient.deleteObject({ Bucket: cosConfig.bucket, Region: cosConfig.region, Key: oldKey });
        } catch (e) { console.error('COS delete old logo error:', e); }
      }
    }

    const logoUrl = getCosUrl(key);
    await db.query('UPDATE clients SET logo_uri = ? WHERE id = ?', [logoUrl, clientId]);

    res.json({ logo_uri: logoUrl });
  } catch (err) {
    console.error('Client logo confirm error:', err);
    res.status(500).json({ error: 'server_error', message: '确认上传失败' });
  }
});

router.delete('/client-logo', authenticate, async (req, res) => {
  try {
    const cosConfig = getCosConfig();
    if (!cosConfig) {
      return res.status(500).json({ error: 'cos_not_configured', message: 'COS 未配置' });
    }

    const { clientId } = req.body;
    if (!clientId) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少 clientId' });
    }

    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [clientId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];
    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权修改此客户端' });
    }

    if (client.logo_uri) {
      const keyMatch = client.logo_uri.match(/\/logos\/[^/]+$/);
      if (keyMatch) {
        const key = keyMatch[0].substring(1);
        try {
          const cosClient = new COS({ SecretId: cosConfig.secretId, SecretKey: cosConfig.secretKey });
          await cosClient.deleteObject({ Bucket: cosConfig.bucket, Region: cosConfig.region, Key: key });
        } catch (e) { console.error('COS delete logo error:', e); }
      }
    }

    await db.query('UPDATE clients SET logo_uri = NULL WHERE id = ?', [clientId]);

    res.json({ logo_uri: null });
  } catch (err) {
    console.error('Client logo delete error:', err);
    res.status(500).json({ error: 'server_error', message: '删除 Logo 失败' });
  }
});

module.exports = router;
