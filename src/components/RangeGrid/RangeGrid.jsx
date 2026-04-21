import React, { useMemo } from 'react';
import { generateRangeGrid } from '../../engine/ranges';
import './RangeGrid.css';

/**
 * Grid visual de ranges 13x13
 * Mostra quais mãos estão no range ideal e destaca a mão do jogador
 */
export default function RangeGrid({ range, playerHand }) {
  const grid = useMemo(() => generateRangeGrid(range || []), [range]);

  if (!range || range.length === 0) {
    return (
      <div className="range-grid__empty">
        <p>Sem range disponível para este cenário</p>
      </div>
    );
  }

  const rangePercentage = ((range.length / 169) * 100).toFixed(1);

  return (
    <div className="range-grid">
      <div className="range-grid__header">
        <h4 className="range-grid__title">Range Ideal</h4>
        <span className="range-grid__percentage">{rangePercentage}% das mãos</span>
      </div>
      <div className="range-grid__container">
        {grid.map((row, i) => (
          <div key={i} className="range-grid__row">
            {row.map((cell) => {
              const isPlayer = playerHand === cell.notation;
              const cellClass = [
                'range-grid__cell',
                cell.inRange ? 'range-grid__cell--in-range' : '',
                cell.isPair ? 'range-grid__cell--pair' : '',
                cell.isSuited ? 'range-grid__cell--suited' : '',
                cell.isOffsuit ? 'range-grid__cell--offsuit' : '',
                isPlayer ? 'range-grid__cell--player' : '',
              ].filter(Boolean).join(' ');

              return (
                <div
                  key={cell.notation}
                  className={cellClass}
                  title={`${cell.notation} ${cell.inRange ? '✅ No range' : '❌ Fora do range'}`}
                >
                  <span className="range-grid__cell-text">{cell.notation}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="range-grid__legend">
        <div className="range-grid__legend-item">
          <div className="range-grid__legend-swatch range-grid__legend-swatch--in-range"></div>
          <span>No range</span>
        </div>
        <div className="range-grid__legend-item">
          <div className="range-grid__legend-swatch range-grid__legend-swatch--out-range"></div>
          <span>Fora do range</span>
        </div>
        {playerHand && (
          <div className="range-grid__legend-item">
            <div className="range-grid__legend-swatch range-grid__legend-swatch--player"></div>
            <span>Sua mão</span>
          </div>
        )}
      </div>
    </div>
  );
}
