/* The city: tile generation, chunked ground rendering, buildings. */
(function (J) {
  const T = J.T, W = 180, H = 180;
  const G = 0, ROAD = 1, SIDE = 2, BLD = 3, PARK = 4, WATER = 5, HILL = 6, WALL = 7, LM = 8, PLAZA = 9, MONU = 10;
  const SOLID = [0, 0, 0, 1, 0, 1, 1, 1, 1, 0, 1];
  const tiles = new Uint8Array(W * H), zone = new Uint8Array(W * H), mark = new Uint8Array(W * H);
  const hRun = new Uint8Array(W * H), vRun = new Uint8Array(W * H);
  const M = J.map = { W, H, tiles, zone, hRun, vRun, TL: { G, ROAD, SIDE, BLD, PARK, WATER, HILL, WALL, LM, PLAZA, MONU } };

  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const R = mulberry32(1727);
  const hash = (x, y) => { let h = x * 374761393 + y * 668265263; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967296; };
  const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const get = M.get = (x, y) => inb(x, y) ? tiles[y * W + x] : HILL;
  const set = (x, y, v) => { if (inb(x, y)) tiles[y * W + x] = v; };
  const fill = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, v); };

  const ROADS = [
    ['h', 60, 0, 160, 3], ['h', 70, 38, 118, 2], ['h', 78, 64, 104, 2], ['h', 50, 78, 89, 2],
    ['v', 64, 60, 90, 3], ['v', 88, 35, 90, 3], ['v', 75, 60, 90, 2], ['v', 104, 38, 82, 2],
    ['v', 45, 29, 59, 2], ['h', 29, 45, 72, 2],
    ['h', 35, 88, 114, 2], ['v', 113, 10, 36, 2], ['h', 10, 40, 114, 2],
    ['h', 90, 0, 150, 3], ['v', 32, 40, 166, 2], ['v', 56, 90, 166, 3], ['v', 100, 90, 166, 3],
    ['v', 130, 60, 166, 2], ['v', 150, 104, 166, 2], ['h', 104, 56, 150, 2], ['h', 118, 0, 150, 3],
    ['h', 136, 100, 150, 2], ['h', 140, 0, 150, 2], ['h', 166, 20, 172, 3],
  ];
  M.circles = [{ cx: 56, cy: 118, r: 6.6, rc: 2.6, id: 'statue' }, { cx: 100, cy: 166, r: 7, rc: 2.8, id: 'jawahar' }];
  M.gates = []; M.buildings = []; M.trees = [];

  function gen() {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++)
      zone[y * W + x] = (x >= 39 && x <= 117 && y >= 39 && y <= 81) ? 1 : (y < 38 ? 2 : (x >= 138 && y < 58 ? 3 : 0));
    fill(0, 0, W - 1, 37, HILL); fill(138, 0, W - 1, 57, HILL);
    fill(30, 9, 70, 18, G); fill(55, 19, 75, 28, G);
    fill(114, 120, 124, 128, HILL); fill(114, 129, 115, 134, HILL); fill(122, 129, 124, 134, HILL);
    fill(84, 14, 108, 32, WATER);
    fill(38, 13, 52, 17, WATER); // Maota Lake below Amer
    M.lakes = [[84, 14, 108, 32], [38, 13, 52, 17]];
    fill(70, 92, 97, 103, PARK); fill(72, 120, 96, 139, PARK);
    for (let x = 38; x <= 118; x++) { set(x, 38, WALL); set(x, 82, WALL); }
    for (let y = 38; y <= 82; y++) { set(38, y, WALL); set(118, y, WALL); }
    fill(84, 33, 108, 34, PLAZA);

    for (const [o, c, a0, a1, w] of ROADS) {
      const c0 = c - Math.floor((w - 1) / 2), c1 = c0 + w - 1, gate = [];
      for (let a = a0; a <= a1; a++) for (let k = c0; k <= c1; k++) {
        const x = o === 'h' ? a : k, y = o === 'h' ? k : a;
        if (!inb(x, y)) continue;
        if (get(x, y) === WALL) gate.push(a);
        set(x, y, ROAD);
        const isMid = w % 2 ? k === c0 + (w - 1) / 2 : k === c0 + w / 2;
        if (isMid) mark[y * W + x] = (o === 'h' ? 1 : 3) + (w % 2 ? 0 : 1);
      }
      // group wall crossings into gates
      const uniq = [...new Set(gate)].sort((a, b) => a - b);
      let s = null;
      uniq.forEach((a, i) => { if (s === null) s = a; if (uniq[i + 1] !== a + 1) { M.gates.push({ o: o === 'h' ? 'v' : 'h', c: a, a0: c0, a1: c1, at: s }); s = null; } });
    }
    M.gates.forEach(g => { g.c = g.at; });
    fill(61, 57, 67, 63, ROAD); fill(85, 57, 91, 63, ROAD);
    for (const ci of M.circles) {
      for (let y = Math.floor(ci.cy - ci.r - 1); y <= ci.cy + ci.r + 1; y++) for (let x = Math.floor(ci.cx - ci.r - 1); x <= ci.cx + ci.r + 1; x++) {
        const d = Math.hypot(x + .5 - (ci.cx + .5), y + .5 - (ci.cy + .5));
        if (d <= ci.rc) set(x, y, MONU); else if (d <= ci.r) set(x, y, ROAD);
      }
    }
    // landmarks + forecourts + doors
    for (const p of J.PLACES) {
      if (p.kind === 'spot') { p.dx = (p.cx + .5) * T; p.dy = (p.cy + .5) * T; continue; }
      fill(p.x, p.y, p.x + p.w - 1, p.y + p.h - 1, LM);
      let d;
      if (p.face === 'e' || p.face === 'w') {
        const col = p.face === 'w' ? p.x - 1 : p.x + p.w;
        for (let y = p.y; y < p.y + p.h; y++) if (get(col, y) !== ROAD) set(col, y, PLAZA);
        d = p.door || [col + .5, p.y + p.h / 2];
      } else {
        const row = p.face === 'n' ? p.y - 1 : p.y + p.h;
        for (let x = p.x; x < p.x + p.w; x++) if (get(x, row) !== ROAD) set(x, row, PLAZA);
        d = p.door || [p.x + p.w / 2, row + .5];
      }
      p.dx = d[0] * T; p.dy = d[1] * T;
      p.cxp = (p.x + p.w / 2) * T; p.cyp = (p.y + p.h / 2) * T;
    }
    // sidewalks
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === G && (get(x + 1, y) === ROAD || get(x - 1, y) === ROAD || get(x, y + 1) === ROAD || get(x, y - 1) === ROAD)) set(x, y, SIDE);
    // buildings
    const PINK = ['#E08F78', '#D9826B', '#E59A82', '#CF7660', '#E7A08A', '#DB8A72'];
    const PASTEL = ['#EBD9BC', '#E6CFA8', '#F2E4CC', '#E8C9A8', '#DCC7A8', '#E9B9A0', '#C9D7D3', '#F0D9B5', '#E3BFA0'];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (get(x, y) !== G) continue;
      const z = zone[y * W + x];
      const p = z === 1 ? .97 : z === 2 ? .3 : z === 3 ? .05 : .62;
      if (R() > p) { if (z !== 1 && R() < .22) M.trees.push({ x: (x + .5) * T, y: (y + .5) * T, r: 9 + R() * 7 }); continue; }
      let bw = 2 + (R() * (z === 1 ? 2 : 3) | 0), bh = 2 + (R() * (z === 1 ? 2 : 3) | 0);
      const fits = (w, h) => { for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (get(xx, yy) !== G || !inb(xx, yy)) return false; return true; };
      while (bw > 0 && bh > 0 && !fits(bw, bh)) { if (bw >= bh) bw--; else bh--; }
      if (bw < 1 || bh < 1 || (z !== 1 && bw * bh < 2)) continue;
      fill(x, y, x + bw - 1, y + bh - 1, BLD);
      const base = z === 1 ? PINK[R() * PINK.length | 0] : z === 2 ? '#E3C08A' : PASTEL[R() * PASTEL.length | 0];
      const hgt = z === 1 ? 14 + R() * 16 : 10 + R() * 18;
      M.buildings.push({ x, y, w: bw, h: bh, hgt: Math.round(hgt), roof: base, face: J.draw.shade(base, -.18), trim: z === 1 ? '#F7D5C4' : J.draw.shade(base, -.08), win: J.draw.shade(base, -.4), walled: z === 1, tank: R() < .5, tankCol: R() < .5 ? '#2B2B2B' : '#F2F2F2', tankOff: R() * 10, chhatri: z === 1 && R() < .15 && bw > 1 && bh > 1, plant: R() < .25 });
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === PARK && R() < .14) M.trees.push({ x: (x + R()) * T, y: (y + R()) * T, r: 10 + R() * 9 });
    // road run lengths (for traffic junctions)
    for (let y = 0; y < H; y++) { let x = 0; while (x < W) { if (get(x, y) !== ROAD) { x++; continue; } let e = x; while (e < W && get(e, y) === ROAD) e++; for (let k = x; k < e; k++) hRun[y * W + k] = Math.min(255, e - x); x = e; } }
    for (let x = 0; x < W; x++) { let y = 0; while (y < H) { if (get(x, y) !== ROAD) { y++; continue; } let e = y; while (e < H && get(x, e) === ROAD) e++; for (let k = y; k < e; k++) vRun[k * W + x] = Math.min(255, e - y); y = e; } }

    // draw list: buildings + landmarks sorted by bottom edge
    M.drawList = M.buildings.map(b => ({ b, bottom: (b.y + b.h) * T, x0: b.x * T, x1: (b.x + b.w) * T, y0: b.y * T - b.hgt }));
    J.PLACES.filter(p => p.kind !== 'spot').forEach(p => M.drawList.push({ lm: p, bottom: (p.y + p.h) * T, x0: p.x * T - 20, x1: (p.x + p.w) * T + 20, y0: p.y * T - (p.hgt || 0) - 16 }));
    M.circles.forEach(ci => M.drawList.push({ circle: ci, bottom: (ci.cy + 1) * T, x0: (ci.cx - 4) * T, x1: (ci.cx + 4) * T, y0: (ci.cy - 4) * T }));
    M.drawList.sort((a, b) => a.bottom - b.bottom);
    buildMinimap();
  }

  // ---------- queries ----------
  M.tileAt = (px, py) => get(Math.floor(px / T), Math.floor(py / T));
  M.solidAt = (px, py) => SOLID[M.tileAt(px, py)] === 1;
  M.isSolid = t => SOLID[t] === 1;
  M.zoneAt = (px, py) => { const x = Math.floor(px / T), y = Math.floor(py / T); return inb(x, y) ? zone[y * W + x] : 2; };
  M.surface = (t, offroad) => t === ROAD ? 1 : t === PLAZA ? .9 : t === SIDE ? .85 : t === G ? (offroad ? .92 : .68) : t === PARK ? (offroad ? .88 : .6) : .5;

  // ---------- ground chunks ----------
  const CS = 16, CPX = CS * T, cache = new Map();
  const GROUND = { 0: '#E4CFA8', 1: '#E5B49C', 2: '#D8BE8C', 3: '#D8BE8C' };
  function drawTile(c, t, x, y, px, py) {
    const z = zone[y * W + x], h = hash(x, y);
    switch (t) {
      case G: case BLD: case LM:
        c.fillStyle = t === LM ? '#EAD6BA' : GROUND[z]; c.fillRect(px, py, T, T);
        if (h < .35) { c.fillStyle = 'rgba(120,80,40,.08)'; c.fillRect(px + h * 60 % 26, py + h * 97 % 26, 4, 3); }
        break;
      case ROAD:
        c.fillStyle = z === 1 ? '#6A5D58' : '#5E5753'; c.fillRect(px, py, T, T);
        if (h < .12) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(px + 6, py + 8, 14, 9); }
        c.fillStyle = '#CDBFAE';
        if (get(x, y - 1) !== ROAD && get(x, y - 1) !== MONU) c.fillRect(px, py, T, 2);
        if (get(x, y + 1) !== ROAD && get(x, y + 1) !== MONU) c.fillRect(px, py + T - 2, T, 2);
        if (get(x - 1, y) !== ROAD && get(x - 1, y) !== MONU) c.fillRect(px, py, 2, T);
        if (get(x + 1, y) !== ROAD && get(x + 1, y) !== MONU) c.fillRect(px + T - 2, py, 2, T);
        { const m = mark[y * W + x], i = y * W + x; c.fillStyle = '#EFE1B8';
          if ((m === 1 || m === 2) && vRun[i] <= 3) { const yy = m === 1 ? py + T / 2 - 1 : py - 1; c.fillRect(px + 4, yy, 10, 2); c.fillRect(px + 20, yy, 10, 2); }
          if ((m === 3 || m === 4) && hRun[i] <= 3) { const xx = m === 3 ? px + T / 2 - 1 : px - 1; c.fillRect(xx, py + 4, 2, 10); c.fillRect(xx, py + 20, 2, 10); } }
        break;
      case SIDE:
        c.fillStyle = z === 1 ? '#E9A891' : '#D9C7AB'; c.fillRect(px, py, T, T);
        c.fillStyle = 'rgba(80,40,20,.08)'; c.fillRect(px, py + T / 2, T, 1); c.fillRect(px + (y % 2 ? T / 2 : 0), py, 1, T / 2); c.fillRect(px + (y % 2 ? 0 : T / 2), py + T / 2, 1, T / 2);
        break;
      case PARK: c.fillStyle = h < .5 ? '#8DB46B' : '#88AF66'; c.fillRect(px, py, T, T); c.fillStyle = 'rgba(60,100,40,.18)'; c.fillRect(px + h * 40 % 24, py + h * 77 % 24, 3, 5); break;
      case WATER: c.fillStyle = '#4F9DB4'; c.fillRect(px, py, T, T); c.fillStyle = 'rgba(255,255,255,.22)'; if (h < .4) c.fillRect(px + h * 50 % 20, py + h * 80 % 26, 10, 2); break;
      case HILL:
        c.fillStyle = h < .5 ? '#B39465' : '#AE8F60'; c.fillRect(px, py, T, T);
        if (h < .3) { c.fillStyle = '#9C7E52'; c.beginPath(); c.arc(px + 10 + h * 30, py + 14, 5 + h * 10, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(px + 8 + h * 30, py + 12, 3, 0, 7); c.fill(); }
        else if (h > .78) { c.fillStyle = '#7E8F4E'; c.beginPath(); c.arc(px + 16, py + 16, 6, 0, 7); c.arc(px + 22, py + 19, 4, 0, 7); c.fill(); }
        break;
      case WALL:
        c.fillStyle = '#D2735C'; c.fillRect(px, py, T, T); c.fillStyle = '#E58A71';
        for (let i = 0; i < 4; i++) c.fillRect(px + i * 8 + 1, py + 1, 5, 5), c.fillRect(px + 1, py + i * 8 + 1, 5, 5);
        c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(px, py, T, 1);
        break;
      case PLAZA: c.fillStyle = z === 1 ? '#F0C4AE' : '#EEDCC2'; c.fillRect(px, py, T, T); c.strokeStyle = 'rgba(120,80,40,.12)'; c.lineWidth = 1; c.strokeRect(px + .5, py + .5, T / 2, T / 2); c.strokeRect(px + T / 2 + .5, py + T / 2 + .5, T / 2 - 1, T / 2 - 1); break;
      case MONU: c.fillStyle = '#7FAE5F'; c.fillRect(px, py, T, T); break;
    }
  }
  M.CS = CS; M.CPX = CPX;
  M.renderChunk = (cx, cy) => renderChunk(cx, cy, true);
  function renderChunk(cx, cy, noTrees) {
    const cv = document.createElement('canvas'); cv.width = cv.height = CPX;
    const c = cv.getContext('2d');
    for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) { const tx = cx * CS + x, ty = cy * CS + y; drawTile(c, get(tx, ty), tx, ty, x * T, y * T); }
    // trees (flat crowns, light top-left)
    c.save(); c.translate(-cx * CPX, -cy * CPX);
    for (const t of noTrees ? [] : M.trees) {
      if (t.x < cx * CPX - 30 || t.x > (cx + 1) * CPX + 30 || t.y < cy * CPX - 30 || t.y > (cy + 1) * CPX + 30) continue;
      c.fillStyle = 'rgba(52,26,18,.22)'; c.beginPath(); c.arc(t.x + t.r * .45, t.y + t.r * .35, t.r, 0, 7); c.fill();
      c.fillStyle = '#5E8C46'; c.beginPath(); c.arc(t.x, t.y, t.r, 0, 7); c.fill();
      c.fillStyle = '#76A658'; c.beginPath(); c.arc(t.x - t.r * .25, t.y - t.r * .25, t.r * .6, 0, 7); c.fill();
    }
    c.restore();
    return cv;
  }
  M.drawGround = function (c, x0, y0, x1, y1) {
    const a = Math.max(0, Math.floor(x0 / CPX)), b = Math.min(Math.ceil(W / CS) - 1, Math.floor(x1 / CPX));
    const d = Math.max(0, Math.floor(y0 / CPX)), e = Math.min(Math.ceil(H / CS) - 1, Math.floor(y1 / CPX));
    c.fillStyle = '#B39465'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    for (let cy = d; cy <= e; cy++) for (let cx = a; cx <= b; cx++) {
      const k = cx + ',' + cy; let cv = cache.get(k);
      if (cv) { cache.delete(k); cache.set(k, cv); } else { cv = renderChunk(cx, cy); cache.set(k, cv); if (cache.size > 30) cache.delete(cache.keys().next().value); }
      c.drawImage(cv, cx * CPX, cy * CPX);
    }
  };
  M.drawShadows = function (c, x0, y0, x1, y1) {
    c.fillStyle = 'rgba(52,26,18,.2)';
    for (const it of M.drawList) {
      if (it.x1 < x0 - 40 || it.x0 > x1 || it.bottom < y0 || it.y0 > y1 + 40) continue;
      if (it.b) { const b = it.b, s = b.hgt * .5; c.fillRect(b.x * T + s, b.y * T + s * .6, b.w * T, b.h * T); }
      else if (it.lm && it.lm.hgt) { const p = it.lm, s = p.hgt * .5; c.fillRect(p.x * T + s, p.y * T + s * .6, p.w * T, p.h * T); }
    }
  };
  M.drawStructures = function (c, x0, y0, x1, y1, time, night) {
    for (const it of M.drawList) {
      if (it.x1 < x0 || it.x0 > x1 || it.bottom < y0 || it.y0 > y1) continue;
      if (it.b) J.draw.building(c, it.b);
      else if (it.lm) J.draw.landmark(c, it.lm, time, night);
      else J.draw.statue(c, (it.circle.cx + .5) * T, (it.circle.cy + .5) * T, it.circle.id !== 'statue');
    }
    for (const g of M.gates) {
      const gx = (g.o === 'h' ? g.a0 : g.c) * T, gy = (g.o === 'h' ? g.c : g.a0) * T;
      if (gx < x0 - 200 || gx > x1 + 200 || gy < y0 - 200 || gy > y1 + 200) continue;
      J.draw.cityGate(c, g);
    }
  };

  // ---------- minimap base (1px per tile) ----------
  function buildMinimap() {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
    const img = c.createImageData(W, H);
    const COL = { 0: [228, 207, 168], 1: [94, 87, 83], 2: [217, 199, 171], 3: [214, 170, 140], 4: [141, 180, 107], 5: [79, 157, 180], 6: [179, 148, 101], 7: [210, 115, 92], 8: [184, 92, 76], 9: [238, 220, 194], 10: [127, 174, 95] };
    for (let i = 0; i < W * H; i++) { let col = COL[tiles[i]]; if (tiles[i] === 3 && zone[i] === 1) col = [224, 143, 120]; if (tiles[i] === 0 && zone[i] === 1) col = [229, 180, 156]; img.data.set([...col, 255], i * 4); }
    c.putImageData(img, 0, 0); M.mini = cv;
  }

  M.randomTile = function (types, px, py, rMin, rMax) {
    for (let k = 0; k < 14; k++) {
      const a = Math.random() * 6.283, d = rMin + Math.random() * (rMax - rMin);
      const x = Math.floor((px + Math.cos(a) * d) / T), y = Math.floor((py + Math.sin(a) * d) / T);
      if (inb(x, y) && types.includes(get(x, y))) return { x, y };
    }
    return null;
  };
  M.nearestRoad = function (px, py) {
    const tx = Math.floor(px / T), ty = Math.floor(py / T);
    for (let r = 0; r < 12; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; if (get(tx + dx, ty + dy) === ROAD) return { x: tx + dx, y: ty + dy }; }
    return { x: tx, y: ty };
  };

  gen();
})(window.J);
