// Rua dos Lavradios, modelled by hand from satellite and street-level photos.
// Everything is placed in "street coordinates": s = metres along the street from the Rua Manuel dos Santos end,
// v = metres from the centre of the road (on the SW/south side or on the NE/north side).
window.buildLavradios = function (ctx) {
  const { THREE, B, G, C, box, frame, flatPoly, hipRoof, segs, roads, blobs, miniBuildings, rnd, segDist, near, addSeg } = ctx;
  const road = roads.filter(r => r.name === 'Rua dos Lavradios')                    // the one that passes in front of the home (map origin)
    .sort((a, b) => Math.min(...a.pts.map(p => Math.hypot(p.x, p.z))) - Math.min(...b.pts.map(p => Math.hypot(p.x, p.z))))[0];
  if (!road) return null;
  let pts = road.pts;
  if (pts[0].x > pts[pts.length - 1].x) pts = pts.slice().reverse();
  road.noWall = true;                                   // this street gets its own walls, fences and hedges
  const lavSegs = segs.filter(s => s.road === road);
  for (const s of lavSegs) { s.noWall = true; s.lav = true; s.side = 0; }
  road.noSide = true;
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const HALF = road.st.w / 2, STRIP = 4.75, STRIP_END = 146.5;   // cobbled parking strip on the SW side, up to the property walls
  const SW = 1, NE = -1;

  function at(s, side, v) {                              // world position of street coordinate (s, v)
    let i = 0;
    while (i < pts.length - 2 && s >= cum[i + 1]) i++;
    const a = pts[i], b = pts[i + 1], l = cum[i + 1] - cum[i], dx = (b.x - a.x) / l, dz = (b.z - a.z) / l, t = s - cum[i];
    const nx = -dz * side, nz = dx * side;               // side +1 = right of travel (SW)
    return { x: a.x + dx * t + nx * v, z: a.z + dz * t + nz * v, dx, dz, nx, nz };
  }
  const lot = (s0, side) => { const p = at(s0, side, 0); return frame(p.x, p.z, p.dx, p.dz, p.nx, p.nz); };   // u = metres after s0, v = from road centre
  const FS = lot(0, SW), FN = lot(0, NE);                // first straight stretch: u is simply s
  const sub = (f, u, v, quarter) => {                    // frame centred on (u, v) of f, optionally turned 90 degrees
    const o = f.xz(u, v), a = f.xz(u + 1, v), b = f.xz(u, v + 1), ex = [a.x - o.x, a.z - o.z], ev = [b.x - o.x, b.z - o.z];
    return quarter ? frame(o.x, o.z, ev[0], ev[1], -ex[0], -ex[1]) : frame(o.x, o.z, ex[0], ex[1], ev[0], ev[1]);
  };
  function inZone(x, z) {                                // close to the street: no random houses or trees here
    for (const s of lavSegs) if (segDist(x, z, s).d < 36) return true;
    return false;
  }
  function insideOther(p) {                              // on the surface of another road (a junction)
    for (const s of near(p.x, p.z)) if (!s.lav && segDist(p.x, p.z, s).d < s.w / 2 + (s.side || 0) + 0.05) return true;
    return false;
  }

  // ---------- palette ----------
  const P = {
    white: C('#f7f6f1'), cream: C('#f0e9d8'), beige: C('#d9d2c2'), terra: C('#c4623a'), terraOld: C('#ad6447'), terraDark: C('#a5553a'),
    darkRoof: C('#4b4e53'), greyRoof: C('#8d8f90'), sheetBlue: C('#6f7f95'), sheetRed: C('#b3423c'),
    green: C('#2f6b4a'), greenDark: C('#254a36'), wood: C('#7a4a2c'), woodDark: C('#4a2f22'), stone: C('#d6cebd'), frame: C('#e9e6df'),
    frameGrey: C('#6b6f73'), glass: C('#2e4458'), glassRail: C('#a9d3e6'), shutGreen: C('#3f7a55'), shutGrey: C('#b9bcc0'), shutWhite: C('#e2e0da'),
    shutWood: C('#c98a3a'), shutYellow: C('#dfc15c'), charcoal: C('#33373c'), black: C('#1e2022'), concrete: C('#bdb8ad'), cobble: C('#77787b'),
    lawn: C('#7fbf5e'), soil: C('#9a7b5a'), gravel: C('#cfc7b6'), dryGrass: C('#a9ad74'), wildGrass: C('#96a565'), leaf: C('#4f9a43'),
    leafDark: C('#2f7a45'), leafLight: C('#6bb84f'), trunk: C('#7a5a3c'), rough: C('#a39683'), block: C('#9a9a96'),
  };

  // ---------- small building blocks ----------
  const faceV = (f, u0, u1, y0, y1, v, col) => B.quad(f.pt(u0, y0, v), f.pt(u1, y0, v), f.pt(u1, y1, v), f.pt(u0, y1, v), col);
  const faceU = (f, u, v0, v1, y0, y1, col) => B.quad(f.pt(u, y0, v0), f.pt(u, y0, v1), f.pt(u, y1, v1), f.pt(u, y1, v0), col);
  const patch = (f, u0, u1, v0, v1, col, y = 0.04) => flatPoly(G, [f.xz(u0, v0), f.xz(u1, v0), f.xz(u1, v1), f.xz(u0, v1)], y, col);
  function foot(f, u0, u1, v0, v1, col = '#9a8f86') {    // register a building for the minimap and for keeping things apart
    const c = [f.xz(u0, v0), f.xz(u1, v0), f.xz(u1, v1), f.xz(u0, v1)], m = f.xz((u0 + u1) / 2, (v0 + v1) / 2);
    miniBuildings.push({ pts: c, c: col });
    blobs.push({ x: m.x, z: m.z, r: Math.hypot(u1 - u0, v1 - v0) / 2 });
  }
  // window / door on a wall that faces the road (plane v); d = +1 for a wall facing away from the road
  function win(f, u, y, w, h, v, o = {}) {
    const d = o.d || -1, m = o.m === undefined ? 0.1 : o.m, fr = o.frame || P.frame;
    if (m > 0) faceV(f, u - w / 2 - m, u + w / 2 + m, y - m, y + h + m, v + d * 0.05, fr);
    faceV(f, u - w / 2, u + w / 2, y, y + h, v + d * 0.09, o.shut || o.pane || P.glass);
    if (o.grid) { faceV(f, u - 0.03, u + 0.03, y, y + h, v + d * 0.12, fr); faceV(f, u - w / 2, u + w / 2, y + h / 2 - 0.03, y + h / 2 + 0.03, v + d * 0.12, fr); }
    if (o.half) faceV(f, u - w / 2, u + w / 2, y + h * 0.45, y + h, v + d * 0.12, o.half);
  }
  function winU(f, u, vc, y, w, h, d, o = {}) {          // same, on a side wall (plane u); d = -1 faces lower s, +1 faces higher s
    const m = o.m === undefined ? 0.1 : o.m, fr = o.frame || P.frame;
    if (m > 0) faceU(f, u + d * 0.05, vc - w / 2 - m, vc + w / 2 + m, y - m, y + h + m, fr);
    faceU(f, u + d * 0.09, vc - w / 2, vc + w / 2, y, y + h, o.shut || o.pane || P.glass);
  }
  function hip(f, u0, u1, v0, v1, y, h, col, ov = 0.45, fascia) {
    box(B, f, u0 - ov, u1 + ov, y, y + 0.14, v0 - ov, v1 + ov, fascia || col);
    hipRoof(B, f, u0 - ov, u1 + ov, v0 - ov, v1 + ov, y + 0.14, h, col);
  }
  function gable(f, u0, u1, v0, v1, y, h, col, wall, ov = 0.4, fascia) {   // ridge along the street
    const vm = (v0 + v1) / 2, yo = y - ov * h / ((v1 - v0) / 2), a0 = u0 - ov, a1 = u1 + ov;
    B.quad(f.pt(a0, yo, v0 - ov), f.pt(a1, yo, v0 - ov), f.pt(a1, y + h, vm), f.pt(a0, y + h, vm), col);
    B.quad(f.pt(a0, yo, v1 + ov), f.pt(a1, yo, v1 + ov), f.pt(a1, y + h, vm), f.pt(a0, y + h, vm), col);
    B.tri(f.pt(u0, y, v0), f.pt(u0, y, v1), f.pt(u0, y + h, vm), wall); B.tri(f.pt(u1, y, v0), f.pt(u1, y, v1), f.pt(u1, y + h, vm), wall);
    if (fascia) { faceV(f, a0, a1, yo - 0.16, yo + 0.02, v0 - ov - 0.01, fascia); faceV(f, a0, a1, yo - 0.16, yo + 0.02, v1 + ov + 0.01, fascia); }
  }
  function gableAcross(f, u0, u1, v0, v1, y, h, col, wall, ov = 0.4) {     // ridge at right angles to the street: the gable faces the road
    const um = (u0 + u1) / 2, yo = y - ov * h / ((u1 - u0) / 2), b0 = v0 - ov, b1 = v1 + ov;
    B.quad(f.pt(u0 - ov, yo, b0), f.pt(u0 - ov, yo, b1), f.pt(um, y + h, b1), f.pt(um, y + h, b0), col);
    B.quad(f.pt(u1 + ov, yo, b0), f.pt(u1 + ov, yo, b1), f.pt(um, y + h, b1), f.pt(um, y + h, b0), col);
    B.tri(f.pt(u0, y, v0), f.pt(u1, y, v0), f.pt(um, y + h, v0), wall); B.tri(f.pt(u0, y, v1), f.pt(u1, y, v1), f.pt(um, y + h, v1), wall);
  }
  function mono(f, u0, u1, v0, v1, yA, yB, axis, col) {  // single slope: yA at v0 (or u0), yB at v1 (or u1)
    const p = axis === 'v' ? [f.pt(u0, yA, v0), f.pt(u1, yA, v0), f.pt(u1, yB, v1), f.pt(u0, yB, v1)] : [f.pt(u0, yA, v0), f.pt(u1, yB, v0), f.pt(u1, yB, v1), f.pt(u0, yA, v1)];
    B.quad(p[0], p[1], p[2], p[3], col);
    B.quad(...p.map(q => [q[0], q[1] - 0.12, q[2]]), col);
  }
  function chimney(f, u, v, y0, y1, col = P.white) { box(B, f, u - 0.3, u + 0.3, y0, y1, v - 0.3, v + 0.3, col); box(B, f, u - 0.38, u + 0.38, y1, y1 + 0.12, v - 0.38, v + 0.38, P.terraOld); }
  const post = (f, u, v, y0, y1, r, col) => box(B, f, u - r, u + r, y0, y1, v - r, v + r, col);
  // railing between two points of a frame; kind: bars | balus | glass
  function rail(f, ua, va, ub, vb, y0, y1, col, kind = 'bars') {
    const a = f.xz(ua, va), b = f.xz(ub, vb), L = Math.hypot(b.x - a.x, b.z - a.z);
    if (L < 0.05) return;
    const dx = (b.x - a.x) / L, dz = (b.z - a.z) / L, g = frame(a.x, a.z, dx, dz, -dz, dx);
    if (kind === 'glass') { faceV(g, 0, L, y0, y1, 0, P.glassRail); box(B, g, 0, L, y1, y1 + 0.04, -0.03, 0.03, C('#dfe6ea')); return; }
    const t = kind === 'balus' ? 0.07 : 0.025;
    box(B, g, 0, L, y1 - 0.06, y1, -t - 0.02, t + 0.02, col);
    if (kind === 'balus') { for (let u = 0.15; u < L - 0.1; u += 0.34) box(B, g, u - 0.06, u + 0.06, y0, y1 - 0.06, -0.06, 0.06, col); return; }
    box(B, g, 0, L, y0 + 0.05, y0 + 0.09, -t, t, col);
    for (let u = 0.1; u < L; u += 0.24) faceV(g, u - 0.018, u + 0.018, y0, y1, 0, col);
  }

  // ---------- plants ----------
  const ICO = new THREE.IcosahedronGeometry(1, 0), CYL = new THREE.CylinderGeometry(1, 1, 1, 6), CONE = new THREE.ConeGeometry(1, 1, 6);
  const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _up = new THREE.Vector3(0, 1, 0), _m = new THREE.Matrix4();
  function addGeo(geo, x, y, z, sx, sy, sz, col, turn = 0) {
    const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, a = [];
    _m.compose(new THREE.Vector3(x, y, z), _q.setFromAxisAngle(_up, turn), new THREE.Vector3(sx, sy, sz));
    for (let i = 0; i < p.count; i++) { _v.fromBufferAttribute(p, i).applyMatrix4(_m); a.push([_v.x, _v.y, _v.z]); }
    for (let i = 0; i < a.length; i += 3) B.tri(a[i], a[i + 1], a[i + 2], col);
  }
  const greens = [P.leaf, P.leafLight, C('#458a3c'), C('#5fae4c')];
  function tree(f, u, v, h = 6, r = 2.2, col) {          // round tree
    const p = f.xz(u, v);
    addGeo(CYL, p.x, h * 0.3, p.z, 0.2, h * 0.6, 0.2, P.trunk);
    addGeo(ICO, p.x, h * 0.72, p.z, r, r * 0.95, r, col || greens[Math.floor(rnd() * greens.length)], rnd() * 6);
  }
  function conifer(f, u, v, h = 4, r = 1.1, col = P.leafDark) { const p = f.xz(u, v); addGeo(CONE, p.x, h / 2 + 0.2, p.z, r, h, r, col, rnd() * 6); }
  function shrub(f, u, v, r = 0.7, col) { const p = f.xz(u, v); addGeo(ICO, p.x, r * 0.75, p.z, r, r * 0.85, r, col || greens[Math.floor(rnd() * greens.length)], rnd() * 6); }
  function palm(f, u, v, h = 6, leafCol = C('#4c8f3f')) {
    const p = f.xz(u, v);
    addGeo(CYL, p.x, h / 2, p.z, 0.28, h, 0.28, C('#8a6a4a'));
    for (let k = 0; k < 9; k++) {
      const a = k / 9 * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), w = 0.45;
      B.tri([p.x, h, p.z], [p.x + c * 1.5 - s * w, h + 0.55, p.z + s * 1.5 + c * w], [p.x + c * 1.5 + s * w, h + 0.55, p.z + s * 1.5 - c * w], leafCol);
      B.tri([p.x + c * 1.5 - s * w, h + 0.55, p.z + s * 1.5 + c * w], [p.x + c * 1.5 + s * w, h + 0.55, p.z + s * 1.5 - c * w], [p.x + c * 3.0, h - 0.6, p.z + s * 3.0], leafCol);
    }
  }
  function spiky(f, u, v, h = 1.6, col = C('#5c9a4a')) { // yucca / banana-like plant
    const p = f.xz(u, v);
    for (let k = 0; k < 7; k++) { const a = k / 7 * Math.PI * 2 + rnd(), c = Math.cos(a), s = Math.sin(a); B.tri([p.x - s * 0.18, 0, p.z + c * 0.18], [p.x + s * 0.18, 0, p.z - c * 0.18], [p.x + c * h * 0.6, h * (0.7 + rnd() * 0.4), p.z + s * h * 0.6], col); }
  }
  function parasol(f, u, v, col = C('#8a7466')) {
    post(f, u, v, 0, 2.45, 0.05, C('#5a4a3c'));
    const top = f.pt(u, 2.95, v);
    for (let k = 0; k < 8; k++) { const a0 = k / 8 * Math.PI * 2, a1 = (k + 1) / 8 * Math.PI * 2; B.tri(top, f.pt(u + Math.cos(a0) * 1.7, 2.35, v + Math.sin(a0) * 1.7), f.pt(u + Math.cos(a1) * 1.7, 2.35, v + Math.sin(a1) * 1.7), col); }
  }

  // ---------- parked cars (decoration, but you cannot walk through them) ----------
  const obstacles = [];
  function parked(f, u, v, across, col, tall) {
    const g = sub(f, u, v, across), body = C(col), top = tall ? 1.72 : 1.5;
    box(B, g, -2.1, 2.1, 0.32, tall ? 1.05 : 0.92, -0.86, 0.86, body);
    box(B, g, tall ? -1.9 : -1.15, 1.15, tall ? 1.05 : 0.92, top, -0.78, 0.78, C('#27323c'));
    box(B, g, tall ? -1.85 : -1.1, 1.1, top, top + 0.05, -0.78, 0.78, body);
    for (const du of [-1.65, 0.95]) for (const dv of [-0.9, 0.66]) box(B, g, du, du + 0.7, 0, 0.7, dv, dv + 0.24, P.black);
    for (const o of [-1.25, 0, 1.25]) { const p = g.xz(o, 0); obstacles.push({ x: p.x, z: p.z, r: 0.95 }); }
  }

  // on sloping ground each plant and each parked car stands at its own height
  const own = fn => (f, u, v, ...rest) => { const p = f.xz(u, v), keep = B.base; B.at(p.x, p.z); fn(f, u, v, ...rest); B.base = keep; };
  tree = own(tree); conifer = own(conifer); shrub = own(shrub); palm = own(palm); spiky = own(spiky); parasol = own(parasol); parked = own(parked);
  const lift = (f, u, v) => { const p = f.xz(u, v); B.at(p.x, p.z); };       // what is built next stands on the ground at (u, v)

  // ---------- fences, walls and hedges along the street ----------
  const FENCE = {
    wall(g, L, o) { box(B, g, 0, L, -0.3, o.h || 1.5, 0, 0.22, o.col || P.white); box(B, g, 0, L, o.h || 1.5, (o.h || 1.5) + 0.06, -0.04, 0.26, o.cap || C('#e6e3db')); },
    rail(g, L, o) {                                      // low wall with iron railings
      const h0 = o.h0 || 0.55, h1 = o.h || 1.45, col = o.col || P.green, n = Math.max(1, Math.ceil(L / 3.2));
      box(B, g, 0, L, -0.3, h0, 0, 0.22, o.base || P.white);
      for (let k = 0; k <= n; k++) { const u = L * k / n; box(B, g, u - 0.13, u + 0.13, h0, h1 + 0.12, -0.02, 0.24, o.post || o.base || P.white); }
      box(B, g, 0, L, h1 - 0.05, h1, 0.08, 0.14, col); box(B, g, 0, L, h0 + 0.06, h0 + 0.1, 0.08, 0.14, col);
      for (let u = 0.2; u < L; u += 0.22) faceV(g, u - 0.018, u + 0.018, h0, h1, 0.11, col);
    },
    balus(g, L, o) {                                     // tiled base with a white balustrade
      box(B, g, 0, L, -0.3, 0.5, 0, 0.24, C('#8e9296'));
      const n = Math.max(1, Math.ceil(L / 3));
      for (let k = 0; k <= n; k++) { const u = L * k / n; box(B, g, u - 0.14, u + 0.14, 0.5, 1.4, -0.02, 0.26, P.white); }
      for (let u = 0.3; u < L - 0.1; u += 0.34) box(B, g, u - 0.06, u + 0.06, 0.5, 1.14, 0.06, 0.18, P.white);
      box(B, g, 0, L, 1.14, 1.26, 0.02, 0.22, P.white);
    },
    picket(g, L, o) {                                    // low wall with a white metal fence
      box(B, g, 0, L, -0.3, 0.4, 0, 0.22, P.white);
      box(B, g, 0, L, 0.55, 0.6, 0.08, 0.14, P.white); box(B, g, 0, L, 1.15, 1.2, 0.08, 0.14, P.white);
      for (let u = 0.12; u < L; u += 0.2) { faceV(g, u - 0.03, u + 0.03, 0.4, 1.3, 0.11, P.white); B.tri(g.pt(u - 0.05, 1.3, 0.11), g.pt(u + 0.05, 1.3, 0.11), g.pt(u, 1.42, 0.11), P.white); }
    },
    stone(g, L, o) {
      const h = o.h || 1.2;
      box(B, g, 0, L, -0.3, h, 0, 0.3, P.rough);
      for (let u = 0.2; u < L - 0.5; u += 0.5 + rnd() * 0.5) { const y = rnd() * (h - 0.4), w = 0.25 + rnd() * 0.3; faceV(g, u, u + w, y, y + 0.2 + rnd() * 0.15, -0.01, rnd() < 0.5 ? C('#8f8371') : C('#b6a995')); }
    },
    block(g, L, o) {                                     // tall weathered block wall
      const h = o.h || 2.9;
      box(B, g, 0, L, -0.3, h, 0, 0.25, P.block);
      for (let u = 0.3; u < L - 1; u += 1 + rnd() * 1.6) { const y = rnd() * (h - 1); faceV(g, u, u + 0.6 + rnd() * 0.9, y, y + 0.4 + rnd() * 0.8, -0.01, rnd() < 0.5 ? C('#8a8a86') : C('#a8a8a2')); }
    },
    hedge(g, L, o) {
      const h = o.h || 1.8, cols = [C('#2f6e3c'), C('#357a42'), C('#2b6537')];
      for (let u = 0, k = 0; u < L; u += 2, k++) box(B, g, u, Math.min(L, u + 2), 0, h + (k % 3) * 0.12 - 0.1, 0.05, 1.0, cols[k % 3]);
    },
    wire(g, L, o) {                                      // posts and wire around the vegetable gardens
      box(B, g, 0, L, -0.3, 0.18, 0, 0.18, C('#b7b3a8'));
      const n = Math.max(1, Math.ceil(L / 2.6));
      for (let k = 0; k <= n; k++) { const u = L * k / n; box(B, g, u - 0.05, u + 0.05, 0.18, 1.45, 0.04, 0.14, C('#d9d7cf')); }
      for (const y of [0.5, 0.9, 1.3]) box(B, g, 0, L, y, y + 0.025, 0.08, 0.1, C('#8f9396'));
    },
    gate(g, L, o) {                                      // closed gate between two posts
      const h = o.h || 1.6, col = o.col || P.green, pc = o.post || P.white;
      box(B, g, -0.15, 0.15, -0.3, h + 0.2, -0.04, 0.3, pc); box(B, g, L - 0.15, L + 0.15, -0.3, h + 0.2, -0.04, 0.3, pc);
      box(B, g, 0.15, L - 0.15, 0.08, h * (o.solid || 0.45), 0.1, 0.16, col); box(B, g, 0.15, L - 0.15, h - 0.06, h, 0.1, 0.16, col);
      for (let u = 0.3; u < L - 0.2; u += 0.2) faceV(g, u - 0.02, u + 0.02, h * (o.solid || 0.45), h, 0.13, col);
    },
  };
  function fence(side, s0, s1, type, o = {}) {
    const lat = o.lat !== undefined ? o.lat : (side === SW && s1 <= STRIP_END + 0.01 ? STRIP : HALF);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = Math.max(s0, cum[i]), b = Math.min(s1, cum[i + 1]);
      if (b - a < 0.05) continue;
      const n = Math.max(1, Math.ceil((b - a) / 0.5));
      let start = null;
      for (let k = 0; k <= n; k++) {
        const keep = k < n && !insideOther(at(a + (k + 0.5) / n * (b - a), side, lat + 0.12));   // leave junctions open
        if (keep && start === null) start = a + k / n * (b - a);
        if (!keep && start !== null) {
          const sa = start, sb = a + k / n * (b - a), p = at(Math.min(sa, cum[i + 1] - 1e-6), side, lat);
          const pieces = type === 'gate' ? 1 : Math.max(1, Math.ceil((sb - sa) / 3.2)), top = cum[i + 1] - 1e-6;        // short pieces, stepping with the slope
          for (let j = 0; j < pieces; j++) {
            const s0 = sa + (sb - sa) * j / pieces, s1 = sa + (sb - sa) * (j + 1) / pieces, q = at(Math.min(s0, top), side, lat), mid = at(Math.min((s0 + s1) / 2, top), side, lat);
            B.at(mid.x, mid.z);
            FENCE[type](frame(q.x, q.z, q.dx, q.dz, q.nx, q.nz), s1 - s0 + (j === pieces - 1 && sb >= top ? 0.2 : 0), o);
          }
          start = null;
        }
      }
    }
  }

  // =====================================================================================================
  //  SOUTH-WEST SIDE (the home is here)
  // =====================================================================================================
  patch(FS, 2.9, STRIP_END, HALF - 0.05, STRIP, P.cobble, 0.09);                   // cobbled parking strip
  patch(FS, 2, 150, 21, 70, P.dryGrass, 0);                                    // the big field behind the houses
  lift(FS, STRIP_END, 3.7); box(B, FS, STRIP_END - 0.1, STRIP_END + 0.12, -0.3, 1.1, HALF, STRIP + 0.22, P.white);   // end of the strip

  // ---- no. 1: long white house with an upstairs loggia ----
  {
    const f = FS, v0 = 8.75, v1 = 18.25, yE = 5.9;
    lift(f, 20, 13);
    box(B, f, 8, 22, -0.3, yE, v0, v1, P.white); box(B, f, 29, 32, -0.3, yE, v0, v1, P.white); box(B, f, 22, 29, -0.3, yE, v0 + 1.5, v1, P.white);
    box(B, f, 22, 29, 2.78, 2.95, v0, v0 + 1.5, P.white); box(B, f, 22, 29, 5.45, yE, v0, v0 + 1.5, P.white);     // loggia floor and lintel
    for (const u of [22.15, 25.5, 28.85]) { post(f, u, v0 + 0.15, 2.95, 5.45, 0.14, P.white); post(f, u, v0 + 0.15, -0.3, 2.78, 0.14, P.white); }
    rail(f, 22.3, v0 + 0.1, 28.7, v0 + 0.1, 2.95, 3.85, P.white, 'balus');
    win(f, 24.2, 2.98, 1.4, 2.1, v0 + 1.5, { shut: P.shutWhite }); win(f, 24.3, 0, 1.1, 2.15, v0 + 1.5, { pane: P.wood }); win(f, 27.3, 0.9, 1.3, 1.3, v0 + 1.5, { shut: P.shutWhite });
    win(f, 18.8, 3.9, 1.1, 1.2, v0, { grid: 1 }); win(f, 13.5, 3.9, 1.7, 1.25, v0, { shut: P.shutWhite }); win(f, 30.5, 3.9, 1.2, 1.2, v0, { grid: 1 });
    win(f, 18.3, 0.95, 1.4, 1.3, v0, { grid: 1 }); win(f, 13.3, 0.3, 1.6, 2.0, v0, { grid: 1 }); win(f, 30.5, 0.95, 1.3, 1.3, v0, { grid: 1 });
    for (const u of [12, 17, 24, 29]) { win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 }); win(f, u, 1, 1.2, 1.2, v1, { d: 1 }); }
    hip(f, 8, 32, v0, v1, yE, 2.0, P.terra, 0.5, P.frame); chimney(f, 20, v0 + 2.6, yE + 0.9, yE + 2.5);
    lift(f, 5.9, 17); box(B, f, 3.8, 8, -0.3, 2.8, 13.5, 20.5, P.white); hip(f, 3.8, 8, 13.5, 20.5, 2.8, 1.2, P.terraOld, 0.35); chimney(f, 5.5, 17, 3.3, 4.6);   // low wing at the corner
    lift(f, 34.5, 15); box(B, f, 32.5, 36.5, -0.3, 2.7, 11.5, 18.5, P.white); mono(f, 32.3, 36.7, 11.1, 18.8, 2.75, 3.4, 'v', P.terraOld);                     // annex behind the green gate
    win(f, 34.5, 0, 2.4, 2.1, 11.5, { shut: P.greenDark, m: 0.06 });
    patch(f, 3.2, 32.3, STRIP + 0.22, v0, P.lawn); patch(f, 32.3, 36.7, STRIP + 0.22, 11.5, P.concrete);
    conifer(f, 10.2, 6.6, 3.2, 0.9); shrub(f, 15.5, 6.4, 0.6, C('#c0563f')); shrub(f, 20.8, 6.5, 0.7); shrub(f, 27, 6.3, 0.55); shrub(f, 5.5, 7, 0.8); conifer(f, 6.2, 10, 2.6, 0.8);
    foot(f, 8, 32, v0, v1); foot(f, 3.8, 8, 13.5, 20.5); foot(f, 32.5, 36.5, 11.5, 18.5);
  }
  // ---- no. 2: white house with the garage door and the palm tree ----
  {
    const f = FS, v0 = 7.95, v1 = 17.9, yE = 5.9;
    lift(f, 48.5, 13);
    box(B, f, 40, 57, -0.3, yE, v0, v1, P.white);
    box(B, f, 40, 46.5, 2.78, 2.95, v0 - 1.2, v0, P.white); rail(f, 40.1, v0 - 1.1, 46.4, v0 - 1.1, 2.95, 3.85, P.white, 'balus'); rail(f, 40.1, v0 - 1.1, 40.1, v0, 2.95, 3.85, P.white, 'balus');
    for (const u of [40.2, 46.3]) post(f, u, v0 - 1.05, -0.3, 2.78, 0.13, C('#a8483a'));
    win(f, 43.2, 2.98, 1.3, 2.1, v0, { shut: P.shutGrey }); win(f, 42.2, 0, 1.0, 2.15, v0, { pane: P.wood }); win(f, 44.9, 0.95, 1.2, 1.25, v0, { shut: P.shutGrey });
    for (const u of [49, 52, 55]) win(f, u, 3.9, 1.2, 1.15, v0, { shut: u === 49 ? P.glass : P.shutGrey, frame: P.frame });
    win(f, 52.3, 0, 3.0, 2.3, v0, { shut: C('#cfc6b4'), m: 0.07 }); win(f, 55.7, 1.3, 1.1, 0.9, v0, { shut: P.shutGrey });
    winU(f, 57, 11, 3.9, 1.0, 1.1, 1); winU(f, 57, 14.5, 1.2, 1.0, 1.1, 1);
    for (const u of [43, 48, 53]) win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 });
    gable(f, 40, 57, v0, v1, yE, 2.1, P.terraOld, P.white, 0.45, P.green); chimney(f, 45, 11, yE + 1.2, yE + 2.7);
    patch(f, 50.2, 54.5, STRIP + 0.22, v0, P.concrete); patch(f, 40, 50.2, STRIP + 0.22, v0, P.soil, 0.035); patch(f, 54.5, 57.3, STRIP + 0.22, v0, P.gravel, 0.035);
    palm(f, 49.3, 6.2, 7.2); shrub(f, 46.5, 6.2, 0.6); shrub(f, 43, 6.3, 0.5, C('#3f8a4a'));
    foot(f, 40, 57, v0, v1);
    // garden between no. 2 and no. 3
    patch(f, 57.3, 65.8, STRIP + 0.3, 19, P.soil, 0.035);
    spiky(f, 59.5, 7.2, 1.9); spiky(f, 62.3, 6.6, 2.2); spiky(f, 64.2, 8.2, 1.7); spiky(f, 60.8, 10.5, 1.6); shrub(f, 63.5, 11.5, 0.8); tree(f, 60.5, 15, 4.2, 1.6, C('#4a8f3f'));
    lift(f, 60.7, 20.7); box(B, f, 59, 62.5, -0.3, 2.3, 19.2, 22.2, C('#e9e4d8')); mono(f, 58.8, 62.7, 19, 22.4, 2.7, 2.35, 'v', P.terraOld);
  }
  // ---- no. 3: THE HOME ----
  const home = {};
  {
    const f = FS, v0 = 8.8, v1 = 17.9, yE = 5.9, dark = P.charcoal, soffit = C('#2a2d31'), gS = 82.7;
    lift(f, 72, 12);
    box(B, f, 70.5, 77.5, -0.3, yE, v0, v1, P.white);                                   // white two-storey part
    box(B, f, 66, 66.3, -0.3, yE, v0, v1, P.white);                                     // white fin framing the dark part
    box(B, f, 66.3, 70.5, -0.3, yE, v0 + 1.2, v1, dark);                                // dark recessed part
    box(B, f, 66.3, 70.5, 2.78, 2.95, v0 - 0.15, v0 + 1.2, soffit);                     // balcony
    rail(f, 66.3, v0 - 0.15, 70.5, v0 - 0.15, 2.95, 3.95, null, 'glass');
    box(B, f, 65.8, 70.7, yE - 0.14, yE + 0.02, v0 - 0.55, v0 + 1.2, soffit);           // dark canopy over the balcony
    win(f, 68.4, 2.98, 2.7, 2.3, v0 + 1.2, { frame: P.black, m: 0.07 }); faceV(f, 68.37, 68.43, 2.98, 5.28, v0 + 1.08, P.black);
    win(f, 68.7, 0.05, 2.5, 2.25, v0 + 1.2, { frame: P.black, m: 0.07, shut: C('#3d4248') }); win(f, 66.9, 0.05, 0.9, 2.15, v0 + 1.2, { pane: C('#22262a'), m: 0.05, frame: P.black });
    patch(f, 66.3, 70.5, v0 - 2.2, v0 + 1.2, C('#c9c3b6'), 0.06); parasol(f, 68.3, v0 - 0.7);
    win(f, 72.3, 3.9, 1.3, 1.25, v0, { frame: P.frameGrey }); win(f, 75.8, 3.75, 1.5, 1.4, v0, { frame: P.frameGrey, half: P.shutWhite });
    win(f, 71.3, 0, 1.0, 2.15, v0, { pane: C('#5a2a22'), m: 0.06 }); win(f, 74.9, 1.0, 1.7, 1.2, v0, { frame: P.frameGrey });
    faceV(f, 70.5, 77.5, yE - 0.5, yE - 0.42, v0 - 0.02, C('#e7e5de'));                  // plaster band under the eave
    box(B, f, 77.5, 80.4, -0.3, 2.7, v0 + 1.2, v1, P.white); mono(f, 77.4, 80.75, v0 + 0.8, v1 + 0.2, 3.45, 2.7, 'u', P.terra);   // low wing next to the driveway
    win(f, 78.9, 0.1, 1.1, 2.1, v0 + 1.2, { grid: 1 });
    winU(f, 66, 12, 3.9, 1.1, 1.2, -1); winU(f, 66, 14.5, 1.0, 1.1, 1.2, -1); winU(f, 77.5, 13, 3.9, 1.1, 1.2, 1);
    for (const u of [68.5, 72.5, 75.5]) win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 });
    win(f, 69, 0.9, 1.4, 1.3, v1, { d: 1 }); win(f, 74, 0.1, 1.5, 2.1, v1, { d: 1 });
    gable(f, 66, 77.5, v0, v1, yE, 1.9, P.terra, P.white, 0.5, C('#8a4630')); chimney(f, 76.2, v0 + 2.8, yE + 0.9, yE + 2.5);
    box(B, f, 67, 73, -0.3, 2.5, v1, v1 + 2.4, P.white); mono(f, 66.8, 73.2, v1, v1 + 2.7, 3.0, 2.5, 'v', P.terra);              // small rear extension
    // garage with the blue metal roof, at the end of the driveway
    const g0 = 80.6, g1 = 85, gv0 = 14.2, gv1 = 19.5;
    lift(f, 82.8, 16.8); box(B, f, g0, g0 + 0.15, -0.3, 2.6, gv0, gv1, P.white); box(B, f, g1 - 0.15, g1, -0.3, 2.6, gv0, gv1, P.white); box(B, f, g0, g1, -0.3, 2.6, gv1 - 0.15, gv1, P.white);
    box(B, f, g0, g1, 2.3, 2.6, gv0, gv0 + 0.15, P.white);
    mono(f, g0 - 0.25, g1 + 0.2, gv0 - 0.5, gv1 + 0.3, 2.95, 2.62, 'v', P.sheetBlue);
    lift(f, 82.8, 11.3); for (const [u, v] of [[80.65, 9.3], [84.85, 9.3], [80.65, 13.4], [84.85, 13.4]]) post(f, u, v, 0, 2.5, 0.07, P.white);           // pergola over the driveway
    for (const v of [9.3, 13.4]) box(B, f, 80.5, 85, 2.5, 2.62, v - 0.06, v + 0.06, P.white);
    for (let u = 80.9; u < 85; u += 0.7) box(B, f, u - 0.04, u + 0.04, 2.62, 2.7, 9.1, 13.6, P.white);
    patch(f, 80.4, 85, HALF - 0.05, gv1, P.concrete, 0.1);                               // driveway
    lift(f, 78, 5); box(B, f, 75.9, 80.3, 0.12, 1.5, STRIP + 0.3, STRIP + 0.36, C('#7d8288'));           // the grey sliding gate, open
    patch(f, 66.3, 71.1, STRIP + 0.22, v0 - 2.2, P.lawn); patch(f, 72.5, 80.4, STRIP + 0.22, v0, P.lawn); patch(f, 70.5, 71.1, v0 - 2.2, v0, P.lawn);
    patch(f, 71.1, 72.5, STRIP, v0, P.concrete, 0.05);                                   // path to the front door
    lift(f, 69, 4.75); box(B, f, 68.9, 69.5, 0.75, 1.1, STRIP - 0.03, STRIP, C('#3c4046')); faceV(f, 68.2, 68.7, 0.95, 1.35, STRIP - 0.02, C('#2b4a7a'));   // letterbox and the number 3
    lift(f, 65.6, 12); box(B, f, 65.5, 65.8, -0.3, 1.3, STRIP, v1 + 3, P.rough);                            // stone wall on the garden side
    spiky(f, 79.2, 6.2, 1.5); shrub(f, 73.6, 8.2, 0.45); shrub(f, 77, 8.3, 0.4, C('#c0563f'));
    foot(f, 66, 80.4, v0, v1, '#e2542d'); foot(f, g0, g1, gv0, gv1, '#e2542d');
    // where you can walk and drive off the road
    const seg = (u0, a, u1, b, w) => { const p = f.xz(u0, a), q = f.xz(u1, b); addSeg({ ax: p.x, az: p.z, bx: q.x, bz: q.z, w, name: '', type: 'driveway', noWall: true, lav: true }); };
    seg(gS, 0, gS, 17.45, 3.9);            // road -> gate -> pergola -> garage
    seg(80.2, 2.6, 85.2, 2.6, 4.0);        // room to turn in and out
    seg(71.8, 3.75, 71.8, 8.1, 1.6);       // path to the front door
    seg(67.6, 6.9, gS, 6.9, 3.4);          // front lawn and terrace
    seg(5.6, 2.75, STRIP_END - 2.1, 2.75, 4.0);   // the cobbled strip along the whole street (wide enough for the car to pull onto it)
    segs[segs.length - 1].type = 'strip';
    const n = at(gS, SW, 0), c = f.xz(73.2, 13.3), gar = f.xz(gS, 16.8);
    Object.assign(home, { spawn: { x: n.x, z: n.z }, ax: n.nx, az: n.nz, cx: c.x, cz: c.z, garage: gar, bikeSpot: f.xz(gS + 1.45, 16.6) });
  }
  // ---- no. 4: white house with green shutters ----
  {
    const f = FS, v0 = 9.15, v1 = 17.35, yE = 5.9;
    lift(f, 96, 13);
    box(B, f, 93.6, 103, -0.3, yE, v0, v1, P.white); box(B, f, 88.7, 93.6, -0.3, yE, v0 + 1.3, v1, P.white);
    box(B, f, 88.7, 93.6, 2.78, 2.95, v0, v0 + 1.3, P.white); box(B, f, 88.7, 93.6, 5.5, yE, v0, v0 + 1.3, P.white);
    post(f, 88.85, v0 + 0.15, -0.3, 2.78, 0.15, P.white); post(f, 88.85, v0 + 0.15, 2.95, 5.5, 0.15, P.white);
    rail(f, 88.8, v0 + 0.05, 93.6, v0 + 0.05, 2.95, 3.9, P.greenDark, 'bars');
    win(f, 91.3, 2.98, 2.0, 2.2, v0 + 1.3, { shut: P.shutGreen }); win(f, 91.5, 0, 2.4, 2.2, v0 + 1.3, { shut: P.shutGreen, m: 0.06 });
    win(f, 101, 3.9, 1.3, 1.2, v0, { shut: P.shutGreen, frame: P.stone, m: 0.16 }); win(f, 97.3, 3.9, 1.3, 1.2, v0, { grid: 1, frame: P.stone, m: 0.16 });
    win(f, 101.2, 0.2, 1.5, 2.1, v0, { grid: 1 }); win(f, 98.1, 1.0, 1.3, 1.2, v0, { grid: 1, frame: P.stone, m: 0.16 }); win(f, 95, 0, 1.1, 2.15, v0, { pane: P.wood, frame: P.stone });
    for (const u of [91, 96, 100.5]) { win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 }); win(f, u, 1, 1.2, 1.2, v1, { d: 1 }); }
    hip(f, 88.7, 103, v0, v1, yE, 1.9, P.terra, 0.5, P.green); chimney(f, 97.5, v0 + 2.6, yE + 0.9, yE + 2.5);
    lift(f, 87, 12.5); box(B, f, 85.2, 88.7, -0.3, 2.6, 9.6, 15.5, P.white); box(B, f, 85.05, 88.85, 2.6, 2.75, 9.4, 15.7, C('#8a6a55')); win(f, 86.95, 0, 2.6, 2.2, 9.6, { shut: P.shutGreen, m: 0.06 });
    lift(f, 105.5, 13); box(B, f, 103, 108, -0.3, 2.7, 10, 16.5, P.white); mono(f, 102.9, 108.3, 9.6, 16.8, 2.75, 3.4, 'v', P.terra); win(f, 105.5, 0, 2.6, 2.2, 10, { shut: P.greenDark, m: 0.06 });
    patch(f, 85, 108, STRIP + 0.22, v0 + 1, P.gravel, 0.035);
    shrub(f, 93, 6.4, 0.5, C('#c0563f')); shrub(f, 99.5, 6.2, 0.55); shrub(f, 104, 6.6, 0.6, C('#5c9a4a')); conifer(f, 109.8, 7, 3.4, 1.0); tree(f, 110.2, 11, 5, 1.8);
    foot(f, 88.7, 103, v0, v1); foot(f, 85.2, 88.7, 9.6, 15.5); foot(f, 103, 108, 10, 16.5);
  }
  // ---- no. 61: long house with the veranda and the big tree ----
  {
    const f = FS, v0 = 10.8, v1 = 18.6, yE = 5.9;
    lift(f, 122.7, 14);
    box(B, f, 112, 133.5, -0.3, yE, v0, v1, P.white);
    mono(f, 111.6, 133.9, 8.4, v0, 2.7, 3.3, 'v', P.terra);
    for (const u of [112.2, 116.5, 120.8, 125.1, 129.4, 133.3]) post(f, u, 8.75, -0.3, 2.72, 0.13, P.white);
    for (const u of [115, 127, 131]) win(f, u, 3.95, 1.2, 1.1, v0, { shut: u === 115 ? P.shutGreen : P.glass });
    win(f, 121, 3.95, 0.9, 1.1, v0);
    win(f, 114.3, 0, 2.4, 2.2, v0, { shut: P.shutGreen, m: 0.06 }); win(f, 117.5, 0.95, 1.3, 1.25, v0); win(f, 122.5, 0, 1.0, 2.15, v0, { pane: C('#e9e7e1') });
    win(f, 124.6, 0.2, 1.2, 2.0, v0, { grid: 1 }); win(f, 129.5, 0.95, 1.4, 1.25, v0, { shut: P.shutGreen });
    for (const u of [115, 121, 127, 131]) win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 });
    hip(f, 112, 133.5, v0, v1, yE, 2.0, P.terra, 0.5, P.frame); chimney(f, 117.2, 13, yE + 1, yE + 3); chimney(f, 118.8, 13, yE + 1, yE + 3);
    patch(f, 112, 133.5, STRIP + 0.22, v0, C('#8fb86a'));
    tree(f, 124, 6.6, 7.2, 2.4, C('#5aa548')); conifer(f, 118.3, 6.9, 4.4, 1.0, C('#3f8f45')); shrub(f, 129, 6.4, 0.75, C('#e8cfd6')); shrub(f, 131.3, 6.6, 0.7, C('#d7c9cf')); shrub(f, 114.5, 6.5, 0.8); shrub(f, 121, 6.3, 0.45, C('#c0563f'));
    foot(f, 112, 133.5, 8.4, v1);
    // open garage with two cars
    lift(f, 140, 12); box(B, f, 136.5, 136.7, -0.3, 2.5, 9, 15.5, P.white); box(B, f, 143.3, 143.5, -0.3, 2.5, 9, 15.5, P.white); box(B, f, 136.5, 143.5, -0.3, 2.5, 15.3, 15.5, P.white);
    box(B, f, 136.3, 143.7, 2.5, 2.7, 8.7, 15.7, C('#d8d3c8')); box(B, f, 136.3, 143.7, 2.7, 2.78, 8.6, 9.0, P.terra);
    patch(f, 136, 144, STRIP + 0.22, 15.5, P.concrete, 0.05);
    parked(f, 138.4, 12.2, true, '#2b3140'); parked(f, 141.5, 12.4, true, '#6f757c');
    foot(f, 136.5, 143.5, 9, 15.5);
    // vegetable gardens up to the bend
    patch(f, 144.5, 158, 5, 24, P.soil, 0.035);
    for (let u = 146; u < 157; u += 2.2) patch(f, u, u + 0.9, 6, 20, C('#6f9a4a'), 0.07);
    tree(f, 148, 22, 4, 1.5); tree(f, 154, 16, 3.6, 1.4, C('#6bb84f')); tree(f, 151, 9, 3.4, 1.3);
  }
  // parked cars on the cobbles
  parked(FS, 14, 3.75, false, '#f1f1ee'); parked(FS, 62.8, 3.75, false, '#2b3350'); parked(FS, 75.4, 3.78, false, '#b9bec4', true); parked(FS, 91.5, 3.75, false, '#e9e9e6');

  // boundary of each property on the SW side
  fence(SW, 2.8, 14.6, 'rail'); fence(SW, 14.6, 16, 'gate', { h: 1.4 }); fence(SW, 16, 32.3, 'rail');
  fence(SW, 32.3, 36.7, 'gate', { h: 2.0, post: P.rough, col: P.green, solid: 0.5 });
  fence(SW, 36.7, 44, 'rail', { base: P.rough, post: P.rough }); fence(SW, 44, 50.4, 'balus'); fence(SW, 50.4, 54.3, 'gate', { h: 1.5, col: P.green });
  fence(SW, 54.3, 57.5, 'balus'); fence(SW, 57.5, 65.6, 'stone', { h: 1.25 });
  fence(SW, 65.6, 71.1, 'wall'); fence(SW, 72.5, 80.4, 'wall');                      // the home: white wall, open at the path and at the driveway
  fence(SW, 85, 88.7, 'wall', { h: 1.6 }); fence(SW, 88.7, 95.2, 'rail'); fence(SW, 95.2, 96.6, 'gate', { h: 1.4 }); fence(SW, 96.6, 108, 'rail');
  fence(SW, 108, 112, 'hedge', { h: 1.7 }); fence(SW, 112, 120.4, 'rail'); fence(SW, 120.4, 121.8, 'gate', { h: 1.4 }); fence(SW, 121.8, 133.5, 'rail');
  fence(SW, 133.5, 137, 'wall', { h: 1.3 }); fence(SW, 137, 143.2, 'gate', { h: 1.5, col: C('#5d6166'), solid: 0.5 }); fence(SW, 143.2, STRIP_END, 'wall', { h: 1.0 });

  // =====================================================================================================
  //  NORTH-EAST SIDE
  // =====================================================================================================
  // ---- corner house with the outside staircase, and its garage across the yard ----
  {
    const f = FN, v0 = 6.9, v1 = 18.5, yE = 5.9, fascia = C('#5b4636');
    lift(f, 21, 12.5);
    box(B, f, 15, 27, -0.3, yE, v0, v1, P.white);
    for (let k = 0; k < 10; k++) box(B, f, 15.2 + k * 0.38, 19.0, -0.3, 0.29 * (k + 1), v0 - 1.3, v0, P.white);      // staircase
    box(B, f, 19, 21.2, 2.75, 2.92, v0 - 1.3, v0, P.white);
    B.quad(f.pt(15.2, 1.17, v0 - 1.3), f.pt(19, 3.79, v0 - 1.3), f.pt(19, 3.86, v0 - 1.3), f.pt(15.2, 1.24, v0 - 1.3), P.black);                 // handrail up the stairs
    for (let k = 0; k < 10; k++) { const u = 15.39 + k * 0.38, y = 0.29 * (k + 1); faceV(f, u - 0.02, u + 0.02, y, y + 0.95, v0 - 1.3, P.black); }
    rail(f, 19, v0 - 1.3, 21.2, v0 - 1.3, 2.92, 3.85, P.black); rail(f, 21.2, v0 - 1.3, 21.2, v0, 2.92, 3.85, P.black);
    win(f, 20.1, 2.95, 1.0, 2.1, v0, { pane: P.wood }); win(f, 17, 3.9, 0.9, 1.1, v0);
    box(B, f, 21.6, 27, 2.78, 2.95, v0 - 1.3, v0, P.white); rail(f, 21.6, v0 - 1.25, 27, v0 - 1.25, 2.95, 3.9, P.black); rail(f, 27, v0 - 1.25, 27, v0, 2.95, 3.9, P.black);
    win(f, 24.3, 2.98, 1.9, 2.1, v0, { frame: P.woodDark }); win(f, 24.3, 0, 2.7, 2.2, v0, { shut: P.woodDark, m: 0.06 }); win(f, 17.3, 1.0, 1.1, 1.1, v0);
    for (const u of [18, 23]) { win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 }); win(f, u, 1, 1.2, 1.2, v1, { d: 1 }); }
    winU(f, 15, 11, 3.9, 1.1, 1.2, -1); winU(f, 15, 14.5, 1, 1.1, 1.2, -1);
    hip(f, 15, 27, v0, v1, yE, 2.0, P.terraDark, 0.5, fascia); chimney(f, 22, 13, yE + 1, yE + 2.6);
    lift(f, 30, 14); box(B, f, 27, 33.5, -0.3, yE, 9.5, 18.5, P.white); hip(f, 27, 33.5, 9.5, 18.5, yE, 1.7, P.terraDark, 0.4, fascia); win(f, 30.2, 3.9, 1.2, 1.2, 9.5); win(f, 30.2, 1, 1.2, 1.2, 9.5);
    lift(f, 7, 20); box(B, f, 3.6, 10.6, -0.3, 2.7, 16.5, 23.5, P.white); hip(f, 3.6, 10.6, 16.5, 23.5, 2.7, 1.5, P.terra, 0.4); win(f, 7.1, 0, 3.6, 2.2, 16.5, { shut: P.greenDark, m: 0.07 });
    patch(f, 3.2, 14.8, HALF + 0.25, 16.5, C('#8f8f8c'), 0.05);
    parked(f, 11.6, 9.2, false, '#b9bec4');
    tree(f, 29, 5.2, 6.5, 2.3, C('#3f8a42')); tree(f, 32, 6.6, 7, 2.5); tree(f, 34.8, 4.8, 5.5, 2.0, C('#458a3c')); conifer(f, 30.5, 8, 6, 1.5); tree(f, 36, 8, 6, 2.2);
    foot(f, 15, 27, v0, v1); foot(f, 27, 33.5, 9.5, 18.5); foot(f, 3.6, 10.6, 16.5, 23.5);
  }
  // ---- the house with the porch on columns and the garage on its left ----
  {
    const f = FN, v0 = 9, v1 = 18.4, yE = 6.0, fascia = C('#2f5a44');
    lift(f, 40.7, 12);
    box(B, f, 38, 43.5, -0.3, 2.7, v0, 15.5, P.white); mono(f, 37.7, 43.6, v0 - 0.5, 15.8, 2.75, 3.45, 'v', P.terra); win(f, 40.75, 0, 3.4, 2.2, v0, { shut: C('#eceae4'), m: 0.07 });
    lift(f, 48, 13.5); box(B, f, 43.5, 52.5, -0.3, yE, v0, v1, P.white);
    win(f, 46.4, 3.55, 1.3, 1.7, v0, { shut: P.shutGreen, frame: P.stone, m: 0.18 }); box(B, f, 45.4, 47.4, 2.85, 2.95, v0 - 0.5, v0, P.stone); rail(f, 45.4, v0 - 0.48, 47.4, v0 - 0.48, 2.95, 3.85, P.black);
    win(f, 46.4, 1.0, 1.5, 1.25, v0, { frame: P.stone, m: 0.18, half: P.shutGreen }); win(f, 50.3, 3.9, 1.0, 1.2, v0, { frame: P.stone, m: 0.18 });
    mono(f, 48.6, 52.9, v0 - 2.3, v0, 2.75, 3.25, 'v', P.terra); post(f, 48.9, v0 - 2.0, -0.3, 2.75, 0.13, P.white); post(f, 52.5, v0 - 2.0, -0.3, 2.75, 0.13, P.white);
    win(f, 50.7, 0, 1.0, 2.15, v0, { pane: C('#eceae4'), frame: P.stone, m: 0.14, grid: 1 });
    for (const u of [46, 50]) { win(f, u, 3.9, 1.2, 1.2, v1, { d: 1 }); win(f, u, 1, 1.2, 1.2, v1, { d: 1 }); }
    hip(f, 43.5, 52.5, v0, v1, yE, 2.0, P.terra, 0.5, fascia); chimney(f, 44.8, 12, yE + 0.9, yE + 2.5);
    lift(f, 56.7, 15); box(B, f, 52.5, 61, -0.3, 5.9, 11, 19.5, P.white); hip(f, 52.5, 61, 11, 19.5, 5.9, 1.8, P.terra, 0.45, fascia);
    for (const u of [55, 58.6]) { win(f, u, 3.9, 1.2, 1.2, 11, { frame: P.stone, m: 0.16 }); win(f, u, 1, 1.2, 1.2, 11, { frame: P.stone, m: 0.16 }); }
    patch(f, 37, 43.6, HALF + 0.25, v0, C('#8f8f8c'), 0.05); patch(f, 43.6, 61, HALF + 0.25, 11, C('#a9a297'), 0.035);
    shrub(f, 54, 5, 0.7, C('#c0563f')); shrub(f, 57.5, 5.5, 0.8); shrub(f, 45, 5, 0.5); conifer(f, 59.5, 7.5, 3, 0.9);
    foot(f, 38, 43.5, v0, 15.5); foot(f, 43.5, 52.5, v0, v1); foot(f, 52.5, 61, 11, 19.5);
    // trees, the little shed and the empty plot behind the hedge
    tree(f, 62.5, 5, 6.5, 2.4); tree(f, 65.5, 7.5, 7.5, 2.8, C('#3f8a42')); tree(f, 68.6, 5.2, 6, 2.2); tree(f, 71, 8.5, 6.8, 2.5, C('#5fae4c')); shrub(f, 64, 4.2, 0.9); shrub(f, 70, 4.3, 1.0, C('#458a3c'));
    lift(f, 67.7, 17); box(B, f, 66, 69.5, -0.3, 2.4, 14, 20, C('#e4e1d8')); mono(f, 65.8, 69.7, 13.8, 20.2, 2.75, 2.45, 'u', P.sheetBlue); foot(f, 66, 69.5, 14, 20);
    patch(f, 72.5, 84, HALF + 1.2, 24, P.wildGrass, 0.035); tree(f, 77, 13, 5.5, 2.1); shrub(f, 80, 9, 1.1, C('#7d9a55')); shrub(f, 75, 18, 1.2, C('#86a35a'));
  }
  // ---- white house with the dark roof behind the tall hedge ----
  {
    const f = FN, v0 = 7.4, v1 = 17.4, yE = 4.7;
    lift(f, 90.7, 12);
    box(B, f, 84, 97.5, -0.3, yE, v0, v1, P.white); box(B, f, 84, 97.5, -0.3, 2.5, 6.0, v0, P.white);
    mono(f, 83.6, 97.9, 5.6, v0, 2.55, 3.0, 'v', P.darkRoof);
    win(f, 87.5, 0.9, 1.4, 1.2, 6.0, { shut: P.shutWood }); win(f, 91.5, 0.9, 1.4, 1.2, 6.0, { shut: P.shutWood }); win(f, 95.2, 0.2, 1.3, 2.0, 6.0, { grid: 1 });
    win(f, 89.5, 3.3, 1.0, 0.8, v0); win(f, 94, 3.3, 1.0, 0.8, v0);
    for (const u of [88, 93]) win(f, u, 1.2, 1.2, 1.2, v1, { d: 1 });
    gable(f, 84, 97.5, v0, v1, yE, 1.4, P.darkRoof, P.white, 0.45); chimney(f, 93.5, 11, yE + 0.6, yE + 2.0);
    box(B, f, 86, 86.06, yE, yE + 3.2, 10, 10.06, C('#70757a')); box(B, f, 85.4, 86.7, yE + 2.9, yE + 2.94, 10, 10.05, C('#70757a'));   // tv aerial
    patch(f, 84, 98, HALF + 1.2, v0, C('#8fb86a')); tree(f, 82.2, 6.2, 5.2, 1.9); shrub(f, 90, 4.6, 0.8); shrub(f, 96.5, 4.8, 0.7, C('#c0563f'));
    foot(f, 84, 97.5, 6, v1);
  }
  // ---- grey workshop, the red-roofed shelter and no. 60 ----
  {
    const f = FN;
    lift(f, 106.5, 16.5); box(B, f, 99.5, 113.5, -0.3, 4.2, 11.5, 21.5, C('#bdb9b0')); gable(f, 99.5, 113.5, 11.5, 21.5, 4.2, 1.3, P.greyRoof, C('#bdb9b0'), 0.3); win(f, 104, 0, 3, 3, 11.5, { shut: C('#8b8f93'), m: 0.06 });
    foot(f, 99.5, 113.5, 11.5, 21.5);
    lift(f, 109.5, 7); for (const [u, v] of [[105.2, 4.6], [113.8, 4.6], [105.2, 9.2], [113.8, 9.2]]) post(f, u, v, -0.3, 2.6, 0.11, P.white);
    mono(f, 104.9, 114.1, 4.2, 9.6, 2.62, 2.95, 'v', P.sheetRed); patch(f, 104.5, 114.5, HALF + 0.25, 11.5, C('#8f8f8c'), 0.05);
    tree(f, 101, 5.5, 5.5, 2.0); shrub(f, 103, 4.5, 0.9);
    const v0 = 6.4, v1 = 16.8, yE = 3.7;
    lift(f, 123, 11.5); box(B, f, 115.5, 131, -0.3, 0.45, v0 - 0.05, v1 + 0.05, C('#b9b4a8')); box(B, f, 115.5, 131, 0.45, yE, v0, v1, P.white);
    win(f, 119.2, 1.3, 1.9, 1.4, v0); win(f, 124, 1.3, 1.4, 1.4, v0); win(f, 127.6, 0.5, 1.0, 2.1, v0, { pane: C('#d9d6cf') }); win(f, 129.6, 1.5, 0.9, 1.1, v0);
    for (const u of [119, 126]) win(f, u, 1.4, 1.3, 1.2, v1, { d: 1 });
    gable(f, 115.5, 131, v0, v1, yE, 1.5, P.darkRoof, P.white, 0.5); chimney(f, 128.4, 10.4, yE + 0.8, yE + 2.1);
    const ry = v => yE + (v - v0) / ((v1 - v0) / 2) * 1.5 + 0.06;                                                                    // height of the roof at v
    B.quad(f.pt(121.6, ry(7.6), 7.6), f.pt(124, ry(7.6), 7.6), f.pt(124, ry(9.2), 9.2), f.pt(121.6, ry(9.2), 9.2), C('#1f3a5c'));      // solar panel
    post(f, 126.3, 9.8, ry(9.8), ry(9.8) + 0.8, 0.04, C('#70757a')); addGeo(ICO, f.xz(126.3, 9.8).x, ry(9.8) + 0.95, f.xz(126.3, 9.8).z, 0.38, 0.38, 0.12, C('#d7d9db'));
    patch(f, 115, 131.5, HALF + 0.25, v0, C('#8fb86a')); shrub(f, 117.5, 4.6, 0.9, C('#b84a4a')); spiky(f, 121.5, 4.7, 1.3); shrub(f, 125.5, 4.5, 1.1, C('#3f8a42')); shrub(f, 129.5, 4.6, 0.8, C('#c0563f'));
    foot(f, 115.5, 131, v0, v1);
    tree(f, 133, 5.6, 8.5, 3.0, C('#4a9440')); tree(f, 136.5, 8.5, 9, 3.2, C('#5fae4c')); tree(f, 143.5, 5.8, 8, 2.8, C('#458a3c')); tree(f, 146.2, 9, 7, 2.4);
    lift(f, 140, 16); box(B, f, 137, 143.5, -0.3, 2.5, 13, 19, P.white); mono(f, 136.8, 143.7, 12.7, 19.3, 2.9, 2.55, 'v', P.greyRoof); win(f, 140.2, 0, 2.2, 2.1, 13, { shut: C('#2a2e33'), m: 0.06 }); foot(f, 137, 143.5, 13, 19);
    patch(f, 137, 141, HALF + 0.25, 13, C('#c6c0b3'), 0.05);
  }
  // ---- no. 100: white house with the roof terrace, at the bend ----
  {
    const f = FN, v0 = 6.2, v1 = 15.2, yE = 5.8;
    lift(f, 153.5, 10.5);
    box(B, f, 148, 159.3, -0.3, yE, v0, v1, P.white);
    box(B, f, 153.6, 159.3, -0.3, 2.9, 4.1, v0, P.white); box(B, f, 153.5, 159.4, 2.9, 3.0, 4.0, v0, C('#3a3d41'));
    rail(f, 153.6, 4.1, 159.3, 4.1, 3.0, 3.9, P.black); rail(f, 153.6, 4.1, 153.6, v0, 3.0, 3.9, P.black); rail(f, 159.3, 4.1, 159.3, v0, 3.0, 3.9, P.black);
    for (const u of [154.4, 156.5, 158.6]) { box(B, f, u - 0.22, u + 0.22, 3.0, 3.35, 4.2, 4.6, C('#b5653f')); const q = f.xz(u, 4.4); addGeo(ICO, q.x, 3.6, q.z, 0.32, 0.3, 0.32, C('#d86a8a')); }
    win(f, 156.4, 3.02, 1.7, 2.1, v0, { frame: P.black, m: 0.06 }); win(f, 156.4, 1.0, 1.6, 1.2, 4.1, { shut: P.shutYellow });
    mono(f, 147.7, 153.6, 4.5, v0, 2.55, 2.95, 'v', P.darkRoof); post(f, 148.1, 4.8, -0.3, 2.55, 0.11, P.white); post(f, 153.3, 4.8, -0.3, 2.55, 0.11, P.white);
    win(f, 149.6, 1.0, 1.2, 1.2, v0, { shut: P.shutYellow }); win(f, 151.8, 1.0, 1.2, 1.2, v0, { shut: P.shutYellow }); win(f, 150.5, 3.9, 1.2, 1.1, v0);
    winU(f, 159.3, 10.5, 3.9, 1.2, 1.2, 1); winU(f, 159.3, 10.5, 1, 1.2, 1.2, 1);
    hip(f, 148, 159.3, v0, v1, yE, 1.6, P.darkRoof, 0.45); chimney(f, 150, 10, yE + 0.8, yE + 2.2);
    patch(f, 147, 159.4, HALF + 0.25, v0, P.lawn); shrub(f, 150.5, 3.7, 0.5, C('#d05a5a')); tree(f, 147.3, 13, 5, 1.8);
    foot(f, 148, 159.3, 4.1, v1);
  }
  // boundary of each property on the NE side
  fence(NE, 2.8, 8, 'rail', { col: P.greenDark }); fence(NE, 8, 12, 'gate', { h: 1.5, col: P.black, solid: 0.15 }); fence(NE, 12, 33, 'rail', { col: P.greenDark });
  fence(NE, 33, 37, 'rail', { base: P.rough, post: P.rough, col: P.greenDark }); fence(NE, 37, 41, 'gate', { h: 1.5, col: C('#8d9196'), solid: 0.6 }); fence(NE, 41, 61, 'picket');
  fence(NE, 61, 73, 'stone', { h: 0.9 }); fence(NE, 73, 104.5, 'hedge', { h: 1.9 });
  fence(NE, 104.5, 108.5, 'gate', { h: 1.4, col: P.black, solid: 0.1 }); fence(NE, 108.5, 131.5, 'rail', { col: P.black });
  fence(NE, 131.5, 137, 'wall', { h: 1.2 }); fence(NE, 137, 141, 'gate', { h: 1.7, col: C('#23262b'), solid: 0.9 }); fence(NE, 141, 159.6, 'rail', { col: P.black });

  // =====================================================================================================
  //  THE EAST PART OF THE STREET (after the bend)
  // =====================================================================================================
  // north side
  {
    const f = lot(166, NE);                                // garden of no. 100, inside the bend
    patch(f, -6, 14, HALF + 0.25, 14, P.lawn); tree(f, -2, 7, 8, 3.0, C('#4a9440')); tree(f, 4.5, 9.5, 8.5, 3.1, C('#5fae4c')); tree(f, 10, 6, 7.5, 2.7); shrub(f, 1, 4.3, 0.8, C('#d05a5a')); shrub(f, 7, 4.5, 0.7);
    const o = lot(181, NE);                                // small outbuilding with a tiled roof
    lift(o, 0, 17.5); box(B, o, -4, 4, -0.3, 2.6, 15.5, 19.5, P.white); gable(o, -4, 4, 15.5, 19.5, 2.6, 1.2, P.terra, P.white, 0.3); foot(o, -4, 4, 15.5, 19.5);
    patch(o, -8, 9, HALF + 0.25, 15, C('#8fb86a'), 0.035); tree(o, 6, 8, 6, 2.2); shrub(o, -3, 5, 0.9);
  }
  {
    const f = lot(207, NE), v0 = 19, v1 = 33, yE = 5.9;     // no. 62: the big white house with the balconies, set back
    lift(f, 0.5, 26);
    box(B, f, -9, 10, -0.3, yE, v0, v1, P.white);
    for (const [a, b] of [[-8.5, -1], [1.5, 9.5]]) { box(B, f, a, b, 2.78, 2.95, v0 - 1.3, v0, P.white); rail(f, a, v0 - 1.25, b, v0 - 1.25, 2.95, 3.85, P.white, 'balus'); }
    for (const u of [-6.5, -3, 3.5, 7.5]) win(f, u, 2.98, 1.3, 2.1, v0, { shut: u === 3.5 ? P.shutGrey : P.glass });
    for (const u of [-6, -1.8, 3, 7.2]) win(f, u, 0, 2.6, 2.2, v0, { shut: C('#eceae4'), m: 0.07 });
    hip(f, -9, 10, v0, v1, yE, 2.4, P.terra, 0.5, P.frame); chimney(f, 5, 24, yE + 1.2, yE + 3); chimney(f, -4, 26, yE + 1.2, yE + 3);
    patch(f, -6, 12, HALF + 0.25, v0, P.lawn); patch(f, -6, -2, HALF + 0.25, v0, C('#8f8f8c'), 0.05);
    tree(f, 9, 9, 5.5, 2.3); shrub(f, 3, 8, 1.0, C('#3f8a42')); spiky(f, 5.5, 6.5, 1.5); tree(f, 1.5, 13, 4.5, 1.7, C('#6bb84f'));
    foot(f, -9, 10, v0, v1);
  }
  {
    const f = lot(228, NE);                                // row of garages behind the tall wall, and the house behind them
    lift(f, 0, 7);
    box(B, f, -13.5, 13.5, -0.3, 2.9, HALF + 0.25, 11, P.block); mono(f, -13.8, 13.8, HALF, 11.4, 3.25, 2.95, 'v', P.greyRoof);
    for (let u = -13.5; u < 13.6; u += 0.9) box(B, f, u - 0.2, u + 0.2, 3.2, 3.32, HALF - 0.1, HALF + 0.3, P.terraOld);
    foot(f, -13.5, 13.5, HALF + 0.25, 11);
    lift(f, 0.5, 27.5); box(B, f, -6, 7, -0.3, 5.9, 22, 33, P.white); hip(f, -6, 7, 22, 33, 5.9, 2.1, P.terra, 0.5, P.frame); chimney(f, 2, 27, 7, 8.6);
    for (const u of [-3, 3]) win(f, u, 3.9, 1.2, 1.2, 22);
    foot(f, -6, 7, 22, 33); tree(f, -9, 16, 6, 2.3); tree(f, 10, 17, 6.5, 2.5, C('#3f8a42'));
  }
  {
    const f = lot(249, NE);                                // building with the red metal roof
    lift(f, 0, 11.5);
    box(B, f, -7.5, 7.5, -0.3, 3.2, 4.2, 19, C('#e3e0d8')); gable(f, -7.5, 7.5, 4.2, 19, 3.2, 1.9, P.sheetRed, C('#e3e0d8'), 0.4);
    win(f, -3.5, 1.2, 1.4, 1.1, 4.2, { shut: C('#55595e') }); win(f, 3, 0, 2.6, 2.4, 4.2, { shut: C('#7b8087'), m: 0.06 });
    foot(f, -7.5, 7.5, 4.2, 19);
    tree(f, 12, 6.5, 6, 3.0, C('#5fae4c')); tree(f, 17, 8, 6.5, 2.8, C('#4a9440')); tree(f, 22, 5.5, 5, 2.2);
  }
  fence(NE, 159.6, 192, 'rail', { col: P.black }); fence(NE, 197, 203, 'gate', { h: 1.5, col: P.white, post: P.rough, solid: 0.5 }); fence(NE, 203, 214.4, 'picket');
  fence(NE, 241.6, 262, 'block', { h: 1.6 }); fence(NE, 262, 277, 'wall', { h: 1.1, col: C('#d9d6cd') });
  // south side
  {
    const f = lot(185, SW);                                // vegetable gardens and fruit trees
    patch(f, -24, 34, HALF + 0.3, 26, P.soil, 0.035);
    for (let u = -22; u < 32; u += 2.6) patch(f, u, u + 1.1, 5 + (u % 5 === 0 ? 2 : 0), 16, C('#6f9a4a'), 0.07);
    for (const [u, v] of [[-18, 20], [-9, 9], [-2, 19], [6, 8], [13, 21], [20, 10], [28, 18], [-14, 6]]) tree(f, u, v, 3.4 + rnd() * 1.2, 1.3 + rnd() * 0.5);
    lift(f, 3, 6); addGeo(CYL, f.xz(3, 6).x, 0.5, f.xz(3, 6).z, 0.35, 1.0, 0.35, C('#2f5fb0'));          // the blue barrel
  }
  {
    const f = lot(230, SW), v0 = 14.5, v1 = 26, yE = 5.6, wall = P.beige;   // no. 25: house with the steep roof, in its garden
    lift(f, 0, 20);
    box(B, f, -5.75, 5.75, -0.3, yE, v0, v1, wall); gableAcross(f, -5.75, 5.75, v0, v1, yE, 3.6, C('#5b5148'), wall, 0.55);
    B.quad(f.pt(-6.3, yE - 0.42, v0 - 0.56), f.pt(-6.3, yE - 0.2, v0 - 0.56), f.pt(0, yE + 3.82, v0 - 0.56), f.pt(0, yE + 3.6, v0 - 0.56), P.wood);
    B.quad(f.pt(6.3, yE - 0.42, v0 - 0.56), f.pt(6.3, yE - 0.2, v0 - 0.56), f.pt(0, yE + 3.82, v0 - 0.56), f.pt(0, yE + 3.6, v0 - 0.56), P.wood);
    win(f, 0, yE + 0.7, 0.8, 0.8, v0); win(f, -3, 3.8, 1.2, 1.2, v0); win(f, 3, 3.8, 1.2, 1.2, v0); win(f, -3, 1, 1.3, 1.2, v0); win(f, 1.2, 0, 1.0, 2.1, v0, { pane: P.wood }); win(f, 3.8, 1, 1.2, 1.2, v0);
    chimney(f, -2.5, 20, yE + 2, yE + 4.6, wall);
    patch(f, -16, 22, HALF + 0.3, 30, C('#86b862'), 0.035);
    palm(f, 8, 8, 3.2, C('#4f9a45')); palm(f, 11, 11, 2.6, C('#57a34b')); shrub(f, -2, 6, 0.9); shrub(f, 3, 8.5, 0.7, C('#d0b040')); shrub(f, -6, 10, 0.8);
    tree(f, -22, 6, 8.5, 3.4, C('#3f8a42')); tree(f, -15, 5.5, 9, 3.6, C('#4a9440')); tree(f, -9, 6.5, 8, 3.0); tree(f, 16, 5.5, 6.5, 2.5, C('#5fae4c')); tree(f, 21, 6, 6, 2.3);
    foot(f, -5.75, 5.75, v0, v1);
    const e = lot(262, SW);                                // the big fig tree near the end of the street
    tree(e, 0, 7.5, 6.5, 4.2, C('#58a648')); tree(e, 6, 9, 5, 2.6, C('#4a9440')); patch(e, -8, 12, HALF + 0.3, 14, C('#8a8a86'), 0.035);
  }
  fence(SW, STRIP_END, 215, 'wire'); fence(SW, 215, 252, 'wall', { h: 1.6 }); fence(SW, 252, 277, 'wall', { h: 0.9, col: C('#d9d6cd') });

  return { home, obstacles, inZone };
};
