const crypto = require('crypto');
const config = require('../../config');

class Provider {
  constructor() {
    this.keyPair = null;
    this.kid = null;
    this._initKeys();
  }

  _initKeys() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    this.keyPair = { publicKey, privateKey };
    this.kid = crypto.createHash('sha256').update(publicKey).digest('hex').substring(0, 16);
  }

  getDiscoveryDocument() {
    const issuer = config.app.issuer;
    return {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/oauth/token`,
      userinfo_endpoint: `${issuer}/userinfo`,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      scopes_supported: ['openid', 'profile', 'email', 'phone', 'offline_access'],
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token', 'client_credentials'],
      token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
      claims_supported: ['sub', 'name', 'preferred_username', 'email', 'email_verified', 'picture', 'phone', 'locale', 'qq', 'role'],
      code_challenge_methods_supported: ['S256', 'plain'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256', 'HS256']
    };
  }

  getJWKS() {
    const keyObject = crypto.createPublicKey(this.keyPair.publicKey);
    const jwk = keyObject.export({ format: 'jwk' });
    return {
      keys: [{
        kty: jwk.kty,
        use: 'sig',
        kid: this.kid,
        n: jwk.n,
        e: jwk.e,
        alg: 'RS256'
      }]
    };
  }

  getSigningKey() {
    return {
      privateKey: this.keyPair.privateKey,
      publicKey: this.keyPair.publicKey,
      kid: this.kid
    };
  }
}

module.exports = new Provider();
