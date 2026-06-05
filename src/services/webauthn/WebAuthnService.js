const crypto = require('crypto');
const db = require('../../database/connection');
const { getRedisClient } = require('../../database/redis');
const config = require('../../config');

function getRPID() {
  return config.webauthn.rpId;
}

function getAllowedOrigins() {
  return config.webauthn.allowedOrigins;
}

function isOriginAllowed(origin) {
  return getAllowedOrigins().includes(origin);
}

function generateChallenge() {
  return crypto.randomBytes(32).toString('base64url');
}

async function storeChallenge(sessionId, challenge) {
  const redis = getRedisClient();
  await redis.set(
    `webauthn:challenge:${sessionId}`,
    challenge,
    'PX',
    300000
  );
}

async function getAndClearChallenge(sessionId) {
  const redis = getRedisClient();
  const challenge = await redis.get(`webauthn:challenge:${sessionId}`);
  if (challenge) {
    await redis.del(`webauthn:challenge:${sessionId}`);
  }
  return challenge;
}

async function generateRegistrationOptions(user) {
  const challenge = generateChallenge();

  const existingCreds = await db.query(
    'SELECT credential_id, transports FROM user_credentials WHERE user_id = ?',
    [user.id]
  );

  const excludeCredentials = existingCreds
    .filter(c => c.credential_id)
    .map(c => ({
      id: c.credential_id,
      type: 'public-key',
      transports: c.transports
        ? (typeof c.transports === 'string' ? JSON.parse(c.transports) : c.transports)
        : []
    }));

  const userIdB64 = Buffer.from(user.id.replace(/-/g, ''), 'hex').toString('base64url');

  await storeChallenge(user.id, challenge);

  return {
    publicKey: {
      challenge,
      rp: { name: config.webauthn.rpName, id: getRPID() },
      user: {
        id: userIdB64,
        name: user.email,
        displayName: user.display_name || user.username
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 }
      ],
      timeout: 60000,
      excludeCredentials,
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      attestation: 'none'
    }
  };
}

function readTextString(buf, offset) {
  const byte = buf[offset];
  const mt = byte >> 5;
  if (mt !== 3) return null;
  let len, skip;
  const val = byte & 0x1f;
  if (val < 24) { len = val; skip = 1; }
  else if (val === 24) { len = buf[offset + 1]; skip = 2; }
  else if (val === 25) { len = buf.readUInt16BE(offset + 1); skip = 3; }
  else if (val === 26) { len = buf.readUInt32BE(offset + 1); skip = 5; }
  else return null;
  return { value: buf.toString('utf-8', offset + skip, offset + skip + len), skip: skip + len };
}

function cborSkipValue(buf, offset) {
  if (offset >= buf.length) return offset;
  const mt = buf[offset] >> 5;
  if (mt === 7) return offset + 1;
  const val = buf[offset] & 0x1f;
  let dataLen = 0;
  let skip;
  if (val < 24) { skip = 1; dataLen = val; }
  else if (val === 24) { skip = 2; dataLen = buf[offset + 1]; }
  else if (val === 25) { skip = 3; dataLen = buf.readUInt16BE(offset + 1); }
  else if (val === 26) { skip = 5; dataLen = buf.readUInt32BE(offset + 1); }
  else return offset + 1;
  if (mt === 2 || mt === 3) return offset + skip + dataLen;
  if (mt === 4 || mt === 5) {
    let pos = offset + skip;
    for (let i = 0; i < dataLen; i++) {
      if (mt === 5) pos = cborSkipValue(buf, pos);
      pos = cborSkipValue(buf, pos);
    }
    return pos;
  }
  return offset + skip + dataLen;
}

function extractAuthDataFromAttestation(attestationBuf) {
  const firstByte = attestationBuf[0];
  if (firstByte >= 0xa0 && firstByte <= 0xbf) {
    const mapLen = firstByte & 0x1f;
    let offset = 1;
    for (let i = 0; i < mapLen && offset < attestationBuf.length; i++) {
      const keyResult = readTextString(attestationBuf, offset);
      if (!keyResult) break;
      offset += keyResult.skip;
      if (keyResult.value === 'authData') {
        const byteResult = readCBORByteString(attestationBuf, offset);
        if (byteResult) return byteResult.value;
        break;
      }
      offset = cborSkipValue(attestationBuf, offset);
    }
  }
  return attestationBuf;
}

async function verifyRegistration(userId, credential) {
  const expectedChallenge = await getAndClearChallenge(userId);
  if (!expectedChallenge) {
    throw new Error('挑战码不存在或已过期，请重新开始');
  }

  const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64url').toString('utf-8');
  let clientData;
  try {
    clientData = JSON.parse(clientDataJSON);
  } catch {
    throw new Error('clientDataJSON 解析失败');
  }

  if (clientData.challenge !== expectedChallenge) {
    throw new Error('挑战码不匹配');
  }

  const clientOrigin = new URL(clientData.origin);
  if (!isOriginAllowed(clientOrigin.origin)) {
    throw new Error(`来源不匹配: ${clientOrigin.origin}`);
  }

  if (clientData.type !== 'webauthn.create') {
    throw new Error(`类型不匹配: ${clientData.type}`);
  }

  const attestationBuf = Buffer.from(credential.response.attestationObject, 'base64url');
  const authData = extractAuthDataFromAttestation(attestationBuf);

  const rpIdHash = authData.subarray(0, 32);
  const expectedRpIdHash = crypto.createHash('sha256').update(getRPID()).digest();
  if (!rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID 哈希不匹配');
  }

  const flags = authData[32];
  if (!(flags & 0x01)) {
    throw new Error('User Present 标志未设置');
  }

  const signCount = authData.readUInt32BE(33);

  const attestedCredData = authData.subarray(37);
  const aaguid = attestedCredData.subarray(0, 16).toString('hex');
  const credIdLen = attestedCredData.readUInt16BE(16);
  const credIdB64 = attestedCredData.subarray(18, 18 + credIdLen).toString('base64url');
  const credentialId = credential.id || credIdB64;
  const coseKeyRaw = attestedCredData.subarray(18 + credIdLen);

  const parsedCoseKey = parseCOSEKey(coseKeyRaw);

  await db.query(
    `INSERT INTO user_credentials (id, user_id, credential_id, credential_public_key, counter, credential_type, transports, aaguid, nickname, device_name)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      credentialId,
      userId,
      credentialId,
      JSON.stringify(parsedCoseKey),
      signCount,
      'public-key',
      JSON.stringify(credential.response.transports || []),
      aaguid,
      credential.nickname || null,
      null
    ]
  );

  return {
    id: credentialId,
    nickname: credential.nickname || null,
    created_at: new Date().toISOString()
  };
}

function parseCOSEKey(buf) {
  const result = { kty: null, alg: null };
  let offset = 0;

  const firstByte = buf[offset];
  if (firstByte >= 0xa0 && firstByte <= 0xbf) {
    const mapLen = firstByte & 0x1f;
    offset++;
    const labels = {
      1: 'kty', 3: 'alg',
      '-1': 'crv', '-2': 'x', '-3': 'y'
    };
    const rsaLabels = {
      1: 'kty', 3: 'alg',
      '-1': 'n', '-2': 'e'
    };
    for (let i = 0; i < mapLen && offset < buf.length; i++) {
      const key = readCBORInt(buf, offset);
      offset += getCBORIntSize(buf, offset);
      const keyStr = String(key);
      if (key === 1) {
        const ktyVal = readCBORInt(buf, offset);
        offset += getCBORIntSize(buf, offset);
        result.kty = ktyVal === 2 ? 'EC2' : ktyVal === 3 ? 'RSA' : String(ktyVal);
        continue;
      }
      if (key === 3) {
        const algVal = readCBORInt(buf, offset);
        offset += getCBORIntSize(buf, offset);
        result.alg = algVal;
        continue;
      }
      if (result.kty === 'RSA') {
        const label = rsaLabels[keyStr];
        if (label) {
          const byteStr = readCBORByteString(buf, offset);
          if (byteStr) {
            offset += byteStr.skip;
            result[label] = byteStr.value.toString('base64url');
          }
        }
      } else {
        const label = labels[keyStr];
        if (label) {
          const byteStr = readCBORByteString(buf, offset);
          if (byteStr) {
            offset += byteStr.skip;
            result[label] = byteStr.value.toString('base64url');
          }
        }
      }
    }
  } else {
    result.kty = 'unknown';
    result.alg = -7;
    result.rawKey = buf.toString('base64url');
  }
  return result;
}

function readCBORByteString(buf, offset) {
  const byte = buf[offset];
  const mt = byte >> 5;
  const val = byte & 0x1f;
  if (mt !== 2) return null;
  let len, skip;
  if (val < 24) { len = val; skip = 1; }
  else if (val === 24) { len = buf[offset + 1]; skip = 2; }
  else if (val === 25) { len = buf.readUInt16BE(offset + 1); skip = 3; }
  else if (val === 26) { len = buf.readUInt32BE(offset + 1); skip = 5; }
  else return null;
  return { value: buf.subarray(offset + skip, offset + skip + len), skip: skip + len };
}

function readCBORInt(buf, offset) {
  const byte = buf[offset];
  const mt = byte >> 5;
  const val = byte & 0x1f;
  if (mt === 0 || mt === 1) {
    if (val < 24) return mt === 1 ? -1 - val : val;
    if (val === 24) return mt === 1 ? -1 - buf[offset + 1] : buf[offset + 1];
    if (val === 25) return mt === 1 ? -1 - buf.readUInt16BE(offset + 1) : buf.readUInt16BE(offset + 1);
    if (val === 26) return mt === 1 ? -1 - buf.readUInt32BE(offset + 1) : buf.readUInt32BE(offset + 1);
  }
  if (mt === 3) return val;
  return val;
}

function getCBORIntSize(buf, offset) {
  const val = buf[offset] & 0x1f;
  if (val < 24) return 1;
  if (val === 24) return 2;
  if (val === 25) return 3;
  if (val === 26) return 5;
  return 1;
}

async function generateAuthenticationOptions(username) {
  let user = null;
  if (username) {
    const users = await db.query(
      'SELECT * FROM users WHERE (username = ? OR email = ?) AND enabled = TRUE',
      [username, username]
    );
    user = users[0] || null;
  }

  const challenge = generateChallenge();
  let allowCredentials = [];

  if (user) {
    await storeChallenge(user.id, challenge);
    const creds = await db.query(
      'SELECT credential_id, transports FROM user_credentials WHERE user_id = ?',
      [user.id]
    );
    allowCredentials = creds
      .filter(c => c.credential_id)
      .map(c => ({
        id: c.credential_id,
        type: 'public-key',
        transports: c.transports
          ? (typeof c.transports === 'string' ? JSON.parse(c.transports) : c.transports)
          : []
      }));
  }

  return {
    publicKey: {
      challenge,
      allowCredentials,
      rpId: getRPID(),
      timeout: 60000,
      userVerification: 'preferred'
    }
  };
}

async function verifyAuthentication(credential) {
  const storedCreds = await db.query(
    'SELECT * FROM user_credentials WHERE credential_id = ?',
    [credential.id]
  );

  if (storedCreds.length === 0) {
    throw new Error('凭证不存在');
  }

  const storedCred = storedCreds[0];

  const clientDataJSON = Buffer.from(credential.response.clientDataJSON, 'base64url').toString('utf-8');
  let clientData;
  try {
    clientData = JSON.parse(clientDataJSON);
  } catch {
    throw new Error('clientDataJSON 解析失败');
  }

  const redis = getRedisClient();
  const expectedChallenge = await redis.get(`webauthn:challenge:${storedCred.user_id}`);
  if (!expectedChallenge) {
    throw new Error('挑战码不存在或已过期，请重新开始');
  }
  if (clientData.challenge !== expectedChallenge) {
    throw new Error('挑战码不匹配');
  }

  const clientOrigin = new URL(clientData.origin);
  if (!isOriginAllowed(clientOrigin.origin)) {
    throw new Error(`来源不匹配: ${clientOrigin.origin}`);
  }

  if (clientData.type !== 'webauthn.get') {
    throw new Error(`类型不匹配: ${clientData.type}`);
  }

  const authData = Buffer.from(credential.response.authenticatorData, 'base64url');
  const rpIdHash = authData.subarray(0, 32);
  const expectedRpIdHash = crypto.createHash('sha256').update(getRPID()).digest();
  if (!rpIdHash.equals(expectedRpIdHash)) {
    throw new Error('RP ID 哈希不匹配');
  }

  const flags = authData[32];
  if (!(flags & 0x01)) {
    throw new Error('User Present 标志未设置');
  }

  const counter = authData.readUInt32BE(33);
  if (counter > 0 && counter <= storedCred.counter) {
    throw new Error('凭证可能被克隆：计数器未递增');
  }

  const signature = Buffer.from(credential.response.signature, 'base64url');
  const signedData = Buffer.concat([
    authData,
    crypto.createHash('sha256').update(clientDataJSON).digest()
  ]);

  let storedKey;
  try {
    storedKey = typeof storedCred.credential_public_key === 'string'
      ? JSON.parse(storedCred.credential_public_key)
      : storedCred.credential_public_key;
  } catch {
    throw new Error('存储的凭证公钥格式异常');
  }

  let valid = false;
  try {
    if (storedKey.kty === 'EC2' || storedKey.alg === -7) {
      const ecKey = crypto.createPublicKey({
        key: {
          kty: 'EC',
          crv: 'P-256',
          x: storedKey.x,
          y: storedKey.y
        },
        format: 'jwk'
      });
      valid = crypto.verify('sha256', signedData, ecKey, signature);
    } else if (storedKey.kty === 'RSA' || storedKey.alg === -257) {
      const rsaKey = crypto.createPublicKey({
        key: {
          kty: 'RSA',
          n: storedKey.n,
          e: storedKey.e
        },
        format: 'jwk'
      });
      valid = crypto.verify('sha256', signedData, rsaKey, signature);
    } else if (storedKey.rawKey) {
      const buf2 = Buffer.from(storedKey.rawKey, 'base64url');
      try {
        const ecKey = crypto.createPublicKey({
          key: {
            kty: 'EC',
            crv: 'P-256',
            x: buf2.subarray(4, 36).toString('base64url'),
            y: buf2.subarray(36).toString('base64url')
          },
          format: 'jwk'
        });
        valid = crypto.verify('sha256', signedData, ecKey, signature);
      } catch {
        throw new Error('无法验证签名：不支持的密钥类型');
      }
    } else {
      throw new Error('不支持的密钥类型');
    }
  } catch (err) {
    if (err.message.includes('无法验证') || err.message.includes('不支持')) throw err;
    throw new Error(`签名验证失败: ${err.message}`);
  }

  if (!valid) {
    throw new Error('签名不匹配');
  }

  await redis.del(`webauthn:challenge:${storedCred.user_id}`);

  await db.query(
    'UPDATE user_credentials SET counter = ?, last_used_at = NOW() WHERE id = ?',
    [counter, storedCred.id]
  );

  const users = await db.query('SELECT * FROM users WHERE id = ? AND enabled = TRUE', [storedCred.user_id]);
  return users[0] || null;
}

async function deleteCredential(userId, credentialId) {
  const result = await db.query(
    'DELETE FROM user_credentials WHERE id = ? AND user_id = ?',
    [credentialId, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  generateRegistrationOptions,
  verifyRegistration,
  generateAuthenticationOptions,
  verifyAuthentication,
  deleteCredential
};
