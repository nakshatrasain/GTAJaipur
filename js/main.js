/* Game loop, input, 3D camera hooks, overlay labels, save/load. */
(function (J) {
  const cv = document.getElementById('game'), fx = document.getElementById('fx'), fctx = fx.getContext('2d');
  const $ = id => document.getElementById(id);
  const T = J.T;
  J.view = { x: 0, y: 0, zoom: .7, shake: 0 };
  J.modal = 'title';
  const SAVE = 'gta-jaipur-v2';
  const defaults = name => ({ name: name || 'Kabir', ch: 0, step: 0, money: 200, josh: 80, diary: {}, time: 7.66, stars: 0, introCh: -1, pigments: [] });
  J.state = defaults();
  let dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = innerWidth * dpr | 0; fx.height = innerHeight * dpr | 0;
    if (J.r3) J.r3.resize();
  }
  addEventListener('resize', resize); resize();

  // ---------------- save / load ----------------
  J.save = function () {
    try {
      const s = J.state, P = J.world.player;
      localStorage.setItem(SAVE, JSON.stringify(Object.assign({}, s, { px: P.x, py: P.y, veh: P.veh ? P.veh.type : null, stars: 0, artImg: undefined })));
    } catch (e) { /* private mode: play without saving */ }
  };
  function load() { try { return JSON.parse(localStorage.getItem(SAVE)); } catch (e) { return null; } }
  J.loadArt = function () { if (!J.state.art) return; const im = new Image(); im.onload = () => { J.state.artImg = im; J.r3.refreshMural(); }; im.src = J.state.art; };

  function withCity(fn) {
    if (J.r3built) return fn();
    const b = $('b-new'), c = $('b-cont'); b.textContent = 'Building Jaipur…'; b.disabled = c.disabled = true;
    setTimeout(() => { J.r3.init(cv); J.r3built = true; fn(); }, 40);
  }
  J.newGame = function (name) { withCity(() => { J.state = defaults(name); J.world.reset(); begin(); J.save(); }); };
  function continueGame(sv) {
    withCity(() => {
      J.state = Object.assign(defaults(sv.name), sv, { stars: 0 }); J.world.reset(); J.loadArt();
      if (sv.px) { J.world.player.x = sv.px; J.world.player.y = sv.py; }
      if (sv.veh) J.world.giveVehicle(sv.veh, sv.px, sv.py, 0);
      begin();
    });
  }
  function begin() {
    $('title').hidden = true; $('hud').hidden = false; J.modal = null;
    if (document.activeElement) document.activeElement.blur();
    J.audio.init(); J.missions.start();
  }

  // ---------------- input ----------------
  const inp = J.input = { up: 0, down: 0, left: 0, right: 0, brake: 0, run: 0, rev: 0, joy: { active: false, angle: 0, mag: 0 } };
  const KEYMAP = { KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', Space: 'brake', ShiftLeft: 'run', ShiftRight: 'run' };
  addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT') { if (e.code === 'Enter') $('b-new').click(); return; }
    if (J.modal === 'scene') { if (J.sceneKey) J.sceneKey(e, true); return; }
    if (J.modal === 'dialog') { if (['Space', 'Enter', 'KeyE'].includes(e.code) && !e.repeat) { e.preventDefault(); J.ui.dialogNext(); } return; }
    if (J.modal && J.modal !== 'title' && J.modal !== 'cine') { if (['Escape', 'KeyM', 'KeyJ', 'KeyP'].includes(e.code)) J.ui.closeSheet(); return; }
    if (J.modal) return;
    if (KEYMAP[e.code]) { inp[KEYMAP[e.code]] = 1; e.preventDefault(); }
    if (e.repeat) return;
    if (e.code === 'KeyE' || e.code === 'Enter') interact();
    if (e.code === 'KeyH') honk();
    if (e.code === 'KeyM') J.ui.openMap();
    if (e.code === 'KeyJ') J.ui.openDiary();
    if (e.code === 'KeyC') J.r3.yawOff = J.r3.yawOff ? 0 : Math.PI;
    if (e.code === 'Escape' || e.code === 'KeyP') J.ui.openPause();
  });
  addEventListener('keyup', e => {
    if (J.modal === 'scene' && J.sceneKey) J.sceneKey(e, false);
    if (KEYMAP[e.code]) inp[KEYMAP[e.code]] = 0;
  });
  addEventListener('blur', () => { for (const k in KEYMAP) inp[KEYMAP[k]] = 0; });

  // drag to look around (mouse or finger on the city)
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = { id: e.pointerId, x: e.clientX }; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; J.r3.yawOff -= (e.clientX - drag.x) * .006; drag.x = e.clientX; J.r3.lastDrag = performance.now(); });
  ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drag = null; }));

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
      if (p.id === 'curious') return { p, text: 'Walk in for a coffee at Curious Life', run: () => J.scenes.open('coffee', {}) };
      if (p.kind === 'garage') return { p, text: 'Swap your ride at Chintu’s Garage', run: () => J.scenes.open('garage').then(t => { if (!t) return; const pl = J.world.player; if (pl.veh) J.world.exit(); J.world.giveVehicle(t, p.dx, p.dy - 40, 0); }) };
      if (p.food) return { p, text: `Walk in: ${p.food.item} at ${p.name} · ₹${p.food.price}`, run: () => J.scenes.open('eat', { place: p.id }) };
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

  // ---------------- walk-in cinematic before every scene ----------------
  const SCENE_PLACE = { coffee: 'curious', garage: 'garage', photo: 'hawa', art: 'jkk', finale: 'nahargarh' };
  const rawOpen = J.scenes.open;
  let walkIn = null;
  J.scenes.open = function (name, opts) {
    const p = J.PLACE[(opts && opts.place) || SCENE_PLACE[name]];
    if (!p || !J.r3built) return rawOpen(name, opts);
    return new Promise(res => {
      const P = J.world.player;
      if (P.veh) { P.veh.v = 0; P.veh.vx = P.veh.vy = 0; J.world.exit(); }
      J.modal = 'cine'; J.ui.prompt(null);
      J.r3.startCine(p, 1.5);
      walkIn = { p, t: 0 };
      setTimeout(() => $('fade').classList.add('on'), 1250);
      setTimeout(() => {
        J.r3.endCine(); walkIn = null; J.modal = null;
        rawOpen(name, opts).then(r => { setTimeout(() => $('fade').classList.remove('on'), 60); res(r); });
      }, 1600);
    });
  };
  function stepWalkIn(dt) {
    const P = J.world.player, p = walkIn.p, dx = p.dx - P.x, dy = p.dy - P.y, d = Math.hypot(dx, dy);
    if (d > 6) { P.a = Math.atan2(dy, dx); const s = Math.min(d, 60 * dt); P.x += dx / d * s; P.y += dy / d * s; P.moving = true; P.walk += dt * 10; }
    else P.moving = false;
  }

  // touch
  const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
  if (isTouch) document.body.classList.add('touch');
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

  // ---------------- update ----------------
  let joshWarn = 0;
  function update(dt) {
    const S = J.state;
    S.time = (S.time + dt / 40) % 24;
    S.josh = Math.max(0, S.josh - dt * .22);
    if (S.josh < 15 && J.world.time - joshWarn > 60) { joshWarn = J.world.time; J.ui.toast('Bhook lagi hai!', 'Josh is low. Grab a kachori or a chai at any red dot on the minimap.'); }
    J.world.update(dt, inp);
    J.missions.update(dt);
    const v = J.world.player.veh;
    if (v) J.audio.engine(Math.min(1, Math.abs(v.v) / J.VEH[v.type].maxV), v.type, true); else J.audio.engine(0, 'car', false);
    J.audio.tick();
    let pr = J.missions.prompt();
    if (!pr) pr = J.missions.needText() ? null : (placeAction() || {}).text;
    if (!pr && !v) { const nv = J.world.nearestVehicle(); if (nv) pr = `Get on the ${J.VEH[nv.type].name}${nv.driver === 'ai' ? ' (they won’t like it)' : ''}`; }
    const need = J.missions.needText();
    J.ui.prompt(pr || need);
    if (need && !pr) $('prompt').innerHTML = J.ui.esc(need);
  }

  // ---------------- overlay: labels, name tags, bubbles, arrow ----------------
  function pill(text, x, y, dark, alpha) {
    const c = fctx; c.globalAlpha = alpha; c.font = '700 13px Mukta, sans-serif';
    const w = c.measureText(text).width + 18;
    c.fillStyle = 'rgba(43,27,23,.25)'; J.draw.rr(c, x - w / 2 + 2, y - 11 + 3, w, 22, 11); c.fill();
    c.fillStyle = dark ? '#2B1B17' : '#FFF6EC'; J.draw.rr(c, x - w / 2, y - 11, w, 22, 11); c.fill();
    c.fillStyle = dark ? '#FFF6EC' : '#2B1B17'; c.fillText(text, x, y + 1);
    c.globalAlpha = 1;
  }
  function drawOverlay() {
    const c = fctx, W = innerWidth, H = innerHeight;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    const P = J.world.pos();
    const near = J.PLACES.map(p => [p, Math.hypot(p.dx - P.x, p.dy - P.y) / 8]).filter(([, d]) => d < 120 && d > 14).sort((a, b) => a[1] - b[1]).slice(0, 6);
    for (const [p, d] of near) {
      const lx = p.kind === 'spot' ? p.dx : p.cxp, ly = p.kind === 'spot' ? p.dy : p.cyp;
      const s = J.r3.project(lx, ly, p.kind === 'spot' ? 9 : 6 + (p.hgt || 0) * .36 + 4); if (!s.on) continue;
      pill(p.food ? `${p.name} · ${p.food.item}` : p.name, s.x, s.y, !p.food, Math.min(1, (120 - d) / 30, (d - 14) / 10));
    }
    for (const n of J.r3.npcs) { if (n.x === undefined) continue; const d = Math.hypot(n.x - P.x, n.y - P.y) / 8; if (d > 45) continue; const s = J.r3.project(n.x, n.y, 2.5); if (s.on) pill(n.name, s.x, s.y, false, Math.min(1, (45 - d) / 10)); }
    c.font = '700 13px Mukta, sans-serif';
    for (const b of J.world.bubbles) {
      const s = J.r3.project(b.o.x, b.o.y, 3); if (!s.on) continue;
      const w = c.measureText(b.text).width + 18, x = s.x, y = s.y;
      c.globalAlpha = Math.min(1, b.t * 3);
      c.fillStyle = '#FFF6EC'; J.draw.rr(c, x - w / 2, y - 12, w, 24, 12); c.fill();
      c.beginPath(); c.moveTo(x - 5, y + 11); c.lineTo(x, y + 18); c.lineTo(x + 5, y + 11); c.fill();
      c.fillStyle = '#2B1B17'; c.fillText(b.text, x, y + 1); c.globalAlpha = 1;
    }
    // objective arrow when the marker is off screen
    const tg = J.missions.targets();
    if (tg.length && !J.modal) {
      const o = tg[0], s = J.r3.project(o.x, o.y, 4);
      if (!s.on) {
        const a = J.camA || 0, rx = o.x - P.x, ry = o.y - P.y;
        const sx = rx * -Math.sin(a) + ry * Math.cos(a), sy = -(rx * Math.cos(a) + ry * Math.sin(a));
        const an = Math.atan2(sy, sx), m = 56, hw = W / 2 - m, hh = H / 2 - m;
        const k = Math.min(hw / Math.abs(Math.cos(an) || 1e-6), hh / Math.abs(Math.sin(an) || 1e-6)), ax = W / 2 + Math.cos(an) * k, ay = H / 2 + Math.sin(an) * k;
        c.save(); c.translate(ax, ay); c.rotate(an);
        c.fillStyle = 'rgba(43,27,23,.35)'; c.beginPath(); c.moveTo(22, 3); c.lineTo(-10, -12); c.lineTo(-10, 18); c.fill();
        c.fillStyle = '#F2A41C'; c.strokeStyle = '#2B1B17'; c.lineWidth = 2; c.beginPath(); c.moveTo(20, 0); c.lineTo(-12, -15); c.lineTo(-12, 15); c.closePath(); c.fill(); c.stroke();
        c.restore();
        const dm = Math.round(Math.hypot(rx, ry) / 8), txt = dm > 999 ? (dm / 1000).toFixed(1) + ' km' : dm + ' m';
        c.font = '800 13px Mukta, sans-serif'; c.strokeStyle = 'rgba(43,27,23,.85)'; c.lineWidth = 3; c.fillStyle = '#FFF6EC';
        const tx = ax - Math.cos(an) * 32, ty = ay - Math.sin(an) * 32; c.strokeText(txt, tx, ty); c.fillText(txt, tx, ty);
      }
    }
  }

  // ---------------- loop ----------------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (J.modal !== 'title' && J.r3built) {
      if (!J.modal) update(dt);
      if (J.modal === 'cine' && walkIn) { stepWalkIn(dt); J.world.time += dt; }
      J.ui.update(dt);
      J.r3.render(dt);
      drawOverlay();
      J.ui.minimap();
    } else if (J.modal === 'title') drawTitle(now / 1000);
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
  setInterval(() => { if (isTouch) $('touch').hidden = !!J.modal; }, 250);
  addEventListener('beforeunload', () => { if (J.modal !== 'title') J.save(); });
  setInterval(() => { if (J.modal !== 'title' && J.r3built) J.save(); }, 15000);
  requestAnimationFrame(frame);
})(window.J);
