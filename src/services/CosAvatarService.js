const https = require('https');
const { URL } = require('url');
const COS = require('cos-nodejs-sdk-v5');
const { SocksProxyAgent } = require('socks-proxy-agent');
const config = require('../config');

class CosAvatarService {
  constructor() {
    this.cosConfig = config.cos;
    this.socksConfig = config.socks5 || {};
  }

  _createHttpsAgent() {
    if (this.socksConfig.host) {
      const proxyUrl = this.socksConfig.username
        ? `socks5h://${this.socksConfig.username}:${this.socksConfig.password}@${this.socksConfig.host}:${this.socksConfig.port}`
        : `socks5h://${this.socksConfig.host}:${this.socksConfig.port}`;
      return new SocksProxyAgent(proxyUrl);
    }
    return null;
  }

  getCosUrl(key) {
    if (this.cosConfig.customDomain) {
      return `${this.cosConfig.customDomain}/${key}`;
    }
    return `https://${this.cosConfig.bucket}.cos.${this.cosConfig.region}.myqcloud.com/${key}`;
  }

  /**
   * 从 Google 下载头像并缓存到 COS
   * @param {string} googleAvatarUrl - Google 头像 URL
   * @param {string} providerUserId - Google 用户 sub ID
   * @returns {Promise<string>} COS 头像 URL，失败时返回原 Google URL
   */
  async uploadGoogleAvatar(googleAvatarUrl, providerUserId) {
    if (!this.cosConfig.secretId || !googleAvatarUrl) {
      return googleAvatarUrl;
    }

    try {
      console.log(`[CosAvatar] Downloading Google avatar for user ${providerUserId}...`);
      const imageBuffer = await this._downloadImage(googleAvatarUrl);

      const key = `avatars/google/${providerUserId}.jpg`;
      const cosClient = new COS({
        SecretId: this.cosConfig.secretId,
        SecretKey: this.cosConfig.secretKey
      });

      console.log(`[CosAvatar] Uploading to COS: ${key} (${(imageBuffer.length / 1024).toFixed(1)}KB)...`);
      await cosClient.putObject({
        Bucket: this.cosConfig.bucket,
        Region: this.cosConfig.region,
        Key: key,
        Body: imageBuffer,
        Headers: {
          'Cache-Control': 'public, max-age=31536000',
          'Content-Type': 'image/jpeg'
        }
      });

      const cosUrl = this.getCosUrl(key);
      console.log(`[CosAvatar] Google avatar cached to COS: ${cosUrl}`);
      return cosUrl;
    } catch (err) {
      console.error(`[CosAvatar] Failed to cache Google avatar: ${err.message}`);
      return googleAvatarUrl;
    }
  }

  /**
   * 从 GitHub 下载头像并缓存到 COS
   * @param {string} githubAvatarUrl - GitHub 头像 URL
   * @param {string} providerUserId - GitHub 用户 ID
   * @returns {Promise<string>} COS 头像 URL，失败时返回原 GitHub URL
   */
  async uploadGithubAvatar(githubAvatarUrl, providerUserId) {
    if (!this.cosConfig.secretId || !githubAvatarUrl) {
      return githubAvatarUrl;
    }

    try {
      console.log(`[CosAvatar] Downloading GitHub avatar for user ${providerUserId}...`);
      const imageBuffer = await this._downloadImage(githubAvatarUrl);

      const key = `avatars/github/${providerUserId}.jpg`;
      const cosClient = new COS({
        SecretId: this.cosConfig.secretId,
        SecretKey: this.cosConfig.secretKey
      });

      console.log(`[CosAvatar] Uploading to COS: ${key} (${(imageBuffer.length / 1024).toFixed(1)}KB)...`);
      await cosClient.putObject({
        Bucket: this.cosConfig.bucket,
        Region: this.cosConfig.region,
        Key: key,
        Body: imageBuffer,
        Headers: {
          'Cache-Control': 'public, max-age=31536000',
          'Content-Type': 'image/jpeg'
        }
      });

      const cosUrl = this.getCosUrl(key);
      console.log(`[CosAvatar] GitHub avatar cached to COS: ${cosUrl}`);
      return cosUrl;
    } catch (err) {
      console.error(`[CosAvatar] Failed to cache GitHub avatar: ${err.message}`);
      return githubAvatarUrl;
    }
  }

  _downloadImage(url) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const agent = this._createHttpsAgent();

      const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + (parsedUrl.search || ''),
        method: 'GET',
        headers: { 'User-Agent': 'ZJSSO/1.0' },
        timeout: 30000
      };

      if (agent) {
        options.agent = agent;
      }

      const chunks = [];
      const req = https.get(options, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed with status ${res.statusCode}`));
          return;
        }
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')); });
    });
  }
}

module.exports = new CosAvatarService();
