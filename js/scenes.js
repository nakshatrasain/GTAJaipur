/* Story scenes: garage, photo, coffee at Curious Life, eating, block-print mural, finale. */
(function (J) {
  const S = J.scenes = {}, U = J.ui, D = J.draw;
  const esc = s => U.esc(s);
  let rafId = 0;
  function loop(fn) { cancelAnimationFrame(rafId); let t0 = performance.now(); const f = (now) => { if (J.modal !== 'scene') return; fn((now - t0) / 1000); rafId = requestAnimationFrame(f); }; rafId = requestAnimationFrame(f); }
  function stop() { cancelAnimationFrame(rafId); J.sceneKey = null; }
  function close(res, v) { stop(); U.closeSheet(); res(v); }
  function sheet(html) { stop(); return U.openSheet(html, 'scene'); }
  const pay = (amt) => { if (J.state.money >= amt) { J.state.money -= amt; return true; } return false; };
  const stamp = (id) => J.missions.stamp(id);

  // ---------- generic hold-to-fill meter ----------
  function holdMeter(host, opts) {
    return new Promise(done => {
      host.innerHTML = `<div class="meter-wrap"><div class="meter" style="height:180px"><div class="band" style="bottom:${opts.band[0]}%;height:${opts.band[1] - opts.band[0]}%"></div><div class="fill" style="height:${opts.start || 0}%;background:${opts.color || '#6B3E26'}"></div></div>
        <div><p><b>${esc(opts.title)}</b><br>${esc(opts.hint)}</p><div class="feedback" id="fb"></div><div class="row" style="margin-top:12px"><button class="btn btn-primary" id="hold">Hold to ${esc(opts.verb)}</button></div><p style="font-size:13px;margin-top:8px">Or hold <span class="key">Space</span>. Let go inside the green band.</p></div></div>`;
      const fill = host.querySelector('.fill'), btn = host.querySelector('#hold'), fb = host.querySelector('#fb');
      let lvl = opts.start || 0, holding = false, finished = false, last = performance.now(), sfx = 0;
      const tick = (now) => {
        if (finished) return; const dt = (now - last) / 1000; last = now;
        if (holding) { lvl = Math.min(100, lvl + opts.rate * dt); sfx -= dt; if (sfx <= 0 && opts.sound) { opts.sound(); sfx = .5; } }
        fill.style.height = lvl + '%'; if (opts.onLevel) opts.onLevel(lvl);
        if (lvl >= 100) release();
        requestAnimationFrame(tick);
      };
      const press = () => { if (!finished) holding = true; };
      const release = () => {
        if (!holding || finished) return; holding = false; finished = true;
        const ok = lvl >= opts.band[0] && lvl <= opts.band[1];
        fb.className = 'feedback' + (ok ? '' : ' bad'); fb.textContent = ok ? opts.good : (lvl > opts.band[1] ? opts.over : opts.under);
        J.audio[ok ? 'chime' : 'click']();
        setTimeout(() => done({ ok, lvl }), 900);
      };
      btn.addEventListener('pointerdown', e => { e.preventDefault(); press(); });
      btn.addEventListener('pointerup', release); btn.addEventListener('pointerleave', release);
      J.sceneKey = (e, down) => { if (e.code === 'Space') { e.preventDefault(); down ? press() : release(); } };
      requestAnimationFrame(tick);
    });
  }

  // ---------- garage ----------
  S.garage = () => new Promise(res => {
    const bars = st => ['Speed', 'Handling', 'Vibe'].map((l, i) => `<small>${l}</small><div class="bar"><i style="width:${st[i] * 20}%"></i></div>`).join('');
    const sh = sheet(`<div class="eyebrow">Chintu’s Garage · MI Road</div><h2>Pick your ride</h2><p>You can come back and swap anytime. Chintu’s motto: “Jo chale, woh chalao.”</p>
      <div class="choices">${J.PLAYABLE.map(t => `<button class="choice" data-t="${t}"><canvas width="240" height="96"></canvas><b>${esc(J.VEH[t].name)}</b><small>${esc(J.VEH[t].blurb)}</small>${bars(J.VEH[t].stats)}</button>`).join('')}</div>`);
    sh.querySelectorAll('.choice').forEach(b => {
      const c = b.querySelector('canvas').getContext('2d'), t = b.dataset.t;
      c.translate(120, 48); const sc = J.VEH[t].two ? 4 : 2.6; c.scale(sc, sc); D.vehicle(c, { type: t, x: 0, y: 0, a: 0, col: t === 'scooty' ? '#E85D75' : J.VEH[t].cols[0], driver: 'player' }, 0);
      b.onclick = () => { J.audio.chime(); close(res, t); };
    });
  });

  // ---------- photo at Hawa Mahal ----------
  S.photo = () => new Promise(res => {
    const sh = sheet(`<div class="eyebrow">Hawa Mahal · Badi Chaupar</div><h2>Frame the shot</h2><p>The street won’t stop moving. Snap when the viewfinder is level.</p><canvas class="art" width="800" height="500"></canvas><div class="feedback" id="fb"></div><div class="row end"><button class="btn btn-primary" id="snap">Click! (Space)</button></div>`);
    const cv = sh.querySelector('canvas'), c = cv.getContext('2d');
    let tilt = 0, snapped = false, t = 0;
    const scene = (cc, tt) => {
      D.sky(cc, 800, 500, 'day');
      cc.fillStyle = '#E4CFA8'; cc.fillRect(0, 430, 800, 70); cc.fillStyle = '#5E5753'; cc.fillRect(0, 455, 800, 45);
      D.hawaArt(cc, 210, 440, 380, 400);
      [[60, 380, 120, '#E08F78'], [640, 360, 140, '#D9826B']].forEach(([x, y, w, col]) => { cc.fillStyle = col; cc.fillRect(x, y, w, 70); cc.fillStyle = '#F7D5C4'; for (let i = 0; i < 4; i++) cc.fillRect(x + 10 + i * w / 4, y + 14, w / 8, 22); });
      const cx = (tt * 60) % 900 - 50; cc.save(); cc.translate(cx, 470); cc.scale(2.2, 2.2); D.vehicle(cc, { type: 'auto', x: 0, y: 0, a: 0, col: '#2E8B57' }, tt); cc.restore();
      D.cow(cc, { x: 700 - (tt * 8) % 200, y: 448, a: Math.PI, col: '#EFE9DF', patch: '#8A5A3B', seed: 1, mala: true }, tt);
    };
    loop(dt => {
      t = dt; if (snapped) return;
      tilt = Math.sin(t * 1.7) * .14 + Math.sin(t * .63) * .07;
      scene(c, t);
      c.save(); c.translate(400, 250); c.rotate(tilt); c.strokeStyle = '#FFF6EC'; c.lineWidth = 4;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { c.beginPath(); c.moveTo(a * 300, b * 170 - b * 40); c.lineTo(a * 300, b * 170); c.lineTo(a * 300 - a * 40, b * 170); c.stroke(); });
      c.lineWidth = 2; c.beginPath(); c.moveTo(-24, 0); c.lineTo(24, 0); c.moveTo(0, -24); c.lineTo(0, 24); c.stroke();
      c.restore();
      const lv = Math.abs(tilt) < .03; c.fillStyle = lv ? '#3F8F5A' : '#2B1B17'; D.rr(c, 330, 16, 140, 28, 14); c.fill();
      c.fillStyle = '#FFF6EC'; c.font = '800 15px Mukta'; c.textAlign = 'center'; c.fillText(lv ? 'LEVEL · SNAP!' : 'tilting...', 400, 35);
    });
    const snap = () => {
      if (snapped) return; snapped = true; J.audio.shutter();
      const out = document.createElement('canvas'); out.width = 320; out.height = 200; const o = out.getContext('2d');
      o.translate(160, 100); o.rotate(tilt); o.scale(.4, .4); o.translate(-400, -250); scene(o, t);
      J.state.photo = out.toDataURL('image/jpeg', .72);
      const good = Math.abs(tilt) < .04, ok = Math.abs(tilt) < .1;
      c.fillStyle = '#fff'; c.fillRect(0, 0, 800, 500);
      setTimeout(() => { c.fillStyle = '#2B1B17'; c.fillRect(0, 0, 800, 500); c.drawImage(out, 160, 50, 480, 300); c.fillStyle = '#FFF6EC'; c.font = '28px "Rozha One", serif'; c.textAlign = 'center'; c.fillText(good ? 'Postcard perfect.' : ok ? 'Pretty good! Slightly Jaipur-tilted.' : 'Very... artistic.', 400, 410); }, 120);
      sh.querySelector('#fb').textContent = good ? '+₹200 bonus: Instagram will love this.' : 'Saved to your Jaipur Diary.';
      if (good) J.state.money += 200;
      stamp('hawa');
      const b = sh.querySelector('#snap'); b.textContent = 'Nice. Keep going'; b.onclick = () => close(res);
      J.sceneKey = (e, down) => { if (down && e.code === 'Space') close(res); };
    };
    sh.querySelector('#snap').onclick = snap;
    J.sceneKey = (e, down) => { if (down && e.code === 'Space') { e.preventDefault(); snap(); } };
  });

  // ---------- Curious Life coffee sequence ----------
  S.coffee = (opts) => new Promise(res => {
    const meet = opts && opts.meet;
    let drink = null, score = 0;
    // stage 1: walk in
    const s1 = () => {
      const sh = sheet(`<div class="eyebrow">Curious Life Coffee Roasters · C-Scheme</div><h2>The roaster is humming</h2><canvas class="art" width="800" height="440"></canvas>
        <p>Light pours in from the window. Somebody is arguing about natural versus washed process. It smells like a good decision.</p><div class="row end"><button class="btn btn-primary" id="go">Walk up to the counter</button></div>`);
      const c = sh.querySelector('canvas').getContext('2d'); loop(t => D.cafeArt(c, 800, 440, t, 'counter'));
      sh.querySelector('#go').onclick = s2; J.sceneKey = (e, d) => { if (d && e.code === 'Space') s2(); };
    };
    // stage 2: order
    const MENU = [
      { id: 'pour', name: 'Pour Over · V60', price: 260, d: 'Bright, fruity, slow. You pour it yourself.' },
      { id: 'capp', name: 'Cappuccino', price: 220, d: 'Velvet milk, a latte-art heart. You steam it.' },
      { id: 'cold', name: 'Cold Brew', price: 240, d: 'Steeped overnight. You build the glass.' },
    ];
    const s2 = () => {
      const sh = sheet(`<div class="eyebrow">Ishaan · barista</div><h2>“Welcome in! What are we brewing today?”</h2><p>Today’s beans: a single-origin from Chikmagalur. Notes of jaggery, orange peel and dark chocolate.</p>
        <div class="choices">${MENU.map(m => `<button class="choice" data-id="${m.id}"><b>${esc(m.name)}</b><small>${esc(m.d)}</small><small><b style="font-family:inherit;font-size:13px">₹${m.price}</b></small></button>`).join('')}</div>`);
      sh.querySelectorAll('.choice').forEach(b => b.onclick = () => { drink = MENU.find(m => m.id === b.dataset.id); if (!pay(drink.price)) J.ui.toast('Ishaan: “First one’s on the house.”', 'Welcome back to Jaipur.'); s3(); });
    };
    // stage 3: brew
    const s3 = async () => {
      const sh = sheet(`<div class="eyebrow">Behind the bar with Ishaan</div><h2 id="h"></h2><canvas class="art" width="800" height="300"></canvas><div id="game"></div>`);
      const c = sh.querySelector('canvas').getContext('2d'), host = sh.querySelector('#game'), h = sh.querySelector('#h');
      let level = 0, mode = drink.id, art = null;
      const drawBar = () => {
        c.fillStyle = '#A87449'; c.fillRect(0, 0, 800, 300); c.fillStyle = '#8A5A3B'; c.fillRect(0, 230, 800, 70);
        c.fillStyle = 'rgba(255,240,200,.25)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(260, 0); c.lineTo(800, 300); c.lineTo(500, 300); c.fill();
        if (mode === 'pour') {
          c.fillStyle = '#F6F1E7'; c.beginPath(); c.moveTo(320, 60); c.lineTo(480, 60); c.lineTo(420, 170); c.lineTo(380, 170); c.fill();
          c.fillStyle = '#6B3E26'; const wl = Math.min(1, level / 100); c.beginPath(); c.moveTo(380 - 60 * wl * .9, 170 - 110 * wl * .9); c.lineTo(420 + 60 * wl * .9, 170 - 110 * wl * .9); c.lineTo(420, 170); c.lineTo(380, 170); c.fill();
          c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.ellipse(400, 228, 70, 10, 0, 0, 7); c.fill();
          c.fillStyle = 'rgba(107,62,38,.85)'; c.fillRect(340, 180, 120, 48); c.fillStyle = '#C9CED6'; D.rr(c, 560, 40, 90, 60, 12); c.fill(); c.fillRect(470, 55, 100, 6);
        } else if (mode === 'capp') {
          c.fillStyle = '#C9CED6'; D.rr(c, 300, 40, 120, 160, 10); c.fill(); c.fillStyle = '#9AA0A6'; c.fillRect(440, 60, 8, 120);
          c.fillStyle = '#E8E3DA'; D.rr(c, 470, 120, 90, 100, 8); c.fill();
          const tcol = level < 55 ? '#4DA3C7' : level <= 70 ? '#3F8F5A' : '#C2413B'; c.fillStyle = tcol; c.font = '800 34px Mukta'; c.textAlign = 'center'; c.fillText(Math.round(level * .85) + '°C', 515, 100);
          if (art) D.food(c, 'coffee', 640, 170, 50);
        } else {
          c.fillStyle = 'rgba(255,255,255,.4)'; D.rr(c, 340, 50, 120, 180, 10); c.fill(); c.strokeStyle = '#F6F1E7'; c.lineWidth = 3; c.stroke();
          c.fillStyle = '#4A2C1A'; const lv = level / 100 * 170; c.fillRect(343, 228 - lv, 114, lv);
          c.fillStyle = 'rgba(220,240,255,.8)'; for (let i = 0; i < (art || 0); i++) D.rr(c, 355 + i * 30, 190 - i * 18, 28, 26, 4), c.fill();
        }
      };
      drawBar();
      if (mode === 'pour') {
        const pours = [['Bloom', 'Wet the grounds, let them breathe. Just a little water.', [14, 26]], ['Second pour', 'Slow circles, centre out.', [52, 64]], ['Final pour', 'Bring it home. Don’t flood the cone.', [86, 95]]];
        for (const [title, hint, band] of pours) {
          h.textContent = title; const r = await holdMeter(host, { title, hint, band, start: level, rate: 26, verb: 'pour', good: 'Perfect pour. Ishaan nods slowly.', over: 'Too much. A little bitter, but still coffee.', under: 'Bit short. Slightly sour, still nice.', sound: J.audio.pour, onLevel: v => { level = v; drawBar(); } });
          if (r.ok) score++;
        }
      } else if (mode === 'capp') {
        h.textContent = 'Steam the milk';
        const r = await holdMeter(host, { title: 'Steam wand', hint: 'Silky microfoam happens around 60–65°C. Hotter scalds it.', band: [70, 78], rate: 30, verb: 'steam', color: '#E8E3DA', good: 'Glossy like wet paint. Ishaan whistles.', over: 'Scalded! Ishaan winces, then smiles.', under: 'A little cool. Still velvety.', sound: J.audio.pour, onLevel: v => { level = v; drawBar(); } });
        if (r.ok) score += 2;
        h.textContent = 'Latte art';
        await new Promise(n => { host.innerHTML = `<p>Pick your pour pattern.</p><div class="row" style="margin-top:12px">${['Heart', 'Rosetta', 'Tulip'].map(x => `<button class="btn btn-ghost" data-a="${x}">${x}</button>`).join('')}</div>`; host.querySelectorAll('button').forEach(b => b.onclick = () => { art = b.dataset.a; score++; drawBar(); J.audio.chime(); host.innerHTML = `<p class="feedback">A wobbly but proud ${art.toLowerCase()}.</p>`; setTimeout(n, 900); }); });
      } else {
        h.textContent = 'Build the glass';
        await new Promise(n => { let ice = 0; host.innerHTML = `<p>Three cubes of ice. Tap them in.</p><div class="row" style="margin-top:12px"><button class="btn btn-ghost" id="ice">Drop ice (0/3)</button></div>`; const b = host.querySelector('#ice'); const add = () => { ice++; art = ice; drawBar(); J.audio.click(); b.textContent = `Drop ice (${ice}/3)`; if (ice >= 3) { J.sceneKey = null; setTimeout(n, 400); } }; b.onclick = add; J.sceneKey = (e, d) => { if (d && e.code === 'Space') add(); }; });
        const r = await holdMeter(host, { title: 'Pour the brew', hint: 'Fill to about three quarters. Leave space for milk.', band: [68, 80], rate: 28, verb: 'pour', good: 'Dark, clean, beautiful.', over: 'Glass is full! No room for milk. Living dangerously.', under: 'A bit shy. Ishaan tops it up.', sound: J.audio.pour, onLevel: v => { level = v; drawBar(); } });
        if (r.ok) score += 3;
      }
      s4();
    };
    // stage 4: sit by the window and sip, in 3D
    const s4 = () => {
      const verdict = score >= 3 ? 'Ishaan: “That’s a 9/10, yaar.”' : score >= 2 ? 'Ishaan: “Solid. Come back Sunday, I’ll show you the roaster.”' : 'Ishaan: “Every great barista started with a sad cup.”';
      stop(); U.closeSheet(); J.ui.toast(verdict, 'Carry your cup outside and sit.');
      J.meal.start({ place: 'curious', paid: true, companion: meet ? 'meera' : 'ishaan', food: { item: drink.name, price: 0, josh: 45, dish: drink.id === 'cold' ? 'iced' : 'coffee', serve: 'ceramic' } }).then(() => res());
    };
    s1();
  });

  // ---------- eat at a food stop: handled in 3D by J.meal ----------
  S.eat = (opts) => J.meal.start({ place: opts.place, companion: opts.companion || (opts.mission ? { usual: 'meera', doppler: 'chintu', samrat: null }[opts.place] : null) });

  // ---------- block-print mural at JKK ----------
  S.art = () => new Promise(res => {
    const COLS = { gulabi: '#E0577A', neel: '#2E3A87', haldi: '#F2B01E' };
    const STAMPS = [['keri', 'Keri (paisley)'], ['phool', 'Phool'], ['haathi', 'Haathi'], ['mor', 'Mor']];
    let col = 'gulabi', st = 'phool'; const grid = {};
    const sh = sheet(`<div class="eyebrow">Jawahar Kala Kendra · Jaipur Art Week</div><h2>Block-print the wall</h2><p>Pick a block and a colour, then tap the wall to stamp it. Stamp at least 12 to finish. Meera is already crying a little.</p>
      <canvas class="art" width="800" height="480"></canvas>
      <div class="row">${STAMPS.map(([k, n]) => `<button class="stampbtn ${k === st ? 'sel' : ''}" data-s="${k}">${n}</button>`).join('')}</div>
      <div class="row" style="margin-top:12px">${Object.entries(COLS).map(([k, v]) => `<button class="swatch ${k === col ? 'sel' : ''}" data-c="${k}" style="background:${v}" aria-label="${k}"></button>`).join('')}<span style="flex:1"></span><button class="btn btn-ghost" id="clr">Clear</button><button class="btn btn-primary" id="fin" disabled>Finish mural (0/12)</button></div>`);
    const cv = sh.querySelector('canvas'), c = cv.getContext('2d'), CW = 8, CH = 5, gx = 60, gy = 50, cs = 85;
    const render = () => {
      c.fillStyle = '#F6EEDF'; c.fillRect(0, 0, 800, 480);
      for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(160,120,80,${(i % 7) * .006})`; c.fillRect((i * 97) % 800, (i * 53) % 480, 3, 2); }
      for (let i = 0; i < 800; i += 24) { c.fillStyle = (i / 24) % 2 ? '#E0577A' : '#2E3A87'; c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 12, 18); c.lineTo(i + 24, 0); c.fill(); c.beginPath(); c.moveTo(i, 480); c.lineTo(i + 12, 462); c.lineTo(i + 24, 480); c.fill(); }
      c.strokeStyle = 'rgba(43,27,23,.07)'; c.lineWidth = 1; for (let x = 0; x <= CW; x++) { c.beginPath(); c.moveTo(gx + x * cs, gy); c.lineTo(gx + x * cs, gy + CH * cs); c.stroke(); } for (let y = 0; y <= CH; y++) { c.beginPath(); c.moveTo(gx, gy + y * cs); c.lineTo(gx + CW * cs, gy + y * cs); c.stroke(); }
      for (const k in grid) { const [x, y] = k.split(',').map(Number), g = grid[k]; c.globalAlpha = .92; D.stamp(c, g.s, gx + x * cs + cs / 2, gy + y * cs + cs / 2, cs * .95, COLS[g.c]); c.globalAlpha = 1; }
      const n = Object.keys(grid).length, fin = sh.querySelector('#fin'); fin.disabled = n < 12; fin.textContent = n < 12 ? `Finish mural (${n}/12)` : 'Finish mural';
    };
    cv.addEventListener('pointerdown', e => {
      const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 800, y = (e.clientY - r.top) / r.height * 480;
      const cx = Math.floor((x - gx) / cs), cy = Math.floor((y - gy) / cs); if (cx < 0 || cy < 0 || cx >= CW || cy >= CH) return;
      grid[cx + ',' + cy] = { s: st, c: col }; J.audio.thud(); render();
    });
    sh.querySelectorAll('.stampbtn').forEach(b => b.onclick = () => { st = b.dataset.s; sh.querySelectorAll('.stampbtn').forEach(x => x.classList.toggle('sel', x === b)); });
    sh.querySelectorAll('.swatch').forEach(b => b.onclick = () => { col = b.dataset.c; sh.querySelectorAll('.swatch').forEach(x => x.classList.toggle('sel', x === b)); });
    sh.querySelector('#clr').onclick = () => { for (const k in grid) delete grid[k]; render(); };
    sh.querySelector('#fin').onclick = () => {
      const out = document.createElement('canvas'); out.width = 400; out.height = 240; out.getContext('2d').drawImage(cv, 0, 0, 400, 240);
      J.state.art = out.toDataURL('image/jpeg', .75); J.loadArt(); J.audio.pass(); stamp('jkk'); close(res);
    };
    render();
  });

  // ---------- finale ----------
  S.finale = () => new Promise(res => {
    const lines = [
      ['narrator', 'Nahargarh. 6:12 PM. The whole city is a sheet of pink below you.'],
      ['dadi', 'Aa gaya mera sher! Kachori garam hai? Haan, garam hai.'],
      ['meera', 'Your mural is on every poster. Look. Even the posters are pink.'],
      ['chintu', 'Bhai, Samrat, Sampat, LMB, Lassiwala... sab aa gaye. Line Amer tak jaa rahi hai.'],
      ['bunty', 'Ahem. Yeh fest band karo, warna... (sniff) ...yeh kya khushboo hai?'],
      ['dadi', 'Tere Dadaji ki recipe. Kha. Phir bolna “kachori ka zamana gaya.”'],
      ['bunty', '...Ek aur milegi? Aur haan, lounge cancel. Kachori Corner rehne do.'],
      ['you', 'Jaipur doesn’t change, Bunty. It just gets more pink.'],
    ];
    let i = 0;
    const sh = sheet(`<div class="eyebrow">Chapter 8 · Gulabi Sunset</div><h2>The Gulabi Food Fest</h2><canvas class="art" width="800" height="440"></canvas><p id="ln"></p><div class="row end"><button class="btn btn-primary" id="nx">Next (Space)</button></div>`);
    const c = sh.querySelector('canvas').getContext('2d'); loop(t => D.skyline(c, 800, 440, t));
    const show = () => {
      if (i >= lines.length) return credits();
      const [who, text] = lines[i++], cast = J.CAST[who], name = who === 'you' ? J.state.name : cast.name;
      sh.querySelector('#ln').innerHTML = `${name ? `<b style="color:${cast.col}">${esc(name)}:</b> ` : ''}${esc(U.sub(text))}`;
    };
    const credits = () => {
      const S2 = J.state, list = J.PLACES.filter(p => p.kind !== 'home' && p.kind !== 'garage'), got = list.filter(p => S2.diary[p.id]).length;
      const sh2 = sheet(`<div class="eyebrow">The end. For now.</div><h2>Gulabi Town Adventures</h2><canvas class="art" width="800" height="300"></canvas>
        <p>Dadi’s Kachori Corner stays. The mural stays. And you? You stay a little longer.</p>
        <p style="margin-top:12px"><b>Jaipur Diary:</b> ${got}/${list.length} stamps · <b>Wallet:</b> ₹${Math.round(S2.money).toLocaleString('en-IN')}</p>
        <p style="margin-top:12px">Free roam is open. Collect every diary stamp, eat at every legend, and find the monkeys at Galta Ji.</p>
        <div class="row end"><button class="btn btn-primary" id="go">Keep exploring Jaipur</button></div>`);
      const c2 = sh2.querySelector('canvas').getContext('2d'); loop(t => D.skyline(c2, 800, 300, t + 30));
      sh2.querySelector('#go').onclick = () => close(res); J.sceneKey = (e, d) => { if (d && e.code === 'Enter') close(res); };
      stamp('nahargarh');
    };
    sh.querySelector('#nx').onclick = show; J.sceneKey = (e, d) => { if (d && e.code === 'Space') { e.preventDefault(); show(); } };
    show();
  });

  S.open = function (name, opts) { return S[name](opts || {}); };
})(window.J);
