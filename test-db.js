// test-db.js
require('dotenv').config();
const { Pool } = require('pg');

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // If you're using Neon or other managed PG that requires SSL:
    // ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting using:', process.env.DATABASE_URL ? 'DATABASE_URL set' : 'NO DATABASE_URL');
    const r = await pool.query('SELECT 1 AS ok');
    console.log('PG test result:', r.rows);
  } catch (err) {
    console.error('PG connection failed:', err);
  } finally {
    await pool.end();
  }
})();
