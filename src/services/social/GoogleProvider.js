const https = require('https');
const { URL } = require('url');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { SocialProvider } = require('./Provider');
const config = require('../../config');
const cosAvatarService = require('../CosAvatarService');

class GoogleProvider extends SocialProvider {
  constructor() {
    super('google', 'google');
    this.socksConfig = config.socks5 || {};
  }

  _createHttpsAgent() {
    if (this.socksConfig.host) {
      const proxyUrl = this.socksConfig.username
        ? `socks5://${this.socksConfig.username}:${this.socksConfig.password}@${this.socksConfig.host}:${this.socksConfig.port}`
        : `socks5://${this.socksConfig.host}:${this.socksConfig.port}`;
      return new SocksProxyAgent(proxyUrl);
    }
    return new https.Agent({ keepAlive: true });
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.providerConfig.clientId,
      redirect_uri: this.providerConfig.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent'
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  }

  async getAccessToken(code) {
    const params = new URLSearchParams({
      code,
      client_id: this.providerConfig.clientId,
      client_secret: this.providerConfig.clientSecret,
      redirect_uri: this.providerConfig.callbackUrl,
      grant_type: 'authorization_code'
    });

    const body = params.toString();

    const data = await this._httpsRequest('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, body);

    if (data.error) {
      throw new Error(`Google token error: ${data.error_description || data.error}`);
    }

    return { access_token: data.access_token, refresh_token: data.refresh_token || null };
  }

  async getUserProfile(accessToken) {
    console.log('[Google] Fetching user profile from Google userinfo endpoint...');
    const userInfo = await this._httpsRequest(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
          'User-Agent': 'ZJSSO/1.0'
        }
      }
    );

    console.log('[Google] userinfo raw response type:', typeof userInfo);
    if (typeof userInfo === 'object') {
      console.log('[Google] userinfo keys:', Object.keys(userInfo));
      console.log('[Google] sub:', userInfo.sub, 'name:', userInfo.name, 'email:', userInfo.email, 'picture:', userInfo.picture ? 'yes' : 'no');
    }

    if (userInfo.error) {
      throw new Error(`Google userinfo error: ${userInfo.error_description || userInfo.error}`);
    }

    if (!userInfo.email) {
      console.warn('[Google] WARNING: No email returned from Google userinfo. This may indicate the access token lacks the email scope, or the Google account has no email associated.');
    }

    // 将 Google 头像缓存到 COS（如果 COS 已配置），替换为可国内访问的 URL
    let picture = userInfo.picture || null;
    if (picture) {
      const cosUrl = await cosAvatarService.uploadGoogleAvatar(picture, userInfo.sub);
      if (cosUrl !== picture) {
        console.log(`[Google] Avatar cached to COS: ${cosUrl}`);
        picture = cosUrl;
      }
    }

    return {
      id: userInfo.sub,
      username: userInfo.name || userInfo.email || userInfo.sub,
      display_name: userInfo.name || userInfo.email,
      email: userInfo.email || null,
      email_verified: !!userInfo.email_verified,
      avatar: picture
    };
  }

  _httpsRequest(urlStr, options = {}, data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const agent = this._createHttpsAgent();

      const reqOptions = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (url.search || ''),
        method: options.method || 'GET',
        headers: options.headers || {},
        agent,
        timeout: 30000
      };

      const req = https.request(reqOptions, (res) => {
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

module.exports = new GoogleProvider();
