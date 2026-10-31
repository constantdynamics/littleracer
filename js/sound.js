// Kleine geluidjes, gemaakt met de Web Audio API (geen geluidsbestanden nodig).
import { store } from './store.js';

let ctx = null;

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Na de eerste aanraking mag de browser geluid maken. */
export function unlockAudio() {
  try {
    audio();
  } catch {
    // geen geluid op dit apparaat
  }
}

function tone(freq, dur, { type = 'sine', vol = 0.15, delay = 0, slideTo = 0 } = {}) {
  if (!store.state.settings.sound) return;
  const c = audio();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap: () => tone(520, 0.07, { vol: 0.07 }),
  light: () => tone(523, 0.28, { type: 'square', vol: 0.08 }),
  go: () => {
    tone(784, 0.55, { type: 'square', vol: 0.09 });
    tone(1046, 0.6, { type: 'triangle', vol: 0.1, delay: 0.04 });
  },
  blip: () => tone(700, 0.09, { vol: 0.045, slideTo: 1050 }),
  chime: () => {
    tone(880, 0.35, { vol: 0.08 });
    tone(660, 0.5, { vol: 0.08, delay: 0.18 });
  },
  fanfare: () => {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.32, { type: 'triangle', vol: 0.13, delay: i * 0.11 }));
    tone(1318, 0.7, { type: 'triangle', vol: 0.12, delay: 0.48 });
  },
  sticker: () => {
    tone(988, 0.12, { type: 'triangle', vol: 0.1 });
    tone(1319, 0.22, { type: 'triangle', vol: 0.1, delay: 0.09 });
  },
  toot: () => {
    tone(392, 0.22, { type: 'sawtooth', vol: 0.05 });
    tone(392, 0.4, { type: 'sawtooth', vol: 0.05, delay: 0.28 });
  },
  wrong: () => tone(220, 0.25, { type: 'triangle', vol: 0.08 }),
};

export function buzz(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // geen trilfunctie
  }
}
