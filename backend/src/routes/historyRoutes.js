/**
 * HISTORY ROUTES
 * Rotas da API para gerenciamento de histórico de mãos.
 */

import { Router } from 'express';
import HistoryController from '../controllers/historyController.js';

const router = Router();

// GET    /api/history              — Lista histórico (paginação via ?page=1&limit=20)
router.get('/', HistoryController.getHistory);

// POST   /api/history              — Registra nova mão
router.post('/', HistoryController.createHistory);

// GET    /api/history/stats        — Estatísticas gerais
router.get('/stats', HistoryController.getStats);

// GET    /api/history/stats/game-type — Estatísticas por tipo de jogo
router.get('/stats/game-type', HistoryController.getStatsByGameType);

// DELETE /api/history              — Limpa todo o histórico
router.delete('/', HistoryController.clearHistory);

export default router;
