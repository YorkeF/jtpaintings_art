CREATE DATABASE IF NOT EXISTS jtpaintings CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jtpaintings;

CREATE TABLE IF NOT EXISTS sections (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  slug       VARCHAR(255) NOT NULL UNIQUE,
  sort_order INT DEFAULT 0
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
