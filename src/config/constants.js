/**
 * POKER SOLVER STUDY — Constantes centralizadas
 * Evita duplicação de dados entre componentes.
 */

// ──────────── Labels de formato de jogo ────────────

export const GAME_LABELS = {
  mtt: 'Torneio MTT',
  spin: 'Spin & Go',
  cash: 'Cash Game',
};

export const GAME_TABLE_LABELS = {
  mtt: 'TORNEIO MTT',
  spin: 'SPIN & GO',
  cash: 'CASH GAME',
};

// ──────────── Nomes de ações ────────────

export const ACTION_NAMES = {
  fold: 'Fold',
  call: 'Call',
  raise: 'Raise',
  '3bet': '3-Bet',
  allin: 'All-in',
};

// ──────────── Estilos visuais das ações (mesa) ────────────

export const ACTION_STYLES = {
  fold: { bg: 'rgba(100,116,139,0.25)', color: '#94a3b8', label: 'FOLD' },
  call: { bg: 'rgba(59,130,246,0.3)', color: '#60a5fa', label: 'CALL' },
  raise: { bg: 'rgba(245,158,11,0.3)', color: '#fbbf24', label: 'RAISE' },
  '3bet': { bg: 'rgba(249,115,22,0.35)', color: '#fb923c', label: '3-BET' },
  allin: { bg: 'rgba(239,68,68,0.35)', color: '#f87171', label: 'ALL-IN' },
};

// ──────────── Ordem de posições no poker (para log) ────────────

export const POSITION_ORDER = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB', 'BB'];

// ──────────── Categorias de mão ────────────

export const CATEGORY_NAMES = {
  premium: 'Premium',
  strong: 'Forte',
  medium: 'Média',
  weak: 'Fraca',
  trash: 'Lixo',
};

export const CATEGORY_COLORS = {
  premium: '#818cf8',
  strong: '#34d399',
  medium: '#fbbf24',
  weak: '#fb923c',
  trash: '#f87171',
};

// ──────────── Definição dos botões de ação ────────────

export const ALL_ACTIONS = [
  { id: 'fold',  label: 'Fold',  icon: '🃏', className: 'action-btn--fold',  shortcut: 'F' },
  { id: 'call',  label: 'Call',  icon: '📞', className: 'action-btn--call',  shortcut: 'C' },
  { id: 'raise', label: 'Raise', icon: '⬆️', className: 'action-btn--raise', shortcut: 'R' },
  { id: '3bet',  label: '3-Bet', icon: '🔥', className: 'action-btn--3bet',  shortcut: '3' },
  { id: 'allin', label: 'All-in',icon: '💎', className: 'action-btn--allin', shortcut: 'A' },
];

// ──────────── Definição dos tipos de jogo (Home Screen) ────────────

export const GAME_TYPES = [
  {
    id: 'mtt',
    title: 'Torneio (MTT)',
    subtitle: 'Multi-Table Tournament',
    description: 'Ranges de torneio com considerações de ICM, stack curto e pressão de blinds crescentes.',
    icon: '🏆',
    gradient: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    features: ['Push/Fold Charts', 'ICM Awareness', 'Stack Depth', 'Blind Pressure'],
  },
  {
    id: 'spin',
    title: 'Spin & Go',
    subtitle: 'Hyper-Turbo 3-Max',
    description: 'Estratégia para 3-handed com stacks curtos, ranges amplos e decisões rápidas.',
    icon: '🎰',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
    features: ['3-Handed Play', 'Short Stack', 'Wide Ranges', 'Push Charts'],
  },
  {
    id: 'cash',
    title: 'Cash Game',
    subtitle: '6-Max No Limit',
    description: 'Ranges balanceados para cash games com stacks profundos e exploração de leaks.',
    icon: '💰',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
    features: ['Deep Stacks', 'GTO Ranges', 'Position Play', 'Value Extraction'],
  },
];
