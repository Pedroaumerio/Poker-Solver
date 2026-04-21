/**
 * POKER SIMULATOR ENGINE
 * Analisa situações personalizadas usando heurísticas
 * baseadas em ranges, stack depth, posição e tipo de jogo.
 *
 * NÃO é um solver real — usa heurísticas GTO simplificadas.
 */

import { handStrength, handCategory } from './cards.js';
import {
  getOpenRange, getBBDefenseRange, getPushRange, isInRange,
  getValidPositions, getOpenPercentage,
} from './ranges.js';

// ──────────── Ajustes por fase do torneio ────────────

const TOURNAMENT_PHASE_ADJUSTMENTS = {
  early: { rangeMultiplier: 0.85, aggression: 0.9, icmPressure: 0 },
  middle: { rangeMultiplier: 1.0, aggression: 1.0, icmPressure: 0.1 },
  bubble: { rangeMultiplier: 0.7, aggression: 0.75, icmPressure: 0.5 },
  final: { rangeMultiplier: 1.15, aggression: 1.2, icmPressure: 0.3 },
};

// ──────────── Largura de range por posição do raiser ────────────
// Quanto mais tarde a posição, mais largo o range → mais fácil defender.
// Valores representam % aproximado de mãos no range de open raise.

const RAISER_RANGE_WIDTH = {
  'UTG': 0.10,
  'UTG+1': 0.12,
  'MP': 0.15,
  'LJ': 0.18,
  'HJ': 0.22,
  'CO': 0.28,
  'BTN': 0.40,
  'SB': 0.35,
};

/**
 * Calcula um bônus de defesa baseado na posição do raiser.
 * Quanto mais late position o raiser, mais wide seu range,
 * então o hero pode defender com mãos mais fracas.
 *
 * Retorna valor de 0 a ~15 que é somado ao strength efetivo.
 */
function raiserPositionBonus(raiserPosition) {
  const width = RAISER_RANGE_WIDTH[raiserPosition] || 0.20;
  // BTN (0.40) → bônus ≈ 12, UTG (0.10) → bônus ≈ 0
  return Math.round(width * 30);
}

// ──────────── Simulação principal ────────────

/**
 * Simula uma situação personalizada de poker.
 *
 * @param {Object} params
 * @param {string} params.gameType       - 'mtt' | 'spin' | 'cash'
 * @param {string} params.heroPosition   - Posição do hero (UTG, CO, BTN, etc.)
 * @param {number} params.heroStack      - Stack do hero em BB
 * @param {Object} params.blinds         - { sb: 0.5, bb: 1 }
 * @param {number} params.ante           - Ante (em BB)
 * @param {number} params.avgStack       - Stack médio da mesa
 * @param {string} params.tournamentPhase - 'early' | 'middle' | 'bubble' | 'final'
 * @param {Array}  params.actions        - Ações anteriores [{ position, action, sizeBB }]
 * @param {string} params.hand           - Notação da mão (ex: 'AKs', 'QJo', 'TT')
 *
 * @returns {Object} Resultado da simulação
 */
export function simulateScenario(params) {
  const {
    gameType = 'mtt',
    heroPosition,
    heroStack,
    blinds = { sb: 0.5, bb: 1 },
    ante = 0,
    avgStack = 0,
    tournamentPhase = 'middle',
    actions = [],
    hand,
  } = params;

  if (!hand || !heroPosition) {
    throw new Error('Mão e posição são obrigatórios');
  }

  const strength = handStrength(hand);
  const category = handCategory(hand);
  const positions = getValidPositions(gameType);

  // Determina situação com base nas ações anteriores
  const situation = analyzeSituation(actions, heroPosition, positions);

  // Calcula pot atual
  const pot = calculatePot(blinds, ante, actions, positions.length);

  // Obtém a recomendação
  const recommendation = getRecommendation({
    gameType, heroPosition, heroStack, strength, category,
    situation, pot, blinds, avgStack, tournamentPhase, hand, actions,
  });

  // Calcula valores
  const equity = calculateDetailedEquity(hand, heroPosition, situation, gameType);
  const ev = calculateDetailedEV(recommendation, strength, pot, heroStack, situation);
  const frequency = calculateFrequency(recommendation, strength, situation, gameType);
  const idealRange = getSimulatorRange(gameType, heroPosition, heroStack, situation);
  const inRange = isInRange(hand, idealRange);

  // Gera explicação
  const explanation = generateDetailedExplanation({
    ...recommendation, hand, heroPosition, heroStack, gameType,
    tournamentPhase, situation, strength, category, equity, ev, pot, inRange, avgStack,
  });

  return {
    bestAction: recommendation.bestAction,
    alternativeActions: recommendation.alternatives,
    ev: Math.round(ev * 10) / 10,
    frequency,
    equity,
    explanation,
    handStrength: strength,
    handCategory: category,
    idealRange,
    inRange,
    situation: situation.type,
    pot: Math.round(pot * 10) / 10,
  };
}

// ──────────── Análise de situação ────────────

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
  else if (allFolded || actions.length === 0) type = 'open';
  else type = 'open';

  return {
    type,
    hasRaiser,
    hasLimper,
    has3Bet,
    raiserPosition,
    numCallers,
    allFolded,
    raiseSize,
    threebetSize,
  };
}

// ──────────── Cálculo do pot ────────────

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

// ──────────── Recomendação de ação ────────────

function getRecommendation(ctx) {
  const {
    gameType, heroPosition, heroStack, strength, category,
    situation, pot, blinds, avgStack, tournamentPhase, hand, actions,
  } = ctx;

  const phaseAdj = gameType !== 'cash'
    ? TOURNAMENT_PHASE_ADJUSTMENTS[tournamentPhase] || TOURNAMENT_PHASE_ADJUSTMENTS.middle
    : { rangeMultiplier: 1, aggression: 1, icmPressure: 0 };

  // ═══════════ 1. SHORT STACK PUSH/FOLD (≤15 BB em torneio) ═══════════
  if (heroStack <= 15 && (gameType === 'mtt' || gameType === 'spin')) {
    // Facing raise com short stack → push ou fold
    if (situation.type === 'facing_raise' || situation.type === 'facing_3bet') {
      // Premium hands → always push
      if (strength >= 75) {
        return { bestAction: 'allin', alternatives: [], reason: 'push_vs_raise_short' };
      }
      // Strong hands, depends on raiser
      const bonus = raiserPositionBonus(situation.raiserPosition);
      if (strength + bonus >= 70) {
        return { bestAction: 'allin', alternatives: [], reason: 'push_vs_raise_short' };
      }
      return { bestAction: 'fold', alternatives: [], reason: 'fold_vs_raise_short' };
    }

    // Open push
    const pushRange = getPushRange(heroPosition, heroStack);
    if (pushRange && isInRange(hand, pushRange)) {
      return { bestAction: 'allin', alternatives: [], reason: 'push_short_stack' };
    }
    // Mãos fortes que podem não estar na tabela estrita mas são claramente push
    if (strength >= 62) {
      return { bestAction: 'allin', alternatives: [], reason: 'push_short_stack' };
    }
    return { bestAction: 'fold', alternatives: [], reason: 'fold_short_stack' };
  }

  // ═══════════ 2. FACING 3-BET ═══════════
  if (situation.type === 'facing_3bet') {
    return handleFacing3Bet(ctx, phaseAdj);
  }

  // ═══════════ 3. OPEN (primeiro a entrar) ═══════════
  if (situation.type === 'open') {
    return handleOpen(ctx, phaseAdj);
  }

  // ═══════════ 4. FACING RAISE ═══════════
  if (situation.type === 'facing_raise') {
    return handleFacingRaise(ctx, phaseAdj);
  }

  // ═══════════ 5. FACING LIMP ═══════════
  if (situation.type === 'facing_limp') {
    return handleFacingLimp(ctx, phaseAdj);
  }

  // ═══════════ FALLBACK ═══════════
  if (strength >= 60) return { bestAction: 'raise', alternatives: [], reason: 'default_raise' };
  if (strength >= 45) return { bestAction: 'call', alternatives: [], reason: 'default_call' };
  return { bestAction: 'fold', alternatives: [], reason: 'default_fold' };
}

// ──────────── Handler: Facing 3-Bet ────────────

function handleFacing3Bet(ctx, phaseAdj) {
  const { strength, heroStack, hand } = ctx;

  // Premium (AA, KK, QQ, AKs, AKo) → 4-bet/all-in
  if (strength >= 77) {
    return {
      bestAction: 'allin',
      alternatives: heroStack > 40 ? ['raise'] : ['call'],
      reason: 'premium_vs_3bet',
    };
  }

  // Mãos fortes com stack curto → all-in
  if (strength >= 66 && heroStack <= 30) {
    return {
      bestAction: 'allin',
      alternatives: ['call'],
      reason: 'strong_short_vs_3bet',
    };
  }

  // Mãos fortes (JJ-TT, AQs, AQo, AJs, KQs) com stack > 30 → call
  if (strength >= 60) {
    return {
      bestAction: 'call',
      alternatives: strength >= 72 ? ['allin'] : [],
      reason: 'call_vs_3bet',
    };
  }

  // Mãos especulativas com bons implied odds e stack profundo
  if (strength >= 50 && heroStack >= 60) {
    return {
      bestAction: 'call',
      alternatives: [],
      reason: 'speculative_call_vs_3bet',
    };
  }

  return { bestAction: 'fold', alternatives: [], reason: 'fold_vs_3bet' };
}

// ──────────── Handler: Open ────────────

function handleOpen(ctx, phaseAdj) {
  const { heroPosition, gameType, strength, hand, heroStack } = ctx;
  const openRange = getOpenRange(heroPosition, gameType);
  const inOpenRange = isInRange(hand, openRange);
  const effectiveStrength = strength * phaseAdj.rangeMultiplier;

  if (inOpenRange || effectiveStrength >= 58) {
    if (strength >= 77) {
      return {
        bestAction: 'raise',
        alternatives: heroStack <= 20 ? ['allin'] : [],
        reason: 'premium_open',
      };
    }
    return {
      bestAction: 'raise',
      alternatives: [],
      reason: 'standard_open',
    };
  }

  return { bestAction: 'fold', alternatives: [], reason: 'fold_not_in_range' };
}

// ──────────── Handler: Facing Raise (LÓGICA CORRIGIDA) ────────────

function handleFacingRaise(ctx, phaseAdj) {
  const {
    gameType, heroPosition, heroStack, strength, category,
    situation, hand,
  } = ctx;

  const raiserPos = situation.raiserPosition;
  const bonus = raiserPositionBonus(raiserPos);

  // Strength efetivo: strength base + bônus pela posição do raiser
  // Exemplo: AQo (64) vs BTN (bônus 12) = 76 efetivo → joga
  //          AQo (64) vs UTG (bônus 3)  = 67 efetivo → mais marginal
  const effectiveStrength = strength + bonus;

  // ── BB Defense (tratamento especial — usa ranges do engine) ──
  if (heroPosition === 'BB') {
    return handleBBDefense(ctx, bonus);
  }

  // ── SB vs Raise ──
  // SB é uma posição especial: fora de posição pós-flop, mas com desconto de 0.5BB
  if (heroPosition === 'SB') {
    return handleSBvsRaise(ctx, bonus, phaseAdj);
  }

  // ── Outras posições (CO, BTN, HJ, MP, etc.) ──

  // Premium → sempre 3-bet por valor
  if (strength >= 77) {
    return {
      bestAction: '3bet',
      alternatives: heroStack <= 25 ? ['allin'] : [],
      reason: '3bet_value',
    };
  }

  // --- Stack 15-25 BB: zona de 3-bet/fold ---
  if (heroStack >= 15 && heroStack <= 25 && (gameType === 'mtt' || gameType === 'spin')) {
    if (effectiveStrength >= 68) {
      return {
        bestAction: 'allin',
        alternatives: ['3bet'],
        reason: '3bet_shove_medium_stack',
      };
    }
    if (effectiveStrength >= 58) {
      return {
        bestAction: 'call',
        alternatives: ['3bet'],
        reason: 'call_medium_stack',
      };
    }
    return { bestAction: 'fold', alternatives: [], reason: 'fold_vs_raise' };
  }

  // --- Stack > 25 BB: jogo completo ---

  // Mãos fortes (TT+, AK, AQs) → 3-bet
  if (effectiveStrength >= 75) {
    return {
      bestAction: '3bet',
      alternatives: ['call'],
      reason: '3bet_value',
    };
  }

  // Mãos jogáveis em posição (BTN, CO, HJ) → call
  const inPositionVsRaiser = ['BTN', 'CO', 'HJ'].includes(heroPosition);
  if (inPositionVsRaiser) {
    if (effectiveStrength >= 58) {
      return {
        bestAction: 'call',
        alternatives: effectiveStrength >= 68 ? ['3bet'] : [],
        reason: 'position_call',
      };
    }
    // Mãos especulativas com stack profundo
    if (strength >= 44 && heroStack >= 60) {
      return {
        bestAction: 'call',
        alternatives: [],
        reason: 'speculative_call_ip',
      };
    }
  }

  // Fora de posição (MP, UTG, LJ) → threshold mais alto para jogar
  if (effectiveStrength >= 65) {
    return {
      bestAction: '3bet',
      alternatives: ['call'],
      reason: '3bet_oop',
    };
  }

  return { bestAction: 'fold', alternatives: [], reason: 'fold_vs_raise' };
}

// ──────────── Handler: BB Defense (LÓGICA CORRIGIDA) ────────────

function handleBBDefense(ctx, bonus) {
  const { gameType, strength, hand, heroStack, situation } = ctx;
  const bbRanges = getBBDefenseRange(gameType);
  const effectiveStrength = strength + bonus;

  // Premium → SEMPRE 3-bet
  if (strength >= 77) {
    return {
      bestAction: '3bet',
      alternatives: heroStack <= 25 ? ['allin'] : [],
      reason: 'bb_3bet_defense',
    };
  }

  // Mãos no range de 3-bet do BB
  if (bbRanges.threebet && isInRange(hand, bbRanges.threebet)) {
    return {
      bestAction: '3bet',
      alternatives: heroStack <= 25 ? ['allin'] : [],
      reason: 'bb_3bet_defense',
    };
  }

  // Mãos no range de call do BB
  if (bbRanges.call && isInRange(hand, bbRanges.call)) {
    return {
      bestAction: 'call',
      alternatives: effectiveStrength >= 72 ? ['3bet'] : [],
      reason: 'bb_call_defense',
    };
  }

  // Mãos fortes que não estão nas tabelas estáticas mas mereciam ser jogadas
  // (ex: vs BTN aberto, expandimos a defesa)
  if (effectiveStrength >= 62) {
    return {
      bestAction: 'call',
      alternatives: effectiveStrength >= 72 ? ['3bet'] : [],
      reason: 'bb_call_expanded',
    };
  }

  // Mãos com implied odds e stack profundo
  if (strength >= 44 && heroStack >= 40 && bonus >= 8) {
    return {
      bestAction: 'call',
      alternatives: [],
      reason: 'bb_call_implied',
    };
  }

  return { bestAction: 'fold', alternatives: [], reason: 'bb_fold' };
}

// ──────────── Handler: SB vs Raise (LÓGICA NOVA) ────────────

function handleSBvsRaise(ctx, bonus, phaseAdj) {
  const { gameType, strength, hand, heroStack, situation } = ctx;
  const effectiveStrength = strength + bonus;

  // Premium → SEMPRE 3-bet (corrige o bug de AQo vs BTN ser fold)
  if (strength >= 77) {
    return {
      bestAction: '3bet',
      alternatives: heroStack <= 25 ? ['allin'] : [],
      reason: 'sb_3bet_value',
    };
  }

  // Stack curto/médio → 3-bet/fold (sem flats OOP)
  if (heroStack <= 25 && (gameType === 'mtt' || gameType === 'spin')) {
    if (effectiveStrength >= 68) {
      return {
        bestAction: 'allin',
        alternatives: ['3bet'],
        reason: 'sb_shove_vs_raise',
      };
    }
    if (effectiveStrength >= 60) {
      return {
        bestAction: '3bet',
        alternatives: ['allin'],
        reason: 'sb_3bet_vs_raise',
      };
    }
    return { bestAction: 'fold', alternatives: [], reason: 'sb_fold' };
  }

  // Stack > 25 BB: análise completa
  // Mãos fortes → 3-bet (preferido OOP para não jogar pote de flat fora de posição)
  if (effectiveStrength >= 68) {
    return {
      bestAction: '3bet',
      alternatives: ['call'],
      reason: 'sb_3bet_vs_raise',
    };
  }

  // Mãos jogáveis mas não ideais para 3-bet → call (com desconto do SB)
  if (effectiveStrength >= 55) {
    return {
      bestAction: 'call',
      alternatives: effectiveStrength >= 62 ? ['3bet'] : [],
      reason: 'sb_call_vs_raise',
    };
  }

  // Mãos especulativas com stack profundo
  if (strength >= 46 && heroStack >= 60 && bonus >= 8) {
    return {
      bestAction: 'call',
      alternatives: [],
      reason: 'sb_call_speculative',
    };
  }

  return { bestAction: 'fold', alternatives: [], reason: 'sb_fold' };
}

// ──────────── Handler: Facing Limp ────────────

function handleFacingLimp(ctx, phaseAdj) {
  const { strength, heroPosition, heroStack, hand } = ctx;

  if (strength >= 50) {
    return {
      bestAction: 'raise',
      alternatives: strength >= 77 ? ['allin'] : [],
      reason: 'iso_raise',
    };
  }
  if (strength >= 40 && heroPosition === 'BB') {
    return {
      bestAction: 'call',
      alternatives: [],
      reason: 'bb_check_vs_limp',
    };
  }
  if (strength >= 44 && ['BTN', 'CO', 'SB'].includes(heroPosition)) {
    return {
      bestAction: 'call',
      alternatives: ['raise'],
      reason: 'ip_call_vs_limp',
    };
  }
  return { bestAction: 'fold', alternatives: [], reason: 'fold_vs_limp' };
}

// ──────────── Cálculos de EV, Equity, Frequência ────────────

function calculateDetailedEquity(hand, position, situation, gameType) {
  const strength = handStrength(hand);
  let adj = 0;

  // Ajuste pela situação enfrentada
  if (situation.type === 'facing_raise') {
    adj -= 5;
    // Vs late position raiser, equity efetiva é melhor
    const posBonus = raiserPositionBonus(situation.raiserPosition);
    adj += Math.round(posBonus * 0.4); // cada ponto de bonus dá ~0.4% equity
  }
  if (situation.type === 'facing_3bet') adj -= 10;
  if (situation.type === 'facing_limp') adj += 3;

  // Ajuste pela posição do hero
  if (['BTN', 'CO'].includes(position)) adj += 3;
  if (['UTG'].includes(position)) adj -= 2;
  // SB tem desconto mas está OOP — pequeno ajuste
  if (position === 'SB') adj -= 1;

  if (situation.numCallers >= 2) adj -= 3;

  return Math.min(95, Math.max(15, strength + adj));
}

function calculateDetailedEV(recommendation, strength, pot, heroStack, situation) {
  const action = recommendation.bestAction;

  if (action === 'fold') return 0;

  const investBB = action === 'raise' ? 2.5
    : action === '3bet' ? 7
      : action === 'allin' ? heroStack
        : situation.raiseSize || 2.5; // call = tamanho do raise a pagar

  const winRate = strength / 100;
  const potAfter = pot + investBB;

  return (winRate * potAfter) - ((1 - winRate) * investBB);
}

function calculateFrequency(recommendation, strength, situation, gameType) {
  const action = recommendation.bestAction;

  if (action === 'fold') {
    return Math.min(100, Math.max(0, 100 - strength));
  }
  if (action === 'raise') {
    return Math.min(100, Math.max(20, strength + 10));
  }
  if (action === '3bet') {
    return Math.min(100, Math.max(15, (strength - 55) * 3));
  }
  if (action === 'allin') {
    return Math.min(100, Math.max(10, (strength - 50) * 2.5));
  }
  // call
  return Math.min(100, Math.max(20, strength - 5));
}

// ──────────── Range para o simulador ────────────

function getSimulatorRange(gameType, position, stack, situation) {
  if (stack <= 15 && (gameType === 'mtt' || gameType === 'spin')) {
    return getPushRange(position, stack) || getOpenRange(position, gameType);
  }
  if (position === 'BB' && situation.type === 'facing_raise') {
    const bbRanges = getBBDefenseRange(gameType);
    return [...(bbRanges.threebet || []), ...(bbRanges.call || [])];
  }
  return getOpenRange(position, gameType);
}

// ──────────── Explicação detalhada (CORRIGIDA) ────────────

function generateDetailedExplanation(ctx) {
  const {
    bestAction, reason, hand, heroPosition, heroStack, gameType,
    tournamentPhase, situation, strength, category, equity, ev, pot, inRange, avgStack,
    alternatives,
  } = ctx;

  const actionNames = { fold: 'Fold', call: 'Call', raise: 'Raise', '3bet': '3-Bet', allin: 'All-in' };
  const actionName = actionNames[bestAction];
  const altNames = (alternatives || []).map(a => actionNames[a]).join(' ou ');

  const parts = [];

  // Recomendação principal
  parts.push(`🎯 **Ação recomendada: ${actionName}**${altNames ? ` (alternativa: ${altNames})` : ''}`);

  // Análise da mão
  const categoryNames = { premium: 'Premium', strong: 'Forte', medium: 'Média', weak: 'Fraca', trash: 'Lixo' };
  parts.push(`\n📊 **Análise da mão:** ${hand} é uma mão **${categoryNames[category]}** (${strength}% equity vs random).`);

  // Contexto da situação com posição vs posição
  if (situation.type === 'open') {
    parts.push(`\n🃏 **Situação:** Opening (primeiro a entrar) no ${heroPosition}.`);
    parts.push(inRange
      ? `✅ ${hand} está no range de abertura do ${heroPosition} para ${gameType.toUpperCase()}.`
      : `⚠️ ${hand} NÃO está no range padrão de abertura do ${heroPosition}, mas pode ser ajustado pela dinâmica.`
    );
  } else if (situation.type === 'facing_raise') {
    const raiserPos = situation.raiserPosition || '?';
    const raiserWidth = RAISER_RANGE_WIDTH[raiserPos];
    const widthPct = raiserWidth ? `≈${Math.round(raiserWidth * 100)}%` : '';
    parts.push(`\n🃏 **Situação:** ${heroPosition} enfrentando raise do ${raiserPos} ${widthPct ? `(range ${widthPct} das mãos)` : ''}.`);
    if (raiserWidth && raiserWidth >= 0.28) {
      parts.push(`📌 O ${raiserPos} abre um range largo — podemos defender com mais mãos.`);
    } else if (raiserWidth && raiserWidth <= 0.15) {
      parts.push(`📌 O ${raiserPos} abre um range tight — precisamos de mãos fortes para defender.`);
    }
  } else if (situation.type === 'facing_3bet') {
    parts.push(`\n🃏 **Situação:** Enfrentando 3-bet. Range de 3bet é tipicamente muito tight (≈5-8%).`);
  } else if (situation.type === 'facing_limp') {
    parts.push(`\n🃏 **Situação:** Enfrentando limp. Considere iso-raise com mãos fortes.`);
  }

  // Posição do hero
  if (['BTN', 'CO'].includes(heroPosition) && situation.type === 'facing_raise') {
    parts.push(`\n📍 **Posição:** ${heroPosition} — em posição pós-flop, o que aumenta o valor de mãos especulativas.`);
  } else if (heroPosition === 'SB' && situation.type === 'facing_raise') {
    parts.push(`\n📍 **Posição:** SB — fora de posição pós-flop. Prefira 3-bet ou fold ao invés de flat call.`);
  } else if (heroPosition === 'BB' && situation.type === 'facing_raise') {
    parts.push(`\n📍 **Posição:** BB — fechando a ação com desconto. Defenda com range mais amplo.`);
  }

  // Stack analysis
  if (heroStack <= 15 && gameType !== 'cash') {
    parts.push(`\n💰 **Stack curto (${heroStack}BB):** Zona de push/fold. Decisões simplificadas — all-in ou fold.`);
  } else if (heroStack <= 25 && gameType !== 'cash') {
    parts.push(`\n💰 **Stack médio-curto (${heroStack}BB):** Zona de 3-bet/fold vs raises. Evite flat calls.`);
  } else if (heroStack > 25 && heroStack <= 40) {
    parts.push(`\n💰 **Stack médio (${heroStack}BB):** Jogo equilibrado entre 3-bet, call e fold.`);
  } else if (heroStack > 40 && heroStack < 100) {
    parts.push(`\n💰 **Stack confortável (${heroStack}BB):** Pode flat call com mãos especulativas. Bom implied odds.`);
  } else if (heroStack >= 100) {
    parts.push(`\n💰 **Stack profundo (${heroStack}BB):** Máxima flexibilidade pós-flop. Mãos especulativas ganham muito valor.`);
  }

  // Tournament phase
  if (gameType !== 'cash' && tournamentPhase) {
    const phaseNotes = {
      early: '\n🏆 **Fase:** Early stage. Foco em construir stack. Ranges padrão.',
      middle: '\n🏆 **Fase:** Middle stage. Equilíbrio entre acúmulo e sobrevivência.',
      bubble: '\n🏆 **Fase:** BUBBLE! ICM é crucial. Tighten ranges significativamente. Evite spots marginais.',
      final: '\n🏆 **Fase:** Mesa final. Aumente agressividade. Cada posição no ranking tem grande valor.',
    };
    parts.push(phaseNotes[tournamentPhase] || '');
  }

  // EV analysis
  const evRounded = Math.round(ev * 10) / 10;
  parts.push(`\n📈 **EV da ação:** ${evRounded > 0 ? '+' : ''}${evRounded} BB | Equity: ${equity}% | Pot: ${Math.round(pot * 10) / 10} BB`);

  // Reason-specific notes
  const reasonNotes = {
    push_short_stack: `\n✅ Com ${heroStack}BB, ${hand} é um push lucrativo pela fold equity.`,
    fold_short_stack: `\n❌ Com ${heroStack}BB, ${hand} não tem equity suficiente para push.`,
    push_vs_raise_short: `\n✅ Stack curto vs raise — ${hand} tem equity suficiente para shove lucrativo.`,
    fold_vs_raise_short: `\n❌ Stack curto vs raise — ${hand} não tem equity para reshove.`,
    premium_open: `\n✅ Mão premium. Raise padrão para extrair valor.`,
    standard_open: `\n✅ Mão dentro do range. Open raise padrão (2.2-2.5BB).`,
    fold_not_in_range: `\n❌ ${hand} não está no range de abertura do ${heroPosition}. Folder preserva stack.`,
    bb_3bet_defense: `\n✅ Do BB, ${hand} está no range de 3-bet por valor/proteção.`,
    bb_call_defense: `\n✅ Do BB, ${hand} tem equity suficiente para call com desconto de posição.`,
    bb_call_expanded: `\n✅ Do BB vs ${situation.raiserPosition || 'raiser'} (range aberto), ${hand} é lucrativo de defender.`,
    bb_call_implied: `\n✅ Do BB vs late position com stack profundo, ${hand} tem bons implied odds.`,
    bb_fold: `\n❌ Do BB, ${hand} não tem equity suficiente para defender contra este range.`,
    premium_vs_3bet: `\n✅ Mão premium vs 3-bet. 4-bet/all-in para máximo valor.`,
    fold_vs_3bet: `\n❌ ${hand} não tem equity suficiente contra um range de 3-bet (tipicamente AA-TT, AK-AQ).`,
    strong_short_vs_3bet: `\n✅ Mão forte com stack curto vs 3-bet — shove é +EV pela fold equity.`,
    call_vs_3bet: `\n✅ Mão forte o suficiente para flat call vs 3-bet. Jogar pós-flop.`,
    speculative_call_vs_3bet: `\n✅ Mão especulativa com implied odds vs 3-bet e stack profundo.`,
    '3bet_value': `\n✅ 3-bet por valor. ${hand} domina grande parte do range de open do adversário.`,
    '3bet_shove_medium_stack': `\n✅ Com ${heroStack}BB, 3-bet shove resolve a mão pre-flop com boa fold equity.`,
    call_medium_stack: `\n✅ Com ${heroStack}BB, call é viável. Considere 3-bet se quiser simplificar.`,
    position_call: `\n✅ Call em posição com mão jogável. Vantagem posicional pós-flop.`,
    speculative_call_ip: `\n✅ Call especulativo em posição com stack profundo. Bons implied odds.`,
    '3bet_oop': `\n✅ Fora de posição, 3-bet é preferível a flat call para tomar iniciativa.`,
    sb_3bet_value: `\n✅ Do SB, 3-bet por valor. Tomar iniciativa antes de jogar OOP.`,
    sb_shove_vs_raise: `\n✅ Do SB com ${heroStack}BB, shove é a melhor linha para maximizar fold equity.`,
    sb_3bet_vs_raise: `\n✅ Do SB, 3-bet para tomar iniciativa. Melhor que flat call fora de posição.`,
    sb_call_vs_raise: `\n✅ Do SB, call com desconto. Mão jogável mas precisa de cuidado pós-flop.`,
    sb_call_speculative: `\n✅ Do SB com stack profundo, call especulativo. Implied odds compensam a posição.`,
    sb_fold: `\n❌ Do SB, ${hand} não tem equity suficiente para jogar fora de posição.`,
    iso_raise: `\n✅ Iso-raise vs limper. ${hand} é forte contra range de limp.`,
    ip_call_vs_limp: `\n✅ Call em posição vs limp. Mão especulativa em pot multiway.`,
    bb_check_vs_limp: `\n✅ Check do BB vs limp. Ver flop grátis com mão marginal.`,
    fold_vs_raise: `\n❌ ${hand} não tem equity suficiente para jogar vs este raise na posição ${heroPosition}.`,
  };

  if (reasonNotes[reason]) {
    parts.push(reasonNotes[reason]);
  }

  return parts.join('\n');
}

/**
 * Valida uma notação de mão de poker.
 * @param {string} hand - Ex: 'AKs', 'QJo', 'TT'
 * @returns {boolean}
 */
export function isValidHandNotation(hand) {
  if (!hand || hand.length < 2 || hand.length > 3) return false;
  const validRanks = 'AKQJT98765432';
  if (!validRanks.includes(hand[0]) || !validRanks.includes(hand[1])) return false;
  if (hand.length === 3 && !['s', 'o'].includes(hand[2])) return false;
  if (hand.length === 2 && hand[0] !== hand[1]) return false; // pairs must match
  return true;
}
