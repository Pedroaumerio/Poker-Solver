/**
 * POKER CARDS ENGINE
 * Gerencia baralho, cartas, suits e operações de mão
 */

// Ranks e Suits
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS = ['h', 'd', 'c', 's']; // hearts, diamonds, clubs, spades

export const SUIT_SYMBOLS = {
  h: '♥',
  d: '♦',
  c: '♣',
  s: '♠',
};

export const SUIT_NAMES = {
  h: 'Copas',
  d: 'Ouros',
  c: 'Paus',
  s: 'Espadas',
};

export const SUIT_COLORS = {
  h: '#dc2626',   // vermelho vivo
  d: '#2563eb',   // azul forte
  c: '#16a34a',   // verde escuro
  s: '#1e293b',   // preto/cinza escuro (contraste em fundo branco)
};

export const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6,
  '7': 7, '8': 8, '9': 9, 'T': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export const RANK_NAMES = {
  '2': '2', '3': '3', '4': '4', '5': '5', '6': '6',
  '7': '7', '8': '8', '9': '9', 'T': '10',
  'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
};

/**
 * Cria um baralho completo de 52 cartas
 */
export function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

/**
 * Embaralha o baralho (Fisher-Yates)
 */
export function shuffleDeck(deck) {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Distribui N cartas do topo do baralho
 */
export function dealCards(deck, n) {
  return deck.splice(0, n);
}

/**
 * Formata uma carta como string (ex: "Ah", "Ks")
 */
export function cardToString(card) {
  return `${card.rank}${card.suit}`;
}

/**
 * Retorna a notação de mão (ex: "AKs", "QJo", "TT")
 */
export function handNotation(cards) {
  if (cards.length !== 2) return '';
  const [c1, c2] = cards;
  const r1 = RANK_VALUES[c1.rank];
  const r2 = RANK_VALUES[c2.rank];

  let high, low;
  if (r1 >= r2) {
    high = c1;
    low = c2;
  } else {
    high = c2;
    low = c1;
  }

  if (high.rank === low.rank) {
    return `${high.rank}${low.rank}`;
  }

  const suited = high.suit === low.suit;
  return `${high.rank}${low.rank}${suited ? 's' : 'o'}`;
}

/**
 * Calcula a força relativa de uma mão (0-100)
 * Baseado em tabelas de equity preflop simplificadas
 */
export function handStrength(notation) {
  // Tabela simplificada de força de mãos preflop (equity vs random hand)
  const strengths = {
    'AA': 85, 'KK': 82, 'QQ': 80, 'JJ': 77, 'TT': 75,
    '99': 72, '88': 69, '77': 66, '66': 63, '55': 60,
    '44': 57, '33': 54, '22': 51,
    'AKs': 67, 'AQs': 66, 'AJs': 65, 'ATs': 64, 'A9s': 62,
    'A8s': 61, 'A7s': 60, 'A6s': 59, 'A5s': 59, 'A4s': 58,
    'A3s': 57, 'A2s': 56,
    'AKo': 65, 'AQo': 64, 'AJo': 63, 'ATo': 62, 'A9o': 59,
    'A8o': 58, 'A7o': 57, 'A6o': 56, 'A5o': 56, 'A4o': 55,
    'A3o': 54, 'A2o': 53,
    'KQs': 63, 'KJs': 62, 'KTs': 61, 'K9s': 59, 'K8s': 57,
    'K7s': 56, 'K6s': 55, 'K5s': 54, 'K4s': 53, 'K3s': 52,
    'K2s': 51,
    'KQo': 61, 'KJo': 60, 'KTo': 59, 'K9o': 56, 'K8o': 54,
    'K7o': 53, 'K6o': 52, 'K5o': 51, 'K4o': 50, 'K3o': 49,
    'K2o': 48,
    'QJs': 60, 'QTs': 59, 'Q9s': 57, 'Q8s': 55, 'Q7s': 53,
    'Q6s': 52, 'Q5s': 51, 'Q4s': 50, 'Q3s': 49, 'Q2s': 48,
    'QJo': 58, 'QTo': 57, 'Q9o': 54, 'Q8o': 52, 'Q7o': 50,
    'Q6o': 49, 'Q5o': 48, 'Q4o': 47, 'Q3o': 46, 'Q2o': 45,
    'JTs': 58, 'J9s': 55, 'J8s': 53, 'J7s': 51, 'J6s': 49,
    'J5s': 48, 'J4s': 47, 'J3s': 46, 'J2s': 45,
    'JTo': 56, 'J9o': 53, 'J8o': 50, 'J7o': 48, 'J6o': 46,
    'J5o': 45, 'J4o': 44, 'J3o': 43, 'J2o': 42,
    'T9s': 54, 'T8s': 52, 'T7s': 50, 'T6s': 48, 'T5s': 46,
    'T4s': 45, 'T3s': 44, 'T2s': 43,
    'T9o': 52, 'T8o': 49, 'T7o': 47, 'T6o': 45, 'T5o': 43,
    'T4o': 42, 'T3o': 41, 'T2o': 40,
    '98s': 51, '97s': 49, '96s': 47, '95s': 45, '94s': 43,
    '93s': 42, '92s': 41,
    '98o': 49, '97o': 46, '96o': 44, '95o': 42, '94o': 40,
    '93o': 39, '92o': 38,
    '87s': 49, '86s': 47, '85s': 45, '84s': 43, '83s': 41,
    '82s': 40,
    '87o': 47, '86o': 44, '85o': 42, '84o': 39, '83o': 38,
    '82o': 37,
    '76s': 47, '75s': 45, '74s': 43, '73s': 41, '72s': 39,
    '76o': 45, '75o': 42, '74o': 40, '73o': 37, '72o': 36,
    '65s': 46, '64s': 44, '63s': 42, '62s': 40,
    '65o': 43, '64o': 41, '63o': 38, '62o': 37,
    '54s': 44, '53s': 43, '52s': 41,
    '54o': 42, '53o': 40, '52o': 38,
    '43s': 42, '42s': 40,
    '43o': 39, '42o': 37,
    '32s': 39,
    '32o': 36,
  };

  return strengths[notation] || 35;
}

/**
 * Classifica o tipo de mão (premium, strong, medium, weak, trash)
 */
export function handCategory(notation) {
  const strength = handStrength(notation);
  if (strength >= 77) return 'premium';
  if (strength >= 63) return 'strong';
  if (strength >= 50) return 'medium';
  if (strength >= 40) return 'weak';
  return 'trash';
}
