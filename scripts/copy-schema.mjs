import { copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), 'dist-server');
const src = join(process.cwd(), 'src', 'server', 'schema.sql');
const dest = join(outDir, 'schema.sql');
if (existsSync(src)) {
  mkdirSync(outDir, { recursive: true });
  copyFileSync(src, dest);
}
