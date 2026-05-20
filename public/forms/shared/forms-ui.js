/**
 * Shared Turnstile, loading overlay, and Hormozi-style thank-you screens.
 */
(function (global) {
  var THANK_YOU = {
    free_example: {
      headline: 'Check Your Email — Your Example Is on the Way.',
      body: 'Thanks. We’re sending your free P.Eng. CBA example right now. No fluff — just a real example you can use as your blueprint.',
      steps: [
        'Open your inbox in the next 2 minutes (check spam if needed).',
        'Read the example before you write another word of your CBA.',
        'Use it to cut hours off your submission and avoid costly rejections.',
      ],
      cta: 'The fastest engineers don’t guess. They model what works.',
    },
    free_assessment: {
      headline: 'You’re In. We’ll Contact You Shortly.',
      body: 'Thanks — we received your details. A CertNova specialist will reach out soon. Keep an eye on your email so you don’t miss the next step toward your P.Eng.',
      steps: [
        'Watch your inbox for our message.',
        'Reply quickly if we ask for one detail — speed wins.',
        'Come prepared to move your CBA forward, not spin in circles.',
      ],
      cta: 'Your license is worth the follow-through.',
    },
    cba_review: {
      headline: 'Your Case Is in Expert Hands.',
      body: 'Thanks. Our team of P.Eng. consultants has already started reviewing your case. Expect contact by email and phone call soon — we’re here to get you to a clear next step, fast.',
      steps: [
        'We review your situation with licensed P.Eng. eyes — not generic advice.',
        'You’ll hear from us by email and phone with what to fix first.',
        'You execute. We guide. That’s how rejections turn into approvals.',
      ],
      cta: 'Most people quit after a rejection. You didn’t. That’s the edge.',
    },
  };

  var siteKeyPromise = null;
  var turnstileScriptPromise = null;

  function apiBase() {
    if (typeof global.CERTNOVA_BREVO_FORMS_API === 'string' && global.CERTNOVA_BREVO_FORMS_API.trim()) {
      return global.CERTNOVA_BREVO_FORMS_API.replace(/\/+$/, '');
    }
    try {
      if ((global.location.pathname || '').indexOf('/forms/') !== -1) {
        return global.location.origin;
      }
    } catch (e) {}
    return '';
  }

  function loadTurnstileScript() {
    if (turnstileScriptPromise) return turnstileScriptPromise;
    turnstileScriptPromise = new Promise(function (resolve, reject) {
      if (global.turnstile) {
        resolve();
        return;
      }
      var s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true;
      s.onload = function () {
        return resolve();
      };
      s.onerror = function () {
        return reject(new Error('Could not load security check'));
      };
      document.head.appendChild(s);
    });
    return turnstileScriptPromise;
  }

  function fetchSiteKey() {
    if (siteKeyPromise) return siteKeyPromise;
    var base = apiBase();
    if (!base) {
      siteKeyPromise = Promise.resolve('');
      return siteKeyPromise;
    }
    siteKeyPromise = fetch(base + '/api/config', { headers: { Accept: 'application/json' } })
      .then(function (r) {
        return r.json();
      })
      .then(function (d) {
        return (d && d.turnstileSiteKey) || '';
      })
      .catch(function () {
        return '';
      });
    return siteKeyPromise;
  }

  function ensureOverlay(root) {
    var el = root.querySelector('.cn-loading-overlay');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'cn-loading-overlay';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="cn-loading-spinner"></div><p class="cn-loading-text">Submitting your details…</p>';
    root.appendChild(el);
    return el;
  }

  function ensureThankYou(root) {
    var el = root.querySelector('.cn-thank-you');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'cn-thank-you';
    el.setAttribute('role', 'status');
    el.innerHTML =
      '<div class="cn-thank-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#0063F5" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div>' +
      '<h2 class="cn-thank-headline"></h2>' +
      '<p class="cn-thank-body"></p>' +
      '<ul class="cn-thank-steps"></ul>' +
      '<p class="cn-thank-cta"></p>' +
      '<p class="cn-thank-return-wrap"><a class="cn-thank-return" href="https://competencybasedassessment.ca/">Return to the website: competencybasedassessment.ca</a></p>';
    root.appendChild(el);
    return el;
  }

  function showLoading(root, show, text) {
    var el = ensureOverlay(root);
    if (text) {
      var p = el.querySelector('.cn-loading-text');
      if (p) p.textContent = text;
    }
    el.classList.toggle('cn-show', !!show);
    el.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function showThankYou(root, type) {
    var cfg = THANK_YOU[type] || THANK_YOU.cba_review;
    var panel = ensureThankYou(root);
    panel.querySelector('.cn-thank-headline').textContent = cfg.headline;
    panel.querySelector('.cn-thank-body').textContent = cfg.body;
    panel.querySelector('.cn-thank-cta').textContent = cfg.cta;
    if (!panel.querySelector('.cn-thank-return')) {
      var returnWrap = document.createElement('p');
      returnWrap.className = 'cn-thank-return-wrap';
      returnWrap.innerHTML =
        '<a class="cn-thank-return" href="https://competencybasedassessment.ca/">Return to the website: competencybasedassessment.ca</a>';
      panel.appendChild(returnWrap);
    }
    var steps = panel.querySelector('.cn-thank-steps');
    steps.innerHTML = '';
    cfg.steps.forEach(function (s) {
      var li = document.createElement('li');
      li.textContent = s;
      steps.appendChild(li);
    });

    var wrap = root.querySelector('.cn-form-wrap');
    if (wrap) wrap.hidden = true;
    var stepper = root.querySelector('.cn-stepper');
    if (stepper) stepper.hidden = true;
    var sub = root.querySelector('.cn-sub');
    if (sub) sub.hidden = true;
    var h1 = root.querySelector('h1');
    if (h1) h1.hidden = true;

    panel.classList.add('cn-show');
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function getTurnstileToken(root) {
    var hidden = root.querySelector('input[name="cf-turnstile-response"]');
    if (hidden && hidden.value) return hidden.value;
    return '';
  }

  function renderTurnstile(container, siteKey) {
    if (!container || !siteKey) return Promise.resolve();
    return loadTurnstileScript().then(function () {
      container.innerHTML = '';
      return new Promise(function (resolve) {
        if (!global.turnstile || !global.turnstile.render) {
          resolve();
          return;
        }
        global.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'light',
          callback: function () {
            resolve();
          },
          'error-callback': function () {
            resolve();
          },
        });
      });
    });
  }

  var POWERED_BY_URL = 'https://competencybasedassessment.ca/';

  function ensurePoweredBy(root) {
    if (!root || root.querySelector('.cn-powered-by')) return;
    var el = document.createElement('p');
    el.className = 'cn-powered-by';
    el.innerHTML =
      'Powered by <a href="' +
      POWERED_BY_URL +
      '" target="_blank" rel="noopener noreferrer">CertNova</a>';
    root.appendChild(el);
  }

  function initTurnstile(root) {
    ensurePoweredBy(root);
    var wrap = root.querySelector('.cn-turnstile-wrap');
    if (!wrap) return Promise.resolve();
    return fetchSiteKey().then(function (key) {
      if (!key) {
        wrap.innerHTML =
          '<p style="font-size:0.85rem;color:#c62828;">Security check unavailable. Contact support.</p>';
        return;
      }
      return renderTurnstile(wrap, key);
    });
  }

  function resetTurnstile(root) {
    var wrap = root.querySelector('.cn-turnstile-wrap');
    if (!wrap) return;
    fetchSiteKey().then(function (key) {
      if (key) renderTurnstile(wrap, key);
    });
  }

  /**
   * @param {HTMLElement} root
   * @param {() => Promise<Response>} requestFn
   */
  function submitWithUi(root, requestFn) {
    var token = getTurnstileToken(root);
    if (!token) {
      return Promise.reject(new Error('Please complete the “I’m not a robot” check.'));
    }

    showLoading(root, true, 'Securing your submission…');
    var minDelay = new Promise(function (r) {
      setTimeout(r, 1400);
    });

    return Promise.all([minDelay, requestFn(token)])
      .then(function (results) {
        return results[1];
      })
      .then(function (res) {
        return res.json().then(function (data) {
          return { res: res, data: data };
        });
      })
      .then(function (_ref) {
        showLoading(root, false);
        if (_ref.res.ok && _ref.data && _ref.data.ok) {
          var type = root.getAttribute('data-thank-you') || 'cba_review';
          showThankYou(root, type);
          return _ref;
        }
        var detail =
          (_ref.data && _ref.data.error) || 'Something went wrong. Please check your answers and try again.';
        if (_ref.data && _ref.data.details && _ref.data.details.fieldErrors) {
          var fe = _ref.data.details.fieldErrors;
          var parts = [];
          Object.keys(fe).forEach(function (k) {
            if (fe[k] && fe[k][0]) parts.push(fe[k][0]);
          });
          if (parts.length) detail = parts.join(' ');
        }
        resetTurnstile(root);
        return Promise.reject(new Error(detail));
      })
      .catch(function (err) {
        showLoading(root, false);
        resetTurnstile(root);
        throw err;
      });
  }

  function initAllForms() {
    var roots = document.querySelectorAll('.certnova-form');
    for (var i = 0; i < roots.length; i++) {
      ensurePoweredBy(roots[i]);
    }
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAllForms);
    } else {
      initAllForms();
    }
  }

  global.CertnovaForms = {
    THANK_YOU: THANK_YOU,
    apiBase: apiBase,
    ensurePoweredBy: ensurePoweredBy,
    initTurnstile: initTurnstile,
    showLoading: showLoading,
    showThankYou: showThankYou,
    getTurnstileToken: getTurnstileToken,
    submitWithUi: submitWithUi,
    resetTurnstile: resetTurnstile,
  };
})(typeof window !== 'undefined' ? window : globalThis);
