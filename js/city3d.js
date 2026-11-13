/* 3D world: three.js scene built from the tile map. 1 tile = 4 units, 1 sim px = 1/8 unit. +x east, +z south. */
(function (J) {
  const R = J.r3 = {};
  const S = 1 / 8, U = 4; // px→units, tile→units
  const M = J.map, TL = M.TL, T = J.T;
  const mobile = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  R.mobile = mobile;
  let renderer, scene, camera, sun, hemi, headlight, built = false;
  const matCache = {}, geoCache = {};
  const tmpV = new THREE.Vector3();

  // ---------------- helpers ----------------
  function mat(col, o) { const k = col + (o ? JSON.stringify(o) : ''); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial(Object.assign({ color: col }, o || {}))); }
  function bmat(col, o) { const k = 'b' + col + (o ? JSON.stringify(o) : ''); return matCache[k] || (matCache[k] = new THREE.MeshBasicMaterial(Object.assign({ color: col }, o || {}))); }
  function boxG(w, h, d) { const k = 'b' + w.toFixed(2) + h.toFixed(2) + d.toFixed(2); if (!geoCache[k]) { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); geoCache[k] = g; } return geoCache[k]; }
  function cylG(rt, rb, h, seg) { const k = 'c' + rt + ',' + rb + ',' + h + ',' + seg; if (!geoCache[k]) { const g = new THREE.CylinderGeometry(rt, rb, h, seg || 12); g.translate(0, h / 2, 0); geoCache[k] = g; } return geoCache[k]; }
  function domeG(r) { const k = 'd' + r; if (!geoCache[k]) geoCache[k] = new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); return geoCache[k]; }
  function sphG(r) { const k = 's' + r; if (!geoCache[k]) geoCache[k] = new THREE.SphereGeometry(r, 10, 8); return geoCache[k]; }
  function wheelG(r, w) { const k = 'w' + r + ',' + w; if (!geoCache[k]) { const g = new THREE.CylinderGeometry(r, r, w, 10); g.rotateX(Math.PI / 2); geoCache[k] = g; } return geoCache[k]; }
  function add(parent, geo, m, x, y, z, shadow) { const mesh = new THREE.Mesh(geo, typeof m === 'string' ? mat(m) : m); mesh.position.set(x || 0, y || 0, z || 0); if (shadow !== false) { mesh.castShadow = true; mesh.receiveShadow = true; } parent.add(mesh); return mesh; }
  const box = (p, w, h, d, m, x, y, z, sh) => add(p, boxG(w, h, d), m, x, y, z, sh);
  const cyl = (p, rt, rb, h, m, x, y, z, seg) => add(p, cylG(rt, rb, h, seg), m, x, y, z);
  const dome = (p, r, m, x, y, z) => add(p, domeG(r), m, x, y, z);
  const shade = (c, a) => J.draw.shade(c, a);
  function canvasTex(w, h, fn, repeat) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.anisotropy = 4; return t; }

  // ---------------- textures ----------------
  let TX = {};
  function makeTextures() {
    const arch = (c, x, y, w, h) => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); };
    TX.facade = canvasTex(64, 64, (c) => {
      c.fillStyle = '#e9e4df'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#d6cfc8'; c.fillRect(0, 30, 64, 3); c.fillRect(0, 61, 64, 3);
      [[8, 6], [38, 6], [8, 37], [38, 37]].forEach(([x, y]) => { c.fillStyle = '#ffffff'; arch(c, x - 2, y - 2, 22, 24); c.fill(); c.fillStyle = '#4a3029'; arch(c, x, y, 18, 20); c.fill(); });
    });
    TX.facadeLit = canvasTex(64, 64, (c) => {
      c.fillStyle = '#000'; c.fillRect(0, 0, 64, 64);
      [[8, 6, 1], [38, 6, 0], [8, 37, 1], [38, 37, 1]].forEach(([x, y, on]) => { if (!on) return; c.fillStyle = '#ffc56a'; arch(c, x, y, 18, 20); c.fill(); });
    });
    TX.jharokha = canvasTex(64, 64, (c) => {
      c.fillStyle = '#f2ece8'; c.fillRect(0, 0, 64, 64);
      for (let i = 0; i < 2; i++) { const x = 6 + i * 32; c.fillStyle = '#ffffff'; arch(c, x - 2, 8, 24, 44); c.fill(); c.fillStyle = '#7d2f22'; arch(c, x, 10, 20, 40); c.fill(); c.fillStyle = '#ffffff'; c.fillRect(x - 3, 50, 26, 4); c.fillStyle = '#c9b8b0'; c.fillRect(x + 9, 10, 2, 40); }
      c.fillStyle = '#ddd2cc'; c.fillRect(0, 58, 64, 6);
    }, true);
    TX.arcade = canvasTex(64, 64, (c) => {
      c.fillStyle = '#f3ede4'; c.fillRect(0, 0, 64, 64);
      c.fillStyle = '#ffffff'; arch(c, 6, 8, 52, 56); c.fill(); c.fillStyle = '#6b4a3a'; arch(c, 10, 12, 44, 52); c.fill();
    }, true);
    TX.glass = canvasTex(64, 64, (c) => {
      const g = c.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, '#bfe3f2'); g.addColorStop(1, '#4f86a6'); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
      c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(0, 0, 64, 2); c.fillRect(0, 0, 2, 64);
      c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(10, 64); c.lineTo(34, 0); c.lineTo(44, 0); c.lineTo(20, 64); c.fill();
    }, true);
    TX.stripes = {};
    TX.corrugated = canvasTex(32, 32, (c) => { c.fillStyle = '#9fb3c0'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#7d93a2'; for (let i = 0; i < 32; i += 4) c.fillRect(i, 0, 2, 32); }, true);
    TX.stairs = canvasTex(128, 128, (c) => {
      c.fillStyle = '#d9b27c'; c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 6; i++) { const ins = i * 9; c.strokeStyle = i % 2 ? '#a77d4c' : '#efd3a0'; c.lineWidth = 4; c.strokeRect(ins + 2, ins + 2, 124 - ins * 2, 124 - ins * 2); }
      c.strokeStyle = 'rgba(120,80,40,.4)'; c.lineWidth = 1; for (let i = -128; i < 128; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.stroke(); c.beginPath(); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); }
      c.fillStyle = '#4f9db4'; c.fillRect(52, 52, 24, 24);
    });
  }
  function stripeTex(col) {
    if (TX.stripes[col]) return TX.stripes[col];
    return (TX.stripes[col] = canvasTex(64, 16, (c) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#FFF6EC' : col; c.fillRect(i * 8, 0, 8, 16); } c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 13, 64, 3); }, true));
  }
  function signTex(title, sub, bg) {
    return canvasTex(512, 160, (c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.strokeStyle = '#F2A41C'; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
      c.fillStyle = '#FFF6EC'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 54; c.font = `${fs}px "Rozha One", Georgia, serif`; while (c.measureText(title).width > w - 50 && fs > 22) { fs -= 2; c.font = `${fs}px "Rozha One", Georgia, serif`; }
      c.fillText(title, w / 2, sub ? 64 : h / 2 + 4);
      if (sub) { c.font = '600 26px Mukta, sans-serif'; c.fillStyle = '#F6D58A'; c.fillText(sub, w / 2, 118); }
    });
  }
  function facadeMat(tex, col, rx, ry) { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(rx)), Math.max(1, Math.round(ry))); return new THREE.MeshLambertMaterial({ map: t, color: col }); }
  // box whose front (+z) face is textured
  function fbox(p, w, h, d, col, tex, x, y, z, bayW) {
    const plain = mat(col), f = facadeMat(tex, col, w / (bayW || 4), h / (bayW || 4));
    const m = new THREE.Mesh(boxG(w, h, d), [plain, plain, plain, plain, f, plain]);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m;
  }

  // ---------------- terrain ----------------
  function hash2(a, b) { let n = a * 374761393 + b * 668265263; n = (n ^ (n >> 13)) * 1274126177; return ((n ^ (n >> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = t => t * t * (3 - 2 * t);
    const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1), u = s(xf), v = s(yf);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  R.heightAt = function (ix, iy) {
    if (!(M.get(ix - 1, iy - 1) === TL.HILL && M.get(ix, iy - 1) === TL.HILL && M.get(ix - 1, iy) === TL.HILL && M.get(ix, iy) === TL.HILL)) return 0;
    let n = 0, k = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { k++; if (M.get(ix + dx, iy + dy) === TL.HILL) n++; }
    const edge = Math.pow(n / k, 1.6);
    return (3 + 22 * (.6 * vnoise(ix * .09, iy * .09) + .4 * vnoise(ix * .27, iy * .27))) * edge;
  };
  function buildGround() {
    const N = mobile ? 2048 : 4096, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const c = cv.getContext('2d'), sc = N / (M.W * T), CPX = M.CPX, nc = Math.ceil(M.W / M.CS);
    for (let cy = 0; cy < nc; cy++) for (let cx = 0; cx < nc; cx++) c.drawImage(M.renderChunk(cx, cy), cx * CPX * sc, cy * CPX * sc, CPX * sc + 1, CPX * sc + 1);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = new THREE.PlaneGeometry(M.W * U, M.H * U, M.W, M.H); geo.rotateX(-Math.PI / 2); geo.translate(M.W * U / 2, 0, M.H * U / 2);
    const pos = geo.attributes.position;
    for (let iy = 0; iy <= M.H; iy++) for (let ix = 0; ix <= M.W; ix++) pos.setY(iy * (M.W + 1) + ix, R.heightAt(ix, iy));
    geo.computeVertexNormals();
    const g = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex })); g.receiveShadow = true; scene.add(g);
    // desert beyond the map
    const out = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), mat('#D8BE8C')); out.rotation.x = -Math.PI / 2; out.position.set(M.W * U / 2, -.05, M.H * U / 2); scene.add(out);
    // lake
    const w = new THREE.Mesh(new THREE.PlaneGeometry(25 * U, 19 * U), new THREE.MeshPhongMaterial({ color: '#4F9DB4', transparent: true, opacity: .82, shininess: 90, specular: '#ffffff' }));
    w.rotation.x = -Math.PI / 2; w.position.set(96.5 * U, .25, 23.5 * U); scene.add(w);
  }

  // ---------------- buildings, walls, trees (instanced) ----------------
  const dummy = new THREE.Object3D();
  R.bHeight = b => 5 + b.hgt * .32;
  function buildBlocks() {
    const bs = M.buildings, geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, .5, 0);
    R.sideMat = new THREE.MeshLambertMaterial({ map: TX.facade, emissiveMap: TX.facadeLit, emissive: new THREE.Color(0, 0, 0) });
    const top = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    const im = new THREE.InstancedMesh(geo, [R.sideMat, R.sideMat, top, top, R.sideMat, R.sideMat], bs.length);
    const col = new THREE.Color(), tanks = [], domes = [];
    bs.forEach((b, i) => {
      const h = R.bHeight(b);
      dummy.position.set((b.x + b.w / 2) * U, 0, (b.y + b.h / 2) * U); dummy.scale.set(b.w * U - .4, h, b.h * U - .4); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix); im.setColorAt(i, col.set(b.roof));
      if (b.tank) tanks.push([(b.x + b.w) * U - 1.6 - b.tankOff * .1, h, b.y * U + 1.8, b.tankCol]);
      if (b.chhatri) domes.push([b.x * U + 2, h, b.y * U + 2, b.trim]);
    });
    im.castShadow = im.receiveShadow = true; scene.add(im);
    const tg = new THREE.CylinderGeometry(.8, .8, 1.5, 8); tg.translate(0, .75, 0);
    const ti = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ color: '#ffffff' }), tanks.length);
    tanks.forEach(([x, y, z, c], i) => { dummy.position.set(x, y, z); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); ti.setMatrixAt(i, dummy.matrix); ti.setColorAt(i, col.set(c)); });
    ti.castShadow = true; scene.add(ti);
    const di = new THREE.InstancedMesh(new THREE.SphereGeometry(1.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#F7D5C4' }), domes.length);
    domes.forEach(([x, y, z], i) => { dummy.position.set(x, y, z); dummy.updateMatrix(); di.setMatrixAt(i, dummy.matrix); });
    di.castShadow = true; scene.add(di);
    // city wall
    const walls = []; for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) if (M.get(x, y) === TL.WALL) walls.push([x, y]);
    const wg = new THREE.BoxGeometry(U, 6.5, U); wg.translate(0, 3.25, 0);
    const wi = new THREE.InstancedMesh(wg, mat('#D2735C'), walls.length);
    const mg = new THREE.BoxGeometry(1.4, 1.2, 1.4); mg.translate(0, .6, 0);
    const mi = new THREE.InstancedMesh(mg, mat('#E58A71'), walls.length * 2);
    walls.forEach(([x, y], i) => {
      dummy.position.set((x + .5) * U, 0, (y + .5) * U); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); wi.setMatrixAt(i, dummy.matrix);
      const horiz = M.get(x + 1, y) === TL.WALL || M.get(x - 1, y) === TL.WALL;
      for (let k = 0; k < 2; k++) { dummy.position.set((x + .5) * U + (horiz ? (k - .5) * 2 : 0), 6.5, (y + .5) * U + (horiz ? 0 : (k - .5) * 2)); dummy.updateMatrix(); mi.setMatrixAt(i * 2 + k, dummy.matrix); }
    });
    wi.castShadow = wi.receiveShadow = true; mi.castShadow = true; scene.add(wi); scene.add(mi);
    // trees
    const tr = M.trees, trunkG = new THREE.CylinderGeometry(.25, .35, 2.4, 6); trunkG.translate(0, 1.2, 0);
    const crownG = new THREE.IcosahedronGeometry(1, 0);
    const tri = new THREE.InstancedMesh(trunkG, mat('#7A5C3E'), tr.length), cri = new THREE.InstancedMesh(crownG, new THREE.MeshPhongMaterial({ color: '#ffffff', flatShading: true, shininess: 0 }), tr.length);
    tr.forEach((t, i) => {
      const r = t.r * S * 1.5;
      dummy.position.set(t.x * S, 0, t.y * S); dummy.scale.set(1, 1 + r * .3, 1); dummy.rotation.set(0, i, 0); dummy.updateMatrix(); tri.setMatrixAt(i, dummy.matrix);
      dummy.position.set(t.x * S, 2.4 + r * .8, t.y * S); dummy.scale.set(r, r * .9, r); dummy.updateMatrix(); cri.setMatrixAt(i, dummy.matrix);
      cri.setColorAt(i, col.set(['#5E8C46', '#6E9A4F', '#4F7F3C', '#7FA85A'][i % 4]));
    });
    tri.castShadow = cri.castShadow = true; scene.add(tri); scene.add(cri);
    // gates in the city wall
    for (const g of M.gates) {
      const grp = new THREE.Group(), pink = '#E58A71', deep = '#D2735C', span = (g.a1 - g.a0 + 1) * U;
      const mid = ((g.a0 + g.a1 + 1) / 2) * U, c = (g.c + .5) * U;
      [-1, 1].forEach(sd => { const off = mid + sd * (span / 2 + 2.2); const [x, z] = g.o === 'h' ? [off, c] : [c, off]; box(grp, 4.4, 11, 4.4, deep, x, 0, z); dome(grp, 2, mat('#F2B39E'), x, 11.6, z); box(grp, 5, .6, 5, '#F7D5C4', x, 11, z); });
      const [bw, bd] = g.o === 'h' ? [span + 4, 4.4] : [4.4, span + 4], [bx, bz] = g.o === 'h' ? [mid, c] : [c, mid];
      box(grp, bw, 3, bd, pink, bx, 8, bz); box(grp, bw + .6, .5, bd + .6, '#F7D5C4', bx, 11, bz); dome(grp, 2.3, mat('#F2B39E'), bx, 11.5, bz);
      scene.add(grp);
    }
  }

  // ---------------- landmarks ----------------
  function placeGroup(p) {
    const g = new THREE.Group(), face = p.face || 's';
    const W = p.w * U, D = p.h * U, cx = (p.x + p.w / 2) * U, cz = (p.y + p.h / 2) * U;
    g.position.set(cx, 0, cz); g.rotation.y = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[face];
    const ew = face === 'e' || face === 'w';
    return { g, w: ew ? D : W, d: ew ? W : D };
  }
  const H3 = p => 6 + (p.hgt || 0) * .36;
  const BUILD = {
    hawa(g, w, d, p) {
      box(g, w, 8, d * .55, '#D9735C', 0, 0, -d * .2);
      const tiers = [[1, 4.4], [.86, 4], [.68, 3.8], [.5, 3.6], [.32, 3.4]]; let y = 0;
      tiers.forEach(([k, h], i) => {
        const tw = w * k, td = 5 - i * .6;
        fbox(g, tw, h, td, i % 2 ? '#E58A71' : '#DA6F57', TX.jharokha, 0, y, d / 2 - td / 2 - .2 - i * .3, 2.2);
        box(g, tw + .6, .35, td + .4, '#F7D5C4', 0, y + h, d / 2 - td / 2 - .2 - i * .3);
        const n = Math.max(2, Math.round(tw / 4)); for (let j = 0; j < n; j++) dome(g, .7, mat('#F2B39E'), -tw / 2 + (j + .5) * tw / n, y + h + .3, d / 2 - .8 - i * .3);
        y += h;
      });
      dome(g, 1.4, mat('#F2B39E'), 0, y + .3, d / 2 - 3);
      cyl(g, .12, .12, 2, '#E2A33A', 0, y + 1.5, d / 2 - 3);
    },
    fort(g, w, d, p) {
      const h = H3(p) * .7, col = p.col, dk = shade(col, -.15);
      box(g, w, h, 2.5, dk, 0, 0, d / 2 - 1.25); box(g, w, h, 2.5, dk, 0, 0, -d / 2 + 1.25);
      box(g, 2.5, h, d, dk, -w / 2 + 1.25, 0, 0); box(g, 2.5, h, d, dk, w / 2 - 1.25, 0, 0);
      for (let x = -w / 2 + 1; x < w / 2; x += 2.4) { box(g, 1.2, 1, 2.5, col, x, h, d / 2 - 1.25); box(g, 1.2, 1, 2.5, col, x, h, -d / 2 + 1.25); }
      fbox(g, w * .55, h * 1.6, d * .5, col, TX.arcade, 0, 0, 0, 3);
      [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([x, z]) => { cyl(g, 2.4, 2.8, h + 2, dk, x, 0, z); dome(g, 2.2, mat(shade(col, .25)), x, h + 2, z); });
      for (let i = -1; i <= 1; i++) { cyl(g, 1.2, 1.2, 2, col, i * w * .15, h * 1.6, 0, 8); dome(g, 1.4, mat('#F3E3C3'), i * w * .15, h * 1.6 + 2, 0); }
      box(g, 6, h * .8, 1, '#5A3A2A', 0, 0, d / 2 + .1, false);
    },
    palace(g, w, d, p) {
      const h = H3(p) * .8, col = p.col;
      fbox(g, w, h, d * .25, col, TX.arcade, 0, 0, d / 2 - d * .125, 3.2);
      fbox(g, w, h, d * .25, col, TX.arcade, 0, 0, -d / 2 + d * .125, 3.2);
      box(g, w * .2, h, d * .5, col, -w / 2 + w * .1, 0, 0); box(g, w * .2, h, d * .5, col, w / 2 - w * .1, 0, 0);
      box(g, w * .6, .2, d * .5, '#8DB46B', 0, 0, 0); cyl(g, 1.5, 1.5, .5, '#7FB5C8', 0, 0, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { cyl(g, 1.6, 1.6, 2.2, '#F6E6CC', a * (w / 2 - 2), h, b * (d / 2 - 2), 8); dome(g, 1.8, mat('#F6E6CC'), a * (w / 2 - 2), h + 2.2, b * (d / 2 - 2)); });
      box(g, w + .6, .6, 1, '#D97B66', 0, h, d / 2 - .3);
      dome(g, 2.4, mat('#F6E6CC'), 0, h, d / 2 - d * .125);
    },
    albert(g, w, d, p) {
      const h = H3(p) * .75, col = p.col;
      fbox(g, w, h, d, col, TX.arcade, 0, 0, 0, 3);
      box(g, w + .6, .6, d + .6, '#FFF6E6', 0, h, 0);
      cyl(g, 5, 5, 4, col, 0, h, 0, 16); dome(g, 5.2, mat('#F4E6C8'), 0, h + 4, 0); cyl(g, .2, .2, 2.5, '#E2A33A', 0, h + 9, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { cyl(g, 1.6, 1.6, 3, col, a * (w / 2 - 2.5), h, b * (d / 2 - 2.5), 8); dome(g, 1.8, mat('#F4E6C8'), a * (w / 2 - 2.5), h + 3, b * (d / 2 - 2.5)); });
      box(g, w * .3, h * .7, 3, col, 0, 0, d / 2 + 1.5);
    },
    temple(g, w, d, p) {
      const h = H3(p) * .55, col = p.col;
      box(g, w, 2, d, shade(col, -.08), 0, 0, 0); fbox(g, w * .8, h, d * .7, col, TX.arcade, 0, 2, 0, 2.5);
      [[-w * .25, 1], [0, 1.45], [w * .25, 1]].forEach(([x, s]) => {
        for (let k = 0; k < 4; k++) cyl(g, (3.2 - k * .7) * s * .55, (3.4 - k * .7) * s, 2.2 * s, k % 2 ? shade(col, .1) : col, x, 2 + h + k * 2.2 * s, 0, 12);
        add(g, cylG(0, .6 * s, 2 * s, 8), '#E2A33A', x, 2 + h + 8.8 * s, 0);
      });
      cyl(g, .1, .1, 4, '#8A5A3B', 0, 2 + h + 14, 0); box(g, 2, 1.2, .1, '#E07B1A', 1, 2 + h + 16.5, 0, false);
      box(g, w * .4, .8, 4, shade(col, -.05), 0, 0, d / 2 + 2);
    },
    shopBase(g, w, d, p, kind) {
      const h = H3(p) * (kind === 'cafe' ? .9 : .8), col = p.col;
      fbox(g, w, h, d, col, kind === 'cafe' ? TX.arcade : TX.facade, 0, 0, 0, 3);
      box(g, w + .4, .5, d + .4, shade(col, -.2), 0, h, 0);
      const aw = new THREE.Mesh(boxG(w * .96, .25, 2.6), new THREE.MeshLambertMaterial({ map: (() => { const t = stripeTex(p.awn || '#F2A41C').clone(); t.needsUpdate = true; t.repeat.set(Math.round(w / 3), 1); return t; })() }));
      aw.position.set(0, 3.4, d / 2 + 1.1); aw.rotation.x = .28; aw.castShadow = true; g.add(aw);
      box(g, w * .5, 2.9, .1, '#3A2A22', 0, 0, d / 2 + .02, false);
      return h;
    },
    shop(g, w, d, p) {
      const h = BUILD.shopBase(g, w, d, p, 'shop');
      // counter + steaming kadhai for food
      if (p.food) { box(g, w * .7, 1.1, 1.2, '#8A5A3B', 0, 0, d / 2 + 2.6); cyl(g, .9, .6, .5, '#2B2B2B', -w * .2, 1.1, d / 2 + 2.6, 12); cyl(g, .9, .9, .05, '#C98A3A', -w * .2, 1.55, d / 2 + 2.6, 12); }
      dome(g, 1.2, mat(shade(p.col, .2)), -w / 2 + 1.5, h + .5, -d / 2 + 1.5);
    },
    cafe(g, w, d, p) {
      const h = BUILD.shopBase(g, w, d, p, 'cafe');
      // outdoor tables with umbrellas
      for (let i = 0; i < 2; i++) { const x = (i - .5) * w * .5; cyl(g, .7, .7, .9, '#FFF6EC', x, 0, d / 2 + 3.4, 10); cyl(g, .06, .06, 2.6, '#555', x, 0, d / 2 + 3.4, 6); add(g, cylG(0, 1.8, .8, 10), mat(p.awn || '#2F5D50'), x, 2.4, d / 2 + 3.4); }
      for (let i = 0; i < 4; i++) add(g, sphG(.7), '#5E8C46', -w / 2 + 1.2 + i * (w - 2.4) / 3, h + .6, d / 2 - 1);
    },
    bazaar(g, w, d, p) {
      const h = BUILD.shopBase(g, w, d, p, 'shop');
      const pc = { gulabi: '#E0577A', neel: '#2E3A87', haldi: '#F2B01E' }[p.pigment] || '#F2A41C';
      for (let i = 0; i < 4; i++) { const x = -w / 2 + 1.5 + i * (w - 3) / 3; add(g, cylG(0, .9, 1.1, 10), i % 2 ? pc : shade(pc, .3), x, .7, d / 2 + 2.6); box(g, 2, .7, 2, '#8A5A3B', x, 0, d / 2 + 2.6); }
    },
    haveli(g, w, d, p) {
      const h = H3(p) * .8, col = p.col;
      fbox(g, w, h, d, col, TX.jharokha, 0, 0, 0, 2.6);
      fbox(g, w * .5, 2.6, 1.6, '#E58A71', TX.jharokha, 0, h * .55, d / 2 + .8, 2.2);
      dome(g, 1, mat('#F2B39E'), -w * .2, h * .55 + 2.6, d / 2 + .8); dome(g, 1, mat('#F2B39E'), w * .2, h * .55 + 2.6, d / 2 + .8);
      box(g, w + .4, .5, d + .4, '#F7D5C4', 0, h, 0);
      dome(g, 1.6, mat('#F2B39E'), -w / 2 + 2, h + .5, 0); dome(g, 1.6, mat('#F2B39E'), w / 2 - 2, h + .5, 0);
      box(g, w * .3, 3, .1, '#5A3A2A', 0, 0, d / 2 + .02, false);
      box(g, w * .6, 1, 1.2, '#8A5A3B', 0, 0, d / 2 + 2.4); cyl(g, .9, .6, .5, '#2B2B2B', 0, 1, d / 2 + 2.4, 12);
    },
    jantar(g, w, d, p) {
      box(g, w, .2, d, '#EAD6BA', 0, 0, 0, false);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(d * .8, 0); sh.lineTo(0, 16); sh.lineTo(0, 0);
      const eg = new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false }); eg.rotateY(-Math.PI / 2); eg.translate(1.2, 0, -d * .4);
      add(g, eg, '#D9A55F', -w * .2, 0, 0);
      box(g, 8, 1, 2.4, '#C08A48', -w * .2, 0, d * .35);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 24, 1, true), new THREE.MeshLambertMaterial({ color: '#D9A55F', side: THREE.DoubleSide })); ring.position.set(w * .25, 2, -d * .1); ring.castShadow = true; g.add(ring);
      cyl(g, .8, .8, 4, '#C08A48', w * .25, 0, -d * .1);
      const bowl = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#E6C79A', side: THREE.DoubleSide })); bowl.position.set(w * .25, 3.5, d * .3); g.add(bowl);
    },
    stepwell(g, w, d, p) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: TX.stairs })); pl.rotation.x = -Math.PI / 2; pl.position.y = .1; pl.receiveShadow = true; g.add(pl);
      [[0, d / 2, w, .8], [0, -d / 2, w, .8]].forEach(([x, z, ww, dd]) => box(g, ww, 1.2, dd, '#C9A06A', x, 0, z));
      [[w / 2, 0], [-w / 2, 0]].forEach(([x, z]) => box(g, .8, 1.2, d, '#C9A06A', x, 0, z));
    },
    jalmahal(g, w, d, p) {
      const col = p.col;
      fbox(g, w, 7, d, col, TX.arcade, 0, 0, 0, 2.6);
      box(g, w + .4, .5, d + .4, '#FFF6E6', 0, 7, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { cyl(g, 1.4, 1.4, 2.4, col, a * (w / 2 - 1.5), 7, b * (d / 2 - 1.5), 8); dome(g, 1.6, mat('#F4E6C8'), a * (w / 2 - 1.5), 9.4, b * (d / 2 - 1.5)); });
      box(g, w * .5, 2.4, d * .5, col, 0, 7, 0);
    },
    gate(g, w, d, p) {
      const cols = ['#E0577A', '#2E3A87', '#F2A41C', '#3F8F5A', '#C2413B', '#4DA3C7', '#7A5BA6'];
      const n = 9, h = 11;
      for (let i = 0; i <= n; i++) { const x = -w / 2 + i * w / n; box(g, 1.6, h, d * .6, cols[i % cols.length], x, 0, 0); }
      box(g, w + 2, 2.4, d * .7, '#F6D58A', 0, h, 0); box(g, w + 2.6, .5, d * .8, '#E0577A', 0, h + 2.4, 0);
      for (let i = 0; i < 5; i++) { const x = -w / 2 + (i + .5) * w / 5; cyl(g, 1.4, 1.4, 1.6, i % 2 ? '#F2A41C' : '#E0577A', x, h + 2.9, 0, 8); dome(g, 1.6, mat('#F6E6CC'), x, h + 4.5, 0); }
      box(g, 3.6, h + 6, 3.6, '#F2A41C', 0, 0, 0); dome(g, 2.6, mat('#E0577A'), 0, h + 6, 0);
    },
    stadium(g, w, d, p) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, 8, 32, 1, true), new THREE.MeshLambertMaterial({ color: '#CFC6B4', side: THREE.DoubleSide }));
      ring.scale.set(w / 2, 1, d / 2); ring.position.y = 4; ring.castShadow = true; g.add(ring);
      const field = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat('#6FA35A')); field.rotation.x = -Math.PI / 2; field.scale.set(w / 2 - 1, d / 2 - 1, 1); field.position.y = .15; g.add(field);
      box(g, 2.4, .05, 10, '#D9C49A', 0, .16, 0, false);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { cyl(g, .25, .25, 16, '#888', a * w * .45, 0, b * d * .45, 6); box(g, 2, 1, .4, '#FFFBE6', a * w * .45, 16, b * d * .45); });
    },
    mall(g, w, d, p) {
      const h = H3(p) * .8;
      const gm = facadeMat(TX.glass, '#ffffff', w / 4, h / 4), plain = mat('#9CC3D5');
      const m = new THREE.Mesh(boxG(w, h, d), [gm, gm, plain, plain, gm, gm]); m.castShadow = m.receiveShadow = true; g.add(m);
      box(g, w + .6, .8, d + .6, '#E8E3DA', 0, h, 0);
    },
    village(g, w, d, p) {
      box(g, w, .1, d, '#D9925A', 0, 0, 0, false);
      [[-w / 2, 0, .6, d], [w / 2, 0, .6, d], [0, -d / 2, w, .6]].forEach(([x, z, ww, dd]) => box(g, ww, 1.6, dd, '#B5603F', x, 0, z));
      for (let i = 0; i < 9; i++) { const x = -w / 2 + 4 + (i * 13.7) % (w - 8), z = -d / 2 + 4 + (i * 9.3) % (d - 10); cyl(g, 2.2, 2.2, 2.6, '#E8C27E', x, 0, z, 10); add(g, cylG(0, 2.9, 2.4, 10), '#A8743F', x, 2.6, z); }
      for (let i = 0; i < 8; i++) add(g, sphG(.4), bmat(i % 2 ? '#F2A41C' : '#E0577A'), -w / 2 + 2 + i * (w - 4) / 7, 3, d / 2 - 1);
    },
    cinema(g, w, d, p) {
      const h = H3(p) * .75, col = p.col;
      fbox(g, w, h, d, col, TX.arcade, 0, 0, 0, 3);
      for (let i = 0; i < 6; i++) dome(g, w / 13, mat(shade(col, .25)), -w / 2 + (i + .5) * w / 6, h, d / 2 - 1);
      box(g, w * .6, 3, 1, '#F7D9D4', 0, h - 4, d / 2 + .5);
    },
    station(g, w, d, p) {
      const h = H3(p) * .7, col = p.col;
      fbox(g, w, h, d, col, TX.arcade, 0, 0, 0, 3.2);
      for (let x = -w / 2 + .8; x < w / 2; x += 2.2) box(g, 1.1, 1, 1, shade(col, -.2), x, h, d / 2 - .5);
      box(g, 6, h + 7, 6, shade(col, .1), 0, 0, d / 2 - 3);
      const clock = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20), mat('#FFF6EC')); clock.position.set(0, h + 4, d / 2 + .02); g.add(clock);
      dome(g, 3, mat(shade(col, .3)), 0, h + 7, d / 2 - 3);
      [[-1], [1]].forEach(([a]) => { cyl(g, 1.6, 1.6, 2, col, a * (w / 2 - 2), h, 0, 8); dome(g, 1.8, mat(shade(col, .3)), a * (w / 2 - 2), h + 2, 0); });
    },
    garage(g, w, d, p) {
      const h = 7, cm = new THREE.MeshLambertMaterial({ map: TX.corrugated });
      const m = new THREE.Mesh(boxG(w, h, d), [cm, cm, mat('#8FA9B8'), cm, cm, cm]); m.castShadow = m.receiveShadow = true; g.add(m);
      box(g, w * .7, h * .8, .2, '#3A3A3A', 0, 0, d / 2 + .05, false); box(g, w * .7, .5, .3, '#F2A41C', 0, h * .8, d / 2 + .1, false);
      for (let i = 0; i < 3; i++) add(g, wheelG(.8, .5), '#1E1E1E', w / 2 + 1.5, .8 + i * .5, d / 2 - 1).rotation.x = Math.PI / 2;
    },
    jkk(g, w, d, p) {
      const col = p.col;
      for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { if (i === 2 && k === 0) continue; const h = 5 + ((i * 3 + k) % 3) * 2; box(g, w / 3 - .6, h, d / 3 - .6, (i + k) % 2 ? col : shade(col, .1), -w / 3 + i * w / 3, 0, -d / 3 + k * d / 3); }
      R.muralMat = new THREE.MeshLambertMaterial({ color: '#F6EEDF' });
      const mural = new THREE.Mesh(new THREE.PlaneGeometry(w * .6, 5), R.muralMat); mural.position.set(0, 3, d / 2 + .05); g.add(mural);
      R.refreshMural();
    },
    block(g, w, d, p) { fbox(g, w, H3(p) * .7, d, p.col, TX.facade, 0, 0, 0, 3); },
  };
  R.refreshMural = function () { if (R.muralMat && J.state && J.state.artImg) { const t = new THREE.Texture(J.state.artImg); t.needsUpdate = true; R.muralMat.map = t; R.muralMat.color.set('#ffffff'); R.muralMat.needsUpdate = true; } };

  function signFor(p) {
    const bg = p.kind === 'food' ? '#B5332E' : p.kind === 'cafe' ? '#2F5D50' : p.kind === 'shop' ? '#2E3A87' : '#2B1B17';
    const sub = p.food ? p.food.item : p.addr || (p.kind === 'landmark' ? 'Jaipur' : '');
    return signTex(p.name, sub, bg);
  }
  function buildPlaces() {
    for (const p of J.PLACES) {
      if (p.kind === 'spot') continue;
      const { g, w, d } = placeGroup(p);
      (BUILD[p.style] || BUILD.block)(g, w, d, p);
      // signboard in the forecourt
      const sw = Math.min(w * .7, 8.5), shh = sw / 3.2, sm = new THREE.MeshBasicMaterial({ map: signFor(p) }), wood = mat('#5A3A2A');
      const board = new THREE.Mesh(boxG(sw, shh, .25), [wood, wood, wood, wood, sm, sm]);
      const fz = d / 2 + (p.style === 'hawa' || p.style === 'gate' ? 3.4 : 3.0);
      board.position.set(0, 2.6 + shh / 2, fz + (p.food || p.kind === 'cafe' ? 1.6 : 0)); g.add(board);
      [-1, 1].forEach(s => box(g, .2, 2.6, .2, wood, s * (sw / 2 - .3), 0, board.position.z));
      scene.add(g);
    }
    // statue circles
    for (const ci of M.circles) {
      const g = new THREE.Group(); g.position.set((ci.cx + .5) * U, 0, (ci.cy + .5) * U);
      cyl(g, ci.rc * U, ci.rc * U, .4, '#7FAE5F', 0, 0, 0, 24);
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.283; add(g, sphG(.6), mat(i % 2 ? '#E0577A' : '#F2A41C'), Math.cos(a) * ci.rc * U * .8, .5, Math.sin(a) * ci.rc * U * .8); }
      if (ci.id === 'statue') {
        box(g, 3, 3.5, 3, '#D9C49A', 0, 0, 0); box(g, 3.6, .5, 3.6, '#B9A47A', 0, 3.5, 0);
        const st = buildPerson({ col: '#5A4A3A', skin: '#5A4A3A', pants: '#5A4A3A', turban: '#5A4A3A' }); st.scale.setScalar(1.8); st.position.y = 4; st.rotation.y = -Math.PI / 2; g.add(st);
      } else { cyl(g, 3, 3.4, 1, '#E8E3DA', 0, 0, 0, 20); const wtr = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, .2, 20), new THREE.MeshPhongMaterial({ color: '#7FC4DA', shininess: 80 })); wtr.position.y = 1; g.add(wtr); cyl(g, .3, .5, 3, '#E8E3DA', 0, 1, 0, 8); }
      scene.add(g);
    }
    // food/cafe door markers
    const ringG = new THREE.RingGeometry(1.4, 1.8, 24); ringG.rotateX(-Math.PI / 2);
    for (const p of J.PLACES) if (['food', 'cafe', 'garage'].includes(p.kind)) { const r = new THREE.Mesh(ringG, bmat('#C2413B', { transparent: true, opacity: .7 })); r.position.set(p.dx * S, .08, p.dy * S); scene.add(r); }
  }

  // ---------------- characters & vehicles ----------------
  const SKIN = ['#C68B62', '#B47650', '#D9A07A', '#9A6342', '#E0B08C'];
  function buildPerson(o) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const skin = o.skin || '#C68B62', cloth = o.col || '#F2A41C', pants = o.pants || (o.dupatta ? o.col : '#3A3A55');
    const legs = [], arms = [];
    [-1, 1].forEach(s => { const pv = new THREE.Group(); pv.position.set(0, .92, s * .13); box(pv, .2, .9, .2, pants, 0, -.92, 0); body.add(pv); legs.push(pv); });
    if (o.dupatta) box(body, .5, .9, .5, cloth, 0, .3, 0); // skirt / lehenga
    box(body, .34, .78, .5, cloth, 0, .85, 0);
    [-1, 1].forEach(s => { const pv = new THREE.Group(); pv.position.set(0, 1.58, s * .33); box(pv, .15, .62, .15, s > 0 && o.dupatta ? o.dupatta : cloth, 0, -.62, 0); add(pv, sphG(.08), skin, 0, -.66, 0); body.add(pv); arms.push(pv); });
    if (o.dupatta) { const dp = box(body, .38, .55, .08, o.dupatta, 0, 1.12, .27); dp.rotation.x = .2; }
    box(body, .12, .12, .12, skin, 0, 1.63, 0);
    add(body, sphG(.18), skin, 0, 1.85, 0);
    if (o.turban) { const t = add(body, sphG(.22), o.turban, -.02, 1.95, 0); t.scale.set(1, .8, 1.05); }
    else if (o.helmet) { const t = add(body, sphG(.22), o.helmet, 0, 1.9, 0); t.scale.set(1.05, .95, 1.05); }
    else { const h = add(body, domeG(.195), o.hair || '#2B1B17', -.02, 1.86, 0); h.rotation.z = .25; if (o.long) box(body, .1, .45, .34, o.hair || '#2B1B17', -.15, 1.4, 0); }
    add(body, sphG(.03), '#1a1a1a', .17, 1.88, .07, false); add(body, sphG(.03), '#1a1a1a', .17, 1.88, -.07, false);
    if (o.backpack) box(body, .2, .5, .38, o.backpack, -.27, .95, 0);
    g.userData = { body, legs, arms };
    return g;
  }
  R.buildPerson = buildPerson;
  function seatRider(g) { const u = g.userData; u.legs.forEach(l => l.rotation.z = 1.35); u.arms.forEach(a => a.rotation.z = 1.1); }
  function animPerson(g, walk, moving, down) {
    const u = g.userData; if (!u || !u.legs) return;
    const s = moving ? Math.sin(walk) * .7 : 0;
    u.legs[0].rotation.z = s; u.legs[1].rotation.z = -s; u.arms[0].rotation.z = -s * .8; u.arms[1].rotation.z = s * .8;
    u.body.rotation.x = down ? Math.PI / 2 : 0; u.body.position.y = down ? .2 : (moving ? Math.abs(Math.cos(walk)) * .05 : 0);
  }

  function buildVehicle(v) {
    const VT = J.VEH[v.type], l = VT.l * S, w = VT.w * S, c = v.col, g = new THREE.Group();
    const wheel = (x, z, r) => add(g, wheelG(r || .38, .26), '#1E1E1E', x, r || .38, z);
    const lights = (y) => { box(g, .1, .2, .35, bmat('#FFF3C4'), l / 2, y, w / 2 - .35, false); box(g, .1, .2, .35, bmat('#FFF3C4'), l / 2, y, -w / 2 + .35, false); box(g, .1, .18, .3, bmat('#C2413B'), -l / 2, y, w / 2 - .3, false); box(g, .1, .18, .3, bmat('#C2413B'), -l / 2, y, -w / 2 + .3, false); };
    switch (v.type) {
      case 'scooty': case 'bike': case 'police': {
        wheel(l / 2 - .35, 0, .33); wheel(-l / 2 + .35, 0, .33);
        if (v.type === 'scooty') { box(g, l * .75, .45, .5, c, -.1, .35, 0); box(g, .3, .9, .45, c, l * .28, .35, 0); box(g, .7, .2, .45, '#2B1B17', -.25, .8, 0); }
        else { box(g, l * .7, .35, .3, v.type === 'police' ? '#F6F6F6' : c, 0, .55, 0); box(g, .55, .35, .45, v.type === 'police' ? '#F6F6F6' : c, .15, .8, 0); box(g, .8, .2, .4, '#2B1B17', -.35, .85, 0); add(g, cylG(.12, .12, .5, 8), '#9AA0A6', -.4, .3, .25); }
        box(g, .08, .08, 1, '#444', l / 2 - .5, 1.25, 0); add(g, sphG(.14), bmat('#FFF3C4'), l / 2 - .3, 1, 0);
        if (v.type === 'police') { R.sirens.push(add(g, sphG(.16), bmat('#E23B3B'), -l / 2 + .2, 1.1, 0)); }
        const isP = v.driver === 'player';
        const rider = buildPerson(isP ? J.r3.playerLook() : { col: v.type === 'police' ? '#E8E3D6' : v.rider, pants: v.type === 'police' ? '#6B5A3A' : '#3A3A55', helmet: v.helmet, skin: SKIN[v.id % 5] });
        seatRider(rider); rider.position.set(-.15, .05, 0); g.add(rider);
        break;
      }
      case 'auto': {
        wheel(l / 2 - .3, 0, .3); wheel(-l / 2 + .4, w / 2 - .2, .32); wheel(-l / 2 + .4, -w / 2 + .2, .32);
        box(g, l * .9, .5, w * .9, c, -.05, .3, 0); box(g, .5, 1.4, w * .5, c, l / 2 - .5, .3, 0);
        box(g, l * .7, .12, w, '#F4C430', -l * .12, 2.1, 0); box(g, .08, 1.3, w * .9, '#2B2B2B', -l * .45, .8, 0);
        [[-1], [1]].forEach(([s]) => box(g, l * .55, 1.3, .06, '#2B2B2B', -l * .2, .8, s * w / 2 * .95));
        box(g, .5, .5, w * .8, '#8A5A3B', -l * .25, .8, 0);
        add(g, sphG(.14), bmat('#FFF3C4'), l / 2 - .2, 1.2, 0);
        const drv = buildPerson(v.driver === 'player' ? J.r3.playerLook() : { col: '#C9B48A', pants: '#C9B48A', skin: SKIN[v.id % 5] }); seatRider(drv); drv.position.set(l * .12, .05, 0); g.add(drv);
        break;
      }
      case 'bus': {
        [l / 2 - 1.2, -l / 2 + 1.5].forEach(x => { wheel(x, w / 2 - .2, .5); wheel(x, -w / 2 + .2, .5); });
        box(g, l, 2.6, w, c, 0, .35, 0); box(g, l - .6, .9, w + .04, '#2D3A48', 0, 1.6, 0, false); box(g, l, .2, w, '#F6F1E7', 0, 2.95, 0);
        box(g, .05, 1.6, w * .8, '#2D3A48', l / 2 + .01, 1.1, 0, false); lights(.7);
        break;
      }
      case 'camelcart': {
        wheel(-l / 2 + 1.2, w / 2, .6); wheel(-l / 2 + 1.2, -w / 2, .6);
        box(g, l * .5, .25, w, '#7A4E2A', -l * .22, .8, 0); box(g, l * .45, .5, w * .8, '#E8D3A4', -l * .25, 1.05, 0);
        const cm = new THREE.Group(); cm.position.set(l * .25, 0, 0); g.add(cm);
        box(cm, 1.6, .9, .7, '#C49A6C', 0, 1.4, 0); add(cm, sphG(.45), '#D9B282', -.1, 2.25, 0);
        [[.6, .25], [.6, -.25], [-.6, .25], [-.6, -.25]].forEach(([x, z]) => box(cm, .15, 1.4, .15, '#B98A5C', x, 0, z));
        const nk = box(cm, .25, 1.2, .25, '#C49A6C', .9, 1.7, 0); nk.rotation.z = -.5; box(cm, .6, .3, .3, '#B98A5C', 1.45, 2.6, 0);
        break;
      }
      case 'jeep': {
        [l / 2 - .7, -l / 2 + .7].forEach(x => { wheel(x, w / 2 - .1, .45); wheel(x, -w / 2 + .1, .45); });
        box(g, l, .9, w, c, 0, .45, 0); box(g, l * .4, .1, w, '#2B231F', -l * .1, 1.35, 0);
        box(g, .08, .8, w, '#2D3A48', l * .15, 1.35, 0); [-1, 1].forEach(s => box(g, .08, 1, .08, '#333', -l * .25, 1.35, s * (w / 2 - .1)));
        box(g, .08, .08, w, '#333', -l * .25, 2.35, 0); add(g, wheelG(.42, .25), '#1E1E1E', -l / 2 - .15, .9, 0).rotation.set(0, Math.PI / 2, 0); lights(.8);
        if (v.driver === 'player') { const d = buildPerson(J.r3.playerLook()); seatRider(d); d.position.set(-.1, .4, -w * .22); d.scale.setScalar(.95); g.add(d); }
        break;
      }
      default: { // car / goon
        const goon = v.type === 'goon';
        [l / 2 - .7, -l / 2 + .7].forEach(x => { wheel(x, w / 2 - .1, .38); wheel(x, -w / 2 + .1, .38); });
        box(g, l, .7, w, c, 0, .35, 0);
        const cab = box(g, l * .5, .65, w * .86, goon ? '#121214' : shade(c, .05), -l * .08, 1.05, 0);
        box(g, l * .2, .55, w * .8, goon ? '#0B0B0D' : '#2D3A48', l * .15, 1.05, 0, false);
        box(g, l * .48, .5, w * .88, goon ? '#0B0B0D' : '#3D4B5A', -l * .08, 1.1, 0, false);
        box(g, l * .5, .05, w * .86, goon ? '#C9A74A' : shade(c, .2), -l * .08, 1.7, 0, false);
        lights(.7);
        if (goon) box(g, l + .02, .08, w + .02, '#C9A74A', 0, .9, 0, false);
      }
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  }
  function buildCow(k) {
    const g = new THREE.Group(), c = k.col;
    box(g, 1.7, .8, .75, c, 0, .8, 0); box(g, .45, .35, .5, c, -.3, 1.6, 0);
    box(g, .4, .4, .5, k.patch, .3, 1.12, .2, false);
    box(g, .55, .45, .42, shade(c, -.05), 1.05, 1.15, 0);
    [-1, 1].forEach(s => { const h = add(g, cylG(.02, .07, .35, 5), '#E8DCC0', 1.05, 1.55, s * .18); h.rotation.x = -s * .5; });
    [[.65, .25], [.65, -.25], [-.65, .25], [-.65, -.25]].forEach(([x, z]) => box(g, .16, .8, .16, shade(c, -.1), x, 0, z));
    if (k.mala) for (let i = -2; i <= 2; i++) add(g, sphG(.07), '#F2A41C', .85, .95, i * .08, false);
    return g;
  }
  function buildMonkey() { const g = new THREE.Group(); add(g, sphG(.32), '#8B6B4A', 0, .4, 0); add(g, sphG(.2), '#8B6B4A', .25, .75, 0); add(g, sphG(.12), '#E2B08C', .38, .72, 0); const t = add(g, cylG(.04, .04, .7, 5), '#7A5C3E', -.35, .3, 0); t.rotation.z = .8; return g; }

  // ---------------- sync of moving things ----------------
  const live = new Set(); let seen = new Set();
  R.sirens = [];
  function ensure(o, build, y) {
    let g = o.__g;
    if (g && o.__key !== (o.driver || '') + (o.type || '')) { scene.remove(g); g = null; }
    if (!g) { g = build(o); o.__g = g; o.__key = (o.driver || '') + (o.type || ''); scene.add(g); live.add(o); }
    g.position.set(o.x * S, y || 0, o.y * S); g.rotation.y = -(o.a || 0); seen.add(o); return g;
  }
  R.playerLook = () => ({ col: '#F2A41C', pants: '#263170', skin: '#C68B62', hair: '#2B1B17', backpack: '#2F5D50' });
  function syncEntities() {
    seen = new Set();
    const W = J.world, P = W.pos(), range = (mobile ? 150 : 240) / S, r2 = range * range;
    const near = o => { const dx = o.x - P.x, dy = o.y - P.y; return dx * dx + dy * dy < r2; };
    R.sirens = R.sirens.filter(s => s.parent && s.parent.parent);
    for (const v of W.vehicles) if (near(v)) ensure(v, buildVehicle);
    if (W.player.veh) ensure(W.player.veh, buildVehicle);
    const pr = (mobile ? 90 : 140) / S, pr2 = pr * pr;
    for (const p of W.peds) { const dx = p.x - P.x, dy = p.y - P.y; if (dx * dx + dy * dy > pr2) continue; const g = ensure(p, buildPerson); animPerson(g, p.walk, p.down <= 0, p.down > 0); }
    for (const k of W.cows) if (near(k)) ensure(k, buildCow);
    for (const m of W.monkeys) if (near(m)) ensure(m, buildMonkey);
    const pl = W.player;
    if (!pl.veh) { if (!R.playerG) { R.playerG = buildPerson(R.playerLook()); scene.add(R.playerG); } R.playerG.visible = true; R.playerG.position.set(pl.x * S, 0, pl.y * S); R.playerG.rotation.y = -pl.a; animPerson(R.playerG, pl.walk, pl.moving, false); }
    else if (R.playerG) R.playerG.visible = false;
    for (const n of R.npcs) { const p = J.PLACE[n.place()]; if (!p) continue; n.g.visible = true; n.x = p.dx + n.off[0]; n.y = p.dy + n.off[1]; n.g.position.set(n.x * S, 0, n.y * S); const dx = pl.x - n.x, dy = pl.y - n.y; n.g.rotation.y = -Math.atan2(dy, dx); animPerson(n.g, 0, false, false); }
    for (const o of live) if (!seen.has(o)) { scene.remove(o.__g); o.__g = null; live.delete(o); }
    const on = (W.time * 6 | 0) % 2; R.sirens.forEach(s => s.material = bmat(on ? '#E23B3B' : '#3B6BE2'));
  }

  // ---------------- story NPCs ----------------
  R.npcs = [];
  function buildNPCs() {
    const defs = [
      { id: 'chintu', name: 'Chintu', place: () => 'garage', off: [-20, 6], look: { col: '#4DA3C7', pants: '#3A3A55', skin: '#B47650', hair: '#1a1a1a' } },
      { id: 'dadi', name: 'Dadi', place: () => 'dadi', off: [18, 6], look: { col: '#B85C4C', dupatta: '#F2A41C', skin: '#C68B62', hair: '#E8E3DA', long: true } },
      { id: 'meera', name: 'Meera', place: () => (J.state.ch >= 3 ? 'jkk' : 'curious'), off: [22, 4], look: { col: '#7A5BA6', pants: '#2B1B17', skin: '#B47650', long: true, backpack: '#E0577A' } },
      { id: 'ishaan', name: 'Ishaan', place: () => 'curious', off: [-22, 4], look: { col: '#2F5D50', pants: '#3A3A55', skin: '#C68B62' } },
    ];
    defs.forEach(d => { d.g = buildPerson(d.look); scene.add(d.g); R.npcs.push(d); });
  }

  // ---------------- objective markers ----------------
  const markers = [];
  function marker(i) {
    if (markers[i]) return markers[i];
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#F2A41C', transparent: true, opacity: .28, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    beam.position.y = 35; g.add(beam);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, .22, 6, 32), bmat('#F2A41C')); ring.rotation.x = Math.PI / 2; ring.position.y = .3; g.add(ring);
    const chev = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.6, 4), bmat('#F2A41C')); chev.rotation.x = Math.PI; chev.position.y = 5; g.add(chev);
    g.userData = { ring, chev }; scene.add(g); markers[i] = g; return g;
  }

  // ---------------- camera ----------------
  R.yawOff = 0; R.lastDrag = 0; let camYaw = 0, camInit = false;
  const lerpA = (a, b, k) => a + J.world.angDiff(b, a) * k;
  R.cine = null;
  function updateCamera(dt) {
    const W = J.world, P = W.pos(), v = W.player.veh, tx = P.x * S, tz = P.y * S;
    if (R.cine) {
      const c = R.cine; c.t += dt; const k = Math.min(1, c.t / c.dur), e = k * k * (3 - 2 * k);
      camera.position.lerpVectors(c.from, c.to, e); tmpV.lerpVectors(c.lookFrom, c.look, e); camera.lookAt(tmpV); return;
    }
    let heading = v ? v.a : W.player.a;
    if (v && v.v < -30) heading = v.a;
    if (!camInit) { camYaw = heading; camInit = true; }
    if (performance.now() - R.lastDrag > 1500 && (v ? Math.abs(v.v) > 30 : W.player.moving)) R.yawOff *= Math.exp(-dt * 1.5);
    camYaw = lerpA(camYaw, heading, 1 - Math.exp(-dt * (v ? 3 : 2.5)));
    const yaw = camYaw + R.yawOff;
    const VT = v && J.VEH[v.type], spd = v ? Math.min(1, Math.abs(v.v) / VT.maxV) : 0;
    const dist = v ? (VT.two ? 7 : VT.l * S * 1.6 + 5) + spd * 2.5 : 5.2, hgt = v ? 3.2 + dist * .16 : 2.6;
    let d = dist;
    for (let s = 1; s <= dist; s += .5) { const t = M.tileAt((tx - Math.cos(yaw) * s) / S, (tz - Math.sin(yaw) * s) / S); if (t === TL.BLD || t === TL.LM || t === TL.WALL || t === TL.HILL) { d = Math.max(2, s - .8); break; } }
    const want = new THREE.Vector3(tx - Math.cos(yaw) * d, hgt + (dist - d) * .35, tz - Math.sin(yaw) * d);
    camera.position.lerp(want, 1 - Math.exp(-dt * 10));
    tmpV.set(tx + Math.cos(yaw) * 3, v ? 1.3 : 1.6, tz + Math.sin(yaw) * 3); camera.lookAt(tmpV);
    J.camA = yaw;
  }
  R.startCine = function (p, dur) {
    const face = p.face || 's', out = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[face];
    const dx = p.dx * S, dz = p.dy * S;
    R.cine = { t: 0, dur: dur || 1.4, from: camera.position.clone(), lookFrom: new THREE.Vector3(J.world.pos().x * S, 1.5, J.world.pos().y * S),
      to: new THREE.Vector3(dx + out[0] * 14 + out[1] * 5, 5.5, dz + out[1] * 14 - out[0] * 5), look: new THREE.Vector3(dx - out[0] * 3, 3.5, dz - out[1] * 3) };
  };
  R.endCine = function () { R.cine = null; };

  // ---------------- day / night ----------------
  const SKY = [[0, '#141a3a'], [5, '#1d2448'], [6.3, '#F2A98A'], [7.6, '#BFE0F0'], [16, '#BFE0F0'], [17.3, '#F6B26B'], [18.5, '#C0607A'], [19.6, '#2A2850'], [24, '#141a3a']];
  const cA = new THREE.Color(), cB = new THREE.Color();
  function skyAt(h) { for (let i = 0; i < SKY.length - 1; i++) { const [h0, a] = SKY[i], [h1, b] = SKY[i + 1]; if (h >= h0 && h <= h1) { cA.set(a); cB.set(b); return cA.lerp(cB, (h - h0) / (h1 - h0)); } } return cA.set(SKY[0][1]); }
  function updateLight() {
    const h = J.state.time, sky = skyAt(h);
    scene.background.copy(sky); scene.fog.color.copy(sky);
    const day = h > 6 && h < 19 ? Math.sin((h - 6) / 13 * Math.PI) : 0, dark = Math.max(0, 1 - day * 2.2);
    sun.intensity = .25 + day * .85; hemi.intensity = .35 + day * .45;
    const golden = Math.max(0, 1 - Math.abs(h - 17.6) / 1.6) + Math.max(0, 1 - Math.abs(h - 6.8) / 1.2);
    sun.color.setRGB(1, 1 - golden * .25, 1 - golden * .45);
    hemi.color.copy(sky).lerp(cB.set('#ffffff'), .5);
    if (dark > .05) hemi.color.lerp(cB.set('#6070b0'), dark * .6);
    R.sideMat.emissive.setRGB(dark * .9, dark * .9, dark * .9);
    headlight.intensity = dark > .3 && J.world.player.veh ? 1.6 : 0;
    R.dark = dark;
  }

  // ---------------- public ----------------
  R.init = function (canvas) {
    if (built) return;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.shadowMap.enabled = !mobile; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene(); scene.background = new THREE.Color('#BFE0F0'); scene.fog = new THREE.Fog('#BFE0F0', 90, mobile ? 230 : 330);
    camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .3, 900);
    hemi = new THREE.HemisphereLight('#ffffff', '#C9A27A', .7); scene.add(hemi);
    sun = new THREE.DirectionalLight('#fff1dd', .9); sun.castShadow = !mobile;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 }); sun.shadow.bias = -.0008;
    scene.add(sun); scene.add(sun.target);
    headlight = new THREE.SpotLight('#ffe2a8', 0, 45, .6, .5, 1); scene.add(headlight); scene.add(headlight.target);
    makeTextures(); buildGround(); buildBlocks(); buildPlaces(); buildNPCs();
    R.resize(); built = true;
  };
  R.resize = function () { if (!renderer) return; renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  R.render = function (dt) {
    if (!built) return;
    syncEntities(); updateCamera(dt); updateLight();
    const P = J.world.pos(), px = P.x * S, pz = P.y * S;
    sun.position.set(px - 60, 110, pz - 45); sun.target.position.set(px, 0, pz); sun.target.updateMatrixWorld();
    const v = J.world.player.veh; if (v) { headlight.position.set(px + Math.cos(v.a) * 2, 1.4, pz + Math.sin(v.a) * 2); headlight.target.position.set(px + Math.cos(v.a) * 20, 0, pz + Math.sin(v.a) * 20); headlight.target.updateMatrixWorld(); }
    const tg = J.missions.targets(), t = J.world.time;
    markers.forEach(m => m.visible = false);
    tg.forEach((o, i) => { const m = marker(i); m.visible = true; m.position.set(o.x * S, 0, o.y * S); m.userData.chev.position.y = 5 + Math.sin(t * 3) * .5; m.userData.chev.rotation.y = t * 2; m.userData.ring.scale.setScalar(1 + Math.sin(t * 4) * .08); });
    renderer.render(scene, camera);
  };
  R.project = function (xpx, ypx, h) {
    tmpV.set(xpx * S, h || 0, ypx * S).project(camera);
    return { x: (tmpV.x + 1) / 2 * innerWidth, y: (1 - tmpV.y) / 2 * innerHeight, on: tmpV.z < 1 && Math.abs(tmpV.x) < 1.05 && Math.abs(tmpV.y) < 1.05, front: tmpV.z < 1 };
  };
  R.camPos = () => camera.position;
})(window.J);
