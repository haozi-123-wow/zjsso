const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');
const { SocialProvider } = require('./Provider');
const config = require('../../config');

class QQProvider extends SocialProvider {
  constructor() {
    super('qq', 'qq');
  }

  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.providerConfig.appId,
      redirect_uri: this.providerConfig.callbackUrl,
      state,
      scope: 'get_user_info'
    });
    return `https://graph.qq.com/oauth2.0/authorize?${params}`;
  }

  async getAccessToken(code) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.providerConfig.appId,
      client_secret: this.providerConfig.appKey,
      code,
      redirect_uri: this.providerConfig.callbackUrl,
      fmt: 'json'
    });

    const tokenData = await this._httpsRequest(`https://graph.qq.com/oauth2.0/token?${params}`);

    if (tokenData.error) {
      throw new Error(`QQ token error: ${tokenData.error_description || tokenData.error}`);
    }

    return { access_token: tokenData.access_token, refresh_token: tokenData.refresh_token };
  }

  async getUserProfile(accessToken) {
    const openIdData = await this._httpsRequest(
      `https://graph.qq.com/oauth2.0/me?access_token=${accessToken}&fmt=json`
    );

    if (openIdData.error) {
      throw new Error(`QQ OpenID error: ${openIdData.error_description}`);
    }

    const openid = openIdData.openid;

    const params = new URLSearchParams({
      access_token: accessToken,
      oauth_consumer_key: this.providerConfig.appId,
      openid
    });

    const userInfo = await this._httpsRequest(
      `https://graph.qq.com/user/get_user_info?${params}`
    );

    if (userInfo.ret !== 0) {
      throw new Error(`QQ user info error: ${userInfo.msg}`);
    }

    return {
      id: openid,
      username: userInfo.nickname,
      display_name: userInfo.nickname,
      email: null,
      avatar: userInfo.figureurl_qq_2 || userInfo.figureurl_qq_1 || userInfo.figureurl
    };
  }

  _httpsRequest(urlStr) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (url.search || ''),
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        timeout: 30000
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
      req.end();
    });
  }
}

module.exports = new QQProvider();
