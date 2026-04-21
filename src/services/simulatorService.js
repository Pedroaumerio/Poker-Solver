/**
 * SIMULATOR SERVICE
 * Camada de serviço para o simulador de situações personalizadas.
 */

import { simulateScenario, isValidHandNotation } from '../engine/simulator';

/**
 * Executa uma simulação de cenário personalizado.
 * @param {Object} params - Parâmetros do cenário
 * @returns {Object} Resultado da simulação
 */
export function runSimulation(params) {
  return simulateScenario(params);
}

/**
 * Valida se a notação de mão é válida.
 * @param {string} hand
 * @returns {boolean}
 */
export function validateHand(hand) {
  return isValidHandNotation(hand);
}

export { isValidHandNotation };
