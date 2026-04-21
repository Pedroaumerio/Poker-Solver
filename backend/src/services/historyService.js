/**
 * HISTORY SERVICE
 * Regras de negócio do histórico de mãos.
 * Camada entre Controller e Model.
 */

import HistoryModel from '../models/historyModel.js';

const HistoryService = {
  /**
   * Busca todo o histórico de mãos.
   */
  async getAllHistory(userId) {
    return HistoryModel.getAll(userId);
  },

  /**
   * Busca histórico paginado.
   */
  async getHistoryPaginated(userId, page, limit) {
    return HistoryModel.getPaginated(userId, page, limit);
  },

  /**
   * Registra uma nova mão no histórico.
   * Valida dados antes de inserir.
   */
  async recordHand(entry) {
    // Validação
    const validActions = ['fold', 'call', 'raise', '3bet', 'allin'];
    const validGameTypes = ['mtt', 'spin', 'cash'];

    if (!validActions.includes(entry.playerAction)) {
      throw new Error(`Ação inválida: ${entry.playerAction}`);
    }

    if (!validGameTypes.includes(entry.gameType)) {
      throw new Error(`Tipo de jogo inválido: ${entry.gameType}`);
    }

    if (!entry.notation || !entry.position) {
      throw new Error('Notação e posição são obrigatórios');
    }

    return HistoryModel.create(entry);
  },

  /**
   * Retorna estatísticas gerais.
   */
  async getStats(userId) {
    return HistoryModel.getStats(userId);
  },

  /**
   * Retorna estatísticas por tipo de jogo.
   */
  async getStatsByGameType(userId) {
    return HistoryModel.getStatsByGameType(userId);
  },

  /**
   * Limpa todo o histórico.
   */
  async clearHistory(userId) {
    return HistoryModel.clearAll(userId);
  },
};

export default HistoryService;
