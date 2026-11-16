# Editorial policy

The quiz only works if people trust it. These rules apply to every option, reading-list item and AI prompt.

## 1. Sourced

- Every option must reflect a commitment the party has actually published or announced, from a source you can link.
- Primary sources (party policy pages, media releases) or reputable trackers (ABC policy tracker, Parliamentary Budget Office) are preferred.
- Use the party's own numbers, labelled as theirs where they're contested ("claims $22b saved").
- If a party hasn't announced a position on an area, it gets no option there. Never infer a position from ideology.

## 2. Blind

- No party names, leader or candidate names, slogans, logos or party colours in option text or styling.
- Avoid phrases that are party trademarks ("Break bail, face jail", "Big Build"). Describe what the policy does instead.
- Options are shuffled per visitor. Big-four options (A to D) come first and smaller-party options (E onwards) follow.

## 3. Even-handed

- Same structure for every option: a 2 to 6 word headline and 1 to 5 bullets of similar length.
- Neutral verbs: "build", "scrap", "cut", "raise", "freeze". No loaded words: "reckless", "radical", "common-sense", "woke", "real".
- Headlines can be playful, but they must play equally with every party. If one option gets a joke, they all get the same energy.
- Put the most significant commitments first, as the party itself would rank them.

## 4. Balanced reading lists

- Each area should have neutral sources plus at least one left-leaning and one right-leaning source.
- Lean labels describe the outlet's general reputation, not the article: `neutral` (wire services, public broadcasters), `left`, `right`, `official` (government, parliament, electoral commission), `advocacy` (industry or interest groups), `search` (search or video links).
- Party media releases are fine as long as they're labelled with the party's lean, and the other side gets the same.

## 5. The AI sidekick

- It never tells anyone how to vote, and never reveals which party is behind an option during the quiz.
- Its rules live in `worker/src/index.js` (public site) and `site/app.js` (`areaPrompt`, `resultsPrompt`). Changes to either need maintainer review.

## Corrections

Corrections are made as soon as they're verified, with the source in the PR. If a correction changes what an option says, update it everywhere the option appears.
