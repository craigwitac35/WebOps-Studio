/* ============================================================
   WEBOPS STUDIO — scripts.js v5.0
   Stack: Vanilla JS — Zero Frameworks
   Author: Craig Baumann
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     UTILITY
     ---------------------------------------------------------- */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.from((ctx || document).querySelectorAll(sel));
  }

  /* ----------------------------------------------------------
     1. COPYRIGHT YEAR
     ---------------------------------------------------------- */
  var yearEl = document.getElementById('copy-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ----------------------------------------------------------
     2. NAV — SCROLL BEHAVIOR
     ---------------------------------------------------------- */
  var nav = document.getElementById('mainNav');

  function handleScroll() {
    if (!nav) return;
    if (window.scrollY > 24) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll(); // run once on load

  /* ----------------------------------------------------------
     3. MOBILE DRAWER
     ---------------------------------------------------------- */
  var mobileBtn    = document.getElementById('mobileMenuBtn');
  var drawer       = document.getElementById('mobileDrawer');
  var drawerOverlay = document.getElementById('drawerOverlay');
  var drawerClose  = document.getElementById('drawerClose');

  function openDrawer() {
    if (!drawer) return;
    drawer.classList.add('open');
    drawerOverlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    drawerOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (mobileBtn) mobileBtn.setAttribute('aria-expanded', 'true');

    // Move focus into drawer
    var firstLink = $('a, button', drawer);
    if (firstLink) firstLink.focus();
  }

  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawerOverlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawerOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (mobileBtn) {
      mobileBtn.setAttribute('aria-expanded', 'false');
      mobileBtn.focus();
    }
  }

  if (mobileBtn)     mobileBtn.addEventListener('click', openDrawer);
  if (drawerClose)   drawerClose.addEventListener('click', closeDrawer);
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

  // ESC key closes drawer
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && drawer && drawer.classList.contains('open')) {
      closeDrawer();
    }
  });

  // Trap focus inside drawer when open
  if (drawer) {
    drawer.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var focusable = $$('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])', drawer)
        .filter(function (el) { return !el.disabled; });
      if (!focusable.length) return;

      var first = focusable[0];
      var last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ----------------------------------------------------------
     4. SCROLL REVEAL
     ---------------------------------------------------------- */
  var revealEls = $$('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    // Fallback: show everything if IntersectionObserver not available
    revealEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* ----------------------------------------------------------
     5. CONTACT FORM — ASYNC SUBMISSION
     ---------------------------------------------------------- */
  var contactForm = document.getElementById('contactForm');
  var submitBtn   = document.getElementById('submitBtn');
  var formStatus  = document.getElementById('formStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Basic validation
      var name    = document.getElementById('name');
      var email   = document.getElementById('email');
      var message = document.getElementById('message');

      if (!name || !name.value.trim()) {
        showStatus('Please enter your name.', 'error');
        name.focus();
        return;
      }

      if (!email || !email.value.trim() || !isValidEmail(email.value)) {
        showStatus('Please enter a valid email address.', 'error');
        email.focus();
        return;
      }

      if (!message || !message.value.trim()) {
        showStatus('Please include a message.', 'error');
        message.focus();
        return;
      }

      // Disable button + show loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';
      }

      var formData = new FormData(contactForm);

      fetch(contactForm.action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) {
          if (res.ok) {
            contactForm.reset();
            showStatus('Message sent. I\'ll be in touch within 24\u201348 hours.', 'success');
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = 'Send Message <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4"/></svg>';
            }
          } else {
            return res.json().then(function (data) {
              throw new Error(data.error || 'Submission failed.');
            });
          }
        })
        .catch(function (err) {
          showStatus('Something went wrong. Email me directly at craigbaumann2020@gmail.com', 'error');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Send Message <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7h10M8 3l4 4-4 4"/></svg>';
          }
          console.error('Form error:', err);
        });
    });
  }

  function showStatus(msg, type) {
    if (!formStatus) return;
    formStatus.textContent = msg;
    formStatus.style.display = 'block';
    formStatus.style.background = type === 'success'
      ? 'rgba(232,98,10,0.1)'
      : 'rgba(200,50,50,0.1)';
    formStatus.style.border = type === 'success'
      ? '1px solid rgba(232,98,10,0.3)'
      : '1px solid rgba(200,50,50,0.3)';
    formStatus.style.color = type === 'success'
      ? 'var(--color-orange)'
      : '#e05555';
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /* ----------------------------------------------------------
     6. LAZY LOAD IMAGES (fallback for older browsers)
     ---------------------------------------------------------- */
  if (!('loading' in HTMLImageElement.prototype)) {
    var lazyImages = $$('img[loading="lazy"]');
    if ('IntersectionObserver' in window && lazyImages.length) {
      var imageObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            img.src = img.dataset.src || img.src;
            imageObserver.unobserve(img);
          }
        });
      });
      lazyImages.forEach(function (img) { imageObserver.observe(img); });
    }
  }

  /* ----------------------------------------------------------
     7. REDUCED MOTION CHECK
     ---------------------------------------------------------- */
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Show all reveal elements immediately
    $$('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

})();
