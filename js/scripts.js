/* ============================================================
   WEBOPS STUDIO — scripts.js v6.0
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
