-- ================================================================
-- ZJSSO 数据库增量迁移脚本
-- 用途: 在已有数据库上补增字段和修改约束
-- 适用: 已跑过初始 migrate.js 的旧库
-- 要求: MySQL 5.7+
-- 执行: mysql -u root -p < src/database/migration_patch.sql
-- ================================================================

USE `zjsso`;

-- ================================================================
-- 辅助存储过程：字段不存在时才新增
-- ================================================================

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_column_if_not_exists(
  IN tableName VARCHAR(64),
  IN columnName VARCHAR(64),
  IN columnDef  VARCHAR(256)
)
BEGIN
  SET @colExists = 0;
  SELECT COUNT(*) INTO @colExists
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'zjsso'
      AND TABLE_NAME = tableName
      AND COLUMN_NAME = columnName;

  IF @colExists = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD COLUMN `', columnName, '` ', columnDef);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- ================================================================
-- 辅助存储过程：索引不存在时才创建
-- ================================================================

DROP PROCEDURE IF EXISTS add_index_if_not_exists;

DELIMITER $$
CREATE PROCEDURE add_index_if_not_exists(
  IN tableName VARCHAR(64),
  IN indexName VARCHAR(64),
  IN indexDef  VARCHAR(256)
)
BEGIN
  SET @idxExists = 0;
  SELECT COUNT(*) INTO @idxExists
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = 'zjsso'
      AND TABLE_NAME = tableName
      AND INDEX_NAME = indexName;

  IF @idxExists = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', tableName, '` ADD INDEX `', indexName, '` ', indexDef);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$
DELIMITER ;

-- ================================================================
-- 1. users 表 — 新增 IP 记录字段
-- ================================================================

CALL add_column_if_not_exists('users', 'register_ip', 'VARCHAR(45) DEFAULT NULL COMMENT ''注册时的 IP 地址'' AFTER `enabled`');
CALL add_column_if_not_exists('users', 'register_ip_location', 'VARCHAR(255) DEFAULT NULL COMMENT ''注册 IP 的归属地'' AFTER `register_ip`');
CALL add_column_if_not_exists('users', 'last_login_ip', 'VARCHAR(45) DEFAULT NULL COMMENT ''最后一次登录 IP 地址'' AFTER `register_ip_location`');
CALL add_column_if_not_exists('users', 'last_login_ip_location', 'VARCHAR(255) DEFAULT NULL COMMENT ''最后一次登录 IP 归属地'' AFTER `last_login_ip`');
CALL add_column_if_not_exists('users', 'last_login_at', 'TIMESTAMP NULL DEFAULT NULL COMMENT ''最后一次登录时间'' AFTER `last_login_ip_location`');

-- ================================================================
-- 2. users 表 — 新增角色字段
-- ================================================================

CALL add_column_if_not_exists('users', 'role', 'VARCHAR(20) NOT NULL DEFAULT ''user'' COMMENT ''角色: user, developer, admin'' AFTER `enabled`');

-- ================================================================
-- 3. clients 表 — 新增创建者字段（开发者数据隔离）
-- ================================================================

CALL add_column_if_not_exists('clients', 'created_by', 'VARCHAR(36) DEFAULT NULL COMMENT ''创建者的用户 ID'' AFTER `refresh_token_expires_in`');
CALL add_index_if_not_exists('clients', 'idx_created_by', '(`created_by`)');

-- ================================================================
-- 4. refresh_tokens 表 — client_id 改为允许 NULL
--    （用户直接登录时无需关联 OIDC 客户端）
-- ================================================================

-- 查现有外键名
SET @constraint_name = (
  SELECT CONSTRAINT_NAME
  FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA = 'zjsso'
    AND TABLE_NAME = 'refresh_tokens'
    AND COLUMN_NAME = 'client_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);

-- 删除旧外键
SET @drop_fk_sql = IF(
  @constraint_name IS NOT NULL,
  CONCAT('ALTER TABLE `refresh_tokens` DROP FOREIGN KEY `', @constraint_name, '`'),
  'SELECT 1'
);
PREPARE stmt FROM @drop_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 修改列为允许 NULL
ALTER TABLE `refresh_tokens`
  MODIFY `client_id` VARCHAR(36) DEFAULT NULL COMMENT '关联客户端 ID（直接登录时为空）';

-- 重建外键 ON DELETE SET NULL
SET @add_fk_sql = CONCAT(
  'ALTER TABLE `refresh_tokens` ',
  'ADD CONSTRAINT `', IFNULL(@constraint_name, 'refresh_tokens_ibfk_1'), '` ',
  'FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE SET NULL'
);
PREPARE stmt FROM @add_fk_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ================================================================
-- 清理存储过程
-- ================================================================
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DROP PROCEDURE IF EXISTS add_index_if_not_exists;

-- ================================================================
-- 验证
-- ================================================================
SELECT 'migration_patch completed' AS result;
