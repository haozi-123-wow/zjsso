const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

async function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      idleTimeout: 60000
    });
  }
  return pool;
}

async function query(sql, params) {
  const pool = await getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function getConnection() {
  const pool = await getPool();
  return pool.getConnection();
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getPool,
  query,
  getConnection,
  closePool
};
