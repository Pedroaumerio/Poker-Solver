import React from 'react';
import PokerTable from './PokerTable/PokerTable';
import ActionPanel from './ActionPanel/ActionPanel';
import AnalysisPanel from './AnalysisPanel/AnalysisPanel';
import HandHistory from './HandHistory/HandHistory';
import { GAME_LABELS } from '../../config/constants';
import './GameScreen.css';

/**
 * Tela principal do jogo — layout com mesa, ações, análise e sidebar.
 * Extraído do App.jsx original para separar layout de state management.
 */
export default function GameScreen({
  gameType,
  scenario,
  result,
  showResult,
  history,
  score,
  showHistory,
  mainRef,
  onAction,
  onNextHand,
  onBackToMenu,
  onToggleHistory,
}) {
  return (
    <div className="app" ref={mainRef}>
      {/* Top bar */}
      <header className="app__header">
        <button className="app__back-btn" onClick={onBackToMenu} title="Voltar ao menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Menu</span>
        </button>

        <div className="app__header-center">
          <span className="app__game-type-badge">{GAME_LABELS[gameType]}</span>
          <span className="app__hand-count">Mão #{history.length + 1}</span>
        </div>

        <div className="app__header-right">
          <button
            className={`app__toggle-btn ${showHistory ? 'app__toggle-btn--active' : ''}`}
            onClick={onToggleHistory}
            title="Histórico"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M9 1.5V9L13 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9" cy="9" r="7.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span className="app__toggle-label">Histórico</span>
          </button>

          <div className="app__mini-score">
            <span className="app__mini-score-correct">✅ {score.correct}</span>
            <span className="app__mini-score-wrong">❌ {score.wrong}</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="app__main">
        <div className={`app__game-area ${showHistory ? 'app__game-area--with-sidebar' : ''}`}>
          {/* Game column */}
          <div className="app__game-column">
            {/* Poker table */}
            <PokerTable scenario={scenario} showResult={showResult} result={result} />

            {/* Actions or Analysis */}
            {!showResult ? (
              <ActionPanel
                onAction={onAction}
                disabled={showResult}
              />
            ) : (
              <>
                <AnalysisPanel result={result} scenario={scenario} />

                {/* Next hand button */}
                <div className="app__next-hand">
                  <button className="app__next-btn" onClick={onNextHand}>
                    <span>Próxima Mão</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <span className="app__next-hint">Pressione Enter ou Espaço</span>
                </div>
              </>
            )}
          </div>

          {/* History sidebar */}
          {showHistory && (
            <aside className="app__sidebar">
              <HandHistory history={history} score={score} />
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
