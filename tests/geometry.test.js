import test from 'node:test';
import assert from 'node:assert/strict';
import { zigzag, spiral, Track } from '../js/geometry.js';

const SIZES = [
  [358, 420], // telefoon staand
  [560, 300], // telefoon liggend
  [760, 640], // tablet staand
  [860, 620], // tablet liggend
];

function inBounds(geo, W, H, radius) {
  for (const p of geo.track.pts) {
    if (p.x - radius < -0.5 || p.y - radius < -0.5 || p.x + radius > W + 0.5 || p.y + radius > H + 0.5) return false;
  }
  return true;
}

test('Track meet lengtes en punten langs de baan', () => {
  const t = new Track([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }]);
  assert.equal(t.length, 150);
  assert.deepEqual([t.at(50).x, t.at(50).y], [50, 0]);
  assert.deepEqual([t.at(125).x, t.at(125).y], [100, 25]);
  assert.equal(Math.round((t.at(125).a * 180) / Math.PI), 90);
});

for (const [W, H] of SIZES) {
  test(`zigzag past in ${W}×${H} met een redelijk aantal bolletjes`, () => {
    const g = zigzag(W, H, { target: 24 });
    assert.ok(g.n >= 10 && g.n <= 40, `n=${g.n}`);
    assert.ok(inBounds(g, W, H, g.unit / 2), 'valt buiten het vlak');
    assert.ok(g.track.pts[0].y < g.track.pts.at(-1).y, 'loopt van boven naar beneden');
  });

  test(`spiraal past in ${W}×${H} en loopt naar binnen`, () => {
    const g = spiral(W, H, { target: 26 });
    assert.ok(g.n >= 10 && g.n <= 45, `n=${g.n}`);
    assert.ok(inBounds(g, W, H, g.unit / 2), 'valt buiten het vlak');
    const d = (p) => Math.hypot(p.x - g.center.x, p.y - g.center.y);
    assert.ok(d(g.track.pts[0]) > d(g.track.pts.at(-1)), 'begint buiten');
  });
}
