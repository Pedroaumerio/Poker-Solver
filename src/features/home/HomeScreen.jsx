import React from 'react';
import { GAME_TYPES } from '../../config/constants';
import './HomeScreen.css';

/**
 * Tela inicial - Seleção do formato de jogo
 */
export default function HomeScreen({ onSelectGameType, onOpenSimulator }) {
  return (
    <div className="home">
      {/* Background effects */}
      <div className="home__bg-effects">
        <div className="home__bg-orb home__bg-orb--1"></div>
        <div className="home__bg-orb home__bg-orb--2"></div>
        <div className="home__bg-orb home__bg-orb--3"></div>
      </div>

      {/* Header */}
      <header className="home__header">
        <div className="home__logo">
          <span className="home__logo-icon">♠</span>
          <div className="home__logo-text">
            <h1 className="home__title">Poker Solver Study</h1>
            <p className="home__tagline">Treine suas decisões como um profissional</p>
          </div>
        </div>
      </header>

      {/* Stats preview */}
      <div className="home__stats">
        <div className="home__stat">
          <span className="home__stat-value">GTO</span>
          <span className="home__stat-label">Estratégia</span>
        </div>
        <div className="home__stat-divider"></div>
        <div className="home__stat">
          <span className="home__stat-value">∞</span>
          <span className="home__stat-label">Mãos para Treinar</span>
        </div>
        <div className="home__stat-divider"></div>
        <div className="home__stat">
          <span className="home__stat-value">EV+</span>
          <span className="home__stat-label">Decisões</span>
        </div>
      </div>

      {/* Game type cards */}
      <div className="home__cards">
        {GAME_TYPES.map((game, index) => (
          <button
            key={game.id}
            className="home__card"
            onClick={() => onSelectGameType(game.id)}
            style={{
              animationDelay: `${index * 150}ms`,
            }}
          >
            <div className="home__card-glow" style={{ background: game.gradient }}></div>
            <div className="home__card-content">
              <div className="home__card-header">
                <span className="home__card-icon">{game.icon}</span>
                <div>
                  <h2 className="home__card-title">{game.title}</h2>
                  <span className="home__card-subtitle">{game.subtitle}</span>
                </div>
              </div>
              <p className="home__card-description">{game.description}</p>
              <div className="home__card-features">
                {game.features.map((feature) => (
                  <span key={feature} className="home__card-feature">{feature}</span>
                ))}
              </div>
              <div className="home__card-cta">
                <span>Iniciar Treino</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Simulator Card */}
      {onOpenSimulator && (
        <div className="home__simulator" style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '1100px', marginBottom: 'var(--space-3xl)' }}>
          <button
            className="home__simulator-btn"
            onClick={onOpenSimulator}
          >
            <span className="home__simulator-icon">🧪</span>
            <div className="home__simulator-text">
              <h3 className="home__simulator-title">Simulador de Situações</h3>
              <p className="home__simulator-desc">Crie cenários personalizados e analise a melhor jogada</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M8 4L14 10L8 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}

      {/* Footer */}
      <footer className="home__footer">
        <p>Baseado em estratégias GTO simplificadas para estudo e aprendizado</p>
      </footer>
    </div>
  );
}
