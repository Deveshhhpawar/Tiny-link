// db.js — robust SSL-aware pool for local + hosted (Neon / Vercel)
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set! Exiting.');
  // Optional: don't exit here; let other code handle missing DB
}

const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.NOW;

const pool = new Pool({
  connectionString,
  // For many hosted Postgres (Neon/Heroku) we need SSL but with rejectUnauthorized:false
  ...(isProd ? { ssl: { rejectUnauthorized: false } } : {})
});

pool.on('error', (err) => {
  console.error('Unexpected PG idle client error', err && err.stack ? err.stack : err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
