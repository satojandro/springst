# Roadmap

Polling day is **Saturday 28 November 2026**. Anything that doesn't help someone vote before then waits.

## Done
- Blind quiz: 10 areas, big four plus 11 smaller parties, importance weighting, results reveal.
- Reading lists with lean labels and live-chatter links on every question.
- Postcode to district lookup with real ballots, upper house regions, and per-candidate match.
- Static site, data pipeline, validation and browser tests, Pages deploy.

## Before launch (must)
- [ ] Authorisation statement (owner).
- [ ] Balance reading lists flagged by `npm run validate` (housing, transport, budget).
- [ ] Health, schools and cost-of-living reading lists need real articles, not only search links.
- [ ] Accessibility pass: screen-reader labels on option cards, focus order after re-render, reduced motion.
- [ ] Re-verify every option against the latest ABC tracker and party sites.

## Next (should)
- [ ] Share card: an image of your result (no answers, just the match bars).
- [ ] "Compare two parties" view on the results page.
- [ ] Optional second pick per screen ("I could live with this").
- [ ] Shareable links to a single question.

## Later (could)
- [ ] Embedded live feed of posts on X. This needs the paid X API and a server. Until then the links open live searches.
- [ ] Local independents: a structured summary of each independent's published priorities, seat by seat.
- [ ] Translations (Vietnamese, Mandarin, Arabic, Greek, Italian are among Victoria's most-spoken languages).
- [ ] Reuse for other state and federal elections: move content to JSON and make the quiz engine election-agnostic.
