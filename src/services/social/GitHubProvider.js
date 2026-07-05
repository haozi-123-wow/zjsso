const https = require('https');
const { URL } = require('url');
const { SocksProxyAgent } = require('socks-proxy-agent');
const { SocialProvider } = require('./Provider');
const config = require('../../config');
const cosAvatarService = require('../CosAvatarService');

class GitHubProvider extends SocialProvider {
  constructor() {
    super('github', 'github');
    this.socksConfig = config.socks5 || {};
  }

  _createHttpsAgent() {
    if (this.socksConfig.host) {
      const proxyUrl = this.socksConfig.username
        ? `socks5://${this.socksConfig.username}:${this.socksConfig.password}@${this.socksConfig.host}:${this.socksConfig.port}`
        : `socks5://${this.socksConfig.host}:${this.socksConfig.port}`;
      console.log(`[GitHub] Using SOCKS5 proxy: ${this.socksConfig.host}:${this.socksConfig.port}`);
      return new SocksProxyAgent(proxyUrl);
    }
    return new https.Agent({ keepAlive: true });
  }

  getAuthorizationUrl(state) {
    const url = `https://github.com/login/oauth/authorize?${new URLSearchParams({
      client_id: this.providerConfig.clientId,
      redirect_uri: this.providerConfig.callbackUrl,
      state,
      scope: 'read:user user:email'
    })}`;
    console.log(`[GitHub] Authorization URL generated, redirecting to GitHub, state=${state.substring(0,8)}...`);
    return url;
  }

  async getAccessToken(code) {
    console.log(`[GitHub] Exchanging code for access token...`);
    const data = new URLSearchParams({
      client_id: this.providerConfig.clientId,
      client_secret: this.providerConfig.clientSecret,
      code
    }).toString();

    const start = Date.now();
    const body = await this._httpsRequest('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, data);
    console.log(`[GitHub] Access token received in ${Date.now() - start}ms${body.access_token ? ', has access_token' : ', NO access_token'}`);

    if (body.error) {
      console.error(`[GitHub] Token error: ${body.error_description || body.error}`);
      throw new Error(`GitHub token error: ${body.error_description || body.error}`);
    }

    return { access_token: body.access_token, refresh_token: null };
  }

  async getUserProfile(accessToken) {
    console.log(`[GitHub] Fetching user profile from GitHub API...`);
    const profileStart = Date.now();
    const userData = await this._httpsRequest('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'ZJSSO/1.0'
      }
    });
    console.log(`[GitHub] User profile received in ${Date.now() - profileStart}ms`);

    console.log(`[GitHub] userinfo raw response type:`, typeof userData);
    if (typeof userData === 'object') {
      console.log(`[GitHub] userinfo keys:`, Object.keys(userData));
      console.log(`[GitHub] id: ${userData.id}, login: ${userData.login}, name: ${userData.name || '(null)'}, email: ${userData.email || '(null in public profile)'}, avatar_url: ${userData.avatar_url ? 'yes' : 'no'}`);
    }

    // 始终通过 /user/emails 获取已验证的邮箱，不直接信任公开资料中的 email
    let email = null;
    let emailVerified = false;

    console.log(`[GitHub] Fetching emails list to verify ownership...`);
    const emailStart = Date.now();
    const emails = await this._httpsRequest('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'User-Agent': 'ZJSSO/1.0'
      }
    });
    console.log(`[GitHub] Emails received in ${Date.now() - emailStart}ms, count=${Array.isArray(emails) ? emails.length : 'invalid'}`);

    if (Array.isArray(emails)) {
      // 优先使用已验证的主邮箱
      const primaryVerified = emails.find(e => e.primary && e.verified);
      if (primaryVerified) {
        email = primaryVerified.email;
        emailVerified = true;
        console.log(`[GitHub] Using primary verified email: ${email}`);
      } else {
        // 其次使用任意已验证的邮箱
        const anyVerified = emails.find(e => e.verified);
        if (anyVerified) {
          email = anyVerified.email;
          emailVerified = true;
          console.log(`[GitHub] Using verified email (non-primary): ${email}`);
        }
      }
    }
    console.log(`[GitHub] Verified email: ${email || 'none'}`);

    if (!email) {
      console.warn(`[GitHub] WARNING: No verified email found for user ${userData.login}. The GitHub account may have no public email or verified email.`);
    }

    // 将 GitHub 头像缓存到 COS（如果 COS 已配置），替换为可国内访问的 URL
    let picture = userData.avatar_url || null;
    if (picture) {
      console.log(`[GitHub] Avatar source: ${picture}`);
      const cosUrl = await cosAvatarService.uploadGithubAvatar(picture, String(userData.id));
      if (cosUrl !== picture) {
        console.log(`[GitHub] Avatar cached to COS: ${cosUrl}`);
        picture = cosUrl;
      }
    }

    return {
      id: String(userData.id),
      username: userData.login,
      display_name: userData.name || userData.login,
      email: email,
      email_verified: emailVerified,
      avatar: picture
    };
  }

  _httpsRequest(urlStr, options, data) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const agent = this._createHttpsAgent();
      console.log(`[GitHub] HTTP ${options.method || 'GET'} ${url.hostname}${url.pathname}${url.search || ''}`);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (url.search || ''),
        method: options.method || 'GET',
        headers: options.headers || {},
        agent,
        timeout: 30000
      }, (res) => {
        let body = '';
        console.log(`[GitHub] Response status: ${res.statusCode}`);
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { resolve(body); }
        });
      });

      req.on('error', (err) => {
        console.error(`[GitHub] Request error: ${err.message}`);
        reject(err);
      });
      req.on('timeout', () => {
        console.error(`[GitHub] Request timeout after 30000ms`);
        req.destroy();
        reject(new Error('Request timeout'));
      });
      if (data) req.write(data);
      req.end();
    });
  }
}

module.exports = new GitHubProvider();
