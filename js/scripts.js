// WebOps Studio — scripts.js v3.1
// Mobile nav · Sticky header · Active links · Scroll reveal ·
// FAQ accordion · Portfolio filter · Back to top · MailerLite popup ·
// Contact form (AJAX Formspree inline status)

(function () {
  'use strict';

  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  let resetTiltState = () => {};

  const computeEnhancedFxMode = () => {
    const isConstrainedDevice =
      window.innerWidth < 1024 ||
      (typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4) ||
      (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4) ||
      !!(connection && (connection.saveData || /(^|slow-)2g/.test(connection.effectiveType || '')));

    return !reducedMotionQuery.matches && finePointerQuery.matches && !isConstrainedDevice;
  };

  let enableEnhancedFx = false;
  const applyPerformanceMode = () => {
    enableEnhancedFx = computeEnhancedFxMode();
    if (!document.body) return;

    document.body.classList.toggle('flare-mode', enableEnhancedFx);
    document.body.classList.toggle('perf-lite', !enableEnhancedFx);

    if (enableEnhancedFx && !document.querySelector('.grain-overlay')) {
      const grain = document.createElement('div');
      grain.className = 'grain-overlay';
      grain.setAttribute('aria-hidden', 'true');
      document.body.appendChild(grain);
    }

    if (!enableEnhancedFx) {
      const grain = document.querySelector('.grain-overlay');
      if (grain) grain.remove();
    }

    resetTiltState();
  };
  applyPerformanceMode();

  let modeRafPending = false;
  const schedulePerformanceModeRefresh = () => {
    if (modeRafPending) return;
    modeRafPending = true;
    requestAnimationFrame(() => {
      modeRafPending = false;
      applyPerformanceMode();
    });
  };

  window.addEventListener('resize', schedulePerformanceModeRefresh, { passive: true });
  if (typeof reducedMotionQuery.addEventListener === 'function') {
    reducedMotionQuery.addEventListener('change', schedulePerformanceModeRefresh);
    finePointerQuery.addEventListener('change', schedulePerformanceModeRefresh);
  } else if (typeof reducedMotionQuery.addListener === 'function') {
    reducedMotionQuery.addListener(schedulePerformanceModeRefresh);
    finePointerQuery.addListener(schedulePerformanceModeRefresh);
  }
  if (connection && typeof connection.addEventListener === 'function') {
    connection.addEventListener('change', schedulePerformanceModeRefresh);
  }

  const setScrollProgress = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    document.documentElement.style.setProperty('--scroll-progress', `${Math.min(100, Math.max(0, pct)).toFixed(2)}%`);
  };

  let rafPending = false;
  let px = window.innerWidth / 2;
  let py = window.innerHeight / 2;

  const writePointerVars = () => {
    const xOffset = ((px / window.innerWidth) - 0.5) * 36;
    const yOffset = ((py / window.innerHeight) - 0.5) * 36;
    document.documentElement.style.setProperty('--flare-shift-x', `${xOffset.toFixed(2)}px`);
    document.documentElement.style.setProperty('--flare-shift-y', `${yOffset.toFixed(2)}px`);
    rafPending = false;
  };

  window.addEventListener('pointermove', (e) => {
    if (!enableEnhancedFx) return;
    px = e.clientX;
    py = e.clientY;
    if (!rafPending) {
      rafPending = true;
      requestAnimationFrame(writePointerVars);
    }
  }, { passive: true });

  /* ── STICKY HEADER ────────────────────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 40);
      setScrollProgress();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else {
    setScrollProgress();
  }

  /* ── MOBILE MENU ──────────────────────────────────────────────── */
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  const closeMobileNav = () => {
    if (!navToggle || !navLinks) return;
    navToggle.classList.remove('active');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('active');
    document.documentElement.classList.remove('menu-open');
    document.body.classList.remove('menu-open');
  };

  if (navToggle && navLinks) {
    navToggle.setAttribute('aria-expanded', 'false');

    navToggle.addEventListener('click', () => {
      const open = navToggle.classList.toggle('active');
      navLinks.classList.toggle('active', open);
      navToggle.setAttribute('aria-expanded', String(open));
      document.documentElement.classList.toggle('menu-open', open);
      document.body.classList.toggle('menu-open', open);
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
  const currentPath = location.pathname.replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach((link) => {
    const href = (link.getAttribute('href') || '').replace(/\.html$/, '').replace(/\/$/, '').toLowerCase();
    if (href === currentPath || (currentPath === '' && href === '')) {
      link.classList.add('active');
    }
  });

  /* ── SCROLL REVEAL ────────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  reveals.forEach((el, i) => {
    if (!/reveal-delay-\d+/.test(el.className)) {
      el.style.transitionDelay = `${Math.min((i % 6) * 0.08, 0.40).toFixed(2)}s`;
    }
  });

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

  /* ── PREMIUM TILT INTERACTIONS (POINTER DEVICES) ──────────────── */
  const tiltTargets = Array.from(document.querySelectorAll(
    '.project-card, .service-card, .portfolio-card, .service-tile, .intro-card, .about-card, .bio-block, .contact-form-wrap, .contact-info-panel, .pricing-note, .testimonial-block, .concept-row, .case-study, .case-study-details'
  ));

  tiltTargets.forEach((el) => el.classList.add('tilt-card'));

  if (tiltTargets.length) {
    const maxTilt = 5;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const resetCard = (card) => {
      card.classList.remove('is-tilting');
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
      card.style.setProperty('--mouse-x', '50%');
      card.style.setProperty('--mouse-y', '50%');
    };

    tiltTargets.forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        if (!enableEnhancedFx) {
          resetCard(card);
          return;
        }

        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xPct = clamp(x / rect.width, 0, 1);
        const yPct = clamp(y / rect.height, 0, 1);
        const tiltY = (xPct - 0.5) * (maxTilt * 2);
        const tiltX = (0.5 - yPct) * (maxTilt * 2);

        card.classList.add('is-tilting');
        card.style.setProperty('--tilt-x', `${tiltX.toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${tiltY.toFixed(2)}deg`);
        card.style.setProperty('--mouse-x', `${(xPct * 100).toFixed(1)}%`);
        card.style.setProperty('--mouse-y', `${(yPct * 100).toFixed(1)}%`);
      });

      card.addEventListener('pointerleave', () => resetCard(card));
      card.addEventListener('pointercancel', () => resetCard(card));
      card.addEventListener('blur', () => resetCard(card));
    });

    resetTiltState = () => {
      tiltTargets.forEach((card) => resetCard(card));
    };
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
    const onScrollBtt = () => {
      btt.classList.toggle('visible', window.scrollY > 400);
      setScrollProgress();
    };
    window.addEventListener('scroll', onScrollBtt, { passive: true });
    onScrollBtt();

    btt.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ── DYNAMIC YEAR ───────────────────────────────────────────── */
  const yearEl = document.getElementById('copy-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
/* ── PORTFOLIO ADDITIONS: Concept Carousel Logic ── */
(function initConceptCarousels() {
  document.querySelectorAll('.concept-row[data-carousel]').forEach(function (row) {
    const mainBtn  = row.querySelector('.concept-preview__main');
    const mainImg  = mainBtn ? mainBtn.querySelector('img') : null;
    const track    = row.querySelector('.concept-thumbs__track');
    const thumbs   = Array.from(row.querySelectorAll('.concept-thumbs__thumb'));
    const arrows   = Array.from(row.querySelectorAll('.concept-thumbs__arrow'));

    if (!mainBtn || !mainImg || !track) return;

    // Swap main image when a thumb is clicked
    function setActive(thumb) {
      thumbs.forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');

      var src     = thumb.dataset.src;
      var caption = thumb.dataset.caption || '';

      mainImg.src              = src;
      mainImg.alt              = caption;
      mainBtn.dataset.full     = src;
      mainBtn.dataset.caption  = caption;
    }

    thumbs.forEach(function (t) {
      t.addEventListener('click', function () { setActive(t); });
    });

    // Main image click -> lightbox (using your existing openLightbox function)
    mainBtn.addEventListener('click', function () {
      var full    = this.dataset.full    || mainImg.src;
      var caption = this.dataset.caption || '';
      if (typeof openLightbox === 'function') openLightbox(full, caption);
    });

    // Arrow buttons scroll the thumb strip
    arrows.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var dir = Number(btn.dataset.dir || 1);
        track.scrollBy({ left: dir * 130, behavior: 'smooth' });
      });
    });
  });
})();
