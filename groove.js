// Music visuals, "Groove" variant (?viz=groove): the sync style of the P(doom) video (github.com/JohnHeibel/PDoomVideo).
// That video has no onset detection. It uses one beat grid, lyric lines timed to a tenth of a second, and hard-set cuts.
// It feels exact because its claims are forgiving:
//   steady layer · everything breathes on a continuous beat pulse (pop out on the beat, settle with a little
//                  overshoot). A smooth pulse has no sharp edge, so a few ms either way can't be seen.
//   line cuts    · each lyric line is a "shot": one box cuts to one element on the line's first syllable and stays
//                  for the whole line. The same line text always picks the same element.
//   sharp hits   · kept few and big: the kick thickens the line box, "doom" cuts to the name with guides,
//                  and the intro/outro shutters.
//   syllables    · small: a 4 px tick steps along under the line box, one per sung syllable.
//   early bias   · drawn 40 ms early. People accept a picture slightly ahead of its sound, not behind.
// Horizontal and vertical lines only. Loaded by music.js when ?viz=groove.
(() => {
  const BASE = new URL(".", document.currentScript.src);
  const video = document.getElementById("mini-video");
  if (!video) return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BPM = 132, BEAT = 60 / BPM, OFF = 0.253, BAR = 0;   // the kick-attack grid; bars start where beat n % 4 = 0
  const EARLY = 0.04;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ink = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const settle = a => Math.exp(-a / 0.11) * Math.cos(a * Math.PI * 2 / 0.34);   // 1 on the hit, overshoots once, rests at 0

  const fx = document.createElement("canvas");
  fx.setAttribute("aria-hidden", "true");
  fx.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
  document.body.append(fx);
  const ctx = fx.getContext("2d");

  // ---------- data ----------
  let LINES = [], LSYL = [], KICK = [], DOOM = [], ready = false;
  fetch(new URL("media/pdoom-drums.json", BASE)).then(r => r.json()).then(d => { KICK = d.kick.map(x => x[0]); }).catch(() => {});
  fetch(new URL("media/pdoom-voice.json", BASE)).then(r => r.json()).then(v => {
    const words = v.words;
    LINES = v.lines.map((l, li) => {
      const ws = words.filter(w => w[3] === li);
      const syl = [];
      for (const w of ws) for (let k = 0; k < w[5]; k++) syl.push(v.syl[w[4] + k][0]);
      return { a: ws[0][0], b: ws[ws.length - 1][1], text: l[2], syl: syl.sort((x, y) => x - y) };
    });
    DOOM = words.filter(w => /^doom/i.test(w[2])).map(w => w[0]);
    ready = true; draw();
  }).catch(() => {});

  // ---------- drawing ----------
  const px = v => Math.round(v) + 0.5;
  function box(r, pad, color, lw = 1) {
    ctx.strokeStyle = color; ctx.lineWidth = lw;
    ctx.strokeRect(px(r.left - pad), px(r.top - pad), Math.round(r.width + 2 * pad), Math.round(r.height + 2 * pad));
  }
  function corners(r, pad, color, lw = 1.5) {
    const x = px(r.left - pad), y = px(r.top - pad), w = Math.round(r.width + 2 * pad), h = Math.round(r.height + 2 * pad), s = Math.min(12, w / 4, h / 4);
    ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.beginPath();
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.moveTo(cx + dx * s, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * s); }
    ctx.stroke();
  }
  function guides(r, color) {
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath();
    ctx.moveTo(0, px(r.top - 9)); ctx.lineTo(innerWidth, px(r.top - 9)); ctx.moveTo(px(r.left - 9), 0); ctx.lineTo(px(r.left - 9), innerHeight);
    ctx.stroke(); ctx.setLineDash([]);
  }
  function elements() {
    return [...document.querySelectorAll("main h1, main h2, main p, main li, .roll img, .head img, .elsewhere a, .strip .back")]
      .map(el => el.getBoundingClientRect()).filter(r => r.height && r.bottom > 0 && r.top < innerHeight)
      .sort((a, b) => a.top - b.top || a.left - b.left);
  }
  const nameRect = () => { const e = document.querySelector("main h1"); return e && e.getBoundingClientRect(); };
  const hash = s => { let h = 7; for (const c of s.toLowerCase().replace(/[^a-z]/g, "")) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const last = (arr, x) => { let lo = 0, hi = arr.length; while (lo < hi) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m + 1; else hi = m; } return lo - 1; };

  // sections: which layers run (from the video's storyboard; same boundaries as Drumline)
  const SECTIONS = [[0, 1.4, "off"], [1.4, 22.1, "verse"], [22.1, 23.1, "off"], [23.1, 35.5, "chorus"], [35.5, 38.5, "dance"],
    [38.5, 58.8, "verse"], [58.8, 70.0, "chorus"], [70.0, 95.3, "verse"], [95.3, 105.2, "chorus"], [105.2, 109.4, "slow"],
    [109.4, 123.2, "verse"], [123.2, 135.4, "chorus"], [135.4, 137.4, "dark"], [137.4, 140.5, "verse"], [140.5, 150.0, "chorus"], [150.0, 157, "off"]];

  function shutter(k) {
    const e = document.querySelector(".roll, .head img"); if (!e) return;
    const r = e.getBoundingClientRect(), h = r.height / 2 * (1 - k);
    ctx.fillStyle = ink("--ink"); ctx.fillRect(r.left, r.top, r.width, h); ctx.fillRect(r.left, r.bottom - h, r.width, h);
  }

  function draw() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (fx.width !== W * dpr || fx.height !== H * dpr) { fx.width = W * dpr; fx.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (calm || !ready || !document.getElementById("mini")) return;
    const t = video.currentTime + (video.paused ? 0 : EARLY);
    if (video.paused && t < 0.05) return;
    const E = elements(); if (!E.length) return;
    const pink = ink("--link-line"), graphite = ink("--ink"), blue = ink("--accent"), muted = ink("--muted");
    const kind = (SECTIONS.find(x => t >= x[0] && t < x[1]) || [0, 0, "verse"])[2];

    // shutters: open at the start, bite shut on the video's CHOMP (22.1–23.1), close at the end
    if (t < 1.4) shutter(clamp((t - OFF - BEAT) / (BEAT * 1.5)));
    if (t >= 22.1 && t < 23.35) shutter(t < 23.1 ? 1 - clamp((t - 22.1) / 0.45) ** 2 : clamp((t - 23.1) / 0.2));
    if (t >= 150) shutter(1 - clamp((t - 150) / (BEAT * 2)));
    if (kind === "off" || kind === "dark") return;

    // steady layer: corner brackets around the name breathe on every beat (eighths in the dance break);
    // pink on the downbeat. Continuous, so there's no edge to catch early or late.
    const name = nameRect();
    const sub = kind === "dance" ? 2 : kind === "slow" ? 0.5 : 1;
    const bp = (t - OFF) / BEAT * sub, bn = Math.floor(bp), age = (bp - bn) * BEAT / sub;
    const down = sub >= 1 ? ((Math.floor((t - OFF) / BEAT) - BAR) % 4 + 4) % 4 === 0 && (sub === 1 || bn % 2 === 0) : true;
    if (name) corners(name, 10 + 8 * settle(age), down ? pink : graphite);

    // "doom": a hard cut to the name, pink, with guides; holds for a beat and a half
    const d = last(DOOM, t);
    if (d >= 0 && t - DOOM[d] < BEAT * 1.5 && name) { box(name, 16 + 4 * settle(t - DOOM[d]), pink, 2); guides(name, pink); return; }

    // line shot: the line's box cuts in on its first syllable and holds until the line ends (+ half a beat).
    // Chorus lines repeat, so they cut to the same element each time.
    const li = LINES.findIndex(l => t >= l.a && t < Math.max(l.b, l.syl[l.syl.length - 1] + 0.2) + BEAT / 2);
    if (li < 0) return;
    const L = LINES[li];
    const pool = E.filter(r => (!name || Math.abs(r.top - name.top) > 1) && r.top > 20 && r.bottom < innerHeight - 24);   // fully on screen; the name belongs to the beat
    const r = pool.length ? pool[hash(L.text) % pool.length] : E[0];
    const k = last(KICK, t), kAge = k >= 0 ? t - KICK[k] : 9;
    const breathe = 7 + 3 * settle(age);
    const col = kind === "chorus" ? pink : graphite;
    box(r, breathe + 6 * Math.max(0, 1 - (t - L.a) / 0.08) ** 2, col, kAge < 0.14 ? 2.5 - kAge / 0.14 : 1.25);   // arrives a little wide; the kick thickens it

    // syllables, small: one 4 px tick per sung syllable along the box's bottom edge; the newest is blue
    const n = L.syl.filter(s => s <= t).length;
    const x0 = r.left - breathe, y = Math.round(r.bottom + breathe + 5), gap = Math.min(10, (r.width + 2 * breathe) / Math.max(1, L.syl.length));
    for (let i = 0; i < n; i++) { ctx.fillStyle = i === n - 1 && t - L.syl[i] < 0.18 ? blue : muted; ctx.fillRect(Math.round(x0 + i * gap), y, 4, 4); }
  }

  function loop() { draw(); if (!video.paused) requestAnimationFrame(loop); }
  video.addEventListener("play", () => requestAnimationFrame(loop));
  video.addEventListener("seeked", draw);
  video.addEventListener("pause", draw);
  addEventListener("resize", draw);
  addEventListener("scroll", () => { if (video.paused) draw(); }, { passive: true });
  window.__musicAt = t => { Object.defineProperty(video, "currentTime", { configurable: true, get: () => t, set: () => {} }); draw(); };
  if (!video.paused) requestAnimationFrame(loop);
})();
