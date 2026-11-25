"""Write me01/storyboard.json.

Narration is read verbatim from the pilot script (youtube/format-pilots/entire-inflation/script_body.md, the source of
truth), so the video says exactly what the reviewed script says. Each beat gets a scene here. On-screen numbers come from
data.json (the pilot's computed outputs plus verified published figures), and the CHECK list below asserts that the
narration's numbers match data.json, so a drift between script and data fails the build instead of reaching the screen.
"""
import json, math, pathlib, re
H = pathlib.Path(__file__).resolve().parent
D = json.loads((H / "data.json").read_text())
BODY = pathlib.Path("youtube/format-pilots/entire-inflation/script_body.md")
R, E, HY, CK, PUB = D["results"], D["early"], D["hyper"], D["checks"], D["published"]
UK, US = R["uk"], R["us"]

# ---- narration rows from the script, with their chapter
rows, chapter = [], ""
for l in BODY.read_text().splitlines():
    q = l.split("|")
    if len(q) < 4 or q[1].strip() in ("Time", "---"): continue
    s = q[2].strip()
    if s.startswith("**"): chapter = s.strip("*").strip(); continue
    rows.append((chapter, s))
assert len(rows) == 58, len(rows)

# ---- the numbers the narration states, checked against data.json
f1 = lambda x: f"{x:.1f}"
CHECK = [
    (0, "16 minutes"), (0, "700 years"), (0, "111 times"), (2, "fifteen times"), (2, "a hundred and eleven times"),
    (9, "3.9 grams"), (9, f"more than {math.floor(E['rome']['pct_fall_min'])} percent"), (12, "fifteen times"), (14, "nearly six times"),
    (16, f"about {E['spain_england']['england_rate_pct']:.1f} percent"), (18, f"{PUB['yuan_rate_1346_55_pct']} percent"), (21, f"{round(E['law_jan1720_as_years_of_2pct'])} years".replace("11", "eleven")),
    (22, f"{round((UK['mult_1650_1913'] - 1) * 100)} percent"), (23, f"in {UK['falling_share_by_century']['1700s']['falling']} years"),
    (24, f"rose {round(CK['uk_1800_pct'])} percent"), (24, f"about {round((CK['uk_1813'] / CK['uk_1797'] - 1) * 100, -1):.0f} percent higher"),
    (26, f"{US['worst_years_dec_dec'][0]['pct']} percent"), (27, f"{abs(US['deepest_fall']['yoy_pct']):.1f} percent"),
    (29, f"{HY['Germany']['peak_monthly_pct']:,} percent"), (29, f"{HY['Germany']['daily_pct_computed']:.0f} percent a day"),
    (33, f"more than {int(HY['Hungary']['doublings_in_peak_month'])} times"), (33, f"{int(HY['Hungary']['years_at_2pct_for_one_peak_day'])} years"),
    (38, str(UK["last_falling_year"]["year"])), (39, f"{UK['doublings_from_1209'][7]['years_taken']} years".replace("6 years", "six years")),
    (40, f"{US['episode_peaks']['1970s first wave']['yoy_pct']:.1f} percent"), (40, f"{US['episode_peaks']['Great Inflation peak']['yoy_pct']:.1f} percent"),
    (41, f"{US['fedfunds_peak']['pct']} percent"), (42, f"{US['unemployment_peak_1980s']['pct']} percent"), (42, f"{CK['us_max_yoy_1983_2020']:.1f} percent"),
    (44, f"{US['surge']['dec2020_dec2023_pct']} percent"), (44, f"{US['surge']['dec2016_dec2019_pct']} percent"), (46, f"{US['surge']['dec2020_latest_pct']} percent"),
    (50, f"{CK['us_aug1971_yoy']:.1f} percent"), (50, f"{CK['us_dec1979_yoy']:.1f}"), (52, f"every {R['two_percent_doubling_years']:.0f} years"),
    (43, f"{CK['us_dec2021_yoy']:.0f} percent"),
]
for i, s in CHECK:
    assert s in rows[i][1], (i, s, rows[i][1][:90])

# ---- respellings for the synthetic voice (the `say` text); the subtitles keep the real spelling
SAY = [("denarius", "den-airy-us"), ("denarii", "den-airy-eye"), ("Diocletian", "Dye-oh-klee-shun"), ("Potosí", "Potoh-see"),
       ("jiaozi", "jow-dzuh"), ("Sichuan", "Sitch-wahn"), ("Khubilai", "Koo-bee-lie"), ("Yuan", "Yoo-ahn"), ("François Velde", "Fran-swah Vel-duh"),
       ("Hanke", "Hank-ee"), ("Krus", "Kroos"), ("Ruhr", "Roo-er"), ("Rentenmark", "Renten-mark"), ("pengő", "pen-go"), ("forint", "for-int"),
       ("Harare", "Ha-rah-ray"), ("Volcker", "Volker"), ("AD 64", "A.D. 64")]

# ---- palette shortcuts (paper inks, see engine.js)
G, RD, BL, GD, GY = "#1f6a48", "#b8392c", "#285c8c", "#9a6e12", "#8d927f"
uklog = {"series": [{"k": "uk_level", "col": G, "w": 5}], "xr": [1200, 2030], "log": True, "yr": [0.05, 250], "yt": [0.1, 1, 10, 100],
         "xt": [1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000], "unit": "consumer prices, 2015 = 100, log scale",
         "head": "England, then the UK · Bank of England and ONS"}
HOOK = dict(uklog, vl=[{"x": 1913, "label": "1913", "at": 0.36, "ly": 0}],
            tags=[{"text": f"1209–1913: ×{round(UK['mult_1209_1913'])}", "x": 1420, "y": 3.2, "at": 0.3, "col": "#f1e9d3"},
                  {"text": f"since 1913: ×{round(UK['mult_1913_last'])}", "x": 1890, "y": 60, "at": 0.5, "align": "right", "fill": RD}])
def zeros(n_lead, z):  # e.g. zeros("4", 29) -> 4 followed by 29 zeros, grouped in threes
    s = n_lead + "0" * z; return f"{int(s):,}"
fall = UK["falling_share_by_century"]; dbl = UK["doublings_from_1209"]; wy = US["worst_years_dec_dec"]; uk5 = UK["top_since_1900"]
sp = E["spain_england"]; ro = E["rome"]; hu, ge, zw = HY["Hungary"], HY["Germany"], HY["Zimbabwe"]
SC = [
 ("line", dict(HOOK, draw=[0.02, 0.5]),
  "817 years of English and UK prices, log scale, drawing left to right; tags 'x15' and 'x111' appear on the line"),
 ("title", {"title": ["The entire history", "of inflation"], "sub": "from Roman silver to the price shock of 2022", "kicker": "Money, Entirely", "chart": HOOK, "hold": 4.5}, "title card over the 817-year line"),
 ("hbars", {"head": "English prices: how many times they multiplied · Bank of England, ONS", "max": 125, "x0": 700, "lh": 150,
            "rows": [{"label": "1209 to 1913", "sub": "704 years", "value": UK["mult_1209_1913"], "txt": f"×{round(UK['mult_1209_1913'])}", "col": G},
                     {"label": "1913 to 2025", "sub": "112 years", "value": UK["mult_1913_last"], "txt": f"×{round(UK['mult_1913_last'])}", "col": RD}],
            "foot": "annual averages; BoE millennium dataset to 2015, ONS CPI after"}, "two bars: x15 and x111"),
 ("bullets", {"head": "Five patterns, from Rome to 2022", "items": ["", "", "", "", ""], "blank": True}, "five numbered slots, blank, filled in chapter 9"),
 ("bullets", {"head": "In this video", "lh": 76, "px": 38, "items": ["Rome: less silver in every coin", "The silver flood", "Paper money", "The long calm", "War, and Weimar",
              "The record breakers", "The Great Inflation", "The surge of 2021 to 2023", "The patterns"]}, "chapter list"),
 # 1 Rome
 ("statement", {"lines": ["Inflation: prices rise in general.", "Each unit of money buys less."], "accent": [1]}, "definition"),
 ("coin", {"coins": [{"label": "DENARIUS", "sub": "AUGUSTUS", "fine": 1, "r": 250, "lines": ["1/84 of a Roman pound", f"about {sum(ro['augustus_denarius_g']) / 2:.1f} g · essentially pure silver"]}],
           "head": "Rome's silver coin under Augustus"}, "a drawn denarius with its weight and fineness"),
 ("coin", {"head": "Nero, AD 64: 1/96 of a pound, and less silver in it", "coins": [{"label": "DENARIUS", "sub": "NERO · AD 64", "fine": 0.93, "r": 210, "lines": ["93% silver", "the traditional figure"]},
           {"label": "DENARIUS", "sub": "NERO · AD 64", "fine": 0.8, "r": 210, "at": 0.45, "lines": ["about 80% silver", "a laboratory study"], "col": "#ef7a62"}]}, "two drawn coins with the two fineness figures"),
 ("vbars", {"head": "Silver in one antoninianus, grams · RIC", "max": 2.6, "yt": [0, 0.5, 1, 1.5, 2, 2.5], "bars": [
            {"label": "when new (from 215)", "value": PUB["antoninianus_g"]["start"], "txt": "about 2.2 g", "sub": "valued at 2 denarii"},
            {"label": "about 30 years later", "value": PUB["antoninianus_g"]["thirty_years_later_max"], "txt": "under 0.1 g", "col": RD, "sub": "almost entirely copper"}]}, "bars: silver per coin, shrinking"),
 ("vbars", {"head": "Silver per denarius of face value, grams · our arithmetic on published figures", "max": 4.4, "yt": [0, 1, 2, 3, 4], "bars": [
            {"label": "Augustus", "value": 3.9, "txt": "about 3.9 g"}, {"label": "the low point", "value": 0.05, "txt": "under 0.05 g", "col": RD}],
            "big": f"−{math.floor(ro['pct_fall_min'])}%", "bigSub": "less silver for the same money", "bigAt": 0.55, "foot": "a Roman pound taken as 327–329 g"}, "3.9 g vs under 0.05 g; -98%"),
 ("tablet", {"title": "EDICT ON MAXIMUM PRICES", "date": "AD 301 · the emperor Diocletian", "rows": ["Goods: a legal top price", "Wages: a legal top price", "Breaking it: death"],
             "foot": "drawn as a diagram, not a copy of the inscription"}, "a stylised tablet drawn in code"),
 # 2 silver flood
 ("map", {"set": "silver", "route": True, "head": "Potosí silver, found 1545, to Seville", "ptsAt": [0.05, 0.4, 0.75], "left": ["Panama"]}, "route Potosí, Panama, Seville"),
 ("vbars", {"head": "Silver arriving in Seville, tonnes a year · Hamilton, via Munro", "max": 300, "yt": [0, 100, 200, 300], "bars": [
            {"label": "1546 to 1550", "value": PUB["seville_silver_kg"]["1546-50"] / 1000, "txt": f"about {PUB['seville_silver_kg']['1546-50'] / 1000:.0f} t"},
            {"label": "1591 to 1595", "value": PUB["seville_silver_kg"]["1591-95"] / 1000, "txt": f"about {PUB['seville_silver_kg']['1591-95'] / 1000:.0f} t", "col": RD}],
            "big": f"×{sp['seville_silver_imports_mult_1546_50_to_1591_95']:.0f}", "bigSub": "yearly averages", "bigPos": [760, 330], "bigAlign": "center"}, "bars: yearly silver imports"),
 ("vbars", {"head": "Hamilton's index of Spanish prices, in silver", "max": 400, "yt": [0, 100, 200, 300, 400], "bars": [
            {"label": "1511 to 1515", "value": PUB["spain_index"]["1511-15"], "txt": f"{PUB['spain_index']['1511-15']:.0f}"},
            {"label": "1646 to 1650", "value": PUB["spain_index"]["1646-50"], "txt": f"{PUB['spain_index']['1646-50']:.0f}", "col": RD}],
            "big": f"×{sp['spain_mult_1511_15_to_1646_50']:.1f}", "bigSub": "the price revolution", "bigPos": [760, 330], "bigAlign": "center"}, "bars: Spanish index at the two ends"),
 ("line", {"series": [{"k": "eng_1511_1650", "col": G, "w": 4.5, "label": f"England ×{sp['england_mult_same']:.1f}", "labelAt": 0.6, "ldx": -10, "ldy": -40, "lalign": "right"}],
           "spain": {"at": 0.55}, "xr": [1500, 1655], "yr": [0, 700], "yt": [0, 100, 200, 300, 400, 500, 600, 700], "xt": [1500, 1525, 1550, 1575, 1600, 1625, 1650],
           "bands": [{"x0": 1544, "x1": 1551, "label": "Great Debasement", "at": 0.7, "ly": 10}], "unit": "prices, 1511–15 = 100",
           "dots": [{"x": 1648, "y": PUB["spain_index"]["1646-50"] / PUB["spain_index"]["1511-15"] * 100, "label": [f"Spain ×{sp['spain_mult_1511_15_to_1646_50']:.1f}", "Hamilton: end points only"], "at": 0.6, "dx": -20, "dy": 50, "align": "right"}],
           "head": "England (Bank of England, yearly) and Spain (Hamilton) on the same years"}, "England and Spain from the same start"),
 ("statement", {"lines": ["Silver, or population?", "Still debated."], "accent": [1], "sub": "Spanish prices began rising before much American silver arrived"}, "statement"),
 ("hbars", {"head": "The price revolution, spread over 135 years (1511–15 to 1646–50)", "max": 2.3, "x0": 760, "lh": 130, "rows": [
            {"label": "Spain", "value": sp["spain_rate_pct"], "txt": f"{sp['spain_rate_pct']:.1f}% a year"},
            {"label": "England", "value": sp["england_rate_pct"], "txt": f"{sp['england_rate_pct']:.1f}% a year"},
            {"label": "today's central-bank target", "value": 2, "txt": "2% a year", "col": RD}]}, "bars: 0.9%, 1.3%, 2%"),
 # 3 paper
 ("map", {"set": "sichuan", "head": "Sichuan, western China", "note": ["jiaozi: paper notes", "private firms, 990s", "issued by the Song state from 1023"], "noteAt": 0.35, "noteX": 1140, "noteY": 640}, "map of Sichuan with a note card"),
 ("counter", {"head": "Yuan China, 1346 to 1355 · Guan, Palma & Wu", "tiles": [{"big": f"{PUB['yuan_rate_1346_55_pct']}%", "small": "a year", "label": "prices rose"},
              {"big": f"×{E['yuan_1346_55_mult']:.1f}", "small": "in nine years", "label": "close to tripling", "col": RD}],
              "foot": ["stability, then mild inflation, then hyperinflation", "money issued to pay for war"], "footPx": 44}, "Yuan inflation figures"),
 ("statement", {"lines": ["Ming paper notes:", "no longer working as money", "by about 1425"], "accent": [2], "sub": "von Glahn (2019)"}, "statement"),
 ("nameplate", {"name": "John Law", "sub": "A SCOTSMAN IN PARIS", "events": [["1716", "the General Bank, Paris"], ["1718", "it becomes the Royal Bank"], ["1720", "the system collapses"]],
                "foot": "an engraved name card, drawn; no portrait"}, "an engraved name card drawn in code; timeline 1716, 1718, 1720"),
 ("counter", {"head": "France, 1720 · Velde, Chicago Fed", "tiles": [{"big": f"×{PUB['law']['money_mult']}", "small": "money in circulation", "label": "under Law"},
              {"big": f"+{PUB['law']['paris_jan1720_pct']}%", "small": "Paris prices, January 1720", "label": "one month"},
              {"big": f"{E['law_jan1720_as_years_of_2pct']:.0f} years", "small": "of 2% inflation", "label": "the same rise", "col": RD}]}, "one month of Paris prices vs eleven years at 2%"),
 # 4 long calm
 ("line", {"series": [{"k": "uk_1650_1913", "col": G, "w": 4.5}], "xr": [1650, 1913], "yr": [0, 180], "yt": [0, 50, 100, 150], "xt": [1650, 1700, 1750, 1800, 1850, 1900],
           "unit": "English prices, 1913 = 100", "head": "The long calm · Bank of England",
           "tags": [{"text": f"+{round((UK['mult_1650_1913'] - 1) * 100)}% in 263 years", "ax": 330, "ay": 270, "at": 0.55}, {"text": f"about {UK['rate_1650_1913']:.1f}% a year", "ax": 330, "ay": 360, "at": 0.7, "fill": G}]}, "UK price level 1650 to 1913"),
 ("vbars", {"head": "Share of years with falling prices, by century · England and UK", "max": 60, "yt": [0, 20, 40, 60], "yf": "pct", "lpx": 30, "vpx": 34, "step": 0.07,
            "bars": [{"label": c, "value": v["pct"], "txt": f"{v['pct']}%", "col": RD if c in ("1900s", "2000s") else G} for c, v in fall.items()],
            "foot": "1200s: 1210 to 1299 · 2000s: 2000 to 2025"}, "bars: share of falling years by century"),
 ("line", {"series": [{"k": "uk_1780_1860", "col": G, "w": 4.5}], "xr": [1780, 1860], "yr": [60, 200], "yt": [75, 100, 125, 150, 175, 200], "xt": [1780, 1800, 1820, 1840, 1860],
           "bands": [{"x0": 1797, "x1": 1821, "label": "notes not exchangeable for gold", "at": 0.15}], "unit": "English prices, 1797 = 100",
           "dots": [{"x": 1800, "label": [f"1800: +{CK['uk_1800_pct']:.0f}% in one year"], "at": 0.45, "dx": -18, "dy": -20, "align": "right"},
                    {"x": 1813, "label": [f"1813: {round((CK['uk_1813'] / CK['uk_1797'] - 1) * 100)}% above 1797"], "at": 0.7, "dx": 18, "dy": -22}],
           "head": "War with France, 1797 to 1821 · Bank of England"}, "zoom 1780 to 1860; band 1797 to 1821"),
 ("line", {"series": [{"k": "uk_1780_1920", "col": G, "w": 4.5}], "xr": [1780, 1920], "yr": [60, 160], "yt": [60, 80, 100, 120, 140, 160], "xt": [1780, 1800, 1820, 1840, 1860, 1880, 1900, 1920],
           "hl": [{"y": 100, "col": RD, "at": 0.3}], "unit": "English prices, 1913 = 100", "draw": [0.02, 0.4],
           "dots": [{"x": 1799, "label": "1799", "at": 0.55, "col": RD, "dx": -16, "dy": -16, "align": "right"}, {"x": 1913, "label": "1913", "at": 0.65, "col": RD, "dx": -16, "dy": -22, "align": "right"},
                    {"x": 1850, "label": ["1850: below 1799"], "at": 0.4, "col": BL, "dx": 0, "dy": 46, "align": "center"}],
           "head": "The 1913 price level was first reached in 1799"}, "a horizontal guide at the 1913 level, touching 1799"),
 # 5 war and Weimar
 ("hbars", {"head": "Worst years on the US record, December to December · CPI-U", "max": 22, "x0": 520, "lh": 110,
            "rows": [{"label": str(w["year"]), "value": w["pct"], "txt": f"{w['pct']}%", "col": RD if w["year"] == 1918 else G} for w in wy[:5]]}, "bars: the five worst US years"),
 ("line", {"series": [{"k": "us_1913_100", "col": BL, "w": 5, "label": "US", "labelAt": 0.5}, {"k": "uk_1913_100", "col": G, "w": 5, "label": "UK", "labelAt": 0.5}],
           "xr": [1913, 1936], "yr": [50, 290], "yt": [50, 100, 150, 200, 250], "xt": [1915, 1920, 1925, 1930, 1935], "hl": [{"y": 100, "col": GY}], "unit": "prices, 1913 = 100",
           "dots": [{"x": 1921.46, "y": None, "k": "us_1913_100", "label": f"US, 12 months to June 1921: {US['deepest_fall']['yoy_pct']:.1f}%", "at": 0.55, "col": BL, "dx": 18, "dy": 95}],
           "head": "Up in war, down in peace · CPI-U and Bank of England, annual"}, "US and UK price levels, 1913 = 100"),
 ("map", {"set": "ruhr", "head": "January 1923: French and Belgian troops occupy the Ruhr", "regionAt": 0.15, "note": ["Passive resistance", "paid for with the", "printing press"], "noteAt": 0.6, "noteX": 1150, "noteY": 640}, "map: the Ruhr"),
 ("counter", {"head": "Germany, October 1923 · Hanke & Krus", "tiles": [{"big": f"{ge['peak_monthly_pct']:,.0f}%", "small": "in one month", "label": "prices rose"},
              {"big": f"{ge['daily_pct_computed']}%", "small": "a day", "label": "about"}, {"big": "3.7 days", "small": "for prices to double", "label": "doubling", "col": RD}]}, "counter"),
 ("vbars", {"head": "A kilo of bread in Germany, marks (log scale) · Deutsches Historisches Museum", "log": True, "min": 1e3, "max": 1e12, "yt": [1e3, 1e6, 1e9, 1e12],
            "ytl": ["1 thousand", "1 million", "1 billion", "1 trillion"], "bars": [{"label": "August 1923", "value": HY["weimar_bread_kg_aug1923_marks"], "txt": f"{HY['weimar_bread_kg_aug1923_marks']:,} marks"},
            {"label": "November 1923", "value": HY["weimar_bread_kg_nov1923_marks"], "txt": "over 200 billion marks", "col": RD}],
            "big": "×2.9 million", "bigSub": "in three months", "bigPos": [760, 330], "bigAlign": "center", "foot": "November 1923: one US dollar = 4.2 trillion marks (Deutscher Bundestag)"}, "bread, log scale"),
 ("statement", {"lines": ["1 Rentenmark =", "1,000,000,000,000 paper marks"], "accent": [1], "sub": "November 1923"}, "statement"),
 # 6 record breakers
 ("table", {"head": "Peak months · Hanke & Krus, World Hyperinflations (2012)", "hdr": ["", "peak month", "prices rose", "a day", "doubling"], "cols": [0, 600, 1060, 1280, 1460],
            "rows": [["Hungary", hu["peak_month"], "41.9 quadrillion %", f"{hu['published_daily_pct']}%", hu["published_doubling"]],
                     ["Zimbabwe", zw["peak_month"], "79.6 billion %", f"{zw['published_daily_pct']}%", zw["published_doubling"]],
                     ["Germany", ge["peak_month"], f"{ge['peak_monthly_pct']:,}%", f"{ge['published_daily_pct']}%", ge["published_doubling"]]],
            "hl": [0], "hlAt": 0.45, "lh": 110, "step": 0.12, "foot": "their definition of hyperinflation: prices rising at least 50% in a month"}, "Hanke-Krus rows"),
 ("counter", {"head": "Hungary, July 1946 · Hanke & Krus", "tiles": [{"big": "41.9 quadrillion %", "small": "in one month", "label": "prices rose", "px": 66},
              {"big": f"{hu['published_daily_pct']}%", "small": "a day", "label": "about"}, {"big": "15 hours", "small": "for prices to double", "label": "doubling"}],
              "foot": [f"more than {int(hu['doublings_in_peak_month'])} doublings in one month", f"one peak day = more than {int(hu['years_at_2pct_for_one_peak_day'])} years at 2%"], "footAt": 0.55}, "counter, then the 2% comparison"),
 ("banknote", {"top": "Hungary · 1946", "denom": zeros("1", 20), "words": "one hundred quintillion pengő", "base": "#dccfa6", "ink": "#5a3d6e",
               "lines": ["1 August 1946: 1 forint = 400 octillion pengő", zeros("4", 29)], "monoLine": 1, "lineAt": [0.5, 0.7]}, "a stylised 100 quintillion pengő note drawn in code; 29 zeros written out"),
 ("map", {"set": "zimbabwe", "head": "Zimbabwe", "note": ["IMF", f"economy shrank about {PUB['zimbabwe_gdp_fall_2000_07_pct']}%, 2000 to 2007", "central bank's quasi-fiscal activities:", "spending paid for by creating money"], "noteAt": 0.45, "noteX": 1130, "noteY": 600}, "map: Zimbabwe; IMF note card"),
 ("counter", {"head": "Zimbabwe, 2008", "tiles": [{"big": "231 million %", "small": "a year, July 2008", "label": "last official figure", "px": 70},
              {"big": "79.6 billion %", "small": "in one month, mid-Nov 2008", "label": "Hanke & Krus estimate", "px": 70, "col": RD},
              {"big": "about 25 hours", "small": "for prices to double", "label": "doubling", "px": 70}], "foot": "estimated from a share price traded in Harare and in London", "footPx": 40}, "official vs estimated"),
 ("banknote", {"top": "Zimbabwe · 2009", "denom": zeros("1", 14), "words": "one hundred trillion dollars", "base": "#cfdcc4", "ink": "#2f5a41",
               "lines": ["announced by the central bank, January 2009", "then a multi-currency system, early 2009"], "lineAt": [0.15, 0.55]}, "a stylised 100 trillion dollar note drawn in code"),
 # 7 Great Inflation
 ("line", {"series": [{"k": "us_yoy", "col": BL, "w": 3}], "neg": True, "xr": [1914, 2027], "yr": [-20, 26], "yt": [-15, -10, -5, 0, 5, 10, 15, 20, 25], "yf": "pct",
           "xt": [1920, 1940, 1960, 1980, 2000, 2020], "unit": "US prices, change over 12 months", "draw": [0.02, 0.4],
           "vl": [{"x": 1954.96, "label": ["1954:", "last fall, Dec to Dec"], "at": 0.3, "col": RD, "ly": 520}],
           "tags": [{"text": f"UK: last full-year fall {UK['last_falling_year']['year']}", "ax": 1780, "ay": 300, "at": 0.62, "align": "right", "fill": G}],
           "head": "Prices stopped falling · CPI-U; Bank of England"}, "US 12-month inflation 1914 to 2026; falls shaded; the dips end in the 1950s"),
 ("table", {"head": "English and UK prices: each doubling since 1209 · Bank of England, ONS", "hdr": ["prices", "reached in", "years it took"], "cols": [0, 880, 1380],
            "rows": [[f"×{2 ** r['doubling']:,}", str(r["year"]), str(r["years_taken"])] for r in dbl], "hl": [7], "hlAt": 0.72, "lh": 60, "px": 32, "step": 0.03}, "UK doublings since 1209; 1971 to 1977 highlighted"),
 ("line", {"series": [{"k": "us_yoy", "col": BL, "w": 4.5}], "xr": [1960, 1986], "yr": [0, 16], "yt": [0, 4, 8, 12, 16], "yf": "pct", "xt": [1960, 1965, 1970, 1975, 1980, 1985],
           "unit": "US prices, change over 12 months", "draw": [0.02, 0.85],
           "vl": [{"x": 1971.62, "label": ["Aug 1971", "gold window closed,", "wages and prices frozen"], "at": 0.15, "align": "right", "ly": 0},
                  {"x": 1973.79, "label": ["Oct 1973", "oil embargo"], "at": 0.42, "ly": 0}],
           "dots": [{"x": 1974.96, "label": f"Dec 1974: {US['episode_peaks']['1970s first wave']['yoy_pct']:.1f}%", "at": 0.62, "dx": 18, "dy": -20},
                    {"x": 1980.21, "label": f"Mar 1980: {US['episode_peaks']['Great Inflation peak']['yoy_pct']:.1f}%", "at": 0.85, "dx": 18, "dy": -20}],
           "head": "The Great Inflation · CPI-U"}, "1971 gold window and price freeze; 1973 embargo; US 12-month inflation with two peaks"),
 ("line", {"series": [{"k": "us_yoy", "col": BL, "w": 4}, {"k": "fedfunds", "col": RD, "w": 4}], "legend": [{"col": BL, "txt": "US inflation, 12 months"}, {"col": RD, "txt": "federal funds rate"}], "legendX": 330, "legendY": 250,
           "xr": [1970, 1991], "yr": [0, 22], "yt": [0, 5, 10, 15, 20], "yf": "pct", "xt": [1970, 1975, 1980, 1985, 1990], "unit": "percent, monthly", "draw": [0.02, 0.6],
           "vl": [{"x": 1979.6, "label": ["Aug 1979", "Volcker"], "at": 0.2, "align": "right"}],
           "dots": [{"x": 1981.46, "k": "fedfunds", "label": f"June 1981: {US['fedfunds_peak']['pct']}% (monthly average)", "at": 0.75, "dx": 18, "dy": -14}],
           "head": "The Fed's answer · FRED (CPI-U, effective federal funds rate)"}, "fed funds and inflation, 1970 to 1990"),
 ("line", {"series": [{"k": "us_yoy", "col": BL, "w": 4}, {"k": "unrate", "col": GD, "w": 4}], "legend": [{"col": BL, "txt": "US inflation, 12 months"}, {"col": GD, "txt": "unemployment rate"}], "legendY": 360,
           "xr": [1970, 1991], "yr": [0, 16], "yt": [0, 4, 8, 12, 16], "yf": "pct", "xt": [1970, 1975, 1980, 1985, 1990], "unit": "percent, monthly", "draw": [0.02, 0.5],
           "dots": [{"x": 1982.87, "k": "unrate", "label": f"Nov 1982: {US['unemployment_peak_1980s']['pct']}%", "at": 0.45, "col": GD, "dx": 18, "dy": -16}],
           "tags": [{"text": f"1983 to 2020: never above {CK['us_max_yoy_1983_2020']:.1f}%", "ax": 1760, "ay": 260, "at": 0.75, "align": "right", "fill": BL}],
           "head": "The price: two recessions · FRED (CPI-U, unemployment rate)"}, "unemployment and inflation, 1970 to 1990"),
 # 8 surge
 ("hbars", {"head": "Peak 12-month inflation, 2021 to 2023 · BLS, Eurostat, ONS", "max": 12.5, "x0": 560, "lh": 130,
            "rows": [{"label": k, "sub": v[1], "value": v[0], "txt": f"{v[0]}%", "col": [BL, GD, G][i]} for i, (k, v) in enumerate(PUB["peaks_2022"].items())],
            "foot": "UK: the ONS estimates it was last this high in 1981"}, "three peaks"),
 ("hbars", {"head": "US prices over three years · CPI-U, December to December", "max": 20, "x0": 700, "lh": 150,
            "rows": [{"label": "Dec 2016 to Dec 2019", "sub": "before the pandemic", "value": US["surge"]["dec2016_dec2019_pct"], "txt": f"+{US['surge']['dec2016_dec2019_pct']}%", "col": G},
                     {"label": "Dec 2020 to Dec 2023", "value": US["surge"]["dec2020_dec2023_pct"], "txt": f"+{US['surge']['dec2020_dec2023_pct']}%", "col": RD}]}, "two bars, +6.4% and +17.8%"),
 ("card", {"label": "Bank of England explainer · paraphrased", "big": ["Two shocks"], "lines": ["1. The coronavirus pandemic", "2. Russia's invasion of Ukraine:", "    a large impact on energy and food prices",
           "Still argued: how much extra demand added"], "hot": 3, "step": 1.6, "ly": 280, "foot": "bankofengland.co.uk/explainers · economists' debate: Brookings"}, "Bank of England explainer, paraphrased"),
 ("lines", {"charts": [
     {"series": [{"k": "us_yoy", "col": BL, "w": 4}, {"k": "fedfunds", "col": RD, "w": 4}], "legend": [{"col": BL, "txt": "US inflation, 12 months"}, {"col": RD, "txt": "federal funds rate"}],
      "xr": [2019, 2027], "yr": [0, 10], "yt": [0, 5, 10], "yf": "pct", "xt": [2019, 2021, 2023, 2025, 2027], "unit": "percent", "draw": [0.02, 0.4], "box": [110, 115, 1700, 440],
      "head": "Rates up, inflation down · FRED"},
     {"series": [{"k": "us_level", "col": G, "w": 5}], "xr": [2019, 2027], "yr": [240, 350], "yt": [250, 300, 350], "xt": [2019, 2021, 2023, 2025, 2027], "unit": "US price level, CPI-U index",
      "draw": [0.4, 0.8], "box": [110, 610, 1700, 440],
      "dots": [{"x": 2020.96, "label": "Dec 2020", "at": 0.55, "dx": 0, "dy": -24, "align": "center", "col": G}, {"x": 2026.79, "label": f"Oct 2026: +{US['surge']['dec2020_latest_pct']}% on Dec 2020", "at": 0.85, "dx": -18, "dy": -26, "align": "right"}],
      "head": "...but prices did not come down"}]}, "fed funds and inflation 2019 to 2026; a second panel shows the price level still climbing"),
 # 9 patterns
 ("bullets", {"head": "Five patterns, from Rome to 2022", "px": 44, "items": ["A government that needs money, usually for war", "More money, or fewer goods", "Price controls treat the symptom",
              "It ends when people trust the money again", "A little inflation, all the time, is new"]}, "the five slots fill in"),
 ("hbars", {"head": "Worst years since 1900 · US December to December; UK annual · red: world-war and post-war years", "max": 27, "x0": 440, "lh": 68, "lpx": 32, "vpx": 34, "step": 0.06,
            "rows": [{"label": f"US {w['year']}", "value": w["pct"], "txt": f"{w['pct']}%", "col": RD} for w in wy[:4]]
                  + [{"label": f"UK {w['year']}", "value": w["pct"], "txt": f"{w['pct']}%", "col": GY if w["year"] == 1975 else RD} for w in uk5]}, "worst years, US and UK, war years marked"),
 ("diagram", {"a": "More money", "b": "Fewer goods", "c": "Prices rise", "ex": [["a", "Potosí silver · the presses of 1923 and 1946"], ["b", "Zimbabwe's shrinking economy · the oil embargo"]]}, "two arrows meeting at prices"),
 ("statement", {"lines": ["Price caps:", "AD 301, and 1971"], "accent": [1], "sub": [f"US inflation: {CK['us_aug1971_yoy']:.1f}% in August 1971,", f"{CK['us_dec1979_yoy']:.1f}% by December 1979"]}, "statement"),
 ("bullets", {"head": "How the worst ones ended", "numbered": False, "items": ["A new currency: Germany 1923, Hungary 1946", "Someone else's currency: Zimbabwe 2009", "Painful interest rates: the US, 1979 to 1982"]}, "three endings"),
 ("line", dict(uklog, xr=[1200, 2065], yr=[0.05, 600], yt=[0.1, 1, 10, 100], draw=[0.02, 0.35], proj={"k": "uk_2pct_path", "label": [], "at": 0.55},
               tags=[{"text": "dotted: 2% a year from 2025, a target, not a forecast", "ax": 320, "ay": 280, "at": 0.6, "fill": RD, "px": 34},
                     {"text": f"at 2% a year, prices double every {R['two_percent_doubling_years']:.0f} years", "ax": 320, "ay": 370, "at": 0.75, "px": 34}]), "the 817-year chart again, with the 2% path drawn forward as a dotted line, labelled 'target, not forecast'"),
 # limits, three things, end
 ("bullets", {"head": "Limits", "px": 42, "items": ["The long UK series is a splice of many studies", "England first, the whole UK later", "Early centuries rest on few prices", "1225's +50% is probably a harvest, not money"]}, "numbered limits"),
 ("bullets", {"head": "Limits", "px": 42, "items": ["US CPI-U: urban consumers; October 2025 is missing", "Hyperinflation figures vary: one source used", "Rome: we measured silver, not the cost of living"]}, "limits continued"),
 ("bullets", {"head": "Three things", "px": 44, "items": ["For most of history, prices rose slowly, and often fell", "The big breaks came when governments needed money", "Gentle inflation that is almost never reversed is new"]}, "numbered summary"),
 ("statement", {"lines": ["$100 in 1913", f"= about ${US['usd100_1913_today']:,} in October 2026"], "accent": [1], "sub": "US consumer prices (CPI-U), 1913 annual average"}, "$100 in 1913 = about $3,415"),
 ("endcard", {"lines": ["Next: more of the entire story of money."]}, "end card with space for YouTube end-screen elements"),
]
assert len(SC) == len(rows), (len(SC), len(rows))
OUT = []
for i, ((ch, txt), (scene, p, vis)) in enumerate(zip(rows, SC)):
    b = {"id": f"b{i + 1:02d}", "chapter": ch, "scene": scene, "p": p, "text": txt, "visual": vis}
    say = txt
    for k, v in SAY: say = say.replace(k, v)
    if say != txt: b["say"] = say
    OUT.append(b)
OUT[-1]["chapter"] = ""
sb = {"episode": "me01", "title": "The ENTIRE History of Inflation in 16 Minutes", "voice": "bm_george", "lang": "en-gb", "speed": 1.27, "gap": 0.32, "tail": 6.5, "beats": OUT}
(H / "storyboard.json").write_text(json.dumps(sb, indent=1, ensure_ascii=False))
print(len(OUT), "beats", sum(len(b["text"].split()) for b in OUT), "words; respelled beats:", sum(1 for b in OUT if "say" in b))
