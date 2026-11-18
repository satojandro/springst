/* Spring St Blind Date: app logic (rendering, state, events).
   Data lives in data/policies.js and data/ballot.js. */
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
    picks:{}, weight:{}, peek:{}, tab:{} };
}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
let S;
try{ S = JSON.parse(localStorage.getItem(KEY)) || freshState(); }catch(e){ S = freshState(); }
if(!S.order || AREAS.some(a=>!S.order[a.id] || S.order[a.id].length!==Object.keys(a.opts).length)) S = freshState();
delete S.chats; S.tab = {}; // chats: left over from when the site had an AI chat
function save(){ try{ localStorage.setItem(KEY, JSON.stringify(S)); }catch(e){} }

/* ============================================================
   RENDER
   ============================================================ */
const app = document.getElementById("app");
const esc = s => String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function daysLeft(){ const d = Math.ceil((ELECTION - new Date())/86400000); return d>1 ? `${d} days to election day` : d===1 ? "Election day is tomorrow" : d===0 ? "It's election day" : "Election day: 28 Nov 2026"; }

function topBar(){
  const prog = S.screen==="q" || S.screen==="results" ? `<div class="progress" aria-label="Progress">${AREAS.map((a,k)=>`<span class="${S.screen==='results'||S.picks[a.id]? 'done':''} ${S.screen==='q'&&k===S.i?'now':''}"></span>`).join("")}</div>` : "";
  return `<div class="top"><div class="brand"><span class="dot"></span>Spring St Blind Date</div><span class="countdown">${daysLeft()}</span></div>${prog}`;
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
      <div class="rule"><b>Go deeper</b><span>Media from across the spectrum, labelled by lean, plus the live conversation on X.</span></div>
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
  <section class="card qcard" aria-labelledby="qh">
    <div class="qhead">
      <p class="eyebrow">${S.i+1} of ${AREAS.length} · ${esc(a.tag)}</p>
      <h2 id="qh">${esc(a.title)}</h2>
      <p class="sub">${esc(a.sub)}</p>
      <p class="context"><b>Quick context:</b> ${esc(a.context)}</p>
    </div>
    <aside class="extras${tab==="learn"?" open":""}" aria-labelledby="learn-h">
      <button class="tab xtoggle" id="tab-learn" data-tab="learn" aria-expanded="${tab==="learn"}" aria-controls="xpanel">${ICON.book}<span class="tl"><b>Learn more</b><small>Media from across the spectrum, labelled by lean</small></span></button>
      <div id="xpanel">${learnPanel(a)}</div>
    </aside>
    <div class="qbody">
    <div class="opts" role="group" aria-label="Options from the bigger parties">
      ${ord.slice(0,4).map((p,k)=>optCard(a,p,k,pick)).join("")}
    </div>
    ${ord.length>4? `<div class="minor-head"><span>From smaller parties</span><i></i></div>
    <div class="opts minor" role="group" aria-label="Options from smaller parties">
      ${ord.slice(4).map((p,k)=>optCard(a,p,k+4,pick)).join("")}
    </div>`:""}
    <div class="none-row"><button class="chip" id="pick-none" data-pick="none" aria-pressed="${pick==='none'}">None of these feel right</button></div>
    <div class="weight"><span class="label">How much does this matter to you?</span>
      ${[[1,"Meh"],[2,"It matters"],[3,"Dealbreaker"]].map(([v,l])=>`<button class="chip" id="w-${v}" data-w="${v}" aria-pressed="${w===v}">${l}</button>`).join("")}
    </div>
    <div class="nav">
      <button class="btn small" data-act="back">${S.i===0?"Home":"Back"}</button>
      <button class="btn primary" data-act="next" ${pick?"":"disabled"}>${S.i===AREAS.length-1?"Reveal my matches":"Next"}</button>
    </div>
    </div>
  </section>`;
}
function optCard(a,p,k,pick){ return `<button class="opt" id="pick-${p}" data-pick="${p}" aria-pressed="${pick===p}">
        <span class="tick">YOUR PICK</span>
        <span class="letter">${LETTERS[k]}</span>
        <h3>${esc(a.opts[p].h)}</h3>
        <ul>${a.opts[p].b.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      </button>`; }
const ICON = {
  book:`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/></svg>`
};
/* Party and government sources name the party in the outlet itself, so they stay hidden until the reveal. */
const NAMES_PARTY = r => /party source|government source/i.test(r.s);
function learnPanel(a){
  const open = S.peek[a.id] || S.picks[a.id];
  const list = [...a.res, TRACKER, ...(minorsOf(a).length && a.id!=="bush" ? [MINOR_EXPLAINER] : []), PBO];
  const x = "https://x.com/search?f=live&q="+encodeURIComponent(a.live);
  const row = r => open
    ? `<li><div style="min-width:0"><a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.t)}</a><span class="src">${esc(r.s)}</span></div><span class="lean ${r.lean}">${esc(r.l)}</span></li>`
    : `<li><div style="min-width:0"><span class="blur ttl" aria-hidden="true">${esc(r.t)}</span><span class="src">${NAMES_PARTY(r) ? "Party or government source" : esc(r.s)}</span></div><span class="lean ${r.lean}">${esc(r.l)}</span></li>`;
  return `<div class="panel"><h3 id="learn-h">Learn more</h3>
  <p class="note">A mix of outlets on purpose. Lean labels are a rough guide to each outlet's general reputation, not a rating of each article. "Industry" and "Advocacy" groups argue for their members.</p>
  ${open? "" : `<div class="spoiler"><p><b>Headlines hidden.</b> Real articles name parties, which un-blinds this question. Pick first, or peek if you'd rather know.</p><button class="btn small" data-act="peek">Peek anyway</button></div>`}
  <ul class="res">${list.map(row).join("")}</ul>
  ${open
    ? `<a class="live xlink" href="${esc(x)}" target="_blank" rel="noopener"><b>Latest on X</b><span>Newest posts on this topic, live. Loud and not fact-checked: vibes, not facts.</span></a>`
    : `<div class="live xlink is-off" aria-disabled="true"><b>Latest on X</b><span>Unlocks after you pick, because posts name parties.</span></div>`}
  </div>`;
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
      <a class="btn small primary" href="${shareUrl()}" target="_blank" rel="noopener">Share on X</a>
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
  </section>

  <section class="card">
    <h2 style="font-size:28px">Who was behind each option</h2>
    <div class="reveal">
      ${AREAS.map(a=>{ const p=S.picks[a.id]; const w=["","Meh","It matters","Dealbreaker"][S.weight[a.id]||2];
        return `<div class="rv"><h3>${esc(a.tag)} <small>${p==="none"?"None fit":""} · ${w}</small></h3>
        <div class="rv-list">${S.order[a.id].map((k,i)=>`<div class="rv-item ${p===k?"picked":""} ${PARTIES[k].minor?"is-minor":""}"><span class="who">${LETTERS[i]} · ${PARTIES[k].name}${p===k?" · your pick":""}</span><b>${esc(a.opts[k].h)}</b></div>`).join("")}</div></div>`;}).join("")}
    </div>
  </section>

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
  app.classList.toggle("wide", S.screen==="q");
  app.innerHTML = S.screen==="intro" ? intro() : S.screen==="q" ? question() : S.screen==="ballot" ? ballotScreen() : results();
  if(S.screen==="results") requestAnimationFrame(()=>document.querySelectorAll(".bar i").forEach(i=>i.style.width=i.dataset.w+"%"));
  if(focusId){ const el = document.getElementById(focusId); if(el) el.focus(); }
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
  switch(t.dataset.act){
    case "start": S.screen="q"; S.i = Math.min(AREAS.findIndex(x=>!S.picks[x.id]) < 0 ? 0 : AREAS.findIndex(x=>!S.picks[x.id]), AREAS.length-1); break;
    case "next": if(S.i<AREAS.length-1){ S.i++; } else { S.screen="results"; setTimeout(confetti, 150); } break;
    case "back": if(S.i===0) S.screen="intro"; else S.i--; break;
    case "peek": S.peek[a.id]=true; break;
    case "review": S.screen="q"; S.i=0; break;
    case "reset": S = freshState(); break;
    case "copy": copyResult(); return;
    case "ballot": S.screen="ballot"; break;
    case "home": S.screen="intro"; break;
    default: return;
  }
  save(); render(); window.scrollTo({top:0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto":"smooth"});
});
app.addEventListener("submit", e=>{
  e.preventDefault(); const f = e.target; const key = f.dataset.form; const inp = f.querySelector("input");
  if(key==="pc"){ const v = inp.value.replace(/\D/g,"").slice(0,4); S.pc = v; S.district = BALLOT.p[v] ? BALLOT.p[v][0][0] : null; save(); render(); }
});
/* Invite only: the post doesn't include anyone's answers or matches. */
function shareUrl(){
  const here = /^https?:$/.test(location.protocol) ? location.origin + location.pathname : "";
  const text = "I just did Spring St Blind Date: pick Victorian election policies without party names, then see who's behind them. Try it before 28 November #springst";
  return "https://x.com/intent/post?text=" + encodeURIComponent(text) + (here ? "&url=" + encodeURIComponent(here) : "");
}
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

render();

/* Footer: electoral authorisation, sources and where to report errors. */
(function renderFooter(){
  const cfg = window.SPRINGST_CONFIG || {};
  const f = document.getElementById("site-footer"); if(!f) return;
  f.innerHTML = `
    ${cfg.authorisation ? `<p class="auth">${esc(cfg.authorisation)}</p>` : ""}
    <p>Independent and non-partisan. Not affiliated with any party, candidate or the VEC. Policy summaries from the
      <a href="${TRACKER.u}" target="_blank" rel="noopener">ABC policy tracker</a> and
      <a href="${MINOR_EXPLAINER.u}" target="_blank" rel="noopener">minor parties explainer</a>; candidates from the ABC election guide; postcodes from the ABS.</p>
    ${cfg.repoUrl ? `<p>Spotted an error? <a href="${esc(cfg.repoUrl)}/issues/new/choose" target="_blank" rel="noopener">Report it</a> · <a href="${esc(cfg.repoUrl)}" target="_blank" rel="noopener">Source code</a></p>` : ""}`;
})();
