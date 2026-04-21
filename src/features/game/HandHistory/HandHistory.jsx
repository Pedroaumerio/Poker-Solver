import React from 'react';
import { ACTION_NAMES } from '../../../config/constants';
import './HandHistory.css';

/**
 * Histórico de mãos jogadas com pontuação
 */
export default function HandHistory({ history, score }) {
  const accuracy = history.length > 0
    ? ((score.correct / history.length) * 100).toFixed(1)
    : 0;

  return (
    <div className="hand-history">
      {/* Score summary */}
      <div className="hand-history__score">
        <div className="hand-history__score-main">
          <div className="hand-history__score-ring">
            <svg viewBox="0 0 100 100" className="hand-history__score-svg">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={accuracy >= 70 ? '#10b981' : accuracy >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(accuracy / 100) * 264} 264`}
                transform="rotate(-90 50 50)"
                style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
              />
            </svg>
            <span className="hand-history__score-percent">{accuracy}%</span>
          </div>
          <div className="hand-history__score-details">
            <h4>Precisão</h4>
            <div className="hand-history__score-counts">
              <span className="hand-history__score-correct">✅ {score.correct}</span>
              <span className="hand-history__score-wrong">❌ {score.wrong}</span>
              <span className="hand-history__score-total">📊 {history.length} mãos</span>
            </div>
          </div>
        </div>
      </div>

      {/* History list */}
      {history.length > 0 && (
        <div className="hand-history__list">
          <h4 className="hand-history__list-title">Últimas Mãos</h4>
          <div className="hand-history__items">
            {history.slice().reverse().slice(0, 20).map((entry, index) => (
              <div
                key={index}
                className={`hand-history__item ${entry.isCorrect ? 'hand-history__item--correct' : 'hand-history__item--wrong'}`}
              >
                <div className="hand-history__item-status">
                  {entry.isCorrect ? '✅' : '❌'}
                </div>
                <div className="hand-history__item-info">
                  <span className="hand-history__item-hand">{entry.notation}</span>
                  <span className="hand-history__item-position">{entry.position}</span>
                </div>
                <div className="hand-history__item-action">
                  {ACTION_NAMES[entry.playerAction]}
                </div>
                <div className={`hand-history__item-ev ${entry.ev >= 0 ? 'hand-history__item-ev--positive' : 'hand-history__item-ev--negative'}`}>
                  {entry.ev > 0 ? '+' : ''}{entry.ev} BB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
