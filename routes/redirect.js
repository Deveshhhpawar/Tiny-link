// routes/redirect.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/:code', async (req, res, next) => {
  const code = req.params.code;
  // only accept codes matching the pattern to avoid catching other routes
  if (!/^[A-Za-z0-9]{6,8}$/.test(code)) return next();

  try {
    const sql = `
      UPDATE links
      SET clicks = clicks + 1, last_clicked_at = now()
      WHERE code = $1 AND deleted = false
      RETURNING target
    `;
    const r = await db.query(sql, [code]);
    if (r.rowCount === 0) return res.status(404).send('Not Found');
    const target = r.rows[0].target;
    return res.redirect(302, target);
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
});

module.exports = router;
