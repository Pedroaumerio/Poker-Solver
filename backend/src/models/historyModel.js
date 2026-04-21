/**
 * HISTORY MODEL
 * Queries MySQL para o histórico de mãos jogadas.
 */

import pool from '../../database/connection.js';

const HistoryModel = {
  /**
   * Retorna todo o histórico de um jogador.
   * @param {number} userId - ID do jogador (futuro)
   * @returns {Promise<Array>}
   */
  async getAll(userId = 1) {
    const [rows] = await pool.execute(
      'SELECT * FROM hand_history WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  /**
   * Retorna histórico paginado.
   * @param {number} userId
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<{data: Array, total: number}>}
   */
  async getPaginated(userId = 1, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const [rows] = await pool.execute(
      'SELECT * FROM hand_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [userId, limit, offset]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM hand_history WHERE user_id = ?',
      [userId]
    );

    return { data: rows, total };
  },

  /**
   * Insere uma nova entrada de histórico.
   * @param {Object} entry
   * @returns {Promise<Object>}
   */
  async create(entry) {
    const { userId = 1, gameType, notation, position, stackBB, playerAction, isCorrect, ev } = entry;

    const [result] = await pool.execute(
      `INSERT INTO hand_history 
       (user_id, game_type, notation, position, stack_bb, player_action, is_correct, ev)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, gameType, notation, position, stackBB, playerAction, isCorrect ? 1 : 0, ev]
    );

    return { id: result.insertId, ...entry };
  },

  /**
   * Retorna estatísticas do jogador.
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getStats(userId = 1) {
    const [[stats]] = await pool.execute(
      `SELECT 
        COUNT(*) as total_hands,
        SUM(is_correct) as correct,
        COUNT(*) - SUM(is_correct) as wrong,
        ROUND(AVG(is_correct) * 100, 1) as accuracy,
        ROUND(AVG(ev), 2) as avg_ev
       FROM hand_history 
       WHERE user_id = ?`,
      [userId]
    );

    return stats;
  },

  /**
   * Retorna estatísticas agrupadas por tipo de jogo.
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async getStatsByGameType(userId = 1) {
    const [rows] = await pool.execute(
      `SELECT 
        game_type,
        COUNT(*) as total_hands,
        SUM(is_correct) as correct,
        ROUND(AVG(is_correct) * 100, 1) as accuracy,
        ROUND(AVG(ev), 2) as avg_ev
       FROM hand_history 
       WHERE user_id = ?
       GROUP BY game_type`,
      [userId]
    );

    return rows;
  },

  /**
   * Limpa todo o histórico do jogador.
   * @param {number} userId
   * @returns {Promise<void>}
   */
  async clearAll(userId = 1) {
    await pool.execute(
      'DELETE FROM hand_history WHERE user_id = ?',
      [userId]
    );
  },
};

export default HistoryModel;
