-- ================================================================
-- ZJSSO OIDC 单点登录系统 - 数据库建表脚本
-- 数据库引擎: MySQL 5.7+
-- 字符集: utf8mb4
-- 排序规则: utf8mb4_unicode_ci
-- ================================================================

CREATE DATABASE IF NOT EXISTS `zjsso`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `zjsso`;

-- ================================================================
-- 1. users - 用户表
-- 核心用户账户表，存储认证基础信息和 OIDC 标准 claims
-- ================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `username` VARCHAR(255) UNIQUE NOT NULL COMMENT '用户名，用于登录',
  `email` VARCHAR(255) UNIQUE NOT NULL COMMENT '邮箱，用于登录和 OIDC claims',
  `password_hash` VARCHAR(255) DEFAULT NULL COMMENT 'bcrypt 密码哈希（第三方登录用户可为空）',
  `display_name` VARCHAR(255) DEFAULT NULL COMMENT '显示名称',
  `picture` VARCHAR(512) DEFAULT NULL COMMENT '头像 URL',
  `email_verified` BOOLEAN DEFAULT FALSE COMMENT '邮箱是否已验证',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '电话号码',
  `phone_verified` BOOLEAN DEFAULT FALSE COMMENT '电话是否已验证',
  `locale` VARCHAR(10) DEFAULT 'zh-CN' COMMENT '语言区域',
  `zoneinfo` VARCHAR(50) DEFAULT NULL COMMENT '时区',
  `qq` VARCHAR(20) DEFAULT NULL COMMENT 'QQ 号',
  `enabled` BOOLEAN DEFAULT TRUE COMMENT '账户是否启用',
  `register_ip` VARCHAR(45) DEFAULT NULL COMMENT '注册时的 IP 地址',
  `register_ip_location` VARCHAR(255) DEFAULT NULL COMMENT '注册 IP 的归属地',
  `last_login_ip` VARCHAR(45) DEFAULT NULL COMMENT '最后一次登录 IP 地址',
  `last_login_ip_location` VARCHAR(255) DEFAULT NULL COMMENT '最后一次登录 IP 归属地',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后一次登录时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_email` (`email`),
  INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================================================
-- 2. clients - OIDC 客户端表
-- 注册的 OIDC 客户端应用信息
-- ================================================================
CREATE TABLE IF NOT EXISTS `clients` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `client_id` VARCHAR(255) UNIQUE NOT NULL COMMENT '客户端标识符',
  `client_secret` VARCHAR(255) DEFAULT NULL COMMENT 'bcrypt 哈希后的客户端密钥',
  `client_name` VARCHAR(255) NOT NULL COMMENT '客户端名称',
  `client_description` TEXT DEFAULT NULL COMMENT '客户端描述',
  `logo_uri` VARCHAR(512) DEFAULT NULL COMMENT 'Logo URL',
  `homepage_uri` VARCHAR(512) DEFAULT NULL COMMENT '主页 URL',
  `redirect_uris` JSON NOT NULL COMMENT '允许的重定向 URI 列表',
  `post_logout_redirect_uris` JSON DEFAULT NULL COMMENT '登出后重定向 URI 列表',
  `grant_types` JSON NOT NULL COMMENT '允许的授权类型',
  `response_types` JSON NOT NULL COMMENT '允许的响应类型',
  `token_endpoint_auth_method` VARCHAR(50) NOT NULL DEFAULT 'client_secret_basic' COMMENT 'Token 端点认证方式',
  `pkce_required` BOOLEAN DEFAULT FALSE COMMENT '是否强制 PKCE',
  `access_token_expires_in` INT DEFAULT 3600 COMMENT 'access_token 过期时间(秒)',
  `refresh_token_expires_in` INT DEFAULT 604800 COMMENT 'refresh_token 过期时间(秒)',
  `enabled` BOOLEAN DEFAULT TRUE COMMENT '是否启用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_client_id` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OIDC 客户端表';

-- ================================================================
-- 3. authorization_codes - 授权码表
-- 授权码流程中临时存储授权码信息
-- ================================================================
CREATE TABLE IF NOT EXISTS `authorization_codes` (
  `code` VARCHAR(255) PRIMARY KEY COMMENT '授权码',
  `client_id` VARCHAR(36) NOT NULL COMMENT '关联客户端 ID',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `redirect_uri` VARCHAR(512) NOT NULL COMMENT '原始重定向 URI',
  `scope` VARCHAR(512) DEFAULT NULL COMMENT '请求的 scope',
  `state` VARCHAR(255) DEFAULT NULL COMMENT 'CSRF 保护 state 值',
  `nonce` VARCHAR(255) DEFAULT NULL COMMENT '防重放 nonce 值',
  `code_challenge` VARCHAR(255) DEFAULT NULL COMMENT 'PKCE challenge 值',
  `code_challenge_method` VARCHAR(10) DEFAULT NULL COMMENT 'PKCE 方法(S256/plain)',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `used` BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='授权码表';

-- ================================================================
-- 4. access_tokens - 访问令牌表
-- 有状态模式下存储 access_token 信息
-- ================================================================
CREATE TABLE IF NOT EXISTS `access_tokens` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `token_hash` VARCHAR(255) UNIQUE NOT NULL COMMENT 'SHA256(token)哈希值',
  `client_id` VARCHAR(36) NOT NULL COMMENT '关联客户端 ID',
  `user_id` VARCHAR(36) DEFAULT NULL COMMENT '关联用户 ID(client_credentials 时为空)',
  `scopes` TEXT DEFAULT NULL COMMENT '授权 scope 列表',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访问令牌表';

-- ================================================================
-- 5. refresh_tokens - 刷新令牌表
-- 存储 refresh_token 用于 token 续期
-- ================================================================
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `token_hash` VARCHAR(255) UNIQUE NOT NULL COMMENT 'SHA256(token)哈希值',
  `client_id` VARCHAR(36) NOT NULL COMMENT '关联客户端 ID',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `scopes` TEXT DEFAULT NULL COMMENT '授权 scope 列表',
  `expires_at` TIMESTAMP NOT NULL COMMENT '过期时间',
  `used` BOOLEAN DEFAULT FALSE COMMENT '是否已使用',
  `revoked` BOOLEAN DEFAULT FALSE COMMENT '是否已撤销',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='刷新令牌表';

-- ================================================================
-- 6. oidc_sessions - OIDC 会话表
-- 跟踪 OIDC 授权流程中的会话状态
-- ================================================================
CREATE TABLE IF NOT EXISTS `oidc_sessions` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `session_id` VARCHAR(255) UNIQUE NOT NULL COMMENT '会话标识符',
  `user_id` VARCHAR(36) DEFAULT NULL COMMENT '关联用户 ID(未登录时为空)',
  `client_id` VARCHAR(36) NOT NULL COMMENT '关联客户端 ID',
  `state` VARCHAR(255) DEFAULT NULL COMMENT 'OAuth state 参数',
  `nonce` VARCHAR(255) DEFAULT NULL COMMENT 'OIDC nonce 参数',
  `oauth_state` VARCHAR(255) DEFAULT NULL COMMENT '流程状态(pending_login/pending_consent/completed)',
  `redirect_uri` VARCHAR(512) DEFAULT NULL COMMENT '重定向 URI',
  `scopes` TEXT DEFAULT NULL COMMENT '请求的 scope',
  `expires_at` TIMESTAMP NOT NULL COMMENT '会话过期时间',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_session_id` (`session_id`),
  INDEX `idx_expires_at` (`expires_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='OIDC 会话表';

-- ================================================================
-- 7. user_consents - 用户授权同意表
-- 记录用户对某个客户端授权的 scope，避免每次授权都弹出确认页面
-- ================================================================
CREATE TABLE IF NOT EXISTS `user_consents` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `client_id` VARCHAR(36) NOT NULL COMMENT '关联客户端 ID',
  `scopes` JSON NOT NULL COMMENT '授权 scope 列表',
  `granted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '授权时间',
  `expires_at` TIMESTAMP NULL DEFAULT NULL COMMENT '授权过期时间(NULL=永不过期)',
  UNIQUE KEY `unique_user_client` (`user_id`, `client_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户授权同意表';

-- ================================================================
-- 8. social_connections - 第三方登录关联表
-- 记录用户绑定的第三方社交账号
-- ================================================================
CREATE TABLE IF NOT EXISTS `social_connections` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'UUID 主键',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `provider` VARCHAR(50) NOT NULL COMMENT '第三方提供商(github/qq/wechat/douyin/weibo)',
  `provider_user_id` VARCHAR(255) NOT NULL COMMENT '第三方用户唯一 ID',
  `provider_username` VARCHAR(255) DEFAULT NULL COMMENT '第三方用户名',
  `provider_email` VARCHAR(255) DEFAULT NULL COMMENT '第三方邮箱',
  `provider_avatar` VARCHAR(512) DEFAULT NULL COMMENT '第三方头像 URL',
  `raw_profile` TEXT DEFAULT NULL COMMENT '第三方原始资料(JSON)',
  `access_token` TEXT DEFAULT NULL COMMENT '第三方 access_token(用于 API 调用)',
  `refresh_token` TEXT DEFAULT NULL COMMENT '第三方 refresh_token',
  `token_expires_at` TIMESTAMP NULL DEFAULT NULL COMMENT '第三方 token 过期时间',
  `linked_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY `unique_provider_account` (`provider`, `provider_user_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_provider` (`provider`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='第三方登录关联表';

-- ================================================================
-- 9. user_credentials - 用户密钥表（WebAuthn/Passkeys）
-- 存储 WebAuthn/FIDO2 浏览器密钥凭证，支持无密码登录
-- ================================================================
CREATE TABLE IF NOT EXISTS `user_credentials` (
  `id` VARCHAR(255) PRIMARY KEY COMMENT '凭证唯一 ID（由 WebAuthn 生成）',
  `user_id` VARCHAR(36) NOT NULL COMMENT '关联用户 ID',
  `credential_id` VARCHAR(512) NOT NULL COMMENT '凭证 ID(Base64URL)',
  `credential_public_key` TEXT NOT NULL COMMENT '公钥(PEM 格式)',
  `counter` BIGINT DEFAULT 0 COMMENT '签名计数器(防克隆)',
  `credential_type` VARCHAR(50) DEFAULT 'public-key' COMMENT '凭证类型',
  `attestation_type` VARCHAR(50) DEFAULT NULL COMMENT 'attestation 类型(none/indirect/direct)',
  `transports` JSON DEFAULT NULL COMMENT '支持的传输方式(usb/nfc/ble/internal)',
  `aaguid` VARCHAR(36) DEFAULT NULL COMMENT '认证器 GUID(识别设备型号)',
  `nickname` VARCHAR(255) DEFAULT NULL COMMENT '用户自定义名称',
  `device_name` VARCHAR(255) DEFAULT NULL COMMENT '设备名称(自动识别)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
  `last_used_at` TIMESTAMP NULL DEFAULT NULL COMMENT '最后使用时间',
  INDEX `idx_credential_id` (`credential_id`),
  INDEX `idx_user_id` (`user_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户密钥表(WebAuthn/Passkeys)';

-- ================================================================
-- 数据清理事件
-- ================================================================

-- 每小时清理过期授权码
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_expired_authorization_codes`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM `authorization_codes` WHERE `expires_at` < NOW();
END$$
DELIMITER ;

-- 每小时清理过期 access_token
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_expired_access_tokens`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM `access_tokens` WHERE `expires_at` < NOW();
END$$
DELIMITER ;

-- 每日清理过期 refresh_token
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_expired_refresh_tokens`
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM `refresh_tokens` WHERE `expires_at` < NOW();
END$$
DELIMITER ;

-- 每小时清理过期 OIDC 会话
DELIMITER $$
CREATE EVENT IF NOT EXISTS `cleanup_expired_oidc_sessions`
ON SCHEDULE EVERY 1 HOUR
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM `oidc_sessions` WHERE `expires_at` < NOW();
END$$
DELIMITER ;

-- ================================================================
-- 说明
-- ================================================================
-- 1. 字符集使用 utf8mb4，支持完整的 Unicode（包括 emoji）
-- 2. 排序规则使用 utf8mb4_unicode_ci，基于 Unicode 标准排序
-- 3. 所有表的主键使用 VARCHAR(36) 存储 UUID
-- 4. JSON 类型字段用于存储结构化的配置数据
-- 5. TIMESTAMP 类型用于时间记录，自动处理时区转换
-- 6. 数据清理事件默认启用，可根据实际需求调整执行频率
-- 7. Redis 中的数据结构（会话、缓存、速率限制等）请参考 docs/database.md
