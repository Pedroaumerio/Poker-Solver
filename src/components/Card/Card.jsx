import React from 'react';
import { SUIT_SYMBOLS, SUIT_COLORS, RANK_NAMES } from '../../engine/cards';
import './Card.css';

/**
 * Componente visual de carta de poker
 * Renderiza uma carta com rank e suit usando CSS puro
 */
export default function Card({ card, delay = 0, faceDown = false, size = 'normal' }) {
  if (!card) return null;

  const { rank, suit } = card;
  const symbol = SUIT_SYMBOLS[suit];
  const color = SUIT_COLORS[suit];
  const displayRank = RANK_NAMES[rank];

  const sizeClass = size === 'small' ? 'card--small' : size === 'large' ? 'card--large' : '';

  if (faceDown) {
    return (
      <div
        className={`card card--face-down ${sizeClass}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div className="card__back">
          <div className="card__back-pattern">
            <div className="card__back-diamond"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card ${sizeClass} animate-card-deal`}
      style={{
        animationDelay: `${delay}ms`,
        '--suit-color': color,
      }}
    >
      <div className="card__inner">
        <div className="card__corner card__corner--top">
          <span className="card__rank" style={{ color }}>{displayRank}</span>
          <span className="card__suit" style={{ color }}>{symbol}</span>
        </div>
        <div className="card__center">
          <span className="card__center-suit" style={{ color }}>{symbol}</span>
        </div>
        <div className="card__corner card__corner--bottom">
          <span className="card__rank" style={{ color }}>{displayRank}</span>
          <span className="card__suit" style={{ color }}>{symbol}</span>
        </div>
      </div>
    </div>
  );
}
