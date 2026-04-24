CREATE TABLE IF NOT EXISTS supersections (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(255) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sections (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  supersection_id  INT NULL,
  name             VARCHAR(255) NOT NULL,
  slug             VARCHAR(255) NOT NULL UNIQUE,
  sort_order       INT DEFAULT 0
);

-- Idempotent migrations for columns added after initial deploy

-- col_span / row_span on images (grid size in gallery)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'col_span');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN col_span TINYINT NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'row_span');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN row_span TINYINT NOT NULL DEFAULT 1', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- grid_row on images (explicit row grouping; NULL = auto-placed)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'grid_row');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN grid_row INT NULL DEFAULT NULL', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- object_fit on images (CSS object-fit for thumbnail display; default 'cover')
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'object_fit');
SET @sql = IF(@col_exists = 0, "ALTER TABLE images ADD COLUMN object_fit VARCHAR(20) NOT NULL DEFAULT 'cover'", 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ar_mode: fixed aspect-ratio display mode (col_span acts as size 1-4 when enabled)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'ar_mode');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN ar_mode TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'ar_w');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN ar_w TINYINT NOT NULL DEFAULT 16', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'ar_h');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN ar_h TINYINT NOT NULL DEFAULT 9', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'ar_size');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN ar_size DECIMAL(4,2) NOT NULL DEFAULT 1.00', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'full_width');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN full_width TINYINT(1) NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- margin_top on images (px of space above thumbnail; default 0)
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'images' AND COLUMN_NAME = 'margin_top');
SET @sql = IF(@col_exists = 0, 'ALTER TABLE images ADD COLUMN margin_top SMALLINT NOT NULL DEFAULT 0', 'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- supersection_id on sections
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME   = 'sections'
    AND COLUMN_NAME  = 'supersection_id'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE sections ADD COLUMN supersection_id INT NULL AFTER id',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CREATE TABLE IF NOT EXISTS settings (
  `key`   VARCHAR(100) PRIMARY KEY,
  `value` TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  section_id  INT,
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  image_path  VARCHAR(500) NOT NULL,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
);
