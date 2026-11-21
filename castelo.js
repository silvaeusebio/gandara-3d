// Leiria castle, on its hill at the south edge of the map: the walls, towers, palace and church that OpenStreetMap has for it (MAP.castle),
// drawn in stone. Its footpaths are roads of the map (type "footway"), so you can walk in through the gates.
window.buildCastle = function (ctx) {
  const { B, C, W, ring, pip, height, near, segDist, blobs, miniBuildings, flatPoly, data } = ctx;
  const STONE = C('#b9ad93'), DARK = C('#a59a81'), LIGHT = C('#c8bda5'), HOLE = C('#2f2a24'), TILE = C('#b9573a');
  const GATE = 3.4;                               // height of the opening where a path goes through a wall
  const pathAt = (x, z, r) => { for (const s of near(x, z)) if (s.road && segDist(x, z, s).d < s.w / 2 + r) return true; return false; };
  B.base = 0;                                     // heights here are given as they are

  // one piece of wall between two points: a face on each side, a top and (ends) the two ends. b0/b1 = bottom, t0/t1 = top, at each end
  const slab = (ax, az, bx, bz, nx, nz, b0, b1, t0, t1, col, under) => {
    const a = [ax + nx, b0, az + nz], b = [bx + nx, b1, bz + nz], c = [bx - nx, b1, bz - nz], d = [ax - nx, b0, az - nz];
    const e = [a[0], t0, a[2]], f = [b[0], t1, b[2]], g = [c[0], t1, c[2]], j = [d[0], t0, d[2]];
    B.quad(a, b, f, e, col); B.quad(d, c, g, j, col); B.quad(e, f, g, j, col); B.quad(a, d, j, e, col); B.quad(b, c, g, f, col);
    if (under) B.quad(a, b, c, d, col);
  };
  // a wall along a line: it follows the ground, with battlements on top and a gate wherever a path goes through
  function wall(pts, h, thick, merlons) {
    let n = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], len = Math.hypot(b.x - a.x, b.z - a.z);
      if (len < 0.05) continue;
      const dx = (b.x - a.x) / len, dz = (b.z - a.z) / len, nx = -dz * thick / 2, nz = dx * thick / 2, k = Math.max(1, Math.round(len / 1.6));
      for (let j = 0; j < k; j++, n++) {
        const x0 = a.x + dx * len * j / k, z0 = a.z + dz * len * j / k, x1 = a.x + dx * len * (j + 1) / k, z1 = a.z + dz * len * (j + 1) / k, g0 = height(x0, z0), g1 = height(x1, z1);
        const gate = pathAt((x0 + x1) / 2, (z0 + z1) / 2, 0.5);
        if (gate && h < GATE + 1) continue;                        // a low wall simply stops at a path
        slab(x0, z0, x1, z1, nx, nz, gate ? g0 + GATE : g0 - 1.5, gate ? g1 + GATE : g1 - 1.5, g0 + h, g1 + h, n % 7 === 3 ? LIGHT : STONE, gate);
        if (merlons && n % 2 === 0) slab(x0, z0, x1, z1, nx, nz, g0 + h, g1 + h, g0 + h + 0.9, g1 + h + 0.9, DARK, false);
      }
    }
  }
  // a building given by its outline: tower, thick wall, palace (with a tiled roof and arches) or ruin (no roof, broken walls)
  function block(b) {
    const pts = b.p.map(W), n = pts.length;
    let lo = 1e9, hi = -1e9, cx = 0, cz = 0, area = 0;
    pts.forEach((p, i) => { const g = height(p.x, p.z), q = pts[(i + 1) % n]; lo = Math.min(lo, g); hi = Math.max(hi, g); cx += p.x / n; cz += p.z / n; area += p.x * q.z - q.x * p.z; });
    const top = (lo + hi) / 2 + b.h, out = area > 0 ? 1 : -1, crown = b.k === 'tower' || b.k === 'wall';
    let m = 0;
    for (let i = 0; i < n; i++) {
      const a = pts[i], q = pts[(i + 1) % n], len = Math.hypot(q.x - a.x, q.z - a.z);
      if (len < 0.05) continue;
      const dx = (q.x - a.x) / len, dz = (q.z - a.z) / len, ox = dz * out, oz = -dx * out, k = Math.max(1, Math.round(len / 1.6));
      for (let j = 0; j < k; j++, m++) {
        const x0 = a.x + dx * len * j / k, z0 = a.z + dz * len * j / k, x1 = a.x + dx * len * (j + 1) / k, z1 = a.z + dz * len * (j + 1) / k, mx = (x0 + x1) / 2, mz = (z0 + z1) / 2;
        const gate = pathAt(mx, mz, 0.4), bottom = gate ? height(mx, mz) + GATE : lo - 1.5, t = b.k === 'ruin' ? top - [0, 1.6, 3.4, 0.9, 2.4][m % 5] : top;
        if (t > bottom) B.quad([x0, bottom, z0], [x1, bottom, z1], [x1, t, z1], [x0, t, z0], m % 7 === 3 ? LIGHT : STONE);
        if (crown && m % 2 === 0) slab(x0 - ox * 0.25, z0 - oz * 0.25, x1 - ox * 0.25, z1 - oz * 0.25, ox * 0.25, oz * 0.25, top, top, top + 0.9, top + 0.9, DARK, false);
        const hole = (w, y0, y1, peak) => {                        // a dark opening in the middle of this piece
          const ax = mx - dx * w / 2 + ox * 0.06, az = mz - dz * w / 2 + oz * 0.06, bx = mx + dx * w / 2 + ox * 0.06, bz = mz + dz * w / 2 + oz * 0.06;
          B.quad([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], HOLE);
          if (peak) B.tri([ax, y1, az], [bx, y1, bz], [mx + ox * 0.06, y1 + peak, mz + oz * 0.06], HOLE);
        };
        if (gate) continue;
        if (b.k === 'tower' && b.h > 10 && m % 5 === 2) hole(0.35, top - 5, top - 3.6, 0);
        if (b.k === 'palace' && k >= 3 && j % 2 === 1) { hole(1.0, top - 5.4, top - 3.4, 0.7); hole(0.5, top - 9.6, top - 8.4, 0.3); }
        if (b.k === 'ruin' && m % 4 === 1) hole(0.7, lo + 2.2, top - 5, 0.8);
      }
    }
    if (crown) flatPoly(B, pts, top - 0.02, DARK);
    if (b.k === 'palace') {                                        // tiled roof: a ring that shrinks towards the middle
      const inner = pts.map(p => ({ x: cx + (p.x - cx) * 0.55, z: cz + (p.z - cz) * 0.55 }));
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; B.quad([pts[i].x, top, pts[i].z], [pts[j].x, top, pts[j].z], [inner[j].x, top + 2.4, inner[j].z], [inner[i].x, top + 2.4, inner[i].z], TILE); }
      flatPoly(B, inner, top + 2.4, TILE);
    }
    blobs.push({ x: cx, z: cz, r: Math.max(...pts.map(p => Math.hypot(p.x - cx, p.z - cz))), fresh: true });
    miniBuildings.push({ pts, c: '#9c927b' });
  }

  const zone = ring(data.zone), loop = zone.concat([zone[0]]);
  const toLoop = (x, z) => { let d = 1e9; for (let i = 0; i < loop.length - 1; i++) d = Math.min(d, segDist(x, z, { ax: loop[i].x, az: loop[i].z, bx: loop[i + 1].x, bz: loop[i + 1].z }).d); return d; };
  wall(loop, 7.5, 1.8, true);                                      // the outer wall, all the way round
  for (const w of data.walls) {
    const pts = w.p.map(W);
    if (pts.every(p => toLoop(p.x, p.z) < 2.5)) continue;          // already there: it is part of the outer wall
    wall(pts, w.h, w.h > 4 ? 1.6 : 0.6, w.h > 4);
  }
  data.blocks.forEach(block);
  let x = 0, z = 0;
  for (const p of zone) { x += p.x / zone.length; z += p.z / zone.length; }
  return { x, z, inZone: (px, pz) => pip(zone, px, pz) || toLoop(px, pz) < 4 };
};
