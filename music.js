// Music visuals, Drumline 2.4: Drumline 2 drawn 40 ms early (2.1), with shutters that shut with no seam and a one-stroke "accelerating" line that speeds up (2.2's teeth rejected) (docs/WORK_LEDGER.md, 2026-09-24).
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
  // which visuals run: Drumline 2.1 by default; "?viz=speakers" the speaker test, "?viz=groove" Groove (groove.js), "?viz=drumline2" Drumline 2 (drumline2.js), "?viz=storyboard" Storyboard 2 (storyboard.js), "?viz=storyboard3" the Storyboard 3 working version (storyboard3.js), "?viz=storyboard3.1", "?viz=storyboard3.2" … frozen versions (versions/); remembered for the session
  const viz = (() => { let v = new URLSearchParams(location.search).get("viz"); try { if (v) sessionStorage.setItem("viz", v); else v = sessionStorage.getItem("viz"); } catch (e) {} return v || "storyboard3.68"; })();   // the default (Mannat, 2026-09-24: "bring to main"): Storyboard 3.36, frozen; Drumline alone is ?viz=drumline
  for (const [name, file] of [["groove", "groove.js"], ["drumline2", "drumline2.js"], ["storyboard", "storyboard.js"], ["storyboard3", "storyboard3.js"], ["storyboard3.1", "versions/storyboard-3.1/storyboard3.js"], ["storyboard3.2", "versions/storyboard-3.2/storyboard3.js"], ["storyboard3.3", "versions/storyboard-3.3/storyboard3.js"], ["storyboard3.4", "versions/storyboard-3.4/storyboard3.js"], ["storyboard3.5", "versions/storyboard-3.5/storyboard3.js"], ["storyboard3.6", "versions/storyboard-3.6/storyboard3.js"], ["storyboard3.7", "versions/storyboard-3.7/storyboard3.js"], ["storyboard3.8", "versions/storyboard-3.8/storyboard3.js"], ["storyboard3.9", "versions/storyboard-3.9/storyboard3.js"], ["storyboard3.9.1", "versions/storyboard-3.9.1/storyboard3.js"], ["storyboard3.10", "versions/storyboard-3.10/storyboard3.js"], ["storyboard3.11", "versions/storyboard-3.11/storyboard3.js"], ["storyboard3.12", "versions/storyboard-3.12/storyboard3.js"], ["storyboard3.13", "versions/storyboard-3.13/storyboard3.js"], ["storyboard3.14", "versions/storyboard-3.14/storyboard3.js"], ["storyboard3.15", "versions/storyboard-3.15/storyboard3.js"], ["storyboard3.16", "versions/storyboard-3.16/storyboard3.js"], ["storyboard3.17", "versions/storyboard-3.17/storyboard3.js"], ["storyboard3.18", "versions/storyboard-3.18/storyboard3.js"], ["storyboard3.19", "versions/storyboard-3.19/storyboard3.js"], ["storyboard3.20", "versions/storyboard-3.20/storyboard3.js"], ["storyboard3.21", "versions/storyboard-3.21/storyboard3.js"], ["storyboard3.22", "versions/storyboard-3.22/storyboard3.js"], ["storyboard3.23", "versions/storyboard-3.23/storyboard3.js"], ["storyboard3.24", "versions/storyboard-3.24/storyboard3.js"], ["storyboard3.25", "versions/storyboard-3.25/storyboard3.js"], ["storyboard3.26", "versions/storyboard-3.26/storyboard3.js"], ["storyboard3.27", "versions/storyboard-3.27/storyboard3.js"], ["storyboard3.28", "versions/storyboard-3.28/storyboard3.js"], ["storyboard3.29", "versions/storyboard-3.29/storyboard3.js"], ["storyboard3.30", "versions/storyboard-3.30/storyboard3.js"], ["storyboard3.31", "versions/storyboard-3.31/storyboard3.js"], ["storyboard3.32", "versions/storyboard-3.32/storyboard3.js"], ["storyboard3.33", "versions/storyboard-3.33/storyboard3.js"], ["storyboard3.34", "versions/storyboard-3.34/storyboard3.js"], ["storyboard3.35", "versions/storyboard-3.35/storyboard3.js"], ["storyboard3.36", "versions/storyboard-3.36/storyboard3.js"], ["storyboard3.37", "versions/storyboard-3.37/storyboard3.js"], ["storyboard3.38", "versions/storyboard-3.38/storyboard3.js"], ["storyboard3.39", "versions/storyboard-3.39/storyboard3.js"], ["storyboard3.40", "versions/storyboard-3.40/storyboard3.js"], ["storyboard3.41", "versions/storyboard-3.41/storyboard3.js"], ["storyboard3.42", "versions/storyboard-3.42/storyboard3.js"], ["storyboard3.43", "versions/storyboard-3.43/storyboard3.js"], ["storyboard3.44", "versions/storyboard-3.44/storyboard3.js"], ["storyboard3.45", "versions/storyboard-3.45/storyboard3.js"], ["storyboard3.46", "versions/storyboard-3.46/storyboard3.js"], ["storyboard3.47", "versions/storyboard-3.47/storyboard3.js"], ["storyboard3.48", "versions/storyboard-3.48/storyboard3.js"], ["storyboard3.49", "versions/storyboard-3.49/storyboard3.js"], ["storyboard3.50", "versions/storyboard-3.50/storyboard3.js"], ["storyboard3.51", "versions/storyboard-3.51/storyboard3.js"], ["storyboard3.52", "versions/storyboard-3.52/storyboard3.js"], ["storyboard3.53", "versions/storyboard-3.53/storyboard3.js"], ["storyboard3.54", "versions/storyboard-3.54/storyboard3.js"], ["storyboard3.55", "versions/storyboard-3.55/storyboard3.js"], ["storyboard3.56", "versions/storyboard-3.56/storyboard3.js"], ["storyboard3.57", "versions/storyboard-3.57/storyboard3.js"], ["storyboard3.58", "versions/storyboard-3.58/storyboard3.js"], ["storyboard3.59", "versions/storyboard-3.59/storyboard3.js"], ["storyboard3.60", "versions/storyboard-3.60/storyboard3.js"], ["storyboard3.61", "versions/storyboard-3.61/storyboard3.js"], ["storyboard3.62", "versions/storyboard-3.62/storyboard3.js"], ["storyboard3.63", "versions/storyboard-3.63/storyboard3.js"], ["storyboard3.64", "versions/storyboard-3.64/storyboard3.js"], ["storyboard3.65", "versions/storyboard-3.65/storyboard3.js"], ["storyboard3.66", "versions/storyboard-3.66/storyboard3.js"], ["storyboard3.67", "versions/storyboard-3.67/storyboard3.js"], ["storyboard3.68", "versions/storyboard-3.68/storyboard3.js"]]) if (viz === name) { const g = document.createElement("script"); g.src = new URL(file, BASE); document.head.append(g); }
  // ?viz=storyboard3 runs these Drumline highlights on top of the storyboard (Storyboard 3.1), without the shutters
  const underStoryboard = viz.startsWith("storyboard3");     // storyboard3 (the working version) and its frozen versions/ copies
  if (viz !== "drumline" && !underStoryboard) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BPM = 132, BEAT = 60 / BPM, OFF = 0.253, BAR = 0;   // bars start where beat n % 4 = BAR (beat_this downbeats)          // fitted to the kick drum's attacks (tools/attacks.py)
  const EARLY = 0.04;                                       // live: one vsync of display latency, plus a lead (people accept a picture ahead of its sound, not behind)
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
  // under the storyboard the body follows the beat quietly: below the name, boxes and brackets are muted, faint and thin
  const bodyTop = () => { const n = document.querySelector("main h1"); return n ? n.getBoundingClientRect().bottom + 4 : Infinity; };
  // the quiet body belongs to 3.2/3.3 only (3.4 and 3.5 branch from 3.1)
  const hush = (r, color, lw) => (viz === "storyboard3.2" || viz === "storyboard3.3") && r.top > bodyTop() ? (ctx.globalAlpha *= 0.35, [ink("--muted"), 1]) : [color, lw];
  function box(r, pad, color, lw = 1) {
    const a0 = ctx.globalAlpha; [color, lw] = hush(r, color, lw);
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.strokeRect(px(r.left - pad), px(r.top - pad), Math.round(r.width + 2 * pad), Math.round(r.height + 2 * pad));
    ctx.globalAlpha = a0;
  }
  function corners(r, pad, color, lw = 1.25) {
    const a0 = ctx.globalAlpha; [color, lw] = hush(r, color, lw);
    const x = px(r.left - pad), y = px(r.top - pad), w = Math.round(r.width + 2 * pad), h = Math.round(r.height + 2 * pad), t = Math.min(12, w / 4, h / 4);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.moveTo(cx + dx * t, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * t); }
    ctx.stroke(); ctx.globalAlpha = a0;
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
    // "drop": removed in Drumline 2.5 (Mannat, 2026-09-28): its box fell down the whole page over the name and bio
    // "op-ti-miz-ing": each syllable pulls one box tighter around the same element
    const opt = word(/^optimiz/i, 44.5);
    K(opt, (t, E) => { const r = E[Math.min(4, E.length - 1)], n = opt.filter(x => x <= t).length; box(r, 22 - n * 4 + snap(t - opt[n - 1]) * 0.5, ink("--ink"), 1 + n * 0.25); });
    // "accelerating": one stroke under the name, left to right, from the word's first syllable to the end of its held
    // last syllable (Mannat, 2026-09-24: one stroke over the whole word, not staggered per syllable)
    const acc = word(/^accelerat/i, 46.5), accW = WORDS.find(w => /^accelerat/i.test(w[2]) && w[0] > 44.5);
    const accEnd = accW ? Math.max(accW[1], ...SYL.filter(x => x[0] >= accW[0] - 0.01 && x[0] < accW[1]).map(x => x[0] + x[1])) : acc[acc.length - 1] + 0.5;
    K(acc, (t, E) => { const r = nameRect() || E[0], k = clamp((t - acc[0]) / (accEnd - acc[0])) ** 2.2;   // speeds up across the word (Mannat: "should actually be accelerating")
      const main = document.querySelector("main").getBoundingClientRect(), len = k * (main.right - 20 - r.left);
      ctx.strokeStyle = ink("--link-line"); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px(r.left), px(r.bottom + 8)); ctx.lineTo(px(r.left + len), px(r.bottom + 8)); ctx.stroke();
      ctx.fillStyle = ink("--link-line"); ctx.fillRect(Math.round(r.left + len) - 3, Math.round(r.bottom + 5), 6, 6); }, accEnd + 0.3);
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
    // (whole pixels, so the two halves meet with no seam when shut)
    const shutter = k => { const e = document.querySelector(".roll, .head img"); if (!e) return; const r = e.getBoundingClientRect();
      const x = Math.floor(r.left), w = Math.ceil(r.right) - x, top = Math.floor(r.top), bot = Math.ceil(r.bottom), H = bot - top;
      const h = k <= 0 ? Math.ceil(H / 2) + 1 : Math.round(H / 2 * (1 - k));
      ctx.fillStyle = ink("--ink"); ctx.fillRect(x, top, w, h); ctx.fillRect(x, bot - h, w, h); };
    if (!underStoryboard) KEYS.push({ a: 0, b: 1.4, fn: t => shutter(clamp((t - OFF - BEAT) / (BEAT * 1.5))) });
    // CHOMP (video 22.1–23.1): the shutters bite shut over the photo strip, hold through the black, open
    if (!underStoryboard) KEYS.push({ a: 22.1, b: 23.35, fn: t => shutter(t < 23.1 ? 1 - easeIn((t - 22.1) / 0.45) : clamp((t - 23.1) / 0.2)) });
    if (!underStoryboard) KEYS.push({ a: 150.0, b: 156.7, fn: t => shutter(1 - clamp((t - 150.0) / (BEAT * 2))) });
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
