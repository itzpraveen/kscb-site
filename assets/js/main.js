// Basic interactivity for KSCB website

(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const CMS = (typeof window !== 'undefined' && window.CMS_CONFIG) ? window.CMS_CONFIG : { provider: 'json' };
  const ASSET_VERSION = '20240524-4';
  const withVersion = (url) => {
    if (!url || /^https?:/i.test(url)) return url;
    return url + (url.includes('?') ? '&' : '?') + 'v=' + ASSET_VERSION;
  };

  // Mobile navigation toggle with overlay, outside click, and ESC to close
  const navToggle = $('.nav-toggle');
  const nav = $('#primary-nav');
  let navOverlay = null;
  const closeMenu = () => {
    if (!nav) return;
    nav.classList.remove('show');
    navToggle && navToggle.setAttribute('aria-expanded', 'false');
    navToggle && navToggle.classList.remove('is-active');
    document.body.classList.remove('menu-open');
    if (navOverlay) navOverlay.remove();
    navOverlay = null;
  };
  const openMenu = () => {
    if (!nav) return;
    nav.classList.add('show');
    navToggle && navToggle.setAttribute('aria-expanded', 'true');
    navToggle && navToggle.classList.add('is-active');
    document.body.classList.add('menu-open');
    if (!navOverlay) {
      navOverlay = document.createElement('div');
      navOverlay.className = 'nav-overlay';
      document.body.appendChild(navOverlay);
      navOverlay.addEventListener('click', closeMenu);
    }
  };
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      if (expanded) closeMenu(); else openMenu();
    });

    // Close menu when clicking a link
    $$('#primary-nav a').forEach((a) => a.addEventListener('click', () => closeMenu()));
    const brandLink = document.querySelector('a.brand[href^="#"]');
    if (brandLink) brandLink.addEventListener('click', () => closeMenu());

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Close on viewport resize to desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 960) closeMenu();
    });
  }

  // Language toggle (EN / ML)
  const LANG_KEY = 'site_lang';
  const langToggleBtn = document.getElementById('langToggle');
  const applyLang = (lang) => {
    document.documentElement.setAttribute('data-lang', lang);
    if (langToggleBtn) langToggleBtn.textContent = lang === 'ml' ? 'EN' : 'മലയാളം';
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    // Re-render dynamic sections for the selected language
    Promise.resolve().then(() => {
      if (typeof renderNotices === 'function') renderNotices();
      if (typeof renderDeposits === 'function') renderDeposits();
      if (typeof renderLoans === 'function') renderLoans();
      if (typeof renderActivities === 'function') renderActivities();
      if (typeof renderGallery === 'function') renderGallery();
      if (typeof renderRates === 'function') renderRates();
    });
  };
  const savedLang = (() => { try { return localStorage.getItem(LANG_KEY); } catch(_) { return null; } })();
  applyLang(savedLang === 'ml' ? 'ml' : 'en');
  if (langToggleBtn) {
    langToggleBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-lang') === 'ml' ? 'ml' : 'en';
      applyLang(cur === 'ml' ? 'en' : 'ml');
    });
  }

  // Smooth scroll for in-page anchors with header offset
  const getHeaderOffset = () => {
    const h = document.querySelector('.site-header');
    return (h ? h.offsetHeight : 72) + 10;
  };
  const scrollToEl = (el) => {
    const y = el.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
  };
  $$("a[href^='#']").forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const id = href.slice(1);
      const target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        scrollToEl(target);
      } else if (id === 'home') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // Utilities
  const getLang = () => (document.documentElement.getAttribute('data-lang') === 'ml' ? 'ml' : 'en');
  const fetchJSON = async (url, fallback) => {
    try {
      const res = await fetch(withVersion(url), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.warn('Using fallback for', url, e);
      return fallback;
    }
  };
  const fetchJSONLocalized = async (baseUrl, fallback) => {
    // Try a Malayalam variant (file.ml.json) when lang is ml
    if (getLang() === 'ml') {
      const mlUrl = baseUrl.replace(/\.json$/, '.ml.json');
      try {
        const res = await fetch(withVersion(mlUrl), { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch (_) { /* ignore and fallback */ }
    }
    return fetchJSON(baseUrl, fallback);
  };

  // i18n helpers for mixed-structure content (string or { en, ml })
  const localize = (en, ml) => (getLang() === 'ml' ? (ml || en) : en);
  const pickLangValue = (val) => {
    const lang = getLang();
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if (val[lang]) return val[lang];
      if (val.en) return val.en;
    }
    return val;
  };
  const pickLangArray = (val) => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === 'object') {
      const lang = getLang();
      if (Array.isArray(val[lang])) return val[lang];
      if (Array.isArray(val.en)) return val.en;
    }
    return [];
  };
  const fetchSanity = async (query, params = {}) => {
    const cfg = CMS.sanity || {};
    if (!cfg.projectId || !cfg.dataset) throw new Error('Sanity not configured');
    const base = `https://${cfg.projectId}.apicdn.sanity.io/v${cfg.apiVersion || '2023-10-01'}/data/query/${cfg.dataset}`;
    const url = new URL(base);
    url.searchParams.set('query', query);
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(`${k}`, typeof v === 'string' ? v : JSON.stringify(v));
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Sanity HTTP ' + res.status);
    const json = await res.json();
    return json.result || [];
  };
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  };

  // Notices: load from JSON or Sanity
  async function renderNotices() {
    const noticeList = $('#notice-list');
    if (!noticeList) return;
    noticeList.innerHTML = '';
    let items = [];
    if (CMS.provider === 'sanity') {
      try {
        items = await fetchSanity("*[_type == 'notice'] | order(date desc){title, date, link}");
      } catch (e) {
        console.warn('Sanity notices failed, falling back', e);
      }
    }
    if (!items.length) {
      const data = await fetchJSONLocalized('assets/data/notices.json', { items: [] });
      items = data.items || [];
    }
    items
      .slice()
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .forEach((n) => {
        const li = el('li');
        const title = el('div', 'title', `<a href="${n.link || '#'}">${n.title}</a>`);
        const meta = el('div', 'meta');
        const d = n.date ? new Date(n.date) : null;
        meta.textContent = d ? d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }) : '';
        li.appendChild(title);
        li.appendChild(meta);
        noticeList.appendChild(li);
      });
    // Ensure any pre-existing skeletons are removed
    try { window.UILoading && window.UILoading.removeSkeletons && window.UILoading.removeSkeletons(noticeList); } catch(_){}
  }

  // Year in footer
  const year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Lightweight number animation for stats
  const animateCount = (el, target, duration = 900) => {
    const start = 0;
    const startTime = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const val = Math.floor(start + (target - start) * p);
      el.textContent = val.toLocaleString() + '+';
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const statMembers = $('#stat-members');
  if (statMembers) {
    // Extract number from existing content, fallback to 10000
    const match = (statMembers.textContent || '').replace(/[^0-9]/g, '');
    const target = match ? parseInt(match, 10) : 10000;
    // Animate when visible
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          animateCount(statMembers, target);
          obs.disconnect();
        }
      });
    }, { threshold: 0.4 });
    obs.observe(statMembers);
  }

  // Enhanced enquiry form handler with security
  const enquiryBtn = $('#enquiry-submit');
  const enquiryForm = enquiryBtn?.closest('form');
  
  if (enquiryBtn && enquiryForm) {
    // Add CSRF token to form
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = SecurityUtils.getCSRFToken();
    enquiryForm.appendChild(csrfInput);
    
    enquiryBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Check rate limiting
      if (!SecurityUtils.canSubmitForm('enquiry')) {
        showNotification('Please wait 30 seconds before submitting again.', 'warning');
        return;
      }
      
      // Collect and validate form data
      const formData = {
        name: $('#name')?.value?.trim(),
        phone: $('#phone')?.value?.trim(),
        message: $('#message')?.value?.trim(),
        csrf_token: csrfInput.value
      };
      
      const validation = SecurityUtils.validateForm(formData);
      
      if (!validation.valid) {
        showNotification(validation.errors.join('<br>'), 'error');
        return;
      }
      
      // Show loading state
      enquiryBtn.disabled = true;
      enquiryBtn.textContent = 'അയക്കുന്നു...';
      
      // Simulate form submission (replace with actual backend call)
      setTimeout(() => {
        enquiryBtn.disabled = false;
        enquiryBtn.textContent = 'അന്വേഷണം അയക്കാം';
        showNotification('നിങ്ങളുടെ അന്വേഷണത്തിന് നന്ദി. ഞങ്ങളുടെ ടീം ഉടൻ ബന്ധപ്പെടുന്നതാണ്.', 'success');
        enquiryForm.reset();
      }, 1000);
    });
  }
  
  // Notification system
  function showNotification(message, type = 'info') {
    const existing = $('.notification');
    if (existing) existing.remove();
    
    const notification = el('div', `notification notification-${type}`);
    notification.innerHTML = SecurityUtils.escapeHtml(message);
    notification.style.cssText = `
      position: fixed;
      top: 90px;
      right: 20px;
      max-width: 320px;
      padding: 16px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 5000);
  }

  // Back-to-top button and active nav highlighting
  const backBtn = document.getElementById('backToTop');
  const navLinks = Array.from(document.querySelectorAll('#primary-nav a[href^="#"]'));
  const sections = ['home','products','services','activities','notices','contact']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  const onScroll = () => {
    if (backBtn) backBtn.classList.toggle('show', window.scrollY > 480);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backBtn) backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const obsNav = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const id = e.target.id;
      const link = navLinks.find(a => a.getAttribute('href') === `#${id}`);
      if (!link) return;
      if (e.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-50% 0px -40% 0px', threshold: 0.01 });
  sections.forEach(s => obsNav.observe(s));

  // Reveal on scroll for sections with data-animate
  const revealTargets = Array.from(document.querySelectorAll('[data-animate]'));
  const obsReveal = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        obsReveal.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });
  revealTargets.forEach(t => obsReveal.observe(t));

  // Fallback: ensure sections are visible after load (in case observer misses)
  window.setTimeout(() => {
    const anyVisible = revealTargets.some(t => t.classList.contains('in-view'));
    if (!anyVisible) revealTargets.forEach(t => t.classList.add('in-view'));
  }, 1200);

  // Site contact: load from JSON or Sanity
  (async () => {
    let data = null;
    if (CMS.provider === 'sanity') {
      try {
        const r = await fetchSanity("*[_type == 'siteSettings'][0]{org, branches, main_phone, support_email, website, phone, email}");
        data = r || null;
      } catch (e) {
        console.warn('Sanity site failed, falling back', e);
      }
    }
    if (!data) data = await fetchJSON('assets/data/site.json', null);
    if (!data) return;
    
    // Update footer contact buttons
    const fCall = document.getElementById('footer-call');
    const fMail = document.getElementById('footer-email');
    const heroCall = document.getElementById('hero-call');
    const heroEmail = document.getElementById('hero-email');
    const heroHours = document.getElementById('hero-hours');
    const navPhone = document.getElementById('nav-phone');
    const navHours = document.getElementById('nav-hours');
    const mainPhone = data.main_phone || data.phone || (Array.isArray(data.branches) && data.branches[0]?.phone) || '';
    const supportEmail = data.support_email || data.email || (Array.isArray(data.branches) && data.branches[0]?.email) || '';
    const branchHours = Array.isArray(data.branches) ? data.branches[0]?.hours : null;
    const sanitizedPhone = mainPhone ? mainPhone.replace(/[^0-9+]/g, '') : '';
    if (fCall && sanitizedPhone) {
      fCall.href = 'tel:' + sanitizedPhone;
      fCall.textContent = 'ഹെഡ് ഓഫീസിലേക്ക് വിളിക്കാം';
    }
    if (fMail && supportEmail) {
      fMail.href = 'mailto:' + supportEmail;
    }
    if (heroCall && sanitizedPhone) {
      heroCall.href = 'tel:' + sanitizedPhone;
      heroCall.textContent = mainPhone;
    }
    if (heroEmail && supportEmail) {
      heroEmail.href = 'mailto:' + supportEmail;
      heroEmail.textContent = supportEmail;
    }
    if (navPhone && sanitizedPhone) {
      navPhone.href = 'tel:' + sanitizedPhone;
      navPhone.textContent = mainPhone;
    }
    const updateHoursNode = (node, enText, mlText) => {
      if (!node) return;
      const en = node.querySelector('[lang="en"]');
      if (en) en.textContent = enText;
      const ml = node.querySelector('[lang="ml"]');
      if (ml) ml.textContent = mlText;
    };
    let enHoursText = 'Mon–Fri, 9:30 AM – 4:30 PM · Sat, 9:30 AM – 1:30 PM';
    let mlHoursText = 'തിങ്കൾ–വെള്ളി, 9:30 AM – 4:30 PM · ശനി, 9:30 AM – 1:30 PM';
    if (branchHours) {
      const weekdays = branchHours.weekdays || '';
      const saturday = branchHours.saturday || '';
      if (weekdays || saturday) {
        enHoursText = saturday && weekdays
          ? `Mon–Fri, ${weekdays} · Sat, ${saturday}`
          : `Mon–Sat, ${weekdays || saturday}`;
        mlHoursText = saturday && weekdays
          ? `തിങ്കൾ–വെള്ളി, ${weekdays} · ശനി, ${saturday}`
          : `തിങ്കൾ–ശനി, ${weekdays || saturday}`;
      }
    }
    updateHoursNode(heroHours, enHoursText, mlHoursText);
    updateHoursNode(navHours, enHoursText, mlHoursText);
  })();

  // Deposits: render from JSON or Sanity
  let depositsRenderToken = 0;
  async function renderDeposits() {
    const container = $('#deposits-grid');
    if (!container) return;
    const token = ++depositsRenderToken;
    container.innerHTML = '';
    let items = [];
    if (CMS.provider === 'sanity') {
      try {
        items = await fetchSanity("*[_type == 'deposit'] | order(_createdAt desc){name, description, features}");
      } catch (e) {
        console.warn('Sanity deposits failed, falling back', e);
      }
    }
    if (!items.length) {
      const data = await fetchJSONLocalized('assets/data/deposits.json', { items: [] });
      items = data.items || [];
    }
    if (token !== depositsRenderToken) return;
    const seen = new Set();
    items.forEach((item) => {
      const key = (item.name && typeof item.name === 'object') ? (item.name.en || item.name.ml || JSON.stringify(item.name)) : item.name;
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      const card = el('article', 'card');
      const name = pickLangValue(item.name);
      const desc = pickLangValue(item.description);
      const features = pickLangArray(item.features);
      card.appendChild(el('h3', '', name));
      if (desc) card.appendChild(el('p', '', desc));
      if (features.length) {
        const details = el('details');
        const sum = el('summary', '', localize('View details', 'വിശദാംശങ്ങൾ'));
        details.appendChild(sum);
        const ul = el('ul', 'tick');
        features.forEach((f) => {
          const li = el('li', '', f);
          ul.appendChild(li);
        });
        details.appendChild(ul);
        card.appendChild(details);
      }
      container.appendChild(card);
    });
    try { window.UILoading && window.UILoading.removeSkeletons && window.UILoading.removeSkeletons(container); } catch(_){}
  }

  // Loans: render from JSON or Sanity
  let loansRenderToken = 0;
  async function renderLoans() {
    const container = $('#loans-grid');
    if (!container) return;
    const token = ++loansRenderToken;
    container.innerHTML = '';
    let items = [];
    if (CMS.provider === 'sanity') {
      try {
        items = await fetchSanity("*[_type == 'loan'] | order(_createdAt desc){name, description}");
      } catch (e) {
        console.warn('Sanity loans failed, falling back', e);
      }
    }
    if (!items.length) {
      const data = await fetchJSONLocalized('assets/data/loans.json', { items: [] });
      items = data.items || [];
    }
    if (token !== loansRenderToken) return;
    const seen = new Set();
    items.forEach((item) => {
      const key = (item.name && typeof item.name === 'object') ? (item.name.en || item.name.ml || JSON.stringify(item.name)) : item.name;
      if (key && seen.has(key)) return;
      if (key) seen.add(key);
      const card = el('article', 'card');
      const name = pickLangValue(item.name);
      const desc = pickLangValue(item.description);
      card.appendChild(el('h3', '', name));
      if (desc) card.appendChild(el('p', '', desc));
      container.appendChild(card);
    });
    try { window.UILoading && window.UILoading.removeSkeletons && window.UILoading.removeSkeletons(container); } catch(_){}
  }

  // Activities: render from JSON or Sanity (no i18n JSON yet)
  async function renderActivities() {
    const container = $('#activities-list');
    if (!container) return;
    container.innerHTML = '';
    let items = [];
    if (CMS.provider === 'sanity') {
      try {
        items = await fetchSanity("*[_type == 'activity'] | order(date desc){title, date, summary, 'imageUrl': image.asset->url}");
      } catch (e) {
        console.warn('Sanity activities failed, falling back', e);
      }
    }
    if (!items.length) {
      const data = await fetchJSON('assets/data/activities.json', { items: [] });
      items = data.items || [];
    }
    items.forEach((item) => {
      const card = el('article', 'card activity-card');
      if (item.imageUrl || item.image) {
        const img = el('img');
        img.src = item.imageUrl || item.image;
        img.alt = item.title || 'Activity image';
        card.appendChild(img);
      }
      card.appendChild(el('h3', '', item.title || ''));
      if (item.summary) card.appendChild(el('p', '', item.summary));
      if (item.date) card.appendChild(el('div', 'activity-meta', new Date(item.date).toLocaleDateString()));
      container.appendChild(card);
    });
    try { window.UILoading && window.UILoading.removeSkeletons && window.UILoading.removeSkeletons(container); } catch(_){}
  }

  // Gallery: render from JSON or Sanity (no i18n JSON yet)
  async function renderGallery() {
    const container = $('#gallery-grid');
    if (!container) return;
    container.innerHTML = '';
    let items = [];
    if (CMS.provider === 'sanity') {
      try {
        items = await fetchSanity("*[_type == 'galleryImage'] | order(_createdAt desc){title, caption, 'imageUrl': image.asset->url}");
      } catch (e) {
        console.warn('Sanity gallery failed, falling back', e);
      }
    }
    if (!items.length) {
      const data = await fetchJSON('assets/data/gallery.json', { items: [] });
      items = data.items || [];
    }
    items.forEach((item) => {
      if (!(item.imageUrl || item.image)) return;
      const g = el('div', 'gitem');
      const img = el('img');
      img.src = item.imageUrl || item.image;
      img.alt = item.title || 'Gallery image';
      g.appendChild(img);
      if (item.title || item.caption) {
        g.appendChild(el('div', 'cap', `${item.title ? `<strong>${item.title}</strong>` : ''}${item.caption ? ` — ${item.caption}` : ''}`));
      }
      container.appendChild(g);
    });
    try { window.UILoading && window.UILoading.removeSkeletons && window.UILoading.removeSkeletons(container); } catch(_){}
  }

  // Rates & charges
  async function renderRates() {
    const table = document.getElementById('rates-table');
    if (!table) return;
    const data = await fetchJSON('assets/data/rates.json', null);
    if (!data) return;
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    (data.deposits || []).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${r.tenure}</td><td>${r.general}</td><td>${r.senior}</td>`;
      tbody.appendChild(tr);
    });
    const eff = document.getElementById('rates-effective');
    if (eff && data.effective_from) eff.textContent = `Effective from: ${new Date(data.effective_from).toLocaleDateString()}`;
    const note = document.getElementById('rates-note');
    if (note && data.note) note.textContent = data.note;
    const chargesList = document.getElementById('charges-list');
    if (chargesList) {
      chargesList.innerHTML = '';
      (data.charges || []).forEach(c => chargesList.appendChild(el('li','',c.text)));
    }
  }

  // Mobile sticky actions
  (async () => {
    const data = await fetchJSON('assets/data/site.json', null);
    const call = document.getElementById('mActCall');
    const mail = document.getElementById('mActEmail');
    if (!data) return;
    const mainPhone = data.main_phone || data.phone || (Array.isArray(data.branches) && data.branches[0]?.phone) || '';
    const supportEmail = data.support_email || data.email || (Array.isArray(data.branches) && data.branches[0]?.email) || '';
    if (call && mainPhone) {
      call.href = 'tel:' + mainPhone.replace(/[^0-9+]/g,'');
      call.setAttribute('aria-label', 'ഹെഡ് ഓഫീസിലേക്ക് വിളിക്കാം');
    }
    if (mail && supportEmail) {
      mail.href = 'mailto:' + supportEmail;
      mail.setAttribute('aria-label', 'ഇമെയിൽ ചെയ്യാം');
    }
  })();

  // Kickoff initial renders
  (async () => {
    await Promise.all([
      renderNotices(),
      renderActivities(),
      renderGallery(),
      renderRates()
    ]);
  })();
})();
