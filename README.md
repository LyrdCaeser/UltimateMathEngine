# Ultimate Math Engine

Online real-data calculation app foundation.

## Included modules

- Basic calculator
- Scientific calculator
- Equation solver
- Finance/life tools
- Unit converter
- Game converter
- VIP UI settings

## Data rules

- Persistent data goes through API + PostgreSQL.
- Server autosave writes session draft state to the database.
- Calculation history is saved server-side.
- Game currency conversion uses editable database rate rows.
- No fake starter rates are inserted. Add verified Garena/HoYo rows before using game conversion.

## Required environment

```env
DATABASE_URL=postgresql://...
PORT=3000
```

## Database setup

After build, run:

```bash
npm run apply:schema
```

The schema command exits cleanly if `DATABASE_URL` is missing.

## Scripts

```bash
npm run typecheck
npm run build
npm run server
```

## Deployment note

For Render + Neon:

- Build command: `npm install && npm run build && npm run apply:schema`
- Start command: `npm run server`
- Environment: set `DATABASE_URL`
