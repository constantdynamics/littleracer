import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, startStage, isStopCommand } from '../js/match.js';

test('normalize haalt hoofdletters, accenten en leestekens weg', () => {
  assert.equal(normalize('Klaar… AF!'), 'klaar af');
  assert.equal(normalize('Één, twee'), 'een twee');
});

test('startlicht volgt "op je plaatsen… klaar… af!"', () => {
  assert.equal(startStage(''), 0);
  assert.equal(startStage('op je plaatsen'), 1);
  assert.equal(startStage('op je plaatsen klaar'), 2);
  assert.equal(startStage('op je plaatsen klaar af'), 3);
  assert.equal(startStage('Klaar? Af!'), 3);
});

test('"af" wordt soms anders verstaan na "klaar"', () => {
  assert.equal(startStage('klaar of'), 3);
  assert.equal(startStage('klaar haf'), 3);
  assert.equal(startStage('klaar start'), 3);
});

test('"af" of "of" zonder "klaar" ervoor start niet', () => {
  assert.equal(startStage('wil je de broek of de rok'), 0);
  assert.equal(startStage('of klaar'), 2);
});

test('"start" of "go" start altijd', () => {
  assert.equal(startStage('start'), 3);
  assert.equal(startStage('ready go'), 3);
});

test('stoppen bij "klaar!", ook als het anders wordt opgeschreven', () => {
  for (const said of ['klaar', 'KLAAR!', 'ik ben klaar', 'ik ben al klaar', 'Klar', 'gedaan', 'stop', 'klaar | claar'])
    assert.ok(isStopCommand(said), said);
});

test('niet stoppen bij vragen of "nog niet klaar"', () => {
  for (const said of ['ben je klaar', 'nog niet klaar', 'bijna klaar', 'ik ben niet klaar', 'mooie broek', ''])
    assert.ok(!isStopCommand(said), said);
});
