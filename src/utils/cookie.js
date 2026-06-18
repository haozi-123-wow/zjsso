const config = require('../config');

const REFRESH_COOKIE_NAME = 'refresh_token';

// SameSite=None; Secure 确保跨源 fetch 请求能携带 cookie
// Chrome 将 localhost 视为安全上下文，HTTP 下 Secure 标志也有效
// 生产环境使用 HTTPS 同样满足 Secure 要求
const COOKIE_FLAGS = 'HttpOnly; Secure; SameSite=None';

function setRefreshTokenCookie(res, token) {
  const refreshExpiresMs = config.jwt.refreshExpiresIn * 1000;
  res.setHeader('Set-Cookie', [
    `${REFRESH_COOKIE_NAME}=${encodeURIComponent(token)}`,
    COOKIE_FLAGS,
    `Path=/api/auth`,
    `Max-Age=${Math.floor(refreshExpiresMs / 1000)}`,
  ].join('; '));
}

function clearRefreshTokenCookie(res) {
  res.setHeader('Set-Cookie', [
    `${REFRESH_COOKIE_NAME}=`,
    COOKIE_FLAGS,
    `Path=/api/auth`,
    `Max-Age=0`,
  ].join('; '));
}

function parseCookies(req) {
  const cookies = {};
  const header = req.headers.cookie;
  if (!header) return cookies;
  header.split(';').forEach((c) => {
    const idx = c.indexOf('=');
    if (idx === -1) return;
    const name = c.slice(0, idx).trim();
    const value = decodeURIComponent(c.slice(idx + 1).trim());
    cookies[name] = value;
  });
  return cookies;
}

function getRefreshTokenFromCookie(req) {
  return parseCookies(req)[REFRESH_COOKIE_NAME] || null;
}

module.exports = {
  REFRESH_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
  getRefreshTokenFromCookie,
};
