// Spelregels en rekenwerk zonder DOM: doeltijden, resultaten, records en stickers.
import { TASKS, CATEGORIES } from './tasks.js';

export const DIFFICULTY = {
  makkelijk: { factor: 1.5, label: 'Makkelijk', hint: '50% meer tijd' },
  normaal: { factor: 1, label: 'Normaal', hint: 'de doeltijd zelf' },
  pittig: { factor: 0.8, label: 'Pittig', hint: '20% minder tijd' },
};

export const SHAPES = [
  { id: 'slang', name: 'Slang', emoji: '🐍', unit: ['bolletje', 'bolletjes'], race: 'Ben je sneller dan de slang?', until: 'tot de slang weg is' },
  { id: 'slak', name: 'Slak', emoji: '🐌', unit: ['bolletje', 'bolletjes'], race: 'Ben je sneller dan de slak?', until: 'tot de slak bij de aardbei is' },
  { id: 'trein', name: 'Trein', emoji: '🚂', unit: ['wagon', 'wagons'], race: 'Ben je sneller dan de trein?', until: 'tot alle wagons weg zijn' },
];

export const shapeById = (id) => SHAPES.find((s) => s.id === id) || SHAPES[0];

export const STICKERS = [
  '🦁', '🐯', '🐻', '🐼', '🐨', '🐸', '🐵', '🦊', '🐰', '🐶', '🐱', '🐷', '🐮', '🐔', '🐧', '🐤',
  '🦄', '🐝', '🐞', '🦋', '🐢', '🐙', '🦀', '🐬', '🐳', '🦒', '🦓', '🐘', '🦔', '🦜', '🦩', '🦖',
  '🦕', '🚀', '🚒', '🚓', '🚑', '🚜', '🚁', '⛵', '🎈', '🎁', '🌈', '🌟', '☀️', '🍓', '🍉', '🍒',
  '🍦', '🍩', '🧁', '🎂', '⚽', '🏀', '🎨', '🧸', '🪁', '🏰', '🎠', '🦭',
];

export const categoryById = (id) => CATEGORIES.find((c) => c.id === id) || CATEGORIES[0];

export function allTasks(state) {
  return [...(state.custom || []), ...TASKS];
}

export function findTask(state, id) {
  return allTasks(state).find((task) => task.id === id) || null;
}

export function enabledTasks(state) {
  const on = new Set(state.enabled || []);
  return allTasks(state).filter((task) => on.has(task.id));
}

/** Doeltijd in seconden zoals de ouder die heeft ingesteld (of de standaard). */
export function baseSeconds(state, task) {
  const own = state.targets?.[task.id];
  return Number.isFinite(own) && own > 0 ? own : task.sec;
}

/** Lengte van de slang in milliseconden: doeltijd × moeilijkheid. */
export function targetMs(state, task) {
  const factor = DIFFICULTY[state.settings?.difficulty]?.factor ?? 1;
  return Math.max(5000, Math.round(baseSeconds(state, task) * factor * 1000));
}

// Doeltijden waar de −/+ knoppen langs lopen: per 5 sec, vanaf 1 min per 15 sec, vanaf 3 min per 30 sec.
const STEPS = [];
for (let v = 5; v < 60; v += 5) STEPS.push(v);
for (let v = 60; v < 180; v += 15) STEPS.push(v);
for (let v = 180; v <= 1800; v += 30) STEPS.push(v);

export function nextTarget(sec, dir) {
  if (dir > 0) return STEPS.find((v) => v > sec) ?? STEPS[STEPS.length - 1];
  for (let i = STEPS.length - 1; i >= 0; i--) if (STEPS[i] < sec) return STEPS[i];
  return STEPS[0];
}

/** "45 sec", "1:30 min", "5 min". */
export function formatSeconds(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s} sec`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, '0')} min` : `${m} min`;
}

/** Stopwatchnotatie voor ouders: "0:48,3". */
export function formatMs(ms) {
  const tenths = Math.max(0, Math.round(ms / 100));
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, '0')},${tenths % 10}`;
}

/** Klok in de balk tijdens de race: "0:23". */
export function formatClock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function pickSticker(rand = Math.random) {
  return STICKERS[Math.floor(rand() * STICKERS.length) % STICKERS.length];
}

/** "nog 5 bolletjes", "nog 1 wagon". */
export function unitsPhrase(shapeId, count) {
  const [one, many] = shapeById(shapeId).unit;
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Slaat een afgeronde poging op. Bij 'beat' (gehaald binnen de doeltijd, en bij
 * een race-taak goedgekeurd door de ouder) volgt een sticker, en bij een race-taak
 * ook een nieuw record als het de snelste tijd ooit is.
 */
export function recordResult(state, task, { ms, beat, shape, at = Date.now(), rand = Math.random }) {
  const list = (state.results[task.id] ||= []);
  list.push({ ms: Math.round(ms), beat: !!beat, shape, at });
  if (list.length > 50) list.splice(0, list.length - 50);

  let newRecord = false;
  if (beat && task.mode !== 'hold') {
    const prev = state.best[task.id];
    newRecord = !Number.isFinite(prev) || ms < prev;
    if (newRecord) state.best[task.id] = Math.round(ms);
  }

  let sticker = null;
  if (beat) {
    sticker = { id: `${at}-${Math.floor(rand() * 1e6)}`, emoji: pickSticker(rand), taskId: task.id, at, gold: newRecord };
    state.stickers.push(sticker);
  }
  return { newRecord, sticker };
}

/** Kleine, controleerbare som voor de ouder-check. */
export function makeSum(rand = Math.random) {
  const a = 11 + Math.floor(rand() * 9); // 11..19
  const b = 3 + Math.floor(rand() * 7); // 3..9
  return { question: `${a} + ${b}`, answer: a + b };
}
