import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const sw = readFileSync(join(root, 'sw.js'), 'utf8');
const assets = [...sw.matchAll(/^\s+'([^']+)',$/gm)].map((m) => m[1]).filter((a) => a !== './');

test('alles in de offline-cache bestaat', () => {
  for (const a of assets) assert.ok(existsSync(join(root, a)), a);
});

test('elk script staat in de offline-cache', () => {
  const js = [
    ...readdirSync(join(root, 'js')).filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
    ...readdirSync(join(root, 'js/views')).map((f) => `js/views/${f}`),
  ];
  for (const f of js) assert.ok(assets.includes(f), `${f} ontbreekt in sw.js`);
});

test('manifest verwijst naar bestaande iconen', () => {
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const icon of manifest.icons) assert.ok(existsSync(join(root, icon.src)), icon.src);
});
