# TinyLink

TinyLink is a minimal URL shortener (take-home assignment) built with Node.js + Express and Postgres.

## Features

- Create short links (optional custom codes)
- 302 redirect with atomic click counter increment
- List links, view stats, delete links (soft delete)
- Healthcheck endpoint

## Local setup

1. Copy `.env.example` to `.env` and fill `DATABASE_URL`.
2. Initialize DB (run `sql/init.sql`).
3. Install dependencies:

npm install
4. Start:
(npm run dev # requires nodemon)
or
npm start

5. Open `http://localhost:8080`

## Endpoints (autograder expectations)

- `GET /healthz` -> 200, JSON
- `POST /api/links` -> create link (409 if duplicate)
- `GET /api/links` -> list links
- `GET /api/links/:code` -> stats for code
- `DELETE /api/links/:code` -> delete link
- `GET /:code` -> redirect (302) or 404

## Deploy

Use Render / Railway / Heroku. Add `DATABASE_URL`, `PORT`, `BASE_URL` env vars.



