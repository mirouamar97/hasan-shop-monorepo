import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/screenshots');
const date = '2026-07-10';
const url = process.env.HOMEPAGE_URL ?? 'http://localhost:3000/ar';

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const sizes = [
  [375, 812, '375'],
  [768, 1024, '768'],
  [1280, 900, '1280'],
];

for (const [width, height, tag] of sizes) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
  await page.waitForTimeout(2000);
  const file = path.join(outDir, `homepage-${date}-${tag}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  console.log(`Saved ${file}`);
}

await browser.close();
