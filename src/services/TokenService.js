const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const db = require('../database/connection');
const config = require('../config');
const { getRedisClient } = require('../database/redis');

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
    role: user.role || 'user',
    groups: user.groups || [],
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

  if (config.session.mode === 'stateful') {
    const redisClient = getRedisClient();
    await redisClient.set(
      `token:${accessToken}`,
      JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        groups: user.groups || [],
        scopes: 'openid profile email',
        jti
      }),
      'PX',
      config.session.expiresIn * 1000
    );
  }

  const refreshId = uuidv4();
  await db.query(
    `INSERT INTO refresh_tokens (id, token_hash, client_id, user_id, scopes, expires_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [refreshId, refreshTokenHash, null, user.id, 'openid profile email', refreshExpiresAt]
  );

  return { accessToken, idToken, refreshToken };
}

module.exports = { generateTokens };
