const express = require('express');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../database/redis');
const db = require('../database/connection');
const config = require('../config');
const authService = require('../services/oidc/AuthorizationService');
const tokenService = require('../services/oidc/TokenService');
const userInfoService = require('../services/oidc/UserInfoService');
const { createRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

const tokenLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 20,
  keyPrefix: 'oauth_token'
});

const authorizeLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 30,
  keyPrefix: 'oauth_authorize'
});

router.get('/authorize', authorizeLimiter, async (req, res) => {
  try {
    const { client_id, redirect_uri, response_type, scope, state, nonce, code_challenge, code_challenge_method, prompt, access_token: queryToken } = req.query;

    if (!client_id || !redirect_uri || !response_type || !scope) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_request', '缺少必要参数', state));
    }

    const client = await authService.getClientByClientId(client_id);
    if (!client) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_client', '客户端不存在或已禁用', state));
    }

    if (!authService.validateRedirectUri(client, redirect_uri)) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_request', 'redirect_uri 不匹配', state));
    }

    if (response_type !== 'code') {
      return res.redirect(createErrorRedirect(redirect_uri, 'unsupported_response_type', '仅支持 response_type=code', state));
    }

    const validScope = authService.validateScope(client, scope);
    if (!validScope) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_scope', 'scope 无效（需要包含 openid）', state));
    }

    if (!state) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_request', '缺少 state 参数（CSRF防护必需）', state));
    }

    const clientNeedsPKCE = client.pkce_required || client.token_endpoint_auth_method === 'none';
    if (clientNeedsPKCE && !code_challenge) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_request', '公开客户端需要 PKCE（缺少 code_challenge）', state));
    }

    if (code_challenge && code_challenge_method && !['S256', 'plain'].includes(code_challenge_method)) {
      return res.redirect(createErrorRedirect(redirect_uri, 'invalid_request', '不支持的 code_challenge_method', state));
    }

    const authHeader = req.headers.authorization;
    const bearerToken = (authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null) || queryToken || null;

    if (!bearerToken) {
      if (prompt === 'none') {
        return res.redirect(createErrorRedirect(redirect_uri, 'login_required', '需要用户登录', state));
      }
      const queryString = req.url.split('?')[1] || '';
      const frontendBase = config.app.frontendUrl || config.app.issuer || 'http://localhost:6873';
      const loginRedirect = encodeURIComponent(`/authorize?${queryString}`);
      const loginUrl = `${frontendBase}/#/login?redirect=${loginRedirect}`;
      return res.redirect(loginUrl);
    }

    let user;
    try {
      if (config.session.mode === 'stateful') {
        const redis = getRedisClient();
        const sessionData = await redis.get(`token:${bearerToken}`);
        if (!sessionData) {
          return res.redirect(createErrorRedirect(redirect_uri, 'login_required', '令牌无效或已过期', state));
        }
        user = JSON.parse(sessionData);
      } else {
        const decoded = jwt.verify(bearerToken, config.jwt.secret);
        const redis = getRedisClient();
        const isBlacklisted = await redis.get(`blacklist:jti:${decoded.jti}`);
        if (isBlacklisted) {
          return res.redirect(createErrorRedirect(redirect_uri, 'login_required', '令牌已被撤销', state));
        }
        user = decoded;
      }
    } catch {
      return res.redirect(createErrorRedirect(redirect_uri, 'login_required', '令牌验证失败', state));
    }

    const fullUser = await db.query('SELECT * FROM users WHERE id = ? AND enabled = TRUE', [user.id || user.sub]);
    if (fullUser.length === 0) {
      return res.redirect(createErrorRedirect(redirect_uri, 'access_denied', '用户不存在或已禁用', state));
    }

    await db.query(
      `INSERT INTO user_consents (id, user_id, client_id, scopes, granted_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE scopes = VALUES(scopes), granted_at = NOW()`,
      [uuidv4(), fullUser[0].id, client.id, JSON.stringify(validScope.split(' '))]
    );

    const code = await authService.createAuthorizationCode(client, fullUser[0], {
      redirect_uri,
      scope: validScope,
      state,
      nonce: nonce || null,
      code_challenge: code_challenge || null,
      code_challenge_method: code_challenge_method || null
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    redirectUrl.searchParams.set('state', state);
    res.redirect(302, redirectUrl.toString());
  } catch (err) {
    console.error('Authorize error:', err);
    const redirectUri = req.query.redirect_uri;
    const state = req.query.state;
    if (redirectUri) {
      return res.redirect(createErrorRedirect(redirectUri, 'server_error', '服务器内部错误', state));
    }
    res.status(500).json({ error: 'server_error', error_description: '服务器内部错误' });
  }
});

router.post('/token', tokenLimiter, async (req, res) => {
  try {
    const { grant_type, code, redirect_uri, code_verifier, refresh_token, scope } = req.body;

    if (!grant_type) {
      return res.status(400).json({ error: 'invalid_request', error_description: '缺少 grant_type' });
    }

    if (grant_type === 'authorization_code') {
      return handleAuthorizationCodeGrant(req, res);
    }

    if (grant_type === 'refresh_token') {
      return handleRefreshTokenGrant(req, res);
    }

    if (grant_type === 'client_credentials') {
      return handleClientCredentialsGrant(req, res);
    }

    res.status(400).json({
      error: 'unsupported_grant_type',
      error_description: `不支持的 grant_type: ${grant_type}`
    });
  } catch (err) {
    console.error('Token endpoint error:', err);
    res.status(500).json({ error: 'server_error', error_description: '服务器内部错误' });
  }
});

async function handleAuthorizationCodeGrant(req, res) {
  const { code, redirect_uri, code_verifier } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'invalid_request', error_description: '缺少 code' });
  }

  const client = await authService.authenticateClient(req);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client', error_description: '客户端认证失败' });
  }

  if (redirect_uri && !authService.validateRedirectUri(client, redirect_uri)) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'redirect_uri 不匹配' });
  }

  const authCodeData = await authService.consumeAuthorizationCode(code, client.id, code_verifier || null);
  if (!authCodeData) {
    return res.status(400).json({ error: 'invalid_grant', error_description: '授权码无效、已过期或已被使用' });
  }

  const users = await db.query('SELECT * FROM users WHERE id = ? AND enabled = TRUE', [authCodeData.userId]);
  if (users.length === 0) {
    return res.status(400).json({ error: 'invalid_grant', error_description: '用户不存在或已禁用' });
  }

  const user = users[0];
  const tokens = await tokenService.issueTokens(client, user, authCodeData.scope, authCodeData.nonce);

  res.json({
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    id_token: tokens.idToken,
    refresh_token: tokens.refreshToken,
    scope: authCodeData.scope
  });
}

async function handleRefreshTokenGrant(req, res) {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'invalid_request', error_description: '缺少 refresh_token' });
  }

  const client = await authService.authenticateClient(req);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client', error_description: '客户端认证失败' });
  }

  const tokens = await tokenService.refreshTokens(refresh_token, client);
  if (!tokens) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'refresh_token 无效或已过期' });
  }

  res.json({
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    id_token: tokens.idToken,
    refresh_token: tokens.refreshToken,
    scope: tokens.scope
  });
}

async function handleClientCredentialsGrant(req, res) {
  const { scope } = req.body;

  const client = await authService.authenticateClient(req);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client', error_description: '客户端认证失败' });
  }

  const grantTypes = typeof client.grant_types === 'string'
    ? JSON.parse(client.grant_types)
    : client.grant_types;
  if (!grantTypes.includes('client_credentials')) {
    return res.status(400).json({
      error: 'unauthorized_client',
      error_description: '客户端未授权使用 client_credentials 模式'
    });
  }

  const tokens = await tokenService.issueClientCredentialsToken(client, scope || '');

  res.json({
    access_token: tokens.accessToken,
    token_type: 'Bearer',
    expires_in: tokens.expiresIn,
    scope: tokens.scope
  });
}

function createErrorRedirect(redirectUri, error, description, state) {
  if (!redirectUri) return null;
  try {
    const url = new URL(redirectUri);
    url.searchParams.set('error', error);
    url.searchParams.set('error_description', description);
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  } catch {
    return `${redirectUri}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(description)}${state ? `&state=${encodeURIComponent(state)}` : ''}`;
  }
}

router.get('/userinfo', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'invalid_token', error_description: '缺少访问令牌' });
    }

    const token = authHeader.substring(7);
    const claims = await userInfoService.getUserInfo(token);
    if (!claims) {
      return res.status(401).json({ error: 'invalid_token', error_description: '令牌无效或已过期' });
    }
    res.json(claims);
  } catch (err) {
    console.error('UserInfo error:', err);
    res.status(500).json({ error: 'server_error', error_description: '服务器内部错误' });
  }
});

module.exports = router;
