/* AI adapter.
   Exposes window.SpringstAI.getSampler(), which resolves to a function with the same call shape
   as the claude.ai artifact `sample` capability:

     sampler(turns, { onText({text, delta}), signal }) -> Promise<{ text }>
     rejects with { code, message, text? }

   Order of preference:
     1. Inside a claude.ai artifact: claude.use("sample") (the viewer's own Claude account).
     2. On the public site: POST to SPRINGST_CONFIG.aiEndpoint (see worker/).
     3. Neither: resolves null, and the page hides the chat.
*/
(function () {
  const cfg = window.SPRINGST_CONFIG || {};
  let mode = "none";

  function endpointSampler(url) {
    return async function sampler(turns, opts = {}) {
      // The first turn is the page's own instructions + quiz context; the rest is the chat.
      const [context, ...messages] = turns;
      let res;
      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ context: context.content, messages }),
          signal: opts.signal
        });
      } catch (e) {
        if (e && e.name === "AbortError") throw { code: "cancelled", message: "Stopped" };
        throw { code: "upstream_error", message: String(e) };
      }
      let body = {};
      try { body = await res.json(); } catch (e) { /* fall through */ }
      if (!res.ok) {
        const code = res.status === 429 ? "rate_limited" : (body.code || "upstream_error");
        throw { code, message: body.message || `HTTP ${res.status}` };
      }
      const text = String(body.text || "");
      if (!text.trim()) throw { code: "empty_completion", message: "No reply" };
      if (opts.onText) opts.onText({ text, delta: text });
      return { text, truncated: !!body.truncated };
    };
  }

  async function getSampler() {
    if (window.claude && window.claude.use) {
      try {
        const s = await window.claude.use("sample");
        if (s) { mode = "claude"; return s; }
      } catch (e) { /* not available here */ }
    }
    if (cfg.aiEndpoint) { mode = "endpoint"; return endpointSampler(cfg.aiEndpoint); }
    return null;
  }

  function disclaimer() {
    return mode === "claude"
      ? "Uses your Claude account. AI can get things wrong, so check facts in Learn more."
      : "AI can get things wrong, so check facts in Learn more. Don't share personal details in the chat.";
  }

  window.SpringstAI = { getSampler, disclaimer };
})();
