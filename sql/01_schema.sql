-- Hub Central CHC - estructura MySQL
-- Ejecutar primero: mysql -u root -p < sql/01_schema.sql

SET NAMES utf8mb4;
CREATE DATABASE IF NOT EXISTS hubcentral_chc
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE hubcentral_chc;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS extensions;
DROP TABLE IF EXISTS locations;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username VARCHAR(80) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(160) NOT NULL DEFAULT '',
  role ENUM('admin') NOT NULL DEFAULT 'admin',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE locations (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  branch_number INT UNSIGNED NULL,
  store_type VARCHAR(20) NOT NULL DEFAULT 'HC',
  name VARCHAR(180) NOT NULL,
  municipality VARCHAR(140) NOT NULL DEFAULT '',
  maps_url VARCHAR(500) NULL,
  status VARCHAR(80) NOT NULL DEFAULT 'Activa',
  is_pending TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_locations_branch_number (branch_number),
  KEY idx_locations_name (name),
  KEY idx_locations_municipality (municipality),
  KEY idx_locations_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE extensions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  extension VARCHAR(20) NOT NULL,
  first_name VARCHAR(120) NOT NULL DEFAULT '',
  last_name VARCHAR(120) NOT NULL DEFAULT '',
  display_name VARCHAR(180) NOT NULL DEFAULT '',
  office_location VARCHAR(120) NOT NULL DEFAULT '',
  phone_model VARCHAR(120) NOT NULL DEFAULT '',
  type ENUM('OFICINA','SUCURSAL','PANADERIA','VIGILANCIA','SIN TIPO') NOT NULL DEFAULT 'SIN TIPO',
  location_id INT UNSIGNED NULL,
  is_visible TINYINT(1) NOT NULL DEFAULT 1,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_extensions_extension (extension),
  KEY idx_extensions_type (type),
  KEY idx_extensions_visible (is_visible),
  KEY idx_extensions_location_id (location_id),
  CONSTRAINT fk_extensions_location
    FOREIGN KEY (location_id) REFERENCES locations(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
