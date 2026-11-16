# Data sources

## Policies (`site/data/policies.js`), hand-written

Paraphrased from the following, as at the dates shown. See [EDITORIAL.md](EDITORIAL.md) for how options are written.

| Source | Used for | As of |
|---|---|---|
| [ABC News: key policies on offer, 2026 Victorian election](https://www.abc.net.au/news/2026-11-04/victoria-2026-election-policy-promise-tracker/107247200) | Labor, Coalition, Greens, One Nation options | 13 Nov 2026 |
| [ABC News: the minor parties running in the 2026 Victorian election](https://www.abc.net.au/news/2026-11-14/victoria-2026-state-election-independent-party-explainer/107342014) | Smaller-party options and where they're running | 15 Nov 2026 |
| [Victorian Parliamentary Budget Office: election commitment tracker](https://pbo.vic.gov.au/2026_election_commitment_tracker) | Costings (linked, not copied) | ongoing |

Parties with few or no published policies are left out of the quiz (Democratic Labour, Christian Alliance, Put Australia First), as are those the ABC reports were set up mainly to direct preferences (Climate Action Now, Free Palestine, I'm Voting to Avoid the Fine). They still appear on ballots.

## Candidates and postcodes (`site/data/ballot.js`), generated

Built by `scripts/build_ballot.py`. A copy is in `data/ballot.json` (pretty-printed for review and diffs).

| Source | Used for |
|---|---|
| [ABC 2026 Victorian election guide](https://www.abc.net.au/news/elections/vic/2026/guide/electorates): candidates A–Z page | Party codes, sitting MPs, upper house candidates |
| ABC guide: one page per district | Ballot-paper order, candidate websites, margin, sitting member |
| [ABS ASGS Edition 3 allocation files](https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/edition-3-july-2021-june-2026/access-and-downloads/allocation-files): `POA_2021_AUST`, `SED_2025_AUST` | Which mesh blocks are in which postcode and district |
| [ABS 2021 Census mesh block counts](https://www.abs.gov.au/census/guide-census-data/mesh-block-counts/latest-release) | Residents per mesh block, used to split postcodes by population share |

**How postcodes are mapped.** Each mesh block (the ABS's smallest area) is assigned to one postcode and one district. For each postcode we add up 2021 Census residents per district, and list districts with at least 1% of the postcode's residents, largest first. About a third of postcodes cross a district boundary, so the app asks people to confirm with the VEC.

**Format.** `window.BALLOT = { d, r, p }`:
- `d[district] = { s: ABC slug, r: upper house region, a: area description, m: margin, h: held by, c: [[name, party label, quiz party key | null, website, sitting 0/1], …] }`, with candidates in ballot-paper order;
- `r[region] = [[name, party, quiz party key | null, sitting 0/1], …]`, not in ballot order;
- `p[postcode] = [[district, % of residents], …]`.

**Refreshing.** Candidates are fixed once nominations close, but re-run before polling day to catch corrections:

```bash
pip install -r scripts/requirements.txt
```

```bash
python3 scripts/build_ballot.py --refresh-abc
```

Check every `NOTE` line it prints (names it couldn't match, so the sitting-MP flag may be missing), then run `npm run check` and open a PR with the diff of `data/ballot.json`.

## Attribution

Candidate details are facts compiled from the ABC election guide. We link to the guide for biographies rather than copying them. ABS data is © Commonwealth of Australia, licensed under CC BY 4.0.
