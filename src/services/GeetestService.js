const crypto = require('crypto');
const https = require('https');
const http = require('http');
const { URL } = require('url');
const config = require('../config');

class GeetestService {
  getCaptchaId() {
    return config.geetest.captchaId;
  }

  generateSignToken(lotNumber) {
    const hmac = crypto.createHmac('sha256', config.geetest.captchaKey);
    hmac.update(lotNumber);
    return hmac.digest('hex');
  }

  async validate({ lot_number, captcha_output, pass_token, gen_time } = {}) {
    if (!config.geetest.captchaId || !config.geetest.captchaKey) {
      return { result: 'fail', reason: 'geetest not configured' };
    }

    if (!lot_number || !captcha_output || !pass_token || !gen_time) {
      return { result: 'fail', reason: 'missing geetest parameters' };
    }

    const sign_token = this.generateSignToken(lot_number);
    const apiUrl = `${config.geetest.apiUrl}/validate?captcha_id=${config.geetest.captchaId}`;

    const postData = new URLSearchParams({
      lot_number,
      captcha_output,
      pass_token,
      gen_time,
      sign_token
    }).toString();

    try {
      const result = await this._httpPost(apiUrl, postData);

      if (result && result.status === 'success' && result.result === 'success') {
        return { result: 'success', reason: result.reason || '' };
      }

      return { result: 'fail', reason: (result && result.reason) || 'validation failed' };
    } catch (err) {
      console.error('Geetest request failed:', err.message);
      return { result: 'fail', reason: 'geetest api unreachable' };
    }
  }

  _httpPost(urlStr, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const isHttps = url.protocol === 'https:';
      const transport = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + (url.search || ''),
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(data)
        },
        timeout: 5000
      };

      const req = transport.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(null);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });

      req.write(data);
      req.end();
    });
  }
}

module.exports = new GeetestService();