import test from 'node:test';
import assert from 'node:assert/strict';
import { TASKS, CATEGORIES, DEFAULT_ENABLED, CUSTOM_EMOJI } from '../js/tasks.js';

test('de bibliotheek heeft precies 100 taakjes met unieke id’s', () => {
  assert.equal(TASKS.length, 100);
  assert.equal(new Set(TASKS.map((t) => t.id)).size, 100);
});

test('elk taakje is compleet', () => {
  const cats = new Set(CATEGORIES.map((c) => c.id));
  for (const t of TASKS) {
    assert.ok(cats.has(t.cat), `${t.id}: onbekende groep ${t.cat}`);
    assert.ok(t.emoji && t.name && t.say, `${t.id}: emoji, naam of zin ontbreekt`);
    assert.ok(Number.isInteger(t.sec) && t.sec >= 5 && t.sec <= 1800, `${t.id}: doeltijd ${t.sec}`);
    assert.ok(['race', 'hold'].includes(t.mode), `${t.id}: soort ${t.mode}`);
  }
});

test('voorgelezen zinnen bevatten het stopwoord "klaar" niet', () => {
  for (const t of TASKS) assert.ok(!/klaar/i.test(t.say), `${t.id}: "${t.say}"`);
});

test('tanden poetsen en handen wassen zijn volhoud-taken', () => {
  const byId = Object.fromEntries(TASKS.map((t) => [t.id, t]));
  assert.equal(byId['tanden-poetsen'].mode, 'hold');
  assert.equal(byId['handen-wassen'].mode, 'hold');
});

test('standaard-startscherm en emoji-keuze verwijzen naar bestaande dingen', () => {
  const ids = new Set(TASKS.map((t) => t.id));
  for (const id of DEFAULT_ENABLED) assert.ok(ids.has(id), id);
  assert.ok(CUSTOM_EMOJI.length >= 24);
});

test('elke groep (behalve eigen taken) heeft taakjes', () => {
  for (const c of CATEGORIES.filter((c) => c.id !== 'eigen')) {
    assert.ok(TASKS.some((t) => t.cat === c.id), c.id);
  }
});
