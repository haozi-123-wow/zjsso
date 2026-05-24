const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const githubProvider = require('../services/social/GitHubProvider');
const qqProvider = require('../services/social/QQProvider');
const { storeOAuthState, getAllProviders } = require('../services/social/Provider');
const { authenticate } = require('../middleware/auth');
const { log, ACTION } = require('../services/ActivityLogService');
const { generateTokens } = require('../services/TokenService');
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
    const redirectUrl = `${frontendBase}/#/callback?access_token=${encodeURIComponent(tokens.accessToken)}&refresh_token=${encodeURIComponent(tokens.refreshToken)}&id_token=${encodeURIComponent(tokens.idToken)}&expires_in=${config.jwt.expiresIn}&user=${encodeURIComponent(JSON.stringify(userData))}`;
    console.log(`[Social] Redirecting to frontend callback with tokens`);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error(`[Social] ${req.params.provider} callback error:`, err.message);
    res.status(401).json({ error: 'social_login_failed', message: err.message || '第三方登录失败' });
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
