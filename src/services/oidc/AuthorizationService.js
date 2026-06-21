const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../../database/connection');
const { getRedisClient } = require('../../database/redis');
const config = require('../../config');

function generateAuthCode() {
  return crypto.randomBytes(32).toString('base64url');
}

function validatePKCE(codeVerifier, codeChallenge, codeChallengeMethod) {
  if (!codeChallenge) return true;
  if (codeChallengeMethod === 'S256') {
    const hash = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    return hash === codeChallenge;
  }
  if (codeChallengeMethod === 'plain') {
    return codeVerifier === codeChallenge;
  }
  return false;
}

async function authenticateClient(req) {
  let clientId, clientSecret;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64 = authHeader.substring(6);
    const decoded = Buffer.from(base64, 'base64').toString('utf-8');
    const colonIndex = decoded.indexOf(':');
    if (colonIndex > 0) {
      clientId = decoded.substring(0, colonIndex);
      clientSecret = decoded.substring(colonIndex + 1);
    }
  } else {
    clientId = req.body.client_id;
    clientSecret = req.body.client_secret;
  }

  if (!clientId) {
    return null;
  }

  const clients = await db.query('SELECT * FROM clients WHERE client_id = ? AND enabled = TRUE', [clientId]);
  if (clients.length === 0) {
    return null;
  }

  const client = clients[0];

  if (client.token_endpoint_auth_method === 'none') {
    return client;
  }

  if (!clientSecret) {
    return null;
  }

  const secretValid = await bcrypt.compare(clientSecret, client.client_secret);
  if (!secretValid) {
    return null;
  }

  return client;
}

async function getClientByClientId(clientId) {
  const clients = await db.query('SELECT * FROM clients WHERE client_id = ? AND enabled = TRUE', [clientId]);
  return clients.length > 0 ? clients[0] : null;
}

function validateRedirectUri(client, redirectUri) {
  const allowedUris = typeof client.redirect_uris === 'string'
    ? JSON.parse(client.redirect_uris)
    : client.redirect_uris;
  return allowedUris.includes(redirectUri);
}

function validateScope(client, scope) {
  const allowedScopes = ['openid', 'profile', 'email', 'phone', 'offline_access'];
  const requested = scope ? scope.split(' ') : [];

  if (!requested.includes('openid')) {
    return null;
  }

  const valid = requested.filter(s => allowedScopes.includes(s));
  return valid.length > 0 ? valid.join(' ') : null;
}

async function createAuthorizationCode(client, user, params) {
  const code = generateAuthCode();
  const expiresAt = new Date(Date.now() + 300 * 1000);

  const codeId = uuidv4();
  await db.query(
    `INSERT INTO authorization_codes (code, client_id, user_id, redirect_uri, scope, state, nonce, code_challenge, code_challenge_method, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      code,
      client.id,
      user.id,
      params.redirect_uri,
      params.scope || null,
      params.state || null,
      params.nonce || null,
      params.code_challenge || null,
      params.code_challenge_method || null,
      expiresAt
    ]
  );

  const redis = getRedisClient();
  await redis.set(
    `auth_code:${code}`,
    JSON.stringify({
      client_id: client.id,
      user_id: user.id,
      scope: params.scope,
      redirect_uri: params.redirect_uri
    }),
    'PX',
    300000
  );

  return code;
}

async function consumeAuthorizationCode(code, clientId, codeVerifier) {
  const codes = await db.query(
    'SELECT * FROM authorization_codes WHERE code = ? AND client_id = ? AND used = FALSE AND expires_at > NOW()',
    [code, clientId]
  );

  if (codes.length === 0) {
    return null;
  }

  const authCode = codes[0];

  if (authCode.code_challenge && codeVerifier) {
    const pkceValid = validatePKCE(codeVerifier, authCode.code_challenge, authCode.code_challenge_method);
    if (!pkceValid) {
      return null;
    }
  } else if (authCode.code_challenge && !codeVerifier) {
    return null;
  }

  const result = await db.query(
    'UPDATE authorization_codes SET used = TRUE WHERE code = ? AND client_id = ? AND used = FALSE AND expires_at > NOW()',
    [code, clientId]
  );

  if (result.affectedRows === 0) {
    return null;
  }

  const redis = getRedisClient();
  await redis.del(`auth_code:${code}`);

  return {
    clientId: authCode.client_id,
    userId: authCode.user_id,
    scope: authCode.scope,
    nonce: authCode.nonce,
    redirectUri: authCode.redirect_uri
  };
}

module.exports = {
  authenticateClient,
  getClientByClientId,
  validateRedirectUri,
  validateScope,
  createAuthorizationCode,
  consumeAuthorizationCode,
  generateAuthCode,
  validatePKCE
};
