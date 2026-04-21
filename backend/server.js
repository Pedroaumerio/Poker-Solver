/**
 * POKER SOLVER STUDY — Backend Server
 * 
 * Express server com API RESTful para gerenciamento
 * de histórico de mãos e estatísticas.
 * 
 * Estrutura:
 *   routes      → Rotas HTTP
 *   controllers → Entrada/saída (request/response)
 *   services    → Regras de negócio e validação
 *   models      → Queries MySQL
 *   database    → Pool de conexão
 *   config      → Variáveis de ambiente
 */

import express from 'express';
import cors from 'cors';
import config from './src/config/index.js';
import { testConnection } from './database/connection.js';
import historyRoutes from './src/routes/historyRoutes.js';

const app = express();

// ── Middlewares ──
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rotas ──
app.use('/api/history', historyRoutes);

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.server.env,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ──
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.path}` });
});

// ── Error Handler Global ──
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    error: config.server.env === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
});

// ── Inicialização ──
async function start() {
  // Testa conexão com MySQL
  const dbConnected = await testConnection();

  if (!dbConnected) {
    console.warn('⚠️  Servidor iniciando SEM conexão com MySQL.');
    console.warn('   O histórico de mãos não será persistido.');
    console.warn('   Configure o .env e rode o schema SQL para ativar.');
  }

  app.listen(config.server.port, () => {
    console.log(`\n🃏 Poker Solver API rodando na porta ${config.server.port}`);
    console.log(`   Ambiente: ${config.server.env}`);
    console.log(`   Health:   http://localhost:${config.server.port}/api/health`);
    console.log(`   API:      http://localhost:${config.server.port}/api/history\n`);
  });
}

start();
