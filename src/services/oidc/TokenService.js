const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../../database/connection');
const { getRedisClient } = require('../../database/redis');
const config = require('../../config');
const provider = require('./Provider');

function generateAccessToken(user, client, scope) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = client.access_token_expires_in || config.jwt.expiresIn;

  const payload = {
    iss: config.app.issuer,
    sub: user.id,
    aud: client.client_id,
    jti: uuidv4(),
    iat: now,
    exp: now + expiresIn,
    preferred_username: user.username,
    email: user.email,
    role: user.role || 'user',
    groups: user.groups || [],
    scope: scope || 'openid'
  };

  return {
    token: jwt.sign(payload, config.jwt.secret, { algorithm: 'HS256' }),
    expiresIn,
    jti: payload.jti
  };
}

function generateIdToken(user, client, nonce, accessToken) {
  const now = Math.floor(Date.now() / 1000);
  const signingKey = provider.getSigningKey();
  const expiresIn = client.access_token_expires_in || config.jwt.expiresIn;

  const atHash = crypto.createHash('sha256').update(accessToken).digest().subarray(0, 16);
  const atHashBase64 = atHash.toString('base64url');

  const payload = {
    iss: config.app.issuer,
    sub: user.id,
    aud: client.client_id,
    exp: now + expiresIn,
    iat: now,
    auth_time: now
  };

  if (nonce) {
    payload.nonce = nonce;
  }

  if (accessToken) {
    payload.at_hash = atHashBase64;
  }

  return jwt.sign(payload, signingKey.privateKey, {
    algorithm: 'RS256',
    keyid: signingKey.kid
  });
}

async function issueTokens(client, user, scope, nonce) {
  const { token: accessToken, expiresIn, jti } = generateAccessToken(user, client, scope);
  const idToken = generateIdToken(user, client, nonce, accessToken);

  const refreshToken = uuidv4().replace(/-/g, '') + uuidv4().replace(/-/g, '');
  const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const refreshExpiresIn = client.refresh_token_expires_in || config.jwt.refreshExpiresIn;
  const refreshExpiresAt = new Date(Date.now() + refreshExpiresIn * 1000);

  const accessTokenId = uuidv4();
  const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
  const accessExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.query(
    `INSERT INTO access_tokens (id, token_hash, client_id, user_id, scopes, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [accessTokenId, accessTokenHash, client.id, user.id, scope || null, accessExpiresAt]
  );

  const refreshId = uuidv4();
  await db.query(
    `INSERT INTO refresh_tokens (id, token_hash, client_id, user_id, scopes, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [refreshId, refreshTokenHash, client.id, user.id, scope || null, refreshExpiresAt]
  );

  if (config.session.mode === 'stateful') {
    const redis = getRedisClient();
    await redis.set(
      `token:${accessToken}`,
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        groups: user.groups || [],
        scopes: scope || 'openid',
        jti
      }),
      'PX',
      expiresIn * 1000
    );
  }

  return { accessToken, idToken, refreshToken, expiresIn };
}

async function refreshTokens(refreshToken, client) {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

  const result = await db.query(
    `UPDATE refresh_tokens SET used = TRUE
     WHERE token_hash = ? AND used = FALSE AND revoked = FALSE AND expires_at > NOW()`,
    [tokenHash]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const tokens = await db.query(
    `SELECT rt.*, u.id as user_id, u.username, u.email, u.display_name, u.picture, u.role
     FROM refresh_tokens rt
     INNER JOIN users u ON u.id = rt.user_id
     WHERE rt.token_hash = ?`,
    [tokenHash]
  );

  const tokenRecord = tokens[0];

  if (client && tokenRecord.client_id !== client.id) {
    return null;
  }

  const user = {
    id: tokenRecord.user_id,
    username: tokenRecord.username,
    email: tokenRecord.email,
    role: tokenRecord.role || 'user'
  };

  return await issueTokens(client, user, tokenRecord.scopes, null);
}

async function issueClientCredentialsToken(client, scope) {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = client.access_token_expires_in || config.jwt.expiresIn;

  const payload = {
    iss: config.app.issuer,
    sub: client.client_id,
    aud: client.client_id,
    jti: uuidv4(),
    iat: now,
    exp: now + expiresIn,
    client_id: client.client_id,
    scope: scope || ''
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, { algorithm: 'HS256' });

  const accessTokenId = uuidv4();
  const accessTokenHash = crypto.createHash('sha256').update(accessToken).digest('hex');
  const accessExpiresAt = new Date(Date.now() + expiresIn * 1000);

  await db.query(
    `INSERT INTO access_tokens (id, token_hash, client_id, user_id, scopes, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [accessTokenId, accessTokenHash, client.id, null, scope || null, accessExpiresAt]
  );

  return { accessToken, expiresIn, scope };
}

async function validateAccessToken(token) {
  if (config.session.mode === 'stateful') {
    const redis = getRedisClient();
    const sessionData = await redis.get(`token:${token}`);
    if (!sessionData) return null;
    return JSON.parse(sessionData);
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);

    const redis = getRedisClient();
    const isBlacklisted = await redis.get(`blacklist:jti:${decoded.jti}`);
    if (isBlacklisted) return null;

    return {
      id: decoded.sub,
      username: decoded.preferred_username,
      email: decoded.email,
      role: decoded.role || 'user',
      groups: decoded.groups || [],
      scopes: decoded.scope,
      jti: decoded.jti,
      clientId: decoded.aud
    };
  } catch {
    return null;
  }
}

module.exports = {
  issueTokens,
  refreshTokens,
  issueClientCredentialsToken,
  validateAccessToken,
  generateAccessToken,
  generateIdToken
};
