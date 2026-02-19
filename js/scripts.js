// WebOps Studio — scripts.js v1.0
// Handles: sticky nav scroll state, mobile menu, reveal animations, active links
(function () {
  'use strict';

  /* ── NAV SCROLL STATE ─────────────────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // run on load
  }

  /* ── MOBILE MENU ──────────────────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.main-nav .nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navToggle.classList.toggle('active');
      navLinks.classList.toggle('active', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    // close on link click
    navLinks.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    // close on outside click
    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── ACTIVE NAV LINK ──────────────────────────────────────────── */
  const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.main-nav .nav-links a').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── REVEAL ON SCROLL ─────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(el => io.observe(el));
  } else {
    // fallback: show all immediately
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ── SMOOTH ANCHOR SCROLL ─────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── CONTACT FORM (basic) ─────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type="submit"]');
      const original = btn.textContent;
      btn.textContent = 'Message Sent!';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
        btn.style.opacity = '';
        form.reset();
      }, 3500);
    });
  }

})();
