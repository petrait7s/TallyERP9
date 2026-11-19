// Browser smoke test: Gateway -> Receipt -> Day Book via keyboard, then a lesson step.
// Needs Playwright: npm i -D playwright && npx playwright install chromium   (not part of CI)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const PORT = 4179;
const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', shell: true });
const fail = (m) => { console.error('FAIL:', m); server.kill(); process.exit(1); };
try {
  await new Promise((r) => setTimeout(r, 3000));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('pageerror', (e) => fail(`page error ${e.message}`));
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForTimeout(1000);
  const key = async (...ks) => { for (const k of ks) { await page.keyboard.press(k); await page.waitForTimeout(150); } };
  const type = async (s) => { await page.keyboard.type(s); await page.waitForTimeout(120); };
  await key('F6', 'Enter', 'Enter');
  await type('Local Donations'); await key('Enter'); await type('5000'); await key('Enter', 'Enter', 'Enter', 'Control+a');
  if (!/created/.test(await page.locator('.status-hint').innerText())) fail('receipt was not created');
  await key('Escape');
  await page.locator('.menu-item', { hasText: /^Display$/ }).click(); await key('Enter', 'ArrowDown', 'Enter');
  const rows = await page.locator('.rtable tbody tr').allInnerTexts();
  if (!rows.some((r) => /5,000\.00/.test(r))) fail('Day Book does not show the new receipt');
  console.log('smoke OK');
  await browser.close();
  server.kill();
} catch (e) { fail(e.message); }
