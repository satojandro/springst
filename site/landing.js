/* Landing page behaviour. Everything shown is computed from data/policies.js and data/ballot.js,
   so the page never drifts from the quiz. Options in the sample stay blind (no party names). */
(function () {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LETTERS = "ABCDEFGH";
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  // Countdown
  const ELECTION = new Date("2026-11-28T08:00:00+11:00");
  const d = Math.ceil((ELECTION - new Date()) / 86400000);
  $("lp-days").textContent = d > 1 ? `${d} days to go` : d === 1 ? "Tomorrow" : d === 0 ? "Today" : "Results are in";

  // Stats
  const fmt = (n) => n.toLocaleString("en-AU");
  const B = window.BALLOT;
  const stats = {
    areas: AREAS.length,
    parties: Object.keys(PARTIES).length,
    candidates: Object.values(B.d).reduce((n, x) => n + x.c.length, 0) + Object.values(B.r).reduce((n, x) => n + x.length, 0),
    districts: Object.keys(B.d).length,
  };
  document.querySelectorAll("[data-stat]").forEach((el) => { el.textContent = fmt(stats[el.dataset.stat]); });

  // Areas
  $("lp-areas").innerHTML = AREAS.map((a) => `<li><b>${esc(a.title)}</b><span>${esc(a.tag)}</span></li>`).join("");

  // Sample question: a random area, the four big-party options, shuffled and blind
  let last = null;
  function sample() {
    let a; do { a = AREAS[Math.floor(Math.random() * AREAS.length)]; } while (AREAS.length > 1 && a === last);
    last = a;
    $("lp-sample-tag").textContent = `Try one · ${a.tag}`;
    $("lp-sample-title").textContent = a.title;
    $("lp-sample-opts").innerHTML = shuffle(MAJORS).map((k, i) =>
      `<button class="lp-opt" type="button" aria-pressed="false"><span class="letter">${LETTERS[i]}</span><span>${esc(a.opts[k].h)}</span></button>`).join("");
    $("lp-sample-msg").textContent = "Tap the one you like. No peeking at who's behind it.";
    $("lp-sample-go").hidden = true;
  }
  $("lp-sample-opts").addEventListener("click", (e) => {
    const b = e.target.closest(".lp-opt"); if (!b) return;
    document.querySelectorAll(".lp-opt").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    $("lp-sample-msg").textContent = "Good pick. The quiz reveals who's behind it at the end.";
    $("lp-sample-go").hidden = false;
  });
  $("lp-shuffle").addEventListener("click", sample);
  sample();

  // Postcode -> quiz ballot view
  $("lp-pc-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const pc = $("lp-pc").value.replace(/\D/g, "").slice(0, 4);
    if (!B.p[pc]) {
      $("lp-pc-msg").textContent = pc.length === 4 ? `We couldn't find ${pc} in Victoria. Check the number, or look up your address at the VEC.` : "Enter a four-digit postcode.";
      return;
    }
    try { sessionStorage.setItem("ssbd-pending-pc", pc); } catch (err) { /* the quiz page will ask again */ }
    location.href = "quiz.html#ballot";
  });
})();
