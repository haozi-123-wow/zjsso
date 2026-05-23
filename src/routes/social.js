const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const githubProvider = require('../services/social/GitHubProvider');
const qqProvider = require('../services/social/QQProvider');
const { storeOAuthState, getAllProviders } = require('../services/social/Provider');
const { authenticate } = require('../middleware/auth');
const { log, ACTION } = require('../services/ActivityLogService');

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
      return res.status(400).json({ error: 'unsupported_provider', message: '不支持的登录方式' });
    }

    const state = crypto.randomBytes(16).toString('hex');
    const redirectUri = req.query.redirect_uri || req.query.redirect_uri;

    await storeOAuthState(provider.name, state, redirectUri);

    const authUrl = provider.getAuthorizationUrl(state, redirectUri);
    res.redirect(authUrl);
  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ error: 'server_error', message: '登录失败' });
  }
});

router.get('/social/:provider/callback', async (req, res) => {
  try {
    const provider = getProvider(req.params.provider);
    if (!provider) {
      return res.status(400).json({ error: 'unsupported_provider', message: '不支持的登录方式' });
    }

    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ error: 'invalid_request', message: '缺少必要参数' });
    }

    const socialData = await provider.handleCallback(code, state);
    const user = await User.findOrCreateSocialUser(socialData);

    if (user) {
      log(user.id, ACTION.BIND_SOCIAL, { provider: socialData.provider, username: socialData.provider_username }, req);
    }

    const redirectUrl = socialData.redirect_uri || '/';
    const finalUrl = new URL(redirectUrl, 'http://localhost');
    res.redirect(finalUrl.toString());
  } catch (err) {
    console.error('Social callback error:', err);
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
