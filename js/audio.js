/* Tiny WebAudio synth: engine hum, horn, siren, crunch, chimes, and a slow raag drone. No files. */
(function (J) {
  const A = J.audio = { on: true, music: true };
  let ctx, master, eng, engGain, engFilter, siren, sirenGain, musicGain, nextNote = 0;
  A.init = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination);
    eng = ctx.createOscillator(); eng.type = 'sawtooth'; engFilter = ctx.createBiquadFilter(); engFilter.type = 'lowpass'; engFilter.frequency.value = 400;
    engGain = ctx.createGain(); engGain.gain.value = 0; eng.connect(engFilter); engFilter.connect(engGain); engGain.connect(master); eng.start();
    siren = ctx.createOscillator(); siren.type = 'triangle'; sirenGain = ctx.createGain(); sirenGain.gain.value = 0; siren.connect(sirenGain); sirenGain.connect(master); siren.start();
    musicGain = ctx.createGain(); musicGain.gain.value = .22; musicGain.connect(master);
    // tanpura-ish drone
    [130.81, 196, 261.63].forEach((f, i) => { const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f; const g = ctx.createGain(); g.gain.value = i === 1 ? .05 : .04; o.connect(g); g.connect(musicGain); o.start(); });
  };
  A.engine = function (speedRatio, type, active) {
    if (!ctx) return;
    const two = type === 'scooty' || type === 'bike' || type === 'police';
    const base = type === 'bike' ? 42 : type === 'auto' ? 58 : two ? 90 : 55;
    eng.frequency.setTargetAtTime(base + speedRatio * (two ? 140 : 110), ctx.currentTime, .08);
    engFilter.frequency.setTargetAtTime(300 + speedRatio * 900, ctx.currentTime, .1);
    engGain.gain.setTargetAtTime(active && A.on ? .05 + speedRatio * .06 : 0, ctx.currentTime, .1);
  };
  A.siren = function (on) {
    if (!ctx) return;
    sirenGain.gain.setTargetAtTime(on && A.on ? .035 : 0, ctx.currentTime, .1);
    if (on) siren.frequency.setValueAtTime(700 + Math.sin(ctx.currentTime * 7) * 180, ctx.currentTime);
  };
  function tone(f, d, type, vol, when, dest) {
    if (!ctx || !A.on) return;
    const t = ctx.currentTime + (when || 0), o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol || .2, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + d);
    o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + d + .05);
  }
  function noise(d, vol, freq) {
    if (!ctx || !A.on) return;
    const len = ctx.sampleRate * d, b = ctx.createBuffer(1, len, ctx.sampleRate), data = b.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = freq || 1200; g.gain.value = vol || .3; s.buffer = b; s.connect(f); f.connect(g); g.connect(master); s.start();
  }
  A.horn = (type) => { const f = type === 'auto' ? 520 : type === 'scooty' ? 620 : 410; tone(f, .16, 'square', .09); tone(f * 1.26, .16, 'square', .07); tone(f, .2, 'square', .09, .22); tone(f * 1.26, .2, 'square', .07, .22); };
  A.thud = () => { tone(70, .25, 'sine', .35); noise(.15, .25, 300); };
  A.crunch = () => { noise(.12, .5, 2500); noise(.1, .3, 1500); };
  A.pour = () => noise(.6, .12, 800);
  A.moo = () => { tone(140, .7, 'sawtooth', .06); tone(110, .7, 'sine', .1, .05); };
  A.chime = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, .5, 'triangle', .12, i * .09));
  A.click = () => tone(880, .06, 'square', .05);
  A.shutter = () => { noise(.05, .5, 4000); tone(1200, .05, 'square', .05, .05); };
  A.fail = () => [392, 330, 262].forEach((f, i) => tone(f, .4, 'sawtooth', .07, i * .18));
  A.pass = () => [392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, .6, 'triangle', .13, i * .11));
  A.ring = () => { for (let i = 0; i < 2; i++) { tone(1320, .12, 'sine', .08, i * .3); tone(1480, .12, 'sine', .08, i * .3 + .13); } };
  // Raag Bhoopali-ish plucks: Sa Re Ga Pa Dha
  const NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33];
  A.tick = function () {
    if (!ctx || !A.music || !A.on) return;
    if (ctx.currentTime < nextNote) return;
    nextNote = ctx.currentTime + .45 + Math.random() * .9;
    const f = NOTES[Math.random() * NOTES.length | 0];
    tone(f, 1.2, 'triangle', .08, 0, musicGain); if (Math.random() < .3) tone(f * 2, .8, 'sine', .03, .05, musicGain);
  };
  A.setMusic = (on) => { A.music = on; if (musicGain) musicGain.gain.value = on ? .22 : 0; };
})(window.J);
