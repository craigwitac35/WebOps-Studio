// WebOps Studio — scripts.js v3.1
// Mobile nav · Sticky header · Active links · Scroll reveal ·
// FAQ accordion · Portfolio filter · Back to top · MailerLite popup ·
// Contact form (AJAX Formspree inline status)

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
  const navLinks = document.querySelector('.nav-links');

  const closeMobileNav = () => {
    if (!navToggle || !navLinks) return;
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    document.body.style.overflow = '';
  };

  if (navToggle && navLinks) {
    navToggle.setAttribute('aria-expanded', 'false');

    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('active');
      navLinks.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });

    navLinks.addEventListener('click', (e) => {
      if (e.target && e.target.tagName === 'A') closeMobileNav();
    });

    document.addEventListener('click', (e) => {
      if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) closeMobileNav();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

  /* ── ACTIVE NAV LINK ──────────────────────────────────────────── */
  const currentPage = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = (link.getAttribute('href') || '').toLowerCase();
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ── SCROLL REVEAL ────────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  /* ── SMOOTH ANCHOR SCROLL ─────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── FAQ ACCORDION ────────────────────────────────────────────── */
  document.querySelectorAll('.faq-question').forEach((btn) => {
    btn.addEventListener('click', () => {
      const answer = btn.nextElementSibling;
      if (!answer) return;

      const isOpen = btn.classList.contains('open');

      document.querySelectorAll('.faq-question.open').forEach((b) => {
        b.classList.remove('open');
        if (b.nextElementSibling) b.nextElementSibling.classList.remove('open');
      });

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
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter || 'all';

        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        portfolioCards.forEach((card) => {
          if (filter === 'all') {
            card.removeAttribute('data-hidden');
            return;
          }
          const tags = (card.dataset.tags || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean);

          card.setAttribute('data-hidden', tags.includes(filter) ? 'false' : 'true');
        });
      });
    });
  }

  /* ── CONTACT FORM (AJAX → FORMSPREE, NO REDIRECT) ─────────────── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const statusEl = document.getElementById('formStatus');
    const submitBtn = contactForm.querySelector('button[type="submit"], input[type="submit"]');

    const setStatus = (type, message) => {
      if (!statusEl) return;
      statusEl.className = 'form-status ' + type;
      statusEl.textContent = message;
      statusEl.style.display = 'block';
    };

    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!contactForm.action || !contactForm.action.includes('formspree.io')) {
        setStatus('error', 'Form is not configured correctly yet.');
        return;
      }

      if (statusEl) {
        statusEl.className = 'form-status';
        statusEl.textContent = '';
        statusEl.style.display = 'none';
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.tagName === 'BUTTON'
          ? (submitBtn.textContent || '')
          : (submitBtn.value || '');

        if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = 'Sending...';
        else submitBtn.value = 'Sending...';
      }

      try {
        const formData = new FormData(contactForm);

        const res = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
          setStatus('success', 'Message sent. I will reply soon.');
          contactForm.reset();
        } else {
          let data = null;
          try { data = await res.json(); } catch (_) {}

          const msg =
            data && data.errors && data.errors[0] && data.errors[0].message
              ? data.errors[0].message
              : 'Something went wrong. Please try again or email me directly.';

          setStatus('error', msg);
        }
      } catch (_) {
        setStatus('error', 'Network error. Please try again or email me directly.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          const orig = submitBtn.dataset.originalText || '';
          if (submitBtn.tagName === 'BUTTON') submitBtn.textContent = orig || 'Send Message →';
          else submitBtn.value = orig || 'Send Message →';
        }
      }
    });
  }

  /* ── BACK TO TOP ──────────────────────────────────────────────── */
  const btt = document.querySelector('.back-to-top');
  if (btt) {
    const onScrollBtt = () => btt.classList.toggle('visible', window.scrollY > 400);
    window.addEventListener('scroll', onScrollBtt, { passive: true });
    onScrollBtt();

    btt.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── MAILERLITE POPUP TIMER (OPTIONAL) ────────────────────────── */
  // MailerLite universal script goes in HTML just before </body>.
  // If you have a MailerLite popup/form ID, replace 'FORM_ID' below.
  const ML_DELAY = 6000; // 6 seconds
  setTimeout(() => {
    if (typeof window.ml === 'function') {
      // window.ml('show', 'FORM_ID', true);
    }
  }, ML_DELAY);

})();
