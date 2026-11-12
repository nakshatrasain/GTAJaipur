/* Drawing: vehicles, people, animals, landmarks, scene illustrations. Light source: top-left. */
(function (J) {
  const D = J.draw = {};
  const SHADOW = 'rgba(52,26,18,.28)';

  function rr(c, x, y, w, h, r) { c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h); }
  D.rr = rr;
  D.shade = function (hex, amt) { // amt -1..1
    let n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
    r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  const sh = D.shade;

  // ---------------- vehicles (facing +x) ----------------
  D.vehicle = function (c, v, time) {
    const T = J.VEH[v.type], l = T.l, w = T.w, col = v.col;
    c.save(); c.translate(v.x, v.y);
    c.save(); c.translate(3, 4); c.rotate(v.a); c.fillStyle = SHADOW; rr(c, -l / 2, -w / 2, l, w, 4); c.fill(); c.restore();
    c.rotate(v.a);
    switch (v.type) {
      case 'scooty': case 'bike': case 'police': {
        c.fillStyle = '#222'; rr(c, l / 2 - 5, -1.5, 6, 3, 1.5); c.fill(); rr(c, -l / 2 - 1, -1.5, 6, 3, 1.5); c.fill();
        c.fillStyle = col; rr(c, -l / 2 + 2, -w / 2 + 1, l - 4, w - 2, 3); c.fill();
        if (v.type === 'police') { c.fillStyle = '#263170'; c.fillRect(-l / 2 + 3, -1, l - 6, 2); }
        c.strokeStyle = '#444'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(l / 2 - 6, -w / 2 - 2); c.lineTo(l / 2 - 6, w / 2 + 2); c.stroke();
        // rider
        const rcol = v.driver === 'player' ? '#F2A41C' : (v.rider || '#5C7AAE');
        c.fillStyle = rcol; c.beginPath(); c.ellipse(-2, 0, 4, 6, 0, 0, 7); c.fill();
        c.fillStyle = v.type === 'police' ? '#F6F6F6' : (v.helmet || '#2B1B17'); c.beginPath(); c.arc(-1, 0, 3.6, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(-2, -1.2, 1.3, 0, 7); c.fill();
        if (v.type === 'police') { const on = (time * 6 | 0) % 2; c.fillStyle = on ? '#E23B3B' : '#3B6BE2'; c.beginPath(); c.arc(-l / 2 + 2, 0, 2.6, 0, 7); c.fill(); }
        break;
      }
      case 'auto': {
        c.fillStyle = col; c.beginPath();
        c.moveTo(l / 2, -w * .22); c.lineTo(l / 2, w * .22); c.lineTo(l * .08, w / 2); c.lineTo(-l / 2, w / 2); c.lineTo(-l / 2, -w / 2); c.lineTo(l * .08, -w / 2); c.closePath(); c.fill();
        c.fillStyle = '#F4C430'; rr(c, -l / 2 + 1, -w / 2 + 1, l * .62, w - 2, 3); c.fill();
        c.fillStyle = '#2B2B2B'; c.fillRect(-l * .1, -w / 2 + 1, 2.5, w - 2); c.fillRect(-l / 2 + 1, -w / 2 + 1, l * .62, 1.5);
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-l / 2 + 3, -w / 2 + 3, l * .3, 2);
        c.fillStyle = '#FFF3C4'; c.beginPath(); c.arc(l / 2 - 1, 0, 1.8, 0, 7); c.fill();
        break;
      }
      case 'bus': {
        c.fillStyle = col; rr(c, -l / 2, -w / 2, l, w, 5); c.fill();
        c.fillStyle = sh(col, -.25); c.fillRect(-l / 2 + 4, -w / 2, l - 10, 2.5); c.fillRect(-l / 2 + 4, w / 2 - 2.5, l - 10, 2.5);
        c.fillStyle = '#E8E3DA'; for (let i = 0; i < 3; i++) { rr(c, -l / 2 + 8 + i * 15, -4, 9, 8, 2); c.fill(); }
        c.fillStyle = '#2D3A48'; rr(c, l / 2 - 6, -w / 2 + 2, 4, w - 4, 2); c.fill();
        break;
      }
      case 'camelcart': {
        c.fillStyle = '#7A4E2A'; rr(c, -l / 2, -w / 2, l * .55, w, 2); c.fill();
        c.strokeStyle = '#A8743F'; c.lineWidth = 1; for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(-l / 2 + i * 4.4, -w / 2 + 1); c.lineTo(-l / 2 + i * 4.4, w / 2 - 1); c.stroke(); }
        c.fillStyle = '#E8D3A4'; c.fillRect(-l / 2 + 2, -w / 2 + 2, 8, w - 4);
        c.fillStyle = '#C49A6C'; c.beginPath(); c.ellipse(l * .2, 0, 9, 5, 0, 0, 7); c.fill();
        c.fillStyle = '#D9B282'; c.beginPath(); c.ellipse(l * .18, 0, 4, 3.5, 0, 0, 7); c.fill();
        c.strokeStyle = '#C49A6C'; c.lineWidth = 3; c.beginPath(); c.moveTo(l * .35, 0); c.lineTo(l / 2 - 2, 0); c.stroke();
        c.fillStyle = '#B98A5C'; c.beginPath(); c.ellipse(l / 2, 0, 3.5, 2.5, 0, 0, 7); c.fill();
        break;
      }
      case 'jeep': {
        c.fillStyle = col; rr(c, -l / 2, -w / 2, l, w, 4); c.fill();
        c.fillStyle = '#2B231F'; rr(c, -l * .32, -w / 2 + 3, l * .5, w - 6, 2); c.fill();
        c.fillStyle = sh(col, -.2); c.fillRect(-l * .1, -w / 2 + 3, 5, w - 6); c.fillRect(-l * .3, -w / 2 + 3, 5, w - 6);
        c.fillStyle = '#2D3A48'; c.fillRect(l * .18, -w / 2 + 2, 3, w - 4);
        c.fillStyle = '#1E1E1E'; c.beginPath(); c.arc(-l / 2 - 1, 0, 4, 0, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(l * .24, -w / 2 + 2, l * .22, 2);
        c.fillStyle = '#FFF3C4'; c.fillRect(l / 2 - 2, -w / 2 + 2, 2, 3); c.fillRect(l / 2 - 2, w / 2 - 5, 2, 3);
        break;
      }
      default: { // car, goon
        c.fillStyle = col; rr(c, -l / 2, -w / 2, l, w, 5); c.fill();
        c.fillStyle = v.type === 'goon' ? '#0B0B0D' : '#2D3A48';
        rr(c, l * .08, -w / 2 + 2, l * .16, w - 4, 2); c.fill();
        rr(c, -l * .38, -w / 2 + 2, l * .1, w - 4, 2); c.fill();
        c.fillStyle = v.type === 'goon' ? '#2A2A30' : sh(col, .12); rr(c, -l * .26, -w / 2 + 2.5, l * .33, w - 5, 2); c.fill();
        if (v.type === 'goon') { c.strokeStyle = '#C9A74A'; c.lineWidth = 1; rr(c, -l / 2 + 1, -w / 2 + 1, l - 2, w - 2, 4); c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-l * .24, -w / 2 + 3, l * .28, 1.5);
        c.fillStyle = '#FFF3C4'; c.fillRect(l / 2 - 2, -w / 2 + 2, 2, 3); c.fillRect(l / 2 - 2, w / 2 - 5, 2, 3);
        c.fillStyle = '#C2413B'; c.fillRect(-l / 2, -w / 2 + 2, 1.5, 3); c.fillRect(-l / 2, w / 2 - 5, 1.5, 3);
      }
    }
    if (v.stunned > 0) { c.rotate(-v.a); c.fillStyle = '#F2A41C'; for (let i = 0; i < 3; i++) { const an = time * 5 + i * 2.1; c.beginPath(); c.arc(Math.cos(an) * 10, -14 + Math.sin(an) * 3, 2, 0, 7); c.fill(); } }
    c.restore();
  };

  // ---------------- people & animals ----------------
  D.person = function (c, p, time) {
    c.save(); c.translate(p.x, p.y);
    c.fillStyle = SHADOW; c.beginPath(); c.ellipse(2, 3, 5.5, 3.5, 0, 0, 7); c.fill();
    if (p.down > 0) {
      c.rotate(p.spin || 0);
      c.fillStyle = p.col; rr(c, -7, -3.5, 12, 7, 3); c.fill();
      c.fillStyle = p.skin; c.beginPath(); c.arc(6, 0, 3.2, 0, 7); c.fill();
      c.rotate(-(p.spin || 0)); c.fillStyle = '#F2A41C';
      for (let i = 0; i < 3; i++) { const an = time * 6 + i * 2.1; c.beginPath(); c.arc(Math.cos(an) * 8, -8 + Math.sin(an) * 2.5, 1.6, 0, 7); c.fill(); }
      c.restore(); return;
    }
    c.rotate(p.a);
    const sw = Math.sin(p.walk || 0) * 2.5;
    c.fillStyle = p.skin; c.beginPath(); c.arc(sw, -5.5, 1.8, 0, 7); c.arc(-sw, 5.5, 1.8, 0, 7); c.fill();
    c.fillStyle = p.col; c.beginPath(); c.ellipse(0, 0, 4, 6.2, 0, 0, 7); c.fill();
    if (p.dupatta) { c.fillStyle = p.dupatta; c.beginPath(); c.ellipse(-1.5, 0, 3.2, 6.4, 0, 0, 7); c.fill(); }
    c.fillStyle = p.skin; c.beginPath(); c.arc(.5, 0, 3.3, 0, 7); c.fill();
    if (p.turban) { c.fillStyle = p.turban; c.beginPath(); c.arc(0, 0, 3.8, 0, 7); c.fill(); c.fillStyle = sh(p.turban, -.2); c.fillRect(-6, -1, 3, 2); }
    else { c.fillStyle = p.hair || '#2B1B17'; c.beginPath(); c.arc(-.6, 0, 3.3, Math.PI * .5, Math.PI * 1.5); c.fill(); }
    c.restore();
  };

  D.cow = function (c, k, time) {
    c.save(); c.translate(k.x, k.y);
    c.fillStyle = SHADOW; c.beginPath(); c.ellipse(3, 4, 11, 6, k.a, 0, 7); c.fill();
    c.rotate(k.a);
    c.strokeStyle = '#B9AE9C'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-10, 0); c.quadraticCurveTo(-14, Math.sin(time * 3 + k.seed) * 4, -16, 2); c.stroke();
    c.fillStyle = k.col; c.beginPath(); c.ellipse(0, 0, 10.5, 6.2, 0, 0, 7); c.fill();
    c.fillStyle = k.patch; c.beginPath(); c.ellipse(-3, -2, 3.5, 2.4, .4, 0, 7); c.ellipse(4, 2.2, 2.6, 2, 0, 0, 7); c.fill();
    c.fillStyle = sh(k.col, -.05); c.beginPath(); c.ellipse(11, 0, 4.2, 3.2, 0, 0, 7); c.fill();
    c.strokeStyle = '#E8DCC0'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(12, -2.5); c.lineTo(14, -5.5); c.moveTo(12, 2.5); c.lineTo(14, 5.5); c.stroke();
    if (k.mala) { c.fillStyle = '#F2A41C'; for (let i = -2; i <= 2; i++) { c.beginPath(); c.arc(8, i * 1.6, 1.1, 0, 7); c.fill(); } }
    c.restore();
  };

  D.monkey = function (c, m, time) {
    c.save(); c.translate(m.x, m.y + Math.abs(Math.sin(time * 6 + m.seed)) * -1.5);
    c.fillStyle = SHADOW; c.beginPath(); c.ellipse(2, 3, 4.5, 3, 0, 0, 7); c.fill();
    c.strokeStyle = '#7A5C3E'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-3, 2); c.quadraticCurveTo(-8, 6, -7, -2); c.stroke();
    c.fillStyle = '#8B6B4A'; c.beginPath(); c.arc(0, 0, 4, 0, 7); c.fill();
    c.fillStyle = '#E2B08C'; c.beginPath(); c.arc(1.5, -1, 1.8, 0, 7); c.fill();
    c.restore();
  };

  // ---------------- buildings & landmarks (oblique: roof raised by hgt, front face south) ----------------
  function windowsRow(c, x, y, w, h, n, col, trim, arch) {
    const gap = w / n;
    for (let i = 0; i < n; i++) {
      const wx = x + i * gap + gap * .3, ww = gap * .4;
      c.fillStyle = trim; rr(c, wx - 1, y - 1, ww + 2, h + 2, arch ? [ww, ww, 1, 1] : 1); c.fill();
      c.fillStyle = col; rr(c, wx, y, ww, h, arch ? [ww, ww, 0, 0] : 0); c.fill();
    }
  }
  function dome(c, x, y, r, col) {
    c.fillStyle = 'rgba(52,26,18,.25)'; c.beginPath(); c.arc(x + r * .3, y + r * .3, r, 0, 7); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(x - r * .35, y - r * .35, r * .35, 0, 7); c.fill();
    c.fillStyle = sh(col, -.35); c.beginPath(); c.arc(x, y, Math.max(1, r * .18), 0, 7); c.fill();
  }
  D.dome = dome;
  function crenel(c, x, y, w, col) { c.fillStyle = col; for (let i = 0; i < w; i += 6) c.fillRect(x + i, y - 3, 3.5, 3); }

  D.building = function (c, b) {
    const T = J.T, X = b.x * T, Y = b.y * T, W = b.w * T, H = b.h * T, h = b.hgt;
    // roof
    c.fillStyle = b.roof; c.fillRect(X, Y - h, W, H);
    c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(X, Y - h, W, 2); c.fillRect(X, Y - h, 2, H);
    c.strokeStyle = b.trim; c.lineWidth = 2; c.strokeRect(X + 3, Y - h + 3, W - 6, H - 6);
    if (b.tank) { const tx = X + W - 10 - (b.tankOff || 0), ty = Y - h + 10; c.fillStyle = 'rgba(52,26,18,.3)'; c.beginPath(); c.arc(tx + 2, ty + 2, 5, 0, 7); c.fill(); c.fillStyle = b.tankCol; c.beginPath(); c.arc(tx, ty, 5, 0, 7); c.fill(); }
    if (b.chhatri) dome(c, X + 12, Y - h + 12, 6, b.trim);
    if (b.plant) { c.fillStyle = '#6E9A4F'; c.beginPath(); c.arc(X + 9, Y - h + H - 10, 4, 0, 7); c.arc(X + 15, Y - h + H - 8, 3, 0, 7); c.fill(); }
    // front face
    c.fillStyle = b.face; c.fillRect(X, Y + H - h, W, h);
    if (h >= 12) windowsRow(c, X, Y + H - h + 4, W, Math.min(10, h - 8), Math.max(1, Math.round(W / 14)), b.win, b.trim, b.walled);
    c.fillStyle = 'rgba(52,26,18,.18)'; c.fillRect(X, Y + H - 2, W, 2);
  };

  D.landmark = function (c, p, time, night) {
    const T = J.T, X = p.x * T, Y = p.y * T, W = p.w * T, H = p.h * T, h = p.hgt || 0, col = p.col;
    const roofY = Y - h, faceY = Y + H - h;
    const face = sh(col, -.16), dark = sh(col, -.35), light = sh(col, .3);
    const base = () => { c.fillStyle = col; c.fillRect(X, roofY, W, H); c.fillStyle = face; c.fillRect(X, faceY, W, h); c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(X, roofY, W, 2); c.fillRect(X, roofY, 2, H); };
    switch (p.style) {
      case 'hawa': {
        c.fillStyle = sh(col, -.1); c.fillRect(X, roofY, W, H);
        const tiers = 5;
        for (let i = 0; i < tiers; i++) {
          const inset = i * W * .085, tw = W - inset * 2, ty = roofY + i * (H * .14);
          c.fillStyle = i % 2 ? '#E58A71' : '#DA6F57'; c.fillRect(X + inset, ty, tw, H - i * H * .14);
          c.fillStyle = '#F7D5C4'; c.fillRect(X + inset, ty, tw, 1.5);
        }
        for (let i = 0; i < 7; i++) dome(c, X + W * (.14 + i * .12), roofY + H * .62 - Math.abs(3 - i) * 7, 3.6, '#F2B39E');
        c.fillStyle = '#D2654E'; c.fillRect(X, faceY, W, h);
        for (let r = 0; r < 4; r++) windowsRow(c, X + 2, faceY + 3 + r * (h / 4.2), W - 4, h / 4.2 - 4, Math.round(W / 9), '#9E4535', '#FBE3D5', true);
        break;
      }
      case 'fort': {
        base();
        c.fillStyle = light; c.fillRect(X + W * .2, roofY + H * .25, W * .6, H * .45);
        c.fillStyle = '#C9B48A'; c.fillRect(X + W * .3, roofY + H * .33, W * .4, H * .28);
        crenel(c, X, roofY + 3, W, dark);
        [[X + 8, roofY + 8], [X + W - 8, roofY + 8], [X + W / 2, roofY + H * .45]].forEach(([dx, dy]) => dome(c, dx, dy, 7, light));
        for (let i = 0; i < 3; i++) dome(c, X + W * (.35 + i * .15), roofY + H * .2, 4.5, '#F3E3C3');
        windowsRow(c, X + 4, faceY + 6, W - 8, Math.max(6, h - 14), Math.round(W / 16), dark, light, true);
        break;
      }
      case 'palace': {
        base();
        c.fillStyle = '#9DBF7A'; c.fillRect(X + W * .25, roofY + H * .25, W * .5, H * .4);
        c.strokeStyle = '#D97B66'; c.lineWidth = 2; c.strokeRect(X + W * .25, roofY + H * .25, W * .5, H * .4);
        c.fillStyle = '#7FB5C8'; c.fillRect(X + W * .46, roofY + H * .38, W * .08, H * .14);
        [[X + 9, roofY + 9], [X + W - 9, roofY + 9], [X + 9, roofY + H - 9], [X + W - 9, roofY + H - 9]].forEach(([dx, dy]) => dome(c, dx, dy, 6.5, '#F6E6CC'));
        dome(c, X + W / 2, roofY + 10, 5, '#F6E6CC');
        windowsRow(c, X + 4, faceY + 5, W - 8, Math.max(6, h - 12), Math.round(W / 13), '#C2604C', '#FBEBD5', true);
        break;
      }
      case 'albert': {
        base();
        dome(c, X + W / 2, roofY + H / 2, 15, '#F4E6C8');
        [[X + 12, roofY + 12], [X + W - 12, roofY + 12], [X + 12, roofY + H - 12], [X + W - 12, roofY + H - 12]].forEach(([dx, dy]) => dome(c, dx, dy, 7, '#F4E6C8'));
        windowsRow(c, X + 4, faceY + 5, W - 8, h - 10, Math.round(W / 12), '#B08A5A', '#FFF6E6', true);
        break;
      }
      case 'temple': {
        base();
        for (let i = 0; i < 3; i++) {
          const cx = X + W * (.25 + i * .25), cy = roofY + H * .5, s = i === 1 ? 1.4 : 1;
          for (let k = 0; k < 4; k++) { c.fillStyle = k % 2 ? light : sh(col, -.06); c.beginPath(); c.arc(cx, cy, (12 - k * 2.6) * s, 0, 7); c.fill(); }
          c.fillStyle = '#E2A33A'; c.beginPath(); c.arc(cx, cy, 2 * s, 0, 7); c.fill();
        }
        c.fillStyle = '#E2A33A'; c.fillRect(X + W * .5 - 1, roofY - 8, 2, 8); c.fillStyle = '#E07B1A'; c.beginPath(); c.moveTo(X + W * .5 + 1, roofY - 8); c.lineTo(X + W * .5 + 9, roofY - 5); c.lineTo(X + W * .5 + 1, roofY - 2); c.fill();
        windowsRow(c, X + 4, faceY + 5, W - 8, h - 10, Math.round(W / 14), dark, light, true);
        break;
      }
      case 'cafe': case 'shop': case 'haveli': {
        base();
        c.strokeStyle = dark; c.lineWidth = 2; c.strokeRect(X + 3, roofY + 3, W - 6, H - 6);
        if (p.style === 'haveli') { dome(c, X + 12, roofY + 12, 6, light); dome(c, X + W - 12, roofY + 12, 6, light); }
        if (p.style === 'cafe') { c.fillStyle = '#6E9A4F'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(X + 12 + i * 14, roofY + H - 12, 5, 0, 7); c.fill(); } c.fillStyle = '#F6E7C8'; c.fillRect(X + W - 26, roofY + 8, 16, 10); }
        windowsRow(c, X + 2, faceY + 3, W - 4, Math.max(5, h * .45), Math.round(W / 16), p.style === 'cafe' ? '#FBE9B5' : dark, '#FFF6EC', p.style !== 'cafe');
        // awning stripes
        const aw = p.awn || '#F2A41C', ay = Y + H - 9, n = Math.round(W / 8);
        for (let i = 0; i < n; i++) { c.fillStyle = i % 2 ? '#FFF6EC' : aw; c.fillRect(X + i * W / n, ay, W / n + .5, 7); }
        c.fillStyle = 'rgba(52,26,18,.2)'; c.fillRect(X, ay + 7, W, 2);
        if (p.pigment) { const pc = { gulabi: '#E0577A', neel: '#2E3A87', haldi: '#F2B01E' }[p.pigment]; const fy = p.face === 'n' ? Y - T * .55 : Y + H + T * .5; for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? pc : sh(pc, .25); c.beginPath(); c.arc(X + 14 + i * (W - 28) / 3, fy, 6, Math.PI, 0); c.fill(); } }
        break;
      }
      case 'jantar': {
        c.fillStyle = '#EAD6BA'; c.fillRect(X, Y, W, H);
        c.fillStyle = '#D9A55F'; c.beginPath(); c.moveTo(X + W * .15, Y + H * .8); c.lineTo(X + W * .5, Y + H * .1); c.lineTo(X + W * .55, Y + H * .8); c.fill();
        c.fillStyle = '#C08A48'; c.beginPath(); c.moveTo(X + W * .5, Y + H * .1); c.lineTo(X + W * .58, Y + H * .1); c.lineTo(X + W * .63, Y + H * .8); c.lineTo(X + W * .55, Y + H * .8); c.fill();
        c.strokeStyle = '#B98A5A'; c.lineWidth = 3; c.beginPath(); c.arc(X + W * .8, Y + H * .35, H * .22, 0, 7); c.stroke(); c.beginPath(); c.arc(X + W * .8, Y + H * .78, H * .14, Math.PI, 0); c.stroke();
        c.fillStyle = '#E6C79A'; c.beginPath(); c.arc(X + W * .8, Y + H * .35, H * .08, 0, 7); c.fill();
        break;
      }
      case 'stepwell': {
        c.fillStyle = '#D9B27C'; c.fillRect(X, Y, W, H);
        for (let i = 0; i < 6; i++) { const ins = i * W * .07; c.strokeStyle = i % 2 ? '#B98A5A' : '#EBCB97'; c.lineWidth = 2; c.strokeRect(X + ins + 2, Y + ins * (H / W) + 2, W - ins * 2 - 4, H - ins * 2 * (H / W) - 4); }
        c.fillStyle = '#4F9DB4'; c.fillRect(X + W * .4, Y + H * .4, W * .2, H * .2);
        break;
      }
      case 'jalmahal': {
        base();
        windowsRow(c, X + 3, faceY + 3, W - 6, h - 6, Math.round(W / 10), '#B98A5A', '#FFF6E6', true);
        [[X + 7, roofY + 7], [X + W - 7, roofY + 7], [X + 7, roofY + H - 7], [X + W - 7, roofY + H - 7]].forEach(([dx, dy]) => dome(c, dx, dy, 5, '#F4E6C8'));
        c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(X - 6, Y + H + 2, W + 12, 2);
        break;
      }
      case 'gate': {
        c.fillStyle = '#F6D58A'; c.fillRect(X, roofY, W, H);
        const cols = ['#E0577A', '#2E3A87', '#F2A41C', '#3F8F5A', '#C2413B', '#4DA3C7'];
        for (let i = 0; i < 5; i++) dome(c, X + W * (.1 + i * .2), roofY + H * .45, 7, i % 2 ? '#F2A41C' : '#E0577A');
        c.fillStyle = '#F6E6CC'; c.fillRect(X, faceY, W, h);
        const n = 9; for (let i = 0; i < n; i++) { const ax = X + i * W / n; c.fillStyle = cols[i % cols.length]; rr(c, ax + 3, faceY + 5, W / n - 6, h - 6, [W / n, W / n, 0, 0]); c.fill(); c.fillStyle = '#FFF6EC'; rr(c, ax + 7, faceY + 10, W / n - 14, h - 11, [W / n, W / n, 0, 0]); c.fill(); }
        break;
      }
      case 'stadium': {
        c.fillStyle = '#CFC6B4'; c.beginPath(); c.ellipse(X + W / 2, Y + H / 2 - h, W / 2, H / 2, 0, 0, 7); c.fill();
        c.fillStyle = face; c.fillRect(X + W * .1, Y + H / 2 - h, W * .8, h + H / 2 - 4);
        c.fillStyle = '#CFC6B4'; c.beginPath(); c.ellipse(X + W / 2, Y + H / 2 - h, W / 2, H / 2, 0, 0, 7); c.fill();
        c.fillStyle = '#6FA35A'; c.beginPath(); c.ellipse(X + W / 2, Y + H / 2 - h, W * .38, H * .36, 0, 0, 7); c.fill();
        c.fillStyle = '#D9C49A'; c.fillRect(X + W / 2 - 3, Y + H / 2 - h - 14, 6, 28);
        break;
      }
      case 'mall': {
        base();
        c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 1;
        for (let i = 16; i < W; i += 16) { c.beginPath(); c.moveTo(X + i, roofY); c.lineTo(X + i, roofY + H); c.stroke(); }
        c.fillStyle = '#6E9AB0'; c.fillRect(X, faceY, W, h);
        c.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < W; i += 22) { c.beginPath(); c.moveTo(X + i, faceY + h); c.lineTo(X + i + 10, faceY); c.lineTo(X + i + 16, faceY); c.lineTo(X + i + 6, faceY + h); c.fill(); }
        break;
      }
      case 'village': {
        c.fillStyle = '#D9925A'; c.fillRect(X, Y, W, H);
        for (let i = 0; i < 7; i++) { const hx = X + 20 + (i * 53) % (W - 30), hy = Y + 16 + ((i * 37) % (H - 30)); c.fillStyle = 'rgba(52,26,18,.25)'; c.beginPath(); c.arc(hx + 4, hy + 4, 12, 0, 7); c.fill(); c.fillStyle = '#E8C27E'; c.beginPath(); c.arc(hx, hy, 12, 0, 7); c.fill(); c.strokeStyle = '#B98A5A'; c.lineWidth = 1; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + Math.cos(k) * 12, hy + Math.sin(k) * 12); c.stroke(); } }
        for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#F2A41C' : '#E0577A'; c.beginPath(); c.arc(X + 10 + i * W / 8, Y + H - 6, 3, 0, 7); c.fill(); }
        break;
      }
      case 'cinema': {
        base();
        c.fillStyle = light; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(X + W * (i + .5) / 6, roofY + 4, W / 12, Math.PI, 0); c.fill(); }
        c.fillStyle = '#F7D9D4'; c.beginPath(); c.ellipse(X + W / 2, roofY + H / 2, W * .3, H * .3, 0, 0, 7); c.fill();
        windowsRow(c, X + 4, faceY + 4, W - 8, h - 8, 7, '#C2604C', '#FFF6EC', true);
        break;
      }
      case 'station': {
        base();
        c.fillStyle = light; c.fillRect(X + 10, roofY + 14, W - 20, H - 28);
        c.fillStyle = sh(col, -.05); c.fillRect(X + 18, roofY + 22, W - 36, H - 44);
        for (let i = 1; i < 6; i++) dome(c, X + i * W / 6, roofY + H - 12, 5, light);
        crenel(c, X, roofY + 3, W, dark);
        c.fillStyle = light; c.fillRect(X + W / 2 - 14, roofY - 10, 28, 28);
        c.fillStyle = '#FFF6EC'; c.beginPath(); c.arc(X + W / 2, roofY + 2, 8, 0, 7); c.fill(); c.strokeStyle = '#2B1B17'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X + W / 2, roofY + 2); c.lineTo(X + W / 2, roofY - 4); c.moveTo(X + W / 2, roofY + 2); c.lineTo(X + W / 2 + 4, roofY + 2); c.stroke();
        dome(c, X + 10, roofY + 10, 6, light); dome(c, X + W - 10, roofY + 10, 6, light);
        windowsRow(c, X + 4, faceY + 5, W - 8, h - 10, Math.round(W / 14), dark, '#FFF6EC', true);
        break;
      }
      case 'garage': {
        base();
        c.strokeStyle = dark; c.lineWidth = 1; for (let i = 6; i < W; i += 6) { c.beginPath(); c.moveTo(X + i, roofY + 2); c.lineTo(X + i, roofY + H - 2); c.stroke(); }
        c.fillStyle = '#5E5753'; c.fillRect(X + W * .15, faceY + 3, W * .7, h - 3);
        c.fillStyle = '#F2A41C'; c.fillRect(X + W * .15, faceY + 3, W * .7, 3);
        c.fillStyle = '#222'; [0, 1, 2].forEach(i => { c.beginPath(); c.arc(X + W + 8, Y + 10 + i * 9, 4.5, 0, 7); c.fill(); });
        break;
      }
      case 'jkk': {
        base();
        for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { if (i === 2 && k === 0) continue; c.fillStyle = (i + k) % 2 ? sh(col, .12) : sh(col, -.06); c.fillRect(X + 4 + i * (W - 8) / 3, roofY + 4 + k * (H - 8) / 3, (W - 8) / 3 - 3, (H - 8) / 3 - 3); }
        c.fillStyle = '#F2B01E'; c.beginPath(); c.arc(X + W / 2, roofY + H / 2, 6, 0, 7); c.fill();
        // mural wall (shows player art once painted)
        if (J.state && J.state.artImg) { try { c.drawImage(J.state.artImg, X + 4, faceY + 2, W - 8, h - 3); } catch (e) {} }
        else windowsRow(c, X + 4, faceY + 5, W - 8, h - 10, 5, dark, light, false);
        break;
      }
      default: {
        base();
        windowsRow(c, X + 4, faceY + 4, W - 8, Math.max(6, h - 10), Math.round(W / 14), dark, light, false);
      }
    }
    c.fillStyle = 'rgba(52,26,18,.18)'; c.fillRect(X, Y + H - 2, W, 2);
  };

  D.statue = function (c, cx, cy, small) {
    const r = small ? 2.5 : 3;
    c.fillStyle = '#6FA35A'; c.beginPath(); c.arc(cx, cy, J.T * r, 0, 7); c.fill();
    c.strokeStyle = '#F6E6CC'; c.lineWidth = 4; c.stroke();
    c.fillStyle = '#E58A71'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; c.beginPath(); c.arc(cx + Math.cos(a) * J.T * r * .7, cy + Math.sin(a) * J.T * r * .7, 4, 0, 7); c.fill(); }
    c.fillStyle = 'rgba(52,26,18,.3)'; c.fillRect(cx - 6, cy - 4, 22, 14);
    c.fillStyle = '#D9C49A'; c.fillRect(cx - 10, cy - 10, 20, 18); c.fillStyle = '#B9A47A'; c.fillRect(cx - 10, cy + 2, 20, 6);
    if (!small) { c.fillStyle = '#4A4038'; c.beginPath(); c.ellipse(cx, cy - 18, 6, 9, 0, 0, 7); c.fill(); c.beginPath(); c.arc(cx, cy - 30, 4.5, 0, 7); c.fill(); c.fillStyle = '#6A5E52'; c.beginPath(); c.arc(cx - 1.5, cy - 31, 1.8, 0, 7); c.fill(); }
    else { c.fillStyle = '#7FB5C8'; c.beginPath(); c.arc(cx, cy - 4, 7, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.arc(cx, cy - 8, 2.5, 0, 7); c.fill(); }
  };

  D.cityGate = function (c, g) {
    const T = J.T;
    c.save();
    if (g.o === 'h') { // road vertical, wall horizontal
      const x0 = g.a0 * T - T * .6, x1 = (g.a1 + 1) * T + T * .6, y = g.c * T;
      c.fillStyle = 'rgba(52,26,18,.25)'; c.fillRect(x0 + 6, y - 14, x1 - x0, 20);
      c.fillStyle = '#D2735C'; c.fillRect(x0, y - 22, x1 - x0, 14); c.fillStyle = '#E58A71'; c.fillRect(x0, y - 30, x1 - x0, 10);
      c.fillStyle = '#F7D5C4'; c.fillRect(x0, y - 30, x1 - x0, 2);
      dome(c, x0 + 8, y - 26, 6, '#F2B39E'); dome(c, x1 - 8, y - 26, 6, '#F2B39E'); dome(c, (x0 + x1) / 2, y - 28, 7, '#F2B39E');
    } else {
      const y0 = g.a0 * T - T * .6, y1 = (g.a1 + 1) * T + T * .6, x = g.c * T;
      c.fillStyle = 'rgba(52,26,18,.25)'; c.fillRect(x + 8, y0 - 10, 26, y1 - y0);
      c.fillStyle = '#E58A71'; c.fillRect(x - 4, y0 - 24, T + 8, y1 - y0); c.fillStyle = '#D2735C'; c.fillRect(x - 4, y1 - 24, T + 8, 10);
      c.fillStyle = '#F7D5C4'; c.fillRect(x - 4, y0 - 24, T + 8, 2);
      dome(c, x + T / 2, y0 - 16, 6, '#F2B39E'); dome(c, x + T / 2, y1 - 30, 6, '#F2B39E');
    }
    c.restore();
  };

  // ---------------- illustrations for scenes / title ----------------
  D.sky = function (c, w, h, mood) {
    const g = c.createLinearGradient(0, 0, 0, h);
    if (mood === 'day') { g.addColorStop(0, '#9CCBE0'); g.addColorStop(.7, '#F6E1C2'); g.addColorStop(1, '#F6D2B0'); }
    else { g.addColorStop(0, '#2A1640'); g.addColorStop(.45, '#B04A5E'); g.addColorStop(.75, '#F0855A'); g.addColorStop(1, '#F7C26B'); }
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  };

  D.hawaArt = function (c, x, by, w, h) {
    const tiers = [[1, .25], [.94, .2], [.8, .18], [.62, .16], [.42, .14]];
    let y = by;
    tiers.forEach(([tw0, th0], i) => {
      const tw = w * tw0, th = h * th0, tx = x + (w - tw) / 2; y -= th;
      c.fillStyle = 'rgba(80,30,20,.18)'; c.fillRect(tx + 6, y + 4, tw, th);
      c.fillStyle = i % 2 ? '#E58A71' : '#DA6F57'; c.fillRect(tx, y, tw, th);
      const n = Math.max(3, Math.round(tw / (w * .055)));
      for (let j = 0; j < n; j++) {
        const cw = tw / n, wx = tx + j * cw + cw * .18, ww = cw * .64, wy = y + th * .18, wh = th * .66;
        c.fillStyle = '#FBE3D5'; rr(c, wx - 2, wy - 2, ww + 4, wh + 4, [ww, ww, 2, 2]); c.fill();
        c.fillStyle = '#9E4535'; rr(c, wx, wy, ww, wh, [ww, ww, 0, 0]); c.fill();
        c.fillStyle = '#C9604A'; c.fillRect(wx, wy + wh * .55, ww, 2);
      }
      c.fillStyle = '#F7D5C4'; c.fillRect(tx - 3, y + th - 4, tw + 6, 4);
    });
    const tw = w * .42, tx = x + (w - tw) / 2;
    for (let i = 0; i < 5; i++) { const dx = tx + tw * (.1 + i * .2); c.fillStyle = '#F2B39E'; c.beginPath(); c.arc(dx, y, tw * .07, Math.PI, 0); c.fill(); c.fillStyle = '#E2A33A'; c.fillRect(dx - 1, y - tw * .1, 2, tw * .04); }
  };

  D.skyline = function (c, w, h, t) {
    D.sky(c, w, h, 'dusk');
    const sun = c.createRadialGradient(w * .7, h * .52, 0, w * .7, h * .52, h * .35);
    sun.addColorStop(0, 'rgba(255,236,170,1)'); sun.addColorStop(.18, 'rgba(255,214,140,.9)'); sun.addColorStop(1, 'rgba(255,180,100,0)');
    c.fillStyle = sun; c.fillRect(0, 0, w, h);
    // aravalli ridge + fort walls
    c.fillStyle = '#6B2F4A'; c.beginPath(); c.moveTo(0, h * .62);
    for (let x = 0; x <= w; x += w / 24) c.lineTo(x, h * (.55 + Math.sin(x / w * 9) * .04 + Math.sin(x / w * 23) * .015));
    c.lineTo(w, h); c.lineTo(0, h); c.fill();
    c.fillStyle = '#5A2440'; for (let x = 0; x < w; x += 10) { const yy = h * (.55 + Math.sin(x / w * 9) * .04 + Math.sin(x / w * 23) * .015); c.fillRect(x, yy - 6, 6, 6); }
    // city silhouette with chhatris
    c.fillStyle = '#4A1C38'; c.beginPath(); c.moveTo(0, h);
    let x = 0; const R = (n) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
    while (x < w) { const bw = 30 + R(x) * 60, bh = h * (.12 + R(x + 1) * .14); c.lineTo(x, h - bh); c.lineTo(x + bw, h - bh); x += bw; }
    c.lineTo(w, h); c.fill();
    x = 0; while (x < w) { const bw = 30 + R(x) * 60, bh = h * (.12 + R(x + 1) * .14); if (R(x + 2) > .55) { c.beginPath(); c.arc(x + bw / 2, h - bh, bw * .2, Math.PI, 0); c.fill(); c.fillRect(x + bw / 2 - 1, h - bh - bw * .32, 2, bw * .14); } x += bw; }
    // hawa mahal silhouette, centre-left
    c.save(); c.globalAlpha = .95; D.hawaArt(c, w * .12, h * .98, Math.min(w * .28, 300), Math.min(h * .45, 260)); c.restore();
    // kites
    for (let i = 0; i < 9; i++) {
      const kx = (R(i + 7) * w + Math.sin(t * .5 + i) * 12) % w, ky = h * (.08 + R(i + 3) * .35) + Math.cos(t * .7 + i) * 8;
      const cols = ['#F2A41C', '#E0577A', '#2E3A87', '#3F8F5A', '#FFF6EC'];
      c.fillStyle = cols[i % 5]; c.beginPath(); c.moveTo(kx, ky - 9); c.lineTo(kx + 7, ky); c.lineTo(kx, ky + 9); c.lineTo(kx - 7, ky); c.fill();
      c.strokeStyle = 'rgba(255,246,236,.4)'; c.lineWidth = 1; c.beginPath(); c.moveTo(kx, ky + 9); c.quadraticCurveTo(kx + 20, ky + 60, kx - 10, h); c.stroke();
    }
    // lanterns
    for (let i = 0; i < 14; i++) {
      const lx = R(i + 40) * w, ly = h - ((t * 18 + R(i + 9) * h) % h);
      const gl = c.createRadialGradient(lx, ly, 0, lx, ly, 12); gl.addColorStop(0, 'rgba(255,200,110,.95)'); gl.addColorStop(1, 'rgba(255,160,80,0)');
      c.fillStyle = gl; c.beginPath(); c.arc(lx, ly, 12, 0, 7); c.fill();
    }
  };

  D.cafeArt = function (c, w, h, t, stage) {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#F4E3CC'); g.addColorStop(1, '#E3C7A4'); c.fillStyle = g; c.fillRect(0, 0, w, h);
    // window, top-left: the light source
    c.fillStyle = '#BFE0EC'; rr(c, w * .05, h * .08, w * .22, h * .42, [w * .11, w * .11, 4, 4]); c.fill();
    c.strokeStyle = '#8A5A3B'; c.lineWidth = 6; c.stroke();
    c.fillStyle = 'rgba(255,240,200,.35)'; c.beginPath(); c.moveTo(w * .07, h * .2); c.lineTo(w * .27, h * .15); c.lineTo(w * .7, h); c.lineTo(w * .3, h); c.fill();
    // chalk menu
    c.fillStyle = '#2F3A33'; rr(c, w * .34, h * .08, w * .3, h * .3, 6); c.fill();
    c.fillStyle = '#F6F1E7'; c.font = `${Math.round(h * .055)}px "Rozha One", serif`; c.textAlign = 'center'; c.fillText('Curious Life', w * .49, h * .17);
    c.font = `${Math.round(h * .035)}px Mukta, sans-serif`; ['Pour Over · V60', 'Cappuccino', 'Cold Brew', 'Single origin · Chikmagalur'].forEach((s, i) => c.fillText(s, w * .49, h * (.23 + i * .04)));
    // shelf with bags
    c.fillStyle = '#8A5A3B'; c.fillRect(w * .68, h * .3, w * .28, 6);
    for (let i = 0; i < 5; i++) { c.fillStyle = ['#2F5D50', '#F2A41C', '#E0577A', '#F6F1E7', '#263170'][i]; rr(c, w * .69 + i * w * .055, h * .2, w * .04, h * .1, 3); c.fill(); }
    // plants
    [[w * .3, h * .08], [w * .92, h * .08]].forEach(([px, py]) => { c.strokeStyle = '#6B4A2E'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, 0); c.lineTo(px, py); c.stroke(); c.fillStyle = '#B5603F'; rr(c, px - 12, py, 24, 16, 4); c.fill(); c.fillStyle = '#5E8C46'; for (let k = 0; k < 6; k++) { c.beginPath(); c.ellipse(px - 14 + k * 6, py + 22 + (k % 2) * 8, 4, 9, .3 * (k - 3), 0, 7); c.fill(); } });
    // roaster
    const rx = w * .78, ry = h * .42;
    c.fillStyle = '#2B2B2B'; rr(c, rx, ry, w * .16, h * .28, 8); c.fill();
    c.fillStyle = '#3A3A3A'; c.beginPath(); c.arc(rx + w * .08, ry + h * .12, h * .08, 0, 7); c.fill();
    c.fillStyle = '#B87333'; c.beginPath(); c.moveTo(rx + w * .03, ry); c.lineTo(rx + w * .13, ry); c.lineTo(rx + w * .1, ry - h * .08); c.lineTo(rx + w * .06, ry - h * .08); c.fill();
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(rx + 4, ry + 4, 3, h * .2);
    // steam from roaster
    c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 2; for (let i = 0; i < 3; i++) { c.beginPath(); const sx = rx + w * .06 + i * 8; c.moveTo(sx, ry - h * .09); c.bezierCurveTo(sx - 8, ry - h * .14 - Math.sin(t * 2 + i) * 6, sx + 8, ry - h * .18, sx, ry - h * .24); c.stroke(); }
    // barista
    if (stage !== 'seat') {
      const bx = w * .5, byy = h * .6;
      c.fillStyle = '#2F5D50'; rr(c, bx - 26, byy - 10, 52, 60, [20, 20, 4, 4]); c.fill();
      c.fillStyle = '#C68B62'; c.beginPath(); c.arc(bx, byy - 26, 18, 0, 7); c.fill();
      c.fillStyle = '#2B1B17'; c.beginPath(); c.arc(bx, byy - 32, 18, Math.PI, 0); c.fill(); c.fillRect(bx - 18, byy - 32, 4, 10);
      c.fillStyle = '#2B1B17'; c.beginPath(); c.arc(bx - 6, byy - 24, 2, 0, 7); c.arc(bx + 6, byy - 24, 2, 0, 7); c.fill();
      c.strokeStyle = '#2B1B17'; c.lineWidth = 2; c.beginPath(); c.arc(bx, byy - 20, 6, .2, Math.PI - .2); c.stroke();
    }
    // counter
    c.fillStyle = '#8A5A3B'; c.fillRect(0, h * .72, w, h * .28); c.fillStyle = '#A87449'; c.fillRect(0, h * .7, w, h * .04);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(0, h * .7, w, 2);
    // espresso machine
    const ex = w * .1, ey = h * .5;
    c.fillStyle = '#C9CED6'; rr(c, ex, ey, w * .2, h * .2, 6); c.fill(); c.fillStyle = '#9AA0A6'; c.fillRect(ex, ey + h * .12, w * .2, 4);
    c.fillStyle = '#2B2B2B'; c.fillRect(ex + w * .04, ey + h * .13, w * .03, h * .03); c.fillRect(ex + w * .12, ey + h * .13, w * .03, h * .03);
    c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(ex + 4, ey + 4, w * .2 - 8, 3);
  };

  D.food = function (c, kind, cx, cy, r, bites) { // eslint-disable-line
    c.save();
    c.fillStyle = 'rgba(52,26,18,.18)'; c.beginPath(); c.ellipse(cx + 8, cy + 10, r * 1.15, r * 1.05, 0, 0, 7); c.fill();
    c.fillStyle = kind === 'thali' ? '#C9CED6' : '#FAF6EF'; c.beginPath(); c.arc(cx, cy, r * 1.12, 0, 7); c.fill();
    c.strokeStyle = 'rgba(52,26,18,.12)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, r * .95, 0, 7); c.stroke();
    const outer = c;
    if (bites && bites.length) { const off = document.createElement('canvas'); off.width = outer.canvas.width; off.height = outer.canvas.height; c = off.getContext('2d'); }
    const blob = (x, y, rad, col) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, rad, 0, 7); c.fill(); };
    const hl = (x, y, rad) => { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.arc(x - rad * .3, y - rad * .3, rad * .3, 0, 7); c.fill(); };
    switch (kind) {
      case 'kachori': case 'kachori2': {
        blob(cx - r * .6, cy + r * .45, r * .22, '#6B3A1E'); blob(cx + r * .6, cy + r * .45, r * .22, '#4E8C3A');
        if (kind === 'kachori2') blob(cx + r * .55, cy - r * .45, r * .3, '#D9A53A');
        blob(cx - r * .05, cy - r * .1, r * .55, '#C98A3A'); blob(cx - r * .05, cy - r * .1, r * .45, '#DDA24E');
        c.fillStyle = '#B87333'; for (let i = 0; i < 9; i++) { const a = i * .7; c.beginPath(); c.arc(cx - r * .05 + Math.cos(a) * r * .28, cy - r * .1 + Math.sin(a) * r * .25, r * .04, 0, 7); c.fill(); }
        hl(cx - r * .05, cy - r * .1, r * .45); break;
      }
      case 'chai': {
        blob(cx, cy, r * .55, '#B5603F'); blob(cx, cy, r * .45, '#C8794F'); blob(cx, cy, r * .38, '#B07A4E'); blob(cx - r * .08, cy - r * .06, r * .12, '#C9976A');
        if (true) { c.fillStyle = '#E8C27E'; rr(c, cx + r * .4, cy + r * .2, r * .45, r * .3, 6); c.fill(); } break;
      }
      case 'lassi': { blob(cx, cy, r * .58, '#B5603F'); blob(cx, cy, r * .48, '#FFF8EC'); blob(cx + r * .1, cy, r * .2, '#FFF2D6'); c.fillStyle = '#F2A41C'; for (let i = 0; i < 6; i++) c.fillRect(cx - r * .2 + i * 7, cy - r * .1 + (i % 2) * 6, 3, 2); break; }
      case 'ghewar': {
        blob(cx, cy, r * .7, '#D9A24E'); c.strokeStyle = '#B87333'; c.lineWidth = 1.5;
        for (let i = 0; i < 18; i++) { c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(i / 18 * 6.28) * r * .7, cy + Math.sin(i / 18 * 6.28) * r * .7); c.stroke(); }
        for (let k = 1; k < 4; k++) { c.beginPath(); c.arc(cx, cy, r * .18 * k, 0, 7); c.stroke(); }
        blob(cx, cy, r * .42, '#F6E8C8'); c.fillStyle = '#E5E5E5'; c.fillRect(cx - r * .2, cy - r * .15, r * .35, r * .25); c.fillStyle = '#7FAE5F'; for (let i = 0; i < 7; i++) c.fillRect(cx - r * .3 + i * 8, cy + r * .15 - (i % 2) * 8, 4, 3); break;
      }
      case 'panipuri': { blob(cx + r * .45, cy + r * .4, r * .28, '#6FA35A'); blob(cx + r * .45, cy + r * .4, r * .22, '#86BC6A'); for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; blob(cx - r * .15 + Math.cos(a) * r * .38, cy - r * .1 + Math.sin(a) * r * .38, r * .17, '#E2AE5C'); hl(cx - r * .15 + Math.cos(a) * r * .38, cy - r * .1 + Math.sin(a) * r * .38, r * .17); } break; }
      case 'tikki': { blob(cx, cy, r * .65, '#A5662E'); for (let i = 0; i < 12; i++) blob(cx + Math.cos(i) * r * .4, cy + Math.sin(i * 1.3) * r * .4, r * .08, '#E2B86A'); blob(cx - r * .2, cy - r * .1, r * .26, '#C98A3A'); blob(cx + r * .2, cy + r * .1, r * .26, '#C98A3A'); c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(cx, cy, r * .3, r * .12, .5, 0, 7); c.fill(); c.fillStyle = '#4E8C3A'; for (let i = 0; i < 6; i++) c.fillRect(cx - r * .3 + i * 9, cy - r * .3 + i * 5, 3, 3); break; }
      case 'thali': { blob(cx - r * .45, cy - r * .35, r * .28, '#E2B23A'); blob(cx + r * .45, cy - r * .35, r * .28, '#D98A3A'); [[-.2, .3], [.15, .45], [.45, .2]].forEach(([a, b]) => { blob(cx + a * r, cy + b * r, r * .18, '#B07A3E'); hl(cx + a * r, cy + b * r, r * .18); }); blob(cx - r * .55, cy + r * .3, r * .2, '#E8C27E'); c.fillStyle = '#E2A33A'; c.fillRect(cx - r * .62, cy + r * .2, 4, 4); break; }
      case 'brunch': { c.fillStyle = '#D9A24E'; rr(c, cx - r * .65, cy - r * .35, r * .7, r * .55, 8); c.fill(); blob(cx + r * .3, cy - r * .1, r * .32, '#FFF8EC'); blob(cx + r * .3, cy - r * .1, r * .13, '#F2B01E'); blob(cx - r * .1, cy + r * .45, r * .22, '#E0577A'); blob(cx + r * .1, cy + r * .5, r * .12, '#6FA35A'); break; }
      default: { // coffee cup top-down with latte heart
        blob(cx, cy, r * .62, '#F6F1E7'); blob(cx, cy, r * .5, '#8A5A3B'); blob(cx, cy, r * .42, '#C49A6C');
        c.fillStyle = '#FFF8EC'; c.beginPath(); const s = r * .22; c.moveTo(cx, cy + s * .9); c.bezierCurveTo(cx - s * 1.6, cy - s * .2, cx - s * .6, cy - s * 1.3, cx, cy - s * .4); c.bezierCurveTo(cx + s * .6, cy - s * 1.3, cx + s * 1.6, cy - s * .2, cx, cy + s * .9); c.fill();
        c.strokeStyle = '#F6F1E7'; c.lineWidth = r * .1; c.beginPath(); c.arc(cx + r * .72, cy, r * .14, -1.2, 1.2); c.stroke();
      }
    }
    if (c !== outer) { c.globalCompositeOperation = 'destination-out'; bites.forEach(b => { c.beginPath(); c.arc(cx + b[0] * r * .7, cy + b[1] * r * .7, r * .3, 0, 7); c.fill(); }); outer.drawImage(c.canvas, 0, 0); c = outer; }
    c.restore();
  };

  D.stamp = function (c, kind, x, y, s, col) {
    c.save(); c.translate(x, y); c.fillStyle = col; c.strokeStyle = col; c.lineWidth = s * .06;
    switch (kind) {
      case 'keri': c.beginPath(); c.moveTo(0, s * .42); c.bezierCurveTo(-s * .45, s * .3, -s * .4, -s * .3, 0, -s * .3); c.bezierCurveTo(s * .3, -s * .3, s * .35, -s * .05, s * .15, s * .05); c.bezierCurveTo(s * .3, -s * .2, s * .45, s * .3, 0, s * .42); c.fill();
        c.fillStyle = '#FFF6EC'; c.beginPath(); c.arc(-s * .05, s * .02, s * .1, 0, 7); c.fill(); break;
      case 'phool': for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283; c.beginPath(); c.ellipse(Math.cos(a) * s * .22, Math.sin(a) * s * .22, s * .14, s * .08, a, 0, 7); c.fill(); }
        c.fillStyle = '#FFF6EC'; c.beginPath(); c.arc(0, 0, s * .09, 0, 7); c.fill(); break;
      case 'haathi': c.beginPath(); c.ellipse(-s * .05, 0, s * .28, s * .19, 0, 0, 7); c.fill(); c.beginPath(); c.arc(s * .25, -s * .08, s * .13, 0, 7); c.fill();
        c.beginPath(); c.moveTo(s * .35, -s * .02); c.quadraticCurveTo(s * .45, s * .2, s * .32, s * .32); c.lineWidth = s * .07; c.stroke();
        for (let i = 0; i < 4; i++) c.fillRect(-s * .28 + i * s * .14, s * .1, s * .08, s * .2);
        c.fillStyle = '#FFF6EC'; c.beginPath(); c.arc(s * .27, -s * .12, s * .025, 0, 7); c.fill(); break;
      case 'mor': for (let i = 0; i < 7; i++) { const a = -2.6 + i * .35; c.beginPath(); c.arc(Math.cos(a) * s * .3 - s * .1, Math.sin(a) * s * .3 + s * .1, s * .07, 0, 7); c.fill(); }
        c.beginPath(); c.ellipse(s * .05, s * .12, s * .1, s * .16, .4, 0, 7); c.fill(); c.beginPath(); c.moveTo(s * .08, 0); c.quadraticCurveTo(s * .2, -s * .2, s * .14, -s * .3); c.lineWidth = s * .05; c.stroke();
        c.beginPath(); c.arc(s * .14, -s * .32, s * .05, 0, 7); c.fill(); break;
    }
    c.restore();
  };
})(window.J);
