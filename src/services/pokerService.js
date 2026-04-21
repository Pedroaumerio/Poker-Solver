/**
 * POKER SERVICE — Camada de serviço
 * 
 * Abstrai o acesso ao engine de poker, provendo uma API limpa
 * para os hooks e componentes consumirem.
 * 
 * Caso o projeto evolua para ter um backend, basta substituir
 * as chamadas diretas ao engine por fetch/axios para a API.
 */

import { generateScenario, analyzeDecision } from '../engine/solver';

/**
 * Gera um novo cenário de poker baseado no tipo de jogo.
 * 
 * @param {'mtt'|'spin'|'cash'} gameType - Formato do jogo
 * @returns {Object} Cenário completo com cartas, posição, jogadores, pot, etc.
 */
export function createScenario(gameType) {
  return generateScenario(gameType);
}

/**
 * Analisa a decisão do jogador comparando com o range GTO.
 * 
 * @param {Object} scenario - Cenário gerado por createScenario
 * @param {'fold'|'call'|'raise'|'3bet'|'allin'} action - Ação escolhida
 * @returns {Object} Resultado da análise (isCorrect, ev, equity, explanation, etc.)
 */
export function evaluateAction(scenario, action) {
  return analyzeDecision(scenario, action);
}
