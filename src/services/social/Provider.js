const { v4: uuidv4 } = require('uuid');
const { getRedisClient } = require('../../database/redis');
const config = require('../../config');

class SocialProvider {
  constructor(name, configKey) {
    this.name = name;
    this.configKey = configKey;
  }

  get providerConfig() {
    return config.social[this.configKey] || {};
  }

  isEnabled() {
    const cfg = this.providerConfig;
    return !!(cfg.clientId || cfg.appId);
  }

  getAuthorizationUrl(state, redirectUri) {
    throw new Error('Must implement getAuthorizationUrl');
  }

  async getAccessToken(code) {
    throw new Error('Must implement getAccessToken');
  }

  async getUserProfile(accessToken) {
    throw new Error('Must implement getUserProfile');
  }

  async handleCallback(code, state) {
    const redis = getRedisClient();
    const stateData = await redis.get(`oauth:${this.name}:${state}`);
    if (!stateData) {
      console.error(`[${this.name}] State not found or expired in Redis, state=${state.substring(0,8)}...`);
      throw new Error('state 无效或已过期');
    }

    const { redirect_uri, bind_user_id } = JSON.parse(stateData);
    console.log(`[${this.name}] State validated, redirect_uri=${redirect_uri}${bind_user_id ? `, bind_user_id=${bind_user_id}` : ''}`);

    console.log(`[${this.name}] Getting access token...`);
    const tokenData = await this.getAccessToken(code);
    console.log(`[${this.name}] Got access token, fetching user profile...`);

    const profile = await this.getUserProfile(tokenData.access_token);
    console.log(`[${this.name}] Profile fetched: id=${profile.id}, username=${profile.username}, email=${profile.email}`);

    await redis.del(`oauth:${this.name}:${state}`);
    console.log(`[${this.name}] State cleared from Redis`);

    return {
      provider: this.name,
      provider_user_id: profile.id,
      provider_username: profile.username,
      provider_email: profile.email,
      provider_avatar: profile.avatar,
      display_name: profile.display_name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      redirect_uri,
      bind_user_id: bind_user_id || null
    };
  }
}

async function storeOAuthState(provider, state, redirectUri, bindUserId) {
  const redis = getRedisClient();
  const data = { redirect_uri: redirectUri };
  if (bindUserId) {
    data.bind_user_id = bindUserId;
  }
  await redis.set(
    `oauth:${provider}:${state}`,
    JSON.stringify(data),
    'PX',
    600000
  );
}

function getAllProviders() {
  const enabledProviders = [];

  const githubConfig = config.social.github;
  if (githubConfig.clientId) {
    enabledProviders.push({
      provider: 'github',
      name: 'GitHub',
      icon: 'github',
      authorization_url: '/api/auth/social/github/login',
      enabled: true
    });
  }

  const qqConfig = config.social.qq;
  if (qqConfig.appId) {
    enabledProviders.push({
      provider: 'qq',
      name: 'QQ',
      icon: 'qq',
      authorization_url: '/api/auth/social/qq/login',
      enabled: true
    });
  }

  return enabledProviders;
}

module.exports = { SocialProvider, storeOAuthState, getAllProviders };
