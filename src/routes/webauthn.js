const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { getRedisClient } = require('../database/redis');
const config = require('../config');
const { authenticate } = require('../middleware/auth');
const webauthnService = require('../services/webauthn/WebAuthnService');
const { log, ACTION } = require('../services/ActivityLogService');
const { verifyTicket } = require('./verify');

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
    const { ticket } = req.body;
    if (!ticket || !(await verifyTicket(ticket, req.user.id, 'register_passkey', { consume: true }))) {
      return res.status(400).json({ error: 'invalid_request', message: '请先完成安全验证' });
    }

    const credential = {
      ...req.body,
      nickname: req.body.nickname || null
    };

    const result = await webauthnService.verifyRegistration(req.user.id, credential);
    log(req.user.id, ACTION.REGISTER_PASSKEY, { nickname: req.body.nickname || null }, req);
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
    let session_id;
    if (!username) {
      session_id = uuidv4();
    }
    console.log(`[WebAuthn] /login/begin username=${username}, session_id=${session_id ? session_id.substring(0,8)+'...' : 'none'}`);
    const options = await webauthnService.generateAuthenticationOptions(username || null, session_id);
    const response = { ...options };
    if (session_id) {
      response.session_id = session_id;
    }
    console.log(`[WebAuthn] /login/begin returning challenge=${options.publicKey.challenge.substring(0,8)}..., session_id=${session_id ? session_id.substring(0,8)+'...' : 'none'}`);
    res.json(response);
  } catch (err) {
    console.error('Login begin error:', err);
    res.status(500).json({ error: 'server_error', message: '生成认证选项失败' });
  }
});

router.post('/login/complete', async (req, res) => {
  try {
    console.log(`[WebAuthn] /login/complete credential.id=${(req.body.id || '').substring(0,12)}..., session_id=${req.body.session_id ? req.body.session_id.substring(0,8)+'...' : 'N/A'}`);
    const user = await webauthnService.verifyAuthentication(req.body);
    if (!user) {
      return res.status(401).json({
        error: 'WebAuthn Error',
        message: '认证失败：用户未找到',
        statusCode: 401
      });
    }

    const now = Math.floor(Date.now() / 1000);
    const jti = uuidv4();

    const accessToken = jwt.sign({
      iss: config.app.issuer,
      sub: user.id,
      aud: 'zjsso',
      jti,
      iat: now,
      exp: now + config.jwt.expiresIn,
      preferred_username: user.username,
      email: user.email,
      role: user.role || 'user',
      scope: 'openid profile email'
    }, config.jwt.secret, { algorithm: 'HS256' });

    const idToken = jwt.sign({
      iss: config.app.issuer,
      sub: user.id,
      aud: 'zjsso',
      jti: uuidv4(),
      iat: now,
      exp: now + config.jwt.expiresIn,
      name: user.display_name,
      preferred_username: user.username,
      email: user.email,
      email_verified: !!user.email_verified,
      picture: user.picture,
      locale: user.locale || 'zh-CN'
    }, config.jwt.secret, { algorithm: 'HS256' });

    const refreshToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const refreshExpiresAt = new Date((now + config.jwt.refreshExpiresIn) * 1000);

    if (config.session.mode === 'stateful') {
      const redisClient = getRedisClient();
      await redisClient.set(
        `token:${accessToken}`,
        JSON.stringify({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          scopes: 'openid profile email',
          jti
        }),
        'PX',
        config.session.expiresIn * 1000
      );
    }

    await db.query(
      `INSERT INTO refresh_tokens (id, token_hash, client_id, user_id, scopes, expires_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [uuidv4(), refreshTokenHash, null, user.id, 'openid profile email', refreshExpiresAt]
    );

    log(user.id, ACTION.LOGIN, { method: 'passkey' }, req);

    res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: config.jwt.expiresIn,
      refresh_token: refreshToken,
      id_token: idToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        picture: user.picture,
        role: user.role || 'user',
        qq: user.qq
      }
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
    const ticket = req.headers['x-verify-ticket'];
    if (!ticket || !(await verifyTicket(ticket, req.user.id, 'delete_passkey', { consume: true }))) {
      return res.status(400).json({ error: 'invalid_request', message: '请先完成安全验证' });
    }
    const deleted = await webauthnService.deleteCredential(req.user.id, req.params.credentialId);
    if (!deleted) {
      return res.status(404).json({ error: 'not_found', message: '凭证不存在' });
    }
    log(req.user.id, ACTION.DELETE_PASSKEY, { credential_id: req.params.credentialId }, req);
    res.status(204).end();
  } catch (err) {
    console.error('Delete credential error:', err);
    res.status(500).json({ error: 'server_error', message: '删除凭证失败' });
  }
});

module.exports = router;
