const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const User = require('../models/User');
const githubProvider = require('../services/social/GitHubProvider');
const qqProvider = require('../services/social/QQProvider');
const { storeOAuthState, getAllProviders } = require('../services/social/Provider');
const { authenticate } = require('../middleware/auth');
const { log, ACTION } = require('../services/ActivityLogService');
const { generateTokens } = require('../services/TokenService');
const { getRedisClient } = require('../database/redis');
const config = require('../config');

const router = express.Router();

function getProvider(providerName) {
  const map = { github: githubProvider, qq: qqProvider };
  return map[providerName] || null;
}

router.get('/social/providers', (req, res) => {
  res.json({ providers: getAllProviders() });
});

router.get('/social/:provider/login', async (req, res) => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider || !provider.isEnabled()) {
      console.log(`[Social] ${req.params.provider} login attempted but provider not enabled`);
      return res.status(400).json({ error: 'unsupported_provider', message: '不支持的登录方式' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = req.query.redirect_uri || '/';
    console.log(`[Social] ${req.params.provider} login initiated, state=${state.substring(0,8)}..., redirect_uri=${redirectUri}`);

    await storeOAuthState(provider.name, state, redirectUri);

    const authUrl = provider.getAuthorizationUrl(state);
    console.log(`[Social] Redirecting to ${req.params.provider} authorization page`);
    res.redirect(authUrl);
  } catch (err) {
    console.error('[Social] login error:', err);
    res.status(500).json({ error: 'server_error', message: '登录失败' });
  }
});

router.get('/social/:provider/bind', authenticate, async (req, res) => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider || !provider.isEnabled()) {
      return res.status(400).json({ error: 'unsupported_provider', message: '不支持的登录方式' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = config.app.frontendUrl || config.app.issuer || 'http://localhost:6873';
    console.log(`[Social] ${req.params.provider} bind initiated for user ${req.user.id}, state=${state.substring(0,8)}...`);

    await storeOAuthState(provider.name, state, redirectUri, req.user.id);

    const authUrl = provider.getAuthorizationUrl(state);
    console.log(`[Social] Redirecting to ${req.params.provider} for binding`);
    res.json({ redirect_url: authUrl });
  } catch (err) {
    console.error('[Social] bind error:', err);
    res.status(500).json({ error: 'server_error', message: '绑定失败' });
  }
});

router.get('/social/:provider/callback', async (req, res) => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider) {
      console.log(`[Social] Callback for unknown provider: ${req.params.provider}`);
      return res.status(400).json({ error: 'unsupported_provider', message: '不支持的登录方式' });
    }

    const { code, state } = req.query;
    console.log(`[Social] ${req.params.provider} callback received, state=${state ? state.substring(0,8)+'...' : 'missing'}, has_code=${!!code}`);

    if (!code || !state) {
      console.error(`[Social] Missing required params: code=${!!code}, state=${!!state}`);
      return res.status(400).json({ error: 'invalid_request', message: '缺少必要参数' });
    }

    const socialData = await provider.handleCallback(code, state);
    console.log(`[Social] ${req.params.provider} handleCallback succeeded, provider_user_id=${socialData.provider_user_id}, username=${socialData.provider_username}`);

    if (socialData.bind_user_id) {
      const existingConn = await db.query(
        'SELECT user_id FROM social_connections WHERE provider = ? AND provider_user_id = ?',
        [socialData.provider, socialData.provider_user_id]
      );
      if (existingConn.length > 0 && existingConn[0].user_id !== socialData.bind_user_id) {
        console.error(`[Social] Conflict: ${req.params.provider} account already bound to user ${existingConn[0].user_id}`);
        const frontendBase = config.app.frontendUrl || 'http://localhost:6873';
        return res.redirect(`${frontendBase}/?bind_error=${encodeURIComponent(`该${req.params.provider === 'github' ? 'GitHub' : 'QQ'}账号已被其他用户绑定，请先解绑后再操作`)}#/profile`);
      }

      if (existingConn.length > 0 && existingConn[0].user_id === socialData.bind_user_id) {
        console.log(`[Social] ${req.params.provider} already bound to this user`);
        const frontendBase = config.app.frontendUrl || 'http://localhost:6873';
        return res.redirect(`${frontendBase}/?bind_error=该账号已绑定#/profile`);
      }

      await db.query(
        `INSERT INTO social_connections (id, user_id, provider, provider_user_id, provider_username, provider_email, provider_avatar, access_token, refresh_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), socialData.bind_user_id, socialData.provider, socialData.provider_user_id,
         socialData.provider_username, socialData.provider_email, socialData.provider_avatar,
         socialData.access_token, socialData.refresh_token]
      );

      log(socialData.bind_user_id, ACTION.BIND_SOCIAL, { provider: socialData.provider, username: socialData.provider_username }, req);
      console.log(`[Social] ${req.params.provider} bound to user ${socialData.bind_user_id}`);
      const frontendBase = config.app.frontendUrl || 'http://localhost:6873';
      return res.redirect(`${frontendBase}/?bind_success=1#/profile`);
    }

    console.log(`[Social] Looking up or creating user for ${req.params.provider} account...`);
    const user = await User.findOrCreateSocialUser(socialData);
    console.log(`[Social] ${user ? `User found/created: id=${user.id}, username=${user.username}` : 'User not found/created'}`);

    if (!user) {
      console.error(`[Social] Failed to find or create user for ${req.params.provider}`);
      return res.status(500).json({ error: 'server_error', message: '用户创建失败' });
    }

    log(user.id, ACTION.BIND_SOCIAL, { provider: socialData.provider, username: socialData.provider_username }, req);

    const tokens = await generateTokens(user);
    console.log(`[Social] Tokens generated for user ${user.username}`);

    const frontendBase = config.app.frontendUrl || config.app.issuer || 'http://localhost:6873';
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      picture: user.picture,
      role: user.role || 'user'
    };

    const exchangeCode = crypto.randomBytes(16).toString('hex');
    const redis = getRedisClient();
    await redis.set(
      `social:code:${exchangeCode}`,
      JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        idToken: tokens.idToken,
        expiresIn: config.jwt.expiresIn,
        user: userData
      }),
      'PX',
      60000
    );

    const redirectUrl = `${frontendBase}/?code=${exchangeCode}#/callback`;
    console.log(`[Social] Redirecting to frontend callback with auth code`);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error(`[Social] ${req.params.provider} callback error:`, err.message);
    res.status(401).json({ error: 'social_login_failed', message: err.message || '第三方登录失败' });
  }
});

router.post('/social/callback/exchange', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少 code' });
    }

    const redis = getRedisClient();
    const stored = await redis.get(`social:code:${code}`);
    if (!stored) {
      return res.status(400).json({ error: 'invalid_grant', message: 'code 无效或已过期' });
    }

    await redis.del(`social:code:${code}`);

    const tokenData = JSON.parse(stored);
    res.json({
      access_token: tokenData.accessToken,
      refresh_token: tokenData.refreshToken,
      id_token: tokenData.idToken,
      expires_in: tokenData.expiresIn,
      user: tokenData.user
    });
  } catch (err) {
    console.error('[Social] Code exchange error:', err);
    res.status(500).json({ error: 'server_error', message: '令牌交换失败' });
  }
});

router.get('/user/social/connections', authenticate, async (req, res) => {
  try {
    const connections = await User.getSocialConnections(req.user.id);
    res.json({ connections });
  } catch (err) {
    console.error('Get social connections error:', err);
    res.status(500).json({ error: 'server_error', message: '获取失败' });
  }
});

router.delete('/user/social/connections/:connectionId', authenticate, async (req, res) => {
  try {
    const conns = await User.getSocialConnections(req.user.id);
    const conn = conns.find(c => c.id === req.params.connectionId);
    await User.removeSocialConnection(req.user.id, req.params.connectionId);
    if (conn) {
      log(req.user.id, ACTION.UNBIND_SOCIAL, { provider: conn.provider, username: conn.provider_username }, req);
    }
    res.status(204).end();
  } catch (err) {
    console.error('Remove social connection error:', err);
    res.status(500).json({ error: 'server_error', message: '解绑失败' });
  }
});

module.exports = router;
