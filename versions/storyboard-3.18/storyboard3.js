// Music visuals, "Storyboard 3.5" working version (?viz=storyboard3), branched from 3.1 and identical to it except:
//   · three scenes are contained in the stage (drawn only above the name): the "optimizing, accelerating" ride
//     (45.0–48.6), the paperclips (plop, flood, killswitch: 95.4–99.755) and the transformers tower (109.4–113.5);
//     everything else keeps 3.1's freedom to spill over the page (Mannat, 2026-09-24)
//   · the basilisk's white neck segments carry scale ticks
// Music visuals, "Storyboard 3.1" (?viz=storyboard3): Storyboard 2 (storyboard.js, kept unchanged) with Drumline 2.3's
// highlights running on top (music.js draws them on its own canvas when ?viz=storyboard3: the kick chase, snare corners,
// chorus strobes, one box per sung syllable and the key-word moments, on our measured audio; its shutters are left to the
// storyboard), and the basilisk-like big black shapes drawn as white boxes with graphite outlines (the basilisk, the CHOMP
// jaws, the wipes). Mannat, 2026-09-24. Everything below is Storyboard 2's engine; chapters are storyboard3/c*.js.
// Music visuals, "Storyboard" variant (?viz=storyboard): made the way the P(doom) video was made
// (github.com/JohnHeibel/PDoomVideo, ~/Developer/pdoom-ref), translated into this site's shapes.
//   timing  · their method, not ours. One hand-set grid (88 BPM from 0.21 s: B(n) = 0.21 + n × 0.682), their lyric
//             line times (read off the source video's subtitles, to 0.1 s), and hand-placed moment times on those
//             lines and beats. No onset data. Only the 16 ms display-latency lead is added (they rendered offline).
//   craft   · their method: a storyboard with one shot per lyric line where something happens (docs/STORYBOARD.md),
//             motivated transitions, chapter-break wipes, a recurring P(doom) meter that climbs every chorus,
//             beat pulses, anticipation and overshoot, camera pushes and shakes, a light hand-drawn boil.
//   shapes  · ours: boxes around the page's own elements, corner brackets, dotted guides, straight horizontal and
//             vertical lines, filled squares. Graphite, pink, blue, muted. No angled lines, rotation or figures.
// Guide for writing shots: docs/STORYBOARD_GUIDE.md. Shots live in storyboard/c*.js. Loaded by music.js.
(() => {
  const BASE = new URL(".", document.currentScript.src);
  const video = document.getElementById("mini-video");
  if (!video) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- time (their core.js) ----------
  const BPM = 88, BEAT = 60 / BPM, OFF = 0.21, DUR = 156.6, EARLY = 0.016;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const frac = x => x - Math.floor(x);
  const lerp = (a, b, k) => a + (b - a) * k;
  const B = n => OFF + n * BEAT;                                    // song time of beat n
  const bpOf = t => (t - OFF) / BEAT;
  const beatN = t => Math.floor(bpOf(t));
  const pulse = (t, k = 6) => Math.exp(-frac(bpOf(t)) * k);          // 1 on each beat, decays
  const pulse2 = (t, k = 6) => Math.exp(-frac(bpOf(t) * 2) * k);     // same on eighths
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  // easings exactly as their core.js (cubic in/out, backOut overshoot 1.9)
  const ease = k => (k = clamp(k), k * k * (3 - 2 * k));
  const easeOut = k => 1 - (1 - clamp(k)) ** 3;
  const easeIn = k => clamp(k) ** 3;
  const backOut = k => { k = clamp(k); const s = 1.9; return 1 + (s + 1) * (k - 1) ** 3 + s * (k - 1) ** 2; };
  const elasticOut = k => (k = clamp(k), k === 0 || k === 1 ? k : 2 ** (-10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI / 3)) + 1);
  const wob = (t, f = 1, ph = 0) => Math.sin((t * f + ph) * 2 * Math.PI);
  const bell = (t, a, b) => Math.sin(clamp((t - a) / (b - a)) * Math.PI);          // their c05 helper
  const pumpH = t => { const f = frac(bpOf(t)); return f < 0.78 ? ease(f / 0.78) : 1 - easeIn((f - 0.78) / 0.22); };   // props.js: down-stroke lands on the beat
  // their clawd.js move(): beat-synced pose offsets. We use dy (up, in body units: negative = up), sq (squash), dx
  // (sideways, body units) and sx (horizontal scale, for 'spin'); rotation and arms have no equivalent in our shapes.
  function move(style, t, seed = 0) {
    const bp = bpOf(t), bi = Math.floor(bp), bf = bp - bi, hit = Math.max(0, 1 - bf * 3.5), s1 = Math.sin(bp * Math.PI), ab = Math.abs(s1), TAU = 2 * Math.PI;
    const o = { dy: 0, sq: 0, dx: 0, sx: 1 };
    if (style === "mix") style = ["bounce", "roof", "sway", "spin", "hop", "wave"][(Math.floor(bp / 8) + seed) % 6];
    switch (style) {
      case "bounce": o.dy = -ab * 1.6; o.sq = hit * 0.12; break;
      case "hop": o.dy = -ab * 4; o.sq = hit * 0.18; break;
      case "roof": o.dy = -ab * 1.2; o.sq = hit * 0.1; break;
      case "sway": o.dx = s1 * 3; o.sq = hit * 0.08; break;
      case "spin": { const ph = ((bi % 4) + 4) % 4 === 3 ? bf : 0; o.sx = Math.cos(ph * TAU); o.dy = -Math.sin(ph * Math.PI) * 3 - ab; o.sq = hit * 0.1; break; }
      case "wave": o.dy = -ab; o.sq = hit * 0.08; break;
      case "walk": o.dy = -ab * 0.6; break;
      case "run": o.dy = -Math.abs(Math.sin(bp * TAU)); break;
      case "idle": o.dy = -ab * 0.5; o.sq = hit * 0.05; break;
      case "stomp": o.dy = -Math.max(0, Math.sin(bp * TAU)) * 1.4; o.sq = hit * 0.2; break;
      case "shimmy": o.dx = Math.sin(bp * TAU * 2) * 0.6; o.dy = -ab * 0.5; break;
    }
    return o;
  }
  // their mood(): around each change a squash-stretch "take" (we have no eyes; the take is the part we can show)
  function mood(t, keys) {
    let i = 0; while (i + 1 < keys.length && t >= keys[i + 1][0]) i++;
    const [t0, state] = keys[i], age = t - t0; let take = 0;
    if (i > 0 && age < 0.16) take = -0.14 * Math.sin(age / 0.16 * Math.PI);
    if (i > 0 && age >= 0.16 && age < 0.4) take = 0.1 * Math.sin((age - 0.16) / 0.24 * Math.PI) * (1 - (age - 0.16) / 0.24);
    return { state, take, age };
  }
  const kf = (t, keys, fn = ease) => {                              // keyframes [[t, v], ...], v a number or array
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
      const [t0, a] = keys[i - 1], [t1, b] = keys[i], k = fn((t - t0) / (t1 - t0));
      return Array.isArray(a) ? a.map((v, j) => lerp(v, b[j], k)) : lerp(a, b, k);
    }
    return keys[keys.length - 1][1];
  };
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

  // ---------- canvas ----------
  const fx = document.createElement("canvas");
  fx.setAttribute("aria-hidden", "true");
  fx.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
  document.body.append(fx);
  const ctx = fx.getContext("2d");
  const ink = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const C = {};                                                     // colours, read once per frame

  // boil: outlines shift by up to BOIL px, reseeded 12 times a second (their hand-drawn "boil"), still a pure function of t
  const BOIL = 0.8;
  let boilSeed = 0, boilN = 0;
  const jit = () => (hash(boilSeed + ++boilN * 13.7) - 0.5) * 2 * BOIL;
  const px = v => Math.round(v) + 0.5;

  // ---------- drawing (our vocabulary only) ----------
  const D = {
    box(r, pad = 6, col = C.ink, lw = 1.25) {
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      ctx.strokeRect(px(r.left - pad + jit()), px(r.top - pad + jit()), Math.round(r.width + 2 * pad), Math.round(r.height + 2 * pad));
    },
    rect(x, y, w, h, col = C.ink, lw = 1.25) { D.box({ left: x, top: y, width: w, height: h }, 0, col, lw); },
    corners(r, pad = 8, col = C.ink, lw = 1.5, arm = 12) {
      const x = px(r.left - pad + jit()), y = px(r.top - pad + jit()), w = Math.round(r.width + 2 * pad), h = Math.round(r.height + 2 * pad), s = Math.min(arm, w / 3, h / 3);
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
      for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.moveTo(cx + dx * s, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * s); }
      ctx.stroke();
    },
    guides(r, col = C.ink) {
      ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath();
      ctx.moveTo(0, px(r.top - 9)); ctx.lineTo(innerWidth, px(r.top - 9)); ctx.moveTo(px(r.left - 9), 0); ctx.lineTo(px(r.left - 9), innerHeight);
      ctx.stroke(); ctx.setLineDash([]);
    },
    hl(x0, x1, y, col = C.ink, lw = 1.25, dash) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
      const j = jit(); ctx.beginPath(); ctx.moveTo(Math.round(x0), px(y + j)); ctx.lineTo(Math.round(x1), px(y + j)); ctx.stroke(); ctx.setLineDash([]);
    },
    vl(x, y0, y1, col = C.ink, lw = 1.25, dash) {
      ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
      const j = jit(); ctx.beginPath(); ctx.moveTo(px(x + j), Math.round(y0)); ctx.lineTo(px(x + j), Math.round(y1)); ctx.stroke(); ctx.setLineDash([]);
    },
    path(pts, col = C.ink, lw = 1.25, dash) {                       // a polyline; every segment must be horizontal or vertical
      ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(px(x), px(y)) : ctx.moveTo(px(x), px(y))); ctx.stroke(); ctx.setLineDash([]);
    },
    sq(cx, cy, s, col = C.pink) { ctx.fillStyle = col; ctx.fillRect(Math.round(cx - s / 2 + jit() * 0.5), Math.round(cy - s / 2 + jit() * 0.5), Math.round(s), Math.round(s)); },
    osq(cx, cy, s, col = C.ink, lw = 1.25) { D.rect(cx - s / 2, cy - s / 2, s, s, col, lw); },
    fill(x, y, w, h, col = C.ink, a = 1) { const g = ctx.globalAlpha; ctx.globalAlpha = g * clamp(a); ctx.fillStyle = col; ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(w), Math.ceil(h)); ctx.globalAlpha = g; },
    text(s, x, y, col = C.muted, size = 11, align = "left") {
      ctx.fillStyle = col; ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`; ctx.textAlign = align; ctx.textBaseline = "alphabetic";
      ctx.fillText(s, Math.round(x), Math.round(y)); ctx.textAlign = "left";
    },
    alpha(a, fn) { const g = ctx.globalAlpha; ctx.globalAlpha = g * clamp(a); fn(); ctx.globalAlpha = g; },
    // camera: push/pull about a point (their camBegin/camEnd); lines keep their weight
    cam(cx, cy, zoom, fn, dx = 0, dy = 0) { ctx.save(); ctx.translate(cx + dx, cy + dy); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy); fn(); ctx.restore(); },
    // shutters over a rect: k = 1 open, 0 shut (whole pixels, no seam)
    shutter(r, k, col = C.ink, vertical = false) {
      const x = Math.floor(r.left), y = Math.floor(r.top), w = Math.ceil(r.left + r.width) - x, h = Math.ceil(r.top + r.height) - y;
      ctx.fillStyle = col;
      if (!vertical) { const s = k <= 0 ? Math.ceil(h / 2) + 1 : Math.round(h / 2 * (1 - k)); ctx.fillRect(x, y, w, s); ctx.fillRect(x, y + h - s, w, s); }
      else { const s = k <= 0 ? Math.ceil(w / 2) + 1 : Math.round(w / 2 * (1 - k)); ctx.fillRect(x, y, s, h); ctx.fillRect(x + w - s, y, s, h); }
    },
  };
  const shake = (t, amt) => { const f = Math.floor(t * 24); return [(hash(f * 1.7) - 0.5) * 2 * amt, (hash(f * 2.3 + 9) - 0.5) * 2 * amt]; };   // their shakeXY (24 fps)

  // ---------- the stage: the page's own elements, found fresh each frame ----------
  const R = el => el && el.getBoundingClientRect();
  const vis = r => r && r.height && r.bottom > 0 && r.top < innerHeight;
  const rr = (l, t, w, h) => ({ left: l, top: t, width: w, height: h, right: l + w, bottom: t + h });
  function stage() {
    const main = R(document.querySelector("main")) || rr(16, 0, innerWidth - 32, innerHeight);
    const name = R(document.querySelector("main h1")) || rr(main.left, 120, Math.min(400, main.width), 40);
    let photos = [...document.querySelectorAll(".roll img")].map(R);
    if (!photos.length) { const h = R(document.querySelector(".head img")); if (h) photos = [0, 1, 2].map(i => rr(h.left + i * h.width / 3, h.top, h.width / 3, h.height)); }
    const strip = photos.length ? rr(photos[0].left, photos[0].top, photos[photos.length - 1].right - photos[0].left, photos[0].height) : null;
    const all = [...document.querySelectorAll("main h1, main h2, main p, main li, .roll img, .head img, .elsewhere a, .strip .back")].map(R).filter(vis).sort((a, b) => a.top - b.top || a.left - b.left);
    const paras = [...document.querySelectorAll("main p")].map(R).filter(vis);
    const items = [...document.querySelectorAll("main li")].map(R).filter(vis);
    const cells = [...document.querySelectorAll(".topbar > a, .topbar > button")].map(R).filter(vis);
    const bar = R(document.querySelector(".topbar"));
    const W = innerWidth, H = innerHeight;
    const h1 = document.querySelector("main h1"); let text = name;
    if (h1 && h1.firstChild) { const g = document.createRange(); g.selectNodeContents(h1); const rs = [...g.getClientRects()]; if (rs.length) text = rs.reduce((u, r) => rr(Math.min(u.left, r.left), Math.min(u.top, r.top), Math.max(u.right, r.right) - Math.min(u.left, r.left), Math.max(u.bottom, r.bottom) - Math.min(u.top, r.top))); }
    const floor = text.top + 2;                                      // the stage floor: the top of the name's letters (things stand on the name)
    const right = Math.min(main.right, W - 16);
    const u = clamp(text.height / 3, 9, 16);                        // unit: the hero square is about 1.5u                         // unit: the hero square's size
    return { main, name, text, photos, strip, all, paras, items, cells, bar, W, H, floor, right, u };
  }

  // ---------- chapters and shots (their timeline.js) ----------
  const CH = [];
  const chapter = (name, a, b, shots) => { CH.push({ name, a, b, shots }); CH.sort((x, y) => x.a - y.a); };
  const WIPES = [1.5, 38.5, 73.0, 109.4], WIPE_TR = 0.3;              // their timeline.js: chapter breaks, ±0.3 s
  // the P(doom) meter (their timeline.js METER / pdoomAt): climbs in pump-sized steps on each beat during the chorus
  // windows, holds in between; shown from a to b + 0.3 (pops in with backOut over 0.4 s, out with ease over 0.3 s)
  const METER = [[23, 35.5, 8, 34], [59, 69.9, 34, 61], [95.4, 105.4, 61, 86], [123.5, 132, 86, 99.9]];
  function pdoomAt(t) {
    let v = 5;
    for (const [a, b, v0, v1] of METER) {
      if (t < a) break;
      const n = Math.max(1, Math.round((b - a) / BEAT)), p = clamp((t - a) / (b - a)) * n;
      v = t >= b ? v1 : lerp(v0, v1, (Math.floor(p) + easeOut(clamp(frac(p) * 4))) / n);
    }
    return v;
  }
  function meter(t, S, o = {}) {
    const win = METER.find(([a, b]) => t >= a && t < b + 0.3), k = o.k ?? (win ? backOut((t - win[0]) / 0.4) * (1 - ease((t - win[1]) / 0.3)) : 1);
    if (k < 0.02) return;
    const h = Math.max(56, S.name.height + 12) * k, w = 10 * k, cx = S.right - 5, y = S.name.top + S.name.height / 2 - h / 2;
    const x = cx - w / 2 + (t > B(183) && t < 137.4 ? Math.sin(t * 90) * 1.5 : 0);   // their c08: the tube rattles after the third crack
    const v = pdoomAt(t) / 100, lv = Math.round(v * (h - 4));
    D.rect(x, y, w, h, C.ink, 1.25);
    // (the cracks at B(181)–B(184) are drawn by chapter 8's red-alert shot, with their chips and band-aids)
    D.fill(x + 2, y + h - 2 - lv, w - 4, lv, C.pink);
    D.text(`${Math.floor(pdoomAt(t))}%`, x + w, y - 8, C.muted, 10, "right");
  }
  // their brush wipe, in our shapes: five graphite bands across the strip sweep in (easeOut, staggered) to cover by b,
  // then drag off (ease) after it
  function wipe(t, b, S) {
    const r = S.strip || rr(S.main.left, S.name.top - 12, S.main.width, S.name.height + 24);
    const p = (t - (b - WIPE_TR)) / (2 * WIPE_TR), n = 5, bh = r.height / n;
    [0, 0.14, 0.06, 0.18, 0.1].forEach((d, i) => {
      const q = p < 0.5 ? easeOut(clamp((p * 2 - d) / (1 - d))) : ease(clamp(((p - 0.5) * 2 - d) / (1 - d)));
      const x0 = p < 0.5 ? r.left : lerp(r.left, r.left + r.width, q), x1 = p < 0.5 ? lerp(r.left, r.left + r.width, q) : r.left + r.width;
      if (x1 - x0 > 0.5) { D.fill(x0, r.top + i * bh, x1 - x0, bh + 1, C.bg); D.rect(x0, r.top + i * bh, x1 - x0, bh + 1, C.ink, 1.5); }   // 3.1: white boxes, graphite outline
    });
  }

  // 3.5: scenes kept above the name (Mannat: the road, the paperclips rising twice and the tower were in the middle of the page)
  const CONTAIN = [[45.0, 48.6], [95.4, 99.755], [109.4, 113.5]];
  // 3.15: the SLAM-to-darkness (133.85–137.4) and the house curtain (151.57–end) end 12 px above the name, so they don't
  // run into the box drawn around it (Mannat: the curtain "looks like it's dipping into the box for the name", at 2:14 and 2:35)
  const ABOVE = [[133.85, 137.4], [151.57, 157.6]];

  // ---------- frame ----------
  // 3.8: a real link can sit over something drawn on the canvas (the canvas takes no clicks). A shot calls
  // SB.link(rect, href, label) each frame it wants it; otherwise it hides. Hidden too when the visuals are switched off.
  const hot = document.createElement("a");
  hot.id = "sb-link"; hot.target = "_blank"; hot.rel = "noopener";
  hot.style.cssText = "position:fixed;z-index:6;display:none;cursor:pointer;background:transparent";
  document.body.append(hot);
  let want = null;
  function draw() {
    want = null; drawFrame();
    if (want && document.documentElement.dataset.visuals !== "off") {
      const [r, href, label] = want;
      Object.assign(hot.style, { display: "block", left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px" });
      if (hot.href !== href) hot.href = href; hot.setAttribute("aria-label", label); hot.title = label;
    } else hot.style.display = "none";
  }
  // 3.16: on the Reading and Writing pages (no scenes), the Quirrell basilisk slides in from the right edge as a large side
  // view at the basilisk BOOM, roars, says its two lines ("Mr. Potter." links to HPMOR), sways for a while, then slides out
  // (Mannat: "on the reading and writing pages we should have the basilisk come out of the right and be a large side
  // basilisk which sticks around for a bit"). Horizontal body, head facing left; our shapes only.
  const sidePage = () => /\/(reading|writing)\.html$/.test(location.pathname);
  // 3.17: it rises out of the bottom of the screen instead (Mannat: "have the basilisk pop out of the bottom rather than
  // the side, so much the same basilisk; both words should be around for longer"): the Q5 look, front view, large, in the
  // right margin on desktop (at the right on phones); the lines hold 1.6 s and 2.6 s.
  const SIDE = { rumble: 60.45, boom: B(90), out0: 66.6, out1: 67.2, l1: [B(90) + .03, 63.2, "Salutations."], l2: [63.2, 66.5, "Mr. Potter."] };
  const meas2 = document.createElement("canvas").getContext("2d");
  function sideBasilisk(t) {
    if (t < SIDE.rumble - 0.2 || t > SIDE.out1) return;
    const W = innerWidth, H = innerHeight, main = document.querySelector("main"), mr = main ? main.getBoundingClientRect().right : W * .7;
    const u = clamp(Math.min(W, 1400) / 1400, .55, 1) * 1.9;
    const segH = 20 * u, segW0 = 34 * u, N = 11, headW = 56 * u, headH = 50 * u;
    const cx = W - mr > 220 ? mr + (W - mr) / 2 : W * .72;                          // the right margin's middle, or the right of a phone
    const tall = Math.min(H * .62, N * segH + headH + 40);
    const inK = t < SIDE.boom ? .05 * seg(t, SIDE.rumble, SIDE.boom) : backOut(seg(t, SIDE.boom, SIDE.boom + .35));
    const outK = easeIn(seg(t, SIDE.out0, SIDE.out1)), k = inK * (1 - outK);
    const base = H + 4, a = t - SIDE.boom, roar = a > 0 && a < .7;
    const shake = t < SIDE.boom ? (hash(Math.floor(t * 24)) - .5) * 4 * seg(t, SIDE.rumble, SIDE.boom) : 0;
    const sway = i => Math.sin(t * 2.3 - i * .5) * 7 * u * (a > 0 ? 1 : .3) * (i / N);
    const rise = k * tall, top = base - rise;                                       // the head's bottom edge
    // the neck: white segments stacked from the bottom edge, graphite outline, lapels (the suit), buttons, alternating scale ticks
    const segs = [];
    for (let i = 0; i < N; i++) {
      const y = top + headH * 0 + i * segH, w = segW0 * (0.78 + 0.22 * i / N), x = cx + sway(N - i) + shake - w / 2;
      if (y > H) break;
      segs.push({ x, y, w });
      D.fill(x, y, w, segH + 1, C.bg); D.rect(x, y, w, segH + 1, C.ink, 1.25);
      D.vl(x + w * .22, y, y + segH + 1, C.ink, 1); D.vl(x + w * .78, y, y + segH + 1, C.ink, 1);
      if (i >= 4 && i % 2 === 0) D.fill(x + w / 2 - 2 * u, y + segH / 2 - 2 * u, 4 * u, 4 * u, C.ink);
      if (i % 2) D.hl(x + 1, x + 4 * u, y + segH / 2, C.ink, 1); else D.hl(x + w - 4 * u, x + w - 1, y + segH / 2, C.ink, 1);
    }
    const hx = cx + sway(N) + shake - headW / 2, hy = top - headH, J = roar ? 14 * u * seg(a, .05, .2) : (a > .7 ? Math.abs(Math.sin((a - .7) * 7)) * 4 * u : 0);
    // the head (front view): skull, pink maw, jaw, naga eyes, the stud and the crown on it
    D.fill(hx, hy - J, headW, headH * .68, C.bg); D.rect(hx, hy - J, headW, headH * .68, C.ink, 1.5);
    D.fill(hx + headW * .1, hy + headH * .68 - J, headW * .8, J + 2, C.pink);
    D.fill(hx + headW * .1, hy + headH * .7, headW * .8, headH * .28, C.bg); D.rect(hx + headW * .1, hy + headH * .7, headW * .8, headH * .28, C.ink, 1.5);
    { const es = 11 * u, eh = roar ? es * (.35 + .65 * seg(a, .35, .7)) : es, ey = hy - J + headH * .36;
      for (const ex of [hx + headW * .3, hx + headW * .7]) { D.fill(ex - es / 2, ey - eh / 2, es, eh, C.bg); D.rect(ex - es / 2, ey - eh / 2, es, eh, C.ink, 1.5); D.fill(ex - es * .45, ey - eh * .32, es * .4, eh * .64, C.ink); } }
    const sx = hx + headW / 2, sy = hy - J; D.fill(sx - 8 * u, sy - 6 * u, 16 * u, 6 * u, C.bg); D.rect(sx - 8 * u, sy - 6 * u, 16 * u, 6 * u, C.ink, 1.25);
    D.fill(sx - 10 * u, sy - 10 * u, 20 * u, 4 * u, C.pink); for (const gx of [-10, -2, 6]) D.fill(sx + gx * u, sy - 16 * u, 4 * u, 6 * u, C.pink);
    // the collar and tie down the top segments
    { const ty = top, tx = cx + sway(N - 1) + shake;
      D.fill(tx - 11 * u, ty, 9 * u, 6 * u, C.bg); D.rect(tx - 11 * u, ty, 9 * u, 6 * u, C.ink, 1.25); D.fill(tx + 2 * u, ty, 9 * u, 6 * u, C.bg); D.rect(tx + 2 * u, ty, 9 * u, 6 * u, C.ink, 1.25);
      D.fill(tx - 3 * u, ty, 6 * u, 6 * u, C.ink);
      segs.slice(0, 4).forEach((g, j) => D.fill(g.x + g.w / 2 - (3 + j * .6) * u, Math.max(g.y, ty + 6 * u), (6 + j * 1.2) * u, segH + 1 - (j === 0 ? 6 * u : 0), C.ink));
      const g3 = segs[3]; if (g3) { D.fill(g3.x + g3.w / 2 - 3 * u, g3.y + segH + 1, 6 * u, 3 * u, C.ink); } }
    // the lines, above the crown
    const L = t < SIDE.l2[0] ? SIDE.l1 : SIDE.l2;
    if (t >= L[0] && t < L[1] && k > .5) {
      const pink = L === SIDE.l2, size = Math.round(13 * Math.max(.85, u / 1.9)), pad = 7, n = Math.floor(clamp((t - L[0]) / .38) * L[2].length);
      meas2.font = `${size}px ui-monospace, SFMono-Regular, Menlo, monospace`;
      const w = meas2.measureText(L[2]).width + 2 * pad, bh = size + 2 * pad, x = Math.max(8, Math.min(W - w - 8, sx - w / 2)), y = Math.max((document.querySelector(".topbar")?.getBoundingClientRect().bottom || 0) + 6, sy - 22 * u - bh);
      const fill = pink ? C.pink : C.bg, line = pink ? C.pink : C.ink;
      D.fill(sx - 4, y + bh - 1, 7, 9, fill); D.rect(sx - 4, y + bh - 1, 7, 9, line, 1.5); D.fill(sx - 3, y + bh - 2, 5, 3, fill);
      D.fill(x, y, w, bh, fill); D.rect(x, y, w, bh, line, 1.5);
      D.text(L[2].slice(0, n), x + pad, y + bh / 2 + size * .36, pink ? C.bg : C.ink, size);
      if (pink) want = [rr(x - 2, y - 2, w + 4, bh + 4), "https://hpmor.com/", "Harry Potter and the Methods of Rationality"];
    }
  }
  // 3.18: Fawkes the phoenix, top left on Reading and Writing, while the basilisk is up (Mannat: "can you put a fawkes the
  // phoenix in the top left for reading/writing"). A block bird facing right (toward the basilisk): pink body and head,
  // a three-bar crest, graphite eye and beak, white outlined wings that flap on the eighths, three long tail feathers
  // with square tips. Flies in from the top-left corner after the BOOM, hovers bobbing on the beat, flies back out.
  const FAWKES = { in0: B(90) + .25, in1: B(90) + .85, out0: 66.4, out1: 67.1 };
  function fawkes(t) {
    if (t < FAWKES.in0 || t > FAWKES.out1) return;
    const W = innerWidth, main = document.querySelector("main"), ml = main ? main.getBoundingClientRect().left : 0;
    const bar = document.querySelector(".topbar"), top = bar ? bar.getBoundingClientRect().bottom : 0;
    const wide = ml > 200, u = wide ? clamp(W / 1400, .8, 1) * 2.3 : 1.1;
    const hx = wide ? ml / 2 - 10 * u : W - 70, hy = top + (wide ? 70 * u : 28);            // where it hovers: the left margin on desktop; on a phone, top right of the heading row (the top left is the caption)
    const kin = easeOut(seg(t, FAWKES.in0, FAWKES.in1)), kout = easeIn(seg(t, FAWKES.out0, FAWKES.out1));
    const x = lerp(-80 * u, hx, kin) + lerp(0, -W * .3, kout), y = lerp(top - 60 * u, hy, kin) + lerp(0, -140 * u, kout) - 5 * u * Math.abs(Math.sin(bpOf(t) * Math.PI));
    const up = Math.floor(bpOf(t) * 2) % 2 === 0;                                        // wings up or down, on the eighths
    const bw = 30 * u, bh = 14 * u;
    // tail feathers: three long lines trailing left, a square at each tip
    for (const [dy, len, col] of [[-3, 34, C.pink], [1, 44, C.ink], [5, 30, C.pink]]) { const ty = y + bh / 2 + dy * u, tx = x - len * u; D.hl(tx, x, ty, col, 2); D.fill(tx - 3 * u, ty - 2 * u, 5 * u, 4 * u, col); }
    // the far wing, the body, the near wing
    const wing = (dx, fill) => { const wx = x + 4 * u + dx, wy = up ? y - 16 * u : y + bh - 2 * u, ww = 20 * u, wh = 16 * u; D.fill(wx, wy, ww, wh, fill); D.rect(wx, wy, ww, wh, C.ink, 1.25); D.hl(wx + 2, wx + ww - 2, up ? wy + wh * .55 : wy + wh * .45, C.muted, 1); };
    wing(6 * u, C.bg);
    D.fill(x, y, bw, bh, C.pink); D.rect(x, y, bw, bh, C.ink, 1.25);
    wing(0, C.bg);
    // the head, crest, eye and beak
    const hs = 13 * u, hxx = x + bw - 2 * u, hyy = y - hs * .7;
    D.fill(hxx, hyy, hs, hs, C.pink); D.rect(hxx, hyy, hs, hs, C.ink, 1.25);
    for (const [cx, ch] of [[.15, 6], [.45, 9], [.75, 6]]) D.fill(hxx + hs * cx, hyy - ch * u, 3 * u, ch * u, C.pink);
    D.fill(hxx + hs * .6, hyy + hs * .3, 3 * u, 3 * u, C.ink);
    D.fill(hxx + hs, hyy + hs * .45, 6 * u, 4 * u, C.ink);
  }
  // 3.16: the scenes (the storyboard itself, its meter and wipes) only play on the homepage; every other page keeps
  // just Drumline's highlights (music.js). Decided per frame, so in-place navigation switches it (Mannat)
  const home = () => { const p = location.pathname; return /\/(index\.html)?$/.test(p) && !document.body.classList.contains("page"); };
  function drawFrame() {
    if (!home()) {
      const dpr = Math.min(2, devicePixelRatio || 1);
      if (fx.width !== innerWidth * dpr || fx.height !== innerHeight * dpr) { fx.width = innerWidth * dpr; fx.height = innerHeight * dpr; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight); ctx.globalAlpha = 1;
      if (sidePage() && !calm && document.getElementById("mini")) {
        const t = video.currentTime + (video.paused ? 0 : EARLY);
        Object.assign(C, { ink: ink("--ink"), pink: ink("--link-line"), blue: ink("--accent"), muted: ink("--muted"), rule: ink("--rule"), bg: "#fff" });
        sideBasilisk(t);
        fawkes(t);
      }
      return;
    }
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (fx.width !== W * dpr || fx.height !== H * dpr) { fx.width = W * dpr; fx.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H); ctx.globalAlpha = 1;
    if (calm || !document.getElementById("mini")) return;
    const t = video.currentTime + (video.paused ? 0 : EARLY);
    if (video.paused && t < 0.05) return;
    Object.assign(C, { ink: ink("--ink"), pink: ink("--link-line"), blue: ink("--accent"), muted: ink("--muted"), rule: ink("--rule"), bg: "#fff" });
    boilSeed = Math.floor(t * 12) * 1000; boilN = 0;
    const S = stage();
    const ch = CH.find(c => t >= c.a && t < c.b);
    if (ch) {
      let i = 0; while (i + 1 < ch.shots.length && t >= ch.shots[i + 1][0]) i++;
      const [t0, fn] = ch.shots[i], t1 = i + 1 < ch.shots.length ? ch.shots[i + 1][0] : ch.b;
      if (t >= t0) {
        ctx.save();
        if (CONTAIN.some(([a, b]) => t >= a && t < b)) { const top = S.bar ? S.bar.bottom + 2 : 0; ctx.beginPath(); ctx.rect(0, top, S.W, S.floor + 3 - top); ctx.clip(); }   // 3.14: and below the top bar
        if (ABOVE.some(([a, b]) => t >= a && t < b)) { const top = S.bar ? S.bar.bottom + 2 : 0, bot = S.name.top - 12; ctx.beginPath(); ctx.rect(0, top, S.W, bot - top); ctx.clip(); }   // 3.15: the dark scenes stop above the name's box   // 3.5: these scenes stay in the stage
        try { fn(t, t - t0, t1 - t0, S); } catch (e) { console.error(ch.name, e); }
        ctx.restore(); ctx.globalAlpha = 1;
      }
    }
    if (METER.some(([a, b]) => t >= a && t < b + 0.3) && !SB.noMeter) meter(t, S);
    SB.noMeter = false;
    for (const b of WIPES) if (Math.abs(t - b) < WIPE_TR) wipe(t, b, S);
  }

  // the API chapter files use (see docs/STORYBOARD_GUIDE.md)
  // characters are squares standing on the stage floor (the top of the name). o: dy (up, px), sq (squash; negative
  // stretches), col, outline (true = outlined, not filled), lw
  function stand(S, x, s, o = {}) {
    const w = s * (1 + (o.sq || 0)), h = s * (1 - (o.sq || 0)), y = S.floor - (o.dy || 0) - h;
    if (o.outline) D.rect(x - w / 2, y, w, h, o.col || C.ink, o.lw || 1.25); else D.fill(x - w / 2, y, w, h, o.col || C.pink);
    return { x, y, w, h, top: y, left: x - w / 2, right: x + w / 2, bottom: y + h, width: w, height: h };
  }
  const hop = (t, ph = 0, h = 8) => Math.sin(Math.PI * frac(bpOf(t) + ph)) * h;   // lands on every beat (their move('bounce'))
  const SB = window.__SB = { engineCtx: ctx, link: (r, href, label) => { want = [r, href, label]; }, stand, hop, wob, bell, pumpH, move, mood, shakeXY: shake, BEAT, OFF, DUR, B, bpOf, beatN, pulse, pulse2, seg, ease, easeOut, easeIn, backOut, elasticOut, kf, lerp, clamp, frac, hash, shake, rr, D, C, chapter, meter, pdoomAt, noMeter: false };

  function loop() { draw(); if (!video.paused) requestAnimationFrame(loop); }
  video.addEventListener("play", () => requestAnimationFrame(loop));
  video.addEventListener("seeked", draw);
  video.addEventListener("pause", draw);
  addEventListener("resize", draw);
  addEventListener("scroll", () => { if (video.paused) draw(); }, { passive: true });
  const drumlineAt = window.__musicAt;                               // music.js's Drumline layer, when it runs under us
  window.__musicAt = t => { Object.defineProperty(video, "currentTime", { configurable: true, get: () => t, set: () => {} }); draw(); if (drumlineAt) drumlineAt(t); };

  // chapters, in order (one file each, like their src/ch/)
  const files = ["c0_curtain", "c1_lab", "c2_chorus1", "c3_takeoff", "c4_chorus2", "c5_obsolete", "c6_chorus3", "c7_scale", "c8_chorus4", "c9_finale"];
  let left = files.length;
  for (const f of files) { const s = document.createElement("script"); s.src = new URL(`storyboard3/${f}.js`, BASE); s.async = false; s.onload = s.onerror = () => { if (!--left) draw(); }; document.head.append(s); }
  if (!video.paused) requestAnimationFrame(loop);
})();
