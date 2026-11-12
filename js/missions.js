/* Mission engine: runs J.STORY step by step, objectives, timers, diary stamps. */
(function (J) {
  const Ms = J.missions = {};
  let obj = null, tourT = 0, tourI = 0, stampT = 0, pendingRun = null;
  const S = () => J.state;
  const chapter = () => J.STORY[S().ch];

  Ms.start = function () {
    obj = null;
    const ch = chapter();
    if (ch) ch.steps.slice(0, S().step).forEach(st => { if (st.t === 'spawn') J.world.spawnParkedAt(st.vehicle, J.PLACE[st.place]); });
    schedule(600);
  };
  function schedule(ms) { clearTimeout(pendingRun); pendingRun = setTimeout(runStep, ms); }
  function next() { S().step++; J.save(); runStep(); }

  function runStep() {
    obj = null;
    if (J.modal) return schedule(700);
    const st0 = S(), ch = chapter();
    if (!ch) return;
    if (st0.step === 0 && st0.introCh !== st0.ch) {
      st0.introCh = st0.ch; J.ui.banner(ch.title, `Chapter ${st0.ch + 1} of ${J.STORY.length}`); J.audio.chime();
      return schedule(2300);
    }
    const st = ch.steps[st0.step];
    if (!st) return complete();
    switch (st.t) {
      case 'dialog': J.ui.dialog(st.lines).then(next); break;
      case 'scene': J.scenes.open(st.scene, st).then(r => {
        if (st.scene === 'garage' && r) { const P = J.world.player, g = J.PLACE.garage; if (P.veh) J.world.exit(); J.world.giveVehicle(r, g.dx, g.dy - 40, 0); J.state.lastVeh = r; }
        next();
      }); break;
      case 'goto':
        obj = { type: 'goto', st, p: J.PLACE[st.place], timer: st.timer || null };
        if (st.goons) J.world.spawnChasers(st.goons);
        if (st.tour) { tourT = 6; tourI = 0; }
        break;
      case 'collect': obj = { type: 'collect', st, left: st.places.slice(), total: st.places.length }; break;
      case 'chase':
        obj = { type: 'chase', st, g: J.world.spawnGoon(J.PLACE.rajapark), lost: 0 };
        J.ui.toast('That’s them!', 'Black SUV with gold trim. Ram it three times!');
        break;
      case 'spawn': J.world.spawnParkedAt(st.vehicle, J.PLACE[st.place]); next(); break;
      case 'time': S().time = st.hour; next(); break;
    }
  }

  function complete() {
    const ch = chapter(), st = S();
    obj = null; st.money += ch.reward; J.world.clearMission();
    J.ui.banner('MISSION PASSED', `${ch.title} · +₹${ch.reward}`); J.audio.pass();
    st.ch++; st.step = 0; J.save();
    if (chapter()) schedule(6000);
    else setTimeout(() => J.ui.toast('Free roam unlocked', 'Fill your Jaipur Diary. Eat at every legend. Press J.'), 3000);
  }
  function done() {
    if (obj && obj.st && obj.st.goons) J.world.clearMission();
    obj = null; J.audio.chime(); next();
  }
  function fail(msg) {
    obj = null; J.world.clearMission();
    J.ui.banner('MISSION FAILED', msg, true); J.audio.fail();
    schedule(3200);
  }

  Ms.stamp = function (id) {
    const st = S(), p = J.PLACE[id]; if (!p || st.diary[id]) return;
    st.diary[id] = true; J.save();
    const list = J.PLACES.filter(q => q.kind !== 'home' && q.kind !== 'garage');
    if (p.kind !== 'home' && p.kind !== 'garage') J.ui.toast(`Jaipur Diary · ${p.name}`, `${p.fact} (${list.filter(q => st.diary[q.id]).length}/${list.length})`);
  };

  const near = (p, r) => { const P = J.world.pos(); return Math.hypot(P.x - p.dx, P.y - p.dy) < r; };
  const needVeh = st => st.vehicle && (!J.world.player.veh || J.world.player.veh.type !== st.vehicle);

  Ms.update = function (dt) {
    const st = S();
    // proximity diary stamps for landmarks
    stampT -= dt;
    if (stampT <= 0) {
      stampT = .5;
      for (const p of J.PLACES) {
        if (st.diary[p.id] || p.kind === 'food' || p.kind === 'cafe' || p.kind === 'home' || p.kind === 'garage') continue;
        if (near(p, p.kind === 'spot' ? p.r * J.T : 110)) Ms.stamp(p.id);
      }
    }
    if (!obj) return;
    if (obj.timer != null) { obj.timer -= dt; if (obj.timer <= 0) return fail('Too slow! Jaipur waits for no one.'); }
    if (obj.type === 'goto') {
      const s = obj.st;
      if (s.tour && J.world.player.veh && J.world.player.veh.type === 'auto') {
        tourT -= dt;
        if (tourT <= 0) { tourT = 11; const [w, l] = J.TOUR_LINES[tourI++ % J.TOUR_LINES.length]; J.ui.toast(w === 'you' ? st.name : J.CAST[w].name, l); }
      }
      if (!s.interact && !needVeh(s) && near(obj.p, 64)) done();
    } else if (obj.type === 'chase') {
      const g = obj.g, P = J.world.pos(), d = Math.hypot(g.x - P.x, g.y - P.y);
      if (g.hits >= 3) {
        g.ai.stopped = true; J.world.say(g, 'Bas! Bas! Diary le lo!', 3);
        obj = null; J.audio.chime(); setTimeout(() => { J.world.clearMission(); next(); }, 1300); return;
      }
      obj.lost = d > 1250 ? obj.lost + dt : 0;
      if (obj.lost > 9) fail('They got away with the diary!');
    }
  };

  Ms.prompt = function () {
    if (!obj) return null;
    if (obj.type === 'goto' && near(obj.p, 64)) {
      if (needVeh(obj.st)) return null;
      if (obj.st.interact) return obj.st.prompt;
    }
    if (obj.type === 'collect') { const id = obj.left.find(i => near(J.PLACE[i], 64)); if (id) return `${obj.st.prompt} · ${J.PLACE[id].name}`; }
    return null;
  };
  Ms.needText = function () { return obj && obj.type === 'goto' && near(obj.p, 64) && needVeh(obj.st) ? `You need ${obj.st.vehicle === 'auto' ? 'an auto' : 'a ' + obj.st.vehicle} for this` : null; };
  Ms.tryInteract = function () {
    if (!obj) return false;
    if (obj.type === 'goto' && obj.st.interact && near(obj.p, 64) && !needVeh(obj.st)) { done(); return true; }
    if (obj.type === 'collect') {
      const id = obj.left.find(i => near(J.PLACE[i], 64)); if (!id) return false;
      obj.left = obj.left.filter(i => i !== id); const p = J.PLACE[id];
      if (p.pigment) { J.state.pigments = Array.from(new Set([...(J.state.pigments || []), p.pigment])); J.ui.toast(`Got ${p.pigment[0].toUpperCase() + p.pigment.slice(1)} pigment`, `${obj.total - obj.left.length}/${obj.total} colours`); }
      else J.ui.toast(`${p.name} is in!`, ['“Fest? Hum toh aayenge hi.”', '“Dadi ke liye kuch bhi.”', '“Lassi ka stall lagega, pakka.”'][obj.total - obj.left.length - 1] || '');
      Ms.stamp(id); J.audio.chime();
      if (!obj.left.length) done();
      return true;
    }
    return false;
  };

  Ms.targets = function () {
    if (!obj) return [];
    if (obj.type === 'goto') return [{ x: obj.p.dx, y: obj.p.dy }];
    if (obj.type === 'collect') return obj.left.map(i => ({ x: J.PLACE[i].dx, y: J.PLACE[i].dy }));
    if (obj.type === 'chase') return [{ x: obj.g.x, y: obj.g.y, moving: true }];
    return [];
  };

  Ms.hud = function () {
    const st = S(), ch = chapter();
    if (!ch) {
      const list = J.PLACES.filter(q => q.kind !== 'home' && q.kind !== 'garage');
      return { ch: 'Free roam', title: 'Jaipur Diary', obj: `${list.filter(q => st.diary[q.id]).length}/${list.length} stamps. Eat everywhere. Press J.`, timer: null };
    }
    const head = `Chapter ${st.ch + 1} · ${ch.title}`;
    if (!obj) return st.step === 0 && st.introCh !== st.ch ? { ch: 'Up next', title: ch.title, obj: 'Your phone is about to ring...', timer: null } : null;
    let text = U(obj.st.text);
    if (obj.type === 'collect') text += ` (${obj.total - obj.left.length}/${obj.total})`;
    if (obj.type === 'chase') text += ` (${obj.g.hits}/3)`;
    if (obj.type === 'goto' && needVeh(obj.st) && J.world.player.veh) text += ' · get in an auto!';
    return { ch: head, title: obj.type === 'goto' ? obj.p.name : ch.title, obj: text, timer: obj.timer };
  };
  const U = s => J.ui.sub(s);
})(window.J);
