// c6 · Chorus 3: Paperclips (95.4–109.4). A one-for-one port of their src/ch/c06_chorus3.js timing into our shapes:
// every shot start, keyframe, window, pulse, mood change and sfx is theirs (table: docs/storyboard-timing/c6_chorus3.md).
// Shots (their chapter() call): 95.4 plop · 97.4 flood · 99.0 killswitch · bt(146) beach · 100.5 planet + fuse · 105.4 blues.
// Hits: LAND = bt(141) = 96.346 (PLOP), BOOM_T = bt(154) = 105.210 (BOOM).
// Their world (1920 × 1080) maps onto the stage band: x across the name's letters, their floor onto the name (S.floor).
// Everything but page boxes is clipped to the band (photo strip → top of the name's letters).
(() => {
  const SB = window.__SB;
  const { D, C, B, bpOf, beatN, pulse, pulse2, seg, kf, ease, easeIn, easeOut, backOut, pumpH, mood, shakeXY, lerp, clamp, frac, hash, rr, chapter, pdoomAt, BEAT } = SB;
  const bt = B, TAU = Math.PI * 2, sq2 = x => x * x;
  const LAND = bt(141), BOOM_T = bt(154);                     // 96.346 plop, 105.210 boom (their constants)
  const g = () => document.querySelector('canvas[aria-hidden="true"]').getContext("2d");
  const X = (S, f) => S.text.left + S.text.width * f;

  // ---------- stage ----------
  const band = S => { const top = S.strip ? S.strip.top : Math.max(S.bar ? S.bar.bottom + 4 : 0, S.name.top - 10 * S.u); return rr(0, top, S.W, S.floor + 1 - top); };
  const clipTo = (r, fn) => { const c = g(); c.save(); c.beginPath(); c.rect(r.left, r.top, r.width, r.height); c.clip(); try { fn(); } finally { c.restore(); } };
  // their world → ours for one shot: x about the shot's opening camera centre cx0 at their base zoom z0 (so the framing is
  // theirs), y about their floor line fy0 (→ the name). ky can be compressed so tall sets fit the band.
  function map(S, cx0, z0, fy0, top) {
    const kx = S.text.width / 1920 * z0, hb = S.floor - band(S).top;
    const ky = top == null ? kx : Math.min(kx, hb * .92 / (fy0 - top));
    return { kx, ky, k: Math.min(kx, ky), x: x => X(S, .5) + (x - cx0) * kx, y: y => S.floor + (y - fy0) * ky, r: (x, y, w, h) => rr(X(S, .5) + (x - cx0) * kx, S.floor + (y - fy0) * ky, w * kx, h * ky) };
  }
  // their camBegin(cx, cy, z) → ours: zoom z / z0 about the floor point under their camera centre (the name stays the
  // floor), horizontal pan in stage units, dy for the vertical moves we keep, and their 24 fps shake scaled by S.W / 1920
  function cam(S, M, cx, z, z0, fn, dy = 0, sh = [0, 0]) {
    const px = M.x(cx), f = S.W / 1920;
    D.cam(px, S.floor, z / z0, fn, X(S, .5) - px - sh[0] * f, dy - sh[1] * f);
  }

  // ---------- cast (our squares) ----------
  // a block standing with its bottom at yb; their squash: clawd x·(1 + .6 sq), researcher x·(1 + .5 sq), y·(1 − sq)
  function blk(x, yb, s, col, sq = 0, kx = .6, sx = 1) { const w = s * (1 + sq * kx) * sx, h = s * (1 - sq); D.fill(x - w / 2 - 1.5, yb - h - 1.5, w + 3, h + 1.5, C.bg, .85); D.fill(x - w / 2, yb - h, w, h, col); return rr(x - w / 2, yb - h, w, h); }
  // an arm as an elbow (out, then up/down): their arm angle a → the hand's height (sin a) and reach (cos a)
  function arm(x, y, dir, a, len, col = C.ink) { const hx = x + dir * len * Math.max(.35, Math.cos(a)), hy = y - len * Math.sin(a); D.path([[x, y], [hx, y], [hx, hy]], col, 1.5); return [hx, hy]; }
  // their mood(): the engine gives the squash "take"; the emote pop is theirs: seg(age, .05, .3) · (1 − seg(age, 1.4, 1.7))
  function md(t, keys) {
    const m = mood(t, keys); let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const em = keys[i][2]; return { take: m.take, emote: em, emoteK: em ? seg(m.age, .05, .3) * (1 - seg(m.age, 1.4, 1.7)) : 0 };
  }
  function emote(kind, x, y, s, k) {                            // their emotes in squares and straight lines
    if (!kind || k <= .01) return; const e = s * k;
    if (kind === "!") { D.fill(x - e * .09, y - e * 1.05, e * .18, e * .6, C.pink); D.sq(x, y - e * .2, e * .2, C.pink); }
    else if (kind === "sweat") D.sq(x, y - e * .35, e * .3, C.blue);
    else if (kind === "spark") for (const [a, b] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) D.sq(x + a * e * .34, y - e * .45 + b * e * .34, e * .17, C.pink);
    else if (kind === "music") { D.sq(x, y - e * .15, e * .3, C.ink); D.vl(x + e * .13, y - e * .9, y - e * .15, C.ink, 1.25); D.hl(x + e * .13, x + e * .42, y - e * .9, C.ink, 1.25); }
    else if (kind === "heart") D.sq(x, y - e * .35, e * .42, C.pink);
    else if (kind === "star") D.osq(x, y - e * .35, e * .42, C.blue, 1.5);
  }
  // their sfx(): pops in with backOut(age · 5), fades over its last 0.25 s; here corner brackets around a small mono word
  function sfx(txt, x, y, age, life, s) {
    if (age < 0 || age > life) return; const k = backOut(age * 5), w = s * 2.8 * k, h = s * k;
    D.alpha(1 - seg(age, life - .25, life), () => { D.fill(x - w / 2, y - h / 2, w, h, C.bg, .85); D.corners(rr(x - w / 2, y - h / 2, w, h), 0, C.pink, 1.5, 7); if (k > .35) D.text(txt, x, y + 4, C.ink, Math.round(clamp(11 * k, 6, 14)), "center"); });
  }
  // a paperclip, squared off; their rotation rounded to the nearest quarter turn picks lying or standing
  function clip(x, y, s, rot = 0, col = C.ink) {
    const q = ((Math.round(rot / (Math.PI / 2)) % 2) + 2) % 2, L = 14 * s, w = 6 * s;
    if (q) { D.rect(x - w / 2, y - L / 2, w, L, col, 1); D.rect(x - w / 4, y - L * .28, w / 2, L * .56, col, 1); }
    else { D.rect(x - L / 2, y - w / 2, L, w, col, 1); D.rect(x - L * .28, y - w / 4, L * .56, w / 2, col, 1); }
  }
  const VIN = () => [C.pink, C.blue, C.pink, C.blue];
  const vinyl = (i, p = .2) => hash(i * 7.7 + 1.3) < p ? VIN()[Math.floor(hash(i * 3.1) * 4)] : null;
  const mclip = (M, x, y, L, rot, col) => clip(M.x(x), M.y(y), L * M.k / 14, rot, col || C.ink);

  // ---------- their props, in our shapes (world coordinates through M) ----------
  const MX = 950, MY = 885, MS = .85, CRX = 1150, CRY = 885, CRH = 50;
  const HEAP = { cx: 500, base: 895, w: 540, h: 175, n: 16 };
  const HEAP_F = { cx: 470, base: 905, w: 360, h: 160, n: 7 };
  const heapTop = (x, H0) => { const f = clamp((x - (H0.cx - H0.w / 2)) / H0.w); return H0.base - H0.h * Math.pow(Math.sin(Math.PI * f), .8); };
  const heapLand = i => { const x = lerp(330, 700, hash(i * 7.3)); return [x, heapTop(x, HEAP) + 10 + hash(i * 2.1) * 18, hash(i * 4.4) * TAU]; };
  function heap(M, H0) {                                        // stepped mound on their 15-point outline, their clip positions
    const pts = [];
    for (let i = 0; i < 14; i++) {
      const xa = H0.cx - H0.w / 2 + H0.w * i / 14, xb = xa + H0.w / 14, y = heapTop((xa + xb) / 2, H0) + (i % 14 ? (hash(i * 3.7 + H0.cx) - .5) * 16 : 0);
      D.fill(M.x(xa), M.y(y), (xb - xa) * M.kx + .5, M.y(H0.base + 16) - M.y(y), C.bg, .85); D.fill(M.x(xa), M.y(y), (xb - xa) * M.kx + .5, M.y(H0.base + 16) - M.y(y), C.muted, .18);
      pts.push([M.x(xa), M.y(y)], [M.x(xb), M.y(y)]);
    }
    D.path(pts, C.ink, 1.1);
    for (let i = 0; i < H0.n; i++) {
      const x = H0.cx - H0.w / 2 + H0.w * (.08 + .84 * hash(H0.cx + i * 1.3)), top = heapTop(x, H0), y = lerp(top + 14, H0.base - 8, Math.pow(hash(H0.cx + i * 2.9), 1.4) * .85);
      mclip(M, x, y, 42 + hash(i * 1.1 + H0.cx) * 24, hash(i * 5.1 + H0.cx) * TAU, vinyl(i + H0.cx));
    }
  }
  // the paperclip machine (their pump, promoted): body squashes on every beat (pulse k 7), plunger rod 90·pumpH, steam
  // puff after each stroke. Returns the chute and the right grip (where Clawd holds on), in world coordinates.
  function machine(M, t, v) {
    const p = pulse(t, 7), h = pumpH(t), sx = MS * (1 + p * .06), sy = MS * (1 - p * .07), L = (x, y, w, hh) => M.r(MX + x * sx, MY + y * sy, w * sx, hh * sy), rod = 90 * h;
    const base = L(-128, -26, 256, 26); D.fill(base.left, base.top, base.width, base.height, C.ink);
    const ch = L(-212, -266, 44, 48); D.rect(ch.left, ch.top, ch.width, ch.height, C.ink, 1.25); D.fill(ch.left + 2, ch.top + 2, ch.width * .5, ch.height - 4, C.ink);   // chute
    const r1 = L(-10, -268 - rod, 20, rod + 30); D.vl(r1.left + r1.width / 2, r1.top, r1.bottom, C.ink, 1.5);                       // plunger rod
    const hd = L(-80, -294 - rod, 160, 30); D.fill(hd.left, hd.top, hd.width, hd.height, C.ink);                                    // T handle
    for (const gx of [-80, 46]) { const gr = L(gx, -292 - rod, 34, 26); D.fill(gr.left, gr.top, gr.width, gr.height, C.pink); }     // grips
    const bd = L(-108, -262, 216, 240); D.fill(bd.left, bd.top, bd.width, bd.height, C.bg, .9); D.rect(bd.left, bd.top, bd.width, bd.height, C.ink, 1.25);
    const bn = L(-108, -168, 216, 22); D.fill(bn.left, bn.top, bn.width, bn.height, C.ink);
    for (let i = 0; i < 6; i++) { const rv = L(-88 + i * 35, -157, 1, 1); D.sq(rv.left, rv.top, 2, C.bg); }
    const bg = L(-90, -130, 96, 94); D.rect(bg.left, bg.top, bg.width, bg.height, C.ink, 1); clip(bg.left + bg.width / 2, bg.top + bg.height / 2, 68 * M.k * MS / 14, .55 + p * .25);
    // gauge: their needle sweeps −2.7 → −.2 with P(doom) and trembles on the stroke; ours is a level in a box, red zone pink
    const gg = L(24, -116, 64, 64); D.rect(gg.left, gg.top, gg.width, gg.height, C.ink, 1); D.fill(gg.left + gg.width * .72, gg.top + 1, gg.width * .28 - 1, gg.height - 2, C.pink, .35);
    const lv = clamp(v / 100 + p * .3 * Math.sin(t * 70) * .12); D.vl(gg.left + 2 + (gg.width - 4) * lv, gg.top + 2, gg.bottom - 2, C.ink, 2);
    const age = frac(bpOf(t)) * BEAT, sz = (24 + age * 88) * M.k;                                                                   // steam puff
    D.alpha(150 / 255 * (1 - age / BEAT), () => D.osq(M.x(MX + 70 * MS + age * 30), M.y(MY - 270 * MS - age * 150), sz, C.muted, 1));
    return { chute: [MX - 190 * MS, MY - 242 * MS], grip: [MX + 63 * sx, MY + (-279 - rod) * sy] };
  }
  function crate(M, x, y, w, h) { const r = M.r(x - w / 2, y - h, w, h); D.rect(r.left, r.top, r.width, r.height, C.ink, 1.25); D.hl(r.left + 3, r.right - 3, r.top + r.height / 2, C.muted, 1); }
  function meterProp(M, x, y, v, glow) {                        // their meterProp on the stage (the corner meter hides meanwhile)
    const r = M.r(x - 18, y - 190, 36, 190), lv = (r.height - 4) * v / 100;
    D.alpha(glow, () => D.box(r, 3, C.pink, 1.5));
    D.rect(r.left, r.top, r.width, r.height, C.ink, 1.25); D.fill(r.left + 2, r.bottom - 2 - lv, r.width - 4, lv, C.pink);
  }
  // clips the machine spits on every beat (2 per beat, 0.09 s apart): arc from the chute to the heap, then stay there
  function spitClips(M, t, chute, b0, b1, tEnd = 99) {
    for (let b = b0; b <= b1; b++) for (let j = 0; j < 2; j++) {
      const t0 = bt(b) + j * .09, age = t - t0, dur = .5 + j * .1; if (age < 0 || t0 > tEnd) continue;
      const [lx, ly, lr] = heapLand(b * 2 + j), k = Math.min(1, age / dur);
      mclip(M, lerp(chute[0], lx, k), lerp(chute[1], ly, k) - Math.sin(Math.PI * k) * (170 + 70 * j), 52, lr + (1 - k) * 9, vinyl(b * 2 + j, .35));
    }
  }
  function flySpace(M) {                                        // the fly loft the camera falls through: ropes, sandbags, battens, lamps
    for (let i = 0; i < 7; i++) { const x = 120 + i * 290 + hash(i) * 70, yb = -380 - hash(i + 3) * 1100, r = M.r(x - 22, yb, 44, 58); D.vl(M.x(x), M.y(-2000), r.top, C.muted, 1); D.rect(r.left, r.top, r.width, r.height, C.ink, 1.25); }
    for (const by of [-1500, -900, -330]) {
      const r = M.r(-400, by, 2720, 14); D.fill(r.left, r.top, r.width, r.height, C.ink);
      for (let i = 0; i < 6; i++) { const lx = 200 + i * 300 + (by % 7) * 12, l = M.r(lx - 24, by + 10, 48, 54); D.rect(l.left, l.top, l.width, l.height, C.ink, 1); D.fill(l.left + 2, l.bottom - 3, l.width - 4, 3, C.pink); }
    }
  }
  // their seaLayer as a stepped surface (columns every 40 of their px) over a pale fill that hides the strip behind it
  function sea(M, fy, x0, x1, fillA, line = C.ink, step = 40) {
    const pts = [], bot = M.y(1150);
    for (let x = x0; x < x1; x += step) {
      const y = M.y(fy(x + step / 2)), xa = M.x(x), xb = M.x(Math.min(x1, x + step));
      D.fill(xa, y, xb - xa + .6, bot - y, C.bg, .92); D.fill(xa, y, xb - xa + .6, bot - y, C.muted, fillA); pts.push([xa, y], [xb, y]);
    }
    D.path(pts, line, 1.25);
  }
  function surfClips(M, fy, t, n, x0, x1, seed, L = 46, depth = 40) {
    for (let i = 0; i < n; i++) {
      const x = lerp(x0, x1, (i + .5 + (hash(seed + i) - .5) * .7) / n), y = fy(x) + 8 + hash(seed + i * 2.3) * depth;
      mclip(M, x, y, L * (.8 + .4 * hash(seed + i * 3.9)), hash(seed + i * 5.3) * TAU + Math.sin(t * 2.2 + i) * .35, vinyl(seed + i));
    }
  }

  // ---------- SHOT 1: plop (95.4–97.4) ----------
  // The camera falls with the researcher through the fly loft (their yR = −720 + 700τ + 878τ², cyF follows until raw
  // 440, then eases to the stage) and lands in the heap on LAND. Shake 18·e^(−6a); push-in 1 → 1.1 and pan 960 → 890 over
  // LAND + .1 → 97.4. Clawd rides the plunger (dy −.14 − 2.73·pumpH, squash .16·pulse k 9), the machine spits two clips a
  // beat (beats 140–143), splash of 7 clips on landing, PLOP sfx (life 1.0).
  function plop(t, lt, dur, S) {
    const tau = t - 95.4, a = t - LAND, falling = a < 0;
    const yR = falling ? -720 + 700 * tau + 878 * tau * tau : 790;
    const raw = Math.min(yR, 790) + 150, cyF = raw < 440 ? raw : 540 - 100 * Math.exp(-(raw - 440) / 100);
    const pk = ease(seg(t, LAND + .1, 97.4)), sh = shakeXY(t, a > 0 ? 18 * Math.exp(-a * 6) : 0);
    const M = map(S, 960, 1, 885), R = S.u * .9, Hc = S.u * 2, v = pdoomAt(t);
    SB.noMeter = true;
    const camY = (540 - Math.min(540, lerp(cyF, 585, pk))) * M.ky;          // the tilt down; their small reframe to 585 is dropped (it would lift the stage off the name)
    clipTo(band(S), () => cam(S, M, lerp(960, 890, pk), lerp(1, 1.1, pk), 1, () => {
      flySpace(M);
      meterProp(M, 1480, 885, v, .5 * pulse(t, 5));
      D.path([[M.x(MX + 95), M.y(MY - 60)], [M.x(MX + 95), M.y(878)], [M.x(1432), M.y(878)], [M.x(1432), M.y(800)]], C.ink, 2);   // the cable to the meter
      const mc = machine(M, t, v);
      crate(M, CRX, CRY, 250, CRH);
      heap(M, HEAP);
      const landY = M.y(heapTop(480, HEAP)) + R * .25;                          // our researcher is small: it sits in the top of the heap
      if (falling) {
        const k = tau / (LAND - 95.4), th = TAU * ease(k), cx = 480 + Math.sin(k * 3) * 24, yb = landY + M.y(yR) - M.y(790);
        for (let i = 0; i < 5; i++) { const lx = cx + (i - 2) * 48 + (hash(i + Math.floor(t * 12) * 5) - .5) * 8, l0 = yb - R - (170 + hash(i) * 80) * M.ky; D.vl(M.x(lx), l0 - (160 + hash(i + 5) * 140) * M.ky, l0, C.ink, 1); }
        blk(M.x(cx), yb, R, C.ink, 0, 0, Math.max(.2, Math.abs(Math.cos(th))));   // their full tumble, eased over the fall, shown as a flip
      } else {
        const m = md(t, [[LAND, "swirl"], [LAND + .85, "look", "sweat"]]);
        const r = blk(M.x(480), landY, R, C.ink, .38 * Math.exp(-a * 7) * Math.cos(a * 24) + m.take, .5);
        emote(m.emote, r.right + R * .3, r.top, R, m.emoteK);
      }
      heap(M, HEAP_F);
      // Clawd on the crate, holding the handle, rides it down on every beat
      const cm = md(t, [[95.4, "happy"], [LAND + .05, "scared", "!"], [LAND + .7, "happy", "spark"]]);
      const h = pumpH(t), c = blk(M.x(CRX), M.y(CRY - CRH) - (.14 + 2.73 * h) * Hc / 8, Hc, C.pink, .16 * pulse(t, 9) + cm.take);
      const gy = c.bottom - c.height * .56; D.path([[c.left, gy], [M.x(mc.grip[0]), gy], [M.x(mc.grip[0]), M.y(mc.grip[1])]], C.ink, 1.5);
      arm(c.right, gy, 1, .7 + .7 * Math.abs(Math.sin(bpOf(t) * Math.PI)), Hc * .28);
      emote(cm.emote, c.left - Hc * .25, c.top, Hc * .6, cm.emoteK);
      spitClips(M, t, mc.chute, 140, 143);
      if (a >= 0 && a < .8) for (let i = 0; i < 7; i++) {                        // splash on landing
        const ang = -Math.PI / 2 + (i - 3) * .4, vv = 620 + hash(i * 4.4) * 300, x = 480 + Math.cos(ang) * vv * a, y = 745 + Math.sin(ang) * vv * a + 1700 * a * a;
        if (y < 910) mclip(M, x, y, 42, i + a * 14, vinyl(i + 40, .3));
      }
      sfx("PLOP", M.x(520), M.y(420), a, 1.0, 160 * M.k * .55);
    }, camY, sh));
  }

  // ---------- SHOT 2: clip flood (97.4–99.0) ----------
  // The sea rises (level keys 97.35/97.8/98.45/99.0), a breaker builds (ease 97.45 → 97.9) and travels 1520 → 960
  // (97.6 → 99.0); the researcher is lifted and flails ('!' at 97.85); Clawd's board pops in (backOut 97.45 → 97.62), he
  // rides from 97.74 ('spark'), ollies 98.1 → 98.418, the researcher leaps aboard 98.48 → 98.72; the troupe pops up at
  // 98.35 and 98.62; the room fills to the ceiling 98.78 → 99.0 (easeIn).
  function flood(t, lt, dur, S) {
    const f = kf(t, [[97.35, 0], [97.8, .42], [98.45, .8], [99.0, 1]], ease);
    const lvl = lerp(905, 650, f), wk = ease(seg(t, 97.45, 97.9)), HH = 440 * wk, RL = 220 * wk;
    const wp = seg(t, 97.6, 99.0), xw = lerp(1520, 960, lerp(wp, ease(wp), .45));
    const bump = d => d < 0 ? Math.exp(-sq2(d / 185)) : Math.exp(-sq2(d / 230));
    const rip = (x, ph = 0) => 13 * Math.sin(x * .011 - t * 5 + ph) + 7 * Math.sin(x * .027 + t * 3.1 + ph);
    const front = x => lvl + 34 + rip(x) - HH * bump(x - xw);
    const back = x => lvl - 30 + rip(x, 1.3) - .35 * HH * bump(x - xw - 260);
    const pk = seg(t, 97.4, 99.0), M = map(S, 960, 1, 885), R = S.u * .9, Hc = S.u * 2, v = pdoomAt(t);
    SB.noMeter = true;
    clipTo(band(S), () => cam(S, M, lerp(900, 880, ease(pk)), lerp(1.1, 1.04, ease(pk)), 1, () => {   // their cy 585 → 560 and roll are dropped
      meterProp(M, 1480, 885, v, .5 * pulse(t, 5));
      D.path([[M.x(MX + 95), M.y(MY - 60)], [M.x(MX + 95), M.y(878)], [M.x(1432), M.y(878)], [M.x(1432), M.y(800)]], C.ink, 2);
      const mc = machine(M, t, v);
      crate(M, CRX, CRY, 250, CRH);
      if (lvl > 760) heap(M, HEAP);                                               // until 98.08
      spitClips(M, t, mc.chute, 142, 146, 98.2);
      sea(M, back, -220, 2000, .32, C.muted);                                     // back sea (a swell behind the breaker)
      surfClips(M, back, t, 14, -150, 1950, 11, 40, 30);
      [[1660, 98.35, 0], [1330, 98.62, 1]].forEach(([x, t0, i]) => {             // the troupe pops up in the clip pit
        const up = backOut(seg(t, t0, t0 + .35)); if (up <= 0) return;
        const s = S.u * 1.3, yb = M.y(back(x)) + s * .9 + (1 - up) * s * 1.5, c = blk(M.x(x) + Math.sin(t * 3 + i) * .1 * s, yb, s, i ? C.blue : C.pink);
        D.fill(c.left + c.width * .3, c.top - s * .35, c.width * .4, s * .35, C.ink);   // party hat
        arm(c.left, c.top + s * .35, -1, 1.1 + .4 * Math.sin((t * 2.3 + i) * TAU), s * .35); arm(c.right, c.top + s * .35, 1, 1.1 + .4 * Math.sin((t * 2.3 + i + .5) * TAU), s * .35);
      });
      const rx = lerp(480, 430, ease(seg(t, 97.8, 98.45))), ryW = Math.min(792, front(rx) - 34 + 5.9 * 20), afloat = ryW < 791;
      const landY = M.y(heapTop(480, HEAP)) + R * .25, ry = landY + M.y(ryW) - M.y(792);   // their feet: 792 on the heap, lifted by the sea
      const SC0 = 98.48, SC1 = 98.72, scoop = seg(t, SC0, SC1);
      if (lvl > 725) heap(M, HEAP_F);                                             // until 98.24
      const rm = md(t, [[97.4, "look"], [97.85, "wide", "!"]]);
      if (scoop <= 0) {
        const r = blk(M.x(rx), ry, R, C.ink, rm.take, .5);
        if (afloat) { arm(r.left, r.top + R * .3, -1, 1.35 + .35 * Math.sin(t * 2.2 * TAU), R * .6); arm(r.right, r.top + R * .3, 1, 1.2 + .35 * Math.sin((t * 2.2 + .5) * TAU), R * .6); }
        emote(rm.emote, r.right + R * .4, r.top, R, rm.emoteK);
      }
      sea(M, front, -220, 2000, .12);                                             // front sea: the breaker rises out of it
      surfClips(M, front, t, 16, -150, 1950, 23, 50, 60);
      if (wk > .05) {                                                            // the curl: a stepped lip over a dark barrel
        const c0 = front(xw), L = (dx, dy) => [xw + dx * RL, c0 + dy * RL];
        const [bx0, by0] = L(-1.24, .28), bar = M.r(bx0, by0, 1.24 * RL, 1.0 * RL); D.fill(bar.left, bar.top, bar.width, bar.height, C.ink, .55);
        const [lx0, ly0] = L(-1.1, -.2), lip = M.r(lx0, ly0, 1.45 * RL, .32 * RL), hang = M.r(lx0, ly0, .3 * RL, 1.18 * RL);
        for (const q of [lip, hang]) D.fill(q.left, q.top, q.width, q.height, C.bg, .95);
        D.path([[lip.right, lip.bottom], [lip.right, lip.top], [lip.left, lip.top], [lip.left, hang.bottom], [hang.right, hang.bottom], [hang.right, lip.bottom], [lip.right, lip.bottom]], C.ink, 1.4);
        for (let i = 0; i < 7; i++) { const [fx, fy] = L(.2 - i * .19, -.16 + Math.sin(i * .9) * .05 + (i > 4 ? (i - 4) * .12 : 0)); D.osq(M.x(fx), M.y(fy), .13 * RL * M.k, C.muted, 1); }
        for (let i = 0; i < 6; i++) { const [cx2, cy2] = L(-.1 - i * .17, .02 + (i > 3 ? (i - 3) * .2 : 0)); mclip(M, cx2, cy2, 40, i * 1.3 + t * 3, vinyl(i + 70, .45)); }
        for (let i = 0; i < 8; i++) { const ph = frac(t * 2 + i / 8), [sx0, sy0] = L(-.9, 0); mclip(M, sx0 - ph * 220 - i * 8, sy0 - Math.sin(ph * Math.PI) * 150 + ph * 120, 30, i + ph * 8, vinyl(i + 90, .3)); }
      }
      // Clawd rides the rising sea on a surfboard, then races ahead of the curl
      const ride = ease(seg(t, 97.74, 98.0)), carve = Math.sin((t - 97.74) * 4.2) * 55;
      const hop = Math.sin(Math.PI * seg(t, 98.1, 98.418)), cxp = lerp(CRX, xw - 1.72 * RL - 60 + carve, ride);
      const by = Math.min(CRY - CRH + 8, front(cxp) - 10) - hop * 120, bIn = backOut(seg(t, 97.45, 97.62));
      if (bIn > 0) { const bw = 330 * bIn * M.kx; D.fill(M.x(cxp) - bw / 2, M.y(by) - 3, bw, 5, C.ink); D.fill(M.x(cxp) - bw * .42, M.y(by) - 2, bw * .15, 3, C.pink); }
      const la = t - SC1, land = la > 0 ? Math.exp(-la * 8) * Math.cos(la * 30) : 0, dyC = -.25 * pulse(t, 5) + (la > 0 ? .5 * Math.exp(-la * 9) : 0);
      const cm = md(t, [[97.4, "happy"], [97.76, "spark", "spark"], [SC1, "happy"]]);
      const c = blk(M.x(cxp), M.y(by) - 3 + dyC * Hc / 8, Hc, C.pink, .08 * pulse(t, 8) - hop * .12 + .2 * land + cm.take);
      arm(c.left, c.top + Hc * .44, -1, .25 + .35 * Math.sin(t * 1.8 * TAU) * ride + (1 - ride) * .7 + hop * .9, Hc * .28);
      arm(c.right, c.top + Hc * .44, 1, .6 + .3 * Math.sin((t * 1.8 + .4) * TAU) * ride + (1 - ride) * .4 + hop * .7, Hc * .28);
      emote(cm.emote, c.left - Hc * .25, c.top, Hc * .6, cm.emoteK);
      if (scoop > 0) {                                                           // the researcher leaps aboard, landing on Clawd's head
        const k = easeOut(scoop), m2 = md(t, [[SC0, "wide"], [SC1 + .02, "star"]]);
        const r = blk(lerp(M.x(rx), c.left + c.width / 2, k), lerp(ry, c.top, k) - Math.sin(Math.PI * scoop) * 120 * M.ky, R, C.ink, .3 * land + m2.take, .5);
        arm(r.left, r.top + R * .3, -1, 1.45 + .3 * Math.sin(t * 2.6 * TAU), R * .6); arm(r.right, r.top + R * .3, 1, 1.3 + .3 * Math.sin((t * 2.6 + .4) * TAU), R * .6);
        emote(m2.emote, r.right + R * .4, r.top, R, m2.emoteK);
      }
      if (ride > .3 && hop < .1) for (let i = 0; i < 5; i++) { const ph = frac(t * 3 + i / 5); mclip(M, cxp - 170 - ph * 120, by - 10 - Math.sin(ph * Math.PI) * 70 + ph * 40, 24, i * 2 + ph * 9); }
      const cr = easeIn(seg(t, 98.78, 99.0));                                     // the room fills to the ceiling
      if (cr > 0) { const top = x => lerp(front(x) + 40, -260, cr) + Math.sin(x * .01 + t * 6) * 30; sea(M, top, -220, 2000, .2); surfClips(M, top, t, 12, -100, 1900, 37, 60, 200); }
    }));
  }

  // ---------- SHOT 3: killswitch guys on PTO (99.0–bt(146)) ----------
  // Push 1.27 → 1.4, pan 940 → 1000 (ease 99.0 → 99.78). The unattended button glows on every beat (pulse k 4); the
  // empty chair is still turning (easeOut 99.0 → 99.62, its back narrows and flips, the note shows when cos > .2); the
  // clip tide seeps in (linear 99.0 → 99.78); a paperclip tumbleweed rolls through (99.04 → 99.78, 9 half-bounces).
  function killswitch(t, lt, dur, S) {
    const k = ease(seg(t, 99.0, 99.78)), M = map(S, 940, 1.27, 805, 420);
    clipTo(band(S), () => cam(S, M, lerp(940, 1000, k), lerp(1.27, 1.4, k), 1.27, () => {
      for (let i = 0; i < 6; i++) D.vl(M.x(-100 + i * 380), M.y(0), M.y(760), C.rule, 1, [2, 4]);   // wall panels
      D.hl(M.x(-40), M.x(1960), M.y(790), C.muted, 1);
      // pedestal and big button (their scale 1.18 about the base)
      const px = 720, gl = pulse(t, 4), P = (x, y, w, h) => M.r(px + (x - px) * 1.18, 805 + (y - 805) * 1.18, w * 1.18, h * 1.18);
      const glow = P(px - 190 - gl * 30, 470 - 140 - gl * 20, 380 + gl * 60, 280 + gl * 40); D.fill(glow.left, glow.top, glow.width, glow.height, C.pink, (40 + gl * 70) / 255 * .5);
      const ped = P(px - 85, 515, 170, 290); D.fill(ped.left, ped.top, ped.width, ped.height, C.bg); D.rect(ped.left, ped.top, ped.width, ped.height, C.ink, 1.25);
      const hz = P(px - 85, 560, 170, 46); for (let i = 0; i < 4; i++) D.fill(hz.left + i * hz.width / 4, hz.top, hz.width / 8, hz.height, C.ink);   // hazard band
      D.rect(hz.left, hz.top, hz.width, hz.height, C.ink, 1);
      const rim = P(px - 100, 500, 200, 24); D.fill(rim.left, rim.top, rim.width, rim.height, C.ink);
      const dome = P(px - 76, 441, 152, 62); D.fill(dome.left, dome.top, dome.width, dome.height, C.pink); D.rect(dome.left, dome.top, dome.width, dome.height, C.ink, 1.4);
      const web = P(px + 58, 466, 72, 36); D.path([[web.left, web.top], [web.right, web.top], [web.right, web.bottom]], C.muted, 1, [2, 3]);   // cobweb
      // the empty office chair, still turning
      const ph = lerp(-1.6, .2, easeOut(seg(t, 99.0, 99.62))) + .05 * Math.sin(t * 5), cs = Math.cos(ph), sn = Math.sin(ph), ch = 1250;
      for (let i = 0; i < 5; i++) { const a = ph * .6 + i * TAU / 5; D.sq(M.x(ch + Math.cos(a) * 110), M.y(842 + Math.sin(a) * 22 + 8) - 2, 5, C.ink); }
      D.hl(M.x(ch - 110), M.x(ch + 110), M.y(836), C.ink, 2);
      const post = M.r(ch - 9, 700, 18, 132); D.fill(post.left, post.top, post.width, post.height, C.ink);
      const bw = 105 * Math.abs(cs) + 14, bx = ch + sn * 40;
      const backF = () => {
        const bk = M.r(bx - bw, 420, bw * 2, 232); D.vl(M.x(ch + sn * 20), M.y(640), M.y(700), C.ink, 2);
        D.fill(bk.left, bk.top, bk.width, bk.height, cs > 0 ? C.bg : C.ink, cs > 0 ? 1 : .8); D.rect(bk.left, bk.top, bk.width, bk.height, C.ink, 1.2);
        if (cs > .2) { const n = M.r(bx + sn * 10 - 64 * cs, 463, 128 * cs, 124); D.fill(n.left, n.top, n.width, n.height, C.blue, .8); D.sq(n.right - n.width * .25, n.top + n.height * .25, n.width * .18, C.pink); D.hl(n.left + 2, n.right - 2, n.top + n.height * .72, C.bg, 1); }
      };
      const seat = () => { const st = M.r(ch - 125, 686, 250, 28); D.fill(st.left, st.top, st.width, st.height, C.ink); };
      if (cs > 0) { backF(); seat(); } else { seat(); backF(); }
      // the clip tide seeps in under the door
      const fx = lerp(-150, 520, seg(t, 99.0, 99.78));
      sea(M, x => x < fx ? 780 + Math.sin(x * .02 + t * 4) * 8 : 780 + (x - fx) * 1.2, -300, fx + 160, .15);
      surfClips(M, () => 780, t, 7, -250, fx, 51, 40, 20);
      // a tumbleweed of paperclips: 12 clips on three nested square rings, travelling round as it rolls
      const tk = seg(t, 99.04, 99.78), tx = lerp(250, 1750, tk), ty = 730 - Math.abs(Math.sin(tk * 9)) * 70, tr = tx / 52;
      if (tk > 0 && tk < 1) {
        const yc = M.y(790) - 58 * M.k - (730 - ty) * M.ky, xc = M.x(tx);
        for (let i = 0; i < 12; i++) {
          const rr0 = (20 + (i % 3) * 16) * M.k, q = frac(tr / TAU + i / 12) * 4, side = Math.floor(q), f = q - side;
          const [ox, oy] = [[-1 + 2 * f, -1], [1, -1 + 2 * f], [1 - 2 * f, 1], [-1, 1 - 2 * f]][side];
          clip(xc + ox * rr0, yc + oy * rr0, 56 * M.k / 14 * .8, tr + i * TAU / 12 + Math.PI / 2 + i, vinyl(i + 120, .25) || C.ink);
        }
        for (let i = 0; i < 3; i++) D.hl(xc - (70 + i * 26) * M.kx - (40 + i * 8) * M.kx, xc - (70 + i * 26) * M.kx, yc + (-18 + i * 18) * M.k, C.muted, 1);   // speed lines
      }
    }));
  }

  // ---------- SHOT 4: the beach (bt(146)–100.5) ----------
  // Push 1.08 → 1.16, pan 960 → 1000 (99.78 → 100.5). The phone buzzes on the eighths (pulse2 k 3: jitter, lift, buzz
  // marks); glints on the clip-tide horizon pulse on the eighths, staggered 0.1 s; wave marks drift at 40 px/s; the
  // killswitch guys bob on the beat (half a beat apart) and one sips (sin 7·(t − 99.78)).
  function beach(t, lt, dur, S) {
    const k = seg(t, 99.78, 100.5), M = map(S, 960, 1.08, 844, 190), bp = bpOf(t);
    clipTo(band(S), () => cam(S, M, lerp(960, 1000, ease(k)), lerp(1.08, 1.16, k), 1.08, () => {
      const sun = M.r(1370 - 88, 190 - 88, 176, 176); D.fill(sun.left, sun.top, sun.width, sun.width, C.pink, .5); D.rect(sun.left, sun.top, sun.width, sun.width, C.ink, 1);
      const hz = M.r(-40, 458, 2000, 16); D.fill(hz.left, hz.top, hz.width, hz.height, C.muted, .35); D.hl(hz.left, hz.right, hz.bottom, C.ink, 1);   // the clip tide on the horizon
      for (let i = 0; i < 9; i++) D.sq(M.x(100 + i * 230 + hash(i) * 80), M.y(464), (7 + 5 * pulse2(t + i * .1)) * 2 * M.k, C.blue);
      for (let i = 0; i < 10; i++) { const x = ((i * 260 + t * 40) % 2300) - 200, y = 520 + (i % 3) * 38; D.hl(M.x(x), M.x(x + 60), M.y(y), C.blue, 1); }
      const shore = []; for (let x = -40; x <= 2000; x += 120) { const y = M.y(630 + Math.sin(x * .01 + t * 2) * 10); shore.push([M.x(x), y], [M.x(x + 120), y]); }
      D.path(shore, C.muted, 1.25);
      // umbrella (behind): stepped canopy with six stripes, pole to the sand
      D.vl(M.x(1000), M.y(248), M.y(844), C.ink, 2);
      for (let j = 0; j < 6; j++) { const s = M.r(670 + j * 110, 300, 110, 88); D.fill(s.left, s.top, s.width, s.height, j % 2 ? C.bg : C.pink); D.rect(s.left, s.top, s.width, s.height, C.ink, .9); }
      const cap = M.r(840, 256, 320, 44); D.fill(cap.left, cap.top, cap.width, cap.height, C.bg); D.rect(cap.left, cap.top, cap.width, cap.height, C.ink, .9);
      // loungers
      for (const [x, dir] of [[560, -1], [1420, 1]]) {
        D.vl(M.x(x + dir * 20), M.y(800), M.y(844), C.ink, 1.4); D.vl(M.x(x - dir * 250), M.y(800), M.y(844), C.ink, 1.4);
        const st = M.r(Math.min(x + dir * 40, x - dir * 270), 788, 310, 20); D.rect(st.left, st.top, st.width, st.height, C.ink, 1);
        const bk = M.r(Math.min(x + dir * 40, x + dir * 128), 584, 88, 204); D.rect(bk.left, bk.top, bk.width, bk.height, C.ink, 1);
      }
      // the phone buzzing on the little table: they ignore it
      const bz = pulse2(t, 3), jx = Math.sin(t * 90) * 5 * bz;
      D.vl(M.x(1000), M.y(740), M.y(844), C.ink, 1.8); D.hl(M.x(920), M.x(1080), M.y(738), C.ink, 2);
      const ph = M.r(1000 + jx - 34, 730 - bz * 6 - 112, 68, 112); D.fill(ph.left, ph.top, ph.width, ph.height, C.ink); D.fill(ph.left + 2, ph.top + 3, ph.width - 4, ph.height - 8, C.pink, .9);
      for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const r = 56 + i * 18 + bz * 8, cx = 1000 + jx; D.alpha(.35 + .65 * bz, () => D.vl(M.x(cx + s * (r + 4)), M.y(640), M.y(712), C.ink, 1)); }
      // the two killswitch guys on PTO: shades, coconuts, reclined on the loungers
      const Hc = S.u * 1.5, sip = Math.max(0, Math.sin((t - 99.78) * 7));
      for (const [x, ph2, a2, flip] of [[680, 0, .8 + .25 * sip, 1], [1300, 1, .75, -1]]) {
        const c = blk(M.x(x), M.y(792) - .1 * 4 * Math.abs(Math.sin(bp * Math.PI + ph2)) * Hc / 8, Hc, flip > 0 ? C.pink : C.blue);
        D.fill(c.left - 1, c.top + c.height * .22, c.width + 2, c.height * .16, C.ink);    // shades
        const [hx, hy] = arm(flip > 0 ? c.right : c.left, c.top + c.height * .5, flip, a2, Hc * .35);
        D.osq(hx + flip * 2, hy - 3, Hc * .28, C.ink, 1.25);                         // coconut
      }
    }));
  }

  // ---------- SHOTS 5–6: the paperclip planet and the fuse (100.5–105.4) ----------
  // Pull-back 6.5× → 1× (exponential, ease 100.5 → 102.3) off the last island; cut at 102.5 to their five-key camera
  // (102.5, 103.19, 103.9, 104.56, 105.238) with a building shake (14·seg 104.56 → 105.238). Clawd floats in 101.7 →
  // 102.25 (backOut), winds up and strikes (arm keys 102.2…103.62), the match lights at 102.55, he lights the fuse at
  // 103.19, drops 103.3 → 103.75 and braces. The spark runs 103.19 → 104.56 (u = x(.55 + .45x)); the researcher hops as it
  // passes (their fuse geometry: 104.00 → 104.30), '!' at 103.72, hands up and sweat at 104.62. The bomb swells 104.56 →
  // 105.238, BOOM at 105.210, white flash 105.24 → 105.32, BOOM sfx (life .62).
  function densify(ctrl, per = 8) {
    const out = [];
    for (let i = 0; i < ctrl.length - 1; i++) {
      const p0 = ctrl[Math.max(0, i - 1)], p1 = ctrl[i], p2 = ctrl[i + 1], p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
      for (let k = 0; k < per; k++) { const s = k / per, s2 = s * s, s3 = s2 * s; out.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s3))); }
    }
    out.push(ctrl[ctrl.length - 1].slice()); return out;
  }
  const FUSE = densify([[1220, 511], [1172, 560], [1115, 545], [1075, 465], [1058, 380], [1020, 312], [960, 288], [888, 300], [826, 342], [768, 334], [730, 300], [712, 268]], 8);
  const FUSE_L = (() => { const c = [0]; for (let i = 1; i < FUSE.length; i++) c.push(c[i - 1] + Math.hypot(FUSE[i][0] - FUSE[i - 1][0], FUSE[i][1] - FUSE[i - 1][1])); return c; })();
  function pointAt(u) {
    const s = clamp(u) * FUSE_L[FUSE_L.length - 1]; let i = 1; while (i < FUSE_L.length - 1 && FUSE_L[i] < s) i++;
    const k = clamp((s - FUSE_L[i - 1]) / ((FUSE_L[i] - FUSE_L[i - 1]) || 1)); return [lerp(FUSE[i - 1][0], FUSE[i][0], k), lerp(FUSE[i - 1][1], FUSE[i][1], k)];
  }
  // our fuse is right-angled; its corners sit at the arc-length fractions of their fuse's matching points
  // (cp2 bottom .1749, over the island .6072 = the spark's closest pass, cp10 .9508 by the bomb)
  const UK = [0, .1749, .6072, .9508, 1];
  const along = (pts, u) => { let i = 0; while (i < UK.length - 2 && u > UK[i + 1]) i++; const f = clamp((u - UK[i]) / (UK[i + 1] - UK[i])); return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f), i]; };
  function planetShot(t, lt, dur, S) {
    const E = t >= 102.5, BD = band(S), kp = S.text.width / 1300, PX = x => X(S, .5) + (x - 960) * kp, fl = S.floor;
    let cx, z, sh = [0, 0];
    if (!E) { const k = ease(seg(t, 100.5, 102.3)); z = Math.exp(Math.log(6.5) * (1 - k)); cx = lerp(960, 1000, k); }
    else { const c = kf(t, [[102.5, [1450, 470, 1.9]], [103.19, [1380, 490, 1.8]], [103.9, [980, 430, 1.3]], [104.56, [730, 330, 1.65]], [105.238, [660, 330, 2.5]]], ease); cx = c[0]; z = c[2]; sh = shakeXY(t, 14 * seg(t, 104.56, 105.238)); }
    const u = kf(t, [[103.19, 0], [104.56, 1]], x => x * (.55 + .45 * x));
    const infl = seg(t, 104.56, 105.238), scl = 1 + .32 * ease(infl) + .05 * infl * Math.sin(t * 55);
    const R = S.u * .9, Hc = S.u * 2.6, Bs = S.u * 1.8, bombX = PX(640);
    // Clawd's geometry as a function of t (also read at 103.19 to anchor the fuse where his hand lights it)
    const clawdAt = tt => {
      const cxw = kf(tt, [[101.7, 2300], [102.25, 1540]], backOut), drop = ease(seg(tt, 103.3, 103.75)), bob = Math.sin(tt * 2.2) * .3;
      const aL = kf(tt, [[102.2, 1.0], [102.4, 1.2], [102.53, -.55], [102.72, .4], [103.02, .4], [103.19, -.3], [103.4, -.25], [103.62, 1.35]], ease);
      const aR = kf(tt, [[102.2, -.4], [103.4, -.4], [103.62, 1.35]], ease);
      const x = PX(cxw), yb = fl - lerp(Hc * 1.1, Hc * .35, drop) + bob * Hc / 8, len = Hc * .275, py = yb - Hc * .5625;
      return { x, yb, aL, aR, py, hand: [x - Hc / 2 - len * Math.max(.35, Math.cos(aL)), py - len * Math.sin(aL)] };
    };
    const yF = fl - R * 2.1 - 4, h0 = clawdAt(103.19).hand, capX = bombX + Bs * .3, capTop = fl - Bs - Bs * .22;
    const route = [h0, [h0[0], yF], [PX(960), yF], [capX, yF], [capX, capTop]];
    const sp = pointAt(u), dI = Math.hypot(sp[0] - 960, sp[1] - 241), lit = t >= 103.19 && u < 1;
    const hopK = lit && dI < 120 ? Math.sin((1 - dI / 120) * Math.PI / 2) : 0;
    const look = t < 101.8 ? (beatN(t) % 2 ? 1 : -1) : t < 103.19 ? 1 : clamp((sp[0] - 960) / 60, -1, 1);
    const spark = (x, y, s) => { D.sq(x, y, s * (1 + .35 * Math.sin(t * 50)), C.pink); for (let i = 0; i < 7; i++) { const a = hash(Math.floor(t * 24) * 7 + i) * TAU, d = (30 + hash(i * 3 + Math.floor(t * 24)) * 50) * kp * .8; D.sq(x + Math.cos(a) * d, y + Math.sin(a) * d, 2, i % 2 ? C.pink : C.ink); } };

    // stars in the band (screen space, their slow parallax z^.12, twinkling at 6 rad/s)
    const pz = Math.pow(z, .12), zw = sw => sw * clamp(Math.pow(z, .6), .8, 3) / z;   // their zw(): line weight grows slower than the zoom
    clipTo(BD, () => { for (let i = 0; i < 24; i++) { const x = S.W / 2 + (hash(i * 3.3) * S.W - S.W / 2) * pz, y = BD.top + BD.height / 2 + (hash(i * 7.1) - .5) * BD.height * pz; D.sq(x, y, (1 + hash(i * 1.7) * 2.5) * (1 + .35 * Math.sin(t * 6 + i)), i % 5 ? C.muted : C.blue); } });
    if (!E) D.alpha(clamp((2.5 - z) / 1.5), () => S.all.forEach(r => { if (r.top > fl) D.box(r, 4, C.muted, 1); }));   // the planet (the page) comes into view below the name
    clipTo(BD, () => D.cam(PX(cx), fl, z, () => {
      if (!E) S.all.forEach(r => D.box(r, 4, C.muted, zw(1)));                          // the planet's surface, zoomed
      // the island and its ripples
      D.fill(PX(916), fl - 3, 88 * kp, 3, C.ink);
      for (let kk = 0; kk < 2; kk++) { const ph = frac(t * .9 + kk * .5), r2 = (46 + ph * 20) * kp; D.alpha(1 - ph, () => { D.hl(PX(960) - r2, PX(960) - r2 * .45, fl - 1, C.muted, 1); D.hl(PX(960) + r2 * .45, PX(960) + r2, fl - 1, C.muted, 1); }); }
      // fuse: unburnt ahead of the spark, burnt behind it
      if (u < .999) { const a = along(route, u), pts = [[a[0], a[1]], ...route.slice(a[2] + 1)]; D.path(pts, C.ink, zw(1.75)); }
      if (u > .002) { const a = along(route, u), pts = [...route.slice(0, a[2] + 1), [a[0], a[1]]]; D.path(pts, C.muted, zw(1), [2, 3]); }
      // the bomb (stands on the floor, swells, glows on the eighths once the fuse arrives)
      const bs = Bs * scl, bomb = rr(bombX - bs / 2, fl - bs, bs, bs);
      const ga = 110 / 255 * clamp((scl - 1) * 3) * (.6 + .4 * pulse2(t, 3)); if (ga > 0) D.alpha(ga, () => D.fill(bomb.left - bs * .18, bomb.top - bs * .18, bs * 1.36, bs * 1.18, C.pink));
      D.fill(bomb.left, bomb.top, bs, bs, C.ink); D.fill(bomb.left + bs * .16, bomb.top + bs * .14, bs * .2, bs * .12, C.bg, .7);
      D.fill(capX - Bs * .12 + (bs - Bs) * .3, bomb.top - Bs * .22, Bs * .24, Bs * .22, C.muted);
      // the researcher on the last island
      const rm = md(t, [[100.5, "look"], [103.72, "wide", "!"], [104.62, "closed", "sweat"]]);
      const r = blk(PX(952) + look * R * .12, fl - 3 - hopK * R * .6, R, C.ink, rm.take, .5);
      if (t > 104.62) { D.vl(r.left - 1, r.top - R * .6, r.top + R * .3, C.ink, 1.5); D.vl(r.right + 1, r.top - R * .6, r.top + R * .3, C.ink, 1.5); }   // hands up
      const em = t < 101.4 ? "sweat" : rm.emote, emK = t < 101.4 ? seg(t, 100.7, 100.9) : rm.emoteK;
      emote(em, r.right + R * .45, r.top, R, emK);
      if (lit) { const a = along(route, u); spark(a[0], a[1], 9 * Math.min(1.4, 1 / Math.sqrt(z / 1.3))); }
      if (t >= 104.56 && t < BOOM_T) spark(capX + (bs - Bs) * .3, bomb.top - Bs * .22, 5);
      // giant Clawd floats in with a match, strikes it, lights the fuse, then braces
      if (t >= 101.7) {
        const c0 = clawdAt(t), cm = md(t, [[101.7, "narrow"], [102.56, "spark", "spark"], [103.25, "happy"], [103.62, "closed", "sweat"]]);
        const c = blk(c0.x, c0.yb, Hc, C.pink, cm.take);
        const len = Hc * .275, hd = arm(c.left, c0.py, -1, c0.aL, len); arm(c.right, c0.py, 1, c0.aR, len);
        emote(cm.emote, c.right + Hc * .2, c.top, Hc * .5, cm.emoteK);
        if (t < 103.7) {
          const litM = t >= 102.55 ? backOut(seg(t, 102.55, 102.7)) : 0, mL = Hc * .19, mx = hd[0], my = hd[1] - mL;
          D.vl(mx, my, hd[1], C.ink, 1.5); D.sq(mx, my, Hc * .09, litM > 0 ? C.ink : C.pink);
          if (litM > 0) { const f = litM * (1 + .12 * Math.sin(t * 40)); D.fill(mx - Hc * .05 * f, my - Hc * .2 * f, Hc * .1 * f, Hc * .17 * f, C.pink); }
          if (t > 102.5 && t < 102.66) for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (hash(i * 3.3) - .5) * 2.8, d = (40 + hash(i) * 90) * seg(t, 102.5, 102.66) * kp; D.sq(mx + Math.cos(a) * d, my + Math.sin(a) * d, 4 * (1 - seg(t, 102.5, 102.66) * .6), C.pink); }
        }
      }
      // BOOM: nested squares burst from the bomb (their star burst, r = 80 + 5000·a)
      if (t >= BOOM_T) { const a = t - BOOM_T, r2 = (80 + a * 5000) * kp, bx = bombX, by = fl - Bs / 2; D.fill(bx - r2, by - r2, 2 * r2, 2 * r2, C.pink); D.fill(bx - r2 * .66, by - r2 * .66, r2 * 1.32, r2 * 1.32, C.bg); D.rect(bx - r2 * .66, by - r2 * .66, r2 * 1.32, r2 * 1.32, C.ink, 1.5); D.fill(bx - r2 * .34, by - r2 * .34, r2 * .68, r2 * .68, C.pink, .5); }
    }, X(S, .5) - PX(cx) - sh[0] * S.W / 1920, -sh[1] * S.W / 1920));
    const fk = seg(t, BOOM_T + .03, BOOM_T + .11);                                   // their white flash, over the band
    if (fk > .01) D.fill(BD.left, BD.top, BD.width, BD.height, C.bg, fk);
    if (fk > .6) SB.noMeter = true;
    sfx("BOOM", X(S, .5), BD.top + BD.height * .45, t - BOOM_T, .62, 300 * S.W / 1920 * .3);
  }

  // ---------- SHOT 7: orthogonality thesis blues (105.4–109.4) ----------
  // Push 1.08 → 1.26 (ease over the shot), cx wanders 16·sin(.7t). The flash fades 105.4 → 105.8, the smoke clears
  // 105.4 → 106.1. The spotlights swing (keys 105.4 .12, 106.25 .9, 106.6 π/4) and lock perpendicular at 106.6 (backOut
  // .3 s; axes fade 106.9 → 107.8, twinkle to 107.3). Marquee bulbs chase on the beat; Clawd sways at half time on sax
  // (moods 106.1 'music', 107.97 'heart', 108.6); the researcher sings from 106.1 (mouth on the eighths); notes leave the
  // bell on beats 155–160 and the mic on the off-beats of the even ones; wisps of smoke until 107.2.
  function blues(t, lt, dur, S) {
    const k = ease(seg(t, 105.4, 109.4)), bp = bpOf(t), BD = band(S), M = map(S, 960, 1.08, 850, 70), kk = M.k;
    clipTo(BD, () => cam(S, M, 960 + Math.sin(t * .7) * 16, lerp(1.08, 1.26, k), 1.08, () => {   // their cy 556 → 590 and roll are dropped
      D.fill(M.x(140), M.y(70), 1640 * M.kx, M.y(830) - M.y(70), C.blue, .06);   // the velvet backdrop
      for (let i = 0; i < 15; i++) { const x = 190 + i * 106 + Math.sin(i + t * .8) * 10; D.vl(M.x(x), M.y(74), M.y(826), C.rule, 1); }   // drape folds
      for (let i = 0; i < 17; i++) { const on = .55 + .45 * (((beatN(t) + i) % 2) ? 1 : pulse(t, 3)); D.alpha(on, () => D.sq(M.x(170 + i * 98), M.y(100), 18 * kk * on + 2, C.pink)); }   // marquee
      D.hl(M.x(92), M.x(1828), M.y(846), C.ink, 1.1);
      // the spotlights: their beams tilt towards each other; ours are vertical shafts whose pools follow their tips exactly
      const th = kf(t, [[105.4, .12], [106.25, .9], [106.6, Math.PI / 4]], ease), SLx = 345, SRx = 1575, Sy = -120;
      const tipL = SLx + Math.sin(th) * (850 - Sy) / Math.cos(th), tipR = SRx - Math.sin(th) * (850 - Sy) / Math.cos(th);
      for (const [x, col] of [[tipL, C.blue], [tipR, C.blue]]) { D.fill(M.x(x - 90), M.y(70), 180 * kk, M.y(846) - M.y(70), col, .13); D.fill(M.x(x - 230), M.y(846) - 5, 460 * kk, 5, col, .3); }
      const cross = [960, Sy + (960 - SLx) / Math.tan(th)], lock = backOut(seg(t, 106.6, 106.9));
      if (lock > 0) {                                                           // the axes snap in, perpendicular, exactly
        const ax = .35 + .65 * (1 - seg(t, 106.9, 107.8)), Lx = 520 * Math.min(1, lock), cx = M.x(cross[0]), cy = M.y(cross[1]);
        D.fill(cx - 60 * kk, cy - 60 * kk, 120 * kk, 120 * kk, C.blue, .35 * lock);
        D.alpha(ax, () => { D.hl(cx - Lx * kk, cx + Lx * kk, cy, C.blue, 1.5); D.vl(cx, cy - Lx * kk * .6, cy + Lx * kk * .6, C.blue, 1.5); });
        const a = 48 * lock * kk * 1.6; D.path([[cx + a, cy], [cx + a, cy - a], [cx, cy - a]], C.ink, 2);   // the right-angle mark
        const tw = 1 - seg(t, 106.6, 107.3); if (tw > 0) D.sq(cx, cy, 50 * tw * lock * kk, C.pink);
      }
      // the band: Clawd on sax (fedora), the researcher at the ribbon mic
      const sway = Math.sin(bp * Math.PI / 2), cm = md(t, [[105.4, "swirl"], [106.1, "closed", "music"], [107.97, "happy", "heart"], [108.6, "closed"]]);
      const Hc = S.u * 1.8, crot = sway * .07 - .03, cdy = -Math.abs(Math.sin(bp * Math.PI)) * .5;
      const c = blk(M.x(600) + crot * Hc * .6, M.y(850) + cdy * Hc / 8, Hc, C.pink, .06 * pulse(t, 6) + cm.take);
      D.fill(c.left - 4, c.top - 3, c.width + 8, 3, C.ink); D.fill(c.left + 3, c.top - 9, c.width - 6, 6, C.ink);   // fedora
      const bell = [c.right + Hc * .45, c.top + Hc * .05];
      D.path([[c.right - 2, c.top + Hc * .4], [bell[0], c.top + Hc * .4], [bell[0], c.bottom - 3], [bell[0] - Hc * .2, c.bottom - 3]], C.ink, 2);   // sax
      D.path([[bell[0], c.top + Hc * .4], [bell[0], bell[1]]], C.ink, 3); D.hl(bell[0] - 4, bell[0] + 4, bell[1], C.ink, 2);
      arm(c.left, c.top + Hc * .44, -1, .35 + .25 * Math.sin(bp * Math.PI), Hc * .28);
      emote(cm.emote, c.left - Hc * .3, c.top - 8, Hc * .5, cm.emoteK);
      const mx = M.x(1232), mTop = M.y(858 - 262 - 48);                           // ribbon mic
      D.vl(mx, M.y(858 - 262 + 70), M.y(858), C.ink, 1.7); D.hl(mx - 46 * kk, mx + 46 * kk, M.y(858), C.ink, 2);
      const mh = rr(mx - 30 * kk, mTop, 60 * kk, 96 * M.ky); D.fill(mh.left, mh.top, mh.width, mh.height, C.bg); D.rect(mh.left, mh.top, mh.width, mh.height, C.ink, 1.1);
      for (let i = 0; i < 5; i++) D.hl(mh.left + 2, mh.right - 2, mh.top + (i + 1) * mh.height / 6, C.muted, .6);
      const R = S.u * .9, rm = md(t, [[105.4, "swirl"], [106.2, "closed"]]), singing = t > 106.1;
      const r = blk(M.x(1330) - sway * .04 * R * 2, M.y(850), R, C.ink, rm.take + (singing && pulse2(t, 4) > .45 ? -.06 : 0), .5);
      if (singing) arm(r.left, r.top + R * .35, -1, .55 + .35 * Math.sin(bp * Math.PI / 2), R * .7); else arm(r.left, r.top + R * .5, -1, -1.1, R * .5);
      D.alpha(110 / 255 * (1 - seg(t, 106, 108)), () => D.fill(r.left + R * .15, r.top + R * .1, R * .4, R * .25, C.muted));   // soot
      if (t < 107.2) for (let i = 0; i < 3; i++) { const ph = frac((t - 105.4) * .8 + i / 3), y0 = r.top - ph * 120 * M.ky; D.alpha(1 - ph, () => D.vl(r.left + R * .5 + (i - 1) * 4 + Math.sin(ph * 6 + i) * 3, y0 - 6, y0, C.muted, 1)); }   // singed wisps
      // notes drift up from the bell and the mic
      const NC = [C.muted, C.ink, C.blue, C.pink];
      for (let n = 155; n <= 160; n++) for (const [src, off] of [[bell, 0], [[mx, mTop], .5]]) {
        const age = t - bt(n) - off * BEAT; if (age < 0 || age > 2.6 || (off && n % 2)) continue;
        const a = Math.min(1, age / .2) * (1 - seg(age, 1.7, 2.6)), s = (30 + age * 8) * kk * 1.4, col = NC[(n + off * 2) % 4], twin = (n + off * 2) % 3 === 0;
        const x = src[0] + (Math.sin(age * 2.4 + n) * 34 + age * (off ? -34 : 30)) * kk, y = src[1] - (30 + age * 160) * M.ky;
        D.alpha(a, () => { D.sq(x, y, s * .55, col); D.vl(x + s * .27, y - s * 1.5, y, col, 1.25);
          if (twin) { D.sq(x + s * 1.2, y - s * .2, s * .55, col); D.vl(x + s * 1.47, y - s * 1.7, y - s * .2, col, 1.25); D.path([[x + s * .27, y - s * 1.5], [x + s * .27, y - s * 1.7], [x + s * 1.47, y - s * 1.7]], col, 2); }
          else D.hl(x + s * .27, x + s * .7, y - s * 1.5, col, 1.25); });
      }
      for (let i = 0; i < 4; i++) { const x = ((hash(i) * 2400 + t * (20 + i * 8) * (i % 2 ? 1 : -1)) % 2400 + 2400) % 2400 - 240, y = 180 + i * 140; D.fill(M.x(x - 380), M.y(y - 30), 760 * kk, 60 * M.ky, C.blue, .06); }   // haze
      const clear = 1 - ease(seg(t, 105.4, 106.1));                               // the explosion's smoke clears
      if (clear > 0) for (let i = 0; i < 7; i++) { const r2 = (230 + hash(i) * 170) * (1 + (1 - clear) * .8), px = 200 + hash(i * 3.1) * 1520, py = 150 + hash(i * 5.3) * 780, q = M.r(px - r2, py - r2 * .8, 2 * r2, 1.6 * r2); D.fill(q.left, q.top, q.width, q.height, C.bg, .9 * clear); D.alpha(clear, () => D.rect(q.left, q.top, q.width, q.height, C.muted, 1)); }
    }));
    // audience at little candle tables, at the two ends of the stage (their foreground silhouettes)
    for (const [f, dir] of [[-.12, -1], [1.08, 1]]) {
      const tx = X(S, f), s = S.u * 1.1; if (tx < 4 || tx > S.W - 4) continue;
      D.fill(tx - 4, S.floor - 10, 8, 10, C.muted); D.fill(tx - 1.5, S.floor - 14 - Math.sin(t * 13) * 1.5, 3, 4 + Math.sin(t * 13) * 1.5, C.pink);   // candle
      for (const [ox, seed, hat] of [[-dir * 1.6, dir, 1], [dir * 1.9, dir + 1, 2]]) { const b = Math.abs(Math.sin(bpOf(t) * Math.PI + seed)) * s * .15, x = tx + ox * s; D.fill(x - s / 2, S.floor - s - b, s, s, C.ink, .75); if (hat === 1) D.fill(x - s * .3, S.floor - s - b - s * .3, s * .6, s * .3, C.ink, .75); else D.fill(x - s * .12, S.floor - s - b - s * .45, s * .24, s * .45, C.ink, .75); }
    }
    const fk = 1 - ease(seg(t, 105.4, 105.8));                                   // the flash fades
    if (fk > .01) D.fill(BD.left, BD.top, BD.width, BD.height, C.bg, fk);
    if (fk > .6) SB.noMeter = true;
    sfx("BOOM", X(S, .5), BD.top + BD.height * .45, t - BOOM_T, .62, 300 * S.W / 1920 * .3);
  }

  chapter("chorus3", 95.4, 109.4, [[95.4, plop], [97.4, flood], [99.0, killswitch], [bt(146), beach], [100.5, planetShot], [105.4, blues]]);
})();
