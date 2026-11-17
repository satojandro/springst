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
      const [toolsY, optsY] = await page.evaluate(() => [".tools", ".opts"].map((s) => document.querySelector(s).getBoundingClientRect().top));
      check(toolsY < optsY, `${scheme}: Dig deeper tools sit above the options`);
      await page.click("[data-tab=live]");
      check(await page.$(".live-grid"), `${scheme}: Live chatter opens`);
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
await browser.close();

if (failures.length) { console.error(`\n${failures.length} check(s) failed.`); process.exit(1); }
console.log("\nAll smoke checks passed.");
