// Converts osm-area.json + osm-nodes.json (raw OpenStreetMap exports of the whole area) and height-raw.json (terrain heights,
// EU-DEM via OpenTopoData) into map-data.js used by index.html.
// Run: node build-map.mjs
import fs from 'fs';

const LAT0 = 39.7745046, LON0 = -8.8203592;                     // map origin = the "Casa" pin
const BBOX = [39.74270, -8.86840, 39.81240, -8.791725];        // south, west, north, east (the area that was downloaded)
const KX = 111320 * Math.cos(LAT0 * Math.PI / 180), KY = 110574;
const P = g => [+((g.lon - LON0) * KX).toFixed(1), +((g.lat - LAT0) * KY).toFixed(1)];   // metres east, metres north

const DRIVE = new Set(['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential', 'living_street', 'pedestrian', 'service', 'track']);
const d = JSON.parse(fs.readFileSync('osm-area.json', 'utf8'));
const out = { bounds: [...P({ lat: BBOX[0], lon: BBOX[1] }), ...P({ lat: BBOX[2], lon: BBOX[3] })],
  roads: [], buildings: [], water: [], forest: [], industrial: [], green: [], pitch: [], pools: [], streams: [], castle: { walls: [], blocks: [] } };
// The map was downloaded in two goes: first down to OLD_BBOX, later a strip further south (Leiria castle). The game lays out its random details
// (invented houses, trees...) from what came first, so that they did not move when the map grew: "old" says how much of each list that is,
// and f: 1 marks roads and buildings that came later.
const OLD_AREA = 5308, OLD_NODES = 425, OLD_BBOX = [39.74692, -8.829125, 39.78129, -8.791725];
const counts = () => Object.fromEntries(Object.entries(out).filter(([k, v]) => Array.isArray(v) && k !== 'bounds').map(([k, v]) => [k, v.length]));
// Leiria castle: its walls, towers and palace are drawn in stone (castle.blocks, castle.walls), and its footpaths can be walked
const CASTLE = [880, -3110, 1005, -2940];                         // west, south, east, north of the castle hill (m)
const inCastle = pts => pts.some(p => p[0] > CASTLE[0] && p[0] < CASTLE[2] && p[1] > CASTLE[1] && p[1] < CASTLE[3]);
const stone = (t, ring) => !!t.building && (inCastle(ring) || !!t.name && ring.some(p => Math.hypot(p[0] - 940, p[1] + 3030) < 250)) && (t.barrier === 'wall' || t.barrier === 'city_wall' || t.man_made === 'tower' || !!t.castle_type || ['castle', 'ruins', 'city_gate', 'citywalls', 'tower'].includes(t.historic));
const block = (t, ring) => out.castle.blocks.push({ p: ring, n: t.name || '', h: +t.height || (t.man_made === 'tower' ? 16 : t.castle_type === 'palace' ? 12 : t.barrier ? 7 : 9),
  k: t.man_made === 'tower' || t.historic === 'city_gate' ? 'tower' : t.castle_type === 'palace' ? 'palace' : t.historic === 'ruins' ? 'ruin' : 'wall' });
function stitch(members) {                                        // the outer rings of a relation, from the ways that make them up
  const parts = members.filter(m => m.type === 'way' && m.role !== 'inner' && m.geometry).map(m => m.geometry.map(P)), rings = [], key = p => p[0] + ',' + p[1];
  while (parts.length) {
    let cur = parts.pop();
    for (let grew = true; grew && key(cur[0]) !== key(cur[cur.length - 1]);) {
      grew = false;
      for (let i = 0; i < parts.length; i++) {
        const q = parts[i];
        if (key(q[0]) === key(cur[cur.length - 1])) cur = cur.concat(q.slice(1));
        else if (key(q[q.length - 1]) === key(cur[cur.length - 1])) cur = cur.concat(q.slice(0, -1).reverse());
        else continue;
        parts.splice(i, 1); grew = true; break;
      }
    }
    if (cur.length >= 4 && key(cur[0]) === key(cur[cur.length - 1])) rings.push(cur.slice(0, -1));
  }
  return rings;
}

const closedRing = geom => {
  const pts = geom.map(P), n = pts.length;
  if (n < 4 || pts[0][0] !== pts[n - 1][0] || pts[0][1] !== pts[n - 1][1]) return null;
  return pts.slice(0, -1);
};
function area(t, ring, levels, fresh) {
  if (t.building) out.buildings.push({ p: ring, l: levels, ...(stone(t, ring) ? { x: 1 } : {}), ...(fresh ? { f: 1 } : {}) });   // x: drawn in stone, from castle.blocks
  else if (t.leisure === 'swimming_pool') out.pools.push(ring);
  else if (t.natural === 'water') out.water.push(ring);
  else if (t.landuse === 'forest') out.forest.push(ring);
  else if (t.landuse === 'industrial') out.industrial.push(ring);
  else if (t.leisure === 'pitch') out.pitch.push(ring);
  else if (t.landuse === 'grass' || t.landuse === 'meadow' || t.landuse === 'cemetery' || t.leisure === 'park' || t.leisure === 'garden') out.green.push(ring);
}
d.elements.forEach((e, idx) => {
  if (idx === OLD_AREA) out.old = counts();
  const t = e.tags || {}, levels = +t['building:levels'] || 0, fresh = idx >= OLD_AREA;
  if (e.type === 'way' && e.geometry) {
    if (t.highway) {
      const p = e.geometry.map(P);
      if (DRIVE.has(t.highway) && t.area !== 'yes') out.roads.push({ n: t.name || '', t: t.highway, p, ...(t.bridge && t.bridge !== 'no' ? { b: 1 } : t.tunnel === 'yes' || +t.layer < 0 ? { u: 1 } : {}), ...(fresh ? { f: 1 } : {}), ...(t.game_quiet ? { q: 1 } : {}) });   // q: countryside road (few invented houses) · b: a bridge · u: passes under another road
      else if (['footway', 'steps', 'path'].includes(t.highway) && !t.bridge && inCastle(p)) out.roads.push({ n: '', t: 'footway', p, f: 1 });      // the paths inside the castle
      return;
    }
    if (t.barrier && !t.building) { const p = e.geometry.map(P); if (t.barrier === 'city_wall' || t.barrier === 'wall' && inCastle(p)) { out.castle.walls.push({ p, h: t.barrier === 'city_wall' ? 7 : 2.4 }); return; } }
    if (t.waterway) { if (['river', 'stream', 'canal'].includes(t.waterway)) out.streams.push({ w: t.waterway === 'river' ? 12 : t.waterway === 'canal' ? 5 : 2.6, p: e.geometry.map(P) }); return; }
    const ring = closedRing(e.geometry);
    if (ring) { area(t, ring, levels, fresh); if (stone(t, ring)) block(t, ring); }
  } else if (e.type === 'relation' && e.members && !t.highway) {
    for (const m of e.members) if (m.type === 'way' && m.role !== 'inner' && m.geometry) { const ring = closedRing(m.geometry); if (ring) area(t, ring, levels, fresh); }
    for (const ring of stitch(e.members)) if (stone(t, ring)) block(t, ring);
    if (t.historic === 'castle' && !t.building) out.castle.zone = stitch(e.members)[0];
  }
});
if (!out.old) out.old = counts();

// pedestrian crossings, traffic lights and bus stops
out.crossings = []; out.signals = []; out.stops = [];
JSON.parse(fs.readFileSync('osm-nodes.json', 'utf8')).elements.forEach((e, idx) => {
  if (idx === OLD_NODES) Object.assign(out.old, { crossings: out.crossings.length, signals: out.signals.length, stops: out.stops.length });
  const k = { crossing: 'crossings', traffic_signals: 'signals', bus_stop: 'stops' }[e.tags && e.tags.highway];
  if (k) out[k].push(P(e));
});
out.old.bounds = [...P({ lat: OLD_BBOX[0], lon: OLD_BBOX[1] }), ...P({ lat: OLD_BBOX[2], lon: OLD_BBOX[3] })];

// terrain: a grid of heights (rows go north, columns go east), smoothed so that roads do not wobble; stored in decimetres
{
  const H = JSON.parse(fs.readFileSync('height-raw.json', 'utf8')), at = (a, c, r) => a[Math.max(0, Math.min(H.rows - 1, r)) * H.cols + Math.max(0, Math.min(H.cols - 1, c))];
  let h = H.h;
  for (let pass = 0; pass < 2; pass++) {
    const n = new Array(h.length);
    for (let r = 0; r < H.rows; r++) for (let c = 0; c < H.cols; c++) {
      let s = 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) s += at(h, c + dc, r + dr) * (2 - Math.abs(dr)) * (2 - Math.abs(dc));
      n[r * H.cols + c] = s / 16;
    }
    h = n;
  }
  out.height = { x0: H.x0, y0: H.y0, step: H.step, cols: H.cols, rows: H.rows, h: h.map(v => Math.round(v * 10)) };
}

fs.writeFileSync('map-data.js', '// Generated by build-map.mjs from OpenStreetMap data (c) OpenStreetMap contributors, ODbL.\nwindow.MAP = ' + JSON.stringify(out) + ';\n');
console.log('bounds', out.bounds, Object.fromEntries(Object.entries(out).filter(([k]) => Array.isArray(out[k]) && k !== 'bounds').map(([k, v]) => [k, v.length])), 'height grid', out.height.cols + 'x' + out.height.rows);
