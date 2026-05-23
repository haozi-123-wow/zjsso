const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const emailService = require('../services/EmailService');
const { log, ACTION } = require('../services/ActivityLogService');
const speakeasy = require('speakeasy');
const webauthnService = require('../services/webauthn/WebAuthnService');

const router = express.Router();

function generateTicket(userId, action) {
  const payload = JSON.stringify({ userId, action, ts: Date.now() });
  const cipher = crypto.createCipheriv('aes-256-cbc',
    crypto.createHash('sha256').update(config.jwt.secret).digest(),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function verifyTicket(token, userId, action) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc',
      crypto.createHash('sha256').update(config.jwt.secret).digest(),
      Buffer.alloc(16, 0)
    );
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const data = JSON.parse(decrypted);
    if (Date.now() - data.ts > 300000) return null;
    if (data.userId !== userId) return null;
    if (data.action !== action) return null;
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
    const userRows = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
    const user = userRows[0];
    if (!user || !user.email || user.email.endsWith('@social.local')) {
      return res.status(400).json({ error: 'invalid_request', message: '您暂未配置有效的邮箱，请先绑定邮箱' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await emailService.storeCode(user.email, code, 'verification', 600);
    await emailService.sendVerificationEmail(user.email, code);
    res.json({ sent: true });
  } catch (err) {
    console.error('Send verify email error:', err);
    res.status(500).json({ error: 'server_error', message: '发送验证码失败' });
  }
});

router.post('/verify/check', authenticate, async (req, res) => {
  try {
    const { method, code } = req.body;
    if (!method || !code) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少参数' });
    }
    if (method === 'email') {
      const userRows = await db.query('SELECT email FROM users WHERE id = ?', [req.user.id]);
      const user = userRows[0];
      if (!user || !user.email) {
        return res.status(400).json({ error: 'invalid_request', message: '邮箱不存在' });
      }
      const result = await emailService.verifyCode(user.email, code, 'verification');
      if (!result.valid) {
        return res.status(400).json({ error: 'invalid_grant', message: result.reason || '验证码错误' });
      }
    } else if (method === 'totp') {
      const rows = await db.query('SELECT secret FROM user_totp WHERE user_id = ? AND enabled = TRUE', [req.user.id]);
      if (rows.length === 0) {
        return res.status(400).json({ error: 'invalid_request', message: '2FA 未启用' });
      }
      const verified = speakeasy.totp.verify({ secret: rows[0].secret, encoding: 'base32', token: code.replace(/\s/g, ''), window: 1 });
      if (!verified) {
        return res.status(400).json({ error: 'invalid_grant', message: '验证码错误' });
      }
    } else if (method === 'passkey') {
      let credentialData;
      try { credentialData = JSON.parse(code); } catch { return res.status(400).json({ error: 'invalid_request', message: '无效的凭证数据' }); }
      const user = await webauthnService.verifyAuthentication(credentialData);
      if (!user || user.id !== req.user.id) {
        return res.status(400).json({ error: 'invalid_grant', message: '通行密钥验证失败' });
      }
    } else {
      return res.status(400).json({ error: 'invalid_request', message: '不支持的验证方式' });
    }
    const ticket = generateTicket(req.user.id, req.body.action || 'generic');
    res.json({ verified: true, ticket });
  } catch (err) {
    console.error('Verify check error:', err);
    res.status(500).json({ error: 'server_error', message: '验证失败' });
  }
});

router.put('/profile', authenticate, async (req, res) => {
  try {
    const { ticket, email, display_name } = req.body;
    const action = email ? 'change_email' : 'update_profile';

    if (!ticket) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少验证凭据' });
    }
    const ticketData = verifyTicket(ticket, req.user.id, action);
    if (!ticketData) {
      return res.status(400).json({ error: 'invalid_request', message: '验证凭据无效或已过期' });
    }

    const updates = [];
    const values = [];

    if (email !== undefined) {
      const existing = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Validation Error', message: '该邮箱已被其他账号使用' });
      }
      updates.push('email = ?');
      values.push(email);
      updates.push('email_verified = ?');
      values.push(false);
    }
    if (display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(display_name || null);
    }

    if (updates.length === 0) {
      return res.json({ message: '无变更' });
    }

    values.push(req.user.id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    if (email) {
      log(req.user.id, ACTION.CHANGE_EMAIL, { old: req.user.email, new: email }, req);
    }
    if (display_name !== undefined) {
      log(req.user.id, ACTION.UPDATE_PROFILE, { display_name }, req);
    }

    const updated = await db.query('SELECT id, username, email, display_name, picture, role FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: '更新成功',
      user: updated[0]
    });
  } catch (err) {
    console.error('Update profile error:', err);
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
