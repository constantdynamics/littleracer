// Alle gegevens blijven op dit apparaat (localStorage). Foto's staan apart in IndexedDB.
import { DEFAULT_ENABLED } from './tasks.js';

const KEY = 'littleracer.v1';

export function defaultState() {
  return {
    version: 1,
    childName: '',
    settings: {
      sound: true,
      voice: true,
      voiceURI: '',
      rate: 1,
      listenStart: true,
      listenStop: true,
      difficulty: 'normaal',
      shape: 'slang',
      theme: 'auto',
    },
    enabled: [...DEFAULT_ENABLED],
    targets: {},
    custom: [],
    results: {},
    best: {},
    stickers: [],
  };
}

export function migrate(raw) {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const obj = (v, d) => (v && typeof v === 'object' && !Array.isArray(v) ? v : d);
  const arr = (v, d) => (Array.isArray(v) ? v : d);
  return {
    ...base,
    childName: typeof raw.childName === 'string' ? raw.childName : '',
    settings: { ...base.settings, ...obj(raw.settings, {}) },
    enabled: arr(raw.enabled, base.enabled),
    targets: obj(raw.targets, {}),
    custom: arr(raw.custom, []),
    results: obj(raw.results, {}),
    best: obj(raw.best, {}),
    stickers: arr(raw.stickers, []),
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Opslag vol of geblokkeerd: de app werkt gewoon door voor deze sessie.
  }
}

const listeners = new Set();

export const store = {
  state: migrate(read()),
  update(fn) {
    fn(this.state);
    write(this.state);
    listeners.forEach((l) => l(this.state));
  },
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
