/**
 * POKER RANGES ENGINE
 * Ranges de abertura, defesa e push por posição e formato.
 * Suporte a 9-max (MTT), 6-max (Cash) e 3-max (Spin).
 */

// ──────────── Posições por formato ────────────

export const POSITIONS_9MAX = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
export const POSITIONS_6MAX = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB'];
export const POSITIONS_3MAX = ['BTN', 'SB', 'BB'];

export const POSITION_NAMES = {
  UTG: 'Under the Gun',
  'UTG+1': 'UTG+1',
  MP: 'Middle Position',
  LJ: 'Lojack',
  HJ: 'Hijack',
  CO: 'Cut-Off',
  BTN: 'Button',
  SB: 'Small Blind',
  BB: 'Big Blind',
};

/** Retorna posições válidas para o formato */
export function getValidPositions(gameType) {
  if (gameType === 'spin') return POSITIONS_3MAX;
  if (gameType === 'mtt')  return POSITIONS_9MAX;
  return POSITIONS_6MAX; // cash
}

/** Mapeia posições 9-max para lookup de ranges 6-max */
function mapTo6Max(position) {
  const map = {
    'UTG': 'UTG', 'UTG+1': 'UTG', 'MP': 'MP', 'LJ': 'MP',
    'HJ': 'CO', 'CO': 'CO', 'BTN': 'BTN', 'SB': 'SB', 'BB': 'BB',
  };
  return map[position] || position;
}

// ──────────── RFI (Raise First In) Ranges ────────────

const RFI_RANGES = {
  cash: {
    UTG: [
      'AA','KK','QQ','JJ','TT','99','88',
      'AKs','AQs','AJs','ATs','AKo','AQo','KQs','KJs','QJs','JTs',
    ],
    MP: [
      'AA','KK','QQ','JJ','TT','99','88','77',
      'AKs','AQs','AJs','ATs','A9s','AKo','AQo','AJo',
      'KQs','KJs','KTs','QJs','QTs','JTs','T9s',
    ],
    CO: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s',
      'AKo','AQo','AJo','ATo',
      'KQs','KJs','KTs','K9s','KQo',
      'QJs','QTs','Q9s','JTs','J9s','T9s','T8s','98s','87s','76s',
    ],
    BTN: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o',
      'KQs','KJs','KTs','K9s','K8s','K7s','KQo','KJo','KTo',
      'QJs','QTs','Q9s','Q8s','QJo','QTo',
      'JTs','J9s','J8s','JTo',
      'T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s',
    ],
    SB: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o',
      'KQs','KJs','KTs','K9s','K8s','KQo','KJo',
      'QJs','QTs','Q9s','QJo','JTs','J9s',
      'T9s','T8s','98s','97s','87s','86s','76s','75s','65s','54s',
    ],
    BB: [],
  },
  mtt: {
    // 9-max MTT ranges (tighter from early positions)
    UTG: [
      'AA','KK','QQ','JJ','TT','99',
      'AKs','AQs','AJs','AKo','AQo','KQs',
    ],
    'UTG+1': [
      'AA','KK','QQ','JJ','TT','99','88',
      'AKs','AQs','AJs','ATs','AKo','AQo','AJo','KQs','KJs','QJs','JTs',
    ],
    MP: [
      'AA','KK','QQ','JJ','TT','99','88','77',
      'AKs','AQs','AJs','ATs','A9s','AKo','AQo','AJo',
      'KQs','KJs','KTs','QJs','QTs','JTs','T9s',
    ],
    LJ: [
      'AA','KK','QQ','JJ','TT','99','88','77','66',
      'AKs','AQs','AJs','ATs','A9s','A8s','A5s',
      'AKo','AQo','AJo','ATo',
      'KQs','KJs','KTs','K9s','QJs','QTs','Q9s','JTs','J9s','T9s','98s',
    ],
    HJ: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s',
      'AKo','AQo','AJo','ATo','A9o',
      'KQs','KJs','KTs','K9s','KQo','KJo',
      'QJs','QTs','Q9s','QJo','JTs','J9s','JTo',
      'T9s','T8s','98s','97s','87s','76s','65s',
    ],
    CO: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o',
      'KQs','KJs','KTs','K9s','K8s','KQo','KJo',
      'QJs','QTs','Q9s','QJo','JTs','J9s','J8s','JTo',
      'T9s','T8s','98s','97s','87s','86s','76s','75s','65s','54s',
    ],
    BTN: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
      'KQo','KJo','KTo','K9o',
      'QJs','QTs','Q9s','Q8s','Q7s','QJo','QTo','Q9o',
      'JTs','J9s','J8s','J7s','JTo','J9o',
      'T9s','T8s','T7s','T9o',
      '98s','97s','96s','98o',
      '87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
    ],
    SB: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o',
      'KQs','KJs','KTs','K9s','K8s','K7s','KQo','KJo','KTo',
      'QJs','QTs','Q9s','Q8s','QJo','QTo',
      'JTs','J9s','J8s','JTo',
      'T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s',
    ],
    BB: [],
  },
  spin: {
    BTN: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
      'KQo','KJo','KTo','K9o','K8o','K7o',
      'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','QJo','QTo','Q9o','Q8o',
      'JTs','J9s','J8s','J7s','J6s','JTo','J9o','J8o',
      'T9s','T8s','T7s','T6s','T9o','T8o',
      '98s','97s','96s','95s','98o','97o',
      '87s','86s','85s','87o',
      '76s','75s','74s','76o',
      '65s','64s','63s','54s','53s','52s','43s','42s','32s',
    ],
    SB: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s',
      'KQo','KJo','KTo','K9o','K8o',
      'QJs','QTs','Q9s','Q8s','Q7s','QJo','QTo','Q9o',
      'JTs','J9s','J8s','J7s','JTo','J9o',
      'T9s','T8s','T7s','T9o',
      '98s','97s','96s','98o',
      '87s','86s','85s','87o',
      '76s','75s','65s','64s','54s','53s','43s',
    ],
    BB: [],
  },
};

// ──────────── BB Defense Ranges ────────────

const BB_DEFENSE_RANGES = {
  cash: {
    call: [
      'QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AQo','AJo','ATo',
      'KQs','KJs','KTs','K9s','K8s','K7s','KQo','KJo',
      'QJs','QTs','Q9s','QJo','QTo','JTs','J9s','J8s','JTo',
      'T9s','T8s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s',
    ],
    threebet: ['AA','KK','QQ','AKs','AKo','A5s','A4s','KQs'],
  },
  mtt: {
    call: [
      'JJ','TT','99','88','77','66','55','44','33','22',
      'AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AQo','AJo','ATo','A9o',
      'KQs','KJs','KTs','K9s','K8s','KQo','KJo','KTo',
      'QJs','QTs','Q9s','Q8s','QJo','QTo','JTs','J9s','J8s','JTo',
      'T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s','53s','43s',
    ],
    threebet: ['AA','KK','QQ','AKs','AKo','AJs','A5s','A4s','KQs','JTs'],
  },
  spin: {
    call: [
      'TT','99','88','77','66','55','44','33','22',
      'AQs','AJs','ATs','A9s','A8s','A7s','A6s','AQo','AJo','ATo','A9o','A8o',
      'KQs','KJs','KTs','K9s','K8s','K7s','KQo','KJo','KTo','K9o',
      'QJs','QTs','Q9s','Q8s','QJo','QTo','Q9o',
      'JTs','J9s','J8s','JTo','J9o',
      'T9s','T8s','T7s','T9o',
      '98s','97s','96s','98o','87s','86s','76s','75s','65s','64s','54s','53s','43s',
    ],
    threebet: ['AA','KK','QQ','JJ','AKs','AKo','AQs','AQo','A5s','A4s','A3s','KQs','JTs','98s'],
  },
};

// ──────────── Push Ranges (short stack) ────────────

const PUSH_RANGES = {
  8: {
    BTN: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
      'KQo','KJo','KTo','K9o','K8o','K7o','K6o','K5o',
      'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s',
      'QJo','QTo','Q9o','Q8o','Q7o',
      'JTs','J9s','J8s','J7s','J6s','J5s','JTo','J9o','J8o',
      'T9s','T8s','T7s','T6s','T9o','T8o',
      '98s','97s','96s','98o','87s','86s','85s','76s','75s','65s','64s','54s','53s','43s',
    ],
    SB: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o','A3o','A2o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s',
      'KQo','KJo','KTo','K9o','K8o','K7o','K6o',
      'QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','QJo','QTo','Q9o','Q8o',
      'JTs','J9s','J8s','J7s','JTo','J9o',
      'T9s','T8s','T7s','T9o','98s','97s','87s','86s','76s','75s','65s','64s','54s',
    ],
    UTG: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o','A4o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','KQo','KJo','KTo','K9o',
      'QJs','QTs','Q9s','Q8s','QJo','QTo',
      'JTs','J9s','J8s','JTo','T9s','T8s','98s','97s','87s','86s','76s','75s','65s','54s',
    ],
  },
  12: {
    BTN: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33','22',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o','A6o','A5o',
      'KQs','KJs','KTs','K9s','K8s','K7s','K6s','KQo','KJo','KTo','K9o',
      'QJs','QTs','Q9s','Q8s','Q7s','QJo','QTo',
      'JTs','J9s','J8s','JTo','T9s','T8s','T7s','98s','97s','87s','86s','76s','75s','65s','64s','54s',
    ],
    SB: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44','33',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s',
      'AKo','AQo','AJo','ATo','A9o','A8o','A7o',
      'KQs','KJs','KTs','K9s','K8s','KQo','KJo','KTo',
      'QJs','QTs','Q9s','Q8s','QJo','QTo','JTs','J9s','JTo',
      'T9s','T8s','98s','97s','87s','86s','76s','65s','54s',
    ],
    UTG: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s',
      'AKo','AQo','AJo','ATo',
      'KQs','KJs','KTs','K9s','KQo',
      'QJs','QTs','JTs','J9s','T9s','98s','87s','76s',
    ],
  },
  20: {
    BTN: [
      'AA','KK','QQ','JJ','TT','99','88','77','66','55','44',
      'AKs','AQs','AJs','ATs','A9s','A8s','A7s','A5s','A4s',
      'AKo','AQo','AJo','ATo','A9o',
      'KQs','KJs','KTs','K9s','KQo','KJo',
      'QJs','QTs','Q9s','QJo','JTs','J9s','T9s','T8s','98s','97s','87s','76s','65s','54s',
    ],
    SB: [
      'AA','KK','QQ','JJ','TT','99','88','77','66',
      'AKs','AQs','AJs','ATs','A9s','A8s','A5s','AKo','AQo','AJo',
      'KQs','KJs','KTs','KQo','QJs','QTs','JTs','T9s','98s','87s',
    ],
    UTG: [
      'AA','KK','QQ','JJ','TT','99','88',
      'AKs','AQs','AJs','ATs','AKo','AQo','KQs','KJs','QJs','JTs',
    ],
  },
};

// ──────────── Public API ────────────

/** Retorna range de abertura para posição e formato */
export function getOpenRange(position, gameType) {
  const type = gameType === 'spin' ? 'spin' : gameType === 'mtt' ? 'mtt' : 'cash';
  const ranges = RFI_RANGES[type];
  // Se a posição não existe diretamente, mapeia para equivalente 6-max
  if (ranges[position]) return ranges[position];
  const mapped = mapTo6Max(position);
  return ranges[mapped] || [];
}

/** Retorna ranges de defesa do BB */
export function getBBDefenseRange(gameType) {
  const type = gameType === 'spin' ? 'spin' : gameType === 'mtt' ? 'mtt' : 'cash';
  return BB_DEFENSE_RANGES[type];
}

/** Retorna range de push por stack */
export function getPushRange(position, stackBB) {
  let tier;
  if (stackBB <= 8) tier = 8;
  else if (stackBB <= 12) tier = 12;
  else if (stackBB <= 20) tier = 20;
  else return null;
  const ranges = PUSH_RANGES[tier];
  return ranges[position] || ranges['UTG'] || [];
}

/** Verifica se mão está no range */
export function isInRange(handNotation, range) {
  return range.includes(handNotation);
}

/** Porcentagem aproximada de abertura para uma posição */
export function getOpenPercentage(position, gameType) {
  const range = getOpenRange(position, gameType);
  return range.length / 169; // 169 combos possíveis
}

/** Gera grid 13x13 para visualização de ranges */
export function generateRangeGrid(range) {
  const ranks = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];
  const grid = [];
  for (let i = 0; i < 13; i++) {
    const row = [];
    for (let j = 0; j < 13; j++) {
      let notation;
      if (i === j) notation = `${ranks[i]}${ranks[j]}`;
      else if (i < j) notation = `${ranks[i]}${ranks[j]}s`;
      else notation = `${ranks[j]}${ranks[i]}o`;
      row.push({
        notation,
        inRange: range.includes(notation),
        isPair: i === j,
        isSuited: i < j,
        isOffsuit: i > j,
      });
    }
    grid.push(row);
  }
  return grid;
}
