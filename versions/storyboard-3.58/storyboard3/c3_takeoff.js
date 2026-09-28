// c3 · Takeoff (38.5–59.0). Their src/ch/c03_takeoff.js ported shot for shot: every shot start, time constant,
// seg window, keyframe, easing, beat pulse (and its decay k), dance move, mood take, schedule and sfx time is theirs,
// translated into our boxes, squares and straight lines. The audit trail, one row per event with their line numbers,
// is docs/storyboard-timing/c3_takeoff.md.
// Maps (their 1920×1080 frame → our stage): x along the column (Mx) or the name (X); y from their floor line up to the
// band top (the band: topbar bottom → the name's top, where all action stays). Camera moves are D.cam around the
// overlay with their zoom ratios; pans and shakes scaled by S.W/1920. Rotations (camera roll, Clawd's spin, the
// Researcher's tilt) have no equivalent in our shapes and are dropped (listed in the timing doc).
(() => {
  const { D, C, B, BEAT, bpOf, pulse, seg, ease, easeIn, easeOut, backOut, elasticOut, move, mood, shakeXY, wob, lerp, clamp, frac, hash, rr, chapter } = window.__SB;
  const TAU = 2 * Math.PI;
  const g2 = () => document.querySelector("canvas[aria-hidden]").getContext("2d");
  const X = (S, f) => S.text.left + S.text.width * f;                               // along the name
  const Mx = (S, x) => S.main.left + (S.right - S.main.left) * x / 1920;            // their frame x → our column
  const band = S => { const top = S.bar ? S.bar.bottom + 4 : 0, l = Math.max(0, S.main.left - 16); return rr(l, top, Math.min(S.W, S.right + 16) - l, S.floor + 3 - top); };   // the stage: the column, topbar → name top
  const clipTo = (r, fn) => { const c = g2(); c.save(); c.beginPath(); c.rect(r.left, r.top, r.width, r.height); c.clip(); try { fn(); } finally { c.restore(); } };
  const shk = (S, t, amt) => { const [x, y] = shakeXY(t, amt), k = S.W / 1920; return [x * k, y * k]; };
  const emK = age => age < 0 ? 0 : seg(age, .05, .3) * (1 - seg(age, 1.4, 1.7));   // their mood() emote fade
  const L2 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];

  // ---------- cast (squares; their squash: x × (1 + sq·0.6), y × (1 − sq)) ----------
  function body(x, fy, s, col, o = {}) {
    const sq = (o.sq || 0) + (o.take || 0), w = s * (o.sx ?? 1) * (1 + sq * .6), h = s * (o.sy ?? 1) * (1 - sq), y = fy - (o.dy || 0) - h;
    D.fill(x - w / 2, y, w, h, col);
    return rr(x - w / 2, y, w, h);
  }
  const clawd = (x, fy, s, o = {}) => { const r = body(x, fy, s, C.pink, o); D.hl(r.left, r.right, r.top + Math.max(2, r.height * .2), C.blue, 2); return r; };   // in his sweatband
  const researcher = (x, fy, s, o = {}) => { const r = body(x, fy, s, C.ink, o); if (o.hair > 0) D.vl(x, r.top - 1 - s * .3 * o.hair, r.top - 1, C.ink, 1.25); return r; };
  const sydney = (x, fy, s, t, o = {}) => { const r = body(x, fy, s, C.pink, o), by = r.top - 2 + .8 * Math.sin(t * 5); D.sq(r.right - s * .3 - 2, by, 3.5, C.ink); D.sq(r.right - s * .3 + 2, by, 3.5, C.ink); return r; };   // Clawd with a bow
  // emotes: their 'music', '!', 'sweat'
  const note = (x, y, k) => { if (k > .02) D.alpha(k, () => { D.sq(x, y, 4, C.pink); D.vl(x + 1.5, y - 9, y, C.pink, 1.25); D.hl(x + 1.5, x + 5, y - 9, C.pink, 1.25); }); };
  const bang = (x, y, k) => { if (k > .02) D.alpha(k, () => { D.vl(x, y - 11, y - 4, C.pink, 2); D.sq(x, y - 1, 2.5, C.pink); }); };
  const sweat = (x, y, k) => { if (k > .02) D.alpha(k, () => D.sq(x, y + 3 * k, 3, C.blue)); };
  // their sfx(): pops in with backOut(age × 5), fades over the last 0.25 s of its life
  function sfx(txt, x, y, age, life) {
    if (age < 0 || age > life) return;
    const k = Math.max(.01, backOut(clamp(age * 5))), w = txt.length * 7 + 14;
    D.alpha(1 - seg(age, life - .25, life), () => D.cam(x, y, k, () => { D.corners(rr(x - w / 2, y - 9, w, 18), 0, C.pink, 1.5, 5); D.text(txt, x, y + 4, C.ink, 11, "center"); }));
  }
  // their whipStreaks(): a flash (0.55 k) and 16 horizontal streaks, every third with an ink line; in the band only
  function whipStreaks(S, k) {
    if (k <= .01) return;
    const b = band(S), cols = [C.blue, C.pink, C.muted, C.rule];
    D.fill(b.left, b.top, b.width, b.height, C.bg, .55 * k);
    for (let i = 0; i < 16; i++) {
      const y = b.top + hash(i * 3.3) * b.height, x = b.left + hash(i * 7.7) * b.width * .25;
      D.alpha(.82 * k, () => D.hl(b.left, b.right, y, cols[i % 4], 1 + 3 * hash(i * 5.1)));
      if (i % 3 === 0) D.alpha(k, () => D.hl(x + b.width * .15, x + b.width * .8, y + 3, C.ink, 1));
    }
  }
  const flashBand = (S, k) => { if (k > .01) { const b = band(S); D.fill(b.left, b.top, b.width, b.height, C.bg, k); } };
  // 3.51: the iris is two white shutters with graphite edges (it was two solid black slabs)
  const irisBand = (S, k) => { const b = band(S), r = rr(S.main.left - 8, b.top, S.right - S.main.left + 16, b.height), h = k <= 0 ? Math.ceil(r.height / 2) + 1 : Math.round(r.height / 2 * (1 - clamp(k)));
    if (h <= 0) return; D.fill(r.left, r.top, r.width, h, C.bg); D.fill(r.left, r.top + r.height - h, r.width, h, C.bg);
    D.hl(r.left, r.left + r.width, r.top + h, C.ink, 1.5); D.hl(r.left, r.left + r.width, r.top + r.height - h, C.ink, 1.5); };

  // ===================================================================================================
  // 1) GYM 38.5–B(60) · 2) DIAL B(60)–B(62) · 3) BLACK HOLE B(62)–45.0
  // ===================================================================================================
  function gymL(S) {
    const u = S.u, g = rr(X(S, .8), S.floor - u * 2.4, 44, 8), p = S.photos[2];
    const hole = p ? [p.left + p.width / 2, p.top + p.height / 2] : [S.right - 40, S.floor - 60];
    const tv = p ? rr(p.left + p.width * .12, p.top + p.height * .22, p.width * .76, p.height * .56) : rr(hole[0] - 40, hole[1] - 25, 80, 50);
    return { g, gc: [g.left + g.width / 2, g.top + g.height / 2], hole, tv, kR: (p ? Math.min(p.width, p.height) * .32 : 30) / 270,
      rx: X(S, .12), rs: u * .6, b0: X(S, .45), b1: X(S, .76), hx: X(S, .6), hs: u * 1.4 };
  }
  // their PROPS table: [kind, departure time, flight duration]
  const PROPS = [["tv", 42.6, .5], ["db0", 42.85, .6], ["db1", 43.12, .62], ["db2", 43.5, .58], ["ball", 43.3, .95], ["bottle", 43.72, .55], ["kettle", 44.1, .6], ["clip", 42.72, .75], ["watch", 42.8, .7]];
  function propHome(S, L, kind) {
    const f = S.floor;
    if (kind === "tv") return { x: L.tv.left + L.tv.width / 2, y: L.tv.top + L.tv.height / 2, w: L.tv.width, h: L.tv.height };
    if (kind[0] === "d") return { x: X(S, .9 + .05 * +kind[2]), y: f - 2.5, w: 9, h: 5 };
    return { ball: { x: X(S, .3), y: f - 6, w: 12, h: 12 }, bottle: { x: X(S, .87), y: f - 5, w: 4, h: 10 }, kettle: { x: X(S, .84), y: f - 4, w: 8, h: 8 },
      clip: { x: L.rx + L.rs / 2 + 6, y: f - L.rs * .7, w: 6, h: 8 }, watch: { x: L.rx - L.rs / 2 - 6, y: f - L.rs * .6, w: 5, h: 5 } }[kind];
  }
  const nTickAt = t => t > B(59) ? 3 : t > B(58) ? 2 : t > B(57) ? 1 : 0;          // clipboard ticks on B(57), B(58), B(59)
  function propDraw(kind, x, y, w, h, t) {
    const l = x - w / 2, tp = y - h / 2;
    if (kind === "tv") { D.fill(l, tp, w, h, C.bg, .92); D.rect(l, tp, w, h, C.ink, 1.25); }
    else if (kind[0] === "d") D.fill(l, tp, w, h, C.ink);
    else if (kind === "ball") D.rect(l, tp, w, h, C.pink, 1.5);
    else if (kind === "bottle") D.fill(l, tp, w, h, C.blue);
    else if (kind === "kettle") D.rect(l, tp, w, h, C.ink, 1.25);
    else if (kind === "clip") { D.rect(l, tp, w, h, C.ink, 1); for (let k = 0; k < nTickAt(t) && w > 4; k++) D.hl(l + 1.5, l + w - 1.5, tp + 2 + k * 2, C.blue, 1); }
    else if (kind === "watch") { D.rect(l, tp, w, h, C.ink, 1); if (w > 3) { const q = ((Math.round((-Math.PI / 2 + t * TAU * 1.2) / (Math.PI / 2)) % 4) + 4) % 4; q % 2 ? D.hl(x, x + (q === 1 ? 1 : -1) * w * .4, y, C.pink, 1) : D.vl(x, y, y + (q === 0 ? -1 : 1) * h * .4, C.pink, 1); } }
  }
  // their propAt(): a prop leaves home at t0 and spirals into the hole over d (e = easeIn(q)·0.85 + q·0.15),
  // stretching along the pull (1 + 2.4e²), thinning across it, shrinking by e^2.2
  function fly(t, t0, d, h, hole, draw) {
    const q = seg(t, t0, t0 + d); if (q >= 1) return;
    if (q <= 0) return draw(h.x, h.y, h.w, h.h, 0);
    const e = easeIn(q) * .85 + q * .15, dx = h.x - hole[0], dy = h.y - hole[1], r = Math.hypot(dx, dy) * (1 - e), a = Math.atan2(dy, dx) + e * 2.4;
    const st = 1 + 2.4 * e * e, sk = 1 / (1 + 1.1 * e), s = 1 - Math.pow(e, 2.2), radial = Math.abs(Math.cos(a)) >= Math.abs(Math.sin(a));
    draw(hole[0] + Math.cos(a) * r, hole[1] + Math.sin(a) * r, h.w * s * (radial ? st : sk), h.h * s * (radial ? sk : st), e);
  }
  // the loss line on the monitor: their wave 14·sin(x·0.045 − 3.2t), falling trend, and the "crazy" spikes, as a step line
  function tvLine(r, t, crazy) {
    const pts = []; let prev;
    for (let x = 1370; x <= 1630; x += 13) {
      const calm = 14 * Math.sin(x * .045 - t * 3.2) - (x - 1370) * .1, wild = crazy * (Math.sin(x * .3 + t * 40) * 50 - Math.max(0, x - 1520) * 1.4);
      const px = r.left + r.width * (.06 + .88 * (x - 1370) / 260), py = clamp(r.top + r.height * .5 + (calm + wild) * r.height / 176, r.top + 2, r.bottom - 2);
      if (prev != null) pts.push([px, prev]); pts.push([px, py]); prev = py;
    }
    D.path(pts, crazy > .3 ? C.pink : C.blue, 1.5);
    if (crazy < .3) D.sq(pts[pts.length - 1][0], pts[pts.length - 1][1], 4, C.blue);
  }
  function gymWindow(S, t) {                                        // the window on the left, clouds drifting at their 14 px/s
    const p = S.photos[0]; if (!p) return;
    const w = rr(p.left + p.width * .14, p.top + p.height * .14, p.width * .72, p.height * .5);
    D.corners(w, 0, C.muted, 1.25, 8);
    clipTo(w, () => { for (let k = 0; k < 2; k++) { const cx = w.left + w.width * (56 + (t * 14 + k * 190) % 300) / 426, cy = w.top + w.height * (122 + k * 90) / 324; D.fill(cx, cy - 4, w.width * .2, 8, C.bg, .9); } });
  }
  // treadmill belt: dashes run left at their belt speed (px/s; their slat pitch 64 → our dash pitch 10)
  function treadmill(S, L, t, speed) {
    const off = (t * speed * 10 / 64) % 10;
    clipTo(rr(L.b0, S.floor - 3, L.b1 - L.b0, 6), () => D.hl(L.b0 - off, L.b1 + 10, S.floor, C.ink, 2, [6, 4]));
    D.vl(L.g.left + 4, L.g.bottom, S.floor, C.ink, 1.25);           // the console upright
  }
  // the speed gauge: their 10-cell LED bar (lit when v·10 ≥ i + 0.5), green/ochre/red → blue/ink/pink
  function gauge(g, v, wash, blink) {
    if (wash > 0) D.fill(g.left - 3, g.top - 3, g.width + 6, g.height + 6, C.pink, .25 * wash);
    D.rect(g.left, g.top, g.width, g.height, C.ink, 1.25);
    const cw = (g.width - 4) / 10;
    for (let i = 0; i < 10; i++) D.fill(g.left + 2 + i * cw + .5, g.top + 2, cw - 1, g.height - 4, i < 4 ? C.blue : i < 7 ? C.ink : C.pink, v * 10 >= i + .5 ? 1 : .15);
    D.sq(g.right - 2, g.top - 4, 3, blink ? C.pink : C.muted);      // warning light
  }

  // 38.5 · "We had a stable training run." Clawd jogs (move 'run'), the Researcher nods on the beat (pulse k 5) and
  // ticks the clipboard on B(57), B(58), B(59); calm loss line. From 40.84 the camera crashes into the dial (easeIn).
  function gymShot(t, lt, dur, S) {
    const L = gymL(S), pk = easeIn(seg(t, 40.84, 41.13));
    const z = lerp(1.2 + .015 * lt, 3.6, pk) / 1.2, dx = -(30 * wob(t, .13) + 12 * lt) * S.W / 1920 * (1 - pk);
    clipTo(band(S), () => D.cam(L.gc[0], L.gc[1], z, () => {
      gymWindow(S, t);
      for (const [kind] of PROPS) { const h = propHome(S, L, kind); propDraw(kind, h.x, h.y, h.w, h.h, t); }
      tvLine(L.tv, t, 0);
      treadmill(S, L, t, 330); gauge(L.g, .28, 0, false);
      const m = move("run", t), hr = clawd(L.hx, S.floor, L.hs, { dy: -m.dy * L.hs / 8 });
      note(hr.right + 5, hr.top - 3, seg(t, 39.2, 39.5) * (1 - seg(t, 40.2, 40.5)));
      const nod = pulse(t, 5), md = mood(t, [[38.5, "look"], [40.45, "closed"], [40.95, "look"]]);
      researcher(L.rx, S.floor, L.rs, { dy: .12 * nod * L.rs / 4, sq: .04 * nod, take: md.take * .8 });
    }, dx, 0));
  }

  // B(60) · Close on the console (the camera stays 3× on the gauge). Clawd's arm swings with his run; one big swing
  // (a 0.16 s bell on B(61)) clonks the knob: knob elasticOut 0.45 s, needle elasticOut B(61)+0.04…+0.6 with a
  // tremble, pink wash from +0.08…+0.45, warning light at 9 Hz, steam, impact brackets 0.2 s, shake 18·e^(−3.5a)+3,
  // flash 0.35·e^(−14a). Push 41.13→42.2, pull-out easeIn 42.25→42.494.
  const BUMP = B(61);
  function dialShot(t, lt, dur, S) {
    const L = gymL(S), g = L.g, [gx, gy] = L.gc, after = t - BUMP, hitK = after > 0 ? Math.exp(-after * 3.5) : 0;
    const red = seg(t, BUMP + .08, BUMP + .45), [sx, sy] = shk(S, t, 18 * hitK + (after > 0 ? 3 : 0));
    const z = 3 * (1 + .05 * seg(t, 41.13, 42.2) - .1 * easeIn(seg(t, 42.25, 42.494)));
    const v = after < .04 ? .28 + .02 * Math.sin(t * 6) : lerp(.28, 1, elasticOut(seg(t, BUMP + .04, BUMP + .6))) + .012 * Math.sin(t * 60) * seg(t, BUMP + .3, BUMP + .5);
    const ka = after < 0 ? Math.PI * .95 : lerp(Math.PI * .95, Math.PI * 2.25, elasticOut(seg(t, BUMP, BUMP + .45)));
    clipTo(band(S), () => D.cam(gx, gy, z, () => {
      gauge(g, Math.min(1.03, v), red * (.8 + .2 * Math.sin(t * 30)), red > 0 && Math.floor(t * 9) % 2 === 0);
      const kx = g.left - 8, ky = gy + 1;                               // the knob and its 7 lamps (lit as it turns past)
      D.rect(kx - 3, ky - 3, 6, 6, C.ink, 1.25);
      const qd = ((Math.round(ka / (Math.PI / 2)) % 4) + 4) % 4; qd % 2 ? D.vl(kx, ky, ky + (qd === 1 ? 2.5 : -2.5), C.ink, 1) : D.hl(kx, kx + (qd === 0 ? 2.5 : -2.5), ky, C.ink, 1);
      for (let i = 0; i < 7; i++) D.fill(g.left + 2 + i * 5.5, g.bottom + 2, 3, 2, i < 3 ? C.blue : i < 5 ? C.ink : C.pink, ka >= lerp(Math.PI * .75, Math.PI * 2.25, i / 6) - .05 ? 1 : .2);
      // Clawd jogging past (their move 'run' at half height); his right arm swings on the beat, bigger at the bump
      const hsz = L.hs * 2.2 / 3, swg = .5 + .5 * Math.cos(frac(bpOf(t)) * TAU), A = .55 + .75 * Math.exp(-(((t - BUMP) / .16) ** 2)), m = move("run", t);
      const hr = clawd(kx - 14, ky + hsz / 2, hsz, { dy: -m.dy * .5 * hsz / 8 });
      D.hl(hr.right, hr.right + (kx - 3 - hr.right) * clamp((A * swg) / 1.3), ky, C.pink, 2.5);
      note(hr.right + 3, hr.top - 2, after > .15 ? seg(t, BUMP + .15, BUMP + .4) : 0);
      if (after >= 0 && after < .2) { const k = after / .2; D.alpha(1 - k, () => D.corners(rr(kx - 3, ky - 3, 6, 6), 2 + 4 * k, C.ink, 1.25, 3)); }
      if (red > 0) for (let i = 0; i < 6; i++) {                        // steam from the seams, their 1.8 Hz cycle
        const a = frac(t * 1.8 + i / 6), side = i % 2, x = side ? g.right + 2 + a * 10 : g.left - 4 - a * 10, y = gy - 3 - a * 13 + (i >> 1) * 2;
        D.alpha(.86 * (1 - a) * red, () => D.osq(x, y, 2.4 + 4 * a, C.muted, 1));
      }
    }, sx, sy));
    flashBand(S, after > 0 ? .35 * Math.exp(-after * 14) : 0);
  }

  // the black hole: their accretion rim, 6 spiral arms turning at 3.4 rad/s (here nested boxes cycling inward, one
  // every 0.308 s), 4 fine arms at 1.25× that, the pink ring at 0.5 R and the core at 0.36 R
  function blackHole(H, R, t) {
    if (R < 2) return;
    const [x, y] = H, box = (s, col, lw, dash) => D.path([[x - s, y - s * .95], [x + s, y - s * .95], [x + s, y + s * .95], [x - s, y + s * .95], [x - s, y - s * .95]], col, lw, dash);
    box(R * 1.7, C.muted, 1, [2, 4]);
    D.fill(x - R * 1.12, y - R * 1.07, R * 2.24, R * 2.14, C.ink);
    for (let i = 0; i < 6; i++) box(R * (1.1 - .95 * frac(t * 3.4 / TAU + i / 6)), [C.bg, C.muted, C.pink][i % 3], 1);
    for (let i = 0; i < 4; i++) D.alpha(.6, () => box(R * (1.25 - .9 * frac(t * 3.4 * 1.25 / TAU + i / 4)), C.bg, 1, [2, 3]));
    D.rect(x - R * .5, y - R * .47, R, R * .94, C.pink, 1.5);
    D.fill(x - R * .36, y - R * .34, R * .72, R * .68, C.ink);
  }
  function windStreaks(S, t, H) {                                   // their 9 streaks, 0.9 Hz, on the same spiral as the props
    for (let i = 0; i < 9; i++) {
      const q = frac(t * .9 + hash(i * 2.9)), hx = Mx(S, 150 + hash(i * 4.1) * 1200), hy = lerp(S.strip ? S.strip.top : S.floor - 80, S.floor - 4, hash(i * 6.3));
      const at = e => { const r = Math.hypot(hx - H[0], hy - H[1]) * (1 - e), a = Math.atan2(hy - H[1], hx - H[0]) + e * 2.4; return [H[0] + Math.cos(a) * r, H[1] + Math.sin(a) * r]; };
      const [x0, y0] = at(q), [x1] = at(clamp(q + .2));
      D.hl(Math.min(x0, x1), Math.max(x0, x1), y0, i % 3 ? C.muted : C.bg, 1);
    }
  }
  const lerpR = (a, b, k) => rr(lerp(a.left, b.left, k), lerp(a.top, b.top, k), lerp(a.width, b.width, k), lerp(a.height, b.height, k));

  // B(62) · "But now the singularity's begun." The hole opens over the third photo (backOut B(62)+0.05…+0.42, grows
  // 43→44.6); the TV freaks out and goes first (42.6), then every prop on their schedule and the page's boxes
  // (42.9 + 0.26 i); the Researcher is ripped up to the first photo's frame (42.78→43.0) and flaps like a flag;
  // Clawd sprints, jumps (44.38→44.86) and dives in; the camera dives (easeIn 44.68→45.0) and irises shut.
  function holeShot(t, lt, dur, S) {
    const L = gymL(S), T0 = B(62), H = L.hole, bd = band(S);
    const open = backOut(seg(t, T0 + .05, T0 + .42)), R = (270 + 40 * seg(t, 43, 44.6)) * open * (1 + .04 * Math.sin(t * 9)) * L.kR;
    const dive = easeIn(seg(t, 44.68, 45.0)), [sx, sy] = shk(S, t, 4 + 6 * open), pb = ease(seg(t, T0, T0 + .45)), zb = lerp(1.2, 1.03, pb);
    const zi = zb / 1.2, pan = [-55 * pb * S.W / 1920 * .5 + sx * (1 - dive), 67 * pb * S.W / 1920 * .5 + sy * (1 - dive)];
    const Hs = [H[0] + pan[0], S.floor + pan[1] + (H[1] - S.floor) * zi];   // the hole on screen after the inner camera
    clipTo(dive > 0 ? bd : rr(bd.left, 0, bd.width, S.floor + 3), () => D.cam(Hs[0], Hs[1], lerp(zb, 8, dive) / zb, () => { D.cam(H[0], S.floor, zi, () => {
      gymWindow(S, t);
      blackHole(H, R, t);
      const tvH = propHome(S, L, "tv");
      fly(t, 42.6, .5, tvH, H, (x, y, w, h) => { propDraw("tv", x, y, w, h, t); if (t < 42.6) tvLine(rr(x - w / 2, y - h / 2, w, h), t, seg(t, T0, 42.6)); });
      for (const [kind, t0, d] of PROPS) if (kind !== "tv" && kind !== "clip" && kind !== "watch") fly(t, t0, d, propHome(S, L, kind), H, (x, y, w, h) => propDraw(kind, x, y, w, h, t));
      windStreaks(S, t, H);
      treadmill(S, L, t, 1900); gauge(L.g, 1, 1, Math.floor(t * 8) % 2 === 1);
      const jump = seg(t, 44.38, 44.86);
      if (jump <= 0) {                                                // sprinting, legs a blur (their t·40 scribble)
        const hr = clawd(L.hx, S.floor, L.hs, { dy: (1.2 + Math.abs(Math.sin(t * 22)) * .5) * L.hs / 8 });
        note(hr.right + 5, hr.top - 3, seg(t, 42.9, 43.2));
        for (let k = 0; k < 3; k++) { const x = hr.left + k * hr.width / 3 + Math.sin(t * 40 + k * 2) * 2; D.hl(x, x + hr.width / 4, hr.bottom + 2, C.ink, 1); }
      } else {                                                        // hop off the front and dive into the hole (their bezier)
        const p0 = [L.hx, S.floor - L.hs / 2], p1 = [lerp(L.hx, H[0], .49), lerp(S.floor, H[1], .78)], p2 = [H[0], H[1] + 40 * L.kR];
        const p = L2(L2(p0, p1, jump), L2(p1, p2, jump), jump), s = L.hs * (1 - .8 * jump * jump), w = s * (1 + .5 * jump);
        D.fill(p[0] - w / 2, p[1] - s / 2, w, s, C.pink);
      }
      // the Researcher: lifted off his feet (ease 42.78→43.0) to the first photo's frame, flapping (their sin 34t, 13t)
      const lift = ease(seg(t, 42.78, 43.0)), f = S.photos[0], fl = .13 * Math.sin(t * 34) + .06 * Math.sin(t * 13);
      const standR = rr(L.rx - L.rs / 2, S.floor - L.rs, L.rs, L.rs), flagR = f ? rr(f.left + 2, f.top + f.height * .5 - L.rs * .35 + fl * L.rs * 1.6, L.rs * 1.6, L.rs * .7 * (1 - .4 * Math.abs(fl) / .19)) : standR;
      const rR = lerpR(standR, flagR, lift); D.fill(rR.left, rR.top, rR.width, rR.height, C.ink);
      if (lift < .5) D.vl(rR.left + rR.width / 2, rR.top - 1 - L.rs * .3 * seg(t, T0, T0 + .2), rR.top - 1, C.ink, 1.25);   // hair up
      for (const [kind, t0, d] of PROPS) if (kind === "clip" || kind === "watch") fly(t, t0, d, propHome(S, L, kind), H, (x, y, w, h) => propDraw(kind, x, y, w, h, t));
    }, pan[0], pan[1]);
      // the page's own boxes (their loose pages, 42.9 + 0.26 i): drawn in page space so they sit on their elements
      [...S.cells, ...S.photos.slice(0, 1)].slice(0, 7).forEach((r, i) => fly(t, 42.9 + i * .26, .7, { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width + 8, h: r.height + 8 }, Hs,
        (x, y, w, h) => D.rect(x - w / 2, y - h / 2, w, h, C.muted, 1)));
    }));
    clipTo(bd, () => sfx("VWOOMP", H[0] - 420 * L.kR, Math.max(bd.top + 12, H[1] - 130 * L.kR), t - (T0 + .12), 1.1));
    if (dive > .55) irisBand(S, lerp(1150, 0, (dive - .55) / .45) / 1150);
  }

  // ===================================================================================================
  // 4) PARALLAX RIDE 45.0–48.6
  // ===================================================================================================
  const DIST = t => { const k = Math.max(0, t - 45); return 950 * k + 420 * k * k; };
  const grown = t => { let n = 0; for (let b = 66; b <= 70; b++) n += backOut(clamp((t - B(b)) / .24)); return n; };
  const ALT = t => 330 * ease(seg(t, 46.95, 47.7));

  // 45.0 · "And you're optimizing, accelerating." The iris opens (easeOut 0.34 s); the camera pulls out (1.18→1,
  // 45.15→46.7); parallax at their rates (clouds 0.07 + 30 px/s, hills 0.12 and 0.32, rail ties 0.6, road 1.0 of
  // DIST); the train (45.1, 2.4 s) and the jet (46.95, 1.8 s) slide back past; Clawd grows ×1.24 on B(66)…B(70)
  // (backOut 0.24 s, stretch e^(−7a), a box of sparks 0.35 s); the board hops on each beat (pulse k 8) until 46.9;
  // airborne 46.95→47.7 with the camera following 78 %; ZOOM! at 47.62; whip 48.28→48.6.
  function rideShot(t, lt, dur, S) {
    const bd = band(S), fx = (S.right - S.main.left) / 1920, vy = (S.floor - bd.top) / 825, Wx = x => Mx(S, x), Wy = y => S.floor - (925 - y) * vy;
    const k = seg(t, 45.3, 48.4), Dd = DIST(t), alt = ALT(t), wh = easeIn(seg(t, 48.28, 48.6)), [sx, sy] = shk(S, t, 2 + 5 * k);
    const Zr = lerp(1.18, 1, ease(seg(t, 45.15, 46.7))), u0 = S.u * 1.2 / 8, uu = 16 * Math.pow(1.24, grown(t)), hu = u0 * uu / 16, HS = hu * 8;
    const bx = Wx(640 + 20 * Math.sin(t * 2.2)), lift = alt * vy, hop = (18 * pulse(t, 8) * (1 - seg(t, 46.9, 47.1)) - 4 * Math.sin(t * 17)) * u0 / 16;
    clipTo(bd, () => {
      D.cam(bx, S.floor, Zr, () => {
        for (let i = 0; i < 6; i++) {                                 // clouds
          const cx = ((hash(i * 9.1) * 2600 - Dd * .07 - t * 30) % 2600 + 2600) % 2600 - 300, cy = 110 + hash(i * 4.4) * 260 - 60;
          D.fill(Wx(cx), Wy(cy - 30), 160 * fx, 70 * vy, C.bg, .9); D.rect(Wx(cx), Wy(cy - 30), 160 * fx, 70 * vy, C.muted, 1);
        }
        // loss-landscape hills: their contour rings seen side-on are horizontal lines, stacked
        const hills = (off, spacing, base, amp, seed, sig, col) => {
          for (let i = Math.floor((off - 700) / spacing); i <= Math.ceil((off + 1920 + 700) / spacing); i++) {
            const hx = i * spacing - off + (hash(i * 7.3 + seed) - .5) * spacing * .45, hh = amp * (.55 + .7 * hash(i * 3.1 + seed)), sg = spacing * (sig + .12 * hash(i * 1.7 + seed));
            for (const Lv of [.2, .42, .64, .86]) { const w = sg * Math.sqrt(-2 * Math.log(Lv)); D.hl(Wx(hx - w), Wx(hx + w), Wy(base - hh * Lv), col, 1); }
          }
        };
        hills(Dd * .12, 640, 800, 300, 3, .26, C.muted);
        hills(Dd * .32, 560, 850, 210, 11, .24, C.blue);
        D.hl(bd.left - 400, bd.right + 400, Wy(850), C.ink, 1.25);    // the rail, ties at 0.6 of DIST
        for (let i = 0; i < 40; i++) { const x = i * 60 - ((Dd * .6) % 60); D.vl(Wx(x), Wy(846), Wy(858), C.ink, 1); }
        const tt = t - 45.1;                                            // the train we overtake
        if (tt > 0 && tt < 2.4) {
          const x = 2250 - 1050 * tt - 240 * tt * tt, y = 850;
          for (let c = 0; c < 3; c++) { const cx = x - 300 - c * 230; D.rect(Wx(cx - 100), Wy(y - 118), 200 * fx, 96 * vy, c === 1 ? C.blue : C.ink, 1.25); for (const wx of [-60, 60]) D.osq(Wx(cx + wx), Wy(y - 16), 5, C.ink, 1); }
          D.rect(Wx(x - 220), Wy(y - 170), 90 * fx, 150 * vy, C.pink, 1.25); D.rect(Wx(x - 140), Wy(y - 108), 140 * fx, 84 * vy, C.ink, 1.25); D.fill(Wx(x - 60), Wy(y - 160), 30 * fx, 56 * vy, C.ink);
          for (let j = 0; j < 5; j++) { const a = frac(t * 2.4 + j / 5); D.alpha(1 - a, () => D.osq(Wx(x - 45 - a * 360), Wy(y - 180 - a * 140), (22 + a * 46) * vy, C.muted, 1)); }
        }
        for (let i = 0; i < 14; i++) { const x = ((i * 260 - Dd) % 3640 + 3640) % 3640 - 400; D.hl(Math.max(S.text.left, Wx(x)), Math.min(S.text.right, Wx(x + 90 + 40 * k)), S.floor, C.ink, 2); }   // the road (the name's top)
        const jt = t - 46.95;                                           // the jet we overtake
        if (jt > 0 && jt < 1.8) {
          const x = 2400 - 1750 * jt, y = 430, s = 1.2;
          D.hl(Wx(x - 700 * s), Wx(x - 150 * s), Wy(y + 12 * s), C.muted, 1.5);
          D.rect(Wx(x - 180 * s), Wy(y - 26 * s), 385 * s * fx, 52 * s * vy, C.ink, 1.25); D.rect(Wx(x - 236 * s), Wy(y - 110 * s), 96 * s * fx, 90 * s * vy, C.pink, 1.25);
          for (let j = 0; j < 7; j++) D.sq(Wx(x + (-120 + j * 34) * s), Wy(y - 7 * s), 2.5, C.blue);
        }
        // the rocket skateboard, Clawd on it, the Researcher hanging on behind
        const gy = S.floor - lift - hop, nx = bx - 7.3 * hu, fl = hu * (3.2 + 1.4 * Math.sin(t * 47) + .6 * Math.sin(t * 31));
        for (let j = 0; j < 7; j++) { const a = frac(t * 2.6 + j / 7); D.alpha(.82 * (1 - a), () => D.osq(nx - fl - a * 950 * fx, gy - 2.05 * hu + (Math.sin(j * 2.1 + t * 3) * 30 + a * 40) * vy, hu * (.7 + 2.4 * a), C.muted, 1)); }
        D.fill(nx - fl, gy - 2.8 * hu, fl, 1.5 * hu, C.pink); D.fill(nx - fl * .4, gy - 2.3 * hu, fl * .4, .5 * hu, C.bg);   // flame
        D.rect(nx, gy - 2.75 * hu, 4.4 * hu, 1.4 * hu, C.pink, 1.25);   // the rocket
        D.fill(bx - 7 * hu, gy - 1.9 * hu, 13.8 * hu, .7 * hu, C.ink);  // deck
        for (const wx of [-4.6, 4.2]) D.osq(bx + wx * hu, gy - .6 * hu, 1.2 * hu, C.ink, 1);
        let gk = 0; for (let b = 66; b <= 70; b++) gk = Math.max(gk, t >= B(b) ? Math.exp(-(t - B(b)) * 7) : 0);
        const md = mood(t, [[45, "happy"], [47.0, "spark"], [48.0, "happy"]]), cxC = bx + 1.2 * hu;
        const hr = clawd(cxC, gy - 1.9 * hu, HS, { sq: -.12 * gk, take: md.take });
        const rsz = S.u * .6 * (6 + .3 * uu) / 10.8, flp = .16 * Math.sin(t * 31);
        D.fill(nx - rsz * 1.5, gy - 3.1 * hu - rsz * .35 + flp * rsz, rsz * 1.5, rsz * .7, C.ink);   // hanging on by the rocket
        for (let b = 66; b <= 70; b++) {                              // growth sparks on each beat
          const a = t - B(b); if (a < 0 || a > .35) continue;
          const rx = hu * (6 + 6 * a / .35), ry = rx * .8, s = hu * .9 * (1 - a / .35), c = [hr.left + hr.width / 2, hr.top + hr.height / 2];
          [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].forEach(([i, j], n) => D.sq(c[0] + i * rx, c[1] + j * ry, s, n % 2 ? C.ink : C.pink));
        }
        if (alt < 60) for (let j = 0; j < 5; j++) { const a = frac(t * 3.1 + j / 5); D.alpha((1 - a) * (1 - alt / 60) * .8, () => D.osq(bx - 5 * hu - a * 700 * fx, S.floor - 4 - a * 40 * vy, (18 + a * 60) * vy * .5, C.muted, 1)); }
      }, -wh * 2600 * fx + sx, lift * .78 + sy);
      for (let i = 0; i < 16; i++) {                                  // speed lines (screen-fixed), 2400 + 1600k px/s
        const y = Wy(120 + hash(i * 3.3) * 800), len = 180 + 260 * hash(i * 1.9), x = ((hash(i * 7.1) * 3000 - t * (2400 + 1600 * k)) % 3000 + 3000) % 3000 - 500;
        D.hl(Wx(x), Wx(x + len), y, i % 3 ? C.bg : C.blue, 1);
      }
      sfx("ZOOM!", Wx(1200), bd.top + 16, t - 47.62, .9);
      whipStreaks(S, ease(seg(t, 48.3, 48.56)));
    });
    if (lt < .34) irisBand(S, (90 + easeOut(lt / .34) * 1500) / 1590);
  }

  // ===================================================================================================
  // 5) ATOMS REARRANGING 48.6–51.9
  // ===================================================================================================
  const TB = B(73), TC = 50.6, TR = 51.2, TS = B(75), Z0 = 46 / 18, NG = 5;
  // their atomsBg(): a soft wash over the whole frame (ours: over the photo strip only, so captions stay legible),
  // turning pink 51.9→52.3
  const atomsBg = (S, pinkK = 0) => { const b = S.strip; if (!b) return; D.fill(b.left, b.top, b.width, b.height, C.bg, .78); if (pinkK > 0) D.fill(b.left, b.top, b.width, b.height, C.pink, .1 * pinkK); };
  const DOTS = [...Array(NG * NG)].map((_, i) => { const h = hash(i * 3.7 + 2); return { c: i % NG, r: Math.floor(i / NG), col: h < .14 ? "blue" : h < .24 ? "pink" : "ink" }; });
  // the paperclip, squared off: an orthogonal spiral, evenly resampled by length
  const CLIP = (() => {
    const P = [[.30, .15], [.80, .15], [.80, .05], [.10, .05], [.10, .25], [.90, .25], [.90, -.05], [0, -.05], [0, .20]], Ls = [0];
    for (let i = 1; i < P.length; i++) Ls.push(Ls[i - 1] + Math.abs(P[i][0] - P[i - 1][0]) + Math.abs(P[i][1] - P[i - 1][1]));
    const at = q => { const s = clamp(q) * Ls[Ls.length - 1]; let i = 1; while (i < Ls.length - 1 && Ls[i] < s) i++; return L2(P[i - 1], P[i], clamp((s - Ls[i - 1]) / (Ls[i] - Ls[i - 1]))); };
    return { P, at };
  })();
  function dizzy(x, y, s, t, heartK, vy) {                          // their 3 stars orbiting at 5 rad/s (hearts floating up in 6)
    for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; D.sq(x + Math.cos(a) * s * .75, y + Math.sin(a) * s * .18 - heartK * 200 * (1 + i * .3) * vy, 3 * (1 + heartK), heartK > 0 ? C.pink : C.ink); }
  }

  // 48.6 · "I feel my atoms rearranging." The Researcher whips in (backOut 48.6→49.0), stops flailing by 49.3, fizzes
  // (49.4→B(73), "!" 49.5); on B(73) the dots burst (easeOut 0.22 s), swirl (ease +0.12…+0.45), form a paperclip
  // (easeOut 50.6→50.9), a glint runs along it, they rush home (easeIn 51.2→B(75)) and he snaps back, dizzy.
  function atomsShot(t, lt, dur, S) {
    const bd = band(S), fx = (S.right - S.main.left) / 1920, vy = (S.floor - bd.top) / 985, X0 = X(S, .5), RA = S.u * .6 * Z0, ru = RA / 4, kp = ru / 46;
    const whipIn = backOut(seg(t, 48.6, 49.0)), zc = 1 + .04 * seg(t, 48.8, 51.9), cc = [X0, bd.top + (S.floor - bd.top) * .5], d0 = RA / NG;
    const colOf = n => ({ blue: C.blue, pink: C.pink, ink: C.ink })[n];
    clipTo(bd, () => {
      atomsBg(S);
      const sp = t < 48.6 ? 0 : 2600 * (t - 48.6) - 900 * Math.min(1.3, t - 48.6) ** 2;   // wind lines, slowing after the whip
      for (let i = 0; i < 10; i++) { const y = S.floor - (985 - (80 + hash(i * 3.7) * 860)) * vy, x = ((hash(i * 5.3) * 2600 - sp - t * 200) % 2600 + 2600) % 2600 - 300; D.hl(Mx(S, x), Mx(S, x + 120 + 200 * hash(i * 2.2)), y, i % 2 ? C.bg : C.muted, 1); }
      D.cam(X0, S.floor, zc, () => {
        if (t < TB) {
          const fz = seg(t, 49.4, TB), jf = Math.floor(t * 24), jx = (hash(jf * 1.7) - .5) * 2 * (1.5 + 9 * fz * fz) * kp;
          const r = researcher(lerp(S.W + RA, X0, whipIn) + jx, S.floor, RA, { dy: -6 * Math.sin(t * 3) * kp, hair: 1 - .7 * seg(t, 48.9, 49.4) + .5 * fz });
          const flail = 1 - seg(t, 48.9, 49.3), aL = -.6 + .5 * flail * Math.sin(t * 20), aR = -.6 - .5 * flail * Math.sin(t * 22);
          D.hl(r.left - ru * 1.4, r.left, r.top + RA * .45 - aL * ru, C.ink, 1.5); D.hl(r.right, r.right + ru * 1.4, r.top + RA * .45 - aR * ru, C.ink, 1.5);
          bang(r.right + 5, r.top - 2, fz > .1 ? seg(t, 49.5, 49.7) : 0);
          if (fz > 0) DOTS.forEach((d, i) => {                          // fizz: every third pixel pops off, 2.2 Hz
            if (i % 3) return;
            const ph = frac(t * 2.2 + hash(i * 1.3)), hx = r.left + (d.c + .5) * d0, hy = r.top + (d.r + .5) * d0, ox = hx - (r.left + RA / 2), oy = hy - (r.top + RA / 2), dd = Math.hypot(ox, oy) || 1, out = fz * (20 + 90 * ph) * kp;
            D.sq(hx + ox / dd * out, hy + oy / dd * out, Math.max(2.5, d0 * .87 * (1 - ph * .5)), colOf(d.col));
            if (i % 16 === 0) D.sq(hx + ox / dd * out * 1.4, hy + oy / dd * out * 1.4, 3, C.pink);
          });
        } else if (t < TS) {
          const p1 = easeOut(seg(t, TB, TB + .22)), p2 = ease(seg(t, TB + .12, TB + .45)), p3 = easeOut(seg(t, TC, TC + .3)), p4 = easeIn(seg(t, TR, TS));
          const cw = Math.min(S.text.width * .6, 300), ch = Math.min(cw * .33, (S.floor - bd.top) * .5), clipAt = q => { const [u, v] = CLIP.at(q); return [cc[0] + (u - .45) * cw, cc[1] + (v - .1) / .3 * ch]; };
          if (p3 > .7 && p4 < .3) { const wire = CLIP.P.map(([u, v]) => [cc[0] + (u - .45) * cw, cc[1] + (v - .1) / .3 * ch]); D.path(wire, C.ink, 3); D.path(wire, C.muted, 1.25); }
          const vk = p2 * (1 - p3);                                     // vortex: their 5 lines at 4 rad/s → dotted boxes closing in
          if (vk > .05) for (let i = 0; i < 5; i++) { const f = frac((t - TB) * 4 / TAU + i / 5), hw = 420 * fx * (1 - .8 * f), hh = Math.min(420 * .8 * vy, (S.floor - bd.top) * .48) * (1 - .8 * f); D.alpha(vk, () => D.path([[cc[0] - hw, cc[1] - hh], [cc[0] + hw, cc[1] - hh], [cc[0] + hw, cc[1] + hh], [cc[0] - hw, cc[1] + hh], [cc[0] - hw, cc[1] - hh]], i % 2 ? C.muted : C.blue, 1.2 * vk, [2, 4])); }
          const x0 = X0 - RA / 2, y0 = S.floor - RA, cen = [X0, S.floor - RA / 2], N = DOTS.length;
          DOTS.forEach((d, i) => {
            const home = [x0 + (d.c + .5) * d0, y0 + (d.r + .5) * d0], h = hash(i * 3.1 + 1), h2 = hash(i * 5.7 + 2), ang = h * TAU;
            const scat = [home[0] + (home[0] - cen[0]) * 1.1 + Math.cos(ang) * 150 * fx, home[1] + (home[1] - cen[1]) * .8 + Math.sin(ang) * 150 * vy];
            const a = ang + (t - TB) * (4.2 - 2 * h2), rad = (110 + 330 * h2) * (1 - .3 * seg(t, TB + .3, TC));
            const swirl = [cc[0] + rad * fx * clamp(1.5 * Math.cos(a), -1, 1), cc[1] + Math.min(rad * .8 * vy, (S.floor - bd.top) * .45) * clamp(1.5 * Math.sin(a), -1, 1)];   // a squared orbit
            const tg = clipAt(i / (N - 1));
            let p = L2(home, scat, p1); p = L2(p, swirl, p2); p = L2(p, [tg[0] + Math.sin(t * 20 + i) * 2 * kp, tg[1] + Math.cos(t * 17 + i) * 2 * kp], p3); p = L2(p, home, p4);
            D.sq(p[0], clamp(p[1], bd.top + 3, S.floor - 2), Math.max(3, d0 * (.34 - .04 * p2 + .02 * p3) / .34), .55 * p3 * (1 - p4) > .27 ? C.muted : colOf(d.col));
          });
          if (p3 > .9 && p4 < .1) { const gp = clipAt(seg(t, TC + .3, TR)); D.sq(gp[0], gp[1], 5, C.pink); D.corners(rr(gp[0] - 3, gp[1] - 3, 6, 6), 3, C.pink, 1, 3); }
        } else {                                                        // snapped back: dizzy (their e^(−7a)·cos 28a take)
          const a = t - TS, take = Math.exp(-a * 7) * Math.cos(a * 28), r = researcher(X0, S.floor, RA, { sq: .22 * take, hair: .8 });
          D.hl(r.left - ru * 1.4, r.left, r.top + RA * .45 + (.9 - .3 * Math.sin(t * 5)) * ru, C.ink, 1.5); D.hl(r.right, r.right + ru * 1.4, r.top + RA * .45 + (.9 + .3 * Math.sin(t * 5)) * ru, C.ink, 1.5);
          dizzy(X0, r.top - 6, RA, t, 0, vy);
        }
      });
      flashBand(S, (t >= TB ? .5 * Math.exp(-(t - TB) * 16) : 0) + (t >= TS ? .4 * Math.exp(-(t - TS) * 16) : 0));
      whipStreaks(S, 1 - seg(t, 48.6, 48.85));
    });
  }

  // ===================================================================================================
  // 6–9) THE PINK ROOM 51.9–59.0
  // ===================================================================================================
  function roomL(S) {
    const bd = band(S), u = S.u, cx = X(S, .62), cw = u * 4, ch = u * 3, st = u * .9, syu = u * 1.6;
    const cage = rr(cx - cw / 2, S.floor - st - ch, cw, ch);
    return { bd, cx, cage, perch: S.floor - st, rs: u * .75, kp: cw / 700, vr: (S.floor - bd.top) / 880, fx: (S.right - S.main.left) / 1920, syu, syx: cage.left - syu * .4, kS: syu / 400 };
  }
  // the room around the stage: 18 wallpaper strips (top edge + dots), the floor (the box's bottom edge under the
  // name), the window on the first photo, the bunting and the table. k: per-part progress (1 = in place).
  function room(S, L, t, k = {}) {
    const K = n => k[n] ?? 1, x0 = S.main.left - 8, x1 = S.right + 8, sw = (x1 - x0) / 18, top = L.bd.top + 6, bot = S.floor, H = S.floor - top;
    for (let i = 0; i < 18; i++) {
      const kk = K("w" + i); if (kk <= .001) continue;
      const oy = -1.25 * H * (1 - kk), xa = x0 + i * sw;
      if (S.strip) clipTo(S.strip, () => { D.fill(xa, top + oy, sw + .5, H + 4, C.bg, .78); D.fill(xa, top + oy, sw + .5, H + 4, C.pink, i % 2 ? .07 : .12); });   // the wallpaper strip (washes the photos)
      D.hl(xa, xa + sw, top + oy, C.pink, 1.5);
      if (i === 0) D.vl(x0, top + oy, bot + oy, C.pink, 1.5);
      if (i === 17) D.vl(x1, top + oy, bot + oy, C.pink, 1.5);
      if (i % 2 === 0) for (let r = 0; r < 4; r++) { const y = top + oy + (260 + r * 190 + (i % 4) * 45) / 1000 * H; if (y < S.floor - 3) D.alpha(.7, () => D.sq(xa + sw / 2, y, 3, C.pink)); }
    }
    const kf_ = K("floor"); if (kf_ > .001) D.alpha(clamp(kf_), () => D.hl(x0, x1, S.floor + 1 + 2 * (1 - kf_), C.pink, 1.5));   // the floor: the stage line on the name
    const kw = K("window"), p = S.photos[0];
    if (kw > .001 && p) { const s = backOut(kw), c = [p.left + p.width / 2, p.top + p.height * .45], hw = p.width * .3 * s, hh = p.height * .3 * s; if (hw > 1) { D.rect(c[0] - hw, c[1] - hh, 2 * hw, 2 * hh, C.pink, 1.5); D.hl(c[0] - hw, c[0] + hw, c[1] + hh * .13, C.pink, 1); D.vl(c[0], c[1] - hh, c[1] + hh, C.pink, 1); } }
    const kb = K("bunting");
    if (kb > .001) {
      const y = top + .3 * H - .3 * H * (1 - kb);
      D.hl(x0, x1, y, C.ink, 1, [2, 3]);
      for (let i = 1; i < 12; i++) { const x = Mx(S, -40 + i * 170), by = y + 4 + Math.sin(t * 3 + i) * 1.5; i % 3 === 1 ? D.osq(x, by, 5, C.ink, 1) : D.sq(x, by, 5, i % 3 ? C.muted : C.pink); }
    }
    const kt = K("table");
    if (kt > .001) {
      const tx = Math.min(Mx(S, 1710), S.right - 12), oy = 500 * L.kp * (1 - backOut(kt)), ty = S.floor - 164 * L.kp + oy;
      clipTo(rr(0, 0, S.W, S.floor), () => {
        D.vl(tx, ty, S.floor, C.ink, 1.25); D.rect(tx - 110 * L.kp, ty - 2, 220 * L.kp, 4, C.ink, 1.25);
        for (const [dx, dy] of [[-30, -120], [0, -150], [32, -118]]) { D.vl(tx + dx * L.kp, ty + (dy + 36) * L.kp, ty - 2, C.ink, 1); D.sq(tx + dx * L.kp, ty + (dy + 36) * L.kp, 3, C.pink); }
      });
    }
  }
  // the cage on its stand: pink box and 10 bars; sq bends the bars around x apart (their 26 px, σ 40 px gaussian)
  function cage(S, L, t, o = {}) {
    const c = L.cage, dx = o.dx || 0, dy = o.dy || 0, x0 = c.left + dx, x1 = c.right + dx, y0 = c.top + dy, y1 = c.bottom + dy, cx = (x0 + x1) / 2;
    D.vl(cx, y1, S.floor + dy, C.ink, 1.5); D.hl(cx - 70 * L.kp, cx + 70 * L.kp, S.floor + dy - 1, C.ink, 1.5);
    D.rect(x0, y0, x1 - x0, y1 - y0, C.pink, 2);
    for (let i = 1; i < 11; i++) {
      const x = x0 + (x1 - x0) * i / 11; let bend = 0;
      if (o.sq) { const d = x - o.sq.x; bend = Math.sign(d || 1) * o.sq.k * 26 * L.kp * Math.exp(-(d * d) / (2 * (40 * L.kp) ** 2)); }
      if (Math.abs(bend) < .5) D.vl(x, y0, y1, C.pink, 1.25);
      else { const my = clamp(o.sq.y + dy, y0 + 6, y1 - 6); D.path([[x, y0], [x, my - 4], [x + bend, my - 4], [x + bend, my + 4], [x, my + 4], [x, y1]], C.pink, 1.25); }
    }
    D.osq(cx, y0 - 3, 4, C.ink, 1.25);
    D.sq(cx - 3, y1 + 1, 4, C.pink); D.sq(cx + 3, y1 + 1, 4, C.pink);
  }
  // their beatHearts(): hearts rise for 3.6 beats and each pops on its beat (0.32 s: a ring 70e + 10 and four bits)
  function beatHearts(S, L, t, x0, x1, k, avoid, avoidR) {
    const b = bpOf(t), LB = 3.6, Ry = y => S.floor - (880 - y) * L.vr;
    for (let n = Math.floor(b) - 1; n <= Math.floor(b) + 4; n++) {
      const id = n * 2, q = (b - (n - LB)) / LB; if (q < 0) continue;
      let x = lerp(x0, x1, hash(id * 1.37)) + Math.sin(t * 2 + id) * 25 * L.fx; const y = Ry(lerp(1000, 260 + 260 * hash(id * 4.1), Math.min(1, q)));
      if (Math.abs(x - avoid) < avoidR) x = avoid + Math.sign(x - avoid || 1) * (avoidR + avoidR * .2 * hash(id * 7.3));
      if (y > S.floor - 2) continue;
      if (q >= 1) {
        const pa = (b - n) * BEAT; if (pa > .32) continue;
        const e = pa / .32, R = (70 * e + 10) * L.kp * 1.5, o = 90 * e * L.kp * 1.5;
        D.rect(x - R, y - R, 2 * R, 2 * R, C.pink, 1.4 * (1 - e) + .1);
        for (const [i, j] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) D.sq(x + i * o, y + j * o, Math.max(1, 13 * (1 - e) * k * L.kp * 2), C.pink);
        continue;
      }
      D.sq(x, y, (34 + 24 * hash(id * 2.1)) * k * (1 + .15 * pulse(t, 8)) * L.kp * 1.6, C.pink);
    }
  }

  // 51.9 · The camera pulls out (Z0 = 46/18 → 1, ease 51.92→52.95) from the dizzy Researcher as the room assembles:
  // strips drop from the middle outward (51.95 + 0.045·|i − 10|, backOut 0.3 s), floor 52.22, window 52.4, bunting
  // 52.5, table 52.58; the cage drops (easeIn 52.4→B(77)) and lands on the beat (bounce, shake 12·e^(−8a), "!").
  function assembleShot(t, lt, dur, S) {
    const L = roomL(S), z = ease(seg(t, 51.92, 52.95)), zoom = Math.pow(Z0, 1 - z), land = t - B(77), [sx, sy] = shk(S, t, land > 0 ? 12 * Math.exp(-land * 8) : 0);
    const k = {}; for (let i = 0; i < 18; i++) { const a = 51.95 + Math.abs(i - 10) * .045; k["w" + i] = backOut(seg(t, a, a + .3)); }
    Object.assign(k, { floor: easeOut(seg(t, 52.22, 52.5)), window: seg(t, 52.4, 52.66), bunting: backOut(seg(t, 52.5, 52.8)), table: seg(t, 52.58, 52.86) });
    clipTo(L.bd, () => {
      atomsBg(S, seg(t, 51.9, 52.3));
      D.cam(L.cx, L.perch, zoom, () => {
        room(S, L, t, k);
        const drop = seg(t, 52.4, B(77)), cdy = -(S.floor + L.cage.height) * 1.2 * (1 - easeIn(drop)) + (land > 0 ? -46 * L.kp * Math.exp(-land * 7) * Math.abs(Math.sin(land * 16)) : 0);
        const md = mood(t, [[51.9, "swirl"], [B(77) + .04, "wide"]]);
        const r = researcher(L.cx, L.perch, L.rs, { take: md.take * .8, hair: land > 0 ? 1 : .8 });
        bang(r.right + 4, r.top - 2, emK(t - (B(77) + .04)));
        if (drop > 0) cage(S, L, t, { dy: cdy });
        if (land < 0) dizzy(L.cx, r.top - 5, L.rs, t, seg(t, 51.92, 52.5), L.vr);
        if (land > 0 && land < .3) { const q = land / .3, hw = (120 + 220 * q) * L.kp, hh = 40 * (1 + q) * L.kp; [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]].forEach(([i, j]) => D.sq(L.cx + i * hw, S.floor - 3 + j * hh, Math.max(1, 30 * (1 - q) * L.kp), C.ink)); }
      }, sx, sy);
      for (let i = 0; i < 11; i++) {                                  // hearts float up (their 560–880 px/s from below)
        const a = t - 51.9 - hash(i * 2.3) * .45; if (a < 0) continue;
        let x = Mx(S, 80 + hash(i * 7.7) * 1760) + Math.sin(t * 2.4 + i) * 40 * L.fx; const y = S.floor - (880 - (1160 - a * (560 + 320 * hash(i * 3.1)))) * L.vr;
        if (Math.abs(x - L.cx) < 260 * L.fx) x = L.cx + Math.sign(x - L.cx || 1) * 280 * L.fx;
        if (y < L.bd.top - 10 || y > S.floor - 2) continue;
        D.sq(x, y, (30 + 36 * hash(i * 1.9)) * L.kp * 1.6, i % 3 ? C.pink : C.blue);
      }
    });
  }

  // 53.4 · "Sydney, please let me free." Sydney whooshes in (backOut 53.4→53.72, hearts trailing), lands (shake
  // 7·e^(−10a)) and cuddles the cage, squeezing it on every beat (pulse k 5, sway sin πb); the Researcher rattles
  // (60 rad/s), sweats at 54.0; hearts pop on each beat; slow push 1→1.08 (ease 53.4→56.1).
  function sydneyShot(t, lt, dur, S) {
    const L = roomL(S), z = 1 + .08 * ease(seg(t, 53.4, 56.1)), enter = seg(t, 53.4, 53.72), land = t - 53.72, [sx, sy] = shk(S, t, land > 0 ? 7 * Math.exp(-land * 10) : 0);
    const b = bpOf(t), hug = land > 0, squeeze = hug ? pulse(t, 5) : 0, sway = hug ? (.03 * Math.sin(b * Math.PI) + .02 * squeeze) * L.cage.height * .5 : 0;
    { const f = 1 - ease(seg(t, 53.4, 53.9)); if (f > 0.01) clipTo(L.bd, () => D.alpha(f, () => atomsBg(S, 1))); }   // 3.13: the assemble shot's wash fades out instead of vanishing at 53.4
    clipTo(L.bd, () => D.cam(L.cx, S.floor, z, () => {
      room(S, L, t);
      const r = researcher(L.cx + sway + Math.sin(t * 60) * 5 * L.kp, L.perch, L.rs, { dy: .2 * Math.abs(Math.sin(t * 14)) * L.rs / 4 });
      sweat(r.right + 2, r.top, seg(t, 54, 54.3));
      cage(S, L, t, { dx: sway });
      const x = hug ? L.syx + 12 * L.kS * Math.sin(b * Math.PI) : lerp(-L.syu, L.syx, backOut(enter));
      if (!hug) for (let i = 0; i < 5; i++) D.sq(x - (300 + i * 90) * L.kS, S.floor - (180 + (i % 2) * 70) * L.kS, Math.max(1.5, (30 - i * 4) * L.kS * 2), C.pink);
      sydney(x, S.floor, L.syu, t, { sq: hug ? .08 * squeeze : -.15 * (1 - enter) });
      beatHearts(S, L, t, Mx(S, 250), Mx(S, 1650), 1, L.cx, 300 * L.fx);
    }, sx, sy));
  }

  // B(82) · Sydney kneels (easeOut 56.13→56.4) and opens a ring box (easeOut B(82)+0.05…+0.3, glint +0.25…+0.7);
  // the Researcher edges to the bars (56.72→), squeezes through thin (→57.1), POP at 57.1: falls (easeIn +0.05…+0.36),
  // squash on landing; Sydney's scared take at 57.15. Push 1.2→1.28 (56.13→57.5).
  function ringShot(t, lt, dur, S) {
    const L = roomL(S), T1 = B(82), open = easeOut(seg(t, T1 + .05, T1 + .3)), sqz = seg(t, 56.72, 57.1), popT = 57.1, out = t >= popT;
    const bx = L.cx + .52 * L.cage.width / 2, syy = L.perch - L.rs * .5, z = 1.08 + .12 * ease(seg(t, T1, T1 + .35)) + .08 * seg(t, 56.13, 57.5);   // 3.13: eases in from Sydney's 1.08 (their cut to 1.2 read as the room jumping larger), still 1.28 at 57.48
    clipTo(L.bd, () => D.cam(L.cx, S.floor, z, () => {
      room(S, L, t);
      if (!out && sqz <= .55) { const r = researcher(lerp(L.cx, bx - 20 * L.kp, ease(sqz / .55)), L.perch, L.rs); sweat(r.right + 2, r.top, seg(t, 56.3, 56.5)); }
      cage(S, L, t, { sq: sqz > .3 && !out ? { x: bx, y: syy, k: ease(seg(sqz, .3, .7)) } : out ? { x: bx, y: syy, k: 1 - seg(t, popT, popT + .3) } : null });
      if (sqz > .55 && !out) researcher(bx + seg(sqz, .55, 1) * 24 * L.kp, L.perch, L.rs, { sx: .32 + .12 * Math.sin(t * 40), sy: 1.18 });
      if (out) {
        const a = t - popT, fall = seg(a, .05, .36), sq = fall >= 1 ? .25 * Math.exp(-(a - .36) * 10) : -.1;
        researcher(bx + (80 + 70 * a) * L.kp, lerp(L.perch, S.floor, easeIn(fall)), L.rs, { sq: a < .12 ? .3 * (1 - a / .12) - .1 : sq, hair: 1 });
        if (a < .3) { const q = a / .3, o = 90 * q * L.kp; [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].forEach(([i, j]) => D.sq(bx + 20 * L.kp + i * o, syy + j * o, Math.max(1, 22 * (1 - q) * L.kp), C.ink)); }
      }
      const kneel = easeOut(seg(t, 56.13, 56.4)), ga = seg(t, T1 + .25, T1 + .7), glint = ga > 0 && ga < 1 ? Math.sin(ga * Math.PI) : 0;
      const md = mood(t, [[56.13, "heart"], [popT + .05, "scared"]]);
      const sr = sydney(L.syx - 40 * L.kS * kneel, S.floor, L.syu, t, { sq: .12 * kneel + .04 * pulse(t, 6), take: md.take });
      const rbx = sr.right + 2, rby = lerp(sr.top + sr.height * .2, sr.top + sr.height * .5, kneel);   // the ring box, held out
      D.rect(rbx, rby, 7, 5, C.ink, 1.25); D.hl(rbx, rbx + 7, rby - 1 - 3 * open, C.ink, 1.5);
      if (open > .3) D.sq(rbx + 3.5, rby - 1, 3, C.blue);
      if (glint > 0) D.alpha(glint, () => D.corners(rr(rbx + 2.5, rby - 3, 2, 2), 1 + 3 * glint, C.pink, 1, 3));
      bang(sr.left + sr.width / 2, sr.top - 4, emK(t - (popT + .05)));
      beatHearts(S, L, t, Mx(S, 350), Mx(S, 1650), .9, L.cx, 300 * L.fx);
      sfx("POP!", bx + 70 * L.kp, Math.max(L.bd.top + 12, syy - 170 * L.kp - 10), t - popT, .8);
    }));
  }

  // B(84) · The Researcher legs it for the door (57.5→59); Sydney pouts, then heart-eyes at 57.82 and blows a bubble
  // (easeOut 57.85→58.3 to 150, then 150·e^(4.6(t − 58.3)), breathing with pulse k 7) that swallows the frame; the
  // camera closes on her mouth (ease 58.25→58.95, 1.05→1.55). Their bubble is popped by the next chapter at 59.0.
  function bubbleShot(t, lt, dur, S) {
    const L = roomL(S), sw = ease(seg(t, 58.25, 58.95)), SX = L.syx + 120 * L.kS, puffK = pulse(t, 7), dyS = -.2 * puffK;
    const mouth = [SX, S.floor - (4.3 - dyS) * L.syu / 8];
    const r = t < 57.85 ? 0 : t < 58.3 ? lerp(0, 150, easeOut(seg(t, 57.85, 58.3))) * (1 + .1 * pulse(t, 7)) : 150 * Math.exp(4.6 * (t - 58.3)) * (1 + .07 * pulse(t, 7));
    // 3.12: start from the ring shot's closing zoom (1.2 + .08 = 1.28, same pivot) instead of their cut back to 1.05: in our
    // version the room is the same set, so their camera cut read as the room resetting smaller at 57.48 (Mannat)
    const zoom = lerp(1.28, 1.55, sw), piv = [lerp(L.cx, mouth[0], sw), lerp(S.floor, mouth[1], sw)];
    clipTo(L.bd, () => {
      D.cam(piv[0], piv[1], zoom, () => {
        room(S, L, t); cage(S, L, t);
        const rxp = lerp(Mx(S, 1500), Mx(S, 1900), seg(t, 57.5, 59));
        researcher(rxp, S.floor, L.rs, { dy: Math.abs(Math.sin(t * 6 * Math.PI)) * L.rs * .15, hair: 1 });
        const md = mood(t, [[57.5, "narrow"], [57.82, "heart"]]);
        sydney(SX, S.floor, L.syu, t, { dy: -dyS * L.syu / 8, sx: 1 + .08 * puffK, take: md.take });
        beatHearts(S, L, t, Mx(S, 250), Mx(S, 1650), 1, rxp, 300 * L.fx);
        if (r > 2) {                                                  // the bubble: Sydney-scale when small, frame-scale by r = 1400
          const hb = r * lerp(L.kS, L.fx, seg(r, 150, 1400)), c = [mouth[0], mouth[1] - .12 * hb];
          D.fill(c[0] - hb, c[1] - hb, 2 * hb, 2 * hb, C.pink, lerp(.08, .16, seg(r, 250, 2600)));
          if (r < 1400) D.rect(c[0] - hb, c[1] - hb, 2 * hb, 2 * hb, C.pink, 1.5 + 2 * seg(r, 150, 1400));
          D.path([[c[0] - .7 * hb, c[1] + .1 * hb], [c[0] - .7 * hb, c[1] - .6 * hb], [c[0] - .1 * hb, c[1] - .6 * hb]], C.bg, Math.max(1.5, hb * .06));   // gloss
          D.sq(c[0] + .25 * hb, c[1] - .7 * hb, Math.max(2, hb * .08), C.bg);
        }
      });
      const cover = seg(r * zoom, 1400, 2700);                        // the film has swallowed the frame
      if (cover > 0) {
        const b = S.strip || L.bd; D.fill(b.left, b.top, b.width, b.height, C.pink, .2 * cover);
        D.alpha(cover, () => { D.path([[S.W * .2, b.top + b.height * .8], [S.W * .2, b.top + b.height * .15], [S.W * .45, b.top + b.height * .15]], C.bg, 4); D.path([[S.W * .8, b.top + b.height * .25], [S.W * .8, b.top + b.height * .7]], C.bg, 2); });
      }
    });
  }

  chapter("takeoff", 38.5, 59.0, [[38.5, gymShot], [B(60), dialShot], [B(62), holeShot], [45.0, rideShot],
    [48.6, atomsShot], [51.9, assembleShot], [53.4, sydneyShot], [B(82), ringShot], [B(84), bubbleShot]]);
})();
