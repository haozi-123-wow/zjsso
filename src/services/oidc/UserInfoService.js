const db = require('../../database/connection');
const tokenService = require('./TokenService');

async function getUserInfo(accessToken) {
  const tokenData = await tokenService.validateAccessToken(accessToken);
  if (!tokenData) {
    return null;
  }

  const users = await db.query(
    'SELECT id, username, email, display_name, picture, email_verified, phone, locale, qq, role FROM users WHERE id = ?',
    [tokenData.id]
  );

  if (users.length === 0) {
    return null;
  }

  const user = users[0];
  const scopes = (tokenData.scopes || '').split(' ');

  const claims = {
    sub: user.id
  };

  if (scopes.includes('profile')) {
    claims.name = user.display_name || user.username;
    claims.preferred_username = user.username;
    claims.picture = user.picture;
    claims.locale = user.locale || 'zh-CN';
    claims.qq = user.qq;
    claims.role = user.role;
  }

  if (scopes.includes('email')) {
    claims.email = user.email;
    claims.email_verified = !!user.email_verified;
  }

  if (scopes.includes('phone')) {
    claims.phone = user.phone;
  }

  return claims;
}

module.exports = { getUserInfo };
