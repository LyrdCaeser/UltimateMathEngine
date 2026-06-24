import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { hasDatabaseUrl } from './db';
import { usersRouter } from './routes/users';
import { sessionsRouter } from './routes/sessions';
import { calculationsRouter } from './routes/calculations';
import { gameRatesRouter } from './routes/gameRates';
import { settingsRouter } from './routes/settings';
import { siteCustomizationRouter } from './routes/siteCustomization';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    app: 'Ultimate Math Engine',
    databaseConfigured: hasDatabaseUrl(),
    dataMode: 'server-database-only',
    autosave: 'api-database'
  });
});

app.use('/api/users', usersRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api', calculationsRouter);
app.use('/api', gameRatesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api', siteCustomizationRouter);

const distPath = join(process.cwd(), 'dist');
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get(/.*/, (_req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Ultimate Math Engine server listening on port ${port}`);
});
