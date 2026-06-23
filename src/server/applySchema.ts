import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { query, hasDatabaseUrl } from './db';

async function main(): Promise<void> {
  if (!hasDatabaseUrl()) {
    console.log('DATABASE_URL is not configured. Schema apply skipped.');
    return;
  }

  const candidates = [
    join(process.cwd(), 'dist-server', 'schema.sql'),
    join(process.cwd(), 'src', 'server', 'schema.sql')
  ];
  const schemaPath = candidates.find((path) => existsSync(path));

  if (!schemaPath) {
    throw new Error('schema.sql not found');
  }

  const sql = readFileSync(schemaPath, 'utf8');
  await query(sql);
  console.log('Ultimate Math Engine schema applied successfully.');
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
