const crypto = require('crypto');
const config = require('../config');

const CSRF_COOKIE_NAME = 'csrf_token';

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function setCsrfCookie(res, token) {
  const maxAge = 86400; // 24 小时
  res.setHeader('Set-Cookie', [
    `${CSRF_COOKIE_NAME}=${token}`,
    'HttpOnly; Secure; SameSite=None',
    `Path=/api/auth`,
    `Max-Age=${maxAge}`,
  ].join('; '));
}

function clearCsrfCookie(res) {
  res.setHeader('Set-Cookie', [
    `${CSRF_COOKIE_NAME}=`,
    'HttpOnly; Secure; SameSite=None',
    `Path=/api/auth`,
    `Max-Age=0`,
  ].join('; '));
}

function getCsrfFromCookie(req) {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const c of header.split(';')) {
    const idx = c.indexOf('=');
    if (idx === -1) continue;
    if (c.slice(0, idx).trim() === CSRF_COOKIE_NAME) {
      return decodeURIComponent(c.slice(idx + 1).trim());
    }
  }
  return null;
}

// CSRF 校验中间件 — 检验 X-CSRF-Token 请求头是否与 csrf_token cookie 一致
function requireCsrfToken(req, res, next) {
  // GET / HEAD / OPTIONS 无需校验
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = getCsrfFromCookie(req);

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    return res.status(403).json({
      error: 'csrf_invalid',
      message: 'CSRF 验证失败'
    });
  }

  next();
}

module.exports = {
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  requireCsrfToken,
  CSRF_COOKIE_NAME
};
