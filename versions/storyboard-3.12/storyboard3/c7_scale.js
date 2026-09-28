// c7 · Scale (109.4–123.5). Blue with pink warnings. Transformers all the way down, clicker training gone wrong, the
// chinchilla and the dense cube, fences breaking, the data-center aisle, and RLHF sliding off the stage.
// Every time here is theirs, one for one (src/ch/c07_scale.js); the table is docs/storyboard-timing/c7_scale.md.
// Shot starts: 109.4, 113.5, 115.5, 117.0, 119.0, 120.9 (their chapter() call).
// Their world (1920×1080) is mapped onto our stage: x by a per-shot scale about the name's centre, heights up from the
// name's top (S.floor). Characters are squares with their body unit u = side / 8 (their Clawd is 8u tall), so their
// move()/dy/sq numbers apply as-is.
(() => {
  const { D, C, B, seg, ease, easeIn, easeOut, backOut, pulse, bpOf, beatN, clamp, lerp, hash, frac, rr, kf, move, mood, shakeXY, wob, chapter } = window.__SB;
  const TAU = Math.PI * 2;
  const ctx = () => document.querySelector("canvas[aria-hidden]").getContext("2d");
  const clip = (r, fn) => { const c = ctx(); c.save(); c.beginPath(); c.rect(r.left, r.top, r.width, r.height); c.clip(); fn(); c.restore(); };
  const band = S => S.strip || rr(S.text.left, S.floor - 90, S.text.width, 86);
  const midX = S => S.text.left + S.text.width / 2;
  const heroS = S => S.u * 1.5;
  const RU = 8 / 12;                                                // their researcher is ~12s tall: its dy units → our body units
  // their helpers
  const jit = (t, a, seed = 0) => (hash(Math.floor(t * 24) * 7.31 + seed) - 0.5) * 2 * a;          // their per-frame jit()
  const fly = (x0, y0, vx, vy, age, g = 2200) => [x0 + vx * age, y0 + vy * age + 0.5 * g * age * age];
  const bez = (p0, p1, p2, u) => [(1 - u) ** 2 * p0[0] + 2 * (1 - u) * u * p1[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * (1 - u) * u * p1[1] + u * u * p2[1]];
  const shk = (S, t, amt) => shakeXY(t, amt).map(v => v * S.W / 1920);                             // their shakeXY, scaled to our frame
  const emoteK = age => seg(age, 0.05, 0.3) * (1 - seg(age, 1.4, 1.7));                              // their mood() emote pop
  // a point along a right-angle path (for things that travel a bracket)
  const along = (pts, q) => {
    const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const l = Math.abs(pts[i][0] - pts[i - 1][0]) + Math.abs(pts[i][1] - pts[i - 1][1]); L.push(l); tot += l; }
    let d = q * tot; for (let i = 1; i < pts.length; i++) { if (d <= L[i - 1] || i === pts.length - 1) { const k = L[i - 1] ? clamp(d / L[i - 1]) : 0; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } d -= L[i - 1]; }
    return pts[pts.length - 1];
  };
  // a character: a square standing with its feet at `bottom`. o: dy/dx (their body units, u = s/8; negative dy = up),
  // sq (squash; negative stretches), sx (their horizontal flip/turn scale), col, outline, lw
  function body(x, bottom, s, o = {}) {
    const u = s / 8, sq = o.sq || 0, w = s * (1 + sq) * Math.max(0.06, Math.abs(o.sx ?? 1)), h = s * (1 - sq);
    const cx = x + (o.dx || 0) * u, y = bottom + (o.dy || 0) * u - h;
    if (o.outline) D.rect(cx - w / 2, y, w, h, o.col || C.ink, o.lw || 1.25); else D.fill(cx - w / 2, y, w, h, o.col || C.pink);
    return { x: cx, u, top: y, left: cx - w / 2, right: cx + w / 2, bottom: y + h, width: w, height: h };
  }
  // a popping sound-effect bracket (their sfx(): pop = backOut(age × 5), fades over the last 0.25 s of its life)
  function sfxBox(x, y, w, h, age, life, col = C.pink) {
    if (age < 0 || age > life) return;
    const k = backOut(age * 5), a = 1 - seg(age, life - 0.25, life);
    D.alpha(a, () => D.corners(rr(x - w * k / 2, y - h * k / 2, w * k, h * k), 0, col, 2, 10));
  }

  // ===================================================================================================================
  // 109.4 · "'Just transformers all the way!'" Their self-similar tower (each level K = 1.12× the one above), inside the
  // middle photo. Hold 0.55 s, then tilt down faster and faster: lam = -.9 + .45x² + .06x³ levels, x = lt - .55.
  // Each level squashes on its own beat phase (bp - .2i), the brackets linking level i to i+1 and i+2 light in a
  // ripple (bp - .25i - .5(j-i)), clouds pass every 2.1 levels, speed streaks once the speed passes .6 levels/s, and
  // the cloud sea rises over lt 3.35–4.1.
  // ===================================================================================================================
  function tower(t, lt, dur, S) {
    const r = S.photos[1] || band(S), sc = r.height / 1080, cx0 = r.left + r.width / 2;
    const wx = x => cx0 + (x - 960) * sc, wy = y => r.top + y * sc;
    const K = 1.12, U = 26, x_ = Math.max(0, lt - 0.55), lam = -0.9 + 0.45 * x_ * x_ + 0.06 * x_ ** 3;
    const speed = 0.9 * x_ + 0.18 * x_ * x_;
    const Bc = 8 * U * K / (K - 1), A = 560 + 4 * U - Bc;
    const L = i => { const k = Math.pow(K, i - lam); return { u: U * k, gy: A + Bc * k, k }; };
    const xOf = (i, u) => 960 + u * (0.55 * Math.sin(i * 1.9 + 0.6) + 0.28 * Math.sin(t * 2.3 + i * 0.8));
    const scroll = lam * 8 * U;
    D.fill(r.left, r.top, r.width, r.height, C.bg, 0.88);
    clip(r, () => {
      // far cloud wisps drift up slowly (parallax .35)
      for (let k = 0; k < 6; k++) {
        const yy = ((k * 330 - scroll * 0.35) % 1980 + 1980) % 1980 - 400, side = k % 2 ? 1 : -1, x = 960 + side * (560 + 140 * hash(k));
        D.rect(wx(x - 330), wy(yy - 90), 660 * sc, 180 * sc, C.rule, 1);
      }
      // speed streaks rushing up past the tower, once speed > .6 levels/s
      if (speed > 0.6) for (let k = 0; k < 9; k++) {
        const xx = 120 + hash(k * 3) * 1680, len = 60 * speed, yy = ((hash(k) * 1400 - scroll * (0.8 + 0.4 * hash(k + 1))) % 1400 + 1400) % 1400 - 200;
        if (Math.abs(xx - 960) < 330) continue;
        D.vl(wx(xx), wy(yy), wy(yy + len), C.muted, 1);
      }
      const i0 = Math.max(0, Math.floor(lam) - 5), i1 = Math.floor(lam) + 4, vis = [];
      for (let i = i0; i <= i1; i++) { const l = L(i); if (l.gy - 8 * l.u < 1080 + 60 && l.gy > -40) vis.push(i); }
      // attention links (their arcs): a right-angle bracket from level i's side to level j's, lit by the beat ripple
      for (const i of vis) for (const [j, side] of [[i + 1, i % 2 ? 1 : -1], [i + 2, i % 2 ? -1 : 1]]) {
        const a = L(i), b = L(j);
        const p0 = [xOf(i, a.u) + side * 4 * a.u, a.gy - 4.8 * a.u], p2 = [xOf(j, b.u) + side * 4 * b.u, b.gy - 4.8 * b.u];
        const bulge = (p2[1] - p0[1]) * 0.35 + 1.5 * a.u, xb = (side > 0 ? Math.max(p0[0], p2[0]) : Math.min(p0[0], p2[0])) + side * bulge;
        const pts = [p0, [xb, p0[1]], [xb, p2[1]], p2].map(([x, y]) => [wx(x), wy(y)]);
        const lit = Math.exp(-frac(bpOf(t) - i * 0.25 - (j - i) * 0.5) * 3);
        D.path(pts, C.rule, 1);
        D.alpha(0.3 + 0.7 * lit, () => D.path(pts, lit > 0.5 ? C.pink : C.blue, 1 + 0.9 * lit));
        for (const off of [0, 0.5]) { const q = along(pts, frac(t * 0.9 + hash(i * 3 + j) + off)); D.sq(q[0], q[1], Math.max(2, (5 + 4 * lit) * a.k * sc * 2), C.pink); }
        D.sq(pts[0][0], pts[0][1], Math.max(2, 7 * a.k * sc * 2), C.ink);
      }
      // the levels, lowest (biggest) first; each squashes .08 on its own beat phase
      for (let n = vis.length - 1; n >= 0; n--) {
        const i = vis[n], { u, gy } = L(i), x = xOf(i, u), bp = bpOf(t) - i * 0.2, hit = Math.exp(-frac(bp) * 5);
        const col = i === 0 ? C.pink : i % 4 === 2 ? C.blue : i % 7 === 5 ? C.muted : C.ink;
        body(wx(x), wy(gy), 8 * u * sc, { sq: 0.08 * hit, col, outline: i !== 0, lw: 1.25 });
        if (i === 0) {   // the researcher proudly on top, bouncing, gesturing down the tower on each beat
          const s = 8 * u * 0.72 * sc * 0.6, rb = body(wx(x - 0.3 * u), wy(gy - 8 * u + u * 0.05), s, { dy: -Math.abs(Math.sin(bpOf(t) * Math.PI)) * 0.5 * RU, col: C.ink });
          D.hl(rb.right, rb.right + s * (0.6 + 0.4 * pulse(t, 5)), rb.top + s * 0.4, C.ink, 1.25);
        }
      }
      // cloud layers the tower pierces, passing in front (every 2.1 levels, drifting with wob(t, .25))
      const clump = (x, y, w, h) => { D.fill(wx(x - w), wy(y - h), 2 * w * sc, 2 * h * sc, C.bg); D.rect(wx(x - w), wy(y - h), 2 * w * sc, 2 * h * sc, C.rule, 1); };
      for (let m = -1; m < 4; m++) {
        const c = (Math.floor((lam - 1.3) / 2.1) + m) * 2.1 + 1.3;
        if (c < 1) continue;
        const { u, gy } = L(c); if (gy < -300 || gy - 3 * u > 1080 + 150) continue;
        const side = Math.round(c / 2.1) % 2 ? 1 : -1, dr = wob(t, 0.25, c) * u * 0.4;
        clump(960 + side * 9.5 * u + dr, gy, 7 * u, 2 * u);
        clump(960 - side * 12 * u - dr, gy - 1.8 * u, 5.5 * u, 1.6 * u);
      }
      // the cloud sea rises as we sink into it (lt 3.35–4.1, ease)
      const sea = seg(lt, 3.35, 4.1);
      if (sea > 0) {
        const top = lerp(1080 + 160, 480, ease(sea));
        D.fill(r.left, wy(top + 60), r.width, r.bottom - wy(top + 60) + 1, C.bg);
        for (let k = 0; k < 5; k++) clump(-80 + k * 520, top + 40 + 30 * Math.sin(k * 2.1), 330, 150);
      }
    });
  }

  // ===================================================================================================================
  // 113.5 · "Till you learned to disobey." Clicker training: sit B(166.5), spin B(167), paw B(167.5); turns away B(168),
  // shades drop B(168.5), arms fold B(169) with a camera punch. Ten clicks on their times.
  // ===================================================================================================================
  function disobey(t, lt, dur, S) {
    const tS = B(166.5), tSp = B(167), tP = B(167.5), tT = B(168), tSh = B(168.5), tX = B(169);
    const clicks = [tS, tSp, tP, tT, tT + 0.15, tSh - 0.12, tSh + 0.06, tX - 0.12, tX + 0.05, tX + 0.2];
    const sc = S.text.width / (1920 / 1.3), Xc = midX(S), wx = x => Xc + (x - 965) * sc;
    // camera: drift 965 → 1000 and zoom 1.3 → 1.35 over 2 s; punch toward the hero on the fold (backOut, tX-.06 → tX+.16)
    const punch = backOut(seg(t, tX - 0.06, tX + 0.16));
    const camX = lerp(965, 1000, ease(lt / 2)) + punch * 120, camY = 650 - punch * 25, z = (1.3 + 0.05 * ease(lt / 2) + 0.16 * punch) / 1.3;
    D.cam(Xc, S.floor, z, () => {
      // --- the hero: sit, spin, paw... then the snub ---
      const s = heroS(S), x = wx(1190);
      const pre = move("hop", t);
      let dy = t < tS ? pre.dy * 0.45 : 0, sq = t < tS ? pre.sq : 0, sx = 1;
      const sitK = backOut(seg(t, tS - 0.03, tS + 0.1)) * (1 - ease(seg(t, tSp - 0.06, tSp + 0.01)));
      sq += 0.26 * sitK;
      const sp = seg(t, tSp, tSp + 0.3);
      if (sp > 0 && sp < 1) { sx = Math.cos(sp * TAU); dy = -Math.sin(sp * Math.PI) * 3.5; sq = -0.1 * Math.sin(sp * Math.PI); }
      const pawK = backOut(seg(t, tP - 0.05, tP + 0.1)) * (1 - ease(seg(t, tT - 0.06, tT + 0.02)));
      dy -= 0.6 * pawK;
      const tu = seg(t, tT + 0.06, tT + 0.28);
      if (tu > 0) { sx = Math.cos(tu * Math.PI); dy -= Math.sin(tu * Math.PI) * 1.2; }
      const crossK = backOut(seg(t, tX - 0.1, tX + 0.06));
      const md = mood(t, [[113.4, "happy"], [tT + 0.1, "look"], [tSh + 0.01, "shades"]]);
      const land = t > tSh ? Math.exp(-(t - tSh) * 14) : 0;
      sq += md.take + 0.07 * land + 0.06 * (crossK > 0.02 && crossK < 1 ? Math.sin(crossK * Math.PI) : 0);
      const h = body(x, S.floor, s, { dy, sq, sx });
      const u = h.u, fx = v => h.x + v * u * sx, fy = v => h.bottom + v * u * (1 - sq);
      // the paw: raised and waving (sin(t × 24)) while pawK
      if (pawK > 0.02) D.fill(fx(-4.6) - u * 0.8, fy(-3 - 3 * pawK + 0.4 * Math.sin(t * 24) * pawK), u * 1.6, u * 1.4, C.pink);
      // shades drop onto the face (tSh-.2 → tSh, easeIn), then stay; a glint tSh+.06 → tSh+.4
      const shadesDrop = seg(t, tSh - 0.2, tSh);
      if (shadesDrop > 0) {
        const oy = -lerp(10, 0, easeIn(shadesDrop));
        D.fill(h.left - u * 0.3, fy(-7.2 + oy), h.width + u * 0.6, u * 2, C.ink);
        const gl = seg(t, tSh + 0.06, tSh + 0.4);
        if (gl > 0 && gl < 1) D.sq(fx(-2.4), fy(-6.4 + oy), u * 1.4 * Math.sin(gl * Math.PI), C.bg);
      }
      // folded arms: two bars across the tummy, growing with crossK (backOut, tX-.1 → tX+.06)
      if (crossK > 0.02) for (const [sd, oy] of [[1, 0.3], [-1, -0.35]]) {
        const len = 8.6 * u * crossK, ex = h.x + sd * (h.width / 2 + 0.9 * u);
        D.fill(sd > 0 ? ex - len : ex, fy(-3.3 + oy) - 0.62 * u, len, 1.24 * u, C.ink);
      }
      // emotes: heart after the sit, music after the spin, heart after the paw (pop over .15–.18 s)
      const em = t < tSp ? [C.pink, seg(t, tS + 0.02, tS + 0.2)] : t < tP ? [C.blue, seg(t, tSp + 0.25, tSp + 0.4)] : t < tT ? [C.pink, seg(t, tP + 0.05, tP + 0.2)] : [null, 0];
      if (em[0] && t >= tS && em[1] > 0) D.sq(h.x + 3 * u, h.top - 2.5 * u, 2.4 * u * backOut(em[1]), em[0]);
      // "hmph" puffs out the side (tX+.02 → tX+.45)
      const hp = seg(t, tX + 0.02, tX + 0.45);
      if (hp > 0 && hp < 1) for (const k of [0, 1]) D.osq(h.x - (6 + hp * 3 + k * 1.2) * u, fy(-(4.6 + k * 0.9 + hp * 0.8)), (1 - hp) * (1.8 - k * 0.5) * u, C.muted, 1);

      // --- the researcher with the clicker ---
      const rs = S.u * 0.6, rx = wx(745), lastClick = clicks.filter(c => c <= t).pop() ?? -9, ca = t - lastClick;
      const shock = seg(t, tT + 0.22, tT + 0.34), hairUp = seg(t, tX - 0.05, tX + 0.15) * 0.8;
      const rmd = mood(t, [[113.4, "dot"], [tT + 0.25, "wide"]]);
      const clickPush = Math.exp(-ca * 14);
      const rb = body(rx, S.floor, rs, { dy: t < tT ? -Math.abs(Math.sin(bpOf(t) * Math.PI)) * 0.4 * RU : 0, sq: rmd.take, col: C.ink });
      const ru = rb.u;
      if (hairUp > 0) for (const k of [-1, 1]) D.vl(rb.x + k * rs * 0.2, rb.top - hairUp * 6 * ru, rb.top, C.ink, 1);
      // left arm: down until tT, then flailing (.6 + .2 sin(t × 20))
      if (t >= tT) D.fill(rb.left - 3, rb.top + rs * 0.3 - (0.6 + 0.2 * Math.sin(t * 20)) * 6, 2, 5, C.ink);
      // the clicker, pushed down on each click (exp(-age × 14)); its flash for 0.16 s after each click
      const ck = rr(rb.right + 2, rb.top - 2 + clickPush * 2, 6, 5);
      D.rect(ck.left, ck.top, ck.width, ck.height, C.ink, 1);
      D.fill(ck.left + 2, ck.top - 2 + clickPush * 1.5, 2, 2, C.blue);
      if (ca < 0.16) D.corners(ck, 2 + ca * 30, C.blue, 1.5, 4);
      // sweat after the snub (emoteK tSh → tSh+.25), only once shocked
      if (shock > 0) D.sq(rb.left - 4, rb.top - 1, 4 * seg(t, tSh, tSh + 0.25), C.blue);
    }, -(camX - 965) * sc * z, 0);   // their camY (-25 on the punch) would push the floor into the name: not ported
    // we arrive from the cloud sea: the last puffs part and slide away (lt 0 → .32, easeIn)
    const part = seg(lt, 0, 0.32);
    if (part < 1) {
      const r = S.photos[1] || band(S), csc = r.height / 1080, cx0 = r.left + r.width / 2, e = easeIn(part);
      clip(r, () => { for (let k = 0; k < 4; k++) {
        const side = k % 2 ? 1 : -1, x = 960 + side * (260 + e * 1300) + (k > 1 ? side * 200 : 0), y = 300 + k * 230;
        const L = cx0 + (x - 420 - 960) * csc, T = r.top + (y - 150) * csc;
        D.fill(L, T, 840 * csc, 300 * csc, C.bg); D.rect(L, T, 840 * csc, 300 * csc, C.rule, 1);
      } });
    }
  }

  // ===================================================================================================================
  // 115.5 · "Post-Chinchilla, super-dense." The chinchilla hoovers tokens (cheeks fill 115.35–116.2); the hero looks,
  // gets the idea B(169.5), stretches up (tC-.22 → tC-.01), CRUNCHES into the cube at B(170), strains the floor, and
  // drops through it at B(171): THUNK, tiles fly, shake. The camera pans in and pushes to the cube.
  // ===================================================================================================================
  function chinchillaShot(t, lt, dur, S) {
    const tI = B(169.5), tC = B(170), tD = B(171), dropA = t - tD;
    const sc = S.text.width / (1920 / 1.24), Xc = midX(S), wx = x => Xc + (x - 960) * sc, wy = y => S.floor + (y - 876) * sc;
    const sh = shk(S, t, dropA >= 0 ? 22 * Math.exp(-dropA * 7) : 4 * seg(t, tC + 0.1, tD));
    const push_ = ease(seg(t, tC, tD - 0.1));
    const camX = lerp(lerp(880, 960, ease(lt / 0.6)), 1180, push_), camY = lerp(640, 690, push_) + 40 * easeIn(seg(t, tD, tD + 0.2));
    const z = lerp(1.24, 1.55, push_) / 1.24;
    D.cam(Xc, S.floor, z, () => {
      // rack LEDs over the photos, cycling on every beat ((k + r + beatN) % 3)
      for (let r = 0; r < 9; r++) {
        const rx = -200 + r * 260;
        for (let k = 0; k < 4; k++) D.sq(wx(rx + 40 + (k % 2) * 110), wy(240 + k * 120), 3, (k + r + beatN(t)) % 3 ? C.blue : C.pink);
      }
      // the token pile
      const px0 = 460, py0 = 872;
      [[-60, 0, 24], [-8, 2, 26], [44, 0, 24], [-36, -28, 22], [16, -28, 23], [-10, -54, 21], [86, 4, 19], [-100, 4, 18], [60, -24, 18]]
        .forEach(([dx, dy, r], i) => D.sq(wx(px0 + dx), wy(py0 + dy - r), Math.max(3, r * 1.4 * sc), i % 3 ? C.blue : C.pink));
      // --- the chinchilla ---
      const cs = S.u * 1.7, cu = cs / 8, cxs = wx(740), eating = t < tC + 0.1;
      const cheeks = 0.15 + 0.85 * ease(seg(t, 115.35, 116.2));
      const startle = dropA >= 0 ? Math.exp(-dropA * 10) : 0, nom = Math.abs(Math.sin(t * 24));
      const cb = body(cxs, S.floor, cs, { col: C.muted, dy: -Math.abs(Math.sin(bpOf(t) * TAU)) * 0.2 - startle * 0.8, sq: (eating ? 0.03 * nom : 0) - 0.08 * startle });
      D.fill(cb.left, cb.top - 3 * cu, 1.8 * cu, 3 * cu, C.muted); D.fill(cb.right - 1.8 * cu, cb.top - 3 * cu, 1.8 * cu, 3 * cu, C.muted);   // ears
      const mouth = [cb.x, cb.bottom - 5.75 * cu * (cb.height / cs)];
      if (cheeks > 0.01) for (const side of [-1, 1]) { const r = (0.8 + cheeks * 1.35) * cu; D.fill(cb.x + side * (1.85 + cheeks * 0.95) * cu * 1.6 - r, mouth[1] + cheeks * 0.25 * cu - r * 0.88, 2 * r, 1.76 * r, C.muted); }
      if (eating) {
        // a stream of tokens into the mouth (period 1/2.4 s, easeIn along the arc), suction guides
        for (let k = 0; k < 4; k++) {
          const ph = frac((t - 115) * 2.4 + k / 4), a = [wx(px0 + (hash(k) - 0.5) * 60), wy(py0 - 50)];
          const m = [lerp(a[0], mouth[0], 0.45), mouth[1] - (170 + 40 * hash(k + 2)) * sc], p = bez(a, m, mouth, easeIn(ph));
          D.sq(p[0], p[1], Math.max(2, 34 * (1 - 0.45 * ph) * sc), C.blue);
        }
        for (let k = 0; k < 3; k++) D.hl(wx(px0 - 20 + k * 30), mouth[0] - cs * 0.6, lerp(wy(py0 - 70), mouth[1], 0.35 + k * 0.25), C.muted, 1, [2, 3]);
      }

      // --- the hero: watches, gets the idea, crunches into a cube, drops through the floor ---
      const kx = wx(1250), s = heroS(S), Lc = s * 104 / 216;
      if (t < tC) {
        const ant = seg(t, tC - 0.22, tC - 0.01), md = mood(t, [[115.3, "look"], [tI + 0.03, "spark"]]);
        const h = body(kx + jit(t, ant * 3 * sc), S.floor, s, { sq: -0.22 * easeOut(ant) + md.take, sx: 1 - 0.2 * ease(ant), dy: -Math.abs(Math.sin(bpOf(t) * Math.PI)) * 0.6 * (1 - ant) });
        if (t > tI + 0.03) D.sq(h.x, h.top - 2.5 * h.u, 2.4 * h.u * backOut(seg(md.age, 0.05, 0.3)) * (1 - seg(md.age, 1.4, 1.7)), C.pink);   // the idea
        // arms up in the anticipation (lerp .3 → 1.5, easeOut)
        const arm = easeOut(ant);
        if (arm > 0.02) for (const sd of [-1, 1]) D.vl(h.x + sd * (h.width / 2 + 1), h.top + h.height * 0.4 - arm * h.height * 0.6, h.top + h.height * 0.4, C.pink, 2);
      } else if (dropA < 0) {
        const heat = 0.7 + 0.5 * seg(t, tC, tD), vib = seg(t, tC + 0.1, tD) * 3.5 * sc;
        const sink = easeIn(seg(t, tD - 0.15, tD)) * 16 * sc;
        // the floor strains: a dent and cracks spreading along the floor (tC+.05 → tD)
        D.fill(kx - (88 * sc + sink), S.floor - 2, 2 * (88 * sc + sink), 2 + sink * 0.3, C.ink);
        const cr = seg(t, tC + 0.05, tD);
        for (let k = 0; k < 6; k++) {
          const a = Math.PI * (k / 5) + (hash(k) - 0.5) * 0.3, len = (50 + 200 * cr * (0.6 + 0.4 * hash(k + 3))) * sc, sd = Math.cos(a);
          D.hl(kx + sd * 40 * sc, kx + sd * len, S.floor - 1 - (k % 3), C.ink, 1);
        }
        const crunch = seg(t, tC, tC + 0.16), side = Lc * (1 + 0.25 * (1 - backOut(crunch * 1.4)));
        const c = rr(kx + jit(t, vib) - side / 2, S.floor - side + sink, side, side);
        // crunch flash: brackets thrown out from the cube, fading over .16 s
        if (crunch < 1) D.alpha(1 - crunch, () => D.corners(c, Lc * (0.6 + crunch * 0.9), C.pink, 2));
        // heat shimmer: brackets breathing at sin(t × 20)
        D.alpha(clamp(heat - 0.5), () => D.corners(c, (26 + 18 * Math.sin(t * 20)) * sc, t < tD - 0.18 ? C.blue : C.pink, 1.25));
        D.fill(c.left, c.top, side, side, C.pink); D.rect(c.left - 1, c.top - 1, side + 2, side + 2, C.ink, 2.5);
      } else {
        // gone! a hole with the glow shining up, flying tiles, dust, THUNK
        const hw = 72 * sc;
        D.alpha(Math.exp(-dropA * 3), () => D.corners(rr(kx - 150 * sc, S.floor - 160 * sc, 300 * sc, 160 * sc), 0, C.pink, 1.5));
        D.fill(kx - hw, S.floor - 4, 2 * hw, 5, C.ink);
        D.fill(kx - hw * 0.75, S.floor - 3, 1.5 * hw, 3, C.pink, Math.exp(-dropA * 4));
        for (let k = 0; k < 4; k++) {
          const [qx, qy] = fly(kx + (k - 1.5) * 40 * sc, S.floor, (k - 1.5) * 420 * sc, (-800 - hash(k) * 300) * sc, dropA, 2200 * sc);
          D.rect(qx - 32 * sc, qy - 11 * sc, 64 * sc, 22 * sc, C.ink, 1);
        }
        for (let k = 0; k < 6; k++) {
          const r = (30 + 70 * easeOut(dropA * 4)) * sc * 0.5;
          D.alpha(1 - seg(dropA, 0.1, 0.2), () => D.osq(kx + (k - 2.5) * 48 * sc * (1 + dropA * 3), S.floor - (10 + hash(k) * 30 + dropA * 90) * sc, r, C.muted, 1));
        }
        sfxBox(kx - 10 * sc, S.floor - 230 * sc, 300 * sc, 120 * sc, dropA, 0.9);
      }
    }, -(camX - 960) * sc * z + sh[0], sh[1]);   // their camY (640 → 690, +40 on the drop) would lift the floor off the name: not ported
  }

  // ===================================================================================================================
  // 117.0 · "Breaking through each safety fence." Tracking shot. The cube falls in (117.0–117.14, easeIn), thuds, and
  // from 117.18 rolls at 900 px/s, one quarter-turn per side (a hop each time: squares can't rotate). It smashes the
  // picket fence B(172), the barrier B(173) (CRASH) and the tape B(174); the lights go out 118.86–119.0.
  // ===================================================================================================================
  function fences(t, lt, dur, S) {
    const G = 830, Lw = 170, v = 900, tRoll = 117.18, x0 = 480;
    const hits = [B(172), B(173), B(174)];
    const cxAt = tt => x0 + Math.max(0, tt - tRoll) * v;
    const fxs = hits.map(h => cxAt(h) + Lw / 2 + 10), darkX = fxs[2] + 260;
    const X = cxAt(t), r = (X - x0) / Lw, n = Math.floor(r), f = r - n;
    const land = seg(t, 117.0, 117.14);
    let ccx, ccy;
    if (t < tRoll) { ccx = x0; ccy = lerp(-150, G - Lw / 2, easeIn(land)); }
    else { const th = f * Math.PI / 2, px = x0 + n * Lw + Lw / 2; ccx = px + (-Lw / 2 * Math.cos(th) + Lw / 2 * Math.sin(th)); ccy = G + (-Lw / 2 * Math.sin(th) - Lw / 2 * Math.cos(th)); }
    const lastHit = hits.filter(h => h <= t).pop(), ha = lastHit != null ? t - lastHit : 9, landA = t - 117.14;
    const sh = shk(S, t, 22 * Math.exp(-ha * 9) + (landA > 0 ? 26 * Math.exp(-landA * 10) : 0) + 4 * Math.exp(-frac(r) * 12) * (t > tRoll ? 1 : 0));
    const camX = Math.max(x0 + 300, X + 180);
    const sc = S.text.width / 1920, Xc = midX(S);
    const wx = x => Xc + (x - camX) * sc + sh[0], wy = y => S.floor + (y - G) * sc + sh[1];
    const frame = rr(S.text.left, S.floor - (G - 20) * sc, S.text.width, (G - 20) * sc + 3);
    clip(frame, () => {
      // far racks drift slowly (parallax .3); LEDs alternate on every beat
      for (let k = -1; k < 9; k++) {
        const bx = ((k * 300 - camX * 0.3) % 2700 + 2700) % 2700 - 300;
        for (let q = 0; q < 3; q++) D.sq(frame.left + (bx + 50 + q * 50) * sc, wy(250 + ((k + q) % 3) * 140), 3, (q + k + beatN(t)) % 2 ? C.blue : C.pink);
      }
      // floor dents where the heavy cube slammed down
      for (let m = 0; m <= n && t > tRoll; m++) { const dx = x0 + m * Lw + Lw / 2; D.hl(wx(dx - 30), wx(dx + 34), S.floor - 1 + sh[1], C.ink, 1.5); }
      // the dark doorway ahead, with its hazard frame
      if (wx(darkX) < frame.right) D.fill(wx(darkX), frame.top, frame.right - wx(darkX), frame.height, C.ink);
      D.fill(wx(darkX - 36), wy(150), 36 * sc, (G - 150) * sc, C.pink); D.fill(wx(darkX - 36), wy(120), 900 * sc, 36 * sc, C.pink);
      // --- fence 1: pickets and two rails ---
      const age1 = t - hits[0];
      for (let p = 0; p < 6; p++) {
        let [qx, qy] = [fxs[0] - 150 + p * 60, G - 110];
        if (age1 > 0) [qx, qy] = fly(qx, qy, 500 + p * 260 + hash(p) * 300, -700 - hash(p + 4) * 500, age1);
        D.fill(wx(qx - 22), wy(qy - 118), 44 * sc, 228 * sc, C.bg); D.rect(wx(qx - 22), wy(qy - 118), 44 * sc, 228 * sc, C.ink, 1);
      }
      for (const ry of [G - 170, G - 60]) {
        if (age1 < 0) D.fill(wx(fxs[0] - 185), wy(ry - 9), 370 * sc, 18 * sc, C.ink);
        else for (const side of [0, 1]) { const [qx, qy] = fly(fxs[0] - 90 + side * 180, ry, 700 + side * 400, -500 - side * 200, age1); D.fill(wx(qx - 90), wy(qy - 9), 180 * sc, 18 * sc, C.ink); }
      }
      // --- fence 2: striped barrier on legs, a lamp blinking at 3 Hz, a cone beside it ---
      const age2 = t - hits[1];
      for (const s of [-1, 1]) {
        const [qx, qy] = age2 > 0 ? fly(fxs[1] + s * 60, G - 65, 300 + s * 200, -300, age2) : [fxs[1] + s * 60, G - 65];
        D.vl(wx(qx), wy(qy - 65), wy(qy + 65), C.ink, 2);
      }
      for (const half of [0, 1]) {
        let [qx, qy] = [fxs[1] - 80 + half * 160, G - 150];
        if (age2 > 0) [qx, qy] = fly(qx, qy, 800 + half * 500, -900 + half * 200, age2);
        D.fill(wx(qx - 80), wy(qy - 24), 160 * sc, 48 * sc, C.bg);
        for (let k = 0; k < 3; k++) D.fill(wx(qx - 80 + k * 56), wy(qy - 24), 28 * sc, 48 * sc, C.pink);
        D.rect(wx(qx - 80), wy(qy - 24), 160 * sc, 48 * sc, C.ink, 1);
      }
      { const lamp = age2 > 0 ? fly(fxs[1], G - 205, 400, -1200, age2) : [fxs[1], G - 205], on = frac(t * 3) < 0.5, ls = Math.max(4, 40 * sc);
        if (on) { D.sq(wx(lamp[0]), wy(lamp[1]), ls, C.pink); D.corners(rr(wx(lamp[0]) - ls / 2, wy(lamp[1]) - ls / 2, ls, ls), 3, C.pink, 1, 3); }
        else D.osq(wx(lamp[0]), wy(lamp[1]), ls, C.ink, 1);
        if (age2 < 0) D.vl(wx(fxs[1]), wy(G - 190), wy(G - 174), C.ink, 1.5); }
      { const a = t - hits[1], [qx, qy] = a > 0 ? fly(fxs[1] + 150, G - 45, 900, -1100, a) : [fxs[1] + 150, G - 45];
        D.fill(wx(qx - 20), wy(qy - 60), 40 * sc, 105 * sc, C.pink); D.fill(wx(qx - 44), wy(qy + 40), 88 * sc, 12 * sc, C.ink); }
      // --- fence 3: posts and three hazard tapes; strained by the cube, snapped on the hit, dangling from the posts ---
      const age3 = t - hits[2];
      for (const sd of [-1, 1]) { const px = fxs[2] + sd * 115; D.fill(wx(px - 10), wy(G - 210), 20 * sc, 210 * sc, C.ink); D.sq(wx(px), wy(G - 212), Math.max(3, 30 * sc), C.pink); }
      const push3 = clamp((ccx + Lw / 2 - (fxs[2] - 60)) / 80);
      const tape = (x0_, x1_, y) => { D.hl(x0_, x1_, y, C.pink, 3); D.hl(x0_, x1_, y, C.ink, 3, [3, 4]); };
      const drawTape = () => [-190, -50, -120].forEach((ya, i) => {
        const pa = [fxs[2] - 105, G + ya], pb = [fxs[2] + 105, G + ya], mid = (pa[0] + pb[0]) / 2;
        if (age3 < 0) tape(wx(pa[0]), wx(pb[0]), wy(pa[1] + push3 * 20));
        else for (const [anchor, sd] of [[pa, -1], [pb, 1]]) {
          const k = easeOut(clamp(age3 * 3)), fl = Math.sin(age3 * 30 + i + sd) * 26 * Math.exp(-age3 * 3);
          const ex = lerp(mid + sd * 40, anchor[0] - sd * 30, k) + fl, ey = lerp(anchor[1], anchor[1] + 150, k);
          tape(Math.min(wx(anchor[0]), wx(ex)), Math.max(wx(anchor[0]), wx(ex)), wy(anchor[1]));
          D.vl(wx(ex), wy(anchor[1]), wy(ey), C.pink, 3); D.vl(wx(ex), wy(anchor[1]), wy(ey), C.ink, 3, [3, 4]);
        }
      });
      // splinters and dust on every hit (0.9 s)
      for (const [hi, h] of hits.entries()) {
        const a = t - h; if (a < 0 || a > 0.9) continue;
        for (let k = 0; k < 12; k++) {
          const [px, py] = fly(fxs[hi], G - 90 + hash(k + hi * 20) * 60, 200 + hash(k * 3 + hi) * 1100, -300 - hash(k * 5 + hi) * 1000, a);
          D.sq(wx(px), wy(py), 4, hi === 1 ? (k % 2 ? C.pink : C.muted) : hi === 2 ? C.pink : C.ink);
        }
        for (let k = 0; k < 4; k++) { const rr_ = (30 + 80 * easeOut(a * 3)) * sc; D.alpha(1 - seg(a, 0.2, 0.5), () => D.osq(wx(fxs[hi] + (k - 1.5) * 50 + a * 200), wy(G - 20 - k * 12) - rr_ / 2, rr_, C.muted, 1)); }
      }
      // speed streaks behind the rolling cube
      if (t > tRoll) for (let k = 0; k < 4; k++) D.hl(wx(ccx - 260 - k * 40), wx(ccx - 110 - k * 25), wy(G - 30 - k * 36), C.muted, 1);
      // landing dust (117.14 + 0.5 s)
      if (landA > 0 && landA < 0.5) for (let k = 0; k < 5; k++) { const rr_ = (30 + 90 * easeOut(landA * 3)) * sc; D.alpha(1 - seg(landA, 0.2, 0.5), () => D.osq(wx(x0 + (k - 2) * 60 * (1 + landA * 3)), wy(G - 20) - rr_ / 2, rr_, C.muted, 1)); }
      // the lights go out around the cube (118.86 → 119.0, ease)
      const dk = seg(t, 118.86, 119.0);
      if (dk > 0) D.fill(frame.left, frame.top, frame.width, frame.height, C.ink, 0.92 * ease(dk));
      // the cube itself (pink, heavy outline; its brow goes hard at hits[0]-.3)
      const L = Lw * sc, c = rr(wx(ccx) - L / 2, wy(ccy) - L / 2, L, L);
      D.fill(c.left, c.top, L, L, C.pink); D.rect(c.left - 1, c.top - 1, L + 2, L + 2, C.ink, 2.5);
      if (t > hits[0] - 0.3) D.fill(c.left + L * 0.15, c.top + L * 0.28, L * 0.7, Math.max(2, L * 0.08), C.ink);
      if (dk < 0.3) drawTape();
      sfxBox(wx(fxs[1] + 40), wy(G - 360), 300 * sc, 150 * sc, t - hits[1], 0.72);
    });
  }

  // ===================================================================================================================
  // 119.0 · "Hundred thousand GPU." Flying down the aisle at 5.5 racks/s (every rack a cross-section box in the strip).
  // Dark until B(175): the cube rattles (tOn-.25 → tOn), the lights cascade down the aisle at 60 racks/s with a flicker,
  // the cube pops into the hero (0.18 s, backOut), who grows at B(176) and just before B(177); LEDs blink on the beat;
  // compute streams pour in. It blazes into a flash over 120.6–120.9.
  // ===================================================================================================================
  function aisle(t, lt, dur, S) {
    const F = 900, VX = 960, VY = 430, AW = 1.35, P = 1.0, tOn = B(175), camZ = lt * 5.5;
    const onD = t < tOn ? -1 : (t - tOn) * 60;
    const litAt = z => t < tOn ? 0 : clamp((onD - z) / 3) * (t - tOn < 0.05 || (t - tOn > 0.1 && t - tOn < 0.13) ? 0.3 : 1);
    const beatK = pulse(t, 5), glowK = t < tOn ? 0.15 : clamp((t - tOn) * 4);
    const r = band(S), sx = r.width / 1920, sy = r.height / 700, cx0 = r.left + r.width / 2, cy0 = r.top + r.height * 0.5;
    const pr = (X_, Y_, Z_) => [cx0 + X_ * F / Z_ * sx, cy0 - Y_ * F / Z_ * sy];
    D.fill(r.left, r.top, r.width, r.height, C.ink, 0.94);
    clip(r, () => {
      // back haze at the vanishing point
      D.fill(cx0 - 520 * sx, cy0 - 380 * sy, 1040 * sx, 760 * sy, C.bg, 0.25 * glowK);
      D.fill(cx0 - 160 * sx, cy0 - 120 * sy, 320 * sx, 240 * sy, C.bg, 0.5 * glowK);
      const k0 = Math.floor(camZ / P), leds = [];
      for (let k = k0 + 34; k >= k0; k--) {
        const z0 = k * P - camZ, z1 = z0 + P * 0.92;
        if (z1 < 0.9) continue;
        const za = Math.max(z0, 0.9), lit = litAt(za), fd = clamp((za - 4) / 28);
        const [xl, yt] = pr(-AW, 1.6, za), [xr, yb] = pr(AW, -1, za), [xl1] = pr(-AW, 1.6, z1), [xr1] = pr(AW, -1, z1);
        const [, yc] = pr(0, 1.9, za);
        // the rack slice: its front and back edges on both sides, floor and ceiling lines
        D.alpha((0.25 + 0.75 * lit) * (1 - fd * 0.85), () => {
          const col = lit > 0.02 ? C.bg : C.muted;
          for (const x of [xl, xr, xl1, xr1]) D.vl(x, yt, yb, col, 1);
          D.hl(xl, xr, yb, col, 1); D.hl(xl, xr, yc, col, 1);
        });
        if (lit > 0.5) { const [a0, a1] = pr(-0.35, 1.9, za + 0.2), [b0] = pr(0.35, 1.9, za + 0.2); D.fill(a0, a1, b0 - a0, 2, C.bg, 0.8); }
        // LEDs: two columns × five rows per rack side, re-dealt every beat, puffed by pulse(t, 5)
        if (za < 11) for (const side of [-1, 1]) for (let c = 0; c < 2; c++) for (let rr_ = 0; rr_ < 5; rr_++) {
          const zz = za + (0.22 + c * 0.45) * P, yy = 1.25 - rr_ * 0.45;
          if (zz > z1) continue;
          const q = pr(side * AW, yy, zz), sz = 26 / zz;
          const blink = hash(k * 31 + c * 7 + rr_ + side * 3 + beatN(t) * 13) > 0.4;
          const col = (rr_ + c + k) % 4 === 0 ? C.pink : blink ? C.blue : C.muted;
          const w = Math.max(1.5, sz * 1.1 * sx * (1 + 0.5 * beatK * (blink ? 1 : 0))), h = Math.max(1.5, sz * 2 * sy);
          D.fill(q[0] - w / 2, q[1] - h / 2, w, h, col);
          if (blink && zz < 3.2) leds.push([q[0], q[1], w, h, col]);
        }
      }
      for (const [x, y, w, h, col] of leds) D.fill(x - w * 1.5, y - h * 1.1, w * 3, h * 2.2, col, (70 + 90 * beatK) / 255);
      // darkness before the lights
      if (t < tOn) D.fill(r.left, r.top, r.width, r.height, C.ink, 110 / 255);
      // wind lines rushing past (1.6 per second), straightened: horizontal where the ray is mostly sideways, else vertical
      for (let k = 0; k < 10; k++) {
        const a = hash(k) * TAU, ph = frac(t * 1.6 + hash(k + 9)), r0 = 200 + ph * 900, r1 = r0 + 120 + ph * 200;
        D.alpha(0.2 + 0.6 * glowK, () => {
          if (Math.abs(Math.cos(a)) > 0.5) D.hl(cx0 + Math.cos(a) * r0 * sx, cx0 + Math.cos(a) * r1 * sx, cy0 + Math.sin(a) * r0 * 0.7 * sy, C.bg, 1);
          else D.vl(cx0 + Math.cos(a) * r0 * sx, cy0 + Math.sin(a) * r0 * 0.7 * sy, cy0 + Math.sin(a) * r1 * 0.7 * sy, C.bg, 1);
        });
      }
    });
    // the cube (or the hero) flies down the aisle ahead of the camera: on the stage, under the strip
    const hx = clamp(cx0, S.text.left + 20, S.text.right - 20), s = heroS(S);
    const popK = seg(t, tOn, tOn + 0.18);
    if (popK <= 0) {
      const bob = Math.sin(t * 9) * 10 * sy, cr = seg(t, tOn - 0.25, tOn), side = s * 0.6 * (1 + 0.12 * cr);
      const x = hx + jit(t, cr * 6 * sx), y = S.floor - 4 - s * 0.3 - bob - side;
      D.fill(x - side / 2, y, side, side, C.pink); D.rect(x - side / 2 - 1, y - 1, side + 2, side + 2, C.ink, 2.5);
      D.alpha(0.5 + 0.5 * cr, () => D.corners(rr(x - side / 2, y, side, side), 4 + 2 * Math.sin(t * 20), cr > 0.3 ? C.pink : C.blue, 1.25));
    } else {
      const grow = 1 + 0.23 * backOut(seg(t, B(176) - 0.08, B(176) + 0.1)) + 0.23 * backOut(seg(t, B(177) - 0.2, B(177) - 0.05));
      const hs = s * grow * backOut(popK), m = move("roof", t), gyOff = Math.sin(t * 7) * 12 * sy;
      const h = body(hx, S.floor - s * 0.3 + gyOff, hs, { dy: m.dy - 1, sq: m.sq });
      // compute streams: dotted right-angle threads from the racks into the hero; two sparks ride each at 2.4/s
      for (let k = 0; k < 6; k++) {
        const side = k % 2 ? 1 : -1, row = k >> 1, a = pr(side * AW, 1.1 - row * 0.55, 1.8 + row * 1.1);
        const ax = clamp(a[0], r.left + 4, r.right - 4), ay = clamp(a[1], r.top + 4, r.bottom - 4), b = [h.x + side * h.width * 0.3, h.top];
        const legY = Math.min(ay + (r.bottom - ay) * (0.3 + 0.2 * row), h.top - 4 - row * 3);   // never across the name
        const pts = [[ax, ay], [ax, legY], [b[0], legY], b];
        D.path(pts, C.pink, 1, [2, 3]);
        for (const o of [0, 0.5]) { const d = along(pts, frac(t * 2.4 + k * 0.37 + o)); D.sq(d[0], d[1], 4, C.pink); }
      }
      D.alpha((70 + 60 * beatK) / 255 * 2, () => D.corners(h, 3 + 4 * beatK, C.pink, 1.5));
      // burst brackets as the cube pops open
      if (popK < 1) D.alpha(1 - popK, () => D.corners(rr(hx - 1, h.top + h.height / 2 - 1, 2, 2), (120 + 260 * popK) * sx * 0.5, C.pink, 2));
      // blaze: the hero floods the stage band white (120.6 → 120.9, easeIn), carrying us to the studio
      const blaze = easeIn(seg(t, 120.6, 120.9));
      if (blaze > 0) {
        const top = S.strip ? S.strip.top : S.floor - 90, w = (90 + 2300 * blaze) * sx * 2, hgt = (90 + 2300 * blaze) * sy * 2;
        clip(rr(S.main.left - 40, top, S.main.width + 80, S.floor - top), () => {
          const bx = rr(h.x - w / 2, h.top + h.height / 2 - hgt / 2, w, hgt);
          D.fill(bx.left, bx.top, bx.width, bx.height, C.bg); D.rect(bx.left, bx.top, bx.width, bx.height, C.pink, 1.5);
        });
      }
    }
  }

  // ===================================================================================================================
  // 120.9 · "RLHF goes askew." A panel of researcher clones with thumb paddles (pink = up, blue = down; the paddle's
  // width is its flip). Mixed verdicts; all flip up on B(178) and hearts fly to the hero; then the flipping accelerates
  // (ph = 14g² + 5g), everyone goes dizzy at B(178)+.45; at B(179) the frame starts to "tilt" (a sideways slide on
  // their tilt keyframes), a paddle helicopters off at B(179)+.3, the hero slides into the desk and the whole panel
  // slides off from B(180)-.2; the empty frame floods pink (B(180)+.05 → 123.46), flash 123.3–123.5.
  // ===================================================================================================================
  function rlhf(t, lt, dur, S) {
    const b1 = B(178), b2 = B(179), b3 = B(180);
    const rot = kf(t, [[b2 - 0.05, 0], [b2 + 0.35, 0.16], [b3, 0.3], [b3 + 0.45, 0.5], [123.5, 0.55]], ease) + (t > b2 ? Math.sin(t * 30) * 0.01 : 0);
    const sh = shk(S, t, t > b2 ? 6 : 3 * pulse(t, 8));
    const z = (1.16 + 0.04 * ease(lt / 1.2) - 0.1 * ease(seg(t, b2, 123.5))) / 1.16;
    const sc = S.text.width / (1920 / 1.16), Xc = midX(S), wx = x => Xc + (x - 1000) * sc;
    const tilt = rot / 0.55 * 0.12 * S.text.width;
    const bnd = band(S), stageTop = S.strip ? S.strip.top : S.floor - 90;
    // the backdrop: 16 sunburst "rays" as vertical lines across the strip; their spin speeds up after B(178)
    const phi = t * 0.15 + (t > b1 ? (t - b1) ** 2 * 2 : 0);
    if (S.strip) clip(S.strip, () => { for (let i = 0; i < 16; i++) D.alpha(0.55, () => D.vl(S.strip.left + frac(i / 16 + phi / TAU) * S.strip.width, S.strip.top, S.strip.bottom, C.bg, 1)); });
    const slideJ = 2900 * easeIn(seg(t, b3 - 0.2, 123.3)), slideC = 2900 * easeIn(seg(t, b2 + 0.2, b3 + 0.3));
    D.cam(Xc, S.floor, z, () => {
      const tableX = 860 + slideJ, s = S.u * 0.6, judgeX = j => wx(tableX + j * 250), tFly = b2 + 0.3;
      const hands = [];
      const deskTop = S.floor - s * 0.4;
      for (let j = 0; j < 4; j++) {
        const x = judgeX(j);
        let ph;
        if (t < b1 - 0.04) ph = j % 2 ? Math.PI : 0;
        else if (t < b1 + 0.12) ph = lerp(j % 2 ? Math.PI : 0, TAU, ease(seg(t, b1 - 0.04, b1 + 0.1)));
        else { const g = t - (b1 + 0.12); ph = (g * g * 14 + g * 5) * (1 + j * 0.15) + j; }
        const dizzy = t > b1 + 0.45, gone = j === 2 && t > tFly;
        const armA = 1.12 + 0.1 * Math.sin(t * 9 + j) + (t < b1 ? 0.12 * pulse(t, 6) : 0);
        const rb = body(x, S.floor, s, { dy: -Math.abs(Math.sin((bpOf(t) + j * 0.25) * Math.PI)) * 0.3 * RU, col: C.ink });
        if (dizzy) for (const k of [-1, 1]) D.vl(rb.x + k * s * 0.2, rb.top - 0.6 * s * 0.5, rb.top, C.ink, 1);
        const hx = rb.right + 2, hy = rb.top + s * 0.3 - (armA - 1.12) * s * 2;
        hands.push([hx, hy - s * 1.2]);
        if (!gone) {
          const ps = s * 1.2, c = Math.cos(ph), w = ps * Math.max(0.08, Math.abs(c));
          D.vl(hx, hy - s * 0.6, hy, C.ink, 1);
          D.fill(hx - w / 2, hy - s * 0.6 - ps, w, ps, c >= 0 ? C.pink : C.blue);
        } else {
          const k = seg(t, tFly, tFly + 0.15);   // '!!' and arms up
          for (const d of [-2, 2]) { D.vl(rb.x + d, rb.top - 4 - 6 * k, rb.top - 4, C.ink, 1.5); D.sq(rb.x + d, rb.top - 2, 1.5 * k, C.ink); }
          for (const sd of [-1, 1]) D.vl(rb.x + sd * (s / 2 + 1), rb.top - s * 0.4, rb.top + s * 0.3, C.ink, 1.25);
        }
      }
      // the desk in front of their laps, a reward button per seat (lit when thumbs-up; flipping after B(179)), mugs
      const dl = wx(tableX - 190), dr = wx(tableX - 190 + 1160);
      D.fill(dl, deskTop, dr - dl, S.floor - deskTop, C.bg); D.rect(dl, deskTop, dr - dl, S.floor - deskTop, C.ink, 1.25);
      D.hl(dl + 2, dr - 2, S.floor - 2, C.pink, 1.5, [3, 3]);
      for (let j = 0; j < 4; j++) {
        const bx = judgeX(j) + 20 * sc, lit = t > b1 - 0.04 || j % 2 === 0, bs = 4, fl = t > b2 ? Math.abs(Math.cos(t * 25 + j)) : 1;
        D.fill(bx - bs / 2, deskTop + (S.floor - deskTop) / 2 - bs * fl / 2, bs, bs * fl, lit ? C.pink : C.muted);
        const mx = judgeX(j) - 70 * sc;
        D.rect(mx - 2, deskTop - 4, 4, 4, C.ink, 1);
        if (t > b2 + 0.1) D.fill(mx + 2, deskTop - 1, (30 + 20 * seg(t, b2 + 0.1, b2 + 0.5)) * 2 * sc * 0.5, 1.5, C.ink);
      }
      // the hero: bounce → roof on B(178) → shimmy on B(179); slides into the desk from B(179)+.2
      const hs = heroS(S), style = t < b1 ? "bounce" : t < b2 ? "roof" : "shimmy", m = move(style, t), sliding = t > b2 + 0.2;
      const want = wx(420 + slideC), stop = dl - hs / 2 - 2, cxs = Math.min(want, stop), bump = sliding && want > stop;
      const md = mood(t, [[120.8, "happy"], [b1 + 0.02, "spark"], [b2 + 0.1, "swirl"], [b3 - 0.25, "scared"]]);
      const hk = t > b1 ? Math.exp(-(t - b1) * 3) : 0;
      const h = body(cxs, S.floor, hs * (1 + 0.08 * hk), { dy: m.dy, dx: sliding ? 0 : m.dx, sq: m.sq + md.take + (bump ? 0.12 : 0) });
      if (sliding) for (const sd of [-1, 1]) D.fill(h.x + sd * (h.width / 2 + 2) - 1, h.top + h.height * 0.2 + sd * Math.sin(t * 30) * 3, 2, h.height * 0.3, C.pink);
      if (t >= b1 + 0.02 && t < b2 + 0.1) D.sq(h.x + 3 * h.u, h.top - 2.5 * h.u, 2.4 * h.u * backOut(seg(md.age, 0.05, 0.3)) * (1 - seg(md.age, 1.4, 1.7)), C.pink);   // heart
      if (t >= b3 - 0.25) { const k = emoteK(md.age); for (const d of [-2, 2]) { D.vl(h.x + d, h.top - 4 - 8 * k, h.top - 5, C.ink, 1.5); D.sq(h.x + d, h.top - 2.5, 1.5 * k, C.ink); } }   // '!!'
      // reward: hearts fly from each paddle into the hero (B(178)+.06+.05j, 0.36 s each, easeIn)
      for (let j = 0; j < 4; j++) {
        const hp = seg(t, b1 + 0.06 + j * 0.05, b1 + 0.42 + j * 0.05);
        if (hp <= 0 || hp >= 1) continue;
        const a = hands[j], b = [h.x, h.top], mm = [lerp(a[0], b[0], 0.5), Math.min(a[1], b[1]) - 180 * sc];
        const p = bez(a, mm, b, easeIn(hp));
        D.sq(p[0], p[1], Math.max(3, 34 * (1 - 0.5 * hp) * sc), C.pink);
      }
      // the loose paddle helicopters off toward the camera (from B(179)+.3; flips at 40 rad/s, grows 1 + 2.2 age)
      if (t > tFly) {
        const age = t - tFly, [qx, qy] = fly(hands[2][0], hands[2][1], -900 * sc, -1300 * sc, age, 1500 * sc), ps = s * 1.2 * (1 + age * 2.2);
        const w = ps * Math.max(0.08, Math.abs(Math.cos(age * 40)));
        D.fill(qx - w / 2, qy - ps / 2, w, ps, Math.cos(age * 40) >= 0 ? C.pink : C.blue);
      }
    }, -60 * ease(seg(t, b2, 123.5)) * sc * z + sh[0] + tilt, sh[1]);
    // arrive through the last of the white flash from the aisle (0.2 s, ease)
    const fk = 1 - ease(seg(lt, 0, 0.2));
    if (fk > 0.01) D.fill(S.main.left - 40, stageTop, S.main.width + 80, S.floor - stageTop, C.bg, fk);
    // the empty frame floods pink, stage band only (their stepped wave: 11 columns, sin(1.3k + 14t))
    const fl = seg(t, b3 + 0.05, 123.46);
    if (fl > 0) {
      const L = bnd.left, W = bnd.right - L, top = stageTop, H = S.floor - top;
      const lvl = lerp(1080 + 80, -140, easeIn(fl) * 0.6 + fl * 0.4);
      for (let k = 0; k <= 10; k++) {
        const y = top + clamp((lvl + Math.sin(k * 1.3 + t * 14) * 26) / 1080) * H;
        D.fill(L + k * W / 11, y, W / 11 + 1, S.floor - y, C.pink);
      }
    }
    const fa = seg(t, 123.3, 123.5);
    if (fa > 0) D.fill(bnd.left, stageTop, bnd.width, S.floor - stageTop, C.pink, fa);
  }

  chapter("scale", 109.4, 123.5, [[109.4, tower], [113.5, disobey], [115.5, chinchillaShot], [117.0, fences], [119.0, aisle], [120.9, rlhf]]);
})();
