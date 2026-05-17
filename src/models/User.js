const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');

class User {
  static async findById(id) {
    const rows = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const rows = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findByUsername(username) {
    const rows = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  }

  static async findOrCreateSocialUser(socialData) {
    const rows = await db.query(
      `SELECT u.* FROM users u
       INNER JOIN social_connections sc ON sc.user_id = u.id
       WHERE sc.provider = ? AND sc.provider_user_id = ?`,
      [socialData.provider, socialData.provider_user_id]
    );

    if (rows[0]) return rows[0];

    const existingUser = socialData.email ? await this.findByEmail(socialData.email) : null;

    if (existingUser) {
      await db.query(
        `INSERT INTO social_connections (id, user_id, provider, provider_user_id, provider_username, provider_email, provider_avatar, access_token, refresh_token)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), existingUser.id, socialData.provider, socialData.provider_user_id,
         socialData.provider_username, socialData.provider_email, socialData.provider_avatar,
         socialData.access_token, socialData.refresh_token]
      );
      return existingUser;
    }

    const userId = uuidv4();
    const username = `${socialData.provider}_${socialData.provider_user_id.slice(0, 8)}`;

    await db.query(
      `INSERT INTO users (id, username, email, display_name, picture, email_verified, enabled, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, username, socialData.email || `${username}@social.local`,
       socialData.display_name || socialData.provider_username,
       socialData.provider_avatar, !!socialData.email, true, 'user']
    );

    await db.query(
      `INSERT INTO social_connections (id, user_id, provider, provider_user_id, provider_username, provider_email, provider_avatar, access_token, refresh_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), userId, socialData.provider, socialData.provider_user_id,
       socialData.provider_username, socialData.provider_email, socialData.provider_avatar,
       socialData.access_token, socialData.refresh_token]
    );

    return this.findById(userId);
  }

  static async create(userData) {
    const id = uuidv4();
    const passwordHash = userData.password ? await bcrypt.hash(userData.password, 10) : null;

    await db.query(
      `INSERT INTO users (id, username, email, password_hash, display_name,
        picture, email_verified, phone, phone_verified, locale, zoneinfo, qq, enabled,
        role, register_ip, register_ip_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userData.username,
        userData.email,
        passwordHash,
        userData.display_name || null,
        userData.picture || null,
        userData.email_verified || false,
        userData.phone || null,
        userData.phone_verified || false,
        userData.locale || 'zh-CN',
        userData.zoneinfo || null,
        userData.qq || null,
        userData.enabled !== false,
        userData.role || 'user',
        userData.register_ip || null,
        userData.register_ip_location || null
      ]
    );

    return this.findById(id);
  }

  static async update(id, userData) {
    const allowedFields = [
      'display_name', 'picture', 'email_verified', 'enabled',
      'phone', 'phone_verified', 'locale', 'zoneinfo',
      'qq', 'email', 'username', 'role'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (userData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(userData[field]);
      }
    }

    if (updates.length === 0) return this.findById(id);

    values.push(id);
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  static async verifyPassword(user, password) {
    if (!user.password_hash) return false;
    return bcrypt.compare(password, user.password_hash);
  }

  static async changePassword(id, newPassword) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
  }

  static async getOIDCUserInfo(userId) {
    const user = await this.findById(userId);
    if (!user) return null;

    return {
      sub: user.id,
      username: user.username,
      email: user.email,
      email_verified: !!user.email_verified,
      name: user.display_name,
      preferred_username: user.username,
      picture: user.picture,
      phone: user.phone,
      phone_verified: !!user.phone_verified,
      locale: user.locale,
      zoneinfo: user.zoneinfo,
      qq: user.qq,
      updated_at: user.updated_at
    };
  }

  static async list(limit = 20, offset = 0) {
    const users = await db.query(
      'SELECT id, username, email, display_name, email_verified, enabled, role, created_at FROM users LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    return {
      users,
      total: countResult[0].total
    };
  }

  static async getSocialConnections(userId) {
    return db.query(
      `SELECT id, provider, provider_username, provider_email, provider_avatar, linked_at
       FROM social_connections WHERE user_id = ?`,
      [userId]
    );
  }

  static async removeSocialConnection(userId, connectionId) {
    await db.query(
      'DELETE FROM social_connections WHERE id = ? AND user_id = ?',
      [connectionId, userId]
    );
  }

  static async getCredentials(userId) {
    return db.query(
      `SELECT id, credential_id, nickname, device_name, credential_type, transports, created_at, last_used_at
       FROM user_credentials WHERE user_id = ?`,
      [userId]
    );
  }
}

module.exports = User;
