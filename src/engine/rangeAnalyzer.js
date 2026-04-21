/**
 * RANGE ANALYZER ENGINE
 * Analisa todas as 169 mãos e classifica cada uma por ação recomendada.
 * Gera dados para exibição de ranges por ação (fold/call/3bet/allin).
 *
 * NÃO modifica nenhum engine existente. Reutiliza simulateScenario.
 */

import { handStrength, handCategory } from './cards.js';
import {
  getOpenRange, getBBDefenseRange, getPushRange, isInRange,
  getValidPositions,
} from './ranges.js';

// ──────────── Constantes ────────────

const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];

const RAISER_RANGE_WIDTH = {
  'UTG': 0.10, 'UTG+1': 0.12, 'MP': 0.15, 'LJ': 0.18,
  'HJ': 0.22, 'CO': 0.28, 'BTN': 0.40, 'SB': 0.35,
};

const TOURNAMENT_PHASE_ADJUSTMENTS = {
  early:  { rangeMultiplier: 0.85, aggression: 0.9,  icmPressure: 0 },
  middle: { rangeMultiplier: 1.0,  aggression: 1.0,  icmPressure: 0.1 },
  bubble: { rangeMultiplier: 0.7,  aggression: 0.75, icmPressure: 0.5 },
  final:  { rangeMultiplier: 1.15, aggression: 1.2,  icmPressure: 0.3 },
};

// ──────────── Gera todas as 169 notações de mão ────────────

function getAllHandNotations() {
  const hands = [];
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      let notation;
      if (i === j) notation = `${RANKS[i]}${RANKS[j]}`;
      else if (i < j) notation = `${RANKS[i]}${RANKS[j]}s`;
      else notation = `${RANKS[j]}${RANKS[i]}o`;
      hands.push(notation);
    }
  }
  return hands;
}

// ──────────── Bônus por posição do raiser ────────────

function raiserPositionBonus(raiserPosition) {
  const width = RAISER_RANGE_WIDTH[raiserPosition] || 0.20;
  return Math.round(width * 30);
}

// ──────────── Analisa situação ────────────

function analyzeSituation(actions, heroPosition, positions) {
  const hasRaiser = actions.some(a => a.action === 'raise' || a.action === '3bet');
  const hasLimper = actions.some(a => a.action === 'call');
  const has3Bet = actions.some(a => a.action === '3bet');
  const raiserPosition = actions.find(a => a.action === 'raise')?.position;
  const numCallers = actions.filter(a => a.action === 'call').length;
  const allFolded = actions.length > 0 && actions.every(a => a.action === 'fold');
  const raiseSize = actions.find(a => a.action === 'raise')?.sizeBB || 2.5;
  const threebetSize = actions.find(a => a.action === '3bet')?.sizeBB || 7;

  let type;
  if (has3Bet) type = 'facing_3bet';
  else if (hasRaiser) type = 'facing_raise';
  else if (hasLimper && !hasRaiser) type = 'facing_limp';
  else type = 'open';

  return {
    type, hasRaiser, hasLimper, has3Bet, raiserPosition,
    numCallers, allFolded, raiseSize, threebetSize,
  };
}

// ──────────── Calcula pot ────────────

function calculatePot(blinds, ante, actions, numPlayers) {
  let pot = blinds.sb + blinds.bb + (ante * numPlayers);
  for (const a of actions) {
    if (a.action === 'raise' && a.sizeBB) pot += a.sizeBB;
    else if (a.action === 'raise') pot += 2.5;
    else if (a.action === 'call' && a.sizeBB) pot += a.sizeBB;
    else if (a.action === 'call') pot += 2.5;
    else if (a.action === '3bet' && a.sizeBB) pot += a.sizeBB;
    else if (a.action === '3bet') pot += 7;
    else if (a.action === 'allin' && a.sizeBB) pot += a.sizeBB;
  }
  return pot;
}

// ──────────── Classifica uma mão individual para ação ────────────

function classifyHandAction(hand, params) {
  const {
    gameType, heroPosition, heroStack, blinds, ante,
    avgStack, tournamentPhase, actions,
  } = params;

  const strength = handStrength(hand);
  const category = handCategory(hand);
  const positions = getValidPositions(gameType);
  const situation = analyzeSituation(actions, heroPosition, positions);
  const pot = calculatePot(blinds, ante, actions, positions.length);

  const phaseAdj = gameType !== 'cash'
    ? TOURNAMENT_PHASE_ADJUSTMENTS[tournamentPhase] || TOURNAMENT_PHASE_ADJUSTMENTS.middle
    : { rangeMultiplier: 1, aggression: 1, icmPressure: 0 };

  // ── SHORT STACK PUSH/FOLD ──
  if (heroStack <= 15 && (gameType === 'mtt' || gameType === 'spin')) {
    if (situation.type === 'facing_raise' || situation.type === 'facing_3bet') {
      if (strength >= 75) return { action: 'allin', reason: 'premium_push' };
      const bonus = raiserPositionBonus(situation.raiserPosition);
      if (strength + bonus >= 70) return { action: 'allin', reason: 'push_vs_late' };
      return { action: 'fold', reason: 'fold_short_vs_raise' };
    }
    const pushRange = getPushRange(heroPosition, heroStack);
    if (pushRange && isInRange(hand, pushRange)) return { action: 'allin', reason: 'push_chart' };
    if (strength >= 62) return { action: 'allin', reason: 'push_strong' };
    return { action: 'fold', reason: 'fold_short' };
  }

  // ── FACING 3-BET ──
  if (situation.type === 'facing_3bet') {
    if (strength >= 77) return { action: 'allin', reason: '4bet_premium' };
    if (strength >= 66 && heroStack <= 30) return { action: 'allin', reason: 'shove_vs_3bet' };
    if (strength >= 60) return { action: 'call', reason: 'call_vs_3bet' };
    if (strength >= 50 && heroStack >= 60) return { action: 'call', reason: 'speculative_vs_3bet' };
    return { action: 'fold', reason: 'fold_vs_3bet' };
  }

  // ── OPEN ──
  if (situation.type === 'open') {
    const openRange = getOpenRange(heroPosition, gameType);
    const inOpenRange = isInRange(hand, openRange);
    const effectiveStrength = strength * phaseAdj.rangeMultiplier;
    if (inOpenRange || effectiveStrength >= 58) {
      return { action: 'raise', reason: 'open_raise' };
    }
    return { action: 'fold', reason: 'fold_open' };
  }

  // ── FACING RAISE ──
  if (situation.type === 'facing_raise') {
    const raiserPos = situation.raiserPosition;
    const bonus = raiserPositionBonus(raiserPos);
    const effectiveStrength = strength + bonus;

    // Premium → 3-bet
    if (strength >= 77) return { action: '3bet', reason: '3bet_premium' };

    // BB defense
    if (heroPosition === 'BB') {
      const bbRanges = getBBDefenseRange(gameType);
      if (bbRanges.threebet && isInRange(hand, bbRanges.threebet)) {
        return { action: '3bet', reason: 'bb_3bet' };
      }
      if (bbRanges.call && isInRange(hand, bbRanges.call)) {
        return { action: 'call', reason: 'bb_call' };
      }
      if (effectiveStrength >= 62) return { action: 'call', reason: 'bb_call_expanded' };
      if (strength >= 44 && heroStack >= 40 && bonus >= 8) return { action: 'call', reason: 'bb_implied' };
      return { action: 'fold', reason: 'bb_fold' };
    }

    // SB defense
    if (heroPosition === 'SB') {
      if (heroStack <= 25 && (gameType === 'mtt' || gameType === 'spin')) {
        if (effectiveStrength >= 68) return { action: 'allin', reason: 'sb_shove' };
        if (effectiveStrength >= 60) return { action: '3bet', reason: 'sb_3bet' };
        return { action: 'fold', reason: 'sb_fold' };
      }
      if (effectiveStrength >= 68) return { action: '3bet', reason: 'sb_3bet' };
      if (effectiveStrength >= 55) return { action: 'call', reason: 'sb_call' };
      if (strength >= 46 && heroStack >= 60 && bonus >= 8) return { action: 'call', reason: 'sb_speculative' };
      return { action: 'fold', reason: 'sb_fold' };
    }

    // Other positions
    if (heroStack >= 15 && heroStack <= 25 && (gameType === 'mtt' || gameType === 'spin')) {
      if (effectiveStrength >= 68) return { action: 'allin', reason: '3bet_shove' };
      if (effectiveStrength >= 58) return { action: 'call', reason: 'call_medium' };
      return { action: 'fold', reason: 'fold_medium' };
    }

    if (effectiveStrength >= 75) return { action: '3bet', reason: '3bet_value' };

    const inPosition = ['BTN', 'CO', 'HJ'].includes(heroPosition);
    if (inPosition) {
      if (effectiveStrength >= 58) return { action: 'call', reason: 'ip_call' };
      if (strength >= 44 && heroStack >= 60) return { action: 'call', reason: 'speculative_ip' };
    }

    if (effectiveStrength >= 65) return { action: '3bet', reason: '3bet_oop' };
    return { action: 'fold', reason: 'fold_vs_raise' };
  }

  // ── FACING LIMP ──
  if (situation.type === 'facing_limp') {
    if (strength >= 50) return { action: 'raise', reason: 'iso_raise' };
    if (strength >= 40 && heroPosition === 'BB') return { action: 'call', reason: 'bb_check' };
    if (strength >= 44 && ['BTN', 'CO', 'SB'].includes(heroPosition)) return { action: 'call', reason: 'call_limp' };
    return { action: 'fold', reason: 'fold_limp' };
  }

  // Fallback
  if (strength >= 60) return { action: 'raise', reason: 'default_raise' };
  if (strength >= 45) return { action: 'call', reason: 'default_call' };
  return { action: 'fold', reason: 'default_fold' };
}

// ──────────── Calcula EV para uma mão/ação ────────────

function calculateEVForHand(hand, action, params) {
  const { blinds, ante, actions, heroStack } = params;
  const positions = getValidPositions(params.gameType);
  const situation = analyzeSituation(actions, params.heroPosition, positions);
  const pot = calculatePot(blinds, ante, actions, positions.length);
  const strength = handStrength(hand);

  if (action === 'fold') return 0;

  const investBB = action === 'raise' ? 2.5
    : action === '3bet' ? 7
    : action === 'allin' ? heroStack
    : situation.raiseSize || 2.5;

  const winRate = strength / 100;
  const potAfter = pot + investBB;
  return Math.round(((winRate * potAfter) - ((1 - winRate) * investBB)) * 10) / 10;
}

// ──────────── Gera explicação para uma mão clicada ────────────

export function generateHandExplanation(hand, params) {
  const { gameType, heroPosition, heroStack, actions } = params;
  const positions = getValidPositions(gameType);
  const situation = analyzeSituation(actions, heroPosition, positions);
  const classification = classifyHandAction(hand, params);
  const strength = handStrength(hand);
  const category = handCategory(hand);
  const ev = calculateEVForHand(hand, classification.action, params);

  const actionNames = { fold: 'Fold', call: 'Call', raise: 'Raise', '3bet': '3-Bet', allin: 'All-in' };
  const categoryNames = { premium: 'Premium', strong: 'Forte', medium: 'Média', weak: 'Fraca', trash: 'Lixo' };

  const lines = [];
  lines.push(`**${hand}** → ${actionNames[classification.action]}`);
  lines.push(`Categoria: ${categoryNames[category]} (${strength}% equity)`);
  lines.push(`EV: ${ev > 0 ? '+' : ''}${ev} BB`);

  // Por que está nesta ação
  if (classification.action === 'fold') {
    if (situation.type === 'facing_raise') {
      const raiserPos = situation.raiserPosition || '?';
      const width = RAISER_RANGE_WIDTH[raiserPos];
      lines.push(`${hand} não tem equity suficiente vs range de open do ${raiserPos}${width ? ` (≈${Math.round(width * 100)}%)` : ''}.`);
    } else if (situation.type === 'open') {
      lines.push(`${hand} não está no range de abertura do ${heroPosition}.`);
    } else {
      lines.push(`${hand} não tem equity suficiente nesta situação.`);
    }
  } else if (classification.action === 'call') {
    if (heroPosition === 'BB') {
      lines.push(`Do BB, ${hand} tem equity suficiente para defender com desconto.`);
    } else if (['BTN', 'CO'].includes(heroPosition)) {
      lines.push(`Em posição (${heroPosition}), ${hand} se beneficia de vantagem posicional pós-flop.`);
    } else {
      lines.push(`${hand} tem equity para call, mas não o suficiente para raise/3-bet.`);
    }
  } else if (classification.action === '3bet') {
    if (situation.type === 'facing_raise') {
      const raiserPos = situation.raiserPosition || '?';
      lines.push(`${hand} domina parte do range de open do ${raiserPos}. 3-bet por valor/proteção.`);
    } else {
      lines.push(`${hand} é forte o suficiente para 3-bet nesta situação.`);
    }
  } else if (classification.action === 'raise') {
    lines.push(`${hand} está no range de abertura do ${heroPosition}. Raise padrão.`);
  } else if (classification.action === 'allin') {
    if (heroStack <= 15) {
      lines.push(`Com ${heroStack}BB, push/fold é a estratégia correta. ${hand} tem equity para push.`);
    } else {
      lines.push(`${hand} é forte o suficiente para all-in nesta situação (${heroStack}BB).`);
    }
  }

  // Sizing suggestion
  if (classification.action === '3bet') {
    const inPos = ['BTN', 'CO'].includes(heroPosition);
    const sizeLow = inPos ? 6 : 7;
    const sizeHigh = inPos ? 8 : 9;
    lines.push(`Sizing sugerido: ${sizeLow}–${sizeHigh} BB`);
  } else if (classification.action === 'raise' && situation.type === 'open') {
    lines.push(`Sizing sugerido: 2.2–2.5 BB`);
  } else if (classification.action === 'raise' && situation.type === 'facing_limp') {
    const numLimpers = situation.numCallers || 1;
    const size = 3 + numLimpers;
    lines.push(`Sizing sugerido: ${size}–${size + 1} BB (iso-raise)`);
  }

  // Contra qual range joga
  if (situation.type === 'facing_raise' && situation.raiserPosition) {
    const raiserRange = getOpenRange(situation.raiserPosition, gameType);
    const rangeSize = raiserRange ? raiserRange.length : 0;
    const rangePct = Math.round((rangeSize / 169) * 100);
    lines.push(`Range do oponente: ≈${rangePct}% (${rangeSize} combos)`);
  }

  return {
    hand,
    action: classification.action,
    actionName: actionNames[classification.action],
    strength,
    category,
    categoryName: categoryNames[category],
    ev,
    reason: classification.reason,
    explanation: lines.join('\n'),
  };
}

// ──────────── API PRINCIPAL: Analisa range completo ────────────

/**
 * Analisa todas as 169 mãos e classifica cada uma por ação recomendada.
 *
 * @param {Object} params - Mesmos parâmetros que simulateScenario
 * @returns {Object} { actionRanges, actionStats, grid }
 */
export function analyzeFullRange(params) {
  const {
    gameType = 'mtt',
    heroPosition,
    heroStack,
    blinds = { sb: 0.5, bb: 1 },
    ante = 0,
    avgStack = 0,
    tournamentPhase = 'middle',
    actions = [],
  } = params;

  const classifyParams = {
    gameType, heroPosition, heroStack, blinds, ante,
    avgStack, tournamentPhase, actions,
  };

  const allHands = getAllHandNotations();

  // Classifica cada mão
  const handActions = {};
  const actionRanges = {
    fold: [],
    call: [],
    raise: [],
    '3bet': [],
    allin: [],
  };

  for (const hand of allHands) {
    const classification = classifyHandAction(hand, classifyParams);
    const action = classification.action;
    handActions[hand] = action;

    if (!actionRanges[action]) actionRanges[action] = [];
    actionRanges[action].push(hand);
  }

  // Estatísticas por ação
  const total = 169;
  const actionStats = {};

  for (const [action, hands] of Object.entries(actionRanges)) {
    if (hands.length === 0) {
      actionStats[action] = { count: 0, frequency: 0, avgEV: 0 };
      continue;
    }

    const evs = hands.map(h => calculateEVForHand(h, action, classifyParams));
    const avgEV = evs.reduce((s, v) => s + v, 0) / evs.length;

    actionStats[action] = {
      count: hands.length,
      frequency: Math.round((hands.length / total) * 100),
      avgEV: Math.round(avgEV * 10) / 10,
    };
  }

  // Gera grid 13x13 com ação para cada mão
  const grid = [];
  for (let i = 0; i < 13; i++) {
    const row = [];
    for (let j = 0; j < 13; j++) {
      let notation;
      if (i === j) notation = `${RANKS[i]}${RANKS[j]}`;
      else if (i < j) notation = `${RANKS[i]}${RANKS[j]}s`;
      else notation = `${RANKS[j]}${RANKS[i]}o`;

      row.push({
        notation,
        action: handActions[notation],
        isPair: i === j,
        isSuited: i < j,
        isOffsuit: i > j,
        strength: handStrength(notation),
      });
    }
    grid.push(row);
  }

  return { actionRanges, actionStats, grid, handActions };
}
