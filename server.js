// server.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

const apiRoutes = require('./routes/api');
const redirect = require('./routes/redirect');

const app = express();


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // allow Tailwind CDN script in addition to self
      scriptSrc: ["'self'", "https://cdn.tailwindcss.com"],
      // allow styles from self and https, and inline (Tailwind injects style tags)
      styleSrc: ["'self'", "https:", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"]
    }
  }
}))
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static frontend
app.use(express.static(path.join(__dirname, 'public')));

// healthz
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: process.env.APP_VERSION || '1.0' });
});

// API routes
app.use('/api', apiRoutes);

// Serve stats page for /code/:code (so client-side JS can fetch /api/links/:code)
app.get('/code/:code', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'code.html'));
});

// redirect must come after /api and /healthz and front-end routes
app.use('/', redirect);

// 404 fallback for unmatched routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// start
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`TinyLink listening on ${port}`);
});
