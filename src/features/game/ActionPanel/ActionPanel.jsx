import React from 'react';
import { ALL_ACTIONS } from '../../../config/constants';
import './ActionPanel.css';

/**
 * Painel de ações do jogador
 * TODAS as ações são sempre exibidas — nenhuma é bloqueada.
 * O sistema avalia se a decisão foi correta DEPOIS.
 */
export default function ActionPanel({ onAction, disabled }) {
  // Keyboard shortcuts — sempre ativos para todas as 5 ações
  React.useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e) => {
      const key = e.key.toUpperCase();
      const action = ALL_ACTIONS.find(a => a.shortcut === key);
      if (action) {
        e.preventDefault();
        onAction(action.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onAction]);

  return (
    <div className="action-panel">
      <div className="action-panel__label">Escolha sua ação:</div>
      <div className="action-panel__buttons">
        {ALL_ACTIONS.map((action, index) => (
          <button
            key={action.id}
            className={`action-btn ${action.className}`}
            onClick={() => onAction(action.id)}
            disabled={disabled}
            style={{ animationDelay: `${index * 80}ms` }}
            title={`${action.label} (${action.shortcut})`}
          >
            <span className="action-btn__icon">{action.icon}</span>
            <span className="action-btn__label">{action.label}</span>
            <span className="action-btn__shortcut">{action.shortcut}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
