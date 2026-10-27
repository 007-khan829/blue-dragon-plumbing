/**
 * BLUE DRAGON PLUMBING LLC - CORE VANILLA JS
 * Mobile-first, strict 0-dep, under 10 KB, pause on tab-hide
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // 1. Scroll Reveal (single IntersectionObserver, unobserve once)
    var reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
        reveals.forEach(function (el) { el.classList.add('is-revealed'); });
      } else {
        var obs = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-revealed');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
        reveals.forEach(function (el) { obs.observe(el); });
      }
    }

    // 2. Mobile Nav Drawer
    var navToggle = document.querySelector('.mobile-menu-toggle');
    var navDrawer = document.getElementById('mobile-nav');
    if (navToggle && navDrawer) {
      var toggleMenu = function (open) {
        navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        navDrawer.classList.toggle('is-open', open);
      };
      navToggle.addEventListener('click', function () {
        toggleMenu(navToggle.getAttribute('aria-expanded') !== 'true');
      });
      navDrawer.querySelectorAll('.mobile-nav-link, .btn').forEach(function (l) {
        l.addEventListener('click', function () { toggleMenu(false); });
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
          toggleMenu(false);
          navToggle.focus();
        }
      });
      document.addEventListener('click', function (e) {
        if (!navDrawer.contains(e.target) && !navToggle.contains(e.target) && navDrawer.classList.contains('is-open')) {
          toggleMenu(false);
        }
      });
    }

    // 3. Service Preselect in Quote Form
    var serviceSelect = document.getElementById('service-type');
    document.querySelectorAll('[data-select-service]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var s = this.getAttribute('data-select-service');
        if (serviceSelect && s) serviceSelect.value = s;
      });
    });

    // 4. Quote Form Validation & Submission
    var quoteForm = document.getElementById('quote-form');
    var successCard = document.getElementById('quote-success');
    if (quoteForm && successCard) {
      var nameIn = document.getElementById('user-name');
      var phoneIn = document.getElementById('user-phone');
      var emailIn = document.getElementById('user-email');

      if (phoneIn) {
        phoneIn.addEventListener('input', function (e) {
          var x = e.target.value.replace(/\D/g, '').match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
          if (x) e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
        });
      }

      var validate = function (input, valid, errId) {
        var err = document.getElementById(errId);
        if (!valid) {
          input.classList.add('is-invalid');
          input.setAttribute('aria-invalid', 'true');
          if (err) err.classList.add('is-visible');
          return false;
        }
        input.classList.remove('is-invalid');
        input.removeAttribute('aria-invalid');
        if (err) err.classList.remove('is-visible');
        return true;
      };

      quoteForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var v1 = validate(nameIn, nameIn && nameIn.value.trim().length >= 2, 'name-error');
        var v2 = validate(phoneIn, phoneIn && phoneIn.value.replace(/\D/g, '').length >= 10, 'phone-error');
        var v3 = validate(emailIn, emailIn && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailIn.value.trim()), 'email-error');
        var v4 = validate(serviceSelect, serviceSelect && serviceSelect.value !== '', 'service-error');

        if (v1 && v2 && v3 && v4) {
          var nameSpan = document.getElementById('success-customer-name');
          if (nameSpan) nameSpan.textContent = nameIn.value.trim();
          quoteForm.style.display = 'none';
          successCard.classList.add('is-visible');
          successCard.setAttribute('tabindex', '-1');
          successCard.focus();
        } else {
          var firstErr = quoteForm.querySelector('.is-invalid');
          if (firstErr) firstErr.focus();
        }
      });

      [nameIn, phoneIn, emailIn, serviceSelect].forEach(function (f) {
        if (!f) return;
        var clear = function () {
          f.classList.remove('is-invalid');
          f.removeAttribute('aria-invalid');
          var err = document.getElementById(f.getAttribute('aria-describedby'));
          if (err) err.classList.remove('is-visible');
        };
        f.addEventListener('input', clear);
        f.addEventListener('change', clear);
      });
    }

    // 5. Slide-In Review Popup (Single setTimeout loop, pauses on tab hide)
    var popup = document.getElementById('review-popup');
    if (popup) {
      try {
        if (sessionStorage.getItem('bdp_review_closed') === '1') return;
      } catch (err) {}

      var pText = document.getElementById('popup-text');
      var pAuthor = document.getElementById('popup-author');
      var pDate = document.getElementById('popup-date');
      var pClose = document.getElementById('popup-close-btn');

      var reviews = [
        {
          text: 'None of our toilets were flushing. I called Gilbert and he was out within the hour. Unclogged the line with a smile and super friendly attitude.',
          author: 'Heather',
          date: '10/28/15'
        },
        {
          text: 'Gilbert does amazing work and is super fast. I had him replace a bent outdoor spigot and hose bib. He cut just enough drywall to do a clean job.',
          author: 'Adam H',
          date: '10/2/15'
        },
        {
          text: 'Gilbert was prompt and over delivered! We appreciated that he came out on a Saturday and did not charge an arm or a leg!',
          author: 'Bonnie A.',
          date: '10/31/15'
        }
      ];

      var idx = 0;
      var timerId = null;
      var state = 'initial'; // 'initial' | 'visible' | 'hidden' | 'stopped'
      var timeRemaining = 5000; // First popup appears after 5s
      var startTime = Date.now();

      var setContent = function (i) {
        var r = reviews[i];
        if (pText) pText.textContent = r.text;
        if (pAuthor) pAuthor.textContent = r.author;
        if (pDate) pDate.textContent = r.date;
      };

      var schedule = function (delay) {
        if (state === 'stopped') return;
        startTime = Date.now();
        timeRemaining = delay;
        clearTimeout(timerId);

        timerId = setTimeout(function () {
          if (state === 'stopped') return;
          if (state === 'initial' || state === 'hidden') {
            setContent(idx);
            popup.classList.add('is-visible');
            state = 'visible';
            schedule(6000); // Stays visible 6s
          } else if (state === 'visible') {
            popup.classList.remove('is-visible');
            state = 'hidden';
            idx = (idx + 1) % reviews.length;
            schedule(10000); // Waits 10s then next review
          }
        }, delay);
      };

      // Start initial timer
      schedule(5000);

      // Close button
      if (pClose) {
        pClose.addEventListener('click', function () {
          state = 'stopped';
          clearTimeout(timerId);
          popup.classList.remove('is-visible');
          try { sessionStorage.setItem('bdp_review_closed', '1'); } catch (e) {}
        });
      }

      // Pause/resume when tab visibility changes
      document.addEventListener('visibilitychange', function () {
        if (state === 'stopped') return;
        if (document.hidden) {
          clearTimeout(timerId);
          var elapsed = Date.now() - startTime;
          timeRemaining = Math.max(100, timeRemaining - elapsed);
        } else {
          schedule(timeRemaining);
        }
      });
    }
  });
})();
