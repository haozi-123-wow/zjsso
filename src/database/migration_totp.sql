-- ================================================================
-- ZJSSO 数据库迁移脚本 - 新增 TOTP 双因素认证表
-- 用途: 创建 user_totp 表存储 TOTP 密钥
-- 要求: MySQL 5.7+
-- 执行: mysql -u root -p < src/database/migration_totp.sql
-- ================================================================

USE `zjsso`;

CREATE TABLE IF NOT EXISTS `user_totp` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `secret` VARCHAR(255) NOT NULL COMMENT 'TOTP 密钥(Base32)',
  `enabled` BOOLEAN DEFAULT FALSE COMMENT '是否已启用 2FA',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `verified_at` TIMESTAMP NULL DEFAULT NULL COMMENT '首次验证通过时间',
  UNIQUE KEY `unique_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='TOTP 双因素认证表';

SELECT 'migration_totp completed' AS result;
