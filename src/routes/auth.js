const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { getRedisClient } = require('../database/redis');
const config = require('../config');
const User = require('../models/User');
const geetestService = require('../services/GeetestService');
const emailService = require('../services/EmailService');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { authenticate } = require('../middleware/auth');
const { getIpLocation, getClientIp } = require('../services/IpLocationService');

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

async function generateTokens(user) {
  const jti = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  const accessTokenPayload = {
    iss: config.app.issuer,
    sub: user.id,
    aud: 'zjsso',
    jti,
    iat: now,
    exp: now + config.jwt.expiresIn,
    preferred_username: user.username,
    email: user.email,
    scope: 'openid profile email'
  };

  const accessToken = jwt.sign(accessTokenPayload, config.jwt.secret, { algorithm: 'HS256' });

  const idTokenPayload = {
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
    locale: user.locale || 'zh-CN',
    qq: user.qq
  };

  const idToken = jwt.sign(idTokenPayload, config.jwt.secret, { algorithm: 'HS256' });

  const refreshToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const refreshExpiresAt = new Date((now + config.jwt.refreshExpiresIn) * 1000);

  const refreshId = uuidv4();
  await db.query(
    `INSERT INTO refresh_tokens (id, token_hash, client_id, user_id, scopes, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [refreshId, refreshTokenHash, 'zjsso', user.id, 'openid profile email', refreshExpiresAt]
  );

  return { accessToken, idToken, refreshToken };
}

router.get('/check-available', async (req, res) => {
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

    const activationCode = emailService.generateCode();
    await emailService.storeCode(email, activationCode, 'activation');
    await emailService.sendActivationEmail(email, activationCode);

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

    res.json({
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
        picture: user.picture
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
    const { refresh_token } = req.body;
    const redisClient = getRedisClient();

    if (config.session.mode === 'stateless' && req.user.jti) {
      await redisClient.set(
        `blacklist:jti:${req.user.jti}`,
        'revoked',
        'PX',
        config.jwt.expiresIn * 1000
      );
    }

    if (refresh_token) {
      const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
      await db.query(
        'UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = ? AND user_id = ?',
        [tokenHash, req.user.id]
      );
    }

    res.json({ message: '已成功退出登录' });
  } catch (err) {
    console.error('Logout error:', err);
    res.json({ message: '已成功退出登录' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        error: 'invalid_request',
        message: '缺少 refresh_token'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');

    const tokens = await db.query(
      `SELECT rt.*, u.username, u.email, u.display_name, u.picture
       FROM refresh_tokens rt
       INNER JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = ? AND rt.revoked = FALSE AND rt.used = FALSE AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (tokens.length === 0) {
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
      picture: tokenRecord.picture
    };

    const newTokens = await generateTokens(user);

    res.json({
      access_token: newTokens.accessToken,
      token_type: 'Bearer',
      expires_in: config.jwt.expiresIn,
      refresh_token: newTokens.refreshToken,
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

module.exports = router;