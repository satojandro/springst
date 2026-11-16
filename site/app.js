/* Spring St Blind Date: app logic (rendering, state, events).
   Data lives in data/policies.js and data/ballot.js. AI calls go through ai.js. */
const BALLOT = window.BALLOT;
const ABC_SEAT = slug => `https://www.abc.net.au/news/elections/vic/2026/guide/${slug}/`;
/* ============================================================
   STATE (per-viewer, kept in this browser only)
   ============================================================ */
const KEY = "ssbd-v2";
const LETTERS = "ABCDEFGH".split("");
function freshState(){
  return { screen:"intro", i:0,
    order: Object.fromEntries(AREAS.map(a=>[a.id, [...shuffle(MAJORS), ...shuffle(minorsOf(a))]])),
    picks:{}, weight:{}, peek:{}, tab:{}, chats:{} };
}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let S;
try{ S = JSON.parse(localStorage.getItem(KEY)) || freshState(); }catch(e){ S = freshState(); }
if(!S.order || AREAS.some(a=>!S.order[a.id] || S.order[a.id].length!==Object.keys(a.opts).length)) S = freshState();
S.chats = S.chats || {}; S.tab = {};
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

/* ============================================================
   AI SIDEKICK (via ai.js: Claude in an artifact, the worker on the public site, or off)
   ============================================================ */
let samplePromise = window.SpringstAI.getSampler();
let sampleFn = undefined; samplePromise.then(f=>{ sampleFn = f; if(document.querySelector("[data-chat]")) render(); });
let aiDisabled = false; let ctl = null; let busy = false;

function areaPrompt(a){
  const ord = S.order[a.id];
  const opts = ord.map((p,k)=>`Option ${LETTERS[k]}: "${a.opts[p].h}"\n - ${a.opts[p].b.join("\n - ")}`).join("\n\n");
  const pick = S.picks[a.id];
  const pickTxt = !pick ? "The user hasn't picked yet." : pick==="none" ? "The user said none of these fit." : `The user currently leans towards Option ${LETTERS[ord.indexOf(pick)]}.`;
  return `You are "Sidekick", a friendly, even-handed explainer inside a blind policy quiz for the Victorian (Australia) state election on Saturday 28 November 2026. Today is ${new Date().toDateString()}.

This screen is about: ${a.tag}. ${a.context}

The user sees these options, labelled by letter only. A to D come from the bigger parties; any later letters come from smaller parties. The quiz is BLIND: never name or hint at which party is behind any option, even if you think you recognise it. If asked, say the big reveal happens at the end of the quiz.

${opts}

${pickTxt}

How to help:
- Help them think; never tell them what to pick or how to vote.
- Explain trade-offs: likely costs, who benefits, who pays, what supporters and critics argue, and what evidence exists.
- When asked to argue for or against something, steelman it fairly.
- Keep replies under 120 words unless asked for more. Plain Australian English, warm, a little playful. No headings. Short bullet points are fine.
- If you're unsure of a fact, or it may have changed after your training data, say so and point them to the "Learn more" tab.`;
}
function resultsPrompt(){
  const lines = AREAS.map(a=>{
    const p = S.picks[a.id];
    const own = S.order[a.id].map(k=>`${PARTIES[k].name}: ${a.opts[k].h}`).join("; ");
    const w = ["","low","medium","high"][S.weight[a.id]||2];
    return `- ${a.tag} (importance ${w}). User picked: ${p&&p!=="none"?PARTIES[p].name+' ("'+a.opts[p].h+'")':"none"}. Options were ${own}.`;
  }).join("\n");
  const sc = scores().map(r=>`${PARTIES[r.k].name} ${r.pct}%`).join(", ") + ". Smaller parties (picked / areas they had a plan in): " + minorScores().map(r=>`${PARTIES[r.k].name} ${r.hit}/${r.of}`).join(", ");
  return `You are "Sidekick", a friendly, even-handed explainer. The user just finished a blind policy quiz for the Victorian state election on 28 November 2026 and has now seen which party is behind each option.

Their answers:
${lines}

Weighted match: ${sc}.

${(()=>{ const d = S.district && BALLOT.d[S.district]; return d ? `Their district is ${S.district} (${d.m}${d.h? ", held by "+d.h:""}). Lower house candidates in ballot order: ${d.c.map(c=>c[0]+" ("+c[1]+(c[4]?", sitting MP":"")+")").join("; ")}. Upper house region: ${d.r}.` : "They haven't entered a postcode."; })()}

Help them make sense of the result. Be balanced and never tell them how to vote. Useful things: point out where their picks split across parties, what tensions exist between their choices, and how preferential voting works in Victoria (numbering every box on the lower house ballot means their vote flows on by preference). Smaller parties only appeared where they have a published plan, and many only run in some districts or only in the upper house, so remind them to check who's actually on their ballot at the VEC website. Independents weren't in the quiz because they don't share a platform; suggest reading their local independents' own websites. Under 150 words unless asked for more. Plain Australian English, warm, a little playful. If unsure of a fact, say so.`;
}

async function askAI(key, text, buildPrompt){
  if(busy || !sampleFn || aiDisabled) return;
  const hist = S.chats[key] = S.chats[key] || [];
  hist.push({role:"user", content:text});
  busy = true; ctl = new AbortController();
  const bot = {role:"assistant", content:"", pending:true};
  hist.push(bot); render(); scrollChat();
  try{
    const turns = [{role:"user", content:buildPrompt()},
      ...hist.filter(m=>!m.pending && !m.err).slice(-12)];
    const { text:out } = await sampleFn(turns, { cache:false, modelTier:"quick", signal:ctl.signal,
      onText:({text})=>{ bot.content = text; bot.pending = false; updateLastBubble(text); } });
    bot.content = out; bot.pending = false;
  }catch(e){
    const code = e && e.code;
    if(code==="cancelled"){ bot.content = e.text || "(stopped)"; bot.pending=false; }
    else {
      hist.pop();
      if(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"].includes(code)){ aiDisabled = true; }
      hist.push({role:"assistant", err:true, content: code==="rate_limited" ? "Sidekick needs a breather. Try again in a minute." :
        code==="refused" ? "Sidekick couldn't answer that one. Try rephrasing." :
        aiDisabled ? "The AI chat is switched off for this view." : "Something went wrong reaching Claude. Tap send to try again."});
    }
  }finally{ busy = false; ctl = null; save(); render(); scrollChat(); }
}
function updateLastBubble(t){ const els = document.querySelectorAll(".msgs .msg.bot"); const el = els[els.length-1]; if(el){ el.textContent = t; scrollChat(); } }
function scrollChat(){ const m = document.querySelector(".msgs"); if(m) m.scrollTop = m.scrollHeight; }

/* ============================================================
   RENDER
   ============================================================ */
const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function daysLeft(){ const d = Math.ceil((ELECTION - new Date())/86400000); return d>1 ? `${d} days to election day` : d===1 ? "Election day is tomorrow" : d===0 ? "It's election day" : "Election day: 28 Nov 2026"; }

function topBar(){
  const prog = S.screen==="q" || S.screen==="results" ? `<div class="progress" aria-label="Progress">${AREAS.map((a,k)=>`<span class="${S.screen==='results'||S.picks[a.id]? 'done':''} ${S.screen==='q'&&k===S.i?'now':''}"></span>`).join("")}</div>` : "";
  return `<div class="top"><a class="brand" href="index.html"><span class="dot"></span>Spring St Blind Date</a><span class="countdown">${daysLeft()}</span></div>${prog}`;
}

function intro(){
  const answered = Object.keys(S.picks).length;
  return `${topBar()}
  <section class="card hero">
    <p class="eyebrow">Victorian state election · 28 November 2026</p>
    <h1 style="margin-top:8px">Which party <mark>actually</mark> agrees with you?</h1>
    <p class="lede">Ten policy areas. Real plans from the big parties and smaller ones. No logos, no names, no leader headshots. Pick what you like, and find out who's behind it at the end.</p>
    <div class="rules">
      <div class="rule"><b>10 screens</b><span>One area at a time. About 6 minutes.</span></div>
      <div class="rule"><b>Totally blind</b><span>Options are shuffled and unlabelled until the reveal.</span></div>
      <div class="rule"><b>Go deeper</b><span>Articles from across the spectrum, live chatter and an AI sidekick on every screen.</span></div>
    </div>
    <div class="cta-row">
      <button class="btn primary" data-act="start">${answered? "Keep going" : "Let's go"}</button>
      <button class="btn" data-act="ballot">Who's on my ballot?</button>
      ${answered? `<button class="ghost" data-act="reset">Start over</button>`:""}
    </div>
  </section>
  <p class="footer">Covers Labor, the Liberal–Nationals Coalition, the Greens, One Nation and 11 smaller parties with published policies, as of 15 Nov 2026. Independents are covered on the results page. Your answers stay in this browser.</p>`;
}

function question(){
  const a = AREAS[S.i]; const ord = S.order[a.id]; const pick = S.picks[a.id]; const w = S.weight[a.id] || 2;
  const tab = S.tab[a.id] || null;
  return `${topBar()}
  <section class="card" aria-labelledby="qh">
    <div class="qhead">
      <p class="eyebrow">${S.i+1} of ${AREAS.length} · ${esc(a.tag)}</p>
      <h2 id="qh">${esc(a.title)}</h2>
      <p class="sub">${esc(a.sub)}</p>
      <p class="context"><b>Quick context:</b> ${esc(a.context)}</p>
    </div>
    <div class="opts" role="group" aria-label="Options from the bigger parties">
      ${ord.slice(0,4).map((p,k)=>optCard(a,p,k,pick)).join("")}
    </div>
    ${ord.length>4? `<div class="minor-head"><span>From smaller parties</span><i></i></div>
    <div class="opts minor" role="group" aria-label="Options from smaller parties">
      ${ord.slice(4).map((p,k)=>optCard(a,p,k+4,pick)).join("")}
    </div>`:""}
    <div class="none-row"><button class="chip" data-pick="none" aria-pressed="${pick==='none'}">None of these feel right</button></div>
    <div class="weight"><span class="label">How much does this matter to you?</span>
      ${[[1,"Meh"],[2,"It matters"],[3,"Dealbreaker"]].map(([v,l])=>`<button class="chip" data-w="${v}" aria-pressed="${w===v}">${l}</button>`).join("")}
    </div>
    <div class="nav">
      <button class="btn small" data-act="back">${S.i===0?"Home":"Back"}</button>
      <button class="btn primary" data-act="next" ${pick?"":"disabled"}>${S.i===AREAS.length-1?"Reveal my matches":"Next"}</button>
    </div>
  </section>
  <section class="extras" aria-label="Dig deeper">
    <div class="tabs" role="tablist">
      ${tabBtn(a,"learn","Learn more", ICON.book)}
      ${tabBtn(a,"live","Live chatter", ICON.live)}
      ${tabBtn(a,"chat","Talk it out", ICON.chat)}
    </div>
    ${tab==="learn"? learnPanel(a): tab==="live"? livePanel(a): tab==="chat"? chatPanel(a.id, a, ()=>areaPrompt(a), STARTERS): ""}
  </section>`;
}
function optCard(a,p,k,pick){ return `<button class="opt" data-pick="${p}" aria-pressed="${pick===p}">
        <span class="tick">YOUR PICK</span>
        <span class="letter">${LETTERS[k]}</span>
        <h3>${esc(a.opts[p].h)}</h3>
        <ul>${a.opts[p].b.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      </button>`; }
const ICON = {
  book:`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>`,
  live:`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="2.5" fill="currentColor"/><path d="M7.5 7.5a6.4 6.4 0 0 0 0 9M16.5 7.5a6.4 6.4 0 0 1 0 9M4.6 4.6a10.5 10.5 0 0 0 0 14.8M19.4 4.6a10.5 10.5 0 0 1 0 14.8"/></svg>`,
  chat:`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4z"/></svg>`
};
function tabBtn(a,id,label,icon){ return `<button class="tab" role="tab" data-tab="${id}" aria-selected="${S.tab[a.id]===id}">${icon}${label}</button>`; }

function spoilerGate(a, inner){
  const open = S.peek[a.id] || S.picks[a.id];
  return `${open? "" : `<div class="spoiler"><p><b>Spoiler alert.</b> Real articles name parties, which un-blinds this question. Pick first, or peek if you'd rather know.</p><button class="btn small" data-act="peek">Peek anyway</button></div>`}
  <div class="${open?"":"blur"}" ${open?"":'aria-hidden="true"'}>${inner}</div>`;
}
function learnPanel(a){
  const list = [...a.res, TRACKER, ...(minorsOf(a).length && a.id!=="bush" ? [MINOR_EXPLAINER] : []), PBO];
  return `<div class="panel" role="tabpanel"><h3>Learn more</h3>
  <p class="note">A mix of outlets on purpose. Lean labels are a rough guide to each outlet's general reputation, not a rating of each article. "Industry" and "Advocacy" groups argue for their members.</p>
  ${spoilerGate(a, `<ul class="res">${list.map(r=>`<li><div style="min-width:0"><a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t)}</a><span class="src">${esc(r.s)}</span></div><span class="lean ${r.lean}">${esc(r.l)}</span></li>`).join("")}</ul>`)}
  </div>`;
}
function livePanel(a){
  const q = a.live;
  const links = [
    {b:"X · Latest posts", s:"Live search of the conversation on X", u:"https://x.com/search?f=live&q="+encodeURIComponent(q)},
    {b:"Bluesky · Latest", s:"Same topic on Bluesky", u:"https://bsky.app/search?q="+encodeURIComponent(a.tag+" Victoria election")},
    {b:"r/melbourne · Newest", s:"What locals are saying on Reddit", u:"https://www.reddit.com/r/melbourne/search/?sort=new&q="+encodeURIComponent(a.tag.split(/[ ,&]/)[0]+" election")},
    {b:"YouTube · This week", s:"Recent videos and debate clips", u:"https://www.youtube.com/results?sp=EgQIAxAB&search_query="+encodeURIComponent(a.tag+" Victorian election 2026")}
  ];
  return `<div class="panel" role="tabpanel"><h3><span class="pulse" aria-hidden="true"></span>Live chatter</h3>
  <p class="note">Each link opens the newest posts on this topic, live, in a new tab. Social feeds are loud and not fact-checked, so take them as vibes, not facts.</p>
  ${spoilerGate(a, `<div class="live-grid">${links.map(l=>`<a class="live" href="${esc(l.u)}" target="_blank" rel="noopener"><b>${l.b}</b><span>${esc(l.s)}</span></a>`).join("")}</div>`)}
  </div>`;
}
const STARTERS = ["Explain this like I'm 15","What are the trade-offs?","Which option costs the most?","Argue against my pick","What do experts say?"];
const RSTARTERS = ["What does my result say about me?","Where did my picks clash?","How do preferences work?","What should I ask an independent candidate?"];
function chatPanel(key, a, buildPrompt, starters){
  const hist = S.chats[key] || [];
  let body;
  if(sampleFn===undefined) body = `<p class="note">Waking up Sidekick…</p>`;
  else if(sampleFn===null || aiDisabled) body = `<p class="note">The AI chat isn't switched on for this site yet. Learn more and Live chatter still work.</p>`;
  else body = `<div class="chat" data-chat="${key}">
    <div class="msgs" aria-live="polite">
      <div class="msg bot">${key==="results" ? "Want to unpack your results? Ask me anything. I'll keep it balanced." : "Hey! I'm Sidekick. I can explain any option, poke holes in it or argue the other side. I don't know which party is which either (well, I'm not telling), so ask away."}</div>
      ${hist.map(m=>`<div class="msg ${m.err?"err":m.role==="user"?"me":"bot"}">${m.pending?"Thinking…":esc(m.content)}</div>`).join("")}
    </div>
    ${hist.length<2? `<div class="starters">${starters.map(s=>`<button data-starter="${esc(s)}">${esc(s)}</button>`).join("")}</div>`:""}
    <form class="composer" data-form="${key}">
      <label for="ci-${key}" class="eyebrow" hidden>Message</label>
      <input id="ci-${key}" placeholder="Ask Sidekick…" autocomplete="off" ${busy?"disabled":""}>
      ${busy? `<button type="button" class="btn small" data-act="stop">Stop</button>` : `<button class="btn small primary">Send</button>`}
    </form>
    <p class="note" style="font-size:12.5px">${esc(window.SpringstAI.disclaimer())}</p>
  </div>`;
  return `<div class="panel" role="tabpanel"><h3>Talk it out</h3>${body}</div>`;
}

function scores(){
  let total = 0; const s = {L:0,C:0,G:0,O:0};
  for(const a of AREAS){ const w = S.weight[a.id]||2; const p = S.picks[a.id]; if(!p) continue; total += w; if(p in s) s[p]+=w; }
  return Object.keys(s).map(k=>({k, pct: total? Math.round(100*s[k]/total) : 0, raw:s[k]})).sort((x,y)=>y.raw-x.raw);
}
function partyMatch(k){
  const areas = AREAS.filter(a=>a.opts[k] && S.picks[a.id]);
  return {hit: areas.filter(a=>S.picks[a.id]===k).length, of: areas.length};
}
function ballotSection(){
  const pc = S.pc || ""; const opts = BALLOT.p[pc];
  const dname = S.district && BALLOT.d[S.district] ? S.district : (opts ? opts[0][0] : null);
  const quizDone = AREAS.every(a=>S.picks[a.id]);
  let body = "";
  if(pc && !opts) body = `<p class="pc-msg">We couldn't find ${esc(pc)} in Victoria. Check the number, or look up your address at the <a href="https://www.vec.vic.gov.au" target="_blank" rel="noopener">VEC</a>.</p>`;
  if(opts){
    const split = opts.length>1 ? `<div class="split"><p class="fine">Postcode ${esc(pc)} is split between districts. Which one is your address in? The VEC can confirm.</p>
      <div class="chips">${opts.map(([n,pct])=>`<button class="chip" data-district="${esc(n)}" aria-pressed="${n===dname}">${esc(n)} <small>${pct}% of residents</small></button>`).join("")}</div></div>` : "";
    const d = BALLOT.d[dname];
    const rows = d.c.map((c,i)=>{
      const [name, party, key, url, sit] = c;
      let match = "";
      if(key && quizDone){ const m = partyMatch(key); match = `<span class="mt ${m.hit? "on":""}">You picked their plan ${m.hit} of ${m.of}</span>`; }
      else if(!key && party==="Independent") match = `<span class="mt">Independent: check their website</span>`;
      else if(!key) match = `<span class="mt">Not in the quiz</span>`;
      return `<li class="cand"><span class="num">${i+1}</span>
        <div class="who"><b>${esc(name)}</b>${sit?`<span class="sit">Sitting MP</span>`:""}<span class="pty">${esc(party)}</span>${match}</div>
        ${url?`<a class="site" href="${esc(url)}" target="_blank" rel="noopener">Website</a>`:""}</li>`;
    }).join("");
    const reg = BALLOT.r[d.r] || [];
    const groups = {}; reg.forEach(([n,pt,k,sit])=>{ (groups[pt]=groups[pt]||{k, names:[]}).names.push(n+(sit?" (MP)":"")); });
    const gl = Object.entries(groups).sort((a,b)=>b[1].names.length-a[1].names.length);
    body += split + `<div class="district">
      <div class="dhead"><div style="min-width:0"><p class="eyebrow">${d.a?esc(d.a)+" · ":""}upper house region: ${esc(d.r)}</p><h3>${esc(dname)}</h3>
        <p class="fine">${d.h?`Held by ${esc(d.h)}`:""}</p></div>${d.m?`<span class="margin">${esc(d.m)}</span>`:""}</div>
      <p class="eyebrow" style="margin-top:14px">Lower house ballot · in ballot-paper order</p>
      <ol class="cands">${rows}</ol>
      <p class="fine">Number every box, 1 to ${d.c.length}. Read full candidate bios on the <a href="${ABC_SEAT(d.s)}" target="_blank" rel="noopener">ABC guide to ${esc(dname)}</a>.</p>
      <details class="upper"><summary><b>Upper house: ${esc(d.r)}</b> <span class="fine">${gl.length} parties and groups, ${reg.length} candidates</span></summary>
        <p class="fine" style="margin:8px 0">Five MPs are elected per region. Voting rules changed this year when group voting tickets were abolished, so follow the instructions on the ballot paper. The order of groups on the ballot is on the VEC site.</p>
        <ul class="groups">${gl.map(([pt,g])=>{ const m = g.k && quizDone ? partyMatch(g.k) : null;
          return `<li><div style="min-width:0"><b>${esc(pt)}</b><span class="fine">${esc(g.names.join(", "))}</span></div>${m?`<span class="mt ${m.hit?"on":""}">${m.hit} of ${m.of}</span>`:""}</li>`;}).join("")}</ul>
      </details>
    </div>`;
  }
  return `<section class="card" id="ballot">
    <h2 style="font-size:28px">Who's on my ballot?</h2>
    <p class="fine" style="margin-top:6px">${quizDone ? "Enter your postcode to see your real candidates, with how often you picked each party's plan." : "Enter your postcode to see your real candidates. Finish the quiz to see how often you picked each party's plan."}</p>
    <form class="pc-form" data-form="pc">
      <label for="pc-input" class="eyebrow">Postcode</label>
      <div class="pc-row"><input id="pc-input" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" placeholder="e.g. 3101" value="${esc(pc)}" autocomplete="postal-code">
      <button class="btn small primary">Show my ballot</button></div>
    </form>
    ${body}
    <p class="fine" style="margin-top:12px">Postcodes don't follow district lines exactly, so for a definite answer enter your address at the <a href="https://www.vec.vic.gov.au" target="_blank" rel="noopener">Victorian Electoral Commission</a>. Your postcode stays in this browser.</p>
  </section>`;
}
function ballotScreen(){
  return `${topBar()}${ballotSection()}
  <div class="cta-row" style="margin-top:0"><button class="btn small" data-act="home">Back to the quiz</button></div>`;
}
function minorScores(){
  return Object.keys(PARTIES).filter(k=>PARTIES[k].minor).map(k=>{
    const areas = AREAS.filter(a=>a.opts[k] && S.picks[a.id]);
    const hits = areas.filter(a=>S.picks[a.id]===k);
    return {k, of:areas.length, hit:hits.length, areas:hits.map(a=>a.tag)};
  }).filter(r=>r.of>0).sort((x,y)=> (y.hit/y.of - x.hit/x.of) || (y.hit-x.hit) || (y.of-x.of));
}
function results(){
  const sc = scores(); const top = sc[0]; const tie = sc.filter(r=>r.raw===top.raw).length>1;
  const spread = sc.filter(r=>r.raw>0).length;
  const mhits = minorScores().reduce((n,r)=>n+r.hit,0);
  const vibe = top.raw===0 && mhits ? "Off the beaten track" : top.raw===0 ? "A true free agent" : tie ? "Torn between two (or more)" : top.pct>=70 ? "Pretty clear-cut" : spread>=3 ? "Proud policy mix-and-matcher" : "Leaning one way";
  const headline = top.raw===0 && mhits ? "The smaller parties won you over" : top.raw===0 ? "None of the plans won you over" : tie ? `It's a tie: ${sc.filter(r=>r.raw===top.raw).map(r=>PARTIES[r.k].name).join(" and ")}` : `Your closest match: ${PARTIES[top.k].name}`;
  return `${topBar()}
  <section class="card result-hero">
    <p class="eyebrow">The big reveal · ${esc(vibe)}</p>
    <h2 style="margin-top:6px">${esc(headline)}</h2>
    ${top.raw>0 && !tie ? `<p class="big" style="margin-top:8px">${top.pct}%</p><p class="fine">of what matters to you, weighted by how much each area matters.</p>`:""}
    <div class="bars">
      ${sc.map((r,k)=>`<div class="bar-row ${k===0&&r.raw>0&&!tie?"top1":""}"><span class="name">${PARTIES[r.k].name}</span><div class="bar"><i data-w="${r.pct}"></i></div><span class="pct">${r.pct}%</span></div>`).join("")}
    </div>
    <div class="cta-row">
      <button class="btn small" data-act="review">Change answers</button>
      <button class="btn small" data-act="copy">Copy my result</button>
      <button class="ghost" data-act="reset">Start over</button>
      <span class="fine" id="copied" aria-live="polite"></span>
    </div>
  </section>

  ${ballotSection()}

  <section class="card">
    <h2 style="font-size:28px">Smaller parties</h2>
    <p class="fine" style="margin-top:6px">Smaller parties only appeared on screens where they have a published plan, so this counts how often you picked them when they were an option. A small party you matched on 1 of 1 isn't a 100% match, just one thing in common.</p>
    <div class="minor-list">
      ${minorScores().map(r=>`<div class="mrow ${r.hit?"hit":""}">
        <div style="min-width:0"><b>${esc(PARTIES[r.k].name)}</b><span class="where">${esc(PARTIES[r.k].where)}</span>${r.hit?`<span class="where">You picked them on: ${esc(r.areas.join(", "))}</span>`:""}</div>
        <span class="score">${r.hit}<small> of ${r.of}</small></span></div>`).join("")}
    </div>
    <p class="fine" style="margin-top:10px">Many smaller parties only run in some districts or only in the upper house. We left out parties that have published little or no policy. <a href="${MINOR_EXPLAINER.u}" target="_blank" rel="noopener">See the full list of 19 smaller parties (ABC)</a>.</p>
  </section>

  <section class="card">
    <h2 style="font-size:28px">What about independents?</h2>
    <p style="margin-top:8px">Independents don't share a platform, so they can't be put into a quiz like this. Each one runs on their own local priorities, so the only way to compare them is seat by seat.</p>
    <ul class="fine">
      <li>Climate 200, which funds climate and integrity-focused independents, is backing candidates in <b>Hawthorn, Kew, Mornington and Footscray</b>.</li>
      <li>Other independents are running on being community-focused and not answering to a party.</li>
      <li>No independents won a lower house seat at the 2022 state election, but several seats this year are expected to be close.</li>
    </ul>
    <div class="res-mini">
      <a class="live" href="https://www.vec.vic.gov.au" target="_blank" rel="noopener"><b>Who's on my ballot?</b><span>Victorian Electoral Commission: find your district and every candidate</span></a>
      <a class="live" href="https://en.wikipedia.org/wiki/Candidates_of_the_2026_Victorian_state_election" target="_blank" rel="noopener"><b>Every candidate, by seat</b><span>Wikipedia list of 2026 candidates</span></a>
      <a class="live" href="https://www.crikey.com.au/2026/10/21/victorian-election-independent-candidates-teals-caulfield-hawthorn-kew-mornington/" target="_blank" rel="noopener"><b>Where the teals at?</b><span>Crikey on the independents' campaigns · <span class="lean left" style="font-size:10.5px;padding:1px 7px">Leans left</span></span></a>
      <a class="live" href="https://antonygreen.com.au/2026-victorian-election-pendulum/" target="_blank" rel="noopener"><b>Election pendulum</b><span>Antony Green: how close every seat is · <span class="lean neutral" style="font-size:10.5px;padding:1px 7px">Neutral</span></span></a>
    </div>
    <p class="fine" style="margin-top:10px">Tip: ask Sidekick below "What should I ask an independent candidate?"</p>
  </section>

  <section class="card">
    <h2 style="font-size:28px">Who was behind each option</h2>
    <div class="reveal">
      ${AREAS.map(a=>{ const p=S.picks[a.id]; const w=["","Meh","It matters","Dealbreaker"][S.weight[a.id]||2];
        return `<div class="rv"><h3>${esc(a.tag)} <small>${p==="none"?"None fit":""} · ${w}</small></h3>
        <div class="rv-list">${S.order[a.id].map((k,i)=>`<div class="rv-item ${p===k?"picked":""} ${PARTIES[k].minor?"is-minor":""}"><span class="who">${LETTERS[i]} · ${PARTIES[k].name}${p===k?" · your pick":""}</span><b>${esc(a.opts[k].h)}</b></div>`).join("")}</div></div>`;}).join("")}
    </div>
  </section>

  <section class="extras">${chatPanel("results", null, resultsPrompt, RSTARTERS)}</section>

  <section class="card fine">
    <h3 style="font-size:20px;color:var(--ink)">Before you vote</h3>
    <ul>
      <li>This is a policy match, not advice. Leaders, local candidates, track records and whether promises are costed matter too.</li>
      <li>Smaller parties and independents only stand in some places. Check who's actually on your ballot at the <a href="https://www.vec.vic.gov.au" target="_blank" rel="noopener">Victorian Electoral Commission</a>.</li>
      <li>Voting is compulsory. In the lower house, number every box: your vote flows by preference, so ranking matters more than just your number 1.</li>
      <li>Costings: the <a href="${PBO.u}" target="_blank" rel="noopener">Parliamentary Budget Office</a> publishes independent costings of party promises.</li>
      <li>Policy summaries are from the <a href="${TRACKER.u}" target="_blank" rel="noopener">ABC policy tracker</a> (13 Nov 2026) and the <a href="${MINOR_EXPLAINER.u}" target="_blank" rel="noopener">ABC minor parties explainer</a> (15 Nov 2026). Parties may announce more before polling day.</li>
    </ul>
  </section>`;
}

function render(){
  const focusId = document.activeElement && document.activeElement.id;
  app.innerHTML = S.screen==="intro" ? intro() : S.screen==="q" ? question() : S.screen==="ballot" ? ballotScreen() : results();
  if(S.screen==="results") requestAnimationFrame(()=>document.querySelectorAll(".bar i").forEach(i=>i.style.width=i.dataset.w+"%"));
  if(focusId){ const el = document.getElementById(focusId); if(el) el.focus(); }
  scrollChat();
}

/* ============================================================
   EVENTS
   ============================================================ */
app.addEventListener("click", e=>{
  const t = e.target.closest("button"); if(!t) return;
  const a = AREAS[S.i];
  if(t.dataset.pick){ S.picks[a.id] = t.dataset.pick; if(!S.weight[a.id]) S.weight[a.id]=2; save(); render(); return; }
  if(t.dataset.w){ S.weight[a.id] = +t.dataset.w; save(); render(); return; }
  if(t.dataset.district){ S.district = t.dataset.district; save(); render(); return; }
  if(t.dataset.tab){ S.tab[a.id] = S.tab[a.id]===t.dataset.tab ? null : t.dataset.tab; render(); return; }
  if(t.dataset.starter){ const key = S.screen==="results"?"results":a.id; askAI(key, t.dataset.starter, key==="results"?resultsPrompt:()=>areaPrompt(a)); return; }
  switch(t.dataset.act){
    case "start": S.screen="q"; S.i = Math.min(AREAS.findIndex(x=>!S.picks[x.id]) < 0 ? 0 : AREAS.findIndex(x=>!S.picks[x.id]), AREAS.length-1); break;
    case "next": if(S.i<AREAS.length-1){ S.i++; } else { S.screen="results"; setTimeout(confetti, 150); } break;
    case "back": if(S.i===0) S.screen="intro"; else S.i--; break;
    case "peek": S.peek[a.id]=true; break;
    case "review": S.screen="q"; S.i=0; break;
    case "reset": S = freshState(); break;
    case "stop": ctl && ctl.abort(); return;
    case "copy": copyResult(); return;
    case "ballot": S.screen="ballot"; break;
    case "home": S.screen="intro"; break;
    default: return;
  }
  save(); render(); window.scrollTo({top:0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto":"smooth"});
});
app.addEventListener("submit", e=>{
  e.preventDefault(); const f = e.target; const key = f.dataset.form; const inp = f.querySelector("input");
  if(key==="pc"){ const v = inp.value.replace(/\D/g,"").slice(0,4); S.pc = v; S.district = BALLOT.p[v] ? BALLOT.p[v][0][0] : null; save(); render(); return; }
  const v = inp.value.trim(); if(!v) return; inp.value = "";
  const a = AREAS[S.i];
  askAI(key, v, key==="results"?resultsPrompt:()=>areaPrompt(a));
});
function copyResult(){
  const sc = scores();
  const txt = `My Spring St Blind Date result (Vic election 2026): ${sc.map(r=>`${PARTIES[r.k].name} ${r.pct}%`).join(" · ")}. Picked policies blind, revealed parties after.`;
  const out = document.getElementById("copied");
  try{ navigator.clipboard.writeText(txt).then(()=>{out.textContent="Copied!"}, ()=>{out.textContent=txt}); }catch(err){ out.textContent = txt; }
}

/* confetti, once, on the reveal */
function confetti(){
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const c = document.getElementById("confetti"), x = c.getContext("2d");
  const W = c.width = innerWidth, H = c.height = innerHeight;
  const cs = getComputedStyle(document.documentElement);
  const cols = ["--pink","--sun","--grape"].map(v=>cs.getPropertyValue(v).trim());
  const P = Array.from({length:140},()=>({x:Math.random()*W, y:-20-Math.random()*H*.4, r:4+Math.random()*6, vx:-1.5+Math.random()*3, vy:2+Math.random()*3.5, a:Math.random()*6, c:cols[Math.floor(Math.random()*3)]}));
  let f=0; (function tick(){ x.clearRect(0,0,W,H); P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.a+=.1; x.save(); x.translate(p.x,p.y); x.rotate(p.a); x.fillStyle=p.c; x.fillRect(-p.r/2,-p.r/4,p.r,p.r/2); x.restore();}); if(++f<170) requestAnimationFrame(tick); else x.clearRect(0,0,W,H); })();
}

/* Entry points from the landing page: quiz.html#start and quiz.html#ballot.
   A postcode typed on the landing page arrives via sessionStorage. */
function routeFromHash(){
  const h = location.hash.slice(1);
  if(h==="start" && S.screen!=="q" && S.screen!=="results"){ S.screen="q"; const n=AREAS.findIndex(x=>!S.picks[x.id]); S.i = n<0 ? 0 : n; }
  if(h==="ballot"){
    S.screen="ballot";
    try{ const pc = sessionStorage.getItem("ssbd-pending-pc"); if(pc){ sessionStorage.removeItem("ssbd-pending-pc"); S.pc = pc; S.district = BALLOT.p[pc] ? BALLOT.p[pc][0][0] : null; } }catch(e){}
  }
  if(h) history.replaceState(null, "", location.pathname);
}
routeFromHash();
render();
