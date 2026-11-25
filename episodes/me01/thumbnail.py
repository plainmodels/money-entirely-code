"""Draw the me01 thumbnail (1280x720) with the channel engine: the real 817-year English/UK price line (log scale) on
ledger paper, flat for six centuries and near-vertical at the end, with three words of type."""
import base64, pathlib, sys
sys.path.insert(0, "youtube/pipeline")
from playwright.sync_api import sync_playwright
import render
ep = pathlib.Path(__file__).resolve().parent
JS = r"""() => {
  const big = document.createElement('canvas'); big.width = W; big.height = H; const keep = ctx; ctx = big.getContext('2d');
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); ctx.drawImage(background(), 0, 0);
  chart(99, 1, { series: [{ k: 'uk_level', col: C.pRed, w: 14 }], xr: [1209, 2025], log: true, yr: [0.04, 220], yt: [], xt: [], draw: false, padL: 70, padR: 60 }, [36, 36, W - 72, H - 72]);
  text('1209', 120, H - 120, { px: 54, weight: 700, color: C.pDim }); text('2025', W - 110, H - 120, { px: 54, weight: 700, color: C.pDim, align: 'right' });
  ['PRICES', 'STOPPED', 'FALLING'].forEach((s, i) => text(s, 130, 250 + i * 190, { px: 200, serif: true, color: i === 2 ? C.pRed : C.pInk }));
  ctx = keep; const c = document.createElement('canvas'); c.width = 1280; c.height = 720; const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(big, 0, 0, 1280, 720);
  return c.toDataURL('image/png').split(',')[1]; }"""
with sync_playwright() as pw:
    b, p = render.open_page(pw, render.write_page(ep))
    (ep / "publish").mkdir(exist_ok=True); out = ep / "publish" / "thumbnail.png"; out.write_bytes(base64.b64decode(p.evaluate(JS))); b.close()
print("wrote", out)
