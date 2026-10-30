// Banen voor de tijd-figuren: een zigzag van boven naar beneden (slang, trein)
// en een spiraal van buiten naar binnen (slak). Puur rekenwerk, geen DOM.

export class Track {
  constructor(points) {
    this.pts = points;
    this.cum = new Float64Array(points.length);
    for (let i = 1; i < points.length; i++) {
      this.cum[i] = this.cum[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    this.length = this.cum[points.length - 1];
  }

  /** Punt op afstand s langs de baan, met de richting (hoek in radialen). */
  at(s) {
    const { pts, cum } = this;
    const last = pts.length - 1;
    if (s <= 0) return { x: pts[0].x, y: pts[0].y, a: angle(pts[0], pts[1]) };
    if (s >= this.length) return { x: pts[last].x, y: pts[last].y, a: angle(pts[last - 1], pts[last]) };
    let lo = 0;
    let hi = last;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= s) lo = mid;
      else hi = mid;
    }
    const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
    const p = pts[lo];
    const q = pts[hi];
    return { x: p.x + (q.x - p.x) * f, y: p.y + (q.y - p.y) * f, a: angle(p, q) };
  }

  /** SVG-pad van de hele baan, optioneel zijwaarts verschoven (voor treinrails). */
  path(offset = 0) {
    const pts = offset ? this.shifted(offset) : this.pts;
    return 'M' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L');
  }

  shifted(d) {
    const { pts } = this;
    const last = pts.length - 1;
    return pts.map((p, i) => {
      const a = angle(pts[Math.max(0, i - 1)], pts[Math.min(last, i + 1)]);
      return { x: p.x - Math.sin(a) * d, y: p.y + Math.cos(a) * d };
    });
  }
}

const angle = (p, q) => Math.atan2(q.y - p.y, q.x - p.x);

/**
 * Zigzag: rijen van links naar rechts en terug, van boven naar beneden.
 * Kiest het aantal rijen zo dat er ongeveer `target` figuurtjes op passen.
 */
export function zigzag(W, H, { pad = 10, target = 24, maxUnit = 120, fill = 0.58, spacing = 0.86 } = {}) {
  let best = null;
  for (let rows = 1; rows <= 9; rows++) {
    const gap = (H - 2 * pad) / rows;
    const unit = Math.min(gap * fill, maxUnit);
    if (unit < 26) break;
    const r = rows > 1 ? Math.min(gap / 2, unit * 0.75) : 0;
    const xA = pad + r + unit / 2;
    const xB = W - pad - r - unit / 2;
    if (xB - xA < unit * 1.5) continue;
    const turn = Math.PI * r + (gap - 2 * r);
    const length = rows * (xB - xA) + (rows - 1) * turn;
    const n = Math.floor(length / (unit * spacing));
    const score = Math.abs(n - target);
    if (!best || score < best.score) best = { rows, gap, unit, r, xA, xB, n, score };
  }
  if (!best) {
    // Heel klein vlak: één rij, zo goed als het gaat.
    const unit = Math.max(16, Math.min(H - 2 * pad, 40));
    best = { rows: 1, gap: H - 2 * pad, unit, r: 0, xA: pad + unit / 2, xB: Math.max(pad + unit, W - pad - unit / 2), n: 4 };
  }

  const { rows, gap, unit, r, xA, xB } = best;
  const pts = [];
  for (let k = 0; k < rows; k++) {
    const y = pad + gap / 2 + k * gap;
    const ltr = k % 2 === 0;
    const x0 = ltr ? xA : xB;
    const x1 = ltr ? xB : xA;
    const steps = Math.max(2, Math.ceil(Math.abs(x1 - x0) / 6));
    for (let i = k === 0 ? 0 : 1; i <= steps; i++) pts.push({ x: x0 + ((x1 - x0) * i) / steps, y });
    if (k < rows - 1) {
      const dir = ltr ? 1 : -1;
      const arc = 12;
      // kwartcirkel naar beneden, recht stuk, kwartcirkel terug naar binnen
      for (let i = 1; i <= arc; i++) {
        const th = -Math.PI / 2 + (Math.PI / 2) * (i / arc);
        pts.push({ x: x1 + dir * r * Math.cos(th), y: y + r + r * Math.sin(th) });
      }
      const straight = gap - 2 * r;
      if (straight > 1) pts.push({ x: x1 + dir * r, y: y + r + straight });
      for (let i = 1; i <= arc; i++) {
        const th = (Math.PI / 2) * (i / arc);
        pts.push({ x: x1 + dir * r * Math.cos(th), y: y + gap - r + r * Math.sin(th) });
      }
    }
  }
  const track = new Track(pts);
  const n = Math.max(3, Math.floor(track.length / (unit * spacing)));
  return { kind: 'zigzag', track, unit, n, rows, gap };
}

/**
 * Spiraal (slakkenhuis) van buiten naar binnen. In het midden blijft ruimte
 * voor de aardbei waar de slak naartoe kruipt.
 */
export function spiral(W, H, { pad = 10, target = 26 } = {}) {
  const cx = W / 2;
  const cy = H / 2;
  let best = null;
  for (let unit = 96; unit >= 24; unit -= 2) {
    // De slak zelf is breder dan een bolletje: houd daar aan de buitenkant ruimte voor.
    const rx = W / 2 - pad - unit * 1.1;
    const ry = H / 2 - pad - unit * 1.1;
    const R = Math.min(rx, ry);
    const pitch = unit * 1.24;
    const r0 = unit * 1.15;
    if (R - r0 < pitch * 0.9) continue;
    const sx = Math.min(rx / R, 1.45);
    const sy = Math.min(ry / R, 1.45);
    const turns = (R - r0) / pitch;
    const length = 2 * Math.PI * turns * ((R + r0) / 2) * ((sx + sy) / 2);
    const n = Math.floor(length / unit);
    const score = Math.abs(n - target) + (turns < 1.4 ? 6 : 0);
    if (!best || score < best.score) best = { unit, R, pitch, r0, sx, sy, turns, score };
  }
  if (!best) best = { unit: 24, R: 40, pitch: 30, r0: 20, sx: 1, sy: 1, turns: 1, score: 0 };

  const { unit, pitch, r0, sx, sy, turns } = best;
  const b = pitch / (2 * Math.PI);
  const thetaMax = turns * 2 * Math.PI;
  const start = Math.PI * 0.75; // buitenkant begint linksonder
  const pts = [];
  for (let th = thetaMax; th > 0; th -= 0.04) {
    const rr = r0 + b * th;
    pts.push({ x: cx + Math.cos(th + start) * rr * sx, y: cy + Math.sin(th + start) * rr * sy });
  }
  pts.push({ x: cx + Math.cos(start) * r0 * sx, y: cy + Math.sin(start) * r0 * sy });
  const track = new Track(pts);
  const n = Math.max(3, Math.floor(track.length / unit));
  return { kind: 'spiral', track, unit, n, center: { x: cx, y: cy }, r0: r0 * Math.min(sx, sy) };
}
