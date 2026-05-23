-- ================================================================
-- ZJSSO 数据库增量迁移脚本 - user_activity_log 新增 ip_location 字段
-- 用途: 在已创建的 user_activity_log 表上新增 IP 归属地字段
-- 适用: 已跑过 migration_activity_log.sql 或 migrate.js 的旧库
-- 要求: MySQL 5.7+
-- 执行: mysql -u root -p < src/database/migration_activity_log_ip_location.sql
-- ================================================================

USE `zjsso`;

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

CALL add_column_if_not_exists('user_activity_log', 'ip_location', 'VARCHAR(255) DEFAULT NULL COMMENT ''操作时的 IP 归属地'' AFTER `ip_address`');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

SELECT 'migration_activity_log_ip_location completed' AS result;
