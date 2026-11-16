#!/usr/bin/env node
/* End-to-end smoke test: play the whole quiz, reveal results, look up a postcode,
   check both themes, and fail on any page error. Run: npm test
   Screenshots go to test-results/ (gitignored) for reviewers. */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "test-results");
fs.mkdirSync(OUT, { recursive: true });
const PAGE_URL = pathToFileURL(path.join(ROOT, "site", "index.html")).href;

const failures = [];
const check = (cond, msg) => { if (!cond) failures.push(msg); console.log(`${cond ? "ok  " : "FAIL"} ${msg}`); };

const browser = await chromium.launch();
for (const scheme of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 400, height: 860 }, colorScheme: scheme });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error" && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });

  await page.goto(PAGE_URL);
  await page.waitForSelector("[data-act=start]");
  check(await page.$(".hero h1"), `${scheme}: intro renders`);
  await page.click("[data-act=start]");

  let screens = 0;
  while (await page.$("[data-act=next]")) {
    screens++;
    const n = await page.locator(".opt").count();
    check(n >= 4, `${scheme}: screen ${screens} shows ${n} options`);
    await page.locator(".opt").nth(screens % n).click();
    check(await page.isEnabled("[data-act=next]"), `${scheme}: Next enabled after picking on screen ${screens}`);
    if (screens === 1) {
      await page.click("[data-tab=learn]");
      check(await page.$(".res li"), `${scheme}: Learn more lists resources`);
      await page.screenshot({ path: path.join(OUT, `${scheme}-question.png`), fullPage: true });
    }
    await page.click("[data-act=next]");
    if (screens > 20) break;
  }
  check(screens === 10, `${scheme}: quiz has 10 screens (saw ${screens})`);
  check(await page.$(".bars"), `${scheme}: results show match bars`);
  check(await page.$(".rv-item"), `${scheme}: reveal lists parties behind each option`);

  await page.fill("#pc-input", "3030");
  await page.click(".pc-form button");
  check((await page.locator("[data-district]").count()) >= 2, `${scheme}: split postcode 3030 offers a district choice`);
  await page.fill("#pc-input", "3101");
  await page.click(".pc-form button");
  check((await page.textContent(".dhead h3")).trim() === "Kew", `${scheme}: 3101 resolves to Kew`);
  check((await page.locator(".cand").count()) >= 5, `${scheme}: Kew ballot lists candidates`);
  await page.screenshot({ path: path.join(OUT, `${scheme}-results.png`), fullPage: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  check(!overflow, `${scheme}: no horizontal scroll at 400px`);
  check(errors.length === 0, `${scheme}: no page errors ${errors.length ? JSON.stringify(errors) : ""}`);
  await page.close();
}
// Public-site AI path: serve over a fake origin, point config at a mocked endpoint, send a message.
{
  const page = await browser.newPage({ viewport: { width: 400, height: 860 } });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let sent = null;
  await page.route("https://springst.test/**", (route) => {
    const rel = new URL(route.request().url()).pathname.replace(/^\/+/, "") || "index.html";
    const file = path.join(ROOT, "site", rel);
    if (!fs.existsSync(file)) return route.fulfill({ status: 404, body: "" });
    let body = fs.readFileSync(file);
    if (rel === "config.js") body = body.toString().replace('aiEndpoint: ""', 'aiEndpoint: "https://ai.springst.test/chat"');
    const type = rel.endsWith(".js") ? "text/javascript" : rel.endsWith(".css") ? "text/css" : "text/html";
    route.fulfill({ body, contentType: type });
  });
  await page.route("https://ai.springst.test/chat", (route) => {
    sent = JSON.parse(route.request().postData());
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ text: "Here are the trade-offs." }) });
  });
  await page.goto("https://springst.test/index.html");
  await page.click("[data-act=start]");
  await page.click("[data-tab=chat]");
  await page.fill("[data-form] input", "What are the trade-offs?");
  await page.click("[data-form] button");
  await page.waitForSelector(".msg.bot >> text=Here are the trade-offs.", { timeout: 5000 }).catch(() => {});
  check(sent && typeof sent.context === "string" && sent.messages?.at(-1)?.role === "user", "ai: chat posts {context, messages} to the endpoint");
  check(sent && sent.context.length < 12000, `ai: context fits the worker's limit (${sent?.context.length} chars)`);
  check(!/\b(Labor|Liberal|Greens|One Nation)\b/.test(sent?.context || ""), "ai: quiz context sent mid-quiz doesn't name parties");
  check(await page.$(".msg.bot >> text=Here are the trade-offs."), "ai: reply is shown");
  check(errors.length === 0, `ai: no page errors ${errors.length ? JSON.stringify(errors) : ""}`);
  await page.close();
}
await browser.close();

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log("\nAll smoke checks passed.");
