/* ============================================================
   WEBOPS STUDIO — workshop.js v1.0
   Workshop page only. Vanilla JS, zero libraries.

   How this file is built:
   - Every demo is one self-contained function, started by register().
   - register() wraps each start in try/catch. If one demo throws, that
     card shows a calm fallback message and the other eleven keep working.
   - "View code" shows each demo's real source: the function text itself
     (Function.prototype.toString) and its real CSS rules from the
     stylesheet. Nothing on display is a copy that could drift.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------
     Demo registry + failure isolation
     --------------------------------------------------------- */
  function register(id, start) {
    var card = document.getElementById(id);
    if (!card) return;
    try {
      start(card);
    } catch (err) {
      card.classList.add('is-fallback');
      if (window.console) console.warn('[workshop] ' + id + ' fell back:', err);
    }
    try { codeViewer(card, start); } catch (e) { /* the code panel is a bonus, never a blocker */ }
  }

  /* ---------------------------------------------------------
     View code: real source + hand-rolled syntax highlighting
     --------------------------------------------------------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  // Strip the shared leading indentation so code reads flush-left.
  function dedent(src) {
    var lines = src.split('\n');
    var min = Infinity;
    lines.slice(1).forEach(function (l) {
      if (l.trim()) min = Math.min(min, l.match(/^ */)[0].length);
    });
    if (!isFinite(min)) return src;
    return lines.map(function (l, i) { return i ? l.slice(min) : l; }).join('\n');
  }

  var JS_TOKENS = new RegExp([
    '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)',                                   // 1 comments
    '(`(?:[^`\\\\]|\\\\.)*`|\'(?:[^\'\\\\\\n]|\\\\.)*\'|"(?:[^"\\\\\\n]|\\\\.)*")', // 2 strings
    '\\b(var|let|const|function|return|if|else|for|while|of|in|new|try|catch|throw|async|await|this|null|true|false|typeof|break|continue|switch|case|default)\\b', // 3 keywords
    '\\b(\\d+(?:\\.\\d+)?)\\b',                                                  // 4 numbers
    '([A-Za-z_$][\\w$]*)(?=\\s*\\()'                                             // 5 function calls
  ].join('|'), 'g');
  var JS_CLASS = [null, 't-c', 't-s', 't-k', 't-n', 't-f'];

  var CSS_TOKENS = /(@[\w-]+)|("[^"]*"|'[^']*')|(--[\w-]+)|([\w-]+)(?=: )|(-?\d*\.?\d+(?:px|rem|em|%|s|ms|deg|vw|vh|dvh|fr|cqi)?)\b/g;
  var CSS_CLASS = [null, 't-a', 't-s', 't-a', 't-p', 't-n'];

  function highlight(src, re, classes) {
    var out = '', last = 0, m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      if (!m[0]) { re.lastIndex++; continue; }
      var g = 1;
      while (m[g] === undefined) g++;
      out += esc(src.slice(last, m.index)) + '<span class="' + classes[g] + '">' + esc(m[0]) + '</span>';
      last = re.lastIndex;
    }
    return out + esc(src.slice(last));
  }

  // Collect this demo's real CSS rules from the live stylesheet, matched by block prefix.
  function cssFor(prefixes) {
    var sheet = [].slice.call(document.styleSheets).find(function (s) { return s.href && s.href.indexOf('workshop.css') > -1; });
    if (!sheet || !prefixes) return '';
    var tests = prefixes.split(',').map(function (p) {
      var name = p.trim().replace(/^\./, '');
      return { sel: new RegExp('\\.' + name + '(?![\\w]|-[a-z])|\\.' + name + '(?=__|--)'), kf: name + '-' };
    });
    function wanted(rule) {
      if (rule.selectorText) return tests.some(function (t) { return t.sel.test(rule.selectorText); });
      if (rule.name) return tests.some(function (t) { return rule.name.indexOf(t.kf) === 0; });
      return false;
    }
    // @media / @container / @supports wrap other rules. (Style rules also expose cssRules in browsers with CSS nesting.)
    function isGroup(rule) { return !rule.selectorText && !rule.name && !!rule.cssRules; }
    function fmt(rule, pad) {
      if (isGroup(rule)) { // keep only the matching rules inside
        var inner = [].slice.call(rule.cssRules).filter(wanted).map(function (r) { return fmt(r, pad + '  '); });
        if (!inner.length) return '';
        var head = rule.cssText.slice(0, rule.cssText.indexOf('{')).trim();
        return pad + head + ' {\n' + inner.join('\n') + '\n' + pad + '}';
      }
      var text = rule.cssText;
      var open = text.indexOf('{');
      var body = text.slice(open + 1, text.lastIndexOf('}')).trim();
      if (rule.name) { // @keyframes: one step per line
        return pad + text.slice(0, open).trim() + ' {\n' + [].slice.call(rule.cssRules).map(function (k) { return pad + '  ' + k.cssText; }).join('\n') + '\n' + pad + '}';
      }
      var decls = body.split(/;\s*(?=[\w-]+:|$)/).filter(Boolean).map(function (d) { return pad + '  ' + d.trim() + ';'; });
      return pad + text.slice(0, open).trim() + ' {\n' + decls.join('\n') + '\n' + pad + '}';
    }
    var out = [];
    [].slice.call(sheet.cssRules).forEach(function (r) {
      if (wanted(r) || isGroup(r)) { var t = fmt(r, ''); if (t) out.push(t); }
    });
    return out.join('\n\n');
  }

  function codeViewer(card, start) {
    var btn = card.querySelector('.demo__code-btn');
    if (!btn) return;
    var panel = null, current = 'js', sources = {};

    function build() {
      sources.js = '// ' + card.id + ': the exact function running this demo\n' + dedent(start.toString());
      sources.css = cssFor(card.getAttribute('data-css'));
      panel = document.createElement('div');
      panel.className = 'code';
      panel.id = card.id + '-code';
      panel.innerHTML =
        '<div class="code__bar"><div class="code__tabs" role="tablist" aria-label="Source language">' +
        '<button type="button" role="tab" aria-selected="true" data-lang="js">JavaScript</button>' +
        (sources.css ? '<button type="button" role="tab" aria-selected="false" data-lang="css">CSS</button>' : '') +
        '</div><button type="button" class="code__copy">Copy</button></div>' +
        '<pre class="code__pre" tabindex="0"><code></code></pre>' +
        '<p class="code__note">Pulled live from this page. This is the code you just used.</p>';
      var host = card.querySelector('.ws-hero__inner') || card;
      host.appendChild(panel);
      btn.setAttribute('aria-controls', panel.id);
      show('js');
      panel.querySelector('.code__tabs').addEventListener('click', function (e) {
        var t = e.target.closest('[data-lang]');
        if (t) show(t.getAttribute('data-lang'));
      });
      var copy = panel.querySelector('.code__copy');
      copy.addEventListener('click', function () {
        var done = function (msg) { copy.textContent = msg; setTimeout(function () { copy.textContent = 'Copy'; }, 1500); };
        if (navigator.clipboard) navigator.clipboard.writeText(sources[current]).then(function () { done('Copied'); }, function () { done('Select to copy'); });
        else done('Select to copy');
      });
    }
    function show(lang) {
      current = lang;
      var code = panel.querySelector('code');
      code.innerHTML = lang === 'css' ? highlight(sources.css, CSS_TOKENS, CSS_CLASS) : highlight(sources.js, JS_TOKENS, JS_CLASS);
      panel.querySelectorAll('[data-lang]').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-lang') === lang)); });
      panel.querySelector('.code__pre').scrollTop = 0;
    }
    btn.addEventListener('click', function () {
      if (!panel) build();
      else panel.hidden = !panel.hidden;
      var open = !panel.hidden;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Hide code' : 'View code';
    });
  }

  /* =========================================================
     DEMO 12 · Typewriter (hero headline)
     ========================================================= */
  register('demo-type', function typewriter(card) {
    var out = card.querySelector('.tw__text');
    var phrases = ['Touch the work.', 'Drag it.', 'Break it.', 'Read the code.', 'Touch the work.'];
    if (REDUCED) { out.textContent = phrases[phrases.length - 1]; return; }

    var p = 0, i = phrases[0].length, deleting = true;
    function tick() {
      var word = phrases[p];
      i += deleting ? -1 : 1;
      out.textContent = word.slice(0, i);

      var wait = deleting ? 38 : 70 + Math.random() * 60; // humans don't type at a fixed speed
      if (!deleting && i === word.length) {
        if (p === phrases.length - 1) return; // land on the real headline and stop
        deleting = true; wait = 1300;
      } else if (deleting && i === 0) {
        deleting = false; p++; wait = 280;
      }
      setTimeout(tick, wait);
    }
    setTimeout(tick, 1600); // let the visitor read the first line before it starts
  });

  /* =========================================================
     DEMO 01 · Particle W
     ========================================================= */
  register('demo-w', function particleW(card) {
    var cv = card.querySelector('.wband__canvas');
    var ctx = cv.getContext('2d');
    if (!ctx) throw new Error('No canvas support');
    var readout = card.querySelector('.wband__readout');
    var hint = card.querySelector('.wband__hint');

    // The W, traced from the logo: four shapes in the logo's own coordinates. Group 0 = cream, 1 = orange.
    var SHAPES = [
      [0, [[235, 535], [372, 535], [755, 1232], [687, 1350]]],
      [0, [[972, 540], [1358, 1232], [1292, 1350], [968, 762], [775, 1097], [716, 985]]],
      [0, [[960, 1008], [1022, 1118], [890, 1348], [832, 1236]]],
      [1, [[1605, 535], [1742, 535], [1407, 1158], [1349, 1033]]]
    ];
    var BOX = { x: 235, y: 535, w: 1507, h: 815 };
    var COLORS = ['#F4F0E8', '#FF7B26'];

    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, N = 0, x, y, vx, vy, tx, ty, grp;
    var ptr = { x: -9999, y: -9999, on: false };
    var running = false, visible = false, last = 0, frames = 0, fpsT = 0;

    // Draw the logo offscreen, then sample filled pixels as particle targets.
    function buildTargets() {
      var sc = Math.min(W * 0.78 / BOX.w, H * 0.7 / BOX.h);
      var ox = (W - BOX.w * sc) / 2 - BOX.x * sc;
      var oy = (H - BOX.h * sc) / 2 - BOX.y * sc;
      var off = document.createElement('canvas');
      off.width = Math.ceil(W); off.height = Math.ceil(H);
      var o = off.getContext('2d');
      SHAPES.forEach(function (s) {
        o.fillStyle = s[0] ? '#ff0000' : '#00ff00';
        o.beginPath();
        s[1].forEach(function (p, i) { var px = p[0] * sc + ox, py = p[1] * sc + oy; if (i) o.lineTo(px, py); else o.moveTo(px, py); });
        o.closePath(); o.fill();
      });
      var d = o.getImageData(0, 0, off.width, off.height).data, pts = [];
      for (var j = 0; j < off.height; j += 2) for (var i = 0; i < off.width; i += 2) {
        var k = (j * off.width + i) * 4;
        if (d[k + 3] > 128) pts.push([i, j, d[k] > 128 ? 1 : 0]);
      }
      return pts;
    }

    function resize() {
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var pts = buildTargets();
      if (!pts.length) return;
      N = Math.min(pts.length, W < 520 ? 700 : 1800); // fewer particles on phones keeps it smooth
      var first = !x;
      var nx = new Float32Array(N), ny = new Float32Array(N);
      tx = new Float32Array(N); ty = new Float32Array(N); grp = new Uint8Array(N);
      for (var i = 0; i < N; i++) {
        var p = pts[(Math.random() * pts.length) | 0];
        tx[i] = p[0]; ty[i] = p[1]; grp[i] = p[2];
        nx[i] = first || x[i] === undefined ? Math.random() * W : x[i];
        ny[i] = first || y[i] === undefined ? Math.random() * H : y[i];
      }
      x = nx; y = ny; vx = new Float32Array(N); vy = new Float32Array(N);
      if (REDUCED) { x.set(tx); y.set(ty); draw(); }
    }

    // The heart of it: spring toward home, get pushed by the pointer, drift a little.
    function step(t, dt) {
      var R = Math.min(W, 520) * 0.16, R2 = R * R;
      for (var i = 0; i < N; i++) {
        var ax = (tx[i] - x[i]) * 0.045;
        var ay = (ty[i] - y[i]) * 0.045;
        if (ptr.on) {
          var dx = x[i] - ptr.x, dy = y[i] - ptr.y, d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 0.01) {
            var f = 1 - Math.sqrt(d2) / R;
            var m = f * f * 9 / Math.sqrt(d2);
            ax += dx * m; ay += dy * m;
          }
        }
        ax += Math.sin(t * 0.0012 + i) * 0.012;
        ay += Math.cos(t * 0.0010 + i * 1.3) * 0.012;
        vx[i] = (vx[i] + ax * dt) * 0.88;
        vy[i] = (vy[i] + ay * dt) * 0.88;
        x[i] += vx[i] * dt;
        y[i] += vy[i] * dt;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var s = W < 520 ? 1.7 : 2;
      for (var g = 0; g < 2; g++) { // one fill per color: two draw calls per frame, not 1,800
        ctx.fillStyle = COLORS[g];
        ctx.beginPath();
        for (var i = 0; i < N; i++) if (grp[i] === g) ctx.rect(x[i] - s / 2, y[i] - s / 2, s, s);
        ctx.fill();
      }
    }

    function frame(t) {
      if (!running) return;
      var dt = Math.min((t - last) / 16.67, 2.5) || 1;
      last = t;
      step(t, dt); draw();
      frames++;
      if (t - fpsT > 500) { readout.textContent = N + ' particles · ' + Math.round(frames * 1000 / (t - fpsT)) + ' fps'; frames = 0; fpsT = t; }
      requestAnimationFrame(frame);
    }
    function start() { if (running || REDUCED || !visible || !N) return; running = true; last = fpsT = performance.now(); requestAnimationFrame(frame); }
    function stop() { running = false; }

    function at(e) { var r = cv.getBoundingClientRect(); ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.on = true; hint.style.opacity = 0; }
    cv.addEventListener('pointermove', at);
    cv.addEventListener('pointerdown', at);
    ['pointerleave', 'pointerup', 'pointercancel'].forEach(function (t) { cv.addEventListener(t, function () { ptr.on = false; }); });

    card.querySelector('.wband__scatter').addEventListener('click', function () {
      for (var i = 0; i < N; i++) { var a = Math.random() * 6.283, s = 6 + Math.random() * 16; vx[i] += Math.cos(a) * s; vy[i] += Math.sin(a) * s; }
      hint.style.opacity = 0;
    });

    // Only animate while on screen. Off screen it costs nothing.
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); else stop(); }).observe(cv);
    else visible = true;
    var rT;
    window.addEventListener('resize', function () { clearTimeout(rT); rT = setTimeout(resize, 150); });
    resize();
    if (REDUCED) { readout.textContent = 'Motion reduced · still logo'; hint.textContent = ''; card.querySelector('.wband__scatter').hidden = true; }
    else start();
  });

  /* =========================================================
     DEMO 02 · Before / After slider
     ========================================================= */
  register('demo-ba', function beforeAfter(card) {
    var stage = card.querySelector('.ba');
    var range = card.querySelector('.ba__range');

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      stage.style.setProperty('--pos', pct + '%'); // CSS clip-path does the actual reveal
      range.value = Math.round(pct);
    }
    function fromPointer(e) {
      var r = stage.getBoundingClientRect();
      set((e.clientX - r.left) / r.width * 100);
    }

    var dragging = false;
    stage.addEventListener('pointerdown', function (e) { dragging = true; stage.setPointerCapture(e.pointerId); fromPointer(e); });
    stage.addEventListener('pointermove', function (e) { if (dragging) fromPointer(e); });
    ['pointerup', 'pointercancel'].forEach(function (t) { stage.addEventListener(t, function () { dragging = false; }); });
    range.addEventListener('input', function () { set(+range.value); }); // keyboard: arrow keys move it

    // A one-time nudge when it first scrolls into view, so people know it moves.
    if (REDUCED || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) {
      if (!en[0].isIntersecting) return;
      io.disconnect();
      var t0 = performance.now();
      (function sweep(t) {
        var k = (t - t0) / 1400;
        if (k >= 1 || dragging) { if (!dragging) set(50); return; }
        set(50 + Math.sin(k * Math.PI * 2) * 18);
        requestAnimationFrame(sweep);
      })(t0);
    }, { threshold: 0.6 });
    io.observe(stage);
  });

  /* =========================================================
     DEMO 03 · Live speed meter (real numbers from this visit)
     ========================================================= */
  register('demo-speed', function speedMeter(card) {
    var perf = window.performance;
    if (!perf || !perf.getEntriesByType || !perf.getEntriesByType('navigation').length) throw new Error('No Navigation Timing');

    var $ = function (k) { return card.querySelector('[data-k="' + k + '"]'); };
    var lcp = 0;
    try { // Largest Contentful Paint: when the biggest thing on screen finished drawing
      new PerformanceObserver(function (list) {
        var e = list.getEntries(); lcp = e[e.length - 1].startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) { /* not supported in this browser: we say so instead of guessing */ }

    var sec = function (ms) { return ms > 0 ? (ms / 1000).toFixed(2) + 's' : 'n/a'; };

    function measure() {
      var nav = perf.getEntriesByType('navigation')[0];
      var files = perf.getEntriesByType('resource');
      var load = nav.loadEventEnd - nav.startTime;

      var sent = nav.transferSize || 0, raw = nav.encodedBodySize || 0;
      files.forEach(function (f) { sent += f.transferSize || 0; raw += f.encodedBodySize || 0; });
      var cached = sent < 2048; // a repeat visit pulls from cache, so we report what the page weighs instead

      $('ttfb').textContent = sec(nav.responseStart - nav.startTime);
      $('dom').textContent = sec(nav.domContentLoadedEventEnd - nav.startTime);
      $('lcp').textContent = lcp ? sec(lcp) : 'n/a';
      $('kb').textContent = Math.round((cached ? raw : sent) / 1024) + ' KB' + (cached ? ' (cached)' : '');
      $('req').textContent = String(files.length + 1);
      var c = navigator.connection;
      $('net').textContent = c && c.effectiveType ? c.effectiveType.toUpperCase() : 'n/a';

      card.querySelector('.sm__val').textContent = sec(load);
      var pct = Math.min(load / 4000, 1) * 100; // gauge runs 0 to 4 seconds
      card.querySelector('.sm__fill').style.strokeDashoffset = String(100 - pct);
      card.querySelector('.sm__rate').textContent =
        load < 1000 ? 'Under a second' : load < 2500 ? 'Fast' : load < 4000 ? 'Could be faster' : 'Slow';
    }

    function whenLoaded() {
      // loadEventEnd is only filled in after the load event has fully finished.
      if (document.readyState === 'complete' && perf.getEntriesByType('navigation')[0].loadEventEnd > 0) measure();
      else setTimeout(whenLoaded, 200);
    }
    whenLoaded();
    card.querySelector('.sm__again').addEventListener('click', function () {
      card.querySelector('.sm__fill').style.strokeDashoffset = '100';
      setTimeout(measure, 350);
    });
  });

  /* =========================================================
     DEMO 04 · Instant price estimator
     ========================================================= */
  register('demo-est', function priceEstimator(card) {
    var form = card.querySelector('.est');
    var size = form.elements.size;
    var priceEl = card.querySelector('.est__price');
    var visitEl = card.querySelector('.est__visit');
    var shown = 0, anim = 0;
    var money = function (n) { return '$' + Math.round(n).toLocaleString('en-US'); };

    function calc() {
      var sqft = +size.value;
      var visits = +form.querySelector('[name="freq"]:checked').value; // visits per month
      var perVisit = 30 + sqft / 1000 * 4.5;
      var monthly = 0;
      form.querySelectorAll('.est__adds input:checked').forEach(function (box) {
        if (box.dataset.perVisit) perVisit += +box.dataset.perVisit;
        if (box.dataset.monthly) monthly += +box.dataset.monthly;
      });
      monthly += perVisit * visits;

      card.querySelector('.est__size').textContent = sqft.toLocaleString('en-US') + ' sq ft';
      size.style.setProperty('--fill', ((sqft - size.min) / (size.max - size.min) * 100) + '%');
      visitEl.textContent = money(perVisit);
      countTo(monthly);
    }

    // Count up or down to the new number instead of snapping to it.
    function countTo(target) {
      cancelAnimationFrame(anim);
      var from = shown, t0 = performance.now(), dur = REDUCED ? 0 : 450;
      (function frame(t) {
        var k = dur ? Math.min((t - t0) / dur, 1) : 1;
        shown = from + (target - from) * (1 - Math.pow(1 - k, 3));
        priceEl.textContent = money(shown * 0.9) + ' – ' + money(shown * 1.1);
        if (k < 1) anim = requestAnimationFrame(frame);
      })(t0);
    }

    form.addEventListener('input', calc);
    form.addEventListener('change', calc);
    calc();
  });

  /* =========================================================
     DEMO 05 · Quote form to owner dashboard
     Live mode: Supabase over plain fetch (REST), no client library.
     Each visitor gets an anonymous sign-in, and row level security
     means they can only ever see their own rows.
     Offline mode: same UI, rows kept in this tab. Never a dead card.
     ========================================================= */
  register('demo-quote', function quoteDashboard(card) {
    var form = card.querySelector('.qd__form');
    var statusEl = card.querySelector('.qd__status');
    var list = card.querySelector('.qd__rows');
    var conn = card.querySelector('.qd__conn');
    var note = card.querySelector('.qd__note');
    var sendBtn = card.querySelector('.qd__send');
    var cfg = window.WEBOPS_SUPABASE || {};
    var rows = [];

    /* ---- Validation: specific messages, shown at the right moment ---- */
    var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    var rules = {
      name: function (v) { return v.length < 2 ? 'Please enter your name.' : ''; },
      email: function (v) { return !v ? 'We need an email to send your quote.' : !EMAIL.test(v) ? 'That email looks off. Check for typos.' : ''; },
      phone: function (v) { var d = v.replace(/\D/g, ''); return d && d.length !== 10 ? 'Phone numbers need 10 digits.' : ''; },
      service: function (v) { return v ? '' : 'Pick the closest option.'; },
      details: function (v) { return v.length > 400 ? 'Keep it under 400 characters.' : ''; }
    };
    var touched = {};

    function check(name) {
      var el = form.elements[name];
      var msg = rules[name](el.value.trim());
      var err = card.querySelector('#qd-' + name + '-err');
      err.textContent = msg;
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (msg) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
      el.closest('.qd__field').classList.toggle('is-ok', !msg && !!el.value.trim());
      return !msg;
    }

    // First check on leaving a field; after that, re-check on every keystroke.
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      el.addEventListener('blur', function () { touched[name] = true; check(name); });
      el.addEventListener('input', function () { if (touched[name]) check(name); });
    });

    // Format phone numbers as they're typed: 3205550142 -> (320) 555-0142
    form.elements.phone.addEventListener('input', function (e) {
      var d = e.target.value.replace(/\D/g, '').slice(0, 10);
      e.target.value = d.length > 6 ? '(' + d.slice(0, 3) + ') ' + d.slice(3, 6) + '-' + d.slice(6)
        : d.length > 3 ? '(' + d.slice(0, 3) + ') ' + d.slice(3) : d;
    });
    form.elements.details.addEventListener('input', function (e) {
      card.querySelector('.qd__count').textContent = e.target.value.length + ' / 400';
    });

    /* ---- Two stores, one interface: list / add / update / remove ---- */
    var offlineStore = {
      list: function () { return Promise.resolve(rows.slice()); },
      add: function (row) {
        if (rows.length >= 8) return Promise.reject(new Error('Demo limit is 8 requests. Delete one to add another.'));
        row.id = Date.now(); row.status = 'new'; row.created_at = new Date().toISOString();
        return Promise.resolve(row);
      },
      update: function (id, patch) { return Promise.resolve(Object.assign({}, rows.find(function (r) { return r.id === id; }), patch)); },
      remove: function () { return Promise.resolve(); }
    };

    var KEY = 'webops-quote-session';
    function saveSession(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
    function loadSession() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }

    function authCall(path, body) {
      return fetch(cfg.url + '/auth/v1/' + path, {
        method: 'POST',
        headers: { apikey: cfg.anonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }).then(function (r) {
        if (!r.ok) throw new Error('Sign-in failed (' + r.status + ')');
        return r.json();
      }).then(function (s) {
        var out = { token: s.access_token, refresh: s.refresh_token, exp: s.expires_at || Date.now() / 1000 + s.expires_in };
        saveSession(out);
        return out;
      });
    }

    // Reuse this visitor's session; refresh it if stale; sign in anonymously if there is none.
    function session() {
      var s = loadSession();
      if (s && s.exp * 1000 > Date.now() + 60000) return Promise.resolve(s);
      if (s && s.refresh) return authCall('token?grant_type=refresh_token', { refresh_token: s.refresh }).catch(function () { return authCall('signup', { data: {} }); });
      return authCall('signup', { data: {} });
    }

    function rest(path, opts) {
      opts = opts || {};
      return session().then(function (s) {
        return fetch(cfg.url + '/rest/v1/' + path, {
          method: opts.method || 'GET',
          body: opts.body,
          headers: { apikey: cfg.anonKey, Authorization: 'Bearer ' + s.token, 'Content-Type': 'application/json', Prefer: 'return=representation' }
        });
      }).then(function (r) {
        if (r.ok) return r.status === 204 ? null : r.json();
        return r.json().catch(function () { return {}; }).then(function (j) { throw new Error(j.message || 'Request failed (' + r.status + ')'); });
      });
    }

    var COLS = 'id,name,email,phone,service,details,status,created_at';
    var liveStore = {
      list: function () { return rest('workshop_quotes?select=' + COLS + '&order=created_at.desc'); },
      add: function (row) { return rest('workshop_quotes?select=' + COLS, { method: 'POST', body: JSON.stringify(row) }).then(function (r) { return r[0]; }); },
      update: function (id, patch) { return rest('workshop_quotes?id=eq.' + id + '&select=' + COLS, { method: 'PATCH', body: JSON.stringify(patch) }).then(function (r) { return r[0]; }); },
      remove: function (id) { return rest('workshop_quotes?id=eq.' + id, { method: 'DELETE' }); }
    };

    var store = offlineStore;
    function setMode(mode) {
      conn.setAttribute('data-mode', mode);
      conn.textContent = mode === 'live' ? 'Live database' : 'Offline demo';
      note.textContent = mode === 'live'
        ? 'Saved to a real Postgres database. Only you can see your rows, and demo rows clear after 24 hours.'
        : 'Offline demo: rows stay in this tab. On a client site, this writes to a real database.';
    }

    /* ---- Dashboard rendering (textContent only: visitor input is never parsed as HTML) ---- */
    var NEXT = { new: 'quoted', quoted: 'won', won: 'new' };
    function ago(iso) {
      var m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 60000));
      return m < 1 ? 'just now' : m < 60 ? m + 'm ago' : Math.round(m / 60) + 'h ago';
    }
    function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }

    function render(freshId) {
      list.textContent = '';
      if (!rows.length) {
        list.appendChild(el('li', 'qd__empty', 'No requests yet. Send one from the form.'));
      }
      rows.forEach(function (r) {
        var li = el('li', 'qd__row' + (r.id === freshId ? ' is-new' : ''));
        var who = el('div', 'qd__who');
        who.appendChild(el('b', null, r.name));
        who.appendChild(el('span', null, r.service + ' · ' + ago(r.created_at)));
        var pill = el('button', 'qd__pill', r.status);
        pill.type = 'button';
        pill.dataset.s = r.status;
        pill.setAttribute('aria-label', 'Status: ' + r.status + '. Change to ' + NEXT[r.status]);
        pill.addEventListener('click', function () { change(r, { status: NEXT[r.status] }); });
        var del = el('button', 'qd__del', '×');
        del.type = 'button';
        del.setAttribute('aria-label', 'Delete request from ' + r.name);
        del.addEventListener('click', function () { removeRow(r); });
        li.appendChild(who); li.appendChild(pill); li.appendChild(del);
        list.appendChild(li);
      });
      var count = function (s) { return rows.filter(function (r) { return r.status === s; }).length; };
      card.querySelector('[data-stat="total"]').textContent = rows.length;
      card.querySelector('[data-stat="new"]').textContent = count('new');
      card.querySelector('[data-stat="won"]').textContent = count('won');
    }

    function say(msg, isError) { statusEl.textContent = msg; statusEl.classList.toggle('is-error', !!isError); }

    function change(r, patch) {
      store.update(r.id, patch).then(function (updated) {
        rows = rows.map(function (x) { return x.id === r.id ? updated : x; });
        render();
      }).catch(function (e) { say(e.message, true); });
    }
    function removeRow(r) {
      store.remove(r.id).then(function () {
        rows = rows.filter(function (x) { return x.id !== r.id; });
        render();
      }).catch(function (e) { say(e.message, true); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var names = Object.keys(rules);
      names.forEach(function (n) { touched[n] = true; });
      var bad = names.filter(function (n) { return !check(n); });
      if (bad.length) { form.elements[bad[0]].focus(); say('Fix the highlighted field' + (bad.length > 1 ? 's' : '') + ' and send again.', true); return; }

      var row = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        phone: form.elements.phone.value.trim() || null,
        service: form.elements.service.value,
        details: form.elements.details.value.trim() || null
      };
      sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; say('');
      store.add(row).then(function (saved) {
        rows.unshift(saved);
        render(saved.id);
        form.reset();
        touched = {};
        form.querySelectorAll('.is-ok').forEach(function (f) { f.classList.remove('is-ok'); });
        card.querySelector('.qd__count').textContent = '0 / 400';
        say('Request sent. Check the dashboard.');
      }).catch(function (err) {
        say(err.message, true);
      }).then(function () { sendBtn.disabled = false; sendBtn.textContent = 'Send request'; });
    });

    /* ---- Start: try the live database, fall back to offline without fuss ---- */
    render();
    if (cfg.url && cfg.anonKey) {
      liveStore.list().then(function (data) {
        store = liveStore; rows = data; setMode('live'); render();
      }).catch(function () {
        setMode('offline');
        note.textContent = "Couldn't reach the database just now, so this is running offline. Everything still works.";
      });
    } else {
      setMode('offline');
    }
  });

  /* =========================================================
     DEMO 06 · Live search
     ========================================================= */
  register('demo-search', function liveSearch(card) {
    var ITEMS = [
      ['Leaky faucet repair', 'Repair', 'drip tap sink'],
      ['Running toilet fix', 'Repair', 'leak water bill tank'],
      ['Burst pipe emergency', 'Emergency', 'flood leak water frozen'],
      ['Clogged drain clearing', 'Repair', 'slow sink shower backup'],
      ['Water heater repair', 'Repair', 'no hot water cold tank pilot'],
      ['Water heater install', 'Install', 'new tankless hot water'],
      ['Sewer line camera inspection', 'Maintenance', 'smell backup roots'],
      ['Gas leak check', 'Emergency', 'smell rotten egg safety'],
      ['Sump pump install', 'Install', 'basement flood water'],
      ['Sump pump not running', 'Emergency', 'basement flood water alarm'],
      ['Garbage disposal replacement', 'Install', 'sink jammed hum'],
      ['Low water pressure', 'Repair', 'weak shower trickle'],
      ['Water softener install', 'Install', 'hard water spots scale'],
      ['Annual furnace tune-up', 'Maintenance', 'heat heating winter filter'],
      ['No heat emergency', 'Emergency', 'furnace cold winter boiler'],
      ['Frozen pipe thawing', 'Emergency', 'winter cold burst no water'],
      ['Toilet install', 'Install', 'new bathroom remodel'],
      ['Sewer smell in basement', 'Repair', 'odor drain trap gas'],
      ['Outdoor spigot repair', 'Repair', 'hose bib leak garden'],
      ['Drain cleaning plan', 'Maintenance', 'yearly hydro jet roots']
    ].map(function (r) { return { title: r[0], cat: r[1], text: (r[0] + ' ' + r[1] + ' ' + r[2]).toLowerCase() }; });

    var input = card.querySelector('.ls__input');
    var chips = card.querySelector('.ls__chips');
    var out = card.querySelector('.ls__list');
    var count = card.querySelector('.ls__count');
    var cat = 'All';

    ['All', 'Emergency', 'Repair', 'Install', 'Maintenance'].forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c;
      b.setAttribute('aria-pressed', String(c === cat));
      b.addEventListener('click', function () {
        cat = c;
        chips.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        run();
      });
      chips.appendChild(b);
    });

    // Wrap matched words in <mark> using DOM nodes, so typed text is never treated as HTML.
    function marked(text, terms) {
      var frag = document.createDocumentFragment();
      var lower = text.toLowerCase(), i = 0;
      while (i < text.length) {
        var hit = null;
        terms.forEach(function (t) {
          var at = lower.indexOf(t, i);
          if (at > -1 && (!hit || at < hit.at)) hit = { at: at, len: t.length };
        });
        if (!hit) { frag.appendChild(document.createTextNode(text.slice(i))); break; }
        frag.appendChild(document.createTextNode(text.slice(i, hit.at)));
        var m = document.createElement('mark');
        m.textContent = text.slice(hit.at, hit.at + hit.len);
        frag.appendChild(m);
        i = hit.at + hit.len;
      }
      return frag;
    }

    function run() {
      var q = input.value.trim().toLowerCase();
      var terms = q.split(/\s+/).filter(Boolean);
      // Every word typed has to match somewhere: title, category, or hidden keywords.
      var hits = ITEMS.filter(function (it) {
        return (cat === 'All' || it.cat === cat) && terms.every(function (t) { return it.text.indexOf(t) > -1; });
      });
      out.textContent = '';
      hits.forEach(function (it) {
        var li = document.createElement('li');
        li.className = 'ls__item';
        var b = document.createElement('b');
        b.appendChild(marked(it.title, terms));
        var s = document.createElement('span');
        s.textContent = it.cat;
        li.appendChild(b); li.appendChild(s);
        out.appendChild(li);
      });
      if (!hits.length) {
        var none = document.createElement('li');
        none.className = 'ls__none';
        none.textContent = 'Nothing for "' + input.value.trim() + '". Try "leak", "drain", or "no heat".';
        out.appendChild(none);
      }
      count.textContent = hits.length + (hits.length === 1 ? ' result' : ' results');
    }

    input.addEventListener('input', run);
    run();
  });

  /* =========================================================
     DEMO 07 · Gallery + lightbox
     ========================================================= */
  register('demo-gallery', function galleryLightbox(card) {
    var items = [].slice.call(card.querySelectorAll('.gl__item'));
    var box = card.querySelector('.gl__box');
    if (typeof box.showModal !== 'function') throw new Error('No <dialog> support');
    var fig = box.querySelector('.gl__fig');
    var big = box.querySelector('.gl__big');
    var ph = box.querySelector('.gl__big-ph');
    var cap = box.querySelector('.gl__cap');
    var i = 0, opener = null;

    function show(n) {
      i = (n + items.length) % items.length; // wrap around both ends
      var img = items[i].querySelector('img');
      fig.classList.toggle('has-img', !!img);
      if (img) { big.src = img.currentSrc || img.src; big.alt = img.alt; }
      ph.textContent = String(i + 1).padStart(2, '0');
      cap.textContent = (img && img.alt ? img.alt + ' · ' : '') + (i + 1) + ' of ' + items.length;
      // Restart the zoom-in animation on every change.
      big.style.animation = 'none'; void big.offsetWidth; big.style.animation = '';
    }

    items.forEach(function (btn, n) {
      btn.addEventListener('click', function () { opener = btn; show(n); box.showModal(); });
    });
    box.querySelector('.gl__prev').addEventListener('click', function () { show(i - 1); });
    box.querySelector('.gl__next').addEventListener('click', function () { show(i + 1); });
    box.querySelector('.gl__close').addEventListener('click', function () { box.close(); });
    box.addEventListener('close', function () { if (opener) opener.focus(); }); // focus goes back where it came from
    box.addEventListener('click', function (e) { if (e.target === box) box.close(); }); // click the dark area to close
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') show(i - 1);
      if (e.key === 'ArrowRight') show(i + 1);
    }); // Esc is built into <dialog>

    // Swipe on touch screens
    var sx = null;
    fig.addEventListener('pointerdown', function (e) { sx = e.clientX; });
    fig.addEventListener('pointerup', function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 40) show(dx < 0 ? i + 1 : i - 1);
    });
  });

  /* =========================================================
     DEMO 08 · 3D flip cards (the flip itself is pure CSS)
     ========================================================= */
  register('demo-flip', function flipCards(card) {
    card.querySelectorAll('.flip__card').forEach(function (c) {
      c.addEventListener('click', function () {
        c.setAttribute('aria-pressed', String(c.getAttribute('aria-pressed') !== 'true'));
      });
    });
  });

  /* =========================================================
     DEMO 09 · Responsive preview (container queries)
     ========================================================= */
  register('demo-resp', function responsivePreview(card) {
    var view = card.querySelector('.rp__viewport');
    var handle = card.querySelector('.rp__handle');
    var MIN = 320, MAX = 900;
    var w = MAX, k = 1;

    // The preview is a real layout at a real width, scaled down to fit the card.
    function fit() {
      k = Math.min(1, (view.clientWidth - 22) / MAX);
      view.style.setProperty('--k', k);
      view.style.setProperty('--h', Math.round(view.clientHeight / k) + 'px'); // fill the card's height
      set(w);
    }
    function set(px) {
      w = Math.round(Math.max(MIN, Math.min(MAX, px)));
      view.style.setProperty('--w', w + 'px');
      card.querySelector('.rp__px').textContent = w + 'px';
      card.querySelector('.rp__bp').textContent = w <= 520 ? 'Phone' : w <= 760 ? 'Tablet' : 'Desktop';
      handle.setAttribute('aria-valuenow', w);
      handle.setAttribute('aria-valuetext', w + ' pixels wide');
    }

    var dragging = false;
    handle.addEventListener('pointerdown', function (e) { dragging = true; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      set((e.clientX - view.getBoundingClientRect().left) / k);
    });
    ['pointerup', 'pointercancel'].forEach(function (t) { handle.addEventListener(t, function () { dragging = false; }); });
    handle.addEventListener('keydown', function (e) {
      var d = { ArrowLeft: -20, ArrowDown: -20, ArrowRight: 20, ArrowUp: 20 }[e.key];
      if (d) { e.preventDefault(); set(w + d); }
    });
    card.querySelectorAll('[data-w]').forEach(function (b) {
      b.addEventListener('click', function () { set(+b.dataset.w); });
    });

    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(view);
    else window.addEventListener('resize', fit);
    fit();
  });

  /* =========================================================
     DEMO 10 · Open now badge (business time zone, not the visitor's)
     ========================================================= */
  register('demo-open', function openNow(card) {
    var TZ = 'America/Chicago';
    var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    // Opening and closing time for each day, in minutes after midnight.
    var HOURS = [[390, 1140], [390, 1140], [390, 1140], [390, 1140], [390, 1200], [420, 1200], [480, 840]];
    var SOON = 45; // "closing soon" window, in minutes

    var badge = card.querySelector('.on__badge');
    var range = card.querySelector('.on__range');
    var nowBtn = card.querySelector('.on__now');
    var simulating = false;

    function clock(min) {
      var h = Math.floor(min / 60) % 24, m = min % 60;
      return (h % 12 || 12) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' AM' : ' PM');
    }

    // What day and minute is it right now in the cafe's time zone?
    function nowThere() {
      var parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'long', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { return parts.find(function (p) { return p.type === t; }).value; };
      return { day: DAYS.indexOf(get('weekday')), min: (+get('hour') % 24) * 60 + +get('minute') };
    }

    function status(day, min) {
      var h = HOURS[day];
      if (min >= h[0] && min < h[1]) {
        var left = h[1] - min;
        return { state: left <= SOON ? 'soon' : 'open', label: left <= SOON ? 'Closing soon' : 'Open now', sub: 'Closes at ' + clock(h[1]) + (left <= SOON ? ', in ' + left + ' min' : '') };
      }
      // Closed: find the next opening, today or later this week.
      for (var d = 0; d < 8; d++) {
        var day2 = (day + d) % 7, open = HOURS[day2][0];
        if (d > 0 || min < open) {
          var when = d === 0 ? 'today' : d === 1 ? 'tomorrow' : DAYS[day2];
          return { state: 'closed', label: 'Closed', sub: 'Opens ' + clock(open) + ' ' + when };
        }
      }
    }

    var hoursList = card.querySelector('.on__hours');
    DAYS.forEach(function (d, i) {
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = d;
      var b = document.createElement('span'); b.textContent = clock(HOURS[i][0]) + ' – ' + clock(HOURS[i][1]);
      li.appendChild(a); li.appendChild(b);
      hoursList.appendChild(li);
    });

    function paint(day, min) {
      var s = status(day, min);
      badge.setAttribute('data-state', s.state);
      card.querySelector('.on__state').textContent = s.label;
      card.querySelector('.on__sub').textContent = s.sub;
      hoursList.querySelectorAll('li').forEach(function (li, i) { li.classList.toggle('is-today', i === day); });
      card.querySelector('.on__when').textContent = DAYS[day].slice(0, 3) + ' ' + clock(min) + (simulating ? '' : ' (now)');
    }

    function live() {
      if (simulating) return;
      var n = nowThere();
      range.value = n.day * 48 + Math.floor(n.min / 30);
      paint(n.day, n.min);
    }

    // The slider walks the week in 30-minute steps so you can see every state.
    range.addEventListener('input', function () {
      simulating = true; nowBtn.hidden = false;
      var v = +range.value;
      paint(Math.floor(v / 48), (v % 48) * 30);
    });
    nowBtn.addEventListener('click', function () { simulating = false; nowBtn.hidden = true; live(); });

    live();
    setInterval(live, 30000); // stays correct if the page is left open
  });

  /* =========================================================
     DEMO 11 · Micro-interactions
     ========================================================= */
  register('demo-micro', function microInteractions(card) {
    // Press: a ripple starts exactly where the finger or cursor landed.
    var press = card.querySelector('.mi__press');
    press.addEventListener('pointerdown', function (e) {
      var r = press.getBoundingClientRect();
      var dot = document.createElement('span');
      dot.className = 'mi__ripple';
      dot.style.left = (e.clientX - r.left) + 'px';
      dot.style.top = (e.clientY - r.top) + 'px';
      press.appendChild(dot);
      dot.addEventListener('animationend', function () { dot.remove(); });
    });

    // Toggle: a real switch for screen readers, not a styled div.
    var sw = card.querySelector('.mi__switch');
    sw.addEventListener('click', function () {
      sw.setAttribute('aria-checked', String(sw.getAttribute('aria-checked') !== 'true'));
    });

    // Save: the pop and ring are CSS animations keyed off aria-pressed.
    var heart = card.querySelector('.mi__heart');
    heart.addEventListener('click', function () {
      heart.setAttribute('aria-pressed', String(heart.getAttribute('aria-pressed') !== 'true'));
    });

    // Copy: copies for real, then confirms with a drawn checkmark.
    var copy = card.querySelector('.mi__copy');
    var label = copy.querySelector('.mi__copy-t');
    var timer;
    copy.addEventListener('click', function () {
      if (navigator.clipboard) navigator.clipboard.writeText('WEBOPS-WORKSHOP').catch(function () {});
      copy.classList.add('is-done');
      label.textContent = 'Copied';
      clearTimeout(timer);
      timer = setTimeout(function () { copy.classList.remove('is-done'); label.textContent = 'Copy code'; }, 1800);
    });
  });

})();
