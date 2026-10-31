import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultState } from '../js/store.js';
import { targetMs, baseSeconds, nextTarget, formatSeconds, formatMs, formatClock, recordResult, findTask, enabledTasks, unitsPhrase, makeSum } from '../js/logic.js';

const fixedRand = () => 0.42;

test('doeltijd: standaard, eigen instelling en moeilijkheid', () => {
  const st = defaultState();
  const broek = findTask(st, 'broek-aan');
  assert.equal(baseSeconds(st, broek), 60);
  assert.equal(targetMs(st, broek), 60000);
  st.targets['broek-aan'] = 45;
  assert.equal(targetMs(st, broek), 45000);
  st.settings.difficulty = 'makkelijk';
  assert.equal(targetMs(st, broek), 67500);
  st.settings.difficulty = 'pittig';
  assert.equal(targetMs(st, broek), 36000);
});

test('doeltijd is nooit korter dan 5 seconden', () => {
  const st = defaultState();
  st.settings.difficulty = 'pittig';
  st.targets['muts-op'] = 5;
  assert.equal(targetMs(st, findTask(st, 'muts-op')), 5000);
});

test('−/+ lopen langs vaste stappen', () => {
  assert.equal(nextTarget(60, 1), 75);
  assert.equal(nextTarget(60, -1), 55);
  assert.equal(nextTarget(5, -1), 5);
  assert.equal(nextTarget(47, 1), 50);
  assert.equal(nextTarget(47, -1), 45);
  assert.equal(nextTarget(180, 1), 210);
  assert.equal(nextTarget(1800, 1), 1800);
});

test('tijden netjes opschrijven', () => {
  assert.equal(formatSeconds(45), '45 sec');
  assert.equal(formatSeconds(90), '1:30 min');
  assert.equal(formatSeconds(300), '5 min');
  assert.equal(formatMs(48321), '0:48,3');
  assert.equal(formatMs(65049), '1:05,0');
  assert.equal(formatClock(83999), '1:23');
});

test('gehaald: sticker, en record bij de snelste tijd', () => {
  const st = defaultState();
  const broek = findTask(st, 'broek-aan');
  const first = recordResult(st, broek, { ms: 50000, beat: true, shape: 'slang', at: 1, rand: fixedRand });
  assert.equal(first.newRecord, true);
  assert.ok(first.sticker && first.sticker.gold);
  const slower = recordResult(st, broek, { ms: 55000, beat: true, shape: 'slang', at: 2, rand: fixedRand });
  assert.equal(slower.newRecord, false);
  assert.ok(slower.sticker && !slower.sticker.gold);
  const faster = recordResult(st, broek, { ms: 41000, beat: true, shape: 'trein', at: 3, rand: fixedRand });
  assert.equal(faster.newRecord, true);
  assert.equal(st.best['broek-aan'], 41000);
  assert.equal(st.stickers.length, 3);
  assert.equal(st.results['broek-aan'].length, 3);
});

test('niet gehaald: wel opgeslagen, geen sticker en geen record', () => {
  const st = defaultState();
  const broek = findTask(st, 'broek-aan');
  const r = recordResult(st, broek, { ms: 30000, beat: false, shape: 'slak', at: 1 });
  assert.equal(r.sticker, null);
  assert.equal(r.newRecord, false);
  assert.equal(st.best['broek-aan'], undefined);
  assert.equal(st.results['broek-aan'][0].beat, false);
});

test('volhoud-taak: sticker maar geen snelste-tijd-record', () => {
  const st = defaultState();
  const tanden = findTask(st, 'tanden-poetsen');
  const r = recordResult(st, tanden, { ms: 120000, beat: true, shape: 'slang', at: 1 });
  assert.ok(r.sticker);
  assert.equal(r.newRecord, false);
  assert.equal(st.best['tanden-poetsen'], undefined);
});

test('geschiedenis houdt de laatste 50 pogingen', () => {
  const st = defaultState();
  const broek = findTask(st, 'broek-aan');
  for (let i = 0; i < 60; i++) recordResult(st, broek, { ms: 70000, beat: false, shape: 'slang', at: i });
  assert.equal(st.results['broek-aan'].length, 50);
  assert.equal(st.results['broek-aan'][0].at, 10);
});

test('eigen taken staan vooraan en kunnen op het startscherm', () => {
  const st = defaultState();
  st.custom.push({ id: 'eigen-x', cat: 'eigen', emoji: '🚗', name: 'Naar de auto', say: 'Naar de auto!', sec: 40, mode: 'race', custom: true });
  st.enabled.push('eigen-x');
  assert.equal(findTask(st, 'eigen-x').name, 'Naar de auto');
  assert.equal(enabledTasks(st)[0].id, 'eigen-x');
});

test('enkelvoud en meervoud', () => {
  assert.equal(unitsPhrase('slang', 1), '1 bolletje');
  assert.equal(unitsPhrase('slak', 4), '4 bolletjes');
  assert.equal(unitsPhrase('trein', 1), '1 wagon');
  assert.equal(unitsPhrase('trein', 3), '3 wagons');
});

test('ouder-som is goed uit te rekenen', () => {
  const s = makeSum(() => 0.5);
  const [a, b] = s.question.split(' + ').map(Number);
  assert.equal(a + b, s.answer);
  assert.ok(s.answer >= 14);
});
