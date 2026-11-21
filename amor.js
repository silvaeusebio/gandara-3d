// The other home: Rua da Serrada 11, Amor. A long narrow plot with three houses, drawn by hand from the outline its owner marked on the
// satellite picture, and from what can be seen from the street: a gravel track up to a red brick wall with a metal gate, the yard behind
// it with the main house (3) and a long outbuilding (2), and further back an old roofless house (1) and the garden.
// Everything is in metres east (e) and north (n) of the map pin of the house.
window.buildAmor = function (ctx) {
  const { B, G, C, box, frame, flatPoly, hipRoof, strip, blobs, miniBuildings, addRoad, addSeg, segDist } = ctx;
  const OX = -3280.3, OZ = -3260.4, P = (e, n) => ({ x: OX + e, z: OZ - n });
  const TILE = C('#b9573a'), TILE2 = C('#c8643c'), CREAM = C('#ece5d3'), BRICK = C('#c0563a'), BLOCK = C('#a9a79f'), STONE = C('#b3a88f'), WOOD = C('#8a6a4a'), WHITE = C('#f4f1ea');
  const DARK = C('#2e4458'), DOOR = C('#6a4630'), RUST = C('#a2463a'), GREEN = C('#3f8a43'), LEAF = C('#4f9a43'), PINK = C('#c654d2'), TRUNK = C('#7a5a3c'), GREY = C('#8d9296');

  // the outline of the plot, as marked (the two corners at the street are moved back to the wall of the street)
  const PLOT = [[-10.33, -33.42], [11.97, -18.17], [-6.44, 27.12], [-7.28, 55.57], [-17.28, 55.29], [-13.62, 18.95], [-16.44, 17.96], [-12.92, 5.85], [-11.08, 2.89], [-9.11, -13.3], [-8.27, -22.46], [-9.11, -23.44]];
  const zone = PLOT.map(p => P(p[0], p[1]));
  const inside = (x, z) => { let c = false; for (let i = 0, j = zone.length - 1; i < zone.length; j = i++) { const a = zone[i], b = zone[j]; if ((a.z > z) !== (b.z > z) && x < (b.x - a.x) * (z - a.z) / (b.z - a.z) + a.x) c = !c; } return c; };
  const inZone = (x, z) => {                       // no invented houses or trees here (nor on the two neighbours drawn below)
    if (Math.hypot(x - OX - 2, z - OZ + 10) > 75) return false;
    if (inside(x, z) || Math.hypot(x - OX - 14, z - OZ - 6) < 13 || Math.hypot(x - OX - 9, z - OZ + 6) < 10) return true;
    for (let i = 0; i < zone.length; i++) { const a = zone[i], b = zone[(i + 1) % zone.length]; if (segDist(x, z, { ax: a.x, az: a.z, bx: b.x, bz: b.z }).d < 4) return true; }
    return false;
  };

  // ---- small tools ----
  const along = (c, d, hl, hw) => {                // a frame at c = [e, n]: u along d = [de, dn], v to its right-hand side seen from above (east when d points north)
    const l = Math.hypot(d[0], d[1]), ue = d[0] / l, un = d[1] / l, p = P(c[0], c[1]);
    B.at(p.x, p.z);
    return Object.assign(frame(p.x, p.z, ue, -un, un, ue), { hl, hw });
  };
  const face = (f, u0, u1, y0, y1, v, col) => B.quad(f.pt(u0, y0, v), f.pt(u1, y0, v), f.pt(u1, y1, v), f.pt(u0, y1, v), col);       // a panel on a long side
  const end = (f, u, v0, v1, y0, y1, col) => B.quad(f.pt(u, y0, v0), f.pt(u, y0, v1), f.pt(u, y1, v1), f.pt(u, y1, v0), col);        // a panel on an end
  const windowOn = (f, u, y, v, w = 1.0, h = 1.1) => { const o = v > 0 ? 0.05 : -0.05; face(f, u - w / 2 - 0.08, u + w / 2 + 0.08, y - 0.08, y + h + 0.08, v + o, WHITE); face(f, u - w / 2, u + w / 2, y, y + h, v + o * 1.6, DARK); };
  function wall(a, b, h, t, col) {                 // a wall from a to b that steps with the ground
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(len / 2.5)), d = [b[0] - a[0], b[1] - a[1]];
    for (let i = 0; i < k; i++) { const f = along([a[0] + d[0] * (i + 0.5) / k, a[1] + d[1] * (i + 0.5) / k], d); box(B, f, -len / k / 2 - 0.03, len / k / 2 + 0.03, -0.4, h, -t / 2, t / 2, col); }
  }
  const walls = (pts, h, t, col) => { for (let i = 0; i < pts.length - 1; i++) wall(pts[i], pts[i + 1], h, t, col); };
  function gable(f, u0, u1, v0, v1, y, h, col, wallCol) {      // a roof with the ridge along u
    const m = (v0 + v1) / 2;
    B.quad(f.pt(u0, y, v0), f.pt(u1, y, v0), f.pt(u1, y + h, m), f.pt(u0, y + h, m), col); B.quad(f.pt(u0, y, v1), f.pt(u1, y, v1), f.pt(u1, y + h, m), f.pt(u0, y + h, m), col);
    B.tri(f.pt(u0 + 0.3, y, v0), f.pt(u0 + 0.3, y, v1), f.pt(u0 + 0.3, y + h, m), wallCol); B.tri(f.pt(u1 - 0.3, y, v0), f.pt(u1 - 0.3, y, v1), f.pt(u1 - 0.3, y + h, m), wallCol);
  }
  function lean(f, u0, u1, v0, v1, y0, y1, col, wallCol) {     // a roof in one slope, low at v0 and high at v1
    B.quad(f.pt(u0, y0, v0), f.pt(u1, y0, v0), f.pt(u1, y1, v1), f.pt(u0, y1, v1), col);
    B.tri(f.pt(u0 + 0.15, y0, v0 + 0.15), f.pt(u0 + 0.15, y0, v1 - 0.15), f.pt(u0 + 0.15, y1, v1 - 0.15), wallCol); B.tri(f.pt(u1 - 0.15, y0, v0 + 0.15), f.pt(u1 - 0.15, y0, v1 - 0.15), f.pt(u1 - 0.15, y1, v1 - 0.15), wallCol);
    face(f, u0 + 0.15, u1 - 0.15, y0, y1, v1 - 0.15, wallCol);
  }
  function pergola(f, u0, u1, v0, v1, h, col) {    // posts, a frame on top and slats across
    for (const u of [u0, u1]) for (const v of [v0, v1]) box(B, f, u - 0.08, u + 0.08, -0.4, h, v - 0.08, v + 0.08, col);
    for (const v of [v0, v1]) box(B, f, u0 - 0.2, u1 + 0.2, h, h + 0.14, v - 0.07, v + 0.07, col);
    for (let u = u0; u <= u1 + 0.01; u += 0.7) box(B, f, u - 0.05, u + 0.05, h + 0.14, h + 0.24, v0 - 0.25, v1 + 0.25, col);
  }
  function tree(e, n, s = 1) { const f = along([e, n], [0, 1]); box(B, f, -0.16 * s, 0.16 * s, -0.4, 2.1 * s, -0.16 * s, 0.16 * s, TRUNK); box(B, f, -1.3 * s, 1.3 * s, 1.9 * s, 3.5 * s, -1.3 * s, 1.3 * s, LEAF); hipRoof(B, f, -1.3 * s, 1.3 * s, -1.3 * s, 1.3 * s, 3.5 * s, 1.3 * s, LEAF); }
  function bush(e, n, r, h, col) { const f = along([e, n], [1, 0.4]); box(B, f, -r, r, -0.4, h * 0.45, -r, r, col); hipRoof(B, f, -r, r, -r, r, h * 0.45, h * 0.55, col); }
  const ground = (pts, y, col) => flatPoly(G, pts.map(p => P(p[0], p[1])), y, C(col));
  const built = (f, hl, hw, col) => { const pts = [f.xz(-hl, -hw), f.xz(hl, -hw), f.xz(hl, hw), f.xz(-hl, hw)], c = f.xz(0, 0); blobs.push({ x: c.x, z: c.z, r: Math.hypot(hl, hw), fresh: true }); miniBuildings.push({ pts, c: col }); };

  // ---- the ground ----
  const GATE = [-2.8, -14.05], GW = [-4.3, -14.55], GE = [-1.3, -13.55], BW = [-9.2, -16.2], BE = [9.3, -10.0];          // the gate (middle and posts) and the two ends of the brick wall
  ground([[-10.33, -33.42], [5.83, -22.38], GW, BW, [-8.27, -22.46], [-9.11, -23.44]], 0.05, '#c7b877');                  // the field by the street: dry grass
  ground([BW, BE, [6.4, -4.8], [0.08, -7.66], [-6.0, 7.25], [-8.6, 7.6], [-7.6, -10.0], [-9.1, -13.3]], 0.06, '#b9ab8e');      // the yard: beaten earth
  ground([[9.13, -20.12], [11.97, -18.17], BE, GE], 0.05, '#86b862');                                                     // the bank beside the track

  // ---- where you can go: the track from the street through the gate, the yard, the passage beside the house, the back and the garden ----
  const way = { w: 3.4, y: 0.1, c: '#d8d2c2', v: 8 }, track = [[10.07, -25.05], [7.48, -21.25], GATE, [-3.6, -9.0]].map(p => P(p[0], p[1]));
  const road = addRoad('', 'service', track, way);
  strip(G, track, way.w, way.y, C(way.c));
  road.noWall = true; for (const s of road.segs) s.noWall = true;
  const go = (a, b, w) => { const p = P(a[0], a[1]), q = P(b[0], b[1]); addSeg({ ax: p.x, az: p.z, bx: q.x, bz: q.z, w, name: '', type: 'driveway', noWall: true }); };
  go([-3.0, -10.9], [-3.9, -7.0], 6.0);                          // the wide part of the yard, inside the gate: room to park and to walk past
  go([-3.6, -9.0], [-5.2, -1.0], 4.0); go([-5.2, -1.0], [-6.6, 5.5], 2.2); go([-6.6, 5.5], [-8.0, 10.0], 2.2);
  go([-8.0, 10.0], [-10.0, 18.5], 6.0); go([-10.0, 18.5], [-13.7, 24.0], 1.6); go([-13.7, 24.0], [-13.9, 32.3], 1.5);
  go([-13.9, 32.3], [-12.3, 38.0], 3.0); go([-12.3, 38.0], [-12.3, 52.0], 7.0);

  // ---- walls ----
  walls([BW, GW], 2.0, 0.22, BRICK); walls([GE, BE], 2.0, 0.22, BRICK);                                                    // the red brick wall across the plot
  for (const p of [GW, GE]) { const f = along(p, [1, 0.34]); box(B, f, -0.18, 0.18, -0.4, 2.2, -0.18, 0.18, BRICK); }
  { const f = along(GW, [-0.34, 1]); box(B, f, 0.1, 1.5, 0.1, 1.9, -0.04, 0.04, RUST); }                                  // the metal gate, open: one leaf against each side
  { const f = along(GE, [-0.34, 1]); box(B, f, 0.1, 1.5, 0.1, 1.9, -0.04, 0.04, RUST); }
  walls([[5.83, -22.38], GW], 0.9, 0.2, BLOCK);                                                                            // the low block wall between the track and the field
  walls([[9.13, -20.12], [4.6, -17.3]], 0.7, 0.2, BLOCK);                                                                  // and the one that holds the bank
  walls([[-10.33, -33.42], [-9.11, -23.44], [-8.27, -22.46], [-9.11, -13.3], [-11.08, 2.89], [-12.92, 5.85], [-16.44, 17.96], [-13.62, 18.95], [-17.28, 55.29], [-7.28, 55.57], [-6.44, 27.12], [-0.6, 12.7]], 1.5, 0.2, BLOCK);   // round the plot: west side, back, east side down to the house
  walls([[6.9, -5.6], BE, [11.97, -18.17]], 1.5, 0.2, BLOCK);

  // ---- house 3: the main house (red hipped roof), with the pergola and a small annex at its south end ----
  {
    const f = along([0.11, 1.16], [0.402, -0.916], 8, 3.25);      // u runs south-south-east along the house, v points west (the yard)
    box(B, f, -8, 8, -0.4, 3.1, -3.25, 3.25, CREAM);
    box(B, f, -8.3, 8.3, 3.1, 3.22, -3.55, 3.55, TILE); hipRoof(B, f, -8.3, 8.3, -3.55, 3.55, 3.22, 1.9, TILE);
    box(B, f, -3.4, -2.8, 3.6, 5.3, -1.2, -0.6, CREAM);                                                                     // chimney
    for (const u of [-5.6, -2.4, 5.2]) windowOn(f, u, 1.0, 3.25);                                                        // the side on the yard
    face(f, 1.0, 2.0, 0, 2.1, 3.31, DOOR); face(f, 0.9, 2.1, 2.1, 2.2, 3.31, WHITE);
    end(f, 8.06, 0.9, 1.9, 0, 2.1, DOOR); end(f, 8.06, -1.8, -0.6, 1.0, 2.1, DARK);                                       // the end under the pergola
    end(f, -8.06, -0.6, 0.6, 1.0, 2.1, DARK);
    pergola(f, 8.3, 12.3, 0.2, 4.0, 2.5, WHITE);
    box(B, f, 9.4, 12.5, -0.4, 2.2, -3.3, -0.1, CREAM); lean(f, 9.2, 12.7, -3.5, 0.1, 2.2, 2.9, TILE2, CREAM);
    built(f, 8, 3.25, '#9a8f7c');
  }
  // ---- house 2: the long outbuilding against the west wall, with a timber pergola at its south end ----
  {
    const f = along([-9.0, -3.15], [-0.121, 0.993], 6.8, 1.25);   // u runs north, v points east (the yard)
    box(B, f, -6.8, 6.8, -0.4, 2.1, -1.25, 1.25, BRICK); lean(f, -7.0, 7.0, 1.5, -1.5, 2.1, 2.9, TILE, BRICK);
    for (const u of [-4.6, -0.4, 3.8]) face(f, u - 0.55, u + 0.55, 0, 1.9, 1.3, DOOR);
    pergola(f, -12.4, -7.1, -1.1, 1.5, 2.3, WOOD);
    B.quad(f.pt(-12.6, 2.56, -1.4), f.pt(-7.0, 2.56, -1.4), f.pt(-7.0, 2.62, 0.1), f.pt(-12.6, 2.62, 0.1), TILE2);        // a few tiles left on half of it
    built(f, 6.8, 1.25, '#9a8f7c');
  }
  // ---- house 1: the old house at the back, without a roof except for a strip at its south end ----
  {
    const f = along([-10.0, 28.2], [1, 0], 2.8, 3.3), tops = [3.0, 2.3, 3.2, 2.6, 2.0, 2.9, 2.4, 3.1];      // u east, v south
    const ring = [[-2.8, -3.3], [2.8, -3.3], [2.8, 3.3], [-2.8, 3.3], [-2.8, -3.3]];
    let k = 0;
    for (let i = 0; i < 4; i++) {
      const a = ring[i], b = ring[i + 1], n = 4;
      for (let j = 0; j < n; j++, k++) {
        const u0 = a[0] + (b[0] - a[0]) * j / n, v0 = a[1] + (b[1] - a[1]) * j / n, u1 = a[0] + (b[0] - a[0]) * (j + 1) / n, v1 = a[1] + (b[1] - a[1]) * (j + 1) / n;
        if (i === 2 && j === 1) continue;                                                                                 // the doorway, on the south side
        box(B, f, Math.min(u0, u1) - 0.2, Math.max(u0, u1) + 0.2, -0.4, tops[k % tops.length], Math.min(v0, v1) - 0.2, Math.max(v0, v1) + 0.2, STONE);
      }
    }
    lean(f, -3.0, 3.0, 3.5, 1.7, 2.3, 2.9, TILE, STONE);
    built(f, 2.8, 3.3, '#9a8f7c');
  }
  // ---- the two neighbours that are right beside the plot, plain: the white house at no. 13 and the building with the grey roof ----
  {
    const f = along([14.8, -6.6], [0.455, -0.891], 6.25, 4.3);
    box(B, f, -6.25, 6.25, -0.4, 5.4, -4.3, 4.3, WHITE); gable(f, -6.6, 6.6, -4.7, 4.7, 5.4, 2.0, TILE2, WHITE);
    for (const u of [-3.6, 3.4]) for (const y of [0.9, 3.5]) { windowOn(f, u, y, -4.3); windowOn(f, u, y, 4.3); }
    end(f, 6.31, -0.5, 0.5, 2.8, 4.9, DOOR); box(B, f, 6.25, 7.5, 2.55, 2.7, -4.3, 4.3, GREY);                            // balcony on the end that faces the street
    box(B, f, 7.44, 7.5, 2.7, 3.6, -4.3, 4.3, GREEN);
    built(f, 6.25, 4.3, '#8b8f96');
  }
  {
    const f = along([8.9, 6.2], [0.29, -0.957], 6.2, 3.6);
    box(B, f, -6.2, 6.2, -0.4, 3.3, -3.6, 3.6, WHITE); box(B, f, -6.4, 6.4, 3.3, 3.5, -3.8, 3.8, GREY);
    built(f, 6.2, 3.6, '#8b8f96');
  }

  // ---- plants: the flowers and the bushes on the bank at the entrance, the tree by the wall, the trees of the garden ----
  bush(8.6, -18.6, 1.3, 1.1, PINK); bush(6.9, -17.6, 1.1, 0.9, PINK); bush(9.6, -17.0, 1.0, 1.2, GREEN); bush(7.6, -15.4, 1.2, 1.4, GREEN); bush(8.9, -13.2, 1.0, 1.1, GREEN);
  tree(4.6, -13.6, 1.5);
  tree(-12.0, 40.5, 1.3); tree(-9.2, 46.0, 1.1); tree(-15.0, 49.5, 1.4); tree(-9.4, 35.0, 1.0); tree(-14.6, 43.0, 0.9);
  bush(-5.2, 14.5, 1.0, 1.2, GREEN); bush(-12.6, 12.0, 1.2, 1.3, LEAF); bush(-4.6, 20.5, 0.9, 1.0, LEAF);

  // where the key M takes you: on the track, at the gate, with the car and the motorbike parked in the yard, noses to the gate
  const heading = Math.atan2(GATE[0] + 4.9, -(GATE[1] + 9.4));
  return { ...P(0, 0), inZone, heading, me: { ...P(-1.26, -15.13), heading: Math.atan2(-1.54, -1.08) }, car: P(-4.9, -9.4), bike: P(-4.9, -6.0) };
};
