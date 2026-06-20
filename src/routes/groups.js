const express = require('express');
const Group = require('../models/Group');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

const router = express.Router();

// 所有路由需要 admin 权限
router.use(authenticate);
router.use(requireRole('admin'));

// GET /api/groups - 获取所有组
router.get('/groups', async (req, res) => {
  try {
    const groups = await Group.listAll();
    // 获取每个组的成员数
    const groupsWithCount = await Promise.all(groups.map(async (g) => {
      const users = await Group.getGroupUsers(g.id);
      return { ...g, user_count: users.length };
    }));
    res.json({ groups: groupsWithCount });
  } catch (err) {
    console.error('List groups error:', err);
    res.status(500).json({ error: 'server_error', message: '获取用户组列表失败' });
  }
});

// POST /api/groups - 创建组
router.post('/groups', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'invalid_request', message: '组名称不能为空' });
    }
    const existing = await Group.findByName(name.trim());
    if (existing) {
      return res.status(400).json({ error: 'duplicate', message: '组名称已存在' });
    }
    const group = await Group.create({ name: name.trim(), description });
    res.status(201).json({ ...group, user_count: 0 });
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ error: 'server_error', message: '创建用户组失败' });
  }
});

// GET /api/groups/:id - 组详情 + 成员
router.get('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'not_found', message: '用户组不存在' });
    }
    const users = await Group.getGroupUsers(req.params.id);
    res.json({ ...group, users });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ error: 'server_error', message: '获取用户组详情失败' });
  }
});

// PUT /api/groups/:id - 更新组
router.put('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'not_found', message: '用户组不存在' });
    }
    const { name, description } = req.body;
    if (name !== undefined && !name.trim()) {
      return res.status(400).json({ error: 'invalid_request', message: '组名称不能为空' });
    }
    // 名称唯一性校验
    if (name && name.trim() !== group.name) {
      const existing = await Group.findByName(name.trim());
      if (existing && existing.id !== group.id) {
        return res.status(400).json({ error: 'duplicate', message: '组名称已存在' });
      }
    }
    const updated = await Group.update(req.params.id, {
      name: name?.trim(),
      description
    });
    const users = await Group.getGroupUsers(req.params.id);
    res.json({ ...updated, user_count: users.length, users });
  } catch (err) {
    console.error('Update group error:', err);
    res.status(500).json({ error: 'server_error', message: '更新用户组失败' });
  }
});

// DELETE /api/groups/:id - 删除组
router.delete('/groups/:id', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'not_found', message: '用户组不存在' });
    }
    await Group.delete(req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ error: 'server_error', message: '删除用户组失败' });
  }
});

// POST /api/groups/:id/users - 批量添加用户
router.post('/groups/:id/users', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'not_found', message: '用户组不存在' });
    }
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({ error: 'invalid_request', message: '请提供要添加的用户 ID 列表' });
    }
    for (const userId of user_ids) {
      await Group.addUserToGroup(userId, req.params.id);
    }
    const users = await Group.getGroupUsers(req.params.id);
    res.json({ ...group, users });
  } catch (err) {
    console.error('Add users to group error:', err);
    res.status(500).json({ error: 'server_error', message: '添加用户到组失败' });
  }
});

// DELETE /api/groups/:id/users/:userId - 移除用户
router.delete('/groups/:id/users/:userId', async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'not_found', message: '用户组不存在' });
    }
    await Group.removeUserFromGroup(req.params.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    console.error('Remove user from group error:', err);
    res.status(500).json({ error: 'server_error', message: '从组中移除用户失败' });
  }
});

module.exports = router;
