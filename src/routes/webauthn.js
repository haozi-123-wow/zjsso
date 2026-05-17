const express = require('express');
const db = require('../database/connection');
const { authenticate } = require('../middleware/auth');
const webauthnService = require('../services/webauthn/WebAuthnService');

const router = express.Router();

router.get('/credentials', authenticate, async (req, res) => {
  try {
    const credentials = await db.query(
      `SELECT id, credential_id, nickname, device_name, credential_type, transports, created_at, last_used_at
       FROM user_credentials WHERE user_id = ?`,
      [req.user.id]
    );
    res.json({ credentials });
  } catch (err) {
    console.error('List credentials error:', err);
    res.status(500).json({ error: 'server_error', message: '获取凭证列表失败' });
  }
});

router.post('/register/begin', authenticate, async (req, res) => {
  try {
    const users = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'user_not_found', message: '用户不存在' });
    }

    const options = await webauthnService.generateRegistrationOptions(users[0]);
    res.json(options);
  } catch (err) {
    console.error('Register begin error:', err);
    res.status(500).json({ error: 'server_error', message: '生成注册选项失败' });
  }
});

router.post('/register/complete', authenticate, async (req, res) => {
  try {
    const credential = {
      ...req.body,
      nickname: req.body.nickname || null
    };

    const result = await webauthnService.verifyRegistration(req.user.id, credential);
    res.status(201).json(result);
  } catch (err) {
    console.error('Register complete error:', err);
    res.status(400).json({
      error: 'WebAuthn Error',
      message: `凭证注册失败: ${err.message}`,
      statusCode: 400
    });
  }
});

router.post('/login/begin', async (req, res) => {
  try {
    const { username } = req.body;
    const options = await webauthnService.generateAuthenticationOptions(username || null);
    res.json(options);
  } catch (err) {
    console.error('Login begin error:', err);
    res.status(500).json({ error: 'server_error', message: '生成认证选项失败' });
  }
});

router.post('/login/complete', async (req, res) => {
  try {
    const user = await webauthnService.verifyAuthentication(req.body);
    if (!user) {
      return res.status(401).json({
        error: 'WebAuthn Error',
        message: '认证失败：用户未找到',
        statusCode: 401
      });
    }

    res.json({
      user_id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      picture: user.picture,
      role: user.role || 'user',
      message: 'WebAuthn 认证成功'
    });
  } catch (err) {
    console.error('Login complete error:', err);
    res.status(401).json({
      error: 'WebAuthn Error',
      message: `认证失败: ${err.message}`,
      statusCode: 401
    });
  }
});

router.delete('/credentials/:credentialId', authenticate, async (req, res) => {
  try {
    const deleted = await webauthnService.deleteCredential(req.user.id, req.params.credentialId);
    if (!deleted) {
      return res.status(404).json({ error: 'not_found', message: '凭证不存在' });
    }
    res.status(204).end();
  } catch (err) {
    console.error('Delete credential error:', err);
    res.status(500).json({ error: 'server_error', message: '删除凭证失败' });
  }
});

module.exports = router;
