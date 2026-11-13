/* 3D Jaipur: three.js scene built from the tile map. 1 tile = 4 m, 1 sim px = 1/8 m. +x east, +z south. */
(function (J) {
  const R = J.r3 = {};
  const S = 1 / 8, U = 4;
  const M = J.map, TL = M.TL, T = J.T, K = J.K;
  const mobile = Math.min(innerWidth, innerHeight) < 700 || matchMedia('(pointer: coarse)').matches;
  R.mobile = mobile;
  let renderer, scene, camera, sun, hemi, headlight, built = false;
  const tmpV = new THREE.Vector3(), dummy = new THREE.Object3D(), col = new THREE.Color();
  const { mat, box, cyl, add } = K;
  const dome = (p, r, m, x, y, z) => add(p, K.domeG(r), m, x, y, z);
  const shade = (c, a) => J.draw.shade(c, a);

  // ================= textures =================
  const TX = {};
  const archPath = (c, x, y, w, h) => { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); };
  const SHOPS_HI = ['ज्वेलर्स', 'मिष्ठान भंडार', 'चूड़ी घर', 'कपड़ा भंडार', 'जयपुरी रज़ाई', 'मोजड़ी', 'बर्तन भंडार', 'साड़ी सेंटर'];
  const SHOPS_EN = ['GEMS & JEWELLERS', 'LAC BANGLES', 'JAIPURI RAZAI', 'BANDHEJ SAREES', 'MOJARI HOUSE', 'BLUE POTTERY', 'SWEETS', 'BRASS WORKS'];
  const BOARD = ['#C2413B', '#2E5AA8', '#E0B23A', '#2F6B4A', '#7A2E5A', '#1E1E22', '#E07B1A'];
  function walledFacade(lit) {
    return K.tex(512, 512, (c) => {
      c.fillStyle = lit ? '#000' : '#D98A6E'; c.fillRect(0, 0, 512, 512);
      if (!lit) for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${i % 2 ? 255 : 120},${i % 2 ? 220 : 70},${i % 2 ? 200 : 50},.05)`; c.fillRect((i * 97) % 512, (i * 61) % 512, 6, 3); }
      for (let b = 0; b < 4; b++) {
        const x = b * 128;
        if (!lit) {
          c.strokeStyle = '#FBEFE6'; c.lineWidth = 3; c.strokeRect(x + 6, 166, 116, 112); c.strokeRect(x + 6, 76, 116, 80);
          c.fillStyle = '#FBEFE6'; for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(x + 20 + k * 30, 280, 3, 0, 7); c.fill(); }
          c.fillStyle = '#B86A52'; c.fillRect(x, 284, 128, 14); c.fillStyle = 'rgba(60,20,10,.35)'; c.fillRect(x, 298, 128, 6);
          c.fillStyle = BOARD[(b * 3 + 1) % BOARD.length]; c.fillRect(x + 8, 306, 112, 26);
          c.fillStyle = '#FFF6E0'; c.font = b % 2 ? '700 17px Mukta, sans-serif' : '800 13px Mukta, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
          c.fillText(b % 2 ? SHOPS_HI[b * 2 % SHOPS_HI.length] : SHOPS_EN[b * 3 % SHOPS_EN.length], x + 64, 320);
          c.fillStyle = '#FBEFE6'; archPath(c, x + 12, 338, 104, 174); c.fill();
          c.fillStyle = '#C47A62'; c.fillRect(x, 338, 8, 174); c.fillRect(x + 120, 338, 8, 174);
        }
        c.fillStyle = lit ? '#FFC870' : '#3A2620'; archPath(c, x + 18, 344, 92, 168); c.fill();
        if (!lit) {
          if (b === 2) { c.fillStyle = '#8F959B'; c.fillRect(x + 18, 390, 92, 122); c.fillStyle = '#767C82'; for (let k = 0; k < 12; k++) c.fillRect(x + 18, 394 + k * 10, 92, 3); }
          else { const goods = [['#E0577A', '#F2A41C', '#2E5AA8', '#3F8F5A'], ['#F2C230', '#C2413B'], [], ['#7A5BA6', '#E07B1A', '#F6F1E7']][b]; for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) { c.fillStyle = goods.length ? goods[(r + k) % goods.length] : '#5A3A2A'; c.fillRect(x + 24 + k * 14, 380 + r * 30, 10, 18); } c.fillStyle = '#5A3A2A'; c.fillRect(x + 22, 492, 84, 20); }
          c.fillStyle = '#FBEFE6'; archPath(c, x + 36, 178, 56, 92); c.fill();
        }
        c.fillStyle = lit ? (b % 3 ? '#FFD07A' : '#000') : (b % 2 ? '#2F6B5A' : '#3E6FA0'); archPath(c, x + 41, 183, 46, 84); c.fill();
        if (!lit) {
          c.fillStyle = '#FBEFE6'; c.fillRect(x + 63, 183, 2, 84); c.fillRect(x + 30, 268, 68, 6);
          if (b === 1) { c.fillStyle = '#E79A80'; c.fillRect(x + 30, 250, 68, 26); c.strokeStyle = '#FBEFE6'; c.strokeRect(x + 30, 250, 68, 26); c.fillStyle = '#F2B39E'; c.beginPath(); c.arc(x + 64, 180, 22, Math.PI, 0); c.fill(); }
          for (let k = 0; k < 2; k++) { c.fillStyle = '#FBEFE6'; c.fillRect(x + 22 + k * 62, 92, 22, 46); }
        }
        c.fillStyle = lit ? (b % 2 ? '#000' : '#FFD07A') : '#4A2E25'; c.fillRect(x + 25, 95, 16, 40); c.fillRect(x + 87, 95, 16, 40);
        if (!lit) {
          c.fillStyle = '#FBEFE6'; c.fillRect(x, 58, 128, 4);
          for (let k = 0; k < 8; k++) { c.fillStyle = '#FBEFE6'; c.beginPath(); c.moveTo(x + k * 16, 58); c.lineTo(x + k * 16 + 8, 40); c.lineTo(x + k * 16 + 16, 58); c.fill(); c.fillStyle = '#E79A80'; c.beginPath(); c.moveTo(x + k * 16 + 3, 56); c.lineTo(x + k * 16 + 8, 46); c.lineTo(x + k * 16 + 13, 56); c.fill(); }
          c.fillStyle = 'rgba(80,30,20,.1)'; c.fillRect(x, 0, 128, 40);
        }
      }
    }, true);
  }
  const TOWN_SIGNS = ['SHARMA SWEETS', 'MOBILE POINT', 'AGARWAL TEXTILES', 'JAIN MEDICAL', 'BALAJI ELECTRICALS', 'KRISHNA TAILORS', 'GUPTA GENERAL STORE', 'RAJASTHAN HANDICRAFTS'];
  function townFacade(lit) {
    return K.tex(512, 512, (c) => {
      c.fillStyle = lit ? '#000' : '#EFE8DC'; c.fillRect(0, 0, 512, 512);
      for (let b = 0; b < 4; b++) {
        const x = b * 128;
        if (!lit) {
          c.fillStyle = BOARD[(b * 2 + 3) % BOARD.length]; c.fillRect(x + 4, 312, 120, 34);
          c.fillStyle = '#fff'; c.font = '800 13px Mukta, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(TOWN_SIGNS[(b * 3 + 1) % TOWN_SIGNS.length], x + 64, 330);
          c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(x, 300, 128, 10);
        }
        c.fillStyle = lit ? (b === 1 ? '#000' : '#FFE2A0') : (b === 1 ? '#8F959B' : '#3A3430'); c.fillRect(x + 10, 352, 108, 160);
        if (!lit && b === 1) { c.fillStyle = '#767C82'; for (let k = 0; k < 16; k++) c.fillRect(x + 10, 356 + k * 10, 108, 3); }
        if (!lit && b !== 1) { for (let r = 0; r < 3; r++) { c.fillStyle = ['#C2413B', '#2E5AA8', '#F2C230'][r]; c.fillRect(x + 18, 380 + r * 40, 92, 8); } }
        for (let f = 0; f < 2; f++) {
          const y = 70 + f * 120;
          c.fillStyle = lit ? ((b + f) % 3 ? '#FFD38A' : '#000') : '#3B4550'; c.fillRect(x + 28, y, 72, 70);
          if (!lit) {
            c.strokeStyle = '#6A6F74'; c.lineWidth = 2; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(x + 28 + k * 14.4, y); c.lineTo(x + 28 + k * 14.4, y + 70); c.stroke(); }
            c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 20, y - 10, 88, 8);
            c.strokeStyle = '#5A5F64'; c.lineWidth = 3; c.strokeRect(x + 20, y + 74, 88, 16);
            if ((b + f) % 2) { c.fillStyle = '#F2F2F0'; c.fillRect(x + 104, y + 20, 20, 16); c.fillStyle = '#9AA0A6'; c.fillRect(x + 108, y + 24, 12, 8); }
          }
        }
        if (!lit) { c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x + 126, 0, 2, 512); }
      }
    }, true);
  }
  function makeTextures() {
    TX.walled = walledFacade(false); TX.walledLit = walledFacade(true);
    TX.town = townFacade(false); TX.townLit = townFacade(true);
    TX.jharokha = K.tex(64, 128, (c) => {
      c.fillStyle = '#E58A71'; c.fillRect(0, 0, 64, 128);
      c.fillStyle = '#FBE7DB'; archPath(c, 8, 10, 48, 100); c.fill(); c.fillStyle = '#7D2F22'; archPath(c, 13, 15, 38, 90); c.fill();
      c.fillStyle = '#C66850'; c.fillRect(13, 60, 38, 4); for (let i = 0; i < 5; i++) c.fillRect(16 + i * 8, 64, 2, 41);
      c.fillStyle = '#FBE7DB'; c.fillRect(0, 112, 64, 6); c.fillRect(0, 0, 64, 4);
      c.fillStyle = '#F7C9B5'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(8 + i * 16, 122, 3, 0, 7); c.fill(); }
    }, true);
    TX.arcade = K.tex(64, 64, (c) => { c.fillStyle = '#F3EDE4'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#ffffff'; archPath(c, 6, 8, 52, 56); c.fill(); c.fillStyle = '#6B4A3A'; archPath(c, 10, 12, 44, 52); c.fill(); }, true);
    TX.sandstone = K.tex(64, 64, (c) => { c.fillStyle = '#E3B97A'; c.fillRect(0, 0, 64, 64); c.strokeStyle = 'rgba(120,80,30,.25)'; c.lineWidth = 1; for (let y = 0; y < 64; y += 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(64, y); c.stroke(); for (let x = (y / 8 % 2) * 8; x < 64; x += 16) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 8); c.stroke(); } } }, true);
    TX.amerWin = K.tex(64, 64, (c) => { c.fillStyle = '#E3B97A'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#FFF4DD'; archPath(c, 16, 12, 32, 44); c.fill(); c.fillStyle = '#3A2A1A'; archPath(c, 20, 16, 24, 38); c.fill(); c.fillStyle = '#C9965A'; c.fillRect(0, 58, 64, 6); }, true);
    TX.ganeshPol = K.tex(256, 256, (c) => {
      c.fillStyle = '#E8D4A8'; c.fillRect(0, 0, 256, 256);
      const pal = ['#2E7D6B', '#C2413B', '#2E5AA8', '#E0A62A'];
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = pal[(i + j) % 4]; c.globalAlpha = .55; c.beginPath(); c.arc(16 + i * 32, 16 + j * 32, 9, 0, 7); c.fill(); c.globalAlpha = 1; c.strokeStyle = '#8A5A2A'; c.strokeRect(2 + i * 32, 2 + j * 32, 28, 28); }
      c.fillStyle = '#FFF4DD'; archPath(c, 68, 90, 120, 166); c.fill(); c.fillStyle = '#3A2A1A'; archPath(c, 80, 102, 96, 154); c.fill();
      c.fillStyle = '#E07B1A'; c.beginPath(); c.arc(128, 60, 18, 0, 7); c.fill(); c.fillStyle = '#F2C230'; c.beginPath(); c.arc(128, 60, 10, 0, 7); c.fill();
    });
    TX.brick = K.tex(64, 64, (c) => { c.fillStyle = '#B5603F'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#D9C7AB'; for (let y = 0; y < 64; y += 8) { c.fillRect(0, y, 64, 1.5); for (let x = (y / 8 % 2) * 8; x < 64; x += 16) c.fillRect(x, y, 1.5, 8); } }, true);
    TX.stairs = K.tex(128, 128, (c) => { c.fillStyle = '#d9b27c'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 6; i++) { const ins = i * 9; c.strokeStyle = i % 2 ? '#a77d4c' : '#efd3a0'; c.lineWidth = 4; c.strokeRect(ins + 2, ins + 2, 124 - ins * 2, 124 - ins * 2); } c.strokeStyle = 'rgba(120,80,40,.4)'; c.lineWidth = 1; for (let i = -128; i < 128; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.stroke(); c.beginPath(); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); } c.fillStyle = '#4f9db4'; c.fillRect(52, 52, 24, 24); });
    TX.corrugated = K.tex(32, 32, (c) => { c.fillStyle = '#9fb3c0'; c.fillRect(0, 0, 32, 32); c.fillStyle = '#7d93a2'; for (let i = 0; i < 32; i += 4) c.fillRect(i, 0, 2, 32); }, true);
    TX.glass = K.tex(64, 64, (c) => { const g = c.createLinearGradient(0, 0, 64, 64); g.addColorStop(0, '#bfe3f2'); g.addColorStop(1, '#4f86a6'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, 0, 64, 2); c.fillRect(0, 0, 2, 64); }, true);
  }
  function signTex(title, sub, bg, fg) {
    return K.tex(512, 160, (c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = fg || '#FFF6EC'; c.textAlign = 'center'; c.textBaseline = 'middle';
      let fs = 60; c.font = `${fs}px "Rozha One", Georgia, serif`; while (c.measureText(title).width > w - 40 && fs > 22) { fs -= 2; c.font = `${fs}px "Rozha One", Georgia, serif`; }
      c.fillText(title, w / 2, sub ? 62 : h / 2 + 4);
      if (sub) { c.font = '600 26px Mukta, sans-serif'; c.globalAlpha = .85; c.fillText(sub, w / 2, 122); c.globalAlpha = 1; }
    });
  }
  const repMat = (tex, color, rx, ry, extra) => { const t = tex.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(rx)), Math.max(1, Math.round(ry))); return new THREE.MeshLambertMaterial(Object.assign({ map: t, color }, extra || {})); };
  function fbox(p, w, h, d, color, tex, x, y, z, bay) {
    const plain = mat(color), f = repMat(tex, '#ffffff', w / (bay || 4), h / (bay || 4));
    const m = new THREE.Mesh(K.boxG(w, h, d), [plain, plain, plain, plain, f, plain]);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m;
  }
  function tbox(p, w, h, d, tex, x, y, z, bay) { const m2 = repMat(tex, '#ffffff', w / (bay || 4), h / (bay || 4)), m3 = repMat(tex, '#ffffff', d / (bay || 4), h / (bay || 4)), top = mat('#D9A960'); const m = new THREE.Mesh(K.boxG(w, h, d), [m3, m3, top, top, m2, m2]); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; p.add(m); return m; }

  // ================= terrain =================
  function hash2(a, b) { let n = a * 374761393 + b * 668265263; n = (n ^ (n >> 13)) * 1274126177; return ((n ^ (n >> 16)) >>> 0) / 4294967296; }
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = t => t * t * (3 - 2 * t); const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1), u = s(xf), v = s(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  R.heightAt = function (ix, iy) {
    if (!(M.get(ix - 1, iy - 1) === TL.HILL && M.get(ix, iy - 1) === TL.HILL && M.get(ix - 1, iy) === TL.HILL && M.get(ix, iy) === TL.HILL)) return 0;
    let n = 0, k = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { k++; if (M.get(ix + dx, iy + dy) === TL.HILL) n++; }
    return (3 + 22 * (.6 * vnoise(ix * .09, iy * .09) + .4 * vnoise(ix * .27, iy * .27))) * Math.pow(n / k, 1.6);
  };
  function buildGround() {
    const N = mobile ? 2048 : 4096, cv = document.createElement('canvas'); cv.width = cv.height = N;
    const c = cv.getContext('2d'), sc = N / (M.W * T), CPX = M.CPX, nc = Math.ceil(M.W / M.CS);
    for (let cy = 0; cy < nc; cy++) for (let cx = 0; cx < nc; cx++) c.drawImage(M.renderChunk(cx, cy), cx * CPX * sc, cy * CPX * sc, CPX * sc + 1, CPX * sc + 1);
    c.globalAlpha = .08; for (let i = 0; i < 4000; i++) { c.fillStyle = i % 3 ? '#000' : '#fff'; c.beginPath(); c.ellipse(Math.random() * N, Math.random() * N, 2 + Math.random() * 6, 1 + Math.random() * 3, Math.random() * 3, 0, 7); c.fill(); } c.globalAlpha = 1;
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const geo = new THREE.PlaneGeometry(M.W * U, M.H * U, M.W, M.H); geo.rotateX(-Math.PI / 2); geo.translate(M.W * U / 2, 0, M.H * U / 2);
    const pos = geo.attributes.position;
    for (let iy = 0; iy <= M.H; iy++) for (let ix = 0; ix <= M.W; ix++) pos.setY(iy * (M.W + 1) + ix, R.heightAt(ix, iy));
    geo.computeVertexNormals();
    const g = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: tex })); g.receiveShadow = true; scene.add(g);
    const out = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), mat('#D8BE8C')); out.rotation.x = -Math.PI / 2; out.position.set(M.W * U / 2, -.05, M.H * U / 2); scene.add(out);
    const wm = new THREE.MeshPhongMaterial({ color: '#4F8FA0', transparent: true, opacity: .85, shininess: 100, specular: '#ffffff' });
    for (const [x0, y0, x1, y1] of M.lakes) { const w = new THREE.Mesh(new THREE.PlaneGeometry((x1 - x0 + 1) * U, (y1 - y0 + 1) * U), wm); w.rotation.x = -Math.PI / 2; w.position.set((x0 + x1 + 1) / 2 * U, .25, (y0 + y1 + 1) / 2 * U); scene.add(w); }
    // Kesar Kyari, the star-patterned island garden in Maota Lake
    const kk = new THREE.Group(); kk.position.set(45.5 * U, 0, 15.5 * U); scene.add(kk);
    box(kk, 22, 1, 10, '#D9B27C', 0, 0, 0);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { box(kk, 5, .3, 3.2, '#6E9A4F', -7 + i * 7, 1, -2.4 + j * 4.8); const s = box(kk, 2.4, .32, 2.4, '#8DB46B', -7 + i * 7, 1.02, -2.4 + j * 4.8); s.rotation.y = Math.PI / 4; }
  }

  // ================= streets: merged facades and props =================
  R.litMats = [];
  R.bHeight = b => b.walled ? 8.5 + b.hgt * .18 : 6 + b.hgt * .3;
  function facadeMesh(list, tex, lit, tint, roofCol) {
    const P = [], N = [], UV = [], CO = [], I = [], RP = [], RC = [], RI = [];
    const quad = (ax, az, bx, bz, h, nx, nz, u0, cl) => {
      const i = P.length / 3, u1 = u0 + Math.hypot(bx - ax, bz - az) / 16;
      P.push(ax, 0, az, bx, 0, bz, bx, h, bz, ax, h, az); for (let k = 0; k < 4; k++) { N.push(nx, 0, nz); CO.push(cl.r, cl.g, cl.b); }
      UV.push(u0, 0, u1, 0, u1, 1, u0, 1); I.push(i, i + 1, i + 2, i, i + 2, i + 3);
    };
    for (const b of list) {
      const x0 = b.x * U + .2, x1 = (b.x + b.w) * U - .2, z0 = b.y * U + .2, z1 = (b.y + b.h) * U - .2, h = R.bHeight(b), cl = tint(b).clone(), u = (b.x * 7 + b.y * 3) % 4 * .25;
      quad(x0, z1, x1, z1, h, 0, 1, u, cl); quad(x1, z0, x0, z0, h, 0, -1, u + .5, cl); quad(x1, z1, x1, z0, h, 1, 0, u + .25, cl); quad(x0, z0, x0, z1, h, -1, 0, u + .75, cl);
      const ri = RP.length / 3, rc = col.set(roofCol(b)); RP.push(x0, h, z1, x1, h, z1, x1, h, z0, x0, h, z0); for (let k = 0; k < 4; k++) RC.push(rc.r, rc.g, rc.b); RI.push(ri, ri + 1, ri + 2, ri, ri + 2, ri + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(CO, 3)); g.setIndex(I);
   
    const m = new THREE.MeshLambertMaterial({ map: tex, emissiveMap: lit, emissive: new THREE.Color(0, 0, 0), vertexColors: true });
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(RP, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(RC, 3)); rg.setIndex(RI); rg.computeVertexNormals();
    const rm = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); rm.receiveShadow = true; scene.add(rm);
    R.litMats.push(m);
  }
  function buildStreets() {
    const walled = M.buildings.filter(b => b.walled), town = M.buildings.filter(b => !b.walled);
    facadeMesh(walled, TX.walled, TX.walledLit, b => col.setRGB(1, 1, 1).multiplyScalar(.9 + (b.x * 13 + b.y * 7) % 10 / 100), () => '#C77A62');
    const TOWNC = ['#F6EFE3', '#F2E2C8', '#F4D8C8', '#EAD9B8', '#E8EEF0', '#F7E7B8', '#E9D4C4'];
    facadeMesh(town, TX.town, TX.townLit, b => col.set(TOWNC[(b.x * 3 + b.y * 5) % TOWNC.length]), () => '#CFC6B4');
    const tanks = [], domes = [];
    M.buildings.forEach(b => { const h = R.bHeight(b); if (b.tank) tanks.push([(b.x + b.w) * U - 1.6 - b.tankOff * .1, h, b.y * U + 1.8, b.tankCol]); if (b.walled && (b.chhatri || (b.x + b.y) % 4 === 0) && b.w > 1 && b.h > 1) domes.push([b.x * U + 2, h, b.y * U + 2]); });
    const tg = new THREE.CylinderGeometry(.8, .8, 1.5, 10); tg.translate(0, .75, 0);
    const ti = new THREE.InstancedMesh(tg, new THREE.MeshLambertMaterial({ color: '#ffffff' }), tanks.length);
    tanks.forEach(([x, y, z, c], i) => { dummy.position.set(x, y, z); dummy.scale.set(1, 1, 1); dummy.rotation.set(0, 0, 0); dummy.updateMatrix(); ti.setMatrixAt(i, dummy.matrix); ti.setColorAt(i, col.set(c)); });
    ti.castShadow = true; scene.add(ti);
    const cg = new THREE.SphereGeometry(1.1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2); cg.translate(0, 1.6, 0);
    const pg = new THREE.BoxGeometry(.18, 1.6, .18); pg.translate(0, .8, 0);
    const ci = new THREE.InstancedMesh(cg, mat('#F2B39E'), domes.length), pi = new THREE.InstancedMesh(pg, mat('#E58A71'), domes.length * 4);
    domes.forEach(([x, y, z], i) => { dummy.position.set(x, y, z); dummy.updateMatrix(); ci.setMatrixAt(i, dummy.matrix); [[-.8, -.8], [.8, -.8], [-.8, .8], [.8, .8]].forEach(([a, b], k) => { dummy.position.set(x + a, y, z + b); dummy.updateMatrix(); pi.setMatrixAt(i * 4 + k, dummy.matrix); }); });
    ci.castShadow = pi.castShadow = true; scene.add(ci); scene.add(pi);
    // cloth awnings over the bazaar arcades
    const aw = [], ACOL = ['#C2413B', '#2E5AA8', '#E0B23A', '#3F8F5A', '#E07B1A', '#7A5BA6', '#F6F1E7', '#B5603F'];
    const open = (tx, ty) => { const t = M.get(tx, ty); return t === TL.ROAD || t === TL.SIDE || t === TL.PLAZA; };
    for (const b of walled.concat(town.filter((b, i) => i % 3 === 0))) {
      const sides = [[0, 1, b.x, b.y + b.h, b.w], [0, -1, b.x, b.y - 1, b.w], [1, 0, b.x + b.w, b.y, b.h], [-1, 0, b.x - 1, b.y, b.h]];
      for (const [nx, nz, tx0, ty0, n] of sides) for (let k = 0; k < n; k++) {
        const tx = nx ? tx0 : tx0 + k, ty = nz ? ty0 : ty0 + k; if (!open(tx, ty) || hash2(tx * 3 + nx, ty * 5 + nz) < .35) continue;
        const cx = nx ? (nx > 0 ? (b.x + b.w) * U + .55 : b.x * U - .55) : (tx + .5) * U, cz = nz ? (nz > 0 ? (b.y + b.h) * U + .55 : b.y * U - .55) : (ty + .5) * U;
        aw.push([cx, cz, Math.atan2(nx, nz), ACOL[(tx * 7 + ty * 3) % ACOL.length]]);
      }
    }
    const ag = new THREE.BoxGeometry(3.4, .06, 1.5); ag.rotateX(.32); ag.translate(0, 3.3, 0);
    const ai = new THREE.InstancedMesh(ag, new THREE.MeshLambertMaterial({ color: '#ffffff', side: THREE.DoubleSide }), aw.length);
    aw.forEach(([x, z, ry, c], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, ry, 0); dummy.updateMatrix(); ai.setMatrixAt(i, dummy.matrix); ai.setColorAt(i, col.set(c)); });
    ai.castShadow = true; scene.add(ai);
    // electric poles + sagging wires; street lamps outside the walls
    const poles = [];
    for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) {
      if (M.get(x, y) !== TL.SIDE) continue; const z1 = M.zone[y * M.W + x];
      const rd = M.get(x, y - 1) === TL.ROAD ? [0, -1] : M.get(x, y + 1) === TL.ROAD ? [0, 1] : M.get(x - 1, y) === TL.ROAD ? [-1, 0] : M.get(x + 1, y) === TL.ROAD ? [1, 0] : null; if (!rd) continue;
      const along = rd[0] === 0 ? x : y; if (along % (z1 === 1 ? 3 : 4)) continue;
      poles.push({ x: (x + .5 + rd[0] * .35) * U, z: (y + .5 + rd[1] * .35) * U, row: (rd[0] === 0 ? 'h' : 'v') + (rd[0] === 0 ? y : x) + ',' + rd.join(), a: along, walled: z1 === 1, rd });
    }
    const plg = new THREE.CylinderGeometry(.12, .16, 8, 6); plg.translate(0, 4, 0);
    const pli = new THREE.InstancedMesh(plg, mat('#8A8580'), poles.length), lamps = [];
    poles.forEach((p, i) => { dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); pli.setMatrixAt(i, dummy.matrix); if (!p.walled) lamps.push(p); });
    pli.castShadow = true; scene.add(pli);
    const lg = new THREE.BoxGeometry(1.4, .18, .35); lg.translate(.6, 7.6, 0);
    R.lampMat = new THREE.MeshBasicMaterial({ color: '#5A5A5A' });
    const li = new THREE.InstancedMesh(lg, R.lampMat, lamps.length); lamps.forEach((p, i) => { dummy.position.set(p.x, 0, p.z); dummy.rotation.set(0, Math.atan2(p.rd[1], -p.rd[0]) + Math.PI, 0); dummy.updateMatrix(); li.setMatrixAt(i, dummy.matrix); }); scene.add(li);
    const groups = {}; poles.forEach(p => (groups[p.row] = groups[p.row] || []).push(p));
    const wv = [];
    Object.values(groups).forEach(arr => { arr.sort((a, b) => a.a - b.a); for (let i = 1; i < arr.length; i++) { const a = arr[i - 1], b = arr[i]; if (b.a - a.a > 5) continue; for (const [h, sag] of [[7.6, .7], [7.1, .9], [6.6, 1.2]]) { let px = a.x, py = h, pz = a.z; for (let s = 1; s <= 6; s++) { const t = s / 6, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t, y = h - Math.sin(t * Math.PI) * sag; wv.push(px, py, pz, x, y, z); px = x; py = y; pz = z; } } } });
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wv, 3));
    scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: '#2A2522' })));
    // handcarts (thelas) with umbrellas and produce
    const carts = []; for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) if (M.get(x, y) === TL.SIDE && hash2(x * 11, y * 17) < (M.zone[y * M.W + x] === 1 ? .045 : .012)) carts.push([(x + .5) * U, (y + .5) * U, hash2(x, y) * 6]);
    const cbg = new THREE.BoxGeometry(1.8, .15, 1); cbg.translate(0, .85, 0);
    const cpg = new THREE.SphereGeometry(.45, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2);
    const cug = new THREE.ConeGeometry(1.3, .6, 8); cug.translate(0, 2.4, 0);
    const cwg = new THREE.CylinderGeometry(.35, .35, 1.2, 10); cwg.rotateX(Math.PI / 2); cwg.translate(0, .35, 0);
    const cb = new THREE.InstancedMesh(cbg, mat('#7A4E2A'), carts.length), cp = new THREE.InstancedMesh(cpg, new THREE.MeshLambertMaterial({ color: '#fff' }), carts.length * 2), cu = new THREE.InstancedMesh(cug, new THREE.MeshLambertMaterial({ color: '#fff', side: THREE.DoubleSide }), carts.length), cw = new THREE.InstancedMesh(cwg, mat('#2B2B2B'), carts.length);
    const PRO = ['#E0402A', '#F2A41C', '#6FAE3A', '#F6D25A', '#8A3A6A', '#E07B1A'];
    carts.forEach(([x, z, r], i) => {
      dummy.position.set(x, 0, z); dummy.rotation.set(0, r, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); cb.setMatrixAt(i, dummy.matrix); cu.setMatrixAt(i, dummy.matrix); cw.setMatrixAt(i, dummy.matrix); cu.setColorAt(i, col.set(ACOL[i % ACOL.length]));
      for (let k = 0; k < 2; k++) { dummy.position.set(x + Math.cos(r) * (k - .5) * .9, .92, z - Math.sin(r) * (k - .5) * .9); dummy.scale.set(1, .7, 1); dummy.updateMatrix(); cp.setMatrixAt(i * 2 + k, dummy.matrix); cp.setColorAt(i * 2 + k, col.set(PRO[(i + k) % PRO.length])); }
    });
    [cb, cp, cu, cw].forEach(m => { m.castShadow = true; scene.add(m); });
    // trees (neem-like, two-lobed crowns)
    const tr = M.trees, trunkG = new THREE.CylinderGeometry(.25, .4, 3, 6); trunkG.translate(0, 1.5, 0);
    const tri = new THREE.InstancedMesh(trunkG, mat('#6B4F36'), tr.length), cri = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshPhongMaterial({ color: '#ffffff', flatShading: true, shininess: 0 }), tr.length * 2);
    tr.forEach((t, i) => {
      const r = t.r * S * 1.6; dummy.rotation.set(0, i, 0);
      dummy.position.set(t.x * S, 0, t.y * S); dummy.scale.set(1, 1 + r * .25, 1); dummy.updateMatrix(); tri.setMatrixAt(i, dummy.matrix);
      for (let k = 0; k < 2; k++) { dummy.position.set(t.x * S + (k ? r * .4 : -r * .2), 3 + r * (k ? .5 : .8), t.y * S + (k ? -r * .3 : r * .2)); dummy.scale.set(r * (k ? .7 : 1), r * (k ? .6 : .75), r * (k ? .7 : 1)); dummy.updateMatrix(); cri.setMatrixAt(i * 2 + k, dummy.matrix); cri.setColorAt(i * 2 + k, col.set(['#4F7F3C', '#5E8C46', '#6E9A4F', '#3F6B30'][(i + k) % 4])); }
    });
    tri.castShadow = cri.castShadow = true; scene.add(tri); scene.add(cri);
    // city wall with kangura battlements
    const walls = []; for (let y = 0; y < M.H; y++) for (let x = 0; x < M.W; x++) if (M.get(x, y) === TL.WALL) walls.push([x, y]);
    const wg2 = new THREE.BoxGeometry(U, 7, U * .9); wg2.translate(0, 3.5, 0);
    const wi = new THREE.InstancedMesh(wg2, mat('#D07A60'), walls.length);
    const mg = new THREE.ConeGeometry(.75, 1.4, 4); mg.translate(0, .7, 0);
    const mi = new THREE.InstancedMesh(mg, mat('#E9957B'), walls.length * 2);
    walls.forEach(([x, y], i) => {
      const horiz = M.get(x + 1, y) === TL.WALL || M.get(x - 1, y) === TL.WALL;
      dummy.position.set((x + .5) * U, 0, (y + .5) * U); dummy.rotation.set(0, horiz ? 0 : Math.PI / 2, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix(); wi.setMatrixAt(i, dummy.matrix);
      for (let k = 0; k < 2; k++) { dummy.position.set((x + .5) * U + (horiz ? (k - .5) * 2 : 0), 7, (y + .5) * U + (horiz ? 0 : (k - .5) * 2)); dummy.rotation.set(0, Math.PI / 4, 0); dummy.updateMatrix(); mi.setMatrixAt(i * 2 + k, dummy.matrix); }
    });
    wi.castShadow = wi.receiveShadow = true; mi.castShadow = true; scene.add(wi); scene.add(mi);
    for (const g of M.gates) buildCityGate(g);
    buildRamparts();
  }
  function buildCityGate(g) {
    const grp = new THREE.Group(), span = (g.a1 - g.a0 + 1) * U, mid = ((g.a0 + g.a1 + 1) / 2) * U, c = (g.c + .5) * U;
    const at = o => g.o === 'h' ? [mid + o, c] : [c, mid + o];
    [-1, 1].forEach(sd => { const [x, z] = at(sd * (span / 2 + 2.4)); box(grp, 4.8, 12, 5.4, '#D07A60', x, 0, z); box(grp, 3.2, .3, 3.2, '#FBE7DB', x, 12, z); for (let k = 0; k < 4; k++) cyl(grp, .15, .15, 1.6, '#E58A71', x + (k % 2 - .5) * 2.4, 12, z + ((k >> 1) - .5) * 2.4, 6); dome(grp, 1.8, mat('#F2B39E'), x, 13.6, z); });
    const [bx, bz] = at(0);
    box(grp, g.o === 'h' ? span + 1 : 5.4, 4, g.o === 'h' ? 5.4 : span + 1, '#E58A71', bx, 8, bz);
    box(grp, g.o === 'h' ? span + 2 : 6, .5, g.o === 'h' ? 6 : span + 2, '#FBE7DB', bx, 12, bz);
    dome(grp, 2.4, mat('#F2B39E'), bx, 12.5, bz);
    scene.add(grp);
  }
  function buildRamparts() {
    // walls snaking over the Aravalli ridges around Amer, Jaigarh and Nahargarh
    const paths = [[[8, 10], [16, 5], [24, 7], [32, 2]], [[57, 2], [64, 6], [72, 3], [80, 8], [82, 12]], [[78, 30], [81, 22], [79, 15], [83, 9]], [[20, 30], [28, 24], [36, 30], [42, 33]], [[118, 30], [126, 24], [134, 30], [140, 26]]];
    const seg = new THREE.BoxGeometry(1, 4, 1.6); seg.translate(0, 2, 0);
    const mer = new THREE.BoxGeometry(.7, .9, 1.7); mer.translate(0, 4.45, 0);
    const pieces = [], towers = [];
    for (const path of paths) for (let i = 1; i < path.length; i++) {
      const [ax, ay] = path[i - 1], [bx, by] = path[i], len = Math.hypot(bx - ax, by - ay) * U, n = Math.ceil(len / 1.4);
      for (let k = 0; k < n; k++) { const t = k / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t; pieces.push([x * U, R.heightAt(Math.round(x), Math.round(y)) - .5, y * U, Math.atan2(-(by - ay), bx - ax), len / n + .05]); }
      towers.push([bx * U, R.heightAt(bx, by) - .5, by * U]);
    }
    const si = new THREE.InstancedMesh(seg, mat('#D9A960'), pieces.length), mi = new THREE.InstancedMesh(mer, mat('#E3B97A'), pieces.length);
    pieces.forEach(([x, y, z, r, l], i) => { dummy.position.set(x, y, z); dummy.rotation.set(0, r, 0); dummy.scale.set(l, 1, 1); dummy.updateMatrix(); si.setMatrixAt(i, dummy.matrix); dummy.scale.set(i % 2 ? .01 : 1, 1, 1); dummy.updateMatrix(); mi.setMatrixAt(i, dummy.matrix); });
    si.castShadow = mi.castShadow = true; scene.add(si); scene.add(mi);
    towers.forEach(([x, y, z]) => { const g = new THREE.Group(); g.position.set(x, y, z); cyl(g, 2.2, 2.6, 6, '#D9A960', 0, 0, 0, 12); dome(g, 1.4, mat('#E3B97A'), 0, 6, 0); scene.add(g); });
  }

  // ================= landmarks, shops, cafes =================
  function placeGroup(p) {
    const g = new THREE.Group(), face = p.face || 's', W = p.w * U, D = p.h * U;
    g.position.set((p.x + p.w / 2) * U, 0, (p.y + p.h / 2) * U); g.rotation.y = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[face];
    const ew = face === 'e' || face === 'w';
    return { g, w: ew ? D : W, d: ew ? W : D };
  }
  const H3 = p => 6 + (p.hgt || 0) * .36;
  function chhatri(g, x, y, z, r, c1, c2) { for (let k = 0; k < 4; k++) cyl(g, r * .1, r * .1, r * 1.3, c2 || '#F3E3C3', x + (k % 2 - .5) * r * 1.3, y, z + ((k >> 1) - .5) * r * 1.3, 6); box(g, r * 1.8, r * .15, r * 1.8, c2 || '#F3E3C3', x, y + r * 1.3, z); dome(g, r, mat(c1 || '#F3E3C3'), x, y + r * 1.45, z); cyl(g, .03, .06, r * .5, '#C9A74A', x, y + r * 2.4, z, 6); }
  function signOnFacade(g, p, w, d, y, bg, fg) {
    const sw = Math.min(w * .85, 9), sh = sw / 3.2, sm = new THREE.MeshBasicMaterial({ map: signTex(p.name, p.food ? p.food.item : p.addr || '', bg, fg) }), dk = mat('#2B1B17');
    const b = new THREE.Mesh(K.boxG(sw, sh, .2), [dk, dk, dk, dk, sm, dk]); b.position.set(0, y, d / 2 + .12); g.add(b); return b;
  }
  const BUILD = {
    hawa(g, w, d) {
      // five storeys of honeycomb jharokhas: each bay a half-hexagon with its own little dome
      const tiers = [[1, 4.6], [.9, 4], [.8, 3.8], [.56, 3.6], [.34, 3.4]], bayM = repMat(TX.jharokha, '#ffffff', 2, 1), bayG = new THREE.CylinderGeometry(1.15, 1.15, 1, 3, 1, false, -Math.PI / 2, Math.PI);
      box(g, w, 9, d * .6, '#D6735A', 0, 0, -d * .18);
      let y = 0;
      tiers.forEach(([k, h], i) => {
        const tw = w * k, front = d / 2 - .8 - i * .5;
        fbox(g, tw, h, 3, '#DE7A60', TX.jharokha, 0, y, front - 1.5, 2.3);
        box(g, tw + .5, .3, 3.6, '#FBE7DB', 0, y + h, front - 1.5);
        const n = Math.max(2, Math.floor(tw / 2.6));
        for (let j = 0; j < n; j++) {
          const x = -tw / 2 + (j + .5) * tw / n, bay = new THREE.Mesh(bayG, bayM); bay.scale.set(1, h - .5, 1); bay.position.set(x, y + (h - .5) / 2 + .2, front); bay.castShadow = true; g.add(bay);
          const cap = add(g, K.cylG(1.35, 1.35, .18, 6), '#FBE7DB', x, y + h - .3, front - .1); cap.scale.z = .6;
          dome(g, .55, mat('#F2B39E'), x, y + h - .1, front - .2);
        }
        y += h;
      });
      for (let i = -2; i <= 2; i++) chhatri(g, i * 2.2, y + .3, d / 2 - 3.8, .6, '#F2B39E', '#FBE7DB');
      cyl(g, .25, .45, 3.5, '#E58A71', 0, y + .3, d / 2 - 5.5, 8); dome(g, .55, mat('#F2B39E'), 0, y + 3.8, d / 2 - 5.5); cyl(g, .05, .05, 1.6, '#E2A33A', 0, y + 4.3, d / 2 - 5.5, 6);
      box(g, 4, 3.6, .3, '#5A2A1E', 0, 0, d / 2 - .65, false);
    },
    amer(g, w, d) {
      // honey-sandstone palace: ramparts, Suraj Pol, Jaleb Chowk, Diwan-e-Aam pillars, painted Ganesh Pol
      const sand = '#E3B97A', deep = '#C9965A';
      tbox(g, w, 7, d, TX.sandstone, 0, 0, 0, 6);
      for (let x = -w / 2 + .8; x < w / 2; x += 2.6) box(g, 1.2, 1.1, 1.2, deep, x, 7, d / 2 - .6);
      [[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]].forEach(([x, z]) => { cyl(g, 3, 3.4, 9, deep, x, 0, z, 14); chhatri(g, x, 9, z, 1.2, sand, '#F3E3C3'); });
      const sp = new THREE.Group(); sp.position.set(w / 2 - 8, 7, d / 2 - 3); g.add(sp); tbox(sp, 8, 9, 5, TX.amerWin, 0, 0, 0, 4); box(sp, 3.4, 5, .3, '#3A2A1A', 0, 0, 2.6, false); chhatri(sp, -2.6, 9, 0, 1, sand); chhatri(sp, 2.6, 9, 0, 1, sand);
      box(g, w * .5, .2, d * .5, '#E8D4A8', -w * .05, 7, 0, false);
      const da = new THREE.Group(); da.position.set(-w * .18, 7.2, d * .05); g.add(da);
      box(da, 16, .8, 9, '#F3E3C3', 0, 0, 0);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) cyl(da, .35, .35, 4.4, j === 1 ? '#C46A4E' : '#F6EEDF', -7 + i * 2.8, .8, -3 + j * 3, 8);
      box(da, 17, .7, 10, '#F3E3C3', 0, 5.2, 0); box(da, 18, .25, 11, '#E3B97A', 0, 5.9, 0);
      const gp = new THREE.Group(); gp.position.set(w * .12, 7, -d * .05); g.add(gp);
      const gpm = new THREE.MeshLambertMaterial({ map: TX.ganeshPol });
      const gm = new THREE.Mesh(K.boxG(10, 12, 4), [mat(sand), mat(sand), mat(sand), mat(sand), gpm, mat(sand)]); gm.castShadow = true; gp.add(gm);
      for (let i = -1; i <= 1; i++) chhatri(gp, i * 3.4, 12, 0, .9, sand, '#F3E3C3');
      tbox(g, w * .45, 10, d * .35, TX.amerWin, w * .22, 7, -d * .3, 4); tbox(g, w * .3, 14, d * .3, TX.amerWin, -w * .25, 7, -d * .32, 4); tbox(g, w * .2, 18, d * .25, TX.amerWin, w * .02, 7, -d * .38, 4);
      [[w * .22, 17, -d * .3], [-w * .25, 21, -d * .32], [w * .02, 25, -d * .38]].forEach(([x, y, z]) => { chhatri(g, x - 4, y, z, 1.2, sand); chhatri(g, x + 4, y, z, 1.2, sand); });
      const r = box(g, 6, .6, 18, sand, -w / 2 + 6, 0, d / 2 + 2); r.rotation.x = -.35;
    },
    fort(g, w, d, p) {
      const h = H3(p) * .7, s2 = '#D9A960';
      tbox(g, w, h, 2.5, TX.sandstone, 0, 0, d / 2 - 1.25, 5); tbox(g, w, h, 2.5, TX.sandstone, 0, 0, -d / 2 + 1.25, 5);
      tbox(g, 2.5, h, d, TX.sandstone, -w / 2 + 1.25, 0, 0, 5); tbox(g, 2.5, h, d, TX.sandstone, w / 2 - 1.25, 0, 0, 5);
      for (let x = -w / 2 + 1; x < w / 2; x += 2.4) { box(g, 1.2, 1, 2.5, s2, x, h, d / 2 - 1.25); box(g, 1.2, 1, 2.5, s2, x, h, -d / 2 + 1.25); }
      tbox(g, w * .55, h * 1.6, d * .5, TX.amerWin, 0, 0, 0, 4);
      [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2]].forEach(([x, z]) => { cyl(g, 2.4, 2.8, h + 2, '#C9965A', x, 0, z); chhatri(g, x, h + 2, z, 1.1, '#E3B97A'); });
      for (let i = -1; i <= 1; i++) chhatri(g, i * w * .15, h * 1.6, 0, 1.1, '#F3E3C3');
      box(g, 6, h * .8, .3, '#3A2A1A', 0, 0, d / 2 + .05, false);
    },
    palace(g, w, d, p) {
      const h = H3(p) * .8, c = p.col;
      fbox(g, w, h, d * .25, c, TX.arcade, 0, 0, d / 2 - d * .125, 3.2); fbox(g, w, h, d * .25, c, TX.arcade, 0, 0, -d / 2 + d * .125, 3.2);
      box(g, w * .2, h, d * .5, c, -w / 2 + w * .1, 0, 0); box(g, w * .2, h, d * .5, c, w / 2 - w * .1, 0, 0);
      box(g, w * .6, .2, d * .5, '#8DB46B', 0, 0, 0); cyl(g, 1.5, 1.5, .5, '#7FB5C8', 0, 0, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => chhatri(g, a * (w / 2 - 2), h, b * (d / 2 - 2), 1.4, '#F6E6CC', '#F6E6CC'));
      box(g, w + .6, .6, 1, '#D97B66', 0, h, d / 2 - .3);
      if (p.id === 'citypalace') {
        // Chandra Mahal: the seven-storey residence, flying the flag
        fbox(g, 9, h * 2.2, 8, '#F2E3B0', TX.arcade, w * .2, 0, -d * .1, 2.6);
        for (let k = 0; k < 6; k++) box(g, 9.4, .3, 8.4, '#E58A71', w * .2, 3 + k * h * .35, -d * .1);
        box(g, .1, 6, .1, '#555', w * .2, h * 2.2, -d * .1); box(g, 2.2, 1.1, .05, '#E07B1A', w * .2 + 1.15, h * 2.2 + 4.8, -d * .1, false);
      }
    },
    albert(g, w, d, p) {
      const h = H3(p) * .75, c = p.col;
      fbox(g, w, h, d, c, TX.arcade, 0, 0, 0, 3); box(g, w + .6, .6, d + .6, '#FFF6E6', 0, h, 0);
      cyl(g, 5, 5, 4, c, 0, h, 0, 16); dome(g, 5.2, mat('#F4E6C8'), 0, h + 4, 0); cyl(g, .2, .2, 2.5, '#E2A33A', 0, h + 9, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => chhatri(g, a * (w / 2 - 2.5), h, b * (d / 2 - 2.5), 1.6, '#F4E6C8', c));
      box(g, w * .3, h * .7, 3, c, 0, 0, d / 2 + 1.5);
    },
    temple(g, w, d, p) {
      const h = H3(p) * .55, c = p.col;
      box(g, w, 2, d, shade(c, -.08), 0, 0, 0); fbox(g, w * .8, h, d * .7, c, TX.arcade, 0, 2, 0, 2.5);
      [[-w * .25, 1], [0, 1.45], [w * .25, 1]].forEach(([x, s]) => { for (let k = 0; k < 5; k++) cyl(g, (3 - k * .55) * s * .6, (3.2 - k * .55) * s, 1.9 * s, k % 2 ? shade(c, .1) : c, x, 2 + h + k * 1.9 * s, 0, 12); add(g, K.cylG(0, .5 * s, 1.8 * s, 8), '#E2A33A', x, 2 + h + 9.5 * s, 0); });
      cyl(g, .1, .1, 4, '#8A5A3B', 0, 2 + h + 15, 0); box(g, 2, 1.2, .1, '#E07B1A', 1, 2 + h + 17.5, 0, false);
    },
    shop(g, w, d, p) {
      // a halwai's shop: open front, glass counter of sweets, a big kadhai of oil
      const h = H3(p) * .85, walledZone = M.zoneAt(p.dx, p.dy) === 1;
      fbox(g, w, h, d, walledZone ? '#D98A6E' : '#E9D9C2', walledZone ? TX.walled : TX.town, 0, 0, -.5, 4);
      box(g, w, h * .45, .2, '#2B2018', 0, 0, d / 2 - .4, false);
      signOnFacade(g, p, w, d - 1, h * .55, p.awn || '#C2413B');
      const aw = box(g, w * .98, .08, 2.2, p.awn || '#C2413B', 0, 3.6, d / 2 + .6); aw.rotation.x = .3;
      if (p.food) {
        box(g, w * .55, 1, 1, '#C9CED6', -w * .15, 0, d / 2 + .9); box(g, w * .55, .55, .9, K.glass(), -w * .15, 1, d / 2 + .9);
        for (let i = 0; i < 10; i++) add(g, K.sphG(.12, 8, 6), K.phong(['#D99A3A', '#F2C230', '#E0577A', '#F6E8C8'][i % 4], 30), -w * .15 - w * .22 + i * w * .05, 1.15, d / 2 + .9);
        box(g, .8, .9, .8, '#5A3A2A', w * .28, 0, d / 2 + 1.2); add(g, K.cylG(.75, .45, .4, 16), '#2B2B2B', w * .28, .9, d / 2 + 1.2); add(g, K.cylG(.7, .7, .04, 16), K.phong('#D9A23A', 120), w * .28, 1.28, d / 2 + 1.2, false);
        if (p.food.dish === 'kachori') for (let i = 0; i < 9; i++) { const k = add(g, K.sphG(.16, 10, 6), K.phong('#C98A3A', 20), w * .28 + (i % 3 - 1) * .3, 1.3 + Math.floor(i / 3) * .08, d / 2 + 1.2 + (i % 2) * .2); k.scale.y = .5; }
        if (p.food.dish === 'chai') add(g, K.cylG(.25, .3, .5, 12), K.phong('#9AA0A6', 100), w * .28, 1.3, d / 2 + 1.2);
        if (p.food.dish === 'lassi' || p.food.dish === 'kulfi') for (let i = 0; i < 12; i++) add(g, K.cylG(.1, .08, .2, 10), '#A8553A', w * .2 + (i % 4) * .22, 1 + Math.floor(i / 4) * .2, d / 2 + 1.2);
      }
    },
    bazaar(g, w, d, p) {
      BUILD.shop(g, w, d, p);
      const pc = { gulabi: '#E0577A', neel: '#2E3A87', haldi: '#F2B01E' }[p.pigment] || '#F2A41C';
      for (let i = 0; i < 4; i++) { const x = -w / 2 + 1.5 + i * (w - 3) / 3; add(g, K.cylG(0, .8, 1, 12), i % 2 ? pc : shade(pc, .3), x, .7, d / 2 + 3); box(g, 1.8, .7, 1.8, '#8A5A3B', x, 0, d / 2 + 3); }
    },
    cafe(g, w, d, p) {
      const h = H3(p) * .9, warm = new THREE.MeshBasicMaterial({ color: '#FFD9A0' }), bulbs = [], look = p.look || 'curious';
      const glassFront = (frame, x0, x1, y0, y1) => { box(g, x1 - x0, y1 - y0, .15, K.phong('#FFE2B0', 80, { emissive: '#7A4A1A', transparent: true, opacity: .85 }), (x0 + x1) / 2, y0, d / 2 - .1, false); for (let x = x0; x <= x1 + .01; x += (x1 - x0) / 3) box(g, .15, y1 - y0, .25, frame, x, y0, d / 2); box(g, x1 - x0, .15, .25, frame, (x0 + x1) / 2, y1, d / 2); };
      const tablesOut = (n, z, top) => { for (let i = 0; i < n; i++) { const x = -w / 2 + 1.2 + i * (w - 2.4) / Math.max(1, n - 1); cyl(g, .45, .45, .05, top || '#FFFFFF', x, .75, z, 12); cyl(g, .05, .05, .75, '#333', x, 0, z, 5); box(g, .4, .45, .4, '#5A3A2A', x + .7, 0, z); box(g, .4, .45, .4, '#5A3A2A', x - .7, 0, z); } };
      if (look === 'curious') {
        box(g, w, h, d, '#2A2A2A', 0, 0, 0);
        glassFront('#111', -w / 2 + .6, w / 2 - .6, 0, h * .6);
        box(g, w + .2, h * .22, .4, '#151515', 0, h * .66, d / 2 + .1);
        signOnFacade(g, p, w, d + .6, h * .77, '#151515', '#F6F1E7');
        const dr = add(g, K.cylG(.8, .8, 1.2, 14), '#1E1E1E', -w * .25, .8, d / 2 - 1.5); dr.rotation.z = Math.PI / 2; add(g, K.cylG(.3, .6, .7, 10), K.phong('#B87333', 120), -w * .25, 1.9, d / 2 - 1.5);
        for (let i = 0; i < 4; i++) bulbs.push(add(g, K.sphG(.18, 8, 6), warm, -w / 2 + 1 + i * (w - 2) / 3, h * .55, d / 2 - .8, false));
        for (let i = 0; i < 2; i++) { add(g, K.cylG(.35, .25, .6, 10), '#E8E3DA', -w / 2 + .6 + i * (w - 1.2), 0, d / 2 + .8); add(g, K.sphG(.6, 8, 6), '#4F7F3C', -w / 2 + .6 + i * (w - 1.2), 1.1, d / 2 + .8); }
        box(g, 2.4, .45, .5, '#5A3A2A', 0, 0, d / 2 + 1.2);
      } else if (look === 'halflight') {
        box(g, w, h, d, '#F4F1EC', 0, 0, 0);
        for (let i = 0; i < 3; i++) { const x = -w / 2 + (i + .5) * w / 3, aw = w / 3 - 1; const a = new THREE.Mesh(new THREE.PlaneGeometry(aw, h * .5), K.phong('#FFE8C0', 80, { emissive: '#6A4A2A' })); a.position.set(x, h * .27, d / 2 + .02); g.add(a); const top = new THREE.Mesh(new THREE.CircleGeometry(aw / 2, 16, 0, Math.PI), K.phong('#FFE8C0', 80, { emissive: '#6A4A2A' })); top.position.set(x, h * .52, d / 2 + .02); g.add(top); }
        signOnFacade(g, p, w, d + .1, h * .82, '#F4F1EC', '#1F1F1F');
        for (let i = 0; i < 2; i++) { box(g, .9, .8, .9, '#D9D2C2', -w / 2 + .8 + i * (w - 1.6), 0, d / 2 + .9); add(g, K.sphG(.8, 8, 6), '#6E8A4A', -w / 2 + .8 + i * (w - 1.6), 1.9, d / 2 + .9); cyl(g, .06, .06, 1, '#5A4A3A', -w / 2 + .8 + i * (w - 1.6), .8, d / 2 + .9, 5); }
      } else if (look === 'doppler') {
        box(g, w, h, d, '#DDE9EE', 0, 0, 0); box(g, w + .1, .4, d + .1, '#F6F1E7', 0, h * .5, 0);
        const ar = new THREE.Mesh(new THREE.PlaneGeometry(w * .5, h * .4), K.phong('#FFE2B0', 80, { emissive: '#6A4A2A' })); ar.position.set(0, h * .2, d / 2 + .02); g.add(ar);
        const at = new THREE.Mesh(new THREE.CircleGeometry(w * .25, 20, 0, Math.PI), K.phong('#FFE2B0', 80, { emissive: '#6A4A2A' })); at.position.set(0, h * .4, d / 2 + .02); g.add(at);
        signOnFacade(g, p, w, d + .1, h * .82, '#263170', '#F6F1E7');
        box(g, w, .2, 2.6, '#E8E3DA', 0, 0, d / 2 + 1.3, false); tablesOut(2, d / 2 + 1.8);
      } else if (look === 'usual') {
        // a home turned into a cafe: bungalow, lawn, hedge and tables under a neem tree
        box(g, w * .8, h * .75, d * .6, '#F6EEDF', 0, 0, -d * .2); box(g, w * .84, .4, d * .64, '#E07B5A', 0, h * .75, -d * .2);
        for (let i = 0; i < 3; i++) box(g, 1.4, 1.8, .1, '#5A3A2A', -w * .25 + i * w * .25, .6, d * .1 + .02, false);
        box(g, w, .1, d * .4, '#7FAE5F', 0, 0, d * .3, false);
        box(g, w * .38, 1.1, .4, '#4F7F3C', -w * .31, 0, d / 2 - .2); box(g, w * .38, 1.1, .4, '#4F7F3C', w * .31, 0, d / 2 - .2);
        for (let i = 0; i < 2; i++) { const x = -w * .25 + i * w * .5; cyl(g, .5, .5, .05, '#FFFFFF', x, .75, d * .28, 10); cyl(g, .05, .05, .75, '#333', x, 0, d * .28, 5); add(g, K.cylG(0, 1.4, .5, 10), '#B85C4C', x, 2.2, d * .28); cyl(g, .04, .04, 2.2, '#555', x, 0, d * .28, 5); }
        cyl(g, .3, .45, 4, '#6B4F36', w * .42, 0, d * .2); add(g, K.sphG(2.4, 8, 6), '#4F7F3C', w * .42, 5, d * .2);
        signOnFacade(g, p, w * .7, d * .2, h * .55, '#F6EEDF', '#B85C4C');
      } else if (look === 'rustic') {
        tbox(g, w, h, d, TX.brick, 0, 0, 0, 2); glassFront('#3A2A22', -w / 2 + .8, w / 2 - .8, 0, h * .55);
        for (let i = 0; i < 3; i++) cyl(g, .12, .12, 3.6, '#5A3A2A', -w / 2 + .5 + i * (w - 1) / 2, 0, d / 2 + 2.6, 6);
        box(g, w, .15, 3, '#5A3A2A', 0, 3.6, d / 2 + 1.3);
        for (let i = 0; i < 10; i++) bulbs.push(add(g, K.sphG(.08, 6, 4), warm, -w / 2 + .4 + i * (w - .8) / 9, 3.4 - Math.sin(i / 9 * Math.PI) * .3, d / 2 + 2.6, false));
        signOnFacade(g, p, w, d + .1, h * .78, '#3A2A22', '#F2C230'); tablesOut(2, d / 2 + 1.6, '#8A5A3B');
      } else if (look === 'tapri') {
        // a rooftop tea house across from Central Park
        fbox(g, w, h, d, '#EAD9B8', TX.town, 0, 0, 0, 4);
        box(g, w, 1.1, .2, '#2B1B17', 0, h, d / 2 - .1); box(g, .2, 1.1, d, '#2B1B17', -w / 2 + .1, h, 0); box(g, .2, 1.1, d, '#2B1B17', w / 2 - .1, h, 0);
        for (let i = 0; i < 3; i++) { const x = -w / 2 + 1.5 + i * (w - 3) / 2; cyl(g, .45, .45, .05, '#F2C230', x, h + .75, 0, 10); cyl(g, .05, .05, .75, '#333', x, h, 0, 5); add(g, K.cylG(0, 1.4, .5, 10), '#2B1B17', x, h + 2.4, 0); cyl(g, .04, .04, 2.4, '#555', x, h, 0, 5); }
        for (let i = 0; i < 12; i++) bulbs.push(add(g, K.sphG(.08, 6, 4), warm, -w / 2 + .3 + i * (w - .6) / 11, h + 2.8 - Math.sin(i / 11 * Math.PI) * .4, d / 2 - .2, false));
        const kt = new THREE.Group(); kt.position.set(w / 2 - 1.2, h + 1.1, d / 2 - .8); g.add(kt); add(kt, K.cylG(.5, .7, .9, 12), '#F2C230', 0, 0, 0); dome(kt, .5, mat('#F2C230'), 0, .9, 0); const sp = add(kt, K.cylG(.08, .15, .8, 6), '#F2C230', .6, .3, 0); sp.rotation.z = -1;
        signOnFacade(g, p, w, d, h * .6, '#2B1B17', '#F2C230');
      }
      R.bulbs.push(...bulbs);
    },
    haveli(g, w, d, p) {
      const h = H3(p) * .8;
      fbox(g, w, h, d, '#D98A6E', TX.walled, 0, 0, 0, 4);
      const jb = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 2.4, 3, 1, false, -Math.PI / 2, Math.PI), repMat(TX.jharokha, '#fff', 2, 1)); jb.position.set(0, h * .6, d / 2); g.add(jb); dome(g, .8, mat('#F2B39E'), 0, h * .6 + 1.2, d / 2 - .2);
      chhatri(g, -w / 2 + 1.5, h, -d / 2 + 1.5, .8, '#F2B39E', '#FBE7DB'); chhatri(g, w / 2 - 1.5, h, -d / 2 + 1.5, .8, '#F2B39E', '#FBE7DB');
      signOnFacade(g, p, w * .6, d, 3.2, '#B85C4C');
      box(g, w * .5, 1, 1.2, '#8A5A3B', 0, 0, d / 2 + 1.2); add(g, K.cylG(.75, .45, .4, 16), '#2B2B2B', 0, 1, d / 2 + 1.2);
    },
    jantar(g, w, d) {
      box(g, w, .2, d, '#EAD6BA', 0, 0, 0, false);
      const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(d * .8, 0); sh.lineTo(0, 16); sh.lineTo(0, 0);
      const eg = new THREE.ExtrudeGeometry(sh, { depth: 2.4, bevelEnabled: false }); eg.rotateY(-Math.PI / 2); eg.translate(1.2, 0, -d * .4);
      add(g, eg, '#D9A55F', -w * .2, 0, 0);
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(6, 6, 4, 24, 1, true), new THREE.MeshLambertMaterial({ color: '#D9A55F', side: THREE.DoubleSide })); ring.position.set(w * .25, 2, -d * .1); ring.castShadow = true; g.add(ring);
      cyl(g, .8, .8, 4, '#C08A48', w * .25, 0, -d * .1);
      const bw = new THREE.Mesh(new THREE.SphereGeometry(3.5, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#E6C79A', side: THREE.DoubleSide })); bw.position.set(w * .25, 3.5, d * .3); g.add(bw);
    },
    stepwell(g, w, d) {
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: TX.stairs })); pl.rotation.x = -Math.PI / 2; pl.position.y = .1; pl.receiveShadow = true; g.add(pl);
      box(g, w, 1.2, .8, '#C9A06A', 0, 0, d / 2); box(g, w, 1.2, .8, '#C9A06A', 0, 0, -d / 2); box(g, .8, 1.2, d, '#C9A06A', w / 2, 0, 0); box(g, .8, 1.2, d, '#C9A06A', -w / 2, 0, 0);
    },
    jalmahal(g, w, d, p) {
      const c = p.col; tbox(g, w, 7, d, TX.amerWin, 0, 0, 0, 2.6); box(g, w + .4, .5, d + .4, '#FFF6E6', 0, 7, 0);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => chhatri(g, a * (w / 2 - 1.5), 7.5, b * (d / 2 - 1.5), 1.2, '#F4E6C8', c));
      box(g, w * .5, 2.4, d * .5, c, 0, 7, 0);
    },
    gate(g, w, d) {
      const cols = ['#E0577A', '#2E3A87', '#F2A41C', '#3F8F5A', '#C2413B', '#4DA3C7', '#7A5BA6'], n = 9, h = 11;
      for (let i = 0; i <= n; i++) box(g, 1.6, h, d * .6, cols[i % cols.length], -w / 2 + i * w / n, 0, 0);
      box(g, w + 2, 2.4, d * .7, '#F6D58A', 0, h, 0); box(g, w + 2.6, .5, d * .8, '#E0577A', 0, h + 2.4, 0);
      for (let i = 0; i < 5; i++) chhatri(g, -w / 2 + (i + .5) * w / 5, h + 2.9, 0, 1.2, i % 2 ? '#F2A41C' : '#E0577A', '#F6E6CC');
      box(g, 3.6, h + 6, 3.6, '#F2A41C', 0, 0, 0); dome(g, 2.6, mat('#E0577A'), 0, h + 6, 0);
    },
    stadium(g, w, d) {
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.15, 8, 32, 1, true), new THREE.MeshLambertMaterial({ color: '#CFC6B4', side: THREE.DoubleSide })); ring.scale.set(w / 2, 1, d / 2); ring.position.y = 4; ring.castShadow = true; g.add(ring);
      const field = new THREE.Mesh(new THREE.CircleGeometry(1, 32), mat('#6FA35A')); field.rotation.x = -Math.PI / 2; field.scale.set(w / 2 - 1, d / 2 - 1, 1); field.position.y = .15; g.add(field);
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { cyl(g, .25, .25, 16, '#888', a * w * .45, 0, b * d * .45, 6); box(g, 2, 1, .4, '#FFFBE6', a * w * .45, 16, b * d * .45); });
    },
    mall(g, w, d, p) { const h = H3(p) * .8, gm = repMat(TX.glass, '#ffffff', w / 4, h / 4), pl = mat('#9CC3D5'); const m = new THREE.Mesh(K.boxG(w, h, d), [gm, gm, pl, pl, gm, gm]); m.castShadow = true; g.add(m); box(g, w + .6, .8, d + .6, '#E8E3DA', 0, h, 0); },
    village(g, w, d) {
      box(g, w, .1, d, '#D9925A', 0, 0, 0, false);
      box(g, .6, 1.6, d, '#B5603F', -w / 2, 0, 0); box(g, .6, 1.6, d, '#B5603F', w / 2, 0, 0); box(g, w, 1.6, .6, '#B5603F', 0, 0, -d / 2);
      for (let i = 0; i < 9; i++) { const x = -w / 2 + 4 + (i * 13.7) % (w - 8), z = -d / 2 + 4 + (i * 9.3) % (d - 10); cyl(g, 2.2, 2.2, 2.6, '#E8C27E', x, 0, z, 10); add(g, K.cylG(0, 2.9, 2.4, 10), '#A8743F', x, 2.6, z); }
    },
    cinema(g, w, d, p) { const h = H3(p) * .75, c = p.col; fbox(g, w, h, d, c, TX.arcade, 0, 0, 0, 3); for (let i = 0; i < 6; i++) dome(g, w / 13, mat(shade(c, .25)), -w / 2 + (i + .5) * w / 6, h, d / 2 - 1); box(g, w * .6, 3, 1, '#F7D9D4', 0, h - 4, d / 2 + .5); },
    station(g, w, d, p) {
      const h = H3(p) * .7, c = p.col;
      fbox(g, w, h, d, c, TX.arcade, 0, 0, 0, 3.2);
      for (let x = -w / 2 + .8; x < w / 2; x += 2.2) box(g, 1.1, 1, 1, shade(c, -.2), x, h, d / 2 - .5);
      box(g, 6, h + 7, 6, shade(c, .1), 0, 0, d / 2 - 3);
      const clock = new THREE.Mesh(new THREE.CircleGeometry(1.8, 20), mat('#FFF6EC')); clock.position.set(0, h + 4, d / 2 + .02); g.add(clock);
      dome(g, 3, mat(shade(c, .3)), 0, h + 7, d / 2 - 3); [-1, 1].forEach(a => chhatri(g, a * (w / 2 - 2), h, 0, 1.4, shade(c, .3), c));
    },
    garage(g, w, d) {
      const h = 7, cm = new THREE.MeshLambertMaterial({ map: TX.corrugated });
      const m = new THREE.Mesh(K.boxG(w, h, d), [cm, cm, mat('#8FA9B8'), cm, cm, cm]); m.castShadow = m.receiveShadow = true; g.add(m);
      box(g, w * .7, h * .8, .2, '#3A3A3A', 0, 0, d / 2 + .05, false); box(g, w * .7, .5, .3, '#F2A41C', 0, h * .8, d / 2 + .1, false);
    },
    jkk(g, w, d, p) {
      for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { if (i === 2 && k === 0) continue; box(g, w / 3 - .6, 5 + ((i * 3 + k) % 3) * 2, d / 3 - .6, (i + k) % 2 ? p.col : shade(p.col, .1), -w / 3 + i * w / 3, 0, -d / 3 + k * d / 3); }
      R.muralMat = new THREE.MeshLambertMaterial({ color: '#F6EEDF' }); const mural = new THREE.Mesh(new THREE.PlaneGeometry(w * .6, 5), R.muralMat); mural.position.set(0, 3, d / 2 + .05); g.add(mural); R.refreshMural();
    },
    block(g, w, d, p) { fbox(g, w, H3(p) * .7, d, '#E9D9C2', TX.town, 0, 0, 0, 4); },
  };
  R.bulbs = [];
  R.refreshMural = function () { if (R.muralMat && J.state && J.state.artImg) { const t = new THREE.Texture(J.state.artImg); t.needsUpdate = true; R.muralMat.map = t; R.muralMat.color.set('#ffffff'); R.muralMat.needsUpdate = true; } };
  function buildPlaces() {
    for (const p of J.PLACES) {
      if (p.kind === 'spot') continue;
      const { g, w, d } = placeGroup(p);
      (BUILD[p.id === 'amer' ? 'amer' : p.style] || BUILD.block)(g, w, d, p);
      if (!['shop', 'cafe', 'bazaar', 'haveli'].includes(p.style)) {
        const sw = Math.min(w * .5, 7), stone = mat('#C9B48A');
        const pl = new THREE.Mesh(K.boxG(sw, sw / 3.2, .3), [stone, stone, stone, stone, new THREE.MeshBasicMaterial({ map: signTex(p.name, 'Jaipur', '#3A2A1E', '#F6E6CC') }), stone]);
        pl.position.set(-w * .3, .3, d / 2 + 2.4); g.add(pl); box(g, sw + .4, .3, .6, '#C9B48A', -w * .3, 0, d / 2 + 2.4);
      }
      scene.add(g);
    }
    for (const ci of M.circles) {
      const g = new THREE.Group(); g.position.set((ci.cx + .5) * U, 0, (ci.cy + .5) * U);
      cyl(g, ci.rc * U, ci.rc * U, .4, '#7FAE5F', 0, 0, 0, 24);
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; K.sph(g, .6, i % 2 ? '#E0577A' : '#F2A41C', Math.cos(a) * ci.rc * U * .8, .5, Math.sin(a) * ci.rc * U * .8); }
      if (ci.id === 'statue') { box(g, 3, 4, 3, '#D9C49A', 0, 0, 0); box(g, 3.6, .5, 3.6, '#B9A47A', 0, 4, 0); const st = K.person({ top: '#4A4038', kurta: true, bottom: '#4A4038', skin: '#4A4038', turban: '#4A4038', shoes: '#4A4038' }); st.scale.setScalar(2); st.position.y = 4.5; st.rotation.y = -Math.PI / 2; g.add(st); }
      else { cyl(g, 3, 3.4, 1, '#E8E3DA', 0, 0, 0, 20); const wtr = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, .2, 20), K.phong('#7FC4DA', 80)); wtr.position.y = 1; g.add(wtr); cyl(g, .3, .5, 3, '#E8E3DA', 0, 1, 0, 8); }
      scene.add(g);
    }
    const ringG = new THREE.RingGeometry(1.4, 1.8, 24); ringG.rotateX(-Math.PI / 2);
    for (const p of J.PLACES) if (['food', 'cafe', 'garage'].includes(p.kind)) { const r = new THREE.Mesh(ringG, K.basic('#C2413B', { transparent: true, opacity: .7 })); r.position.set(p.dx * S, .08, p.dy * S); scene.add(r); }
  }

  // ================= moving things =================
  const live = new Set(); let seen = new Set();
  R.sirens = [];
  function ensure(o, build) {
    let g = o.__g; const key = (o.driver || '') + (o.type || '') + (o.fallen ? 'f' : '');
    if (g && o.__key !== key) { scene.remove(g); g = null; }
    if (!g) { g = build(o); o.__g = g; o.__key = key; scene.add(g); live.add(o); }
    g.position.set(o.x * S, 0, o.y * S); g.rotation.y = -(o.a || 0); seen.add(o); return g;
  }
  R.playerLook = () => J.LOOKS[(J.state && J.state.look) || 'kurta'];
  function vehicleDynamics(v, g, dt) {
    const u = g.userData, VT = J.VEH[v.type]; if (!u.body) return;
    for (const w of u.wheels) w.m.rotation.z -= (v.v * S * dt) / w.r;
    if (v.fallen) { u.body.rotation.set(VT.two ? 1.35 : 0, 0, 0); u.body.position.y = VT.two ? .25 : 0; return; }
    const target = VT.two ? (v.steer || 0) * Math.min(1, Math.abs(v.v) / 200) * .45 : -(v.steer || 0) * Math.min(1, Math.abs(v.v) / 300) * .05;
    v.lean = (v.lean || 0) + (target - (v.lean || 0)) * Math.min(1, dt * 6);
    v.pitch = (v.pitch || 0) + ((v.accel || 0) * (VT.two ? .00006 : .00012) - (v.pitch || 0)) * Math.min(1, dt * 5);
    u.body.rotation.x = v.lean; u.body.rotation.z = Math.max(-.06, Math.min(.06, v.pitch));
    if (v.type === 'auto' && Math.abs(v.v) > 20) u.body.position.y = Math.sin(J.world.time * 30) * .012;
  }
  function syncEntities(dt) {
    seen = new Set();
    const W = J.world, P = W.pos(), range = (mobile ? 150 : 230) / S, r2 = range * range;
    const near = o => { const dx = o.x - P.x, dy = o.y - P.y; return dx * dx + dy * dy < r2; };
    R.sirens = R.sirens.filter(s => s.parent);
    for (const v of W.vehicles) if (near(v)) vehicleDynamics(v, ensure(v, K.vehicle), dt);
    if (W.player.veh) vehicleDynamics(W.player.veh, ensure(W.player.veh, K.vehicle), dt);
    const pr = (mobile ? 90 : 140) / S, pr2 = pr * pr;
    for (const p of W.peds) { const dx = p.x - P.x, dy = p.y - P.y; if (dx * dx + dy * dy > pr2) continue; const g = ensure(p, o => K.person(o.look || (o.look = K.randomPerson(Math.random() * 1e6 | 0)))); K.animPerson(g, p.walk, p.down <= 0, p.down > 0 ? 1 : 0, p.spin); }
    for (const k of W.cows) if (near(k)) ensure(k, K.cow);
    for (const m of W.monkeys) if (near(m)) ensure(m, K.monkey);
    const pl = W.player, lk = J.state.look || 'kurta';
    if (R.playerKey !== lk) { if (R.playerG) scene.remove(R.playerG); R.playerG = null; R.playerKey = lk; }
    if (!pl.veh && !R.meal) {
      if (!R.playerG) { R.playerG = K.person(R.playerLook()); scene.add(R.playerG); }
      R.playerG.visible = true; R.playerG.position.set(pl.x * S, 0, pl.y * S); R.playerG.rotation.y = -pl.a;
      K.animPerson(R.playerG, pl.walk, pl.moving, pl.down > 0 ? Math.min(1, (2.8 - pl.down) * 4) : 0, pl.spin);
    } else if (R.playerG) R.playerG.visible = false;
    for (const n of R.npcs) { const p = J.PLACE[n.place()]; if (!p || (R.meal && R.meal.hide === n.id)) { n.g.visible = false; continue; } n.g.visible = true; n.x = p.dx + n.off[0]; n.y = p.dy + n.off[1]; n.g.position.set(n.x * S, 0, n.y * S); n.g.rotation.y = -Math.atan2(pl.y - n.y, pl.x - n.x); K.animPerson(n.g, 0, false, 0); }
    for (const o of live) if (!seen.has(o)) { scene.remove(o.__g); o.__g = null; live.delete(o); }
    const on = (W.time * 6 | 0) % 2; R.sirens.forEach(s => s.material = K.basic(on ? '#E23B3B' : '#3B6BE2'));
  }
  R.npcs = [];
  function buildNPCs() {
    [
      { id: 'chintu', name: 'Chintu', place: () => 'garage', off: [-20, -8], look: { top: '#4DA3C7', bottom: '#3A3A44', skin: '#B47650', mustache: true, cap: '#F2A41C' } },
      { id: 'dadi', name: 'Dadi', place: () => 'dadi', off: [18, 8], look: { saree: '#B85C4C', blouse: '#F2A41C', skin: '#C68B62', grey: true, long: true } },
      { id: 'meera', name: 'Meera', place: () => (J.state.ch >= 3 ? 'jkk' : 'curious'), off: [22, -6], look: { top: '#7A5BA6', kurta: true, bottom: '#2B1B17', dupatta: '#F2C230', skin: '#B47650', long: true, bag: '#E0577A' } },
      { id: 'ishaan', name: 'Ishaan', place: () => 'curious', off: [-22, -6], look: { top: '#2F5D50', bottom: '#3A3A44', skin: '#C68B62' } },
    ].forEach(d => { d.g = K.person(d.look); scene.add(d.g); R.npcs.push(d); });
  }

  // ================= markers =================
  const markers = [];
  function marker(i) {
    if (markers[i]) return markers[i];
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 70, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#F2A41C', transparent: true, opacity: .25, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    beam.position.y = 35; g.add(beam);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, .22, 6, 32), K.basic('#F2A41C')); ring.rotation.x = Math.PI / 2; ring.position.y = .3; g.add(ring);
    const chev = new THREE.Mesh(new THREE.ConeGeometry(.9, 1.6, 4), K.basic('#F2A41C')); chev.rotation.x = Math.PI; chev.position.y = 5; g.add(chev);
    g.userData = { ring, chev }; scene.add(g); markers[i] = g; return g;
  }

  // ================= camera =================
  R.yawOff = 0; R.lastDrag = 0; R.shake = 0; let camYaw = 0, camInit = false, fov = 62;
  const lerpA = (a, b, k) => a + J.world.angDiff(b, a) * k;
  R.cine = null; R.meal = null;
  function setFov(f, dt) { fov += (f - fov) * Math.min(1, dt * 3); if (Math.abs(camera.fov - fov) > .05) { camera.fov = fov; camera.updateProjectionMatrix(); } }
  function updateCamera(dt) {
    const W = J.world, P = W.pos(), v = W.player.veh, tx = P.x * S, tz = P.y * S, t = W.time;
    if (R.meal && R.meal.cam) { const c = R.meal.cam; if (R.meal.snap) { camera.position.copy(c.pos); R.meal.snap = false; } camera.position.lerp(c.pos, 1 - Math.exp(-dt * 4)); camera.lookAt(c.look); setFov(50, dt); return; }
    if (R.cine) { const c = R.cine; c.t += dt; const k = Math.min(1, c.t / c.dur), e = k * k * (3 - 2 * k); camera.position.lerpVectors(c.from, c.to, e); tmpV.lerpVectors(c.lookFrom, c.look, e); camera.lookAt(tmpV); return; }
    const heading = v ? v.a : W.player.a;
    if (!camInit) { camYaw = heading; camInit = true; R.snapNext = true; }
    if (performance.now() - R.lastDrag > 1500 && (v ? Math.abs(v.v) > 30 : W.player.moving)) R.yawOff *= Math.exp(-dt * 1.5);
    camYaw = lerpA(camYaw, heading, 1 - Math.exp(-dt * (v ? 3.2 : 2.5)));
    const yaw = camYaw + R.yawOff;
    const VT = v && J.VEH[v.type], spd = v ? Math.min(1, Math.abs(v.v) / 400) : 0;
    const dist = v ? (VT.two ? 6 : VT.l * S * 1.5 + 4.5) + spd * 2.5 : 4.8, hgt = v ? (VT.two ? 2.4 : 2.8) + dist * .14 : 2.4;
    let d = dist;
    for (let s = 1; s <= dist; s += .5) { const tt = M.tileAt((tx - Math.cos(yaw) * s) / S, (tz - Math.sin(yaw) * s) / S); if (tt === TL.BLD || tt === TL.LM || tt === TL.WALL || tt === TL.HILL) { d = Math.max(2, s - .8); break; } }
    tmpV.set(tx - Math.cos(yaw) * d, hgt + (dist - d) * .35, tz - Math.sin(yaw) * d);
    if (R.snapNext) { camera.position.copy(tmpV); R.snapNext = false; } else camera.position.lerp(tmpV, 1 - Math.exp(-dt * 10));
    // road feel: vibration grows with speed and rough ground; two-wheelers and autos buzz more
    if (v) {
      const tile = M.tileAt(v.x, v.y), rough = tile === TL.ROAD ? 1 : tile === TL.PLAZA || tile === TL.SIDE ? 2.2 : 3.5;
      const amp = (Math.abs(v.v) / 400) * .03 * rough * (VT.two || v.type === 'auto' ? 1.6 : 1) + (v.type === 'bike' ? .006 : 0);
      camera.position.x += Math.sin(t * 61) * amp; camera.position.y += Math.sin(t * 47 + 1) * amp * 1.4; camera.position.z += Math.cos(t * 53) * amp;
    }
    if (R.shake > 0) { R.shake = Math.max(0, R.shake - dt * 2.5); camera.position.x += (Math.random() - .5) * R.shake; camera.position.y += (Math.random() - .5) * R.shake; }
    tmpV.set(tx + Math.cos(yaw) * 3, v ? 1.2 : (W.player.down > 0 ? .5 : 1.5), tz + Math.sin(yaw) * 3); camera.lookAt(tmpV);
    if (v && VT.two) camera.rotateZ(-(v.lean || 0) * .25);
    setFov(62 + spd * 12, dt);
    J.camA = yaw;
  }
  R.startCine = function (p, dur) {
    const face = p.face || 's', out = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[face], dx = p.dx * S, dz = p.dy * S;
    R.cine = { t: 0, dur: dur || 1.4, from: camera.position.clone(), lookFrom: new THREE.Vector3(J.world.pos().x * S, 1.5, J.world.pos().y * S), to: new THREE.Vector3(dx + out[0] * 12 + out[1] * 5, 4.5, dz + out[1] * 12 - out[0] * 5), look: new THREE.Vector3(dx - out[0] * 3, 3, dz - out[1] * 3) };
  };
  R.endCine = function () { R.cine = null; };
  R.snapCam = function () { camInit = false; };
  R.add = o => scene.add(o); R.remove = o => scene.remove(o);

  // ================= day / night =================
  const SKY = [[0, '#141a3a'], [5, '#1d2448'], [6.3, '#F2A98A'], [7.6, '#BFE0F0'], [16, '#BFE0F0'], [17.3, '#F6B26B'], [18.5, '#C0607A'], [19.6, '#2A2850'], [24, '#141a3a']];
  const cA = new THREE.Color(), cB = new THREE.Color();
  function skyAt(h) { for (let i = 0; i < SKY.length - 1; i++) { const [h0, a] = SKY[i], [h1, b] = SKY[i + 1]; if (h >= h0 && h <= h1) { cA.set(a); cB.set(b); return cA.lerp(cB, (h - h0) / (h1 - h0)); } } return cA.set(SKY[0][1]); }
  function updateLight() {
    const h = J.state.time, sky = skyAt(h);
    scene.background.copy(sky); scene.fog.color.copy(sky);
    const day = h > 6 && h < 19 ? Math.sin((h - 6) / 13 * Math.PI) : 0, dark = Math.max(0, 1 - day * 2.2);
    sun.intensity = .3 + day * .9; hemi.intensity = .4 + day * .45;
    const golden = Math.max(0, 1 - Math.abs(h - 17.6) / 1.6) + Math.max(0, 1 - Math.abs(h - 6.8) / 1.2);
    sun.color.setRGB(1, 1 - golden * .25, 1 - golden * .45);
    hemi.color.copy(sky).lerp(cB.set('#ffffff'), .5); if (dark > .05) hemi.color.lerp(cB.set('#6070b0'), dark * .6);
    R.litMats.forEach(m => m.emissive.setRGB(dark * .95, dark * .9, dark * .8));
    R.lampMat.color.set(dark > .3 ? '#FFE2A0' : '#5A5A5A');
    headlight.intensity = dark > .3 && J.world.player.veh ? 1.8 : 0;
    R.dark = dark;
  }

  // ================= public =================
  R.init = function (canvas) {
    if (built) return;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !mobile, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
    renderer.shadowMap.enabled = !mobile; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene(); scene.background = new THREE.Color('#BFE0F0'); scene.fog = new THREE.Fog('#BFE0F0', 80, mobile ? 230 : 330);
    camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .05, 900);
    hemi = new THREE.HemisphereLight('#ffffff', '#C9A27A', .7); scene.add(hemi);
    sun = new THREE.DirectionalLight('#fff1dd', .9); sun.castShadow = !mobile;
    sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, near: 1, far: 300 }); sun.shadow.bias = -.0008;
    scene.add(sun); scene.add(sun.target);
    headlight = new THREE.SpotLight('#ffe2a8', 0, 45, .6, .5, 1); scene.add(headlight); scene.add(headlight.target);
    makeTextures(); buildGround(); buildStreets(); buildPlaces(); buildNPCs();
    R.resize(); built = true;
  };
  R.resize = function () { if (!renderer) return; renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  R.render = function (dt) {
    if (!built) return;
    syncEntities(dt); updateCamera(dt); updateLight();
    if (R.meal && R.meal.update) R.meal.update(dt);
    const P = J.world.pos(), px = P.x * S, pz = P.y * S;
    sun.position.set(px - 60, 110, pz - 45); sun.target.position.set(px, 0, pz); sun.target.updateMatrixWorld();
    const v = J.world.player.veh; if (v) { headlight.position.set(px + Math.cos(v.a) * 2, 1.4, pz + Math.sin(v.a) * 2); headlight.target.position.set(px + Math.cos(v.a) * 20, 0, pz + Math.sin(v.a) * 20); headlight.target.updateMatrixWorld(); }
    const tg = R.meal ? [] : J.missions.targets(), t = J.world.time;
    markers.forEach(m => m.visible = false);
    tg.forEach((o, i) => { const m = marker(i); m.visible = true; m.position.set(o.x * S, 0, o.y * S); m.userData.chev.position.y = 5 + Math.sin(t * 3) * .5; m.userData.chev.rotation.y = t * 2; m.userData.ring.scale.setScalar(1 + Math.sin(t * 4) * .08); });
    renderer.render(scene, camera);
  };
  R.project = function (xpx, ypx, h) {
    tmpV.set(xpx * S, h || 0, ypx * S).project(camera);
    return { x: (tmpV.x + 1) / 2 * innerWidth, y: (1 - tmpV.y) / 2 * innerHeight, on: tmpV.z < 1 && Math.abs(tmpV.x) < 1.05 && Math.abs(tmpV.y) < 1.05 };
  };
})(window.J);
