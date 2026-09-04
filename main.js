/* =====================================================================
   SZ VENTURES — main.js
   Global init for AOS · Lenis · Tippy.js · Swup, plus the premium
   interaction layer (preloader, custom cursor, magnetic buttons,
   scroll progress, animated counters, nav). Framework-agnostic,
   reduced-motion aware.
   ===================================================================== */
(function () {
  'use strict';

  // ==== Feature detection =================================================
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Helper selectors
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // Keep track of clean-up functions
  const cleanupFns = [];

  // ==== Preloader =========================================================
  function initPreloader(done) {
    const pre = $('#preloader');
    const count = $('#preCount');
    const bar = $('#preBar');

    // Skip if no preloader or user prefers reduced motion
    if (!pre || prefersReduced) {
      if (pre) pre.classList.add('is-done');
      document.body.classList.remove('is-loading');
      done && done();
      return;
    }

    let progress = 0;
    const maxProgress = 100;
    const tick = setInterval(() => {
      // Accelerate towards 100% but never exceed it
      progress = Math.min(maxProgress, progress + Math.max(1, Math.round((maxProgress - progress) * 0.08)));
      if (count) count.textContent = progress;
      if (bar) bar.style.right = (maxProgress - progress) + '%';

      if (progress >= maxProgress) {
        clearInterval(tick);
        finishPreloader();
      }
    }, 28);

    function finishPreloader() {
      setTimeout(() => {
        if (pre) pre.classList.add('is-done');
        document.body.classList.remove('is-loading');
        done && done();
      }, 380);
    }
  }

  // ==== Lenis Smooth Scroll ===============================================
  let lenis;

  function initLenis() {
    // Disabled JS-based smooth scrolling to guarantee zero-lag native scrolling across all systems.
    return null;
  }

  // ==== AOS (scroll reveals) ==============================================
  function initAOS() {
    if (typeof window.AOS === 'undefined') return;

    const aosInit = {
      disable: prefersReduced,
      once: true,
      mirror: false,
      duration: 800,
      easing: 'ease-out-cubic',
      offset: 90,
      anchorPlacement: 'top-bottom',
    };

    window.AOS.init(aosInit);
    cleanupFns.push(() => window.AOS.destroy());
  }

  // ==== Tippy.js ==========================================================
  function initTippy() {
    if (typeof window.tippy === 'undefined') return;

    window.tippy('[data-tippy-content]', {
      theme: 'sz',
      animation: prefersReduced ? false : 'shift-away',
      delay: [120, 60],
      duration: [200, 150],
      touch: ['hold', 120],
      maxWidth: 260,
      zIndex: 9999,
    });
  }

  // ==== Swup Page Transitions ==============================================
  function initSwup() {
    if (typeof window.Swup === 'undefined') return null;

    const swup = new window.Swup({
      animationSelector: '[class*="transition-"]',
      linkSelector: 'a[href^="' + location.origin + '"], a[href^="/"]',
    });

    // Re‑initialize interactions after each navigation
    swup.hooks?.on('page:view', () => {
      if (window.AOS) window.AOS.refreshHard();
      initTippy();
      bindMagnetics();
    });

    cleanupFns.push(() => swup.destroy());
    return swup;
  }

  // ==== Custom Cursor ======================================================
  function initCursor() {
    if (!isFinePointer || prefersReduced) return;

    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');

    if (!dot || !ring) return;

    let mx = 0, my = 0, rx = 0, ry = 0;
    let rafId;

    const onMouseMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const followDot = () => {
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
      requestAnimationFrame(followDot);
    };

    const followRing = () => {
      // Damped spring interpolation
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(followRing);
    };

    window.addEventListener('mousemove', onMouseMove);
    followDot();
    followRing();

    const hot = 'a, button, [data-cursor], input, textarea, [data-magnetic]';
    const hoverIn = () => document.body.classList.add('cursor-hover');
    const hoverOut = () => document.body.classList.remove('cursor-hover');

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hot)) hoverIn();
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hot)) hoverOut();
    });

    // Cleanup on unload
    cleanupFns.push(() => {
      cancelAnimationFrame(rafId);
      dot?.removeEventListener('mouseover', hoverIn);
      dot?.removeEventListener('mouseout', hoverOut);
    });
  }

  // ==== Magnetic Buttons ==================================================
  function bindMagnetics() {
    if (!isFinePointer || prefersReduced) return;

    $$('[data-magnetic]').forEach((el) => {
      if (el.dataset.magBound) return;
      el.dataset.magBound = '1';

      const strength = 0.35;

      const onMove = (e) => {
        const { left, top, width, height } = el.getBoundingClientRect();
        const x = (e.clientX - (left + width / 2)) * strength;
        const y = (e.clientY - (top + height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      };

      const onLeave = () => {
        el.style.transform = '';
      };

      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanupFns.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
        el.style.transform = '';
      });
    });
  }

  // ==== Scroll Progress & Nav State =======================================
  function initScrollUI() {
    const bar = $('.progress span');
    const nav = $('#nav');

    const update = () => {
      const docEl = document.documentElement;
      const max = docEl.scrollHeight - docEl.clientHeight;

      if (bar) {
        const percent = max > 0 ? (docEl.scrollTop / max) * 100 : 0;
        bar.style.width = percent + '%';
      }
      if (nav) nav.classList.toggle('is-scrolled', docEl.scrollTop > 24);
    };

    window.addEventListener('scroll', update, { passive: true });
    if (lenis) lenis.on('scroll', update);
    cleanupFns.push(() => {
      window.removeEventListener('scroll', update);
      if (lenis) lenis.off('scroll', update);
    });
    update();
  }

  // ==== Mobile Menu =======================================================
  function initMenu() {
    const toggle = $('#navToggle');
    const menu = $('#menu');

    if (!toggle || !menu) return;

    const closeMenu = () => {
      document.body.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
    };

    toggle.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('menu-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    });

    $$('[data-menu-link]').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    cleanupFns.push(closeMenu);
  }

  // ==== Animated Counters =================================================
  function initCounters() {
    const els = $$('[data-count]');
    if (!els.length) return;

    const format = (v, prefix = '', suffix = '') =>
      (prefix ? prefix : '') + Math.round(v).toLocaleString('en-US') + (suffix ? suffix : '');

    const runCounter = (el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';

      if (prefersReduced) {
        el.textContent = format(target, prefix, suffix);
        return;
      }

      const start = performance.now();
      const duration = 1600;

      const tick = (now) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.textContent = format(target * eased, prefix, suffix);
        if (progress < 1) requestAnimationFrame(tick);
        else el.textContent = format(target, prefix, suffix);
      };
      requestAnimationFrame(tick);
    };

    // Immediate fallback if IntersectionObserver isn’t supported
    if (!('IntersectionObserver' in window)) {
      els.forEach(runCounter);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            io.unobserve(entry.target); // stop observing once animated
          }
        });
      },
      { threshold: 0.5 }
    );
    els.forEach((el) => io.observe(el));
  }

  // ==== Smooth Anchor Scrolling ============================================
  function initAnchors() {
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href');
        if (id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        if (lenis) {
          lenis.scrollTo(target, { offset: -70 });
        } else {
          target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }
        history.replaceState(null, '', id);
      });
    });
  }

  // ==== Role Switcher (Partnership Intake Engine) =======================
  function initRoleSwitcher() {
    const selector = $('.role-selector');
    if (!selector) return;

    const btns = $$('.role-btn', selector);
    const hiddenRoleInput = $('#intakeRole');
    const hiddenVentureInput = $('#intakeVenture');
    const dynamicLabel = $('#intakeDynamicLabel');
    const dynamicInput = $('#intakeDynamicInput');
    const detailsLabel = $('#intakeDetailsLabel');

    const roleConfigs = {
      company: {
        role: 'Company / Enterprise',
        venture: 'SZ Manufacturing / SZ Ventures',
        dynamicLabel: 'Company Name & Industry',
        dynamicPlaceholder: 'e.g. Acme Corp (Textiles & Retail)',
        detailsLabel: 'Describe your corporate requirement or operational challenge'
      },
      college: {
        role: 'College / Academic Institution',
        venture: 'Mirai Engineering',
        dynamicLabel: 'College / University Name',
        dynamicPlaceholder: 'e.g. National Institute of Technology',
        detailsLabel: 'How can Mirai Engineering assist your students & institution?'
      },
      manufacturer: {
        role: 'Manufacturer / Supply Chain Partner',
        venture: 'SZ Manufacturing',
        dynamicLabel: 'Production Capabilities & Location',
        dynamicPlaceholder: 'e.g. Apparel Manufacturing (Tirupur, India)',
        detailsLabel: 'Detail your production capacity, certifications & partnership goals'
      },
      ngo: {
        role: 'NGO / Social Impact Organization',
        venture: 'SZ Manufacturing / SZ Ventures',
        dynamicLabel: 'Organization Name & Focus Area',
        dynamicPlaceholder: 'e.g. Women Empowerment Initiative',
        detailsLabel: 'Tell us how we can collaborate on social impact initiatives'
      },
      investor: {
        role: 'Investor / Capital Partner',
        venture: 'SZ Ventures',
        dynamicLabel: 'Fund / Entity Name',
        dynamicPlaceholder: 'e.g. Apex Horizon Capital',
        detailsLabel: 'What stage or venture category aligns with your investment thesis?'
      },
      creator: {
        role: 'Creator / Artisan',
        venture: 'TerraMuse',
        dynamicLabel: 'Craft / Specialty & Portfolio Link',
        dynamicPlaceholder: 'e.g. Ceramics & Handcrafted Decor (instagram.com/crafts)',
        detailsLabel: 'Tell us about your creative work or custom commission idea'
      },
      tech: {
        role: 'Technology Partner',
        venture: 'SnapOps / SZ Ventures',
        dynamicLabel: 'Platform / Technology Expertise',
        dynamicPlaceholder: 'e.g. WhatsApp API / Robotics Autonomy Stack',
        detailsLabel: 'Describe your technology capabilities and integration interest'
      },
      opportunity: {
        role: 'Business Opportunity / Founder',
        venture: 'SZ Ventures',
        dynamicLabel: 'Venture Concept or Market Opportunity',
        dynamicPlaceholder: 'e.g. B2B Operations Automation for Logistics',
        detailsLabel: 'Share a high-level overview of the problem, market opportunity & execution needs'
      }
    };

    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');

        const roleKey = btn.dataset.role || 'company';
        const config = roleConfigs[roleKey] || roleConfigs['company'];

        if (hiddenRoleInput) hiddenRoleInput.value = config.role;
        if (hiddenVentureInput) hiddenVentureInput.value = config.venture;
        if (dynamicLabel) dynamicLabel.textContent = config.dynamicLabel;
        if (dynamicInput) dynamicInput.placeholder = config.dynamicPlaceholder;
        if (detailsLabel) detailsLabel.textContent = config.detailsLabel;
      });
    });
  }

  // ==== Boot ==============================================================
  function boot() {
    initLenis();
    initAOS();
    initTippy();
    initSwup();
    initCursor();
    bindMagnetics();
    initScrollUI();
    initMenu();
    initCounters();
    initAnchors();
    initRoleSwitcher();
    // Ensure AOS is refreshed after all resources are loaded
    window.addEventListener('load', () => window.AOS && window.AOS.refresh());
  }

  // ==== Run ===============================================================
  initPreloader(boot);

  // ==== Cleanup on Unload =================================================
  window.addEventListener('beforeunload', () => {
    cleanupFns.forEach((fn) => fn());
  });
})();