#!/usr/bin/env python3
"""Rebuild site/data/ballot.js: postcode -> district lookup and every candidate in ballot order.

Sources (see docs/DATA.md):
  * ABS ASGS Edition 3 allocation files: mesh block -> postcode (POA 2021) and
    mesh block -> state electoral district (SED 2025).
  * ABS 2021 Census mesh block counts (residents per mesh block) to weight split postcodes.
  * ABC News 2026 Victorian election guide: candidates A-Z page (party codes, sitting MPs,
    upper house candidates) and one page per district (ballot-paper order, websites,
    margin, sitting member).

Usage:
  python3 scripts/build_ballot.py                 # downloads into .cache/ then builds
  python3 scripts/build_ballot.py --offline       # build from .cache/ only
  python3 scripts/build_ballot.py --refresh-abc   # re-download ABC pages (candidates change)

Requires: pandas, openpyxl (pip install -r scripts/requirements.txt)
"""
import argparse
import html
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, ".cache")
OUT_JS = os.path.join(ROOT, "site", "data", "ballot.js")
OUT_JSON = os.path.join(ROOT, "data", "ballot.json")

ABS_ALLOC = ("https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs/"
             "edition-3-july-2021-june-2026/access-and-downloads/allocation-files/")
ABS_FILES = {
    "SED_2025_AUST.xlsx": ABS_ALLOC + "SED_2025_AUST.xlsx",
    "POA_2021_AUST.xlsx": ABS_ALLOC + "POA_2021_AUST.xlsx",
    "mbcounts_2021.xlsx": "https://www.abs.gov.au/census/guide-census-data/mesh-block-counts/2021/Mesh%20Block%20Counts%2C%202021.xlsx",
}
ABC_BASE = "https://www.abc.net.au/news/elections/vic/2026/guide/"
UA = "Mozilla/5.0 (compatible; springst-data-builder; +https://github.com/satojandro/springst)"

# Party label on ABC ballots -> quiz party key (null = not in the quiz) and display label.
BALLOT_KEY = {
    "Australian Labor Party": "L", "Liberal": "C", "The Nationals": "C", "The Greens": "G", "One Nation": "O",
    "Victorian Socialists": "VS", "Socialist Alliance": "SA", "Libertarian (formerly Liberal Democrats)": "LB",
    "Family First": "FF", "AJP": "AJ", "Legalise Cannabis": "LC", "Shooters, Fishers & Farmers Vic": "SFF",
    "Citizens Party": "CIT", "Australian Democrats": "DEM", "West": "WEST",
}
BALLOT_LABEL = {
    "Australian Labor Party": "Labor", "AJP": "Animal Justice", "Libertarian (formerly Liberal Democrats)": "Libertarian",
    "Labour DLP": "Democratic Labour (DLP)", "West": "The West Party",
    "The Republican": "The Republican Make Australia Great Again", "CAN": "Climate Action Now",
    "Shooters, Fishers & Farmers Vic": "Shooters, Fishers & Farmers", "Citizens Party": "Australian Citizens Party",
    "Safety Victoria - Violent Crime Prevention": "Safety Victoria",
}
# Party codes on the ABC A-Z page (used for upper house candidates).
AZ_CODE = {
    "ALP": ("Labor", "L"), "LIB": ("Liberal", "C"), "NAT": ("Nationals", "C"), "GRN": ("Greens", "G"),
    "ONP": ("One Nation", "O"), "VS": ("Victorian Socialists", "VS"), "SALL": ("Socialist Alliance", "SA"),
    "LDP": ("Libertarian", "LB"), "FFP": ("Family First", "FF"), "AJP": ("Animal Justice", "AJ"),
    "LCA": ("Legalise Cannabis", "LC"), "SFF": ("Shooters, Fishers & Farmers", "SFF"),
    "SAP": ("Sustainable Australia", "SUS"), "CIT": ("Australian Citizens Party", "CIT"),
    "AD": ("Australian Democrats", "DEM"), "TWP": ("The West Party", "WEST"),
    "DLP": ("Democratic Labour (DLP)", None), "MAGA": ("The Republican Make Australia Great Again", None),
    "IND": ("Independent", None), "FRP": ("Free Palestine", None), "CAN": ("Climate Action Now", None),
    "FINE": ("I'm Voting to Avoid the Fine", None), "CAP": ("Christian Alliance Party", None),
    "FPV": ("Safety Victoria", None),
}


def fetch(url, dest, refresh=False, offline=False):
    if os.path.exists(dest) and os.path.getsize(dest) > 0 and not refresh:
        return dest
    if offline:
        sys.exit(f"--offline but {dest} is missing")
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"  GET {url}", file=sys.stderr)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=300) as r, open(dest + ".part", "wb") as f:
        f.write(r.read())
    os.replace(dest + ".part", dest)
    time.sleep(0.7)  # be polite to the ABC
    return dest


def clean(s):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", s))).strip()


def norm(s):
    s = "".join(c for c in unicodedata.normalize("NFKD", s) if not unicodedata.combining(c))
    return re.sub(r"[\s\-']", "", s.upper())


def page_body(path):
    h = open(path, encoding="utf8").read()
    i = h.find('<script id="__NEXT_DATA__"')
    return h[:i] if i > 0 else h


def build_postcodes(offline):
    import pandas as pd
    print("Postcodes: reading ABS files", file=sys.stderr)
    p = {k: fetch(u, os.path.join(CACHE, "abs", k), offline=offline) for k, u in ABS_FILES.items()}
    cnt = pd.concat([pd.read_excel(p["mbcounts_2021.xlsx"], sheet_name=s, skiprows=6) for s in ["Table 2", "Table 2.1"]])
    cnt = cnt[pd.to_numeric(cnt["MB_CODE_2021"], errors="coerce").notna()].copy()  # Victoria = Table 2, 2.1
    cnt["MB"] = cnt["MB_CODE_2021"].astype("int64").astype(str)
    sed = pd.read_excel(p["SED_2025_AUST.xlsx"], dtype=str)
    sed = sed[sed.STATE_CODE_2021 == "2"][["MB_CODE_2021", "SED_NAME_2025"]]
    poa = pd.read_excel(p["POA_2021_AUST.xlsx"], dtype=str)[["MB_CODE_2021", "POA_CODE_2021"]]
    m = sed.merge(poa, on="MB_CODE_2021").merge(cnt[["MB", "Person"]], left_on="MB_CODE_2021", right_on="MB", how="left")
    m["Person"] = pd.to_numeric(m["Person"], errors="coerce").fillna(0)
    g = m.groupby(["POA_CODE_2021", "SED_NAME_2025"])["Person"].sum().reset_index()
    out, regions = {}, {}
    for pc, grp in g.groupby("POA_CODE_2021"):
        if not str(pc).isdigit():
            continue
        tot = grp.Person.sum()
        rows = []
        for _, r in grp.sort_values("Person", ascending=False).iterrows():
            mm = re.match(r"(.*) \((.*)\)$", r.SED_NAME_2025)  # "Kew (Southern Metropolitan)"
            if not mm:
                continue  # "No usual address", "Migratory - Offshore - Shipping"
            regions[mm.group(1)] = mm.group(2)
            share = r.Person / tot if tot else 0
            if tot == 0 or share >= 0.01:
                rows.append([mm.group(1), round(100 * share) if tot else 0])
        if rows:
            out[str(pc)] = rows
    return out, regions


def build_candidates(refresh, offline):
    print("Candidates: reading ABC guide", file=sys.stderr)
    az_path = fetch(ABC_BASE + "candidates", os.path.join(CACHE, "abc", "candidates.html"), refresh, offline)
    body = page_body(az_path)
    rows = re.findall(r'<tr[^>]*>\s*<td class="candidate">(.*?)</td>\s*<td class="party[^"]*">(.*?)</td>\s*'
                      r'<td class="electorate[^"]*"[^>]*>(.*?)</td>', body, re.S)
    if len(rows) < 500:
        sys.exit(f"Only {len(rows)} candidates parsed from the A-Z page; the ABC layout may have changed.")
    byseat, upper, unknown = {}, {}, set()
    for cand, party, el in rows:
        fam = clean(re.search(r'familyname">(.*?)</span>', cand).group(1))
        given = clean(cand.split("<span")[0])
        sitting = "Sitting MP" in cand
        code, elc = clean(party), clean(el)
        byseat.setdefault(elc, []).append((fam, given, sitting))
        if "<a " not in el:  # upper house regions are not links
            if code not in AZ_CODE:
                unknown.add(code)
            name, key = AZ_CODE.get(code, (code, None))
            upper.setdefault(elc, []).append([f"{given} {fam}", name, key, 1 if sitting else 0])
    if unknown:
        print(f"  WARNING unknown party codes (add to AZ_CODE): {sorted(unknown)}", file=sys.stderr)

    slugs = sorted(set(re.findall(r'/news/elections/vic/2026/guide/([a-z]{3,5})/"', body)))
    districts, problems = {}, []
    for slug in slugs:
        b = page_body(fetch(ABC_BASE + slug + "/", os.path.join(CACHE, "abc", "seats", slug + ".html"), refresh, offline))
        name = re.search(r"<h1[^>]*>(.*?) - VIC Election 2026</h1>", b).group(1)
        tb = re.search(r'class="eg2-ballot" aria-label="[^"]*ballot paper order">(.*?)</table>', b, re.S)
        if not tb:
            problems.append(f"{name}: no ballot table")
            continue
        ballot = [[clean(a), clean(p)] for a, p in re.findall(r"<tr>\s*<td>(.*?)</td>\s*<td>(.*?)</td>\s*</tr>", tb.group(1), re.S)]
        links = {clean(n): u for n, u in re.findall(
            r'<span class="eg2-card-name">(.*?)</span>.*?(?:<a class="eg2-card-link" href="([^"]+)"|</div>\s*</div>)', b, re.S) if u}
        b2 = b[b.rfind("</style>"):]
        pill = re.search(r'<span class="eg2-margin-pill[^>]*>.*?<span>(.*?)</span>', b2, re.S)
        held = re.search(r'Held by</span>\s*<p class="eg2-snap-text">(.*?)</p>', b2, re.S)
        area = re.search(r'<p class="eg2-eyebrow">(.*?)</p>', b2, re.S)
        cands = []
        for raw, plabel in ballot:
            fam, _, given = raw.partition(", ")
            match = [x for x in byseat.get(name, []) if norm(x[0]) == norm(fam)]
            if len(match) > 1:
                match = [x for x in match if norm(x[1]) == norm(given)] or match[:0]
            if len(match) == 1:
                disp, sitting = f"{match[0][1]} {match[0][0]}", match[0][2]
            else:
                disp, sitting = (f"{given} {fam.title()}" if given else raw.title()).strip(), False
                problems.append(f"{name}: no A-Z match for {raw!r} (sitting MP flag may be missing)")
            url = links.get(disp, "")
            if not url:
                last = norm(fam.split()[-1]) if fam else ""
                lk = [u for n, u in links.items() if last and (norm(n.split()[-1]) == last or norm(fam) in norm(n))]
                url = lk[0] if len(lk) == 1 else ""
            cands.append([disp, BALLOT_LABEL.get(plabel, plabel), BALLOT_KEY.get(plabel), url, 1 if sitting else 0])
        districts[name] = {"s": slug, "r": "", "a": clean(area.group(1)) if area else "",
                           "m": clean(pill.group(1)) if pill else "", "h": clean(held.group(1)) if held else "", "c": cands}
    return districts, upper, problems


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--offline", action="store_true", help="use .cache only, never download")
    ap.add_argument("--refresh-abc", action="store_true", help="re-download ABC candidate pages")
    a = ap.parse_args()

    postcodes, region_of = build_postcodes(a.offline)
    districts, upper, problems = build_candidates(a.refresh_abc, a.offline)
    for name, d in districts.items():
        d["r"] = region_of.get(name, "")
        if not d["r"]:
            problems.append(f"{name}: not found in ABS district list")
    postcodes = {pc: [r for r in rows if r[0] in districts] for pc, rows in postcodes.items()}
    postcodes = {pc: rows for pc, rows in postcodes.items() if rows}

    data = {"d": districts, "r": upper, "p": postcodes}
    os.makedirs(os.path.dirname(OUT_JSON), exist_ok=True)
    with open(OUT_JSON, "w", encoding="utf8") as f:
        json.dump(data, f, ensure_ascii=False, indent=1, sort_keys=True)
    with open(OUT_JS, "w", encoding="utf8") as f:
        f.write("/* GENERATED by scripts/build_ballot.py. Do not edit by hand.\n"
                "   Candidates in ballot-paper order: ABC election guide. Postcodes: ABS mesh-block allocation\n"
                "   (POA 2021 x SED 2025), weighted by 2021 Census residents. */\n")
        f.write("window.BALLOT = " + json.dumps(data, ensure_ascii=False, separators=(",", ":"), sort_keys=True) + ";\n")

    n = sum(len(d["c"]) for d in districts.values())
    print(f"Wrote {len(districts)} districts, {n} lower house candidates, "
          f"{sum(len(v) for v in upper.values())} upper house candidates, {len(postcodes)} postcodes.", file=sys.stderr)
    for p in problems:
        print("  NOTE", p, file=sys.stderr)
    if len(districts) != 88:
        sys.exit("Expected 88 districts.")


if __name__ == "__main__":
    main()
