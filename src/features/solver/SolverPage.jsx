import React, { useState, useCallback, useMemo } from 'react';
import { solvePostflopScenario } from '../../services/solverApiService';
import './SolverPage.css';

const DEFAULT_PLAYERS = [
  { id: 'BB', stack: 40, range: 'AA,KK,QQ,JJ,TT,AQs,AKo,AQo,KQs,76s,54s,22' },
  { id: 'BTN', stack: 40, range: 'AA,KK,QQ,JJ,AKs,AKo,AQs,KQs,QJs,JTs,T9s,33' },
];

function groupByNotation(combos) {
  const groups = new Map();
  for (const c of combos) {
    if (!groups.has(c.notation)) groups.set(c.notation, []);
    groups.get(c.notation).push(c);
  }
  const actionKeys = combos.length > 0 ? Object.keys(combos[0].strategy) : [];
  return [...groups.entries()].map(([notation, items]) => {
    const avgStrategy = {};
    for (const key of actionKeys) {
      avgStrategy[key] = items.reduce((s, it) => s + (it.strategy[key] || 0), 0) / items.length;
    }
    const avgEv = items.reduce((s, it) => s + it.evBB, 0) / items.length;
    return { notation, count: items.length, avgStrategy, avgEv, combos: items };
  });
}

const ACTION_COLORS = {
  Fold: '#94a3b8',
  Check: '#60a5fa',
  Call: '#38bdf8',
  Bet: '#fbbf24',
  Raise: '#fb923c',
  'All-in': '#f87171',
};

function actionColor(label) {
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (label.startsWith(key)) return color;
  }
  return '#a78bfa';
}

export default function SolverPage({ onBackToMenu }) {
  const [players, setPlayers] = useState(DEFAULT_PLAYERS);
  const [board, setBoard] = useState('As 7d 2h');
  const [potPre, setPotPre] = useState(6);
  const [iterations, setIterations] = useState(600);
  const [timeBudgetMs, setTimeBudgetMs] = useState(25000);
  const [flopSizes, setFlopSizes] = useState('50,100');
  const [turnSizes, setTurnSizes] = useState('66,100');
  const [riverSizes, setRiverSizes] = useState('75');
  const [maxRaisesPerStreet, setMaxRaisesPerStreet] = useState(2);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [expandedNotation, setExpandedNotation] = useState(null);

  const updatePlayer = useCallback((idx, field, value) => {
    setPlayers(prev => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  }, []);

  const addPlayer = useCallback(() => {
    setPlayers(prev => [...prev, { id: `P${prev.length + 1}`, stack: 40, range: '' }]);
  }, []);

  const removePlayer = useCallback((idx) => {
    setPlayers(prev => prev.filter((_, i) => i !== idx));
  }, []);

  const parseSizes = (str) => str.split(',').map(s => Number(s.trim())).filter(n => !isNaN(n) && n > 0).map(n => n / 100);

  const handleSolve = useCallback(async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const scenario = {
        players: players.map(p => ({ id: p.id, stack: Number(p.stack), range: p.range })),
        board,
        potPre: Number(potPre),
        iterations: Number(iterations),
        timeBudgetMs: Number(timeBudgetMs),
        maxRaisesPerStreet: Number(maxRaisesPerStreet),
        betSizes: {
          flop: parseSizes(flopSizes),
          turn: parseSizes(turnSizes),
          river: parseSizes(riverSizes),
        },
      };
      const data = await solvePostflopScenario(scenario);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [players, board, potPre, iterations, timeBudgetMs, maxRaisesPerStreet, flopSizes, turnSizes, riverSizes]);

  const firstActorId = result ? Object.keys(result.players)[0] : null;
  const actorData = firstActorId ? result.players[firstActorId] : null;
  const grouped = useMemo(() => (actorData ? groupByNotation(actorData.combos) : []), [actorData]);
  const sortedGrouped = useMemo(
    () => [...grouped].sort((a, b) => b.avgEv - a.avgEv),
    [grouped]
  );

  return (
    <div className="solver-real">
      <header className="solver-real__header">
        <button className="solver-real__back-btn" onClick={onBackToMenu}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>Menu</span>
        </button>
        <div className="solver-real__header-center">
          <span className="solver-real__badge">⚙️ SOLVER REAL (CFR)</span>
          <h1 className="solver-real__title">Solver Pós-Flop</h1>
        </div>
        <div style={{ width: 90 }} />
      </header>

      <main className="solver-real__main">
        <div className="solver-real__grid">
          {/* ═══════ CONFIG ═══════ */}
          <div className="solver-real__config">
            <section className="sr-section">
              <h3 className="sr-section__title">🃏 Board (flop)</h3>
              <input
                className="sr-input sr-input--wide"
                value={board}
                onChange={e => setBoard(e.target.value)}
                placeholder="Ex: As Kd 2h"
              />
              <p className="sr-hint">O solver resolve a árvore completa flop → river (turn/river são sorteados e resolvidos via CFR com amostragem de chance).</p>
            </section>

            <section className="sr-section">
              <h3 className="sr-section__title">💰 Pote & Apostas</h3>
              <div className="sr-inputs-row">
                <label>Pote pré-flop (BB)
                  <input className="sr-input" type="number" value={potPre} onChange={e => setPotPre(e.target.value)} />
                </label>
                <label>Máx. raises/street
                  <input className="sr-input" type="number" min="1" max="4" value={maxRaisesPerStreet} onChange={e => setMaxRaisesPerStreet(e.target.value)} />
                </label>
              </div>
              <div className="sr-inputs-row">
                <label>Sizings Flop (% pot)
                  <input className="sr-input" value={flopSizes} onChange={e => setFlopSizes(e.target.value)} placeholder="50,100" />
                </label>
                <label>Sizings Turn (% pot)
                  <input className="sr-input" value={turnSizes} onChange={e => setTurnSizes(e.target.value)} placeholder="66,100" />
                </label>
                <label>Sizings River (% pot)
                  <input className="sr-input" value={riverSizes} onChange={e => setRiverSizes(e.target.value)} placeholder="75" />
                </label>
              </div>
              <p className="sr-hint">All-in está sempre disponível além dos tamanhos listados. Menos tamanhos = solve mais rápido.</p>
            </section>

            <section className="sr-section">
              <h3 className="sr-section__title">👥 Jogadores (ordem de ação pós-flop)</h3>
              {players.map((p, idx) => (
                <div key={idx} className="sr-player-row">
                  <input
                    className="sr-input sr-input--id"
                    value={p.id}
                    onChange={e => updatePlayer(idx, 'id', e.target.value)}
                    placeholder="ID"
                  />
                  <input
                    className="sr-input sr-input--stack"
                    type="number"
                    value={p.stack}
                    onChange={e => updatePlayer(idx, 'stack', e.target.value)}
                    placeholder="Stack (BB)"
                  />
                  <input
                    className="sr-input sr-input--range"
                    value={p.range}
                    onChange={e => updatePlayer(idx, 'range', e.target.value)}
                    placeholder="Range: AA,KK,AKs,76s,22..."
                  />
                  {players.length > 2 && (
                    <button className="sr-remove-btn" onClick={() => removePlayer(idx)}>✕</button>
                  )}
                </div>
              ))}
              <button className="sr-add-btn" onClick={addPlayer}>+ Adicionar jogador</button>
              <p className="sr-hint">Ranges maiores e mais jogadores tornam o solve mais lento (multiway é uma aproximação — reach de cada oponente é tratado independentemente).</p>
            </section>

            <section className="sr-section">
              <h3 className="sr-section__title">🧮 Iterações CFR</h3>
              <div className="sr-inputs-row">
                <label>Iterações
                  <input className="sr-input" type="number" value={iterations} onChange={e => setIterations(e.target.value)} />
                </label>
                <label>Tempo máx. (ms)
                  <input className="sr-input" type="number" value={timeBudgetMs} onChange={e => setTimeBudgetMs(e.target.value)} />
                </label>
              </div>
            </section>

            <div className="solver-real__run">
              {error && <p className="solver-real__error">{error}</p>}
              <button className="solver-real__run-btn" onClick={handleSolve} disabled={loading}>
                {loading ? '⏳ Resolvendo...' : '🚀 Resolver (CFR)'}
              </button>
            </div>
          </div>

          {/* ═══════ RESULTS ═══════ */}
          <div className="solver-real__results">
            {!result ? (
              <div className="sr-empty-result">
                <div className="sr-empty-result__icon">🧮</div>
                <h3>Configure e resolva</h3>
                <p>Defina board, pote, jogadores e ranges, depois clique em "Resolver".<br/>
                O motor roda CFR de verdade (Monte Carlo, chance-sampled) — sem heurísticas.</p>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <div className="sr-meta">
                  <span>Iterações: <b>{result.iterationsRun}</b></span>
                  <span>Tempo: <b>{(result.elapsedMs / 1000).toFixed(1)}s</b></span>
                  <span>Board: <b>{result.board}</b></span>
                  <span>Pote pré: <b>{result.potPre} BB</b></span>
                </div>

                {result.warnings.length > 0 && (
                  <div className="sr-warnings">
                    {result.warnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
                  </div>
                )}

                <h3 className="sr-result-title">Decisão de <b>{firstActorId}</b> (primeiro a agir no flop)</h3>

                <div className="sr-aggregate">
                  {Object.entries(actorData.aggregate).map(([action, freq]) => (
                    <div key={action} className="sr-freq-bar">
                      <div className="sr-freq-bar__label">
                        <span>{action}</span>
                        <span>{freq}%</span>
                      </div>
                      <div className="sr-freq-bar__track">
                        <div
                          className="sr-freq-bar__fill"
                          style={{ width: `${freq}%`, background: actionColor(action) }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="sr-avg-ev">
                    EV médio do range: <b className={actorData.avgEvBB >= 0 ? 'positive' : 'negative'}>
                      {actorData.avgEvBB > 0 ? '+' : ''}{actorData.avgEvBB} BB
                    </b>
                  </div>
                </div>

                <h4 className="sr-table-title">Estratégia por mão (agrupada)</h4>
                <div className="sr-table-wrap">
                  <table className="sr-table">
                    <thead>
                      <tr>
                        <th>Mão</th>
                        <th>Combos</th>
                        {Object.keys(actorData.aggregate).map(a => <th key={a}>{a}</th>)}
                        <th>EV (BB)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedGrouped.map(g => (
                        <React.Fragment key={g.notation}>
                          <tr
                            className="sr-table__row"
                            onClick={() => setExpandedNotation(expandedNotation === g.notation ? null : g.notation)}
                          >
                            <td className="sr-table__notation">{g.notation}</td>
                            <td>{g.count}</td>
                            {Object.keys(actorData.aggregate).map(a => (
                              <td key={a}>{(g.avgStrategy[a] ?? 0).toFixed(1)}%</td>
                            ))}
                            <td className={g.avgEv >= 0 ? 'positive' : 'negative'}>
                              {g.avgEv > 0 ? '+' : ''}{g.avgEv.toFixed(2)}
                            </td>
                          </tr>
                          {expandedNotation === g.notation && g.combos.map(c => (
                            <tr key={c.combo} className="sr-table__subrow">
                              <td colSpan={2} className="sr-table__combo">{c.combo}</td>
                              {Object.keys(actorData.aggregate).map(a => (
                                <td key={a}>{(c.strategy[a] ?? 0).toFixed(1)}%</td>
                              ))}
                              <td className={c.evBB >= 0 ? 'positive' : 'negative'}>
                                {c.evBB > 0 ? '+' : ''}{c.evBB.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
