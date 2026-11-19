/** Regenerate content/seed/*.json: npx vite-node scripts/gen-seed.ts */
import { writeFileSync } from 'node:fs';
import { generateSeed, serializeCompany } from '../src/engine';

for (const key of ['scdf', 'tea', 'blank'] as const) {
  const c = generateSeed(key);
  const file = JSON.parse(serializeCompany(c, key));
  file.savedAt = '2025-01-01T00:00:00.000Z'; // stable output
  writeFileSync(`content/seed/${key}.v1.json`, JSON.stringify(file));
  console.log(`${key}: ${c.vouchers.length} vouchers, ${c.ledgers.length} ledgers`);
}
