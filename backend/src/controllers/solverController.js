/**
 * SOLVER CONTROLLER
 * Entrada/saída HTTP para o solver de CFR pós-flop.
 */

import { solveScenario } from 'poker-solver-engine';

const SolverController = {
  /**
   * POST /api/solver/solve
   * Body: { players, board, potPre, betSizes?, maxRaisesPerStreet?, iterations?, timeBudgetMs? }
   */
  async solve(req, res) {
    try {
      const result = solveScenario(req.body);
      res.json({ data: result });
    } catch (error) {
      if (error.validation) {
        return res.status(400).json({ error: error.message, details: error.validation });
      }
      console.error('Erro ao resolver cenário:', error);
      res.status(500).json({ error: error.message || 'Erro interno ao resolver cenário' });
    }
  },
};

export default SolverController;
