/* HUD, dialog, toasts, banners, minimap, map, diary, pause. */
(function (J) {
  const U = J.ui = {};
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  U.esc = esc;
  U.fmtTime = h => { const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60); return ((hh + 11) % 12 + 1) + ':' + String(mm).padStart(2, '0') + (hh < 12 ? ' AM' : ' PM'); };
  U.sub = s => s.replace(/\{name\}/g, J.state.name);

  // ---------- toasts & banners ----------
  U.toast = function (title, sub) {
    const el = document.createElement('div'); el.className = 'toast card';
    el.innerHTML = `<b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}`;
    $('toasts').appendChild(el);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 3600);
  };
  U.banner = function (big, small, fail) {
    const b = $('banner'); b.className = fail ? 'fail' : '';
    b.querySelector('.big').textContent = big; b.querySelector('.small').textContent = small || '';
    void b.offsetWidth; b.classList.add('show');
  };

  // ---------- dialog ----------
  let dlg = null;
  U.dialog = function (lines) {
    return new Promise(res => {
      dlg = { lines, i: 0, res, typed: 0, full: '' };
      J.modal = 'dialog'; $('dialog').hidden = false; showLine();
    });
  };
  function showLine() {
    let [who, text] = dlg.lines[dlg.i];
    const call = who.endsWith('@'); who = who.replace('@', '');
    const c = J.CAST[who] || J.CAST.narrator, name = who === 'you' ? J.state.name : c.name;
    if (call && dlg.i === 0 || call && dlg.lines[dlg.i - 1] && !dlg.lines[dlg.i - 1][0].endsWith('@')) J.audio.ring();
    $('d-portrait').style.background = c.col; $('d-portrait').textContent = who === 'narrator' ? '·' : (name || '?')[0];
    $('d-who').textContent = name || 'Jaipur'; $('d-call').hidden = !call;
    dlg.full = U.sub(text); dlg.typed = 0;
    $('d-line').className = 'line' + (who === 'narrator' ? ' narr' : '');
    $('d-line').textContent = '';
  }
  U.dialogTick = function (dt) {
    if (!dlg) return;
    if (dlg.typed < dlg.full.length) { dlg.typed = Math.min(dlg.full.length, dlg.typed + dt * 70); $('d-line').textContent = dlg.full.slice(0, Math.floor(dlg.typed)); }
  };
  U.dialogNext = function () {
    if (!dlg) return;
    if (dlg.typed < dlg.full.length) { dlg.typed = dlg.full.length; $('d-line').textContent = dlg.full; return; }
    dlg.i++;
    if (dlg.i >= dlg.lines.length) { const r = dlg.res; dlg = null; $('dialog').hidden = true; J.modal = null; r(); }
    else showLine();
  };
  $('dialog').addEventListener('pointerdown', e => { e.preventDefault(); U.dialogNext(); });

  // ---------- overlay sheet ----------
  U.openSheet = function (html, kind) {
    J.modal = kind || 'sheet'; $('overlay').hidden = false; $('sheet').innerHTML = html; return $('sheet');
  };
  U.closeSheet = function () { $('overlay').hidden = true; $('sheet').innerHTML = ''; J.modal = null; };

  // ---------- HUD ----------
  let hudT = 0;
  U.update = function (dt) {
    U.dialogTick(dt);
    hudT -= dt; if (hudT > 0) return; hudT = .1;
    const S = J.state;
    $('money').textContent = '₹' + Math.round(S.money).toLocaleString('en-IN');
    $('clock').textContent = U.fmtTime(S.time);
    $('josh').style.width = Math.max(0, S.josh) + '%';
    $('stars').innerHTML = [1, 2, 3, 4, 5].map(i => `<span class="${i <= S.stars ? 'on' : ''}">★</span>`).join('');
    const v = J.world.player.veh;
    $('vehname').hidden = !v; if (v) $('vehname').textContent = J.VEH[v.type].name;
    const o = J.missions.hud();
    $('mission').hidden = !o;
    if (o) {
      $('m-ch').textContent = o.ch; $('m-title').textContent = o.title; $('m-obj').textContent = o.obj;
      $('m-timer').hidden = o.timer == null;
      if (o.timer != null) $('m-timer').textContent = Math.floor(o.timer / 60) + ':' + String(Math.max(0, Math.floor(o.timer % 60))).padStart(2, '0');
    }
  };
  U.prompt = function (text) {
    const p = $('prompt');
    if (!text) { p.hidden = true; return; }
    p.hidden = false; const html = `<span class="key">E</span> ${esc(text)}`; if (p.innerHTML !== html) p.innerHTML = html;
  };

  // ---------- minimap ----------
  const mm = $('minimap'), mc = mm.getContext('2d');
  U.minimap = function () {
    const P = J.world.pos(), S = mm.width, scale = 3.2, T = J.T;
    const tx = P.x / T, ty = P.y / T;
    mc.save(); mc.clearRect(0, 0, S, S);
    mc.beginPath(); mc.arc(S / 2, S / 2, S / 2, 0, 7); mc.clip();
    mc.fillStyle = '#B39465'; mc.fillRect(0, 0, S, S);
    mc.imageSmoothingEnabled = false;
    mc.drawImage(J.map.mini, S / 2 - tx * scale, S / 2 - ty * scale, J.map.W * scale, J.map.H * scale);
    const toMini = (x, y) => [S / 2 + (x / T - tx) * scale, S / 2 + (y / T - ty) * scale];
    // food dots
    for (const p of J.PLACES) {
      if (p.kind !== 'food' && p.kind !== 'cafe') continue;
      const [x, y] = toMini(p.dx, p.dy); if (x < 0 || y < 0 || x > S || y > S) continue;
      mc.fillStyle = '#FFF6EC'; mc.beginPath(); mc.arc(x, y, 6, 0, 7); mc.fill(); mc.fillStyle = '#C2413B'; mc.beginPath(); mc.arc(x, y, 3.5, 0, 7); mc.fill();
    }
    for (const v of J.world.vehicles) if (v.police || v.goon || v.chaser) { const [x, y] = toMini(v.x, v.y); mc.fillStyle = v.police ? ((J.world.time * 4 | 0) % 2 ? '#E23B3B' : '#3B6BE2') : '#1E1E22'; mc.beginPath(); mc.arc(x, y, 6, 0, 7); mc.fill(); }
    // objectives
    for (const o of J.missions.targets()) {
      let [x, y] = toMini(o.x, o.y);
      const dx = x - S / 2, dy = y - S / 2, d = Math.hypot(dx, dy), max = S / 2 - 14;
      if (d > max) { x = S / 2 + dx / d * max; y = S / 2 + dy / d * max; }
      mc.fillStyle = '#2B1B17'; mc.beginPath(); mc.arc(x, y, 11, 0, 7); mc.fill();
      mc.fillStyle = '#F2A41C'; mc.beginPath(); mc.arc(x, y, 8, 0, 7); mc.fill();
    }
    // player arrow
    mc.translate(S / 2, S / 2); mc.rotate((P.a || 0) + Math.PI / 2);
    mc.fillStyle = '#FFF6EC'; mc.strokeStyle = '#2B1B17'; mc.lineWidth = 3;
    mc.beginPath(); mc.moveTo(0, -12); mc.lineTo(9, 10); mc.lineTo(0, 5); mc.lineTo(-9, 10); mc.closePath(); mc.stroke(); mc.fill();
    mc.restore();
  };

  // ---------- full map ----------
  U.openMap = function () {
    const sh = U.openSheet(`<div class="eyebrow">Jaipur</div><h2>Map of the Pink City</h2><div id="bigmap"><canvas width="900" height="900"></canvas></div><div class="row end"><button class="btn btn-primary" id="x">Back to the streets</button></div>`, 'map');
    const cv = sh.querySelector('canvas'), c = cv.getContext('2d'), s = 900 / 180;
    c.imageSmoothingEnabled = false; c.drawImage(J.map.mini, 0, 0, 900, 900);
    c.font = '700 13px Mukta, sans-serif'; c.textAlign = 'center';
    for (const p of J.PLACES) {
      const x = p.dx / J.T * s, y = p.dy / J.T * s, got = J.state.diary[p.id];
      c.fillStyle = got ? '#3F8F5A' : (p.kind === 'food' || p.kind === 'cafe') ? '#C2413B' : '#263170';
      c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.strokeStyle = '#FFF6EC'; c.lineWidth = 2; c.stroke();
      const w = c.measureText(p.name).width + 10; c.fillStyle = 'rgba(255,246,236,.92)'; J.draw.rr(c, x - w / 2, y - 26, w, 17, 8); c.fill();
      c.fillStyle = '#2B1B17'; c.fillText(p.name, x, y - 13);
    }
    for (const o of J.missions.targets()) { const x = o.x / J.T * s, y = o.y / J.T * s; c.fillStyle = '#F2A41C'; c.strokeStyle = '#2B1B17'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 11, 0, 7); c.fill(); c.stroke(); }
    const P = J.world.pos(); c.fillStyle = '#FFF6EC'; c.strokeStyle = '#2B1B17'; c.lineWidth = 3; c.beginPath(); c.arc(P.x / J.T * s, P.y / J.T * s, 8, 0, 7); c.fill(); c.stroke();
    sh.querySelector('#x').onclick = U.closeSheet;
  };

  // ---------- diary ----------
  U.openDiary = function () {
    const S = J.state, list = J.PLACES.filter(p => p.kind !== 'home' && p.kind !== 'garage');
    const got = list.filter(p => S.diary[p.id]).length;
    const keeps = [S.photo ? `<div class="polaroid"><img src="${S.photo}" alt="Your photo of Hawa Mahal"><span>Hawa Mahal, ${esc(S.name)}</span></div>` : '', S.art ? `<div class="polaroid" style="transform:rotate(2deg)"><img src="${S.art}" alt="Your block-print mural at JKK"><span>My mural · JKK</span></div>` : ''].join('');
    const sh = U.openSheet(`<div class="eyebrow">Jaipur Diary · ${got}/${list.length} stamps</div><h2>Places I’ve been</h2>
      <p>Drive close to a spot to stamp it. Eat at every food stop, and every fact gets saved here.</p>
      ${keeps ? `<div class="keepsakes">${keeps}</div>` : ''}
      <div class="diary-grid">${list.map(p => `<div class="stamp ${S.diary[p.id] ? 'got' : ''}"><b>${esc(p.name)}</b>${S.diary[p.id] ? esc(p.fact || '') : (p.kind === 'food' || p.kind === 'cafe' ? 'Food stop, not visited yet' : 'Not visited yet')}</div>`).join('')}</div>
      <div class="row end"><button class="btn btn-primary" id="x">Close diary</button></div>`, 'diary');
    sh.querySelector('#x').onclick = U.closeSheet;
  };

  U.openPause = function () {
    const sh = U.openSheet(`<div class="eyebrow">Paused</div><h2>Chai break</h2>
      <p><span class="key">WASD</span> drive · <span class="key">Space</span> handbrake · <span class="key">E</span> enter, exit, interact · <span class="key">H</span> horn · <span class="key">M</span> map · <span class="key">J</span> diary · <span class="key">Shift</span> run</p>
      <div class="row end"><button class="btn btn-ghost" id="snd">${J.audio.on ? 'Sound: on' : 'Sound: off'}</button><button class="btn btn-ghost" id="mus">${J.audio.music ? 'Music: on' : 'Music: off'}</button><button class="btn btn-ghost" id="restart">New game</button><button class="btn btn-primary" id="x">Resume</button></div>`, 'pause');
    sh.querySelector('#x').onclick = U.closeSheet;
    sh.querySelector('#snd').onclick = e => { J.audio.on = !J.audio.on; e.target.textContent = J.audio.on ? 'Sound: on' : 'Sound: off'; };
    sh.querySelector('#mus').onclick = e => { J.audio.setMusic(!J.audio.music); e.target.textContent = J.audio.music ? 'Music: on' : 'Music: off'; };
    sh.querySelector('#restart').onclick = e => { if (e.target.dataset.sure) { U.closeSheet(); J.newGame(J.state.name); } else { e.target.dataset.sure = 1; e.target.textContent = 'Tap again to reset progress'; } };
  };
})(window.J);
