const { getRedisClient } = require('../database/redis');
const { getClientIp } = require('../services/IpLocationService');

function createRateLimiter({ windowSeconds, maxRequests, keyPrefix }) {
  return async (req, res, next) => {
    try {
      const client = getRedisClient();
      const ip = getClientIp(req) || 'unknown';
      const key = `ratelimit:${keyPrefix}:${ip}:${Math.floor(Date.now() / (windowSeconds * 1000))}`;

      const current = await client.incr(key);

      if (current === 1) {
        await client.pexpire(key, windowSeconds * 1000);
      }

      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

      if (current > maxRequests) {
        return res.status(429).json({
          error: 'too_many_requests',
          message: '请求过于频繁，请稍后再试',
          statusCode: 429
        });
      }

      next();
    } catch (err) {
      console.error('Rate limiter error:', err);
      next();
    }
  };
}

function createEmailRateLimiter() {
  return async (req, res, next) => {
    try {
      const client = getRedisClient();
      const ip = getClientIp(req) || 'unknown';
      const email = req.body.email;

      const ipWindow = Math.floor(Date.now() / 3600000);
      const ipKey = `ratelimit:email_ip:${ip}:${ipWindow}`;
      const ipCurrent = await client.incr(ipKey);
      if (ipCurrent === 1) {
        await client.pexpire(ipKey, 3600000);
      }

      if (ipCurrent > 5) {
        return res.status(429).json({
          error: 'too_many_requests',
          message: '该IP发送邮件过于频繁，请稍后再试',
          statusCode: 429
        });
      }

      if (email) {
        const addrWindow = Math.floor(Date.now() / 86400000);
        const addrKey = `ratelimit:email_addr:${email}:${addrWindow}`;
        const addrCurrent = await client.incr(addrKey);
        if (addrCurrent === 1) {
          await client.pexpire(addrKey, 86400000);
        }

        if (addrCurrent > 3) {
          return res.status(429).json({
            error: 'too_many_requests',
            message: '该邮箱已接收过多邮件，请24小时后再试',
            statusCode: 429
          });
        }
      }

      next();
    } catch (err) {
      console.error('Email rate limiter error:', err);
      next();
    }
  };
}

module.exports = { createRateLimiter, createEmailRateLimiter };