-- Material AI — full MySQL import
-- phpMyAdmin: Import this file
-- OR MySQL CLI: mysql -u root -p < sql/material_ai_full.sql

CREATE DATABASE IF NOT EXISTS db_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE material_ai;

CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chapters (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NULL,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(500) NULL,
  medium VARCHAR(50) NULL,
  standard VARCHAR(50) NULL,
  subject VARCHAR(255) NULL,
  chapter_no VARCHAR(50) NULL,
  chapter_name VARCHAR(500) NULL,
  language VARCHAR(16) NULL,
  source_file VARCHAR(500) NULL,
  pdf_name VARCHAR(500) NULL,
  chapter_json_name VARCHAR(500) NULL,
  chapter_json LONGTEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chapters_slug (slug),
  KEY idx_chapters_user (user_id),
  KEY idx_chapters_meta (medium, standard, subject, chapter_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS materials (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  chapter_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(500) NULL,
  medium VARCHAR(50) NULL,
  standard VARCHAR(50) NULL,
  subject VARCHAR(255) NULL,
  chapter_no VARCHAR(50) NULL,
  chapter_name VARCHAR(500) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'partial',
  topics_total INT UNSIGNED NOT NULL DEFAULT 0,
  topics_done INT UNSIGNED NOT NULL DEFAULT 0,
  material_json_name VARCHAR(500) NULL,
  material_json LONGTEXT NOT NULL,
  html_name VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_materials_slug (slug),
  KEY idx_materials_chapter (chapter_id),
  KEY idx_materials_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS material_topics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  material_id INT UNSIGNED NOT NULL,
  topic_order INT UNSIGNED NOT NULL,
  topic_key VARCHAR(255) NULL,
  title VARCHAR(500) NULL,
  title_gu VARCHAR(500) NULL,
  generated TINYINT(1) NOT NULL DEFAULT 0,
  section_json LONGTEXT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_material_topic (material_id, topic_order),
  CONSTRAINT fk_topics_material
    FOREIGN KEY (material_id) REFERENCES materials(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default login: admin / admin123
INSERT INTO users (username, password_hash)
SELECT 'admin', '$2y$10$ZNKz42Su52ACHwGjgs5CXeg4YPW1mbimEQkMSlZMLt.61Y6oPYmQm'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');