// Reports the size of the built JavaScript bundles and fails when the
// gzipped total exceeds BUNDLE_BUDGET_KB (default 600 KB).
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { join } from 'node:path';

const DIST = 'dist/assets';
const BUDGET_KB = Number(process.env.BUNDLE_BUDGET_KB || 600);

if (!existsSync(DIST)) {
  console.error(`Bundle directory "${DIST}" not found — run the build first.`);
  process.exit(1);
}

const files = readdirSync(DIST).filter((file) => file.endsWith('.js'));
let totalRaw = 0;
let totalGzip = 0;

for (const file of files) {
  const buffer = readFileSync(join(DIST, file));
  totalRaw += buffer.length;
  totalGzip += gzipSync(buffer).length;
}

const rawKB = Math.round(totalRaw / 1024);
const gzipKB = Math.round(totalGzip / 1024);
console.log(`JS bundle: ${files.length} files, ${rawKB} KB raw, ${gzipKB} KB gzipped (budget ${BUDGET_KB} KB gz).`);

if (gzipKB > BUDGET_KB) {
  console.error(`Bundle budget exceeded by ${gzipKB - BUDGET_KB} KB gzipped.`);
  process.exit(1);
}
