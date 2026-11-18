# Guide for AI agents

You're working on **Spring St Blind Date**, a public, non-partisan voting quiz for the Victorian state election on **28 November 2026**. Real people will use it to decide how to vote. Accuracy and neutrality matter more than features.

Read this file, then [docs/EDITORIAL.md](docs/EDITORIAL.md) before touching any policy text.

## Ground rules

1. **Never invent facts.** Every policy option, number, candidate and link must come from a source you actually read. If you can't verify something, leave it out and say so in the PR.
2. **Keep the quiz blind.** Option headlines and bullets must never name or hint at a party, leader, candidate, party slogan or party colour. `npm run validate` checks for names, but you are responsible for subtler tells.
3. **Equal treatment.** Options for the same area should be about the same length, written in the same neutral register, and described by what they *do*, not with loaded words ("radical", "common-sense", "reckless").
4. **Never edit `site/data/ballot.js` by hand.** Regenerate it with `scripts/build_ballot.py`.
5. **Never commit secrets.** The site is fully static and needs none.
6. **Don't change the authorisation statement** in `site/config.js`. Only the project owner sets it.

## Before you open a PR

```bash
npm run check
```

Both must pass. Include in the PR description:
- what you changed and why;
- the source URL for every factual change, and the date you read it;
- for UI changes, screenshots from `test-results/` (created by `npm test`).

## Where things live

- Policy content: `site/data/policies.js`. `PARTIES`, `AREAS` (big-four options and reading lists), `MINOR` (smaller-party options, merged into areas at load).
- App logic: `site/app.js`. Plain JavaScript, no framework, no build step. Keep it that way unless the roadmap says otherwise.
- Styles: `site/styles.css`. Colours are tokens on `:root` with dark-mode overrides. **Never use party colours** (red, blue, green, orange) for options or results, because they'd un-blind the quiz.

## Common tasks

**Correct a policy.** Edit the option in `site/data/policies.js`, cite the source in the PR, and update the "as of" date in the footer text in `site/app.js` if the source is newer.

**Add a reading-list item.** Add `{t, u, s, lean, l}` to the area's `res` array. `lean` is one of `left | right | neutral | official | advocacy | search`. Label by the outlet's general reputation, not by whether you agree with the article. Aim for every area to have both a left- and a right-leaning source.

**Add a policy area.** Add an object to `AREAS` with options for all four majors (`L`, `C`, `G`, `O`), plus smaller parties in `MINOR` only where they have a published position. Then update the screen count in `tests/smoke.mjs` and the intro copy.

**Refresh candidates.** Run `python3 scripts/build_ballot.py --refresh-abc` (needs `pip install -r scripts/requirements.txt`), check the NOTE lines it prints, and run `npm run check`.
