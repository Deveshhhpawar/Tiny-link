// db.js
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) console.error('DATABASE_URL not set!');

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.NOW;

let pool;
if (global._pgPool) {
  pool = global._pgPool;
} else {
  pool = new Pool({
    connectionString,
    ...(isProd ? { ssl: { rejectUnauthorized: false } } : {})
  });
  global._pgPool = pool;
}

pool.on('error', (err) => {
  console.error('Unexpected PG idle client error', err && err.stack ? err.stack : err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
