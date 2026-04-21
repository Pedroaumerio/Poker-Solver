import React, { useState, useCallback, useMemo } from 'react';
import { runSimulation, validateHand } from '../../services/simulatorService';
import { getValidPositions } from '../../engine/ranges';
import { generateRangeGrid } from '../../engine/ranges';
import { analyzeFullRange } from '../../engine/rangeAnalyzer';
import RangeGrid from '../../components/RangeGrid/RangeGrid';
import ActionRangeGrid from '../../components/ActionRangeGrid/ActionRangeGrid';
import { ACTION_NAMES, CATEGORY_NAMES, CATEGORY_COLORS } from '../../config/constants';
import './SimulatorPage.css';

const GAME_TYPE_OPTIONS = [
  { id: 'mtt', label: 'Torneio MTT', icon: '🏆' },
  { id: 'spin', label: 'Spin & Go', icon: '🎰' },
  { id: 'cash', label: 'Cash Game', icon: '💰' },
];

const PHASE_OPTIONS = [
  { id: 'early', label: 'Early Stage' },
  { id: 'middle', label: 'Middle Stage' },
  { id: 'bubble', label: 'Bubble' },
  { id: 'final', label: 'Mesa Final' },
];

const ACTION_OPTIONS = [
  { id: 'fold', label: 'Fold', color: '#94a3b8' },
  { id: 'call', label: 'Call', color: '#60a5fa' },
  { id: 'raise', label: 'Raise', color: '#fbbf24' },
  { id: '3bet', label: '3-Bet', color: '#fb923c' },
  { id: 'allin', label: 'All-in', color: '#f87171' },
];

const RANKS = ['A','K','Q','J','T','9','8','7','6','5','4','3','2'];

export default function SimulatorPage({ onBackToMenu }) {
  // ── Config state ──
  const [gameType, setGameType] = useState('mtt');
  const [heroPosition, setHeroPosition] = useState('CO');
  const [heroStack, setHeroStack] = useState(30);
  const [blindsSB, setBlindsSB] = useState(0.5);
  const [blindsBB, setBlindsBB] = useState(1);
  const [ante, setAnte] = useState(0);
  const [avgStack, setAvgStack] = useState(30);
  const [tournamentPhase, setTournamentPhase] = useState('middle');

  // ── Actions state ──
  const [previousActions, setPreviousActions] = useState([]);

  // ── Hand state ──
  const [handInput, setHandInput] = useState('');
  const [selectedHand, setSelectedHand] = useState('');
  const [handSelectionMode, setHandSelectionMode] = useState('grid'); // 'grid' | 'input'

  // ── Result state ──
  const [result, setResult] = useState(null);
  const [rangeAnalysis, setRangeAnalysis] = useState(null);
  const [error, setError] = useState('');

  // ── View mode for results ──
  const [resultView, setResultView] = useState('analysis'); // 'analysis' | 'ranges'

  // ── Derived ──
  const positions = useMemo(() => getValidPositions(gameType), [gameType]);

  // Posições disponíveis para ações anteriores (tudo antes do hero)
  const actionPositions = useMemo(() => {
    const heroIdx = positions.indexOf(heroPosition);
    if (heroIdx <= 0) return [];
    return positions.slice(0, heroIdx);
  }, [positions, heroPosition]);

  // ── Handlers ──

  const handleGameTypeChange = useCallback((type) => {
    setGameType(type);
    const newPositions = getValidPositions(type);
    if (!newPositions.includes(heroPosition)) {
      setHeroPosition(newPositions[Math.max(0, newPositions.length - 3)]); // CO or similar
    }
    setPreviousActions([]);
    setResult(null);
    setRangeAnalysis(null);
  }, [heroPosition]);

  const handlePositionChange = useCallback((pos) => {
    setHeroPosition(pos);
    setPreviousActions([]);
    setResult(null);
    setRangeAnalysis(null);
  }, []);

  const handleAddAction = useCallback((position, action, sizeBB = null) => {
    setPreviousActions(prev => {
      const existing = prev.findIndex(a => a.position === position);
      const entry = { position, action, sizeBB: sizeBB || (action === 'raise' ? 2.5 : action === '3bet' ? 7 : null) };
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = entry;
        return copy;
      }
      return [...prev, entry];
    });
    setResult(null);
    setRangeAnalysis(null);
  }, []);

  const handleRemoveAction = useCallback((position) => {
    setPreviousActions(prev => prev.filter(a => a.position !== position));
    setResult(null);
    setRangeAnalysis(null);
  }, []);

  const handleSelectHandFromGrid = useCallback((notation) => {
    setSelectedHand(notation);
    setHandInput(notation);
    setResult(null);
  }, []);

  const handleHandInputChange = useCallback((e) => {
    const val = e.target.value.toUpperCase().replace(/[^AKQJT98765432SO]/g, '');
    setHandInput(val);
    if (val.length >= 2 && validateHand(val)) {
      setSelectedHand(val);
    }
    setResult(null);
  }, []);

  // Params for range analysis (reused)
  const scenarioParams = useMemo(() => ({
    gameType,
    heroPosition,
    heroStack,
    blinds: { sb: blindsSB, bb: blindsBB },
    ante,
    avgStack,
    tournamentPhase: gameType === 'cash' ? null : tournamentPhase,
    actions: previousActions,
  }), [gameType, heroPosition, heroStack, blindsSB, blindsBB, ante, avgStack, tournamentPhase, previousActions]);

  const handleSimulate = useCallback(() => {
    setError('');
    const hand = selectedHand || handInput;

    if (!hand) {
      setError('Selecione ou digite uma mão para simular.');
      return;
    }

    if (!validateHand(hand)) {
      setError(`"${hand}" não é uma notação válida. Use formato: AKs, QJo, TT`);
      return;
    }

    try {
      const simResult = runSimulation({
        ...scenarioParams,
        hand,
      });
      setResult(simResult);

      // Também gera a análise de range completa
      const fullRange = analyzeFullRange(scenarioParams);
      setRangeAnalysis(fullRange);

      setResultView('analysis');
    } catch (err) {
      setError(err.message);
    }
  }, [scenarioParams, selectedHand, handInput]);

  const handleReset = useCallback(() => {
    setPreviousActions([]);
    setHandInput('');
    setSelectedHand('');
    setResult(null);
    setRangeAnalysis(null);
    setError('');
  }, []);

  // ── Hand Grid (13x13) ──
  const handGrid = useMemo(() => {
    const grid = [];
    for (let i = 0; i < 13; i++) {
      const row = [];
      for (let j = 0; j < 13; j++) {
        let notation;
        if (i === j) notation = `${RANKS[i]}${RANKS[j]}`;
        else if (i < j) notation = `${RANKS[i]}${RANKS[j]}s`;
        else notation = `${RANKS[j]}${RANKS[i]}o`;
        row.push(notation);
      }
      grid.push(row);
    }
    return grid;
  }, []);

  return (
    <div className="simulator">
      {/* Header */}
      <header className="simulator__header">
        <button className="simulator__back-btn" onClick={onBackToMenu} title="Voltar ao menu">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Menu</span>
        </button>
        <div className="simulator__header-center">
          <span className="simulator__badge">🧪 SIMULADOR</span>
          <h1 className="simulator__title">Criador de Situações</h1>
        </div>
        <button className="simulator__reset-btn" onClick={handleReset}>
          🔄 Reset
        </button>
      </header>

      <main className="simulator__main">
        <div className="simulator__grid">
          {/* ═══════════ LEFT: Configuration ═══════════ */}
          <div className="simulator__config">

            {/* Game Type */}
            <section className="sim-section">
              <h3 className="sim-section__title">🎮 Tipo de Jogo</h3>
              <div className="sim-chips">
                {GAME_TYPE_OPTIONS.map(g => (
                  <button
                    key={g.id}
                    className={`sim-chip ${gameType === g.id ? 'sim-chip--active' : ''}`}
                    onClick={() => handleGameTypeChange(g.id)}
                  >
                    <span>{g.icon}</span> {g.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Position */}
            <section className="sim-section">
              <h3 className="sim-section__title">📍 Posição do Hero</h3>
              <div className="sim-chips sim-chips--wrap">
                {positions.map(pos => (
                  <button
                    key={pos}
                    className={`sim-chip sim-chip--sm ${heroPosition === pos ? 'sim-chip--active' : ''}`}
                    onClick={() => handlePositionChange(pos)}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </section>

            {/* Stack & Blinds */}
            <section className="sim-section">
              <h3 className="sim-section__title">💰 Stack & Blinds</h3>
              <div className="sim-inputs">
                <div className="sim-input-group">
                  <label>Stack Hero (BB)</label>
                  <input
                    type="number" min="1" max="500" value={heroStack}
                    onChange={e => { setHeroStack(Number(e.target.value)); setResult(null); setRangeAnalysis(null); }}
                  />
                </div>
                <div className="sim-input-group">
                  <label>SB</label>
                  <input
                    type="number" min="0.1" step="0.1" value={blindsSB}
                    onChange={e => setBlindsSB(Number(e.target.value))}
                  />
                </div>
                <div className="sim-input-group">
                  <label>BB</label>
                  <input
                    type="number" min="0.5" step="0.5" value={blindsBB}
                    onChange={e => setBlindsBB(Number(e.target.value))}
                  />
                </div>
                <div className="sim-input-group">
                  <label>Ante</label>
                  <input
                    type="number" min="0" step="0.1" value={ante}
                    onChange={e => setAnte(Number(e.target.value))}
                  />
                </div>
              </div>
            </section>

            {/* Tournament Phase (only for MTT/Spin) */}
            {gameType !== 'cash' && (
              <section className="sim-section">
                <h3 className="sim-section__title">🏆 Fase do Torneio</h3>
                <div className="sim-inputs">
                  <div className="sim-input-group">
                    <label>AVG Stack (BB)</label>
                    <input
                      type="number" min="1" max="500" value={avgStack}
                      onChange={e => setAvgStack(Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="sim-chips sim-chips--wrap">
                  {PHASE_OPTIONS.map(p => (
                    <button
                      key={p.id}
                      className={`sim-chip sim-chip--sm ${tournamentPhase === p.id ? 'sim-chip--active' : ''}`}
                      onClick={() => { setTournamentPhase(p.id); setResult(null); setRangeAnalysis(null); }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Previous Actions */}
            <section className="sim-section">
              <h3 className="sim-section__title">🎬 Ações Anteriores</h3>
              {actionPositions.length === 0 ? (
                <p className="sim-section__empty">
                  O Hero é o primeiro a agir nesta posição.
                </p>
              ) : (
                <div className="sim-actions-list">
                  {actionPositions.map(pos => {
                    const existing = previousActions.find(a => a.position === pos);
                    return (
                      <div key={pos} className="sim-action-row">
                        <span className="sim-action-row__pos">{pos}</span>
                        <div className="sim-action-row__btns">
                          {ACTION_OPTIONS.map(act => (
                            <button
                              key={act.id}
                              className={`sim-action-btn ${existing?.action === act.id ? 'sim-action-btn--active' : ''}`}
                              style={existing?.action === act.id ? { background: act.color + '30', borderColor: act.color, color: act.color } : {}}
                              onClick={() => handleAddAction(pos, act.id)}
                              title={act.label}
                            >
                              {act.label}
                            </button>
                          ))}
                          {existing && (
                            <button className="sim-action-btn sim-action-btn--remove" onClick={() => handleRemoveAction(pos)} title="Remover">
                              ✕
                            </button>
                          )}
                        </div>
                        {existing && (existing.action === 'raise' || existing.action === '3bet') && (
                          <div className="sim-action-row__size">
                            <label>Tamanho (BB):</label>
                            <input
                              type="number" min="1" step="0.5"
                              value={existing.sizeBB || (existing.action === 'raise' ? 2.5 : 7)}
                              onChange={e => handleAddAction(pos, existing.action, Number(e.target.value))}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Hand Selection */}
            <section className="sim-section">
              <h3 className="sim-section__title">🃏 Mão do Hero</h3>
              <div className="sim-tabs">
                <button
                  className={`sim-tab ${handSelectionMode === 'grid' ? 'sim-tab--active' : ''}`}
                  onClick={() => setHandSelectionMode('grid')}
                >
                  Grid Visual
                </button>
                <button
                  className={`sim-tab ${handSelectionMode === 'input' ? 'sim-tab--active' : ''}`}
                  onClick={() => setHandSelectionMode('input')}
                >
                  Input Manual
                </button>
              </div>

              {handSelectionMode === 'input' ? (
                <div className="sim-hand-input">
                  <input
                    type="text"
                    value={handInput}
                    onChange={handleHandInputChange}
                    placeholder="Ex: AKs, QJo, TT"
                    maxLength={3}
                    className="sim-hand-input__field"
                  />
                  {selectedHand && (
                    <span className="sim-hand-input__preview">
                      ✅ {selectedHand}
                    </span>
                  )}
                </div>
              ) : (
                <div className="sim-hand-grid">
                  {handGrid.map((row, i) => (
                    <div key={i} className="sim-hand-grid__row">
                      {row.map(notation => (
                        <button
                          key={notation}
                          className={`sim-hand-grid__cell ${selectedHand === notation ? 'sim-hand-grid__cell--selected' : ''} ${
                            i === (12 - RANKS.indexOf(notation[0])) && i === (12 - RANKS.indexOf(notation[1])) ? 'sim-hand-grid__cell--pair' :
                            notation.endsWith('s') ? 'sim-hand-grid__cell--suited' : 'sim-hand-grid__cell--offsuit'
                          }`}
                          onClick={() => handleSelectHandFromGrid(notation)}
                          title={notation}
                        >
                          {notation}
                        </button>
                      ))}
                    </div>
                  ))}
                  <div className="sim-hand-grid__legend">
                    <span className="sim-hand-grid__legend-item"><span className="sim-hand-grid__swatch sim-hand-grid__swatch--pair"></span> Par</span>
                    <span className="sim-hand-grid__legend-item"><span className="sim-hand-grid__swatch sim-hand-grid__swatch--suited"></span> Suited</span>
                    <span className="sim-hand-grid__legend-item"><span className="sim-hand-grid__swatch sim-hand-grid__swatch--offsuit"></span> Offsuit</span>
                  </div>
                </div>
              )}
            </section>

            {/* Simulate Button */}
            <div className="simulator__run">
              {error && <p className="simulator__error">{error}</p>}
              <button className="simulator__run-btn" onClick={handleSimulate}>
                🚀 Simular Cenário
              </button>
            </div>
          </div>

          {/* ═══════════ RIGHT: Results ═══════════ */}
          <div className="simulator__results">
            {!result ? (
              <div className="sim-empty-result">
                <div className="sim-empty-result__icon">🎯</div>
                <h3>Configure e Simule</h3>
                <p>Selecione o tipo de jogo, posição, mão e ações anteriores,<br/>então clique em "Simular Cenário" para ver a análise.</p>
              </div>
            ) : (
              <>
                {/* Tab switcher for Analysis vs Ranges */}
                {rangeAnalysis && (
                  <div className="sim-result-tabs">
                    <button
                      className={`sim-result-tab ${resultView === 'analysis' ? 'sim-result-tab--active' : ''}`}
                      onClick={() => setResultView('analysis')}
                    >
                      🎯 Análise da Mão
                    </button>
                    <button
                      className={`sim-result-tab ${resultView === 'ranges' ? 'sim-result-tab--active' : ''}`}
                      onClick={() => setResultView('ranges')}
                    >
                      📊 Ranges por Ação
                    </button>
                  </div>
                )}

                {resultView === 'analysis' ? (
                  <div className="sim-result animate-fade-in-up">
                    {/* Best Action */}
                    <div className="sim-result__best-action">
                      <div className="sim-result__action-badge" data-action={result.bestAction}>
                        {ACTION_NAMES[result.bestAction] || result.bestAction}
                      </div>
                      {result.alternativeActions?.length > 0 && (
                        <div className="sim-result__alternatives">
                          Alt: {result.alternativeActions.map(a => ACTION_NAMES[a] || a).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="sim-result__stats">
                      <div className="sim-result__stat">
                        <span className="sim-result__stat-label">EV</span>
                        <span className={`sim-result__stat-value ${result.ev >= 0 ? 'sim-result__stat-value--positive' : 'sim-result__stat-value--negative'}`}>
                          {result.ev > 0 ? '+' : ''}{Number(result.ev.toFixed(1))} BB
                        </span>
                      </div>
                      <div className="sim-result__stat">
                        <span className="sim-result__stat-label">Frequência</span>
                        <span className="sim-result__stat-value">{Math.round(result.frequency)}%</span>
                      </div>
                      <div className="sim-result__stat">
                        <span className="sim-result__stat-label">Equity</span>
                        <span className="sim-result__stat-value">{result.equity}%</span>
                      </div>
                      <div className="sim-result__stat">
                        <span className="sim-result__stat-label">Pot</span>
                        <span className="sim-result__stat-value">{result.pot} BB</span>
                      </div>
                    </div>

                    {/* Hand Info */}
                    <div className="sim-result__hand-info">
                      <span className="sim-result__hand-notation">{selectedHand || handInput}</span>
                      <span className="sim-result__hand-category" style={{ color: CATEGORY_COLORS[result.handCategory] }}>
                        {CATEGORY_NAMES[result.handCategory]} ({result.handStrength}%)
                      </span>
                      <span className={`sim-result__in-range ${result.inRange ? 'sim-result__in-range--yes' : 'sim-result__in-range--no'}`}>
                        {result.inRange ? '✅ No range' : '❌ Fora do range'}
                      </span>
                    </div>

                    {/* Explanation */}
                    <div className="sim-result__explanation">
                      <h4>📝 Análise Detalhada</h4>
                      <div className="sim-result__explanation-text">
                        {result.explanation.split('\n').map((line, i) => {
                          if (line.startsWith('🎯') || line.startsWith('📊') || line.startsWith('🃏') || line.startsWith('💰') || line.startsWith('🏆') || line.startsWith('📈')) {
                            return <p key={i} className="sim-result__exp-heading">{line.replace(/\*\*/g, '')}</p>;
                          }
                          if (line.startsWith('✅') || line.startsWith('❌') || line.startsWith('⚠️')) {
                            return <p key={i} className={`sim-result__exp-verdict ${line.startsWith('✅') ? 'sim-result__exp-verdict--ok' : line.startsWith('❌') ? 'sim-result__exp-verdict--bad' : 'sim-result__exp-verdict--warn'}`}>{line.replace(/\*\*/g, '')}</p>;
                          }
                          if (!line.trim()) return null;
                          return <p key={i}>{line.replace(/\*\*/g, '')}</p>;
                        })}
                      </div>
                    </div>

                    {/* Range Grid (ideal range) */}
                    {result.idealRange && (
                      <div className="sim-result__range">
                        <RangeGrid range={result.idealRange} playerHand={selectedHand || handInput} />
                      </div>
                    )}

                    {/* Quick link to ranges view */}
                    {rangeAnalysis && (
                      <button
                        className="sim-result__view-ranges-btn"
                        onClick={() => setResultView('ranges')}
                      >
                        📊 Ver Ranges Completos por Ação →
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <ActionRangeGrid
                      grid={rangeAnalysis.grid}
                      actionStats={rangeAnalysis.actionStats}
                      params={scenarioParams}
                      selectedHand={selectedHand || handInput}
                    />

                    {/* Quick link back */}
                    <button
                      className="sim-result__view-ranges-btn"
                      onClick={() => setResultView('analysis')}
                      style={{ marginTop: '12px' }}
                    >
                      🎯 ← Voltar à Análise da Mão
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
