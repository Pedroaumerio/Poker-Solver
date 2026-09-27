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
      // Em dev, o Vite pode subir em qualquer porta livre (5173, 5174, ...)
      // se a padrão já estiver ocupada — aceita qualquer localhost/127.0.0.1.
      : /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
    credentials: true,
  },
};

export default config;
