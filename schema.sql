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

-- Idempotent: adds supersection_id to sections if the table already existed before this migration
ALTER TABLE sections ADD COLUMN IF NOT EXISTS supersection_id INT NULL AFTER id;

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
