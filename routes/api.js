// routes/api.js
const express = require('express');
const { body, param, validationResult } = require('express-validator');
const controller = require('../controllers/linksController');

const router = express.Router();

const codePattern = /^[A-Za-z0-9]{6,8}$/;

router.post(
  '/links',
  [
    body('target').exists().withMessage('target is required'),
    body('target').isString(),
    body('code').optional().isString().custom(val => codePattern.test(val)).withMessage('code must match [A-Za-z0-9]{6,8}')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const { target, code } = req.body;
      const result = await controller.createLink({ target, code });
      return res.status(201).json(result);
    } catch (err) {
      if (err && err.code === 'CONFLICT') return res.status(409).json({ error: err.message });
      console.error(err);
      return res.status(500).json({ error: 'internal_error' });
    }
  }
);

router.get('/links', async (req, res) => {
  try {
    const rows = await controller.listLinks();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal_error' });
  }
});

router.get(
  '/links/:code',
  [param('code').custom(val => codePattern.test(val)).withMessage('invalid code')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
      const code = req.params.code;
      const row = await controller.getLink(code);
      if (!row) return res.status(404).json({ error: 'not_found' });
      res.json(row);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal_error' });
    }
  }
);

router.delete(
  '/links/:code',
  [param('code').custom(val => codePattern.test(val)).withMessage('invalid code')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
      const code = req.params.code;
      const ok = await controller.deleteLink(code);
      if (!ok) return res.status(404).json({ error: 'not_found' });
      res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'internal_error' });
    }
  }
);

module.exports = router;
