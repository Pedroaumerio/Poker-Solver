import { useEffect } from 'react';

/**
 * Hook para gerenciar atalhos de teclado globais.
 * Extração direta do App.jsx — nenhuma lógica alterada.
 *
 * @param {boolean} showResult - Se o resultado está visível
 * @param {Function} handleNextHand - Callback para próxima mão
 */
export default function useKeyboardShortcuts(showResult, handleNextHand) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showResult && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        handleNextHand();
      }
      if (e.key === 'Escape') {
        if (showResult) {
          handleNextHand();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, handleNextHand]);
}
