const https = require('https');
const config = require('../config');

async function getIpLocation(ip) {
  if (!ip) return null;

  if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '本地';
  }

  if (!config.ipApi.id || !config.ipApi.key) {
    return null;
  }

  return new Promise((resolve) => {
    const params = `?id=${config.ipApi.id}&key=${config.ipApi.key}&ip=${ip}&td=0`;
    const options = {
      hostname: 'cn.apihz.cn',
      port: 443,
      path: '/api/ip/chaapi.php' + params,
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => { data += chunk; });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.code === 200 && result.data) {
            const location = formatLocation(result.data);
            resolve(location);
          } else if (result.msg && result.msg !== '查询失败') {
            resolve(result.msg.replace(/-/g, ' '));
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => resolve(null));
    req.on('timeout', () => { req.destroy(); resolve(null); });

    req.end();
  });
}

function formatLocation(data) {
  const parts = [];
  if (data.country) parts.push(data.country);
  if (data.province) parts.push(data.province);
  if (data.city) parts.push(data.city);
  if (data.isp) parts.push(data.isp);
  return parts.length > 0 ? parts.join(' ') : null;
}

function getClientIp(req) {
  // 优先取 X-Forwarded-For 最左侧的客户端真实 IP
  const xff = req.headers['x-forwarded-for'];
  if (xff) {
    const ips = xff.split(',').map(s => s.trim()).filter(Boolean);
    if (ips.length > 0) return ips[0];
  }
  // 兜底：直连 IP
  return req.ip || req.connection?.remoteAddress || null;
}

function getForwardedFor(req) {
  return req.headers['x-forwarded-for'] || null;
}

module.exports = { getIpLocation, getClientIp, getForwardedFor };