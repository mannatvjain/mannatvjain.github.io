// Speaker test: two boxes beside the photo strip that pump like speaker cones to the song in the corner player.
//   pink (left)  = the kick drum's low end      blue (right) = the bass line
// Each speaker is a fixed outlined cabinet with a filled square cone inside; the cone's size follows the loudness
// envelope of its stem (media/pdoom-speakers.json, 120 fps, from tools/speaker_env.py). The envelope's steepest rise
// is aligned to the kick attacks (measured median 0 ms), so the cone jumps out on the hit and settles back.
// Everything is a pure function of song time (video.currentTime).
(() => {
  const BASE = new URL(".", document.currentScript.src);
  const video = document.getElementById("mini-video");
  if (!video) return;
  // which visuals run: Drumline by default; "?viz=speakers" shows the speaker test (remembered for the session)
  const viz = (() => { let v = new URLSearchParams(location.search).get("viz"); try { if (v) sessionStorage.setItem("viz", v); else v = sessionStorage.getItem("viz"); } catch (e) {} return v || "drumline"; })();
  if (viz !== "speakers") return;
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const EARLY = 0.016;                                      // live: a frame reaches the screen ~1 vsync after it is drawn
  const ink = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  const fx = document.createElement("canvas");
  fx.setAttribute("aria-hidden", "true");
  fx.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:5";
  document.body.append(fx);
  const ctx = fx.getContext("2d");

  let ENV = null;
  fetch(new URL("media/pdoom-speakers.json", BASE)).then(r => r.json()).then(d => { ENV = d; draw(); }).catch(() => {});
  const level = (arr, t) => {                                // 0..1, linearly interpolated between 120 fps samples
    const x = t * ENV.fps, i = Math.floor(x);
    if (i < 0 || i + 1 >= arr.length) return 0;
    return (arr[i] + (arr[i + 1] - arr[i]) * (x - i)) / 255;
  };

  function speaker(cx, cy, side, color, lvl) {
    const px = v => Math.round(v) + 0.5;
    ctx.strokeStyle = ink("--ink"); ctx.lineWidth = 1;          // the cabinet: fixed outline
    ctx.strokeRect(px(cx - side / 2), px(cy - side / 2), Math.round(side), Math.round(side));
    const cone = side * (0.46 + 0.4 * lvl);                     // the cone: rest at 46% of the cabinet, out to 86% on a hit
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(cx - cone / 2), Math.round(cy - cone / 2), Math.round(cone), Math.round(cone));
  }

  function draw() {
    const dpr = Math.min(2, devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    if (fx.width !== W * dpr || fx.height !== H * dpr) { fx.width = W * dpr; fx.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (calm || !ENV || !document.getElementById("mini")) return;
    const el = document.querySelector(".roll") || document.querySelector(".head img") || document.querySelector("main h1");
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;
    const t = video.currentTime + (video.paused ? 0 : EARLY);
    const gutter = Math.min(r.left, W - r.right), gap = Math.min(24, gutter * 0.15);
    const side = Math.max(20, Math.min(r.height * 0.8, gutter - 2 * gap));
    const cy = r.top + r.height / 2;
    const lx = gutter - 2 * gap >= 20 ? r.left - gap - side / 2 : r.left + side / 2 + 6;     // beside the strip, or tucked inside it on phones
    const rx = gutter - 2 * gap >= 20 ? r.right + gap + side / 2 : r.right - side / 2 - 6;
    speaker(lx, cy, side, ink("--link-line"), level(ENV.kick, t));
    speaker(rx, cy, side, ink("--accent"), level(ENV.bass, t));
  }

  function loop() { draw(); if (!video.paused) requestAnimationFrame(loop); }
  video.addEventListener("play", () => requestAnimationFrame(loop));
  video.addEventListener("seeked", draw);
  video.addEventListener("pause", draw);
  addEventListener("resize", draw);
  addEventListener("scroll", draw, { passive: true });
  window.__musicAt = t => { Object.defineProperty(video, "currentTime", { configurable: true, get: () => t, set: () => {} }); draw(); };
})();
