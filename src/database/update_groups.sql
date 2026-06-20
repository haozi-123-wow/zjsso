-- ================================================================
-- ZJSSO 用户组功能 - 增量迁移脚本
-- 执行方式: mysql -u root -p zjsso < update_groups.sql
-- 或通过 npm run migrate 自动执行
-- ================================================================

-- 1. 创建用户组表
CREATE TABLE IF NOT EXISTS `groups` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `name` VARCHAR(255) NOT NULL COMMENT '组名称（唯一）',
  `description` TEXT DEFAULT NULL COMMENT '组描述',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `unique_group_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户组表';

-- 2. 创建用户-组关联表（多对多）
CREATE TABLE IF NOT EXISTS `user_groups` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `group_id` VARCHAR(36) NOT NULL COMMENT '关联组 ID',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  UNIQUE KEY `unique_user_group` (`user_id`, `group_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_group_id` (`group_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`group_id`) REFERENCES `groups`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户-组关联表';

-- 3. clients 表新增 allowed_groups 字段
ALTER TABLE `clients`
  ADD COLUMN `allowed_groups` JSON DEFAULT NULL COMMENT '允许访问的用户组 ID 列表（NULL=不限制）'
  AFTER `pkce_required`;

-- ================================================================
-- 验证执行结果
-- ================================================================
-- SELECT TABLE_NAME, TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'zjsso' AND TABLE_NAME IN ('groups', 'user_groups');
-- SELECT COLUMN_NAME, COLUMN_COMMENT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = 'zjsso' AND TABLE_NAME = 'clients' AND COLUMN_NAME = 'allowed_groups';
