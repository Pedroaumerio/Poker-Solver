/**
 * CONFIGURAÇÃO DO SERVIDOR
 * Centraliza variáveis de ambiente.
 */

import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const config = {
  server: {
    port: parseInt(process.env.PORT) || 3001,
    env: process.env.NODE_ENV || 'development',
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'poker_solver',
  },
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? 'https://seu-dominio.com'
      : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  },
};

export default config;
