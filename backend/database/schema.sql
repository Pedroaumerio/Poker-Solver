-- =============================================
-- POKER SOLVER STUDY — Schema MySQL
-- Compatível com MySQL Workbench
-- =============================================

-- Cria o banco de dados
CREATE DATABASE IF NOT EXISTS poker_solver
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE poker_solver;

-- =============================================
-- Tabela: users (preparado para futuro)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Insere usuário default
INSERT IGNORE INTO users (id, username) VALUES (1, 'player');

-- =============================================
-- Tabela: hand_history
-- Armazena cada mão jogada com resultado e EV
-- =============================================
CREATE TABLE IF NOT EXISTS hand_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL DEFAULT 1,
  game_type ENUM('mtt', 'spin', 'cash') NOT NULL,
  notation VARCHAR(10) NOT NULL COMMENT 'Ex: AKs, QJo, TT',
  position VARCHAR(10) NOT NULL COMMENT 'Ex: UTG, CO, BTN, BB',
  stack_bb DECIMAL(10,1) COMMENT 'Stack em Big Blinds',
  player_action ENUM('fold', 'call', 'raise', '3bet', 'allin') NOT NULL,
  is_correct TINYINT(1) NOT NULL DEFAULT 0,
  ev DECIMAL(10,2) DEFAULT 0 COMMENT 'Expected Value da decisão',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Índices para queries rápidas
  INDEX idx_user_id (user_id),
  INDEX idx_game_type (game_type),
  INDEX idx_created_at (created_at),
  INDEX idx_user_game (user_id, game_type),

  -- Chave estrangeira
  CONSTRAINT fk_history_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- Tabela: game_sessions (sessões de jogo)
-- =============================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL DEFAULT 1,
  game_type ENUM('mtt', 'spin', 'cash') NOT NULL,
  total_hands INT DEFAULT 0,
  correct INT DEFAULT 0,
  wrong INT DEFAULT 0,
  accuracy DECIMAL(5,1) DEFAULT 0,
  avg_ev DECIMAL(10,2) DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,

  INDEX idx_session_user (user_id),

  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB;
