# Contributing

Thanks for helping. This is a voter-information tool, so the bar for accuracy and fairness is high. Small, well-sourced changes are the most useful.

## Ways to help

- **Report an error.** Use the *Policy correction* issue form and include a link to the source.
- **Fix something.** Pick an issue, or run `npm run validate` and fix a warning.
- **Review.** Read a policy area against its sources and confirm it's accurate and even-handed.

## Workflow

1. Fork, or create a branch named for the change (`fix/housing-stamp-duty`, `feat/share-card`).
2. Make the change. Read [docs/EDITORIAL.md](docs/EDITORIAL.md) first if you're touching policy text.
3. Run `npm run check`.
4. Open a pull request using the template. One topic per PR.

Changes to `site/data/policies.js` need a review from a maintainer (see `.github/CODEOWNERS`).

## Setup

You'll need Node 20 or later. Python 3.10 or later is only needed to rebuild the ballot data.

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm run check
```

## Style

- Plain JavaScript, no build step, no framework.
- Copy is plain Australian English: short sentences, active voice, no jargon. Name things the way voters would.
- Accessibility: every control is keyboard-reachable with a visible focus state, and contrast holds in both themes.

## Conduct

Be kind and assume good faith. Arguments about which policies are better belong somewhere else; here we only ask whether a summary is accurate, sourced and fair.
