# Deploying

The site is static (`site/`) and goes to GitHub Pages. The AI chat is optional and runs on a Cloudflare Worker (`worker/`), so the API key never reaches the browser.

## Before launch: checklist

- [ ] **Authorisation statement set** in `site/config.js` (see below). `npm run validate:release` fails without it.
- [ ] Policies re-checked against sources within the last few days (`docs/DATA.md`).
- [ ] Ballot data refreshed (`python3 scripts/build_ballot.py --refresh-abc`).
- [ ] `npm run check` passes.
- [ ] If the AI chat is on: worker deployed, spend limit set, `aiEndpoint` set in `site/config.js`.

## Authorisation

Victorian electoral law requires material published during an election period that is intended or likely to affect voting ("electoral matter") to say who authorised it: name and address. That includes websites. A quiz comparing party policies before polling day very likely counts.

Set it in `site/config.js`:

```js
authorisation: "Authorised by <Full Name>, <street address>, <suburb> VIC <postcode>.",
```

It appears in the footer of every screen. Check the Victorian Electoral Commission's current guidance on authorisation (vec.vic.gov.au) or get advice if you're unsure. This document isn't legal advice.

## 1. Site: GitHub Pages

The workflow `.github/workflows/deploy.yml` publishes `site/` on every push to `main` that passes the checks.

One-time setup by the repo owner:
1. Repository **Settings > Pages**, under *Build and deployment*, set **Source: GitHub Actions**.
2. Push to `main`, or run the *Deploy site* workflow by hand. The site appears at `https://<owner>.github.io/springst/`.
3. Optional: add a custom domain in the same settings page, and add it to `ALLOWED_ORIGINS` in `worker/wrangler.toml`.

The deploy workflow runs `npm run validate:release`, so it won't publish until the authorisation statement is set.

## 2. AI chat: Cloudflare Worker (optional)

Without this, the site works fully and the "Talk it out" tab says the chat isn't switched on.

```bash
cd worker
```

```bash
npm install
```

```bash
npx wrangler login
```

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

```bash
npx wrangler deploy
```

Then set `aiEndpoint` in `site/config.js` to the deployed URL plus `/chat` (for example `https://springst-ai.<account>.workers.dev/chat`) and push.

**Cost controls.** Do all of these before going public:
- Set a monthly **spend limit** on the Anthropic workspace that owns the key (Claude Console > Settings > Limits). This is the hard stop.
- The worker rate-limits each IP to 10 messages a minute (`[[ratelimits]]` in `wrangler.toml`), caps message sizes, and only answers requests from `ALLOWED_ORIGINS`.
- Replies use `claude-opus-5-5` at low effort with a 1,024-token cap. Change `MODEL` in `wrangler.toml` to trade quality for cost.
- Kill switch: set `AI_ENABLED = "false"` in `wrangler.toml` and `npx wrangler deploy`. The site keeps working without the chat.

**Privacy.** The worker doesn't store messages. Cloudflare and Anthropic process requests under their own terms. The chat tells people not to share personal details.

## Local development

```bash
npm run serve
```

To test the chat locally, put `ANTHROPIC_API_KEY=...` in `worker/.dev.vars` (gitignored), run `npx wrangler dev` in `worker/`, add `http://localhost:8080` to `ALLOWED_ORIGINS`, and point `aiEndpoint` at `http://localhost:8787/chat`.
