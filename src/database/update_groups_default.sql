-- 用户组添加 is_default 字段
-- 新用户注册时自动加入 is_default = 1 的组

ALTER TABLE `groups`
ADD COLUMN `is_default` BOOLEAN DEFAULT FALSE COMMENT '新用户注册时是否自动加入此组' AFTER `description`;

-- 为现有数据库执行迁移
-- ALTER TABLE `groups` ADD COLUMN `is_default` BOOLEAN DEFAULT FALSE COMMENT '新用户注册时是否自动加入此组' AFTER `description`;
