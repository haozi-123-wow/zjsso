const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const User = require('../models/User');
const githubProvider = require('../services/social/GitHubProvider');
const qqProvider = require('../services/social/QQProvider');
const googleProvider = require('../services/social/GoogleProvider');
const { storeOAuthState, getAllProviders } = require('../services/social/Provider');
const { authenticate } = require('../middleware/auth');
const { log, ACTION } = require('../services/ActivityLogService');
const { generateTokens } = require('../services/TokenService');
const { getRedisClient } = require('../database/redis');
const config = require('../config');
const { setRefreshTokenCookie } = require('../utils/cookie');

const router = express.Router();

function getProvider(providerName) {
  const map = { github: githubProvider, qq: qqProvider, google: googleProvider };
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
  const frontendBase = config.app.frontendUrl || config.app.issuer || 'http://localhost:6873';

  // Google 等 OAuth 提供商在用户拒绝授权时会返回 error 参数
  if (req.query.error) {
    console.error(`[Social] ${req.params.provider} callback received error: ${req.query.error}`);
    // 尝试从 state 中获取 bind_user_id 来判断是绑定还是登录
    try {
      const redis = getRedisClient();
      const stateData = await redis.get(`oauth:${req.params.provider}:${req.query.state}`);
      if (stateData) {
        const { bind_user_id } = JSON.parse(stateData);
        await redis.del(`oauth:${req.params.provider}:${req.query.state}`);
        if (bind_user_id) {
          return res.redirect(`${frontendBase}/?bind_error=${encodeURIComponent('用户取消了授权')}#/profile`);
        }
      }
    } catch (e) {
      console.error('[Social] Error reading state on OAuth error:', e.message);
    }
    return res.redirect(`${frontendBase}/?login_error=${encodeURIComponent('第三方登录失败：' + req.query.error)}#/login`);
  }

  try {
    const provider = getProvider(req.params.provider);
    if (!provider) {
      console.log(`[Social] Callback for unknown provider: ${req.params.provider}`);
      return res.redirect(`${frontendBase}/?login_error=${encodeURIComponent('不支持的登录方式')}#/login`);
    }

    const { code, state } = req.query;
    console.log(`[Social] ${req.params.provider} callback received, state=${state ? state.substring(0,8)+'...' : 'missing'}, has_code=${!!code}`);

    if (!code || !state) {
      console.error(`[Social] Missing required params: code=${!!code}, state=${!!state}`);
      return res.redirect(`${frontendBase}/?login_error=${encodeURIComponent('缺少必要参数')}#/login`);
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
        const providerLabel = socialData.provider === 'github' ? 'GitHub' : socialData.provider === 'google' ? 'Google' : socialData.provider === 'qq' ? 'QQ' : socialData.provider;
        return res.redirect(`${frontendBase}/?bind_error=${encodeURIComponent(`该${providerLabel}账号已被其他用户绑定，请先解绑后再操作`)}#/profile`);
      }

      if (existingConn.length > 0 && existingConn[0].user_id === socialData.bind_user_id) {
        console.log(`[Social] ${req.params.provider} already bound to this user`);
        return res.redirect(`${frontendBase}/?bind_error=该账号已绑定#/profile`);
      }

      await db.query(
        `INSERT INTO social_connections (id, user_id, provider, provider_user_id, provider_username, provider_email, provider_avatar, access_token, refresh_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), socialData.bind_user_id, socialData.provider, socialData.provider_user_id,
         socialData.provider_username, socialData.provider_email, socialData.provider_avatar,
         socialData.access_token, socialData.refresh_token]
      );

      // 绑定成功后条件性更新用户的头像和邮箱（仅当用户尚未设置时）
      if (['google', 'github'].includes(socialData.provider)) {
        const userRows = await db.query(
          'SELECT picture, email FROM users WHERE id = ?',
          [socialData.bind_user_id]
        );
        if (userRows.length > 0) {
          const userRecord = userRows[0];
          const userUpdates = [];
          const userUpdateValues = [];

          if (!userRecord.picture && socialData.provider_avatar) {
            userUpdates.push('picture = ?');
            userUpdateValues.push(socialData.provider_avatar);
          }

          if (!userRecord.email && socialData.provider_email) {
            userUpdates.push('email = ?');
            userUpdateValues.push(socialData.provider_email);
            userUpdates.push('email_verified = ?');
            userUpdateValues.push(true);
          }

          if (userUpdates.length > 0) {
            userUpdateValues.push(socialData.bind_user_id);
            await db.query(
              `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
              userUpdateValues
            );
          }
        }
      }

      log(socialData.bind_user_id, ACTION.BIND_SOCIAL, { provider: socialData.provider, username: socialData.provider_username }, req);
      console.log(`[Social] ${req.params.provider} bound to user ${socialData.bind_user_id}`);

      // 绑定成功后生成兑换码，让前端通过 #/callback 恢复会话（不依赖 cookie）
      const bindUserRows = await db.query('SELECT * FROM users WHERE id = ?', [socialData.bind_user_id]);
      if (bindUserRows.length === 0) {
        return res.redirect(`${frontendBase}/?bind_error=${encodeURIComponent('用户不存在')}#/login`);
      }
      const bindUser = bindUserRows[0];
      const bindTokens = await generateTokens(bindUser);
      const bindExchangeCode = crypto.randomBytes(16).toString('hex');
      const bindRedis = getRedisClient();
      await bindRedis.set(
        `social:code:${bindExchangeCode}`,
        JSON.stringify({
          accessToken: bindTokens.accessToken,
          refreshToken: bindTokens.refreshToken,
          idToken: bindTokens.idToken,
          expiresIn: config.jwt.expiresIn,
          user: {
            id: bindUser.id,
            username: bindUser.username,
            email: bindUser.email,
            display_name: bindUser.display_name,
            picture: bindUser.picture,
            role: bindUser.role || 'user'
          }
        }),
        'PX',
        60000
      );

      return res.redirect(`${frontendBase}/?bind_success=1&code=${bindExchangeCode}#/callback`);
    }

    console.log(`[Social] Looking up or creating user for ${req.params.provider} account...`);
    const user = await User.findOrCreateSocialUser(socialData);
    console.log(`[Social] ${user ? `User found/created: id=${user.id}, username=${user.username}` : 'User not found/created'}`);

    if (!user) {
      console.error(`[Social] Failed to find or create user for ${req.params.provider}`);
      return res.redirect(`${frontendBase}/?login_error=${encodeURIComponent('用户创建失败')}#/login`);
    }

    // 登录时，如果社交提供商返回了更好的数据，更新已有用户的邮箱和头像
    // 仅当用户当前邮箱为空或为占位邮箱（@social.local）时更新
    const needsEmailUpdate = socialData.provider_email &&
      (!user.email || user.email.endsWith('@social.local'));
    const needsPictureUpdate = socialData.provider_avatar && !user.picture;

    if (needsEmailUpdate || needsPictureUpdate) {
      const userUpdates = [];
      const userUpdateValues = [];

      if (needsEmailUpdate) {
        userUpdates.push('email = ?');
        userUpdateValues.push(socialData.provider_email);
        userUpdates.push('email_verified = ?');
        userUpdateValues.push(socialData.provider_email_verified ? 1 : 0);
        console.log(`[Social] Updating user ${user.id} email from "${user.email}" to "${socialData.provider_email}"`);
      }

      if (needsPictureUpdate) {
        userUpdates.push('picture = ?');
        userUpdateValues.push(socialData.provider_avatar);
        console.log(`[Social] Updating user ${user.id} picture from "${user.picture}" to "${socialData.provider_avatar}"`);
      }

      if (userUpdates.length > 0) {
        userUpdateValues.push(user.id);
        await db.query(
          `UPDATE users SET ${userUpdates.join(', ')} WHERE id = ?`,
          userUpdateValues
        );
        // 重新读取最新用户数据
        user.email = needsEmailUpdate ? socialData.provider_email : user.email;
        user.picture = needsPictureUpdate ? socialData.provider_avatar : user.picture;
      }
    }

    log(user.id, ACTION.BIND_SOCIAL, { provider: socialData.provider, username: socialData.provider_username }, req);

    const tokens = await generateTokens(user);
    console.log(`[Social] Tokens generated for user ${user.username}`);

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
    // 判断是绑定还是登录流程，重定向到对应页面
    // 由于 state 可能在 handleCallback 中被清理，无法可靠判断，
    // 统一重定向到前端，由前端根据用户登录状态自行处理
    res.redirect(`${frontendBase}/?login_error=${encodeURIComponent(err.message || '第三方登录失败')}#/login`);
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

    setRefreshTokenCookie(res, tokenData.refreshToken);

    res.json({
      access_token: tokenData.accessToken,
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
