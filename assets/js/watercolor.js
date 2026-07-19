/* Generative watercolor decorations — adapted from the studio reference pieces.
   Mounts on: canvas[data-wc-icon="heart|megaphone|magnify"]
              canvas[data-wc="flowers"]   (Symbiotic Healing)
              canvas[data-wc="cats"]      (Paws Club)
   Each canvas animates once, when it enters the viewport. */
(function () {
  'use strict';

  /* ---------- shared brush ---------- */
  function Brush(ctx) { this.ctx = ctx; }
  Brush.prototype.stroke = function (x1, y1, x2, y2, c, w, o) {
    const ctx = this.ctx;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo((x1 + x2) / 2 + (Math.random() - .5) * 8, (y1 + y2) / 2 + (Math.random() - .5) * 8, x2, y2);
    ctx.strokeStyle = 'hsla(' + (c.h + Math.random() * 6 - 3) + ',' + c.s + '%,' + (c.l + Math.random() * 10 - 5) + '%,' + o + ')';
    ctx.lineWidth = w * (.8 + Math.random() * .4);
    ctx.lineCap = 'round'; ctx.stroke();
  };
  Brush.prototype.wash = function (x, y, r, c, o) {
    const ctx = this.ctx;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(' + c.h + ',' + c.s + '%,' + c.l + '%,' + o + ')'; ctx.fill();
  };
  Brush.prototype.blob = function (x, y, radius, c, o, angle, stretch) {
    const ctx = this.ctx;
    const a0 = angle == null ? Math.random() * Math.PI : angle;
    const st = stretch == null ? (1.1 + Math.random() * .3) : stretch;
    for (let i = 0; i < 3; i++) {
      const jx = (Math.random() - .5) * radius * .35, jy = (Math.random() - .5) * radius * .35;
      const r = Math.max(.8, radius * (.75 + Math.random() * .45));
      ctx.beginPath();
      ctx.ellipse(x + jx, y + jy, r * st, r * (.62 + Math.random() * .38), a0 + (Math.random() - .5) * .3, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + (c.h + Math.random() * 8 - 4) + ',' + c.s + '%,' + (c.l + Math.random() * 12 - 6) + '%,' + o + ')';
      ctx.fill();
    }
  };
  Brush.prototype.splatter = function (x, y, r, c, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, d = Math.random() * r;
      this.wash(x + Math.cos(a) * d, y + Math.sin(a) * d, Math.random() * 2.5 + .5, c, .05 + Math.random() * .05);
    }
  };
  Brush.prototype.streak = function (x1, y1, x2, y2, radius, color, opacity, stretch) {
    stretch = stretch == null ? 2 : stretch;
    const steps = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / (radius * 0.8));
    const a = Math.atan2(y2 - y1, x2 - x1);
    for (let i = 0; i <= steps; i++) {
      const t = steps === 0 ? 0 : i / steps;
      this.blob(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, radius, color, opacity, a, stretch);
    }
  };

  function setup(canvas) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    return { ctx: ctx, w: w, h: h, brush: new Brush(ctx) };
  }

  /* time-based driver: catches up when rAF is throttled (hidden tabs),
     so an animation always completes even if the user switches away */
  function drive(stepFn, onDone) {
    let last = performance.now();
    function tick() {
      const now = performance.now();
      let steps = Math.min(80, Math.max(1, Math.round((now - last) / 16.7)));
      last = now;
      let done = false;
      while (steps-- > 0 && !done) done = !!stepFn();
      if (!done) {
        if (document.hidden) setTimeout(tick, 80);
        else requestAnimationFrame(tick);
      } else if (onDone) onDone();
    }
    tick();
  }

  /* paint, hold, gently wash out, paint again: keeps the pieces alive */
  function driveLoop(canvas, runFn, holdMs) {
    let stop = false;
    function cycle() {
      if (stop || !document.body.contains(canvas)) return;
      runFn(() => {
        setTimeout(() => {
          if (stop || !document.body.contains(canvas)) return;
          const ctx = canvas.getContext('2d');
          let f = 0;
          drive(() => {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.globalCompositeOperation = 'destination-out';
            ctx.fillStyle = 'rgba(0,0,0,0.10)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            return ++f >= 34;
          }, () => {
            const c = canvas.getContext('2d');
            c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
            c.clearRect(0, 0, canvas.width, canvas.height); c.restore();
            cycle();
          });
        }, holdMs);
      });
    }
    cycle();
  }

  /* ---------- watercolor icons ---------- */
  function runIcon(canvas, onDone) {
    const s0 = setup(canvas);
    if (!s0) return;
    const brush = s0.brush, ctx = s0.ctx;
    const cx = s0.w / 2, cy = s0.h / 2, s = Math.min(s0.w, s0.h) / 100;
    const type = canvas.dataset.wcIcon;
    let age = 0;
    const washCol = Math.random() > .5 ? { h: 40, s: 30, l: 82 } : { h: 200, s: 22, l: 82 };

    function frame() {
      age++;
      if (age % 3 === 0 && age < 55) {
        brush.blob(cx + (Math.random() - .5) * 55 * s, cy + (Math.random() - .5) * 45 * s, 32 * s * (Math.random() + .5), washCol, .03, Math.random() * Math.PI, 1.5 + Math.random());
      }
      ctx.save(); ctx.translate(cx, cy);
      if (type === 'heart') drawHeart();
      else if (type === 'megaphone') drawMegaphone();
      else if (type === 'magnify') drawMagnify();
      ctx.restore();
      return age > 100;
    }

    function drawHeart() {
      if (age < 45) {
        const t = age / 45;
        // two lobes + tip growing
        brush.blob(-12 * s * t, -10 * s, 15 * s * t, { h: 352, s: 68, l: 60 }, .09, -.5, 1.15);
        brush.blob(12 * s * t, -10 * s, 15 * s * t, { h: 352, s: 68, l: 60 }, .09, .5, 1.15);
        brush.blob(0, 8 * s * t, 16 * s * t, { h: 352, s: 74, l: 55 }, .09, Math.PI / 2, 1.25);
      } else if (age < 80) {
        if (Math.random() > .5) brush.blob((Math.random() - .5) * 14 * s, (Math.random() - .4) * 12 * s, 9 * s, { h: 348, s: 74, l: 48 }, .08, Math.random() * Math.PI, 1.2);
        if (age === 60) { brush.blob(-7 * s, -12 * s, 6 * s, { h: 344, s: 60, l: 80 }, .16, -.4, 1.3); }
        if (age === 70) brush.stroke(16 * s, -18 * s, 26 * s, -28 * s, { h: 352, s: 62, l: 50 }, 2 * s, .4);
        if (age === 74) brush.stroke(22 * s, -9 * s, 33 * s, -11 * s, { h: 352, s: 62, l: 50 }, 1.7 * s, .35);
      } else if (age === 90) {
        brush.splatter(0, 0, 34 * s, { h: 352, s: 70, l: 50 }, 7);
      }
    }
    function drawMegaphone() {
      if (age < 40) {
        const t = age / 40;
        brush.blob((-15 + t * 30) * s, 0, (11 + t * 11) * s, { h: 350, s: 64, l: 62 }, .09, 0, 1.2);
      } else if (age < 70) {
        if (age === 50) brush.blob(-22 * s, 0, 12 * s, { h: 210, s: 26, l: 38 }, .16, Math.PI / 2, 2.0);
        if (age === 55) brush.blob(22 * s, 0, 24 * s, { h: 350, s: 74, l: 52 }, .13, Math.PI / 2, 1.5);
        if (age === 65) brush.stroke(-6 * s, 6 * s, -6 * s, 28 * s, { h: 210, s: 26, l: 38 }, 6 * s, .4);
      } else if (age < 92) {
        if (age === 75) brush.stroke(36 * s, -16 * s, 46 * s, 0, { h: 40, s: 85, l: 55 }, 3.5 * s, .5);
        if (age === 80) brush.stroke(46 * s, 0, 36 * s, 16 * s, { h: 40, s: 85, l: 55 }, 3.5 * s, .5);
        if (age === 85) brush.stroke(46 * s, -27 * s, 62 * s, 0, { h: 40, s: 85, l: 55 }, 3 * s, .4);
        if (age === 88) brush.stroke(62 * s, 0, 46 * s, 27 * s, { h: 40, s: 85, l: 55 }, 3 * s, .4);
      }
    }
    function drawMagnify() {
      if (age < 40) {
        const a = (age / 40) * Math.PI * 2, r = 16 * s;
        brush.blob(Math.cos(a) * r - 8 * s, Math.sin(a) * r - 8 * s, 7 * s, { h: 212, s: 40, l: 38 }, .11, a, 2.0);
      } else if (age < 70) {
        if (Math.random() > .5) brush.stroke(4 * s, 4 * s, 28 * s, 28 * s, { h: 25, s: 52, l: 33 }, 7 * s, .38);
      } else if (age < 92) {
        if (age === 75) brush.blob(-8 * s, -8 * s, 13 * s, { h: 200, s: 55, l: 82 }, .09, Math.PI / 4, 1.4);
        if (age === 82) brush.blob(-12 * s, -6 * s, 4 * s, { h: 120, s: 45, l: 45 }, .14, .6, 1.8);
        if (age === 85) brush.stroke(-17 * s, -9 * s, -6 * s, -9 * s, { h: 205, s: 70, l: 45 }, 2.2 * s, .4);
        if (age === 88) brush.blob(-5 * s, -15 * s, 4 * s, { h: 45, s: 85, l: 55 }, .16, 0, 1.2);
      }
    }
    drive(frame, onDone);
  }

  /* ---------- flowers (Symbiotic Healing) ---------- */
  function runFlowers(canvas, onDone) {
    const env = setup(canvas);
    if (!env) return;
    const ctx = env.ctx, brush = env.brush, W = env.w, H = env.h;
    const PAL = {
      stems: [{ h: 140, s: 30, l: 35 }, { h: 130, s: 25, l: 40 }, { h: 145, s: 20, l: 30 }],
      flowers: [{ h: 348, s: 72, l: 58 }, { h: 332, s: 64, l: 64 }, { h: 12, s: 72, l: 62 }, { h: 286, s: 40, l: 58 }, { h: 218, s: 48, l: 61 }, { h: 198, s: 62, l: 58 }, { h: 44, s: 62, l: 74 }],
      calyx: { h: 132, s: 34, l: 30 }, vase: { h: 0, s: 20, l: 88 }
    };
    const scaleAll = Math.min(W / 420, H / 420);
    const VH = 120 * scaleAll, VW = 52 * scaleAll, MOUTH = .34;
    const startX = W / 2, startY = H * .62;

    // vase
    (function () {
      for (let i = 0; i < 60; i++) {
        const t = i / 59, y = startY + (1 - t) * VH, p = Math.sin(t * Math.PI);
        const w = VW * (MOUTH + p * .66);
        ctx.beginPath(); ctx.moveTo(startX - w, y); ctx.lineTo(startX + w, y);
        ctx.lineWidth = 2 + Math.random() * 1.6;
        ctx.strokeStyle = 'hsla(' + PAL.vase.h + ',' + PAL.vase.s + '%,' + (PAL.vase.l - Math.random() * 12) + '%,0.1)';
        ctx.stroke();
      }
    })();

    function Stem(x, y, hgt, ang) {
      this.segments = []; this.growSpeed = 2 + Math.random() * 2; this.cur = 0; this.hasFlower = false;
      let cx = x, cy = y, ca = ang; const step = 4.4 * scaleAll;
      const n = Math.floor(hgt / step);
      for (let i = 0; i < n; i++) {
        ca += (-Math.PI / 2 - ca) * .02 + (Math.random() - .5) * .05;
        cx += Math.cos(ca) * step; cy += Math.sin(ca) * step;
        this.segments.push({ x: cx, y: cy });
      }
    }
    Stem.prototype.drawStep = function () {
      const end = Math.min(this.segments.length, Math.floor(this.cur += this.growSpeed));
      for (let i = Math.max(1, end - 4); i < end; i++) {
        const p = this.segments[i - 1], q = this.segments[i];
        const w = 2.6 * (1 - i / this.segments.length) + .8;
        brush.stroke(p.x, p.y, q.x, q.y, PAL.stems[1], w, .15);
        brush.stroke(p.x, p.y, q.x, q.y, PAL.stems[2], w * .55, .18);
        if (Math.random() < .05) {
          const la = Math.random() * Math.PI * 2, ll = (10 + Math.random() * 14) * scaleAll;
          brush.blob(q.x + Math.cos(la) * ll * .5, q.y + Math.sin(la) * ll * .5, 4.5 * scaleAll, PAL.stems[0], .09, la, 2.1);
        }
      }
      return end >= this.segments.length;
    };

    function Flower(x, y, sc) {
      this.x = x; this.y = y; this.sc = sc; this.age = 0; this.maxAge = 80 + Math.random() * 30;
      const base = PAL.flowers[Math.floor(Math.random() * PAL.flowers.length)];
      this.base = base;
      this.dark = { h: base.h, s: Math.min(100, base.s + 10), l: Math.max(18, base.l - 22) };
      this.light = { h: base.h, s: Math.max(20, base.s - 8), l: Math.min(84, base.l + 14) };
      this.petals = [];
      const layers = 3;
      for (let L = 0; L < layers; L++) {
        const count = 5 + L * 2, arc = 2.1 + L * .14;
        for (let i = 0; i < count; i++) {
          const t = count > 1 ? i / (count - 1) : 0;
          this.petals.push({
            a: -Math.PI / 2 + (t - .5) * arc + (Math.random() - .5) * .25,
            d: (5 + L * 4.6 + Math.random() * 2.6) * sc,
            r: (6.2 + L * 2.5 + Math.random() * 2) * sc,
            L: L
          });
        }
      }
    }
    Flower.prototype.drawStep = function () {
      this.age++;
      const bloom = .25 + Math.min(1, this.age / 55) * .75;
      for (let i = 0; i < this.petals.length; i++) {
        const p = this.petals[i];
        if (Math.random() > .5) continue;
        const px = this.x + Math.cos(p.a) * p.d * bloom, py = this.y - 8 * this.sc * bloom + Math.sin(p.a) * p.d * bloom;
        let tone = p.L === 0 ? this.dark : (p.L === 2 ? this.light : this.base);
        brush.blob(px, py, p.r * bloom, tone, .05, Math.random() * .4 - .2, 1.35);
      }
      if (this.age > 6 && Math.random() > .7) brush.blob(this.x, this.y - 8 * this.sc * bloom, 4.5 * this.sc, this.dark, .06, 0, 1.2);
      return this.age >= this.maxAge;
    };

    const stems = [], flowers = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const fan = (i / (count - 1) - .5);
      stems.push(new Stem(
        startX + fan * VW * MOUTH * 2.2 + (Math.random() - .5) * 8,
        startY,
        H * (.26 + Math.random() * .14),
        -Math.PI / 2 + fan * .16 + (Math.random() - .5) * .08
      ));
    }
    function loop() {
      let active = false;
      stems.forEach(st => {
        const done = st.drawStep();
        if (!done) active = true;
        else if (!st.hasFlower) {
          st.hasFlower = true;
          const tip = st.segments[st.segments.length - 1];
          flowers.push(new Flower(tip.x, tip.y, (0.72 + Math.random() * .3) * scaleAll));
        }
      });
      flowers.forEach(f => { if (!f.done) { f.done = f.drawStep(); } if (!f.done) active = true; });
      return !active;
    }
    drive(loop, onDone);
  }

  /* ---------- cats (Paws Club) ---------- */
  function runCats(canvas, onDone) {
    const env = setup(canvas);
    if (!env) return;
    const brush = env.brush, ctx = env.ctx, W = env.w, H = env.h;
    const PALETTES = [
      { base: { h: 28, s: 70, l: 65 }, dark: { h: 20, s: 80, l: 45 }, light: { h: 35, s: 50, l: 85 } },
      { base: { h: 210, s: 15, l: 55 }, dark: { h: 220, s: 20, l: 35 }, light: { h: 200, s: 10, l: 80 } },
      { base: { h: 0, s: 0, l: 28 }, dark: { h: 0, s: 0, l: 16 }, light: { h: 0, s: 0, l: 46 } },
      { base: { h: 35, s: 30, l: 78 }, dark: { h: 25, s: 40, l: 50 }, light: { h: 45, s: 20, l: 94 } }
    ];
    function Cat(x, y, sc, pose) {
      this.x = x; this.y = y; this.s = sc; this.pose = pose % 3;
      this.p = PALETTES[Math.floor(Math.random() * PALETTES.length)];
      this.age = 0; this.maxAge = 110 + Math.random() * 30;
      this.dir = Math.random() > .5 ? 1 : -1;
      this.rot = (Math.random() - .5) * .18;
    }
    Cat.prototype.draw = function () {
      if (this.age > this.maxAge) return true;
      this.age++;
      const p = this.p, s = this.s, dir = this.dir;
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
      if (this.pose === 0) { /* sitting */
        const bodyY = 15 * s, headY = -35 * s;
        if (this.age < 26) {
          brush.blob(0, bodyY, 35 * s, p.light, .04, Math.PI / 2, 1.4);
          brush.blob(0, headY, 22 * s, p.light, .04, 0, 1.1);
        } else if (this.age < 64) {
          if (Math.random() > .3) brush.blob((Math.random() - .5) * 10 * s, bodyY + (Math.random() - .5) * 15 * s, 30 * s, p.base, .06, Math.PI / 2, 1.3);
          if (Math.random() > .4) brush.blob((Math.random() - .5) * 5 * s, headY + (Math.random() - .5) * 5 * s, 20 * s, p.base, .06, 0, 1.05);
          if (Math.random() > .8) brush.blob(25 * s * dir, bodyY + 15 * s, 12 * s, p.base, .05, Math.PI / 4 * dir, 2.5);
        } else if (this.age < 95) {
          brush.blob(-12 * s, headY - 18 * s, 8 * s, p.dark, .05, -.4, 1.5);
          brush.blob(12 * s, headY - 18 * s, 8 * s, p.dark, .05, .4, 1.5);
          brush.blob(-8 * s * dir, bodyY + 10 * s, 25 * s, p.dark, .03, Math.PI / 2.2 * dir, 1.5);
        } else {
          if (Math.random() > .8) brush.stroke(0, headY, 15 * s * dir, headY + 5 * s, p.dark, 1.5, .2);
          if (this.age === Math.floor(this.maxAge - 5)) brush.splatter(0, bodyY, 55 * s, { h: 350, s: 40, l: 65 }, 4);
        }
      } else if (this.pose === 1) { /* curled */
        if (this.age < 26) brush.blob(0, 0, 40 * s, p.light, .04, 0, 1.6);
        else if (this.age < 64) {
          if (Math.random() > .3) brush.blob((Math.random() - .5) * 15 * s, (Math.random() - .5) * 10 * s, 35 * s, p.base, .06, .1 * dir, 1.5);
          if (Math.random() > .6) brush.blob(-20 * s * dir, 5 * s, 18 * s, p.dark, .05, -.2 * dir, 1.1);
          if (Math.random() > .7) brush.blob(15 * s * dir, 10 * s, 15 * s, p.base, .05, -.3 * dir, 2.0);
        } else if (this.age < 95) {
          brush.blob(0, -5 * s, 25 * s, p.dark, .03, 0, 1.4);
          brush.blob(-25 * s * dir, -5 * s, 6 * s, p.dark, .05, -.6 * dir, 1.6);
        } else if (Math.random() > .9) brush.stroke(-15 * s * dir, 5 * s, -30 * s * dir, 10 * s, p.dark, 1, .15);
      } else { /* playful */
        const bx = -10 * s * dir, by = 10 * s, hx = 20 * s * dir, hy = -20 * s;
        if (this.age < 26) {
          brush.blob(bx, by, 30 * s, p.light, .04, -Math.PI / 4 * dir, 1.8);
          brush.blob(hx, hy, 18 * s, p.light, .04, 0, 1.1);
        } else if (this.age < 64) {
          if (Math.random() > .3) brush.blob(bx + (Math.random() - .5) * 10 * s, by + (Math.random() - .5) * 10 * s, 25 * s, p.base, .06, -Math.PI / 4 * dir, 1.7);
          if (Math.random() > .4) brush.blob(hx + (Math.random() - .5) * 5 * s, hy + (Math.random() - .5) * 5 * s, 16 * s, p.base, .06, 0, 1.05);
          if (Math.random() > .7) brush.blob(-35 * s * dir, -10 * s, 10 * s, p.base, .05, Math.PI / 3 * dir, 2.5);
        } else if (this.age < 95) {
          brush.blob(hx - 8 * s * dir, hy - 15 * s, 7 * s, p.dark, .05, -.3 * dir, 1.5);
          brush.blob(hx + 10 * s * dir, hy - 12 * s, 7 * s, p.dark, .05, .5 * dir, 1.5);
          brush.blob(bx + 5 * s * dir, by, 20 * s, p.dark, .03, -Math.PI / 3 * dir, 1.4);
        } else {
          if (Math.random() > .8) brush.stroke(hx, hy, hx + 15 * s * dir, hy - 5 * s, p.dark, 1.2, .2);
        }
      }
      ctx.restore();
      return false;
    };
    const cats = [];
    const duo = canvas.hasAttribute('data-duo');
    const n = duo ? 2 : (W < 500 ? 2 : 3);
    for (let i = 0; i < n; i++) {
      const spread = W < 480 ? .20 : .26;   // keep cats fully inside narrow canvases
      const cx = duo
        ? W * (i === 0 ? .5 - spread : .5 + spread) + (Math.random() - .5) * W * .04
        : W * (.18 + .64 * (n === 1 ? .5 : i / (n - 1))) + (Math.random() - .5) * W * .06;
      const cy = duo ? H * (.46 + Math.random() * .08) : H * (.45 + Math.random() * .2);
      const sc = Math.min(W, H) / 260 * (.8 + Math.random() * .4);
      // ambient wash
      const washCol = Math.random() > .5 ? { h: 40, s: 20, l: 85 } : { h: 200, s: 15, l: 85 };
      for (let k = 0; k < 12; k++) brush.blob(cx + (Math.random() - .5) * 130 * sc, cy + (Math.random() - .5) * 90 * sc, 34 * sc * (Math.random() + .5), washCol, .012, Math.random() * Math.PI, 1.6);
      const cat = new Cat(cx, cy, sc, duo ? (i === 0 ? 0 : 2) : i);
      if (duo && cat.p.dark.l < 20) cat.p = PALETTES[i === 0 ? 1 : 0]; // no near-black cats beside the signature
      cats.push(cat);
    }
    function loop() {
      let active = false;
      cats.forEach(c => { if (!c.draw()) active = true; });
      return !active;
    }
    drive(loop, onDone);
  }

  /* ============================================================
     GENERATOR-BASED ART (Hami embroidery, thunderstorm, small
     animals, research desk) — adapted from the studio reference
     pieces. Painted at a fixed 400px buffer and scaled by CSS,
     then repainted on a gentle loop.
  ============================================================ */
  /* brighter, higher-opacity palette so the threads read on the dark Hami section */
  function* genEmbroidery(brush, w, h) {
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 400;
    const POM = [{ h: 348, s: 82, l: 62 }, { h: 356, s: 85, l: 66 }, { h: 14, s: 82, l: 66 }];
    const SEED = { h: 344, s: 92, l: 55 };
    const VINE = [{ h: 145, s: 55, l: 55 }, { h: 128, s: 52, l: 62 }, { h: 160, s: 48, l: 50 }];
    const ACC = [{ h: 205, s: 78, l: 66 }, { h: 42, s: 92, l: 66 }, { h: 310, s: 62, l: 68 }];
    const THREAD = { h: 38, s: 30, l: 78 };
    const R = Math.min(w, h) * 0.42;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
      for (let t = 0; t <= 1; t += 0.12) {
        brush.wash(cx + Math.cos(a) * R * t * 0.9 + (Math.random() - .5) * 3, cy + Math.sin(a) * R * t * 0.9 + (Math.random() - .5) * 3, 1.5 * sc, THREAD, 0.14);
      }
      yield;
    }
    const vineCount = 8;
    for (let v = 0; v < vineCount; v++) {
      let ca = (Math.PI * 2 / vineCount) * v;
      let x = cx + Math.cos(ca) * 20 * sc, y = cy + Math.sin(ca) * 20 * sc;
      const steps = Math.floor((R * 0.85) / (4 * sc));
      for (let i = 0; i < steps; i++) {
        ca += (Math.random() - 0.45) * 0.18;
        const nx = x + Math.cos(ca) * 4 * sc, ny = y + Math.sin(ca) * 4 * sc;
        const wdt = (3 * (1 - i / steps) + 0.7) * sc;
        brush.stroke(x, y, nx, ny, VINE[0], wdt, 0.42);
        brush.stroke(x, y, nx, ny, VINE[1], wdt * 0.6, 0.5);
        if (i > 6 && i % 10 === 0 && Math.random() > 0.3) {
          const side = Math.random() > .5 ? 1 : -1;
          const da = ca + side * (0.6 + Math.random() * 0.4);
          const dsz = (4.5 + Math.random() * 3) * sc;
          const px = nx + Math.cos(da) * dsz * 1.5, py = ny + Math.sin(da) * dsz * 1.5;
          if (Math.random() > 0.6) {
            const ac = ACC[(Math.random() * ACC.length) | 0];
            for (let p = 0; p < 4; p++) { const pa = da + (Math.PI / 2) * p; brush.blob(px + Math.cos(pa) * dsz * .5, py + Math.sin(pa) * dsz * .5, dsz * .8, ac, 0.26, pa, 1.4); }
          } else {
            brush.blob(px, py, dsz, VINE[1], 0.3, da, 1.8);
            brush.blob(px, py, dsz * 0.7, VINE[0], 0.36, da, 1.6);
          }
        }
        x = nx; y = ny;
        if (i % 2 === 0) yield;
      }
      const tsz = (8 + Math.random() * 4) * sc, ac = ACC[(Math.random() * ACC.length) | 0];
      for (let p = 0; p < 6; p++) { const pa = (Math.PI * 2 / 6) * p; brush.blob(x + Math.cos(pa) * tsz * .8, y + Math.sin(pa) * tsz * .8, tsz, ac, 0.22, pa, 1.6); brush.blob(x + Math.cos(pa) * tsz * .8, y + Math.sin(pa) * tsz * .8, tsz * .6, POM[0], 0.3, pa, 1.4); }
      yield;
    }
    const base = 35 * sc;
    for (let i = 0; i < 34; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * base * 0.8, c = POM[(Math.random() * POM.length) | 0];
      brush.blob(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, (10 + Math.random() * 15) * sc, c, 0.14, a, 1.1 + Math.random() * 0.4);
      if (i % 2 === 0) yield;
    }
    const crownY = cy - base * 0.9;
    for (let i = -1; i <= 1; i++) brush.blob(cx + i * 8 * sc, crownY + Math.abs(i) * 3 * sc, 8 * sc, POM[0], 0.24, Math.PI / 2 + i * 0.3, 1.8);
    yield;
    brush.blob(cx, cy, base * 0.55, { h: 22, s: 70, l: 82 }, 0.2, 0, 1.2);
    brush.blob(cx, cy, base * 0.5, { h: 15, s: 80, l: 74 }, 0.26, 0, 1.1);
    for (let i = 0; i < 16; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * base * 0.4; brush.wash(cx + Math.cos(a) * r, cy + Math.sin(a) * r, (1.6 + Math.random() * 1.6) * sc, SEED, 0.55); if (i % 3 === 0) yield; }
  }

  function* genStorm(brush, w, h) {
    const cx = w / 2, cy = h / 2;
    const cloudDark = { h: 225, s: 35, l: 25 }, cloudMid = { h: 215, s: 25, l: 45 };
    const lightning = { h: 45, s: 95, l: 75 }, skyBase = { h: 200, s: 15, l: 70 };
    for (let i = 0; i < 10; i++) { brush.blob(cx, cy - 20, 150, skyBase, 0.03, 0, 1.5); yield; }
    for (let i = 0; i < 50; i++) {
      const px = cx + (Math.random() - .5) * 180, py = cy - 50 + (Math.random() - .5) * 60;
      brush.blob(px, py, 40 + Math.random() * 30, Math.random() > .4 ? cloudDark : cloudMid, 0.06, 0, 1.6);
      if (i % 2 === 0) yield;
    }
    for (let i = 0; i < 45; i++) {
      const rx = cx + (Math.random() - .5) * 160, sy = cy + (Math.random() - .5) * 20;
      brush.stroke(rx, sy, rx - 15 - Math.random() * 10, h, { h: 210, s: 40, l: 55 }, 2.5, 0.06);
      yield;
    }
    let lx = cx + 20, ly = cy - 30;
    for (let i = 0; i < 10; i++) {
      const nx = lx + (Math.random() - .5) * 60, ny = ly + 15 + Math.random() * 25;
      brush.stroke(lx, ly, nx, ny, lightning, 5, 0.6);
      brush.stroke(lx, ly, nx, ny, lightning, 15, 0.1);
      brush.wash(nx, ny, 12, lightning, 0.08);
      lx = nx; ly = ny; yield;
    }
  }

  function* genAnimals(brush, w, h) {
    const cx = w / 2, cy = h / 2;
    const cat = { h: 25, s: 75, l: 55 }, rabbit = { h: 30, s: 15, l: 85 };
    const rabbitShadow = { h: 210, s: 15, l: 70 }, bird = { h: 195, s: 65, l: 60 };
    for (let i = 0; i < 18; i++) {
      brush.blob(cx + 45, cy + 25, 35, rabbit, 0.08, -0.1, 1.2);
      brush.blob(cx + 40, cy + 30, 25, rabbitShadow, 0.04, 0, 1.1);
      if (i < 10) { brush.stroke(cx + 35, cy - 5, cx + 25, cy - 50, rabbit, 12, 0.1); brush.stroke(cx + 55, cy - 5, cx + 55, cy - 45, rabbit, 12, 0.1); }
      yield;
    }
    for (let i = 0; i < 18; i++) {
      brush.blob(cx - 50, cy + 15, 38, cat, 0.07, 0.1, 1.15);
      if (i < 8) { brush.stroke(cx - 65, cy - 15, cx - 75, cy - 40, cat, 10, 0.1); brush.stroke(cx - 35, cy - 15, cx - 30, cy - 40, cat, 10, 0.1); }
      yield;
    }
    for (let i = 0; i < 15; i++) {
      brush.blob(cx - 5, cy - 25, 22, bird, 0.07, 0.2, 1.3);
      brush.blob(cx - 10, cy - 20, 12, { h: 200, s: 70, l: 50 }, 0.06, 0.5, 1.8);
      yield;
    }
    brush.wash(cx - 55, cy + 5, 2.5, { h: 0, s: 0, l: 20 }, 0.4);
    brush.wash(cx + 35, cy + 15, 2.5, { h: 0, s: 0, l: 20 }, 0.4);
    brush.wash(cx + 5, cy - 30, 2, { h: 0, s: 0, l: 20 }, 0.4);
    brush.stroke(cx + 12, cy - 28, cx + 22, cy - 25, { h: 40, s: 80, l: 55 }, 4, 0.3);
    yield;
  }

  function* genWorkspace(brush, w, h) {
    const cx = w / 2, cy = h / 2 + 20;
    const laptop = { h: 215, s: 15, l: 65 }, laptopDark = { h: 215, s: 20, l: 45 };
    const paper = { h: 40, s: 10, l: 92 }, wood = { h: 35, s: 30, l: 50 };
    for (let i = 0; i < 8; i++) { brush.stroke(cx - 120, cy + 60, cx + 120, cy + 60, wood, 30, 0.08); yield; }
    for (let i = 0; i < 12; i++) {
      brush.stroke(cx - 50, cy - 50, cx + 50, cy - 50, laptop, 12, 0.12);
      brush.stroke(cx - 50, cy - 50, cx - 55, cy, laptop, 10, 0.12);
      brush.stroke(cx + 50, cy - 50, cx + 55, cy, laptop, 10, 0.12);
      yield;
    }
    for (let i = 0; i < 8; i++) { brush.stroke(cx - 65, cy + 5, cx + 65, cy + 5, laptopDark, 15, 0.15); yield; }
    for (let i = 0; i < 6; i++) { brush.wash(cx, cy - 25, 40, { h: 200, s: 40, l: 85 }, 0.08); yield; }
    for (let i = 0; i < 20; i++) {
      if (i < 8) { const bh = cy + 40 - i * 6; brush.stroke(cx + 70, bh, cx + 110, bh, { h: (i * 45) % 360, s: 50, l: 55 }, 6, 0.15); }
      brush.blob(cx - 80 + (Math.random() - .5) * 15, cy + 40 + (Math.random() - .5) * 15, 25, paper, 0.08, Math.random() * 0.5, 1.4);
      yield;
    }
  }

  /* ---------- book (open storybook) ---------- */
  function* genBook(brush, w, h) {
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 250;
    const P = { cover: { h: 212, s: 58, l: 46 }, page: { h: 44, s: 48, l: 94 }, shadow: { h: 214, s: 46, l: 32 }, text: { h: 25, s: 35, l: 42 }, glow: { h: 45, s: 82, l: 82 } };
    const bw = 90 * sc, bh = 65 * sc, maxAge = 170;
    for (let age = 0; age < maxAge; age++) {
      const prog = age / maxAge;
      if (prog < 0.2) {
        for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * bw * 1.5; brush.blob(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 35 * sc, P.glow, 0.03, 0, 1.2); }
      } else if (prog < 0.4) {
        for (let i = 0; i < 8; i++) {
          brush.blob(cx + (Math.random() - .5) * bw * 2.2, cy + (Math.random() - .5) * bh * 2.2, 20 * sc, P.cover, 0.07, 0, 1.4);
          brush.blob(cx + (Math.random() > .5 ? 1 : -1) * bw * 1.05, cy + (Math.random() - .5) * bh * 2.1, 12 * sc, P.shadow, 0.07, Math.PI / 2, 2.5);
        }
      } else if (prog < 0.7) {
        for (let i = 0; i < 12; i++) {
          const side = Math.random() > .5 ? 1 : -1;
          const px = cx + side * (Math.random() * bw * 0.95 + bw * 0.05), py = cy + (Math.random() - .5) * bh * 1.9;
          const sag = Math.sin((px - cx) / bw * Math.PI) * bh * 0.15;
          brush.blob(px, py + sag, 15 * sc, P.page, 0.14, 0.1 * side, 1.3);
          if (Math.random() < 0.2) { const ex = cx + side * bw; brush.streak(ex, cy - bh * 0.9, ex, cy + bh * 0.9, 4 * sc, P.page, 0.16, 3); }
        }
      } else {
        if (Math.random() < 0.4) brush.blob(cx, cy + (Math.random() - .5) * bh * 2, 10 * sc, P.shadow, 0.04, Math.PI / 2, 3);
        if (Math.random() < 0.7) {
          const side = Math.random() > .5 ? 1 : -1;
          let lx = cx + side * bw * 0.15, rx = cx + side * bw * 0.85; const sagBase = (Math.random() - .5) * bh * 1.6;
          if (side === -1) { const t = lx; lx = rx; rx = t; }
          for (let i = 0; i < 5; i++) {
            const t1 = i / 5, t2 = (i + 1) / 5;
            brush.stroke(lx + (rx - lx) * t1, cy + sagBase + Math.sin(t1 * Math.PI) * bh * 0.1, lx + (rx - lx) * t2, cy + sagBase + Math.sin(t2 * Math.PI) * bh * 0.1, P.text, 2.5 * sc, 0.09);
          }
        }
      }
      yield;
    }
  }

  /* ---------- girl figure ---------- */
  function* genGirl(brush, w, h) {
    const s = Math.min(w, h) / 250, cx = w / 2, cy = h / 2;
    const P = { skin: { h: 25, s: 60, l: 82 }, skinDark: { h: 20, s: 65, l: 70 }, dress: { h: 195, s: 66, l: 60 }, dressDark: { h: 195, s: 70, l: 45 }, hair: { h: 20, s: 60, l: 24 }, blush: { h: 350, s: 75, l: 75 }, shoes: { h: 350, s: 66, l: 44 } };
    const y0 = cy - 18 * s;
    const hx = cx, hy = y0 - 55 * s, tx = cx, ty = y0 - 25 * s, dx = cx, dy = y0 + 45 * s;
    const maxAge = 170;
    for (let age = 0; age < maxAge; age++) {
      const prog = age / maxAge;
      if (prog < 0.25) {
        brush.blob(hx + (Math.random() - .5) * 8 * s, hy + (Math.random() - .5) * 8 * s, 12 * s, P.skin, 0.06, 0, 1.1);
        brush.blob(tx, ty, 10 * s, P.skinDark, 0.045);
        if (Math.random() < 0.4) brush.streak(tx - 15 * s, ty + 5 * s, tx - 35 * s, ty + 35 * s, 5 * s, P.skin, 0.06);
        if (Math.random() < 0.4) brush.streak(tx + 15 * s, ty + 5 * s, tx + 35 * s, ty + 35 * s, 5 * s, P.skin, 0.06);
        if (Math.random() < 0.4) brush.streak(dx - 12 * s, dy, dx - 15 * s, dy + 45 * s, 6 * s, P.skin, 0.06);
        if (Math.random() < 0.4) brush.streak(dx + 12 * s, dy, dx + 15 * s, dy + 45 * s, 6 * s, P.skin, 0.06);
      } else if (prog < 0.6) {
        const v = Math.random(), ww = (15 + v * 35) * s;
        const px = tx + (Math.random() - .5) * ww * 2.2, py = ty + v * (dy - ty);
        brush.blob(px, py, 14 * s, Math.random() > 0.7 ? P.dressDark : P.dress, 0.055, 0, 1.3);
        if (Math.random() < 0.1) brush.streak(px, ty + 10 * s, px, dy, 3 * s, P.dressDark, 0.045, 3);
      } else if (prog < 0.85) {
        const a = -Math.PI + Math.random() * Math.PI * 1.2, r = 10 * s + Math.random() * 12 * s;
        brush.blob(hx + Math.cos(a) * r, hy - 2 * s + Math.sin(a) * r, 11 * s, P.hair, 0.065, a, 1.4);
        if (Math.random() < 0.35) { const side = Math.random() > .5 ? 1 : -1; brush.blob(hx + side * (12 * s + Math.random() * 8 * s), hy + Math.random() * 35 * s, 8 * s, P.hair, 0.055, Math.PI / 2, 2.5); }
      } else {
        if (Math.random() < 0.3) { const side = Math.random() > .5 ? 1 : -1; brush.blob(hx + side * 8 * s, hy + 2 * s, 5 * s, P.blush, 0.045); }
        if (Math.random() < 0.4) { const side = Math.random() > .5 ? 1 : -1, sx = dx + side * 15 * s, sy = dy + 45 * s; brush.blob(sx, sy, 8 * s, P.shoes, 0.075, 0, 1.4); brush.streak(sx - 5 * s, sy, sx + 5 * s, sy, 4 * s, P.shoes, 0.09); }
      }
      yield;
    }
  }

  /* ---------- heart ---------- */
  function* genHeart(brush, w, h) {
    const cx = w / 2, cy = h / 2, sc = Math.min(w, h) / 200;
    const P = { base: { h: 345, s: 85, l: 58 }, dark: { h: 340, s: 95, l: 42 }, light: { h: 352, s: 78, l: 76 }, wash: { h: 330, s: 62, l: 84 } };
    const pts = [];
    for (let i = 0; i < 360; i++) {
      const t = Math.random() * Math.PI * 2;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const d = Math.pow(Math.random(), 0.5);
      pts.push({ dx: hx * d * 3.5, dy: hy * d * 3.5, r: d });
    }
    pts.sort((a, b) => a.r - b.r);
    const maxAge = 170;
    for (let age = 0; age < maxAge; age++) {
      const prog = age / maxAge;
      if (prog < 0.2) {
        for (let i = 0; i < 4; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 60 * sc; brush.blob(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 30 * sc, P.wash, 0.03, 0, 1.5); }
      } else if (prog < 0.85) {
        const startIdx = Math.floor(((prog - 0.2) / 0.65) * pts.length);
        for (let i = 0; i < 3; i++) {
          const p = pts[startIdx + i]; if (!p) break;
          const px = cx + p.dx * sc, py = cy + p.dy * sc;
          let c = P.base; if (p.r > 0.8) c = P.dark; else if (Math.random() > 0.7) c = P.light;
          brush.blob(px, py, (12 + Math.random() * 8) * sc * (1.1 - p.r * 0.4), c, 0.05, Math.atan2(p.dy, p.dx), 1.3);
        }
      } else {
        for (let i = 0; i < 3; i++) {
          const t = Math.random() * Math.PI * 2;
          const hx = 16 * Math.pow(Math.sin(t), 3);
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          brush.blob(cx + hx * 3.5 * sc, cy + hy * 3.5 * sc, 6 * sc, P.dark, 0.06, t, 2.0);
        }
      }
      yield;
    }
  }

  const ART_GENS = { embroidery: genEmbroidery, storm: genStorm, animals: genAnimals, workspace: genWorkspace, book: genBook, girl: genGirl, heart: genHeart };

  function runArt(canvas, genFn, hold) {
    const size = 400;
    canvas.width = size; canvas.height = size;
    const paint = document.createElement('canvas'); paint.width = size; paint.height = size;
    const pctx = paint.getContext('2d'); pctx.lineCap = 'round'; pctx.lineJoin = 'round';
    const dctx = canvas.getContext('2d');
    const brush = new Brush(pctx);
    function render() { dctx.clearRect(0, 0, size, size); dctx.drawImage(paint, 0, 0); }
    function play() {
      if (!document.body.contains(canvas)) return;
      pctx.clearRect(0, 0, size, size);
      const it = genFn(brush, size, size);
      function step() {
        let batch = 5, r;
        do { r = it.next(); } while (!r.done && --batch > 0);
        render();
        if (!r.done) { document.hidden ? setTimeout(step, 60) : requestAnimationFrame(step); }
        else setTimeout(fadeOut, hold || 4200);
      }
      function fadeOut() {
        if (!document.body.contains(canvas)) return;
        let f = 0;
        function ff() {
          pctx.save(); pctx.globalCompositeOperation = 'destination-out';
          pctx.fillStyle = 'rgba(0,0,0,0.10)'; pctx.fillRect(0, 0, size, size); pctx.restore();
          render();
          if (++f < 34) { document.hidden ? setTimeout(ff, 60) : requestAnimationFrame(ff); }
          else { pctx.clearRect(0, 0, size, size); play(); }
        }
        ff();
      }
      step();
    }
    play();
  }

  /* ---------- mount on visibility ---------- */
  /* wait until the canvas actually has layout before painting */
  function whenSized(c, fn, tries) {
    if (c.clientWidth > 0 && c.clientHeight > 0) return fn();
    if ((tries || 0) > 40) return;
    setTimeout(() => whenSized(c, fn, (tries || 0) + 1), 120);
  }

  const io = new IntersectionObserver(ents => {
    ents.forEach(e => {
      if (!e.isIntersecting) return;
      const c = e.target; io.unobserve(c);
      const once = c.hasAttribute('data-once');
      whenSized(c, () => {
        if (c.dataset.wcIcon) {
          once ? runIcon(c) : driveLoop(c, d => runIcon(c, d), 2600);
        } else if (c.dataset.wc === 'flowers') {
          once ? runFlowers(c) : driveLoop(c, d => runFlowers(c, d), 5200);
        } else if (c.dataset.wc === 'cats') {
          once ? runCats(c) : driveLoop(c, d => runCats(c, d), 4200);
        } else if (ART_GENS[c.dataset.wc]) {
          runArt(c, ART_GENS[c.dataset.wc], 4600);
        }
      });
    });
  }, { threshold: 0.25 });

  document.querySelectorAll('canvas[data-wc-icon], canvas[data-wc]').forEach(c => io.observe(c));
})();
