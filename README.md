# Ultimate Math Engine

**Ultimate Math Engine** is an online real-data calculation app foundation with server-side persistence, database-backed autosave, and editable game currency rate tables.

## Core rules

This project is designed around these hard rules:

* No local-only app workflow for production.
* No `localStorage`.
* No `sessionStorage`.
* No `IndexedDB`.
* No browser cookies for app data.
* No fake/mock/ảo persistent data.
* No hard-coded game conversion results.
* Persistent data must go through API + PostgreSQL.
* Autosave must write to the database.
* Calculation history must be saved server-side.
* Game currency conversion must use editable database rate rows.
* Accuracy target: `>= 99%` for deterministic calculations.

## Included modules

Ultimate Math Engine includes the full module set:

* Basic calculator
* Scientific calculator
* Equation solver
* Finance/life tools
* Unit converter
* Game converter
* VIP UI settings

## Game converter

The Game Converter supports editable rate tables for:

* Free Fire — `KC`
* Liên Quân — `QH`
* Honkai Star Rail — `NAS`
* Genshin Impact — `NT`

Important:

* No fake starter rates are inserted.
* Add verified Garena/HoYo rows before using game conversion.
* Conversion accuracy depends on the current verified database rate table.
* If Garena/HoYo changes prices, update the database rate rows.

## Database

Database provider:

```txt
Neon PostgreSQL
```

Main tables:

```txt
users
ume_sessions
calculation_history
saved_formulas
user_settings
game_rate_tables
```

The schema is stored in:

```txt
src/server/schema.sql
```

The schema command exits cleanly if `DATABASE_URL` is missing.

## Required environment variables

For Render, set these in **Render → Environment Variables**:

```env
DATABASE_URL=postgresql://...
NODE_VERSION=20
```

Optional:

```env
PORT=3000
```

Render normally provides `PORT` automatically.

Do **not** commit `.env` to GitHub.

## Render deployment

Recommended platform:

```txt
Render Web Service + Neon PostgreSQL
```

### Build command

Use this on Render:

```bash
corepack enable && corepack prepare pnpm@10.15.0 --activate && pnpm install --frozen-lockfile=false --prod=false && pnpm exec vite --version && pnpm run build && pnpm run apply:schema
```

### Start command

Use this on Render:

```bash
node dist-server/index.js
```

## Scripts

Available project scripts:

```bash
npm run typecheck
npm run build
npm run apply:schema
npm run server
```

Render uses `pnpm` for install/build reliability, but the project scripts remain available through `package.json`.

## Deployment flow

```txt
GitHub repo
   ↓
Render Web Service
   ↓
Build app
   ↓
Apply Neon schema
   ↓
Start Node/Express server
   ↓
Serve Ultimate Math Engine on onrender.com
```

## Data behavior

When a user creates a guest profile:

* A real user row is created in PostgreSQL.
* A real session row is created in PostgreSQL.
* Autosave updates `ume_sessions.draft_state`.
* Calculation history is saved in `calculation_history`.
* Game rates are read from and written to `game_rate_tables`.

Refreshing the browser does not delete database data.

## Notes

If Render build succeeds but runtime fails with an Express wildcard error like:

```txt
PathError: Missing parameter name at index 1: *
originalPath: '*'
```

replace this server route:

```ts
app.get('*', ...)
```

with:

```ts
app.get(/.*/, ...)
```

This is required for newer Express/path-to-regexp behavior.
