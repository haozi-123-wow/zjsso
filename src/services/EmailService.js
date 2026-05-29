const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { getRedisClient } = require('../database/redis');

class EmailService {
  async sendActivationEmail(email, code) {
    const activationLink = `${config.app.frontendUrl}/#/verify-activation?code=${code}&email=${encodeURIComponent(email)}`;

    const htmlBody = this._buildActivationHtml(activationLink, code);
    const subject = '请激活您的账号 - ZJSSO 单点登录系统';

    return this._sendEmail(email, subject, htmlBody);
  }

  async sendResetPasswordEmail(email, code) {
    const resetLink = `${config.app.frontendUrl}/#/reset-password?code=${code}&email=${encodeURIComponent(email)}`;

    const htmlBody = this._buildResetPasswordHtml(resetLink, code);
    const subject = '重置您的密码 - ZJSSO 单点登录系统';

    return this._sendEmail(email, subject, htmlBody);
  }

  async sendVerificationEmail(email, code) {
    const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#E63946,#c62a35);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">ZJSSO 单点登录系统</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">安全验证</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:16px;color:#333;margin:0 0 20px;">您好！</p>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 24px;">
              您正在进行敏感操作，请输入以下验证码完成验证：
            </p>
            <div style="text-align:center;margin:0 auto 32px;padding:24px;background:#f8f8f8;border-radius:8px;">
              <div style="font-size:36px;letter-spacing:8px;font-weight:700;color:#E63946;font-family:monospace;">${code}</div>
            </div>
            <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">
              此验证码有效期为 <strong>10 分钟</strong>，请勿泄露给他人。<br>
              如果您没有进行此操作，请忽略此邮件。
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:12px;color:#999;margin:0;">此邮件由系统自动发送，请勿回复</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
    const subject = '安全验证 - ZJSSO 单点登录系统';
    return this._sendEmail(email, subject, htmlBody);
  }

  async storeCode(email, code, type, ttlSeconds = 3600) {
    const client = getRedisClient();
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    await client.set(
      `email:code:${email}`,
      JSON.stringify({ codeHash, type, expires_at: Math.floor(Date.now() / 1000) + ttlSeconds }),
      'PX',
      ttlSeconds * 1000
    );
  }

  async verifyCode(email, code, type) {
    const client = getRedisClient();
    const data = await client.get(`email:code:${email}`);

    if (!data) {
      return { valid: false, reason: '验证码不存在或已过期' };
    }

    try {
      const parsed = JSON.parse(data);
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');
      if (parsed.codeHash !== codeHash) {
        return { valid: false, reason: '验证码不正确' };
      }
      if (parsed.type !== type) {
        return { valid: false, reason: '验证码类型不匹配' };
      }
      if (parsed.expires_at < Math.floor(Date.now() / 1000)) {
        return { valid: false, reason: '验证码已过期' };
      }

      await client.del(`email:code:${email}`);
      return { valid: true };
    } catch {
      return { valid: false, reason: '验证码数据异常' };
    }
  }

  _buildActivationHtml(link, code) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#E63946,#c62a35);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">ZJSSO 单点登录系统</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">账号激活邮件</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:16px;color:#333;margin:0 0 20px;">您好！</p>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 24px;">
              感谢您注册 ZJSSO 单点登录系统。请点击下方按钮激活您的账号：
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#E63946,#c62a35);border-radius:6px;padding:0;">
                  <a href="${link}" target="_blank" style="display:inline-block;padding:14px 48px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;">立即激活账号</a>
                </td>
              </tr>
            </table>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 16px;">
              如果按钮无法点击，请将以下链接复制到浏览器地址栏访问：
            </p>
            <p style="font-size:12px;color:#999;background-color:#f8f8f8;padding:12px;border-radius:4px;word-break:break-all;margin:0 0 16px;">
              ${link}
            </p>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 16px;">
              您的验证码为：<strong style="color:#E63946;font-size:20px;letter-spacing:4px;">${code}</strong>
            </p>
            <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">
              此链接和验证码有效期为 <strong>1 小时</strong>，请尽快完成激活。<br>
              如果您没有注册 ZJSSO 系统，请忽略此邮件。
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:12px;color:#999;margin:0;">此邮件由系统自动发送，请勿回复</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  _buildResetPasswordHtml(link, code) {
    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:20px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#E63946,#c62a35);padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">ZJSSO 单点登录系统</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">密码重置邮件</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="font-size:16px;color:#333;margin:0 0 20px;">您好！</p>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 24px;">
              您收到了此邮件，说明您（或他人）正在尝试重置 ZJSSO 账号的登录密码。请点击下方按钮完成重置：
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
              <tr>
                <td align="center" style="background:linear-gradient(135deg,#E63946,#c62a35);border-radius:6px;padding:0;">
                  <a href="${link}" target="_blank" style="display:inline-block;padding:14px 48px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:500;">重置密码</a>
                </td>
              </tr>
            </table>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 16px;">
              如果按钮无法点击，请将以下链接复制到浏览器地址栏访问：
            </p>
            <p style="font-size:12px;color:#999;background-color:#f8f8f8;padding:12px;border-radius:4px;word-break:break-all;margin:0 0 16px;">
              ${link}
            </p>
            <p style="font-size:14px;color:#666;line-height:1.8;margin:0 0 16px;">
              您的重置验证码为：<strong style="color:#E63946;font-size:20px;letter-spacing:4px;">${code}</strong>
            </p>
            <p style="font-size:12px;color:#999;line-height:1.6;margin:0;">
              此链接和验证码有效期为 <strong>1 小时</strong>。<br>
              如果您没有请求重置密码，请忽略此邮件，您的账号安全无虞。
            </p>
          </td>
        </tr>
        <tr>
          <td style="background-color:#f8f8f8;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="font-size:12px;color:#999;margin:0;">此邮件由系统自动发送，请勿回复</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }

  async _sendEmail(toAddress, subject, htmlBody) {
    if (!config.email.accessKeyId || !config.email.accessKeySecret || !config.email.accountName) {
      console.warn('Email service not configured, skipping email send');
      console.log(`[Email Mock] To: ${toAddress}, Subject: ${subject}`);
      return { success: true, mock: true };
    }

    const params = {
      Action: 'SingleSendMail',
      Format: 'JSON',
      Version: '2015-11-23',
      AccessKeyId: config.email.accessKeyId,
      SignatureMethod: 'HMAC-SHA1',
      SignatureNonce: uuidv4().replace(/-/g, ''),
      SignatureVersion: '1.0',
      Timestamp: new Date().toISOString().replace(/\.\d{3}/, ''),
      RegionId: config.email.region,
      AccountName: config.email.accountName,
      AddressType: 1,
      ReplyToAddress: true,
      ToAddress: toAddress,
      Subject: subject,
      HtmlBody: htmlBody
    };

    if (config.email.fromAlias) {
      params.FromAlias = config.email.fromAlias;
    }

    const canonicalizedQuery = this._canonicalize(params);
    const stringToSign = `GET&${this._percentEncode('/')}&${this._percentEncode(canonicalizedQuery)}`;
    const signature = crypto.createHmac('sha1', `${config.email.accessKeySecret}&`)
      .update(stringToSign)
      .digest('base64');

    const queryString = `${canonicalizedQuery}&Signature=${encodeURIComponent(signature)}`;
    const requestUrl = `https://dm.aliyuncs.com/?${queryString}`;

    try {
      const result = await this._httpGet(requestUrl);
      if (result && result.EnvId) {
        return { success: true, requestId: result.RequestId, envId: result.EnvId };
      }
      console.error('Failed to send email:', result);
      return { success: false, error: result };
    } catch (err) {
      console.error('Email send error:', err.message);
      return { success: false, error: err.message };
    }
  }

  _percentEncode(str) {
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
  }

  _canonicalize(params) {
    const keys = Object.keys(params).sort();
    return keys
      .map(key => `${this._percentEncode(key)}=${this._percentEncode(params[key])}`)
      .join('&');
  }

  _httpGet(urlStr) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (url.search || ''),
        method: 'GET',
        timeout: 10000,
        headers: { 'Accept': 'application/json' }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch {
            resolve(body);
          }
        });
      });

      req.on('error', (err) => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      req.end();
    });
  }

  generateCode() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[crypto.randomInt(0, 36)];
    }
    return code;
  }
}

module.exports = new EmailService();