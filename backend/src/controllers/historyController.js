/**
 * HISTORY CONTROLLER
 * Entrada/saída HTTP para rotas de histórico.
 * Responsável apenas por: receber request → chamar service → enviar response.
 */

import HistoryService from '../services/historyService.js';

const HistoryController = {
  /**
   * GET /api/history
   * Retorna histórico (com paginação opcional).
   */
  async getHistory(req, res) {
    try {
      const { page, limit } = req.query;

      if (page) {
        const result = await HistoryService.getHistoryPaginated(
          1,
          parseInt(page) || 1,
          parseInt(limit) || 20
        );
        return res.json(result);
      }

      const history = await HistoryService.getAllHistory(1);
      res.json({ data: history });
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      res.status(500).json({ error: 'Erro interno ao buscar histórico' });
    }
  },

  /**
   * POST /api/history
   * Registra uma nova mão no histórico.
   */
  async createHistory(req, res) {
    try {
      const entry = await HistoryService.recordHand(req.body);
      res.status(201).json({ data: entry });
    } catch (error) {
      if (error.message.includes('inválid') || error.message.includes('obrigatóri')) {
        return res.status(400).json({ error: error.message });
      }
      console.error('Erro ao registrar mão:', error);
      res.status(500).json({ error: 'Erro interno ao registrar mão' });
    }
  },

  /**
   * GET /api/history/stats
   * Retorna estatísticas gerais.
   */
  async getStats(req, res) {
    try {
      const stats = await HistoryService.getStats(1);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({ error: 'Erro interno ao buscar estatísticas' });
    }
  },

  /**
   * GET /api/history/stats/game-type
   * Retorna estatísticas agrupadas por tipo de jogo.
   */
  async getStatsByGameType(req, res) {
    try {
      const stats = await HistoryService.getStatsByGameType(1);
      res.json({ data: stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas por tipo:', error);
      res.status(500).json({ error: 'Erro interno ao buscar estatísticas' });
    }
  },

  /**
   * DELETE /api/history
   * Limpa todo o histórico.
   */
  async clearHistory(req, res) {
    try {
      await HistoryService.clearHistory(1);
      res.json({ message: 'Histórico limpo com sucesso' });
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
      res.status(500).json({ error: 'Erro interno ao limpar histórico' });
    }
  },
};

export default HistoryController;
