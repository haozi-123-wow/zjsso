const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const { log, ACTION } = require('../services/ActivityLogService');
const { getRedisClient } = require('../database/redis');
const speakeasy = require('speakeasy');
const webauthnService = require('../services/webauthn/WebAuthnService');

const router = express.Router();

function generateTicket(userId, action) {
  const payload = JSON.stringify({ userId, action, ts: Date.now(), jti: uuidv4() });
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc',
    crypto.createHash('sha256').update(config.jwt.secret).digest(),
    iv
  );
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + encrypted;
}

async function verifyTicket(token, userId, action, { consume = false } = {}) {
  try {
    const iv = Buffer.from(token.substring(0, 32), 'hex');
    const encrypted = token.substring(32);
    const decipher = crypto.createDecipheriv('aes-256-cbc',
      crypto.createHash('sha256').update(config.jwt.secret).digest(),
      iv
    );
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const data = JSON.parse(decrypted);
    if (Date.now() - data.ts > 300000) return null;
    if (data.userId !== userId) return null;
    if (data.action !== action) return null;

    if (consume && data.jti) {
      const redis = getRedisClient();
      const usedKey = `ticket_used:${data.jti}`;
      const alreadyUsed = await redis.get(usedKey);
      if (alreadyUsed) return null;
      const remaining = Math.max(1, Math.ceil((300000 - (Date.now() - data.ts)) / 1000));
      await redis.set(usedKey, '1', 'EX', remaining);
    }

    return data;
  } catch { return null; }
}

async function getMethods(userId) {
  const methods = [];
  const userRows = await db.query('SELECT email FROM users WHERE id = ?', [userId]);
  const user = userRows[0];
  if (user && user.email && !user.email.endsWith('@social.local')) {
    methods.push('email');
  }
  const totpRows = await db.query('SELECT enabled FROM user_totp WHERE user_id = ? AND enabled = TRUE', [userId]);
  if (totpRows.length > 0) methods.push('totp');
  const credRows = await db.query('SELECT id FROM user_credentials WHERE user_id = ?', [userId]);
  if (credRows.length > 0) methods.push('passkey');
  return methods;
}

router.get('/verify/methods', authenticate, async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    const methods = await getMethods(req.user.id);
    res.json({ methods });
  } catch (err) {
    console.error('Verify methods error:', err);
    res.status(500).json({ error: 'server_error', message: '获取验证方式失败' });
  }
});

router.post('/verify/send-email', authenticate, async (req, res) => {
  try {
    console.log('[Verify] POST /verify/send-email - user:', req.user.id);
    const userRows = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    console.log('[Verify] User email from DB:', user?.email, 'is_social:', user?.email?.endsWith('@social.local'));
    if (!user || !user.email || user.email.endsWith('@social.local')) {
      console.warn('[Verify] No valid email configured for user:', req.user.id);
      return res.status(400).json({ error: 'invalid_request', message: '您暂未配置有效的邮箱，请先绑定邮箱' });
    }
    const code = crypto.randomInt(100000, 1000000).toString();
    console.log('[Verify] Generated verification code, storing and sending to:', user.email);
    await emailService.storeCode(user.email, code, 'verification', 600);
    await emailService.sendVerificationEmail(user.email, code);
    console.log('[Verify] Verification email sent successfully');
    res.json({ sent: true });
  } catch (err) {
    console.error('[Verify] Send verify email error:', err.message, err.stack);
    res.status(500).json({ error: 'server_error', message: '发送验证码失败' });
  }
});

router.post('/verify/check', authenticate, async (req, res) => {
  try {
    const { method, code } = req.body;
    console.log('[Verify] POST /verify/check - user:', req.user.id, 'method:', method, 'action:', req.body.action, 'codePrefix:', code ? code.substring(0, 2) + '***' : 'empty');
    if (!method || !code) {
      console.warn('[Verify] Missing method or code');
      return res.status(400).json({ error: 'invalid_request', message: '缺少参数' });
    }
    if (method === 'email') {
      const userRows = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
      const user = userRows[0];
      if (!user || !user.email) {
        console.warn('[Verify] Email not found for user:', req.user.id);
        return res.status(400).json({ error: 'invalid_request', message: '邮箱不存在' });
      }
      console.log('[Verify] Verifying email code for:', user.email);
      const result = await emailService.verifyCode(user.email, code, 'verification');
      console.log('[Verify] Email verification result:', result.valid, 'reason:', result.reason);
      if (!result.valid) {
        return res.status(400).json({ error: 'invalid_grant', message: result.reason || '验证码错误' });
      }
    } else if (method === 'totp') {
      const rows = await db.query('SELECT secret FROM user_totp WHERE user_id = ? AND enabled = TRUE', [req.user.id]);
      if (rows.length === 0) {
        console.warn('[Verify] TOTP not enabled for user:', req.user.id);
        return res.status(400).json({ error: 'invalid_request', message: '2FA 未启用' });
      }
      const verified = speakeasy.totp.verify({ secret: rows[0].secret, encoding: 'base32', token: code.replace(/\s/g, ''), window: 1 });
      console.log('[Verify] TOTP verification result:', verified);
      if (!verified) {
        return res.status(400).json({ error: 'invalid_grant', message: '验证码错误' });
      }
    } else if (method === 'passkey') {
      let credentialData;
      try { credentialData = JSON.parse(code); } catch { console.warn('[Verify] Invalid passkey credential data'); return res.status(400).json({ error: 'invalid_request', message: '无效的凭证数据' }); }
      const user = await webauthnService.verifyAuthentication(credentialData);
      console.log('[Verify] Passkey verification result - found:', !!user);
      if (!user || user.id !== req.user.id) {
        console.warn('[Verify] Passkey verification failed');
        return res.status(400).json({ error: 'invalid_grant', message: '通行密钥验证失败' });
      }
    } else {
      console.warn('[Verify] Unsupported method:', method);
      return res.status(400).json({ error: 'invalid_request', message: '不支持的验证方式' });
    }
    const ticket = generateTicket(req.user.id, req.body.action || 'generic');
    console.log('[Verify] Verification passed, ticket generated');
    res.json({ verified: true, ticket });
  } catch (err) {
    console.error('[Verify] Check error:', err.message, err.stack);
    res.status(500).json({ error: 'server_error', message: '验证失败' });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { ticket, email, qq } = req.body;
    console.log('[Verify] PUT /profile - user:', req.user.id, 'hasTicket:', !!ticket, 'newEmail:', email, 'qq:', qq);

    const updates = [];
    const values = [];

    if (email !== undefined) {
      if (!ticket) {
        console.warn('[Verify] Profile update - missing ticket for email change');
        return res.status(400).json({ error: 'invalid_request', message: '修改邮箱需先完成安全验证' });
      }
      const ticketData = await verifyTicket(ticket, req.user.id, 'change_email', { consume: true });
      if (!ticketData) {
        console.warn('[Verify] Profile update - ticket invalid or expired');
        return res.status(400).json({ error: 'invalid_request', message: '验证凭据无效或已过期' });
      }
      console.log('[Verify] Profile update - ticket verified, checking email availability');
      const existing = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (existing.length > 0) {
        console.warn('[Verify] Email already in use:', email);
        return res.status(400).json({ error: 'Validation Error', message: '该邮箱已被其他账号使用' });
      }
      updates.push('email = ?');
      values.push(email);
      updates.push('email_verified = ?');
      values.push(false);
    }
    if (qq !== undefined) {
      updates.push('qq = ?');
      values.push(qq || null);
    }

    if (updates.length === 0) {
      console.log('[Verify] Profile update - no changes');
      return res.json({ message: '无变更' });
    }

    values.push(req.user.id);
    const result = await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    console.log('[Verify] Profile update - affectedRows:', result.affectedRows);

    if (email) {
      log(req.user.id, ACTION.CHANGE_EMAIL, { old: req.user.email, new: email }, req);
      console.log('[Verify] Email change logged');
    }
    if (qq !== undefined) {
      log(req.user.id, ACTION.UPDATE_PROFILE, { qq }, req);
    }

    const updated = await db.query('SELECT id, username, email, display_name, picture, role, qq FROM users WHERE id = ?', [req.user.id]);
    console.log('[Verify] Profile update successful for user:', req.user.id);

    res.json({
      message: '更新成功',
      user: updated[0]
    });
  } catch (err) {
    console.error('[Verify] Update profile error:', err.message, err.stack);
    res.status(500).json({ error: 'server_error', message: '更新失败' });
  }
});

router.get('/profile/email-status', authenticate, async (req, res) => {
  try {
    const userRows = await db.query('SELECT email, email_verified FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    res.json({
      email: user.email,
      verified: !!user.email_verified,
      is_social_email: user.email ? user.email.endsWith('@social.local') : false
    });
  } catch (err) {
    console.error('Email status error:', err);
    res.status(500).json({ error: 'server_error', message: '获取邮箱状态失败' });
  }
});

module.exports = router;
module.exports.verifyTicket = verifyTicket;
