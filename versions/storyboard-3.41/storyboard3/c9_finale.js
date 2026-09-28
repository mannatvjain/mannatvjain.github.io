// c9 · Curtain call (140.5–157.6). Their src/ch/c09_finale.js, one-for-one in time: the cast runs on from both wings
// (Clawd and the researcher pop up through a trapdoor), the bow ripples down the line as roses land, the meter is
// pumped into a balloon and POPs at B(217), a final dance with confetti cannons, then the house curtain drops with the
// title on it, the hero peeks through the split, and everything fades back to paper.
// Shot starts are theirs: 140.5, B(210), B(214), B(218), B(222). Every time below is theirs; the full table is in
// docs/storyboard-timing/c9_finale.md.
// Their world (1920×1080, floor GY 930, lineup x 350…1525) maps onto the name: x onto the letters' width, y about the
// floor at the same scale (WX/WY/SC). Their camera maps to D.cam about the floor, zoom as a ratio of each shot's base.
(() => {
  const { D, C, B, BEAT, seg, kf, ease, easeIn, easeOut, backOut, elasticOut, pulse, bpOf, frac, clamp, lerp, hash, shakeXY, rr, stand, move, mood, pumpH, chapter } = window.__SB;
  const GY = 930;
  const SC = S => S.text.width * 0.92 / 1175;                                  // their px → ours
  const WX = (S, x) => S.text.left + S.text.width * (0.04 + 0.92 * (x - 350) / 1175);
  const WY = (S, y) => S.floor + (y - GY) * SC(S);
  const TOP = S => (S.bar ? S.bar.bottom : 0) + 6;                             // top of the stage band
  const BAND = (S, y) => y > TOP(S) && y < S.floor - 2;                        // action stays above the name
  const CONF = () => [C.pink, C.blue, C.ink, C.muted];

  // ---------- the lineup (theirs: order, x, entrances) ----------
  const LINE = [
    { k: "shog", x: 350, sz: 1.1, col: "blue", from: -1, ta: B(206.5) },
    { k: "chin", x: 555, sz: 1, col: "muted", from: -1, ta: B(207.5) },
    { k: "syd", x: 745, sz: 1.1, col: "pink", outline: 1, from: -1, ta: B(208.5) },
    { k: "res", x: 922, sz: 0.6, col: "ink", from: 0, ta: B(209) },
    { k: "clawd", x: 1112, sz: 1.6, col: "pink", from: 0, ta: B(209) },
    { k: "gato", x: 1318, sz: 1.1, col: "pink", ears: 1, from: 1, ta: B(208) },
    { k: "bas", x: 1470, sz: 1.2, col: "ink", tall: 1, box: 1, from: 1, ta: B(207) },
  ];
  const IDLE = { dy: 0, sq: 0, dx: 0 };

  // one cast member. p: m (move offsets, body units: the square is their 8u figure), bow 0..1, take, lift (px, <0 =
  // below the floor, clipped: rising through the trapdoor), aL/aR (their arm angles: ≥ 0.9 shows a raised hand),
  // emote 'heart' | 'spark' | 'sweat' with emoteK, hair 0..1
  function who(S, c, x, t, p = {}) {
    const m = p.m || IDLE, s = S.u * c.sz, u = s / 8, b = clamp(p.bow || 0), col = C[c.col];
    const sq = (m.sq || 0) + (p.take || 0) + 0.3 * b, lift = -(m.dy || 0) * u + (p.lift || 0), xx = x + (m.dx || 0) * u;
    let h;
    if (lift < 0) {                                                            // under the stage: only the part above the floor
      const w = s * (1 + sq), hh = s * (1 - sq), top = S.floor - lift - hh, bot = Math.min(S.floor, top + hh);
      if (bot > top) D.fill(xx - w / 2, top, w, bot - top, col);
      return null;
    }
    if (c.tall && window.__SB.quirrell) {                                                 // 3.37: the Quirrell basilisk (ch. 4's own drawing); it bows by shortening
      const hq = window.__SB.miniBasilisk(S, t, xx, S.floor - lift, s, b);   // 3.40: the mini basilisk, cast-sized
      return rr(hq.left, hq.top, hq.right - hq.left, S.floor - lift - hq.top);
    }
    h = stand(S, xx, s, { outline: c.outline, col: c.box ? C.bg : col, dy: lift, sq });
    if (c.box) D.rect(h.left, h.top, h.width, h.height, C.ink, 1.25);                                     // 3.1: the basilisk as a white box, graphite outline
    if (c.tall) { const n = s * (1 - 0.5 * b), nx = h.left + h.width * 0.25, nw = h.width * 0.5; D.fill(nx, h.top - n, nw, n, c.box ? C.bg : col); if (c.box) D.rect(nx, h.top - n, nw, n, C.ink, 1.25); }   // the basilisk's neck bows too
    if (c.ears) { D.fill(h.left, h.top - 4, 4, 4, C.pink); D.fill(h.right - 4, h.top - 4, 4, 4, C.pink); }
    const hs = Math.max(3, s * 0.25);
    const hand = (a, sd) => { if (a == null || a < 0.9) return; const r = clamp((a - 0.2) / 1.2); D.sq(sd < 0 ? h.left - hs * 0.7 : h.right + hs * 0.7, h.bottom - s * 0.55 - r * s * 0.6, hs, col); };
    hand(p.aL, -1); hand(p.aR, 1);
    const k = clamp(p.emoteK || 0);
    if (p.emote && k > 0.01) {
      if (p.emote === "heart") D.sq(h.right + 2, h.top - 4 - 4 * k, Math.max(3, s * 0.45) * backOut(k), C.pink);
      if (p.emote === "spark") D.alpha(k, () => D.corners(h, 2 + 4 * backOut(k), C.ink, 1.25, 4));
      if (p.emote === "sweat") D.sq(h.left - 3, h.top + s * 0.1 + 4 * k, 3 * k + 0.5, C.blue);
    }
    if (p.hair > 0.02) for (const f of [0.2, 0.5, 0.8]) D.vl(h.left + h.width * f, h.top - 1 - p.hair * s * 0.8, h.top - 1, C.ink, 1);
    return h;
  }

  // ---------- set pieces ----------
  // their camBegin(cx, cy, z) around fn, relative to the shot's base framing [cx0, cy0, z0]; returns stage x → screen x.
  // The zoom pivots on the floor so feet stay on the name; pans are their px at our scale; shake in their px × W/1920.
  const VPAN = 0.25;                                                          // vertical pans at a quarter: a full tilt sinks the feet into the name
  function cam(S, [cx, cy, z], [cx0, cy0, z0], fn, shx = 0, shy = 0) {
    const r = z / z0, P = WX(S, cx), dx = WX(S, cx0) - P + shx * S.W / 1920, dy = VPAN * (cy0 - cy) * SC(S) * r + shy * S.W / 1920;
    D.cam(P, S.floor, r, fn, dx, dy);
    return x => P + dx + (x - P) * r;
  }
  // their house(): footlights along the stage lip (pulse(t + i·0.05, 3)), drawn under the name, outside the camera
  function footlights(S, t) {
    for (let i = 0; i < 11; i++) D.alpha(0.6 + 0.4 * pulse(t + i * 0.05, 3), () => D.sq(WX(S, 110 + i * 170), S.name.bottom + 3, 3, C.muted));
  }
  // their spotlight(x): a beam and a pool; ours two dotted guides and a pool line on the floor
  function spot(S, x, col, r = 1) {
    const w = 175 * SC(S) * r;
    D.alpha(0.55, () => { D.vl(x - w, TOP(S), S.floor - 2, C.muted, 1, [2, 4]); D.vl(x + w, TOP(S), S.floor - 2, C.muted, 1, [2, 4]); });
    D.alpha(0.6, () => D.hl(x - w, x + w, S.floor - 1, col, 1.5));
  }
  // their audience(t, cheer): the front row bobs on the beat and cheers; ours brackets round the paragraphs below
  function audience(S, t, cheer) {
    const bp = bpOf(t), sc = SC(S);
    S.paras.slice(0, 6).forEach((r, i) => {
      const bob = Math.abs(Math.sin((bp + hash(i) * 0.5) * Math.PI)) * (4 + 12 * cheer) * sc;
      const arm = 6 + (cheer > 0.15 && i % 3 !== 1 ? 14 * cheer * (1 + 0.3 * Math.sin(bp * 2 * Math.PI + i)) : 0);
      D.alpha(0.75, () => D.corners(rr(r.left, r.top - bob, r.width, r.height), 6, C.muted, 1, arm));
    });
  }
  // their puff(): a dust puff at the feet, 0.5 s, pushed back along the floor
  function puff(S, x, age, dir) {
    if (age < 0 || age > 0.5) return;
    for (let k = 0; k < 3; k++) {
      const s = (18 + k * 8) * (0.4 + easeOut(age / 0.5)) * SC(S) * 0.6;
      D.alpha(1 - age / 0.5, () => D.osq(x - dir * (20 + k * 34) * easeOut(age / 0.4) * SC(S), S.floor - s / 2 - 1 - k * 2, s, C.muted, 1));
    }
  }
  // their burstConfetti(x, y, age, n, v0, up, spread): 2.2 s, drag and gravity, in their px at our scale
  function burst(S, x, y, age, n = 18, v0 = 600, up = -Math.PI / 2, spread = 2.6) {
    if (age < 0 || age > 2.2) return;
    const sc = SC(S), cols = CONF();
    for (let i = 0; i < n; i++) {
      const a = up + (hash(i + 7) - 0.5) * spread, v = v0 * (0.6 + hash(i + 8) * 0.8), drag = 1 - Math.exp(-age * 3);
      const px = WX(S, x) + Math.cos(a) * v * drag / 3 * sc, py = WY(S, y) + (Math.sin(a) * v * drag / 3 + 180 * age * age) * sc;
      if (!BAND(S, py)) continue;
      const w = Math.max(1, 6 * Math.abs(Math.cos(age * 9 + i)));
      D.fill(px - w / 2, py - 2, w, 3.5, cols[i % cols.length]);
    }
  }
  // their confettiRain(t, t0, n): screen-space rain; ours falls through the stage band only
  function rain(S, t, t0, n = 44) {
    if (t < t0) return;
    const top = TOP(S), hb = S.floor - top, cols = CONF();
    for (let i = 0; i < n; i++) {
      const ti = t0 + hash(i + 300) * 1.1; if (t < ti) continue;
      const age = t - ti, v = 230 + hash(i + 301) * 220;
      const y = top + (-40 + (age * v) % 1200) / 1080 * hb, x = (hash(i + 302) * 2040 - 60 + Math.sin(age * 2.2 + i) * 50) / 1920 * S.W;
      if (!BAND(S, y)) continue;
      const w = Math.max(1, 6 * Math.abs(Math.cos(age * 7 + i)));
      D.fill(x - w / 2, y - 2, w, 3.5, cols[i % cols.length]);
    }
  }
  // their roses: 18 thrown from the house at B(210.4 + i·0.19), 0.55 s arcs, landing at the feet of LINE[(3i) % 7]
  const FLOWERS = Array.from({ length: 18 }, (_, i) => {
    const c = LINE[(i * 3) % 7], tl = B(210.4 + i * 0.19) + 0.55;
    return { tl, x1: c.x + (hash(i + 90) - 0.5) * 110, y1: GY + 18 + hash(i + 91) * 40, x0: c.x + (hash(i + 92) - 0.5) * 500, fill: i % 3 !== 0 };
  });
  function flowers(S, t) {
    for (const f of FLOWERS) {
      const a = (t - (f.tl - 0.55)) / 0.55; if (a < 0) continue;
      const x = WX(S, a < 1 ? lerp(f.x0, f.x1, a) : f.x1), y = a < 1 ? WY(S, lerp(1250, f.y1, a) - Math.sin(a * Math.PI) * 330) : S.floor;
      const yy = Math.min(y, S.floor) - 2.5;                                    // they land on the floor, not below it
      if (a < 1 && y > S.floor) continue;                                      // still behind the name (the house)
      if (f.fill) D.sq(x, yy, 5, C.pink); else D.osq(x, yy, 5, C.pink, 1.25);
    }
  }

  // =================================================================================================
  // 140.5 · Places! The cast runs on from both wings (0.7 s each, easeOut, landing at ta) and skids into a line
  // (elasticOut squash 0.45 s, a dust puff). The trapdoor opens at B(209) − 0.45 and the researcher and hero rise
  // through it (backOut, B(209) − 0.25 … + 0.12) with a confetti burst; it shuts 143.05–143.35.
  // =================================================================================================
  function runOn(t, lt, dur, S) {
    const sh = cam(S, [960, 722, 1.28 + 0.03 * ease(lt / dur)], [960, 722, 1.28], () => {
      const tr = B(209), open = easeOut(seg(t, tr - 0.45, tr - 0.3)) * (1 - easeOut(seg(t, 143.05, 143.35)));
      if (open > 0.02) D.fill(WX(S, 1020) - 250 * open * SC(S), S.floor - 3, 500 * open * SC(S), 3, C.ink);   // the trapdoor
      const rise = seg(t, tr - 0.25, tr + 0.12);
      for (const c of LINE) {
        const x = WX(S, c.x), s = S.u * c.sz;
        if (c.from === 0) {
          if (rise <= 0) continue;
          const lift = -lerp(330, 0, backOut(rise)) * SC(S);
          const m = rise < 1 ? { ...IDLE, sq: -0.2 } : { ...move("bounce", t), dx: 0 };
          who(S, c, x, t, { m, lift, aL: c.k === "res" && rise >= 1 ? 0.9 : undefined, aR: c.k === "res" && rise >= 1 ? 0.9 : undefined });
          continue;
        }
        const run = seg(t, c.ta - 0.7, c.ta);
        if (run <= 0) continue;
        const xx = lerp(c.from < 0 ? -s : S.W + s, x, easeOut(run)), age = t - c.ta;
        const m = run < 1 ? { ...move("run", t), dx: 0 } : { ...move("bounce", t + c.x * 0.001), dx: 0, sq: 0.28 * (1 - elasticOut(age / 0.45)) + move("bounce", t).sq };
        who(S, c, xx, t, { m });
        if (run >= 1) puff(S, xx, age, -c.from);
      }
      if (rise > 0) burst(S, 1020, GY - 120, t - tr, 20, 900);
    });
    spot(S, sh(WX(S, 520)), C.muted); spot(S, sh(WX(S, 1400)), C.muted);
    footlights(S, t);
    audience(S, t, 0.15 + 0.5 * seg(t, B(209), B(209) + 0.3));
  }

  // =================================================================================================
  // B(210) · The bow ripples down the line, one every 0.4 beat (tb(i) = B(210 + 0.4i): ease in 0.22 s, hold 0.28,
  // up 0.28), the camera riding along it (kf on tb(i), zoom 1.8); roses fly in; B(212.55)–B(213) the camera pulls
  // out to 1.3 and at B(213) everyone bows together (hold 0.3); confetti rain from B(213) − 0.2.
  // =================================================================================================
  const tb = i => B(210 + i * 0.4), GB = B(213);
  const bowAt = (t, t0, hold = 0.28) => ease(seg(t, t0, t0 + 0.22)) * (1 - ease(seg(t, t0 + 0.22 + hold, t0 + 0.5 + hold)));
  function bows(t, lt, dur, S) {
    const keys = LINE.map((c, i) => [tb(i), clamp(c.x, 560, 1380)]);
    const out = ease(seg(t, B(212.55), GB));
    const cx = lerp(kf(t, keys), 960, out), cy = lerp(GY - 200, 722, out), z = lerp(1.8, 1.3, out);
    const sh = cam(S, [cx, cy, z], [960, 722, 1.3], () => {
      LINE.forEach((c, i) => {
        const b = Math.max(bowAt(t, tb(i)), bowAt(t, GB, 0.3)), m = { ...move("idle", t + i * 0.1), dx: 0 };
        const done = t > tb(i) + 0.6, waver = c.k === "clawd" || c.k === "syd" || c.k === "gato";
        const wave = c.k === "shog" ? seg(t, tb(0) + 0.6, tb(0) + 0.9) * (1 - seg(t, GB - 0.2, GB)) : 0;
        who(S, c, WX(S, c.x), t, {
          m, bow: b,
          aL: waver ? (done && t < GB ? 1.2 + 0.2 * Math.sin(t * 14) : 0.3) : undefined,
          aR: wave > 0 ? lerp(0.3, 1.2 + 0.25 * Math.sin(t * 14), wave) : undefined,
          emote: done ? (c.k === "res" ? "heart" : c.k === "clawd" ? "spark" : undefined) : undefined, emoteK: seg(t, tb(i) + 0.5, tb(i) + 0.75),
        });
      });
      flowers(S, t);
    });
    spot(S, sh(WX(S, cx)), C.muted, z / 1.3);
    rain(S, t, GB - 0.2, 36);
    footlights(S, t);
    audience(S, t, 0.7);
  }

  // =================================================================================================
  // B(214) · Encore: the hero rides the pump handle down on every beat (pumpH); the meter inflates a third per beat
  // (easeOut over the first third of each beat) into a balloon, trembles and the camera shakes (3) once it's full;
  // the researcher covers their ears (sweat 146.3–146.6). POP at B(217): shake 26 → 0 over 0.45 s, flash, the burst,
  // tatters, confetti; the hero is blown off (0.45 s arc), lands (elasticOut 0.4), mood takes at +0.5 and +0.62; the
  // researcher's hair stands up (fades 0.3–0.9) and their arms go up in relief (+0.35 … +0.55); the sign flutters down.
  // =================================================================================================
  const TP = B(217);
  function encore(t, lt, dur, S) {
    const bp = bpOf(t), n = Math.floor(bp - 214), f = frac(bp), sc = SC(S);
    const inf = t >= TP ? 1 : clamp((Math.max(0, n) + easeOut(clamp(f * 3))) / 3);
    const popped = t >= TP, age = t - TP;
    const [sx, sy] = popped ? shakeXY(t, 26 * (1 - seg(age, 0, 0.45))) : inf > 0.95 ? shakeXY(t, 3) : [0, 0];
    const cyy = 640 - 50 * inf * (popped ? 1 - seg(age, 0, 0.6) : 1);
    const MX = 1330, PX = 1010, PS = 1.05;
    const sh = cam(S, [1030, cyy, 1.28 + 0.08 * inf], [1030, 640, 1.28], () => {
      flowers(S, t);
      // the researcher at their x 640: ears covered, then (after the pop) bouncing, arms up in relief
      const R = LINE[3], relief = seg(t, TP + 0.35, TP + 0.55);
      const rm = popped ? { ...move("bounce", t), dx: 0, sq: 0.3 * (1 - elasticOut(age / 0.5)) } : { ...IDLE, dy: -Math.abs(Math.sin(bp * Math.PI)) * 0.3, sq: 0.05 * pulse(t) };
      const aR0 = popped ? lerp(1.3, 1.25 - 0.3 * Math.sin(t * 12), relief) : null, aL0 = popped ? lerp(1.3, 1.25 + 0.3 * Math.sin(t * 12), relief) : null;
      const rh = who(S, R, WX(S, 640), t, { m: { ...rm, dy: rm.dy * 0.8 }, aL: popped && relief > 0 ? aL0 : undefined, aR: popped && relief > 0 ? aR0 : undefined,
        hair: popped ? 1 - seg(age, 0.3, 0.9) : 0.3 * inf, emote: popped ? undefined : "sweat", emoteK: seg(t, 146.3, 146.6) });
      if (rh && !(popped && relief > 0)) { D.fill(rh.left - 2, rh.top + 1, 2, rh.height * 0.5, C.ink); D.fill(rh.right, rh.top + 1, 2, rh.height * 0.5, C.ink); }   // hands over the ears
      // the pump (their pumpProp at 1010, ×1.05): base, barrel, rod, handle; the hose runs along the floor to the meter
      const h = popped ? 0.15 : pumpH(t), ps = PS * sc, px = WX(S, PX), mx = WX(S, MX), rod = 150 * h;
      D.path([[px + 30 * ps, S.floor - 12 * ps], [mx - 55 * sc, S.floor - 12 * ps], [mx - 55 * sc, WY(S, GY - 88)]], C.ink, 1.25);
      D.rect(px - 70 * ps, S.floor - 18 * ps, 140 * ps, 18 * ps, C.ink, 1.25);
      D.rect(px - 32 * ps, S.floor - 240 * ps, 64 * ps, 222 * ps, C.ink, 1.25);
      D.vl(px, S.floor - (240 + rod) * ps, S.floor - 240 * ps, C.ink, 2);
      D.fill(px - 60 * ps, S.floor - (270 + rod) * ps, 120 * ps, 26 * ps, C.ink);
      const hero = LINE[4], hs = S.u * 1.6 * 13 / 17;
      if (!popped) {
        const hop = Math.sin(f * Math.PI) * (f < 0.78 ? 1 : 0), foot = S.floor - (270 + 150 * h) * ps - hop * 40 * sc;
        const hh = stand(S, px, hs, { col: C.pink, dy: S.floor - foot, sq: 0.25 * pulse(t, 9) - 0.1 * hop });
        D.sq(hh.left - 2, hh.top + hs * 0.2 - 0.3 * hop * hs, Math.max(3, hs * 0.25), C.pink); D.sq(hh.right + 2, hh.top + hs * 0.2 - 0.3 * hop * hs, Math.max(3, hs * 0.25), C.pink);   // hands on the handle
      } else {
        // blown off the pump: back 170 and down in a 0.45 s arc, lands, looks over, grins
        const a = seg(age, 0, 0.45), x = WX(S, lerp(PX, PX - 170, easeOut(a))), y = WY(S, lerp(GY - 290 * PS, GY, a) - Math.sin(a * Math.PI) * 170);
        const md = mood(t, [[TP, "x"], [TP + 0.5, "look"], [TP + 0.62, "happy", "heart"]]), e = t - (TP + 0.62);
        const land = a >= 1 ? 0.3 * (1 - elasticOut((age - 0.45) / 0.4)) : 0;
        const hh = stand(S, x, hs, { col: C.pink, dy: S.floor - y, sq: land + md.take });
        const hsz = Math.max(3, hs * 0.25), up = a >= 1 ? 1.25 : 1.4;
        D.sq(hh.left - hsz * 0.7, hh.bottom - hs * 0.55 - (up - 0.2) / 1.2 * hs * 0.6, hsz, C.pink); D.sq(hh.right + hsz * 0.7, hh.bottom - hs * 0.55 - (up - 0.2) / 1.2 * hs * 0.6, hsz, C.pink);
        const ek = e > 0 ? seg(e, 0.05, 0.3) * (1 - seg(e, 1.4, 1.7)) : 0;
        if (ek > 0.01) D.sq(hh.right + 2, hh.top - 4 - 4 * ek, Math.max(3, hs * 0.45) * backOut(ek), C.pink);
      }
      // the meter as a balloon (their balloonMeter at 1330, ×0.95): stand, stem, the swelling glass, the sign above
      const ms = 0.95 * sc;
      D.rect(mx - 110 * ms, S.floor - 30 * ms, 220 * ms, 30 * ms, C.ink, 1.25);
      D.fill(mx - 12 * ms, S.floor - 80 * ms, 24 * ms, 55 * ms, C.ink);
      if (!popped) {
        const trem = inf > 0.95 ? Math.sin(t * 70) * 0.03 : 0;
        const bw = 76 * (1 + 4.7 * inf) * (1 + trem) * ms, bh = 440 * (1 + 0.12 * inf) * (1 - trem) * ms, bot = S.floor - 80 * ms, top = bot - bh;
        D.rect(mx - bw / 2, top, bw, bh, C.ink, 1.25);
        D.fill(mx - bw / 2 + 2, top + 2, bw - 4, bh - 4, C.pink, 0.6);
        if (inf > 0.6) for (let k = -1; k <= 1; k++) D.vl(mx + k * bw * 0.22, top - 4 - 3 * Math.abs(k === 0 ? 1 : 0.6), top - 1, C.ink, 1);   // strain marks
        const sy0 = top - 55 * ms;
        D.rect(mx - 120 * ms, top - 90 * ms, 240 * ms, 70 * ms, C.ink, 1.25);
        D.text("99.9%", mx, sy0 + 4, C.ink, 10, "center");
      } else {
        D.fill(mx - 22 * ms, S.floor - 105 * ms, 44 * ms, 25 * ms, C.pink);  // what's left: a limp scrap
        const cyb = GY - 380, bx = mx, by = WY(S, cyb), top = TOP(S), bot = S.floor - 2;
        const clampBox = (rx, ry) => { const t0 = Math.max(top, by - ry), b0 = Math.min(bot, by + ry); return rr(bx - rx, t0, 2 * rx, b0 - t0); };
        if (age < 0.22) { const r = (260 + 900 * easeOut(age / 0.22)) * sc; D.corners(clampBox(r, r * 0.6), 0, C.pink, 2, 14); }   // the burst (their star)
        if (age < 0.45) { const k = easeOut(age / 0.45); D.alpha(1 - age / 0.45, () => D.box(clampBox((300 + 1300 * k) * sc, (260 + 1100 * k) * sc), 0, C.muted, 1)); }   // the glow
        for (let i = 0; i < 9; i++) {                                           // rubber tatters
          const an = hash(i + 400) * 2 * Math.PI, v = 700 + hash(i + 401) * 600;
          const x = bx + Math.cos(an) * v * age * sc, y = by + (Math.sin(an) * v * age + 900 * age * age) * sc;
          if (BAND(S, y)) D.fill(x - 3, y - 2, 6, 4, C.pink);
        }
        burst(S, MX, cyb, age, 40, 1500, -Math.PI / 2, 2 * Math.PI);
        // the sign flips up and flutters down (1.4 s)
        const sa = seg(age, 0, 1.4), sgx = WX(S, MX + 160 * sa) + Math.sin(age * 5) * 60 * sa * sc, sgy = Math.max(top + 12, WY(S, lerp(GY - 700, GY - 20, easeIn(sa)) - Math.sin(sa * Math.PI) * 260));
        D.rect(sgx - 114 * ms, sgy - 35 * ms, 228 * ms, 70 * ms, C.ink, 1.25);
        D.text("99.9%", sgx, sgy + 4, C.ink, 10, "center");
      }
    }, sx, sy);
    spot(S, sh(WX(S, MX)), popped ? C.muted : C.pink, 1.0625); spot(S, sh(WX(S, 640)), C.muted, 1.0625);
    if (popped) {
      const k = 0.8 * (1 - seg(age, 0, 0.12));                                  // their flash, over the stage band
      if (k > 0.01) D.fill(0, TOP(S), S.W, S.floor - 2 - TOP(S), C.bg, k);
      rain(S, t, TP + 0.15, 40);
    }
    footlights(S, t);
    audience(S, t, popped ? 0.9 : 0.1 + 0.2 * inf);
  }

  // =================================================================================================
  // B(218) · Finale dance: until B(220) a hop ripples down the line (move 'hop', 0.14 beat apart); the confetti
  // cannons fire at B(220) (recoil e^−8t, streamers grow over 0.5 s); B(220)–B(221) everyone raises the roof;
  // B(221)–B(221.5) they jump (squash for the first 15 %, stretch in the air); B(221.5) ta-da (elasticOut 0.45 s,
  // spark 0.25 s). The camera bumps on every beat (pulse k 5) and pushes in slowly; the spots sweep.
  // =================================================================================================
  function finale(t, lt, dur, S) {
    const bp = bpOf(t), bounce = pulse(t, 5), CF = B(220), sc = SC(S);
    const sh = cam(S, [960, 716 - bounce * 6, 1.27 + 0.025 * bounce + 0.03 * ease(lt / dur)], [960, 716, 1.27], () => {
      for (const sd of [-1, 1]) {                                              // the cannons in the wings
        const cx = sd < 0 ? 250 : 1670, kick = t > CF ? Math.exp(-(t - CF) * 8) : 0, x = WX(S, cx - sd * kick * 20);
        D.rect(x - 34 * sc, S.floor - 140 * sc, 68 * sc, 140 * sc, C.ink, 1.25);
        D.fill(x - 34 * sc, S.floor - 140 * sc, 68 * sc, 14 * sc, C.ink);
        if (t > CF) {
          const age = t - CF, len = clamp(age / 0.5), cols = CONF();
          for (let k = 0; k < 4; k++) {                                        // streamers: up, across, down (right angles)
            const ang = -Math.PI / 2 - sd * (0.55 + k * 0.12), v = 900 + k * 110, pt = u => { const d = 1 - Math.exp(-u * 2.5); return [cx + sd * 40 + Math.cos(ang) * v * d * 0.9, 800 + Math.sin(ang) * v * d * 0.9 + 400 * u * u]; };
            const u1 = len * 1.3; let peak = 800; for (let q = 0; q <= 10; q++) peak = Math.min(peak, pt(q / 10 * u1)[1]);
            const [ex, ey] = pt(u1), x0 = WX(S, cx + sd * 40), yb = Math.min(S.floor - 2, WY(S, 800)), yp = Math.max(TOP(S), WY(S, peak)), ye = Math.min(S.floor - 2, WY(S, ey));
            D.path([[x0, yb], [x0, yp], [WX(S, ex), yp], [WX(S, ex), ye]], cols[k], 2);
          }
          burst(S, cx + sd * 60, 780, age, 22, 1200, -Math.PI / 2 - sd * 0.7, 1.2);
        }
      }
      flowers(S, t);
      LINE.forEach((c, i) => {
        let m, aL, aR;
        if (bp < 220) { m = { ...move("hop", t - i * BEAT * 0.14), dx: 0 }; }
        else if (bp < 221) { m = { ...move("roof", t), dx: 0 }; aL = aR = 1.25 + 0.3 * Math.sin(bp * 2 * Math.PI); }
        else if (bp < 221.5) { const j = seg(bp, 221, 221.5); m = { ...IDLE, dy: -Math.sin(j * Math.PI) * 6, sq: j < 0.15 ? 0.2 : -0.1 }; aL = aR = 1.35; }
        else { const age = t - B(221.5); m = { ...IDLE, sq: 0.3 * (1 - elasticOut(age / 0.45)) }; aL = aR = 1.3; }
        const ta = bp >= 221.5;
        who(S, c, WX(S, c.x), t, { m, aL, aR: c.k === "shog" && aR == null ? 1.2 + 0.25 * Math.sin(t * 14) : aR, emote: ta ? "spark" : undefined, emoteK: seg(t, B(221.5), B(221.5) + 0.25) });
      });
    }, 0, 0);
    const sw = Math.sin(t * 2.4) * 520;                                        // the spots sweep
    spot(S, sh(WX(S, 960 + sw)), C.muted); spot(S, sh(WX(S, 960 - sw)), C.pink);
    rain(S, t, 148.5, 50);
    footlights(S, t);
    audience(S, t, 1);
  }

  // =================================================================================================
  // B(222) · The house curtain drops (easeIn 0.42 s) and lands with a thump: it bounces (|sin 9t|·26·e^−6t), the
  // camera shakes (14·e^−7t), dust puffs off the hem. The title is painted on it: "I'M UPPING MY" pops at
  // B(222) + 0.7 … 1.0, "P(DOOM)" at + 0.95 … 1.3 (backOut). The hero peeks through the split 153.55–155.0 (wink
  // 154.1–154.35, waving), the house quiets 154–155.5, and everything fades back to paper 155.0–156.35.
  // =================================================================================================
  const TD = B(222);
  function curtainFall(t, lt, dur, S) {
    const a = seg(t, TD, TD + 0.42), land = t - (TD + 0.42);
    let hemY = lerp(-80, 1010, easeIn(a));
    if (land > 0) hemY = 1010 - Math.abs(Math.sin(land * 9)) * 26 * Math.exp(-land * 6);
    const [sx, sy] = land > 0 ? shakeXY(t, 14 * Math.exp(-land * 7)) : [0, 0];
    const fade = 1 - ease(seg(t, 155.0, 156.35));                              // their flash to paper
    if (fade <= 0.001) return;
    D.alpha(fade, () => {
      const L = S.main.left, Wd = S.main.right - L, top = TOP(S);
      const CY = y => lerp(top, S.floor, (y + 80) / 1090), CXo = x => L + (x + 120) / 2160 * Wd, hs = Wd / 2160;   // their curtain frame → ours
      cam(S, [960, 610, 1.12 + 0.05 * ease(seg(t, TD + 0.5, 156.6))], [960, 610, 1.12], () => {
        if (hemY < 1000) LINE.forEach(c => who(S, c, WX(S, c.x), t, { m: { ...IDLE, dy: -Math.abs(Math.sin(bpOf(t) * Math.PI)) * 0.3 }, aL: 1.3, aR: 1.3 }));   // holding the ta-da until covered
        if (hemY < 1000) flowers(S, t);
        // the hero's peek through the split
        const pk = ease(seg(t, 153.55, 153.85)) * (1 - ease(seg(t, 154.75, 155.0))), split = 175 * pk * hs;
        if (pk > 0.01) {
          const wave = Math.sin((t - 153.6) * 16), s = S.u * 1.6 * 20 / 17, wink = t > 154.1 && t < 154.35 ? 0.1 * Math.sin(seg(t, 154.1, 154.35) * Math.PI) : 0;
          const hh = stand(S, CXo(960) + (-30 + 80 * pk) * hs, s, { col: C.pink, sq: wink });
          const hz = Math.max(3, s * 0.25), aR = 1.1 + 0.45 * wave;
          D.sq(hh.right + hz * 0.7, hh.bottom - s * 0.55 - clamp((aR - 0.2) / 1.2) * s * 0.6, hz, C.pink);
        }
        // the curtain: two halves meeting in the middle, the inner edges pushed apart below 690 by the split (in steps)
        const cx = CXo(960), hem = CY(hemY), sy0 = CY(690), sy1 = CY(1010), cols = C;
        for (const sd of [-1, 1]) {
          const outer = sd < 0 ? L - 4 : S.main.right + 4, steps = 2;
          const fillTo = (y0, y1, edge) => { if (y1 <= y0) return; const a0 = Math.min(edge, outer), a1 = Math.max(edge, outer); D.fill(a0, y0, a1 - a0, y1 - y0, cols.ink); };
          fillTo(top, Math.min(hem, sy0), cx);
          for (let q = 0; q < steps; q++) {
            const y0 = lerp(sy0, sy1, q / steps), y1 = Math.min(hem, lerp(sy0, sy1, (q + 1) / steps));
            const bump = split > 0 ? Math.sin(clamp((q + 0.5) / steps) * Math.PI * 0.5) * split : 0;
            if (y0 < hem) fillTo(y0, y1, cx + sd * bump);
          }
          for (let fo = 1; fo < 7; fo++) { const fx = lerp(cx, outer, fo / 7); if (hem - 6 > CY(40)) D.vl(fx, CY(40), hem - 6, cols.muted, 1); }   // folds
          if (hem > top + 4) D.hl(cx + sd * split * 0.2, outer, hem - 3, C.pink, 2);                     // the fringe
        }
        if (hem > top + 4 && split < 0.5) D.vl(cx, top, hem, C.bg, 1);                                  // the seam
        // the title painted on it, popping in (their letter pop: backOut(seg × 1.5))
        if (land > 0) {
          const bandH = S.floor - top, k1 = backOut(seg(t, TD + 0.7, TD + 1.0) * 1.5), k2 = backOut(seg(t, TD + 0.95, TD + 1.3) * 1.5);
          const s1 = Math.max(9, 96 / 1090 * bandH * 0.8), s2 = Math.max(18, 240 / 1090 * bandH * 0.8);
          if (k1 > 0.01) D.text("I'M UPPING MY", cx, CY(300) + s1 * k1 * 0.35, C.pink, s1 * k1, "center");
          if (k2 > 0.01) D.text("P(DOOM)", cx, CY(480) + s2 * k2 * 0.35, C.bg, s2 * k2, "center");
          for (let k = 0; k < 8; k++) {                                        // dust off the hem as it lands
            const age = land * 0.8 - hash(k) * 0.05; if (age < 0 || age > 0.5) continue;
            const dir = k % 2 ? 1 : -1, x = CXo(140 + k * 235);
            for (let j = 0; j < 3; j++) { const s = (18 + j * 8) * (0.4 + easeOut(age / 0.5)) * hs; D.alpha(1 - age / 0.5, () => D.osq(x - dir * (20 + j * 34) * easeOut(age / 0.4) * hs, hem - s / 2 - 2 - j * 2, s, C.muted, 1)); }
          }
        }
      }, sx, sy);
      footlights(S, t);
      audience(S, t, 0.8 * (1 - seg(t, 154, 155.5)));
    });
  }

  chapter("finale", 140.5, 156.6 + 1, [[140.5, runOn], [B(210), bows], [B(214), encore], [B(218), finale], [TD, curtainFall]]);
})();
