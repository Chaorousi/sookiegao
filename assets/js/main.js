/* SOOKIE GAO — shared behaviour: loader, nav, reveals, readers, lightbox */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     LOADER — handwritten signature + percentage
     Full ceremony on first visit of the session; quick fade after.
  ---------------------------------------------------------- */
  const loader = document.getElementById('loader');
  if (loader) {
    document.body.classList.add('loading');
    const pctEl = loader.querySelector('.pct');
    const seen = sessionStorage.getItem('sg_seen');
    const MIN = seen ? 2600 : 4000;          // the ceremony plays on every visit
    const t0 = performance.now();
    let pageLoaded = document.readyState === 'complete';
    window.addEventListener('load', () => { pageLoaded = true; });

    function tick() {
      const t = Math.min(1, (performance.now() - t0) / MIN);
      const pct = Math.floor(t * (pageLoaded ? 100 : 92));
      pctEl.textContent = String(pct).padStart(3, '0') + '%';
      if (t >= 1 && pageLoaded) return finish();
      if (document.hidden) setTimeout(tick, 120); else requestAnimationFrame(tick);
    }
    function finish() {
      pctEl.textContent = '100%';
      loader.classList.add('inked');
      setTimeout(() => {
        loader.classList.add('done');
        document.body.classList.remove('loading');
        sessionStorage.setItem('sg_seen', '1');
        setTimeout(() => loader.remove(), 1000);
      }, 500);
    }
    tick();
  }

  /* ----------------------------------------------------------
     ANIMATED FAVICON — Sookie and her cat, from a frame sprite
  ---------------------------------------------------------- */
  (function () {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    const sprite = new Image();
    sprite.src = 'assets/img/favicon-sprite.jpg';
    const cv = document.createElement('canvas');
    cv.width = 64; cv.height = 64;
    const cx = cv.getContext('2d');
    let fi = 0;
    sprite.addEventListener('load', () => {
      setInterval(() => {
        cx.clearRect(0, 0, 64, 64);
        cx.save();
        cx.beginPath(); cx.arc(32, 32, 31, 0, Math.PI * 2); cx.clip();
        cx.drawImage(sprite, (fi % 4) * 96, (fi >> 2) * 96, 96, 96, 0, 0, 64, 64);
        cx.restore();
        link.href = cv.toDataURL('image/png');
        fi = (fi + 1) % 16;
      }, 200);
    });
  })();

  /* make sure muted loop videos actually play (retry until they do, and
     fall back to the first user interaction if autoplay is blocked) */
  function nudgeVideos() {
    document.querySelectorAll('video[autoplay]').forEach(v => {
      if (!v.paused) return;
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    });
  }
  nudgeVideos();
  window.addEventListener('load', nudgeVideos);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) nudgeVideos(); });
  let nudgeTries = 0;
  const nudgeTimer = setInterval(() => {
    nudgeVideos();
    const stuck = [...document.querySelectorAll('video[autoplay]')].some(v => v.paused);
    if (!stuck || ++nudgeTries > 20) clearInterval(nudgeTimer);
  }, 400);
  ['pointerdown', 'touchstart', 'keydown', 'scroll'].forEach(ev =>
    window.addEventListener(ev, nudgeVideos, { once: true, passive: true }));

  /* ----------------------------------------------------------
     NAV — hero-aware colour + solid state after scroll
  ---------------------------------------------------------- */
  const nav = document.querySelector('.nav');
  const hero = document.querySelector('.hero');
  function navState() {
    const y = window.scrollY;
    const heroH = hero ? hero.offsetHeight : 0;
    if (hero && y < heroH - 80) {
      nav.classList.add('on-hero');
      nav.classList.remove('solid');
    } else {
      nav.classList.remove('on-hero');
      nav.classList.add('solid', 'scrolled');
    }
  }
  if (nav) { navState(); window.addEventListener('scroll', navState, { passive: true }); }

  /* mobile menu */
  const burger = document.querySelector('.nav-burger');
  const menu = document.querySelector('.menu');
  if (burger && menu) {
    burger.addEventListener('click', () => menu.classList.add('open'));
    menu.querySelector('.menu-close').addEventListener('click', () => menu.classList.remove('open'));
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
  }

  /* ----------------------------------------------------------
     SCROLL REVEALS
  ---------------------------------------------------------- */
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .reveal-img').forEach(el => io.observe(el));

  /* stagger children of .hgal / .ids-grid a touch */
  document.querySelectorAll('[data-stagger]').forEach(wrap => {
    [...wrap.children].forEach((c, i) => { c.style.transitionDelay = (i * 90) + 'ms'; });
  });

  /* ----------------------------------------------------------
     DRAG-TO-SCROLL for horizontal galleries
  ---------------------------------------------------------- */
  document.querySelectorAll('.hgal, .phone-row').forEach(strip => {
    let down = false, startX = 0, startL = 0, moved = 0;
    strip.addEventListener('pointerdown', e => {
      down = true; moved = 0; startX = e.clientX; startL = strip.scrollLeft;
    });
    window.addEventListener('pointermove', e => {
      if (!down) return;
      const dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      strip.scrollLeft = startL - dx;
    });
    window.addEventListener('pointerup', () => { down = false; });
    // suppress accidental lightbox open after a drag
    strip.addEventListener('click', e => { if (moved > 8) { e.stopPropagation(); e.preventDefault(); } }, true);
  });

  /* ----------------------------------------------------------
     FULLSCREEN DOCUMENT READER  (.doc[data-src][data-pages])
  ---------------------------------------------------------- */
  const reader = document.createElement('div');
  reader.className = 'reader';
  reader.innerHTML =
    '<div class="reader-bar"><span class="reader-title"></span>' +
    '<span class="reader-count"></span>' +
    '<button class="reader-close">Close ✕</button></div>' +
    '<div class="reader-scroll"></div>';
  document.body.appendChild(reader);
  const rTitle = reader.querySelector('.reader-title');
  const rCount = reader.querySelector('.reader-count');
  const rScroll = reader.querySelector('.reader-scroll');

  function openReader(title, buildContent) {
    rTitle.textContent = title;
    rScroll.innerHTML = '';
    buildContent(rScroll);
    reader.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
    rScroll.scrollTop = 0;
  }
  function closeReader() {
    reader.classList.remove('open');
    document.documentElement.style.overflow = '';
  }
  reader.querySelector('.reader-close').addEventListener('click', closeReader);

  document.querySelectorAll('.doc[data-src]').forEach(doc => {
    const n = parseInt(doc.dataset.pages, 10);
    const src = doc.dataset.src;
    const title = doc.dataset.title || 'Document';
    const kind = doc.dataset.kind || 'pages';
    doc.querySelector('.doc-cover').addEventListener('click', () => {
      openReader(title, (mount) => {
        const frag = document.createDocumentFragment();
        for (let i = 1; i <= n; i++) {
          const img = new Image();
          img.src = src + '-' + String(i).padStart(2, '0') + '.jpg';
          img.loading = 'lazy';
          img.dataset.page = i;
          frag.appendChild(img);
        }
        mount.appendChild(frag);
        rCount.textContent = '1 / ' + n + (kind === 'slides' ? ' SLIDES' : '');
        const pio = new IntersectionObserver(ents => {
          ents.forEach(e => {
            if (e.isIntersecting && e.target.clientHeight > 120) {
              rCount.textContent = e.target.dataset.page + ' / ' + n + (kind === 'slides' ? ' SLIDES' : '');
            }
          });
        }, { root: rScroll, threshold: 0.5 });
        mount.querySelectorAll('img').forEach(im => {
          if (im.complete && im.naturalHeight) pio.observe(im);
          else im.addEventListener('load', () => pio.observe(im), { once: true });
        });
      });
    });
  });

  /* essay reader (.essay-open reads from a hidden template) */
  document.querySelectorAll('[data-essay]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tpl = document.getElementById(btn.dataset.essay);
      if (!tpl) return;
      openReader(btn.dataset.title || 'Essay', (mount) => {
        const wrap = document.createElement('div');
        wrap.className = 'essay';
        wrap.innerHTML = tpl.innerHTML;
        mount.appendChild(wrap);
        rCount.textContent = 'ESSAY';
      });
    });
  });

  /* ----------------------------------------------------------
     LIGHTBOX for gallery images  [data-lb="group"]
  ---------------------------------------------------------- */
  const lb = document.createElement('div');
  lb.className = 'lightbox';
  lb.innerHTML = '<button class="lb-close">Close ✕</button>' +
    '<button class="lb-prev" aria-label="previous">←</button>' +
    '<img alt="">' +
    '<button class="lb-next" aria-label="next">→</button>' +
    '<div class="lb-cap"></div>';
  document.body.appendChild(lb);
  const lbImg = lb.querySelector('img');
  const lbCap = lb.querySelector('.lb-cap');
  let group = [], gi = 0;

  function showLB(i) {
    gi = (i + group.length) % group.length;
    const item = group[gi];
    lbImg.src = item.dataset.full || item.src;
    lbCap.textContent = item.dataset.cap || '';
    lb.classList.toggle('scrolly', item.classList.contains('lb-tall'));
  }
  function openLB(items, i) {
    group = items; showLB(i);
    lb.classList.add('open');
    document.documentElement.style.overflow = 'hidden';
  }
  function closeLB() {
    lb.classList.remove('open');
    document.documentElement.style.overflow = '';
    lbImg.src = '';
  }
  lb.querySelector('.lb-close').addEventListener('click', closeLB);
  lb.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); showLB(gi - 1); });
  lb.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); showLB(gi + 1); });
  lb.addEventListener('click', e => { if (e.target === lb || e.target === lbImg) closeLB(); });

  document.querySelectorAll('[data-lb]').forEach(img => {
    img.addEventListener('click', () => {
      const items = [...document.querySelectorAll('[data-lb="' + img.dataset.lb + '"]')];
      openLB(items, items.indexOf(img));
    });
  });

  /* keyboard */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLB(); closeReader(); if (menu) menu.classList.remove('open'); }
    if (lb.classList.contains('open')) {
      if (e.key === 'ArrowLeft') showLB(gi - 1);
      if (e.key === 'ArrowRight') showLB(gi + 1);
    }
    if (reader.classList.contains('open')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') rScroll.scrollBy({ top: rScroll.clientHeight * 0.85, behavior: 'smooth' });
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') rScroll.scrollBy({ top: -rScroll.clientHeight * 0.85, behavior: 'smooth' });
    }
  });
})();
