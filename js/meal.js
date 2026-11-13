/* Sitting down to eat, in 3D: the plate arrives, you bite (crunch) or sip (slurp, aah) while a friend chats across the table. */
(function (J) {
  const Ml = J.meal = {}, K = J.K, S = 1 / 8;
  const $ = id => document.getElementById(id);
  const CHAT = {
    kachori: [['c', 'Pehle imli chutney mein dubo, phir khao. Rule hai.'], ['y', 'Bahar se crisp, andar se masaledar. Perfect.'], ['c', 'Jaipur mein breakfast ka matlab yahi hai.'], ['y', 'Bangalore mein aisi kachori kahin nahi milti.'], ['c', 'Ek aur? Garam aa rahi hai.']],
    chai: [['c', 'Chai pe charcha? Bol, kya chal raha hai life mein?'], ['y', 'Bas... Jaipur ki chai ki yaad aati thi.'], ['c', 'Bun maska chai mein dubo ke kha.'], ['y', 'Aahh. Yahi toh chahiye tha.'], ['c', 'Ek aur cutting? Mera treat.'], ['y', 'Done. Phir se Gulab Ji kab?']],
    lassi: [['c', 'Malai ki moonchh! Haha, ponch le.'], ['y', 'Itni thick lassi, chammach chahiye.'], ['c', '1944 se yahi taste hai, bhai.'], ['y', 'Kulhad bhi rakh lu kya? Souvenir.']],
    ghewar: [['c', 'Ghewar bina rabdi ke adhoora hai.'], ['y', 'Honeycomb jaisa crisp... aur meetha.'], ['c', 'Teej aate hi poora Jaipur ghewar khata hai.']],
    kulfi: [['c', 'Jaldi kha, garmi mein pighal jayegi!'], ['y', 'Kesar aur pista... ekdum shahi.'], ['c', 'Hawa Mahal ke saamne kulfi. Isse better kya?']],
    coffee: [['c', 'Smell it first. Then sip.'], ['y', 'Fruity... and a little chocolate at the end?'], ['c', 'See? You have a palate now.'], ['y', 'Jaipur has a real coffee scene. Who knew.']],
    iced: [['c', 'Cold coffee in Jaipur heat is self-care.'], ['y', 'Brain freeze. Worth it.'], ['c', 'Shake the ice, it tastes better.'], ['y', 'Okay, one more of these and I’m moving back.']],
  };
  let st = null;

  Ml.start = function (opts) {
    return new Promise(res => {
      const p = J.PLACE[opts.place], food = opts.food || p.food, W = J.world;
      const face = p.face || 's', out = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[face];
      const cx = p.dx + out[0] * 22, cy = p.dy + out[1] * 22;
      const g = new THREE.Group(); g.position.set(cx * S, 0, cy * S); g.rotation.y = -Math.atan2(out[1], out[0]);
      // local frame: +x points away from the shop (player side), -x toward the shop (friend side)
      const street = food.serve !== 'ceramic';
      if (street) { K.box(g, .7, .04, 1.0, K.phong('#C9CED6', 120), 0, .74, 0); K.box(g, .66, .72, .96, '#5A3A2A', 0, 0, 0); }
      else { K.cyl(g, .45, .45, .04, K.phong('#F6F1E7', 40), 0, .74, 0, 20); K.cyl(g, .05, .07, .74, '#2B2B2B', 0, 0, 0, 8); }
      [-1, 1].forEach(s2 => { K.box(g, .42, .45, .42, street ? '#C98A3A' : '#5A3A2A', s2 * .62, 0, 0); if (!street) K.box(g, .06, .5, .42, '#5A3A2A', s2 * .84, .45, 0); });
      const me = K.person(J.r3.playerLook()); K.seat(me, 'table'); me.position.set(.62, -.47, 0); me.rotation.y = Math.PI; g.add(me); me.visible = false; // first person: you see your plate, not your own back
      const npc = J.r3.npcs.find(n => n.id === opts.companion);
      const friendLook = npc ? npc.look : K.randomPerson((p.x * 31 + p.y * 7) | 0);
      const fr = K.person(friendLook); K.seat(fr, 'table'); fr.position.set(-.62, -.47, 0); g.add(fr);
      const F = K.food(food.dish, food.serve); F.g.position.set(.2, .76, 0); g.add(F.g);
      if (opts.food2) { const F2 = K.food(opts.food2, food.serve); F2.g.position.set(-.22, .76, .05); g.add(F2.g); }
      J.r3.add(g);
      const wp = (lx, ly, lz) => new THREE.Vector3(lx, ly, lz).applyMatrix4(g.updateMatrixWorld() || g.matrixWorld);
      const cam = { pos: wp(.82, 1.3, .02), look: wp(-.05, .86, 0) }; // first person: your own plate, your friend across the table
      const meObj = { x: cx + out[0] * 5, y: cy + out[1] * 5, bh: 1.55 }, frObj = { x: cx - out[0] * 5, y: cy - out[1] * 5, bh: 1.75 };
      W.player.x = cx + out[0] * 5; W.player.y = cy + out[1] * 5;
      st = { p, food, F, g, cam, base: cam.pos.clone(), dip: 0, chat: CHAT[food.dish] || CHAT.chai, ci: 0, res, meObj, frObj, opts, t: 0 };
      J.r3.meal = { cam, hide: npc && npc.id, update: tick, snap: true };
      J.modal = 'meal';
      if (!opts.paid) { if (J.state.money >= food.price) { J.state.money -= food.price; J.ui.toast(`₹${food.price} paid`, `${food.item} at ${p.name}`); } else J.ui.toast('On the house', '“Paise baad mein de dena, beta.”'); }
      J.audio.clink();
      showBar();
      setTimeout(() => say(), 900);
    });
  };
  function say() {
    if (!st || st.ci >= st.chat.length) return;
    const [who, text] = st.chat[st.ci++];
    J.world.say(who === 'c' ? st.frObj : st.meObj, J.ui.sub(text), 3.2);
  }
  function tick(dt) {
    if (!st) return;
    st.t += dt; st.F.update(dt, st.t);
    st.dip = Math.max(0, st.dip - dt * 2.2);
    const k = Math.sin(st.dip * Math.PI) * .18;
    st.cam.pos.copy(st.base).lerp(st.cam.look, k);
  }
  function showBar() {
    const a = st.F.actions, f = st.food;
    const label = { bite: f.dish === 'chai' ? 'Bite the bun maska' : f.dish === 'kulfi' ? 'Take a slice' : 'Take a bite', sip: f.dish === 'chai' ? 'Sip the chai' : 'Take a sip' };
    $('mealbar').hidden = false;
    $('mealbar').innerHTML = `<div><div class="eyebrow">${J.ui.esc(st.p.name)}</div><b>${J.ui.esc(f.item)}</b></div>
      <div class="row">${a.map((x, i) => `<button class="btn ${i ? 'btn-ghost' : 'btn-primary'}" data-a="${x}">${label[x]} <span class="key">${i ? 'B' : 'Space'}</span></button>`).join('')}
      <button class="btn btn-ghost" id="m-done" ${st.F.done() ? '' : 'hidden'}>Get up</button></div>`;
    $('mealbar').querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(b.dataset.a));
    $('m-done').onclick = finish;
  }
  function act(a) {
    if (!st) return; const F = st.F;
    if (a === 'bite' && F.bite && F.bites < F.maxBites) { F.bite(); J.audio.crunch(); st.dip = 1; if (F.bites % 2 || F.maxBites < 4) say(); }
    else if (a === 'sip' && F.sip && F.sips < F.maxSips) { F.sip(); J.audio.sip(); st.dip = 1; setTimeout(() => st && J.world.say(st.meObj, ['Aahh...', 'Mmm.', 'Wah.', 'Bliss.'][F.sips % 4], 1.6), 700); if (F.sips % 2 === 0) setTimeout(say, 1500); }
    if (F.done()) { $('m-done').hidden = false; $('mealbar').querySelectorAll('[data-a]').forEach(b => b.disabled = true); setTimeout(() => st && say(), 600); }
  }
  function finish() {
    if (!st) return;
    const { p, food, g, res, opts } = st, out = { s: [0, 1], n: [0, -1], e: [1, 0], w: [-1, 0] }[p.face || 's'];
    J.state.josh = Math.min(100, J.state.josh + food.josh);
    J.missions.stamp(p.id);
    J.ui.toast(`+${food.josh} Josh`, opts.paid ? 'Caffeinated in the Pink City' : p.fact);
    J.r3.remove(g); J.r3.meal = null; $('mealbar').hidden = true;
    const P = J.world.player; P.x = p.dx + out[0] * 12; P.y = p.dy + out[1] * 12; P.a = Math.atan2(out[1], out[0]);
    J.modal = null; st = null; J.r3.snapCam(); res(true);
  }
  Ml.key = function (e, down) {
    if (!down || !st || e.repeat) return;
    const a = st.F.actions;
    if (e.code === 'Space') { e.preventDefault(); if (st.F.done()) finish(); else act(a[0]); }
    else if (e.code === 'KeyB' && a[1]) act(a[1]);
    else if ((e.code === 'Enter' || e.code === 'Escape') && st.F.done()) finish();
  };
  Ml.active = () => !!st;
})(window.J);
