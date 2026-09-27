/**
 * SOLVER ROUTES
 * Rotas da API para o solver de CFR pós-flop.
 */

import { Router } from 'express';
import SolverController from '../controllers/solverController.js';

const router = Router();

// POST /api/solver/solve — resolve um cenário pós-flop (flop -> river)
router.post('/solve', SolverController.solve);

export default router;
