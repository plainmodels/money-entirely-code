"""me01 data.json from the format pilot's own computation (youtube/format-pilots/entire-inflation/outputs) plus the
local FRED files it read, and simplified Natural Earth outlines (already on disk in contour/data) for four small maps.

    python3 build_data.py

Nothing is downloaded. Every number drawn on screen comes from this file or from storyboard text built from it.
"""
import csv, json, math, pathlib, sys
H = pathlib.Path(__file__).resolve().parent
PILOT = pathlib.Path("youtube/format-pilots/entire-inflation")
OUT, RAW = PILOT / "outputs", PILOT / "data"
R = json.loads((OUT / "results.json").read_text()); E = json.loads((OUT / "early.json").read_text()); HY = json.loads((OUT / "hyper.json").read_text())

# ---- UK price level 1209-2025 (BoE millennium A1 spliced to ONS D7BT), 2015 = 100
uk = [(int(r["year"]), float(r["uk_cpi_2015_100"]), float(r["inflation_pct"]) if r["inflation_pct"] else None)
      for r in csv.DictReader(open(OUT / "uk_price_level_1209_2025.csv"))]
UKL = {y: v for y, v, _ in uk}; UKI = {y: i for y, _, i in uk}
# ---- US CPI-U monthly 1913-01..2026-10 and its 12-month rate
us = [(r["month"], float(r["cpi_u_nsa"]) if r["cpi_u_nsa"] else None, float(r["yoy_pct"]) if r["yoy_pct"] else None)
      for r in csv.DictReader(open(OUT / "us_cpi_yoy_monthly.csv"))]
def dec(m): y, mo = m.split("-")[:2]; return round(int(y) + (int(mo) - 0.5) / 12, 4)
def fred(name):
    return [(r["observation_date"][:7], float(r[name])) for r in csv.DictReader(open(RAW / f"{name}.csv")) if r[name] not in ("", ".")]
FF, UN = fred("FEDFUNDS"), fred("UNRATE")
usavg = {}
for m, v, _ in us:
    if v is not None: usavg.setdefault(int(m[:4]), []).append(v)
usavg = {y: sum(v) / len(v) for y, v in usavg.items() if len(v) == 12}

def series(pairs, nd=4):
    return {"x": [round(x, 4) for x, _ in pairs], "y": [round(y, nd) if y is not None else None for _, y in pairs]}
S = {}
S["uk_level"] = series([(y, v) for y, v, _ in uk], 5)
S["us_yoy"] = series([(dec(m), i) for m, _, i in us if i is not None], 2)
S["us_level"] = series([(dec(m), v) for m, v, _ in us if v is not None], 3)
S["fedfunds"] = series([(dec(m), v) for m, v in FF], 2)
S["unrate"] = series([(dec(m), v) for m, v in UN], 1)
# indexed comparisons
S["us_1913_100"] = series([(y + 0.5, usavg[y] / usavg[1913] * 100) for y in range(1913, 1936)], 2)
S["uk_1913_100"] = series([(y + 0.5, UKL[y] / UKL[1913] * 100) for y in range(1913, 1936)], 2)
S["uk_1650_1913"] = series([(y, UKL[y] / UKL[1913] * 100) for y in range(1650, 1914)], 2)
S["uk_1780_1860"] = series([(y, UKL[y] / UKL[1797] * 100) for y in range(1780, 1861)], 2)
S["uk_1780_1920"] = series([(y, UKL[y] / UKL[1913] * 100) for y in range(1780, 1921)], 2)
q1 = sum(UKL[y] for y in range(1511, 1516)) / 5
S["eng_1511_1650"] = series([(y, UKL[y] / q1 * 100) for y in range(1500, 1651)], 2)
sp = E["spain_england"]
S["spain_ends"] = {"x": [1513, 1648], "y": [100, round(100 * sp["spain_mult_1511_15_to_1646_50"], 1)]}
S["us_level_2016_100"] = series([(dec(m), v) for m, v, _ in us if v is not None and m >= "2016-01"], 3)
# 2% path drawn forward from 2025 (a target, not a forecast): 2025..2060
S["uk_2pct_path"] = series([(y, UKL[2025] * 1.02 ** (y - 2025)) for y in range(2025, 2061)], 3)

# ---- check a few figures used on screen against the pilot's results, so a drift fails loudly
assert abs(UKL[1913] / UKL[1209] - R["uk"]["mult_1209_1913"]) < 0.01
assert abs(UKL[2025] / UKL[1913] - R["uk"]["mult_1913_last"]) < 0.1
assert round(usavg[1920] / usavg[1913], 2) >= 2.0
us1933 = usavg[1933] / usavg[1920]; uk1934 = UKL[1934] / UKL[1920]
assert us1933 < 0.67 and uk1934 < 0.67

data = {"series": S, "results": R, "early": E, "hyper": HY,
        "checks": {"us_1933_over_1920": round(us1933, 3), "uk_1934_over_1920": round(uk1934, 3), "uk_1913_1920": round(UKL[1920] / UKL[1913], 2),
                   "us_aug1971_yoy": next(i for m, _, i in us if m == "1971-08"), "us_dec1979_yoy": next(i for m, _, i in us if m == "1979-12"),
                   "us_max_yoy_1983_2020": max(i for m, _, i in us if i is not None and "1983" <= m[:4] <= "2020"),
                   "us_dec2021_yoy": next(i for m, _, i in us if m == "2021-12"),
                   "uk_1797": UKL[1797], "uk_1813": UKL[1813], "uk_1800_pct": UKI[1800], "uk_1799": UKL[1799], "uk_1850": UKL[1850], "uk_1913": UKL[1913]}}

# ---- verified published figures (not computed here); each has a row in factcheck.csv with its source URL
data["published"] = {
    "seville_silver_kg": {"1546-50": 18698.8, "1591-95": 273704.5},          # Hamilton, via Munro (EH.net)
    "spain_index": {"1511-15": 98.98, "1646-50": 343.36},                     # Hamilton, via Munro (EH.net)
    "antoninianus_g": {"start": 2.2, "thirty_years_later_max": 0.1},          # RIC, ric.mom.fr
    "yuan_rate_1346_55_pct": 12.7,                                            # Guan, Palma & Wu, EDP-2207
    "law": {"money_mult": 2.6, "paris_jan1720_pct": 25},                      # Velde, Chicago Fed WP 2003-31
    "zimbabwe_official_jul2008_annual_pct": 231e6,                            # Mail & Guardian, Hanke-Krus WP8
    "zimbabwe_gdp_fall_2000_07_pct": 40,                                      # IMF Country Report 09/139
    "peaks_2022": {"US": [9.1, "Jun 2022"], "Euro area": [10.6, "Oct 2022"], "UK": [11.1, "Oct 2022"]},   # BLS, Eurostat, ONS
    "fed_target_2023": "5.25-5.5",                                            # Federal Reserve, 26 Jul 2023
}

# ---- small maps from Natural Earth 1:50m (public domain), simplified
sys.path.insert(0, "contour/lib"); import ne
def dp(pts, eps):
    if len(pts) < 3: return pts
    a, b = pts[0], pts[-1]; dx, dy = b[0] - a[0], b[1] - a[1]; L = math.hypot(dx, dy) or 1e-12
    i, dm = 0, -1
    for k in range(1, len(pts) - 1):
        d = abs(dy * pts[k][0] - dx * pts[k][1] + b[0] * a[1] - b[1] * a[0]) / L
        if d > dm: i, dm = k, d
    if dm > eps: return dp(pts[:i + 1], eps)[:-1] + dp(pts[i:], eps)
    return [a, b]
def clip_rings(rings, bb, eps, minpts=4):
    out = []
    for r in rings:
        xs = [p[0] for p in r]; ys = [p[1] for p in r]
        if max(xs) < bb[0] - 5 or min(xs) > bb[2] + 5 or max(ys) < bb[1] - 5 or min(ys) > bb[3] + 5: continue
        q = [list(p) for p in r]; h = len(q) // 2                       # closed ring: simplify each half, or DP collapses it
        s = dp(q[:h + 1], eps)[:-1] + dp(q[h:], eps)
        if len(s) >= minpts: out.append([[round(x, 2), round(y, 2)] for x, y in s])
    return out
def land(bb, eps): return [r for g, a in ne.layer("land") for r in clip_rings(g[1], bb, eps)]
def ctry(name, bb, eps): g, a = ne.country(name); return clip_rings(g[1], bb, eps)
MAPS = {
    "silver": {"view": [-100, -30, 5, 48], "eps": 0.35, "countries": [], "hl": ["Bolivia", "Spain", "Panama"],
               "pts": [{"name": "Potosí", "lon": -65.75, "lat": -19.58}, {"name": "Panama", "lon": -79.52, "lat": 8.98}, {"name": "Seville", "lon": -5.98, "lat": 37.39}]},
    "sichuan": {"view": [88, 16, 128, 46], "eps": 0.2, "countries": ["China"], "hl": ["China"],
                "pts": [{"name": "Chengdu (Sichuan)", "lon": 104.07, "lat": 30.67}]},
    "ruhr": {"view": [1.5, 47.0, 16.5, 55.3], "eps": 0.06, "countries": ["Germany", "France", "Belgium", "Netherlands", "Luxembourg"], "hl": ["Germany"],
             "pts": [{"name": "Berlin", "lon": 13.40, "lat": 52.52}], "region": {"lon": 7.2, "lat": 51.48, "km": 45, "label": "the Ruhr"}},
    "zimbabwe": {"view": [18, -28, 40, -10], "eps": 0.08, "countries": ["Zimbabwe", "South Africa", "Botswana", "Zambia", "Mozambique", "Namibia", "Malawi"], "hl": ["Zimbabwe"],
                 "pts": [{"name": "Harare", "lon": 31.05, "lat": -17.83}]},
}
maps = {}
for k, m in MAPS.items():
    bb = m["view"]
    maps[k] = {"view": bb, "land": land(bb, m["eps"]), "countries": {c: ctry(c, bb, m["eps"] / 2) for c in set(m["countries"] + m["hl"])},
               "hl": m["hl"], "pts": m["pts"], "region": m.get("region")}
data["maps"] = maps
(H / "data.json").write_text(json.dumps(data, separators=(",", ":"), ensure_ascii=False))
print("data.json", round((H / "data.json").stat().st_size / 1024), "KB;", data["checks"])
