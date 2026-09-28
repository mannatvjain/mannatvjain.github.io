// c5 · Obsolete (73.0–95.4). The MLP dance class, the museum, the sharp left turn, the sleeping cloud guards, and
// Gato's cliff. Every time here is theirs, one for one (src/ch/c05_obsolete.js; table in
// docs/storyboard-timing/c5_obsolete.md): shot starts 73.0, 77.5, 81.0, 85.0, 88.0, 94.3; their PASSES schedule,
// camera keyframes, whips, hit constants (TADA B(115), PUFF B(116), THROW B(117)−.14, LAND B(117)+.26, SPIDER B(118),
// YANK B(121), LANDR B(122), BACK B(123), honks B(126)/B(127)/B(128)−.2, ROLL B(127)+.12, EXIT B(128)+.05,
// STOP B(130), CATCH +.36, POOF B(131), DOT0 B(132), POUNCE B(137), DROP +.32) and their easings.
// Staging: their 1920×1080 frame is fitted ("contain") into our frame, the photo strip plus the gap above the name,
// and everything is clipped to it. Their set (the net, the machine, the road, the clouds) goes through their camera
// with D.cam; characters stand on the name, with x through the same camera.
(() => {
  const { D, C, B, BEAT, seg, kf, ease, easeIn, easeOut, backOut, elasticOut, pulse, bpOf, clamp, lerp, hash, shakeXY, rr, move, mood, bell, wob, chapter } = window.__SB;
  const TAU = 2 * Math.PI;
  const arcPt = (a, b, h, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k) - h * 4 * k * (1 - k)];     // theirs
  const c2d = () => [...document.querySelectorAll("canvas[aria-hidden]")].pop().getContext("2d");
  const band = S => S.strip || rr(S.text.left, S.floor - 90, S.text.width, 80);
  const frame = S => { const r = band(S); return rr(r.left, r.top, r.width, Math.max(20, S.floor - r.top)); };
  function clip(rects, fn) { const c = c2d(); c.save(); c.beginPath(); for (const r of rects) c.rect(r.left, r.top, r.width, r.height); c.clip(); try { fn(); } finally { c.restore(); } }
  // their world → our frame: 1920×1080 fitted inside the frame, their ground line gy on the name (S.floor)
  function world(S, gy) {
    const f = frame(S), sc = Math.min(f.width / 1920, f.height / 1080);
    return { f, sc, x: wx => f.left + f.width / 2 + (wx - 960) * sc, y: wy => S.floor + (wy - gy) * sc };
  }
  // their camBegin(cx, cy, zoom): world point c lands at the frame's centre (their 960, 540), scaled by zoom
  function camera(W, c, z) {
    const ax = W.x(c[0]), ay = W.y(c[1]), bx = W.x(960), by = W.y(540);
    return { z, pt: (x, y) => [bx + (W.x(x) - ax) * z, by + (W.y(y) - ay) * z], draw: fn => D.cam(ax, ay, z, fn, bx - ax, by - ay) };
  }
  // their streaks(k, vert): a wash over the frame plus 15 long streaks (ours: grey bars and thin pink lines, H or V only)
  function streaks(f, k, vert, sc) {
    if (k < 0.02) return;
    D.fill(f.left, f.top, f.width, f.height, C.bg, 150 / 255 * k);
    for (let i = 0; i < 15; i++) {
      const span = vert ? f.width : f.height, run = vert ? f.height : f.width;
      const across = (i + hash(i * 5.3)) / 15 * span, th = Math.max(1, (14 + 46 * hash(i * 2.1)) * k * sc), len = run * (0.6 + hash(i * 7.7)), st = (hash(i * 3.9) - 0.35) * run;
      D.alpha(215 / 255 * k, () => {
        if (i % 3 === 2) { if (vert) D.vl(f.left + across, f.top + st, f.top + st + len, C.pink, 1.5); else D.hl(f.left + st, f.left + st + len, f.top + across, C.pink, 1.5); }
        else if (vert) D.fill(f.left + across - th / 2, f.top + st, th, len, i % 3 ? C.muted : C.rule); else D.fill(f.left + st, f.top + across - th / 2, len, th, i % 3 ? C.muted : C.rule);
      });
    }
  }
  // a sub-path of an orthogonal polyline between length fractions a..b (the travelling pulses)
  function cut(pts, a, b) {
    const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]));
    const L = d[d.length - 1] || 1;
    const at = s => { s = clamp(s) * L; let i = 1; while (i < pts.length - 1 && d[i] < s) i++; const k = d[i] > d[i - 1] ? clamp((s - d[i - 1]) / (d[i] - d[i - 1])) : 0; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k), i]; };
    const A = at(a), E = at(b), out = [[A[0], A[1]]];
    for (let i = A[2]; i < E[2]; i++) out.push(pts[i]);
    out.push([E[0], E[1]]); return out;
  }
  // a block (hero, researcher, dancer) with their clawd() squash: x scale 1 + .6·sq, y scale 1 − sq, bottom-anchored
  function block(x, bottom, s, o = {}) {
    const sq = o.sq || 0, w = s * (1 + sq * 0.6) * Math.max(0.08, Math.abs(o.sx ?? 1)), h = s * (1 - sq), top = bottom - h;
    if (o.outline) { D.fill(x - w / 2, top, w, h, C.bg, 1); D.rect(x - w / 2, top, w, h, o.col || C.ink, o.lw || 1.25); }
    else D.fill(x - w / 2, top, w, h, o.col || C.pink);
    return rr(x - w / 2, top, w, h);
  }
  const RES = S => S.u * 0.6, HERO = S => S.u * 1.5;
  // their sparkleBurst → a bracket pop; their sfx() → a bracket pop with a small mono word (pops in with backOut(age·5))
  function burst(r, age, life, R, col) { if (age < 0 || age > life) return; const k = age / life; D.alpha(1 - k, () => D.corners(r, 2 + R * easeOut(k), col, 1.5, 6)); }
  function sfx(word, x, y, age, life, col) {
    if (age < 0 || age > life) return;
    const k = backOut(age * 5), w = (word.length * 7 + 10) * k, h = 16 * k;
    D.alpha(1 - seg(age, life - 0.25, life), () => { if (k > 0.3) D.text(word, x, y + 4, C.ink, 10, "center"); D.corners(rr(x - w / 2, y - h / 2, w, h), 0, col, 1.5, 5); });
  }
  // the kart: a low outlined tub with two wheel squares; the driver sits in it (drawn first, the tub covers its bottom)
  function tub(x, bottom, hs, sx = 1) {
    const w = hs * 2.2 * sx, h = hs * 0.45, y = bottom - hs * 0.2 - h;
    D.fill(x - w / 2, y, w, h, C.bg, 1); D.rect(x - w / 2, y, w, h, C.ink, 1.25);
    D.sq(x - w * 0.3, bottom - hs * 0.12, hs * 0.26, C.ink); D.sq(x + w * 0.3, bottom - hs * 0.12, hs * 0.26, C.ink);
    return rr(x - w / 2, y, w, h);
  }
  function kart(x, bottom, hs, o = {}) {
    const seatB = bottom - hs * 0.35 - (o.dy || 0);
    const d = block(x + (o.lean || 0), seatB, hs, { sq: o.sq || 0, sx: o.sx });
    const k = tub(x, bottom, hs, o.sx ?? 1);
    return { d, k, box: rr(Math.min(d.left, k.left), d.top, Math.max(d.right, k.right) - Math.min(d.left, k.left), bottom - d.top) };
  }

  // =====================================================================================
  // SHOT 1 · 73.0–77.5 · "Forward MLP, backward, repeat": the dancers ARE the net
  // =====================================================================================
  const NET = [];
  [[3, 660], [4, 1050], [3, 1440]].forEach(([n, x], li) => { for (let i = 0; i < n; i++) NET.push({ li, x, y: 600 + (i - (n - 1) / 2) * 190, id: NET.length }); });
  const NU = 14, STEP = 42;
  const PASSES = [
    { d: 1, t0: B(107), st: BEAT / 2 }, { d: -1, t0: B(109), st: BEAT / 2 },
    { d: 1, t0: B(111), st: BEAT / 3 }, { d: -1, t0: B(112), st: BEAT / 3 }, { d: 1, t0: B(113), st: BEAT / 4 }
  ];
  const arrival = (P, li) => P.t0 + (P.d > 0 ? li : 2 - li) * P.st;
  function layerAt(t, li) {                                                   // theirs, verbatim
    let pos = 0, prev = 0, at = -99, d = 0;
    for (const P of PASSES) { const a = arrival(P, li); if (a <= t) { prev = pos; pos = P.d > 0 ? 1 : 0; at = a; d = P.d; } }
    const age = t - at;
    return { x: lerp(prev, pos, backOut(clamp(age / 0.2))) * STEP, hop: -bell(age, 0, 0.24) * 1.6, land: bell(age, 0.2, 0.38) * 0.16, glow: at > 0 ? Math.exp(-age * 2.4) : 0, d, age };
  }
  const link = (A, E) => { const mx = (A[0] + E[0]) / 2; return [[A[0], A[1]], [mx, A[1]], [mx, E[1]], [E[0], E[1]]]; };
  function mlp(t, lt, dur, S) {
    const W = world(S, 1080), f = W.f, sc = W.sc, r = band(S);
    const whip = seg(t, 77.28, 77.5);
    const [cx0, cy0, z0] = kf(t, [[73.2, [600, 578, 1.25]], [74.0, [1230, 578, 1.25]], [74.45, [1230, 578, 1.25]], [75.3, [600, 590, 1.28]], [75.55, [600, 590, 1.28]], [75.95, [960, 548, 1.0]]]);
    const cam = camera(W, [cx0 + 1700 * easeIn(whip), cy0], z0 + 0.02 * pulse(t, 7) + 0.035 * seg(t, 75.95, 77.25));
    const L = [0, 1, 2].map(li => layerAt(t, li));
    const ctr = NET.map(n => [n.x + L[n.li].x, n.y + L[n.li].hop * NU - 5 * NU]);
    const P = p => [W.x(p[0]), W.y(p[1])];
    clip([f], () => {
      D.fill(r.left, r.top, r.width, r.height, C.bg, 0.85);                   // their dance room: a wash over the photos
      cam.draw(() => {
        // node pads (their floor ellipses) and the glow around a lit dancer
        for (const n of NET) {
          const s = L[n.li], col = s.d > 0 ? C.blue : C.pink;
          D.alpha(s.glow > 0.05 ? (60 + 170 * s.glow) / 255 : 0.6, () => D.hl(W.x(n.x + STEP / 2 - 94), W.x(n.x + STEP / 2 + 94), W.y(n.y + 5), s.glow > 0.05 ? col : C.rule, 1.5));
          if (s.glow > 0.05) D.alpha(130 / 255 * s.glow * 1.6, () => D.corners(rr(W.x(ctr[n.id][0] - 95), W.y(ctr[n.id][1] - 80), 190 * sc, 160 * sc), 0, col, 1.25, 7));
        }
        // links (right-angled) with travelling pulses: w0 = t0 + (forward ? li : 1 − li)·st, p = (t − w0)/st, head min(1, p), tail p − .7
        for (let li = 0; li < 2; li++) for (const a of NET) if (a.li === li) for (const b of NET) if (b.li === li + 1) {
          const path = link(ctr[a.id], ctr[b.id]).map(P);
          D.path(path, C.muted, 0.8);
          for (const Q of PASSES) {
            const w0 = Q.t0 + (Q.d > 0 ? li : 1 - li) * Q.st, p = (t - w0) / Q.st;
            if (p <= 0 || p >= 1.7) continue;
            const pts = Q.d > 0 ? path : path.slice().reverse(), h = Math.min(1, p), tl = Math.max(0, p - 0.7), col = Q.d > 0 ? C.blue : C.pink;
            D.path(cut(pts, tl, h), col, 1.7);
            if (p < 1) { const q = cut(pts, h, h)[0]; D.sq(q[0], q[1], 24 * sc, col); }
          }
        }
        // the dancers: the layer's arrival hop (bell 0–.24 s, 1.6u), land squash (bell .2–.38 s, .16), step (backOut .2 s,
        // 42 px), glow (e^−2.4·age; lit above .32), on top of their move('bounce') at .35 dy / .5 squash
        for (const n of NET) {
          const s = L[n.li], m = move("bounce", t, n.id), lit = s.glow > 0.32, col = s.d > 0 ? C.blue : C.pink;
          const dy = s.hop + m.dy * 0.35, sq = s.land + m.sq * 0.5, side = 6 * NU * sc;
          const bottom = W.y(n.y + dy * NU - 2 * NU * (1 - sq));
          block(W.x(n.x + s.x), bottom, side, { sq, outline: !lit, col: lit ? col : C.ink });
        }
        // output: two squares fly out of each last-layer dancer on every forward arrival (their stars; .6 s)
        for (const Q of PASSES) if (Q.d > 0) for (const n of NET) if (n.li === 2) {
          const age = t - arrival(Q, 2);
          if (age > 0 && age < 0.6) for (let k = 0; k < 2; k++) {
            const a = (k - 0.5) * 0.7 + (n.id - 8) * 0.25, d = 60 + 260 * easeOut(age / 0.6), rad = 16 * (1 - age / 0.6);
            if (rad > 2) { const x = W.x(ctr[n.id][0] + Math.cos(a) * d), y = W.y(ctr[n.id][1] + Math.sin(a) * d); if (k) D.osq(x, y, 2 * rad * sc, C.blue, 1.25); else D.sq(x, y, 2 * rad * sc, C.blue); }
          }
        }
      });
      // the conductor stands on the name (x through the camera). The baton's down-stroke lands on every beat:
      // aR rises over the first 72% of the beat (ease), drops in the last 28% (easeIn); body bob −|sin(bp·π)|·.3
      const f0 = bpOf(t) - Math.floor(bpOf(t));
      const aR = f0 < 0.72 ? lerp(-0.15, 1.25, ease(f0 / 0.72)) : lerp(1.25, -0.15, easeIn((f0 - 0.72) / 0.28));
      const dyR = -Math.abs(Math.sin(bpOf(t) * Math.PI)) * 0.3;
      let zap = 99; for (const Q of PASSES) if (Q.d < 0) { const za = t - (arrival(Q, 0) + Q.st * 0.8); if (za >= 0) zap = Math.min(zap, za); }
      const zk = zap < 1.2 ? Math.exp(-zap * 2.2) : 0;
      const rs = RES(S), ru = rs / 6, rx = cam.pt(240, 905)[0];
      const body = block(rx, S.floor + (dyR - zk * 0.6) * ru * 3, rs, { col: C.ink });
      const raise = (Math.sin(aR) - Math.sin(-0.15)) / (Math.sin(1.25) - Math.sin(-0.15));
      const hx = body.right + rs * 0.5, hy = body.top + rs * 0.3, tip = [hx, hy - rs * (0.4 + 1.8 * raise)];
      D.hl(body.right, hx, hy, C.ink, 1.25); D.vl(hx, tip[1], hy, C.ink, 1.5);
      const aL = 0.35 + 0.5 * Math.sin(bpOf(t) * Math.PI) + zk * 0.8;                     // the free hand
      D.vl(body.left - 1, body.top + rs * 0.4 - rs * 0.6 * clamp(aL / 1.6), body.top + rs * 0.4, C.ink, 1.25);
      if (zk > 0.05) for (const k of [0.2, 0.5, 0.8]) D.vl(body.left + body.width * k, body.top - rs * 0.9 * zk, body.top, C.ink, 1);   // hair up
      // baton → input layer (forward, starts .2 s before t0) and input layer → baton (the error, over .8·st)
      for (const Q of PASSES) {
        const col = Q.d > 0 ? C.blue : C.pink, p = Q.d > 0 ? (t - (Q.t0 - 0.2)) / 0.2 : (t - arrival(Q, 0)) / (Q.st * 0.8);
        if (p <= 0 || p >= 1.6) continue;
        for (const n of NET) if (n.li === 0) {
          const q = cam.pt(ctr[n.id][0] - 3 * NU, ctr[n.id][1]), path = [tip, [tip[0], q[1]], q];
          D.path(cut(Q.d > 0 ? path : path.slice().reverse(), Math.max(0, p - 0.6), Math.min(1, p)), col, 1.4);
        }
      }
      if (zap < 0.5) burst(body, zap, 0.5, 110 * sc, C.pink);                           // zapped: their sparkleBurst, .5 s
      streaks(f, whip, false, sc);
    });
  }

  // =====================================================================================
  // SHOT 2 · 77.5–81.0 · "Now von Neumann's obsolete": the museum
  // =====================================================================================
  const TADA = B(115), PUFF = B(116), THROW = B(117) - 0.14, LAND = B(117) + 0.26, SPIDER = B(118);
  const TUBES = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) TUBES.push({ x: 915 + c * 54, y: 330 + r * 118, off: TADA + 0.3 + r * 0.17 + hash(r * 5 + c) * 0.12 });
  function oldMachine(t, W, sc) {
    const dying = seg(t, TADA + 0.25, PUFF), dead = t >= PUFF;
    const jx = t > TADA + 0.25 && t < PUFF + 0.3 ? (hash(Math.floor(t * 12) * 3.1) - 0.5) * 2 * 4 : 0;   // their jit(4), reseeded 12×/s
    const X = x => W.x(x + jx), Y = W.y, R = (x, y, w, h, col = C.ink, lw = 1.25) => D.rect(X(x), Y(y), w * sc, h * sc, col, lw);
    if (!dead) D.fill(X(80), Y(140), 1240 * sc, 660 * sc, C.pink, 0.07 * (1 - dying));   // the warm glow, fading as it dies
    D.fill(X(220), Y(240), 960 * sc, 560 * sc, C.bg, 1);
    for (let i = 0; i < 3; i++) R(220 + i * 320, 240, 320, 560, C.ink, 1.5);
    for (const [i, tx] of [[0, 630], [1, 700], [2, 770]]) {                                    // crown tubes: out at PUFF − .12 + i·.05
      const on = t < PUFF - 0.12 + i * 0.05, h = i === 1 ? 118 : 96;
      if (on) D.fill(X(tx - 22), Y(222 - h), 44 * sc, (h + 4) * sc, C.pink, 0.85);
      R(tx - 22, 222 - h, 44, h + 4, on ? C.pink : C.muted, 1);
    }
    R(205, 222, 990, 30);
    // reel-to-reel tapes: spin at 5 rad/s, then slow to a stop over .7 s from TADA + .25
    const tau = clamp(t - (TADA + 0.25), 0, 0.7), ang = t < TADA + 0.25 ? t * 5 : (TADA + 0.25) * 5 + 5 * (tau - tau * tau / 1.4);
    for (const rx of [315, 445]) {
      R(rx - 62, 268, 124, 124);
      for (let k = 0; k < 3; k++) { const a = ang + k * TAU / 3; D.sq(X(rx + Math.cos(a) * 32), Y(330 + Math.sin(a) * 32), 22 * sc, C.muted); }
    }
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) {                                 // blinkers, 6 Hz, thinning as it dies
      const on = !dead && hash(i * 4 + j + Math.floor(t * 6)) > 0.45 * (1 + dying), x = X(270 + j * 60), y = Y(520 + i * 60);
      if (on) D.sq(x, y, 22 * sc, (i + j) % 3 ? C.pink : C.blue); else D.osq(x, y, 22 * sc, C.muted, 1);
    }
    const look = seg(t, TADA, TADA + 0.2), droop = seg(t, PUFF, PUFF + 0.3);                   // dial needles: beat swing, glance, droop
    for (const [dx, side] of [[640, -1], [800, 1]]) {
      R(dx - 64, 326, 128, 128);
      let a = -Math.PI / 2 + 0.55 * Math.sin(bpOf(t) * Math.PI);
      a = lerp(a, -Math.PI / 2 + 0.9, look); a = lerp(a, Math.PI / 2 - side * 0.75, droop);
      D.sq(X(dx + Math.cos(a) * 44), Y(390 + Math.sin(a) * 44), 16 * sc, C.pink); D.sq(X(dx), Y(390), 12 * sc, C.ink);
    }
    for (let k = 0; k < 7; k++) {                                                              // the lamp row: runs at 8 Hz, then goes out left to right
      const on = !dead && (t < TADA ? (k + Math.floor(t * 8)) % 3 !== 0 : k > dying * 7), y = 505 - (dead ? Math.sin(k / 6 * Math.PI) * -14 : 0);
      if (on) D.sq(X(600 + k * 40), Y(y), 24 * sc, k % 3 === 1 ? C.blue : C.pink); else D.osq(X(600 + k * 40), Y(y), 24 * sc, C.muted, 1);
    }
    for (let i = 0; i < 3; i++) R(590 + i * 90, 600, 60, 150, C.muted, 1);
    for (const tb of TUBES) {                                                                  // vacuum tubes pop one by one
      const on = t < tb.off, pop = t - tb.off;
      R(tb.x - 17, tb.y + 16, 34, 20, C.ink, 1);
      if (on) D.fill(X(tb.x - 16), Y(tb.y - 58), 32 * sc, 76 * sc, C.pink, 0.85);
      R(tb.x - 16, tb.y - 58, 32, 76, on ? C.pink : C.muted, 1);
      if (pop > 0 && pop < 0.25) D.alpha(150 / 255 * (1 - pop / 0.25), () => D.osq(X(tb.x), Y(tb.y - 60 - pop * 120), 2 * (10 + pop * 60) * sc, C.muted, 1));
    }
  }
  function smoke(sa, W, sc) {                                                                  // the final sigh at PUFF: 7 puffs, 1.6 s
    if (sa <= 0 || sa > 1.6) return;
    for (let i = 0; i < 7; i++) {
      const a = sa - i * 0.035; if (a <= 0) continue;
      const R = ((70 + hash(i + 1) * 60) * easeOut(clamp(a / 0.3)) + a * 50) * (1 - ease(seg(a, 0.9, 1.55)));
      if (R < 4) continue;
      const x = 330 + i * 125 + Math.sin(i * 2.3) * 40 + a * 30 * Math.sin(i), y = 235 - a * 130 - hash(i) * 40;
      D.fill(W.x(x) - R * sc, W.y(y) - R * 0.78 * sc, 2 * R * sc, 1.56 * R * sc, C.bg, 0.9);
      D.rect(W.x(x) - R * sc, W.y(y) - R * 0.78 * sc, 2 * R * sc, 1.56 * R * sc, i % 2 ? C.muted : C.rule, 1);
    }
  }
  function museum(t, lt, dur, S) {
    const W = world(S, 805), f = W.f, sc = W.sc, r = band(S);
    const arrive = 1 - easeOut(seg(t, 77.5, 77.74)), sp = ease(seg(t, SPIDER - 0.15, 81));
    const cx = lerp(930 - 1500 * arrive + 50 * ease(seg(t, 78, 79)) - 50 * ease(seg(t, 79.6, 80.4)), 720, sp);
    const zoom = lerp(0.97 + 0.03 * ease(seg(t, 77.6, 80.5)), 1.32, sp);
    const [sx, sy] = t > PUFF && t < PUFF + 0.35 ? shakeXY(t, 8) : [0, 0];
    const cam = camera(W, [cx + sx, lerp(540, 330, sp) + sy], zoom);
    clip([f], () => {
      D.fill(r.left, r.top, r.width, r.height, C.bg, 0.85);                                  // the museum room
      cam.draw(() => {
        if (t < LAND) oldMachine(t, W, sc);
        // the newcomer on a plinth, wheeled in by the guide (easeOut 77.5–78.35 from 2150 to 1680)
        const gx = lerp(2150, 1680, easeOut(seg(t, 77.5, 78.35))), px = gx - 250, walking = t < 78.35;
        const tada = seg(t, TADA - 0.05, TADA + 0.15), throwK = bell(t, THROW - 0.25, THROW + 0.25);
        if (t > TADA) D.alpha(seg(t, TADA, TADA + 0.15), () => {                                // the spotlight snaps on at TADA
          D.fill(W.x(px - 150), f.top - 200, 300 * sc, W.y(626) - f.top + 200, C.blue, 0.06);
          D.vl(W.x(px - 150), f.top - 200, W.y(626), C.muted, 1, [2, 4]); D.vl(W.x(px + 150), f.top - 200, W.y(626), C.muted, 1, [2, 4]);
        });
        D.fill(W.x(px - 84), W.y(640), 168 * sc, 140 * sc, C.bg, 1); D.rect(W.x(px - 84), W.y(640), 168 * sc, 140 * sc, C.ink, 1.25);
        D.rect(W.x(px - 100), W.y(626), 200 * sc, 20 * sc, C.ink, 1); D.rect(W.x(px - 110), W.y(780), 220 * sc, 22 * sc, C.ink, 1);
        for (const wx of [-80, 80]) D.sq(W.x(px + wx), W.y(806), 18 * sc, C.ink);
        const hs = HERO(S), nm = move("idle", t, 3), md = mood(t, [[77, "shades"], [TADA + 0.2, "happy"]]);
        const hero = block(W.x(px), W.y(626) + (nm.dy - bell(t, TADA - 0.05, TADA + 0.3) * 1.2) * hs / 8, hs, { sq: nm.sq + md.take });
        const armUp = 0.2 + 1.1 * tada;                                                         // both arms up on TADA
        if (armUp > 0.4) { D.vl(hero.left - 2, hero.top + hs * 0.5 - hs * 0.5 * clamp(armUp / 1.3), hero.top + hs * 0.5, C.pink, 2); D.vl(hero.right + 2, hero.top + hs * 0.5 - hs * 0.5 * clamp(armUp / 1.3), hero.top + hs * 0.5, C.pink, 2); }
        if (t > TADA) for (let i = 0; i < 5; i++) { const a = t * 1.5 + i * TAU / 5, rad = 12 + 6 * Math.sin(t * 9 + i), x = W.x(px + Math.cos(a) * 150), y = W.y(530 + Math.sin(a) * 60); if (i % 2) D.osq(x, y, 2 * rad * sc, C.blue, 1); else D.sq(x, y, 2 * rad * sc, C.pink); }
        burst(hero, t - TADA, 0.5, 200 * sc * 0.5, C.pink);
        // the guide: walks in (move 'walk'), a little hop on TADA, lifts to throw the sheet (bell THROW ± .25)
        const gs = S.u * 1.1, gm = move("walk", t, 1);
        const gdy = walking ? gm.dy : -bell(t, TADA - 0.1, TADA + 0.2) * 0.8 - throwK * 0.6;
        const guide = block(W.x(gx), W.y(805) + gdy * gs / 8, gs, { outline: true });
        const aL = walking ? 0 : lerp(lerp(0.1, 1.0, tada * (1 - seg(t, 79.2, 79.6))), 1.5, throwK);
        if (aL > 0.3) D.vl(guide.left - 2, guide.top + gs * 0.5 - gs * 0.6 * clamp(aL / 1.5), guide.top + gs * 0.5, C.ink, 1.25);
        D.vl(guide.right + 2, guide.top - gs * 0.3, guide.top + gs * 0.5, C.ink, 1.25); D.fill(guide.right + 2, guide.top - gs * 0.3, gs * 0.35, gs * 0.22, C.pink);   // the guide's little flag
        // the dust sheet: thrown at THROW, flies an arc (1650,560) → (700,470) h 380 (easeOut), unfurls (scale .12 → 1, easeIn),
        // lands at LAND and settles over .2 s
        if (t >= THROW) {
          const k = seg(t, THROW, LAND), bump = [[630, 96], [700, 118], [770, 96]];
          let mx = x => x, my = y => y, lift = 0, flut = 0;
          if (k < 1) {                                                                            // in flight: their drape, scaled about (700, 515) and carried on the arc
            const c = arcPt([1650, 560], [700, 470], 380, easeOut(k)), s2 = lerp(0.12, 1, easeIn(k)), sy = s2 * (1 - 0.5 * (1 - k)), b = easeIn(k) * easeIn(k);
            mx = x => lerp(c[0] + (x - 700) * s2, x, b); my = y => lerp(c[1] + (y - 515) * sy, y, b); flut = Math.sin(t * 30) * 30 * (1 - k) * (1 - b);
          } else { const settle = 1 - seg(t, LAND, LAND + 0.2); lift = settle * 26 * Math.sin(settle * 5); }
          const ty = y => W.y(my(y) - lift + flut), X = x => W.x(mx(x));
          if (t >= LAND) D.fill(W.x(180), W.y(700), 1080 * sc, 110 * sc, C.ink, 50 / 255);
          const pts = [[X(160), ty(226)]];
          for (const [tx, h] of bump) pts.push([X(tx - 26), ty(226)], [X(tx - 26), ty(226 - h - 8)], [X(tx + 26), ty(226 - h - 8)], [X(tx + 26), ty(226)]);
          pts.push([X(1240), ty(226)], [X(1240), W.y(my(806))], [X(160), W.y(my(806))], [X(160), ty(226)]);
          D.fill(X(160), ty(226), X(1240) - X(160), W.y(my(806)) - ty(226), C.rule, 1);
          for (const [tx, h] of bump) D.fill(X(tx - 26), ty(226 - h - 8), X(tx + 26) - X(tx - 26), ty(226) - ty(226 - h - 8), C.rule, 1);
          D.path(pts, C.ink, 1.5);
          if (t >= LAND) {                                                                        // shapes under the sheet, folds, the dust it throws up (.6 s)
            for (const rx of [315, 445]) D.rect(W.x(rx - 58), W.y(274), 116 * sc, 112 * sc, C.muted, 1);
            for (const dx of [640, 800]) D.rect(W.x(dx - 60), W.y(332), 120 * sc, 116 * sc, C.muted, 1);
            for (const fx of [300, 560, 880, 1110]) D.vl(W.x(fx - 30), W.y(300), W.y(800), C.muted, 1, [3, 3]);
            const la = t - LAND; for (let i = 0; i < 5; i++) { const R = 30 + la * 120; D.alpha(130 / 255 * clamp(1 - la / 0.6), () => D.rect(W.x(160 + i * 270) - R * sc, W.y(800 - la * 60) - R * 0.8 * sc, 2 * R * sc, 1.6 * R * sc, C.muted, 1)); }
          }
        }
        smoke(t - PUFF, W, sc);
        if (t >= SPIDER) {                                                                        // the spider boings down onto the middle bump (elasticOut .5 s)
          const k = t - SPIDER, y = lerp(-160, 42, elasticOut(clamp(k / 0.5)));
          D.vl(W.x(700), W.y(-300), W.y(y), C.ink, 1); D.sq(W.x(700), W.y(y + 30), 50 * sc, C.ink);
          for (const s of [-1, 1]) for (let j = 0; j < 2; j++) D.hl(W.x(700 + s * 22), W.x(700 + s * (46 + 6 * Math.sin(t * 16 + j))), W.y(y + 20 + j * 18), C.ink, 1);
        }
        D.hl(W.x(120), W.x(1280), W.y(812), C.pink, 2, [4, 3]);                                  // the velvet rope, in front
        for (const px2 of [120, 700, 1280]) { D.vl(W.x(px2), W.y(776), W.y(930), C.ink, 1.5); D.sq(W.x(px2), W.y(776), 14 * sc, C.ink); }
      });
      streaks(f, arrive, false, sc);
      streaks(f, seg(t, 80.93, 81.0) * 0.75, false, sc);
    });
  }

  // =====================================================================================
  // SHOT 3 · 81.0–85.0 · "Sharp left turn and there you are"
  // =====================================================================================
  const ROADP = [[1236, 470], [1266, 490], [1196, 522], [968, 562], [814, 612], [836, 668], [1000, 728], [1106, 790], [1122, 850]];
  function spline(P, per = 6) {                                                                   // theirs (Catmull-Rom), for the kart's path
    const o = [];
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < per; k++) { const s = k / per, s2 = s * s, s3 = s2 * s; o.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * s + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * s2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * s3))); }
    }
    o.push(P[P.length - 1]); return o;
  }
  function along(P, k) {
    const d = []; let L = 0;
    for (let i = 1; i < P.length; i++) { const s = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); d.push(s); L += s; }
    let s = clamp(k) * L;
    for (let i = 0; i < d.length; i++) { if (s <= d[i] || i === d.length - 1) { const f = d[i] ? clamp(s / d[i]) : 0; return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f)]; } s -= d[i]; }
    return P[0];
  }
  const ROAD = spline(ROADP, 5);
  const hwY = y => 3 + Math.max(0, y - 468) * 0.44;
  const YANK = B(121), LANDR = B(122), BACK = B(123);
  function road(t, lt, dur, S) {
    const W = world(S, 945), f = W.f, sc = W.sc, r = band(S);
    const whipK = seg(t, YANK, YANK + 0.28), tilt = easeIn(seg(t, 84.52, 85.0));
    const kk = lerp(0.1, 1, Math.pow(seg(t, 81.0, YANK), 1.2)), K = along(ROAD, kk);
    const post = ease(seg(t, YANK, YANK + 0.4)), cx = lerp(lerp(1030, K[0], 0.22), 440, easeOut(whipK) * 0.6 + ease(whipK) * 0.4), cy = lerp(560, 690, post) - 1450 * tilt;
    const [shx, shy] = t > LANDR && t < LANDR + 0.2 ? shakeXY(t, 10) : [0, 0];
    const zoom = lerp(1 + 0.08 * seg(t, 81, YANK), 1.2, post), cam = camera(W, [cx + shx, cy + shy], zoom);
    const drop = 1450 * tilt * sc * zoom;                                                          // the tilt up at 84.52 carries the ground out the bottom
    const hs = HERO(S), rs = RES(S), fl = S.floor + drop;
    clip([f], () => {
      D.fill(r.left, r.top, r.width, r.height, C.bg, 0.85);                                       // the desert
      cam.draw(() => {
        D.hl(W.x(-1400), W.x(3000), W.y(468), C.rule, 1.25);                                      // the horizon
        const cp = []; ROADP.forEach((p, i) => { if (i) cp.push([p[0], ROADP[i - 1][1]]); cp.push(p); });
        D.path(cp.map(p => [W.x(p[0]), W.y(p[1])]), C.muted, 1, [4, 5]);                         // the approach road, in right angles
        D.hl(W.x(-1500), W.x(930), W.y(760), C.muted, 1);
        for (let x = -1400; x < 1000; x += 160) D.hl(W.x(x), W.x(x + 80), W.y(935), C.muted, 1.5);
        // the hairpin sign boings when the kart sees it at B(120): scale 1 + .18·e^−4(t−B(120)), shaking at 40 rad/s
        const boing = t > B(120) ? Math.exp(-(t - B(120)) * 4) : 0, rad = 92 * (1 + 0.18 * boing) * 0.75, wig = 0.12 * boing * Math.sin(t * 40) * 92;
        D.vl(W.x(1440), W.y(480), W.y(780), C.ink, 1.25);
        const sgn = rr(W.x(1440 + wig - rad), W.y(480 - rad), 2 * rad * sc, 2 * rad * sc);
        D.fill(sgn.left, sgn.top, sgn.width, sgn.height, C.bg, 1); D.rect(sgn.left, sgn.top, sgn.width, sgn.height, C.ink, 1.5);
        const gx = sgn.left + sgn.width * 0.5, gw = sgn.width * 0.22;
        D.path([[gx + gw, sgn.bottom - sgn.height * 0.18], [gx + gw, sgn.top + sgn.height * 0.3], [gx - gw, sgn.top + sgn.height * 0.3], [gx - gw, sgn.top + sgn.height * 0.62]], C.pink, 2);
        // skid marks laid down behind the kart as it whips left (easeIn .55 s)
        const kx = t < YANK ? 9999 : lerp(1080, -1000, easeIn(seg(t, YANK, YANK + 0.55)));
        if (t > YANK) for (const off of [-20, 26]) D.hl(W.x(Math.max(kx, -900)), W.x(1150), W.y(918 + off), C.ink, 2.4);
        for (let i = 0; i < 12; i++) {                                                            // dust through the turn, every .045 s, 1.4 s life
          const ts = YANK + i * 0.045, age = t - ts; if (age < 0) continue;
          const px = lerp(1080, -1000, easeIn(seg(ts, YANK, YANK + 0.55))), R = 40 + age * 150;
          D.alpha(170 / 255 * clamp(1 - age / 1.4) * 0.8, () => D.rect(W.x(px + 60 + hash(i) * 40) - R * sc, W.y(925 - age * 80 - hash(i + 2) * 40) - R * 0.8 * sc, 2 * R * sc, 1.6 * R * sc, C.muted, 1));
        }
        if (t < YANK) {
          for (let i = 6; i >= 1; i--) { const kq = kk - i * 0.022; if (kq > 0) { const p = along(ROAD, kq), R = Math.max(8, hwY(p[1]) * (0.28 + i * 0.07)); D.alpha((130 - i * 16) / 255, () => D.rect(W.x(p[0]) - R * sc, W.y(p[1] - hwY(p[1]) * 0.3) - R * 0.8 * sc, 2 * R * sc, 1.6 * R * sc, C.muted, 1)); } }
          // the kart comes down the road at us (front view): size from the road width, wobble sin(7t), lean into the turn from YANK − .12
          const s = Math.max(1.3, hwY(K[1]) / 8), h2 = hs * s / 17, sign = t > B(120);
          const lean = (Math.sin(t * 5) * 0.04 + (t > YANK - 0.12 ? -0.18 * seg(t, YANK - 0.12, YANK) : 0)) * h2 * 3;
          const md = mood(t, [[80, "happy"], [B(120) + 0.05, "narrow"]]);
          const x = W.x(K[0] + Math.sin(t * 7) * s * 0.5), y = W.y(K[1] + s * 0.8);
          const rb = block(x + h2 * 0.55 + lean, y - 3.4 * s * sc, rs * s / 17 * 1.4, { col: C.ink });  // the Researcher rides behind (their rider at 2.7s, −3.4s)
          kart(x, y, h2, { lean, sq: md.take, dy: Math.abs(Math.sin(t * 9)) * 0.15 * h2 / 8 });
          if (sign) D.alpha(0.9, () => D.vl(rb.right + 1, rb.top - rb.height * 0.8, rb.top + rb.height * 0.3, C.ink, 1));   // the rider sees the sign
        }
        sfx("SKRRT", W.x(lerp(1000, 760, post)), W.y(640), t - YANK, 0.72, C.pink);
      });
      // on the name: the kart after the yank (side view, easeIn .55 s off to the left), the Researcher flung in an arc
      // (h 1100) that lands at LANDR, then the kart comes back around at BACK
      if (t >= YANK && t < YANK + 0.6) {
        const x = cam.pt(lerp(1080, -1000, easeIn(seg(t, YANK, YANK + 0.55))), 940)[0];
        kart(x, fl, hs, { lean: -0.16 * bell(t, YANK, YANK + 0.5) * hs * 3 });
      }
      if (t > BACK - 0.3) {
        const x = cam.pt(lerp(-800, 150, easeOut(seg(t, BACK - 0.3, BACK + 0.05))), 945)[0];
        const md = mood(t, [[BACK - 0.3, "narrow"], [BACK + 0.1, "wink"]]);
        const kb = kart(x, fl, hs, { lean: 0.08 * bell(t, BACK - 0.05, BACK + 0.25) * hs * 3, sq: md.take });
        burst(kb.box, t - (BACK + 0.1), 0.5, 14, C.blue);                                          // "there you are" (their wink + music emote)
      }
      if (t >= YANK) {
        const P0 = [1160, 700], P1 = [480, 910];
        if (t < LANDR) {
          const k = seg(t, YANK, LANDR), p = arcPt(P0, P1, 1100, k);
          block(cam.pt(p[0], p[1])[0], fl - (P1[1] - p[1]) * sc * zoom, rs, { col: C.ink, sx: Math.cos(k * TAU * 1.5) });
        } else {
          const a = t - LANDR, sq = 0.28 * Math.exp(-a * 6) * Math.cos(a * 22), sway = Math.sin(t * 5) * 0.08 * (1 - seg(t, BACK + 0.2, BACK + 0.6));
          const x = cam.pt(P1[0], P1[1])[0], rb = block(x + sway * rs * 3, fl, rs, { col: C.ink, sq });
          const look = t > BACK - 0.05;
          if (!look || t < BACK + 0.35) for (let i = 0; i < 3; i++) { const an = t * 7 + i * TAU / 3; D.sq(x + Math.cos(an) * 60 * sc * zoom, rb.top - 6 + Math.sin(an) * 16 * sc * zoom, 4, C.pink); }
          if (t > BACK + 0.35) D.alpha(seg(t, BACK + 0.35, BACK + 0.6), () => D.sq(rb.right + 3, rb.top - 2, 3, C.blue));   // sweat
          if (a < 0.25) for (const sd of [-1, 1]) { const R = (30 + a * 100) * sc; D.alpha(160 / 255 * (1 - a / 0.25), () => D.rect(x + sd * (50 + a * 300) * sc - R, fl - 2 * R, 2 * R, 1.6 * R, C.muted, 1)); }
        }
      }
      streaks(f, bell(t, YANK + 0.02, YANK + 0.3) * 0.8, false, sc);
      streaks(f, (1 - seg(t, 81.0, 81.13)) * 0.75, false, sc);
      streaks(f, seg(t, 84.78, 85.0), true, sc);
    });
  }

  // =====================================================================================
  // SHOT 4 · 85.0–88.0 · "Without a single CDR": the cloud guards sleep through it all
  // =====================================================================================
  const CLOUDS = [
    { x: 250, y: 250, r: 190, seed: 1, lamp: 1, sway: 0.5 }, { x: 720, y: 200, r: 165, seed: 2, bino: 1 },
    { x: 1215, y: 262, r: 210, seed: 3, lamp: 1, roller: 1 }, { x: 1690, y: 210, r: 180, seed: 4, bino: 1, lamp: -1, sway: 0.3 },
    { x: 470, y: -270, r: 150, seed: 5 }, { x: 1450, y: -300, r: 160, seed: 6, bino: 1 }
  ];
  const ROLL = B(127) + 0.12, EXIT = B(128) + 0.05, GY = 668;
  const DC = [960, 805], DRX = 430, DRY = 84, DTH = t => 2.1766 - 5.2 * (t - 85);
  const donut = t => { const th = DTH(t); return [DC[0] + DRX * Math.cos(th), DC[1] + DRY * Math.sin(th), th]; };
  function cloudGuard(G, t, W, sc) {
    const roll = G.roller ? ease(seg(t, ROLL, ROLL + 0.55)) : 0, rot = -Math.PI * roll - 0.15 * bell(t, ROLL + 0.4, ROLL + 0.8), capFall = G.roller ? t - (ROLL + 0.3) : -1;
    const br = 1 + 0.04 * Math.sin(t * 1.9 + G.seed * 2), r = G.r;                                 // breathing
    const lx = (G.lamp || 1) * r * 0.92, ly = r * 0.32, Rt = (x, y, a = rot) => [G.x + x * Math.cos(a) - y * Math.sin(a), G.y + x * Math.sin(a) + y * Math.cos(a)];
    const Lw = Rt(lx, ly);
    const droop = Math.PI / 2 - 0.18 * (G.lamp || 1) + (G.sway || 0.2) * Math.sin(t * 0.8 + G.seed) * (G.lamp || 1);
    const aim = G.roller ? lerp(droop, -Math.PI / 2 - 0.25, roll) : droop;
    if (G.lamp) {                                                                                  // the searchlight, drooping to the sand (right-angled)
      const L = [Lw[0] + Math.cos(aim) * r * 0.14, Lw[1] + Math.sin(aim) * r * 0.14];
      const Dd = Math.sin(aim) > 0.2 ? (GY - L[1]) / Math.sin(aim) : 900, E = [L[0] + Math.cos(aim) * Dd, L[1] + Math.sin(aim) * Dd], my = (L[1] + E[1]) / 2;
      D.alpha(0.55, () => D.path([L, [L[0], my], [E[0], my], E].map(p => [W.x(p[0]), W.y(p[1])]), C.muted, 1, [2, 3]));
      const wE = 115 + 20 * Math.sin(t * 2 + G.seed);
      if (Math.sin(aim) > 0.2) D.alpha(0.6, () => D.hl(W.x(E[0] - wE), W.x(E[0] + wE), W.y(GY + 8), C.blue, 2));
      D.sq(W.x(Lw[0]), W.y(Lw[1]), 22 * sc, C.ink);
    }
    const w = 2 * r * br * Math.max(0.08, Math.abs(Math.cos(Math.PI * roll))), h = 2 * r * 0.56 / br;
    D.fill(W.x(G.x) - w * sc / 2, W.y(G.y) - h * sc / 2, w * sc, h * sc, C.bg, 1);
    D.rect(W.x(G.x) - w * sc / 2, W.y(G.y) - h * sc / 2, w * sc, h * sc, C.ink, 1.25);
    if (capFall < 0) { const c = Rt(-r * 0.05, -r * 0.5); D.fill(W.x(c[0]) - 0.34 * r * sc, W.y(c[1]) - 0.1 * r * sc, 0.68 * r * sc, 0.2 * r * sc, C.ink); }
    else {                                                                                         // the roller's cap tumbles off and lands in the sand
      const r0 = -Math.PI * ease(seg(ROLL + 0.3, ROLL, ROLL + 0.55)), lx0 = -r * 0.05, ly0 = -r * 0.5;
      const x0 = G.x + lx0 * Math.cos(r0) - ly0 * Math.sin(r0), y0 = G.y + lx0 * Math.sin(r0) + ly0 * Math.cos(r0), yL = GY + 12;
      const aL = (200 + Math.sqrt(40000 + 5200 * (yL - y0))) / 2600, a = Math.min(capFall, aL), bo = capFall > aL ? 14 * Math.exp(-(capFall - aL) * 9) * Math.abs(Math.sin((capFall - aL) * 18)) : 0;
      const cx = x0 + 150 * a, cy = Math.min(yL, y0 - 200 * a + 1300 * a * a) - bo;
      D.fill(W.x(cx) - 0.34 * r * sc, W.y(cy) - 0.1 * r * sc, 0.68 * r * sc, 0.2 * r * sc, C.ink);
    }
    const mumble = G.roller && roll > 0.02 && roll < 0.98;
    if (!mumble) for (let i = 0; i < 2; i++) {                                                     // zzz (the roller stops while it turns over)
      const ph = (t * 0.75 + G.seed * 0.37 + i * 0.5) % 1, zx = G.x + r * 0.55 + ph * 60 + Math.sin(ph * 6 + G.seed) * 14, zy = G.y - r * 0.45 - ph * 150;
      D.alpha(Math.sin(ph * Math.PI), () => D.text("z", W.x(zx), W.y(zy), C.muted, Math.max(8, r * (0.2 + ph * 0.18) * sc)));
    }
  }
  function cdr(t, lt, dur, S) {
    const W = world(S, 889), f = W.f, sc = W.sc, r = band(S);
    const cy = lerp(-250, 540, easeOut(seg(t, 85.0, 86.0))), cx = 960 + 300 * ease(seg(t, EXIT, 88.05));
    const honks = [B(126), B(127), B(128) - 0.2], hk = Math.max(...honks.map(h => t >= h ? Math.exp(-(t - h) * 8) : 0));
    const [shx, shy] = shakeXY(t, 5 * hk);
    const zoom = 1.02 + 0.08 * seg(t, 85.8, 88) + 0.015 * hk, cam = camera(W, [cx + shx, cy + shy], zoom);
    const rise = Math.max(0, (540 - cy)) * sc * zoom, fl = S.floor + rise;                          // the tilt down brings the ground in from below
    clip([f], () => {
      D.fill(r.left, r.top, r.width, r.height, C.bg, 0.85);                                        // the sunset sky
      cam.draw(() => {
        D.hl(W.x(-1400), W.x(3400), W.y(600), C.rule, 1.25);
        D.hl(W.x(-1400), W.x(3400), W.y(700), C.muted, 1); D.hl(W.x(-1400), W.x(3400), W.y(906), C.muted, 1);
        for (let x = -1400; x < 3400; x += 170) if (Math.abs(x + 40 - 960) > 520) D.hl(W.x(x), W.x(x + 80), W.y(805), C.muted, 1.4);
        const laps = clamp((t - 85.3) / 2);                                                        // the donut rings, darker as laps pile up
        for (const [o, w] of [[0, 2.2], [16, 1.6], [-14, 1.2]]) if (laps > 0.05) D.rect(W.x(DC[0] - DRX - o), W.y(DC[1] + o * 0.25 - DRY - o * 0.25), 2 * (DRX + o) * sc, 2 * (DRY + o * 0.25) * sc, C.ink, Math.max(0.5, w * laps));
        for (const G of CLOUDS) cloudGuard(G, t, W, sc);
        const h0 = donut(honks[0]);
        sfx("HONK", W.x(h0[0] - 40), W.y(610), t - honks[0], 0.9, C.ink);
      });
      // on the name: donuts around the dazed Researcher, clockwise at 5.2 rad/s; breaks out at EXIT (1900·(t−EXIT)^1.4)
      const hs = HERO(S), rs = RES(S), X = x => cam.pt(x, 889)[0];
      const out = t > EXIT, [dx, , th] = donut(Math.min(t, EXIT)), ex = out ? dx + 1900 * Math.pow(t - EXIT, 1.4) : dx;
      const facing = out ? 1 : Math.sin(th), far = !out && Math.sin(th) < 0, KS = 1 + 0.09 * (out ? 1 : Math.sin(th));
      if (!out) for (let i = 1; i < 9; i++) { const a = th + i * 0.3, R = (24 + i * 6) * sc; D.alpha((150 - i * 15) / 255, () => D.rect(X(DC[0] + DRX * Math.cos(a)) - R, fl - 2 * R, 2 * R, 1.6 * R, C.muted, 1)); }
      else for (let i = 0; i < 7; i++) { const a = t - EXIT - i * 0.05; if (a > 0) { const R = (32 + i * 9) * sc; D.alpha((160 - i * 20) / 255, () => D.rect(X(dx + 1900 * Math.pow(a, 1.4) - 90) - R, fl - 2 * R, 2 * R, 1.6 * R, C.muted, 1)); } }
      let kb = null;
      const drawKart = () => { kb = kart(X(ex), fl, hs * KS, { sx: out ? 1 : Math.max(0.35, Math.abs(facing)), dy: hk * 0.6 * hs / 8, lean: -0.1 * facing * hs }); };
      const grabbed = t > EXIT + 0.06;
      if (far) drawKart();
      if (!grabbed) {
        const sway = Math.sin(t * 4.5) * 0.1, fx = X(DC[0]);
        const rb = block(fx + sway * rs * 3, fl, rs, { col: C.ink, sq: hk * 0.1 });
        if (hk > 0.1) for (const sd of [-1, 1]) D.vl(sd < 0 ? rb.left - 1 : rb.right + 1, rb.top - rs * 0.8 * hk, rb.top + rs * 0.4, C.ink, 1.25);   // flinch: arms up
        for (let i = 0; i < 3; i++) { const an = t * 7 + i * TAU / 3; D.sq(fx + Math.cos(an) * 65 * sc, rb.top - 6 + Math.sin(an) * 16 * sc, 4, C.pink); }
      }
      if (!far) drawKart();
      if (grabbed) {                                                                                 // snatched: hangs off the back of the kart
        const kx = kb.k.left, y = kb.k.top + Math.sin(t * 22) * 0.12 * rs * 3;
        D.hl(kx - rs * 0.8, kx, y, C.ink, 1.25); block(kx - rs * 1.4, y + rs * 0.5, rs, { col: C.ink });
        const a = t - EXIT - 0.06; if (a < 0.4) { const R = (60 + a * 200) * sc; D.alpha(200 / 255 * (1 - a / 0.4), () => D.rect(X(DC[0]) - R, fl - 90 * sc - R * 0.8, 2 * R, 1.6 * R, C.rule, 1.25)); }
      }
      for (const h of honks) {                                                                       // honks: a note rises off the horn and a "!"
        const a = t - h; if (a <= 0 || a >= 0.7 || !kb) continue;
        const nx = kb.box.left + kb.box.width / 2 + (70 + a * 60) * facing * sc, ny = kb.box.top - (40 + a * 120) * sc;
        D.alpha(seg(a, 0, 0.15) * (1 - seg(a, 0.5, 0.7)), () => { D.sq(nx, ny, 5, C.pink); D.vl(nx + 2, ny - 10, ny, C.pink, 1.5); });
        const bx = kb.box.left + kb.box.width / 2 - 40 * facing * sc, by = kb.box.top - (60 + a * 60) * sc;
        D.alpha(seg(a, 0, 0.12) * (1 - seg(a, 0.45, 0.7)), () => { D.vl(bx, by - 10, by - 3, C.ink, 2); D.sq(bx, by, 2.5, C.ink); });
        D.alpha(hk, () => D.corners(kb.box, 3 + 10 * easeOut(a / 0.3), C.pink, 1.5, 6));
      }
      streaks(f, 1 - seg(t, 85.0, 85.22), true, sc);
      streaks(f, seg(t, 87.85, 88.0) * 0.8, false, sc);
    });
  }

  // =====================================================================================
  // SHOT 5 · 88.0–94.3 · the cliff (the end of the name): the stop, the catch, Gato, the laser dot, the pounce
  // =====================================================================================
  const STOP = B(130), CATCH = B(130) + 0.36, POOF = B(131), DOT0 = B(132), POUNCE = B(137), DROP = POUNCE + 0.32;
  const KX = t => t < 88.5 ? lerp(-380, 400, (t - 88.0) / 0.5) : 400 + 160 * easeOut(seg(t, 88.5, STOP));
  const CU = 12.4, RS5 = 9.3, EDGE = [1062, 600], LAND5 = [820, 600], GCATCH = [1188, 648];
  const DOTS = [[DOT0, [905, 596]], [B(133), [1138, 712]], [B(134), [640, 548]], [B(135), "R"], [B(136), [985, 597]], [POUNCE, [820, 597]]];
  const RH = [-2.91, -10.58];
  function slipAt(t) { let n = 0; for (let b = 132; b <= 136; b++) if (t >= B(b)) n++; return n; }
  function grip(t) {
    if (t < CATCH) return null;
    const n = slipAt(t), lastB = n ? B(131 + n) : CATCH, jerk = t - lastB;
    const catchBounce = 42 * Math.exp(-(t - CATCH) * 6) * Math.sin((t - CATCH) * 20);
    let y = GCATCH[1] + n * 18 + (n ? 12 * Math.exp(-jerk * 9) * Math.sin(jerk * 30) : 0) + catchBounce; const x = GCATCH[0] + n * 1.5;
    if (t > DROP) y += 0.5 * 5200 * (t - DROP) * (t - DROP);
    return [x, y];
  }
  function hangAngle(t) {
    const a = t - CATCH, n = slipAt(t), jerk = n ? t - B(131 + n) : 9;
    return 0.37 + 0.45 * Math.exp(-a * 1.4) * Math.sin(a * 6.5) + 0.07 * Math.exp(-jerk * 4) * Math.sin(jerk * 14) + (t > DROP ? -0.3 * seg(t, DROP, DROP + 0.3) : 0);
  }
  const hangPt = (g, th, lx, ly) => { const px = (lx - RH[0]) * RS5, py = (ly - RH[1]) * RS5; return [g[0] + px * Math.cos(th) - py * Math.sin(th), g[1] + px * Math.sin(th) + py * Math.cos(th)]; };
  function dotAt(t, rPos) {
    if (t < DOT0 || t > POUNCE + 0.5) return null;
    let i = 0; while (i + 1 < DOTS.length && t >= DOTS[i + 1][0]) i++;
    const P = k => DOTS[k][1] === "R" ? rPos : DOTS[k][1], cur = P(i), prev = i ? P(i - 1) : cur, z = easeOut(clamp((t - DOTS[i][0]) / 0.12));
    const wig = i === DOTS.length - 1 ? 0 : 9;
    return [lerp(prev[0], cur[0], z) + Math.sin(t * 17) * wig, lerp(prev[1], cur[1], z) + Math.cos(t * 13) * wig * 0.5, z];
  }
  function cliff(t, lt, dur, S) {
    const f = frame(S), sc = Math.min(f.width / 1920, f.height / 1080) * 1.3, hs = HERO(S), rs = RES(S);
    const edgeX = S.text.right + 2, deep = Math.max(8, S.name.bottom - S.floor);
    const kd = clamp((deep - rs) / (200 * sc * 1.385), 0.08, 1);                                    // below the edge: squeezed into the name's own line
    const M = (x, y) => [edgeX + (x - 1150) * sc, S.floor + (y <= 600 ? y - 600 : (y - 600) * kd) * sc];
    // their camera (a push in on the edge, CATCH − .15 → POOF + .25, and a pulse on the beat); zoom as a ratio to their 1.3
    const push = ease(seg(t, CATCH - 0.15, POOF + 0.25)), pan = ease(seg(t, POUNCE, POUNCE + 0.4));
    const zoom = lerp(1.3, 1.8, push) - 0.22 * pan + 0.02 * pulse(t, 7) * push, zr = zoom / 1.3;
    const [shx, shy] = t > STOP - 0.02 && t < STOP + 0.18 ? shakeXY(t, 9) : [0, 0];
    const chasm = rr(edgeX, S.floor - 1, Math.max(0, f.right - edgeX), deep + 1);
    clip([f, chasm], () => D.cam(edgeX, S.floor, zr, () => {
      const gl = 0.85 + 0.15 * Math.sin(t * 3);
      D.fill(chasm.left, chasm.top, chasm.width, chasm.height, C.pink, 0.08 * gl);                 // the glow far below
      D.vl(edgeX, S.floor, S.floor + deep, C.ink, 1.5);                                             // the cliff face
      // kart arrival (linear to 88.5, then easeOut to STOP) and hard stop; nose dive kf 88.5 → 88.72 → STOP+.08 → STOP+.3
      const kx = KX(t), braking = seg(t, 88.5, STOP), krot = kf(t, [[88.5, 0], [88.72, 0.12], [STOP + 0.08, -0.06], [STOP + 0.3, 0]]);
      if (t > 88.45) for (let i = 0; i < 9; i++) { const ts = 88.5 + i * 0.04, a = t - ts; if (a > 0 && ts < STOP) { const R = 25 + a * 120, p = M(KX(ts) + 150, 590 - a * 70 - hash(i) * 20); D.alpha(180 / 255 * clamp(1 - a / 1.1), () => D.rect(p[0] - R * sc, p[1] - R * 0.8 * sc, 2 * R * sc, 1.6 * R * sc, C.muted, 1)); } }
      if (t < 88.52) for (let i = 0; i < 4; i++) { const a = M(kx - 250 - i * 90, 470 + i * 38), b = M(kx - 420 - i * 90, 470 + i * 38); D.hl(b[0], a[0], a[1], C.muted, 1); }
      const kxS = M(kx, 600)[0];
      if (t < STOP) kart(kxS, S.floor, hs, { lean: krot * hs * 3 }); else tub(kxS, S.floor, hs);
      // the Researcher: dragged off the kart's rear, flipped over by the brake, flung over the edge (arc h 300, easeOut
      // STOP → CATCH), caught; slips one notch on each beat B(132)…B(136); drops at DROP
      const rear = [kx - 6.8 * 20, 600 - 5.2 * 20];
      let G, th;
      if (t < STOP) { G = rear; th = 1.94 + 0.12 * Math.sin(t * 24) + (t > 88.5 ? Math.PI * easeIn(braking) : 0); }
      else if (t < CATCH) { const k = seg(t, STOP, CATCH); G = arcPt([KX(STOP) - 6.8 * 20, 496], [GCATCH[0], GCATCH[1] + 30], 300, easeOut(k)); th = lerp(1.94 + Math.PI, 0.37 + TAU, easeOut(k)); }
      else { G = grip(t); th = hangAngle(t); }
      const falling = t >= DROP, rPos = hangPt(G, th, 0, -6), dot = dotAt(t, rPos);
      const dz = mood(t, [[CATCH, "wide"], [DOT0 + 0.3, "sweat"], [B(135) + 0.05, "sweat"], [POUNCE + 0.05, "dot"], [DROP, "wide"]]);
      const g = M(G[0], G[1]), bp = M(rPos[0], rPos[1]), rb = rr(bp[0] - rs / 2, bp[1] - rs / 2, rs, rs);
      if (G[1] < 1400) {
        const ey = Math.abs(bp[1] - g[1]) < rs / 2 ? bp[1] : bp[1] + (bp[1] > g[1] ? -rs / 2 : rs / 2), exn = Math.abs(bp[1] - g[1]) < rs / 2 ? (bp[0] > g[0] ? rb.left : rb.right) : bp[0];
        D.path([g, [exn, g[1]], [exn, ey]], C.ink, 1);
        block(bp[0], rb.bottom, rs, { col: C.ink, sq: dz.take });
        if (!falling && t > DOT0 + 0.3) D.alpha(seg(t, DOT0 + 0.3, DOT0 + 0.5), () => D.sq(rb.right + 3, rb.top - 2, 3, C.blue));
      }
      // Clawd: leaps to the edge (arc h 130, .22 s), catches, becomes Gato (POOF), hunts the dot, wiggles, pounces (arc h 95, .34 s)
      if (t >= STOP) {
        let c5 = EDGE.slice(), sq = 0, dy = 0, lean = 0;
        if (t < STOP + 0.22) { c5 = arcPt([KX(STOP) - 26, 572], EDGE, 130, seg(t, STOP, STOP + 0.22)); sq = -0.2 * bell(t, STOP, STOP + 0.22); }
        const m = mood(t, [[STOP, "scared"], [CATCH + 0.05, "happy"], [POOF + 0.02, "happy"], [DOT0 + 0.02, "look"], [POUNCE + 0.36, "happy"], [POUNCE + 0.55, "scared"]]);
        sq += m.take;
        const eye = [c5[0], c5[1] - 6 * CU];
        if (t >= CATCH && t < POUNCE) {
          lean = dot ? clamp((dot[0] - eye[0]) / 900, -1, 1) * 0.12 : 0;
          const wig = seg(t, B(136) + 0.1, POUNCE);
          if (wig > 0) { sq = 0.16 * wig; dy = 0.25 * wig; lean += 0.09 * wig * Math.sin(t * 38); }
        }
        if (t >= POUNCE) {
          const k = seg(t, POUNCE, POUNCE + 0.34); c5 = arcPt(EDGE, LAND5, 95, easeOut(k));
          const land = t - (POUNCE + 0.34);
          sq = k < 1 ? -0.22 * bell(t, POUNCE, POUNCE + 0.34) : 0.28 * Math.exp(-land * 7) * Math.cos(land * 20);
          lean = k < 1 ? -0.35 * bell(t, POUNCE, POUNCE + 0.34) : 0;
        }
        const ears = backOut(seg(t, POOF, POOF + 0.3)), perk = t > DOT0 ? 0.8 : 0, p5 = M(c5[0], c5[1]);
        const hero = block(p5[0] + lean * hs * 3, p5[1] + dy * hs / 8, hs, { sq });
        if (ears > 0.02) for (const sd of [-1, 1]) { const ew = hs * 0.28 * ears, eh = hs * (0.28 + 0.1 * perk) * ears; D.fill(sd < 0 ? hero.left + 1 : hero.right - 1 - ew, hero.top - eh, ew, eh, C.pink); }
        if (ears > 0.03) { const hz = t > POOF + 0.3 && t < POUNCE ? 2.4 : 1.1, tw = t >= CATCH && t < POUNCE ? seg(t, B(136) + 0.1, POUNCE) : 0, w = wob(t, hz) * 0.9 + tw * wob(t, 7) * 0.5, ty = hero.top + hero.height * 0.35;
          D.path([[hero.left, hero.bottom - hero.height * 0.3], [hero.left - hs * 0.35 * ears, hero.bottom - hero.height * 0.3], [hero.left - hs * 0.35 * ears, ty - hs * 0.15 * w * ears]], C.pink, 2); }
        // the rubber arm reaches the Researcher's hand (CATCH − .12 → CATCH) and holds until POUNCE + .02; one finger lets go per beat
        if (t >= CATCH - 0.06 && t < POUNCE + 0.02) {
          const sh = [hero.right, hero.top + hero.height * 0.45], reach = seg(t, CATCH - 0.12, CATCH), gg = [lerp(sh[0] + 4, g[0], reach), lerp(sh[1] + 4, g[1] - 2, reach)];
          D.path([sh, [gg[0], sh[1]], gg], C.pink, 2);
          const n = slipAt(t), fingers = Math.max(1, 4 - n), jk = n ? t - B(131 + n) : 9;
          for (let i = 0; i < fingers; i++) D.sq(gg[0] + (i - (fingers - 1) / 2) * 3.2 + (4 - fingers) * 1, gg[1] + 1 + (fingers === 1 ? Math.sin(t * 40) : 0), 2.6, C.pink);
          if (jk < 0.35) { const a = 1 - jk / 0.35; for (const k of [-1, 0, 1]) D.vl(gg[0] + k * 4, gg[1] - 8 - 26 * a * sc, gg[1] - 8, C.ink, 0.3 + 0.9 * a); }
        }
        if (t > POOF - 0.02) {                                                                        // POOF: the ears arrive in a puff (.5 s)
          const a = t - POOF;
          for (let i = 0; i < 5; i++) { const R = (25 + a * 90) * sc, px = hero.left + hero.width / 2 + Math.cos(i * 1.3) * 60 * sc, py = hero.top + Math.sin(i * 1.3) * 25 * sc - a * 40 * sc; D.alpha(170 / 255 * clamp(1 - a / 0.5), () => D.rect(px - R, py - R * 0.8, 2 * R, 1.6 * R, i % 2 ? C.rule : C.pink, 1)); }
          burst(hero, a, 0.5, 95 * sc * 0.5, C.pink);
        }
      }
      if (dot && t < POUNCE + 0.45) {                                                                 // the laser dot: jumps each beat (easeOut .12 s)
        const d = M(dot[0], dot[1]);
        D.sq(d[0], d[1], Math.max(3, 18 * sc), C.pink); D.alpha(0.5, () => D.osq(d[0], d[1], 44 * sc, C.pink, 1));
        if (dot[2] < 1) D.hl(d[0] - 40 * (1 - dot[2]) * sc, d[0], d[1], C.pink, 1.2);
      }
    }, shx * sc, shy * sc));
    clip([f], () => streaks(f, 1 - seg(t, 88.0, 88.14), false, sc));
  }

  // =====================================================================================
  // SHOT 6 · 94.3–95.4 · the long fall into the chasm, iris to dark
  // =====================================================================================
  function fall(t, lt, dur, S) {
    const W = world(S, 1080), f = W.f, sc = W.sc, r = band(S);
    const k = seg(t, 94.3, 95.3), CX = 960, CY = 530, zoom = 1 + 0.35 * easeIn(k);
    clip([f], () => {
      D.fill(f.left, f.top, f.width, f.height, C.bg, 1);
      for (let i = 1; i < 9; i++) {                                                                  // looking down the shaft: nested rock rings
        const R = 1250 * Math.pow(0.7, i) * zoom, ox = (hash(i * 13) - 0.5) * 60 * (1 - i / 9), oy = (hash(i * 7) - 0.5) * 40 * (1 - i / 9);
        D.rect(W.x(CX + ox - R), W.y(CY + oy - R * 1.3), 2 * R * sc, 2.6 * R * sc, i < 6 ? (i % 2 ? C.ink : C.muted) : C.pink, Math.max(0.6, 1.4 - i * 0.12));
      }
      D.fill(W.x(CX - 60 * zoom), W.y(CY - 80 * zoom), 120 * zoom * sc, 160 * zoom * sc, C.pink, 0.9);
      for (let i = 0; i < 6; i++) {                                                                  // pebbles falling alongside
        const a = hash(i * 11) * TAU, d = (300 + hash(i * 17) * 300) * (1 - easeOut(k)), s = (22 + hash(i) * 16) * Math.pow(0.12, k);
        D.sq(W.x(CX + Math.cos(a) * d), W.y(CY - 60 + Math.sin(a) * d), Math.max(1, 2 * s * sc), C.ink);
      }
      const s = Math.pow(0.1, k), px = W.x(lerp(1010, CX + 2, easeOut(k))), py = W.y(lerp(430, CY - 10, easeOut(k)));
      const rs = Math.max(1.5, RES(S) * 1.6 * s);
      block(px, py + rs / 2, rs, { col: C.ink, sx: Math.cos(lt * 9) });
      if (lt > 0.12) {                                                                               // the glasses fly off, back up past the camera
        const g = lt - 0.12, gx = px + g * 700 * sc, gy = py - g * 520 * sc, gs = (1 + g * 3.2) * 13 * sc;
        D.rect(gx - gs * 2.2, gy - gs, gs * 2, gs * 1.8, C.ink, 1); D.rect(gx + gs * 0.2, gy - gs, gs * 2, gs * 1.8, C.ink, 1); D.hl(gx - gs * 0.2, gx + gs * 0.2, gy - gs * 0.2, C.ink, 1);
      }
      const ir = lerp(1300, 0, easeIn(seg(t, 94.62, 95.33))) * sc;                                   // darkness closes in (square iris)
      if (t > 95.3 || ir < 1) D.fill(f.left, f.top, f.width, f.height, C.bg, 1);
      else { D.fill(f.left, f.top, f.width, Math.max(0, py - ir - f.top), C.bg); D.fill(f.left, py + ir, f.width, Math.max(0, f.bottom - py - ir), C.bg); D.fill(f.left, py - ir, Math.max(0, px - ir - f.left), 2 * ir, C.bg); D.fill(px + ir, py - ir, Math.max(0, f.right - px - ir), 2 * ir, C.bg); }
      if (!(t > 95.3 || ir < 1)) D.rect0(px - ir, py - ir, 2 * ir, 2 * ir, C.ink, 1.5);   // 3.52: the iris closes in white with a graphite edge (was solid black)
    });
  }

  chapter("obsolete", 73.0, 95.4, [[73.0, mlp], [77.5, museum], [81.0, road], [85.0, cdr], [88.0, cliff], [94.3, fall]]);
})();
