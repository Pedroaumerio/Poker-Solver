import React from 'react';
import RangeGrid from '../../../components/RangeGrid/RangeGrid';
import { ACTION_NAMES, CATEGORY_NAMES, CATEGORY_COLORS } from '../../../config/constants';
import './AnalysisPanel.css';

/**
 * Painel de análise - Mostra EV, equity, range e explicação
 */
export default function AnalysisPanel({ result, scenario }) {
  if (!result) return null;

  const {
    isCorrect,
    ev,
    equity,
    handStrength: strength,
    handCategory: category,
    idealRange,
    explanation,
    correctActions,
    playerAction,
    notation,
  } = result;

  return (
    <div className="analysis animate-fade-in-up">
      {/* Result header */}
      <div className={`analysis__header ${isCorrect ? 'analysis__header--correct' : 'analysis__header--wrong'}`}>
        <div className="analysis__header-icon">
          {isCorrect ? '✅' : '❌'}
        </div>
        <div className="analysis__header-text">
          <h3>{isCorrect ? 'Decisão Correta!' : 'Decisão Incorreta'}</h3>
          <p>
            Você escolheu <strong>{ACTION_NAMES[playerAction]}</strong>
            {!isCorrect && ` — O correto seria ${correctActions.map(a => ACTION_NAMES[a]).join(' ou ')}`}
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="analysis__stats">
        {/* EV */}
        <div className="analysis__stat-card">
          <div className="analysis__stat-icon">📊</div>
          <div className="analysis__stat-content">
            <span className="analysis__stat-label">EV da Decisão</span>
            <span className={`analysis__stat-value ${ev >= 0 ? 'analysis__stat-value--positive' : 'analysis__stat-value--negative'}`}>
              {ev > 0 ? '+' : ''}{ev} BB
            </span>
          </div>
          <div className="analysis__stat-bar">
            <div
              className={`analysis__stat-bar-fill ${ev >= 0 ? 'analysis__stat-bar-fill--positive' : 'analysis__stat-bar-fill--negative'}`}
              style={{ width: `${Math.min(100, Math.abs(ev) * 10 + 20)}%` }}
            ></div>
          </div>
        </div>

        {/* Equity */}
        <div className="analysis__stat-card">
          <div className="analysis__stat-icon">🎯</div>
          <div className="analysis__stat-content">
            <span className="analysis__stat-label">Equity (% Vitória)</span>
            <span className="analysis__stat-value">{equity}%</span>
          </div>
          <div className="analysis__stat-bar">
            <div
              className="analysis__stat-bar-fill analysis__stat-bar-fill--equity"
              style={{ width: `${equity}%` }}
            ></div>
          </div>
        </div>

        {/* Hand Strength */}
        <div className="analysis__stat-card">
          <div className="analysis__stat-icon">💪</div>
          <div className="analysis__stat-content">
            <span className="analysis__stat-label">Força da Mão</span>
            <span className="analysis__stat-value" style={{ color: CATEGORY_COLORS[category] }}>
              {CATEGORY_NAMES[category]} ({strength}%)
            </span>
          </div>
          <div className="analysis__stat-bar">
            <div
              className="analysis__stat-bar-fill"
              style={{
                width: `${strength}%`,
                background: CATEGORY_COLORS[category],
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="analysis__explanation">
        <h4>📝 Análise</h4>
        <p>{explanation}</p>
      </div>

      {/* Range Grid */}
      <RangeGrid range={idealRange} playerHand={notation} />
    </div>
  );
}
