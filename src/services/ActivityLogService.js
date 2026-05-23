// @ts-nocheck
const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');
const { getIpLocation, getClientIp } = require('./IpLocationService');

const ACTION = {
  LOGIN: 'login',
  REGISTER: 'register',
  CHANGE_PASSWORD: 'change_password',
  REVOKE_CONSENT: 'revoke_consent',
  REGISTER_PASSKEY: 'register_passkey',
  DELETE_PASSKEY: 'delete_passkey',
  BIND_SOCIAL: 'bind_social',
  UNBIND_SOCIAL: 'unbind_social',
  UPDATE_PROFILE: 'update_profile',
  UPLOAD_AVATAR: 'upload_avatar',
  DELETE_AVATAR: 'delete_avatar',
  RESET_SECRET: 'reset_secret',
  CHANGE_EMAIL: 'change_email',
  ENABLE_2FA: 'enable_2fa',
  DISABLE_2FA: 'disable_2fa',
  ADMIN_CLEAR_2FA: 'admin_clear_2fa'
};

async function log(userId, action, detail = null, req = null, ipLocation = null) {
  if (!userId || !action) return;
  try {
    let location = ipLocation;
    if (!location && req) {
      const ip = getClientIp(req);
      if (ip) {
        location = await getIpLocation(ip);
      }
    }
    await db.query(
      `INSERT INTO user_activity_log (id, user_id, action, detail, ip_address, ip_location, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        userId,
        action,
        detail ? (typeof detail === 'string' ? detail : JSON.stringify(detail)) : null,
        req ? (req.ip || req.connection?.remoteAddress || null) : null,
        location || null,
        req ? (req.headers?.['user-agent'] || null) : null
      ]
    );
  } catch (err) {
    console.error('Activity log error:', err);
  }
}

module.exports = { log, ACTION };
