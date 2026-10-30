// Tekent de tijd als slang, slak of trein. Het figuur is precies zo lang als de
// doeltijd; terwijl de tijd loopt verdwijnt het van achteren. Wat overblijft als
// het kind klaar is, is de voorsprong. Na de doeltijd groeit er rustig een paars
// vriendje bij (extra tijd), zonder dat het voelt als verliezen.
import { s } from './ui.js';
import { zigzag, spiral } from './geometry.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeIn = (f) => f * f;
const deg = (a) => ((a * 180) / Math.PI).toFixed(1);
const fx = (v) => v.toFixed(1);
let uid = 0;

const CARGO = ['🧸', '⚽', '🍎', '🎈', '🐤', '🧩', '🍌', '⭐', '🍓', '🦆', '🎁', '🐞'];

function eye(x, y, r) {
  return s('g', { transform: `translate(${fx(x)} ${fx(y)})` },
    s('g', { class: 'blink' },
      s('circle', { r, class: 'eye-white' }),
      s('circle', { r: r * 0.52, cx: r * 0.1, cy: r * 0.12, class: 'pupil' }),
      s('circle', { r: r * 0.2, cx: r * 0.3, cy: -r * 0.16, class: 'glint' })));
}

function shellSpiral() {
  let d = '';
  for (let th = 0; th <= Math.PI * 5.2; th += 0.2) {
    const r = 1.5 + th * 0.95;
    d += `${d ? 'L' : 'M'}${fx(-6 + Math.cos(th) * r)} ${fx(-6 + Math.sin(th) * r)}`;
  }
  return d;
}
const SHELL = shellSpiral();

function snailSprite(unit) {
  const k = (unit * 1.05) / 40;
  return s('g', { class: 'snail' },
    s('g', { class: 'snail-in', transform: `scale(${k.toFixed(3)})` },
      s('path', { class: 'snail-body', d: 'M-34 16 Q-38 24 -26 24 L28 24 Q42 24 40 8 Q38 -8 26 -6 Q18 -4 18 8 L-20 8 Q-30 8 -34 16 Z' }),
      s('line', { class: 'stalk', x1: 25, y1: -4, x2: 21, y2: -22 }),
      s('line', { class: 'stalk', x1: 33, y1: -4, x2: 37, y2: -20 }),
      s('circle', { class: 'eye-white', cx: 21, cy: -24, r: 6 }),
      s('circle', { class: 'pupil', cx: 22.5, cy: -23.5, r: 3 }),
      s('circle', { class: 'eye-white', cx: 37, cy: -22, r: 6 }),
      s('circle', { class: 'pupil', cx: 38.5, cy: -21.5, r: 3 }),
      s('path', { class: 'smile', d: 'M28 12 Q33 17 38 12' }),
      s('circle', { class: 'snail-shell', cx: -6, cy: -6, r: 21 }),
      s('path', { class: 'shell-line', d: SHELL })));
}

export class Viz {
  constructor(svg) {
    this.svg = svg;
    this.shape = 'slang';
    this.p = 0;
    this.dancing = false;
    this.W = 0;
    this.H = 0;
    this.gone = 0;
    this.onUnitGone = null;
    this.still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  setShape(shape) {
    this.shape = shape;
    this.build();
  }

  resize(W, H) {
    if (Math.abs(W - this.W) < 2 && Math.abs(H - this.H) < 2) return;
    this.W = W;
    this.H = H;
    this.build();
  }

  get n() {
    return this.geo ? this.geo.n : 0;
  }

  /** Hele figuurtjes die nog over zijn bij voortgang p. */
  unitsLeft(p = this.p) {
    return Math.max(0, this.n - Math.ceil(clamp(p, 0, 1) * this.n - 1e-9));
  }

  setProgress(p) {
    this.p = p;
    const gone = Math.min(this.n, Math.floor(clamp(p, 0, 1) * this.n + 1e-9));
    if (gone > this.gone) this.onUnitGone?.(this.n - gone);
    this.gone = gone;
  }

  build() {
    const { svg, W, H } = this;
    if (!W || !H) return;
    svg.setAttribute('viewBox', `0 0 ${fx(W)} ${fx(H)}`);
    svg.replaceChildren();
    this.maskPath = null;
    this.geo =
      this.shape === 'slak'
        ? spiral(W, H, { target: 26 })
        : zigzag(W, H, this.shape === 'trein' ? { target: 15, fill: 0.5, spacing: 1.22, maxUnit: 100 } : { target: 24 });
    const { track, n } = this.geo;
    this.L = track.length;
    this.spacing = this.L / n;
    this.pos = Array.from({ length: n }, (_, i) => track.at((i + 0.5) * this.spacing));
    this.gone = Math.min(n, Math.floor(clamp(this.p, 0, 1) * n + 1e-9));
    if (this.shape === 'slak') this.buildSnail();
    else if (this.shape === 'trein') this.buildTrain();
    else this.buildSnake();
    this.render(performance.now());
  }

  /** Lichte baan van het hele figuur, plus stippeltjes waar de tijd al voorbij is. */
  buildTrail(width) {
    const { track, unit } = this.geo;
    const d = track.path();
    const id = `lr-mask-${++uid}`;
    this.maskPath = s('path', { d, pathLength: 1000, class: 'mask-stroke', 'stroke-width': fx(unit * 1.4), 'stroke-dasharray': '0 1000' });
    this.svg.append(
      s('defs', {}, s('mask', { id, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: fx(this.W), height: fx(this.H) }, this.maskPath)),
      s('path', { d, class: 'trail', 'stroke-width': fx(unit * width) }),
      s('path', { d, class: 'trail-dots', 'stroke-width': fx(unit * 0.16), 'stroke-dasharray': `0.1 ${fx(unit * 0.42)}`, mask: `url(#${id})` }),
    );
  }

  buildBaby() {
    const { unit, n } = this.geo;
    const g = s('g', { class: 'baby' });
    const parts = [];
    for (let i = 0; i < n; i++) {
      const el =
        this.shape === 'trein'
          ? s('rect', { x: fx(-this.spacing * 0.34), y: fx(-unit * 0.28), width: fx(this.spacing * 0.68), height: fx(unit * 0.56), rx: fx(unit * 0.14), class: 'baby-body' })
          : s('circle', { r: fx(unit * 0.34), class: 'baby-body' });
      el.setAttribute('display', 'none');
      g.append(el);
      parts.push(el);
    }
    const r = unit * 0.42;
    const head = s('g', { display: 'none' }, s('circle', { r: fx(r), class: 'baby-body' }), eye(-r * 0.36, -r * 0.1, r * 0.3), eye(r * 0.36, -r * 0.1, r * 0.3));
    g.append(head);
    this.svg.append(g);
    this.baby = { parts, head };
  }

  buildSnake() {
    const { unit, n } = this.geo;
    this.buildTrail(1.02);
    this.buildBaby();
    const body = s('g', { class: 'snake' });
    this.parts = [];
    for (let i = 0; i < n - 1; i++) {
      const g = s('g', {},
        s('circle', { r: fx(unit / 2), class: i % 2 ? 'sn-body alt' : 'sn-body' }),
        i % 2 ? null : s('circle', { r: fx(unit * 0.12), class: 'sn-spot' }),
        s('circle', { r: fx(unit * 0.11), cx: fx(-unit * 0.17), cy: fx(-unit * 0.18), class: 'shine' }));
      body.append(g);
      this.parts.push(g);
    }
    const R = unit * 0.66;
    const head = s('g', { class: 'snake-head' },
      s('path', { class: 'tongue', d: `M0 ${fx(R * 0.6)} v${fx(R * 0.55)} l${fx(-R * 0.18)} ${fx(R * 0.2)} m${fx(R * 0.18)} ${fx(-R * 0.2)} l${fx(R * 0.18)} ${fx(R * 0.2)}` }),
      s('circle', { r: fx(R), class: 'sn-body' }),
      s('circle', { r: fx(R * 0.15), cx: fx(-R * 0.55), cy: fx(R * 0.28), class: 'cheek' }),
      s('circle', { r: fx(R * 0.15), cx: fx(R * 0.55), cy: fx(R * 0.28), class: 'cheek' }),
      eye(-R * 0.35, -R * 0.18, R * 0.28),
      eye(R * 0.35, -R * 0.18, R * 0.28),
      s('path', { class: 'smile', d: `M${fx(-R * 0.28)} ${fx(R * 0.22)} Q0 ${fx(R * 0.5)} ${fx(R * 0.28)} ${fx(R * 0.22)}` }));
    body.append(head);
    this.parts.push(head);
    this.svg.append(body);
  }

  buildSnail() {
    const { unit, n, center, r0 } = this.geo;
    this.buildTrail(0.96);
    this.svg.append(s('text', { x: fx(center.x), y: fx(center.y), class: 'goal', 'font-size': fx(r0 * 1.3) }, '🍓'));
    this.buildBaby();
    const dots = s('g', { class: 'dots' });
    this.parts = [];
    for (let i = 0; i < n; i++) {
      const hue = Math.round(350 - (i / n) * 300 + 360) % 360;
      const g = s('g', {},
        s('circle', { r: fx(unit * 0.4), class: 'dot', style: `fill: hsl(${hue} 85% 62%)` }),
        s('circle', { r: fx(unit * 0.1), cx: fx(-unit * 0.13), cy: fx(-unit * 0.13), class: 'shine' }));
      dots.append(g);
      this.parts.push(g);
    }
    this.svg.append(dots);
    this.snail = snailSprite(unit);
    this.svg.append(this.snail);
  }

  buildTrain() {
    const { unit, n, track } = this.geo;
    this.svg.append(
      s('path', { d: track.path(), class: 'sleepers', 'stroke-width': fx(unit * 0.95), 'stroke-dasharray': `${fx(unit * 0.14)} ${fx(unit * 0.3)}` }),
      s('path', { d: track.path(unit * 0.3), class: 'rail' }),
      s('path', { d: track.path(-unit * 0.3), class: 'rail' }),
    );
    this.buildBaby();
    const train = s('g', { class: 'train' });
    const len = this.spacing * 0.84;
    const hgt = unit * 0.84;
    this.parts = [];
    for (let i = 0; i < n - 1; i++) {
      const box = s('g', { class: `wagon c${i % 6}` },
        s('rect', { x: fx(-len / 2), y: fx(-hgt / 2), width: fx(len), height: fx(hgt), rx: fx(unit * 0.16), class: 'wagon-box' }),
        s('rect', { x: fx(-len / 2 + unit * 0.1), y: fx(-hgt / 2 + unit * 0.1), width: fx(len - unit * 0.2), height: fx(hgt - unit * 0.2), rx: fx(unit * 0.1), class: 'wagon-in' }));
      const label = s('text', { class: 'cargo', 'font-size': fx(unit * 0.46) }, CARGO[i % CARGO.length]);
      const wrap = s('g', {}, box, label);
      train.append(wrap);
      this.parts.push({ wrap, box, label });
    }
    const loco = s('g', { class: 'loco' },
      s('rect', { x: fx(-len * 0.56), y: fx(-hgt / 2), width: fx(len * 1.12), height: fx(hgt), rx: fx(unit * 0.22), class: 'loco-box' }),
      s('rect', { x: fx(-len * 0.5), y: fx(-hgt / 2 + unit * 0.1), width: fx(len * 0.42), height: fx(hgt - unit * 0.2), rx: fx(unit * 0.08), class: 'loco-cab' }),
      s('circle', { cx: fx(len * 0.26), cy: 0, r: fx(unit * 0.17), class: 'loco-chimney' }),
      s('circle', { cx: fx(len * 0.5), cy: fx(-hgt * 0.27), r: fx(unit * 0.08), class: 'loco-lamp' }),
      s('circle', { cx: fx(len * 0.5), cy: fx(hgt * 0.27), r: fx(unit * 0.08), class: 'loco-lamp' }));
    const smoke = s('g', { class: 'smoke' }, [0, 1, 2].map((j) => s('circle', { r: fx(unit * (0.13 + j * 0.04)), class: `puff puff${j}` })));
    const wrap = s('g', {}, loco);
    train.append(wrap, smoke);
    this.parts.push({ wrap, box: loco, label: null, smoke, chimney: len * 0.26 });
    this.svg.append(train);
  }

  render(now) {
    if (!this.geo) return;
    const p = clamp(this.p, 0, 1);
    this.maskPath?.setAttribute('stroke-dasharray', `${fx(p * 1000)} 1000`);
    if (this.shape === 'slak') this.renderSnail(now);
    else if (this.shape === 'trein') this.renderTrain(now);
    else this.renderSnake(now);
    this.renderBaby();
  }

  /** Hoe ver deel i al is 'opgegeten' (0 = heel, 1 = weg). */
  eaten(i) {
    return clamp((clamp(this.p, 0, 1) * this.L - i * this.spacing) / this.spacing, 0, 1);
  }

  /** Positie met een klein golfje (of een dansje bij een record). */
  wobble(i, now) {
    const p = this.pos[i];
    let amp = 0;
    let phase = 0;
    if (this.dancing && !this.still) {
      amp = this.geo.unit * 0.22;
      phase = now / 110 - i * 0.75;
    } else if (!this.still) {
      amp = this.geo.unit * 0.05;
      phase = now / 380 - i * 0.6;
    }
    if (!amp) return p;
    const o = Math.sin(phase) * amp;
    return { x: p.x - Math.sin(p.a) * o, y: p.y + Math.cos(p.a) * o, a: p.a };
  }

  renderSnake(now) {
    const { n } = this.geo;
    const first = Math.floor((clamp(this.p, 0, 1) * this.L) / this.spacing);
    for (let i = 0; i < n; i++) {
      const g = this.parts[i];
      const f = this.eaten(i);
      if (f >= 1) {
        g.setAttribute('display', 'none');
        continue;
      }
      g.removeAttribute('display');
      const taper = i === n - 1 ? 1 : Math.min(1, 0.6 + 0.14 * (i - first));
      const sc = (1 - easeIn(f)) * taper;
      const { x, y } = this.wobble(i, now);
      g.setAttribute('transform', `translate(${fx(x)} ${fx(y)}) scale(${sc.toFixed(3)})`);
    }
  }

  renderSnail(now) {
    const { n, unit } = this.geo;
    for (let i = 0; i < n; i++) {
      const g = this.parts[i];
      const f = this.eaten(i);
      if (f >= 1) {
        g.setAttribute('display', 'none');
        continue;
      }
      g.removeAttribute('display');
      const { x, y } = this.dancing ? this.wobble(i, now) : this.pos[i];
      g.setAttribute('transform', `translate(${fx(x)} ${fx(y)}) scale(${(1 - easeIn(f)).toFixed(3)})`);
    }
    const at = this.geo.track.at(Math.min(clamp(this.p, 0, 1) * this.L, this.L - 0.5));
    const flip = Math.cos(at.a) < 0 ? -1 : 1;
    let bob = 0;
    if (!this.still) bob = this.dancing ? -Math.abs(Math.sin(now / 140)) * unit * 0.45 : Math.sin(now / 240) * unit * 0.03;
    this.snail.setAttribute('transform', `translate(${fx(at.x)} ${fx(at.y - unit * 0.2 + bob)}) scale(${flip} 1)`);
  }

  renderTrain(now) {
    const { n, unit } = this.geo;
    const track = this.geo.track;
    for (let i = 0; i < n; i++) {
      const part = this.parts[i];
      const f = this.eaten(i);
      if (f >= 1) {
        part.wrap.setAttribute('display', 'none');
        if (part.smoke) part.smoke.setAttribute('display', 'none');
        continue;
      }
      part.wrap.removeAttribute('display');
      // Het achterste wagonnetje rijdt langzaam weg (terug over het spoor) en vervaagt.
      const at = f > 0 ? track.at((i + 0.5) * this.spacing - f * this.spacing * 0.8) : this.pos[i];
      let hop = 0;
      if (this.dancing && !this.still) hop = -Math.abs(Math.sin(now / 150 - i * 0.6)) * unit * 0.3;
      part.wrap.setAttribute('opacity', (1 - f * 0.85).toFixed(2));
      part.box.setAttribute('transform', `translate(${fx(at.x)} ${fx(at.y + hop)}) rotate(${deg(at.a)})`);
      part.label?.setAttribute('transform', `translate(${fx(at.x)} ${fx(at.y + hop)})`);
      if (part.smoke) {
        part.smoke.removeAttribute('display');
        const cx = at.x + Math.cos(at.a) * part.chimney;
        const cy = at.y + Math.sin(at.a) * part.chimney + hop;
        part.smoke.setAttribute('transform', `translate(${fx(cx)} ${fx(cy)})`);
      }
    }
  }

  /** Paars vriendje dat groeit zolang de tijd na de doeltijd doorloopt. */
  renderBaby() {
    const b = this.baby;
    if (!b) return;
    const over = this.p > 1 ? clamp(this.p - 1, 0, 1) * this.L : 0;
    let lead = -1;
    for (let i = 0; i < b.parts.length; i++) {
      const g = clamp((over - i * this.spacing) / this.spacing, 0, 1);
      const el = b.parts[i];
      if (g <= 0) {
        el.setAttribute('display', 'none');
        continue;
      }
      lead = i;
      el.removeAttribute('display');
      const p = this.pos[i];
      el.setAttribute('transform', `translate(${fx(p.x)} ${fx(p.y)}) rotate(${deg(p.a)}) scale(${(0.35 + 0.65 * g).toFixed(3)})`);
    }
    if (lead < 0) {
      b.head.setAttribute('display', 'none');
      return;
    }
    const p = this.pos[lead];
    b.head.removeAttribute('display');
    b.head.setAttribute('transform', `translate(${fx(p.x)} ${fx(p.y)})`);
  }
}
