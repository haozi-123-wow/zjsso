const express = require('express');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const config = require('../config');
const User = require('../models/User');
const Group = require('../models/Group');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const { createRateLimiter } = require('../middleware/rateLimiter');
const { log, ACTION } = require('../services/ActivityLogService');

const router = express.Router();

function generateClientId() {
  return 'client_' + crypto.randomBytes(16).toString('hex');
}

function generateClientSecret() {
  return crypto.randomBytes(32).toString('hex');
}

const clientLimiter = createRateLimiter({
  windowSeconds: 60,
  maxRequests: 20,
  keyPrefix: 'admin_client'
});

function formatClient(client) {
  const allowedGroups = client.allowed_groups
    ? (typeof client.allowed_groups === 'string' ? JSON.parse(client.allowed_groups) : client.allowed_groups)
    : null;

  return {
    id: client.id,
    client_id: client.client_id,
    client_name: client.client_name,
    client_description: client.client_description,
    logo_uri: client.logo_uri || null,
    homepage_uri: client.homepage_uri || null,
    redirect_uris: typeof client.redirect_uris === 'string' ? JSON.parse(client.redirect_uris) : client.redirect_uris,
    post_logout_redirect_uris: client.post_logout_redirect_uris
      ? (typeof client.post_logout_redirect_uris === 'string' ? JSON.parse(client.post_logout_redirect_uris) : client.post_logout_redirect_uris)
      : [],
    grant_types: typeof client.grant_types === 'string' ? JSON.parse(client.grant_types) : client.grant_types,
    response_types: typeof client.response_types === 'string' ? JSON.parse(client.response_types) : client.response_types,
    token_endpoint_auth_method: client.token_endpoint_auth_method,
    allowed_groups: allowedGroups,
    pkce_required: !!client.pkce_required,
    enabled: !!client.enabled,
    created_by: client.created_by,
    created_at: client.created_at,
    updated_at: client.updated_at
  };
}

router.get('/clients', authenticate, async (req, res) => {
  try {
    let rows;
    let total;

    if (req.user.role === 'admin') {
      rows = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
      const countResult = await db.query('SELECT COUNT(*) as total FROM clients');
      total = countResult[0].total;
    } else {
      rows = await db.query('SELECT * FROM clients WHERE created_by = ? ORDER BY created_at DESC', [req.user.id]);
      const countResult = await db.query('SELECT COUNT(*) as total FROM clients WHERE created_by = ?', [req.user.id]);
      total = countResult[0].total;
    }

    res.json({
      clients: rows.map(formatClient),
      total
    });
  } catch (err) {
    console.error('List clients error:', err);
    res.status(500).json({ error: 'server_error', message: '获取客户端列表失败' });
  }
});

router.post('/clients/register', authenticate, clientLimiter, async (req, res) => {
  try {
    const {
      client_name, client_description, redirect_uris,
      post_logout_redirect_uris, grant_types, response_types,
      token_endpoint_auth_method, homepage_uri, logo_uri, pkce_required,
      allowed_groups
    } = req.body;

    if (!client_name) {
      return res.status(400).json({ error: 'invalid_request', message: '应用名称不能为空' });
    }

    if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      return res.status(400).json({ error: 'invalid_request', message: '至少需要提供一个回调地址' });
    }

    for (const uri of redirect_uris) {
      try {
        new URL(uri);
      } catch {
        return res.status(400).json({ error: 'invalid_request', message: `回调地址格式无效: ${uri}` });
      }
    }

    if (allowed_groups !== undefined && allowed_groups !== null && !Array.isArray(allowed_groups)) {
      return res.status(400).json({ error: 'invalid_request', message: 'allowed_groups 必须是数组或 null' });
    }

    const id = uuidv4();
    const clientId = generateClientId();
    const clientSecret = generateClientSecret();
    const hashedSecret = await bcrypt.hash(clientSecret, 10);

    await db.query(
      `INSERT INTO clients (id, client_id, client_secret, client_name, client_description,
        logo_uri, homepage_uri, redirect_uris, post_logout_redirect_uris,
        grant_types, response_types, token_endpoint_auth_method, pkce_required,
        allowed_groups, enabled, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, clientId, hashedSecret, client_name, client_description || null,
        logo_uri || null, homepage_uri || null,
        JSON.stringify(redirect_uris),
        post_logout_redirect_uris ? JSON.stringify(post_logout_redirect_uris) : null,
        JSON.stringify(grant_types || ['authorization_code', 'refresh_token']),
        JSON.stringify(response_types || ['code']),
        token_endpoint_auth_method || 'client_secret_basic',
        !!pkce_required,
        allowed_groups === undefined || allowed_groups === null ? null : JSON.stringify(allowed_groups),
        true, req.user.id
      ]
    );

    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [id]);
    const client = formatClient(rows[0]);

    res.status(201).json({
      ...client,
      client_secret: clientSecret
    });
  } catch (err) {
    console.error('Register client error:', err);
    res.status(500).json({ error: 'server_error', message: '创建客户端失败' });
  }
});

router.get('/clients/:id', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];

    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权查看此客户端' });
    }

    res.json(formatClient(client));
  } catch (err) {
    console.error('Get client error:', err);
    res.status(500).json({ error: 'server_error', message: '获取客户端详情失败' });
  }
});

router.put('/clients/:id', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];

    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权修改此客户端' });
    }

    const allowedFields = [
      'client_name', 'client_description', 'redirect_uris',
      'post_logout_redirect_uris', 'grant_types', 'response_types',
      'token_endpoint_auth_method', 'homepage_uri', 'logo_uri', 'pkce_required',
      'allowed_groups'
    ];

    const updates = [];
    const values = [];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'allowed_groups') {
          if (req.body[field] !== null && !Array.isArray(req.body[field])) {
            return res.status(400).json({ error: 'invalid_request', message: 'allowed_groups 必须是数组或 null' });
          }
          updates.push(`${field} = ?`);
          values.push(req.body[field] === null ? null : JSON.stringify(req.body[field]));
        } else if (Array.isArray(req.body[field])) {
          for (const uri of req.body[field]) {
            if (uri.includes('://')) {
              try { new URL(uri); } catch {
                return res.status(400).json({ error: 'invalid_request', message: `URL 格式无效: ${uri}` });
              }
            }
          }
          updates.push(`${field} = ?`);
          values.push(JSON.stringify(req.body[field]));
        } else if (typeof req.body[field] === 'boolean') {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        } else {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      }
    }

    if (updates.length === 0) {
      return res.json(formatClient(client));
    }

    values.push(req.params.id);
    await db.query(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`, values);

    const updated = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    res.json(formatClient(updated[0]));
  } catch (err) {
    console.error('Update client error:', err);
    res.status(500).json({ error: 'server_error', message: '更新客户端失败' });
  }
});

router.delete('/clients/:id', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];

    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权删除此客户端' });
    }

    await db.query('DELETE FROM clients WHERE id = ?', [req.params.id]);

    res.status(204).end();
  } catch (err) {
    console.error('Delete client error:', err);
    res.status(500).json({ error: 'server_error', message: '删除客户端失败' });
  }
});

router.post('/clients/:id/reset-secret', authenticate, async (req, res) => {
  try {
    const rows = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'not_found', message: '客户端不存在' });
    }

    const client = rows[0];

    if (req.user.role !== 'admin' && client.created_by !== req.user.id) {
      return res.status(403).json({ error: 'forbidden', message: '无权操作此客户端' });
    }

    const newSecret = generateClientSecret();
    const hashedSecret = await bcrypt.hash(newSecret, 10);

    await db.query('UPDATE clients SET client_secret = ? WHERE id = ?', [hashedSecret, req.params.id]);

    log(req.user.id, ACTION.RESET_SECRET, { client_id: client.client_id, client_name: client.client_name }, req);

    res.json({
      client_id: client.client_id,
      client_secret: newSecret
    });
  } catch (err) {
    console.error('Reset client secret error:', err);
    res.status(500).json({ error: 'server_error', message: '重置 Client Secret 失败' });
  }
});

router.get('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.search || '';

    let rows, countResult;

    if (search) {
      const pattern = `%${search}%`;
      rows = await db.query(
        `SELECT id, username, email, display_name, picture, email_verified, phone, qq,
          enabled, role, locale, zoneinfo, register_ip, register_ip_location,
          last_login_ip, last_login_ip_location, last_login_at,
          created_at, updated_at
         FROM users
         WHERE username LIKE ? OR email LIKE ? OR display_name LIKE ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [pattern, pattern, pattern, limit, offset]
      );
      countResult = await db.query(
        `SELECT COUNT(*) as total FROM users
         WHERE username LIKE ? OR email LIKE ? OR display_name LIKE ?`,
        [pattern, pattern, pattern]
      );
    } else {
      rows = await db.query(
        `SELECT id, username, email, display_name, picture, email_verified, phone, qq,
          enabled, role, locale, zoneinfo, register_ip, register_ip_location,
          last_login_ip, last_login_ip_location, last_login_at,
          created_at, updated_at
         FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      );
      countResult = await db.query('SELECT COUNT(*) as total FROM users');
    }

    res.json({
      users: rows,
      total: countResult[0].total,
      limit,
      offset
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'server_error', message: '获取用户列表失败' });
  }
});

router.post('/users', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, display_name, role, enabled } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'invalid_request', message: '用户名、邮箱和密码为必填项' });
    }

    const existingUsername = await User.findByUsername(username);
    if (existingUsername) {
      return res.status(400).json({ error: 'Validation Error', message: '用户名已被使用' });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ error: 'Validation Error', message: '邮箱已被使用' });
    }

    const user = await User.create({
      username, email, password, display_name,
      email_verified: true,
      enabled: enabled !== false,
      role: role || 'user'
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      email_verified: true,
      enabled: user.enabled,
      role: user.role,
      created_at: user.created_at
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'server_error', message: '创建用户失败' });
  }
});

router.get('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    const groups = await Group.getUserGroups(req.params.id);

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      display_name: user.display_name,
      picture: user.picture,
      email_verified: !!user.email_verified,
      phone: user.phone,
      qq: user.qq,
      enabled: !!user.enabled,
      role: user.role,
      locale: user.locale,
      zoneinfo: user.zoneinfo,
      register_ip: user.register_ip,
      register_ip_location: user.register_ip_location,
      last_login_ip: user.last_login_ip,
      last_login_ip_location: user.last_login_ip_location,
      last_login_at: user.last_login_at,
      groups,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'server_error', message: '获取用户详情失败' });
  }
});

router.put('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    const allowedFields = ['display_name', 'email_verified', 'enabled', 'role', 'phone', 'qq', 'locale', 'zoneinfo'];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (req.body.password) {
      await User.changePassword(req.params.id, req.body.password);
      log(req.params.id, ACTION.CHANGE_PASSWORD, null, req);
    }

    const updated = await User.update(req.params.id, updateData);

    res.json({
      id: updated.id,
      username: updated.username,
      email: updated.email,
      display_name: updated.display_name,
      email_verified: !!updated.email_verified,
      enabled: !!updated.enabled,
      role: updated.role,
      phone: updated.phone,
      qq: updated.qq,
      created_at: updated.created_at,
      updated_at: updated.updated_at
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'server_error', message: '更新用户失败' });
  }
});

router.delete('/users/:id', authenticate, requireRole('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'invalid_request', message: '不能删除自己的账号' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    await db.query('DELETE FROM user_consents WHERE user_id = ?', [req.params.id]);
    await db.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.params.id]);
    await db.query('DELETE FROM user_groups WHERE user_id = ?', [req.params.id]);
    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);

    res.status(204).end();
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'server_error', message: '删除用户失败' });
  }
});

router.post('/users/:id/clear-2fa', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    await db.query('DELETE FROM user_totp WHERE user_id = ?', [req.params.id]);
    log(req.user.id, ACTION.ADMIN_CLEAR_2FA, { target_user: req.params.id, target_username: user.username }, req);

    res.json({ message: '已清除该用户的 2FA 绑定' });
  } catch (err) {
    console.error('Clear 2FA error:', err);
    res.status(500).json({ error: 'server_error', message: '清除 2FA 失败' });
  }
});

// 获取用户活动日志
router.get('/users/:id/activity-logs', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;
    const { action } = req.query;

    let whereClause = 'WHERE user_id = ?';
    const params = [req.params.id];

    if (action) {
      whereClause += ' AND action = ?';
      params.push(action);
    }

    const rows = await db.query(
      `SELECT id, action, detail, ip_address, ip_location, user_agent, created_at
       FROM user_activity_log ${whereClause}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM user_activity_log ${whereClause}`,
      params
    );

    const logs = rows.map(r => ({
      id: r.id,
      action: r.action,
      detail: r.detail ? (typeof r.detail === 'string' ? (() => { try { return JSON.parse(r.detail) } catch { return r.detail } })() : r.detail) : null,
      ip_address: r.ip_address,
      ip_location: r.ip_location,
      user_agent: r.user_agent,
      created_at: r.created_at
    }));

    res.json({ logs, total: countResult[0].total });
  } catch (err) {
    console.error('Get user activity logs error:', err);
    res.status(500).json({ error: 'server_error', message: '获取用户活动日志失败' });
  }
});

// 获取用户授权列表
router.get('/users/:id/consents', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    const rows = await db.query(
      `SELECT uc.id, uc.client_id, uc.scopes, uc.granted_at,
              c.client_name, c.client_description, c.logo_uri, c.client_id as client_key
       FROM user_consents uc
       INNER JOIN clients c ON c.id = uc.client_id
       WHERE uc.user_id = ?
       ORDER BY uc.granted_at DESC`,
      [req.params.id]
    );

    const consents = rows.map(r => ({
      id: r.id,
      client_id: r.client_id,
      client_key: r.client_key,
      client_name: r.client_name,
      client_description: r.client_description,
      logo_uri: r.logo_uri,
      scopes: typeof r.scopes === 'string' ? JSON.parse(r.scopes) : r.scopes,
      granted_at: r.granted_at
    }));

    res.json({ consents });
  } catch (err) {
    console.error('Get user consents error:', err);
    res.status(500).json({ error: 'server_error', message: '获取用户授权列表失败' });
  }
});

// 撤销用户授权
router.delete('/users/:id/consents/:consentId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'not_found', message: '用户不存在' });
    }

    const result = await db.query(
      'DELETE FROM user_consents WHERE id = ? AND user_id = ?',
      [req.params.consentId, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'not_found', message: '授权记录不存在' });
    }

    log(req.user.id, ACTION.REVOKE_CONSENT, {
      target_user: req.params.id,
      target_username: user.username,
      consent_id: req.params.consentId
    }, req);

    res.json({ message: '已撤销授权' });
  } catch (err) {
    console.error('Revoke user consent error:', err);
    res.status(500).json({ error: 'server_error', message: '撤销授权失败' });
  }
});

module.exports = router;
