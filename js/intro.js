/* ============================================================
   WEBOPS STUDIO — intro.js v1.0
   Home page radar intro. Vanilla JS · Canvas · Zero Frameworks

   Sequence (about 4.7s before the hero rises):
     0.0s  range rings and bearing ticks fade in
     0.5s  sweep 1: blips ping in the shape of the logo + wordmark
     1.7s  sweep 2: blips sharpen into the real artwork behind the arm
     2.9s  target locked, logo holds for 1.8s
     4.7s  overlay fades, hero entrance animation starts

   Plays once per browser session. The tiny inline script in
   index.html <head> decides whether it runs (adds .intro-on and
   .intro-hold to <html>), skips it for reduced-motion visitors,
   and removes both classes after 9s as a failsafe.
   Tap, click, scroll, Escape, or the Skip button ends it early.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var intro = document.getElementById('intro');
  if (!intro || !root.classList.contains('intro-on')) return;

  var cv = intro.querySelector('.intro__canvas');
  var ctx = cv && cv.getContext ? cv.getContext('2d') : null;
  var hudBrg = intro.querySelector('.intro__brg');
  var hudCon = intro.querySelector('.intro__con');
  var skipBtn = intro.querySelector('.intro__skip');

  var KEY = 'webopsIntroSeen';
  var ORANGE = '#E8620A', ORANGE_LT = '#FF7B26';
  var TWO = Math.PI * 2, LAG = 0.35;

  // Timeline (ms)
  var T0 = 500, REV = 1200, HOLD = 1800, FADE = 500;
  var T_DONE = T0 + 2 * REV, T_HAND = T_DONE + HOLD, T_END = T_HAND + FADE;

  // Artwork: source rectangles inside the existing site images (trimmed to the ink)
  var ART = {
    mark: { src: 'images/webops-mark.webp',   sx: 30,  sy: 70,  sw: 201, sh: 109 },
    word: { src: 'images/webops-lockup.webp', sx: 585, sy: 133, sw: 468, sh: 124 }
  };

  var W = 0, H = 0, dpr = 1, rects = [], artBottom = 0, parts = [], contacts = 0, prevA = -1;
  var imgs = {}, raf = 0, t0 = 0, running = false, ended = false;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pad3(n) { n = String(n); while (n.length < 3) n = '0' + n; return n; }

  /* ---------- end states ---------- */
  function release() {
    // overlay fully gone, hero free to animate
    root.classList.remove('intro-hold', 'intro-on');
  }

  function handoff() {
    root.classList.remove('intro-hold');   // hero entrance starts now
    intro.classList.add('is-out');         // overlay fades over the hero
  }

  function stop() { running = false; cancelAnimationFrame(raf); }

  function finish() {
    if (ended) return;
    ended = true;
    stop();
    handoff();
    setTimeout(release, 480);
  }

  function bail() {
    // something we need is missing: get out of the way without a show
    ended = true;
    stop();
    release();
  }

  /* ---------- layout ---------- */
  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);

    var mA = ART.mark.sw / ART.mark.sh, wA = ART.word.sw / ART.word.sh, gap = 22;
    var mw = Math.min(W * 0.52, 300, H * 0.26 * mA), mh = mw / mA;
    var ww = Math.min(W * 0.8, 560), wh = ww / wA;
    var top = H / 2 - (mh + gap + wh) / 2;
    rects = [
      { k: 'mark', x: W / 2 - mw / 2, y: top, w: mw, h: mh },
      { k: 'word', x: W / 2 - ww / 2, y: top + mh + gap, w: ww, h: wh }
    ];
    artBottom = top + mh + gap + wh;
  }

  function drawArt(c) {
    for (var i = 0; i < rects.length; i++) {
      var r = rects[i], a = ART[r.k];
      c.drawImage(imgs[r.k], a.sx, a.sy, a.sw, a.sh, r.x, r.y, r.w, r.h);
    }
  }

  function angleOf(x, y) { // clockwise from straight up, 0..2PI
    var a = Math.atan2(x - W / 2, -(y - H / 2));
    return a < 0 ? a + TWO : a;
  }

  function buildParts() {
    var off = document.createElement('canvas'); off.width = W; off.height = H;
    var o = off.getContext('2d', { willReadFrequently: true });
    drawArt(o);
    var d = o.getImageData(0, 0, W, H).data, filled = 0, i, x, y;
    for (i = 3; i < d.length; i += 4) if (d[i] > 128) filled++;
    var N = W < 520 ? 650 : 1700;            // fewer blips on phones keeps it smooth
    var step = Math.max(2, Math.floor(Math.sqrt(filled / N)));
    parts = [];
    for (y = 0; y < H; y += step) for (x = 0; x < W; x += step) {
      if (d[(y * W + x) * 4 + 3] > 128) {
        var px = x + (Math.random() - .5) * step * .8, py = y + (Math.random() - .5) * step * .8;
        parts.push({ x: px, y: py, ang: angleOf(px, py), s: 1.4 + Math.random() * 1.1, noise: false, last: -1e9, seen: false });
      }
    }
    // a few stray contacts, like real radar clutter
    for (i = 0; i < (W < 520 ? 22 : 46); i++) {
      var nx = Math.random() * W, ny = Math.random() * H;
      parts.push({ x: nx, y: ny, ang: angleOf(nx, ny), s: 2.2 + Math.random() * 1.2, noise: true, last: -1e9, seen: false });
    }
    contacts = 0; prevA = -1;
  }

  /* ---------- drawing ---------- */
  function drawGrid(cx, cy, alpha) {
    if (alpha <= 0) return;
    var R = Math.min(W, H) * 0.46, i, a, r;
    var rings = [0.25, 0.5, 0.75, 1, 1.5, 2];
    ctx.globalAlpha = alpha; ctx.lineWidth = 1;
    for (i = 0; i < rings.length; i++) {
      r = R * rings[i];
      ctx.strokeStyle = rings[i] === 1 ? 'rgba(232,98,10,0.34)' : 'rgba(244,240,232,0.09)';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TWO); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(244,240,232,0.07)';
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
    ctx.strokeStyle = 'rgba(244,240,232,0.30)';
    ctx.beginPath();
    for (i = 0; i < 36; i++) {
      a = i * Math.PI / 18 - Math.PI / 2;
      var len = i % 3 === 0 ? 12 : 6;
      ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      ctx.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len));
    }
    ctx.stroke();
    ctx.font = '500 10px "Roboto Mono", ui-monospace, monospace';
    ctx.fillStyle = 'rgba(244,240,232,0.45)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('000', cx, cy - R - 22); ctx.fillText('180', cx, cy + R + 22);
    ctx.fillText('090', cx + R + 24, cy); ctx.fillText('270', cx - R - 24, cy);
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    var e = now - t0, i, p;
    var cx = W / 2, cy = H / 2, Rbig = Math.hypot(W, H);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    var curA = clamp((e - T0) / REV * TWO, 0, 2 * TWO);
    var gridA = clamp(e / 500, 0, 1) * (e > T_DONE ? 1 - 0.55 * clamp((e - T_DONE) / 400, 0, 1) : 1);
    drawGrid(cx, cy, gridA);

    // A blip pings when the arm's total angle crosses its bearing (once per sweep, two sweeps)
    if (curA > prevA) {
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        for (var k = 0; k < 2; k++) {
          var tgt = p.ang + k * TWO;
          if (prevA < tgt && tgt <= curA) { p.last = e; if (!p.seen) { p.seen = true; if (!p.noise) contacts++; } }
        }
      }
      prevA = curA;
    }

    // How far round the crisp artwork has been revealed on sweep 2 (trails the arm slightly)
    var a2 = clamp(curA - TWO, 0, TWO), revealEnd;
    if (e < T_DONE) revealEnd = Math.max(a2 - LAG, 0);
    else revealEnd = Math.min(TWO, a2 - LAG + clamp((e - T_DONE) / 150, 0, 1) * LAG);
    var done = revealEnd >= TWO - 0.001;

    if (!done) {
      for (i = 0; i < parts.length; i++) {
        p = parts[i];
        if (!p.seen || p.ang < revealEnd) continue;
        var dt = e - p.last, floor = p.noise ? 0 : 0.3;
        var b = floor + (1 - floor) * Math.exp(-dt / (p.noise ? 300 : 380));
        if (b < 0.02) continue;
        if (dt < 150) {
          var gs = p.s * 3.4;
          ctx.globalAlpha = 0.3 * (1 - dt / 150); ctx.fillStyle = ORANGE;
          ctx.fillRect(p.x - gs / 2, p.y - gs / 2, gs, gs);
        }
        var sz = p.s * (1 + 0.9 * Math.exp(-dt / 110));
        ctx.globalAlpha = b; ctx.fillStyle = dt < 220 ? ORANGE_LT : ORANGE;
        ctx.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      }
      ctx.globalAlpha = 1;
    }

    if (revealEnd > 0.001) {
      if (done) drawArt(ctx);
      else {
        ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, Rbig, -Math.PI / 2, -Math.PI / 2 + revealEnd); ctx.closePath();
        ctx.clip(); drawArt(ctx); ctx.restore();
      }
    }

    // Sweep arm: fading trail + line
    var armAlpha = e < T0 ? 0 : (e < T_DONE ? 1 : 1 - clamp((e - T_DONE) / 300, 0, 1));
    if (armAlpha > 0) {
      var ac = -Math.PI / 2 + curA;
      ctx.globalAlpha = armAlpha;
      if (ctx.createConicGradient) {
        var g = ctx.createConicGradient(ac - 1.22, cx, cy);
        g.addColorStop(0, 'rgba(232,98,10,0)');
        g.addColorStop(0.1944, 'rgba(232,98,10,0.32)');
        g.addColorStop(0.1946, 'rgba(232,98,10,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ac) * Rbig, cy + Math.sin(ac) * Rbig); ctx.stroke();
      ctx.fillStyle = ORANGE; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, TWO); ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (done) {
      var ta = clamp((e - T_DONE - 150) / 250, 0, 1);
      ctx.globalAlpha = ta * 0.8; ctx.fillStyle = ORANGE;
      ctx.font = '500 ' + (W < 520 ? 10 : 12) + 'px "Roboto Mono", ui-monospace, monospace';
      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.fillText('HAND-CODED  ·  VETERAN-BUILT  ·  MINNESOTA', W / 2, artBottom + 30);
      ctx.globalAlpha = 1;
    }

    if (hudBrg) {
      if (e < T0) hudBrg.textContent = 'STANDBY';
      else if (e < T_DONE) hudBrg.textContent = 'BRG ' + pad3(Math.round(((curA % TWO) / TWO) * 360) % 360) + '°';
      else hudBrg.textContent = 'TARGET LOCKED';
    }
    if (hudCon) hudCon.textContent = 'CONTACTS ' + contacts;

    if (e >= T_HAND && !intro.classList.contains('is-out')) handoff();
    if (e >= T_END) { ended = true; stop(); release(); return; }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (ended) return;
    try {
      layout(); buildParts();
    } catch (err) { bail(); return; }
    try { sessionStorage.setItem(KEY, '1'); } catch (err) { /* private mode: plays again next load, harmless */ }
    running = true; t0 = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- boot ---------- */
  if (!ctx || document.hidden) { bail(); return; }

  // Ways to end it early
  if (skipBtn) skipBtn.addEventListener('click', function (ev) { ev.stopPropagation(); finish(); });
  intro.addEventListener('click', finish);
  intro.addEventListener('wheel', finish, { passive: true });
  intro.addEventListener('touchmove', finish, { passive: true });
  document.addEventListener('keydown', function (ev) {
    if (ended) return;
    var k = ev.key;
    if (k === 'Escape' || k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'PageDown') finish();
  });

  // Phone rotation or a real width change mid-intro: rebuild and restart the sweep.
  // Height-only changes (the mobile address bar showing or hiding) are ignored.
  var rt;
  window.addEventListener('resize', function () {
    if (!running || window.innerWidth === W) return;
    clearTimeout(rt);
    rt = setTimeout(function () { stop(); start(); }, 150);
  });

  // Wait for the logo images (already used by the nav, so usually cached)
  var pending = 2, failed = false;
  function loaded() { if (--pending === 0) { if (failed) bail(); else start(); } }
  Object.keys(ART).forEach(function (k) {
    var im = new Image();
    im.onload = loaded;
    im.onerror = function () { failed = true; loaded(); };
    im.src = ART[k].src;
    imgs[k] = im;
  });
  setTimeout(function () { if (!running && !ended) bail(); }, 2500);
})();
