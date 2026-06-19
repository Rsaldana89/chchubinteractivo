-- Hub Central CHC - usuario administrador de aplicación
-- Usuario: admin
-- Contraseña inicial: B1Admin

SET NAMES utf8mb4;
USE hubcentral_chc;

INSERT INTO users (username, password_hash, full_name, role, is_active)
VALUES ('admin', 'scrypt$16384$8$1$FVSEnB8XviQhva1/00Z5wg==$IO8vHWeQBaseJUxd07bpE8vJqhhs/ndccOR6/aczHJS2I+5ZnNywPnYB5k3v5yVwOCwbFdaiD8vXoNkSE5njJA==', 'Administrador CHC', 'admin', 1)
ON DUPLICATE KEY UPDATE
  password_hash = VALUES(password_hash),
  full_name = VALUES(full_name),
  role = VALUES(role),
  is_active = VALUES(is_active);
