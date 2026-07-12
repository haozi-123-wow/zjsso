const https = require('https');
const { URL } = require('url');
const { SocialProvider } = require('./Provider');
const config = require('../../config');
const { getRedisClient } = require('../../database/redis');

class QQAggregatedProvider extends SocialProvider {
  constructor() {
    super('qq_agg', 'qq_agg');
  }

  isEnabled() {
    const cfg = this.providerConfig;
    return !!(cfg.appId && cfg.baseUrl);
  }

  getAuthorizationUrl(state) {
    const cfg = this.providerConfig;
    const params = new URLSearchParams({
      act: 'login',
      appid: cfg.appId,
      appkey: cfg.appKey,
      type: 'qq',
      redirect_uri: cfg.callbackUrl
    });
    const apiUrl = `${cfg.baseUrl}/connect.php?${params}`;

    console.log(`[QQAgg] Fetching authorization URL from aggregator...`);
    // 调用聚合平台 act=login 接口获取跳转地址
    return this._httpGet(apiUrl).then(data => {
      if (data.code !== 0) {
        throw new Error(`QQ聚合登录错误: ${data.msg || '未知错误'}`);
      }
      console.log(`[QQAgg] Got authorization URL, redirecting to platform`);
      return data.url;
    });
  }

  async getAccessToken(code) {
    // 聚合平台不需要单独的 access_token 步骤，直接在 handleCallback 中一步完成
    throw new Error('QQAggregatedProvider does not use getAccessToken');
  }

  async getUserProfile(accessToken) {
    // 聚合平台不需要单独的 getUserProfile 步骤，直接在 handleCallback 中一步完成
    throw new Error('QQAggregatedProvider does not use getUserProfile');
  }

  async handleCallback(code, state) {
    const redis = getRedisClient();
    const stateData = await redis.get(`oauth:${this.name}:${state}`);
    if (!stateData) {
      console.error(`[QQAgg] State not found or expired, state=${state.substring(0,8)}...`);
      throw new Error('state 无效或已过期');
    }

    const { redirect_uri, bind_user_id } = JSON.parse(stateData);
    console.log(`[QQAgg] State validated, redirect_uri=${redirect_uri}${bind_user_id ? `, bind_user_id=${bind_user_id}` : ''}`);

    console.log(`[QQAgg] Exchanging code for user info from aggregator...`);
    const cfg = this.providerConfig;
    const params = new URLSearchParams({
      act: 'callback',
      appid: cfg.appId,
      appkey: cfg.appKey,
      type: 'qq',
      code
    });
    const apiUrl = `${cfg.baseUrl}/connect.php?${params}`;
    const userData = await this._httpGet(apiUrl);

    if (userData.code !== 0) {
      throw new Error(`QQ聚合登录回调错误: ${userData.msg || '未知错误'}`);
    }

    console.log(`[QQAgg] User info received: social_uid=${userData.social_uid}, nickname=${userData.nickname}`);

    await redis.del(`oauth:${this.name}:${state}`);
    console.log(`[QQAgg] State cleared from Redis`);

    return {
      provider: this.name,
      provider_user_id: userData.social_uid,
      provider_username: userData.nickname,
      provider_email: null,
      provider_email_verified: false,
      provider_avatar: userData.faceimg || null,
      display_name: userData.nickname,
      access_token: userData.access_token || null,
      refresh_token: null,
      redirect_uri,
      bind_user_id: bind_user_id || null
    };
  }

  _httpGet(urlStr) {
    return new Promise((resolve, reject) => {
      const url = new URL(urlStr);
      const req = https.get({
        hostname: url.hostname,
        port: 443,
        path: url.pathname + (url.search || ''),
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

module.exports = new QQAggregatedProvider();
