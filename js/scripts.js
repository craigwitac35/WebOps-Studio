// WebOps Studio — scripts.js v3.0
// Mobile nav · Sticky header · Active links · Scroll reveal ·
// FAQ accordion · Portfolio filter · Back to top · MailerLite popup
(function () {
  'use strict';

  /* ── STICKY HEADER ────────────────────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── MOBILE MENU ──────────────────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks  = document.querySelector('.nav-links');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('active');
      navLinks.classList.toggle('active', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.addEventListener('click', e => {
      if (e.target.tagName === 'A') {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
    document.addEventListener('click', e => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  /* ── ACTIVE NAV LINK ──────────────────────────────────────────── */
  const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(link => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── SCROLL REVEAL ────────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
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

  /* ── FAQ ACCORDION ────────────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      const isOpen = btn.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-question.open').forEach(b => {
        b.classList.remove('open');
        b.nextElementSibling.classList.remove('open');
      });

      // Open this one if it was closed
      if (!isOpen) {
        btn.classList.add('open');
        answer.classList.add('open');
      }
    });
  });

  /* ── PORTFOLIO FILTER ─────────────────────────────────────────── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const portfolioCards = document.querySelectorAll('.portfolio-card');
  if (filterBtns.length && portfolioCards.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;

        // Update active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show/hide cards
        portfolioCards.forEach(card => {
          if (filter === 'all') {
            card.removeAttribute('data-hidden');
          } else {
            const tags = (card.dataset.tags || '').split(',').map(t => t.trim());
            card.setAttribute('data-hidden', tags.includes(filter) ? 'false' : 'true');
          }
        });
      });
    });
  }

  /* ── CONTACT FORM FEEDBACK ────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  if (form) {
    form.addEventListener('submit', e => {
      // Only intercept if no action set (prevents blocking Formspree)
      if (!form.action || form.action === window.location.href) {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]');
        const orig = btn.textContent;
        btn.textContent = 'Message Sent!';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        setTimeout(() => {
          btn.textContent = orig;
          btn.disabled = false;
          btn.style.opacity = '';
          form.reset();
        }, 3500);
      }
    });
  }

  /* ── BACK TO TOP ──────────────────────────────────────────────── */
  const btt = document.querySelector('.back-to-top');
  if (btt) {
    window.addEventListener('scroll', () => {
      btt.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
    btt.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── MAILERLITE POPUP TIMER (5–8 seconds) ─────────────────────── */
  // MailerLite embed script goes in HTML just before </body>.
  // This timer fires their popup trigger if they provide a JS API.
  // If using MailerLite's universal script, it handles timing itself.
  // This is a fallback manual trigger for custom implementations.
  const ML_DELAY = 6000; // 6 seconds
  setTimeout(() => {
    if (typeof window.ml === 'function') {
      window.ml('show', 'FORM_ID', true); // replace FORM_ID with your MailerLite form ID
    }
  }, ML_DELAY);

})();
