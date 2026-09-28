// the top bar's button hides the music visuals (music.js, speakers.js) and remembers the choice; the song keeps playing
(() => {
  const root = document.documentElement;
  try { if (localStorage.getItem("visuals") === "off") root.dataset.visuals = "off"; } catch (e) {}
  document.addEventListener("click", e => {
    if (!e.target.closest(".topbar .mode")) return;
    const off = root.dataset.visuals !== "off";
    if (off) root.dataset.visuals = "off"; else delete root.dataset.visuals;
    try { localStorage.setItem("visuals", off ? "off" : "on"); } catch (e) {}
  });
})();
