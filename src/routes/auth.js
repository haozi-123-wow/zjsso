const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { getRedisClient } = require('../database/redis');
const config = require('../config');
const User = require('../models/User');
const Group = require('../models/Group');
const geetestService = require('../services/GeetestService');
const emailService = require('../services/EmailService');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const { getIpLocation, getClientIp } = require('../services/IpLocationService');
const { log, ACTION } = require('../services/ActivityLogService');
const { generateTempToken } = require('./totp');
const { generateTokens } = require('../services/TokenService');
const { setRefreshTokenCookie, clearRefreshTokenCookie, getRefreshTokenFromCookie } = require('../utils/cookie');

const router = express.Router();

const registerLimiter = createRateLimiter({
  windowSeconds: config.rateLimit.registerPerIp.window,
  maxRequests: config.rateLimit.registerPerIp.max,
  keyPrefix: 'register'
});

const loginLimiter = createRateLimiter({
  windowSeconds: config.rateLimit.loginPerIp.window,
  maxRequests: config.rateLimit.loginPerIp.max,
  keyPrefix: 'login'
});

const checkAvailableLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 30,
  keyPrefix: 'check_avail'
});

router.get('/client-info', async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少 client_id' });
    }
    const rows = await db.query('SELECT client_id, client_name, client_description, logo_uri, homepage_uri FROM clients WHERE client_id = ? AND enabled = TRUE', [client_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在或已禁用' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Client info error:', err);
    res.status(500).json({ error: 'server_error', message: '获取客户端信息失败' });
  }
});

router.get('/check-consent', async (req, res) => {
  try {
    const { client_id } = req.query;
    if (!client_id) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少 client_id' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: '缺少访问令牌' });
    }

    const token = authHeader.substring(7);
    let userId;
    try {
      if (config.session.mode === 'stateful') {
        const redis = getRedisClient();
        const sessionData = await redis.get(`token:${token}`);
        if (!sessionData) throw new Error('invalid token');
        userId = JSON.parse(sessionData).id;
      } else {
        const decoded = jwt.verify(token, config.jwt.secret);
        userId = decoded.sub;
      }
    } catch {
      return res.status(401).json({ error: 'invalid_token', message: '令牌无效' });
    }

    const clientRows = await db.query('SELECT id FROM clients WHERE client_id = ? AND enabled = TRUE', [client_id]);
    if (clientRows.length === 0) {
      return res.json({ consented: false });
    }

    const internalClientId = clientRows[0].id;
    const consentRows = await db.query('SELECT id FROM user_consents WHERE user_id = ? AND client_id = ?', [userId, internalClientId]);

    res.json({ consented: consentRows.length > 0 });
  } catch (err) {
    console.error('Check consent error:', err);
    res.status(500).json({ error: 'server_error', message: '检查授权状态失败' });
  }
});

router.get('/user/consents', authenticate, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT uc.id, uc.client_id, uc.scopes, uc.granted_at,
              c.client_name, c.client_description, c.logo_uri, c.client_id as client_key
       FROM user_consents uc
       INNER JOIN clients c ON c.id = uc.client_id
       WHERE uc.user_id = ?
       ORDER BY uc.granted_at DESC`,
      [req.user.id]
    );

    const consents = rows.map(r => ({
      id: r.id,
      client_id: r.client_id,
      client_key: r.client_key,
      client_name: r.client_name,
      client_description: r.client_description,
      logo_uri: r.logo_uri,
      scopes: typeof r.scopes === 'string' ? JSON.parse(r.scopes) : r.scopes,
      granted_at: r.granted_at
    }));

    res.json({ consents });
  } catch (err) {
    console.error('List consents error:', err);
    res.status(500).json({ error: 'server_error', message: '获取已授权应用列表失败' });
  }
});

router.delete('/user/consents/:internalClientId', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM user_consents WHERE user_id = ? AND client_id = ?',
      [req.user.id, req.params.internalClientId]
    );
    log(req.user.id, ACTION.REVOKE_CONSENT, { client_id: req.params.internalClientId }, req);
    res.json({ deleted: result.affectedRows > 0 });
  } catch (err) {
    console.error('Delete consent error:', err);
    res.status(500).json({ error: 'server_error', message: '撤销授权失败' });
  }
});

router.get('/user/activities', authenticate, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const rows = await db.query(
      'SELECT id, action, detail, ip_address, ip_location, user_agent, created_at FROM user_activity_log WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [req.user.id, limit, offset]
    );
    const countResult = await db.query('SELECT COUNT(*) as total FROM user_activity_log WHERE user_id = ?', [req.user.id]);
    const activities = rows.map(r => ({
      id: r.id,
      action: r.action,
      detail: r.detail ? (typeof r.detail === 'string' ? (() => { try { return JSON.parse(r.detail) } catch { return r.detail } })() : r.detail) : null,
      ip_address: r.ip_address,
      ip_location: r.ip_location,
      user_agent: r.user_agent,
      created_at: r.created_at
    }));
    res.json({ activities, total: countResult[0].total });
  } catch (err) {
    console.error('List activities error:', err);
    res.status(500).json({ error: 'server_error', message: '获取活动记录失败' });
  }
});

router.get('/check-available', checkAvailableLimiter, async (req, res) => {
  const { username, email } = req.query;
  const result = {};

  if (username) {
    const existingUser = await User.findByUsername(username);
    result.username_available = !existingUser;
  }

  if (email) {
    const existingUser = await User.findByEmail(email);
    result.email_available = !existingUser;
  }

  res.json(result);
});

router.post('/register', registerLimiter, async (req, res) => {
  try {
    const { username, email, password, confirm_password, display_name, phone, qq, lot_number = '', captcha_output = '', pass_token = '', gen_time = '' } = req.body;

    const errors = [];
    if (!username || username.length < 3) {
      errors.push('用户名至少3个字符');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('邮箱格式不正确');
    }
    if (!password || password.length < 8) {
      errors.push('密码至少8位');
    }
    if (password !== confirm_password) {
      errors.push('两次输入的密码不一致');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: errors.join('; '),
        statusCode: 400
      });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '用户名已被使用',
        statusCode: 400
      });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '邮箱已被使用',
        statusCode: 400
      });
    }

    const geetestResult = await geetestService.validate({
      lot_number, captcha_output, pass_token, gen_time
    });

    if (geetestResult.result !== 'success') {
      return res.status(403).json({
        error: 'geetest_failed',
        message: '行为验证未通过，请重试',
        statusCode: 403
      });
    }

    const registerIp = getClientIp(req);
    const registerIpLocation = await getIpLocation(registerIp);

    const user = await User.create({
      username, email, password, display_name, phone, qq,
      email_verified: false,
      register_ip: registerIp,
      register_ip_location: registerIpLocation
    });

    // 自动加入默认组
    try {
      const defaultGroups = await Group.getDefaultGroups();
      for (const group of defaultGroups) {
        await Group.addUserToGroup(user.id, group.id);
      }
    } catch (groupErr) {
      console.error('Add user to default groups error:', groupErr);
      // 不影响注册流程
    }

    const activationCode = emailService.generateCode();
    await emailService.storeCode(email, activationCode, 'activation');
    await emailService.sendActivationEmail(email, activationCode);

    log(user.id, ACTION.REGISTER, {
      username: user.username,
      email: user.email
    }, req, registerIpLocation);

    res.status(201).json({
      message: '注册成功',
      user_id: user.id,
      email_verified: false,
      need_activation: true
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '注册失败，请稍后再试',
      statusCode: 500
    });
  }
});

router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password, lot_number = '', captcha_output = '', pass_token = '', gen_time = '' } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        error: 'invalid_request',
        message: '用户名和密码不能为空'
      });
    }

    const geetestResult = await geetestService.validate({
      lot_number, captcha_output, pass_token, gen_time
    });

    if (geetestResult.result !== 'success') {
      return res.status(403).json({
        error: 'geetest_failed',
        message: '行为验证未通过，请重试'
      });
    }

    const user = await User.findByEmail(username) || await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        error: 'invalid_grant',
        message: '用户名或密码错误'
      });
    }

    if (!user.enabled) {
      return res.status(403).json({
        error: 'account_disabled',
        message: '账号已被禁用'
      });
    }

    const validPassword = await User.verifyPassword(user, password);
    if (!validPassword) {
      return res.status(401).json({
        error: 'invalid_grant',
        message: '用户名或密码错误'
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'account_not_activated',
        message: '账号尚未激活，请先查收激活邮件'
      });
    }

    const loginIp = getClientIp(req);
    const loginIpLocation = await getIpLocation(loginIp);

    const prevIpLocation = user.last_login_ip_location;
    let securityNotice = null;
    if (prevIpLocation && loginIpLocation && prevIpLocation !== loginIpLocation) {
      securityNotice = {
        message: '本次登录 IP 归属地与上次不同，如非本人操作请及时修改密码',
        previous_location: prevIpLocation,
        current_location: loginIpLocation,
        previous_ip: user.last_login_ip,
        current_ip: loginIp
      };
    }

    await db.query(
      `UPDATE users SET last_login_ip = ?, last_login_ip_location = ?, last_login_at = NOW() WHERE id = ?`,
      [loginIp, loginIpLocation, user.id]
    );

    const tokens = await generateTokens(user);

    const totpRows = await db.query('SELECT enabled FROM user_totp WHERE user_id = ? AND enabled = TRUE', [user.id]);
    if (totpRows.length > 0) {
      const tempToken = generateTempToken(user.id);
      return res.json({
        require_2fa: true,
        temp_token: tempToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          picture: user.picture,
          role: user.role || 'user'
        }
      });
    }

    log(user.id, ACTION.LOGIN, {
      method: 'password',
      security_notice: !!securityNotice
    }, req, loginIpLocation);

    setRefreshTokenCookie(res, tokens.refreshToken);

    res.json({
      access_token: tokens.accessToken,
      token_type: 'Bearer',
      expires_in: config.jwt.expiresIn,
      id_token: tokens.idToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        picture: user.picture,
        role: user.role || 'user',
        qq: user.qq
      },
      ...(securityNotice ? { security_notice: securityNotice } : {})
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'server_error',
      message: '登录失败，请稍后再试'
    });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    const refresh_token = getRefreshTokenFromCookie(req);
    const redisClient = getRedisClient();

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      if (config.session.mode === 'stateful') {
        await redisClient.del(`token:${token}`);
      } else if (config.session.mode === 'stateless' && req.user.jti) {
        await redisClient.set(
          `blacklist:jti:${req.user.jti}`,
          'revoked',
          'PX',
          config.jwt.expiresIn * 1000
        );
      }
    }

    if (refresh_token) {
      const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
      await db.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ? AND user_id = ?',
        [tokenHash, req.user.id]
      );
    }

    clearRefreshTokenCookie(res);
    res.json({ message: '已成功退出登录' });
  } catch (err) {
    console.error('Logout error:', err);
    clearRefreshTokenCookie(res);
    res.json({ message: '已成功退出登录' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refresh_token = getRefreshTokenFromCookie(req);

    if (!refresh_token) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'invalid_request',
        message: '缺少 refresh_token'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

    const tokens = await db.query(
      `SELECT rt.*, u.username, u.email, u.display_name, u.picture, u.role
       FROM refresh_tokens rt
       INNER JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked = FALSE AND rt.used = FALSE AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (tokens.length === 0) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({
        error: 'invalid_grant',
        message: 'refresh_token 无效或已过期'
      });
    }

    const tokenRecord = tokens[0];

    await db.query(
      'UPDATE refresh_tokens SET used = TRUE WHERE id = ?',
      [tokenRecord.id]
    );

    const user = {
      id: tokenRecord.user_id,
      username: tokenRecord.username,
      email: tokenRecord.email,
      display_name: tokenRecord.display_name,
      picture: tokenRecord.picture,
      role: tokenRecord.role
    };

    const newTokens = await generateTokens(user);

    setRefreshTokenCookie(res, newTokens.refreshToken);

    res.json({
      access_token: newTokens.accessToken,
      token_type: 'Bearer',
      expires_in: config.jwt.expiresIn,
      id_token: newTokens.idToken
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({
      error: 'server_error',
      message: '令牌刷新失败'
    });
  }
});

// 生成短期 token_session，用于安全地将 access_token 从 URL 查询参数中移除
router.post('/token-session', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'unauthorized', message: '缺少有效的 Authorization 头部' });
    }

    const accessToken = authHeader.substring(7);
    const sessionToken = crypto.randomBytes(20).toString('hex');

    const redis = getRedisClient();
    await redis.set(`token_session:${sessionToken}`, accessToken, 'EX', 60);

    res.json({ token_session: sessionToken });
  } catch (err) {
    console.error('Token session error:', err);
    res.status(500).json({ error: 'server_error', message: '生成会话令牌失败' });
  }
});

// 会话恢复：通过 HttpOnly cookie 中的 refresh_token 恢复 access_token
router.post('/session', async (req, res) => {
  try {
    const refresh_token = getRefreshTokenFromCookie(req);
    if (!refresh_token) {
      return res.status(401).json({ error: 'unauthenticated', message: '未登录' });
    }

    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
    const rows = await db.query(
      `SELECT rt.*, u.username, u.email, u.display_name, u.picture, u.role
       FROM refresh_tokens rt
       INNER JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked = FALSE AND rt.used = FALSE AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (rows.length === 0) {
      clearRefreshTokenCookie(res);
      return res.status(401).json({ error: 'unauthenticated', message: '会话已过期' });
    }

    const tokenRecord = rows[0];
    await db.query('UPDATE refresh_tokens SET used = TRUE WHERE id = ?', [tokenRecord.id]);

    const user = {
      id: tokenRecord.user_id,
      username: tokenRecord.username,
      email: tokenRecord.email,
      display_name: tokenRecord.display_name,
      picture: tokenRecord.picture,
      role: tokenRecord.role
    };

    const newTokens = await generateTokens(user);
    setRefreshTokenCookie(res, newTokens.refreshToken);

    log(user.id, ACTION.LOGIN, { method: 'session_restore' }, req);

    res.json({
      access_token: newTokens.accessToken,
      token_type: 'Bearer',
      expires_in: config.jwt.expiresIn,
      id_token: newTokens.idToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        display_name: user.display_name,
        picture: user.picture,
        role: tokenRecord.role || 'user'
      }
    });
  } catch (err) {
    console.error('Session restore error:', err);
    res.status(500).json({ error: 'server_error', message: '会话恢复失败' });
  }
});

module.exports = router;