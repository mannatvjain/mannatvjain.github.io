// c1 · The Lab (1.5–23.0). A one-for-one port of the timing of their src/ch/c01_lab.js (shots from 1.5 on; their
// curtainUp is c0_curtain.js). Every start, window, keyframe, easing, beat pulse, dance move, mood take, schedule and
// camera move is theirs; the audit trail is docs/storyboard-timing/c1_lab.md (one row per event, with their line numbers).
// Translation: Clawd = the hero (a pink square; their lunchbox lid = the top 0.36 of the square lifting); the Researcher
// = a graphite square; the monitor = the middle photo (the whole strip in their close-ups); the doors = the three photos.
// Their camBegin(cx, cy, zoom) is applied relative to the shot's base framing (see cam()); everything is clipped to the
// stage band (below the topbar, above the name's letters), so nothing is ever drawn over the bio text.
(() => {
  const { D, C, B, seg, ease, easeIn, easeOut, backOut, elasticOut, pulse, bpOf, kf, move, mood, shakeXY, clamp, lerp, hash, rr, chapter } = window.__SB;
  const TAU = 2 * Math.PI;

  // ---------- stage ----------
  // st: the strip (their frame in the close-ups), m: the monitor, fr: strip + gap down to the name (their room frame),
  // clip: the stage band. sx, sy: our px per their px for the room frame.
  function G(S) {
    const top = (S.bar ? S.bar.bottom : 0) + 2;
    const st = S.strip || rr(S.main.left, Math.max(top + 8, S.name.top - 150), S.main.width, Math.max(40, Math.min(130, S.name.top - top - 40)));
    // on inner pages the image can sit beside the heading (floor above the strip's bottom): the band then reaches the strip's bottom
    const m = S.photos[1] || S.photos[0] || st, fr = rr(st.left, st.top, st.width, Math.max(S.floor, st.bottom) - st.top), bot = Math.max(S.floor, st.bottom + 8);
    return { st, m, fr, fl: S.floor, clip: rr(0, top, S.W, bot - top), sx: fr.width / 1920, sy: fr.height / 1080 };
  }
  const isect = (a, b) => { const l = Math.max(a.left, b.left), t = Math.max(a.top, b.top); return rr(l, t, Math.max(0, Math.min(a.right, b.right) - l), Math.max(0, Math.min(a.bottom, b.bottom) - t)); };
  const mid = r => [r.left + r.width / 2, r.top + r.height / 2];

  // ---------- camera (their camBegin) ----------
  // Their camera c = [cx, cy, zoom] against the shot's base b: screen = C + (q − C)·z/zb + (b − c)·z, with q the base-screen
  // position. Ours pivots on our analogue of their frame centre and scales their pan px by sc = [px/px x, y].
  let K = { px: 0, py: 0, r: 1, ox: 0, oy: 0, clip: null };
  function cam(g, c, b, pivot, sc) {
    const [px, py] = pivot || mid(g.fr), [sx, sy] = sc || [g.sx, g.sy];
    K = { px, py, r: c[2] / b[2], ox: (b[0] - c[0]) * c[2] * sx, oy: (b[1] - c[1]) * c[2] * sy, clip: g.clip };
  }
  const noCam = clip => { K = { px: 0, py: 0, r: 1, ox: 0, oy: 0, clip }; };
  const mx = x => K.px + (x - K.px) * K.r + K.ox, my = y => K.py + (y - K.py) * K.r + K.oy;

  // ---------- drawing through the camera, clipped to the band (our vocabulary only) ----------
  function F(x, y, w, h, col = C.pink, a = 1) {
    let x0 = mx(x), y0 = my(y), x1 = mx(x + w), y1 = my(y + h); const c = K.clip;
    if (c) { x0 = Math.max(x0, c.left); y0 = Math.max(y0, c.top); x1 = Math.min(x1, c.right); y1 = Math.min(y1, c.bottom); }
    if (x1 - x0 >= 0.5 && y1 - y0 >= 0.5) D.fill(x0, y0, x1 - x0, y1 - y0, col, a);
  }
  function H(x0, x1, y, col = C.ink, lw = 1.25, dash) {
    let a = mx(Math.min(x0, x1)), b = mx(Math.max(x0, x1)); const yy = my(y), c = K.clip;
    if (c) { if (yy < c.top || yy > c.bottom) return; a = Math.max(a, c.left); b = Math.min(b, c.right); }
    if (b - a >= 1) D.hl(a, b, yy, col, lw, dash);
  }
  function V(x, y0, y1, col = C.ink, lw = 1.25, dash) {
    let a = my(Math.min(y0, y1)), b = my(Math.max(y0, y1)); const xx = mx(x), c = K.clip;
    if (c) { if (xx < c.left || xx > c.right) return; a = Math.max(a, c.top); b = Math.min(b, c.bottom); }
    if (b - a >= 1) D.vl(xx, a, b, col, lw, dash);
  }
  const O = (x, y, w, h, col = C.ink, lw = 1.25, dash) => { H(x, x + w, y, col, lw, dash); H(x, x + w, y + h, col, lw, dash); V(x, y, y + h, col, lw, dash); V(x + w, y, y + h, col, lw, dash); };
  const Ob = (r, pad, col, lw, dash) => O(r.left - pad, r.top - pad, r.width + 2 * pad, r.height + 2 * pad, col, lw, dash);
  const Sq = (x, y, s, col = C.pink) => F(x - s / 2, y - s / 2, s, s, col);
  const Osq = (x, y, s, col = C.ink, lw = 1.25) => O(x - s / 2, y - s / 2, s, s, col, lw);
  function Br(r, pad, col = C.ink, lw = 1.25, arm = 12) {           // corner brackets
    const x0 = r.left - pad, y0 = r.top - pad, x1 = r.right + pad, y1 = r.bottom + pad, s = Math.min(arm, (x1 - x0) / 3, (y1 - y0) / 3);
    for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { H(x, x + dx * s, y, col, lw); V(x, y, y + dy * s, col, lw); }
  }
  function P(pts, col = C.ink, lw = 1.25) {                         // a right-angled polyline
    for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]]; if (Math.abs(a[1] - b[1]) < 0.01) H(a[0], b[0], a[1], col, lw); else V(a[0], a[1], b[1], col, lw); }
  }
  function partial(p, u) {                                          // their partial(): a polyline cut at fraction u of its length
    const d = p.slice(1).map((q, i) => Math.abs(q[0] - p[i][0]) + Math.abs(q[1] - p[i][1])), L = d.reduce((s, v) => s + v, 0);
    let s = clamp(u) * L; const out = [p[0]];
    for (let i = 1; i < p.length; i++) {
      if (s >= d[i - 1]) { out.push(p[i]); s -= d[i - 1]; }
      else { const f = s / d[i - 1]; out.push([lerp(p[i - 1][0], p[i][0], f), lerp(p[i - 1][1], p[i][1], f)]); break; }
    }
    return out;
  }
  const zText = (s, x, y, col, size) => { const X = mx(x), Y = my(y), c = K.clip; if (!c || (Y > c.top && Y < c.bottom)) D.text(s, X, Y, col, size * K.r, "center"); };
  const glass = (r, t) => D.alpha(0.35, () => { for (let i = 1; i < 5; i++) H(r.left + 4, r.right - 4, r.top + r.height * ((i / 5 + t * 0.06) % 1), C.blue, 1); });   // their glass(): scanlines drift at 0.06/s

  // ---------- the cast ----------
  // their mood() (the take) plus its emote timing: emoteK = seg(age, .05, .3) · (1 − seg(age, 1.4, 1.7))
  function md(t, keys) {
    const m = mood(t, keys); let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const em = keys[i][2], age = t - keys[i][0];
    return { take: m.take, em, ek: em ? seg(age, 0.05, 0.3) * (1 - seg(age, 1.4, 1.7)) : 0 };
  }
  // arms have no shape here (no figures): a raised arm reads as a stretch, proportional to their arm angle
  const armSq = a => -0.12 * clamp((a - 0.2) / 1.1);
  // the hero, their clawd(): (x, bot) the ground point, s its height. dy in their body units (s/8), squash as theirs
  // (x · (1 + sq·.6), y · (1 − sq)), sx their horizontal scale, lid their lunchbox lid (0..1: the top lifts, graphite inside)
  function hero(x, bot, s, o = {}) {
    const sq = (o.sq || 0) + (o.take || 0), w = s * Math.abs(o.sx ?? 1) * (1 + sq * 0.6), h = s * (1 - sq), y1 = bot + (o.dy || 0) * s / 8, y0 = y1 - h, col = o.col || C.pink, lid = clamp(o.lid || 0);
    if (lid > 0.01) { const lh = h * 0.36, up = s * 0.9 * Math.sin(lid * 1.25); F(x - w / 2, y0 + lh, w, h - lh, col); F(x - w / 2 + 1, y0 + lh - up, w - 2, up, C.bg); O(x - w / 2 + 1, y0 + lh - up, w - 2, up, C.ink, 1.25);   /* 3.2: the open mouth is white, outlined */ F(x - w / 2, y0 - up, w, lh, col); }
    else F(x - w / 2, y0, w, h, col);
    if (o.em) emote(o.em, x + w / 2 + s * 0.2, y0 - s * 0.15, s * 0.3, o.ek);
    return { x, top: y0 - (lid > 0.01 ? s * 0.9 * Math.sin(lid * 1.25) : 0), bottom: y1, left: x - w / 2, right: x + w / 2, w, h };
  }
  // the Researcher, their researcher(): a graphite square; squash x · (1 + sq·.5), y · (1 − sq); hair = their hairUp
  function res(x, bot, s, o = {}) {
    const sq = (o.sq || 0) + (o.take || 0), w = s * (1 + sq * 0.5), h = s * (1 - sq), y1 = bot + (o.dy || 0) * s / 8, y0 = y1 - h;
    if (s > 22) { F(x - w / 2, y0, w, h, C.bg); O(x - w / 2, y0, w, h, C.ink, 1.5); }   // 3.2: a big researcher is a white box, outlined
    else { F(x - w / 2, y0, w, h, C.ink); if (o.edge) O(x - w / 2, y0, w, h, C.bg, 1.5); }    // edge: reads on a dark doorway
    if (o.hair > 0.01) for (const f of [-0.3, 0, 0.3]) V(x + w * f, y0 - o.hair * s * 0.35, y0, C.ink, 1.25);
    if (o.em) emote(o.em, x + w / 2 + s * 0.2, y0 - s * 0.15, s * 0.3, o.ek);
    return { x, top: y0, bottom: y1, left: x - w / 2, right: x + w / 2, w, h };
  }
  function chair(x, fl, s, back = -1) {                             // office chair: seat, stem, base, back; returns the seat
    const seat = fl - 0.4 * s;
    H(x - 0.62 * s, x + 0.62 * s, seat, C.ink, 1.5); V(x, seat, fl, C.ink, 1.25); H(x - 0.45 * s, x + 0.45 * s, fl - 1, C.ink, 1.25);
    V(x + back * 0.62 * s, seat - 1.05 * s, seat, C.ink, 1.5);
    return seat;
  }
  // their emote(): pops with backOut(k); '!' and 'z' pop as their letters do (k·1.5, k·3)
  function emote(kind, x, y, s, k) {
    if (!(k > 0.01)) return;
    if (kind === "!") { const q = backOut(clamp(k * 1.5)); if (q > 0.02) { V(x, y - s * 2.4 * q, y - s * 0.7 * q, C.ink, 2); Sq(x, y - s * 0.1, s * 0.5 * q, C.ink); } return; }
    if (kind === "zzz") { const q1 = backOut(clamp(k * 3)), q2 = backOut(clamp(k * 3 - 0.3)); if (q1 > 0.02) zText("z", x, y, C.muted, s * 3 * q1); if (q2 > 0.02) zText("z", x + s * 1.6, y - s * 1.8, C.muted, s * 2.2 * q2); return; }
    const p = backOut(k); if (p < 0.02) return; s *= p;
    if (kind === "spark") { Sq(x, y - s, s * 1.4, C.blue); Sq(x + s * 1.9, y + s * 0.2, s * 0.8, C.pink); }
    else if (kind === "sweat") { Sq(x, y, s, C.blue); Sq(x + s * 1.6, y + s * 1.4, s * 0.7, C.blue); }
    else if (kind === "music") { Sq(x, y + s * 1.2, s * 0.9, C.ink); V(x + s * 0.45, y - s * 1.6, y + s * 1.2, C.ink, 1.25); H(x + s * 0.45, x + s * 1.4, y - s * 1.6, C.ink, 1.25); }
  }

  // =====================================================================================
  // 1.5 · Over the Researcher's shoulder: the monitor, the hero asleep in it (zzz, breathing) … B(4) eyes open ('!'),
  // B(5)−.15 looks. The camera pushes in and pans up-right over the whole shot (ease); the Researcher drifts left (parallax).
  function labOver(t, lt, dur, S) {
    const g = G(S), m = g.m, e = ease(lt / dur);
    cam(g, [lerp(960, 1030, e), lerp(540, 470, e), lerp(1, 1.32, e)], [960, 540, 1], mid(m));
    Ob(m, 6, C.ink, 1.25); Br(m, 12, C.blue, 1.25);                  // the monitor and its glow
    const sf = m.top + m.height * 0.86; H(m.left + 4, m.right - 4, sf, C.muted, 1);   // the screen's floor
    const asleep = t < B(4), k = md(t, [[1.5, "closed", "zzz"], [B(4), "normal", "!"], [B(5) - 0.15, "look"]]);
    hero(m.left + m.width / 2, sf, S.u * 0.9, { sq: asleep ? 0.05 * Math.sin(t * 3) : 0, take: k.take, col: asleep ? C.muted : C.pink, em: k.em, ek: k.ek });
    glass(m, t);
    noCam(g.clip);                                                   // the Researcher is outside their camera (slower push = parallax)
    const rs = S.u * 1.3 * (1 + e * 0.08), rx = S.text.left + S.text.width * 0.12 - 150 * g.sx * e;
    res(rx, chair(rx, g.fl, rs, -1), rs, { dy: -0.05 * Math.sin(t * 2) });
  }

  // B(5) · Close on the screen (the whole strip): the hero idles on the beat; 3.92 its eyes turn to stars (take, spark);
  // from 3.95 a star leaves every 0.085 s on a 1.25 s cycle and grows at the lens; fireworks on B(6), B(6.5), B(7),
  // B(7.5), B(7.75). The camera creeps in (1 → 1.1) and tilts down 30 px over the shot.
  const BURSTS = [[B(6), 430, 250, "pink"], [B(6.5), 1500, 220, "blue"], [B(7), 980, 150, "ink"], [B(7.5), 330, 560, "blue"], [B(7.75), 1620, 560, "pink"]];
  function sparks(t, lt, dur, S) {
    const g = G(S), st = g.st, e = ease(lt / dur), sx = st.width / 1920, sy = st.height / 1080, X = x => st.left + x * sx, Y = y => st.top + y * sy;
    cam(g, [960, 540 - 30 * e, 1 + 0.1 * e], [960, 540, 1], mid(st), [sx, sy]);
    Ob(st, 6, C.ink, 1.5); Br(st, 12, C.blue, 1.25);
    const k = md(t, [[3.4, "normal"], [3.92, "spark", "spark"]]), mv = move("idle", t), hs = S.u * 1.6;
    const h = hero(X(960), Y(814), hs, { dy: mv.dy, sq: mv.sq + armSq(t > 3.92 ? 0.9 : 0.2), take: k.take, em: k.em, ek: k.ek });
    glass(st, t);
    const ey = h.top + hs * 0.3;
    for (let i = 0; i < 16; i++) {                                   // stars fly out of the eyes (sideways only) and grow
      const l0 = 3.95 + i * 0.085; if (t < l0) continue;
      const ph = ((t - l0) / 1.25) % 1, ang = hash(i + 20) * TAU, fly = easeOut(ph), ex = X(960) + (i % 2 ? 1 : -1) * hs * 0.25;
      const x = ex + Math.cos(ang) * fly * 1000 * sx, y = ey + Math.sin(ang) * 640 * sy * 0.45, z = Math.max(2, (10 + 56 * ph) * sy * 1.2);
      if (i % 3) Osq(x, y, z, C.ink, 1); else Sq(x, y, z, C.blue);
    }
    for (const [tb, bx0, by0, cn] of BURSTS) {                       // fireworks: a flash, then a square ring of 12 sparks that falls
      const a = t - tb; if (a < 0 || a > 0.9) continue;
      const col = C[cn], bx = X(bx0), by = Y(by0), r = 40 + 320 * easeOut(a / 0.8), d = 18 * (1 - a / 0.9) + 4;
      if (a < 0.14) Sq(bx, by, (90 * (1 - a / 0.14) + 20) * sy * 1.4, col);
      for (let j = 0; j < 12; j++) {
        const aa = j / 12 * TAU + hash(tb) * 3, c = Math.cos(aa), s = Math.sin(aa), n = Math.max(Math.abs(c), Math.abs(s));
        Sq(bx + c / n * r * sx, by + (s / n * r + 90 * a * a) * sy, Math.max(2, d * sy * 1.6), j % 2 ? col : C.ink);
      }
    }
  }

  // B(8) · Reverse on the Researcher: 5.5 starry-eyed → 6.0 wide + sweat (take, jitter). Circuit vines crawl across the wall
  // (the strip) from 5.95, one every 0.09 s, going blue → pink with the nerves (6.0–7.6). The chair scoots back on B(9),
  // B(10), B(11) (0.2 s each, easeOut, smaller each time). Sparkles fade by 6.3; hair rises 6.5–7.4; 7.45–7.98 three
  // vines race at the lens (easeIn). The camera pulls back 1.32 → 1.2 and pans left 70 px over the shot.
  const VINES = [];
  for (let i = 0; i < 12; i++) {
    let x = 1700 + hash(i * 5) * 180, y = 620 + hash(i * 5 + 1) * 280; const p = [[x, y]];
    for (let k = 0; k < 6; k++) { if (k % 2 === 0) x -= 120 + hash(i * 9 + k) * 330; else y += (hash(i * 9 + k + 50) - 0.64) * 400; p.push([x, y]); }
    VINES.push(p);
  }
  function reaction(t, lt, dur, S) {
    const g = G(S), st = g.st, m = g.m, e = ease(lt / dur), nerv = seg(t, 6.0, 7.6), sx = st.width / 1920, sy = st.height / 1080, X = x => st.left + x * sx, Y = y => st.top + y * sy;
    cam(g, [lerp(930, 860, e), 600, 1.32 - 0.12 * e], [930, 600, 1.32]);
    Ob(m, 6, C.ink, 1.25); H(m.left - 6, m.right + 6, m.top - 9, C.blue, 2);   // the back of the monitor, glowing at its rim
    VINES.forEach((p, i) => {
      const gr = easeOut(seg(t, 5.95 + i * 0.09, 7.2 + i * 0.05)); if (gr < 0.01) return;
      const q = partial(p.map(([x, y]) => [X(x), Y(y)]), gr), col = nerv * (0.4 + 0.6 * hash(i + 3)) > 0.5 ? C.pink : C.blue;
      P(q, col, 1.25);
      for (let j = 1; j < q.length - 1; j++) Sq(q[j][0], q[j][1], 4, col);
      const tip = q[q.length - 1]; Sq(tip[0], tip[1], 5, C.bg); Osq(tip[0], tip[1], 5, col, 1);
    });
    const XX = kf(t, [[B(9), 990], [B(9) + 0.2, 880], [B(10), 880], [B(10) + 0.2, 770], [B(11), 770], [B(11) + 0.2, 660]], easeOut);
    const SS = kf(t, [[B(9), 40], [B(9) + 0.2, 37], [B(10), 37], [B(10) + 0.2, 34], [B(11), 34], [B(11) + 0.2, 31]], easeOut);
    const k = md(t, [[5.5, "star"], [6.0, "wide", "sweat"]]), nervous = t >= 6.0;
    const rs = S.u * 1.3 * SS / 40, rx = S.text.left + S.text.width * 0.5 + (XX - 990) * g.sx, jx = nervous ? (hash(Math.floor(t * 12) * 3.1) - 0.5) * 4 * Math.max(0.5, g.sx) : 0;
    const r = res(rx + jx, chair(rx, g.fl, rs, -1), rs, { take: k.take, sq: armSq(nervous ? -0.95 : -0.5), hair: seg(t, 6.5, 7.4), em: k.em, ek: k.ek });
    if (t < 6.3) for (let i = 0; i < 7; i++) {                      // leftover sparkles drifting down
      const kk = 1 - seg(t, 5.8 + hash(i) * 0.3, 6.3);
      Osq(X(300 + hash(i + 1) * 1300), Y(150 + hash(i + 2) * 500 + (t - 5.67) * 120), 26 * kk * sy * 1.6, C.blue, 1);
    }
    if (nervous) for (let i = 0; i < 4; i++) {                     // sweat drops flicking off (1.5 per second each)
      const ph = ((t - 6) * 1.5 + i / 4) % 1, side = i % 2 ? 1 : -1;
      Sq(rx + side * (0.3 + ph * 0.22) * rs, r.top - rs * 0.1 + ph * 300 * ph * g.sy, 4, C.blue);
    }
    const p = easeIn(seg(t, 7.45, 7.98));                            // the vines reach the lens
    if (p > 0) [[260, 1], [600, 1.25], [900, 0.9]].forEach(([yy, sp], i) => {
      const x1 = lerp(2020, -300, clamp(p * sp)), xm = lerp(2020, x1, 0.5), y2 = yy + 80 * (i - 1);
      P([[X(2020), Y(yy)], [X(xm), Y(yy)], [X(xm), Y(y2)], [X(x1), Y(y2)]], i === 1 ? C.pink : C.blue, 3);
      Sq(X(x1), Y(y2), Math.max(6, 60 * sy), C.bg); Osq(X(x1), Y(y2), Math.max(6, 60 * sy), C.ink, 1.25);
    });
  }

  // 8.0 · On screen (the strip): the hero shrugs 8.02–8.22 (backOut) and drops it 8.55–8.75; winks on B(12), looks at
  // 8.66; the loss chart pops 8.5–8.68 (backOut); 8.74–9.0 the camera dives into the chart (easeIn, zoom .95 → 3.4).
  const CH = { x: 1180, y: 170, w: 460, h: 340 };
  function shrug(t, lt, dur, S) {
    const g = G(S), st = g.st, sx = st.width / 1920, sy = st.height / 1080;
    const Q = (x, y) => [st.left + (960 + (x - 960) * 0.95) * sx, st.top + (540 + (y - 540) * 0.95) * sy];   // their base-screen position
    const dive = easeIn(seg(t, 8.74, 9.0));
    cam(g, [lerp(960, CH.x + CH.w * 0.5, dive), lerp(540, CH.y + CH.h * 0.5, dive), lerp(0.95, 3.4, dive)], [960, 540, 0.95], mid(st), [sx, sy]);
    K.clip = isect(rr(st.left - 14, st.top - 14, st.width + 28, st.height + 28), g.clip);   // the dive stays inside the monitor
    Ob(st, 6, C.ink, 1.5); Br(st, 12, C.blue, 1.25);
    const k = md(t, [[7.9, "normal"], [B(12), "wink"], [8.66, "look"]]);
    const sh = backOut(seg(t, 8.02, 8.22)) * (1 - ease(seg(t, 8.55, 8.75)));
    const [hx, hb] = Q(720, 814);
    hero(hx, hb, S.u * 1.55, { dy: -sh * 0.5, sq: armSq(lerp(0.2, 1.05, sh)), take: k.take });
    const kk = backOut(seg(t, 8.5, 8.68));
    if (kk > 0.02) {                                                  // the chart scales up about its centre
      const cx = CH.x + CH.w / 2, cy = CH.y + CH.h / 2, W_ = (x, y) => Q(cx + (x - cx) * kk, cy + (y - cy) * kk);
      const [x0, y0] = W_(CH.x, CH.y), [x1, y1] = W_(CH.x + CH.w, CH.y + CH.h), [, yh] = W_(0, CH.y + 42);
      F(x0, y0, x1 - x0, y1 - y0, C.bg); O(x0, y0, x1 - x0, y1 - y0, C.ink, 1.25);
      F(x0, y0, x1 - x0, yh - y0, C.pink);
      for (let i = 0; i < 3; i++) { const [dx, dy] = W_(CH.x + 26 + i * 26, CH.y + 21); Sq(dx, dy, Math.max(2, 10 * sy * kk), C.bg); }
      const A = (fx, y) => W_(CH.x + 40 + fx * (CH.w - 70), CH.y + y);
      P([W_(CH.x + 36, CH.y + 64), W_(CH.x + 36, CH.y + CH.h - 30), W_(CH.x + CH.w - 24, CH.y + CH.h - 30)], C.muted, 1);
      P([A(0, 110), A(0.2, 110), A(0.2, 116), A(0.4, 116), A(0.4, 122), A(0.6, 122), A(0.6, CH.h - 48), A(1, CH.h - 48)], C.blue, 1.5);
    }
    glass(st, t);
  }

  // 9.0 · Inside the chart: the hero hops onto the sled (9.0–9.35), slides down the stepped loss curve accelerating
  // (power 1.7) to the cliff by B(15), teeters (scared '!' at B(15)+.04, camera pushes 1.16 over .2 s), plunges 10.82–11.45
  // (easeIn), lands with an elastic squash and a splash at 11.45 (camera shake 22 → 0 by 11.8), hops 11.75–12.05, 'spark'.
  const CLIFF = 1500;
  const lossY = x => x < CLIFF ? 300 + 16 * Math.sin(x * 0.018) * (1 - x / 1600) + x * 0.03 : x < CLIFF + 60 ? lerp(345, 1650, ease((x - CLIFF) / 60)) : 1650;
  const lossS = x => x < CLIFF ? lossY(Math.floor((x + 560) / 100) * 100 - 560) : lossY(x);   // our curve steps every 100 px
  function sledAt(t) {                                               // theirs: [x, y, rot, phase]
    if (t < 9.35) { const p = seg(t, 9.0, 9.35); return [lerp(-480, -150, p), lerp(lossS(-150) - 120, lossS(-150), p) - Math.sin(p * Math.PI) * 200, 0, "hop"]; }
    if (t < B(15)) { const x = lerp(-150, CLIFF - 8, Math.pow(seg(t, 9.35, B(15)), 1.7)); return [x, lossS(x), 0, "slide"]; }
    if (t < 10.82) { const a = t - B(15); return [CLIFF - 4, lossS(CLIFF - 4), 0.5 * Math.sin(a * 22) * 0.25 * (1 - a * 1.2) + 0.1, "teeter"]; }
    if (t < 11.45) { const p = easeIn(seg(t, 10.82, 11.45)); return [lerp(CLIFF, CLIFF + 90, p), lerp(lossS(CLIFF - 4), 1650, p), lerp(0.1, 0.5, p), "fall"]; }
    return [CLIFF + 90, 1650, 0, "land"];
  }
  function lossRide(t, lt, dur, S) {
    const g = G(S), st = g.st, CR = rr(st.left + st.width * 0.04, st.top + st.height * 0.05, st.width * 0.92, st.height * 0.9);
    const ws = CR.width / 2460, hs_ = CR.height / 1910, WX = x => CR.left + (x + 560) * ws, WY = y => CR.top + (y + 150) * hs_;
    noCam(g.clip); D.fill(CR.left, CR.top, CR.width, CR.height, C.bg, 0.94); Ob(CR, 0, C.ink, 1.25);
    const [px, py, rot, ph] = sledAt(t), hs = S.u * 1.1;
    const tee = ease(seg(t, B(15), B(15) + 0.2)) * (1 - ease(seg(t, 10.8, 10.95))), land = ease(seg(t, 11.3, 11.6));
    let z = 1 + 0.16 * tee; if (ph === "fall") z = 0.95; z = lerp(z, 1, land);
    const [shx, shy] = t > 11.45 ? shakeXY(t, 22 * (1 - seg(t, 11.45, 11.8))) : [0, 0];
    K = { px: WX(px), py: WY(py), r: z, ox: -shx * z * g.sx, oy: -shy * z * g.sy, clip: isect(CR, g.clip) };
    for (let gx = -480; gx < 1900; gx += 160) V(WX(gx), CR.top - 400, CR.bottom + 400, C.rule, 1);    // graph paper
    for (let gy = -140; gy < 1760; gy += 160) H(CR.left - 400, CR.right + 400, WY(gy), C.rule, 1);
    const cp = []; for (let x = -560; x < CLIFF; x += 100) { const y = lossS(x); cp.push([WX(x), WY(y)], [WX(Math.min(CLIFF, x + 100)), WY(y)]); }
    cp.push([WX(CLIFF), WY(1650)], [WX(2000), WY(1650)]);
    P(cp.filter((q, i) => i === 0 || q[0] !== cp[i - 1][0] || q[1] !== cp[i - 1][1]), C.blue, 1.75);
    P([[WX(-540), WY(-140)], [WX(-540), WY(1700)], [WX(2000), WY(1700)]], C.muted, 1);
    const k = md(t, [[9.0, "happy"], [B(15) + 0.04, "scared", "!"], [11.47, "swirl"], [11.78, "happy", "spark"]]);
    const hx = WX(px), hb = WY(py);
    if (ph === "slide" && seg(t, 9.35, B(15)) > 0.3) for (let j = 0; j < 5; j++) H(WX(px - 330 - j * 50), WX(px - 170 - j * 30), WY(py - 42 - j * 26), C.ink, 1);
    if (ph === "fall") for (let j = 0; j < 5; j++) V(WX(px - 90 + j * 45), WY(py - 440 - hash(j) * 120), WY(py - 260 - hash(j) * 80), C.ink, 1);
    let sq = 0, arms = 0.3, dy = 0, dx = 0;
    if (ph === "hop") { sq = -0.12; arms = 1.1; }
    if (ph === "slide") { arms = lerp(0.3, 1.25, seg(t, 9.6, 10.1)); sq = t < 9.5 ? 0.2 * (1 - seg(t, 9.35, 9.5)) : 0; }
    if (ph === "teeter") { arms = 0.3 + 0.6 * Math.sin((t - B(15)) * 24); dx = (rot - 0.1) * hs * 1.5; }   // their rocking (rotation) as a sway
    if (ph === "fall") { sq = -0.25; arms = 1.35; }
    if (ph === "land") { const a = t - 11.45; sq = 0.35 * (1 - elasticOut(a / 0.5)); dy = -Math.max(0, Math.sin(seg(t, 11.75, 12.05) * Math.PI)) * 1.5; arms = t > 11.75 ? 1.3 : -0.2; }
    if (ph === "land") {                                             // the splash at the bottom of the drop
      const a = t - 11.45, sx_ = CLIFF + 90, r = 120 + 300 * easeOut(a / 0.35), th = 34 + 40 * easeOut(a / 0.35);
      F(WX(sx_ - r), WY(1660) - th * hs_ / 2, 2 * r * ws, th * hs_, C.pink);
      if (a < 0.45) D.alpha(1 - a / 0.45, () => { const f = 90 + 330 * easeOut(a / 0.3); O(WX(sx_ - f), WY(1640 - f * 0.6), 2 * f * ws, 1.2 * f * hs_, C.blue, 1.5); });
      for (let i = 0; i < 14; i++) {
        const an = -Math.PI * (0.1 + 0.8 * hash(i + 40)), v = 500 + hash(i + 41) * 700;
        Sq(WX(sx_ + Math.cos(an) * v * a), WY(1640 + Math.sin(an) * v * a + 1500 * a * a), Math.max(2, (14 + hash(i) * 16) * 2 * ws), [C.pink, C.ink, C.blue, C.blue][i % 4]);
      }
    }
    if (ph === "hop") { H(WX(-150) - hs * 0.62, WX(-150) + hs * 0.62, WY(lossS(-150)) - 1, C.ink, 2); }
    hero(hx + dx, hb - 3, hs, { sq: sq + armSq(arms), take: k.take, dy, em: k.em, ek: k.ek });
    if (ph !== "hop") { H(hx + dx - hs * 0.62, hx + dx + hs * 0.62, hb - 1, C.ink, 2); V(hx + dx + hs * 0.62, hb - 1 - hs * 0.25, hb - 1, C.ink, 2); }   // the sled
  }

  // 12.1 · Back in the lab: the monitor bulges and wobbles faster and faster (12.1 → B(18)); on B(18) the hero bursts out
  // (shake 20 → 0 over .4 s, glow flash .4 s, 12 shards), flies .3 s in an arc growing ×4 to person size and lands with an
  // elastic squash (.45 s); happy + spark at B(18)+.32. The Researcher's chair shoots away B(18)+.05 → +.4 (easeOut).
  function burst(t, lt, dur, S) {
    const g = G(S), m = g.m, hit = B(18), a = seg(t, hit, hit + 0.3);
    const [shx, shy] = t > hit ? shakeXY(t, 20 * (1 - seg(t, hit, hit + 0.4))) : [0, 0];
    cam(g, [880 + shx, 610 + shy, 1.28 + 0.04 * seg(t, 12.1, 12.9)], [880, 610, 1.28]);
    const [mcx, mcy] = mid(m), wob = t < hit ? seg(t, 12.1, hit) : 0, bulge = 1 + 0.07 * Math.sin((t - 12.1) * 46) * wob;
    const mw = m.width * bulge, mh = m.height * (2 - bulge), mr = rr(mcx - mw / 2, mcy - mh / 2, mw, mh);
    Ob(mr, 6, C.ink, 1.25);
    D.alpha(t < hit ? Math.min(1, 0.5 + wob) : 0.6, () => Br(mr, 12 + 8 * wob, C.blue, 1.25));
    Sq(mr.right - 10, mr.bottom - 8, 5, t < hit ? C.blue : C.pink);   // the LED goes red
    const sf = mr.top + mr.height * 0.86;
    if (t < hit) hero(mcx, sf, S.u * 0.7 * (8 + 3 * wob) / 8, { sq: 0.25 * wob });
    else { P([[mcx - mw * 0.32, mcy - mh * 0.3], [mcx - mw * 0.08, mcy - mh * 0.3], [mcx - mw * 0.08, mcy + mh * 0.05], [mcx + mw * 0.2, mcy + mh * 0.05], [mcx + mw * 0.2, mcy + mh * 0.34]], C.ink, 1); P([[mcx + mw * 0.06, mcy - mh * 0.38], [mcx + mw * 0.06, mcy - mh * 0.12], [mcx + mw * 0.34, mcy - mh * 0.12]], C.ink, 1); }
    const fall = easeOut(seg(t, hit + 0.05, hit + 0.4)), rs = S.u * 1.3, rx = S.text.left + S.text.width * 0.15 - 120 * g.sx * fall;   // their tip-over: slide + fall flat
    const seat = chair(rx, g.fl, rs, -1);
    res(rx, lerp(seat, g.fl, fall), rs, { sq: 0.4 * fall + (t < hit ? 0 : armSq(1.25) * (1 - fall)), hair: fall });
    if (t >= hit) {
      const age = t - hit, f = 1 + age * 3;
      D.alpha(1 - seg(age, 0, 0.4), () => Ob(rr(mcx - m.width * f / 2, mcy - m.height * f / 2, m.width * f, m.height * f), 0, C.blue, 2));
      for (let i = 0; i < 12; i++) {                                 // glass shards
        const an = hash(i + 60) * TAU, v = 700 + hash(i + 61) * 700;
        Osq(mcx + Math.cos(an) * v * age * g.sx, mcy - 10 * g.sy + (Math.sin(an) * v * age + 1300 * age * age) * g.sy, 5, i % 2 ? C.blue : C.ink, 1);
      }
      const k = md(t, [[hit, "closed"], [hit + 0.32, "happy", "spark"]]), hs = S.u * 2.2 * lerp(6, 24, easeOut(a)) / 24;
      const x = lerp(mcx, S.text.left + S.text.width * 0.75, a), y = lerp(mcy + m.height * 0.2, g.fl, a) - Math.sin(a * Math.PI) * 260 * g.sy;
      hero(x, y, hs, { sq: a >= 1 ? 0.3 * (1 - elasticOut((t - hit - 0.3) / 0.45)) : -0.15, take: k.take, em: k.em, ek: k.ek });
    }
  }

  // 12.9 · The villain chair spins round B(19)−.1 → B(19)+.38 (ease): the hero in a crown, pointing on every beat
  // (pulse k=5, bob k=4). The Researcher bobs on the beat, fans twice a beat, and tosses a mug (.42 s arc) that lands on
  // the pile on B(20), B(21), B(22), B(23), B(24). The camera creeps 1.2 → 1.26 (13.5–16.8), the lid creaks open in
  // steps from 16.6, 16.9 the Researcher freezes ('!' at 16.95), the pile topples 17.3–17.85, and the camera pushes in
  // 16.9 → B(26) (easeIn, +.5 zoom).
  const TOSS = [B(20), B(21), B(22), B(23), B(24)];
  function mug(x, bot, ms, i) {
    const w = ms, h = ms * 0.9, j = i % 4;
    if (j === 0 || j === 2) F(x - w / 2, bot - h, w, h, j ? C.blue : C.pink); else { F(x - w / 2, bot - h, w, h, C.bg); O(x - w / 2, bot - h, w, h, C.ink, 1); }
    P([[x + w / 2, bot - h * 0.75], [x + w / 2 + ms * 0.28, bot - h * 0.75], [x + w / 2 + ms * 0.28, bot - h * 0.3], [x + w / 2, bot - h * 0.3]], C.ink, 1);
  }
  function boss(t, lt, dur, S) {
    const g = G(S), m = g.m, fl = g.fl, s = S.u * 2.2, hx = S.text.left + S.text.width * 0.75;
    const spin = ease(seg(t, B(19) - 0.1, B(19) + 0.38)), sxc = Math.cos(spin * Math.PI);
    const pushIn = easeIn(seg(t, 16.9, 17.94));
    cam(g, [960, lerp(560, 580, pushIn), 1.2 + 0.06 * ease(seg(t, 13.5, 16.8)) + 0.5 * pushIn], [960, 560, 1.2], [hx, fl - s]);
    // the wrecked monitor, still smoking (a puff every 2 s, three at a time)
    const [mcx] = mid(m); Ob(m, 6, C.muted, 1.25); Sq(m.right - 10, m.bottom - 8, 5, C.pink);
    P([[mcx - m.width * 0.32, m.top + m.height * 0.2], [mcx - m.width * 0.08, m.top + m.height * 0.2], [mcx - m.width * 0.08, m.top + m.height * 0.55], [mcx + m.width * 0.2, m.top + m.height * 0.55]], C.muted, 1);
    for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i / 3) % 1; D.alpha(1 - ph, () => Osq(mcx + Math.sin(ph * 6 + i) * 20 * g.sx, m.top - ph * 260 * g.sy, (22 + ph * 40) * 0.6 * Math.max(g.sx, 0.3) * 2, C.muted, 1)); }
    // the executive chair
    const seat = fl - 0.45 * s, bw = 2.2 * s * Math.max(0.05, Math.abs(sxc)), bt = seat - 1.85 * s, bb = seat + 0.25 * s;
    V(hx, seat + 0.28 * s, fl, C.ink, 1.5); H(hx - 0.75 * s, hx + 0.75 * s, fl - 1, C.ink, 1.5);
    if (spin > 0.1 && spin < 0.9) for (let i = 0; i < 3; i++) H(hx - (1.5 + i * 0.16) * s, hx + (1.5 + i * 0.16) * s, bt + (0.3 + i * 0.12) * s, C.muted, 1);
    if (sxc > 0) {                                                   // the back of the chair hides the sitter
      F(hx - bw / 2, bt, bw, bb - bt, C.ink);
      for (let r = 0; r < 3; r++) for (let c = -1; c <= 1; c++) Sq(hx + c * bw * 0.25, bt + (0.45 + r * 0.45) * s, Math.max(1, 4 * sxc + 1), C.bg);
    } else {
      const k = -sxc;
      O(hx - bw / 2, bt, bw, bb - bt, C.ink, 1.5);
      const lid = kf(t, [[16.6, 0], [16.9, 0.1], [17.05, 0.08], [17.3, 0.22], [17.45, 0.2], [17.7, 0.38], [17.94, 0.52]], easeOut) + (t > 16.6 ? (hash(Math.floor(t * 12) * 5.3) - 0.5) * 0.024 : 0);
      const hk = md(t, [[13.2, "narrow"], [17.25, "happy"]]);
      const h = hero(hx, seat + 0.04 * s, s, { sx: k, lid, take: hk.take, dy: -0.25 * pulse(t, 4) });
      if (t < 16.6) { const len = (0.4 + 0.35 * pulse(t, 5)) * s * 0.7; H(h.left - len, h.left, h.bottom - h.h * 0.55, C.ink, 2); }   // points at the Researcher on every beat
      const cw = s * 0.9 * k, cy = h.top - 5;                        // the crown
      F(hx - cw / 2, cy - 4, cw, 4, C.ink); for (const f of [0, 0.5, 1]) F(hx - cw / 2 + f * (cw - 4), cy - 10, 4, 6, C.ink);
      F(hx - 1.17 * s * k, seat - 0.04 * s, 2.34 * s * k, 0.28 * s, C.ink);   // the seat, in front
      for (const sd of [-1, 1]) F(hx + sd * 1.2 * s * k - 0.16 * s, seat - 0.44 * s, 0.32 * s, 0.16 * s, C.ink);
    }
    // the side table with the growing, wobbling mug pile
    const tx = hx + 1.9 * s, tt = fl - 0.42 * s, ms = 0.28 * s;
    H(tx - 0.5 * s, tx + 0.5 * s, tt, C.ink, 1.5); V(tx, tt, fl, C.ink, 1.25);
    const landed = TOSS.filter(x => t >= x).length, n = 3 + landed, topple = easeIn(seg(t, 17.3, 17.85));
    for (let i = 0; i < n; i++) {
      const w = (Math.sin(t * 5 + i) * i * 1.6 + topple * Math.pow(i, 1.4) * 34) * g.sx, bump = i >= 3 && t - TOSS[i - 3] < 0.2 ? 0.2 * (1 - (t - TOSS[i - 3]) / 0.2) : 0;
      mug(tx + w, tt - i * ms * (1 - bump * 0.4) + topple * i * i * 3 * g.sy, ms, i);
      if (i === n - 1 && !topple) for (const d of [-0.2, 0.2]) V(tx + w + d * ms, tt - (i + 1) * ms - ms * 0.9, tt - (i + 1) * ms - ms * 0.3, C.muted, 1);   // steam
    }
    // the Researcher: toss, fan, toss, fan… then freeze
    const rs = S.u * 1.2, rx = hx - 1.7 * s, frozen = t > 16.9, bp = bpOf(t);
    TOSS.forEach((tl, j) => {
      const p = seg(t, tl - 0.42, tl); if (p <= 0 || p >= 1) return;
      const i = j + 3; mug(lerp(rx + rs * 0.6, tx, p), lerp(fl - rs * 0.8, tt - i * ms, p) - Math.sin(p * Math.PI) * 340 * g.sy, ms, i);
    });
    const toss = TOSS.some(tl => t > tl - 0.5 && t < tl - 0.3), fan = Math.sin(bp * TAU * 2);
    const rm = md(t, [[13.0, "dot"], [16.95, "wide", "!"]]);
    const r = res(rx, fl, rs, { take: rm.take, em: rm.em, ek: rm.ek, hair: frozen ? seg(t, 16.95, 17.3) : 0, dy: frozen ? 0 : -0.25 * Math.abs(Math.sin(bp * Math.PI)), sq: armSq(frozen ? 0.2 : toss ? 0.9 : -0.6) });
    if (!frozen) F(r.left - rs * 0.55, r.top + rs * (0.35 - 0.25 * fan), rs * 0.4, rs * 0.18, C.blue);   // the fan, twice a beat
  }

  // B(26) · The hallway chase (the three photos are the doors): each beat B(26)…B(30) the Researcher runs out of one door
  // and into another along their route (.8 beat each), the hero .3 beat behind, bigger every time (13 → 34), chomping
  // twice a beat (move 'run'). Doors swing open .14 s before each exit and entry. B(31) the Researcher bursts out of the
  // middle door at the camera (easeIn to B(32)+.12); B(32) the hero smashes through it (shake 16 → 0 in .3 s, planks) and
  // lunges at the lens with its jaws opening (to 22.5). The camera sways (sin 1.3t, 20 px).
  const DOORS = [400, 960, 1520], DW = 230, HF = 830, ROUTES = [[0, 2], [2, 1], [1, 0], [0, 2], [2, 1]], CU = [13, 17, 22, 28, 34];
  const BEAT = B(1) - B(0);
  function runner(t, k, delay) {
    const t0 = B(26 + k) + delay * BEAT, p = (t - t0) / (BEAT * 0.8);
    if (p < 0 || p > 1) return null;
    const [a, b] = ROUTES[k], out = Math.min(p / 0.14, (1 - p) / 0.14, 1);
    return { a, b, p, y: lerp(HF - 34, HF + 26, out), sc: lerp(0.82, 1, out), out };
  }
  function doorOpen(t, d) {
    let v = 0;
    ROUTES.forEach(([a, b], k) => [0, 0.3].forEach(dl => {
      const t0 = B(26 + k) + dl * BEAT, t1 = t0 + BEAT * 0.8;
      for (const [door, te] of [[a, t0], [b, t1]]) if (door === d) v = Math.max(v, seg(t, te - 0.14, te - 0.02) * (1 - seg(t, te + 0.1, te + 0.24)));
    }));
    if (d === 1) v = Math.max(v, seg(t, B(31) - 0.12, B(31)) * (1 - seg(t, B(31) + 0.3, B(31) + 0.45)));
    return v;
  }
  const doorsOf = (S, st) => [0, 1, 2].map(i => S.photos.length === 3 ? S.photos[i] : rr(st.left + i * st.width / 3, st.top, st.width / 3, st.height));
  function hallway(t, D3, smashed, ys) {
    D3.forEach((r, d) => {
      Ob(r, 4, C.ink, 1.25);
      if (smashed && d === 1) { F(r.left, r.top, r.width, r.height, C.bg); O(r.left, r.top, r.width, r.height, C.ink, 1.5);   // 3.2: white, outlined
        for (let i = 0; i < 4; i++) V(r.left + (i * 58 + 25) / DW * r.width, r.top, r.top + (40 + hash(i) * 50) * ys, C.muted, 3); return; }
      const th = doorOpen(t, d); if (th > 0.005) { F(r.left + r.width * (1 - 0.82 * th), r.top, r.width * 0.82 * th, r.height, C.bg); O(r.left + r.width * (1 - 0.82 * th), r.top, r.width * 0.82 * th, r.height, C.ink, 1.5); }   // 3.2: the open doorway is white, outlined
    });
  }
  function chase(t, lt, dur, S) {
    const g = G(S), st = g.st, D3 = doorsOf(S, st), dc = D3.map(r => r.left + r.width / 2), ys = st.height / 400, xs = st.width / 1920;
    // Yh: their door plane (door top 430 → strip top, threshold HF → strip bottom); Yc: at the camera (HF → strip bottom,
    // their frame's bottom edge 1080 → the name), for the two moves that come at the lens
    const Yh = y => st.bottom + (y - HF) * ys, Yc = y => y <= HF ? Yh(y) : st.bottom + (y - HF) / (1080 - HF) * (g.fl - st.bottom), smash = t >= B(32), bp = bpOf(t);
    const [shx, shy] = smash ? shakeXY(t, 16 * (1 - seg(t, B(32), B(32) + 0.3))) : [0, 0];
    cam(g, [960 + shx + Math.sin(t * 1.3) * 20, 580 + shy, 1.12], [960, 580, 1.12], mid(st), [xs, ys]);
    hallway(t, D3, smash, ys);
    for (let k = 0; k < ROUTES.length; k++) {
      const c = runner(t, k, 0.3);
      if (c) {
        const u = CU[k] * c.sc, squeeze = Math.min(1, (DW + 30) / (10 * CU[k])), mv = move("run", t);
        hero(lerp(dc[c.a], dc[c.b], c.p), Yh(c.y), 8 * u * ys, { dy: mv.dy, sq: mv.sq, sx: lerp(squeeze, 1, c.out), lid: 0.15 + 0.45 * Math.abs(Math.sin(bp * TAU)) });
      }
      const r = runner(t, k, 0);
      if (r) res(lerp(dc[r.a], dc[r.b], r.p), Yh(r.y), 14 * 8 * r.sc * ys * 0.5, { hair: 1, sq: armSq(1), edge: true });
    }
    if (t >= B(31) && t < B(32) + 0.15) {                            // the Researcher bursts out of the middle door, at the camera
      const p = easeIn(seg(t, B(31), B(32) + 0.12));
      res(dc[1] - p * 330 * xs, Yc(lerp(HF - 20, 1560, p)), lerp(10, 64, p) * 12 * ys * 0.5, { hair: 1, em: "sweat", ek: 1, edge: true });
    }
    if (smash) {                                                     // …and the hero smashes through it, lunging at the lens, jaws wide
      const p = seg(t, B(32), 22.5), a = t - B(32);
      for (let i = 0; i < 9; i++) {
        const an = -Math.PI * (0.05 + 0.9 * hash(i + 80)), v = 700 + hash(i + 81) * 800, x = dc[1] + Math.cos(an) * v * a * xs, y = Yh(640 + Math.sin(an) * v * a + 1400 * a * a);
        F(x - 60 * xs, y - 14 * ys, 120 * xs, 28 * ys, C.muted); O(x - 60 * xs, y - 14 * ys, 120 * xs, 28 * ys, C.ink, 1);
      }
      hero(dc[1], Yc(lerp(HF + 10, 1290, easeIn(p))), lerp(30, 150, easeIn(p)) * 8 * ys, { lid: lerp(0.45, 1, ease(p * 2)), sq: -0.08 });
    }
  }

  // 22.5 · Inside the mouth: the jaws slam shut over the camera on B(33) (easeIn). CHOMP! pops (1/6 s, backOut) with a
  // shake and fades 22.9–23.0. Black to the chorus.
  function chomp(t, lt, dur, S) {
    const g = G(S), st = g.st, D3 = doorsOf(S, st), xs = st.width / 1920, ys = st.height / 1080, shut = B(33), close = easeIn(seg(t, 22.5, shut));
    noCam(g.clip); hallway(t, D3, true, st.height / 400);
    K.clip = isect(st, g.clip);
    const h = lerp(1500, 0, close), top = st.top + (540 - h / 2) * ys, bot = st.top + (540 + h / 2) * ys;
    if (h > 14) {
      F(st.left, st.top - 10, st.width, top - st.top + 10, C.bg); F(st.left, bot, st.width, st.bottom + 10 - bot, C.bg);   // 3.1: white jaws, graphite outline
      O(st.left, st.top, st.width, top - st.top, C.ink, 1.5); O(st.left, bot, st.width, st.bottom - bot, C.ink, 1.5);
      // (their teeth are left out: Mannat rejected teeth on 2026-09-24, "teeth don't match our current aesthetic at all")
    } else { F(st.left, st.top, st.width, st.height, C.bg); O(st.left, st.top, st.width, st.height, C.ink, 1.5); O(st.left, st.top + st.height / 2, st.width, 0, C.ink, 1.5); }   // 3.1: shut jaws as white boxes meeting in the middle
    if (t >= shut) {
      const [shx, shy] = shakeXY(t, 14), pop = backOut(clamp((t - shut) * 6)), size = 240 * ys * pop;
      if (size > 1) D.alpha(1 - seg(t, 22.9, 23.0), () => D.text("CHOMP!", st.left + st.width / 2 + shx * xs, st.top + st.height / 2 + size * 0.35 + shy * ys, C.ink, size, "center"));
    }
  }

  chapter("lab", 1.5, 23.0, [[1.5, labOver], [B(5), sparks], [B(8), reaction], [8.0, shrug], [9.0, lossRide], [12.1, burst], [12.9, boss], [B(26), chase], [22.5, chomp]]);
})();
