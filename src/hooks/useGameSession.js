import { useState, useCallback, useRef } from 'react';
import { createScenario, evaluateAction } from '../services/pokerService';

/**
 * Hook custom que gerencia toda a sessão de jogo:
 * - State do cenário, resultado, histórico, pontuação
 * - Ações: iniciar mão, processar ação, próxima mão, voltar ao menu
 *
 * Extração direta do App.jsx — nenhuma lógica alterada.
 */
export default function useGameSession() {
  const [gameType, setGameType] = useState(null); // null = home screen
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });
  const [showHistory, setShowHistory] = useState(false);

  const mainRef = useRef(null);

  // Inicia um novo cenário
  const startNewHand = useCallback((type) => {
    const newScenario = createScenario(type || gameType);
    setScenario(newScenario);
    setResult(null);
    setShowResult(false);

    // Scroll to top
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [gameType]);

  // Seleciona formato de jogo
  const handleSelectGameType = useCallback((type) => {
    setGameType(type);
    setHistory([]);
    setScore({ correct: 0, wrong: 0 });
    startNewHand(type);
  }, [startNewHand]);

  // Processa ação do jogador
  const handleAction = useCallback((action) => {
    if (!scenario || showResult) return;

    const analysis = evaluateAction(scenario, action);
    setResult(analysis);
    setShowResult(true);

    // Atualiza histórico e pontuação
    const historyEntry = {
      notation: scenario.handNotation,
      position: scenario.position,
      stackBB: scenario.stackBB,
      playerAction: action,
      isCorrect: analysis.isCorrect,
      ev: analysis.ev,
      gameType: scenario.gameType,
    };

    setHistory(prev => [...prev, historyEntry]);
    setScore(prev => ({
      correct: prev.correct + (analysis.isCorrect ? 1 : 0),
      wrong: prev.wrong + (analysis.isCorrect ? 0 : 1),
    }));
  }, [scenario, showResult]);

  // Próxima mão
  const handleNextHand = useCallback(() => {
    startNewHand();
  }, [startNewHand]);

  // Volta ao menu
  const handleBackToMenu = useCallback(() => {
    setGameType(null);
    setScenario(null);
    setResult(null);
    setShowResult(false);
  }, []);

  // Toggle do sidebar de histórico
  const toggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  return {
    // State
    gameType,
    scenario,
    result,
    showResult,
    history,
    score,
    showHistory,
    mainRef,

    // Actions
    handleSelectGameType,
    handleAction,
    handleNextHand,
    handleBackToMenu,
    toggleHistory,
  };
}
