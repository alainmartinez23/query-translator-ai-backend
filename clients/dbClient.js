const { Pool } = require('pg');

const TIMEOUT_MS = parseInt(process.env.DB_TIMEOUT_MS) || 5000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  statement_timeout: TIMEOUT_MS,
  connectionTimeoutMillis: TIMEOUT_MS,
  ssl: {
    rejectUnauthorized: false,
  }
});

async function executeQuery(sql) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return result.rows;
  } finally {
    client.release();
  }
}

module.exports = { executeQuery };
