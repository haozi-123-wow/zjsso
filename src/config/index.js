require('dotenv').config();

module.exports = {
  app: {
    port: parseInt(process.env.APP_PORT) || 3000,
    host: process.env.APP_HOST || 'localhost',
    issuer: process.env.ISSUER || 'http://localhost:3000'
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'zjsso'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret',
    expiresIn: parseInt(process.env.JWT_EXPIRES_IN) || 3600,
    refreshExpiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || 604800
  },
  session: {
    mode: process.env.SESSION_MODE || 'stateless',
    secret: process.env.SESSION_SECRET || 'default-session-secret',
    expiresIn: parseInt(process.env.SESSION_EXPIRES_IN) || 86400
  },
  geetest: {
    captchaId: process.env.GEETEST_CAPTCHA_ID || '',
    captchaKey: process.env.GEETEST_CAPTCHA_KEY || '',
    apiUrl: process.env.GEETEST_API_URL || 'http://gcaptcha4.geetest.com'
  },
  email: {
    accessKeyId: process.env.ALIYUN_DM_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.ALIYUN_DM_ACCESS_KEY_SECRET || '',
    accountName: process.env.ALIYUN_DM_ACCOUNT_NAME || '',
    fromAlias: process.env.ALIYUN_DM_FROM_ALIAS || '',
    region: process.env.ALIYUN_DM_REGION || 'cn-hangzhou'
  },
  ipApi: {
    id: process.env.IP_API_ID || '',
    key: process.env.IP_API_KEY || ''
  },
  rateLimit: {
    registerPerIp: { window: 3600, max: 3 },
    emailSendPerIp: { window: 3600, max: 5 },
    emailSendPerAddr: { window: 86400, max: 3 },
    loginPerIp: { window: 900, max: 10 },
    apiGeneral: { window: 60, max: 100 }
  }
};
