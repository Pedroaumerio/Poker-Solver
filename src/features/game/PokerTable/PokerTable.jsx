import React from 'react';
import Card from '../../../components/Card/Card';
import { ACTION_STYLES, GAME_TABLE_LABELS, POSITION_ORDER } from '../../../config/constants';
import './PokerTable.css';

/**
 * Mesa de poker oval realista com todos os jogadores, ações, pot, dealer e log.
 * Suporta 3-max (Spin), 6-max (Cash) e 9-max (MTT).
 *
 * Fluxo visual:
 *  - Antes do resultado: mostra ações pré-hero + hero aguardando
 *  - Após resultado: TODAS as posições exibem ação (hero, pré-hero, pós-hero)
 */

// ──────────── Posições visuais dos seats ────────────
// Seat 0 = hero (bottom center), resto clockwise
const SEAT_COORDS = {
  9: [
    { left: 48, top: 76 },  // 0 - Bottom center (HERO)
    { left: 76, top: 73 },  // 1 - Bottom-right
    { left: 88, top: 48 },  // 2 - Right
    { left: 80, top: 18 },  // 3 - Top-right
    { left: 58, top: 8 },  // 4 - Top center-right
    { left: 38, top: 8 },  // 5 - Top center-left
    { left: 18, top: 16 },  // 6 - Top-left
    { left: 5, top: 46 },  // 7 - Left
    { left: 22, top: 73 },  // 8 - Bottom-left
  ],
  6: [
    { left: 50, top: 76 },  // 0 - Bottom center (HERO)
    { left: 84, top: 65 },  // 1 - Right-bottom
    { left: 84, top: 26 },  // 2 - Right-top
    { left: 50, top: 8 },  // 3 - Top
    { left: 16, top: 26 },  // 4 - Left-top
    { left: 16, top: 65 },  // 5 - Left-bottom
  ],
  3: [
    { left: 50, top: 74 },  // 0 - Bottom center (HERO)
    { left: 78, top: 16 },  // 1 - Top-right
    { left: 22, top: 16 },  // 2 - Top-left
  ],
};

// Posição do chip de aposta (próximo ao seat, levemente em direção ao centro)
function getBetCoords(seat, tableCenter = { left: 50, top: 44 }) {
  return {
    left: seat.left + (tableCenter.left - seat.left) * 0.28,
    top: seat.top + (tableCenter.top - seat.top) * 0.28,
  };
}

export default function PokerTable({ scenario, showResult, result }) {
  if (!scenario) return null;

  const {
    cards, position, gameType, handNotation,
    players = [], pot, blinds, numPlayers,
  } = scenario;

  const seatCount = numPlayers || players.length || 6;
  const coords = SEAT_COORDS[seatCount] || SEAT_COORDS[6];

  // Encontra o seat do dealer (BTN) nos visualPlayers
  const dealerVisualSeat = players.findIndex(p => p.position === 'BTN');

  // ── Log de ações (ordenado pela posição no poker) ──
  // Inclui pós-hero e hero apenas quando showResult é true
  const actionLog = players
    .filter(p => {
      if (p.isHero) return showResult && result;
      if (!p.action) return false;
      if (p.actsAfterHero && !showResult) return false;
      return true;
    })
    .map(p => {
      if (p.isHero && showResult && result) {
        const heroRaiseSize = result.playerAction === 'raise' ? '2.5 BB'
          : result.playerAction === '3bet' ? '7 BB'
          : result.playerAction === 'allin' ? 'ALL-IN'
          : null;
        return { ...p, action: result.playerAction, raiseSize: heroRaiseSize };
      }
      return p;
    })
    .sort((a, b) => POSITION_ORDER.indexOf(a.position) - POSITION_ORDER.indexOf(b.position));

  const resultClass = showResult
    ? result?.isCorrect ? 'oval-table--correct' : 'oval-table--wrong'
    : '';

  return (
    <div className={`oval-table-container ${resultClass}`}>
      {/* Moldura da mesa */}
      <div className="oval-table__rail">
        <div className="oval-table__felt">
          {/* Logo central */}
          <div className="oval-table__center-logo">♠</div>

          {/* Pot display */}
          <div className="oval-table__pot">
            <div className="oval-table__pot-label">POT</div>
            <div className="oval-table__pot-value">{pot} BB</div>
          </div>

          {/* Blinds info */}
          {blinds && (
            <div className="oval-table__blinds">
              Blinds: {blinds.sb}/{blinds.bb} BB
            </div>
          )}

          {/* Game type badge */}
          <div className="oval-table__game-badge">{GAME_TABLE_LABELS[gameType]}</div>

          {/* Result overlay */}
          {showResult && result && (
            <div className={`oval-table__result ${result.isCorrect ? 'oval-table__result--correct' : 'oval-table__result--wrong'}`}>
              {result.isCorrect ? '✅ CORRETO' : '❌ ERRADO'}
            </div>
          )}
        </div>
      </div>

      {/* Player seats */}
      {players.map((player, i) => {
        const coord = coords[i] || coords[0];
        const betCoord = getBetCoords(coord);
        const isDealer = i === dealerVisualSeat;

        // ── Determina ação efetiva para exibição ──
        // Hero: mostra ação escolhida apenas após resultado
        // Pós-hero: mostra apenas após resultado
        let effectiveAction = player.action;
        let effectiveRaiseSize = player.raiseSize;

        if (player.isHero && showResult && result) {
          effectiveAction = result.playerAction;
          effectiveRaiseSize = effectiveAction === 'raise' ? '2.5 BB'
            : effectiveAction === '3bet' ? '7 BB'
            : effectiveAction === 'allin' ? 'ALL-IN'
            : null;
        }

        // Mostrar ação? (pré-hero sempre; hero e pós-hero apenas após resultado)
        const shouldShowAction = effectiveAction &&
          (!player.actsAfterHero || showResult) &&
          (!player.isHero || showResult);

        const actionStyle = shouldShowAction ? ACTION_STYLES[effectiveAction] : null;

        // Estado visual de fold
        const isEffectivelyFolded = player.isHero
          ? (showResult && result && result.playerAction === 'fold')
          : (player.hasFolded && (!player.actsAfterHero || showResult));

        return (
          <div key={i}>
            {/* Seat */}
            <div
              className={[
                'oval-seat',
                player.isHero ? 'oval-seat--hero' : '',
                isEffectivelyFolded ? 'oval-seat--folded' : '',
                player.isActive && !showResult ? 'oval-seat--active' : '',
              ].filter(Boolean).join(' ')}
              style={{
                left: `${coord.left}%`,
                top: `${coord.top}%`,
                animationDelay: `${i * 60}ms`,
              }}
            >
              {/* Dealer button */}
              {isDealer && <div className="oval-seat__dealer">D</div>}

              {/* Position badge */}
              <div className="oval-seat__position">{player.position}</div>

              {/* Stack */}
              <div className="oval-seat__stack">{player.stack} BB</div>

              {/* Hero indicator */}
              {player.isHero && <div className="oval-seat__you">VOCÊ</div>}

              {/* Hero cards */}
              {player.isHero && cards && (
                <div className="oval-seat__cards">
                  {cards.map((card, ci) => (
                    <Card key={`${card.rank}${card.suit}`} card={card} delay={ci * 200} size="small" />
                  ))}
                </div>
              )}

              {/* Villain face-down cards — hidden if folded */}
              {!player.isHero && !isEffectivelyFolded && (
                <div className="oval-seat__cards oval-seat__cards--hidden">
                  <div className="oval-seat__card-back"></div>
                  <div className="oval-seat__card-back"></div>
                </div>
              )}

              {/* Hand notation for hero */}
              {player.isHero && handNotation && (
                <div className="oval-seat__notation">{handNotation}</div>
              )}
            </div>

            {/* Bet chip / Action chip */}
            {actionStyle && (
              <div
                className="oval-bet"
                style={{
                  left: `${betCoord.left}%`,
                  top: `${betCoord.top}%`,
                  background: actionStyle.bg,
                  color: actionStyle.color,
                  borderColor: actionStyle.color,
                }}
              >
                <span className="oval-bet__label">{actionStyle.label}</span>
                {effectiveRaiseSize && (
                  <span className="oval-bet__size">{effectiveRaiseSize}</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Action Log ── */}
      {actionLog.length > 0 && (
        <div className="oval-table__log">
          <div className="oval-table__log-title">📋 Ações</div>
          {actionLog.map((p, i) => {
            const style = ACTION_STYLES[p.action];
            return (
              <div key={i} className="oval-table__log-entry">
                <span className="oval-table__log-pos">{p.position}</span>
                <span
                  className="oval-table__log-action"
                  style={{ color: style?.color || '#94a3b8' }}
                >
                  {style?.label || p.action}
                  {p.raiseSize ? ` ${p.raiseSize}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
