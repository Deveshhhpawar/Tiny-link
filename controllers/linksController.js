// controllers/linksController.js
const db = require('../db');

const codePattern = /^[A-Za-z0-9]{6,8}$/;

// helper to validate url
function isValidUrl(u) {
  try {
    const parsed = new URL(u);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

// generate random code [A-Za-z0-9], length 6
function genCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < length; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function createLink({ target, code }) {
  if (!isValidUrl(target)) {
    const err = new Error('invalid_url');
    err.code = 'INVALID';
    throw err;
  }
  // if custom code provided, ensure unique
  const client = db.pool;
  // Try to insert; if code not provided, generate and retry up to N times
  let attempts = 0;
  const maxAttempts = 5;
  while (attempts < maxAttempts) {
    attempts++;
    const useCode = code ? code : genCode(6);
    if (!code && !codePattern.test(useCode)) continue;
    try {
      const sql = `INSERT INTO links (code, target) VALUES ($1, $2) RETURNING code, target, clicks, created_at, last_clicked_at`;
      const r = await db.query(sql, [useCode, target]);
      return r.rows[0];
    } catch (err) {
      // duplicate key
      if (err.code === '23505') {
        if (code) {
          const e = new Error('code_exists');
          e.code = 'CONFLICT';
          throw e;
        }
        // else generated code conflict, try again
        continue;
      } else {
        throw err;
      }
    }
  }
  const e = new Error('could_not_generate_code');
  e.code = 'CONFLICT';
  throw e;
}

async function listLinks() {
  const sql = `SELECT code, target, clicks, created_at, last_clicked_at FROM links WHERE deleted = false ORDER BY created_at DESC`;
  const r = await db.query(sql);
  return r.rows;
}

async function getLink(code) {
  const sql = `SELECT code, target, clicks, created_at, last_clicked_at FROM links WHERE code = $1 AND deleted = false`;
  const r = await db.query(sql, [code]);
  return r.rows[0] || null;
}

async function deleteLink(code) {
  const sql = `UPDATE links SET deleted = true WHERE code = $1 AND deleted = false RETURNING code`;
  const r = await db.query(sql, [code]);
  return r.rowCount > 0;
}

module.exports = {
  createLink,
  listLinks,
  getLink,
  deleteLink
};
