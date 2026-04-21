import React, { useState, useCallback } from 'react';
import HomePage from './pages/Home';
import GamePage from './pages/Game';
import SimulatorPage from './pages/Simulator';
import useGameSession from './hooks/useGameSession';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';

/**
 * App principal - Poker Solver Study
 *
 * Responsabilidade única: orquestrar a navegação entre
 * páginas, delegando toda a lógica para hooks e services.
 *
 * Rotas:
 *  - null     → HomeScreen (seleção de formato)
 *  - 'sim'    → Simulador de situações
 *  - 'mtt'|'spin'|'cash' → GameScreen (treino)
 */
export default function App() {
  const [currentPage, setCurrentPage] = useState(null); // null | 'sim'

  const {
    gameType,
    scenario,
    result,
    showResult,
    history,
    score,
    showHistory,
    mainRef,
    handleSelectGameType,
    handleAction,
    handleNextHand,
    handleBackToMenu: hookBackToMenu,
    toggleHistory,
  } = useGameSession();

  // Atalhos de teclado (Enter/Space/Escape)
  useKeyboardShortcuts(showResult, handleNextHand);

  // Navega para o simulador
  const handleOpenSimulator = useCallback(() => {
    setCurrentPage('sim');
  }, []);

  // Volta ao menu principal
  const handleBackToMenu = useCallback(() => {
    setCurrentPage(null);
    hookBackToMenu();
  }, [hookBackToMenu]);

  // Seleciona jogo (e sai do simulador se necessário)
  const handleSelectGame = useCallback((type) => {
    setCurrentPage(null);
    handleSelectGameType(type);
  }, [handleSelectGameType]);

  // Simulador
  if (currentPage === 'sim') {
    return <SimulatorPage onBackToMenu={handleBackToMenu} />;
  }

  // Página inicial
  if (!gameType) {
    return (
      <HomePage
        onSelectGameType={handleSelectGame}
        onOpenSimulator={handleOpenSimulator}
      />
    );
  }

  // Tela do jogo
  return (
    <GamePage
      gameType={gameType}
      scenario={scenario}
      result={result}
      showResult={showResult}
      history={history}
      score={score}
      showHistory={showHistory}
      mainRef={mainRef}
      onAction={handleAction}
      onNextHand={handleNextHand}
      onBackToMenu={handleBackToMenu}
      onToggleHistory={toggleHistory}
    />
  );
}
