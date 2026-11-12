/* Game loop, input, camera, rendering, save/load. */
(function (J) {
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const $ = id => document.getElementById(id);
  const T = J.T;
  let dpr = 1, cw = 0, ch = 0;
  J.view = { x: 0, y: 0, zoom: 1.3, base: 1.3, shake: 0 };
  J.modal = 'title';
  const SAVE = 'gta-jaipur-v1';
  const defaults = name => ({ name: name || 'Kabir', ch: 0, step: 0, money: 200, josh: 80, diary: {}, time: 7.66, stars: 0, introCh: -1, pigments: [] });
  J.state = defaults();

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5); cw = innerWidth; ch = innerHeight;
    cv.width = cw * dpr | 0; cv.height = ch * dpr | 0;
    J.view.base = Math.min(cw, ch) < 600 ? .62 : 1.05;
  }
  addEventListener('resize', resize); resize();

  // ---------------- save / load ----------------
  J.save = function () {
    try {
      const s = J.state, P = J.world.player;
      const out = Object.assign({}, s, { px: P.x, py: P.y, veh: P.veh ? P.veh.type : null, stars: 0, artImg: undefined });
      localStorage.setItem(SAVE, JSON.stringify(out));
    } catch (e) { /* private mode: play without saving */ }
  };
  function load() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } }
  J.loadArt = function () { if (!J.state.art) return; const im = new Image(); im.onload = () => { J.state.artImg = im; }; im.src = J.state.art; };

  J.newGame = function (name) {
    J.state = defaults(name); J.world.reset(); begin(); J.save();
  };
  function continueGame(sv) {
    J.state = Object.assign(defaults(sv.name), sv, { stars: 0 }); J.world.reset(); J.loadArt();
    if (sv.px) { J.world.player.x = sv.px; J.world.player.y = sv.py; }
    if (sv.veh) J.world.giveVehicle(sv.veh, sv.px, sv.py, 0);
    begin();
  }
  function begin() {
    $('title').hidden = true; $('hud').hidden = false; J.modal = null;
    const P = J.world.pos(); J.view.x = P.x; J.view.y = P.y;
    J.audio.init(); J.missions.start();
  }

  // ---------------- input ----------------
  const inp = J.input = { up: 0, down: 0, left: 0, right: 0, brake: 0, run: 0, rev: 0, joy: { active: false, angle: 0, mag: 0 } };
  const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'brake', ShiftLeft: 'run', ShiftRight: 'run' };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') { if (e.code === 'Enter') $('b-new').click(); return; }
    if (J.modal === 'scene') { if (J.sceneKey) J.sceneKey(e, true); return; }
    if (J.modal === 'dialog') { if (['Space', 'Enter', 'KeyE'].includes(e.code) && !e.repeat) { e.preventDefault(); J.ui.dialogNext(); } return; }
    if (J.modal && J.modal !== 'title') { if (['Escape', 'KeyM', 'KeyJ', 'KeyP'].includes(e.code)) J.ui.closeSheet(); return; }
    if (J.modal) return;
    if (KEYMAP[e.code]) { inp[KEYMAP[e.code]] = 1; e.preventDefault(); }
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Enter') interact();
    if (e.code === 'KeyH') honk();
    if (e.code === 'KeyM') J.ui.openMap();
    if (e.code === 'KeyJ') J.ui.openDiary();
    if (e.code === 'Escape' || e.code === 'KeyP') J.ui.openPause();
  });
  addEventListener('keyup', e => {
    if (J.modal === 'scene' && J.sceneKey) J.sceneKey(e, false);
    if (KEYMAP[e.code]) inp[KEYMAP[e.code]] = 0;
  });
  addEventListener('blur', () => { for (const k in KEYMAP) inp[KEYMAP[k]] = 0; });

  function honk() {
    const v = J.world.player.veh; J.audio.horn(v ? v.type : 'scooty');
    for (const p of J.world.peds) if (Math.hypot(p.x - J.world.player.x, p.y - J.world.player.y) < 90 && Math.random() < .3) J.world.say(p, ['Haan haan, sun liya!', 'Horn OK please', 'Arre baba!'][Math.random() * 3 | 0]);
    if (v) J.world.say(v, 'Pom pom!', 1);
  }

  function placeAction() {
    const P = J.world.pos();
    for (const p of J.PLACES) {
      if (!['food', 'cafe', 'garage'].includes(p.kind)) continue;
      if (Math.hypot(P.x - p.dx, P.y - p.dy) > 56) continue;
      if (p.id === 'curious') return { p, text: 'Have a coffee at Curious Life', run: () => J.scenes.open('coffee', {}) };
      if (p.kind === 'garage') return { p, text: 'Swap your ride at Chintu’s Garage', run: () => J.scenes.open('garage').then(t => { if (!t) return; const pl = J.world.player; if (pl.veh) J.world.exit(); J.world.giveVehicle(t, p.dx, p.dy - 40, 0); }) };
      if (p.food) return { p, text: `${p.food.item} at ${p.name} · ₹${p.food.price}`, run: () => J.scenes.open('eat', { place: p.id }) };
    }
    return null;
  }
  function interact() {
    if (J.missions.tryInteract()) return;
    const pa = placeAction(); if (pa) { pa.run(); return; }
    const P = J.world.player;
    if (P.veh) J.world.exit();
    else { const v = J.world.nearestVehicle(); if (v) J.world.enter(v); }
  }
  J.interact = interact;

  // touch
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) { document.body.classList.add('touch'); }
  const joy = $('joy'), knob = joy.querySelector('i'); let joyId = null;
  const joyMove = e => {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy; const d = Math.hypot(dx, dy), max = r.width / 2;
    if (d > max) { dx = dx / d * max; dy = dy / d * max; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    inp.joy.active = true; inp.joy.angle = Math.atan2(dy, dx); inp.joy.mag = Math.min(1, d / max);
  };
  joy.addEventListener('pointerdown', e => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyMove(e); });
  joy.addEventListener('pointermove', e => { if (e.pointerId === joyId) joyMove(e); });
  const joyEnd = () => { joyId = null; inp.joy.active = false; inp.joy.mag = 0; knob.style.transform = ''; };
  joy.addEventListener('pointerup', joyEnd); joy.addEventListener('pointercancel', joyEnd);
  const hold = (id, key) => { const b = $(id); b.addEventListener('pointerdown', e => { e.preventDefault(); inp[key] = 1; }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, () => inp[key] = 0)); };
  hold('t-brake', 'brake'); hold('t-rev', 'rev');
  $('t-act').addEventListener('pointerdown', e => { e.preventDefault(); if (J.modal === 'dialog') J.ui.dialogNext(); else if (!J.modal) interact(); });
  $('t-horn').addEventListener('pointerdown', e => { e.preventDefault(); if (!J.modal) honk(); });
  $('b-map').onclick = () => { if (!J.modal) J.ui.openMap(); };
  $('b-diary').onclick = () => { if (!J.modal) J.ui.openDiary(); };
  $('b-pause').onclick = () => { if (!J.modal) J.ui.openPause(); };

  // ---------------- day / night ----------------
  const KEYS = [[0, [18, 22, 60, .58]], [5, [18, 22, 60, .5]], [6.5, [255, 150, 130, .18]], [8, [255, 200, 150, 0]], [15.5, [255, 180, 90, 0]], [17.2, [255, 140, 60, .2]], [18.6, [120, 50, 110, .34]], [20, [18, 22, 60, .55]], [24, [18, 22, 60, .58]]];
  function tint(h) {
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [h0, a] = KEYS[i], [h1, b] = KEYS[i + 1];
      if (h >= h0 && h <= h1) { const k = (h - h0) / (h1 - h0); return a.map((v, j) => v + (b[j] - v) * k); }
    }
    return KEYS[0][1];
  }

  // ---------------- update ----------------
  let joshWarn = 0;
  function update(dt) {
    const S = J.state;
    S.time = (S.time + dt / 40) % 24;
    S.josh = Math.max(0, S.josh - dt * .22);
    if (S.josh < 15 && J.world.time - joshWarn > 60) { joshWarn = J.world.time; J.ui.toast('Bhook lagi hai!', 'Josh is low. Grab a kachori or a chai at any red dot on the minimap.'); }
    J.world.update(dt, inp);
    J.missions.update(dt);
    // camera
    const P = J.world.pos(), v = J.world.player.veh;
    const sp = v ? Math.hypot(v.vx, v.vy) : 0;
    const lx = v ? v.vx * .35 : 0, ly = v ? v.vy * .35 : 0;
    const k = Math.min(1, dt * 4);
    J.view.x += (P.x + lx - J.view.x) * k; J.view.y += (P.y + ly - J.view.y) * k;
    const zt = J.view.base * (v ? 1 - .26 * Math.min(1, sp / 400) : 1.15);
    J.view.zoom += (zt - J.view.zoom) * Math.min(1, dt * 1.5);
    J.view.shake = Math.max(0, J.view.shake - dt * 25);
    if (v) J.audio.engine(Math.min(1, Math.abs(v.v) / J.VEH[v.type].maxV), v.type, true); else J.audio.engine(0, 'car', false);
    J.audio.tick();
    // prompt
    let pr = J.missions.prompt();
    if (!pr) pr = J.missions.needText() ? null : (placeAction() || {}).text;
    if (!pr && !v) { const nv = J.world.nearestVehicle(); if (nv) pr = `Get on the ${J.VEH[nv.type].name}${nv.driver === 'ai' ? ' (they won’t like it)' : ''}`; }
    if (!pr && v && Math.abs(v.v) < 40) pr = null;
    const need = J.missions.needText();
    J.ui.prompt(pr || need);
    if (need && !pr) $('prompt').innerHTML = J.ui.esc(need);
  }

  // ---------------- render ----------------
  function render() {
    const V = J.view, z = V.zoom, t = J.world.time;
    const sx = (Math.random() - .5) * V.shake, sy = (Math.random() - .5) * V.shake;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#B39465'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (cw / 2 - V.x * z + sx), dpr * (ch / 2 - V.y * z + sy));
    const x0 = V.x - cw / 2 / z, y0 = V.y - ch / 2 / z, x1 = V.x + cw / 2 / z, y1 = V.y + ch / 2 / z;
    J.map.drawGround(ctx, x0, y0, x1, y1);
    J.map.drawShadows(ctx, x0, y0, x1, y1);
    // objective rings (ground)
    const targets = J.missions.targets();
    for (const o of targets) {
      const r = 22 + Math.sin(t * 4) * 4;
      ctx.strokeStyle = 'rgba(242,164,28,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(242,164,28,.22)'; ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 7); ctx.fill();
    }
    // food & interaction rings (subtle)
    for (const p of J.PLACES) {
      if (!['food', 'cafe', 'garage'].includes(p.kind) || p.dx < x0 - 40 || p.dx > x1 + 40 || p.dy < y0 - 40 || p.dy > y1 + 40) continue;
      ctx.strokeStyle = 'rgba(194,65,59,.55)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(p.dx, p.dy, 16, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    }
    J.world.draw(ctx, x0, y0, x1, y1);
    J.map.drawStructures(ctx, x0, y0, x1, y1, t);
    J.world.drawPlayer(ctx, .35); // x-ray silhouette behind buildings
    // labels
    const P = J.world.pos();
    ctx.font = '700 12px Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of J.PLACES) {
      if (Math.hypot(p.dx - P.x, p.dy - P.y) > 560) continue;
      const lx = p.kind === 'spot' ? p.dx : p.cxp, ly = p.kind === 'spot' ? p.dy - 70 : p.y * T - (p.hgt || 0) - 16;
      const label = p.food ? `${p.name} · ${p.food.item}` : p.name, w = ctx.measureText(label).width + 18;
      ctx.fillStyle = 'rgba(43,27,23,.22)'; J.draw.rr(ctx, lx - w / 2 + 2, ly - 10 + 3, w, 20, 10); ctx.fill();
      ctx.fillStyle = p.food ? '#FFF6EC' : '#2B1B17'; J.draw.rr(ctx, lx - w / 2, ly - 10, w, 20, 10); ctx.fill();
      if (p.food) { ctx.fillStyle = '#C2413B'; ctx.beginPath(); ctx.arc(lx - w / 2 + 9, ly, 3.5, 0, 7); ctx.fill(); }
      ctx.fillStyle = p.food ? '#2B1B17' : '#FFF6EC'; ctx.fillText(label, lx + (p.food ? 4 : 0), ly + 1);
    }
    // floating chevrons over objectives
    for (const o of targets) {
      const by = o.y - 46 + Math.sin(t * 3) * 5;
      ctx.fillStyle = 'rgba(43,27,23,.3)'; ctx.beginPath(); ctx.moveTo(o.x - 11 + 3, by - 10 + 4); ctx.lineTo(o.x + 11 + 3, by - 10 + 4); ctx.lineTo(o.x + 3, by + 6 + 4); ctx.fill();
      ctx.fillStyle = '#F2A41C'; ctx.beginPath(); ctx.moveTo(o.x - 11, by - 10); ctx.lineTo(o.x + 11, by - 10); ctx.lineTo(o.x, by + 6); ctx.fill();
    }
    J.world.drawBubbles(ctx);

    // day / night
    const [r, g, b, a] = tint(J.state.time);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (a > .01) { ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a})`; ctx.fillRect(0, 0, cw, ch); }
    const dark = (b > r) ? a : 0;
    if (dark > .2) {
      ctx.setTransform(dpr * z, 0, 0, dpr * z, dpr * (cw / 2 - V.x * z), dpr * (ch / 2 - V.y * z));
      ctx.globalCompositeOperation = 'lighter';
      for (const v of J.world.vehicles.concat(J.world.player.veh ? [J.world.player.veh] : [])) {
        if (v.parked || v.x < x0 - 80 || v.x > x1 + 80 || v.y < y0 - 80 || v.y > y1 + 80) continue;
        const fx = v.x + Math.cos(v.a) * 42, fy = v.y + Math.sin(v.a) * 42, gr = ctx.createRadialGradient(fx, fy, 0, fx, fy, 46);
        gr.addColorStop(0, `rgba(255,220,150,${dark * .55})`); gr.addColorStop(1, 'rgba(255,220,150,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(fx, fy, 46, 0, 7); ctx.fill();
      }
      for (const p of J.PLACES) {
        if (p.kind === 'spot' || p.cxp < x0 - 200 || p.cxp > x1 + 200 || p.cyp < y0 - 200 || p.cyp > y1 + 200) continue;
        const R = Math.max(p.w, p.h) * T * .8, gr = ctx.createRadialGradient(p.cxp, p.cyp, 0, p.cxp, p.cyp, R);
        gr.addColorStop(0, `rgba(255,170,90,${dark * .45})`); gr.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = gr; ctx.fillRect(p.cxp - R, p.cyp - R, R * 2, R * 2);
      }
      ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    // off-screen objective arrow
    if (targets.length) {
      const o = targets[0], dx = (o.x - V.x) * z, dy = (o.y - V.y) * z;
      const m = 46, hw = cw / 2 - m, hh = ch / 2 - m;
      if (Math.abs(dx) > hw || Math.abs(dy) > hh) {
        const s = Math.min(hw / Math.abs(dx || 1e-6), hh / Math.abs(dy || 1e-6)), ax = cw / 2 + dx * s, ay = ch / 2 + dy * s, an = Math.atan2(dy, dx);
        ctx.save(); ctx.translate(ax, ay); ctx.rotate(an);
        ctx.fillStyle = 'rgba(43,27,23,.35)'; ctx.beginPath(); ctx.moveTo(20, 3); ctx.lineTo(-10, -11); ctx.lineTo(-10, 17); ctx.fill();
        ctx.fillStyle = '#F2A41C'; ctx.strokeStyle = '#2B1B17'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(-12, -14); ctx.lineTo(-12, 14); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
        const dm = Math.round(Math.hypot(o.x - P.x, o.y - P.y) / T * 4);
        ctx.font = '800 13px Mukta, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#FFF6EC'; ctx.strokeStyle = 'rgba(43,27,23,.8)'; ctx.lineWidth = 3;
        const tx = ax - Math.cos(an) * 30, ty = ay - Math.sin(an) * 30;
        ctx.strokeText(dm > 999 ? (dm / 1000).toFixed(1) + ' km' : dm + ' m', tx, ty); ctx.fillText(dm > 999 ? (dm / 1000).toFixed(1) + ' km' : dm + ' m', tx, ty);
      }
    }
    J.ui.minimap();
  }

  // ---------------- loop ----------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (J.modal !== 'title') {
      if (!J.modal) update(dt);
      J.ui.update(dt);
      render();
    } else drawTitle(now / 1000);
    requestAnimationFrame(frame);
  }

  // ---------------- title ----------------
  const tc = $('title-art'), tctx = tc.getContext('2d');
  function drawTitle(t) {
    const w = innerWidth, h = innerHeight; if (tc.width !== w || tc.height !== h) { tc.width = w; tc.height = h; }
    J.draw.skyline(tctx, w, h, t);
    tctx.fillStyle = 'rgba(42,22,32,.35)'; tctx.fillRect(0, h * .55, w, h * .45);
  }
  const sv = load();
  if (sv && sv.name) { $('b-cont').hidden = false; $('pname').value = sv.name; $('b-cont').textContent = `Continue as ${sv.name}`; }
  $('b-new').onclick = () => { J.audio.init(); J.newGame(($('pname').value || 'Kabir').trim().slice(0, 14) || 'Kabir'); };
  $('b-cont').onclick = () => { J.audio.init(); continueGame(load()); };
  if (isTouch) $('touch').hidden = true;
  const showTouch = () => { if (isTouch) $('touch').hidden = !!J.modal; };
  setInterval(showTouch, 250);
  addEventListener('beforeunload', () => { if (J.modal !== 'title') J.save(); });
  setInterval(() => { if (J.modal !== 'title') J.save(); }, 15000);
  requestAnimationFrame(frame);
})(window.J);
