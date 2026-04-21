/**
 * DATABASE CONNECTION
 * Conexão com MySQL usando pool de conexões.
 * Compatível com MySQL Workbench.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'poker_solver',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

/**
 * Testa a conexão com o banco de dados.
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL conectado com sucesso');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar com MySQL:', error.message);
    return false;
  }
}

export default pool;
