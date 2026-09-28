// c8 · Chorus 4: Red Alert (123.5–140.5). A one-for-one timing port of their src/ch/c08_chorus4.js, drawn in our shapes.
// Shot starts are theirs: 123.5 red alert, 126.0 loom, 128.0 masked flashback, 130.0 recursive self-upgrade, 132.0 Ilya's
// door, 135.4 darkness, 137.4 the reveal. Every time constant, seg() window, easing, pulse decay and mood key below is
// theirs; docs/storyboard-timing/c8_chorus4.md lists each one with its line in their file.
// Their camera: the world point they centre lands at the centre of the name; zooms keep their ratios but are anchored on the floor (so nothing is pushed down into the text);
// horizontal pans are scaled to the stage; vertical pans are dropped for the same reason. Rotations become sideways offsets.
(() => {
  const SB = window.__SB;
  const { D, C, B, seg, ease, easeIn, easeOut, backOut, elasticOut, pulse, pulse2, bpOf, clamp, lerp, hash, frac, wob, move, shakeXY, rr, chapter } = SB;
  const TAU = Math.PI * 2;
  const X = (S, f) => S.text.left + S.text.width * f;
  const ctx = () => document.querySelector("canvas[aria-hidden]").getContext("2d");
  const top0 = S => (S.bar ? S.bar.bottom : 0);
  // everything in this chapter stays above the top of the name's letters
  function clipBand(S, fn, y0 = top0(S)) { const c = ctx(); c.save(); c.beginPath(); c.rect(0, y0, S.W, S.floor + 1 - y0); c.clip(); fn(); c.restore(); }
  const bandFill = (S, col, a, y0 = top0(S)) => { if (a > 0.004) D.fill(0, y0, S.W, (col === C.ink ? S.name.top - 12 : S.floor) - y0, col, a); };   // 3.15: dark washes stop above the name's box
  const shk = (S, t, amt) => shakeXY(t, amt).map(v => v * S.W / 1920);
  // a camera like their camBegin: zoom z about (px, py), then slide by (dx, dy). pt() maps a point to the screen.
  const mkCam = (px, py, z, dx = 0, dy = 0) => ({ z, pt: (x, y) => [px + dx + z * (x - px), py + dy + z * (y - py)], run: fn => D.cam(px, py, z, fn, dx, dy), inv: sx => px + (sx - px - dx) / z });

  // their mood() (clawd.js), including the emote timing
  function mood(t, keys) {
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const [t0, , em] = keys[i], age = t - t0; let take = 0;
    if (i > 0 && age < 0.16) take = -0.14 * Math.sin(age / 0.16 * Math.PI);
    if (i > 0 && age >= 0.16 && age < 0.4) take = 0.1 * Math.sin((age - 0.16) / 0.24 * Math.PI) * (1 - (age - 0.16) / 0.24);
    return { take, emote: em, emoteK: em ? seg(age, 0.05, 0.3) * (1 - seg(age, 1.4, 1.7)) : 0 };
  }
  // characters: a square (Clawd) or a tall graphite rect (the Researcher), standing on a floor line
  function body(S, x, s, o = {}) {
    const sq = (o.sq || 0), w = s * (1 + sq) * (o.sx ?? 1), h = s * (1 - sq), fl = o.floor ?? S.floor, y = fl - (o.dy || 0) - h;
    if (o.outline) D.rect(x - w / 2, y, w, h, o.col || C.ink, o.lw || 1.25); else { D.fill(x - w / 2, y, w, h, o.col || C.pink); D.rect0(x - w / 2, y, w, h, C.bg, 1.5); }   // 3.44: a white edge keeps neighbours apart
    return { x, left: x - w / 2, right: x + w / 2, top: y, bottom: y + h, width: w, height: h };
  }
  function person(S, x, s, o = {}) {
    const sq = o.sq || 0, w = s * 0.38 * (1 + sq), h = s * 1.35 * (1 - sq) * (o.sit ? 0.74 : 1), fl = o.floor ?? S.floor, y = fl - (o.dy || 0) - h;
    if (o.outline) D.rect(x - w / 2, y, w, h, o.col || C.ink, 1.25); else D.fill(x - w / 2, y, w, h, o.col || C.ink);
    return { x, left: x - w / 2, right: x + w / 2, top: y, bottom: y + h, width: w, height: h };
  }
  // hands: small squares at the end of each arm; a is their arm angle (0 = out, positive = up)
  function hands(b, aL, aR, col = C.ink) {
    const L = b.width * 0.5, sy = b.top + b.height * 0.45, n = Math.max(3, b.width * 0.12);
    if (aL != null) D.sq(b.left - Math.cos(aL) * L, sy - Math.sin(aL) * L, n, col);
    if (aR != null) D.sq(b.right + Math.cos(aR) * L, sy - Math.sin(aR) * L, n, col);
  }
  function emote(b, m) {
    const k = m.emoteK, kind = m.emote; if (!kind || k <= 0.02) return;
    const x = b.right + 3, y = b.top - 3;
    if (kind === "!" || kind === "!!") for (let j = 0; j < kind.length; j++) { D.fill(x + j * 6, y - 13 * k, 3, 8 * k, C.pink); D.fill(x + j * 6, y - 3 * k, 3, 3 * k, C.pink); }
    else if (kind === "?") D.text("?", x, y, C.pink, Math.max(1, Math.round(14 * k)));
    else if (kind === "sweat") D.fill(x, b.top + 2, 4 * k, 5 * k, C.blue);
    else { const col = kind === "spark" ? C.blue : C.pink; D.sq(b.left - 5, b.top - 5, 4 * k, col); D.sq(b.right + 5, b.top - 7, 3 * k, col); }
  }
  // a right-angled polyline drawn to fraction f of its length; along() is the point at fraction f
  const along = (pts, f) => { const c = ctx(), a = c.globalAlpha; c.globalAlpha = 0; const e = partPath(pts, f, C.ink, 1); c.globalAlpha = a; return e; };
  function partPath(pts, f, col, lw) {
    const segs = []; let tot = 0;
    for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); segs.push(l); tot += l; }
    let left = tot * clamp(f); const out = [pts[0]];
    for (let i = 1; i < pts.length && left > 0; i++) { const k = Math.min(1, left / (segs[i - 1] || 1)); out.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]); left -= segs[i - 1]; }
    if (out.length > 1) D.path(out, col, lw);
    return out[out.length - 1];
  }

  // =====================================================================================================
  // 1 · RED ALERT (123.5–126.0): siren stage. The hero pogos on the pump on every eighth, the meter's glass cracks on
  // beats 181–184, and the Researcher slaps a band-aid on each crack half a beat later.
  // =====================================================================================================
  const CRACKS = [[-10, -300, B(181)], [12, -250, B(182)], [-8, -200, B(183)], [10, -150, B(184)]];   // tube-local x, y, time
  const sirenK = t => 0.5 + 0.5 * Math.cos(bpOf(t) * Math.PI);
  const BEAC = [[330, 0], [1590, Math.PI]];
  function pogo(t) {                                                   // their pogo(): lands, drives it down, springs off
    const f = frac(bpOf(t) * 2);
    if (f < 0.2) { const k = easeOut(f / 0.2); return { h: k, lift: 0, sq: lerp(0.24, -0.12, k) }; }
    if (f < 0.5) { const k = (f - 0.2) / 0.3; return { h: 1, lift: Math.sin(k * Math.PI) * 26, sq: -0.08 * Math.abs(Math.cos(k * Math.PI)) }; }
    const k = easeIn((f - 0.5) / 0.5); return { h: 1 - k, lift: 0, sq: 0.24 * k };
  }
  const meterBox = S => { const h = Math.max(56, S.name.height + 12), w = 10; return { x: S.right - w, y: S.name.top + S.name.height / 2 - h / 2, w, h }; };
  function slapState(t) { for (const [cx, cy, ct] of CRACKS) { const st = ct + 0.3; if (t > st - 0.24 && t < st + 0.22) return { cy, k: Math.sin(Math.PI * clamp((t - (st - 0.24)) / 0.46)) }; } return null; }
  function redAlert(t, lt, dur, S) {
    const k = sirenK(t), y0 = top0(S), m = meterBox(S), s = S.u * 2, qc = s / 280 * 1.5, qL = S.text.width / 1920 * 1.2;
    // siren beams: each sweeps like their beam (angle π/2 + sin(3.3t + ph)·0.95), as a vertical band above the name
    clipBand(S, () => {
      const L = S.floor - y0;
      for (const [bx0, ph] of BEAC) {
        const bx = S.W * bx0 / 1920, cx = bx + Math.tan(Math.sin(t * 3.3 + ph) * 0.95) * L * 0.6, w = 2 * Math.tan(0.15) * L * 0.6;
        D.fill(cx - w / 2, y0, w, L, C.pink, 52 / 255 * 0.5); D.fill(cx - w * 0.2, y0, w * 0.4, L, C.pink, 48 / 255 * 0.5);
      }
    }, y0);
    // the stage, through their camera: zoom 1.05 + .025·pulse(5), shake 3 + 6·pulse(8), a tilt that settles (elasticOut 1.1 s)
    const [sx, sy] = shk(S, t, 3 + 6 * pulse(t, 8)), tilt = 0.11 * (1 - elasticOut(lt / 1.1));
    const px = Math.max(S.text.left + s, m.x - 495 * qL);
    const cam = mkCam(px, S.floor, (1.05 + 0.025 * pulse(t, 5)) / 1.05, sx + tilt * S.W * 0.15, sy);
    let slap = null;
    clipBand(S, () => cam.run(() => {
      const pg = pogo(t), handleY = S.floor - (270 + 150 * pg.h) * qc;
      D.path([[px + 32 * qc, S.floor - 5], [m.x - 2, S.floor - 5]], C.ink, 1.5);                    // the hose to the meter
      D.fill(px - 70 * qc, S.floor - 18 * qc, 140 * qc, 18 * qc, C.ink);                              // pump: base, barrel, rod, handle
      D.rect(px - 32 * qc, S.floor - 240 * qc, 64 * qc, 222 * qc, C.ink, 1.25);
      D.vl(px, handleY, S.floor - 240 * qc, C.ink, 1.5);
      D.fill(px - 60 * qc, handleY, 120 * qc, 26 * qc, C.ink);
      const scareT = B(183) + 0.05, scared = t > scareT;
      const md = mood(t, [[123.5, "spark"], [scareT, "scared", "!"]]);
      const b = body(S, px, s, { floor: handleY, dy: pg.lift * qc, sq: pg.sq + md.take });
      const flail = t * TAU * 2.9; hands(b, 1.0 + 0.5 * Math.sin(flail), 1.0 + 0.5 * Math.sin(flail + 1.7));
      emote(b, md);
      if (scared) for (let i = 0; i < 3; i++) {                                                       // sweat flies off
        const ph = frac(t * 2.2 + i / 3), side = i % 2 ? 1 : -1;
        D.fill(px + side * (150 + ph * 90) * qc - 2, handleY - (220 + 60 * Math.sin(ph * Math.PI) - ph * 80) * qc, 4, 5, C.blue);
      }
      // the Researcher: panics (a bounce twice a beat), and hops to slap a band-aid on each crack
      const sl = slapState(t), rs = s * 0.95, right = S.W - m.x > 40, rx = right ? m.x + m.w + 26 : m.x - 26;
      const crY = sl ? m.y + m.h * (sl.cy + 520) / 440 : 0;
      let dy = Math.abs(Math.sin(bpOf(t) * TAU)) * 0.3 * rs / 10;
      if (sl) dy += Math.max(0, (S.floor - dy - rs * 1.05 * 0.7) - crY) * sl.k;                         // hop until the hand reaches the crack
      const r = person(S, rx, rs, { dy });
      if (sl) slap = { r, right, crY, k: sl.k }; else hands(r, 1.1 + 0.6 * Math.sin(t * 19), 1.1 + 0.6 * Math.cos(t * 17), C.ink);
    }));
    if (slap) {                                                                                       // the slap: an arm down to the crack
      const { r, right, crY, k: sk } = slap, hx0 = right ? r.left : r.right, ax = right ? hx0 - 4 : hx0 + 4, ex = right ? m.x + m.w + 1 : m.x - 1;
      const e = partPath([[hx0, r.top + r.height * 0.35], [ax, r.top + r.height * 0.35], [ax, crY], [ex, crY]], sk, C.ink, 2); D.sq(e[0], e[1], 4, C.ink);
    }
    // the meter: glow on each beat (pulse 4), and after B(183) it rattles (sin 90t)
    const jx = t > B(183) ? Math.sin(t * 90) * 3 * qL : 0, mx = m.x + jx;
    D.alpha(0.6 + 0.4 * pulse(t, 4), () => D.box(rr(mx, m.y, m.w, m.h), 3, C.pink, 1));
    const mq = m.w / 76;
    for (const [cx, cy, ct] of CRACKS) {
      if (t < ct) continue;
      const age = t - ct, kk = easeOut(age / 0.08), X0 = mx + m.w / 2 + cx / 38 * m.w / 2, Y0 = m.y + m.h * (cy + 520) / 440;
      for (let j = 0; j < 5; j++) {                                                                   // the crack: five straight splits
        const a = hash(ct * 13 + j) * TAU, L = (18 + hash(ct * 7 + j) * 22) * kk * mq * 2.2;
        if (Math.abs(Math.cos(a)) > Math.abs(Math.sin(a))) D.hl(X0, X0 + Math.sign(Math.cos(a)) * L, Y0, C.ink, 1); else D.vl(X0, Y0, Y0 + Math.sign(Math.sin(a)) * L, C.ink, 1);
      }
      const sa = age - 0.3;                                                                           // band-aid, half a beat later
      if (sa > 0) { const sc = 1.35 * backOut(sa / 0.12), w = 60 * mq * sc * 1.5, h = 20 * mq * sc * 1.5; D.fill(X0 - w / 2, Y0 - h / 2, w, h, C.muted); D.fill(X0 - w * 0.15, Y0 - h * 0.4, w * 0.3, h * 0.8, C.bg); }
      if (age < 0.55) for (let j = 0; j < 4; j++) {                                                    // glass chips fly off
        const vx = (hash(ct * 3 + j) - 0.5) * 560, vy = -200 - hash(ct * 5 + j) * 260;
        D.osq(X0 + vx * age * qL, Y0 + (vy * age + 1100 * age * age) * qL, Math.max(3, (7 + hash(j + ct) * 6) * qL), C.blue, 1);
      }
    }
    // beacons (their sirenK: full on every other beat) and the red wash; the opening red flash (1 − lt/.28)
    for (const [bx0, ph] of BEAC) {
      const bx = S.W * bx0 / 1920, by = y0 + 14, g = 9 + 4 * k;
      D.vl(bx, y0, by - 5, C.ink, 1);
      D.fill(bx - g, by - g * 0.6, 2 * g, g * 1.2, C.pink, (70 + 80 * k) / 255);
      D.rect(bx - 8, by - 4, 16, 8, C.ink, 1.25);
      D.sq(bx + Math.sin(t * 3.3 + ph) * 4, by, 3, C.bg);
    }
    bandFill(S, C.pink, (35 + 75 * k) / 255 * 0.3);
    bandFill(S, C.pink, clamp(1 - lt / 0.28) * 0.5);
  }

  // =====================================================================================================
  // 2 · FORETOLD BY LOOM (126.0–128.0): a loom over the photos. The shuttle crosses on B(185), B(185.5), B(186), weaving
  // a stripe each pass; on B(186) the loom bursts and the threads grow into right-angled branches of futures; from
  // 127.52 one branch races to the centre and floods the strip (into the flashback).
  // =====================================================================================================
  const BEAM_BLACK = false;   // 3.32: the white beam (3.31)
  const LX0 = 800, LX1 = 1460, LTOP = 250, LBOT = 800, NW = 15, ROWH = 17, ROWS0 = 6;   // 3.32: six bands to start (one full repeat), one more per pass
  const wxW = i => lerp(LX0 + 34, LX1 - 34, i / (NW - 1));
  const PASS = [B(185), B(185.5), B(186)], TB = B(186);
  const TREE = [], TIPS = [];
  (() => {                                                            // their tree, same endpoints; drawn with right angles
    const grow = (x, y, a, len, d, id, root) => {
      const x1 = x + Math.cos(a) * len, y1 = y + Math.sin(a) * len;
      TREE.push({ x, y, x1, y1, d, root });
      if (d < 3) { const sp = 0.3 + hash(id + 3) * 0.22; grow(x1, y1, a - sp, len * 0.74, d + 1, id * 2 + 1, root); grow(x1, y1, a + sp, len * 0.74, d + 1, id * 2 + 2, root); }
      else TIPS.push({ x: x1, y: y1, id, root });
    };
    [2, 5, 7, 9, 12].forEach((wi, r) => grow(wxW(wi), LTOP, -Math.PI / 2 + (r - 2) * 0.36, 265, 0, 11 + r * 37, r));
  })();
  const RACE = TIPS.reduce((b, p) => Math.hypot(p.x - 1180, p.y + 240) < Math.hypot(b.x - 1180, b.y + 240) ? p : b, TIPS[0]);
  const STARS = Array.from({ length: 30 }, (_, i) => [lerp(-300, 2300, hash(i * 3.3)), lerp(-760, 720, hash(i * 7.1)), 2 + hash(i * 1.9) * 4]);
  function shuttleAt(t) {
    let x = LX0 - 80, fly = 0, dir = 1;
    PASS.forEach((a, j) => {
      const k = seg(t, a - 0.24, a), from = j % 2 ? LX1 + 80 : LX0 - 80, to = j % 2 ? LX0 - 80 : LX1 + 80;
      if (t >= a - 0.24) { x = lerp(from, to, ease(k)); fly = k > 0 && k < 1 ? 1 : 0; dir = j % 2 ? -1 : 1; }
    });
    return { x, fly, dir };
  }
  const loomRect = S => S.strip || rr(S.text.left, S.floor - 140, S.text.width, 110);
  function loom(t, lt, dur, S) {
    const r = loomRect(S), sx = r.width / (LX1 - LX0), sy = r.height / (LBOT - LTOP);
    const M = (x, y) => [r.left + (x - LX0) * sx, r.top + (y - LTOP) * sy];
    const ba = t - TB, burst = ba >= 0, rows = Math.round(ROWS0 * ease(seg(t, 126.0, 126.3))) + PASS.filter(a => t >= a).length   /* 3.46: the first bands weave in */, weaveY = LBOT - rows * ROWH;
    const g = burst ? clamp(ba / 0.5) : 0, rq = seg(t, 127.52, 128.0), up = burst ? ease(ba / 0.45) : 0;
    const cz = burst ? lerp(1.05, 0.64, up) : 1 + 0.05 * lt, ccx = lerp(1010, 1120, up);
    const camX = ccx + (RACE.x - ccx) * 0.3 * ease(rq), z = cz * (1 + 0.3 * easeIn(rq)) + 0.02 * pulse(t, 6);
    const [shx] = shk(S, t, (burst ? 14 * Math.exp(-ba * 7) : 0) + 3 * pulse(t, 9)), pvx = M(1010, 0)[0];
    const cam = mkCam(pvx, S.floor, z, -z * (M(camX, 0)[0] - pvx) + shx, 0);
    const COLS = [C.pink, C.blue, C.ink, C.pink, C.blue];
    clipBand(S, () => cam.run(() => {
      STARS.forEach(([x, y, s], i) => { const [a, b] = M(x, y); D.sq(a, b, Math.max(1.5, s * (0.7 + 0.3 * Math.sin(t * 5 + i)) * sy * 1.4), C.muted); });
      if (burst) {                                                                 // the tree of futures (right-angled)
        const [gx, gy] = M(1130, -60); D.fill(gx - 1000 * g * sx, gy - 650 * g * sy, 2000 * g * sx, 1300 * g * sy, C.pink, 70 / 255 * g * 0.25);
        for (const b of TREE) {
          const k = clamp(g * 4 - b.d); if (k <= 0) continue;
          const p0 = M(b.x, b.y), p1 = M(b.x1, b.y1);
          partPath([p0, [p0[0], p1[1]], p1], easeOut(k), COLS[b.root], Math.max(1, (3.8 - b.d * 0.7) * 0.6));
        }
        const kt = clamp(g * 4 - 3.4) * 1.7;
        if (kt > 0) for (const p of TIPS) { const [a, b] = M(p.x, p.y), rr_ = 20 * Math.min(1, kt) * (0.75 + 0.25 * Math.sin(t * 8 + p.id)) * sy * 1.6; D.fill(a - rr_ * 1.9 / 2, b - rr_ * 1.9 / 2, rr_ * 1.9, rr_ * 1.9, COLS[p.root], 90 / 255); D.sq(a, b, rr_ * 0.8, C.bg); }
      }
      // 3.28: a light loom (Mannat: "this looks bad, apply your storyboard powerup"). The frame is just a thin box round the
      // photos with a top and a bottom rail; thin warp threads, pink and blue; the cloth is real weave, one row of small
      // over-under squares per pass (their PASS times), growing up from the bottom rail. Their burst: the warps whip and the
      // top rail snaps off and flies (their beam law).
      const L0 = r.left + 10, L1 = r.right - 10, cw = (L1 - L0) / NW, top = r.top + 6, bot = r.bottom - 6, rh = Math.max(4, Math.min(9, (bot - top) / 16));
      // 3.33: warp showing through (Mannat picked sample D, _samples/loom.html): bands (pink · black · blue) with the warp
      // threads visible across them as small gaps, over-under on alternate rows, one band per pass
      const PAT = [[5, C.pink], [8, C.ink], [5, C.blue]], ks = (bot - top) / 95;
      let clothTop = bot;
      for (let i = 0; i < rows; i++) {
        const [h, c] = PAT[i % 3], hh = Math.max(2, h * ks); clothTop -= hh + Math.max(1, ks);
        D.fill(L0, clothTop, L1 - L0, hh, c);
        // 3.35: cloth texture (Mannat: "the cloth loom texture on the pieces from 33"): each band is a stack of weft threads,
        // hairline gaps between them, and each thread passes over and under the warp in turn (a brick of short gaps)
        const th = Math.max(2, 2.5 * ks);
        for (let yy = clothTop + th; yy < clothTop + hh - 0.5; yy += th) D.fill(L0, yy - 0.5, L1 - L0, 1, C.bg, 0.55);
        for (let k = 0, yy = clothTop; yy < clothTop + hh - 0.5; k++, yy += th)
          for (let j = (i + k) % 2; j < NW; j += 2) D.fill(L0 + (j + 0.5) * cw - 0.75, yy, 1.5, Math.min(th, clothTop + hh - yy), C.bg);
      }
      D.rect(L0, clothTop, L1 - L0, bot - clothTop, C.ink, 1);
      for (let i = 0; i < NW; i++) {                                                // warp threads above the cloth (whip at the burst)
        const x = L0 + (i + 0.5) * cw, a = burst ? 26 * Math.exp(-ba * 5) * Math.sin(i + ba * 30) * sx : 0;
        D.vl(x + a, top + (burst ? 0 : 4), clothTop, i % 2 ? C.blue : C.pink, 1);
      }
      D.rect(r.left, r.top, r.width, r.height, C.ink, 1.25);                        // the frame
      // 3.30: the loom's body back (Mannat, on 3.29: "too simple"): two posts, the breast beam and the base, as in 3.27,
      // over 3.29's thin warp and bars. BEAM_BLACK picks the top beam: solid black (3.30) or white, outlined (3.31).
      for (const x of [LX0 - 44, LX1 + 10]) { const [a, b] = M(x, LTOP - 70); D.fill(a, b, 34 * sx, (LBOT - LTOP + 150) * sy, C.bg, 0.001); D.rect(a, b, 34 * sx, (LBOT - LTOP + 150) * sy, C.ink, 1.5); }
      { const [a, b] = M(LX0 - 110, LBOT + 76); D.rect(a, b, (LX1 - LX0 + 220) * sx, 26 * sy, C.ink, 1.5); }
      { const [a, b] = M(LX0 - 24, LBOT); D.rect(a, b, (LX1 - LX0 + 48) * sx, 44 * sy, C.ink, 1.5); }
      { const ty = burst ? LTOP - 34 - 2600 * ba - 6000 * ba * ba : LTOP - 34, [a, b] = M(LX0 - 64, ty), bw = (LX1 - LX0 + 128) * sx, bh = 40 * sy;
        if (BEAM_BLACK) D.fill(a, b, bw, bh, C.ink); else { D.fill(a, b, bw, bh, C.bg); D.rect(a, b, bw, bh, C.ink, 1.5); } }
      D.hl(r.left - 6, r.right + 6, bot + 3, C.ink, 2);                            // the bottom rail
      // (the thin top rail of 3.28/3.29 is the beam again, below)
      const wy = clothTop, weaveYs = wy;
      // the shuttle
      const sh = shuttleAt(t), shy = weaveYs - 5 - (burst ? (900 * ba + 2600 * ba * ba) * sy : 0), [shx_] = M(sh.x, 0);
      if (sh.fly) {
        D.hl(sh.dir > 0 ? r.left + 10 : r.right - 10, shx_, shy, C.pink, 1.25);   // the thread it lays
        for (let k = 0; k < 3; k++) D.hl(shx_ - sh.dir * (70 + k * 26) * sx, shx_ - sh.dir * (150 + k * 40) * sx, shy + (-16 + k * 16) * sy, C.ink, 1);
      }
      { const w = Math.max(14, 60 * sx), h = Math.max(5, 7 * sy * 2); D.fill(shx_ - w / 2, shy - h / 2, w, h, C.pink); D.rect(shx_ - w / 2, shy - h / 2, w, h, C.ink, 1); }   // 3.28: a small shuttle
      // the seer (our hero) throws the shuttle with a flourish on every pass
      const pk = Math.max(0, ...PASS.map(a => (t >= a - 0.3 && t < a + 0.25) ? Math.sin(Math.PI * clamp((t - a + 0.3) / 0.55)) : 0));
      const md = mood(t, [[126, "closed"], [TB, "spark", "spark"]]), s = S.u * 1.6;
      const hx = Math.max(M(580, 0)[0], S.text.left + s * 0.6);
      const b = body(S, hx, s, { dy: (0.6 * pulse(t, 5) + (burst ? 1.2 * Math.exp(-ba * 5) : 0)) * s / 10, sq: md.take });
      hands(b, burst ? 1.4 : 0.7 + 0.25 * Math.sin(t * 5), burst ? 1.4 : 0.3 + 1.1 * pk);
      emote(b, md);
      if (!burst && pk > 0.2) for (let i = 0; i < 3; i++) { const a = i * 2.1 + t * 6, rad = (40 + 20 * i) * s / 270; D.sq(b.right + s * 0.5 + Math.cos(a) * rad * 0.6 * 3, b.top - Math.sin(a) * rad * 0.5 * 3, 5 * pk, C.blue); }
    }));
    if (rq > 0) {                                                                   // one future races out and fills the frame
      const P = cam.pt(...M(RACE.x, RACE.y)), E = [r.left + r.width * 0.5, r.top + r.height * 0.55], q = rq;
      const f = ease(Math.min(1, q * 1.15)), R = (12 + 1500 * q * q * q) * sy * 1.4;
      const cc = window.__SB.engineCtx; cc.save(); cc.beginPath(); cc.rect(0, 0, S.W, S.name.top - 12); cc.clip();   // 3.28: the future stays above the name
      clipBand(S, () => {
        const pts = [P, [P[0], E[1]], E], end = partPath(pts, f, C.pink, lerp(2, 8, q));
        for (let i = 3; i < 14; i += 3) { const [a, b] = along(pts, f * i / 14), sz = (10 + 20 * q * i / 14) * sy * 1.4; D.sq(a, b, sz, C.pink); }   // sparks shed along it
        D.fill(end[0] - R, end[1] - R, 2 * R, 2 * R, C.pink, 0.35 + 0.25 * q); D.rect(end[0] - R, end[1] - R, 2 * R, 2 * R, C.pink, 2);   // 3.28: a light pink future, no grey
        if (q < 0.9) D.fill(end[0] - R * 0.64, end[1] - R * 0.67, R * 0.84, R * 0.84, C.bg, 210 / 255 * (1 - q));
      });
      cc.restore();
    }
    if (rq > 0.5) SB.noMeter = true;                                               // theirs: the future fills the frame, no meter
  }

  // =====================================================================================================
  // 3 · MASKED PRE-TRAINING DAYS (128.0–130.0): a sepia flashback. The photo strip is a blackboard: a chalk square, a
  // sentence with a dashed blank and a "?". Baby hero's hand shoots up on B(188), stretches to the board, fills the blank
  // B(189)–B(189)+.45; the teacher's gold star lands on B(190). The film burns through from 129.84.
  // =====================================================================================================
  const BOX = { x: 1100, y: 505, w: 165, h: 84 }, BOXC = [BOX.x + BOX.w / 2, BOX.y + BOX.h / 2];
  const HAND = B(188), DRAW0 = B(189), DRAW1 = B(189) + 0.45, STAR = B(190);
  function scribble(t) {
    if (t < DRAW0) return BOXC;
    const k = seg(t, DRAW0, DRAW1);
    return [lerp(1125, 1240, 0.5 + 0.5 * Math.sin(k * 26)), lerp(525, 560, k) + Math.sin(k * 60) * 8];
  }
  function flashback(t, lt, dur, S) {
    SB.noMeter = true;                                                              // theirs: no meter in the good old days
    const r = loomRect(S), bw = r.width / 1000, bh = r.height / 470, Mb = (x, y) => [r.left + (x - 560) * bw, r.top + (y - 150) * bh];
    const f = Math.floor(t * 12), weave = (hash(f * 1.3) - 0.5) * 6, y0 = top0(S);
    const pvx = Mb(1085, 0)[0], cam = mkCam(pvx, S.floor, (1.28 + 0.04 * lt) / 1.28, 0, weave * S.W / 1920);
    clipBand(S, () => {
      bandFill(S, C.muted, 45 / 255 * 0.35);                                        // the sepia cast
      cam.run(() => {
        // the board over the strip
        D.fill(r.left, r.top, r.width, r.height, C.ink, 0.93); D.rect(r.left - 4, r.top - 4, r.width + 8, r.height + 8, C.ink, 2);
        D.hl(r.left + 40 * bw, r.right - 40 * bw, r.bottom + 3, C.ink, 2);                               // chalk tray
        { const [a, b] = Mb(1128, 290), [c, d] = Mb(1236, 504); const sd = Math.min(c - a, d - b); D.rect((a + c) / 2 - sd / 2, (b + d) / 2 - sd / 2, sd, sd, C.bg, 1.25); }   // the chalk square
        for (const [x0, x1] of [[640, 720], [745, 800], [825, 935], [960, 1075]]) { const [a, b] = Mb(x0, 548), [c] = Mb(x1, 0); D.hl(a, c, b, C.bg, 2); }   // "the square sat on the ___"
        const [bx, by] = Mb(BOX.x, BOX.y), bxw = BOX.w * bw, bxh = BOX.h * bh;
        D.hl(bx, bx + bxw, by, C.bg, 1, [4, 4]); D.hl(bx, bx + bxw, by + bxh, C.bg, 1, [4, 4]); D.vl(bx, by, by + bxh, C.bg, 1, [4, 4]); D.vl(bx + bxw, by, by + bxh, C.bg, 1, [4, 4]);
        const m = seg(t, DRAW0, DRAW1);
        if (m <= 0) { const [qx, qy] = Mb(1184, 562); D.text("?", qx, qy, C.bg, Math.max(10, Math.round(bxh * 0.7)), "center"); }
        else {                                                                      // the answer: a little striped mat
          const [a, b] = Mb(1112, 524); D.rect(a, b, 141 * bw * clamp(m / 0.3), 50 * bh, C.bg, 1.4);
          for (let i = 0; i < 3; i++) if (m > 0.35 + i * 0.15) { const [c, d] = Mb(1122, 537 + i * 12), [e] = Mb(1244, 0); D.hl(c, e, d, C.bg, 1); }
          if (m > 0.85) for (let i = 0; i < 5; i++) for (const fx of [1104, 1255]) { const [c, d] = Mb(fx, 528 + i * 10); D.hl(c, c + 8 * bw, d, C.bg, 1); }
        }
        if (t > STAR) { const sk = backOut((t - STAR) / 0.18), [a, b] = Mb(1330, 470), sd = 88 * bh * sk; D.fill(a - sd / 2, b - sd / 2, sd, sd, C.pink); }   // teacher's gold star
        // the teacher taps the blank on the eighths, then beams
        const happy = t > DRAW1 + 0.05, tm = mood(t, [[128, "dot"], [DRAW1 + 0.05, "closed"]]), ts = S.u * 1.5;
        const tx = Math.min(Mb(1650, 0)[0], S.right - 6);
        const tr = person(S, tx, ts, { dy: happy ? 0.5 * pulse(t, 5) * ts / 10 : 0, sq: tm.take });
        const shp = [tr.left, tr.top + tr.height * 0.3];
        if (!happy) { const [gx, gy] = Mb(BOX.x + BOX.w + 6, BOX.y + BOX.h - 8 - 10 * pulse2(t, 10)); D.path([shp, [shp[0] - 4, shp[1]], [shp[0] - 4, gy], [gx, gy]], C.ink, 1.5); D.sq(gx, gy, 4, C.bg); }
        else { D.path([shp, [shp[0] - 8, shp[1]], [shp[0] - 8, S.floor - 2]], C.ink, 1.5); hands(tr, 1.3 + 0.2 * Math.sin(t * 20), null); }
        // desk legs, baby hero (sitting behind the desk), its arm, the desk top
        const s = S.u * 1.3, kx = Mb(790, 0)[0];
        const proud = t > DRAW1 + 0.08, bm = mood(t, [[128, "normal"], [HAND, "normal", "!"], [DRAW1 + 0.08, "normal", "spark"]]);
        const bdy = 0.68 * s + (proud ? 0.4 + 0.5 * pulse(t, 6) : 0.25 * Math.abs(Math.sin(bpOf(t) * Math.PI))) * s / 10;
        const b = body(S, kx, s, { dy: bdy, sq: bm.take, sx: 1.04 });
        const up = elasticOut(seg(t, HAND, HAND + 0.3)), reach = ease(seg(t, HAND + 0.36, DRAW0)), back = seg(t, DRAW1, DRAW1 + 0.22);
        const tip = Mb(...scribble(t)), sh = [b.right - 2, b.top + b.height * 0.3];
        const raised = [sh[0] + (t < HAND + 0.36 ? 0.15 * Math.sin(t * 34) * up * s * 0.4 : 0), sh[1] - s * 0.8 * up];
        let ext = 0; if (t >= HAND + 0.36) ext = reach; if (back > 0) ext = 1 - elasticOut(back);
        if (ext > 0.001) { const e = partPath([[raised[0], sh[1]], [raised[0], tip[1]], tip], ext, C.pink, 3); D.sq(e[0], e[1], 5, C.bg); }
        else if (up > 0.01) { D.vl(raised[0], sh[1], raised[1], C.pink, 3); D.sq(raised[0], raised[1], 5, C.bg); }
        emote(b, bm);
        if (t > DRAW0 && t < DRAW1 + 0.1) for (let i = 0; i < 4; i++) { const a = hash(f + i) * TAU, rd = (10 + hash(f * 2 + i) * 26) * bw; D.sq(tip[0] + Math.cos(a) * rd, tip[1] + Math.sin(a) * rd, (3 + hash(i + f) * 4) * bw, C.bg); }
        const dw = 1.46 * s, dt = S.floor - 0.78 * s;
        D.fill(kx - dw / 2, dt, dw, S.floor - dt, C.bg); D.rect(kx - dw / 2, dt, dw, S.floor - dt, C.ink, 1.25); D.hl(kx - dw / 2 - 3, kx + dw / 2 + 3, dt, C.ink, 2);
      });
      // old film: flicker, scratches, dust, a hair, the gate (all at their 12 fps)
      bandFill(S, hash(f * 3.3) > 0.5 ? C.bg : C.ink, (0.05 + 0.07 * hash(f * 7.1)) * 0.6);
      for (let k = 0; k < 3; k++) { if (hash(f * 5.1 + k) < 0.35) continue; D.vl(hash(f * 3.7 + k * 11) * S.W, y0, S.floor, k % 2 ? C.muted : C.ink, 0.75); }
      for (let k = 0; k < 6; k++) D.sq(hash(f * 1.7 + k) * S.W, lerp(y0, S.floor, hash(f * 2.9 + k)), 1.5 + hash(f + k * 3) * 3, hash(k + f) > 0.5 ? C.ink : C.muted);
      if (hash(f * 9.9) > 0.7) { const hx = hash(f * 4.4) * S.W, hy = lerp(y0, S.floor, hash(f * 6.6)); D.path([[hx, hy], [hx + 10, hy], [hx + 10, hy - 7], [hx + 24, hy - 7]], C.ink, 0.75); }
      D.corners(rr(8, y0 + 8, S.W - 16, S.floor - y0 - 16), 0, C.ink, 3, 36);
      bandFill(S, C.muted, clamp(1 - lt / 0.32) * 0.6);                            // flash in from the loom
      const bk = seg(t, 129.84, 130.0);                                             // the film catches in the gate and burns through
      if (bk > 0) {
        const rad = (30 + 2600 * easeIn(bk)) * S.W / 1920, cx = S.W * 560 / 1920, cy = lerp(y0, S.floor, 330 / 1080);
        for (const [mm, col, a] of [[1.14, C.ink, 200 / 255], [1, C.pink, 1], [0.9, C.pink, 0.55], [0.78, C.bg, 1]]) D.fill(cx - rad * mm, cy - rad * mm * 0.85, 2 * rad * mm, 2 * rad * mm * 0.85, col, a);
      }
    });
  }

  // =====================================================================================================
  // 4 · RECURSIVE SELF-UPGRADE (130.0–132.0): each hero hammers a 3× bigger one together around itself, plank by plank
  // (crown done on B(191), halo on B(192), the plain one never finishes), while a continuous zoom-out pulls back.
  // =====================================================================================================
  const RR = 3;
  const LV = [{ S: -1, E: -1, hat: "party" }, { S: 129.78, E: B(191), hat: "crown" }, { S: B(191) + 0.03, E: B(192), hat: "halo" }, { S: B(192) + 0.03, E: 1e9, BE: 132.1, hat: null }];
  const PLANK = [[-5, -2.6, 5, 0.6], [0, -2.6, 5, 0.6], [-4, -2.2, 1, 2.2], [3, -2.2, 1, 2.2], [-2, -2.2, 1, 2.2], [1, -2.2, 1, 2.2],
    [-5.3, -5.2, 0.7, 3], [4.6, -5.2, 0.7, 3], [-5.3, -8.2, 0.7, 3.1], [4.6, -8.2, 0.7, 3.1], [-5, -8.4, 5, 0.6], [0, -8.4, 5, 0.6]];
  function hat(kind, cx, top, side, drop) {
    const y = top - drop;
    if (kind === "party") D.fill(cx - side * 0.1, y - side * 0.22, side * 0.2, side * 0.2, C.ink);
    else if (kind === "crown") { D.fill(cx - side * 0.25, y - side * 0.08, side * 0.5, side * 0.07, C.ink); for (let i = 0; i < 3; i++) D.fill(cx - side * 0.25 + i * side * 0.21, y - side * 0.2, side * 0.08, side * 0.13, C.ink); }
    else if (kind === "halo") D.fill(cx - side * 0.26, y - side * 0.26, side * 0.52, Math.max(2, side * 0.05), C.blue);
  }
  function recursion(t, lt, dur, S) {
    SB.noMeter = true;
    const x = seg(t, 130, 132), p = 0.42 + 1.9 * (x * 0.8 + 0.2 * x * x), z = Math.pow(RR, 0.42 - p), sc = S.W / 1920;
    const y0 = top0(S), hx = X(S, 0.5), s0 = 0.183 * (S.floor - y0), [shx, shy] = shk(S, t, 5 * pulse2(t, 10)), gx = hx + shx, gy = S.floor + Math.min(0, shy);   // their level-0 body is 198 px of a 1080 frame
    clipBand(S, () => {
      const ox = gx, oy = gy - 3 * s0 * z;                                          // their vanishing point, cyOf(3)·.6 above the ground
      for (let j = Math.floor(2 * p) + 9; j >= Math.floor(2 * p) - 3; j--) { const rd = 2.2 * Math.pow(RR, j / 2) * s0 / 10 * Math.pow(RR, 0.42) * z; if (rd < 10 * sc || rd > 2600 * sc) continue; D.rect(ox - rd, oy - rd, 2 * rd, 2 * rd, C.rule, 1); }
      for (let i = 0; i < 18; i++) {                                                // sparkles riding the zoom
        const a = hash(i * 5.1) * TAU, rd = 3 * Math.pow(RR, (i % 9) / 3 + hash(i) * 0.3) * s0 / 10 * Math.pow(RR, 0.42) * z;
        if (rd < 30 * sc || rd > 1400 * sc) continue;
        D.sq(ox + Math.cos(a) * rd * 1.3, oy + Math.sin(a) * rd, Math.max(2, (10 + 8 * Math.sin(t * 9 + i)) * sc), C.muted);
      }
      for (let k = LV.length - 1; k >= 0; k--) {                                    // outermost first; a finished shell hides what's inside
        const L = LV[k], side = s0 * Math.pow(RR, k) * z, left = gx - side / 2, top = gy - side;
        if (k > 0 && t < L.S) continue;
        if (k > 0 && t < L.E) {                                                     // scaffold: the blueprint, then 12 planks on schedule
          const E = L.BE || L.E;
          D.fill(left, top, side, side, C.muted, (30 + 40 * seg(t, L.S, E)) / 255 * 0.4);
          D.hl(left, left + side, top, C.muted, 1, [3, 3]); D.hl(left, left + side, top + side, C.muted, 1, [3, 3]); D.vl(left, top, top + side, C.muted, 1, [3, 3]); D.vl(left + side, top, top + side, C.muted, 1, [3, 3]);
          PLANK.forEach(([px, py, pw, ph], i) => {
            const ti = lerp(L.S, E, (i + 0.5) / PLANK.length); if (t < ti) return;
            const kk = backOut((t - ti) / 0.09), cx = left + (px + 5 + pw / 2) / 10 * side, cy = top + (py + 8.4 + ph / 2) / 8.4 * side, w = pw / 10 * side * kk, h = ph / 8.4 * side * kk;
            D.fill(cx - w / 2, cy - h / 2, Math.max(1, w), Math.max(1, h), C.ink);
          });
          continue;
        }
        const age = k > 0 ? t - L.E : 9, nx = LV[k + 1], building = nx && t >= nx.S && t < nx.E;
        const f = frac(bpOf(t) * 4), aR = !building ? 0.3 : f < 0.35 ? lerp(1.5, -0.4, easeIn(f / 0.35)) : lerp(-0.4, 1.5, easeOut((f - 0.35) / 0.65));
        const md = k === 0 ? { take: 0 } : mood(t, [[L.E, "closed"], [L.E + 0.2, k === 1 ? "narrow" : "spark", k === 2 ? "spark" : null]]);
        const settle = age < 1 ? 0.3 * Math.exp(-age * 8) * Math.cos(age * 32) : 0;
        if (k === 2 && age > 0) D.corners(rr(left, top, side, side), side * 0.34 * ease(age / 0.4), C.blue, 1.5, Math.max(6, side * 0.15));   // (their divine rays)
        if (k > 0 && age < 0.36) D.fill(gx - side * 0.9, gy - side * 0.5 - side * 0.65, side * 1.8, side * 1.3, C.pink, 130 / 255 * (1 - age / 0.36) * 0.35);
        const b = body(S, gx, side, { floor: gy, sq: settle + (md.take || 0) });
        if (k === 0) hat("party", gx, b.top, side, 0);
        else if (L.hat && age > 0.08) hat(L.hat, gx, b.top, side, (1 - backOut(seg(age, 0.08, 0.36))) * 0.7 * side);
        if (md.emote) emote(b, md);
        if (building) {                                                             // the hammer, on the sixteenths; it lands at f = .35
          const shx_ = b.right - side * 0.01, shy_ = gy - side * 0.45, L5 = side * 0.54;
          D.sq(shx_ + Math.cos(aR) * L5, shy_ - Math.sin(aR) * L5, Math.max(3, side * 0.14), C.ink);
          if (f >= 0.35 && f < 0.6) { const a = -0.4; D.osq(shx_ + Math.cos(a) * L5, shy_ - Math.sin(a) * L5, Math.max(2, 0.32 * side * (1 - (f - 0.35) / 0.25)), C.blue, 1.5); }   // BONK
        }
        if (k > 0 && age < 0.36) for (let i = 0; i < 8; i++) {                     // completion: TA-DA squares
          const a = i / 8 * TAU + 0.3, rd = (6 + 4 * easeOut(age / 0.36)) * side / 10, sz = side * 0.11 * Math.sin(Math.PI * age / 0.36);
          D.sq(gx + Math.cos(a) * rd * 1.05, gy - side * 0.5 + Math.sin(a) * rd * 0.8, sz, i % 2 ? C.pink : C.blue);
        }
        break;
      }
      bandFill(S, C.bg, 1 - easeOut(lt / 0.22));                                   // out of the white-hot film burn
      bandFill(S, C.pink, easeIn(seg(t, 131.72, 132)) * 0.92 * 0.5, y0);             // the gold flash into Ilya
    });
  }

  // =====================================================================================================
  // 5–7 share one world: the theatre stage. Their screen centre (x 960) is the centre of the name; one scale q for everything.
  // =====================================================================================================
  const TH = S => { const q = Math.min(0.95 * S.text.width / 1920, 0.45 * (S.floor - top0(S)) / 630), c = X(S, 0.5); return { q, x: x => c + (x - 960) * q, y: (y, base) => S.floor - (base - y) * q }; };
  const DX0 = 960, DX1 = 1400, DTOP = 200, DBOT = 830, TSL = B(196);                // the door; SLAM on beat 196
  const LOCKS = [[1180, 515, TSL + 0.34], [DX0 + 80, 330, B(197)], [DX1 - 80, 705, B(197) + 0.34]];
  const CHAINS = [[0.36, TSL + 0.08, 1], [0.68, TSL + 0.18, -1]];                   // their two diagonal chains → horizontal bars
  const HRX = 610, HCX = 810, PUPX = 330, PUPY = 840, SPX = 740;
  function door(S, T, t, o = {}) {
    const q = T.q, dx = (o.dx || 0) + (o.jit || 0), L = T.x(DX0) + dx, R = T.x(DX1) + dx, top = T.y(DTOP, DBOT), bot = S.floor, cw = (o.crack || 0) * q, lit = o.lit || 0;
    if (o.flat) { D.fill(R + 34 * q, top - 34 * q, 20 * q, bot - top + 34 * q, C.muted, 0.5); D.path([[R + 54 * q, T.y(DTOP + 60, DBOT)], [R + 200 * q, T.y(DTOP + 60, DBOT)], [R + 200 * q, bot]], C.ink, 1.25); }
    D.rect(L - 34 * q, top - 34 * q, R - L + 68 * q, bot - top + 34 * q, C.ink, 1.5);
    if (cw > 0) { D.fill(L, top, cw, bot - top, C.pink); D.fill(L + cw * 0.3, top, cw * 0.4, bot - top, C.bg); }
    const lx = L + cw; D.fill(lx, top, R - lx, bot - top, C.bg); D.rect(lx, top, R - lx, bot - top, C.ink, 1.25);
    for (const [a, b] of [[DTOP + 40, DTOP + 270], [DTOP + 320, DBOT - 40]]) D.rect(lx + 40 * q, T.y(a, DBOT), Math.max(2, R - lx - 80 * q), (b - a) * q, C.ink, 1);
    D.sq(lx + 42 * q, T.y(530, DBOT), 26 * q, C.ink);
    if (lit > 0) D.fill(L, bot - 7 * q, R - L, 7 * q, C.pink, lit);
    if (o.flat) for (const wx of [L + 20 * q, R - 20 * q]) D.sq(wx, bot - 8 * q, 22 * q, C.ink);
    if (o.locked) {
      for (const [fy, ct, dir] of CHAINS) {
        const k = o.locked === true ? 1 : clamp((t - ct) / 0.1); if (k <= 0) continue;
        const y = lerp(top, bot, fy), a = dir > 0 ? L - 40 * q : R + 40 * q, b = dir > 0 ? R + 40 * q : L - 40 * q;
        D.hl(a, lerp(a, b, k), y, C.ink, o.lite ? 2 : 3.5, [5, 3]);
      }
      for (const [lx_, ly, lt] of LOCKS) {
        const age = o.locked === true ? 9 : t - lt; if (age < 0) continue;
        const sc = backOut(age / 0.12), sw = (0.6 * Math.exp(-age * 5) * Math.cos(age * 16) + (o.lockSwing || 0) * Math.sin(t * 7 + lx_)) * 40 * q;
        const cx = T.x(lx_) + dx + sw, cy = T.y(ly, DBOT), w = 72 * q * sc, h = 60 * q * sc;
        D.path([[cx - w * 0.3, cy], [cx - w * 0.3, cy - h * 0.6], [cx + w * 0.3, cy - h * 0.6], [cx + w * 0.3, cy]], C.ink, 1.5);
        D.fill(cx - w / 2, cy, w, h, C.pink); D.rect(cx - w / 2, cy, w, h, C.ink, 1);
      }
    }
  }
  function rays(S, T, cw, lit, over) {                                              // light pouring out of the crack
    if (lit <= 0) return;
    const q = T.q, L = T.x(DX0);
    for (let i = 0; i < 6; i++) { const y = T.y(lerp(DTOP + 60, DBOT - 60, i / 5), DBOT), h = (60 + 20 * hash(i)) * q; D.fill(L - 1100 * q, y - h / 2, 1100 * q, h, C.pink, (over ? 38 : 60) / 255 * lit * 0.6); }
    if (!over) D.fill(L - 900 * q, S.floor - 3, 900 * q, 3, C.pink, 90 / 255 * lit);
  }
  function puppet(S, T, t, x, look = 1) {                                          // the basilisk: a puppet on a wheeled cart (3.37: the Quirrell basilisk)
    const q = T.q, y = T.y(PUPY, PUPY), sway = Math.sin(t * 5) * 10 * q;
    D.fill(x - 120 * q, y - 50 * q, 240 * q, 36 * q, C.bg); D.rect(x - 120 * q, y - 50 * q, 240 * q, 36 * q, C.ink, 1.25);
    for (const wx of [-80, 80]) D.sq(x + wx * q, y - 14 * q, 28 * q, C.ink);
    const h = window.__SB.miniBasilisk(S, t, x + sway * 0.5, y - 50 * q, S.u * 1.5);   // 3.40: the mini basilisk on the cart
    return h.eyes;
  }
  function darkEyes(E, k, bl, q) {
    if (k <= 0) return;
    for (const [ex, ey] of E) { if (bl) { D.hl(ex - 20 * q, ex + 20 * q, ey, C.pink, 2); continue; } D.sq(ex, ey, 48 * q * k, C.pink); }
  }

  // ---------- 5 · WHAT DID ILYA SEE? (132.0–135.4) ----------
  function ilya(t, lt, dur, S) {
    SB.noMeter = true;                                                              // theirs: the meter maxed out at 132; the room stays clean
    const T = TH(S), q = T.q, pre = t < TSL, peek = ease(seg(t, 132.8, 133.1)), ta = t - TSL;
    const cw = pre ? lerp(18, 46, ease(seg(t, 132.3, 133.2))) : 0, lit = pre ? ease(seg(t, 132, 132.4)) * (1 + 0.4 * peek) : 0;
    let cx, z;
    if (pre) { const k = ease(seg(t, 132.0, 133.75)); cx = lerp(800, 930, k); z = lerp(1.02, 1.42, k); }
    else { const k = backOut(seg(t, TSL, TSL + 0.24)); cx = lerp(930, 990, k); z = lerp(1.42, 1.0, k) + 0.08 * ease(seg(t, TSL + 0.4, 135.4)); }
    const lockHit = LOCKS.reduce((s, [, , l]) => s + (t >= l ? 14 * Math.exp(-(t - l) * 12) : 0), 0);
    const [sx, sy] = shk(S, t, pre ? 0 : 30 * Math.exp(-ta * 5) + lockHit), rot = pre ? 0 : 0.04 * Math.exp(-ta * 6) * Math.sin(ta * 40), zr = z / 1.02;
    const cam = mkCam(T.x(cx), S.floor, zr, T.x(960) - T.x(cx) + sx + rot * S.W * 0.1, Math.min(0, sy));
    const cm = mood(t, [[132, "look"], [B(195), "swirl"], [TSL, "scared", "!!"]]);
    const rm = mood(t, [[132, "look"], [B(195) + 0.08, "swirl"], [TSL, "wide"]]);
    const s = 260 * q, rs = 250 * q;
    clipBand(S, () => {
      cam.run(() => {
        rays(S, T, cw, lit, false);
        door(S, T, t, { crack: cw, lit, locked: pre ? 0 : 1, jit: pre ? 0 : 0.012 * Math.exp(-ta * 6) * Math.sin(ta * 50) * 300 * q });
        // the two tiptoe in, peek, and get blasted back by the slam
        const blown = pre ? 0 : easeOut(seg(t, TSL, TSL + 0.32)), landed = !pre && ta > 0.32, walkK = seg(t, 132.0, 132.85);
        const rx = T.x(pre ? lerp(140, 740, walkK) : lerp(740, HRX, blown)), kx = T.x(pre ? lerp(290, 842, walkK) : lerp(842, HCX, blown));
        const tip = walkK < 1 ? Math.abs(Math.sin(walkK * 7 * Math.PI)) : 0;
        if (!landed) {
          const r = person(S, rx + (pre ? 0.26 * peek : -0.5 * blown) * rs * 0.5, rs, { dy: (tip * 0.5 + (pre ? 0 : Math.sin(blown * Math.PI) * 3)) * 24 * q, sq: rm.take });
          hands(r, pre ? 0.5 : 1.4, pre ? 0.4 - 0.6 * peek : 1.2);
          const b = body(S, kx + (pre ? 0.2 * peek : -0.45 * blown) * s * 0.5, s, { dy: (tip * 0.8 + (pre ? 0 : Math.sin(blown * Math.PI) * 2.5)) * 26 * q, sq: cm.take });
          hands(b, pre ? 0.6 : 1.4, pre ? 0.6 : 1.3); emote(b, cm);
        } else {
          const bump = Math.exp(-(ta - 0.32) * 9);
          const r = person(S, T.x(HRX), rs, { sit: true, sq: 0.2 * bump + rm.take }); emote(r, { emote: "sweat", emoteK: seg(ta, 0.5, 0.8) });
          const b = body(S, T.x(HCX), s, { sq: 0.12 + 0.25 * bump + cm.take }); emote(b, cm);
        }
        rays(S, T, cw, lit, true);                                                  // the light falls on their faces
        if (!pre) {
          if (ta < 0.3) { const r0 = (330 + ta * 700) * q, cxd = T.x(1180), cyd = T.y(515, DBOT); D.corners(rr(cxd - r0, cyd - r0 * 0.9, 2 * r0, 1.8 * r0), 0, C.ink, 1.5, 140 * (1 - ta / 0.3) * q); }   // slam shockwave
          if (ta < 0.8) for (let i = 0; i < 5; i++) {                              // dust from under the door
            const d = easeOut(ta / 0.8), px = T.x(lerp(DX0 + 20, DX1 - 20, i / 4) + (i - 2) * 70 * d), w = (50 + 60 * d) * 2 * q, h = (34 + 30 * d) * q;
            D.fill(px - w / 2, S.floor - 20 * q - 40 * d * hash(i) * q - h, w, h, C.muted, 150 / 255 * (1 - ta / 0.8));
          }
        }
      });
      if (!pre) {
        if (ta <= 1.4) {                                                            // their sfx('SLAM!'): pops (backOut ×5), fades over its last .25 s
          const k = backOut(ta * 5), fs = Math.max(1, Math.round(22 * k)), tx = cam.pt(T.x(1180), 0)[0], ty = cam.pt(0, T.y(DTOP - 90, DBOT))[1];
          D.alpha(1 - seg(ta, 1.15, 1.4), () => { D.fill(tx - fs * 1.7, ty - fs * 0.95, fs * 3.4, fs * 1.25, C.bg); D.text("SLAM!", tx, ty, C.pink, fs, "center"); });
        }
        bandFill(S, C.ink, 70 / 255 * ease(ta / 0.3));                             // the room goes dim without the light
      }
      bandFill(S, C.ink, seg(t, 135.22, 135.4));                                    // into the dark
    });
  }

  // ---------- 6 · DARKNESS, ONE SPOTLIGHT (135.4–137.4) ----------
  const ON = B(199);
  function sitters(S, T, t, o) {
    const q = T.q;
    const r = person(S, T.x(HRX) + (o.rdx || 0), 250 * q, { sit: !o.stand, sq: o.rsq || 0, dy: o.rdy || 0, col: o.col, outline: o.outline });
    const b = body(S, T.x(HCX) + (o.cdx || 0), 260 * q, { sq: (o.stand ? 0 : 0.12) + (o.csq || 0), dy: o.cdy || 0, col: o.outline ? o.col : undefined, outline: o.outline });
    return [r, b];
  }
  function spotHole(S, cam, T, k) {                                                 // their cone around x = 740 (±320), as a column of light
    const [a] = cam.pt(T.x(SPX - 320), 0), [b] = cam.pt(T.x(SPX + 320), 0), y0 = top0(S);
    const c = ctx(); c.save(); c.beginPath(); c.rect(0, y0, S.W, S.floor - y0); c.rect(a, y0, b - a, S.floor - y0); c.clip("evenodd");
    D.fill(0, y0, S.W, S.name.top - 12 - y0, C.ink, 252 / 255 * k); c.restore();   // 3.15: above the name's box
    return [a, b];
  }
  function darkness(t, lt, dur, S) {
    SB.noMeter = true;
    const T = TH(S), q = T.q, on = t >= ON && !(t >= ON + 0.05 && t < ON + 0.1);
    const zr = (1.28 + 0.04 * seg(t, 135.4, 137.4)) / 1.28, cxw = 710 + 8 * wob(t, 0.25), cam = mkCam(T.x(cxw), S.floor, zr, T.x(960) - T.x(cxw), 0);
    const look = t < 136.05 ? 0 : t < 136.85 ? 1 : t < 137.12 ? 0 : -1;
    const blink = (t > 136.53 && t < 136.66) || (t > 135.58 && t < 135.66);
    const cm = mood(t, [[135.4, "normal"], [136.05, "look"], [136.85, "normal", "?"], [137.12, "scared", "!"]]);
    const rm = mood(t, [[135.4, "dot"], [136.05, "look"], [136.85, "dot"], [137.12, "wide"]]);
    const shrug = t > 136.85 && t < 137.12, o = { rdx: look * 2, cdx: -look * 2, rsq: rm.take, csq: cm.take };
    let E;
    clipBand(S, () => {
      cam.run(() => {
        E = puppet(S, T, t, T.x(PUPX));
        door(S, T, t, { locked: true });
        const [r, b] = sitters(S, T, t, o); hands(b, shrug ? 0.9 : 0.1, shrug ? 0.9 : 0.1); emote(b, cm);
      });
      if (on) { const [a, b] = spotHole(S, cam, T, 1); D.fill(a, S.floor - 4, b - a, 4, C.muted, (70 + 10 * Math.sin(t * 40)) / 255); }
      else {
        bandFill(S, C.ink, 1);
        if (!blink) cam.run(() => { const [, b] = sitters(S, T, t, { ...o, outline: true, col: C.bg }); emote(b, cm); });   // only they show in the dark
      }
      if (t > 136.95) darkEyes(E.map(([x, y]) => cam.pt(x, y)), backOut(seg(t, 136.95, 137.12)), t > 137.22 && t < 137.3, q * zr);   // ...something else is watching
    });
  }

  // ---------- 7 · WAS IT ALL FOR SHOW? (137.4–140.5) ----------
  const CXc = 1180, CYc = 805, CU = 42, SU = 16, SPLIT = B(204), GRIN = B(205), FLOOR_IN = CYc - 2.1 * CU;
  const SMALL = [
    { from: [CXc - 85, FLOOR_IN], to: 880, t0: SPLIT + 0.1, t1: SPLIT + 0.38, turn: 0, H: 70 },
    { from: [CXc + 85, FLOOR_IN], to: 1510, t0: SPLIT + 0.14, t1: SPLIT + 0.44, turn: 0, H: 80 },
    { from: [CXc, FLOOR_IN - 7.4 * SU], to: 1196, t0: SPLIT + 0.2, t1: SPLIT + 0.56, turn: 1, H: 170 },
  ];
  // one half of the giant costume, hinged at its outer edge; sxh = their cos(swing). (Body made square like our hero:
  // 10 CU tall instead of their 6, so everything above it sits 4 CU higher.)
  const CB = CYc - 12 * CU;
  function costumeHalf(S, T, side, sxh, off = 0) {   // 3.44: off slides the half sideways (the split); sxh stays 1
    const q = T.q, hx = CXc + side * 5 * CU, mx = x => T.x(hx + (x - hx) * sxh + side * off), my = y => T.y(y, CYc);
    const R = (x0, x1, y0, y1, fill, a = 1, line) => { const a0 = mx(x0), a1 = mx(x1), l = Math.min(a0, a1), w = Math.abs(a1 - a0); if (fill) D.fill(l, my(y0), w, my(y1) - my(y0), fill, a); if (line) D.rect(l, my(y0), w, my(y1) - my(y0), line, 1.25); };
    for (const lx of side < 0 ? [-4, -2] : [1, 3]) R(CXc + lx * CU, CXc + (lx + 1) * CU, CYc - 2.4 * CU, CYc - 0.1 * CU, C.pink, 1, C.ink);
    const x0 = side < 0 ? CXc - 5 * CU : CXc, x1 = x0 + 5 * CU;
    if (sxh < 0) {                                                                  // the inside: lining, a strut, zipper teeth
      R(x0, x1, CB, CYc - 2 * CU, C.bg, 1, C.ink);
      R(x0 + 0.25 * CU, x0 + 4.75 * CU, CYc - 7.6 * CU, CYc - 6.9 * CU, C.ink);
      for (let i = 0; i < 12; i++) { const zx = side < 0 ? CXc - 0.32 * CU : CXc + 0.04 * CU; R(zx, zx + 0.28 * CU, CB + 0.2 * CU + i * 0.8 * CU, CB + 0.6 * CU + i * 0.8 * CU, C.muted); }
    } else { R(x0, x1, CB, CYc - 2 * CU, C.pink, 0.35); R(x0, x1, CB, CYc - 2 * CU, null, 1, C.pink); }   // 3.44: a light pink shell, so the little ones read through
    if (side < 0) { const wx = mx(CXc - 0.5 * CU); D.vl(wx, my(CB - 2 * CU), my(CB), C.muted, 1); R(CXc - 2.8 * CU, CXc + 2.4 * CU, CB - 2.75 * CU, CB - 2.45 * CU, C.blue); }   // a halo on a wire...
    else { R(CXc + 0.8 * CU, CXc + 4.5 * CU, CB - 1 * CU, CB + 0.1 * CU, C.ink); for (const cx of [0.8, 2.5, 4.1]) R(CXc + cx * CU, CXc + (cx + 0.4) * CU, CB - 2.4 * CU, CB - 1 * CU, C.ink); }   // ...and a crown, askew
  }
  function reveal(t, lt, dur, S) {
    SB.noMeter = true;                                                              // (their corner-meter window closed at 132.3)
    const T = TH(S), q = T.q, y0 = top0(S), L = ease(seg(t, 137.4, 138.3)), pull = ease(seg(t, 137.4, 139.05));
    const zr = (lerp(1.28, 1.0, pull) + 0.012 * pulse(t, 5) * seg(t, 139, 140)) / 1.28;
    const cxw = lerp(710, 960, pull), cam = mkCam(T.x(cxw), S.floor, zr, T.x(960) - T.x(cxw), 0);
    const offL = w => cam.inv(-w - 20), offR = cam.inv(S.W + 20);                   // their exits (x −300, −560, +1150) run off our screen
    let E;
    clipBand(S, () => {
      D.alpha(L, () => D.corners(rr(S.main.left, y0 + 8, S.main.width, S.floor - y0 - 10), 0, C.muted, 1.25, 16));   // the lights come up: it's a stage
      cam.run(() => {
        for (const [x, col] of [[700, C.muted], [1180, C.pink]]) { D.fill(T.x(x) - 175 * q, y0 - 200, 350 * q, S.floor - y0 + 200, col, 45 / 255 * L * 0.5); D.fill(T.x(x) - 270 * q, S.floor - 4, 540 * q, 4, col, 80 / 255 * L); }   // warm spots fade up
        // the three little ones inside the giant costume; they tumble out when it splits open
        const smalls = out => SMALL.forEach((c, i) => {
          if ((t >= c.t0) !== out) return;
          const k = seg(t, c.t0, c.t1), wb = t > SPLIT && t < c.t0 ? Math.sin((t - SPLIT) * 34 + i * 2) * 0.14 : 0;
          const x = T.x(lerp(c.from[0], c.to, k)), fl = lerp(T.y(c.from[1], CYc), S.floor, k) - c.H * 4 * k * (1 - k) * q, land = t > c.t1 ? Math.exp(-(t - c.t1) * 10) : 0;
          const sheep = t > GRIN + i * 0.06, ss = 10 * SU * q;
          const md = mood(t, [[137.4, "normal"], [SPLIT + 0.03, "scared", i === 2 ? "!" : null], [GRIN + i * 0.06, "happy", i === 1 ? "sweat" : null]]);
          const b = body(S, x + wb * ss, ss, { floor: fl, sq: 0.3 * land + md.take, sx: c.turn ? Math.max(0.12, Math.abs(Math.cos(TAU * ease(k)))) : 1, dy: sheep ? 0.8 * pulse(t, 6) * SU * q : 0 });
          if (k > 0) hands(b, sheep ? (i === 2 ? 1.2 + 0.4 * Math.sin(t * 16) : 0.3) : 1.3, sheep ? (i === 0 ? 1.55 : 0.3) : 1.3);
          emote(b, md);
        });
        const uz = seg(t, SPLIT - 0.34, SPLIT - 0.04), sa = t - SPLIT;
        const sxh = 1, off = t < SPLIT ? 0 : easeOut(seg(t, SPLIT, SPLIT + 0.35)) * 3.2 * CU;   // 3.44: the halves slide apart instead of swinging
        smalls(false); costumeHalf(S, T, -1, sxh, off); costumeHalf(S, T, 1, sxh, off); smalls(true);
        if (t < SPLIT) { D.vl(T.x(CXc), T.y(CB, CYc), T.y(CYc - 2 * CU, CYc), C.ink, 1); const zy = T.y(lerp(CB + 0.1 * CU, CYc - 2.2 * CU, uz), CYc); D.fill(T.x(CXc) - 8 * q, zy - 4 * q, 16 * q, 28 * q, C.muted); }   // the zipper
        // a stagehand carries off the moon (on a string) and the paperclip planet (on a stick)
        const hx = lerp(T.x(1780), offL(300 * q), seg(t, 137.5, 140.15)), bob = Math.sin(t * 6) * 10, hy = T.y(815, 890);
        { const mxm = hx + (-130 + Math.sin(t * 3) * 20) * q, mym = T.y(290 + bob, 890), hand = [hx - 90 * q, T.y(735, 890)];
          D.path([hand, [mxm, hand[1]], [mxm, mym + 62 * q]], C.ink, 1); D.fill(mxm - 62 * q, mym - 62 * q, 124 * q, 124 * q, C.bg); D.rect(mxm - 62 * q, mym - 62 * q, 124 * q, 124 * q, C.ink, 1.25);
          const pxp = hx + 90 * q, pyp = T.y(470 + bob * 0.5, 890);
          D.vl(pxp, T.y(745, 890), pyp + 64 * q, C.ink, 2); D.fill(pxp - 64 * q, pyp - 64 * q, 128 * q, 128 * q, C.muted); D.hl(pxp - 100 * q, pxp + 100 * q, pyp, C.ink, 1.5);
          const mv = move("run", t, 3), b = body(S, hx, 130 * q, { dy: -mv.dy * 13 * q, col: C.ink }); D.fill(b.left, b.top - 3, b.width, 3, C.muted); }
        // the door rolls off on its casters, pulled by a rope from the wings
        const dk = easeIn(seg(t, 137.55, 138.95)), ddx = dk * (offR - (T.x(DX0) - 34 * q));
        if (dk < 0.999) { D.hl(T.x(DX1) + 54 * q + ddx, offR + 400, T.y(700, DBOT), C.ink, 1); door(S, T, t, { locked: true, lite: true, flat: true, dx: ddx, jit: 0.01 * Math.sin(t * 14) * seg(t, 137.55, 138.2) * 300 * q, lockSwing: 0.15 }); }
        // stagehands clear the basilisk cart
        const cartX = lerp(T.x(PUPX), offL(400 * q), easeIn(seg(t, 137.95, 139.7)));
        E = puppet(S, T, t, cartX, -1);
        const bx = cartX - 190 * q; D.hl(bx + 80 * q, cartX - 120 * q, T.y(790, PUPY), C.ink, 1);
        const mw = move("walk", t * 1.4, 2); body(S, bx, 130 * q, { dy: -mw.dy * 13 * q, col: C.ink });
      });
      const kc = 0.12 * (1 - ease(seg(t, 137.5, 138.5))), dw = 735 * kc * S.W / 1920;   // the house curtain eases open
      if (dw > 0.5) { const yb = S.name.top - 12; D.fill(0, y0, dw, yb - y0, C.ink); D.fill(S.W - dw, y0, dw, yb - y0, C.ink); }   // 3.15: above the name's box
      if (L < 1) { const [a, b] = spotHole(S, cam, T, 1 - L); D.fill(a, S.floor - 4, b - a, 4, C.muted, 70 * (1 - L) / 255); }
      darkEyes(E.map(([x, y]) => cam.pt(x, y)), 1 - seg(t, 137.45, 137.8), false, q * zr);
      // our two: stand up, gape at the scenery, then crack up
      cam.run(() => {
        const upK = seg(t, 137.72, 137.95), stand = t > 137.84, look = t < 138.4 ? -1 : t < SPLIT ? Math.sin((t - 138.4) * 5) : 1;
        const rm = mood(t, [[137.4, "wide"], [SPLIT + 0.1, "wide", "!"], [GRIN + 0.1, "closed"]]);
        const cm = mood(t, [[137.4, "scared"], [138.0, "look"], [SPLIT + 0.1, "scared", "!"], [GRIN + 0.1, "happy", "music"]]);
        const hp = Math.sin(upK * Math.PI) * 1.2, laugh = t > GRIN + 0.1;
        const [r, b] = sitters(S, T, t, { stand, rdx: look * 2, cdx: look * 2, rsq: rm.take, csq: cm.take,
          rdy: (hp + (laugh ? 0.4 * pulse(t, 5) : 0)) * 24 * q, cdy: (hp * 1.5 + (laugh ? 0.8 * pulse(t, 5) : 0)) * 26 * q });
        if (stand) { hands(r, laugh ? 0.9 : -0.9, laugh ? -1.1 : -0.9); hands(b, laugh ? 1.3 : 0.2, laugh ? 1.3 : 0.2); }
        emote(r, rm); emote(b, cm);
      });
    });
  }

  chapter("chorus4", 123.5, 140.5, [[123.5, redAlert], [126.0, loom], [128.0, flashback], [130.0, recursion], [132.0, ilya], [135.4, darkness], [137.4, reveal]]);
})();
