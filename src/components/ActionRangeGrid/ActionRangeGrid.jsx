import React, { useState, useMemo, useCallback } from 'react';
import { generateHandExplanation } from '../../engine/rangeAnalyzer';
import './ActionRangeGrid.css';

/**
 * Grid visual 13x13 que mostra ranges coloridos por ação.
 * Cada mão é colorida conforme a ação recomendada.
 * Ao clicar em uma mão, mostra detalhes da análise.
 */

const ACTION_COLORS = {
  fold:  { bg: 'rgba(100,116,139,0.25)', border: 'rgba(100,116,139,0.4)', text: '#94a3b8', label: 'Fold',  icon: '🟥' },
  call:  { bg: 'rgba(34,197,94,0.3)',     border: 'rgba(34,197,94,0.5)',   text: '#4ade80', label: 'Call',  icon: '🟩' },
  raise: { bg: 'rgba(59,130,246,0.3)',     border: 'rgba(59,130,246,0.5)',  text: '#60a5fa', label: 'Raise', icon: '🟦' },
  '3bet':{ bg: 'rgba(99,102,241,0.35)',    border: 'rgba(99,102,241,0.5)', text: '#818cf8', label: '3-Bet', icon: '🟦' },
  allin: { bg: 'rgba(168,85,247,0.35)',    border: 'rgba(168,85,247,0.5)', text: '#c084fc', label: 'All-in',icon: '🟪' },
};

const ACTION_DESCRIPTIONS = {
  fold:  'Mãos sem equity suficiente para jogar nesta situação.',
  call:  'Mãos com equity para jogar mas não para 3-bet/raise.',
  raise: 'Mãos no range de abertura ou iso-raise.',
  '3bet':'Mãos fortes para 3-bet por valor ou proteção.',
  allin: 'Mãos para all-in (push/fold ou 4-bet shove).',
};

export default function ActionRangeGrid({ grid, actionStats, params, selectedHand }) {
  const [clickedHand, setClickedHand] = useState(null);
  const [handDetail, setHandDetail] = useState(null);
  const [highlightAction, setHighlightAction] = useState(null);

  const handleCellClick = useCallback((notation) => {
    if (clickedHand === notation) {
      setClickedHand(null);
      setHandDetail(null);
      return;
    }
    setClickedHand(notation);
    if (params) {
      const detail = generateHandExplanation(notation, params);
      setHandDetail(detail);
    }
  }, [clickedHand, params]);

  const handleActionFilter = useCallback((action) => {
    setHighlightAction(prev => prev === action ? null : action);
  }, []);

  // Ordena ações para exibição (raise/3bet/call/allin/fold)
  const displayActions = useMemo(() => {
    return ['raise', '3bet', 'call', 'allin', 'fold'].filter(a => actionStats[a]?.count > 0);
  }, [actionStats]);

  if (!grid || grid.length === 0) {
    return (
      <div className="action-range__empty">
        <p>Sem dados de range disponíveis.</p>
      </div>
    );
  }

  return (
    <div className="action-range">
      {/* ── Header ── */}
      <div className="action-range__header">
        <h4 className="action-range__title">📊 Ranges por Ação</h4>
        <span className="action-range__subtitle">Clique em uma mão para detalhes</span>
      </div>

      {/* ── Action Summary Cards ── */}
      <div className="action-range__stats">
        {displayActions.map(action => {
          const stats = actionStats[action];
          const colors = ACTION_COLORS[action];
          const isActive = highlightAction === action;
          return (
            <button
              key={action}
              className={`action-range__stat-card ${isActive ? 'action-range__stat-card--active' : ''}`}
              style={{
                '--stat-bg': colors.bg,
                '--stat-border': colors.border,
                '--stat-color': colors.text,
              }}
              onClick={() => handleActionFilter(action)}
              title={ACTION_DESCRIPTIONS[action]}
            >
              <span className="action-range__stat-label">{colors.label}</span>
              <span className="action-range__stat-freq">{stats.frequency}%</span>
              <span className="action-range__stat-ev">
                EV: {stats.avgEV > 0 ? '+' : ''}{stats.avgEV} BB
              </span>
              <span className="action-range__stat-count">{stats.count} mãos</span>
            </button>
          );
        })}
      </div>

      {/* ── Grid 13x13 ── */}
      <div className="action-range__grid-container">
        {grid.map((row, i) => (
          <div key={i} className="action-range__row">
            {row.map(cell => {
              const colors = ACTION_COLORS[cell.action] || ACTION_COLORS.fold;
              const isClicked = clickedHand === cell.notation;
              const isSelected = selectedHand === cell.notation;
              const isDimmed = highlightAction && cell.action !== highlightAction;

              return (
                <button
                  key={cell.notation}
                  className={[
                    'action-range__cell',
                    isClicked ? 'action-range__cell--clicked' : '',
                    isSelected ? 'action-range__cell--selected' : '',
                    isDimmed ? 'action-range__cell--dimmed' : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    '--cell-bg': colors.bg,
                    '--cell-border': colors.border,
                    '--cell-text': colors.text,
                  }}
                  onClick={() => handleCellClick(cell.notation)}
                  title={`${cell.notation} → ${colors.label}`}
                >
                  <span className="action-range__cell-text">{cell.notation}</span>
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── Legend ── */}
      <div className="action-range__legend">
        {Object.entries(ACTION_COLORS).map(([action, colors]) => (
          <button
            key={action}
            className={`action-range__legend-item ${highlightAction === action ? 'action-range__legend-item--active' : ''}`}
            onClick={() => handleActionFilter(action)}
          >
            <span
              className="action-range__legend-swatch"
              style={{ background: colors.bg, borderColor: colors.border }}
            />
            <span>{colors.label}</span>
          </button>
        ))}
      </div>

      {/* ── Hand Detail Panel ── */}
      {handDetail && (
        <div className="action-range__detail animate-fade-in-up">
          <div className="action-range__detail-header">
            <div className="action-range__detail-hand">
              <span className="action-range__detail-notation">{handDetail.hand}</span>
              <span
                className="action-range__detail-action-badge"
                style={{
                  background: ACTION_COLORS[handDetail.action]?.bg,
                  borderColor: ACTION_COLORS[handDetail.action]?.border,
                  color: ACTION_COLORS[handDetail.action]?.text,
                }}
              >
                {handDetail.actionName}
              </span>
            </div>
            <button className="action-range__detail-close" onClick={() => { setClickedHand(null); setHandDetail(null); }}>
              ✕
            </button>
          </div>
          <div className="action-range__detail-body">
            {handDetail.explanation.split('\n').map((line, i) => {
              if (line.startsWith('**')) {
                return <p key={i} className="action-range__detail-title">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.startsWith('Sizing')) {
                return <p key={i} className="action-range__detail-sizing">📏 {line}</p>;
              }
              if (line.startsWith('Range do')) {
                return <p key={i} className="action-range__detail-range">🎯 {line}</p>;
              }
              return <p key={i} className="action-range__detail-line">{line}</p>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}
