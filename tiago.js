// Tiago's building: the apartment blocks on the south side of Avenida Dr. Francisco Sá Carneiro (Marrazes),
// modelled by hand from satellite and street-level photos, with the car park in front.
// Local coordinates: u = metres east of the 546C pin, v = metres south of the front (north) facade, y = up.
window.buildTiago = function (ctx) {
  const { G, C, box, frame, flatPoly, strip, blobs, miniBuildings, addRoad } = ctx;
  let B = ctx.B;                                           // the builder in use (the 546C block has its own, so that it can be hidden when you are inside)
  const X0 = 1771, Z0 = 2418;                              // the pin, and the line of the front facade (world z = metres south of the home)
  const f = frame(X0, Z0, 1, 0, 0, 1);
  const P = { white: C('#f1f1ee'), dark: C('#2b2f36'), glass: C('#27425c'), core: C('#1f3a56'), rail: C('#a9d3e6'), grey: C('#d3d1cb'),
    asphalt: C('#5a5d62'), line: C('#e9e9e2'), blue: C('#2f6fd0'), black: C('#1e2022'), concrete: C('#bdb8ad') };
  const faceV = (u0, u1, y0, y1, v, col) => B.quad(f.pt(u0, y0, v), f.pt(u1, y0, v), f.pt(u1, y1, v), f.pt(u0, y1, v), col);
  const patch = (u0, u1, v0, v1, col, y) => flatPoly(G, [f.xz(u0, v0), f.xz(u1, v0), f.xz(u1, v1), f.xz(u0, v1)], y, col);

  // ---------- one apartment block: dark frame, white bands, glass balconies, glazed stair core in the middle ----------
  const TOP = 16.2, FLOOR0 = 3.3, FLOOR = 3.05, DEPTH = 20;
  function block(u0, u1, garageEast) {
    const uc = (u0 + u1) / 2, roofY = FLOOR0 + 4 * FLOOR + 0.1, mid = f.xz(uc, DEPTH / 2);
    B.at(mid.x, mid.z);                                                              // each block stands at its own height
    box(B, f, u0 + 0.5, u1 - 0.5, -0.3, roofY, 1.6, DEPTH, P.white);
    for (const [a, b] of [[u0, u0 + 0.5], [u1 - 0.5, u1]]) box(B, f, a, b, FLOOR0 - 0.3, TOP, 0, DEPTH, P.dark);       // the frame: sides...
    box(B, f, u0, u1, roofY, TOP, 0, 2, P.dark);                                                                   // ...and top
    for (const a of [uc - 2.75, uc + 2.4]) box(B, f, a, a + 0.35, -0.3, TOP, 0, 2, P.dark);                          // piers beside the stair core
    faceV(uc - 2.4, uc + 2.4, 0.2, roofY, 0.3, P.core);                                                            // glazed stair core
    for (let y = 2.6; y < roofY; y += 1.02) faceV(uc - 2.4, uc + 2.4, y, y + 0.07, 0.24, P.dark);
    for (const a of [uc - 0.8, uc + 0.8]) faceV(a - 0.035, a + 0.035, 0.2, roofY, 0.24, P.dark);
    faceV(uc - 1.0, uc + 1.0, 0, 2.35, 0.2, C('#3b6a8f')); faceV(uc - 0.03, uc + 0.03, 0, 2.35, 0.15, P.dark);         // the entrance doors
    box(B, f, uc - 1.6, uc + 1.6, 2.45, 2.6, -0.9, 0.3, P.dark);                                                   // canopy over the door
    for (const [a, b] of [[u0 + 0.5, uc - 2.75], [uc + 2.75, u1 - 0.5]]) {
      for (let k = 0; k < 4; k++) {
        const y = FLOOR0 + k * FLOOR;
        box(B, f, a, b, y - 0.25, y, 0.1, 1.6, P.dark);                                  // balcony
        faceV(a, b, y, y + 1.05, 0.14, P.rail); faceV(a, b, y + 1.05, y + 1.1, 0.13, C('#dfe6ea'));
        faceV(a + 0.3, b - 0.3, y + 0.12, y + 2.45, 1.53, P.glass);                      // sliding windows behind it
        for (let u = a + 0.3 + (b - a - 0.6) / 3; u < b - 1; u += (b - a - 0.6) / 3) faceV(u - 0.3, u + 0.3, y + 0.12, y + 2.45, 1.5, P.white);
      }
      for (let u = a + 1.2; u < b - 2.5; u += 3.2) faceV(u, u + 2.2, 1.9, 2.7, 1.54, P.glass);                     // ground floor: a strip of high windows
    }
    const g0 = garageEast ? u1 - 7.5 : u0 + 2.5;
    faceV(g0, g0 + 5, 0, 2.7, 1.5, P.black);                                                                       // way down to the garage
    for (let k = 0; k < 4; k++) for (let u = u0 + 3; u < u1 - 2; u += 3.4) {                                         // back of the block
      const y = FLOOR0 + k * FLOOR + 0.9;
      B.quad(f.pt(u, y, DEPTH + 0.06), f.pt(u + 1.6, y, DEPTH + 0.06), f.pt(u + 1.6, y + 1.3, DEPTH + 0.06), f.pt(u, y + 1.3, DEPTH + 0.06), P.glass);
    }
    box(B, f, uc - 3, uc + 3, roofY, roofY + 2.3, 5, 11, P.grey);                        // stair head on the roof
    box(B, f, u0 + 0.5, u1 - 0.5, roofY, roofY + 0.5, DEPTH - 0.3, DEPTH, P.white);      // parapet at the back
    const c = [f.xz(u0, 0), f.xz(u1, 0), f.xz(u1, DEPTH), f.xz(u0, DEPTH)], m = f.xz(uc, DEPTH / 2);
    miniBuildings.push({ pts: c, c: '#5b7fb0' });
    blobs.push({ x: m.x, z: m.z, r: Math.hypot(u1 - u0, DEPTH) / 2 });
  }
  const shell = ctx.newBuilder();
  B = shell; block(-17, 13.5, true); B = ctx.B;          // 546C: the block with the pin
  const groundC = shell.base;                              // height of the ground under it
  block(-47.9, -17.4, true);
  block(-78.8, -48.3, false);

  // ---------- the car park in front ----------
  const lot = { w: 15, y: 0.11, c: '#5a5d62', v: 8 }, way = { w: 7, y: 0.11, c: '#5a5d62', v: 10 };
  const a = f.xz(-72, -9), b = f.xz(11, -9), e0 = { x: X0 - 26, z: 2393.1 }, e1 = f.xz(-26, -9);
  addRoad('', 'service', [a, b], lot); strip(G, [a, b], lot.w, lot.y, P.asphalt);          // the car park itself
  addRoad('', 'service', [e0, e1], way); strip(G, [e0, e1], way.w, way.y, P.asphalt);      // the way in from the avenue
  const p0 = f.xz(-1.75, -9), p1 = f.xz(-1.75, -1.2);
  const path = addRoad('', 'footway', [p0, p1], { w: 2, y: 0.12, c: '#c9c3b6', v: 5 }); strip(G, [p0, p1], 2, 0.13, C('#c9c3b6'));   // path to the door of 546C
  path.noWall = true; for (const s of ctx.segs) if (s.road === path) s.noWall = true;       // no walls beside the path
  for (let u = -70.1; u < 12; u += 2.6) if (u < -3.4 || u > -0.4) patch(u - 0.06, u + 0.06, -6.6, -1.7, P.line, 0.14);  // parking bays
  patch(1.1, 3.5, -6.5, -1.75, P.blue, 0.135);                                                                        // the place kept for you
  { const s = f.xz(2.3, -1.4); B.at(s.x, s.z); }
  box(B, f, 2.25, 2.35, 0, 2.3, -1.45, -1.35, C('#8f9396')); box(B, f, 1.95, 2.65, 1.7, 2.4, -1.5, -1.44, P.blue); faceV(2.12, 2.48, 1.82, 2.28, -1.52, P.line);

  // parked cars (decoration, but solid)
  const obstacles = [];
  function parked(u, v, across, col, van) {
    const o = f.xz(u, v); B.at(o.x, o.z);
    const g = across ? frame(o.x, o.z, 0, 1, -1, 0) : frame(o.x, o.z, 1, 0, 0, 1), body = C(col), L = van ? 2.9 : 2.1, top = van ? 2.5 : 1.5;
    box(B, g, -L, L, 0.32, van ? 1.1 : 0.92, -0.86, 0.86, body);
    if (van) { box(B, g, -L, 1.3, 1.1, top, -0.95, 0.95, C('#ecebe6')); box(B, g, 1.3, 2.5, 1.1, 1.85, -0.8, 0.8, C('#27323c')); }
    else { box(B, g, -1.15, 1.15, 0.92, top, -0.78, 0.78, C('#27323c')); box(B, g, -1.1, 1.1, top, top + 0.05, -0.78, 0.78, body); }
    for (const du of [-L + 0.45, L - 1.15]) for (const dv of [-0.9, 0.66]) box(B, g, du, du + 0.7, 0, 0.7, dv, dv + 0.24, P.black);
    for (const s of van ? [-2, -0.7, 0.7, 2] : [-1.25, 0, 1.25]) { const p = g.xz(s, 0); obstacles.push({ x: p.x, z: p.z, r: 0.95 }); }
  }
  for (const [u, col] of [[7.5, '#2a2d33'], [-8.7, '#b9bec4'], [-13.9, '#1f2937'], [-24.3, '#e9e9e6'], [-37.3, '#7a1f1f'], [-45.1, '#b9bec4'], [-58.1, '#2b3350'], [-63.3, '#e9e9e6']]) parked(u, -4.1, true, col);
  parked(4.5, -14.6, false, '#ecebe6', true);                                           // the white van

  const c = f.xz(-1.75, 10), door = f.xz(-1.75, -1.2), bay = f.xz(2.3, -4.1);
  const inZone = (x, z) => x > X0 - 100 && x < X0 + 32 && z > Z0 - 24 && z < Z0 + 34;   // no random houses or trees here
  // =====================================================================================================
  //  TIAGO'S FLAT (about 100 m2), from his own sketch "Casa Tiago.png". It is on the second floor of the east half of 546C;
  //  the balcony (varanda) is at the BACK of the building, away from the avenue and the car park. Sketch coordinates: a = metres from the wall with the
  //  entrance door (left of the sketch), b = metres from the wall on the avenue side (top of the sketch). Full-height walls and a ceiling:
  //  you are inside it, and through the study window and from the balcony you see the real street.
  // =====================================================================================================
  const FW = 8.4, FL = 12.03, FV = 2.72, WALL = 2.6, floorY = groundC + FLOOR0 + FLOOR;
  const xE = X0 + 1.2, zS = Z0 + DEPTH - FL - FV - 0.2;         // world x of the entrance wall (next to the stairs), world z of the wall on the avenue side
  const fi = frame(xE, zS, 1, 0, 0, 1), inside = ctx.newBuilder();   // a runs east, b runs south: the balcony ends at the back wall of the block
  inside.base = floorY;
  const bx = (a0, a1, b0, b1, y0, y1, col) => box(inside, fi, a0, a1, y0, y1, b0, b1, C(col));
  const tile = (a0, a1, b0, b1, col) => inside.quad(fi.pt(a0, 0.012, b0), fi.pt(a1, 0.012, b0), fi.pt(a1, 0.012, b1), fi.pt(a0, 0.012, b1), C(col));
  bx(-0.1, FW + 0.1, -0.1, FL + FV, -0.25, 0, '#b9b6ae');                                  // the floor slab
  const wood = '#c9a77a';
  tile(0, 4.79, 0, 2.52, wood); tile(3.27, 4.79, 2.52, 5.45, wood); tile(4.79, FW, 0, 3.51, '#bf9d70');           // hall, corridor, study
  tile(0, 3.27, 2.52, 5.45, '#bcd3d9'); tile(4.79, FW, 3.51, 6.6, '#dcd9d2'); tile(4.3, FW, 6.6, FL, wood); tile(4.3, 4.79, 5.45, 6.6, wood);   // bathroom, kitchen, living room
  tile(0, 4.3, 5.45, FL, '#c4a070'); tile(0, FW, FL, FL + FV, '#a9a69d');                                          // bedroom, balcony
  const wA = (b, a0, a1, th = 0.12) => bx(a0, a1, b - th / 2, b + th / 2, 0, WALL, '#f0ede6');   // a wall along a (at depth b)
  const wB = (a, b0, b1, th = 0.12) => bx(a - th / 2, a + th / 2, b0, b1, 0, WALL, '#f0ede6');   // a wall along b
  wA(0, 0, 5.5, 0.2); wA(0, 7.5, FW, 0.2); wB(FW, 0, FL, 0.2); wB(0, 0, 0.7, 0.2); wB(0, 1.6, FL, 0.2);   // outside walls (gaps: the study window and the entrance door)
  wA(FL, 0, 1.3, 0.2); wA(FL, 2.9, 5.2, 0.2); wA(FL, 7.6, FW, 0.2);                         // front wall, with the two balcony doors
  wB(4.79, 0, 1.3); wB(4.79, 2.2, 4.3); wA(3.51, 4.79, FW);                                 // study
  wA(2.52, 0, 3.27); wB(3.27, 2.52, 3.5); wB(3.27, 4.4, 5.45);                              // bathroom
  wA(5.45, 0, 3.37); wA(5.45, 4.22, 4.36); wB(4.3, 5.45, FL);                               // bedroom
  bx(-0.04, 0.04, 0.7, 1.6, 0, 2.1, '#7a4a2c'); bx(0.04, 0.08, 1.42, 1.5, 0.98, 1.06, '#c9ccd1');   // the entrance door, with its handle
  const over = (a0, a1, b0, b1, y0 = 2.1) => bx(a0, a1, b0, b1, y0, WALL, '#f0ede6');       // the bit of wall above a door or a window
  over(-0.1, 0.1, 0.7, 1.6); over(4.73, 4.85, 1.3, 2.2); over(3.21, 3.33, 3.5, 4.4); over(3.37, 4.22, 5.39, 5.51); over(4.73, 4.85, 4.3, 5.45, 2.25);
  over(1.3, 2.9, FL - 0.1, FL + 0.1); over(5.2, 7.6, FL - 0.1, FL + 0.1);
  bx(5.5, 7.5, -0.1, 0.1, 0, 0.9, '#f0ede6'); over(5.5, 7.5, -0.1, 0.1, 2.15); bx(5.5, 7.5, -0.14, 0.14, 0.9, 0.94, '#d9d6cf');   // the study window, on the avenue side
  for (const a of [5.5, 6.5, 7.46]) bx(a, a + 0.04, -0.03, 0.03, 0.94, 2.15, '#3a3d42');
  bx(-0.1, FW + 0.1, -0.1, FL + FV, WALL, WALL + 0.15, '#f6f4ef');                           // the ceiling (also over the balcony)
  const panes = [], pane = (a0, b0, a1, b1, y0, y1) => panes.push([fi.pt(a0, y0, b0), fi.pt(a1, y0, b1), fi.pt(a1, y1, b1), fi.pt(a0, y1, b0)].map(p => [p[0], p[1] + floorY, p[2]]));   // sheets of glass
  pane(5.54, 0, 7.46, 0, 0.94, 2.15);
  for (const a of [1.3, 2.86, 5.2, 7.56]) bx(a, a + 0.04, FL - 0.04, FL + 0.04, 0, 2.1, '#3a3d42');   // frames of the two balcony doors (they stand open)
  bx(0, FW, FL + FV - 0.06, FL + FV, 1.0, 1.06, '#dfe6ea'); bx(0, FW, FL + FV - 0.06, FL + FV, 0, 0.08, '#3a3d42');                          // balcony rail: glass with a handrail
  pane(0, FL + FV - 0.03, FW, FL + FV - 0.03, 0.08, 1.0);
  wB(0, FL, FL + FV, 0.2); wB(FW, FL, FL + FV, 0.2);                                         // walls between this balcony and the neighbours'
  // furniture, where the sketch has it
  const solid = [];                                          // things you cannot walk through: [a0, a1, b0, b1]
  const thing = (a0, a1, b0, b1, y0, y1, col, hard = true) => { bx(a0, a1, b0, b1, y0, y1, col); if (hard) solid.push([a0, a1, b0, b1]); };
  thing(4.85, FW - 0.1, 3.57, 4.17, 0, 0.9, '#ecebe6'); thing(7.8, FW - 0.1, 4.17, 6.15, 0, 0.9, '#ecebe6');       // kitchen counter (cozinha)
  bx(4.85, FW - 0.1, 3.57, 4.2, 0.9, 0.94, '#3a3d42'); bx(7.77, FW - 0.1, 4.17, 6.15, 0.9, 0.94, '#3a3d42');
  bx(5.4, 6.0, 3.66, 4.08, 0.94, 0.96, '#9aa0a6'); bx(6.6, 7.3, 3.66, 4.08, 0.94, 0.96, '#17191c');               // sink and hob
  thing(4.75, 6.35, 5.62, 6.51, 0.7, 0.76, '#a8794a');                                                               // table (mesa)
  for (const [a, b] of [[4.82, 5.69], [6.2, 5.69], [4.82, 6.36], [6.2, 6.36]]) bx(a, a + 0.08, b, b + 0.08, 0, 0.7, '#8a6238');
  thing(4.54, 6.29, 7.14, 7.99, 0, 0.42, '#5f6b7a'); thing(4.54, 5.13, 7.99, 10.98, 0, 0.42, '#5f6b7a');           // L-shaped sofa (sofá), facing the TV
  bx(4.54, 6.29, 7.14, 7.34, 0.42, 0.85, '#515c69'); bx(4.54, 4.74, 7.34, 10.98, 0.42, 0.85, '#515c69');
  for (let b = 8.05; b < 10.9; b += 0.97) bx(4.76, 5.1, b, b + 0.9, 0.42, 0.52, '#74808f');
  bx(5.2, 6.24, 7.38, 7.95, 0.42, 0.52, '#74808f');
  thing(7.85, FW - 0.1, 8.32, 10.96, 0, 0.5, '#5a4632'); bx(8.0, 8.07, 8.9, 10.4, 0.62, 1.5, '#111316'); bx(7.99, 8.0, 8.95, 10.35, 0.67, 1.45, '#22364d');   // TV
  thing(5.74, 6.37, 1.14, 2.9, 0.7, 0.75, '#b08a5a'); bx(5.78, 5.84, 1.2, 1.26, 0, 0.7, '#6b4f2e'); bx(6.27, 6.33, 2.78, 2.84, 0, 0.7, '#6b4f2e');   // desk (escritório)
  bx(5.78, 5.84, 2.78, 2.84, 0, 0.7, '#6b4f2e'); bx(6.27, 6.33, 1.2, 1.26, 0, 0.7, '#6b4f2e'); bx(5.85, 5.92, 1.6, 2.4, 0.75, 1.2, '#111316');
  thing(6.57, 7.02, 2.25, 2.68, 0.4, 0.48, '#2a2d31'); bx(6.96, 7.02, 2.25, 2.68, 0.48, 0.95, '#2a2d31'); bx(6.76, 6.82, 2.43, 2.49, 0, 0.4, '#5b6066');   // desk chair
  // not in the sketch, added so that the rooms are not empty: a bed, and the bathroom fittings
  thing(0.25, 2.35, 7.9, 9.7, 0, 0.45, '#e8e4dc'); bx(0.12, 0.25, 7.85, 9.75, 0, 0.95, '#8a6238'); bx(0.9, 2.35, 7.9, 9.7, 0.45, 0.5, '#6f8fb0'); bx(0.32, 0.8, 8.05, 8.7, 0.45, 0.56, '#f7f6f1'); bx(0.32, 0.8, 8.9, 9.55, 0.45, 0.56, '#f7f6f1');
  thing(0.2, 0.85, 2.95, 3.45, 0, 0.42, '#f7f6f1'); bx(0.12, 0.3, 2.95, 3.45, 0.42, 0.8, '#f7f6f1'); thing(0.14, 0.6, 4.05, 4.7, 0.75, 0.85, '#f7f6f1'); thing(1.95, 3.15, 4.4, 5.36, 0, 0.1, '#d5e9f0');
  // where you can stand: rooms and doorways, already shrunk by the size of a person
  const walk = [[0.34, 4.45, 0.34, 2.18], [3.61, 4.45, 0.34, 5.11], [5.13, 8.06, 0.34, 3.17], [0.34, 2.93, 2.86, 5.11], [5.13, 8.06, 3.85, 11.69], [4.64, 8.06, 4.64, 11.69],
    [3.61, 5.2, 4.64, 5.11], [0.34, 3.96, 5.79, 11.69], [0.34, 8.06, 12.37, 14.41],
    [4.3, 5.3, 1.58, 1.92], [2.8, 3.8, 3.78, 4.12], [3.65, 3.94, 5.0, 5.9], [5.48, 7.32, 11.5, 12.5], [1.58, 2.62, 11.5, 12.5]];
  const R = 0.28, pet = { a0: 6.75, b0: 6.95, a1: 7.25, b1: 7.95, a: 6.75, b: 6.95 };      // the giant tortoise walks up and down here
  function allowed(x, z) {                                   // can a person stand at this point of the flat?
    const a = x - xE, b = z - zS;
    if (!walk.some(r => a >= r[0] && a <= r[1] && b >= r[2] && b <= r[3])) return false;
    if (solid.some(r => a > r[0] - R && a < r[1] + R && b > r[2] - R && b < r[3] + R)) return false;
    return Math.hypot(a - pet.a, b - pet.b) > 0.75;
  }
  const spot = (a, b) => ({ x: xE + a, z: zS + b });
  const lamps = [spot(6.4, 9.2), spot(6.4, 4.9), spot(2.1, 8.6), spot(2.4, 1.3), spot(1.6, 4.0), spot(6.5, 1.8)];   // ceiling lamps: living room, kitchen, bedroom, hall, bathroom, study
  const flat = { y: floorY, ceiling: WALL, panes, lamps, entry: spot(0.75, 1.15), heading: Math.PI / 2, allowed, pet, spot,
    atDoor: (x, z) => Math.hypot(xE + 0.75 - x, zS + 1.15 - z) < 1.1 };
  return { cx: c.x, cz: c.z, top: TOP, door, bay, obstacles, inZone, shell, inside, flat };
};
