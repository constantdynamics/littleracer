// Kleine bouwstenen voor de schermen.
import { photoFor } from './photos.js';

/** Maakt een element: h('button', { class: 'x', onclick }, 'tekst', kind). */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  setProps(el, props, false);
  append(el, children);
  return el;
}

/** Hetzelfde voor SVG-elementen. */
export function s(tag, props = {}, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  setProps(el, props, true);
  append(el, children);
  return el;
}

function setProps(el, props, svg) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (!svg && k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : String(c));
  }
}

/** Plaatje van een taak: eigen foto of emoji. */
export function taskPicture(task, cls = '') {
  const photo = task.photo ? photoFor(task.id) : null;
  if (photo) return h('img', { class: `task-photo ${cls}`, src: photo, alt: '', draggable: 'false' });
  return h('span', { class: `task-emoji ${cls}`, 'aria-hidden': 'true' }, task.emoji || '⭐');
}

/**
 * Knop die je een tijdje ingedrukt moet houden (tegen per ongeluk drukken).
 * Zet --hold (0..1) op het element zodat CSS de voortgang kan tekenen.
 */
export function holdable(el, ms, onDone) {
  let start = 0;
  let raf = 0;
  const reset = () => {
    cancelAnimationFrame(raf);
    start = 0;
    el.style.setProperty('--hold', '0');
    el.classList.remove('holding');
  };
  const tick = (now) => {
    if (!start) return;
    const p = Math.min(1, (now - start) / ms);
    el.style.setProperty('--hold', p.toFixed(3));
    if (p >= 1) {
      reset();
      onDone();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    try {
      el.setPointerCapture?.(e.pointerId);
    } catch {
      // niet nodig
    }
    start = performance.now();
    el.classList.add('holding');
    raf = requestAnimationFrame(tick);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((ev) => el.addEventListener(ev, reset));
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  // Toetsenbord: Enter of spatie ingedrukt houden werkt ook.
  el.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !start) {
      e.preventDefault();
      start = performance.now();
      el.classList.add('holding');
      raf = requestAnimationFrame(tick);
    }
  });
  el.addEventListener('keyup', reset);
  return el;
}

/** Confetti over het hele scherm. */
export function confetti(duration = 3200) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = h('canvas', { class: 'confetti', 'aria-hidden': 'true' });
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = (canvas.width = innerWidth * dpr);
  const H = (canvas.height = innerHeight * dpr);
  const css = getComputedStyle(document.documentElement);
  const colors = ['--red', '--amber', '--go', '--sun', '--sky', '--berry', '--grape'].map((v) => css.getPropertyValue(v).trim() || '#ff0');
  const parts = Array.from({ length: 170 }, () => ({
    x: Math.random() * W,
    y: -Math.random() * H * 0.6,
    w: (6 + Math.random() * 8) * dpr,
    h: (10 + Math.random() * 10) * dpr,
    vx: (Math.random() - 0.5) * 3 * dpr,
    vy: (2 + Math.random() * 4) * dpr,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const frame = (now) => {
    const t = now - t0;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = t > duration - 600 ? Math.max(0, (duration - t) / 600) : 1;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05 * dpr;
      p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** Melding onderaan die vanzelf verdwijnt. */
export function toast(text) {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.classList.add('out'), 2200);
  setTimeout(() => el.remove(), 2700);
}

/** Venster bovenop de pagina; geeft een functie terug die het sluit. */
export function modal(content, { label = '', onClose, backdropClose = true } = {}) {
  const box = h('div', { class: 'modal-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': label }, content);
  const back = h('div', { class: 'modal-back' }, box);
  const close = () => {
    back.remove();
    document.removeEventListener('keydown', onKey);
    onClose?.();
  };
  const onKey = (e) => e.key === 'Escape' && close();
  if (backdropClose) back.addEventListener('pointerdown', (e) => e.target === back && close());
  document.addEventListener('keydown', onKey);
  document.body.append(back);
  return close;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
