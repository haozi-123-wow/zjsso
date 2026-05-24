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
      throw new Error('state 无效或已过期');
    }

    const { redirect_uri } = JSON.parse(stateData);

    const tokenData = await this.getAccessToken(code);
    const profile = await this.getUserProfile(tokenData.access_token);

    await redis.del(`oauth:${this.name}:${state}`);

    return {
      provider: this.name,
      provider_user_id: profile.id,
      provider_username: profile.username,
      provider_email: profile.email,
      provider_avatar: profile.avatar,
      display_name: profile.display_name,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      redirect_uri
    };
  }
}

async function storeOAuthState(provider, state, redirectUri) {
  const redis = getRedisClient();
  await redis.set(
    `oauth:${provider}:${state}`,
    JSON.stringify({ redirect_uri: redirectUri }),
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
