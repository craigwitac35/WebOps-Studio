/* ============================================================
   WEBOPS STUDIO — scripts.js v6.1
   Vanilla JS · Zero Frameworks
   ============================================================ */
(function () {
  'use strict';

  /* Copyright year */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();

  /* Nav scroll state */
  var nav = document.getElementById('nav');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile drawer */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  var overlay = document.getElementById('overlay');
  var closeBtn = document.getElementById('drawerClose');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (burger) burger.setAttribute('aria-expanded', 'true');
    var first = drawer.querySelector('a, button');
    if (first) first.focus();
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
  }
  if (burger) burger.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  if (overlay) overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) closeDrawer();
  });

  /* Focus trap inside drawer */
  if (drawer) {
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = drawer.querySelectorAll('a, button');
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* Scroll reveal */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  /* Contact form (async Formspree) */
  var form = document.getElementById('contactForm');
  var btn = document.getElementById('submitBtn');
  var status = document.getElementById('formStatus');
  var btnHTML = btn ? btn.innerHTML : '';

  function showStatus(msg, ok) {
    if (!status) return;
    status.textContent = msg;
    status.style.display = 'block';
    status.style.background = ok ? 'rgba(232,98,10,0.1)' : 'rgba(200,50,50,0.1)';
    status.style.border = ok ? '1px solid rgba(232,98,10,0.3)' : '1px solid rgba(200,50,50,0.3)';
    status.style.color = ok ? 'var(--orange)' : '#e05555';
  }
  function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var msg = document.getElementById('message');
      if (!name.value.trim()) { showStatus('Please enter your name.', false); name.focus(); return; }
      if (!validEmail(email.value)) { showStatus('Please enter a valid email.', false); email.focus(); return; }
      if (!msg.value.trim()) { showStatus('Please include a message.', false); msg.focus(); return; }

      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (r.ok) {
            form.reset();
            showStatus('Message sent. I\'ll be in touch within 24–48 hours.', true);
          } else { throw new Error('fail'); }
          if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
        })
        .catch(function () {
          showStatus('Something went wrong. Email craigbaumann2020@gmail.com directly.', false);
          if (btn) { btn.disabled = false; btn.innerHTML = btnHTML; }
        });
    });
  }
})();

/* ============================================================
   PORTFOLIO — desktop/mobile toggle + phone screen pager (v6.1)
   Each block defaults to Desktop. If its desktop screenshot is
   missing and it has mobile screens, it opens on Mobile instead,
   until the visitor picks a view themselves.
   ============================================================ */
(function () {
  'use strict';
  var blocks = document.querySelectorAll('.pj');
  if (!blocks.length) return;

  function setup(pj) {
    var device = pj.querySelector('.device');
    var btns = pj.querySelectorAll('.view-toggle button');
    var chosen = false;

    function setView(v) {
      device.setAttribute('data-view', v);
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-view') === v ? 'true' : 'false'); });
    }
    btns.forEach(function (b) {
      b.addEventListener('click', function () { chosen = true; setView(b.getAttribute('data-view')); });
    });

    var slides = pj.querySelectorAll('.phone__slide');
    var desk = pj.querySelector('.browser__view');
    function deskMissing() { return desk.classList.contains('is-empty') || !desk.querySelector('img'); }
    function maybeMobile() { if (!chosen && slides.length && deskMissing()) setView('mobile'); }
    desk.addEventListener('shotfail', maybeMobile);
    var dimg = desk.querySelector('img');
    maybeMobile();
    if (dimg && dimg.loading === 'lazy') {
      // Lazy images only load near the viewport; probe once so the default view is right from the start.
      var probe = new Image();
      probe.onerror = function () { desk.classList.add('is-empty'); maybeMobile(); };
      probe.src = dimg.currentSrc || dimg.src;
    }

    /* Phone pager */
    if (slides.length > 1) {
      var screen = pj.querySelector('.phone__screen');
      var countEl = pj.querySelector('.phone__count b');
      var i = 0;
      function go(step) {
        slides[i].hidden = true;
        i = (i + step + slides.length) % slides.length;
        slides[i].hidden = false;
        screen.scrollTop = 0;
        if (countEl) countEl.textContent = i + 1;
      }
      pj.querySelectorAll('.phone__btn').forEach(function (b) {
        b.addEventListener('click', function () { go(parseInt(b.getAttribute('data-step'), 10)); });
      });
      screen.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      });
    }
  }

  blocks.forEach(function (pj) {
    try { setup(pj); } catch (err) { /* one broken block never takes down the page */ }
  });
})();
