const https = require('https');
const { URL } = require('url');
const { SocialProvider } = require('./Provider');
const config = require('../../config');

class GitHubProvider extends SocialProvider {
  constructor() {
    super('github', 'github');
  }

  getAuthorizationUrl(state, redirectUri) {
    const params = new URLSearchParams({
      client_id: this.providerConfig.clientId,
      redirect_uri: redirectUri || this.providerConfig.callbackUrl,
      state,
      scope: 'read:user user:email'
    });
    return `https://github.com/login/oauth/authorize?${params}`;
  }

  async getAccessToken(code) {
    const data = new URLSearchParams({
      client_id: this.providerConfig.clientId,
      client_secret: this.providerConfig.clientSecret,
      code
    }).toString();

    const body = await this._httpsRequest('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, data);

    if (body.error) {
      throw new Error(`GitHub token error: ${body.error_description || body.error}`);
    }

    return { access_token: body.access_token, refresh_token: null };
  }

  async getUserProfile(accessToken) {
    const userData = await this._httpsRequest('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'ZJSSO/1.0'
      }
    });

    let email = userData.email;
    if (!email) {
      const emails = await this._httpsRequest('https://api.github.com/user/emails', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'ZJSSO/1.0'
        }
      });
      const primary = Array.isArray(emails) ? emails.find(e => e.primary && e.verified) : null;
      email = primary ? primary.email : null;
    }

    return {
      id: String(userData.id),
      username: userData.login,
      display_name: userData.name || userData.login,
      email: email,
      avatar: userData.avatar_url
    };
  }

  _httpsRequest(urlStr, options, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (url.search || ''),
        method: options.method || 'GET',
        headers: options.headers || {},
        timeout: 10000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve(body); }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      if (data) req.write(data);
      req.end();
    });
  }
}

module.exports = new GitHubProvider();
