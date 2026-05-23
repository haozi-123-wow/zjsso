-- ================================================================
-- ZJSSO 数据库增量迁移脚本 - 新增 user_activity_log 表
-- 用途: 在已有数据库上新增用户活动日志表
-- 适用: 已跑过初始 migrate.js 的旧库
-- 要求: MySQL 5.7+
-- 执行: mysql -u root -p < src/database/migration_activity_log.sql
-- 或:  在 mysql 命令行中执行 source src/database/migration_activity_log.sql
-- ================================================================

USE `zjsso`;

CREATE TABLE IF NOT EXISTS `user_activity_log` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `action` VARCHAR(50) NOT NULL COMMENT '操作类型: login/logout/register/change_password/revoke_consent/register_passkey/delete_passkey/bind_social/unbind_social/update_profile/upload_avatar/delete_avatar',
  `detail` TEXT DEFAULT NULL COMMENT '操作详情(JSON)',
  `ip_address` VARCHAR(45) DEFAULT NULL COMMENT '操作时的 IP 地址',
  `ip_location` VARCHAR(255) DEFAULT NULL COMMENT '操作时的 IP 归属地',
  `user_agent` TEXT DEFAULT NULL COMMENT '操作时的 User-Agent',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_user_action` (`user_id`, `created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户活动日志表';

SELECT 'migration_activity_log completed' AS result;
