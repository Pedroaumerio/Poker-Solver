/**
 * POKER SOLVER ENGINE
 * Gera cenários completos com todos os jogadores e analisa decisões.
 */

import {
  handStrength, handNotation as getHandNotation, handCategory,
  createDeck, shuffleDeck, dealCards,
} from './cards.js';
import {
  getOpenRange, getBBDefenseRange, getPushRange, isInRange,
  getValidPositions, getOpenPercentage,
} from './ranges.js';

// ──────────── Constantes ────────────

export const ACTION_TYPES = {
  OPEN: 'open',
  FACING_RAISE: 'raise',
  FACING_LIMP: 'limp',
  FACING_3BET: '3bet',
};

export const PLAYER_ACTIONS = {
  FOLD: 'fold',
  CALL: 'call',
  RAISE: 'raise',
  THREEBET: '3bet',
  ALLIN: 'allin',
};

// ──────────── Geração de cenário ────────────

/**
 * Gera um cenário completo de jogo com todos os jogadores na mesa.
 * Retorna: gameType, position, stackBB, previousAction, cards,
 *          handNotation, players[], pot, blinds, dealerSeat
 */
export function generateScenario(gameType) {
  const positions = getValidPositions(gameType);
  const numPlayers = positions.length;

  // Escolhe posição do hero
  const heroPositionName = positions[Math.floor(Math.random() * numPlayers)];
  const heroIndexInOrder = positions.indexOf(heroPositionName);

  // Gera stack do hero
  const heroStack = generateStack(gameType);

  // Distribui cartas do hero
  const deck = shuffleDeck(createDeck());
  const heroCards = dealCards(deck, 2);

  // Cria todos os jogadores na mesa
  const players = positions.map((pos, i) => ({
    position: pos,
    stack: i === heroIndexInOrder ? heroStack : generateStack(gameType),
    isHero: i === heroIndexInOrder,
    action: null,       // null = não agiu ainda
    raiseSize: null,
    hasFolded: false,
    isActive: i === heroIndexInOrder,
  }));

  // Genera ações dos vilões antes do hero
  // Ordem de ação preflop: UTG → UTG+1 → ... → BTN → SB → BB
  // Mas SB e BB já postaram blinds
  const blinds = { sb: 0.5, bb: 1 };
  let pot = blinds.sb + blinds.bb;
  let hasRaiser = false;
  let raiserPosition = null;

  // Processa ações de TODAS as posições (exceto hero)
  // A ordem de ação preflop: UTG → UTG+1 → ... → BTN → SB → BB
  // Pré-hero: simulação completa com ações realistas
  // Pós-hero: marcados como actsAfterHero e fold (exibidos apenas no resultado)
  for (let i = 0; i < numPlayers; i++) {
    if (i === heroIndexInOrder) continue; // Hero decide depois

    const player = players[i];
    const isPostHero = i > heroIndexInOrder;

    if (isPostHero) {
      // Pós-hero: fold simulado (ação visível apenas no resultado)
      player.actsAfterHero = true;
      player.action = 'fold';
      player.hasFolded = true;
      continue;
    }

    // Pré-hero: simulação completa de ação
    const openPct = getOpenPercentage(player.position, gameType);
    const rand = Math.random();

    if (!hasRaiser) {
      // Primeiro a entrar: raise ou fold
      if (rand < openPct * 1.3) {
        player.action = 'raise';
        player.raiseSize = '2.5 BB';
        pot += 2.5;
        hasRaiser = true;
        raiserPosition = player.position;
      } else {
        player.action = 'fold';
        player.hasFolded = true;
      }
    } else {
      // Enfrentando raise: fold, call ou 3-bet
      if (rand < 0.06) {
        player.action = '3bet';
        player.raiseSize = '7 BB';
        pot += 7;
      } else if (rand < 0.15) {
        player.action = 'call';
        pot += 2.5;
      } else {
        player.action = 'fold';
        player.hasFolded = true;
      }
    }
  }

  // Determina previousAction para o hero
  let previousAction;
  if (hasRaiser) {
    previousAction = ACTION_TYPES.FACING_RAISE;
  } else {
    previousAction = ACTION_TYPES.OPEN;
  }

  // Encontra o seat do dealer (BTN)
  const btnIndex = positions.indexOf('BTN');
  const dealerSeat = btnIndex >= 0 ? btnIndex : 0;

  // Reordena players para visualização:
  // Seat 0 = hero (bottom center), depois clockwise
  const visualPlayers = reorderForVisual(players, heroIndexInOrder);

  return {
    gameType,
    position: heroPositionName,
    stackBB: heroStack,
    previousAction,
    cards: heroCards,
    handNotation: getHandNotation(heroCards),
    players: visualPlayers,
    pot: Math.round(pot * 10) / 10,
    blinds,
    dealerSeat,
    numPlayers,
  };
}

/** Reordena jogadores para exibição visual (hero no seat 0, resto clockwise) */
function reorderForVisual(players, heroIdx) {
  const n = players.length;
  const result = [];
  for (let i = 0; i < n; i++) {
    const idx = (heroIdx + i) % n;
    result.push({ ...players[idx], visualSeat: i });
  }
  return result;
}

/** Gera stack aleatório baseado no formato */
function generateStack(gameType) {
  if (gameType === 'cash') {
    return Math.floor(Math.random() * 150) + 50;
  }
  if (gameType === 'mtt') {
    const ranges = [[8, 15], [15, 25], [25, 40], [40, 80]];
    const r = ranges[Math.floor(Math.random() * ranges.length)];
    return Math.floor(Math.random() * (r[1] - r[0])) + r[0];
  }
  // spin
  const ranges = [[5, 10], [10, 15], [15, 25]];
  const r = ranges[Math.floor(Math.random() * ranges.length)];
  return Math.floor(Math.random() * (r[1] - r[0])) + r[0];
}

// ──────────── Análise de decisão ────────────

export function analyzeDecision(scenario, playerAction) {
  const { position, previousAction, handNotation: notation, gameType } = scenario;
  const strength = handStrength(notation);
  const category = handCategory(notation);

  const correctActions = getCorrectActions(scenario);
  const isCorrect = correctActions.includes(playerAction);
  const ev = calculateEV(scenario, playerAction, correctActions);
  const equity = calculateEquity(notation, position, previousAction);
  const idealRange = getIdealRange(scenario);
  const explanation = generateExplanation(scenario, playerAction, correctActions, ev);

  return {
    isCorrect, playerAction, correctActions,
    ev, equity, handStrength: strength, handCategory: category,
    idealRange, explanation, notation,
  };
}

function getCorrectActions(scenario) {
  const { gameType, position, stackBB, previousAction, handNotation: notation } = scenario;
  const strength = handStrength(notation);
  const actions = [];

  if (stackBB <= 12 && (gameType === 'mtt' || gameType === 'spin')) {
    const pushRange = getPushRange(position, stackBB);
    if (pushRange && isInRange(notation, pushRange)) {
      actions.push(PLAYER_ACTIONS.ALLIN);
      if (stackBB <= 8) return actions;
    } else {
      actions.push(PLAYER_ACTIONS.FOLD);
      return actions;
    }
  }

  if (previousAction === ACTION_TYPES.OPEN) {
    const openRange = getOpenRange(position, gameType);
    if (isInRange(notation, openRange)) {
      actions.push(PLAYER_ACTIONS.RAISE);
      if (strength >= 77) actions.push(PLAYER_ACTIONS.ALLIN);
    } else {
      actions.push(PLAYER_ACTIONS.FOLD);
    }
    return actions;
  }

  if (position === 'BB' && previousAction === ACTION_TYPES.FACING_RAISE) {
    const bbRanges = getBBDefenseRange(gameType);
    if (bbRanges.threebet && isInRange(notation, bbRanges.threebet)) {
      actions.push(PLAYER_ACTIONS.THREEBET);
      if (strength >= 80) actions.push(PLAYER_ACTIONS.ALLIN);
    } else if (bbRanges.call && isInRange(notation, bbRanges.call)) {
      actions.push(PLAYER_ACTIONS.CALL);
    } else {
      actions.push(PLAYER_ACTIONS.FOLD);
    }
    return actions;
  }

  if (previousAction === ACTION_TYPES.FACING_RAISE) {
    if (strength >= 77) {
      actions.push(PLAYER_ACTIONS.THREEBET);
      if (stackBB <= 25) actions.push(PLAYER_ACTIONS.ALLIN);
    } else if (strength >= 60 && ['BTN', 'BB', 'CO'].includes(position)) {
      actions.push(PLAYER_ACTIONS.CALL);
      if (strength >= 70) actions.push(PLAYER_ACTIONS.THREEBET);
    } else if (strength >= 55 && position === 'BTN') {
      actions.push(PLAYER_ACTIONS.CALL);
    } else {
      actions.push(PLAYER_ACTIONS.FOLD);
    }
    return actions;
  }

  if (previousAction === ACTION_TYPES.FACING_LIMP) {
    if (strength >= 50) actions.push(PLAYER_ACTIONS.RAISE);
    else if (strength >= 40 && position === 'BB') actions.push(PLAYER_ACTIONS.CALL);
    else actions.push(PLAYER_ACTIONS.FOLD);
    return actions;
  }

  if (strength >= 60) actions.push(PLAYER_ACTIONS.RAISE);
  else if (strength >= 45) actions.push(PLAYER_ACTIONS.CALL);
  else actions.push(PLAYER_ACTIONS.FOLD);
  return actions;
}

function calculateEV(scenario, playerAction, correctActions) {
  const { previousAction, handNotation: notation } = scenario;
  const strength = handStrength(notation);
  const isCorrect = correctActions.includes(playerAction);

  let potSize = 2.5;
  if (previousAction === ACTION_TYPES.FACING_RAISE) potSize = 6;
  if (previousAction === ACTION_TYPES.FACING_LIMP) potSize = 3;

  if (isCorrect) {
    if (playerAction === PLAYER_ACTIONS.FOLD) return 0;
    const baseEV = (strength / 100) * potSize - ((100 - strength) / 100) * potSize;
    return Math.round(baseEV * 10) / 10;
  }
  if (playerAction === PLAYER_ACTIONS.FOLD && !correctActions.includes(PLAYER_ACTIONS.FOLD)) {
    return -Math.round(((strength / 100) * potSize * 0.5) * 10) / 10;
  }
  if (playerAction !== PLAYER_ACTIONS.FOLD && correctActions.includes(PLAYER_ACTIONS.FOLD)) {
    return -Math.round((((100 - strength) / 100) * potSize) * 10) / 10;
  }
  return -Math.round(potSize * 0.3 * 10) / 10;
}

function calculateEquity(notation, position, previousAction) {
  const strength = handStrength(notation);
  let adj = 0;
  if (previousAction === ACTION_TYPES.FACING_RAISE) adj = -5;
  if (position === 'BTN' || position === 'CO') adj += 2;
  if (position === 'SB' || position === 'UTG') adj -= 1;
  return Math.min(95, Math.max(15, strength + adj));
}

function getIdealRange(scenario) {
  const { gameType, position, stackBB, previousAction } = scenario;
  if (stackBB <= 12 && (gameType === 'mtt' || gameType === 'spin')) {
    return getPushRange(position, stackBB) || getOpenRange(position, gameType);
  }
  if (position === 'BB' && previousAction === ACTION_TYPES.FACING_RAISE) {
    const bbRanges = getBBDefenseRange(gameType);
    return [...(bbRanges.threebet || []), ...(bbRanges.call || [])];
  }
  return getOpenRange(position, gameType);
}

function generateExplanation(scenario, playerAction, correctActions, ev) {
  const { position, stackBB, previousAction, handNotation: notation } = scenario;
  const strength = handStrength(notation);
  const category = handCategory(notation);
  const isCorrect = correctActions.includes(playerAction);

  const names = { fold:'Fold', call:'Call', raise:'Raise', '3bet':'3-Bet', allin:'All-in' };
  const correctNames = correctActions.map(a => names[a]).join(' ou ');

  if (isCorrect) {
    if (playerAction === 'allin') {
      return stackBB <= 12
        ? `✅ All-in correto! Com ${stackBB}BB e ${notation} no ${position}, o push é +EV pela fold equity.`
        : `✅ All-in correto! ${notation} é ${category === 'premium' ? 'premium' : 'forte'} e justifica agressividade máxima.`;
    }
    if (playerAction === 'raise')
      return `✅ Raise correto! ${notation} está no range de abertura do ${position}. ${strength >= 70 ? 'Mão forte para extrair valor.' : 'Mão jogável nesta posição.'}`;
    if (playerAction === '3bet')
      return `✅ 3-Bet correto! ${notation} ${strength >= 77 ? 'é premium para 3-bet por valor' : 'funciona como 3-bet semi-bluff'}.`;
    if (playerAction === 'call')
      return `✅ Call correto! ${notation} tem equity suficiente para call, mas não para 3-bet.`;
    if (playerAction === 'fold')
      return `✅ Fold correto! ${notation} não tem equity suficiente nesta situação.`;
  }

  let exp = `❌ A ação correta seria ${correctNames}. `;
  if (playerAction === 'fold') {
    exp += `${notation} é ${category === 'premium' ? 'premium' : category === 'strong' ? 'forte' : 'jogável'} no ${position}. `;
    exp += stackBB <= 12 ? `Com apenas ${stackBB}BB, esta mão deve ser pushada.` : `Foldar perde EV (${ev} BB).`;
  } else if (playerAction === 'call' && correctActions.includes('raise'))
    exp += `${notation} é forte o suficiente para raise. Call é passivo demais.`;
  else if (playerAction === 'raise' && correctActions.includes('fold'))
    exp += `${notation} não está no range de abertura do ${position}. Abrir é -EV.`;
  else if (playerAction === 'allin' && !correctActions.includes('allin'))
    exp += stackBB > 20 ? `Com ${stackBB}BB, all-in preflop é excessivo.` : `${notation} não tem equity para push.`;
  else if (['call','raise'].includes(playerAction) && correctActions.includes('fold'))
    exp += `${notation} (${Math.round(strength)}% equity) não é forte contra o range do villain.`;
  return exp;
}

/** Retorna TODAS as ações — jogador pode sempre escolher qualquer uma. */
export function getAvailableActions() {
  return [
    PLAYER_ACTIONS.FOLD,
    PLAYER_ACTIONS.CALL,
    PLAYER_ACTIONS.RAISE,
    PLAYER_ACTIONS.THREEBET,
    PLAYER_ACTIONS.ALLIN,
  ];
}
