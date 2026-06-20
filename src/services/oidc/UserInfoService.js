const db = require('../../database/connection');
const tokenService = require('./TokenService');

async function getUserInfo(accessToken) {
  const tokenData = await tokenService.validateAccessToken(accessToken);
  if (!tokenData) {
    return null;
  }

  const users = await db.query(
    `SELECT u.id, u.username, u.email, u.display_name, u.picture, u.email_verified, u.phone, u.locale, u.qq, u.role,
            COALESCE(
              JSON_ARRAYAGG(
                JSON_OBJECT('id', g.id, 'name', g.name)
              ),
              JSON_ARRAY()
            ) as groups
     FROM users u
     LEFT JOIN user_groups ug ON ug.user_id = u.id
     LEFT JOIN \`groups\` g ON g.id = ug.group_id
     WHERE u.id = ?
     GROUP BY u.id`,
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
    claims.groups = user.groups;
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
