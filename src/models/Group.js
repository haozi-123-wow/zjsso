const { v4: uuidv4 } = require('uuid');
const db = require('../database/connection');

class Group {
  // 创建组
  static async create({ name, description }) {
    const id = uuidv4();
    await db.query(
      'INSERT INTO groups (id, name, description) VALUES (?, ?, ?)',
      [id, name, description || null]
    );
    return this.findById(id);
  }

  // 按 ID 查找
  static async findById(id) {
    const rows = await db.query('SELECT * FROM groups WHERE id = ?', [id]);
    return rows[0] || null;
  }

  // 按名称查找
  static async findByName(name) {
    const rows = await db.query('SELECT * FROM groups WHERE name = ?', [name]);
    return rows[0] || null;
  }

  // 获取所有组
  static async listAll() {
    return db.query('SELECT * FROM groups ORDER BY created_at DESC');
  }

  // 更新组
  static async update(id, { name, description }) {
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (updates.length === 0) return this.findById(id);

    values.push(id);
    await db.query(`UPDATE groups SET ${updates.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  }

  // 删除组（user_groups 由外键 CASCADE 自动清理）
  static async delete(id) {
    await db.query('DELETE FROM groups WHERE id = ?', [id]);
  }

  // ─── 用户-组关联 ───

  // 获取用户所属的所有组
  static async getUserGroups(userId) {
    return db.query(
      `SELECT g.* FROM groups g
       INNER JOIN user_groups ug ON ug.group_id = g.id
       WHERE ug.user_id = ?`,
      [userId]
    );
  }

  // 获取用户所属组的 ID 列表
  static async getUserGroupIds(userId) {
    const rows = await db.query(
      'SELECT group_id FROM user_groups WHERE user_id = ?',
      [userId]
    );
    return rows.map(r => r.group_id);
  }

  // 添加用户到组
  static async addUserToGroup(userId, groupId) {
    const id = uuidv4();
    await db.query(
      'INSERT IGNORE INTO user_groups (id, user_id, group_id) VALUES (?, ?, ?)',
      [id, userId, groupId]
    );
  }

  // 从组中移除用户
  static async removeUserFromGroup(userId, groupId) {
    await db.query(
      'DELETE FROM user_groups WHERE user_id = ? AND group_id = ?',
      [userId, groupId]
    );
  }

  // 获取组内所有用户
  static async getGroupUsers(groupId) {
    return db.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.enabled, u.role,
              ug.created_at as joined_at
       FROM users u
       INNER JOIN user_groups ug ON ug.user_id = u.id
       WHERE ug.group_id = ?
       ORDER BY ug.created_at DESC`,
      [groupId]
    );
  }
}

module.exports = Group;
