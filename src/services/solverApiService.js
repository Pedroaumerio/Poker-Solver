/**
 * SOLVER API SERVICE
 * Camada de serviço para o solver de CFR pós-flop (backend real).
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Envia um cenário pós-flop para o backend resolver via CFR.
 * @param {Object} scenario
 * @returns {Promise<Object>} resultado do solve (estratégia, EV, etc.)
 */
export async function solvePostflopScenario(scenario) {
  const response = await fetch(`${API_URL}/solver/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scenario),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.error || `Erro ${response.status} ao resolver cenário`;
    const err = new Error(message);
    err.details = body.details;
    throw err;
  }

  return body.data;
}
