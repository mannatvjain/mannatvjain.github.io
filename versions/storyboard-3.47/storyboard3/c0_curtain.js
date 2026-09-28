// c0 · Curtain up (0–1.5): their curtainUp (src/ch/c01_lab.js:97–127), timing ported one-for-one
// (audit: docs/storyboard-timing/c0_curtain.md). The photo strip is the stage: the two graphite curtains sweep open
// 0 → .62 s (easeOut) and stay tied back at the sides; the trapdoor opens .42–.6; the hero rises through it .52–.92
// (backOut, stretched on the way up), then waves on the beat (their move 'wave'); a confetti puff from .6; a music-note
// emote pops .85–1.05. The camera pushes 1 → 1.05 over the whole shot (ease). Out: the chapter wipe at 1.5.
(() => {
  const { D, C, seg, ease, easeOut, backOut, move, clamp, lerp, hash, rr, chapter } = window.__SB;
  function curtainUp(t, lt, dur, S) {
    const top = (S.bar ? S.bar.bottom : 0) + 2, fl = S.floor;
    const st = S.strip || rr(S.main.left, Math.max(top + 8, S.name.top - 150), S.main.width, Math.max(40, Math.min(130, S.name.top - top - 40)));
    const fr = rr(st.left, st.top, st.width, fl - st.top), sx = fr.width / 1920, sy = fr.height / 1080;
    const z = 1 + 0.05 * ease(lt / 1.5), px = fr.left + fr.width / 2, py = fr.top + fr.height / 2;
    const yc = py + (fl - py) / z, yt = py + (top - py) / z;          // the band (under the topbar, above the name) in camera space
    D.cam(px, py, z, () => {
      // the trapdoor: the hole opens .42–.6 (easeOut), its hatch stands up behind it
      const hx = S.text.left + S.text.width / 2, open = easeOut(seg(t, 0.42, 0.6)), rx = 190 * open * sx;
      if (open > 0.02) { D.rect(hx - rx, yc - 130 * open * sy, 2 * rx, 130 * open * sy, C.muted, 1.25); D.hl(hx - rx, hx + rx, yc, C.ink, 2); }
      // the hero rises .52–.92 (backOut overshoot), stretched (sq −.2) for the first 35 %, then waves on the beat
      const rise = seg(t, 0.52, 0.92), s = S.u * 1.3;
      if (rise > 0) {
        const m = move("wave", t), dy = rise < 1 ? 0 : m.dy, sq = rise < 0.35 ? -0.2 : m.sq;
        const w = s * (1 + sq * 0.6), h = s * (1 - sq), y1 = yc + lerp(300, 8, backOut(rise)) * sy + dy * s / 8, y0 = y1 - h;
        if (y0 < yc) D.fill(hx - w / 2, y0, w, Math.min(y1, yc) - y0, C.pink);
        const k = backOut(seg(t, 0.85, 1.05));                        // the music-note emote
        if (k > 0.02) { const e = s * 0.3 * k, ex = hx + w / 2 + s * 0.2, ey = y0 - s * 0.15; D.fill(ex - e * 0.45, ey + e * 0.75, e * 0.9, e * 0.9, C.ink); D.vl(ex + e * 0.45, ey - e * 1.6, ey + e * 1.2, C.ink, 1.25); D.hl(ex + e * 0.45, ex + e * 1.4, ey - e * 1.6, C.ink, 1.25); }
      }
      // confetti puff as the hero pops out (from .6: 16 pieces, gravity 1100 px/s²), kept above the name
      const age = t - 0.6;
      if (age > 0) for (let i = 0; i < 16; i++) {
        const a = -Math.PI / 2 + (hash(i) - 0.5) * 2.4, v = 520 + hash(i + 3) * 560;
        const x = hx + Math.cos(a) * v * age * sx, y = yc - 120 * sy + (Math.sin(a) * v * age + 1100 * age * age) * sy, w = Math.max(5, 20 * sx), h = Math.max(3, 12 * sy);
        if (y + h / 2 < yc && y - h / 2 > yt) D.fill(x - w / 2, y - h / 2, w, h, [C.pink, C.ink, C.blue, C.muted, C.pink][i % 5]);
      }
      // the curtains: inner edges lerp(250, 985) and lerp(1670, 935) of their 1920 px frame; open at k = 0 (tied back)
      if (S.strip) {
        const k = 1 - easeOut(seg(t, 0, 0.62)), l = st.left + st.width * lerp(250, 985, k) / 1920, r = st.left + st.width * lerp(1670, 935, k) / 1920;
        D.fill(st.left, st.top, l - st.left, st.height, C.ink); D.fill(r, st.top, st.right - r, st.height, C.ink);
      }
    });
  }
  chapter("curtain", 0, 1.5, [[0, curtainUp]]);
})();
