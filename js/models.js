/* Procedural 3D models: people, Indian vehicles, animals, food. Units: metres. Vehicles face +x, +z is their right side. */
(function (J) {
  const K = J.K = {}, cache = {}, gcache = {};
  const C = (k, f) => cache[k] || (cache[k] = f());
  K.mat = (col, o) => C('l' + col + (o ? JSON.stringify(o) : ''), () => new THREE.MeshLambertMaterial(Object.assign({ color: col }, o || {})));
  K.phong = (col, shin, o) => C('p' + col + shin + (o ? JSON.stringify(o) : ''), () => new THREE.MeshPhongMaterial(Object.assign({ color: col, shininess: shin || 60, specular: '#666666' }, o || {})));
  K.basic = (col, o) => C('b' + col + (o ? JSON.stringify(o) : ''), () => new THREE.MeshBasicMaterial(Object.assign({ color: col }, o || {})));
  K.chrome = () => K.phong('#D9DEE3', 120, { specular: '#ffffff' });
  K.glass = () => K.phong('#1D2833', 120, { specular: '#9fb6c8', side: THREE.DoubleSide });
  const G = (k, f) => gcache[k] || (gcache[k] = f());
  K.boxG = (w, h, d) => G('b' + [w, h, d].map(n => n.toFixed(3)), () => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return g; });
  K.cylG = (rt, rb, h, s) => G('c' + [rt, rb, h, s], () => { const g = new THREE.CylinderGeometry(rt, rb, h, s || 12); g.translate(0, h / 2, 0); return g; });
  K.sphG = (r, ws, hs) => G('s' + [r, ws, hs], () => new THREE.SphereGeometry(r, ws || 12, hs || 8));
  K.domeG = r => G('d' + r, () => new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2));
  K.add = (p, geo, m, x, y, z, sh) => { const mesh = new THREE.Mesh(geo, typeof m === 'string' ? K.mat(m) : m); mesh.position.set(x || 0, y || 0, z || 0); if (sh !== false) mesh.castShadow = true; p.add(mesh); return mesh; };
  K.box = (p, w, h, d, m, x, y, z, sh) => K.add(p, K.boxG(w, h, d), m, x, y, z, sh);
  K.cyl = (p, rt, rb, h, m, x, y, z, s) => K.add(p, K.cylG(rt, rb, h, s), m, x, y, z);
  K.sph = (p, r, m, x, y, z, sx, sy, sz) => { const s = K.add(p, K.sphG(r), m, x, y, z); if (sx) s.scale.set(sx, sy, sz); return s; };
  K.tex = (w, h, fn, rep) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d'), w, h); const t = new THREE.CanvasTexture(cv); if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; return t; };
  const { box, cyl, sph, add } = K;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];

  // ================= PEOPLE =================
  J.LOOKS = {
    kurta: { label: 'Kurta', top: '#F2A41C', kurta: true, bottom: '#F6F1E7', shoes: '#7A4E2A', hair: '#1E1612', skin: '#C68B62', bag: '#2F5D50' },
    kurti: { label: 'Kurti & dupatta', top: '#E0577A', kurta: true, bottom: '#263170', dupatta: '#F2C14E', shoes: '#C9A74A', hair: '#1E1612', long: true, skin: '#C68B62', bag: '#7A5BA6' },
    street: { label: 'Hoodie & cap', top: '#2E3A87', bottom: '#3A3A44', shoes: '#F6F1E7', hair: '#1E1612', cap: '#C2413B', skin: '#B47650', bag: '#1E1E22' },
  };
  const limbG = (r1, r2, len) => G('limb' + [r1, r2, len], () => { const g = new THREE.CylinderGeometry(r1, r2, len, 8); g.translate(0, -len / 2, 0); return g; });
  K.person = function (o) {
    o = o || {};
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const skin = o.skin || '#C68B62', top = o.top || o.col || '#F2A41C', bottom = o.bottom || o.pants || '#3A3A55', shoes = o.shoes || '#2B1B17';
    const legs = [], arms = [];
    [-1, 1].forEach(s => {
      const hip = new THREE.Group(); hip.position.set(0, .92, s * .1);
      add(hip, limbG(.085, .07, .5), bottom, 0, 0, 0); const knee = new THREE.Group(); knee.position.y = -.5; hip.add(knee);
      add(knee, limbG(.07, .055, .42), o.saree ? bottom : bottom, 0, 0, 0); box(knee, .22, .07, .1, shoes, .04, -.47, 0);
      body.add(hip); legs.push(hip); hip.userData.knee = knee;
    });
    if (o.saree) { const sk = add(body, K.cylG(.16, .3, .95, 12), o.saree, 0, 0, 0); sk.scale.z = .85; }
    else if (o.kurta) { const k = add(body, K.cylG(.19, .25, .55, 12), top, 0, .52, 0); k.scale.z = .75; }
    const torso = add(body, K.cylG(.19, .17, .62, 12), o.saree ? o.blouse || top : top, 0, .95, 0); torso.scale.z = .72;
    if (o.saree) { const p = box(body, .44, .7, .05, o.saree, .02, 1.0, 0); p.rotation.x = .5; p.position.z = .05; }
    if (o.dupatta) { const d = box(body, .06, .72, .5, o.dupatta, .12, 1.0, 0); d.rotation.x = .35; }
    if (o.bag) box(body, .14, .42, .3, o.bag, -.2, 1.02, 0);
    if (o.jacket) { const j = add(body, K.cylG(.2, .19, .55, 12), o.jacket, 0, 1.0, 0); j.scale.z = .74; }
    [-1, 1].forEach(s => {
      const sh = new THREE.Group(); sh.position.set(0, 1.5, s * .22);
      add(sh, limbG(.055, .05, .32), o.sleeve || top, 0, 0, 0); const el = new THREE.Group(); el.position.y = -.32; sh.add(el);
      add(el, limbG(.045, .04, .28), skin, 0, 0, 0); sph(el, .045, skin, 0, -.3, 0);
      body.add(sh); arms.push(sh); sh.userData.elbow = el;
    });
    add(body, K.cylG(.05, .055, .1, 8), skin, 0, 1.55, 0);
    const head = sph(body, .12, skin, 0, 1.75, 0, 1, 1.15, .95);
    sph(body, .02, '#1a1a1a', .11, 1.77, .045); sph(body, .02, '#1a1a1a', .11, 1.77, -.045);
    if (o.mustache) box(body, .02, .02, .07, '#1a1a1a', .118, 1.705, 0, false);
    if (o.turban) { const t = add(body, new THREE.TorusGeometry(.11, .055, 6, 14), o.turban, -.01, 1.86, 0); t.rotation.x = Math.PI / 2; sph(body, .1, o.turban, -.02, 1.9, 0, 1, .7, 1); box(body, .05, .25, .08, o.turban, -.13, 1.62, 0); }
    else if (o.helmet) sph(body, .15, K.phong(o.helmet, 80), 0, 1.8, 0, 1.05, 1, 1);
    else {
      const h = add(body, K.domeG(.13), o.hair || '#1E1612', -.01, 1.78, 0); h.scale.set(1, 1.05, 1); h.rotation.z = .3;
      if (o.long) { box(body, .08, .5, .22, o.hair || '#1E1612', -.13, 1.3, 0); }
      if (o.cap) { add(body, K.domeG(.135), o.cap, 0, 1.8, 0); box(body, .14, .02, .2, o.cap, .13, 1.81, 0); }
      if (o.grey) h.material = K.mat('#D8D2C8');
    }
    g.userData = { body, legs, arms, head };
    return g;
  };
  K.randomPerson = function (seed) {
    const r = (n => () => (n = (n * 16807) % 2147483647) / 2147483647)(seed * 977 + 13);
    const pk = a => a[r() * a.length | 0];
    const skin = pk(['#C68B62', '#B47650', '#D9A07A', '#9A6342', '#E0B08C', '#A86E4A']);
    const CL = ['#E0577A', '#2E3A87', '#F2A41C', '#3F8F5A', '#F6F1E7', '#C2413B', '#7A5BA6', '#4DA3C7', '#E07B1A', '#8A5A3B'];
    const t = r();
    if (t < .35) return { skin, saree: pk(CL), blouse: pk(CL), long: true, hair: '#1E1612', shoes: '#C9A74A' };
    if (t < .5) return { skin, top: pk(CL), kurta: true, bottom: '#F6F1E7', turban: pk(['#E07B1A', '#E0577A', '#F2A41C', '#C2413B']), mustache: true };
    if (t < .65) return { skin, top: pk(['#F6F1E7', '#D9D2C2']), kurta: true, bottom: '#F6F1E7', grey: true, mustache: r() < .7 };
    if (t < .8) return { skin, top: pk(CL), kurta: true, bottom: pk(CL), dupatta: pk(CL), long: true };
    return { skin, top: pk(CL), bottom: pk(['#263170', '#3A3A44', '#5A4A3A']), mustache: r() < .4, cap: r() < .2 ? pk(CL) : null };
  };
  K.seat = function (g, mode) {
    const u = g.userData;
    u.legs.forEach(l => { l.rotation.z = mode === 'scooty' ? 1.25 : 1.5; l.userData.knee.rotation.z = mode === 'scooty' ? -1.0 : -1.45; });
    u.arms.forEach(a => { a.rotation.z = mode === 'table' ? .55 : 1.1; a.userData.elbow.rotation.z = mode === 'table' ? .9 : .3; });
  };
  K.animPerson = function (g, walk, moving, down, spin) {
    const u = g.userData; if (!u || !u.legs) return;
    const s = moving ? Math.sin(walk) * .65 : 0;
    u.legs[0].rotation.z = s; u.legs[1].rotation.z = -s;
    u.legs.forEach((l, i) => l.userData.knee.rotation.z = moving ? -Math.max(0, Math.sin(walk + (i ? Math.PI : 0))) * .8 : 0);
    u.arms[0].rotation.z = -s * .8; u.arms[1].rotation.z = s * .8;
    u.arms.forEach(a => a.userData.elbow.rotation.z = moving ? .35 : .1);
    if (down) { u.body.rotation.set(Math.PI / 2 * Math.min(1, down), 0, spin || 0); u.body.position.y = .18; }
    else { u.body.rotation.set(0, 0, 0); u.body.position.y = moving ? Math.abs(Math.cos(walk)) * .04 : 0; }
  };

  // ================= VEHICLES =================
  const wheelG = (r, w, seg) => G('wh' + [r, w], () => { const g = new THREE.CylinderGeometry(r, r, w, seg || 16); g.rotateX(Math.PI / 2); return g; });
  function carWheel(body, x, z, r, wheels) {
    const w = new THREE.Group(); w.position.set(x, r, z); body.add(w);
    add(w, wheelG(r, .22), '#1A1A1A', 0, 0, 0); add(w, wheelG(r * .62, .235, 10), K.chrome(), 0, 0, 0);
    for (let i = 0; i < 5; i++) { const sp = box(w, .05, r * .55, .02, '#8A9098', 0, 0, (z > 0 ? 1 : -1) * .125, false); sp.rotation.z = i * 1.2566; }
    wheels.push({ m: w, r }); return w;
  }
  function spokedWheel(body, x, y, r, wheels, col) {
    const w = new THREE.Group(); w.position.set(x, y, 0); body.add(w);
    add(w, G('tor' + r, () => new THREE.TorusGeometry(r, .065, 8, 24)), '#151515', 0, 0, 0);
    add(w, G('rim' + r, () => new THREE.TorusGeometry(r * .82, .014, 4, 24)), K.chrome(), 0, 0, 0);
    const pts = []; for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; pts.push(0, 0, 0, Math.cos(a) * r * .82, Math.sin(a) * r * .82, 0); }
    const lg = G('spk' + r, () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g; });
    w.add(new THREE.LineSegments(lg, C('lineC', () => new THREE.LineBasicMaterial({ color: '#C8CDD2' }))));
    add(w, wheelG(.07, .14, 10), col || K.chrome(), 0, 0, 0);
    wheels.push({ m: w, r: r + .06 }); return w;
  }
  function profile(pts) { const s = new THREE.Shape(); pts.forEach((p, i) => p.length > 2 ? s[p[0]](...p.slice(1)) : (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); return s; }
  function extrude(key, shape, depth, bevel) { return G('ex' + key, () => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: !!bevel, bevelThickness: bevel || 0, bevelSize: bevel || 0, bevelSegments: 3, curveSegments: 10 }); g.translate(0, 0, -depth / 2); return g; }); }
  function slabBetween(body, x1, y1, x2, y2, width, m, off) {
    const len = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
    const pl = add(body, G('pl' + [len.toFixed(2), width.toFixed(2)], () => { const g = new THREE.PlaneGeometry(len, width); g.rotateX(-Math.PI / 2); return g; }), m, (x1 + x2) / 2, (y1 + y2) / 2, 0, false);
    pl.rotation.z = a; pl.translateY(off || .02); return pl;
  }
  function lights(body, L, W, yF, yR, plate) {
    [-1, 1].forEach(s => {
      box(body, .06, .14, .32, K.basic('#FFF4D0'), L / 2 - .02, yF, s * (W / 2 - .28), false);
      box(body, .05, .2, .22, K.basic('#D0302A'), -L / 2 + .01, yR, s * (W / 2 - .2), false);
    });
    box(body, .03, .12, .42, K.mat(plate || '#F6F1E7'), L / 2 + .02, yF - .3, 0, false); box(body, .03, .12, .42, K.mat(plate || '#F6F1E7'), -L / 2 - .02, yR - .35, 0, false);
  }
  function rider(body, v, x, y, mode) {
    if (!v.driver) return new THREE.Group(); // parked or fallen: nobody on it
    const look = v.driver === 'player' ? J.r3.playerLook() : (v.type === 'police' ? { top: '#E8E3D6', bottom: '#6B5A3A', helmet: '#F6F6F6', skin: '#B47650', mustache: true } : Object.assign(K.randomPerson(v.id), { helmet: v.type === 'auto' || v.type === 'camelcart' ? null : (Math.random() < .7 ? v.helmet : null) }));
    if (v.type === 'auto') { delete look.saree; look.top = '#C9B48A'; look.kurta = false; look.bottom = '#C9B48A'; }
    const p = K.person(look); K.seat(p, mode); p.position.set(x, y, 0); body.add(p); return p;
  }

  K.vehicle = function (v) {
    const VT = J.VEH[v.type], L = VT.l / 8, W = VT.w / 8, c = v.col;
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const wheels = []; g.userData = { body, wheels };
    const paint = K.phong(c, 90, { specular: '#999999' });
    switch (v.type) {
      case 'car': case 'goon': {
        const suv = v.type === 'goon', H = suv ? 1.72 : 1.48, gy = suv ? .28 : .2, fx = L / 2 - .72, rx = -L / 2 + .72, wr = suv ? .4 : .34;
        const shape = profile([[-L / 2, gy + .15], [-L / 2 + .02, H - .5], ['quadraticCurveTo', -L / 2 + .05, H - .12, -L / 2 + .45, H - .04], [L * .06, H], ['quadraticCurveTo', L * .12, H - .02, L * (suv ? .24 : .27), H - .46], [L / 2 - .2, H - .62], ['quadraticCurveTo', L / 2, H - .66, L / 2, H - .95], [L / 2 - .02, gy + .1], [fx + wr + .08, gy + .1], ['absarc', fx, gy + .16, wr + .08, 0, Math.PI, false], [rx + wr + .08, gy + .1], ['absarc', rx, gy + .16, wr + .08, 0, Math.PI, false], [-L / 2, gy + .15]]);
        add(body, extrude(v.type + 'b', shape, W - .16, .08), paint, 0, 0, 0);
        const gh = profile([[-L / 2 + .3, H - .48], [-L / 2 + .46, H - .1], [L * .05, H - .07], [L * (suv ? .21 : .24), H - .48]]);
        const ghG = G('gh' + v.type, () => new THREE.ShapeGeometry(gh));
        [-1, 1].forEach(s => { add(body, ghG, K.glass(), 0, 0, s * (W / 2 + .005), false); box(body, .09, .4, .02, paint, -L * .08, H - .5, s * (W / 2 + .01), false); box(body, .14, .1, .14, paint, L * .22, H - .5, s * (W / 2 + .06)); });
        slabBetween(body, L * .06, H - .02, L * (suv ? .24 : .27), H - .46, W - .3, K.glass(), .03);
        slabBetween(body, -L / 2 + .45, H - .06, -L / 2 + .04, H - .52, W - .3, K.glass(), .03);
        box(body, .06, .22, W - .5, '#1A1A1A', L / 2 - .01, gy + .32, 0, false);
        box(body, .12, .16, W - .06, suv ? K.chrome() : '#2B2B2B', L / 2 - .04, gy + .12, 0, false); box(body, .12, .16, W - .06, '#2B2B2B', -L / 2 + .04, gy + .12, 0, false);
        if (suv) { box(body, L * .5, .05, .06, K.chrome(), -L * .1, H + .02, W / 2 - .25); box(body, L * .5, .05, .06, K.chrome(), -L * .1, H + .02, -W / 2 + .25); }
        lights(body, L, W, H - .78, H - .55);
        [[fx, 1], [fx, -1], [rx, 1], [rx, -1]].forEach(([x, s]) => carWheel(body, x, s * (W / 2 - .14), wr, wheels));
        break;
      }
      case 'jeep': {
        const fx = L / 2 - .78, rx = -L / 2 + .8, wr = .44;
        box(body, L, .55, W - .1, paint, 0, .55, 0); box(body, L * .36, .32, W - .14, paint, L * .32, 1.1, 0);
        box(body, L * .56, .82, W - .1, K.mat('#1F1F1F'), -L * .17, 1.1, 0);
        box(body, .08, .7, W - .1, '#2B2B2B', L * .13, 1.1, 0); box(body, .03, .55, W - .3, K.glass(), L * .135, 1.18, 0, false);
        [[fx], [rx]].forEach(([x]) => [-1, 1].forEach(s => box(body, wr * 2.3, .14, .3, '#1F1F1F', x, 1.0, s * (W / 2 - .05))));
        box(body, .08, .4, W - .3, '#222', L / 2, .7, 0, false);
        for (let i = 0; i < 7; i++) box(body, .09, .3, .05, '#111', L / 2 + .01, .74, -.45 + i * .15, false);
        [-1, 1].forEach(s => { const hl = add(body, wheelG(.11, .06), K.basic('#FFF4D0'), L / 2 + .02, .98, s * (W / 2 - .3), false); hl.rotation.y = Math.PI / 2; });
        const sp = add(body, wheelG(.38, .2), '#1A1A1A', -L / 2 - .12, 1.0, 0); sp.rotation.y = Math.PI / 2;
        box(body, .03, .12, .42, K.mat('#F6F1E7'), L / 2 + .04, .5, 0, false);
        [[fx, 1], [fx, -1], [rx, 1], [rx, -1]].forEach(([x, s]) => carWheel(body, x, s * (W / 2 - .12), wr, wheels));
        if (v.driver === 'player') rider(body, v, -.15, .45, 'table').position.z = -W * .22;
        break;
      }
      case 'auto': {
        const green = K.phong('#1E7B3E', 70), yellow = K.phong('#F2C230', 60);
        const tub = profile([[-L / 2, .32], [-L / 2, .95], [L * .08, .95], [L * .08, .32]]);
        add(body, extrude('autotub', tub, W - .1, .06), green, 0, 0, 0);
        const cowl = profile([[L * .04, .3], [L * .04, 1.15], [L * .34, 1.15], ['quadraticCurveTo', L / 2 + .02, 1.1, L / 2, .62], [L / 2 - .12, .3]]);
        add(body, extrude('autocowl', cowl, .9, .07), green, 0, 0, 0);
        box(body, L * .54, .14, W - .02, yellow, -L * .23, .82, 0);
        const roof = add(body, G('autoroof', () => { const gg = new THREE.CylinderGeometry(W / 2, W / 2, L * .82, 16, 1, true, 0, Math.PI); gg.rotateZ(Math.PI / 2); gg.scale(1, .42, 1); return gg; }), K.phong('#151515', 20, { side: THREE.DoubleSide }), -L * .08, 1.62, 0);
        roof.castShadow = true;
        box(body, L * .82, .05, W + .02, yellow, -L * .08, 1.6, 0, false);
        [[-L / 2 + .05, 1], [-L / 2 + .05, -1], [L * .3, 1], [L * .3, -1]].forEach(([x, s]) => cyl(body, .025, .025, .7, '#111', x, .95, s * (W / 2 - .04), 6));
        box(body, .05, .75, W - .1, '#151515', -L / 2 + .02, .95, 0);
        [-1, 1].forEach(s => box(body, L * .36, .5, .03, '#151515', -L * .3, 1.08, s * (W / 2 - .02)));
        box(body, .03, .5, .86, K.glass(), L * .31, 1.15, 0, false);
        box(body, .55, .14, W - .3, '#5A3A2A', -L * .3, .95, 0); box(body, .14, .5, W - .3, '#5A3A2A', -L / 2 + .14, 1.0, 0);
        const hl = add(body, wheelG(.09, .05), K.basic('#FFF4D0'), L / 2 + .02, .95, 0, false); hl.rotation.y = Math.PI / 2;
        box(body, .03, .12, .36, K.mat('#F2C230'), L / 2 + .01, .5, 0, false);
        box(body, .06, .2, .16, K.basic('#D0302A'), -L / 2 - .01, .55, W / 2 - .15, false); box(body, .06, .2, .16, K.basic('#D0302A'), -L / 2 - .01, .55, -W / 2 + .15, false);
        carWheel(body, L / 2 - .32, 0, .26, wheels);
        carWheel(body, -L / 2 + .55, W / 2 - .06, .28, wheels); carWheel(body, -L / 2 + .55, -W / 2 + .06, .28, wheels);
        box(body, .05, .05, .6, K.chrome(), L * .26, 1.2, 0, false);
        rider(body, v, L * .14, .38, 'scooty');
        break;
      }
      case 'bike': case 'police': {
        const col = v.type === 'police' ? '#F6F6F6' : c, tank = K.phong(col, 110, { specular: '#cccccc' });
        spokedWheel(body, L / 2 - .38, .38, .32, wheels); spokedWheel(body, -L / 2 + .38, .38, .32, wheels);
        [[L / 2 - .38], [-L / 2 + .38]].forEach(([x], i) => { const f = add(body, G('fend', () => new THREE.TorusGeometry(.38, .045, 4, 16, Math.PI * .75)), tank, x, .38, 0); f.rotation.z = i ? .3 : .05; f.scale.z = 2; });
        const tk = sph(body, .2, tank, .12, 1.0, 0, 1.6, .75, .9); sph(body, .05, K.chrome(), .1, 1.0, .17);
        if (v.type === 'police') box(body, .5, .04, .2, '#263170', .1, 1.06, 0, false);
        box(body, .42, .34, .24, '#3A3A3A', -.02, .45, 0); for (let i = 0; i < 4; i++) box(body, .2, .02, .28, '#6A6A6A', .02, .8 + i * .04, 0, false);
        const ex = add(body, G('exh', () => { const gg = new THREE.CylinderGeometry(.045, .055, L * .55, 10); gg.rotateZ(Math.PI / 2); return gg; }), K.chrome(), -L * .2, .36, .18);
        box(body, .36, .07, .22, '#2A1B14', -.32, 1.0, 0); box(body, .26, .06, .2, '#2A1B14', -.62, .95, 0);
        box(body, .35, .2, .05, '#2B2B2B', -.3, .7, .14);
        [-1, 1].forEach(s => { const fk = add(body, K.cylG(.025, .025, .7, 6), K.chrome(), L / 2 - .38, .38, s * .1); fk.rotation.z = .35; });
        sph(body, .1, K.chrome(), L / 2 - .3, 1.12, 0); add(body, wheelG(.075, .02), K.basic('#FFF4D0'), L / 2 - .2, 1.12, 0).rotation.y = Math.PI / 2;
        box(body, .04, .04, .7, K.chrome(), L / 2 - .45, 1.25, 0, false);
        if (v.type === 'police') J.r3.sirens.push(sph(body, .08, K.basic('#E23B3B'), -L / 2 + .2, 1.15, 0));
        rider(body, v, -.25, .1, 'bike');
        break;
      }
      case 'scooty': {
        spokedWheel(body, L / 2 - .3, .26, .2, wheels, '#888'); spokedWheel(body, -L / 2 + .36, .26, .2, wheels, '#888');
        const sh = profile([[-L / 2 + .1, .4], [-L / 2 + .05, .66], ['quadraticCurveTo', -L / 2 + .1, .92, -L / 2 + .42, .95], [-.12, .95], [-.05, .45], [.2, .42], [.3, 1.1], [.5, 1.18], ['quadraticCurveTo', .7, 1.0, .66, .52], [.5, .3], [-L / 2 + .3, .3]]);
        add(body, extrude('scoot', sh, .5, .06), paint, 0, 0, 0);
        box(body, .7, .1, .3, '#1E1E1E', -L / 2 + .55, .97, 0);
        box(body, .14, .14, .55, paint, .45, 1.2, 0); add(body, wheelG(.06, .04), K.basic('#FFF4D0'), .56, 1.24, 0, false).rotation.y = Math.PI / 2;
        [-1, 1].forEach(s => { cyl(body, .01, .01, .25, '#333', .4, 1.25, s * .28, 4); box(body, .05, .06, .1, K.glass(), .4, 1.5, s * .28, false); });
        const fd = add(body, G('sfend', () => new THREE.TorusGeometry(.25, .04, 4, 12, Math.PI * .7)), paint, L / 2 - .3, .26, 0); fd.scale.z = 2.5;
        rider(body, v, -.25, .12, 'scooty');
        break;
      }
      case 'bus': {
        const shell = profile([[-L / 2, .35], [-L / 2, 2.85], ['quadraticCurveTo', -L / 2, 3.0, -L / 2 + .2, 3.0], [L / 2 - .3, 3.0], ['quadraticCurveTo', L / 2, 3.0, L / 2, 2.6], [L / 2, .35]]);
        add(body, extrude('bus', shell, W - .1, .05), K.phong('#F4F1EA', 50), 0, 0, 0);
        box(body, L - .2, .5, W + .01, K.phong('#2E5AA8', 60), 0, .35, 0, false);
        box(body, L - .8, .95, W + .02, K.glass(), -.25, 1.55, 0, false);
        box(body, .03, 1.5, W - .3, K.glass(), L / 2 + .04, 1.2, 0, false);
        box(body, .04, .3, W - .5, '#111', L / 2 + .05, 2.6, 0, false); box(body, .045, .18, W - .7, K.basic('#F2A41C'), L / 2 + .06, 2.65, 0, false);
        box(body, .8, 2.1, .04, '#333', L * .3, .4, W / 2 + .02, false);
        lights(body, L, W, .7, .9, '#F2C230');
        [L / 2 - 1.3, -L / 2 + 1.6].forEach(x => [-1, 1].forEach(s => carWheel(body, x, s * (W / 2 - .15), .5, wheels)));
        break;
      }
      case 'camelcart': {
        const cart = new THREE.Group(); cart.position.x = -L * .2; body.add(cart);
        box(cart, L * .5, .12, W, '#8A5A3B', 0, .85, 0); for (let i = 0; i < 4; i++) box(cart, .25, .25, .35, '#E8D3A4', -L * .15 + i * .25, .97, (i % 2 - .5) * .4);
        spokedWheel(cart, 0, .6, .55, wheels, '#7A4E2A'); cart.children[cart.children.length - 1].position.z = W / 2 + .05;
        const cm = new THREE.Group(); cm.position.set(L * .25, 0, 0); body.add(cm);
        sph(cm, .5, '#C49A6C', 0, 1.6, 0, 1.6, .9, .7); sph(cm, .35, '#C9A274', -.05, 2.05, 0, 1.2, 1, .9);
        [[.45, .18], [.45, -.18], [-.45, .18], [-.45, -.18]].forEach(([x, z]) => add(cm, limbG(.06, .05, 1.35), '#B98A5C', x, 1.4, z));
        const nk = add(cm, limbG(.09, .07, .9), '#C49A6C', .75, 1.75, 0); nk.rotation.z = -2.3;
        sph(cm, .14, '#B98A5C', 1.38, 2.3, 0, 1.8, .9, 1);
        box(cm, 1.4, .05, .05, '#5A3A2A', -.6, 1.4, .3, false); box(cm, 1.4, .05, .05, '#5A3A2A', -.6, 1.4, -.3, false);
        const d = rider(cart, v, -L * .15, .65, 'table'); d.scale.setScalar(.95);
        break;
      }
    }
    g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    return g;
  };

  K.cow = function (k) {
    const g = new THREE.Group(), c = k.col;
    sph(g, .45, c, 0, 1.05, 0, 1.75, .9, .85); sph(g, .22, c, -.45, 1.42, 0, 1.2, 1, .9);
    const nk = add(g, limbG(.16, .14, .45), c, .65, 1.25, 0); nk.rotation.z = -2.0;
    sph(g, .16, c, 1.0, 1.32, 0, 1.6, 1, .9); sph(g, .08, '#D8B8A8', 1.22, 1.27, 0);
    [-1, 1].forEach(s => { const h = add(g, K.cylG(.015, .04, .3, 5), '#D9CBA8', .95, 1.45, s * .1); h.rotation.x = -s * .7; const e = box(g, .14, .05, .08, c, .92, 1.38, s * .17); e.rotation.x = s * .5; });
    sph(g, .2, k.patch, .2, 1.25, .25, 1.2, .6, .3);
    [[.55, .2], [.55, -.2], [-.5, .2], [-.5, -.2]].forEach(([x, z]) => { add(g, limbG(.07, .05, .7), c, x, .8, z); box(g, .1, .08, .1, '#3A3530', x, 0, z); });
    const t = add(g, limbG(.025, .02, .7), c, -.75, 1.15, 0); t.rotation.z = -.3;
    if (k.mala) for (let i = 0; i < 7; i++) sph(g, .04, '#F2A41C', .82 + Math.cos(i * .5 - 1.5) * .02, 1.05 + Math.sin(i * .45) * .03, (i - 3) * .05);
    return g;
  };
  K.monkey = function () { const g = new THREE.Group(); sph(g, .25, '#8B6B4A', 0, .35, 0, 1.3, 1, 1); sph(g, .14, '#8B6B4A', .25, .6, 0); sph(g, .09, '#E2B08C', .34, .58, 0); const t = add(g, limbG(.03, .02, .6), '#7A5C3E', -.3, .4, 0); t.rotation.z = 2.4; return g; };

  // ================= FOOD =================
  const noise3 = (x, y, z) => Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453 % 1;
  function kachoriGeo(frac) {
    return G('kach' + frac, () => {
      const geo = new THREE.SphereGeometry(.07, 28, 18, 0, Math.PI * 2 * frac); const p = geo.attributes.position, col = [];
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = Math.abs(noise3(x * 40, y * 40, z * 40));
        const k = 1 + n * .08 + (y > 0 ? .02 : 0); p.setXYZ(i, x * k, y * k * .52, z * k);
        const d = .78 + n * .3; col.push(.85 * d, .55 * d, .22 * d);
      }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals(); return geo;
    });
  }
  const fillingMat = () => K.mat('#B07A3A');
  K.plate = function (serve) {
    const g = new THREE.Group();
    if (serve === 'leaf') { const t = add(g, G('leafp', () => new THREE.CylinderGeometry(.17, .15, .012, 20)), K.mat('#7E9A4A'), 0, .006, 0); for (let i = 0; i < 8; i++) { const v = box(g, .005, .002, .15, '#5E7A34', Math.cos(i * .78) * .07, .013, Math.sin(i * .78) * .07, false); v.rotation.y = -i * .78; } }
    else if (serve === 'steel') { add(g, G('steelp', () => new THREE.CylinderGeometry(.16, .15, .012, 28)), K.phong('#C9CED6', 140, { specular: '#ffffff' }), 0, .006, 0); const r = add(g, G('steelr', () => new THREE.TorusGeometry(.155, .008, 6, 32)), K.chrome(), 0, .014, 0); r.rotation.x = Math.PI / 2; }
    else if (serve === 'ceramic') { add(g, G('cerp', () => new THREE.CylinderGeometry(.13, .1, .015, 28)), K.phong('#FAF7F1', 80), 0, .008, 0); }
    return g;
  };
  function bowl(g, x, z, col) { const b = add(g, G('bowl', () => new THREE.SphereGeometry(.035, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2)), K.phong('#C9CED6', 120, { side: THREE.DoubleSide }), x, .05, z); const s = add(g, G('bowls', () => { const c2 = new THREE.CircleGeometry(.032, 14); c2.rotateX(-Math.PI / 2); return c2; }), K.mat(col), x, .045, z, false); return b; }
  function kulhad(g, x, z, h, liquid) {
    const pts = [[0, 0], [.03, 0], [.034, .004], [.045, h], [.042, h + .003]].map(([a, b]) => new THREE.Vector2(a, b));
    const k = add(g, G('kul' + h, () => new THREE.LatheGeometry(pts, 18)), K.mat('#A8553A', { side: THREE.DoubleSide }), x, 0, z);
    const top = add(g, G('liq', () => { const c2 = new THREE.CircleGeometry(.041, 18); c2.rotateX(-Math.PI / 2); return c2; }), K.phong(liquid, 90), x, h - .008, z, false);
    return { k, top, h };
  }
  function steamPuffs(g, x, y, z) { const s = []; for (let i = 0; i < 6; i++) { const m = new THREE.Mesh(K.sphG(.02, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false })); m.userData = { x, y, z, t: i / 6 }; g.add(m); s.push(m); } return s; }
  const latteTex = () => C('latte', () => K.tex(128, 128, (c) => { c.fillStyle = '#9A6338'; c.fillRect(0, 0, 128, 128); const gr = c.createRadialGradient(64, 64, 10, 64, 64, 64); gr.addColorStop(0, 'rgba(255,240,215,.0)'); gr.addColorStop(1, 'rgba(90,50,25,.6)'); c.fillStyle = gr; c.fillRect(0, 0, 128, 128); c.fillStyle = '#FFF4E2'; c.beginPath(); c.moveTo(64, 98); c.bezierCurveTo(14, 64, 34, 22, 64, 48); c.bezierCurveTo(94, 22, 114, 64, 64, 98); c.fill(); c.fillStyle = '#9A6338'; c.beginPath(); c.moveTo(64, 86); c.bezierCurveTo(36, 64, 46, 40, 64, 58); c.bezierCurveTo(82, 40, 92, 64, 64, 86); c.fill(); }));
  const ghewarTex = () => C('ghewar', () => K.tex(256, 256, (c) => { c.fillStyle = '#E2A85A'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#B97A35'; c.lineWidth = 2; for (let r = 10; r < 128; r += 9) { c.beginPath(); c.arc(128, 128, r, 0, 7); c.stroke(); } for (let i = 0; i < 64; i++) { c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + Math.cos(i / 64 * 6.28) * 128, 128 + Math.sin(i / 64 * 6.28) * 128); c.stroke(); } c.fillStyle = 'rgba(255,248,230,.85)'; c.beginPath(); c.arc(128, 128, 70, 0, 7); c.fill(); c.fillStyle = '#E8E8E8'; c.fillRect(96, 100, 60, 40); c.fillStyle = '#7FAE5F'; for (let i = 0; i < 30; i++) c.fillRect(70 + (i * 37) % 120, 70 + (i * 53) % 120, 6, 3); }));

  // returns { g, actions:['bite'|'sip'], bite(), sip(), left, update(dt) }
  K.food = function (dish, serve) {
    const g = new THREE.Group(), plate = K.plate(serve); g.add(plate);
    const crumbs = [], steam = [];
    const F = { g, crumbs, steam, bites: 0, sips: 0, maxBites: 4, maxSips: 4, actions: [] };
    const spawnCrumbs = (x, y, z, col, n) => { for (let i = 0; i < n; i++) { const m = new THREE.Mesh(K.boxG(.008 + Math.random() * .01, .006, .008), K.mat(col)); m.position.set(x, y, z); m.userData = { vx: rnd(-.25, .25), vy: rnd(.3, .8), vz: rnd(-.25, .25), rest: false }; g.add(m); crumbs.push(m); } };
    F.update = function (dt, t) {
      for (const m of crumbs) { const u = m.userData; if (u.rest) continue; u.vy -= 3.2 * dt; m.position.x += u.vx * dt; m.position.y += u.vy * dt; m.position.z += u.vz * dt; m.rotation.x += dt * 9; if (m.position.y < .014) { m.position.y = .014; u.rest = true; } }
      for (const s of steam) { const u = s.userData; u.t += dt * .35; if (u.t > 1) u.t -= 1; s.position.set(u.x + Math.sin(u.t * 9 + u.y * 50) * .015, u.y + u.t * .16, u.z); s.scale.setScalar(.6 + u.t * 1.8); s.material.opacity = (F.hot === false ? 0 : .35) * Math.sin(u.t * Math.PI); }
    };
    if (dish === 'kachori') {
      F.actions = ['bite'];
      const km = add(g, kachoriGeo(1), K.phong('#ffffff', 25, { vertexColors: true }), 0, .05, 0);
      const k2 = add(g, kachoriGeo(1), K.phong('#ffffff', 25, { vertexColors: true }), -.07, .045, .07); k2.rotation.y = 1;
      bowl(g, .1, -.06, '#5A2A16'); bowl(g, .1, .06, '#4E8C3A');
      steam.push(...steamPuffs(g, 0, .09, 0));
      F.bite = () => {
        F.bites++; spawnCrumbs(0, .07, 0, '#C98A3A', 14);
        if (F.bites >= F.maxBites) { km.visible = false; return true; }
        const frac = [1, .72, .48, .24][F.bites];
        km.geometry = kachoriGeo(frac);
        if (!km.userData.fill) { const fg = G('kfill', () => { const c2 = new THREE.CircleGeometry(.068, 14, -Math.PI / 2, Math.PI); c2.scale(1, .54, 1); return c2; }); km.userData.fill = [add(km, fg, K.mat('#B07A3A', { side: THREE.DoubleSide }), 0, 0, 0, false), add(km, fg, K.mat('#9A6630', { side: THREE.DoubleSide }), 0, 0, 0, false)]; }
        const [a, b] = km.userData.fill; a.rotation.y = Math.PI; b.rotation.y = Math.PI - Math.PI * 2 * frac;
        return false;
      };
    } else if (dish === 'chai') {
      F.actions = ['sip', 'bite'];
      const cup = serve === 'steel' ? (() => { const gl = add(g, G('cglass', () => new THREE.CylinderGeometry(.034, .028, .085, 16, 1, true)), K.phong('#ffffff', 120, { transparent: true, opacity: .35, side: THREE.DoubleSide }), .06, .0425, -.02); const liq = add(g, G('cliq', () => new THREE.CylinderGeometry(.031, .026, .07, 16)), K.phong('#B98250', 70), .06, .035, -.02); return { liq, glass: true }; })() : kulhad(g, .06, -.02, .08, '#B98250');
      F.cup = cup;
      const bun = new THREE.Group(); bun.position.set(-.06, .015, .03); g.add(bun);
      sph(bun, .05, K.phong('#D9A05A', 30), 0, .025, 0, 1.2, .5, 1); sph(bun, .05, K.phong('#E2B070', 30), 0, .065, 0, 1.2, .55, 1);
      box(bun, .07, .012, .05, K.phong('#F6E27A', 60), 0, .04, 0, false);
      steam.push(...steamPuffs(g, .06, .09, -.02));
      F.maxBites = 3;
      F.sip = () => { F.sips++; if (cup.liq) { cup.liq.scale.y = Math.max(.05, 1 - F.sips / F.maxSips); cup.liq.position.y = .035 * cup.liq.scale.y; } else { cup.top.position.y = cup.h - .008 - F.sips * .016; cup.top.scale.setScalar(1 - F.sips * .05); } if (F.sips >= F.maxSips) { F.hot = false; if (cup.top) cup.top.visible = false; } return F.sips >= F.maxSips && F.bites >= F.maxBites; };
      F.bite = () => { F.bites++; spawnCrumbs(-.06, .06, .03, '#D9A05A', 8); bun.scale.setScalar(Math.max(.01, 1 - F.bites / F.maxBites)); if (F.bites >= F.maxBites) bun.visible = false; return F.sips >= F.maxSips && F.bites >= F.maxBites; };
    } else if (dish === 'lassi') {
      F.actions = ['sip'];
      const cup = kulhad(g, 0, 0, .13, '#FFF6E6');
      const malai = sph(g, .044, K.phong('#FFF8EC', 20), 0, .13, 0, 1, .45, 1);
      for (let i = 0; i < 6; i++) box(g, .012, .003, .003, K.basic('#E07B1A'), Math.cos(i) * .02, .15, Math.sin(i * 1.7) * .02, false);
      F.sip = () => { F.sips++; malai.position.y = .13 - F.sips * .022; malai.scale.y = .45 - F.sips * .08; cup.top.position.y = .122 - F.sips * .025; if (F.sips >= F.maxSips) malai.visible = false; return F.sips >= F.maxSips; };
    } else if (dish === 'ghewar') {
      F.actions = ['bite'];
      const gm = new THREE.Mesh(G('ghew', () => new THREE.CylinderGeometry(.1, .1, .04, 32)), [K.phong('#D9973F', 20), K.phong('#ffffff', 30, { map: ghewarTex() }), K.mat('#B97A35')]);
      gm.position.y = .035; g.add(gm);
      F.bite = () => { F.bites++; spawnCrumbs(.06, .06, 0, '#E2A85A', 10); const left = 1 - F.bites / F.maxBites; if (left <= 0) { gm.visible = false; return true; } gm.geometry = G('ghew' + left, () => new THREE.CylinderGeometry(.1, .1, .04, 32, 1, false, 0, Math.PI * 2 * left)); return false; };
    } else if (dish === 'kulfi') {
      F.actions = ['bite'];
      const slices = []; for (let i = 0; i < 4; i++) { const s = add(g, G('kslice', () => new THREE.CylinderGeometry(.03, .03, .022, 16)), K.phong('#F4D9A0', 40), -.06 + i * .04, .025, Math.sin(i) * .02); s.rotation.x = Math.PI / 2; s.rotation.z = .3; slices.push(s); }
      for (let i = 0; i < 12; i++) box(g, .01, .004, .006, '#7FAE5F', -.07 + (i * .013), .05, Math.sin(i * 2.3) * .03, false);
      F.bite = () => { F.bites++; spawnCrumbs(0, .05, 0, '#F4D9A0', 4); const s = slices[F.bites - 1]; if (s) s.visible = false; return F.bites >= F.maxBites; };
    } else if (dish === 'coffee') {
      F.actions = ['sip'];
      const pts = [[0, 0], [.03, 0], [.033, .004], [.045, .06], [.046, .064]].map(([a, b]) => new THREE.Vector2(a, b));
      add(g, G('ccup', () => new THREE.LatheGeometry(pts, 24)), K.phong('#FAF7F1', 90, { side: THREE.DoubleSide }), 0, .015, 0);
      const h = add(g, G('chand', () => new THREE.TorusGeometry(.016, .005, 6, 12, Math.PI)), K.phong('#FAF7F1', 90), .05, .05, 0); h.rotation.z = -Math.PI / 2;
      const top = add(g, G('ctop', () => { const c2 = new THREE.CircleGeometry(.043, 24); c2.rotateX(-Math.PI / 2); return c2; }), K.phong('#ffffff', 60, { map: latteTex() }), 0, .07, 0, false);
      steam.push(...steamPuffs(g, 0, .09, 0));
      F.sip = () => { F.sips++; top.position.y = .07 - F.sips * .011; top.scale.setScalar(1 - F.sips * .07); if (F.sips >= F.maxSips) { top.visible = false; F.hot = false; } return F.sips >= F.maxSips; };
    } else if (dish === 'iced') {
      F.actions = ['sip'];
      add(g, G('iglass', () => new THREE.CylinderGeometry(.04, .034, .16, 18, 1, true)), K.phong('#ffffff', 120, { transparent: true, opacity: .3, side: THREE.DoubleSide }), 0, .095, 0);
      const milk = add(g, G('imilk', () => new THREE.CylinderGeometry(.037, .032, .1, 18)), K.phong('#E8D2B0', 40), 0, .065, 0);
      const cof = add(g, G('icof', () => new THREE.CylinderGeometry(.038, .037, .04, 18)), K.phong('#5A3218', 60), 0, .135, 0);
      const ice = []; for (let i = 0; i < 3; i++) { const c3 = box(g, .025, .025, .025, K.phong('#E8F4FA', 120, { transparent: true, opacity: .6 }), (i - 1) * .015, .13 + i * .01, (i % 2) * .01, false); c3.rotation.set(i, i * 2, 0); ice.push(c3); }
      const st = add(g, K.cylG(.004, .004, .22, 6), '#2B2B2B', .015, .08, 0); st.rotation.z = -.2;
      F.sip = () => { F.sips++; cof.scale.y = Math.max(.05, 1 - F.sips / 3); cof.position.y = .115 + .02 * cof.scale.y; milk.scale.y = Math.max(.1, 1 - F.sips * .2); milk.position.y = .015 + .05 * milk.scale.y; ice.forEach(c3 => c3.position.y -= .012); if (F.sips >= F.maxSips) cof.visible = false; return F.sips >= F.maxSips; };
    }
    F.done = () => (F.actions.includes('sip') ? F.sips >= F.maxSips : true) && (F.actions.includes('bite') ? F.bites >= F.maxBites : true);
    g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return F;
  };
})(window.J);
