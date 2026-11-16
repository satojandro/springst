#!/usr/bin/env node
/* Data checks for Spring St Blind Date. Run: npm run validate  (add --release before a public deploy)
   Fails (exit 1) on anything that would break the quiz, un-blind it, or ship an unsourced claim. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE = process.argv.includes("--release");
const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// Load the browser data files into a sandbox. Top-level const/let stay in the script scope,
// so we append an export line that copies them onto the sandbox.
const ctx = { window: {}, console };
vm.createContext(ctx);
const load = (rel, exportNames = []) => {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  vm.runInContext(src + "\n" + exportNames.map((n) => `globalThis.${n} = ${n};`).join("\n"), ctx, { filename: rel });
};
load("site/config.js");
load("site/data/policies.js", ["PARTIES", "AREAS", "MAJORS", "TRACKER", "PBO", "MINOR_EXPLAINER"]);
load("site/data/ballot.js");
const { PARTIES, AREAS, MAJORS } = ctx;
const BALLOT = ctx.window.BALLOT;
const CONFIG = ctx.window.SPRINGST_CONFIG;

// --- Policies -------------------------------------------------------------------------------
// Words that would un-blind an option. Options must describe the policy, never who proposed it.
const TELLS = [
  "Labor", "Liberal", "Coalition", "Nationals", "Greens", "One Nation", "Socialist", "Libertarian",
  "Family First", "Animal Justice", "Shooters", "Sustainable Australia", "Citizens Party", "Democrats",
  "West Party", "Carroll", "Wilson", "Allan", "Battin", "Pesutto", "Hanson", "Deeming", "Purcell",
  "Limbrick", "Bourman", "Patten", "Payne", "Ettershank", "Sandell", "Ratnam",
];
const tellRe = new RegExp(`\\b(${TELLS.map((t) => t.replace(/ /g, "\\s+")).join("|")})\\b`, "i");
const LEANS = new Set(["left", "right", "neutral", "official", "advocacy", "search"]);

const ids = new Set();
for (const a of AREAS) {
  const where = `area "${a.id}"`;
  if (ids.has(a.id)) err(`${where}: duplicate id`);
  ids.add(a.id);
  for (const f of ["title", "tag", "sub", "context", "live"]) if (!a[f]) err(`${where}: missing ${f}`);
  for (const k of MAJORS) if (!a.opts[k]) err(`${where}: missing an option for major party ${k}`);
  for (const [k, o] of Object.entries(a.opts)) {
    if (!PARTIES[k]) err(`${where}: option key ${k} is not in PARTIES`);
    if (!o.h || o.h.length > 60) err(`${where}/${k}: headline missing or over 60 characters`);
    if (!Array.isArray(o.b) || o.b.length < 1 || o.b.length > 5) err(`${where}/${k}: needs 1 to 5 bullets`);
    for (const t of [o.h, ...(o.b || [])]) {
      const m = String(t).match(tellRe);
      if (m) err(`${where}/${k}: "${m[0]}" would reveal the party behind this option: "${t}"`);
    }
  }
  if (Object.keys(a.opts).length > 8) err(`${where}: more than 8 options (letters run A-H)`);
  for (const r of a.res || []) {
    if (!/^https:\/\//.test(r.u)) err(`${where}: resource link must be https: ${r.u}`);
    if (!LEANS.has(r.lean)) err(`${where}: resource "${r.t}" has unknown lean "${r.lean}"`);
    if (!r.t || !r.s || !r.l) err(`${where}: resource needs t (title), s (source), l (label): ${r.u}`);
  }
  const leans = new Set((a.res || []).map((r) => r.lean));
  if (leans.has("left") !== leans.has("right")) warn(`${where}: reading list has a ${leans.has("left") ? "left" : "right"}-leaning source but no ${leans.has("left") ? "right" : "left"}-leaning one`);
}
for (const [k, p] of Object.entries(PARTIES)) {
  if (!p.name) err(`party ${k}: missing name`);
  if (p.minor && !p.where) err(`party ${k}: smaller parties need "where" (which seats/regions they contest)`);
  if (p.minor && !AREAS.some((a) => a.opts[k])) warn(`party ${k}: has no options in any area`);
}

// --- Ballot data ----------------------------------------------------------------------------
const D = BALLOT.d, R = BALLOT.r, P = BALLOT.p;
if (Object.keys(D).length !== 88) err(`ballot: expected 88 districts, found ${Object.keys(D).length}`);
for (const [name, d] of Object.entries(D)) {
  if (!R[d.r]) err(`ballot: ${name} is in region "${d.r}", which has no upper house candidates`);
  if (!d.c.length) err(`ballot: ${name} has no candidates`);
  for (const c of d.c) {
    if (c.length !== 5) err(`ballot: ${name} has a malformed candidate row`);
    if (c[2] && !PARTIES[c[2]]) err(`ballot: ${name}/${c[0]} links to unknown party key ${c[2]}`);
    if (c[3] && !/^https?:\/\//.test(c[3])) err(`ballot: ${name}/${c[0]} has a bad website URL`);
  }
}
let pcs = 0;
for (const [pc, rows] of Object.entries(P)) {
  pcs++;
  if (!/^[38]\d{3}$/.test(pc)) err(`postcode ${pc}: not a Victorian postcode`);
  for (const [n] of rows) if (!D[n]) err(`postcode ${pc}: unknown district ${n}`);
  const sum = rows.reduce((s, r) => s + r[1], 0);
  if (rows.length > 1 && (sum < 95 || sum > 102)) warn(`postcode ${pc}: shares add to ${sum}%`);
}
if (pcs < 650) err(`ballot: only ${pcs} postcodes`);

// --- Release checks -------------------------------------------------------------------------
if (!CONFIG.authorisation) (RELEASE ? err : warn)("config: authorisation statement is empty (required before a public launch; see docs/DEPLOY.md)");

for (const w of warnings) console.warn("warn:", w);
for (const e of errors) console.error("error:", e);
console.log(`${AREAS.length} areas, ${Object.keys(PARTIES).length} parties, ${Object.keys(D).length} districts, ${pcs} postcodes. ` +
  `${errors.length} errors, ${warnings.length} warnings.`);
process.exit(errors.length ? 1 : 0);
