# Deploying

The site is static (`site/`) and goes to GitHub Pages. There is no server, no account system and no API key: answers and postcodes stay in each visitor's browser.

## Before launch: checklist

- [ ] **Authorisation statement set** in `site/config.js` (see below). `npm run validate:release` fails without it.
- [ ] Policies re-checked against sources within the last few days (`docs/DATA.md`).
- [ ] Ballot data refreshed (`python3 scripts/build_ballot.py --refresh-abc`).
- [ ] `npm run check` passes.

## Authorisation

Victorian electoral law requires material published during an election period that is intended or likely to affect voting ("electoral matter") to say who authorised it: name and address. That includes websites. A quiz comparing party policies before polling day very likely counts.

Set it in `site/config.js`:

```js
authorisation: "Authorised by <Full Name>, <street address>, <suburb> VIC <postcode>.",
```

It appears in the footer of every screen. Check the Victorian Electoral Commission's current guidance on authorisation (vec.vic.gov.au) or get advice if you're unsure. This document isn't legal advice.

## Site: GitHub Pages

The workflow `.github/workflows/deploy.yml` publishes `site/` on every push to `main` that passes the checks.

One-time setup by the repo owner:
1. Repository **Settings > Pages**, under *Build and deployment*, set **Source: GitHub Actions**.
2. Push to `main`, or run the *Deploy site* workflow by hand. The site appears at `https://<owner>.github.io/springst/`.
3. Optional: add a custom domain in the same settings page.

The deploy workflow runs `npm run validate:release`, so it won't publish until the authorisation statement is set.

## Local development

```bash
npm run serve
```

