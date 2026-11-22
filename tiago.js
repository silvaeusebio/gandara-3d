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
  //  TIAGO'S FLAT, to scale, from the architect's plan (Zambujarte, Bloco C, "Planta Cave 4", 1:100): fraction AQ, T0, "Cv4 Esq C", 96.60 m2.
  //  Rooms and inside measures from the plan: open kitchen + dining 3.95 x 7.90 (30.70 m2), sala 3.00 x 4.95 (15.90 m2),
  //  WC 1.725 x 2.675 (4.60 m2), circulação 4.70 wide (16.10 m2), arrumos 3.20 x 4.525 (15.10 m2), varanda 1.30 deep along the whole front.
  //  Tiago's sketch ("Casa Tiago.png") and Tiago himself say how he uses it: the sala is his bedroom, the arrumos (with a sliding door) his study, the sofa and TV are in the open space.
  //  It stays where it was in the game: second floor of the east half of 546C, the varanda at the BACK of the building, the entrance next to the stairs.
  //  Plan coordinates: x = metres from the inner face of the end wall (the side away from the stairs), d = metres in from the inner face of the
  //  varanda wall (d < 0 is the varanda). The game frame (a east from the entrance wall, b south) is a = XE - x, b = DB - d.
  // =====================================================================================================
  const XE = 8.2, DB = 12.55, VD = 1.3, WALL = 2.6, floorY = groundC + FLOOR0 + FLOOR;
  const xE = X0 + 1.2, zS = Z0 + DEPTH - 0.2 - (DB + 0.2 + VD);  // world x of the entrance wall, world z where b = 0; the varanda rail is 0.2 m inside the back of the block
  const fi = frame(xE, zS, 1, 0, 0, 1), inside = ctx.newBuilder();
  inside.base = floorY;
  const ab = (x0, x1, d0, d1) => [XE - x1, XE - x0, DB - d1, DB - d0];                     // a plan rectangle in game coordinates
  const spot = (a, b) => ({ x: xE + a, z: zS + b }), at = (x, d) => spot(XE - x, DB - d);     // a point, in game / plan coordinates
  const R = 0.28, solid = [];                                // things you cannot walk through, in game coordinates [a0, a1, b0, b1]
  const Q = (x0, x1, d0, d1, y0, y1, col, hard) => {         // a box in plan coordinates; hard: it stops you
    const [a0, a1, b0, b1] = ab(x0, x1, d0, d1);
    if (col) box(inside, fi, a0, a1, y0, y1, b0, b1, C(col));
    if (hard) solid.push([a0, a1, b0, b1]);
  };
  const tile = (x0, x1, d0, d1, col) => { const [a0, a1, b0, b1] = ab(x0, x1, d0, d1);
    inside.quad(fi.pt(a0, 0.012, b0), fi.pt(a1, 0.012, b0), fi.pt(a1, 0.012, b1), fi.pt(a0, 0.012, b1), C(col)); };
  const panes = [], pane = (x0, d0, x1, d1, y0, y1) => panes.push([at(x0, d0), at(x1, d1), at(x1, d1), at(x0, d0)].map((p, i) => [p.x, floorY + (i < 2 ? y0 : y1), p.z]));
  const W = '#f0ede6', wall = (x0, x1, d0, d1) => Q(x0, x1, d0, d1, 0, WALL, W, true);
  const over = (x0, x1, d0, d1, y0 = 2.1) => Q(x0, x1, d0, d1, y0, WALL, W);                 // the bit of wall above a door

  Q(-0.4, XE + 0.2, -VD - 0.2, DB + 0.2, -0.25, 0, '#b9b6ae');                               // the floor slab
  Q(-0.4, XE + 0.2, -VD - 0.2, DB + 0.2, WALL, WALL + 0.15, '#f6f4ef');                      // the ceiling (also over the varanda)
  const wood = '#c9a77a';
  tile(0, 3.95, 0, 7.9, wood); tile(3.95, 5.2, 4.95, 7.9, wood); tile(3.325, 5.2, 7.9, 8.35, wood); tile(3.325, XE, 8.35, 10.65, wood);   // open space, corridor, circulação
  tile(4.075, 7.075, 0, 4.95, '#c4a070'); tile(5.325, 7.075, 5.5, 8.225, '#bcd3d9'); tile(0, 3.2, 8.025, DB, '#bf9d70');   // sala (bedroom), WC, arrumos (study)
  tile(0, 7.075, -VD, 0, '#a9a69d');                                                                                      // varanda
  // outside walls
  wall(-0.4, 0, -VD - 0.2, DB + 0.2);                                         // the end wall of the block
  wall(7.075, 7.425, -VD - 0.2, 8.35);                                        // wall shared with the next flat (0.35)
  wall(XE, XE + 0.2, 8.225, 9.2); wall(XE, XE + 0.2, 10.1, 10.85); over(XE, XE + 0.2, 9.2, 10.1);   // entrance wall, with the front door
  wall(3.2, XE + 0.2, 10.65, 10.85); wall(-0.4, 3.325, DB, DB + 0.2);         // back walls of the circulação and of the arrumos
  // the varanda wall: two glazed doors, the kitchen's and the sala's, each half open
  wall(0, 0.5, -0.2, 0); wall(3.45, 4.4, -0.2, 0); wall(6.75, 7.075, -0.2, 0); over(0.5, 3.45, -0.2, 0); over(4.4, 6.75, -0.2, 0);
  for (const [o0, o1, g1] of [[0.5, 3.45, 2.0], [4.4, 6.75, 5.6]]) {
    Q(g1, o1, -0.12, -0.08, 0, 2.1, null, true); pane(g1, -0.1, o1, -0.1, 0.05, 2.05);           // the fixed half: glass
    for (const x of [o0, g1 - 0.02, o1 - 0.04]) Q(x, x + 0.04, -0.14, -0.06, 0, 2.1, '#3a3d42');
  }
  // inside walls
  wall(3.95, 4.075, 0, 4.95);                                                                      // bedroom | open space: the sofa stands against it
  wall(5.2, 7.075, 4.95, 5.5); over(4.075, 5.2, 4.95, 5.075);                                      // sala | WC, and the sala's door from the corridor
  wall(5.2, 5.325, 5.5, 6.9); wall(5.2, 5.325, 7.7, 8.35); over(5.2, 5.325, 6.9, 7.7);            // WC door, from the corridor
  wall(5.2, XE, 8.225, 8.35);                                                                      // WC | circulação
  wall(0, 3.325, 7.9, 8.025);                                                                      // kitchen | arrumos
  wall(3.2, 3.325, 8.025, 8.45); wall(3.2, 3.325, 10.05, DB); over(3.2, 3.325, 8.45, 10.05);       // study door: a sliding door, 1.60 wide, open
  Q(3.15, 3.195, 10.1, 11.7, 0, 2.1, '#d8d2c4', true); Q(3.15, 3.195, 8.45, 11.75, 2.1, 2.16, '#9aa0a6');      // its leaf, pushed back inside the study, and the rail
  Q(XE + 0.04, XE + 0.12, 9.2, 10.1, 0, 2.1, '#7a4a2c'); Q(XE, XE + 0.04, 9.95, 10.03, 0.98, 1.06, '#c9ccd1');   // the front door, with its handle
  // the varanda: glass rail with a handrail, walls to the neighbours
  Q(0, 7.075, -VD - 0.06, -VD, 1.0, 1.06, '#dfe6ea', true); Q(0, 7.075, -VD - 0.06, -VD, 0, 0.08, '#3a3d42');
  pane(0, -VD - 0.03, 7.075, -VD - 0.03, 0.08, 1.0);
  // ---------- furniture: where Tiago's sketch has it, at real size ----------
  const thing = (x0, x1, d0, d1, y0, y1, col, hard = true) => Q(x0, x1, d0, d1, y0, y1, col, hard);
  // living corner of the open space: TV on the end wall, L-shaped sofa with its back against the bedroom wall, facing the TV
  thing(0, 0.45, 1.2, 3.3, 0, 0.5, '#5a4632'); Q(0.13, 0.2, 1.55, 2.95, 0.62, 1.5, '#111316');
  thing(3.1, 3.95, 0.7, 3.0, 0, 0.42, '#5f6b7a'); thing(2.25, 3.1, 2.4, 3.0, 0, 0.42, '#5f6b7a');   // the chaise longue on his left
  Q(3.75, 3.95, 0.7, 3.0, 0.42, 0.85, '#515c69'); Q(2.25, 3.1, 2.8, 3.0, 0.42, 0.85, '#515c69');
  for (let d = 0.75; d < 2.7; d += 0.68) Q(3.15, 3.7, d, d + 0.62, 0.42, 0.52, '#74808f');
  Q(2.3, 3.1, 2.42, 2.75, 0.42, 0.52, '#74808f');
  // dining table (mesa): against the bedroom wall, just past the sofa, with three chairs
  thing(3.05, 3.95, 3.3, 4.9, 0.7, 0.76, '#a8794a');
  for (const [x, d] of [[3.12, 3.37], [3.8, 3.37], [3.12, 4.75], [3.8, 4.75]]) Q(x, x + 0.08, d, d + 0.08, 0, 0.7, '#8a6238');
  const chair = (x0, d0, bx0, bx1, bd0, bd1) => {            // a chair: 0.44 square seat, and its back on the side given
    thing(x0, x0 + 0.44, d0, d0 + 0.44, 0.44, 0.49, '#8a6238');
    for (const [x, d] of [[x0 + 0.02, d0 + 0.02], [x0 + 0.37, d0 + 0.02], [x0 + 0.02, d0 + 0.37], [x0 + 0.37, d0 + 0.37]]) Q(x, x + 0.05, d, d + 0.05, 0, 0.44, '#6b4f2e');
    Q(bx0, bx1, bd0, bd1, 0.49, 0.95, '#8a6238');
  };
  for (const d0 of [3.48, 4.28]) chair(2.55, d0, 2.55, 2.6, d0, d0 + 0.44);                   // two along the long side, facing the wall
  chair(3.28, 5.0, 3.28, 3.72, 5.39, 5.44);                                                  // one at the end, on the kitchen side
  // kitchen (cozinha): L of counters, hob, sink, tall fridge
  thing(0, 0.62, 5.3, 7.9, 0, 0.9, '#ecebe6'); thing(0.62, 2.9, 7.28, 7.9, 0, 0.9, '#ecebe6');
  Q(0, 0.65, 5.3, 7.9, 0.9, 0.94, '#3a3d42'); Q(0.62, 2.9, 7.25, 7.9, 0.9, 0.94, '#3a3d42');
  Q(0.06, 0.56, 5.8, 6.45, 0.94, 0.96, '#17191c'); Q(1.4, 2.1, 7.36, 7.82, 0.94, 0.96, '#9aa0a6');
  thing(2.9, 3.55, 7.25, 7.9, 0, 2.0, '#d9dbdc');
  // the sala is his bedroom (quarto): bed with its head on the wall to the next flat, bedside table, wardrobe by the door
  thing(5.05, 7.0, 1.7, 3.3, 0, 0.45, '#e8e4dc'); Q(6.93, 7.075, 1.65, 3.35, 0, 0.95, '#8a6238'); Q(5.05, 6.35, 1.7, 3.3, 0.45, 0.5, '#6f8fb0');
  Q(6.4, 6.88, 1.8, 2.45, 0.45, 0.56, '#f7f6f1'); Q(6.4, 6.88, 2.55, 3.2, 0.45, 0.56, '#f7f6f1');
  thing(6.6, 7.05, 1.15, 1.6, 0, 0.5, '#8a6238');
  thing(5.3, 7.0, 4.4, 4.95, 0, 2.1, '#d8cfbf'); Q(6.135, 6.165, 4.35, 4.4, 0.1, 2.0, '#a48f6c');
  // the arrumos is his study (escritório), behind a sliding door: desk and chair, shelves at the back
  thing(0.05, 0.75, 9.6, 11.4, 0.7, 0.75, '#b08a5a');
  for (const [x, d] of [[0.1, 9.66], [0.63, 9.66], [0.1, 11.28], [0.63, 11.28]]) Q(x, x + 0.06, d, d + 0.06, 0, 0.7, '#6b4f2e');
  Q(0.18, 0.25, 10.1, 10.9, 0.75, 1.2, '#111316');
  thing(0.95, 1.4, 10.28, 10.71, 0.4, 0.48, '#2a2d31'); Q(1.34, 1.4, 10.28, 10.71, 0.48, 0.95, '#2a2d31'); Q(1.15, 1.21, 10.46, 10.52, 0, 0.4, '#5b6066');
  thing(0.3, 2.8, 12.15, DB, 0, 2.0, '#d8cfbf');
  for (const y of [0.5, 1.0, 1.5]) Q(0.3, 2.8, 12.1, 12.15, y, y + 0.03, '#a48f6c');
  // ---------- where you can stand: inside the walls, and not on top of anything solid ----------
  const [fa0, fa1, fb0, fb1] = ab(0, XE, -VD, DB);
  const pet = { a0: XE - 1.1, b0: DB - 5.7, a1: XE - 1.1, b1: DB - 6.8, a: XE - 1.1, b: DB - 5.7 };   // the giant tortoise walks up and down the kitchen
  function allowed(x, z) {                                   // can a person stand at this point of the flat?
    const a = x - xE, b = z - zS;
    if (a < fa0 + R || a > fa1 - R || b < fb0 + R || b > fb1 - R) return false;
    if (solid.some(r => a > r[0] - R && a < r[1] + R && b > r[2] - R && b < r[3] + R)) return false;
    return Math.hypot(a - pet.a, b - pet.b) > 0.75;
  }
  const lamps = [at(2.0, 2.3), at(1.8, 6.2), at(5.6, 2.5), at(5.8, 9.5), at(6.2, 6.9), at(1.6, 10.3)];   // ceiling lamps: living, kitchen, bedroom, circulação, WC, study
  const entry = at(XE - 0.6, 9.65);
  const flat = { y: floorY, ceiling: WALL, panes, lamps, entry, heading: Math.PI / 2, allowed, pet, spot,
    sofa: at(3.45, 2.0),                                      // where Tiago sits (facing the TV, which is towards +a: heading pi/2)
    tv: { at: at(0.205, 2.25), light: at(0.9, 2.25) },       // the picture on the TV, and the light it throws
    follow: at(XE - 1.3, 9.9), start: at(1.6, 1.9),          // where Tiago stands when you come in with him, and when he gets up from the sofa
    atDoor: (x, z) => Math.hypot(entry.x - x, entry.z - z) < 1.1 };
  return { cx: c.x, cz: c.z, top: TOP, door, bay, obstacles, inZone, shell, inside, flat };
};
