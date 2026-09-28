// Music visuals, Drumline 2 (frozen; ?viz=drumline2, git tag drumline-2). The default is music.js (Drumline 3).
// Music visuals v2: simple ink boxes on the page's own elements, synced to the song in the corner player.
// Everything is a pure function of song time t (video.currentTime), so pausing, seeking and page changes just redraw.
//   beat      · corner brackets pulse around the name on every beat of the 132 BPM grid (pink on the downbeat)
//   syllable  · every sung syllable snaps one box onto an element for exactly as long as it is sung;
//               pitch picks the element (higher note = higher on the page), so the same note boxes the same element;
//               held notes grow nested boxes; a straight L-shaped line joins consecutive boxes
//   key words · a few moments built from the same boxes and lines, starting on the word and stepping per syllable
// Horizontal and vertical lines only. Docs: docs/MUSIC_VISUALS.md, docs/MOTION_REFERENCES.md.
(() => {
  const BASE = new URL(".", document.currentScript.src);
  const video = document.getElementById("mini-video");
  if (!video) return;
  // which visuals run: Drumline by default; "?viz=speakers" shows the speaker test, "?viz=groove" the Groove variant (groove.js) (remembered for the session)
  const viz = (() => { let v = new URLSearchParams(location.search).get("viz"); try { if (v) sessionStorage.setItem("viz", v); else v = sessionStorage.getItem("viz"); } catch (e) {} return v || "drumline"; })();
  if (viz !== "drumline2") return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BPM = 132, BEAT = 60 / BPM, OFF = 0.253, BAR = 0;   // bars start where beat n % 4 = BAR (beat_this downbeats)          // fitted to the kick drum's attacks (tools/attacks.py)
  const EARLY = 0.016;                                      // live: a frame reaches the screen ~1 vsync after it is drawn
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const easeIn = k => clamp(k) ** 2;
  const ink = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  const fx = document.createElement("canvas");
  fx.setAttribute("aria-hidden", "true");
  fx.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
  document.body.append(fx);
  const ctx = fx.getContext("2d");

  // ---------- data ----------
  let SYL = [], WORDS = [], LINES = [], lineOf = [], lineMid = [], ready = false;
  let KICK = [], SNARE = [], HAT = [];
  fetch(new URL("media/pdoom-drums.json", BASE)).then(r => r.json()).then(d => { KICK = d.kick.map(x => x[0]); SNARE = d.snare.map(x => x[0]); HAT = d.hat.map(x => x[0]); }).catch(() => {});
  fetch(new URL("media/pdoom-voice.json", BASE)).then(r => r.json()).then(v => {
    WORDS = v.words; LINES = v.lines;
    // every sung syllable inside a lyric line: detected attacks and legato vowel changes (field 8 = 1 or 3) plus
    // lyric syllables placed where the audio shows no boundary (field 9 = 0). Pitch bends inside a vowel (field 8 = 2)
    // are not new syllables. Repeats the lyric sheet doesn't spell out ("up, up, up") are kept: each gets its own box.
    const inLine = t => LINES.some(l => t >= l[0] - 0.12 && t <= l[1] + 0.35);
    SYL = v.syl.filter(s => (s[8] !== 2 || s[9] === 0) && inLine(s[0]));
    SYL.forEach((s, i) => { lineOf[i] = LINES.findIndex(l => s[0] >= l[0] - 0.05 && s[0] <= l[1] + 0.3); });
    lineMid = LINES.map((l, li) => { const p = SYL.filter((s, i) => lineOf[i] === li && s[2]).map(s => s[2]).sort((a, b) => a - b); return p[p.length >> 1] || 63; });
    buildKeys();
    ready = true; draw();
  }).catch(() => {});

  // syllable onset times of the first sung word matching `re` that starts after `near` - 2 s
  function word(re, near) {
    const w = WORDS.find(w => re.test(w[2]) && w[0] > near - 2);
    if (!w) return [near];
    const s = [];
    for (const x of SYL) if (x[0] >= w[0] - 0.01 && x[0] < w[1] + 0.05 && s.length < w[5]) s.push(x[0]);
    return s.length ? s : [w[0]];
  }

  // ---------- drawing primitives (the first version's vocabulary) ----------
  const px = v => Math.round(v) + 0.5;
  function box(r, pad, color, lw = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.strokeRect(px(r.left - pad), px(r.top - pad), Math.round(r.width + 2 * pad), Math.round(r.height + 2 * pad));
  }
  function corners(r, pad, color, lw = 1.25) {
    const x = px(r.left - pad), y = px(r.top - pad), w = Math.round(r.width + 2 * pad), h = Math.round(r.height + 2 * pad), t = Math.min(12, w / 4, h / 4);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.moveTo(cx + dx * t, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * t); }
    ctx.stroke();
  }
  function link(a, b, color) {                            // an L-shaped straight line from a's left edge to b's
    const y = b.top > a.bottom ? b.top - 6 : b.bottom + 6;
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(px(a.left - 6), px(a.bottom + 6)); ctx.lineTo(px(a.left - 6), px(y)); ctx.lineTo(px(b.left - 6), px(y)); ctx.stroke();
  }
  function guides(r, color) {                              // dotted full-width and full-height guides through a corner
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath();
    ctx.moveTo(0, px(r.top - 7)); ctx.lineTo(innerWidth, px(r.top - 7)); ctx.moveTo(px(r.left - 7), 0); ctx.lineTo(px(r.left - 7), innerHeight);
    ctx.stroke(); ctx.setLineDash([]);
  }
  const snap = age => 10 * Math.max(0, 1 - age / 0.07) ** 2;   // boxes arrive a little wide and snap in within 70 ms

  // on-screen elements, top to bottom
  function elements() {
    return [...document.querySelectorAll("main h1, main h2, main p, main li, .roll img, .head img, .elsewhere a, .strip .back")]
      .map(el => el.getBoundingClientRect()).filter(r => r.height && r.bottom > 0 && r.top < innerHeight)
      .sort((a, b) => a.top - b.top || a.left - b.left);
  }
  const nameRect = () => { const e = document.querySelector("main h1"); return e && e.getBoundingClientRect(); };

  // ---------- key words ----------
  let KEYS = [], owned = new Set();
  function buildKeys() {
    KEYS = []; owned = new Set();
    const K = (ts, fn, until) => { ts.forEach(t => owned.add(t.toFixed(3))); KEYS.push({ a: ts[0], b: until ?? ts[ts.length - 1] + 0.8, fn }); };

    // "I'm up-ping my P(doom)": from the start of each chorus line to "doom", every sung syllable moves the box one
    // element further up the page (the same climb in all four choruses; chorus 4's run of repeated notes tops out
    // on the name). "doom" lands on the name in pink with guides.
    for (const near of [22.5, 58.5, 95.0, 122.8]) {
      const li = LINES.findIndex(l => l[0] > near - 0.8), l = LINES[li];
      const doom = word(/^doom/i, l[0])[0];
      const steps = SYL.map(x => x[0]).filter(x => x >= l[0] - 0.12 && x < doom - 0.01);
      K([...steps, doom], (t, E) => {
        const n = E.length, done = steps.filter(x => x <= t).length;
        const nameIdx = E.findIndex(r => { const nr = nameRect(); return nr && Math.abs(r.top - nr.top) < 1 && Math.abs(r.left - nr.left) < 1; });
        const at = k => Math.max(nameIdx >= 0 ? nameIdx : 0, n - 1 - k);          // one element up per syllable, stop at the name
        if (t < doom) { const k = done - 1; if (k >= 0) { box(E[at(k)], 5 + snap(t - steps[k]), ink("--link-line"), 1.5); if (k > 0) box(E[at(k - 1)], 5, ink("--ink"), 1); } }
        else { const r = nameRect(); if (r) { box(r, 8 + snap(t - doom), ink("--link-line"), 2); guides(r, ink("--link-line")); } }
      }, doom + 0.9);
    }
    // "drop": on the word the box sinks one hard step; at 10.8, when Clawd plunges in the video, it falls down the page
    const drop = word(/^drop$/i, 10), plunge = 10.8;
    K(drop, (t, E) => { const r = E[0], y = (t >= drop[0] ? 14 : 0) + easeIn((t - plunge) / 0.65) * innerHeight; box({ left: r.left, top: r.top + y, width: r.width, height: r.height }, 6, ink("--ink"), 1.5); }, plunge + 0.7);
    // "op-ti-miz-ing": each syllable pulls one box tighter around the same element
    const opt = word(/^optimiz/i, 44.5);
    K(opt, (t, E) => { const r = E[Math.min(4, E.length - 1)], n = opt.filter(x => x <= t).length; box(r, 22 - n * 4 + snap(t - opt[n - 1]) * 0.5, ink("--ink"), 1 + n * 0.25); });
    // "ac-cel-er-at-ing": each syllable adds a longer segment to a line under the name (1, 2, 3, 5, 8): speeding up on the word
    const acc = word(/^accelerat/i, 46.5);
    K(acc, (t, E) => { const r = nameRect() || E[0], n = acc.filter(x => x <= t).length, seg = [1, 2, 3, 5, 8, 13];
      const main = document.querySelector("main").getBoundingClientRect(), unit = (main.right - 20 - r.left) / 19;
      let len = 0; for (let i = 0; i < n; i++) len += seg[i] * unit; len = Math.min(len, main.right - 20 - r.left);
      ctx.strokeStyle = ink("--link-line"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px(r.left), px(r.bottom + 8)); ctx.lineTo(px(r.left + len), px(r.bottom + 8)); ctx.stroke();
      ctx.fillStyle = ink("--link-line"); ctx.fillRect(Math.round(r.left + len) - 3, Math.round(r.bottom + 5), 6, 6); }, acc[acc.length - 1] + 0.6);
    // "boom" (basilisk): one big box snaps around everything on screen, with guides, and fades over a beat
    const boom = word(/^boom$/i, 61);
    K(boom, (t, E) => {
      const u = E.reduce((u, r) => ({ l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
      const r = { left: u.l, top: u.t, width: u.r - u.l, height: u.b - u.t };
      ctx.globalAlpha = 1 - clamp((t - boom[0]) / BEAT); box(r, 12 + snap(t - boom[0]) * 2, ink("--ink"), 2); guides(r, ink("--ink")); ctx.globalAlpha = 1;
    }, boom[0] + BEAT);
    // "FOOM": a box on the lowest element, then one hard cut up to the name
    const foom = word(/^foom$/i, 25);
    K(foom, (t, E) => { const r = t - foom[0] < 0.12 ? E[E.length - 1] : nameRect() || E[0]; box(r, 6 + snap(t - foom[0]), ink("--accent"), 1.5); });
    // "re-ar-rang-ing": each syllable swaps the boxes on two elements
    const rea = word(/rearrang/i, 50);
    K(rea, (t, E) => { if (E.length < 3) return; const n = rea.filter(s => s <= t).length, [p, q] = n % 2 ? [E[1], E[2]] : [E[2], E[1]]; box(p, 5, ink("--ink"), 1.25); box(q, 5, ink("--link-line"), 1.25); link(p, q, ink("--muted")); });
    // "for-ward M-L-P, back-ward, re-peat": the box walks down the page on forward, back up on backward, down on repeat
    const fw = word(/^forward$/i, 73), bw = word(/^backward/i, 74), rp = word(/^repeat$/i, 75);
    K([...fw, ...bw, ...rp], (t, E) => {
      if (E.length < 3) return;
      let pos = 1, last = fw[0];
      for (const [ts, dir] of [[fw, 1], [bw, -1], [rp, 1]]) for (const s of ts) if (s <= t) { pos = clamp(pos + dir, 0, E.length - 1); last = s; }
      box(E[pos], 5 + snap(t - last), ink("--ink"), 1.25);
    }, rp[rp.length - 1] + 0.5);
    // "free": the box around the name opens on its right side and slides open
    const free = word(/^free$/i, 56);
    K(free, (t) => { const r = nameRect(); if (!r) return; const k = clamp((t - free[0]) / 0.3), x = r.left - 8, y = r.top - 8, w = r.width + 16, h = r.height + 16;
      ctx.strokeStyle = ink("--link-line"); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px(x + w + k * 40), px(y)); ctx.lineTo(px(x), px(y)); ctx.lineTo(px(x), px(y + h)); ctx.lineTo(px(x + w + k * 40), px(y + h)); ctx.stroke(); }, free[0] + 1.0);
    // "just just just just": four identical boxes stacking on the same element, one per "just" (same sound, same image)
    const js = []; let near = 109; for (let i = 0; i < 4; i++) { const w = word(/^just$/i, near); js.push(w[0]); near = w[0] + 0.1; }
    K(js, (t, E) => { const r = E[Math.floor(E.length / 2)], n = js.filter(s => s <= t).length; for (let i = 0; i < n; i++) box(r, 5 + i * 6 + (i === n - 1 ? snap(t - js[i]) : 0), ink("--ink"), 1.25); });
    // the fuse's BOOM (105.2) and SLAM (133.9, video frames): a hard, heavy box around the name
    for (const at of [105.2, 133.9]) KEYS.push({ a: at, b: at + 1.2, fn: t => { const r = nameRect(); if (r) { box(r, 6, ink("--ink"), t - at < 0.15 ? 3 : 1.75); if (t - at < 0.15) guides(r, ink("--ink")); } } });
    // intro and outro: two horizontal shutters open off the photo strip / close over it (Rhythmus 21)
    const shutter = k => { const e = document.querySelector(".roll, .head img"); if (!e) return; const r = e.getBoundingClientRect(), h = r.height / 2 * (1 - k);
      ctx.fillStyle = ink("--ink"); ctx.fillRect(r.left, r.top, r.width, h); ctx.fillRect(r.left, r.bottom - h, r.width, h); };
    KEYS.push({ a: 0, b: 1.4, fn: t => shutter(clamp((t - OFF - BEAT) / (BEAT * 1.5))) });
    // CHOMP (video 22.1–23.1): the shutters bite shut over the photo strip, hold through the black, open with the teeth
    KEYS.push({ a: 22.1, b: 23.35, fn: t => shutter(t < 23.1 ? 1 - easeIn((t - 22.1) / 0.45) : clamp((t - 23.1) / 0.2)) });
    KEYS.push({ a: 150.0, b: 156.7, fn: t => shutter(1 - clamp((t - 150.0) / (BEAT * 2))) });
  }

  // song sections (from the video's storyboard and the lyric lines): the lighting pattern changes with each
  const SECTIONS = [[0, 1.4, "off"], [1.4, 22.1, "verse"], [22.1, 23.1, "off"], [23.1, 35.5, "chorus"], [35.5, 38.5, "dance"],
    [38.5, 58.8, "verse"], [58.8, 70.0, "chorus"], [70.0, 95.3, "verse"], [95.3, 105.2, "chorus"], [105.2, 109.4, "slow"],
    [109.4, 123.2, "verse"], [123.2, 135.4, "chorus"], [135.4, 137.4, "dark"], [137.4, 140.5, "verse"], [140.5, 150.0, "chorus"], [150.0, 157, "off"]];

  // ---------- frame ----------
  function draw() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (fx.width !== W * dpr || fx.height !== H * dpr) { fx.width = W * dpr; fx.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (calm || !ready || !document.getElementById("mini")) return;
    const t = video.currentTime + (video.paused ? 0 : EARLY);
    if (video.paused && t < 0.05) return;
    const E = elements(); if (!E.length) return;
    const pink = ink("--link-line"), graphite = ink("--ink"), blue = ink("--accent");

    // drums, the way DJ lighting does it: every kick fires one heavy box instantly at full strength and steps a chase
    // through the page's elements; every snare answers with corner brackets on the opposite element. Times are the
    // drums' attacks (tools/attacks.py). Each section has one chase pattern; bars start where beat n % 4 = BAR (0: every downbeat beat_this finds).
    const last = (arr, x) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m + 1; else hi = m; } return lo - 1; };
    const sec = SECTIONS.find(x => t >= x[0] && t < x[1]) || [0, 0, "verse"], kind = sec[2];
    if (kind !== "dark" && kind !== "off" && E.length) {
      const rig = E.filter((r, i) => i % Math.max(1, Math.round(E.length / 6)) === 0).slice(0, 6);   // up to six fixtures down the page
      const pre = SECTIONS.some(x => x[2] === "chorus" && x[0] - t > 0 && x[0] - t <= BEAT * 4);      // the bar before a chorus
      const hits = kind === "dance" || pre ? [...KICK, ...SNARE, ...HAT].sort((a, b) => a - b) : KICK;  // builds and the dance break chase every hit
      const k = last(hits, t);
      if (k >= 0) {
        const age = t - hits[k], step = k;
        const fix = kind === "chorus" ? rig[step % 2 ? rig.length - 1 - (step >> 1) % rig.length : (step >> 1) % rig.length] : rig[step % rig.length];
        const bnK = Math.round((hits[k] - OFF) / BEAT), down = Math.abs(hits[k] - (OFF + bnK * BEAT)) < 0.04 && ((bnK - BAR) % 4 + 4) % 4 === 0;
        if (fix && age < 0.2) { ctx.globalAlpha = 1 - age / 0.2; box(fix, 4, down ? pink : graphite, down ? 2.5 : 2); ctx.globalAlpha = 1; }
        const sn = last(SNARE, t);
        if (sn >= 0 && t - SNARE[sn] < 0.15 && !(kind === "dance" || pre)) {
          const opp = rig[(step + 3) % rig.length]; ctx.globalAlpha = 1 - (t - SNARE[sn]) / 0.15; corners(opp, 8, blue, 1.5); ctx.globalAlpha = 1;
        }
      }
      // chorus downbeats: a strobe of guides and pink corners on the name
      const bp = (t - OFF) / BEAT, bn = Math.floor(bp), dAge = (bp - bn) * BEAT, inBar = ((bn - BAR) % 4 + 4) % 4, name = nameRect();
      if (kind === "chorus" && inBar === 0 && dAge < 0.12 && name) { ctx.globalAlpha = 1 - dAge / 0.12; corners(name, 12, pink, 1.5); guides(name, pink); ctx.globalAlpha = 1; }
    }

    // key words (they own their syllables)
    for (const k of KEYS) if (t >= k.a && t < k.b) k.fn(t, E);

    // syllables
    let lo = 0, hi = SYL.length;
    while (lo < hi) { const m = (lo + hi) >> 1; if (SYL[m][0] + SYL[m][1] + 1.2 < t) lo = m + 1; else hi = m; }
    let prev = null;
    for (let i = lo; i < SYL.length && SYL[i][0] <= t; i++) {
      const [on, dur, p0, , , loud, , held] = SYL[i];
      const li = lineOf[i], mid = lineMid[li] ?? p0, hh = 0.5 + ((p0 || mid) - mid) / 8, h = Number.isFinite(hh) ? clamp(hh) : 0.5;
      const r = E[clamp(Math.round((1 - h) * (E.length - 1)), 0, E.length - 1)];
      if (owned.has(on.toFixed(3))) { prev = null; continue; }
      const a = t - on, life = held ? dur + 0.25 : Math.max(0.16, dur);
      if (a > life) { prev = r; continue; }
      const col = h >= 0.75 ? pink : h <= 0.25 ? blue : graphite;
      ctx.globalAlpha = a < life - 0.08 ? 1 : (life - a) / 0.08;
      box(r, 7 + loud / 100 * 4, col, 1);                                    // vocal accent: thin, instant, sits outside the drum box
      if (held) for (let e = 1; e * BEAT / 2 <= a && e < 6; e++) box(r, 7 + e * 7, e % 2 ? col : graphite, 1);   // one more ring per eighth note held
      if (prev && prev !== r && a < 0.12) link(prev, r, ink("--muted"));
      prev = r;
    }
    ctx.globalAlpha = 1;
  }

  function loop() { draw(); if (!video.paused) requestAnimationFrame(loop); }
  video.addEventListener("play", () => requestAnimationFrame(loop));
  video.addEventListener("seeked", draw);
  video.addEventListener("pause", draw);
  addEventListener("resize", draw);
  addEventListener("scroll", () => { if (video.paused) draw(); }, { passive: true });
  window.__musicAt = t => { Object.defineProperty(video, "currentTime", { configurable: true, get: () => t, set: () => {} }); draw(); };
})();
