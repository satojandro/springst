/* Shared footer: electoral authorisation, sources, and where to report errors.
   Used by index.html (landing) and quiz.html. Reads window.SPRINGST_CONFIG from config.js. */
(function renderFooter(){
  const cfg = window.SPRINGST_CONFIG || {};
  const f = document.getElementById("site-footer"); if(!f) return;
  const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const TRACKER = "https://www.abc.net.au/news/2026-11-04/victoria-2026-election-policy-promise-tracker/107247200";
  const MINORS = "https://www.abc.net.au/news/2026-11-14/victoria-2026-state-election-independent-party-explainer/107342014";
  f.innerHTML = `
    ${cfg.authorisation ? `<p class="auth">${esc(cfg.authorisation)}</p>` : ""}
    <p>Independent and non-partisan. Not affiliated with any party, candidate or the VEC. Policy summaries from the
      <a href="${TRACKER}" target="_blank" rel="noopener">ABC policy tracker</a> and
      <a href="${MINORS}" target="_blank" rel="noopener">minor parties explainer</a>; candidates from the ABC election guide; postcodes from the ABS.</p>
    ${cfg.repoUrl ? `<p>Spotted an error? <a href="${esc(cfg.repoUrl)}/issues/new/choose" target="_blank" rel="noopener">Report it</a> · <a href="${esc(cfg.repoUrl)}" target="_blank" rel="noopener">Source code</a></p>` : ""}`;
})();
