/* World simulation: player, vehicles, traffic AI, people, cows, monkeys, police. */
(function (J) {
  const T = J.T, M = J.map, TL = M.TL, MW = M.W;
  const Wd = J.world = { vehicles: [], peds: [], cows: [], monkeys: [], bubbles: [], time: 0, police: [] };
  const DIRS = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.random() * a.length | 0];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return d; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  Wd.angDiff = angDiff;
  function joyWorld(inp) { // joystick is relative to the 3D camera
    const a = J.camA || 0, jx = Math.cos(inp.joy.angle), jy = Math.sin(inp.joy.angle);
    return Math.atan2(Math.sin(a) * -jy + Math.cos(a) * jx, Math.cos(a) * -jy - Math.sin(a) * jx);
  }
  let nid = 1;

  const SKINS = ['#C68B62', '#B47650', '#D9A07A', '#9A6342', '#E0B08C'];
  const CLOTH = ['#E0577A', '#2E3A87', '#F2A41C', '#3F8F5A', '#F6F1E7', '#C2413B', '#7A5BA6', '#4DA3C7', '#E07B1A'];

  function mkVeh(type, x, y, a, o) {
    const VT = J.VEH[type];
    return Object.assign({ id: nid++, type, x, y, a, v: 0, vx: 0, vy: 0, col: pick(VT.cols), driver: null, ai: null, stunned: 0, rider: pick(['#5C7AAE', '#C2413B', '#3F8F5A', '#F6F1E7', '#7A5BA6']), helmet: pick(['#2B1B17', '#C2413B', '#F6F1E7', '#263170']) }, o || {});
  }
  Wd.mkVeh = mkVeh;
  function mkPed(x, y) {
    const f = Math.random() < .45;
    return { x, y, a: pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]), sp: rnd(28, 46), walk: Math.random() * 6, skin: pick(SKINS), col: pick(CLOTH), dupatta: f ? pick(CLOTH) : null, turban: !f && Math.random() < .35 ? pick(['#E07B1A', '#E0577A', '#F2A41C', '#C2413B']) : null, hair: '#2B1B17', down: 0, spin: 0 };
  }

  Wd.reset = function () {
    Wd.vehicles = []; Wd.peds = []; Wd.cows = []; Wd.bubbles = []; Wd.police = []; Wd.monkeys = [];
    const st = J.PLACE.station;
    Wd.player = { x: st.dx + 30, y: st.dy + 20, a: 0, veh: null, walk: 0, skin: '#C68B62', col: '#F2A41C', hair: '#2B1B17' };
    // parked vehicles along kerbs
    const R = (() => { let s = 99; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    for (let y = 1; y < M.H - 1; y++) for (let x = 1; x < MW - 1; x++) {
      if (M.get(x, y) !== TL.SIDE || R() > .028) continue;
      const vert = M.get(x - 1, y) === TL.ROAD || M.get(x + 1, y) === TL.ROAD;
      const type = pick(['scooty', 'scooty', 'bike', 'car', 'auto', 'jeep']);
      Wd.vehicles.push(mkVeh(type, (x + .5) * T, (y + .5) * T, vert ? Math.PI / 2 : 0, { parked: true }));
    }
    [['galta', 10], ['amer', 8]].forEach(([id, n]) => { const p = J.PLACE[id]; for (let i = 0; i < n; i++) Wd.monkeys.push({ ax: p.dx + rnd(-90, 90), ay: p.dy + rnd(-10, 40), x: p.dx, y: p.dy, seed: Math.random() * 9, t: 0 }); });
  };
  Wd.pos = () => Wd.player.veh || Wd.player;

  // ---------------- physics ----------------
  function hits(v, x, y, a) {
    const VT = J.VEH[v.type], ca = Math.cos(a), sa = Math.sin(a), hl = VT.l / 2 - 1, hw = VT.w / 2 - 1;
    const pts = [[hl, hw], [hl, -hw], [-hl, hw], [-hl, -hw], [hl, 0], [-hl, 0], [0, hw], [0, -hw]];
    for (const [p, q] of pts) if (M.solidAt(x + p * ca - q * sa, y + p * sa + q * ca)) return true;
    return false;
  }
  function move(v, dt) {
    const nx = v.x + v.vx * dt, ny = v.y + v.vy * dt;
    if (!hits(v, nx, ny, v.a)) { v.x = nx; v.y = ny; return; }
    const imp = Math.hypot(v.vx, v.vy);
    if (!hits(v, nx, v.y, v.a)) { v.x = nx; v.vy *= .2; v.v *= .8; }
    else if (!hits(v, v.x, ny, v.a)) { v.y = ny; v.vx *= .2; v.v *= .8; }
    else { v.v *= -.3; v.vx *= -.3; v.vy *= -.3; }
    if (v.driver === 'player' && imp > 140) { J.audio.thud(); J.view.shake = Math.min(10, imp / 45); }
  }
  function drive(v, c, dt) {
    const VT = J.VEH[v.type];
    const sf = M.surface(M.tileAt(v.x, v.y), VT.offroad);
    const maxV = VT.maxV * sf * (v.driver === 'player' && J.state.josh < 15 ? .85 : 1);
    if (c.thr > 0) v.v += (v.v < 0 ? VT.brake : VT.acc) * c.thr * dt;
    else if (c.thr < 0) v.v -= (v.v > 0 ? VT.brake : VT.acc * .6) * -c.thr * dt;
    else v.v -= Math.sign(v.v) * Math.min(Math.abs(v.v), 170 * dt);
    if (c.brake) v.v -= Math.sign(v.v) * Math.min(Math.abs(v.v), VT.brake * .7 * dt);
    if (v.v > maxV) v.v = Math.max(maxV, v.v - 520 * dt);
    if (v.v < -maxV * .35) v.v = -maxV * .35;
    const oldA = v.a, sp = clamp(v.v / 110, -1, 1);
    v.a += c.steer * VT.turn * dt * sp * (c.brake ? 1.4 : 1);
    if (VT.wobble) v.a += Math.sin(Wd.time * 8 + v.id) * .3 * dt * Math.abs(v.v) / VT.maxV;
    if (hits(v, v.x, v.y, v.a) && !hits(v, v.x, v.y, oldA)) v.a = oldA;
    const tx = Math.cos(v.a) * v.v, ty = Math.sin(v.a) * v.v, k = Math.min(1, (c.brake ? 1.5 : VT.grip) * dt);
    v.vx += (tx - v.vx) * k; v.vy += (ty - v.vy) * k;
    move(v, dt);
  }
  Wd.drive = drive;

  // ---------------- traffic AI (tile-following, keeps left) ----------------
  function aheadOf(v, o, look, lat) {
    const dx = o.x - v.x, dy = o.y - v.y, ca = Math.cos(v.a), sa = Math.sin(v.a);
    const f = dx * ca + dy * sa, s = -dx * sa + dy * ca;
    return f > 0 && f < look && Math.abs(s) < (lat || 13);
  }
  function blocked(v) {
    const VT = J.VEH[v.type], look = VT.l / 2 + 26;
    const P = Wd.pos(); if (P !== v && aheadOf(v, P, look + 8, 16)) return true;
    for (const o of Wd.vehicles) if (o !== v && !o.parked && aheadOf(v, o, look + J.VEH[o.type].l / 2, 13)) return true;
    for (const k of Wd.cows) if (aheadOf(v, k, look + 8, 15)) return true;
    for (const p of Wd.peds) if (p.down <= 0 && aheadOf(v, p, look, 10)) return true;
    return false;
  }
  function advance(v) {
    const ai = v.ai, cx = ai.tx, cy = ai.ty, d = ai.dir, i = cy * MW + cx;
    const fwd = DIRS[d], fOk = M.get(cx + fwd[0], cy + fwd[1]) === TL.ROAD;
    const perp = [(d + 1) % 4, (d + 3) % 4];
    const turnable = perp.filter(p => { const q = DIRS[p]; if (M.get(cx + q[0], cy + q[1]) !== TL.ROAD) return false; return (p % 2 === 0 ? M.hRun[i] : M.vRun[i]) >= 6; });
    ai.cool = Math.max(0, (ai.cool || 0) - 1);
    let nd = d;
    if (!fOk) { const any = perp.filter(p => M.get(cx + DIRS[p][0], cy + DIRS[p][1]) === TL.ROAD); nd = turnable.length ? pick(turnable) : any.length ? pick(any) : (d + 2) % 4; }
    else if (turnable.length && !ai.cool && Math.random() < (ai.turnP || .3)) nd = ai.choose ? ai.choose(turnable.concat([d]), cx, cy) : pick(turnable);
    if (nd !== d) ai.cool = 4;
    ai.dir = nd; ai.tx = cx + DIRS[nd][0]; ai.ty = cy + DIRS[nd][1];
  }
  function aiRoad(v, dt) {
    const ai = v.ai, VT = J.VEH[v.type], d = DIRS[ai.dir];
    const tx = (ai.tx + .5) * T + d[1] * ai.off, ty = (ai.ty + .5) * T - d[0] * ai.off;
    const dx = tx - v.x, dy = ty - v.y;
    if (Math.hypot(dx, dy) < 12) advance(v);
    let want = ai.cruiseFn ? ai.cruiseFn(v) : ai.cruise;
    if (v.stunned > 0) { v.stunned -= dt; want = 0; }
    else if (blocked(v)) {
      want = 0; ai.wait = (ai.wait || 0) + dt;
      if (ai.wait > 1.4 && Math.random() < dt * .8 && dist(v, Wd.pos()) < 420) { Wd.say(v, pick(['Pom pom!', 'Horn OK please!', 'Chalo bhai!', 'Arre hato!'])); if (Math.random() < .5) J.audio.horn(v.type); ai.wait = 0; }
    } else ai.wait = 0;
    v.v += clamp(want - v.v, -VT.brake * dt, VT.acc * dt * .7);
    v.a += angDiff(Math.atan2(dy, dx), v.a) * Math.min(1, dt * 7);
    v.vx = Math.cos(v.a) * v.v; v.vy = Math.sin(v.a) * v.v;
    v.x += v.vx * dt; v.y += v.vy * dt;
  }
  function placeOnRoad(v, tx, ty) {
    const i = ty * MW + tx, horiz = M.hRun[i] >= M.vRun[i];
    const opts = (horiz ? [0, 2] : [1, 3]).filter(d => M.get(tx + DIRS[d][0], ty + DIRS[d][1]) === TL.ROAD);
    const dir = opts.length ? pick(opts) : 0, off = J.VEH[v.type].w * .5 + 5;
    v.ai = Object.assign(v.ai || {}, { dir, tx, ty, off, cool: 0 });
    v.x = (tx + .5) * T + DIRS[dir][1] * off; v.y = (ty + .5) * T - DIRS[dir][0] * off; v.a = Math.atan2(DIRS[dir][1], DIRS[dir][0]);
    advance(v);
  }

  function aiPursue(v, tx, ty, dt) {
    const probe = J.VEH[v.type].l / 2 + 18;
    let diff = angDiff(Math.atan2(ty - v.y, tx - v.x), v.a);
    if (M.solidAt(v.x + Math.cos(v.a) * probe, v.y + Math.sin(v.a) * probe)) {
      const l = M.solidAt(v.x + Math.cos(v.a - .8) * probe, v.y + Math.sin(v.a - .8) * probe);
      diff = l ? 1.6 : -1.6;
    }
    v.stuck = Math.max(0, (v.stuck || 0) - dt);
    drive(v, { thr: v.stuck > 0 ? -1 : (v.stunned > 0 ? 0 : 1), steer: clamp(diff * 2.2 * (v.stuck > 0 ? -1 : 1), -1, 1), brake: false }, dt);
    if (Math.abs(v.v) < 25) { v.stuckT = (v.stuckT || 0) + dt; if (v.stuckT > .9) { v.stuck = .7; v.stuckT = 0; } } else v.stuckT = 0;
    if (v.stunned > 0) v.stunned -= dt;
  }

  // ---------------- speech bubbles ----------------
  Wd.say = function (o, text, t) {
    if (Wd.bubbles.some(b => b.o === o)) return;
    Wd.bubbles.push({ o, text, t: t || 2.2 });
    if (Wd.bubbles.length > 8) Wd.bubbles.shift();
  };

  // ---------------- player actions ----------------
  Wd.nearestVehicle = function () {
    const P = Wd.player; let best = null, bd = 1e9;
    for (const v of Wd.vehicles) { if (v.type === 'police' || v.goon || v.chaser) continue; const d = dist(v, P), r = Math.max(30, J.VEH[v.type].l * .7); if (d < r && d < bd) { bd = d; best = v; } }
    return best;
  };
  Wd.enter = function (v) {
    const P = Wd.player;
    if (v.ai && v.driver === 'ai') {
      const p = mkPed(v.x + Math.cos(v.a + 1.57) * 18, v.y + Math.sin(v.a + 1.57) * 18); p.col = v.rider; Wd.peds.push(p);
      Wd.say(p, pick(J.JACKED), 2.6); Wd.addStar(1, 'Bina puche gaadi?');
    }
    v.driver = 'player'; v.ai = null; v.parked = false; v.keep = true; v.v = 0;
    Wd.vehicles.forEach(o => { if (o !== v && o.keep && !o.mission) o.keep = false; });
    P.veh = v; J.audio.click();
  };
  Wd.exit = function () {
    const P = Wd.player, v = P.veh; if (!v) return;
    if (Math.abs(v.v) > 60) return;
    const VT = J.VEH[v.type];
    for (const s of [1, -1, 2]) {
      const ang = v.a + (s === 2 ? Math.PI : s * Math.PI / 2), r = (s === 2 ? VT.l : VT.w) / 2 + 9;
      const x = v.x + Math.cos(ang) * r, y = v.y + Math.sin(ang) * r;
      if (!M.solidAt(x, y)) { P.x = x; P.y = y; break; }
    }
    v.driver = null; v.v = 0; v.vx = v.vy = 0; v.parked = true; v.keep = true; P.veh = null; J.audio.click();
  };
  Wd.giveVehicle = function (type, x, y, a) {
    const road = M.nearestRoad(x, y);
    const v = mkVeh(type, (road.x + .5) * T, (road.y + .5) * T, a || 0, { col: J.VEH[type].cols[0] });
    if (type === 'scooty') v.col = '#E85D75';
    Wd.vehicles.push(v); Wd.enter(v); return v;
  };
  Wd.spawnParkedAt = function (type, place) {
    const road = M.nearestRoad(place.dx, place.dy);
    const v = mkVeh(type, (road.x + .5) * T, (road.y + .5) * T, 0, { parked: true, keep: true, mission: true });
    Wd.vehicles.push(v); return v;
  };

  // ---------------- challan (wanted) ----------------
  Wd.addStar = function (n, why) {
    const S = J.state;
    if (Wd.time - (S.starAt || -9) < 3) return;
    S.starAt = Wd.time; S.stars = Math.min(5, S.stars + n); S.evade = 0;
    J.ui.toast('Challan ' + '★'.repeat(S.stars), why || 'Traffic Mamu is on the way');
  };

  // ---------------- missions hooks ----------------
  Wd.spawnGoon = function (place) {
    const road = M.nearestRoad(place.dx + 120, place.dy);
    const v = mkVeh('goon', 0, 0, 0, { goon: true, keep: true, mission: true, driver: 'ai', hits: 0, cool: 0 });
    v.ai = { kind: 'goon', turnP: .55, cruise: 300 };
    v.ai.cruiseFn = (g) => { const pv = Wd.pos(), d = dist(g, pv), pmax = Wd.player.veh ? J.VEH[Wd.player.veh.type].maxV : 300; const base = Math.min(330, pmax * .82); return d > 750 ? base * .45 : d > 400 ? base * .8 : base; };
    v.ai.choose = (opts, cx, cy) => { const P = Wd.pos(); let best = opts[0], bd = -1; for (const o of opts) { const nx = (cx + DIRS[o][0] * 6 + .5) * T, ny = (cy + DIRS[o][1] * 6 + .5) * T, d = Math.hypot(nx - P.x, ny - P.y) + Math.random() * 120; if (d > bd) { bd = d; best = o; } } return best; };
    placeOnRoad(v, road.x, road.y);
    Wd.vehicles.push(v); return v;
  };
  Wd.spawnChasers = function (n) {
    const P = Wd.pos();
    for (let i = 0; i < n; i++) {
      const tile = M.randomTile([TL.ROAD], P.x, P.y, 500, 800) || M.nearestRoad(P.x + 500, P.y);
      const v = mkVeh('goon', (tile.x + .5) * T, (tile.y + .5) * T, 0, { chaser: true, keep: true, mission: true, driver: 'ai' });
      Wd.vehicles.push(v);
    }
  };
  Wd.clearMission = function () { Wd.vehicles = Wd.vehicles.filter(v => !(v.goon || v.chaser) || v === Wd.player.veh); };

  // ---------------- spawning ----------------
  function viewR() { return J.r3 && J.r3.mobile ? 850 : 1100; }
  function manage() {
    const P = Wd.pos(), vr = viewR();
    Wd.vehicles = Wd.vehicles.filter(v => v.parked || v.keep || v.driver === 'player' || v.police || dist(v, P) < vr + 1100);
    Wd.peds = Wd.peds.filter(p => dist(p, P) < vr + 700);
    Wd.cows = Wd.cows.filter(k => dist(k, P) < vr + 900);
    const traffic = Wd.vehicles.filter(v => v.ai && v.ai.kind === 'traffic').length;
    for (let i = traffic; i < 30; i++) {
      const t = M.randomTile([TL.ROAD], P.x, P.y, vr, vr + 700); if (!t) continue;
      const walled = M.zone[t.y * MW + t.x] === 1;
      const type = pick(walled ? ['scooty', 'scooty', 'scooty', 'bike', 'auto', 'auto', 'car', 'camelcart'] : ['scooty', 'scooty', 'bike', 'auto', 'auto', 'car', 'car', 'car', 'jeep', 'bus', 'camelcart']);
      const v = mkVeh(type, 0, 0, 0, { driver: 'ai' });
      v.ai = { kind: 'traffic', cruise: J.VEH[type].maxV * rnd(.42, .6) * (walled ? .8 : 1) };
      placeOnRoad(v, t.x, t.y); Wd.vehicles.push(v);
    }
    for (let i = Wd.peds.length; i < (J.r3 && J.r3.mobile ? 14 : 26); i++) { const t = M.randomTile([TL.SIDE, TL.PLAZA], P.x, P.y, vr - 40, vr + 400); if (t) Wd.peds.push(mkPed((t.x + .5) * T, (t.y + .5) * T)); }
    for (let i = Wd.cows.length; i < 9; i++) { const t = M.randomTile([TL.ROAD, TL.G, TL.SIDE], P.x, P.y, vr, vr + 600); if (t) Wd.cows.push({ x: (t.x + .5) * T, y: (t.y + .5) * T, a: Math.random() * 6.28, seed: Math.random() * 9, t: rnd(2, 8), walking: false, col: pick(['#EFE9DF', '#E8DCC8', '#F4F0E8']), patch: pick(['#8A5A3B', '#4A3A30', '#B9AE9C']), mala: Math.random() < .3 }); }
    // police
    const S = J.state, want = Math.min(4, S.stars);
    Wd.police = Wd.vehicles.filter(v => v.police);
    if (Wd.police.length < want) {
      const t = M.randomTile([TL.ROAD], P.x, P.y, vr, vr + 300);
      if (t) Wd.vehicles.push(mkVeh('police', (t.x + .5) * T, (t.y + .5) * T, 0, { police: true, driver: 'ai', rider: '#E8E3D6' }));
    }
    if (want === 0) Wd.vehicles = Wd.vehicles.filter(v => !v.police || dist(v, P) < vr);
  }

  // ---------------- update ----------------
  let manageT = 0;
  Wd.update = function (dt, inp) {
    Wd.time += dt;
    const P = Wd.player, S = J.state;
    manageT -= dt; if (manageT <= 0) { manageT = .5; manage(); }

    // player
    if (P.veh) {
      const v = P.veh; let ctl;
      if (inp.joy.active && inp.joy.mag > .15) {
        const ja = joyWorld(inp), diff = angDiff(ja, v.a), back = Math.abs(diff) > 2.3;
        ctl = { thr: inp.rev ? -1 : back && v.v < 30 ? -inp.joy.mag : inp.joy.mag, steer: clamp((back ? -diff : diff) * 2, -1, 1), brake: inp.brake };
      } else ctl = { thr: inp.rev ? -1 : (inp.up ? 1 : 0) - (inp.down ? 1 : 0), steer: (inp.right ? 1 : 0) - (inp.left ? 1 : 0), brake: inp.brake };
      drive(v, ctl, dt);
      P.x = v.x; P.y = v.y; P.moving = false;
    } else {
      let fwd = 0;
      if (inp.joy.active && inp.joy.mag > .15) { const ja = joyWorld(inp); P.a += angDiff(ja, P.a) * Math.min(1, dt * 12); fwd = inp.joy.mag; }
      else { P.a += ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * 3.2 * dt; fwd = (inp.up ? 1 : 0) - (inp.down ? .6 : 0); }
      P.moving = Math.abs(fwd) > .05;
      if (P.moving) {
        const sp = (inp.run || inp.brake ? 85 : 44) * fwd;
        const nx = P.x + Math.cos(P.a) * sp * dt, ny = P.y + Math.sin(P.a) * sp * dt;
        if (!M.solidAt(nx, P.y)) P.x = nx; if (!M.solidAt(P.x, ny)) P.y = ny;
        P.walk += dt * (inp.run || inp.brake ? 14 : 9) * Math.sign(fwd);
      }
    }

    // other vehicles
    const pv = P.veh;
    for (const v of Wd.vehicles) {
      if (v === pv) continue;
      if (v.police) { aiPursue(v, P.x, P.y, dt); continue; }
      if (v.chaser) { aiPursue(v, P.x, P.y, dt); continue; }
      if (v.ai && v.driver === 'ai') {
        if (v.goon && v.ai.stopped) { v.v *= .9; continue; }
        aiRoad(v, dt);
      } else if (v.v) { v.v *= .9; if (Math.abs(v.v) < 1) v.v = 0; v.vx *= .9; v.vy *= .9; move(v, dt); }
    }

    // collisions: player vehicle vs others
    if (pv) {
      const VP = J.VEH[pv.type], rp = (VP.l + VP.w) / 4;
      for (const o of Wd.vehicles) {
        if (o === pv) continue;
        const VO = J.VEH[o.type], ro = (VO.l + VO.w) / 4, d = dist(pv, o);
        if (d >= rp + ro || d < .01) continue;
        const nx = (o.x - pv.x) / d, ny = (o.y - pv.y) / d, ov = rp + ro - d;
        const heavy = o.type === 'bus' ? .3 : .7;
        if (!M.solidAt(o.x + nx * ov * heavy, o.y + ny * ov * heavy)) { o.x += nx * ov * heavy; o.y += ny * ov * heavy; }
        pv.x -= nx * ov * (1 - heavy); pv.y -= ny * ov * (1 - heavy);
        const sp = Math.abs(pv.v);
        if (o.goon && Wd.time - (o.cool || 0) > .6 && sp > 70) {
          o.cool = Wd.time; o.hits++; o.stunned = .8; J.audio.thud(); J.view.shake = 8;
          Wd.say(o, ['Arre! Gaadi mat thok!', 'Bunty bhaisaab maarenge!', 'Bas karo!'][Math.min(2, o.hits - 1)]);
        } else if (sp > 110 && Wd.time - (o.hitT || 0) > 1) {
          o.hitT = Wd.time; o.stunned = 1.2; J.audio.thud(); J.view.shake = 5; Wd.say(o, pick(J.SHOUTS));
          if (o.police) Wd.addStar(1, 'You hit Traffic Mamu!');
        }
        if (o.chaser && Wd.time - (o.hitT || 0) > 1) { o.hitT = Wd.time; Wd.say(o, pick(['Ruk ja!', 'Kachori humein de!', 'Bunty bhaisaab ka order hai!'])); pv.vx += nx * -120; pv.vy += ny * -120; J.view.shake = 6; }
        if (sp > 70) pv.v *= .55;
      }
    }

    // peds
    for (const p of Wd.peds) {
      if (p.down > 0) { p.down -= dt; p.spin += dt * (p.down > 1.4 ? 5 : 0); continue; }
      p.walk += dt * 10;
      const nx = p.x + Math.cos(p.a) * p.sp * dt, ny = p.y + Math.sin(p.a) * p.sp * dt, t = M.tileAt(nx, ny);
      if (t === TL.SIDE || t === TL.PLAZA || t === TL.PARK) { p.x = nx; p.y = ny; } else p.a = pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
      if (Math.random() < dt * .08) p.a = pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]);
      if (pv) {
        const d = dist(p, pv), r = J.VEH[pv.type].l * .5;
        if (d < r && Math.abs(pv.v) > 80) { p.down = 2.4; p.spin = Math.random() * 6; p.x += Math.cos(pv.a) * 14; p.y += Math.sin(pv.a) * 14; Wd.say(p, pick(['Aaaai!', 'Mummyyy!', 'Andha hai kya?!', 'Oye!']), 2); Wd.addStar(1, 'Pedestrian down! (they’ll be fine)'); J.audio.thud(); }
        else if (d < r + 16 && Math.abs(pv.v) > 20) { p.x -= Math.sin(pv.a) * 30 * dt; p.y += Math.cos(pv.a) * 30 * dt; }
      }
    }

    // cows
    for (const k of Wd.cows) {
      k.t -= dt;
      if (k.t <= 0) { k.walking = !k.walking && Math.random() < .6; k.t = rnd(2, 7); if (k.walking) k.a = Math.random() * 6.28; }
      if (k.walking) { const nx = k.x + Math.cos(k.a) * 10 * dt, ny = k.y + Math.sin(k.a) * 10 * dt; if (!M.solidAt(nx, ny)) { k.x = nx; k.y = ny; } else k.t = 0; }
      const o = pv || P, d = dist(k, o), r = pv ? J.VEH[pv.type].l * .45 + 11 : 12;
      if (d < r && d > .01) {
        const nx = (o.x - k.x) / d, ny = (o.y - k.y) / d;
        if (pv) { pv.x += nx * (r - d); pv.y += ny * (r - d); if (Math.abs(pv.v) > 100) { J.audio.moo(); Wd.say(k, 'MOOO.', 2); Wd.addStar(1, 'Gau Mata ko takkar?! Sharam karo.'); J.view.shake = 6; } pv.v *= .3; }
        else { P.x += nx * (r - d); P.y += ny * (r - d); if (Math.random() < .01) { J.audio.moo(); Wd.say(k, 'Moo.'); } }
      }
    }
    for (const m of Wd.monkeys) { m.t -= dt; if (m.t <= 0) { m.t = rnd(.5, 3); m.tx = m.ax + rnd(-50, 50); m.ty = m.ay + rnd(-30, 30); } if (m.tx !== undefined) { m.x += (m.tx - m.x) * dt * 2; m.y += (m.ty - m.y) * dt * 2; } if (dist(m, P) < 40 && Math.random() < dt * .5) Wd.say(m, pick(['Kii kii!', 'Kela?', '*steals your chips*'])); }

    // police: bust / evade
    const cops = Wd.vehicles.filter(v => v.police);
    let near = false;
    for (const c of cops) {
      const d = dist(c, P); if (d < 650) near = true;
      if (S.stars > 0 && d < 38 && (!pv || Math.abs(pv.v) < 55)) {
        S.bust = (S.bust || 0) + dt;
        if (S.bust > 1.1) {
          const fine = 250 * S.stars; S.money = Math.max(0, S.money - fine); S.stars = 0; S.bust = 0;
          J.ui.toast('Challan kat gaya! −₹' + fine, 'Traffic Mamu: “Helmet pehno, signal dekho, aur ghar jao.”');
          Wd.say(c, 'Licence dikhao!', 2.5); J.audio.fail();
          Wd.vehicles.forEach(v => { if (v.police) { v.police = false; v.ai = null; v.driver = null; v.parked = false; } });
        }
      }
    }
    if (!cops.some(c => dist(c, P) < 38)) S.bust = 0;
    J.audio.siren(near && S.stars > 0);
    if (S.stars > 0) { S.evade = near ? 0 : (S.evade || 0) + dt; if (S.evade > 11) { S.evade = 0; S.stars--; J.ui.toast(S.stars ? 'Challan level down' : 'You lost Traffic Mamu', S.stars ? '★'.repeat(S.stars) : 'Clean record. For now.'); } }

    for (const b of Wd.bubbles) b.t -= dt;
    Wd.bubbles = Wd.bubbles.filter(b => b.t > 0);
  };

  // ---------------- draw ----------------
  Wd.draw = function (c, x0, y0, x1, y1) {
    const t = Wd.time, inV = o => o.x > x0 - 60 && o.x < x1 + 60 && o.y > y0 - 60 && o.y < y1 + 60;
    for (const k of Wd.cows) if (inV(k)) J.draw.cow(c, k, t);
    for (const m of Wd.monkeys) if (inV(m)) J.draw.monkey(c, m, t);
    for (const p of Wd.peds) if (inV(p)) J.draw.person(c, p, t);
    for (const v of Wd.vehicles) if (v !== Wd.player.veh && inV(v)) J.draw.vehicle(c, v, t);
    Wd.drawPlayer(c, 1);
  };
  Wd.drawPlayer = function (c, alpha) {
    const P = Wd.player; c.save(); c.globalAlpha = alpha;
    if (P.veh) J.draw.vehicle(c, P.veh, Wd.time); else J.draw.person(c, P, Wd.time);
    c.restore();
  };
  Wd.drawBubbles = function (c) {
    c.font = '700 12px Mukta, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (const b of Wd.bubbles) {
      const x = b.o.x, y = b.o.y - 26, w = c.measureText(b.text).width + 16;
      c.globalAlpha = Math.min(1, b.t * 3);
      c.fillStyle = 'rgba(43,27,23,.25)'; J.draw.rr(c, x - w / 2 + 2, y - 10 + 3, w, 20, 10); c.fill();
      c.fillStyle = '#FFF6EC'; J.draw.rr(c, x - w / 2, y - 10, w, 20, 10); c.fill();
      c.beginPath(); c.moveTo(x - 4, y + 9); c.lineTo(x, y + 15); c.lineTo(x + 4, y + 9); c.fill();
      c.fillStyle = '#2B1B17'; c.fillText(b.text, x, y + 1);
    }
    c.globalAlpha = 1;
  };
})(window.J);
