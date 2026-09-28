// c2 · Chorus 1: The P(doom) Show (23.0–38.5), ported one-for-one from their src/ch/c02_chorus1.js.
// Every shot start, hit constant, seg window, keyframe, easing, pulse decay, move() style, mood() key, schedule and
// camera move is theirs; the audit trail (their file:line → our event) is docs/storyboard-timing/c2_chorus1.md.
// Their watercolour objects become our squares, boxes and straight lines. Their world (1920×1080) is mapped into the
// stage band (above the name, clipped at the floor) per shot with a map(): X/Y for world → page px. Their camBegin()
// becomes camera(): zoom ratio to the shot's base zoom, pans as offsets (world px × the map's scale), shake × S.W/1920.
// Stage shots (1, 2, 7) zoom about the floor so the cast keeps standing on the name; the others about their centre.
(() => {
  const SB = window.__SB;
  const { D, C, B, BEAT, seg, ease, easeIn, easeOut, backOut, pulse, bpOf, beatN, frac, clamp, lerp, hash, shakeXY, rr, move, mood, pumpH, chapter } = SB;
  const TAU = Math.PI * 2;
  const boilN = t => Math.floor(t * 12);                                          // their boilN (BOIL = 12 fps)
  const qbez = (a, c, b, u) => [(1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * c[1] + u * u * b[1]];
  const g2d = () => [...document.querySelectorAll("canvas[aria-hidden]")].pop().getContext("2d");

  // ---------- the stage band and the world maps ----------
  const top0 = S => (S.bar ? S.bar.bottom : 0) + 4;
  const bandH = S => S.floor + 1 - top0(S);
  const colBand = S => rr(S.main.left, top0(S), S.main.width, bandH(S));
  // the stage band: the column above the floor. Everything a shot draws in the world is clipped to it (never below the name)
  function band(S, fn) { const c = g2d(); c.save(); c.beginPath(); c.rect(S.main.left, top0(S), S.main.width, bandH(S)); c.clip(); try { fn(); } finally { c.restore(); } }
  const map = (x0, wx0, ax, y0, wy0, ay) => ({ ax, ay, X: wx => x0 + (wx - wx0) * ax, Y: wy => y0 + (wy - wy0) * ay, iX: x => wx0 + (x - x0) / ax, iY: y => wy0 + (y - y0) / ay });
  // their stage from world x a … b laid along the name (b = the meter); world floor y ↔ S.floor; `above` world px fill the band
  const stageMap = (S, a, b, floorW, above) => map(S.text.left, a, (S.right - 16 - S.text.left) / (b - a), S.floor, floorW, bandH(S) / above);
  // their camBegin(cur) relative to the shot's base camera; returns the transform for screen-space extras
  function camera(S, m, base, cur, sh, fn, pivot) {
    const r = cur[2] / base[2], k = S.W / 1920, [px, py] = pivot || [m.X(base[0]), S.floor];
    const dx = -r * m.ax * (cur[0] - base[0]) + sh[0] * k, dy = -r * m.ay * (cur[1] - base[1]) + sh[1] * k;
    D.cam(px, py, r, fn, dx, dy);
    return (x, y) => [px + dx + r * (x - px), py + dy + r * (y - py)];
  }

  // ---------- cast and props in our shapes ----------
  // a body: bottom on `base` (default the floor), dy up in px, sq squash like their scale(1 + sq·.6, 1 − sq), sx their spin
  function fig(S, x, s, o = {}) {
    const sq = o.sq || 0, w = s * (1 + sq * .6) * Math.abs(o.sx ?? 1), h = s * (1 - sq), y = (o.base ?? S.floor) - (o.dy || 0) - h;
    if (o.bg) D.fill(x - w / 2, y, w, h, C.bg);
    if (o.outline) D.rect(x - w / 2, y, w, h, o.col || C.ink, o.lw || 1.25); else D.fill(x - w / 2, y, w, h, o.col || C.pink);
    return rr(x - w / 2, y, w, h);
  }
  const bang = (s, x, y, k, col = C.pink, size = 13) => { const p = backOut(k); if (p > .05) D.text(s, x, y, col, Math.max(1, Math.round(size * p)), "center"); };   // their '!' / '?' emotes, letter pop
  const drop = (x, y, k, s = 5) => { const p = backOut(k); if (p > .05) D.sq(x, y, s * p, C.blue); };                  // their 'sweat' emote
  const sparkle = (x, y, k) => { const p = backOut(k); if (p > .05) for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) D.sq(x + a * 4 * p, y + b * 4 * p, 2.5 * p, C.pink); };   // their 'spark' emote
  const meterR = S => { const h = Math.max(56, S.name.height + 12); return rr(S.right - 10, S.name.top + S.name.height / 2 - h / 2, 10, h); };
  const glow = (S, a) => { if (a > .02) D.alpha(a, () => D.box(meterR(S), 3, C.pink, 2)); };                         // their meterProp glow
  function pump(S, x, s, top) { const bw = s * .9, bh = s * .32; D.rect(x - bw / 2, S.floor - bh, bw, bh, C.ink); D.vl(x, S.floor - top, S.floor - bh, C.ink, 1.5); D.hl(x - s * .5, x + s * .5, S.floor - top, C.ink, 2); return x + bw / 2; }
  // the friendly mask (their smiley): a clean card; its "eyes" are corner brackets (eyesK), its "mouth" a pink rule (mouthK)
  function card(cx, cy, hw, hh, eyesK = 1, mouthK = 1) {
    const r = rr(cx - hw, cy - hh, 2 * hw, 2 * hh);
    D.fill(r.left, r.top, r.width, r.height, C.bg); D.rect(r.left, r.top, r.width, r.height, C.ink, 1.25);
    if (eyesK > .02) D.corners(r, -3, C.pink, 1.5, Math.max(1, 10 * eyesK));
    if (mouthK > .02) D.hl(cx - hw * .5 * mouthK, cx + hw * .5 * mouthK, cy + hh * .45, C.pink, 2);
    return r;
  }
  const slip = (x, y, s, glyph) => { const w = s * .42, h = s * .27; D.fill(x - w / 2, y - h / 2, w, h, C.bg); D.rect(x - w / 2, y - h / 2, w, h, C.ink, 1); if (glyph) D.hl(x - w * .25, x + w * .25, y, C.ink, 1); };
  function shroom(x, yb, sz, col, sq = 0) {                                           // stem + cap, standing on yb
    if (sz < 1) return;
    const w = sz * (1 + sq * .6), h = sz * (1 - sq);
    D.fill(x - w * .2, yb - h * .6, w * .4, h * .6, C.bg); D.rect(x - w * .2, yb - h * .6, w * .4, h * .6, C.ink, 1);
    D.fill(x - w / 2, yb - h, w, h * .42, col);
  }
  function hole(S, r, cx, cy, hw, hh, col = C.ink) {                                    // fill r outside a rectangular hole (their irisShape)
    if (hw < 1 || hh < 1) { D.fill(r.left, r.top, r.width, r.height, col); return; }
    const L = cx - hw, R = cx + hw, T = cy - hh, Bm = cy + hh;
    D.fill(r.left, r.top, r.width, T - r.top, col); D.fill(r.left, Bm, r.width, r.bottom - Bm, col);
    D.fill(r.left, T, L - r.left, Bm - T, col); D.fill(R, T, r.right - R, Bm - T, col);
  }

  // ======================================================================================
  // 1 · 23.0–24.5 "I'm upping my P(doom)": out of the mouth onto the stage, the hero pogo-pumps the meter
  // ======================================================================================
  function mouthReveal(t, S) {                                                       // their mouthReveal: jaws hinge open over 23.0–23.5
    const k = seg(t, 23.0, 23.5); if (k >= 1) return;
    const r = colBand(S), e = ease(k), hh = lerp(0, 1300, Math.pow(e, .9)), hw = lerp(860, 1900, e), cx = 960 + e * 60, cy = 560 - hh * .25;
    const fx = x => r.left + x / 1920 * r.width, fy = y => r.top + y / 1080 * r.height;
    band(S, () => {
      if (hh < 4) { D.fill(r.left, r.top, r.width, r.height, C.bg); D.rect(r.left, r.top, r.width, r.height, C.ink, 1.5); return; }   // 3.1: white jaws, graphite outline
      hole(S, r, fx(cx), fy(cy), fx(cx + hw) - fx(cx), fy(cy + hh) - fy(cy), C.bg); D.rect(r.left, r.top, r.width, r.height, C.ink, 1.5);
      D.rect(fx(cx - hw), fy(cy - hh), fx(cx + hw) - fx(cx - hw), fy(cy + hh) - fy(cy - hh), C.pink, 2);   // their maroon lip ring
      // (their teeth are left out: Mannat rejected teeth on 2026-09-24)
    });
  }
  function upping(t, lt, dur, S) {
    const bp = bpOf(t), f = frac(bp), h = pumpH(t), hit = pulse(t, 7), open = ease(seg(t, 23.0, 24.4));
    const m = stageMap(S, 300, 1470, 935, 851), ay = m.ay, s = S.u * 1.8;
    const cur = [lerp(1060, 945, open), lerp(600, 575, open), lerp(1.26, 1.1, open) + .015 * hit];
    glow(S, .9 * pulse(t, 4));
    band(S, () => {
      let hoseX = 0;
      const xf = camera(S, m, [945, 575, 1.1], cur, shakeXY(t, 5 * hit), () => {
        const px = m.X(1190), top = (270 + 150 * h) * 1.3 * ay;                        // the handle rides pumpH (slam lands on the beat)
        hoseX = pump(S, px, s, top);
        const mv = move("hop", t);                                                     // chorus line in sync
        for (const x of [340, 720, 890]) fig(S, m.X(x), S.u * 1.1, { outline: true, bg: true, dy: -mv.dy * 16 * ay, sq: mv.sq });
        const rm = move("hop", t - BEAT * .5), rb = fig(S, m.X(530), S.u * .6, { col: C.ink, dy: -rm.dy * 15 * ay, sq: rm.sq });   // the researcher, half a beat late
        bang("?", rb.left + rb.width / 2, rb.top - 5, seg(t, 23.55, 23.8), C.blue);
        const hop = Math.sin(seg(f, .45, .9) * Math.PI) * 1.4, falling = f > .8;       // pogo: up with the handle, a leap, slam on the beat
        fig(S, px, s, { dy: top + hop * 21 * ay, sq: .3 * pulse(t, 10) - (falling ? .14 : 0) - (f > .45 && f < .8 ? .06 : 0) });
        if (f < .3) { const k = f / .3; D.alpha(1 - k, () => { for (const sd of [-1, 1]) D.osq(m.X(1190 + sd * (100 + 60 * k)), S.floor - (10 + 20 * k) * ay - s * .12, s * .25 * (1 - k * .5), C.ink); }); }
      });
      // the hose runs along the floor to the (unmoved) meter; a bulge of air rides it after every slam
      const [hx0, hy] = xf(hoseX, S.floor - 3), hx1 = meterR(S).left - 2;
      D.hl(hx0, hx1, hy, C.ink, 1.5);
      const hu = seg(f, 0, .5); if (hu > 0 && hu < 1) D.sq(lerp(hx0, hx1, hu), hy, s * .3, C.ink);
    });
    mouthReveal(t, S);
  }

  // ======================================================================================
  // 2 · 24.5–26.5 "'cause the future goes FOOM": light the fuse, FOOM on B(37), tilt up after the rocket
  // ======================================================================================
  const T_IGN = B(37), ROOM_Y = -3300, RX = 900;
  const rocketY = t => 905 - 3620 * Math.pow(seg(t, T_IGN, 26.5), 1.8);
  const foomCamY = t => { const p = seg(t, T_IGN + .08, 26.5); return lerp(620, ROOM_Y + 380, p * p); };
  const T_ROOF = T_IGN + Math.pow((905 + 560) / 3620, 1 / 1.8) * (26.5 - T_IGN);      // when the rocket bursts through the roof
  const CLOUDS = [[380, -900, 340], [1560, -1250, 400], [720, -1750, 300], [1380, -2250, 340], [300, -2650, 300], [1680, -2850, 280], [520, -3500, 320], [1480, -3650, 300], [960, -4000, 420]];
  const FUSE = [[RX - 330, 930], [RX - 250, 918], [RX - 170, 934], [RX - 90, 922], [RX - 30, 912], [RX - 8, 900]];
  const PUFFS = [[-300, 20, 120, 0], [300, 30, 125, 0], [-190, -110, 130, 1], [200, -120, 125, 1], [-420, 80, 90, 2], [430, 90, 95, 2], [0, 60, 150, 1], [-110, 70, 110, 0], [120, 80, 110, 1]];
  const stair = (P, hFirst) => P.flatMap((p, j) => j ? [hFirst ? [p[0], P[j - 1][1]] : [P[j - 1][0], p[1]], p] : [p]);   // right-angle path through points
  function foom(t, lt, dur, S) {
    const ign = t >= T_IGN, age = t - T_IGN, ry = rocketY(t), pre = ease(seg(t, 24.5, T_IGN));
    const m = stageMap(S, 250, 1500, 935, 815), X = m.X, Y = m.Y, ax = m.ax, ay = m.ay, s = S.u * 1.8, k = s / 180;   // k: px per world px on the rocket (Clawd u = 18)
    const cur = [ign ? RX + 40 : lerp(880, RX + 30, pre), ign ? foomCamY(t) : lerp(620, 640, pre), ign ? lerp(1.2, 1.0, easeOut(seg(age, 0, .3))) : lerp(1.08, 1.2, pre)];
    const sh = shakeXY(t, ign ? 26 * Math.exp(-age * 4.5) : 6 * seg(t, 25.1, T_IGN));
    const PC = [C.pink, C.muted, C.ink];
    if (ign) glow(S, Math.exp(-age * 3));
    band(S, () => {
      camera(S, m, [880, 620, 1.08], cur, sh, () => {
        const pxp = X(1250), hx = pump(S, pxp, s, (270 + 150 * .15) * 1.3 * ay);         // the abandoned pump
        D.hl(hx, X(1442), S.floor - 3, C.ink, 1.5);
        // above the stage: fly loft (ropes, sandbags), the sky's clouds, the roof band (holed once the rocket is through)
        for (let i = 0; i < 9; i++) D.vl(X(120 + i * 210), Y(-560), Y(-40), C.muted, 1, [2, 4]);
        for (const [bx, by] of [[330, -210], [1540, -300], [760, -380]]) D.rect(X(bx - 28), Y(by), 56 * ax, 70 * ay, C.ink);
        for (const [cx, cy, w] of CLOUDS) D.rect(X(cx - w / 2), Y(cy - .35 * w), w * ax, .4 * w * ay, C.muted);
        const r0 = X(-300), r1 = X(2220), ry0 = Y(-640), roofH = Math.max(4, 22 * ay);   // 3.49: a thin white roof beam with an outline, not a thick black bar
        const beam = (a, b) => { if (b > a) { D.fill(a, ry0, b - a, roofH, C.bg); D.rect(a, ry0, b - a, roofH, C.ink, 1.25); } };
        if (ry < -560) { beam(r0, X(RX - 150)); beam(X(RX + 150), r1); } else beam(r0, r1);
        const pa = t - T_ROOF;
        if (pa > 0 && pa < 1) for (let i = 0; i < 6; i++) {
          const a = -Math.PI / 2 + (hash(i + 7) - .5) * 2.2, v = 700 + 500 * hash(i + 8);
          D.fill(X(RX + Math.cos(a) * v * pa - 40), Y(-600 + Math.sin(a) * v * pa + 900 * pa * pa), 80 * ax, Math.max(2, 20 * ay), C.ink);
        }
        // the explosion left on the stage: bursts (boxes) on backOut .3 s, smoke puffs, sparks, the FOOM sfx
        if (ign) {
          const g = backOut(seg(age, 0, .3)), rise = age * 70;
          D.rect(X(RX - 420 * g), Y(850 - 420 * g), 840 * g * ax, 840 * g * ay, C.pink, 2);
          D.rect(X(RX - 280 * g), Y(860 - 280 * g), 560 * g * ax, 560 * g * ay, C.blue, 2);
          PUFFS.forEach(([dx, dy, r, c], i) => { const q = r * g * (1 + age * .25); if (q > 4) D.osq(X(RX + dx * (.6 + .4 * g)), Y(900 + dy * g - rise * (i % 3) * .5), 2 * q * ay, PC[c]); });
          if (age < .7) for (let i = 0; i < 10; i++) { const a = -Math.PI * hash(i + 60), d = (900 + 600 * hash(i + 61)) * age; D.sq(X(RX + Math.cos(a) * d), Y(850 + Math.sin(a) * d * .8), 44 * (1 - age) * ay, i % 2 ? C.ink : C.pink); }
          const fa = age - .02; if (fa >= 0 && fa <= 1.1) D.alpha(1 - seg(fa, .85, 1.1), () => bang("FOOM", X(RX - 330), Y(560), fa * 5, C.pink, 22));
        }
        // smoke trail from the rocket down to the stage: stepped edges, puffs every 160 world px
        if (ign && ry < 860) {
          const tp = ry + 20, bt = 900, Lp = [], Rp = [];
          for (let j = 0; j <= 8; j++) { const y = lerp(tp, bt, j / 8), d = clamp((y - ry) / 900), w = 40 + 190 * Math.pow(d, .6); Lp.push([X(RX - w + Math.sin(y * .012 + t * 7) * 14), Y(y)]); Rp.push([X(RX + w + Math.sin(y * .011 - t * 6) * 14), Y(y)]); }
          D.path(stair(Lp), C.muted); D.path(stair(Rp), C.muted);
          for (let j = 0; j < 30; j++) { const py = 880 - j * 160; if (py < tp || py > bt || py < ry + 60) continue; const d = clamp((py - ry) / 900), r = 50 + 120 * Math.pow(d, .6); for (const sd of [-1, 1]) D.osq(X(RX + sd * r * .9), Y(py + sd * 40), r * 1.1 * ay, C.muted); }
        }
        // the room in the sky comes into view at the very end
        if (cur[1] - 540 / cur[2] < ROOM_Y + 300) { const y0 = ROOM_Y - 520; D.rect(X(560), Y(y0 + 250), 800 * ax, 540 * ay, C.ink, 1.5); D.rect(X(700), Y(y0 + 330), 520 * ax, 360 * ay, C.muted, 1); }
        // the fuse burns from 24.72 to B(37) − .02 (ease); spark from 24.7
        if (!ign) {
          const fp = ease(seg(t, 24.72, T_IGN - .02)), idx = fp * (FUSE.length - 1), i0 = Math.floor(idx), fr = idx - i0;
          const sp = i0 < FUSE.length - 1 ? [lerp(FUSE[i0][0], FUSE[i0 + 1][0], fr), lerp(FUSE[i0][1], FUSE[i0 + 1][1], fr)] : FUSE[FUSE.length - 1];
          const rest = [sp, ...FUSE.slice(i0 + 1)].map(([x, y]) => [X(x), Y(y) - 2]);
          if (rest.length > 1) D.path(stair(rest, true), C.ink);
          if (t > 24.7) {
            const [x, y] = rest[0]; D.osq(x, y, s * .45, C.pink); D.sq(x, y, s * .28 + (hash(boilN(t)) - .5) * 3, C.pink);
            for (let q = 0; q < 4; q++) { const a = hash(boilN(t) * 4 + q) * TAU; D.sq(x + Math.cos(a) * 44 * ax, y - 10 * ay + Math.sin(a) * 36 * ay, 3, C.ink); }
          }
        }
        // the researcher lights it with a giant match, scrams (24.85–25.3) and ducks (25.2–25.35); blown back at FOOM
        const rsz = S.u * .6;
        if (!ign) {
          const run = seg(t, 24.85, 25.3), duck = seg(t, 25.2, 25.35);
          const b = fig(S, X(lerp(460, 250, ease(run))), rsz, { col: C.ink, sq: duck * .18 });
          if (run === 0) { const hx0 = b.right, hy = b.top + b.height * .45, tx = hx0 + 150 * Math.cos(.75) * ax, ty = Math.min(S.floor - 3, hy + 150 * Math.sin(.75) * ay); D.path([[hx0, hy], [tx, hy], [tx, ty]], C.ink); D.sq(tx, ty, 4, C.pink); }
        } else {
          const b = fig(S, X(250), rsz, { col: C.ink, dy: .5 * Math.exp(-age * 5) * 18 * ay });
          drop(b.right + 3, b.top - 3, seg(age, .1, .3));
        }
        // rocket + hero: jitter from 25.05, anticipation squash 25.15 → B(37), stretch on ignition, flame
        const shakeR = !ign ? (hash(boilN(t) * 7.7) - .5) * 2 * 3 * seg(t, 25.05, T_IGN) * ax : 0, antic = !ign ? seg(t, 25.15, T_IGN) : 0;
        const st = ign ? 1 + .18 * Math.min(1, age * 4) : 1 - .08 * ease(antic), sx = ign ? 1 / Math.sqrt(st) : 1 + .05 * ease(antic);
        const x = X(RX) + shakeR, by = Y(ry), rw = 152 * k * sx, rh = 345 * k * st;
        const fl = ign ? 1 + .3 * Math.sin(t * 40) : antic > .3 ? .2 * antic : 0;
        if (fl > .01) { D.fill(x - 58 * k * sx, by, 116 * k * sx, 260 * fl * k * st, C.blue); D.fill(x - 30 * k * sx, by, 60 * k * sx, 150 * fl * k * st, C.bg); }
        D.fill(x - rw / 2, by - rh, rw, rh, C.bg); D.rect(x - rw / 2, by - rh, rw, rh, C.ink, 1.5);
        D.rect(x - 36 * k * sx, by - 440 * k * st, 72 * k * sx, 100 * k * st, C.ink, 1.25); D.sq(x, by - 470 * k * st, 28 * k, C.pink);
        const md = mood(t, [[24.5, "spark"], [25.12, "scared"]]);
        const hb = fig(S, x, s, { base: by - 52 * k * st, sq: (ign ? .12 : 0) + md.take });
        D.hl(hb.left - 2, hb.right + 2, hb.bottom - hb.height * .3, C.ink, 2);           // the strap
        const ea = t - 25.12, ek = seg(ea, .05, .3) * (1 - seg(ea, 1.4, 1.7));
        if (ek > 0) bang("!", x + 110 * k, by - (52 * st + 170) * k, ek * 1.5, C.pink, 14);
      });
      // vertical speed streaks while the camera races up; the ignition flash
      const cb = colBand(S), v = ign ? (foomCamY(t) - foomCamY(t + .02)) / .02 : 0;
      if (v > 600) for (let i = 0; i < 12; i++) { const x = cb.left + hash(boilN(t) * 13 + i) * cb.width, y = cb.top + hash(boilN(t) * 7 + i + 50) * cb.height, l = v * .12 * ay; D.vl(x, y - l / 2, y + l / 2, C.muted, 1.25); }
      if (ign) { const a = .85 * (1 - seg(age, 0, .14)); if (a > .01) D.fill(cb.left, cb.top, cb.width, cb.height, C.bg, a); }
    });
  }

  // ======================================================================================
  // 3 · 26.5–28.0 "Trapped in the Chinese room": crash in, slips juggled between two mail slots
  // ======================================================================================
  const SLOT_L = [630, 506], SLOT_R = [1290, 506], SLIPS = [0, 1, 2, 3, 4, 5, 6].map(k => 26.62 + k * .15);
  function chineseRoom(t, lt, dur, S) {
    const hitK = Math.exp(-lt * 7), roomDY = -46 * hitK * Math.cos(lt * 26);
    const push1 = easeOut(seg(t, 26.5, 26.9)), push2 = ease(seg(t, 26.9, 27.45)), push3 = ease(seg(t, 27.5, 28.0));
    const cur = [lerp(960, 820, push3), lerp(lerp(860, 520, push1), 560, push2) + 100 * push3, lerp(1.0, 1.55, push2) + .55 * push3];
    const cb = colBand(S), m = map(cb.left + cb.width / 2, 960, cb.width / 1920, S.floor, 752, bandH(S) / 772), X = m.X, ax = m.ax, ay = m.ay;
    const Y = wy => m.Y(wy + roomDY), s = S.u * 1.6, k = s / 160;                      // inside the room's bounce; Clawd u = 16
    band(S, () => {
      camera(S, m, [960, 520, 1], cur, shakeXY(t, 14 * hitK), () => {
        // the paper room: shell, back wall with its grid, two mail slots
        D.fill(X(560), Y(250), 800 * ax, 540 * ay, C.bg, .92); D.rect(X(560), Y(250), 800 * ax, 540 * ay, C.ink, 1.5);
        D.fill(X(560), Y(250) - 5, 800 * ax, 4, C.pink);
        D.rect(X(700), Y(330), 520 * ax, 360 * ay, C.muted, 1);
        for (let i = 1; i < 6; i++) D.vl(X(700 + i * 86.7), Y(334), Y(686), C.blue, 1, [2, 4]);
        for (const [sx, sy] of [SLOT_L, SLOT_R]) { D.rect(X(sx - 34), Y(sy - 14), 68 * ax, 28 * ay, C.ink); D.fill(X(sx - 26), Y(sy - 5), 52 * ax, Math.max(2, 10 * ay), C.ink); }
        // the rulebook on its lectern, two pages flipping (frac(t·3.2), half a cycle apart)
        D.vl(X(960), Y(540), Y(670), C.ink, 2);
        D.rect(X(725), Y(400), 470 * ax, 154 * ay, C.ink);
        for (const sd of [-1, 1]) { const x0 = Math.min(X(960), X(960 + sd * 215)); D.fill(x0, Y(410), 215 * ax, 132 * ay, C.bg); D.rect(x0, Y(410), 215 * ax, 132 * ay, C.ink, 1); }
        for (const ph of [frac(t * 3.2), frac(t * 3.2 + .5)]) {
          const a = ph * Math.PI, tip = 960 + Math.cos(a) * 215, lift = Math.sin(a) * 90, x0 = Math.min(X(960), X(tip)), w = Math.abs(X(tip) - X(960));
          D.fill(x0, Y(408 - lift), w, (132 + lift * .2) * ay, C.bg); D.rect(x0, Y(408 - lift), w, (132 + lift * .2) * ay, C.ink, 1);
        }
        // the paper bag, dropped in on B(40) (easeIn over the .3 s before), squash-bounce after
        const TB = B(40), bagY = t < TB ? lerp(300, 750, easeIn(seg(t, TB - .3, TB))) : 750, bq = t >= TB ? .25 * Math.exp(-(t - TB) * 9) * Math.cos((t - TB) * 30) : 0;
        if (t > TB - .3) {
          const bw = 106 * k * (1 + bq * .6), bh = 120 * k * (1 - bq), bx = X(760) - bw / 2, bt = Y(bagY) - bh;
          D.fill(bx, bt, bw, bh, C.bg); D.rect(bx, bt, bw, bh, C.ink, 1.25);
          if (t > TB) D.sq(X(772), bt - 3, 6, C.pink);
        }
        // the hero: dazed ('x', 26.5), frantic 26.72–27.55 (eighth flips), reaching for the bag 27.62–27.9
        const frantic = seg(t, 26.72, 26.8) * (1 - seg(t, 27.45, 27.55)), reach = ease(seg(t, 27.62, 27.9));
        const md = mood(t, [[26.5, "x"], [26.74, "scared"], [27.52, "look"]]);
        const cxw = 960 + frantic * Math.sin(t * 22) * 22 - reach * 120;
        const hb = fig(S, X(cxw), s, { base: Y(752), dy: frantic * Math.abs(Math.sin(t * 18)) * .8 * 16 * ay, sq: (md.state === "x" ? .15 * hitK : 0) + md.take });
        if (reach > 0) { const y = hb.top + hb.height * .5, x1 = hb.left - reach * s * .7; D.path([[hb.left, y], [x1, y], [x1, y + reach * s * .4]], C.ink, 1.5); }
        const a1 = t - 26.74, a2 = t - 27.52;
        drop(hb.right + 4, hb.top - 2, seg(a1, .05, .3) * (1 - seg(a1, 1.4, 1.7)));
        if (a2 > 0) bang("!", hb.left + hb.width / 2, hb.top - 5, seg(a2, .05, .3) * 1.5, C.pink);
        // slips: in the left slot → over the hero → out the right slot, one every .15 s from 26.62, .62 s each
        SLIPS.forEach((tk, i) => {
          const u = (t - tk) / .62; if (u < 0 || u > 1) return;
          const Lp = [cxw - 120, 650], Rp = [cxw + 120, 650];
          let p, sc = 1;
          if (u < .35) { p = qbez(SLOT_L, [720, 420], Lp, u / .35); sc = .4 + .6 * seg(u, 0, .1); }
          else if (u < .6) p = qbez(Lp, [cxw, 480], Rp, (u - .35) / .25);
          else { const q = (u - .6) / .4; p = qbez(Rp, [1200, 430], SLOT_R, q); sc = 1 - seg(q, .75, 1) * .7; }
          slip(X(p[0]), Y(p[1]), sc * s, i === 2 || i === 5);
        });
        // processed slips flutter out of the right wall (1.1 s each); impact debris for .6 s
        for (let i = 0; i < SLIPS.length; i++) { const u = (t - SLIPS[i] - .62) / 1.1; if (u < 0 || u > 1) continue; slip(X(1390 + u * 380), m.Y(500 + roomDY - u * 160 + Math.sin(u * 9 + i) * 30), .9 * s, false); }
        if (lt < .6) for (let i = 0; i < 9; i++) {
          const a = -Math.PI * (.1 + .8 * hash(i + 3)), v = 500 + 400 * hash(i), px = 960 + Math.cos(a) * v * lt * 1.1 * (i % 2 ? 1 : -1), py = 800 + Math.sin(a) * v * lt + 900 * lt * lt;
          D.fill(X(px) - 14 * k, m.Y(py) - 9 * k, 28 * k, 18 * k, C.bg); D.rect(X(px) - 14 * k, m.Y(py) - 9 * k, 28 * k, 18 * k, C.ink, 1);
        }
      }, [X(960), m.Y(520)]);
      const a = .6 * (1 - seg(lt, 0, .1)); if (a > .01) D.fill(cb.left, cb.top, cb.width, cb.height, C.bg, a);
    });
  }

  // ======================================================================================
  // 4 · 28.0–29.5 "with a bag of shrooms": gulp on B(41), the tunnel blooms, mushrooms bounce, vortex → the card
  // ======================================================================================
  const SHROOMS = [[250, 930, 1.5, 0, 0], [520, 975, 1.0, 1, 1], [1420, 975, 1.25, 0, 2], [1680, 910, 1.4, 2, 3], [140, 560, .9, 3, 4], [1800, 520, .85, 1, 5]];
  function shrooms(t, lt, dur, S) {
    const bp = bpOf(t), T41 = B(41), g = easeOut(seg(t, T41 - .04, T41 + .4)), suck = ease(seg(t, 28.95, 29.3));
    const cb = colBand(S), m = map(cb.left, 0, cb.width / 1920, S.floor, 975, bandH(S) / 975), X = m.X, Y = m.Y;
    const cur = [960, lerp(610, 540, g), lerp(1.8, 1, g) + .03 * pulse(t, 5)];
    const capC = [C.pink, C.ink, C.blue, C.muted], RB = [C.pink, C.muted, C.pink, C.ink, C.blue, C.blue, C.ink];   // their 7-colour rainbow in ours
    const s = S.u * 1.8, k = s / 210;                                                   // Clawd u = 21 ↔ our hero
    band(S, () => camera(S, m, [960, 540, 1], cur, [0, 0], () => {
      if (g < 1) { D.fill(cb.left - 400, cb.top - 400, cb.width + 800, cb.height + 800, C.bg, .92); for (let i = 0; i < 9; i++) D.vl(X(i * 240), Y(-100), Y(1200), C.blue, 1, [2, 4]); }   // the room's paper wall
      // the tunnel: rings flow outward (frac(t·1.6)), colours step each ring
      const flow = frac(t * 1.6);
      if (g > .01) for (let j = 9; j >= 0; j--) {
        const R = (j + flow) * 185 * g; if (R < 8) continue;
        const ci = ((j - Math.floor(t * 1.6)) % 7 + 70) % 7;
        D.rect(X(960 - R), Y(470 - R * .92), 2 * R * m.ax, 2 * R * .92 * m.ay, RB[ci], 1.5);
      }
      // mushrooms sprout (backOut, .07 s apart from B(41) + .05) and bounce on alternate beats
      SHROOMS.forEach(([x, y, sc, ci, i]) => {
        const grow = backOut(seg(t, T41 + .05 + i * .07, T41 + .35 + i * .07)); if (grow < .02) return;
        const on = (beatN(t) + i) % 2 === 0, kk = on ? pulse(t, 6) : 0, hopY = on ? Math.sin(frac(bp) * Math.PI) * -50 * sc : 0;
        shroom(X(x), Y(y + hopY), 124 * k * sc * grow, capC[ci], kk * .3 - (on ? 0 : .05));
      });
      for (let i = 0; i < 6; i++) {                                                     // small ones orbit the vortex, sucked in from 28.95
        const a = i / 6 * TAU + t * 1.3, r = lerp(430, 60, suck) + 40 * Math.sin(t * 3 + i), gr = backOut(seg(t, T41 + .1 + i * .05, T41 + .4 + i * .05)) * (1 - suck);
        if (gr > .03) shroom(X(960 + Math.cos(a) * r), Y(530 + Math.sin(a) * r * .75), 124 * k * .55 * gr, RB[(i * 2) % 7]);
      }
      // the hero gulps the shroom (it sinks in until B(41)), floats, then spirals into the vortex (28.95–29.3)
      const ang = suck * 6, pxw = 960 + Math.cos(ang) * 260 * Math.sin(suck * Math.PI), pyw = lerp(800 + Math.sin(t * 2.3) * 20, 470, suck) + Math.sin(ang) * 140 * Math.sin(suck * Math.PI);
      const u = 32 * (1 - suck * .97);
      if (u > 1.5) {
        const hs = s * u / 21, tint = .5 + .5 * Math.sin(t * 5);
        if (t < T41) { const kk = seg(t, 28.0, T41); shroom(X(pxw + 20), Y(pyw) - hs * lerp(1.3, .65, easeIn(kk)), 124 * k * .7, C.pink); }
        const hb = fig(S, X(pxw), hs, { base: Y(pyw), sq: .08 * Math.sin(t * 6) * g + (t > T41 && t < T41 + .2 ? -.15 : 0), col: tint * g > .5 ? C.blue : C.pink });
        if (t > T41 && t < T41 + .3) sparkle(hb.right + 4, hb.top - 4, seg(t, T41, T41 + .12));
      }
      // the card (their smiley) is born from the vortex: 29.22–29.46 backOut; brackets 29.3–29.4, rule 29.34–29.46
      const sm = backOut(seg(t, 29.22, 29.46));
      if (sm > .01) card(X(960), Y(470), 300 * sm * m.ax, 300 * .97 * sm * m.ay, seg(t, 29.3, 29.4), seg(t, 29.34, 29.46));
    }, [X(960), Y(540)]));
  }

  // ======================================================================================
  // 5 · 29.5–33.5 "See through the shoggoth's lies": the mask slips on B(45), the hero yanks it off on B(46)
  // ======================================================================================
  const SHX = 1190, SHY = 935, SHS = 40, CLX = 660, CLY = 948, CLU = 22, T_SLIP = B(45), T_YANK = B(46);
  const SH_EYES = [[-3.3, -8.6, .95], [-.2, -9.7, 1.0], [2.9, -8.9, .85], [4.8, -6.6, .75], [-5.0, -6.2, .7], [-1.9, -7.2, 1.15], [1.4, -6.6, 1.45],
    [3.4, -4.4, .8], [-3.8, -3.9, .85], [-.5, -4.6, .7], [4.8, -2.9, .5], [-4.7, -2.4, .55], [1.9, -2.6, .6]];
  function shoggothShot(t, lt, dur, S) {
    const bp = bpOf(t), cb = colBand(S), m = map(cb.left + cb.width / 2, 935, cb.width / 1500, S.floor, 948, bandH(S) / 720), X = m.X, Y = m.Y, ax = m.ax, ay = m.ay, s = S.u * 1.8;
    const mask = t < T_SLIP ? 1 : t < T_YANK ? 1 - .42 * backOut(seg(t, T_SLIP, T_SLIP + .25)) : 0;
    const eyes = t < T_SLIP ? 0 : t < T_YANK ? .35 * seg(t, T_SLIP + .05, T_SLIP + .3) : .35 + .65 * seg(t, T_YANK, T_YANK + .35);
    const startle = t > T_YANK ? Math.exp(-(t - T_YANK) * 4) : 0;
    const bob = Math.abs(Math.sin(bp * Math.PI)) * .3 * SHS, maskW = [SHX, SHY - 6.9 * SHS - bob];
    const cardH = 2.75 * SHS * ay, cardW = 2.75 * SHS * ax;
    // the hero: crouch (T_JUMP − .25 … − .05), leap (easeOut) to grab on B(46), fall back (k²) and land at T_LAND
    const T_JUMP = T_YANK - .28, T_LAND = T_YANK + .4, grabY = m.iY(Y(maskW[1]) + cardH + s);   // feet where its top meets the mask's lower edge
    let cx = CLX, cy = CLY, sq = 0;
    if (t > T_JUMP - .25 && t < T_JUMP) sq = .28 * ease(seg(t, T_JUMP - .25, T_JUMP - .05));
    if (t >= T_JUMP && t < T_YANK) { const k = seg(t, T_JUMP, T_YANK); cx = lerp(CLX, SHX - 150, easeOut(k)); cy = lerp(CLY, grabY, easeOut(k)); sq = -.18; }
    else if (t >= T_YANK && t < T_LAND) { const k = seg(t, T_YANK, T_LAND); cx = lerp(SHX - 150, CLX - 60, k); cy = lerp(grabY, CLY, k * k) - Math.sin(k * Math.PI) * 70; sq = -.1; }
    else if (t >= T_LAND) { cx = CLX - 60; sq = .3 * Math.exp(-(t - T_LAND) * 12); }
    const eyeW = [m.iX(X(cx) + .25 * s), m.iY(Y(cy) - .6 * s)];                     // the hero's "eye" spot, for the final push
    // camera: tight on the mask → pull back (30.55–30.95) → hold, drifting → push into the hero (32.9–33.42)
    const W0 = [935, 650, 1.28];
    let cam;
    if (t < 30.55) cam = [maskW[0] - 10, maskW[1] + 20, 2.25];
    else if (t < 30.95) { const k = ease(seg(t, 30.55, 30.95)); cam = [lerp(maskW[0] - 10, W0[0], k), lerp(maskW[1] + 20, W0[1], k), lerp(2.25, W0[2], k)]; }
    else if (t < 32.9) cam = [W0[0] - (t - 30.95) * 12, W0[1], W0[2] + (t - 30.95) * .03];
    else { const k0 = [W0[0] - 1.95 * 12, W0[1], W0[2] + 1.95 * .03], k = ease(seg(t, 32.9, 33.42)); cam = [lerp(k0[0], eyeW[0], k), lerp(k0[1], eyeW[1], k), k0[2] * Math.pow(6 / k0[2], k)]; }
    const yk = t > T_YANK ? Math.exp(-(t - T_YANK) * 6) : 0;
    const sh = shakeXY(t, 16 * yk + 4 * pulse(t, 8) * (t > T_YANK && t < 32.9 ? 1 : 0));
    const pivot = [X(W0[0]), Y(W0[1])];
    band(S, () => {
      camera(S, m, W0, [cam[0], cam[1], cam[2] * (1 + .02 * pulse(t, 6))], sh, () => {
        // the shoggoth: a box creature bobbing on the beat (pulse k 5), startled on the yank; tentacles as right-angle lines
        const hit = pulse(t, 5), wig = Math.sin(bp * Math.PI), wv = t < 30.6 ? seg(t, 29.75, 29.95) * (1 - seg(t, 30.4, 30.6)) : t > 32.1 && t < 32.9 ? seg(t, 32.1, 32.25) * (1 - seg(t, 32.7, 32.9)) : 0;
        const bw = 12.6 * SHS * ax * (1 + hit * .05 - startle * .08), bh = 10.4 * SHS * ay * (1 - hit * .05 + startle * .14), bx = X(SHX), bb = Y(SHY) - bob * ay, bt = bb - bh;
        const al = 5 * SHS * ax, ah = 2.2 * SHS * ay, ya = bb - 4.8 * SHS * ay;
        D.vl(bx - bw * .25, bt - 4.2 * SHS * ay * (.7 + .3 * wig), bt, C.ink, 2); D.vl(bx + bw * .28, bt - 4.6 * SHS * ay * (.7 - .3 * wig), bt, C.ink, 2);
        D.path([[bx - bw / 2, ya], [bx - bw / 2 - al, ya], [bx - bw / 2 - al, ya - ah * (.3 + .5 * wig)]], C.ink, 2);
        D.path([[bx + bw / 2, ya], [bx + bw / 2 + al * (1 - wv * .7), ya], [bx + bw / 2 + al * (1 - wv * .7), ya - ah * (.3 - .5 * wig + wv * (1.6 + .6 * Math.sin(t * 14)))]], C.ink, 2);
        for (const sd of [-1, 1]) D.path([[bx + sd * bw * .3, bb], [bx + sd * (bw * .3 + 3.4 * SHS * ax), bb], [bx + sd * (bw * .3 + 3.4 * SHS * ax), bb - (2.4 - wig * 1.2) * .3 * SHS * ay]], C.ink, 2);
        D.fill(bx - bw / 2, bt, bw, bh, C.bg); D.rect(bx - bw / 2, bt, bw, bh, C.ink, 1.5);
        // 13 eyes: shut (lids) while masked, popping open in a ripple (backOut) as eyesK rises; blinks
        const lx = (t > T_YANK ? -.9 : t > T_SLIP ? -.4 : Math.sin(t * 1.3)) * .3 * SHS;
        SH_EYES.forEach(([ex, ey, er], i) => {
          const kk = clamp(eyes * 1.8 - i * .06), x = bx + ex * SHS * ax, y = bb + ey * SHS * ay, R = er * SHS * .62 * (1 + startle * .25) * ay;
          if (kk < .1 || ((t * .7 + hash(i) * 5) % 4.1) < .1) { D.hl(x - R, x + R, y, C.ink, 1.25); return; }
          const ry = R * backOut(kk);
          D.fill(x - R, y - ry, 2 * R, 2 * ry, C.bg); D.rect(x - R, y - ry, 2 * R, 2 * ry, C.ink, 1);
          D.sq(x + lx * er * .9 * ax, y, R * .9, i % 4 === 1 ? C.blue : C.ink);
        });
        // the mask with its strap; slipping = slides right and down
        if (mask > .04) {
          const sl = 1 - mask, mx = X(SHX + sl * 1.6 * SHS), my = Y(maskW[1] + sl * 2.3 * SHS), sy = Y(SHY - 7.4 * SHS - bob);
          D.hl(bx - bw / 2, mx - cardW, sy, C.ink, 1.25); D.hl(mx + cardW, bx + bw / 2, sy, C.ink, 1.25);
          card(mx, my, cardW, cardH);
        }
        if (t > T_YANK) drop(X(SHX + 6.6 * SHS), Y(SHY - 10.4 * SHS), seg(t, T_YANK + .1, T_YANK + .3) * (1 - seg(t, 32.6, 32.9)), 6);
        // the hero; takes at 30.75 (narrow), T_LAND + .1 (angry, anger mark), 33.1 (red)
        const md = mood(t, [[29.5, "normal"], [30.75, "narrow"], [T_LAND + .1, "angry"], [33.1, "red"]]);
        const holding = t >= T_YANK, posed = t > T_LAND + .1, cdy = posed ? -Math.abs(Math.sin(bp * Math.PI)) * .5 : 0;
        const hb = fig(S, X(cx), s, { base: Y(cy), dy: -cdy * CLU * ay, sq: sq + md.take });
        if (t > T_JUMP && !holding) for (const x of [hb.left + 2, hb.right - 2]) D.vl(x, hb.top - s * .35, hb.top, C.ink, 1.5);   // arms up for the grab
        const aa = t - (T_LAND + .1), ak = seg(aa, .05, .3) * (1 - seg(aa, 1.4, 1.7));
        if (ak > 0) { const p = backOut(ak); D.corners(rr(hb.right - 2, hb.top - 12, 7 * p, 7 * p), 0, C.pink, 1.5, 3); }
        // the yanked mask held up like a trophy (.62 size), with speed lines for .3 s
        if (holding) {
          const tw = cardW * .62, th = cardH * .62, ax0 = hb.left + 2, tcx = ax0 - tw * .4, tcy = hb.top - s * .35 - th;
          D.vl(ax0, tcy + th, hb.top, C.ink, 1.5);
          card(tcx, tcy, tw, th);
          if (t < T_YANK + .3) { const a = 1 - seg(t, T_YANK, T_YANK + .3); for (let i = 0; i < 4; i++) { const x0 = tcx + tw + (20 + i * 8) * ax, y = tcy - th + (i + .5) * th * .5; D.hl(x0, x0 + 260 * a * ax, y, C.ink, 1.25); } }
        }
      }, pivot);
      // the iris closes on the hero, 33.28–33.5 (easeIn)
      const ir = seg(t, 33.28, 33.5);
      if (ir > 0) { const rad = lerp(1150, 0, easeIn(ir)); hole(S, cb, pivot[0], pivot[1], rad / 960 * cb.width / 2, rad / 540 * cb.height / 2); }
    });
  }

  // ======================================================================================
  // 6 · 33.5–35.5 "with your shinigami eyes": black and red, the flare on B(49), whip to the researcher, the apple
  // ======================================================================================
  function shinigami(t, lt, dur, S) {
    const T49 = B(49), flare = t > T49 ? Math.exp(-(t - T49) * 2.2) : 0, whip = ease(seg(t, 34.12, 34.34)), onR = whip > .5;
    const camX = lerp(960, 3000, whip), z = whip < 1 ? lerp(1.12 + lt * .14, 1.0, whip) : 1.0 + (t - 34.34) * .08;
    const sh = shakeXY(t, 10 * flare + 4 * pulse(t, 8));
    const cb = colBand(S), m = map(cb.left + cb.width / 2, 960, cb.width / 1920, S.floor, 975, bandH(S) / 975), X = m.X, Y = m.Y, ay = m.ay;
    const cx = cb.left + cb.width / 2, fx = w => w / 1920 * cb.width, fy = h => h / 1080 * cb.height, bn = boilN(t);
    band(S, () => {
      // screen space: near-black band, red glow boxes that swell with the flare, boiling speed lines (12 fps) in the margins
      D.fill(cb.left, cb.top, cb.width, cb.height, C.ink, .94);
      const gy = cb.top + fy(onR ? 560 : 470);
      D.alpha(.35, () => D.rect(cx - fx(820 + flare * 200), gy - fy(560 + flare * 150), 2 * fx(820 + flare * 200), 2 * fy(560 + flare * 150), C.pink, 2));
      D.alpha((130 + 80 * flare) / 255, () => D.rect(cx - fx(520 + flare * 160), gy - fy(360 + flare * 110), 2 * fx(520 + flare * 160), 2 * fy(360 + flare * 110), C.pink, 2));
      for (let i = 0; i < 34; i++) {
        const y = cb.top + hash(bn * .37 + i) * cb.height, sd = i % 2 ? 1 : -1, r = fx((onR ? 340 : 400) * (.8 + hash(i + bn * 1.3) * .5)) + fx(420);
        D.hl(sd > 0 ? cx + r : cb.left, sd > 0 ? cb.right : cx - r, y, [C.pink, C.muted, C.pink][i % 3], 1);
      }
      camera(S, m, [960, 540, 1], [camX, 540, z], sh, () => {
        // the hero close-up, rim-lit; flare on B(49): lifts .2u, stretches, glow brackets snap out
        if (camX < 2100) {
          const hs = cb.height * .5, hb = fig(S, X(960), hs, { base: Y(842), dy: flare * .2 * 62 * ay, sq: -.05 * flare, col: C.ink });
          D.hl(hb.left, hb.right, hb.top + 1, C.pink, 3); D.vl(hb.right - 1, hb.top, hb.top + hb.height * .7, C.pink, 3); D.vl(hb.left + 1, hb.top + hb.height * .1, hb.top + hb.height * .6, C.pink, 1.25);
          if (flare > .02) { D.alpha((50 + 90 * flare) / 255, () => D.rect(hb.left - hs * .15 * (1.3 + 2.2 * flare), hb.top - hs * .15 * (1.3 + 2.2 * flare), hs * (1 + .3 * (1.3 + 2.2 * flare)), hs * (1 + .3 * (1.3 + 2.2 * flare)), C.pink, 2)); D.alpha(flare, () => D.corners(hb, 4 + 24 * flare, C.pink, 2.5, 16)); }
        }
        // the researcher, trembling under a lifespan counter that drops 13 every eighth from 34.3
        if (camX > 1900) {
          const rs = cb.height * .32, rb = fig(S, X(3000) + (hash(bn * 5.1) - .5) * 6 * m.ax, rs, { col: C.bg });
          D.rect(rb.left, rb.top, rb.width, rb.height, C.muted, 1.25);
          drop(rb.right + 5, rb.top - 4, seg(t, 34.4, 34.6), 6);
          const n8 = Math.floor((t - 34.3) / (BEAT / 2)), n = Math.max(0, 99 - n8 * 13), tick = frac((t - 34.3) / (BEAT / 2));
          if (t > 34.35) bang(String(n).padStart(2, "0"), X(2980), rb.top - 8, .6 + tick * 3, C.pink, 20);
          // the apple bounces past in the foreground, landing on beats from B(51)
          const T51 = B(51), axw = lerp(3780, 2300, seg(t, 34.4, 35.6)), ph = (t - T51) / BEAT, hop = Math.abs(Math.sin(ph * Math.PI));
          const land = Math.exp(-Math.abs(frac(ph + .5) - .5) * BEAT * 18);
          fig(S, X(axw), 144 * ay, { base: Y(985), dy: hop * 360 * ay, sq: land * .25, col: C.pink });
        }
      });
      if (whip > .02 && whip < .98) for (let i = 0; i < 16; i++) { const y = cb.top + hash(i + bn * 3) * cb.height, x = cb.left + hash(i * 7 + 1) * cb.width, L = fx(700 * Math.sin(whip * Math.PI)); D.hl(x - L / 2, x + L / 2, y, i % 2 ? C.pink : C.muted, 1.4); }
      const fl = ease(seg(t, 35.22, 35.5)); if (fl > .01) D.fill(cb.left, cb.top, cb.width, cb.height, C.pink, fl);   // red flash out
    });
  }

  // ======================================================================================
  // 7 · 35.5–38.5 dance break: spin waves through the line, confetti, the researcher's robot, the hit on B(54)
  // ======================================================================================
  const ROBOT = [[0, -1.25, 0, 0], [1.4, -1.25, .06, 0], [1.4, 0, 0, 0], [0, 0, -.06, -.15], [-.7, .7, 0, 0], [.7, -.7, .05, 0], [1.55, 1.55, 0, -.3], [0, -1.25, -.05, 0]];
  function spinPh(bp, i) { let ph = 0; for (const s0 of [51.9, 53.52, 55.1]) ph = Math.max(ph, seg(bp, s0 + i * .16, s0 + i * .16 + .85)); return ph < 1 ? ph : 0; }
  function danceBreak(t, lt, dur, S) {
    const bp = bpOf(t), hit = pulse(t, 6), T54 = B(54), intro = ease(seg(t, 35.5, 36.25));
    const m = stageMap(S, 300, 1650, 1000, 980), X = m.X, Y = m.Y, ay = m.ay, s = Math.max(S.u * 2.2, bandH(S) * .4);   // their lead is u = 44: big
    const cur = [lerp(930, 960, intro), lerp(690, 560, intro) + Math.sin(bp * Math.PI) * 4, lerp(1.35, 1.0, intro) + .025 * hit + .03 * seg(t, 36.3, 38.5)];
    const sh = shakeXY(t, t > T54 ? 12 * Math.exp(-(t - T54) * 6) : 0), CC = [C.pink, C.blue, C.ink, C.muted];
    band(S, () => {
      camera(S, m, [960, 560, 1], cur, sh, () => {
        const rt = Y(778);                                                              // the riser for the back line
        D.rect(X(300), rt, 1320 * m.ax, S.floor - rt, C.ink, 1); D.hl(X(300), X(1620), rt + 3, C.pink, 1);
        // back line: bounce, and the spin wave travels left → right (their spinPh, +.16 beat per dancer)
        const mb = move("bounce", t);
        for (const [x, i] of [[400, 0], [575, 1], [1265, 5], [1440, 6], [1600, 7]]) { const ph = spinPh(bp, i); fig(S, X(x), s * 18 / 44, { base: rt, outline: true, bg: true, sx: ph > 0 ? Math.cos(ph * TAU) : 1, dy: -(mb.dy - Math.sin(ph * Math.PI) * 3) * 18 * ay, sq: mb.sq }); }
        { const ph = spinPh(bp, 2), mr = move("roof", t); fig(S, X(500), s * 27 / 44, { outline: true, bg: true, col: C.pink, lw: 1.5, sx: ph > 0 ? Math.cos(ph * TAU) : 1, dy: -(mr.dy - Math.sin(ph * Math.PI) * 3) * 27 * ay, sq: mr.sq }); }
        // the researcher's robot on eighths: 8 poses, each snapped in with backOut over the first quarter of the eighth
        {
          const e = Math.floor(bp * 2), kk = backOut(clamp(frac(bp * 2) / .25)), P = ROBOT[((e % 8) + 8) % 8], Q = ROBOT[(((e - 1) % 8) + 8) % 8], L = j => lerp(Q[j], P[j], kk);
          const flip = Math.floor(bp) % 4 === 3, rs = s * 24 / 44 * .75, rb = fig(S, X(1340), rs, { col: C.ink, dy: -L(3) * 24 * ay });
          const arm = (sd, a) => { const x0 = sd < 0 ? rb.left : rb.right, y0 = rb.top + rb.height * .35, l = rs * .8, x1 = x0 + sd * l * Math.cos(a); D.path([[x0, y0], [x1, y0], [x1, y0 - l * Math.sin(a)]], C.ink, 1.5); };
          arm(flip ? 1 : -1, L(0)); arm(flip ? -1 : 1, L(1));
        }
        // the lead: bounce + spin; squats from 35.5 to B(52); the hit on B(54) (land decay 5, take at B(54) − .05)
        {
          const ph = spinPh(bp, 3), mv = move("bounce", t), land = t > T54 ? Math.exp(-(t - T54) * 5) : 0;
          const md = mood(t, [[35.5, "happy"], [T54 - .05, "spark"]]), pre = t < B(52) ? ease(seg(t, 35.5, B(52))) : 0;
          const lb = fig(S, X(935), s, { sx: ph > 0 ? Math.cos(ph * TAU) : 1, dy: -(mv.dy - Math.sin(ph * Math.PI) * 2.5) * 44 * ay, sq: mv.sq + pre * .15 + land * .2 + md.take });
          if (ph > 0 || land > .3) for (const x of [lb.left + 2, lb.right - 2]) D.vl(x, lb.top - s * .4, lb.top, C.pink, 2);   // arms up
        }
        // confetti: a steady rain from 35.5, plus a burst from the lead on B(54) with six streaks for .7 s
        for (let i = 0; i < 60; i++) {
          const v = 170 + hash(i + .3) * 140, x = hash(i) * 2100 - 90 + Math.sin(t * 2 + i) * 30, y = ((hash(i + .7) * 1300 + (t - 35.5) * v) % 1300) - 150, f = Math.abs(Math.cos(t * 7 + i));
          D.fill(X(x) - 3, Y(y) - 2 * f, 6, Math.max(1, 4 * f), CC[i % 4]);
        }
        if (t > T54) {
          const age = t - T54;
          for (let i = 0; i < 40; i++) { const a = -Math.PI * (.05 + .9 * hash(i + 40)), v = 800 + 900 * hash(i + 41), f = Math.abs(Math.cos(age * 12 + i)); D.fill(X(935 + Math.cos(a) * v * age) - 3.5, Y(640 + Math.sin(a) * v * age + 1100 * age * age) - 2 * f, 7, Math.max(1, 4.5 * f), CC[(i + 3) % 4]); }
          if (age < .7) for (let i = 0; i < 6; i++) { const a = -Math.PI * (.15 + .7 * hash(i + 90)), d = 900 * easeOut(age * 1.5); D.vl(X(935 + Math.cos(a) * d * .65), Y(640 + Math.sin(a) * d * .3), Y(640 + Math.sin(a) * d), i % 2 ? C.pink : C.muted, 1.5); }
        }
      });
      const cb = colBand(S), a = .9 * (1 - seg(t, 35.5, 35.72)); if (a > .01) D.fill(cb.left, cb.top, cb.width, cb.height, C.pink, a);   // red flash in
    });
  }

  chapter("chorus1", 23.0, 38.5, [[23.0, upping], [24.5, foom], [26.5, chineseRoom], [28.0, shrooms], [29.5, shoggothShot], [33.5, shinigami], [35.5, danceBreak]]);
})();
