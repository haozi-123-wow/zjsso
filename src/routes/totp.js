const express = require('express');
const { v4: uuidv4 } = require('uuid');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');
const db = require('../database/connection');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const { log, ACTION } = require('../services/ActivityLogService');
const { verifyTicket } = require('./verify');
const { generateTokens } = require('../services/TokenService');

const router = express.Router();

router.get('/totp/status', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT enabled FROM user_totp WHERE user_id = ?', [req.user.id]);
    res.json({ enabled: rows.length > 0 && !!rows[0].enabled });
  } catch (err) {
    console.error('TOTP status error:', err);
    res.status(500).json({ error: 'server_error', message: '获取状态失败' });
  }
});

router.post('/totp/setup', authenticate, async (req, res) => {
  try {
    const existing = await db.query('SELECT id FROM user_totp WHERE user_id = ?', [req.user.id]);
    if (existing.length > 0 && existing[0].enabled) {
      return res.status(400).json({ error: 'invalid_request', message: '2FA 已启用，请先关闭后再重新设置' });
    }

    const secret = speakeasy.generateSecret({
      name: `${config.app.issuer || 'ZJSSO'}:${req.user.username || req.user.email}`
    });

    const id = uuidv4();
    await db.query(
      'INSERT INTO user_totp (id, user_id, secret, enabled) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE secret = VALUES(secret), enabled = FALSE, verified_at = NULL',
      [id, req.user.id, secret.base32, false]
    );

    const otpauthUrl = secret.otpauth_url;
    let qrDataUrl = null;
    try {
      qrDataUrl = await qrcode.toDataURL(otpauthUrl, { width: 240, margin: 2 });
    } catch {}

    res.json({
      secret: secret.base32,
      otpauth_url: otpauthUrl,
      qr_code: qrDataUrl
    });
  } catch (err) {
    console.error('TOTP setup error:', err);
    res.status(500).json({ error: 'server_error', message: '设置失败' });
  }
});

router.post('/totp/verify', authenticate, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少验证码' });
    }

    const rows = await db.query('SELECT * FROM user_totp WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(400).json({ error: 'invalid_request', message: '请先完成设置' });
    }

    const verified = speakeasy.totp.verify({
      secret: rows[0].secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'invalid_grant', message: '验证码错误' });
    }

    await db.query('UPDATE user_totp SET enabled = TRUE, verified_at = NOW() WHERE user_id = ?', [req.user.id]);

    log(req.user.id, ACTION.ENABLE_2FA, { method: 'totp' }, req);

    res.json({ enabled: true, message: '2FA 已启用' });
  } catch (err) {
    console.error('TOTP verify error:', err);
    res.status(500).json({ error: 'server_error', message: '验证失败' });
  }
});

router.post('/totp/disable', authenticate, async (req, res) => {
  try {
    const { code, ticket } = req.body;

    const rows = await db.query('SELECT * FROM user_totp WHERE user_id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.json({ enabled: false });
    }

    let verified = false;
    if (code) {
      verified = speakeasy.totp.verify({
        secret: rows[0].secret,
        encoding: 'base32',
        token: code.replace(/\s/g, ''),
        window: 1
      });
    } else if (ticket) {
      verified = !!verifyTicket(ticket, req.user.id, 'disable_2fa');
    }

    if (!verified) {
      return res.status(400).json({ error: 'invalid_grant', message: '验证失败，请提供有效的验证码' });
    }

    await db.query('DELETE FROM user_totp WHERE user_id = ?', [req.user.id]);

    log(req.user.id, ACTION.DISABLE_2FA, null, req);

    res.json({ enabled: false });
  } catch (err) {
    console.error('TOTP disable error:', err);
    res.status(500).json({ error: 'server_error', message: '关闭失败' });
  }
});

router.post('/totp/login-check', async (req, res) => {
  try {
    const { temp_token, code } = req.body;
    if (!temp_token || !code) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少参数' });
    }

    const decrypted = verifyTempToken(temp_token);
    if (!decrypted) {
      return res.status(401).json({ error: 'invalid_grant', message: '令牌已过期或无效，请重新登录' });
    }

    const rows = await db.query('SELECT * FROM user_totp WHERE user_id = ?', [decrypted.userId]);
    if (rows.length === 0 || !rows[0].enabled) {
      return res.status(400).json({ error: 'invalid_request', message: '2FA 未启用' });
    }

    const verified = speakeasy.totp.verify({
      secret: rows[0].secret,
      encoding: 'base32',
      token: code.replace(/\s/g, ''),
      window: 1
    });

    if (!verified) {
      return res.status(400).json({ error: 'invalid_grant', message: '验证码错误' });
    }

    const userRows = await db.query('SELECT * FROM users WHERE id = ?', [decrypted.userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    const user = userRows[0];
    const tokens = await generateTokens(user);

    log(user.id, ACTION.LOGIN, { method: 'totp', security_notice: false }, req);

    res.json({
      verified: true,
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: config.jwt.expiresIn,
      refresh_token: tokens.refreshToken,
      id_token: tokens.idToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        picture: user.picture,
        role: user.role || 'user'
      }
    });
  } catch (err) {
    console.error('TOTP login-check error:', err);
    res.status(500).json({ error: 'server_error', message: '验证失败' });
  }
});

function generateTempToken(userId) {
  const payload = JSON.stringify({ userId, ts: Date.now() });
  const cipher = crypto.createCipheriv('aes-256-cbc',
    crypto.createHash('sha256').update(config.jwt.secret).digest(),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function verifyTempToken(token) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc',
      crypto.createHash('sha256').update(config.jwt.secret).digest(),
      Buffer.alloc(16, 0)
    );
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const data = JSON.parse(decrypted);
    if (Date.now() - data.ts > 300000) return null;
    return data;
  } catch {
    return null;
  }
}

module.exports = { router, generateTempToken };
