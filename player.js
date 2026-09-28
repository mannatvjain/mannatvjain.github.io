// Corner music player (our own media/pdoom.mp4, played as audio), shared by every page; keeps playing across in-site navigation.
// The page's answer to the song is drawn by music.js.
(() => {
  const BASE = new URL(".", document.currentScript.src);
  // an audio player (Mannat, 2026-09-24: "turn the claude pop into a player and not a visual"). The <video> stays,
  // hidden, because music.js reads the song's time from it.
  document.body.insertAdjacentHTML("beforeend", `<aside class="mini" id="mini" aria-label="Music player">
  <video id="mini-video" src="${new URL("media/pdoom.mp4", BASE)}" preload="metadata" playsinline hidden></video>
  <button id="mini-toggle" class="mini-play" aria-label="Play I'm Upping My P(Doom)"></button>
  <div class="mini-body">
    <div class="mini-title" title="Claude Pop – I'm Upping My P(Doom), by OtherReality"><span>I'm Upping My P(Doom)</span> · <a href="https://www.youtube.com/@thisotherreality">OtherReality</a></div>
    <div class="mini-seek" id="mini-seek" role="slider" tabindex="0" aria-label="Seek" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i id="mini-fill"></i></div>
    <div class="mini-time"><span id="mini-now">0:00</span><span id="mini-dur">2:36</span></div>
  </div>
  <button id="mini-close" class="mini-close" aria-label="Close player">&times;</button>
</aside>`);

  const PLAY = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1v10l8.5-5z" fill="currentColor"/></svg>';
  const PAUSE = '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg>';
  const toggle = document.getElementById("mini-toggle"), video = document.getElementById("mini-video");
  const seek = document.getElementById("mini-seek"), fill = document.getElementById("mini-fill");
  const now = document.getElementById("mini-now"), dur = document.getElementById("mini-dur");
  let playing = false;
  const mmss = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;

  function showState(paused) {
    toggle.innerHTML = paused ? PLAY : PAUSE;
    toggle.setAttribute("aria-label", paused ? "Play" : "Pause");
  }
  function showTime() {
    const d = video.duration || 156.6, k = Math.min(1, video.currentTime / d);
    fill.style.width = `${k * 100}%`; seek.setAttribute("aria-valuenow", Math.round(k * 100));
    now.textContent = mmss(video.currentTime); dur.textContent = mmss(d);
  }
  showState(true);
  video.addEventListener("play", () => { playing = true; showState(false); });
  video.addEventListener("pause", () => { playing = false; showState(true); });
  video.addEventListener("timeupdate", showTime);
  video.addEventListener("seeked", showTime);
  video.addEventListener("loadedmetadata", showTime);
  toggle.onclick = () => video.paused ? video.play().catch(() => {}) : video.pause();
  // Space plays and pauses the song and never scrolls the page (Mannat), wherever focus is, except while typing in a field
  addEventListener("keydown", e => {
    if (e.code !== "Space" || e.repeat || e.metaKey || e.ctrlKey || e.altKey || !document.getElementById("mini")) return;
    if (e.target.closest && e.target.closest("input, textarea, select, [contenteditable]")) return;   // only while typing does Space type
    e.preventDefault(); e.stopPropagation();                                   // never scroll, and don't also "click" a focused button or link
    video.paused ? video.play().catch(() => {}) : video.pause();
  }, true);                                                                   // capture: before anything else sees the key
  // seek: click or drag on the bar, or the arrow keys (5 s)
  const seekTo = e => { const r = seek.getBoundingClientRect(), k = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); video.currentTime = k * (video.duration || 156.6); showTime(); };
  seek.addEventListener("pointerdown", e => { seek.setPointerCapture(e.pointerId); seekTo(e); seek.onpointermove = seekTo; });
  seek.addEventListener("pointerup", () => { seek.onpointermove = null; });
  seek.addEventListener("keydown", e => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { video.currentTime = Math.max(0, video.currentTime + (e.key === "ArrowRight" ? 5 : -5)); e.preventDefault(); } });
  document.getElementById("mini-close").onclick = () => {
    video.pause(); document.getElementById("mini").remove();
    try { sessionStorage.setItem("mini", JSON.stringify({ closed: true })); } catch (e) {}
  };

  // a full reload (typed address, refresh) still picks the song up where it was
  addEventListener("pagehide", () => {
    try { sessionStorage.setItem("mini", JSON.stringify({ t: video.currentTime, playing })); } catch (e) {}
  });
  let saved = {}; try { saved = JSON.parse(sessionStorage.getItem("mini") || "{}"); } catch (e) {}
  if (saved.closed) document.getElementById("mini").remove();
  else if (saved.t) { video.currentTime = saved.t; if (saved.playing) video.play().catch(() => {}); }

  // keep the song playing across pages: links inside the site swap the page in place instead of reloading it
  const inSite = a => a && a.href && a.origin === location.origin && !a.target && !a.hasAttribute("download")
    && (/\.html$/.test(a.pathname) || a.pathname.endsWith("/")) && a.pathname !== location.pathname;
  let latest = 0;
  async function go(url, push) {
    const me = ++latest;
    let doc;
    try { const r = await fetch(url); if (!r.ok) throw 0; doc = new DOMParser().parseFromString(await r.text(), "text/html"); }
    catch (e) { location.href = url; return; }
    if (me !== latest) return;                              // a later click won
    // swap page styles: keep shared ones, drop ones the new page doesn't use, add its new ones.
    // Stylesheet links are stored with absolute hrefs so they keep working as the address changes folders.
    const key = el => el.tagName === "LINK" ? el.getAttribute("href") : el.textContent;
    doc.head.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.setAttribute("href", new URL(el.getAttribute("href"), url).href));
    const olds = [...document.head.querySelectorAll('link[rel="stylesheet"], style')];
    const news = [...doc.head.querySelectorAll('link[rel="stylesheet"], style')];
    const oldKeys = olds.map(key), newKeys = news.map(key);
    const adds = news.filter((el, i) => !oldKeys.includes(newKeys[i])).map(el => document.importNode(el, true));
    // new stylesheets load first without applying (media "print"), so the page never shows unstyled or half-styled
    const links = adds.filter(el => el.tagName === "LINK");
    links.forEach(el => { el.dataset.media = el.getAttribute("media") || ""; el.media = "print"; document.head.append(el); });
    await Promise.all(links.map(el => new Promise(done => { el.onload = el.onerror = done; setTimeout(done, 3000); })));
    if (me !== latest) { links.forEach(el => el.remove()); return; }
    // then everything changes in one frame
    if (push) history.pushState({}, "", url);
    links.forEach(el => { if (el.dataset.media) el.media = el.dataset.media; else el.removeAttribute("media"); delete el.dataset.media; });
    adds.filter(el => el.tagName === "STYLE").forEach(el => document.head.append(el));
    olds.forEach((el, i) => { if (!newKeys.includes(oldKeys[i])) el.remove(); });
    document.title = doc.title;
    document.body.className = doc.body.className;
    document.querySelector("main").replaceWith(document.importNode(doc.querySelector("main"), true));
    // run the new page's own inline scripts (e.g. the homepage's month caption)
    // (as real <script> elements, not new Function, so a Content-Security-Policy can allow them by hash)
    doc.body.querySelectorAll("script:not([src])").forEach(sc => { const s = document.createElement("script"); s.textContent = sc.textContent; document.body.append(s); s.remove(); });
    if (push) scrollTo(0, 0);
  }
  document.head.querySelectorAll('link[rel="stylesheet"]').forEach(el => el.setAttribute("href", el.href));
  document.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // a link to the page you're on (the top bar's name or current section) scrolls up instead of reloading
    if (a && a.href && a.origin === location.origin && !a.target && a.pathname === location.pathname && !a.hash) { e.preventDefault(); scrollTo(0, 0); return; }
    if (!inSite(a)) return;
    e.preventDefault(); go(a.href, true);
  });
  addEventListener("popstate", () => go(location.href, false));
})();
