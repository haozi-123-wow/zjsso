const jwt = require('jsonwebtoken');
const config = require('../config');
const { getRedisClient } = require('../database/redis');

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'unauthorized',
      message: '缺少访问令牌',
      statusCode: 401
    });
  }

  const token = authHeader.substring(7);

  try {
    if (config.session.mode === 'stateful') {
      const redisClient = getRedisClient();
      const sessionData = await redisClient.get(`token:${token}`);
      if (!sessionData) {
        return res.status(401).json({
          error: 'invalid_token',
          message: '令牌无效或已过期',
          statusCode: 401
        });
      }
      req.user = JSON.parse(sessionData);
    } else {
      const decoded = jwt.verify(token, config.jwt.secret);

      const redisClient = getRedisClient();
      const isBlacklisted = await redisClient.get(`blacklist:jti:${decoded.jti}`);
      if (isBlacklisted) {
        return res.status(401).json({
          error: 'invalid_token',
          message: '令牌已被撤销',
          statusCode: 401
        });
      }

      req.user = {
        id: decoded.sub,
        username: decoded.preferred_username,
        email: decoded.email,
        role: decoded.role || 'user',
        scopes: decoded.scope,
        jti: decoded.jti
      };
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'token_expired',
        message: '访问令牌已过期',
        statusCode: 401
      });
    }

    return res.status(401).json({
      error: 'invalid_token',
      message: '令牌无效',
      statusCode: 401
    });
  }
}

module.exports = { authenticate };