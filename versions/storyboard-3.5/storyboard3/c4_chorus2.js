// c4 · Chorus 2: Bigger Show (59–73). A one-for-one port of the timing of their src/ch/c04_chorus2.js, in our shapes.
// Every time, window, easing, pulse, dance style, mood take, schedule and camera move below is theirs; the audit
// trail (their file:line → ours) is docs/storyboard-timing/c4_chorus2.md.
// Shots (theirs): 59.0 pumps + bubble pop · 60.45 basilisk (BOOM bT(90) 61.57, GPU throws from 62.02 every 0.17 s)
// · bT(92) NVDA to the moon (launch 63.12, moon 63.98, flag bT(94) 64.30) · 64.5 Omega Point (collapse to 65.88,
// flare 65.5–65.98) · 66.0 the GPU odometer (rolls over at bT(100) 68.39, ding bT(102), drop 69.84) · 70.0 the vault
// (SLAM bT(103) 70.44, high-five bT(104) 71.12, orbit 71.3–72.4).
(() => {
  const SB = window.__SB;
  const { D, C, B, bpOf, pulse, seg, ease, easeIn, easeOut, backOut, wob, pumpH, move, mood, shakeXY, lerp, clamp, frac, hash, rr, stand, chapter, meter } = SB;
  const TAU = Math.PI * 2;
  const easeIO = x => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };   // their c04 easeIO
  const B_BOOM = B(90);                                                     // 61.57
  const ctx = () => document.querySelector("canvas[aria-hidden]").getContext("2d");
  const X = (S, f) => S.text.left + S.text.width * f;
  const WX = (S, wx) => X(S, wx / 1920);                                   // their world x (0..1920) across the name
  const bandTop = S => (S.bar ? S.bar.bottom : 0);
  const band = S => rr(0, bandTop(S), S.W, S.floor + 1 - bandTop(S));      // the stage band: nothing is drawn below the name's top
  const clip = (r, fn) => { const c = ctx(); c.save(); c.beginPath(); c.rect(r.left, r.top, r.width, r.height); c.clip(); try { fn(); } finally { c.restore(); } };
  const stageTop = S => (S.strip ? S.strip.top : S.floor - 140);
  // their clawd.js mood() also pops an emote: emoteK = seg(age, .05, .3) · (1 − seg(age, 1.4, 1.7))
  const moodE = (t, keys) => { const m = mood(t, keys), cur = keys.filter(k => t >= k[0]).pop() || keys[0]; return { ...m, em: cur[2], ek: cur[2] ? seg(m.age, 0.05, 0.3) * (1 - seg(m.age, 1.4, 1.7)) : 0 }; };
  // emotes in our shapes (their clawd.js emote(): pop with backOut(k))
  function emote(kind, x, y, s, k) {
    const z = s * backOut(k); if (!kind || z < 1) return;
    if (kind === "!") { D.fill(x - z * 0.12, y - z, z * 0.24, z * 0.62, C.pink); D.fill(x - z * 0.12, y - z * 0.28, z * 0.24, z * 0.24, C.pink); }
    else if (kind === "spark") { D.hl(x - z / 2, x + z / 2, y, C.pink, 2); D.vl(x, y - z / 2, y + z / 2, C.pink, 2); }
    else if (kind === "sweat") D.sq(x, y, z * 0.4, C.blue);
    else if (kind === "heart") D.sq(x, y, z * 0.6, C.pink);
    else if (kind === "music") { D.sq(x - z * 0.2, y + z * 0.3, z * 0.3, C.ink); D.vl(x - z * 0.05, y - z * 0.5, y + z * 0.3, C.ink, 1.5); D.hl(x - z * 0.05, x + z * 0.3, y - z * 0.5, C.ink, 1.5); }
  }
  // their sfx(): pops at age 0 (backOut(age·5)), fades over the last 0.25 s of its life
  function sfx(txt, x, y, size, age, life, col = C.pink) {
    if (age < 0 || age > life) return;
    const k = backOut(age * 5); if (k < 0.05) return;
    D.alpha(1 - seg(age, life - 0.25, life), () => D.text(txt, x, y, col, Math.round(size * k), "center"));
  }
  // their flash(): a full-frame wash; ours whitens the stage band
  const flash = (S, k) => { if (k > 0.01) D.fill(0, bandTop(S), S.W, S.floor + 1 - bandTop(S), C.bg, clamp(k)); };
  // their jetEnv(): the flame shoots up on the beat (0.07 beat), then dies away (exp −3.4 per beat)
  const jetEnv = (t, ph = 0) => { const f = frac(bpOf(t) - ph); return f < 0.07 ? f / 0.07 : Math.exp(-(f - 0.07) * 3.4); };
  function jet(S, x, h, lw, w) { D.fill(x - w / 2, S.floor - 4, w, 4, C.ink); if (h > 2) D.vl(x, S.floor - 4, S.floor - 4 - h, C.pink, lw); }
  // their crowd(): each head bobs on the beat, a little late (pulse(t − hash·0.08, 5)); ours stands on the name
  function crowd(S, t, blast = 0) {
    const n = 12, s = S.u * 0.55;
    for (let i = 0; i < n; i++) { const bob = pulse(t - hash(i + 3) * 0.08, 5); stand(S, X(S, (i + 0.5) / n), s, { outline: true, col: C.muted, dy: bob * s * 0.4, sq: 0.5 * blast }); }
  }
  // a hand pump (their props.js pumpProp): barrel, rod rising with h, handle. topple: 0..1(+) swings it onto its side
  function pump(S, x, s, h, topple = 0) {
    const bw = s * 0.22, bh = s * 0.7;
    if (topple > 0.01) { const w = lerp(bw, bh, topple), hh = lerp(bh, bw, topple); D.rect(x - bw / 2, S.floor - hh, w, hh, C.ink, 1.25); return; }
    D.rect(x - bw / 2, S.floor - bh, bw, bh, C.ink, 1.25);
    const top = S.floor - bh - s * (0.1 + 0.28 * h);
    D.vl(x, S.floor - bh, top, C.muted, 1.5); D.fill(x - s * 0.18, top - 3, s * 0.36, 3, C.ink);
    return top;
  }

  // ===== Shot 1 · 59.0–60.45 · "I'm upping my P(doom)" (their c04:241–268) =================================
  // Low angle: the hero, building-sized, works two pumps (pumpH: the down-stroke lands on each beat). Back jets fire on
  // the beat (outer pair) and the off-beat eighth (inner pair); the big front jets fire on the beat. The camera drifts
  // in (zoom 1.02 → 1.078) and shakes on each beat (9·pulse(5)). The heart-bubble film tears open over the photos.
  function bubblePop(S, lt) {
    const k = lt / 0.36; if (k > 2.4) return;
    const r = S.strip || rr(S.main.left, S.floor - 140, S.main.width, 130);
    const R = k <= 0 ? 0 : 1700 * Math.pow(Math.min(k, 1.2), 1.4);
    const mx = w => r.left + r.width * w / 1920, my = w => r.top + r.height * w / 1080, Px = mx(960), Py = my(470);
    clip(r, () => {
      if (k < 1.12) {
        const hx = R * 0.84 / 1920 * r.width, hy = R * 0.84 * 0.9 / 1080 * r.height;
        const x0 = Px - hx, x1 = Px + hx, y0 = Py - hy, y1 = Py + hy;
        D.fill(r.left, r.top, r.width, Math.max(0, y0 - r.top), C.pink);
        D.fill(r.left, y1, r.width, Math.max(0, r.bottom - y1), C.pink);
        D.fill(r.left, y0, Math.max(0, x0 - r.left), y1 - y0, C.pink);
        D.fill(x1, y0, Math.max(0, r.right - x1), y1 - y0, C.pink);
        if (R >= 18) D.rect(x0, y0, x1 - x0, y1 - y0, C.ink, 1.25);
        if (k < 0.4) D.alpha(1 - k / 0.4, () => D.sq(Px, Py, (40 + 380 * k) / 1920 * r.width, C.bg));   // the puncture flash
      }
      if (k > 0.04 && lt < 0.8) for (let i = 0; i < 40; i++) {                                        // droplets off the rim
        const a = hash(i * 3.7) * TAU, d = R * (0.72 + 0.3 * hash(i + 50)) + lt * 700 * hash(i + 90), rad = (6 + 13 * hash(i + 20)) * (1 - lt / 0.8);
        D.sq(mx(960 + Math.cos(a) * d), my(470 + Math.sin(a) * d * 0.9 + 600 * lt * lt), Math.max(1, rad * 2 / 1920 * r.width), C.pink);
      }
      if (k > 0.1 && lt < 1.0) for (let j = 0; j < 10; j++) {                                           // shreds of film
        const a = (j + hash(j)) / 10 * TAU, d = Math.min(R, 900) * 0.8 + 420 * lt, x = mx(960 + Math.cos(a) * d), y = my(470 + Math.sin(a) * d * 0.8 + 1300 * lt * lt), l = 105 / 1920 * r.width * (1 - lt * 0.5);
        D.hl(x - l / 2, x + l / 2, y, C.pink, 2);
      }
    });
  }
  function shotPump(t, lt, dur, S) {
    const g = S.W / 1920, h = pumpH(t), hit = pulse(t, 5), [sx, sy] = shakeXY(t, 9 * hit * g);
    const jetH = S.floor - stageTop(S), HS = S.u * 3.2, u = HS / 8, hx = X(S, 0.52);
    const zoom = (1.02 + lt * 0.04) / 1.02;
    clip(band(S), () => D.cam(X(S, 0.5), S.floor, zoom, () => {
      [[260, 0], [700, 0.5], [1300, 0.5], [1740, 0]].forEach(([x, ph]) => jet(S, WX(S, x), jetH * (600 / 700) * jetEnv(t, ph), 2, S.u * 0.5));
      for (const side of [-1, 1]) pump(S, hx + side * (HS / 2 + HS * 0.2), HS, h);
      const md = moodE(t, [[59, "happy"], [59.95, "spark", "spark"]]);
      const hero = stand(S, hx, HS, { dy: h * 0.25 * u, sq: (1 - h) * 0.07 + md.take * 0.6 });
      emote(md.em, hero.right + S.u * 0.4, hero.top - S.u * 0.2, S.u * 1.2, md.ek);
      const m = move("hop", t);                                                                        // the tiny researcher at the hero's feet
      stand(S, hx + HS * 0.32, S.u * 0.6, { col: C.ink, dy: -m.dy * S.u * 0.6 / 8, sq: m.sq });
      for (const x of [80, 1845]) jet(S, WX(S, x), jetH * (820 / 700) * jetEnv(t), 3, S.u * 0.8);
    }, lt * 14 * g - sx, -sy));
    crowd(S, t);
    bubblePop(S, lt);
  }

  // ===== Shot 2 · 60.45–62.94 · "I hear the basilisk BOOM" (their c04:330–397) ==============================
  // A rumble builds (shake 2 + 11·rumble², the floor bulges and cracks, the side jets die), the hero stops pumping at
  // 60.95 and looks, gets scared at 61.25; on bT(90) the basilisk bursts up (backOut over 0.32 s), planks fly, dust,
  // everyone is knocked over, the camera kicks (26·e^(−3.2a)) then pushes in (0.3–1.36 s after). The researcher bounces
  // up sitting and throws GPUs every 0.17 s from 62.02; each flies 0.4 s into the basilisk's mouth, which chomps.
  const TP = 0.17, THROW0 = 62.02, FLY = 0.4;
  function basilisk(S, t, a, bx, H0) {
    const rise = backOut(seg(a, 0, 0.32)), throwing = t >= THROW0, roar = a < 0.7;
    const arr0 = THROW0 + 0.45 * TP + FLY, happy = t > arr0;
    const dArr = Math.abs(frac((t - arr0) / TP + 0.5) - 0.5) * TP, chomp = t > arr0 - 0.05 ? clamp(dArr / 0.05) : 1;
    const open = roar ? 0.95 * seg(a, 0.05, 0.2) : throwing ? 0.8 * chomp : 0.2, J = open * 2.4;
    const s = 30, N = 12, L = 15 * s * rise, ph = t * 2.3, sway = 0.8 + 0.6 * seg(a, 0, 1), lean = -0.18 * seg(a, 0.6, 1);
    const vs = H0 * 0.72 / (15 * s), ws = S.u * 0.9 / (3.1 * s);                                      // world px → ours
    const sp = [[0, 0]], an = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N; an.push(sway * 0.42 * Math.sin(u * 4.4 - 1.3 + Math.sin(ph) * 0.45) * (1 - 0.6 * u) + lean * u);
      if (i) { const aa = (an[i - 1] + an[i]) / 2, p = sp[i - 1]; sp.push([p[0] + Math.sin(aa) * L / N, p[1] - Math.cos(aa) * L / N]); }
    }
    const P = ([x, y]) => [bx + x * vs, S.floor + y * vs];
    if (rise > 0.03) for (let i = 0; i < N; i++) {                                                    // the neck: stacked slices on their spine
      const [x0, y0] = P(sp[i]), [x1, y1] = P(sp[i + 1]), w = s * (3.1 - 1.35 * (i + 0.5) / N) * ws;
      D.fill((x0 + x1) / 2 - w, y1, 2 * w, y0 - y1 + 1, C.bg); D.rect((x0 + x1) / 2 - w, y1, 2 * w, y0 - y1 + 1, C.ink, 1.25);   // 3.1: white box, graphite outline
      { const sx0 = (x0 + x1) / 2 - w, sh = y0 - y1 + 1, tk = Math.max(2, w * 0.35);             // 3.5: scales, a tick on alternating sides
        if (sh > 4) { if (i % 2) D.hl(sx0 + 1, sx0 + 1 + tk, y1 + sh / 2, C.ink, 1); else D.hl(sx0 + 2 * w - 1 - tk, sx0 + 2 * w - 1, y1 + sh / 2, C.ink, 1); } }
    }
    const [hx, hy] = P(sp[N]), hw = 4.3 * s * ws, q = y => hy + y * s * vs;
    if (rise > 0.03) {
      if (open > 0.02) {
        D.fill(hx - hw, q(-5.8), 2 * hw, q(-1.2) - q(-5.8), C.bg); D.rect(hx - hw, q(-5.8), 2 * hw, q(-1.2) - q(-5.8), C.ink, 1.5);   // skull
        D.fill(hx - hw * 0.8, q(-1.2), hw * 1.6, q(0.3 + J * 0.86) - q(-1.2), C.pink);                  // the maw
        D.fill(hx - hw * 0.78, q(0.3 + J * 0.86), hw * 1.56, q(1.05 + J) - q(0.3 + J * 0.86) + 1, C.bg); D.rect(hx - hw * 0.78, q(0.3 + J * 0.86), hw * 1.56, q(1.05 + J) - q(0.3 + J * 0.86) + 1, C.ink, 1.5);   // jaw
      } else {
        D.fill(hx - hw, q(-5.8), 2 * hw, q(0.15) - q(-5.8), C.bg); D.rect(hx - hw, q(-5.8), 2 * hw, q(0.15) - q(-5.8), C.ink, 1.5);
        const f = frac(t * 0.9); if (f < 0.2) { const k = Math.sin(f / 0.2 * Math.PI); D.vl(hx, q(0.15), q(-0.3 + 2.2 * k), C.pink, 2); }   // tongue flick
      }
      const cx = hx + 0.45 * s * ws, cy = q(-5.3);                                                     // the crown
      D.fill(cx - 1.8 * s * ws, cy - 3, 3.6 * s * ws, 4, C.pink);
      for (const gx of [-1.85, 0, 1.85]) D.fill(cx + gx * s * ws - 2, cy - 3 - (gx ? 2.0 : 2.45) * s * vs * 0.5, 4, (gx ? 2.0 : 2.45) * s * vs * 0.5, C.pink);
      if (happy) emote("heart", hx + 150 * ws * 2, hy - 170 * vs, S.u, seg(t, THROW0 + 0.7, THROW0 + 0.9));
    }
    return { mx: hx, my: q(0.4 + J * 0.6) };
  }
  function shotBasilisk(t, lt, dur, S) {
    const g = S.W / 1920, a = t - B_BOOM, rumble = seg(t, 60.45, B_BOOM);
    const [sx, sy] = shakeXY(t, (a < 0 ? 2 + 11 * rumble * rumble : 26 * Math.exp(-a * 3.2)) * g);
    const pushIn = a < 0 ? 0 : ease(seg(a, 0.3, 1.36));
    const zoom = 1 + (a < 0 ? 0.03 * rumble : 0.08 * Math.exp(-a * 5) + 0.1 * pushIn);
    const H0 = S.floor - stageTop(S) - 6, bx = WX(S, 900), wsc = S.u * 0.9 / 93;            // world px → ours, from the basilisk's base width
    clip(band(S), () => D.cam(bx, S.floor, zoom, () => {
      if (a < 0) [[300, 0], [1640, 0.5]].forEach(([x, ph]) => jet(S, WX(S, x), H0 * (380 / 700) * jetEnv(t, ph) * (1 - rumble), 2, S.u * 0.5));
      if (a < 0) {                                                                                     // the mound: the floor bulges and cracks
        const k = rumble, hgt = (95 * k * k * (1 + 0.35 * Math.sin(t * 43)) + 6 * k) * wsc, w = (190 + 90 * k) * wsc, pts = [];
        for (let i = 0; i <= 14; i++) { const x = bx - w + i / 14 * 2 * w, y = S.floor - Math.pow(Math.sin(i / 14 * Math.PI), 1.4) * hgt; if (i) pts.push([x, pts[pts.length - 1][1]]); pts.push([x, y]); }
        D.path(pts, C.ink, 1.5);
        for (let i = 0; i < 8; i++) {
          if (k < i / 11) continue;
          const sgn = i % 2 ? 1 : -1, len = (90 + 190 * hash(i)) * clamp(k * 1.5 - i / 11) * wsc, x0 = bx + sgn * 20 * wsc, y0 = S.floor - 2 - (i >> 1);
          D.path([[x0, y0], [x0 + sgn * len * 0.5, y0], [x0 + sgn * len * 0.5, y0 - 2], [x0 + sgn * len, y0 - 2]], C.ink, 1);
        }
        for (let i = 0; i < 4; i++) { const ph = frac(t * 2.6 + hash(i)), px = bx + (hash(i + 4) - 0.5) * w * 1.7; D.alpha((1 - ph) * k * 0.8, () => D.osq(px, S.floor - 10 * wsc - ph * 110 * wsc - hgt * 0.5, (26 + 40 * ph) * wsc, C.muted, 1)); }
      } else D.fill(bx - 214 * wsc, S.floor - 3, 428 * wsc, 4, C.ink);                                // the hole in the stage
      // pump + hero on the right; the pump topples at the BOOM (backOut over a 0.03–0.3)
      const knock = a < 0 ? 0 : backOut(seg(a, 0.03, 0.3));
      const h = t < 60.95 ? pumpH(t) : lerp(pumpH(60.95), 0.6, ease(seg(t, 60.95, 61.2)));
      const HS = S.u * 1.6, u = HS / 8;
      pump(S, WX(S, 1420), HS * 1.4, h, knock);
      const cm = moodE(t, [[60.45, "happy"], [60.95, "look"], [61.25, "scared", "sweat"], [B_BOOM + 0.04, "x"], [B_BOOM + 0.6, "swirl"]]);
      const tremble = a < 0 ? (hash(Math.floor(t * 12) * 7.1) - 0.5) * 2 * 0.15 * rumble : 0;
      const hop2 = a < 0 ? 0 : 0.8 * Math.max(0, Math.sin(seg(a, 0.3, 0.6) * Math.PI));
      const hero = stand(S, WX(S, 1245) + 50 * wsc * knock, HS, { dy: (tremble + hop2) * u, sq: 0.3 * knock + cm.take });
      emote(cm.em, hero.right + S.u * 0.3, hero.top - S.u * 0.2, S.u, cm.ek);
      // the researcher: startled, knocked flat, bounces up sitting and pelts the basilisk with GPUs
      const RX = WX(S, 450), RS = S.u * 0.7, throwing = t >= THROW0, tp = (t - THROW0) / TP, j = Math.floor(tp), ph = frac(tp);
      D.rect(WX(S, 305) - S.u * 0.5, S.floor - S.u * 0.45, S.u, S.u * 0.45, C.ink, 1.25);             // the crate of GPUs
      for (let i = 0; i < 3; i++) D.sq(WX(S, 305) - S.u * 0.3 + i * S.u * 0.3, S.floor - S.u * 0.45 - 3 - (i % 2) * 2, S.u * 0.26, C.blue);
      let rsq = 0;
      if (a >= 0 && a < 0.4) rsq = 0.55 * easeOut(seg(a, 0.06, 0.22));
      else if (a >= 0.4) rsq = lerp(0.55, 0.2, backOut(seg(a, 0.4, 0.56)));
      const r = stand(S, RX, RS, { col: C.ink, sq: rsq });
      if (a < 0 && t > 61) emote("!", r.x + RS * 0.2, r.top - 4, S.u, seg(t, 61, 61.2));
      if (throwing) { if (ph < 0.45) D.sq(r.x + (j % 2 ? -1 : 1) * (r.width / 2 + 3), r.top + r.height * (1 - ph), S.u * 0.3, C.blue); emote("sweat", r.right + 4, r.top - 6, S.u, 1); }
      if (a >= 0) {
        const head = basilisk(S, t, a, bx, H0);
        if (a <= 1.6) for (let i = 0; i < 12; i++) {                                                   // planks
          const vx = (hash(i * 3.3) - 0.5) * 1900, vy = -(900 + 900 * hash(i * 5.1)), px = bx + vx * a * wsc, py = S.floor + (-30 + vy * a + 1900 * a * a) * wsc;
          if (py < S.floor - 2) { const pw = S.u * 1.2 * (1 + a * 1.3 * hash(i * 7.7)); D.rect(px - pw / 2, py - 2, pw, 4, C.ink, 1); }
        }
        if (a <= 1.4) for (let i = 0; i < 6; i++) {                                                    // dust
          const ang = Math.PI + (i + 0.5) / 6 * Math.PI, d = (120 + 260 * easeOut(a / 0.9)) * wsc, rad = (70 + 60 * hash(i)) * (0.6 + easeOut(a / 0.8)) * wsc;
          D.alpha(0.75 * Math.pow(1 - a / 1.4, 1.3), () => D.osq(bx + Math.cos(ang) * d * 1.3, S.floor + Math.sin(ang) * d * 0.35 - (20 + 90 * a) * wsc, rad, C.muted, 1));
        }
        for (let k = Math.max(0, j - 3); k <= j && throwing; k++) {                                   // GPU offerings in flight
          const f = (t - (THROW0 + k * TP + 0.45 * TP)) / FLY; if (f < 0 || f >= 1) continue;
          const x0 = RX + 55 * wsc, y0 = S.floor - 150 * wsc;
          D.sq(lerp(x0, head.mx, f), lerp(y0, head.my, f) - 260 * wsc * 4 * f * (1 - f), S.u * 0.4 * (1.25 - 0.35 * f), C.blue);
        }
      }
    }, -sx, -sy));
    crowd(S, t, a > 0 ? Math.exp(-a * 3) : 0);
    if (a >= 0) { flash(S, 0.45 * (1 - a / 0.1)); sfx("BOOM", WX(S, 1390), stageTop(S) + (S.floor - stageTop(S)) * 0.25, 22, a, 1.1); }
  }

  // ===== Shot 3 · bT(92) 62.94–64.5 · "NVDA to the moon" (their c04:402–502) ===============================
  // The stock line creeps to its dip (62.94–63.12, ease), then rockets off the chart to the moon (63.12–63.98, their
  // easeIO) with the hero crouching (63.0–63.12) then stretching (63.12–63.32) on its tip. The moon wobbles on the hit;
  // the hero backflips off (64.00–64.25), lands (squash e^(−9·)), and the flag drops in (64.18–64.30, easeIn) on
  // bT(94) with a burst. Camera: follow (63.14–63.42) zooms 1 → 0.8, endK (63.86–64.22) → 0.95, out (64.32–64.5) → 0.52.
  const MOON = [4200, -2600], MR = 460;
  const STOCK = (() => {                                                                             // their STOCK, verbatim
    const P = [[150, 800], [240, 780], [310, 815], [390, 770], [470, 795], [550, 745], [630, 775], [710, 720], [790, 752], [870, 700], [950, 730], [1010, 748],
      [1070, 690], [1150, 540], [1260, 380], [1400, 170], [1560, -20], [1700, -170], [1950, -420], [2150, -700], [2400, -930], [2650, -1260], [2900, -1500],
      [3150, -1830], [3400, -2060], [3620, -2330], [MOON[0] - MR * 0.94, MOON[1] + MR * 0.34]];
    const pts = [], per = 8;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < per; k++) { const s = k / per, s2 = s * s, s3 = s2 * s, f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3); pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); }
    }
    pts.push(P[P.length - 1]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { P, pts, cum, len: cum[cum.length - 1], dip: cum[11 * per], at: i => cum[Math.min(i * per, cum.length - 1)] };
  })();
  function atL(L) {                                                                                  // their atL (world)
    const { pts, cum } = STOCK; L = clamp(L, 0, STOCK.len);
    let i = 1; while (i < cum.length - 1 && cum[i] < L) i++;
    const f = (L - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]), a = pts[i - 1], b = pts[i];
    return [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
  }
  // ours: the same control points as a stair (across, then up), reached at the same arc length as theirs
  function stairs(S, moon) {
    const P = STOCK.P, n = P.length, x0 = S.text.left, y0 = S.floor - 8, x1 = moon.left, y1 = moon.top + moon.height * 0.67;
    const pts = P.map(([x, y], i) => [lerp(x0, x1, (x - P[0][0]) / (P[n - 1][0] - P[0][0])), i <= 11 ? y0 + (y - 800) * 0.12 : lerp(y0, y1, (y - 690) / (P[n - 1][1] - 690))]);
    return pts;
  }
  function stairAt(pts, L) {                                                                        // our point at their arc length L
    L = clamp(L, 0, STOCK.len); let i = 0; while (i < pts.length - 2 && STOCK.at(i + 1) < L) i++;
    const f = clamp((L - STOCK.at(i)) / Math.max(1e-6, STOCK.at(i + 1) - STOCK.at(i))), [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const w = Math.abs(bx - ax), hh = Math.abs(by - ay), d = f * (w + hh);
    return { i, p: d <= w ? [lerp(ax, bx, d / Math.max(w, 1e-6)), ay] : [bx, lerp(ay, by, (d - w) / Math.max(hh, 1e-6))] };
  }
  function stairPath(pts, L0, L1) {
    const a = stairAt(pts, L0), b = stairAt(pts, L1), out = [a.p];
    for (let i = a.i + 1; i <= b.i; i++) { out.push([pts[i][0], pts[i - 1][1]], pts[i]); }
    const last = out[out.length - 1], [bx, by] = b.p, prev = pts[b.i];
    if (b.i >= a.i && (bx !== last[0] || by !== last[1])) { if (by !== prev[1] && last[1] === prev[1]) out.push([bx, prev[1]]); out.push([bx, by]); }
    return out;
  }
  function shotMoon(t, lt, dur, S) {
    const tL = 63.12, tH = 63.98, T_FLAG = B(94);
    const L = t < tL ? lerp(STOCK.dip - 40, STOCK.dip, ease(seg(t, 62.94, tL))) : lerp(STOCK.dip, STOCK.len, easeIO(seg(t, tL, tH)));
    const tipW = atL(L), follow = ease(seg(t, tL + 0.02, tL + 0.3)), endK = ease(seg(t, tH - 0.12, 64.22)), out = ease(seg(t, 64.32, 64.5));
    let wcy = lerp(540, tipW[1] - 60, follow); wcy = lerp(wcy, MOON[1] - 230, endK); wcy = lerp(wcy, MOON[1] - 120, out);   // their camera y (for what's in view)
    const zoom = lerp(lerp(lerp(1, 0.8, follow), 0.95, endK), 0.52, out);
    const mw = S.u * 3.4, mh = S.u * 2, moon = rr(Math.min(S.right - 24, S.text.right + S.u * 3) - mw, bandTop(S) + 14 + S.u * 3.4, mw, mh), q = mw / 2 / MR;
    const pts = stairs(S, moon), tip = stairAt(pts, L).p, fwd = t >= tL && t < tH;
    let ccx = lerp(X(S, 0.5), tip[0], follow), ccy = lerp(S.floor - 40, tip[1], follow);
    ccx = lerp(ccx, moon.left + mw / 2, endK); ccy = lerp(ccy, moon.bottom, endK);
    clip(band(S), () => D.cam(ccx, ccy, zoom, () => {
      if (wcy > -900) { const a = pts[0], b = pts[11]; D.rect(a[0] - 6, b[1] - S.u * 1.6, b[0] - a[0] + S.u * 2, S.u * 2.2, C.muted, 1); }   // the chart the line escapes from
      if (fwd && follow > 0.5) D.alpha(0.35, () => D.path(stairPath(pts, Math.max(STOCK.dip + 300, L - 900), L - 80), C.blue, 5));   // the glow
      D.path(stairPath(pts, Math.max(0, L - 4200), L), C.blue, 2);
      D.sq(tip[0], tip[1], S.u * 0.5, C.blue);                                                      // the arrowhead
      if (fwd && follow > 0.2) for (let i = 0; i < 9; i++) {                                          // speed streaks
        const o = (hash(i) - 0.5) * 700 * q * 3, bk = (200 + 500 * frac(hash(i + 9) + t * 3)) * q * 2;
        D.vl(tip[0] + o, tip[1] + bk, tip[1] + bk + 260 * q * 2, C.muted, 1);
      }
      if (wcy < -1500) {                                                                            // the moon, with the arrow in its side
        const hitA = t - tH, wb = hitA > 0 ? Math.sin(hitA * 40) * 16 * Math.exp(-hitA * 6) * q : 0;
        D.rect(moon.left + wb, moon.top, mw, mh, C.ink, 1.5);
        if (hitA > 0 && hitA < 0.5) for (let i = 0; i < 6; i++) { const an = Math.PI * 0.75 + i * 0.22, r0 = (30 + 160 * easeOut(hitA / 0.3)) * q; D.sq(pts[pts.length - 1][0] + Math.cos(an) * r0, pts[pts.length - 1][1] + Math.sin(an) * r0, 22 * (1 - hitA / 0.5) * q * 2, C.pink); }
        const fk = (t - (T_FLAG - 0.12)) / 0.12 * 0.34;                                             // the flag drops in
        if (fk > 0) {
          const drop = (1 - easeIn(clamp(fk * 3))) * -260 * q, fx = moon.left + mw / 2 + 110 * q, fy = moon.top + drop, wv = Math.sin(t * 9) * 8 * q;
          D.vl(fx, fy, fy - 190 * q, C.ink, 1.5); D.fill(fx, fy - 188 * q, 120 * q, 70 * q + wv, C.pink);
        }
        if (t > T_FLAG) { const fa = t - T_FLAG; for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + (i - 2) * 0.5, r0 = (40 + 140 * easeOut(fa / 0.3)) * q; D.sq(moon.left + mw / 2 + 110 * q + Math.cos(an) * r0, moon.top + Math.sin(an) * r0 * 0.6 - 30 * q, 26 * (1 - clamp(fa / 0.3)) * q * 2, i % 2 ? C.blue : C.pink); } }
      }
      // the hero: rides the tip, then backflips off onto the moon (their rot −τ·ease(jump) → a horizontal flip)
      const HS = S.u * 1.3, jump = seg(t, tH + 0.02, T_FLAG - 0.05);
      let x, y, sq, sx = 1;
      if (jump <= 0) {
        [x, y] = stairAt(pts, L - 58).p;
        sq = (t < tL ? 0.2 * seg(t, 63.0, tL) : 0) + (t >= tL ? -0.16 * (1 - seg(t, tL, tL + 0.2)) : 0);
      } else {
        const p = stairAt(pts, STOCK.len - 58).p, k = easeOut(jump), land = t > T_FLAG - 0.05;
        x = lerp(p[0], moon.left + mw / 2 - 20 * q, k); y = lerp(p[1], moon.top, k) - 330 / 200 * HS * Math.sin(jump * Math.PI);
        sq = land ? 0.22 * Math.exp(-(t - T_FLAG + 0.05) * 9) : -0.1; if (!land) sx = Math.cos(TAU * ease(jump));
      }
      const w = HS * (1 + sq) * Math.max(0.12, Math.abs(sx)), hh = HS * (1 - sq);
      D.fill(x - w / 2, y - hh, w, hh, C.pink);
    }));
  }

  // ===== Shot 4 · 64.5–66.0 · "The Omega Point's coming soon" (their c04:518–550) ============================
  // Everything collapses into one point: galaxies fall in on f = 1 − easeIn(k)^0.8, k = seg(64.5, 65.88), stretching
  // as they go; stars stream inward; the point grows (26 + 50k) and pulses on the beat; the camera pushes 1 → 1.12
  // (ease). The flare (easeIn 65.5–65.98) blows the point up and whites out. The hero floats (wob 0.7 Hz), awed at 65.25.
  function shotOmega(t, lt, dur, S) {
    const k = seg(t, 64.5, 65.88), flare = easeIn(seg(t, 65.5, 65.98)), f = 1 - Math.pow(easeIn(k), 0.8);
    const r = S.strip || rr(S.main.left, S.floor - 140, S.main.width, 120), sc = r.width / 1920;
    const cx = r.left + r.width / 2, cy = r.top + r.height * (380 / 1080 + 0.15);
    const bb = band(S);
    // page elements below the name collapse in place (a box around the element, never swept through the text)
    S.all.forEach((e, i) => { if (e.top < S.floor + 2 || f < 0.05) return; const w = e.width * (0.5 + 0.5 * f), hh = e.height * (0.6 + 0.4 * f); D.box(rr(e.left + (e.width - w) / 2, e.top + (e.height - hh) / 2, w, hh), 4, i % 2 ? C.blue : C.ink, 1); });
    clip(bb, () => D.cam(cx, cy, 1 + 0.12 * ease(k), () => {
      // the photos and the name fall into the point, stretching sideways as they near it (their galaxies)
      [...(S.photos || []), S.text].forEach((e, i) => {
        if (f < 0.05) return;
        const ex = e.left + e.width / 2, ey = e.top + e.height / 2, x = lerp(cx, ex, f), y = lerp(cy, ey, f);
        const w = e.width * (0.5 + 0.5 * f) * (1 + 2.2 * (1 - f)) * (0.3 + 0.7 * f), hh = e.height * (0.5 + 0.5 * f) * (0.6 + 0.4 * f);
        D.box(rr(x - w / 2, y - hh / 2, w, hh), 3, i % 2 ? C.blue : C.ink, 1.25);
      });
      for (let j = 0; j < 44; j++) {                                                                // stars streaming in
        const p = frac(hash(j) + (t - 64.5) * 0.5 * (1 + hash(j + 1))), rad = 1250 * Math.pow(1 - p, 1.3) * sc, an = hash(j + 2) * TAU + p * 3 + t * 0.9;
        D.sq(cx + Math.cos(an) * rad, cy + Math.sin(an) * rad * 0.8, 2, j % 4 ? C.muted : C.pink);
      }
      const gr = (26 + 50 * k + 10 * pulse(t, 4)) * sc * 1.6;
      [[4, 0.12], [2.6, 0.18], [1.7, 0.28]].forEach(([m, op]) => D.alpha(op, () => D.sq(cx, cy, 2 * gr * m, C.pink)));
      D.sq(cx, cy, 2 * (gr + 900 * flare * flare * sc * 1.6), C.pink);
      const md = moodE(t, [[64.5, "happy"], [65.25, "spark", "spark"]]);
      const hero = stand(S, X(S, 0.5), S.u * 1.6, { dy: S.u * 0.6 + 20 * (S.W / 1920) * wob(t, 0.7), sq: md.take });
      emote(md.em, hero.right + S.u * 0.4, hero.top - S.u * 0.2, S.u, md.ek);
    }));
    flash(S, Math.pow(flare, 1.6) * 1.05);
  }

  // ===== Shot 5 · 66.0–70.0 · "One E thirty flops a second" (their c04:556–681) =============================
  // The camera pulls back off a fan (zoom 3.4 → 1, easeOut 66.0–67.0) out of the Omega flash (66.0–66.3). The
  // odometer's seven wheels count up 10^(7·seg(66.6, bT(100))^1.6) − 1, blurring when a wheel turns faster than 14/s;
  // the card hums (shake 5·hum², hum = seg(67.2, bT(100))). On bT(100) every wheel rolls 9 → 0 in 0.12 s, the carried
  // "1" pops out and tumbles away, the hatch flips open and 52 zeros pour out (every 0.028 s from +0.08) and bounce.
  // The hero hops, then bounces after the roll; the meter dings on bT(102). The camera drops away 69.84–70.0 (easeIn).
  const ROLL = B(100);
  const odoTotal = t => (t >= ROLL ? 1e7 : Math.pow(10, 7 * Math.pow(seg(t, 66.6, ROLL), 1.6)) - 1);
  const fanSpin = t => 1.2 * (t - 66) + 7 * Math.pow(clamp(t - 66.8, 0, 1.6), 2) + (t > 68.4 ? 18 * (t - 68.4) : 0);
  const surfL = z => lerp(470, 280, z), surfR = z => lerp(1450, 1640, z);
  function gumball(i, t) {                                                                           // their deterministic bounce, verbatim
    const ts = ROLL + 0.08 + i * 0.028; if (t < ts) return null;
    let x = 1290, z = 0.04, h = 120, vx = -520 + 1100 * hash(i * 1.7), vz = 0.25 + 0.6 * hash(i * 2.9), vh = 120 + 330 * hash(i * 4.3);
    const dt = 1 / 60, n = Math.floor((t - ts) / dt);
    for (let s = 0; s < n; s++) {
      x += vx * dt; z += vz * dt; vh -= 1500 * dt; h += vh * dt;
      if (z <= 1 && x > surfL(z) && x < surfR(z) && h < 0 && vh < 0) { h = 0; vh = -vh * 0.62; vx *= 0.9; }
    }
    return [x, h, 24 + 16 * hash(i * 6.1), Math.min(z, 1.05)];
  }
  function shotGPU(t, lt, dur, S) {
    const g = S.W / 1920, reveal = easeOut(seg(t, 66.0, 67.0)), zoom = lerp(3.4, 1, reveal);
    const hum = seg(t, 67.2, ROLL), rolled = t - ROLL, drop = easeIn(seg(t, 69.84, 70.0));
    const [sx, sy] = shakeXY(t, (5 * hum * hum + (rolled > 0 ? 18 * Math.exp(-rolled * 4) : 0)) * g);
    const sc = (WX(S, 1640) - WX(S, 280)) / 1360, cardH = S.u * 1.1, cardTop = S.floor - cardH;
    const fans = [WX(S, 740), WX(S, 1180)];
    const bb = band(S);
    clip(bb, () => D.cam(fans[0], cardTop + cardH / 2, zoom, () => {
      D.rect(WX(S, 280), cardTop, WX(S, 1640) - WX(S, 280), cardH, C.ink, 1.5);                       // the card
      fans.forEach((fx, j) => {                                                                     // the fans: a blade flips a quarter turn at a time
        const fs = cardH * 0.7, sp = fanSpin(t) * (j ? -1 : 1), qn = ((Math.floor(sp / (Math.PI / 2)) % 4) + 4) % 4, fy = cardTop + cardH / 2;
        D.osq(fx, fy, fs, C.ink, 1);
        if (qn % 2) D.vl(fx, fy - fs * 0.4, fy + fs * 0.4, C.blue, 1.5); else D.hl(fx - fs * 0.4, fx + fs * 0.4, fy, C.blue, 1.5);
        D.sq(fx + (qn === 1 || qn === 2 ? 1 : -1) * fs * 0.3, fy + (qn >= 2 ? 1 : -1) * fs * 0.3, 2, C.pink);
      });
      if (hum > 0) for (let i = 0; i < 7; i++) { const x = WX(S, 420 + i * 170), ph = frac(t * 1.6 + hash(i)), y = cardTop - 4 - ph * 150 * sc; D.alpha(hum, () => D.vl(x, y, y - 60 * sc, C.muted, 1)); }   // heat haze
      // the odometer: seven wheels on two legs above the card
      const ox0 = WX(S, 640), ox1 = WX(S, 1284), cw = (ox1 - ox0) / 7, ch = Math.min(24, cw * 1.3), oy = Math.max(bandTop(S) + 30, cardTop - ch - S.u * 2.2);
      D.vl(WX(S, 715), oy + ch, cardTop, C.ink, 1.25); D.vl(WX(S, 1205), oy + ch, cardTop, C.ink, 1.25);
      D.fill(ox0 - 3, oy - 3, ox1 - ox0 + 6, ch + 6, C.bg, 0.95); D.rect(ox0 - 3, oy - 3, ox1 - ox0 + 6, ch + 6, C.ink, 1.5);
      const tot = odoTotal(t), tot2 = odoTotal(t + 0.02), fsz = Math.round(ch * 0.62), cell = i => rr(ox0 + i * cw + 1, oy, cw - 2, ch);
      for (let i = 0; i < 7; i++) {
        const c = cell(i), mid = c.left + c.width / 2, base = oy + ch / 2 + fsz * 0.36, div = Math.pow(10, 6 - i), p = tot / div, rate = (tot2 - tot) / div / 0.02, dy = ch * 44 / 96;
        D.rect(c.left, c.top, c.width, c.height, C.muted, 1);
        clip(c, () => {
          if (rolled > 0) { const r = clamp(rolled / 0.12); if (r < 1) D.alpha(1 - r, () => D.text("9", mid, base - r * dy, C.ink, fsz, "center")); D.alpha(r, () => D.text("0", mid, base + (1 - r) * dy, C.pink, fsz, "center")); }
          else if (rate > 14) { for (let gg = 0; gg < 3; gg++) D.alpha(0.3, () => D.text(String(Math.floor(hash(i * 7 + gg + Math.floor(t * 24) * 3) * 10)), mid, base + (gg - 1) * ch * 0.31, C.ink, fsz, "center")); for (let gg = 0; gg < 3; gg++) D.vl(c.left + c.width * (0.2 + gg * 0.3), c.top + 3, c.bottom - 3, C.muted, 0.5); }
          else { const dg = Math.floor(p) % 10, r = frac(p), rr2 = r > 0.8 ? (r - 0.8) / 0.2 : 0; D.alpha(1 - rr2, () => D.text(String(dg), mid, base - rr2 * dy, C.ink, fsz, "center")); if (rr2 > 0) D.alpha(rr2, () => D.text(String((dg + 1) % 10), mid, base + (1 - rr2) * dy, C.ink, fsz, "center")); }
        });
      }
      const hatch = rolled > 0 ? backOut(seg(rolled, 0, 0.15)) : 0, hw = S.u * 0.4, hh = ch + 6;     // the overflow hatch swings open
      D.rect(ox1 + 3, oy - 3 - lerp(0, hw, clamp(hatch)), lerp(hw, hh, hatch), lerp(hh, hw, hatch), C.ink, 1.25);
      if (rolled > 0 && rolled < 1.3) {                                                              // the carried "1" tumbles off into space
        const k = rolled, ox = WX(S, 640 - 780 * k), oyy = oy + (310 - 620 * k + 380 * k * k - 285) * sc, sz = 130 * sc * (1 + 0.25 * Math.exp(-k * 8) * Math.sin(k * 40)) * backOut(seg(k, 0, 0.12));
        if (sz > 2) D.text("1", ox, oyy + sz * 0.35, C.pink, Math.round(sz), "center");
      }
      // the hero on the card: hops, stares at the counter (67.7), shocked at the roll, then bounces in the flood
      const cm = moodE(t, [[66, "happy"], [67.7, "look"], [ROLL, "scared", "!"], [ROLL + 0.5, "happy", "music"], [B(102), "spark", "spark"]]);
      const HS = S.u * 1.3, u = HS / 8, mv = move(t < ROLL ? "hop" : "bounce", t);
      const hx = WX(S, 1470), drawHero = () => { const hr = stand(S, hx, HS, { dy: cardH - mv.dy * u, sq: mv.sq + cm.take }); emote(cm.em, hr.right + S.u * 0.3, hr.top - S.u * 0.3, S.u, cm.ek); };
      let heroDone = false;
      if (rolled > 0.05) {                                                                           // the zeros, far ones first
        const gs = []; for (let i = 0; i < 52; i++) { const gb = gumball(i, t); if (gb) gs.push([...gb, i]); }
        gs.sort((a, b) => a[3] - b[3]);
        const cols = [C.pink, C.blue, C.ink, C.muted];
        for (const [x, h, r, z, i] of gs) {
          if (!heroDone && z > 0.87) { drawHero(); heroDone = true; }
          const y = cardTop - h * sc, s = Math.max(3, r * sc * lerp(0.85, 1.3, clamp(z)) * 0.9);
          if (y - s / 2 < S.floor) D.osq(WX(S, x), y - s / 2, s, cols[i % cols.length], 1.5);
        }
      }
      if (!heroDone) drawHero();
    }, -sx, -sy - drop * 1100 / 1080 * S.H));
    // the meter dings at 61% on bT(102): it pops (1 + 0.12·e^(−7da)) and three rings go out
    const da = t - B(102);
    if (da > 0 && da < 0.7) {
      const mh = Math.max(56, S.name.height + 12), mx = S.right - 5, my = S.name.top + S.name.height / 2;
      SB.noMeter = true; D.cam(mx, my, 1 + 0.12 * Math.exp(-da * 7), () => meter(t, S));
      for (let r = 0; r < 3; r++) { const e = easeOut(clamp((da - r * 0.08) / 0.5)), pad = (60 + 260 * e) * g * 0.12; D.alpha(1 - da / 0.7, () => D.rect(mx - 5 - pad, my - mh / 2 - pad, 10 + 2 * pad, mh + 2 * pad, C.pink, 1.6)); }
    }
    flash(S, Math.pow(1 - seg(t, 66.0, 66.3), 1.5));
    if (drop > 0) clip(bb, () => { for (let i = 0; i < 16; i++) { const x = hash(i) * S.W, y = bandTop(S) + hash(i + 5) * (S.floor - bandTop(S)), l = 260 * drop * g; D.vl(x, y - l, y + l, i % 2 ? C.muted : C.pink, 1.2); } });
  }

  // ===== Shot 6 · 70.0–73.0 · "That was safe enough, we reckoned" (their c04:687–821) =======================
  // The camera arrives from the drop (easeOut 70.0–70.28, streaks). Two hard hats shove the door shut (easeIn
  // 70.08 → bT(103)); SLAM on bT(103): shake 18·e^(−6·), CLANK, the wheel spins 2.4 turns (easeOut 0.05–0.65 s), the
  // seam flares. The crew steps back (0.1–0.6 s after), high-fives on bT(104) (jump −0.2..+0.45 s), then dances (roof,
  // hop) from bT(104)+0.45. The camera orbits 2.55 rad (their easeIO, 71.3–72.4): the vault has no back wall; the
  // monster inside waves (71.7) and is happy (72.35).
  function shotVault(t, lt, dur, S) {
    const SLAM = B(103), HF = B(104), sa = t - SLAM, hf = t - HF, g = S.W / 1920;
    const arrive = easeOut(seg(t, 70.0, 70.28));
    const phi = 2.55 * easeIO(seg(t, 71.3, 72.4));
    const psi = t < SLAM ? 1.25 * (1 - easeIn(seg(t, 70.08, SLAM))) : 0;
    const [sx, sy] = shakeXY(t, (sa > 0 ? 18 * Math.exp(-sa * 6) : 0) * g);
    const c = Math.cos(phi), s = Math.sin(phi), F = 1600, BW = 640, BH = 400, BD = 480, DR = 165, DCY = -205, hx = BW / 2, hd = BD / 2;
    const q6 = S.u * 6 / BW, cx0 = X(S, 0.5);
    const P = (Xw, Zw) => { const xr = Xw * c - Zw * s, zr = Xw * s + Zw * c, f = F / (F + zr); return { x: cx0 + xr * f * q6, z: zr, f }; };
    const bb = band(S), yW = y => S.floor + y * q6;                                                   // world height → ours (Y up is negative)
    clip(bb, () => D.cam(cx0, S.floor, 1, () => {
      const wrap = (x0, span) => ((x0 - phi * 700) % span + span) % span - 300;                        // the skyline slides as we orbit
      for (let i = 0; i < 18; i++) { const x = wrap(i * 190, 3420), hh = (70 + 130 * hash(i * 3.3)) * q6 * 0.8, bw = (120 + 40 * hash(i * 1.9)) * q6 * 0.8; if (x < -200 || x > 1980) continue; D.rect(WX(S, x), S.floor - hh, bw, hh, C.rule, 1); }
      // faces of the box (front, left, right; no back wall), far to near
      const faces = [
        { id: "front", a: [-hx, -hd], b: [hx, -hd], n: [0, -1] },
        { id: "left", a: [-hx, hd], b: [-hx, -hd], n: [-1, 0] },
        { id: "right", a: [hx, -hd], b: [hx, hd], n: [1, 0] },
      ].map(fc => { const A = P(...fc.a), Bp = P(...fc.b); return { ...fc, A, Bp, z: (A.z + Bp.z) / 2, facing: fc.n[0] * s + fc.n[1] * c < 0 }; }).sort((a, b) => b.z - a.z);
      const mon = P(0, 40), monK = mon.f * 0.95;
      let monDone = false;
      const drawMon = () => {
        if (monDone) return; monDone = true; if (c >= 0.2) return;
        const m = mood(t, [[70, 0], [72.35, 1]]), ms = 300 * q6 * monK, mr = stand(S, mon.x, ms, { col: C.pink, sq: m.take });
        D.corners(mr, 4, C.pink, 1.25);
        if (t > 71.7) { const wave = Math.sin(t * 13) * 0.55; D.sq(mon.x + (200 + 60 * wave) * q6 * monK, S.floor - (250 + 90) * q6 * monK, 12 * q6 * monK * 3, C.pink); }
      };
      const crewFirst = c < 0;
      if (crewFirst) drawCrew();
      for (const fc of faces) {
        if (!monDone && fc.z < mon.z) drawMon();
        const x0 = Math.min(fc.A.x, fc.Bp.x), x1 = Math.max(fc.A.x, fc.Bp.x), fh = BH * q6 * (fc.A.f + fc.Bp.f) / 2;
        if (x1 - x0 < 1) continue;
        if (fc.facing) { D.fill(x0, S.floor - fh, x1 - x0, fh, C.bg); D.rect(x0, S.floor - fh, x1 - x0, fh, C.ink, 2); }
        else D.rect(x0, S.floor - fh, x1 - x0, fh, C.muted, 1);
        if (fc.id === "front") drawDoor(fc.facing, x0, x1);
      }
      drawMon();
      if (!crewFirst) drawCrew();

      function drawDoor(facing, fx0, fx1) {
        const dc = P(0, -hd), dw = DR * 2 * q6 * Math.abs(c) * dc.f, dh = DR * 2 * q6 * dc.f, dy0 = yW(DCY - DR);
        if (dw < 1) return;
        const door = rr(dc.x - dw / 2, dy0, dw, dh);
        if (!facing) { D.rect(door.left, door.top, door.width, door.height, C.muted, 1); return; }
        if (psi > 0.01) {                                                                            // open: the glowing doorway, the door swung out
          D.fill(door.left, door.top, door.width, door.height, C.pink, 0.55);
          const hinge = P(-DR, -hd).x, edge = P(-DR + 2 * DR * Math.cos(psi), -hd - 2 * DR * Math.sin(psi)).x;
          D.fill(Math.min(hinge, edge), door.top, Math.abs(edge - hinge), door.height, C.ink);
          return;
        }
        const leak = 0.5 + 0.5 * Math.sin(t * 9);                                                      // shut: glow leaks from the seam
        D.alpha(clamp((90 * leak + (sa < 0.3 ? 120 * (1 - sa / 0.3) : 0)) / 255 * 1.6), () => D.rect(door.left - 3, door.top - 3, door.width + 6, door.height + 6, C.pink, 2));
        D.fill(door.left, door.top, door.width, door.height, C.ink);
        const hub = [door.left + door.width / 2, door.top + door.height / 2], sp = sa > 0 ? 2.4 * TAU * easeOut(seg(sa, 0.05, 0.65)) : 0, arm = door.width * 0.27;
        D.hl(hub[0] - arm, hub[0] + arm, hub[1], C.bg, 1.5); D.vl(hub[0], hub[1] - arm, hub[1] + arm, C.bg, 1.5);
        const qn = ((Math.floor(sp / (Math.PI / 2)) % 4) + 4) % 4, ends = [[1, 0], [0, 1], [-1, 0], [0, -1]][qn];
        D.sq(hub[0] + ends[0] * arm, hub[1] + ends[1] * arm, 4, C.pink); D.sq(hub[0] - ends[0] * arm, hub[1] - ends[1] * arm, 4, C.pink);
        for (const [bx, by] of [[-0.43, -0.43], [0.43, -0.43], [-0.43, 0.43], [0.43, 0.43]]) D.sq(hub[0] + bx * door.width, hub[1] + by * door.height, 2, C.bg);
      }
      function drawCrew() {
        const on = (f, outw) => { const lx = f * 2 * DR, Xw = -DR + lx * Math.cos(psi), Zw = -hd - lx * Math.sin(psi); return [Xw - Math.sin(psi) * outw, Zw - Math.cos(psi) * outw]; };
        const shove = t < SLAM, back = ease(seg(sa, 0.1, 0.6));
        const pA = shove ? on(0.95, 120) : [lerp(on(0.95, 120)[0], -345, back), lerp(on(0.95, 120)[1], -hd - 150, back)];
        const pB = shove ? on(0.45, 120) : [lerp(on(0.45, 120)[0], -110, back), lerp(on(0.45, 120)[1], -hd - 150, back)];
        const pC = [lerp(330, 210, ease(seg(t, 70.0, SLAM + 0.1))), -hd - 120];
        const five = hf > -0.2 && hf < 0.45, jumpK = five ? Math.sin(clamp((hf + 0.2) / 0.65) * Math.PI) : 0;
        const dance = t > HF + 0.45;
        const face = mood(t, [[70, 0], [SLAM + 0.05, 1], [HF, 2]]);
        const crew = [
          { p: pA, o: shove ? { sq: 0 } : dance ? (m => ({ dy: -m.dy, sq: m.sq + face.take }))(move("roof", t)) : { dy: 2.2 * jumpK, sq: face.take } },
          { p: pB, o: shove ? { sq: 0.05 } : dance ? (m => ({ dy: -m.dy, sq: m.sq + face.take }))(move("roof", t, 1)) : { dy: 2.2 * jumpK, sq: face.take } },
          { p: pC, o: dance ? (m => ({ dy: -m.dy, sq: m.sq }))(move("hop", t)) : { sq: 0 } },
        ].map(m => ({ ...m, pr: P(m.p[0], m.p[1]) })).sort((a, b) => b.pr.z - a.pr.z);
        for (const m of crew) {
          const sz = 180 * q6 * m.pr.f, u = sz / 8, hat = stand(S, m.pr.x, sz, { outline: true, col: C.ink, dy: (m.o.dy || 0) * u, sq: m.o.sq || 0 });
          D.fill(hat.left - 2, hat.top - 4, hat.width + 4, 3, C.pink);                                  // hard hats
        }
        if (hf > 0 && hf < 0.5) {                                                                    // the high-five: brackets burst out
          const mid = P((pA[0] + pB[0]) / 2, (pA[1] + pB[1]) / 2 - 10), r = (30 + 140 * easeOut(hf / 0.25)) * (1 - hf / 0.5) * q6;
          D.corners(rr(mid.x - r, yW(-175) - r, 2 * r, 2 * r), 0, C.pink, 1.5, 6);
        }
      }
    }, -sx, -sy + (1 - arrive) * 760 / 1080 * S.H));
    if (sa > 0) sfx("CLANK", X(S, 0.5), stageTop(S) + (S.floor - stageTop(S)) * 0.2, 20, sa, 0.7);
    if (arrive < 1) clip(bb, () => { for (let i = 0; i < 16; i++) { const x = hash(i) * S.W, y = bandTop(S) + hash(i + 5) * (S.floor - bandTop(S)), l = 300 * (1 - arrive) * g; D.vl(x, y - l, y + l, i % 2 ? C.muted : C.pink, 1.2); } });
  }

  chapter("chorus2", 59.0, 73.0, [[59.0, shotPump], [60.45, shotBasilisk], [B(92), shotMoon], [64.5, shotOmega], [66.0, shotGPU], [70.0, shotVault]]);
})();
