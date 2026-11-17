# Spring St Blind Date

**Which Victorian party actually agrees with you?** A blind policy quiz for the 2026 Victorian state election (Saturday 28 November 2026).

You pick policies without seeing party names. At the end you see how you matched, who was behind every option, and who's actually on your ballot.

- **10 policy areas, one per screen.** Energy, housing, crime, transport, health, cost of living, schools, Treaty, animals and the bush, and state debt.
- **Totally blind.** Options from Labor, the Liberal–Nationals Coalition, the Greens, One Nation and 11 smaller parties are shuffled and unlabelled until the reveal.
- **Go deeper on every screen.** A reading list from across the spectrum with lean labels, and links to the live conversation on X, Bluesky, Reddit and YouTube.
- **Your real ballot.** Enter a postcode to see the candidates in your district in ballot-paper order, your upper house region, and how often you picked each party's plan.

Independent and non-partisan. Not affiliated with any party, candidate or the Victorian Electoral Commission.

## Quick start

No build step: the site is plain HTML, CSS and JavaScript in [`site/`](site/).

```bash
npm install
```

```bash
npm run serve
```

Then open http://localhost:8080. You can also open `site/index.html` directly in a browser.

Before you push, run the checks:

```bash
npm run check
```

That runs `npm run validate` (data checks, including the blind-quiz rules) and `npm test` (a headless browser plays the whole quiz). CI runs the same checks on every pull request.

## Repository layout

| Path | What's there |
|---|---|
| `site/index.html` | Page shell |
| `site/app.js` | Rendering, state, scoring, events |
| `site/styles.css` | All styles, light and dark |
| `site/config.js` | Per-deployment settings: **authorisation statement**, repo link |
| `site/data/policies.js` | Parties, policy areas, options and reading lists. **Hand-edited, reviewed carefully.** |
| `site/data/ballot.js` | Candidates and postcodes. **Generated**, don't edit by hand. |
| `scripts/build_ballot.py` | Rebuilds `ballot.js` from ABS and ABC sources |
| `scripts/validate.mjs` | Data checks |
| `tests/smoke.mjs` | End-to-end browser test |
| `docs/` | Editorial policy, data sources, deployment, roadmap |

## Contributing

People and AI agents are both welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md). Agents should also read [AGENTS.md](AGENTS.md).

The most valuable contributions right now:
1. **Corrections.** If a policy summary is wrong or out of date, [open a policy correction](../../issues/new/choose) with a source.
2. **Balance.** Reading lists that only have a left-leaning or only a right-leaning source (`npm run validate` lists them).
3. **Accessibility** and testing on real phones.

See [docs/ROADMAP.md](docs/ROADMAP.md) for what's next.

## Deploying

See [docs/DEPLOY.md](docs/DEPLOY.md). In short: GitHub Pages hosts the site. There's no server. **Before any public launch, set the electoral authorisation statement in `site/config.js`.**

## Licence

Code is under the [MIT licence](LICENSE). Policy summaries are our own paraphrases of published commitments; candidate and postcode data come from the ABC and the ABS (see [docs/DATA.md](docs/DATA.md) for sources and attribution).
