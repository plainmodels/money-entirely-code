/* Money, Entirely: deterministic canvas renderer. renderAt(T) draws the frame for global time T (seconds); the same T always
   gives the same pixels. Episode content comes from window.EP (data.js): EP.storyboard, EP.timeline, EP.data.
   Visual system: banknote-green intaglio ground with fine guilloche lines; charts drawn on cream ledger paper with green
   rules and a red double margin; headings in P052 (a Palatino), labels in Nimbus Sans Narrow, ledger figures in Nimbus Mono.
   Deliberately unlike Under Test (dark terminal panels, Noto Sans), Contour Notes (night-blue survey sheet, C059/URW Gothic)
   and Earth Worked Out (warm field notebook, Lato). Everything is drawn from data: no photographs, scans or logos. */
"use strict";
const W = 1920, H = 1080;
const C = { bg: "#0e2a21", bg2: "#13372b", bg3: "#1a4636", line: "#2c5a48", ink: "#f3edda", dim: "#a9c2b5", faint: "#5f8574",
            gold: "#e7b85a", red: "#ef7a62", mint: "#9fdcb9",
            paper: "#f1e9d3", paper2: "#e7dcc0", rule: "rgba(40,110,85,0.16)", margin: "rgba(185,55,45,0.55)",
            pInk: "#1d2b24", pDim: "#62705f", pGreen: "#1f6a48", pRed: "#b8392c", pBlue: "#285c8c", pGold: "#9a6e12", pGrey: "#8d927f",
            silver: "#d7dcdc", copper: "#b8743e" };
const SERIF = '"P052", "Palatino", serif', SANS = '"Nimbus Sans Narrow", "Nimbus Sans", sans-serif', MONO = '"Nimbus Mono PS", monospace';
let ctx;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const prog = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, x) => a + (b - a) * x;
const fadeIn = (t, at, d = 0.5) => ease(prog(t, at, at + d));
const fmt = (n) => Math.round(n).toLocaleString("en-US");
function font(px, fam, weight) { ctx.font = `${weight || 400} ${px}px ${fam === "serif" ? SERIF : fam === "mono" ? MONO : SANS}`; }
function fam(o) { return o.serif ? "serif" : o.mono ? "mono" : "sans"; }
function text(s, x, y, o = {}) {
  font(o.px || 40, fam(o), o.weight || (o.serif ? 700 : 400));
  ctx.fillStyle = o.color || C.ink; ctx.textAlign = o.align || "left"; ctx.textBaseline = "alphabetic"; ctx.fillText(s, x, y);
}
function measure(s, px, serif, weight, mono) { font(px, serif ? "serif" : mono ? "mono" : "sans", weight || (serif ? 700 : 400)); return ctx.measureText(s).width; }
function fitPx(s, px, maxW, o = {}) { while (px > 14 && measure(s, px, o.serif, o.weight, o.mono) > maxW) px -= 2; return px; }
function rect(x, y, w, h, fill, r = 0, stroke = null, lw = 2) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function line(pts, col, lw = 4, dash) { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(dash || []); ctx.beginPath(); pts.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.stroke(); ctx.setLineDash([]); }
function underline(x, y, w, col, g) { ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w * g, y); ctx.stroke(); ctx.lineCap = "butt"; }
function wrap(s, px, maxW, o = {}) { const words = String(s).split(" "), out = []; let cur = "";
  for (const w of words) { const tt = cur ? cur + " " + w : w; if (measure(tt, px, o.serif, o.weight, o.mono) > maxW && cur) { out.push(cur); cur = w; } else cur = tt; }
  if (cur) out.push(cur); return out; }

/* ledger paper: cream sheet, faint green rules, a red double margin, a soft shadow; optional stamped label */
function paper(x, y, w, h, label, o = {}) {
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.45)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; rect(x, y, w, h, C.paper, 6); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 6); ctx.clip();
  const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, "rgba(255,255,255,0.10)"); gr.addColorStop(1, "rgba(150,120,60,0.10)"); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  if (!o.plain) { ctx.fillStyle = C.rule; for (let yy = y + 64; yy < y + h; yy += 40) ctx.fillRect(x, yy, w, 1.5);
    ctx.fillStyle = C.margin; ctx.fillRect(x + 54, y, 2, h); ctx.fillRect(x + 61, y, 2, h); }
  ctx.restore();
  if (label) { const L = label.toUpperCase(), lw = measure(L, 22, false, 700) + 36; rect(x + 86, y - 18, lw, 36, C.pGreen, 2); text(L, x + 104, y + 8, { px: 22, weight: 700, color: C.paper }); }
}

/* background: guilloche (sine rosettes, like the security print on a banknote), computed once */
let bgCache = null;
function background() {
  if (!bgCache) {
    bgCache = document.createElement("canvas"); bgCache.width = W + 240; bgCache.height = H + 240; const c = bgCache.getContext("2d");
    c.lineWidth = 1.1;
    const rosette = (cx, cy, R, r, k, n, col) => { c.strokeStyle = col; c.beginPath();
      for (let i = 0; i <= 2400; i++) { const a = (i / 2400) * Math.PI * 2, rr = R + r * Math.sin(k * a); const x = cx + rr * Math.cos(a + 0.02 * Math.sin(n * a)), y = cy + rr * Math.sin(a + 0.02 * Math.sin(n * a)); i ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke(); };
    for (let j = 0; j < 14; j++) rosette(260, 300, 210 + j * 9, 26, 24, 7, "rgba(159,220,185,0.07)");
    for (let j = 0; j < 14; j++) rosette(W - 100, H - 40, 260 + j * 10, 30, 30, 9, "rgba(231,184,90,0.06)");
    for (let band = 0; band < 2; band++) for (let j = 0; j < 9; j++) { c.strokeStyle = band ? "rgba(231,184,90,0.05)" : "rgba(159,220,185,0.06)"; c.beginPath();
      for (let x = 0; x <= bgCache.width; x += 4) { const y = (band ? H + 150 : 90) + Math.sin(x / 70 + j * 0.7) * (16 + j * 2) + Math.sin(x / 23 + j) * 3; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
  }
  return bgCache;
}

/* ---------------- charts on ledger paper ---------------- */
function ser(k) { const s = EP.data.series[k]; if (!s) throw new Error("no series " + k); return s; }
function valAt(k, x) { const s = ser(k); let best = null, bd = 1e9; for (let i = 0; i < s.x.length; i++) { const dd = Math.abs(s.x[i] - x); if (s.y[i] !== null && dd < bd) { bd = dd; best = s.y[i]; } } return best; }
function tickLabel(v, f) {
  if (f === "pct") return (v > 0 && v < 1 ? v.toFixed(1) : fmt(v)) + "%";
  if (f === "x") return "×" + (v < 1 ? v : fmt(v));
  if (f === "yr") return String(v);
  if (v < 1) return String(+v.toFixed(2)); return Number.isInteger(v) ? fmt(v) : v.toFixed(1);
}
/* cfg: {series: [{k, col, w, label, dash, x0, x1}], xr: [a, b], xr2 (zoom to), zoom: [from, to], log, yr: [lo, hi], yt: [ticks], yf, xt: [ticks],
         draw: [from, to] (fractions of the beat), bands: [{x0, x1, label}], hl: [{y, label, col, dash}], vl: [{x, label, at, col}],
         dots: [{k, x, label, at, col, dx, dy, align}], tags: [{text, x, y, at, col, px}], neg (shade below zero), head, unit, proj: {k, label, at}} */
function chart(t, d, cfg, box) {
  const [bx, by, bw, bh] = box, L = bx + (cfg.padL || 170), R = bx + bw - (cfg.padR || 70), T = by + 70, B = by + bh - 80;
  paper(bx, by, bw, bh, cfg.head);
  const z = cfg.xr2 ? ease(prog(t, d * (cfg.zoom ? cfg.zoom[0] : 0.2), d * (cfg.zoom ? cfg.zoom[1] : 0.6))) : 0;
  const xr = cfg.xr2 ? [lerp(cfg.xr[0], cfg.xr2[0], z), lerp(cfg.xr[1], cfg.xr2[1], z)] : cfg.xr;
  const yr = cfg.yr2 ? [lerp(cfg.yr[0], cfg.yr2[0], z), lerp(cfg.yr[1], cfg.yr2[1], z)] : cfg.yr;
  const X = (v) => L + (v - xr[0]) / (xr[1] - xr[0]) * (R - L);
  const Y = cfg.log ? (v) => B - (Math.log10(Math.max(v, 1e-9)) - Math.log10(yr[0])) / (Math.log10(yr[1]) - Math.log10(yr[0])) * (B - T)
                    : (v) => B - (v - yr[0]) / (yr[1] - yr[0]) * (B - T);
  ctx.save(); ctx.beginPath(); ctx.rect(L - 2, T - 30, R - L + 4, B - T + 32); ctx.clip();
  (cfg.bands || []).forEach((b) => { ctx.globalAlpha = fadeIn(t, d * (b.at || 0.1), 0.6); ctx.fillStyle = b.col || "rgba(184,57,44,0.12)"; ctx.fillRect(X(b.x0), T - 30, X(b.x1) - X(b.x0), B - T + 30);
    if (b.label) text(b.label, X(b.x0) + 12, T + (b.ly || 6), { px: 26, weight: 700, color: C.pRed }); ctx.globalAlpha = 1; });
  ctx.restore();
  // axes and ticks
  (cfg.yt || []).forEach((v) => { const y = Y(v); if (y < T - 5 || y > B + 5) return; ctx.fillStyle = "rgba(29,43,36,0.13)"; ctx.fillRect(L, y, R - L, 1.5);
    text(tickLabel(v, cfg.yf), L - 14, y + 9, { px: 26, align: "right", color: C.pDim, mono: cfg.monoTicks }); });
  (cfg.xt || []).forEach((v) => { if (v < xr[0] - 1e-6 || v > xr[1] + 1e-6) return; const x = X(v); ctx.fillStyle = "rgba(29,43,36,0.35)"; ctx.fillRect(x, B, 1.5, 10); text(String(v), x, B + 38, { px: 26, align: "center", color: C.pDim }); });
  ctx.fillStyle = C.pInk; ctx.fillRect(L, B, R - L, 2.5); ctx.fillRect(L, T - 20, 2.5, B - T + 20);
  if (cfg.unit) text(cfg.unit, L + 16, T - 26, { px: 25, color: C.pDim, weight: 700 });
  if (cfg.neg && yr[0] < 0) { ctx.fillStyle = C.pInk; ctx.fillRect(L, Y(0), R - L, 2.5); }
  const g = cfg.draw === false ? 1 : ease(prog(t, d * (cfg.draw ? cfg.draw[0] : 0.04), d * (cfg.draw ? cfg.draw[1] : 0.55)));
  ctx.save(); ctx.beginPath(); ctx.rect(L, T - 40, (R - L) * g + 2, B - T + 42); ctx.clip();
  (cfg.hl || []).forEach((h) => { ctx.globalAlpha = fadeIn(t, d * (h.at || 0), 0.5); line([[L, Y(h.y)], [R, Y(h.y)]], h.col || C.pRed, 3, h.dash === false ? [] : [12, 9]); ctx.globalAlpha = 1; });
  (cfg.series || []).forEach((sv) => { const s = ser(sv.k); ctx.strokeStyle = sv.col || C.pGreen; ctx.lineWidth = sv.w || 4.5; ctx.lineJoin = "round"; ctx.lineCap = "round"; ctx.setLineDash(sv.dash || []);
    if (cfg.neg && sv.neg !== false) { ctx.save(); ctx.beginPath(); ctx.rect(L, Y(0), R - L, B - Y(0)); ctx.clip(); ctx.fillStyle = "rgba(184,57,44,0.35)"; ctx.beginPath(); let open = false;
      for (let i = 0; i < s.x.length; i++) { const xv = s.x[i], yv = s.y[i]; if (yv === null || xv < xr[0] - 1 || xv > xr[1] + 1) continue; if (!open) { ctx.moveTo(X(xv), Y(0)); open = true; } ctx.lineTo(X(xv), Y(yv)); }
      ctx.lineTo(X(Math.min(xr[1], s.x[s.x.length - 1])), Y(0)); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.beginPath(); let pen = false;
    for (let i = 0; i < s.x.length; i++) { const xv = s.x[i], yv = s.y[i]; if (xv < (sv.x0 ?? -1e9) || xv > (sv.x1 ?? 1e9) || xv < xr[0] - 2 || xv > xr[1] + 2) continue;
      if (yv === null) { pen = false; continue; } const px = X(xv), py = Y(yv); pen ? ctx.lineTo(px, py) : ctx.moveTo(px, py); pen = true; }
    ctx.stroke(); ctx.setLineDash([]); });
  if (cfg.spain) { const s = ser("spain_ends"); ctx.globalAlpha = fadeIn(t, d * (cfg.spain.at || 0.4), 0.6); line([[X(s.x[0]), Y(s.y[0])], [X(s.x[1]), Y(s.y[1])]], C.pRed, 4, [14, 10]);
    s.x.forEach((xv, i) => { ctx.fillStyle = C.pRed; ctx.beginPath(); ctx.arc(X(xv), Y(s.y[i]), 11, 0, 7); ctx.fill(); }); ctx.globalAlpha = 1; }
  ctx.restore();
  // series end labels
  (cfg.series || []).forEach((sv) => { if (!sv.label) return; const s = ser(sv.k); let lx = null, ly = null;
    const xe = sv.lx ?? Math.min(xr[1], sv.x1 ?? 1e9, s.x[s.x.length - 1]); const xg = xr[0] + (xr[1] - xr[0]) * g; const xl = Math.min(xe, xg); const v = valAt(sv.k, xl); if (v === null) return;
    lx = X(xl); ly = Y(v); ctx.globalAlpha = fadeIn(t, d * (sv.labelAt || 0.3), 0.5);
    text(sv.label, lx + (sv.ldx || 14), ly + (sv.ldy || -16), { px: sv.lpx || 30, weight: 700, color: sv.col || C.pGreen, align: sv.lalign || "left" }); ctx.globalAlpha = 1; });
  (cfg.vl || []).forEach((v) => { const a = fadeIn(t, d * (v.at || 0.3), 0.5); if (a <= 0) return; ctx.globalAlpha = a; const x = X(v.x); line([[x, T - 10], [x, B]], v.col || C.pInk, 2.5, [6, 7]);
    (Array.isArray(v.label) ? v.label : [v.label]).forEach((s, i) => text(s, x + (v.align === "right" ? -12 : 12), T + 24 + (v.ly || 0) + i * 32, { px: 27, weight: i ? 400 : 700, color: v.col || C.pInk, align: v.align || "left" })); ctx.globalAlpha = 1; });
  (cfg.dots || []).forEach((dt) => { const a = fadeIn(t, d * (dt.at || 0.5), 0.5); if (a <= 0) return; const v = dt.y ?? valAt(dt.k || cfg.series[0].k, dt.x); const x = X(dt.x), y = Y(v); ctx.globalAlpha = a;
    ctx.fillStyle = dt.col || C.pRed; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.strokeStyle = C.paper; ctx.lineWidth = 3; ctx.stroke();
    const lines = Array.isArray(dt.label) ? dt.label : [dt.label]; lines.forEach((s, i) => text(s, x + (dt.dx ?? 18), y + (dt.dy ?? -18) + i * 34, { px: i ? 27 : 31, weight: 700, color: dt.col || C.pRed, align: dt.align || "left" }));
    ctx.globalAlpha = 1; });
  if (cfg.proj) { const p = cfg.proj, s = ser(p.k), a = ease(prog(t, d * (p.at || 0.5), d * (p.at || 0.5) + 1.6)); if (a > 0) {
    ctx.save(); ctx.beginPath(); ctx.rect(L, T - 40, (R - L) * a + X(s.x[0]) - L, B - T + 42); ctx.clip();
    ctx.beginPath(); s.x.forEach((xv, i) => { const px = X(xv), py = Y(s.y[i]); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.strokeStyle = C.pRed; ctx.lineWidth = 4; ctx.setLineDash([4, 10]); ctx.lineCap = "round"; ctx.stroke(); ctx.setLineDash([]); ctx.restore();
    ctx.globalAlpha = fadeIn(t, d * (p.at || 0.5) + 1.2, 0.5); const xl = X(s.x[s.x.length - 1]), yl = Y(s.y[s.y.length - 1]); (Array.isArray(p.label) ? p.label : [p.label]).forEach((l, i) => text(l, xl - 10, yl + 46 + i * 32, { px: 27, weight: 700, color: C.pRed, align: "right" })); ctx.globalAlpha = 1; } }
  (cfg.tags || []).forEach((tg) => { const a = fadeIn(t, d * (tg.at || 0.5), 0.5); if (a <= 0) return; ctx.globalAlpha = a; const px = tg.px || 40, x = tg.x === undefined ? null : X(tg.x), y = tg.y === undefined ? null : Y(tg.y);
    const xx = tg.ax !== undefined ? tg.ax : x, yy = tg.ay !== undefined ? tg.ay : y; const w = measure(tg.text, px, true) + 40;
    const x0 = tg.align === "right" ? xx - w : tg.align === "center" ? xx - w / 2 : xx;
    rect(x0, yy - px - 12, w, px + 30, tg.fill || C.pInk, 4); text(tg.text, x0 + 20, yy + 4, { px, serif: true, color: tg.col || C.paper }); ctx.globalAlpha = 1; });
  if (cfg.foot) { ctx.globalAlpha = fadeIn(t, d * 0.6, 0.5); text(cfg.foot, L, by + bh - 22, { px: 24, color: C.pDim }); ctx.globalAlpha = 1; }
  if (cfg.legend) { let y = cfg.legendY || T + 12; ctx.globalAlpha = fadeIn(t, d * 0.1, 0.5);
    cfg.legend.forEach((l) => { const w = measure(l.txt, 28, false, 700), x = cfg.legendX ? cfg.legendX + 64 : R - w - 16; line([[x - 64, y - 9], [x - 16, y - 9]], l.col, 6, l.dash); text(l.txt, x, y, { px: 28, weight: 700, color: l.col }); y += 42; });
    ctx.globalAlpha = 1; }
}
const S = {};
const BOX = [110, 120, 1700, 880];
S.line = (t, d, p) => chart(t, d, p, p.box || BOX);
S.lines = (t, d, p) => p.charts.forEach((c, i) => chart(t, d, c, c.box));

/* ---------------- text scenes on the green ---------------- */
const chartCache = new Map();
function chartImage(cfg) {          // a finished chart (t = 99) drawn once to its own canvas, so it can be faded as one layer
  const key = JSON.stringify(cfg); if (chartCache.has(key)) return chartCache.get(key);
  const cv = document.createElement("canvas"); cv.width = W; cv.height = H; const keep = ctx; ctx = cv.getContext("2d");
  chart(99, 1, Object.assign({ draw: false }, cfg), BOX); ctx = keep; chartCache.set(key, cv); return cv;
}
S.title = (t, d, p) => {
  const k = p.hold ? ease(prog(t, p.hold, p.hold + 1.0)) : 0;     // after `hold` seconds the title gives way to the chart
  if (p.chart) { ctx.globalAlpha = 0.28 + 0.72 * k; ctx.drawImage(chartImage(p.chart), 0, 0); ctx.globalAlpha = 0.72 * (1 - k); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); }
  const o = 1 - k; if (o <= 0) { ctx.globalAlpha = 1; return; }
  const n = p.title.length, y0 = H / 2 - (n - 1) * 64 - 40;
  if (p.kicker) { ctx.globalAlpha = o * fadeIn(t, 0.05, 0.5); text(p.kicker.toUpperCase(), 174, y0 - 110, { px: 30, weight: 700, color: C.mint }); }
  p.title.forEach((l, i) => { const a = fadeIn(t, 0.15 + i * 0.45, 0.6); ctx.globalAlpha = o * a; const px = fitPx(l, 104, W - 340, { serif: true });
    text(l, 170, y0 + i * 128 + (1 - a) * 20, { px, serif: true, color: i === n - 1 ? C.gold : C.ink }); });
  ctx.globalAlpha = o; underline(174, y0 + (n - 1) * 128 + 38, Math.min(W - 340, measure(p.title[n - 1], 104, true)), C.gold, ease(prog(t, 0.6 + n * 0.4, 1.6 + n * 0.4)));
  if (p.sub) { ctx.globalAlpha = o * fadeIn(t, 0.6 + n * 0.45, 0.6); text(p.sub, 174, y0 + n * 128 + 40, { px: 36, color: C.dim }); }
  ctx.globalAlpha = 1;
};
S.statement = (t, d, p) => {
  const n = p.lines.length, step = Math.min(1.6, (d * 0.5) / n), lh = p.lh || 112, y0 = H / 2 - (n - 1) * lh / 2 - (p.sub ? 30 : 0) + 20;
  p.lines.forEach((l, i) => { const a = fadeIn(t, 0.2 + i * step, 0.6), acc = (p.accent || []).includes(i); ctx.globalAlpha = a; const px = fitPx(l, p.px || 74, W - 220, { serif: true });
    text(l, W / 2, y0 + i * lh + (1 - a) * 16, { px, serif: true, align: "center", color: acc ? C.gold : C.ink }); });
  if (p.sub) { ctx.globalAlpha = fadeIn(t, 0.4 + n * step, 0.8); (Array.isArray(p.sub) ? p.sub : [p.sub]).forEach((s, i) => text(s, W / 2, y0 + (n - 1) * lh + 100 + i * 50, { px: 36, align: "center", color: C.dim })); }
  ctx.globalAlpha = 1;
};
S.bullets = (t, d, p) => {
  const n = p.items.length, lh = p.lh || (n > 5 ? 92 : 118), px = p.px || (n > 5 ? 42 : 48), x = p.x || 300, y0 = (p.y0 || (H / 2 - (n * lh) / 2 + 20));
  const step = p.reveal ? null : (d * 0.7) / (n + 0.6);
  ctx.globalAlpha = fadeIn(t, 0.1); text(p.head, x, y0 - 20, { px: 64, serif: true, color: C.gold }); ctx.globalAlpha = 1;
  p.items.forEach((it, i) => { const at = p.reveal ? d * p.reveal[i] : 0.5 + i * step; const a = p.blank ? fadeIn(t, 0.3 + i * 0.25, 0.4) : fadeIn(t, at, 0.6), y = y0 + 110 + i * lh;
    ctx.globalAlpha = p.blank ? a : Math.max(a, p.reveal ? 1 : 0) ;
    const shown = p.reveal ? fadeIn(t, at, 0.6) : 1;
    ctx.strokeStyle = C.gold; ctx.lineWidth = 3; rect(x, y - 44, 54, 54, null, 4, C.gold, 3);
    text(p.numbered === false ? "·" : String(i + 1), x + 27, y - 4, { px: 32, weight: 700, align: "center", color: C.gold, serif: true });
    if (p.blank || (p.reveal && shown < 1)) { ctx.fillStyle = "rgba(159,220,185,0.25)"; ctx.fillRect(x + 90, y + 4, 780, 3); }
    if (!p.blank && it) { ctx.globalAlpha = p.reveal ? shown : a; const ip = fitPx(it, px, W - x - 200); text(it, x + 90 + (1 - (p.reveal ? shown : a)) * 20, y, { px: ip, color: C.ink }); }
    ctx.globalAlpha = 1; });
  ctx.globalAlpha = 1;
};
S.card = (t, d, p) => {
  const x = 230, w = W - 460, h = p.h || 560, y = (H - h) / 2;
  paper(x, y, w, h, p.label || "source", { plain: true });
  ctx.globalAlpha = fadeIn(t, 0.3, 0.6); (Array.isArray(p.big) ? p.big : [p.big]).forEach((b, i) => text(b, x + 110, y + 150 + i * 84, { px: fitPx(b, p.bpx || 66, w - 200, { serif: true }), serif: true, color: C.pInk }));
  (p.lines || []).forEach((l, i) => { ctx.globalAlpha = fadeIn(t, 1.0 + i * (p.step || 1.2), 0.5); text(l, x + 110, y + (p.ly || 330) + i * 60, { px: 40, color: i === (p.hot ?? -1) ? C.pRed : C.pInk, weight: i === (p.hot ?? -1) ? 700 : 400 }); });
  ctx.globalAlpha = fadeIn(t, d * 0.4, 0.6); if (p.foot) text(p.foot, x + 110, y + h - 40, { px: 26, color: C.pDim }); ctx.globalAlpha = 1;
};
S.endcard = (t, d, p) => {
  text("Money, Entirely", 150, 300, { px: 112, serif: true }); underline(154, 336, measure("Money, Entirely", 112, true), C.gold, ease(prog(t, 0.3, 1.3)));
  text("The entire story of money, explained from the data.", 154, 410, { px: 40, color: C.gold });
  (p.lines || []).forEach((l, i) => text(l, 154, 560 + i * 64, { px: 46, serif: true, color: i ? C.dim : C.ink }));
  text("Every number on screen comes from public data. Every source is listed in the description.", 154, 900, { px: 30, color: C.dim });
  ctx.setLineDash([10, 10]); rect(1220, 170, 560, 315, null, 6, C.faint, 3); ctx.beginPath(); ctx.arc(1500, 790, 170, 0, 7); ctx.strokeStyle = C.faint; ctx.stroke(); ctx.setLineDash([]);
};

/* ---------------- bars and tables on paper ---------------- */
S.hbars = (t, d, p) => {
  const R = p.rows, x0 = p.x0 || 640, lh = p.lh || 112, bw = p.bw || 900, max = p.max, n = R.length, ph = Math.max(520, n * lh + 260), py = Math.max(118, (H - ph) / 2 + 20);
  paper(110, py, 1700, ph, p.head);
  const y0 = py + 110;
  R.forEach((r, i) => { const s = d * (0.06 + i * (p.step || 0.1)), a = fadeIn(t, s, 0.5), g = ease(prog(t, s, s + 0.9)), y = y0 + i * lh; ctx.globalAlpha = a;
    const lp = fitPx(r.label, p.lpx || 36, x0 - 220, { weight: 700 }); text(r.label, x0 - 30, y + 48, { px: lp, align: "right", weight: 700, color: C.pInk });
    if (r.sub) text(r.sub, x0 - 30, y + 82, { px: 25, align: "right", color: C.pDim });
    const len = Math.max(0, (Math.min(r.value, max) / max) * bw * g);
    rect(x0, y + 8, len, lh * 0.55, r.col || C.pGreen, 3); if (r.value > max && g > 0.95) { ctx.fillStyle = C.paper; for (let k = 0; k < 2; k++) ctx.fillRect(x0 + len - 60 + k * 18, y + 4, 8, lh * 0.55 + 8); }
    text(r.txt, x0 + len + 20, y + 8 + lh * 0.55 / 2 + 15, { px: p.vpx || 44, weight: 700, color: r.col || C.pInk, serif: true }); });
  ctx.globalAlpha = 1; if (p.foot) { ctx.globalAlpha = fadeIn(t, d * 0.7, 0.5); text(p.foot, 210, py + ph - 34, { px: 26, color: C.pDim }); ctx.globalAlpha = 1; }
};
/* vertical bars; log scale optional. p.bars: [{label, value, txt, col, sub}] */
S.vbars = (t, d, p) => {
  const B = p.bars, n = B.length, px = 110, py = 120, pw = 1700, ph = 880; paper(px, py, pw, ph, p.head);
  const L = px + 200, R = px + pw - 120, T = py + 150, Bt = py + ph - 150, slot = (R - L) / n, bw = Math.min(p.bw || 220, slot * 0.62);
  const lo = p.log ? Math.log10(p.min || 1) : 0, hi = p.log ? Math.log10(p.max) : p.max;
  const hgt = (v) => p.log ? (Math.log10(Math.max(v, p.min || 1)) - lo) / (hi - lo) * (Bt - T) : (v / p.max) * (Bt - T);
  (p.yt || []).forEach((v) => { const y = Bt - hgt(v); ctx.fillStyle = "rgba(29,43,36,0.13)"; ctx.fillRect(L - 20, y, R - L + 20, 1.5); text(p.ytl ? p.ytl[(p.yt).indexOf(v)] : tickLabel(v, p.yf), L - 34, y + 9, { px: 26, align: "right", color: C.pDim }); });
  B.forEach((b, i) => { const s = d * (0.08 + i * (p.step || 0.12)), g = ease(prog(t, s, s + 0.9)), cx = L + slot * (i + 0.5), h = hgt(b.value) * g;
    ctx.globalAlpha = fadeIn(t, s, 0.4); rect(cx - bw / 2, Bt - h, bw, h, b.col || C.pGreen, 3);
    const lp = fitPx(b.label, p.lpx || 32, slot - 10, { weight: 700 }); text(b.label, cx, Bt + 44, { px: lp, weight: 700, align: "center", color: C.pInk });
    if (b.sub) text(b.sub, cx, Bt + 80, { px: 25, align: "center", color: C.pDim });
    if (g > 0.9) { const tp = fitPx(b.txt, p.vpx || 40, slot - 6, { serif: true }); text(b.txt, cx, Bt - h - 18, { px: tp, weight: 700, serif: true, align: "center", color: b.col || C.pInk }); } });
  ctx.globalAlpha = 1; ctx.fillStyle = C.pInk; ctx.fillRect(L - 20, Bt, R - L + 20, 2.5);
  if (p.big) { ctx.globalAlpha = fadeIn(t, d * (p.bigAt || 0.6), 0.5); const [bx, by] = p.bigPos || [R - 10, T + 40]; text(p.big, bx, by, { px: p.bigPx || 110, serif: true, align: p.bigAlign || "right", color: C.pRed }); if (p.bigSub) text(p.bigSub, bx, by + 50, { px: 30, align: p.bigAlign || "right", color: C.pRed, weight: 700 }); ctx.globalAlpha = 1; }
  if (p.foot) { ctx.globalAlpha = fadeIn(t, d * 0.7, 0.5); text(p.foot, px + 110, py + ph - 30, { px: 25, color: C.pDim }); ctx.globalAlpha = 1; }
};
S.table = (t, d, p) => {
  const n = p.rows.length, lh = p.lh || 76, cols = p.cols, ph = n * lh + 250, py = Math.max(100, (H - ph) / 2 + 10), x0 = 230;
  paper(110, py, 1700, ph, p.head);
  const y0 = py + 100;
  p.hdr.forEach((h, j) => text(h, x0 + cols[j], y0, { px: 25, weight: 700, color: C.pGreen, align: j ? "right" : "left" }));
  p.rows.forEach((r, i) => { const at = p.rowAt ? d * p.rowAt[i] : d * (0.05 + i * (p.step || 0.05)); ctx.globalAlpha = fadeIn(t, at, 0.4); const y = y0 + 22 + i * lh, hi = (p.hl || []).includes(i);
    const hiA = hi ? fadeIn(t, d * (p.hlAt || 0), 0.5) : 0;
    if (hiA > 0) { ctx.save(); ctx.globalAlpha *= hiA; rect(x0 - 24, y + 2, cols[cols.length - 1] + 48, lh - 8, "rgba(184,57,44,0.14)", 3); ctx.restore(); }
    ctx.fillStyle = "rgba(29,43,36,0.18)"; ctx.fillRect(x0 - 24, y + lh - 4, cols[cols.length - 1] + 48, 1.5);
    r.forEach((c, j) => text(String(c), x0 + cols[j], y + lh / 2 + 12, { px: p.px || 34, weight: j === 0 ? 700 : 400, mono: j > 0 && p.mono, align: j ? "right" : "left", color: hiA > 0.5 ? C.pRed : C.pInk })); });
  ctx.globalAlpha = 1; if (p.foot) { ctx.globalAlpha = fadeIn(t, d * 0.7, 0.5); text(p.foot, x0, py + ph - 34, { px: 25, color: C.pDim }); ctx.globalAlpha = 1; }
};
/* big figures, one tile at a time: p.tiles [{big, small, col}], p.foot */
S.counter = (t, d, p) => {
  const n = p.tiles.length, gap = 40, tw = Math.min(560, (W - 240 - gap * (n - 1)) / n), th = p.th || 380, x0 = (W - (tw * n + gap * (n - 1))) / 2, y = p.y || (H - th) / 2 - (p.foot ? 40 : 0);
  if (p.head) { ctx.globalAlpha = fadeIn(t, 0.05, 0.5); text(p.head, W / 2, y - 60, { px: 40, serif: true, align: "center", color: C.gold }); ctx.globalAlpha = 1; }
  p.tiles.forEach((tl, i) => { const at = p.at ? d * p.at[i] : 0.3 + i * Math.min(2.4, d * 0.6 / n), a = fadeIn(t, at, 0.5); if (a <= 0) return; ctx.globalAlpha = a; const x = x0 + i * (tw + gap);
    paper(x, y + (1 - a) * 20, tw, th, tl.label, { plain: true });
    const bp = fitPx(tl.big, tl.px || 96, tw - 50, { serif: true }); text(tl.big, x + tw / 2, y + th / 2 + 20, { px: bp, serif: true, align: "center", color: tl.col || C.pInk });
    (Array.isArray(tl.small) ? tl.small : [tl.small]).forEach((s, k) => { if (s) text(s, x + tw / 2, y + th / 2 + 90 + k * 40, { px: fitPx(s, 32, tw - 40), align: "center", color: C.pDim, weight: 700 }); }); ctx.globalAlpha = 1; });
  if (p.foot) { ctx.globalAlpha = fadeIn(t, d * (p.footAt || 0.7), 0.6); (Array.isArray(p.foot) ? p.foot : [p.foot]).forEach((f, i) => text(f, W / 2, y + th + 110 + i * 64, { px: fitPx(f, p.footPx || 50, W - 200, { serif: true }), serif: true, align: "center", color: i ? C.dim : C.gold })); ctx.globalAlpha = 1; }
};

/* ---------------- drawn objects (diagrams, never images) ---------------- */
function coin(cx, cy, r, fine, label, sub, t0, t) {
  const a = fadeIn(t, t0, 0.6); if (a <= 0) return; ctx.globalAlpha = a;
  const col = (f) => { const s = [215, 220, 220], c = [184, 116, 62]; return `rgb(${s.map((v, i) => Math.round(c[i] + (v - c[i]) * f)).join(",")})`; };
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, "#ffffff"); g.addColorStop(0.35, col(fine)); g.addColorStop(1, "rgba(40,40,40,0.9)");
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = "rgba(20,20,20,0.5)"; ctx.stroke();
  ctx.fillStyle = "rgba(30,30,30,0.35)"; for (let k = 0; k < 64; k++) { const an = k / 64 * Math.PI * 2; ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r * 0.88, cy + Math.sin(an) * r * 0.88, r * 0.022, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.arc(cx, cy, r * 0.78, 0, 7); ctx.strokeStyle = "rgba(30,30,30,0.35)"; ctx.lineWidth = 2; ctx.stroke();
  text(label, cx, cy + r * 0.12, { px: Math.round(r * 0.3), serif: true, align: "center", color: "rgba(25,25,25,0.82)" });
  if (sub) text(sub, cx, cy + r * 0.42, { px: Math.round(r * 0.13), weight: 700, align: "center", color: "rgba(25,25,25,0.7)" });
  ctx.globalAlpha = 1;
}
/* p.coins: [{label, sub, fine, r, x, lines: [..], col}]; p.head */
S.coin = (t, d, p) => {
  const n = p.coins.length;
  if (p.head) { ctx.globalAlpha = fadeIn(t, 0.05); text(p.head, W / 2, 150, { px: 44, serif: true, align: "center", color: C.gold }); ctx.globalAlpha = 1; }
  p.coins.forEach((c, i) => { const cx = c.x || W * (i + 1) / (n + 1), cy = c.y || 460, r = c.r || 230, at = d * (c.at ?? (0.05 + i * 0.35));
    coin(cx, cy, r, c.fine ?? 1, c.label, c.sub, at, t);
    (c.lines || []).forEach((l, k) => { ctx.globalAlpha = fadeIn(t, at + 0.6 + k * 0.5, 0.5); text(l, cx, cy + r + 80 + k * 54, { px: k ? 36 : 44, serif: !k, weight: 700, align: "center", color: k ? C.dim : (c.col || C.ink) }); });
    ctx.globalAlpha = 1; });
};
/* a stylised banknote: guilloche border, rosette, denomination as text. Drawn; not a reproduction of any real note. */
function banknote(x, y, w, h, o) {
  const base = o.base || "#d9cfa8", ink = o.ink || "#4a3f6b";
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; rect(x, y, w, h, base, 10); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.clip();
  ctx.strokeStyle = ink; ctx.globalAlpha = 0.25; ctx.lineWidth = 1.2;
  for (let j = 0; j < 7; j++) { ctx.beginPath(); for (let k = 0; k <= 800; k++) { const u = k / 800, per = 2 * (w + h), s = u * per; let px, py;
      if (s < w) { px = x + s; py = y; } else if (s < w + h) { px = x + w; py = y + s - w; } else if (s < 2 * w + h) { px = x + w - (s - w - h); py = y + h; } else { px = x; py = y + h - (s - 2 * w - h); }
      const off = 22 + j * 3 + 8 * Math.sin(u * 220 + j * 0.9); const nx = px < x + 1 ? 1 : px > x + w - 1 ? -1 : 0, ny = py < y + 1 ? 1 : py > y + h - 1 ? -1 : 0;
      const qx = px + nx * off, qy = py + ny * off; k ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); } ctx.stroke(); }
  const rx = x + w * 0.24, ry = y + h * 0.5; for (let j = 0; j < 16; j++) { ctx.beginPath(); for (let k = 0; k <= 720; k++) { const a = k / 720 * Math.PI * 2, rr = h * 0.12 + j * 5 + 14 * Math.sin(18 * a + j * 0.4); const qx = rx + rr * Math.cos(a), qy = ry + rr * Math.sin(a); k ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); } ctx.stroke(); }
  ctx.globalAlpha = 1; ctx.strokeStyle = ink; ctx.lineWidth = 3; ctx.strokeRect(x + 60, y + 60, w - 120, h - 120);
  ctx.restore();
  text((o.top || "").toUpperCase(), x + w * 0.62, y + 140, { px: fitPx((o.top || "").toUpperCase(), 40, w * 0.6, { serif: true }), serif: true, align: "center", color: ink });
  const dp = fitPx(o.denom, 140, w * 0.54, { serif: true }); text(o.denom, x + w * 0.655, y + h * 0.5 + dp * 0.35, { px: dp, serif: true, align: "center", color: ink });
  text(o.words || "", x + w * 0.62, y + h - 130, { px: fitPx(o.words || "", 46, w * 0.62, { serif: true }), serif: true, align: "center", color: ink });
  text(o.corner || "", x + 100, y + 130, { px: 56, serif: true, color: ink }); text(o.corner || "", x + w - 100, y + h - 90, { px: 56, serif: true, color: ink, align: "right" });
  text("DIAGRAM · NOT A REPRODUCTION", x + w / 2, y + h - 80, { px: 20, weight: 700, align: "center", color: ink });
}
S.banknote = (t, d, p) => {
  const a = ease(prog(t, 0.1, 1.0)), w = p.w || 1300, h = p.h || 560, x = (W - w) / 2, y = (p.y || 130) + (1 - a) * 40;
  ctx.globalAlpha = a; ctx.save(); ctx.translate(W / 2, y + h / 2); ctx.rotate((1 - a) * -0.04 - 0.012); ctx.translate(-W / 2, -(y + h / 2)); banknote(x, y, w, h, p); ctx.restore(); ctx.globalAlpha = 1;
  (p.lines || []).forEach((l, i) => { ctx.globalAlpha = fadeIn(t, d * (p.lineAt ? p.lineAt[i] : 0.35 + i * 0.2), 0.6); const px = fitPx(l, i === 0 ? 46 : 38, W - 160, { serif: i === 0, mono: p.monoLine === i }); text(l, W / 2, y + h + 110 + i * 70, { px, serif: i === 0, mono: p.monoLine === i, weight: 700, align: "center", color: i === 0 ? C.gold : C.ink }); });
  ctx.globalAlpha = 1;
};
/* the Edict as a stylised stone tablet with ruled lines; a few readable lines in English */
S.tablet = (t, d, p) => {
  const w = 1000, h = 700, x = (W - w) / 2, y = 150, a = fadeIn(t, 0.1, 0.8); ctx.globalAlpha = a;
  ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
  ctx.beginPath(); ctx.moveTo(x + 20, y); ctx.lineTo(x + w - 60, y + 10); ctx.lineTo(x + w, y + 90); ctx.lineTo(x + w - 30, y + h - 40); ctx.lineTo(x + w - 140, y + h); ctx.lineTo(x + 40, y + h - 20); ctx.lineTo(x, y + 300); ctx.closePath();
  const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#cfc8b6"); g.addColorStop(1, "#a9a291"); ctx.fillStyle = g; ctx.fill(); ctx.restore();
  ctx.strokeStyle = "rgba(60,55,45,0.25)"; ctx.lineWidth = 2; for (let k = 0; k < 13; k++) { const yy = y + 200 + k * 34; ctx.beginPath(); ctx.moveTo(x + 70, yy); for (let xx = x + 70; xx < x + w - 110; xx += 22) ctx.lineTo(xx, yy + Math.sin(xx * 0.3 + k) * 1.5); ctx.stroke(); }
  text(p.title, W / 2, y + 110, { px: 54, serif: true, align: "center", color: "#3b362c" }); text(p.date, W / 2, y + 168, { px: 34, serif: true, align: "center", color: "#3b362c" });
  ctx.globalAlpha = 1;
  (p.rows || []).forEach((r, i) => { const ra = fadeIn(t, d * (0.3 + i * 0.17), 0.5); ctx.globalAlpha = ra; const yy = y + 280 + i * 100; rect(x + 110, yy - 52, w - 280, 76, i === p.rows.length - 1 ? "rgba(184,57,44,0.85)" : "rgba(29,43,36,0.82)", 4);
    text(r, x + 140, yy, { px: 40, weight: 700, color: C.paper }); }); ctx.globalAlpha = 1;
  if (p.foot) { ctx.globalAlpha = fadeIn(t, d * 0.7, 0.5); text(p.foot, W / 2, y + h + 90, { px: 32, align: "center", color: C.dim }); ctx.globalAlpha = 1; }
};
/* an engraved name card (no portrait) and a short timeline */
S.nameplate = (t, d, p) => {
  const cx = 560, cy = 470, rx = 300, ry = 360, a = fadeIn(t, 0.1, 0.8); ctx.globalAlpha = a;
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fillStyle = C.paper; ctx.fill(); ctx.clip();
  ctx.strokeStyle = "rgba(29,43,36,0.22)"; ctx.lineWidth = 1.4; for (let k = -ry * 2; k < ry * 2; k += 9) { ctx.beginPath(); ctx.moveTo(cx - rx, cy + k); ctx.lineTo(cx + rx, cy + k - rx * 0.6); ctx.stroke(); }
  ctx.restore(); ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.lineWidth = 10; ctx.strokeStyle = C.gold; ctx.stroke(); ctx.beginPath(); ctx.ellipse(cx, cy, rx - 22, ry - 22, 0, 0, 7); ctx.lineWidth = 2; ctx.stroke();
  rect(cx - 230, cy - 70, 460, 150, C.paper, 6, C.pInk, 3); text(p.name, cx, cy + 10, { px: 70, serif: true, align: "center", color: C.pInk }); text(p.sub, cx, cy + 56, { px: 30, align: "center", color: C.pDim, weight: 700 });
  ctx.globalAlpha = 1;
  const tx = 1010, ty0 = 250; ctx.fillStyle = C.gold; ctx.fillRect(tx, ty0, 4, (p.events.length - 1) * 220 + 10);
  p.events.forEach((e, i) => { const ea = fadeIn(t, d * (0.2 + i * 0.22), 0.5); ctx.globalAlpha = ea; const y = ty0 + i * 220;
    ctx.beginPath(); ctx.arc(tx + 2, y + 4, 16, 0, 7); ctx.fillStyle = i === p.events.length - 1 ? C.red : C.gold; ctx.fill();
    text(e[0], tx + 50, y + 18, { px: 56, serif: true, color: i === p.events.length - 1 ? C.red : C.gold }); text(e[1], tx + 50, y + 70, { px: 38, color: C.ink }); ctx.globalAlpha = 1; });
  if (p.foot) { ctx.globalAlpha = fadeIn(t, d * 0.6, 0.5); text(p.foot, cx, cy + ry + 90, { px: 28, align: "center", color: C.dim }); ctx.globalAlpha = 1; }
};
/* more money / fewer goods -> prices */
S.diagram = (t, d, p) => {
  const box = (x, y, w, s, col, at) => { const a = fadeIn(t, d * at, 0.5); if (a <= 0) return; ctx.globalAlpha = a; paper(x, y, w, 150, null, { plain: true }); text(s, x + w / 2, y + 96, { px: fitPx(s, 58, w - 40, { serif: true }), serif: true, align: "center", color: col }); ctx.globalAlpha = 1; };
  const arrow = (x1, y1, x2, y2, at) => { const g = ease(prog(t, d * at, d * at + 0.8)); if (g <= 0) return; const xe = lerp(x1, x2, g), ye = lerp(y1, y2, g); line([[x1, y1], [xe, ye]], C.gold, 8);
    if (g > 0.95) { const an = Math.atan2(y2 - y1, x2 - x1); ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 34 * Math.cos(an - 0.45), y2 - 34 * Math.sin(an - 0.45)); ctx.lineTo(x2 - 34 * Math.cos(an + 0.45), y2 - 34 * Math.sin(an + 0.45)); ctx.fill(); } };
  box(170, 200, 620, p.a, C.pGreen, 0.05); box(170, 650, 620, p.b, C.pBlue, 0.3);
  arrow(800, 290, 1180, 470, 0.15); arrow(800, 720, 1180, 560, 0.4); box(1200, 430, 560, p.c, C.pRed, 0.55);
  (p.ex || []).forEach((e, i) => { ctx.globalAlpha = fadeIn(t, d * (0.2 + i * 0.25), 0.5); text(e[1], 480, e[0] === "a" ? 410 : 860, { px: 30, align: "center", color: C.dim }); ctx.globalAlpha = 1; });
};
/* simple map from Natural Earth outlines in EP.data.maps[set] */
function mproj(view, box) { const k = Math.cos(((view[1] + view[3]) / 2) * Math.PI / 180), dx = (view[2] - view[0]) * k, dy = view[3] - view[1];
  const s = Math.min(box[2] / dx, box[3] / dy), cx = box[0] + box[2] / 2, cy = box[1] + box[3] / 2, lc = (view[0] + view[2]) / 2, pc = (view[1] + view[3]) / 2;
  const P = (lon, lat) => [cx + (lon - lc) * k * s, cy - (lat - pc) * s]; P.pxPerKm = s / 111.32; return P; }
function mpoly(P, ring, fill, stroke, lw) { ctx.beginPath(); ring.forEach(([x, y], i) => { const [a, b] = P(x, y); i ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 2; ctx.lineJoin = "round"; ctx.stroke(); } }
S.map = (t, d, p) => {
  const M = EP.data.maps[p.set], box = p.box || [110, 120, 1700, 860], P = mproj(p.view || M.view, box);
  ctx.save(); ctx.beginPath(); ctx.roundRect(box[0], box[1], box[2], box[3], 6); ctx.clip(); rect(box[0], box[1], box[2], box[3], "#0b2019", 0);
  ctx.strokeStyle = "rgba(159,220,185,0.08)"; ctx.lineWidth = 1; for (let gx = -180; gx <= 180; gx += 10) { const [a] = P(gx, 0); ctx.beginPath(); ctx.moveTo(a, box[1]); ctx.lineTo(a, box[1] + box[3]); ctx.stroke(); }
  for (let gy = -80; gy <= 80; gy += 10) { const [, b] = P(0, gy); ctx.beginPath(); ctx.moveTo(box[0], b); ctx.lineTo(box[0] + box[2], b); ctx.stroke(); }
  M.land.forEach((r) => mpoly(P, r, "#24503f", null));
  Object.entries(M.countries).forEach(([nm, rings]) => { const hot = M.hl.includes(nm); const a = hot ? fadeIn(t, d * (p.hlAt || 0.1), 0.8) : 1;
    rings.forEach((r) => { mpoly(P, r, null, "rgba(243,237,218,0.35)", 1.5); if (hot) { ctx.globalAlpha = a; mpoly(P, r, "#3d7a5f", C.gold, 3); ctx.globalAlpha = 1; } }); });
  if (M.region) { const a = fadeIn(t, d * (p.regionAt || 0.3), 0.6), [x, y] = P(M.region.lon, M.region.lat), r = M.region.km * P.pxPerKm; ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fillStyle = "rgba(239,122,98,0.45)"; ctx.fill(); ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.stroke();
    ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.9)"; ctx.shadowBlur = 8; text(M.region.label, x + r + 16, y + 12, { px: 40, weight: 700, color: C.red, align: "left" }); ctx.restore(); ctx.globalAlpha = 1; }
  if (p.route) { const pts = M.pts.map((q) => P(q.lon, q.lat)), g = ease(prog(t, d * 0.15, d * 0.75)); const seg = [];
    for (let i = 0; i < pts.length - 1; i++) { const [a, b] = pts[i], [c, e] = pts[i + 1], mx = (a + c) / 2, my = Math.min(b, e) - Math.hypot(c - a, e - b) * 0.18; for (let k = 0; k <= 40; k++) { const u = k / 40; seg.push([(1 - u) ** 2 * a + 2 * (1 - u) * u * mx + u * u * c, (1 - u) ** 2 * b + 2 * (1 - u) * u * my + u * u * e]); } }
    line(seg.slice(0, Math.max(2, Math.floor(seg.length * g))), C.gold, 6, [16, 12]); }
  M.pts.forEach((q, i) => { const [x, y] = P(q.lon, q.lat), a = fadeIn(t, d * (p.ptsAt ? p.ptsAt[i] : 0.15 + i * 0.25), 0.5); ctx.globalAlpha = a;
    ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fillStyle = C.gold; ctx.fill(); ctx.strokeStyle = "#0b2019"; ctx.lineWidth = 3; ctx.stroke();
    const left = (p.left || []).includes(q.name); ctx.save(); ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 10; text(q.name, x + (left ? -24 : 24), y + 12, { px: 40, weight: 700, align: left ? "right" : "left" }); ctx.restore(); ctx.globalAlpha = 1; });
  ctx.restore();
  rect(box[0], box[1], box[2], box[3], null, 6, "rgba(231,184,90,0.6)", 2);
  if (p.head) { const L = p.head.toUpperCase(), lw = measure(L, 22, false, 700) + 36; rect(box[0] + 86, box[1] - 18, lw, 36, C.pGreen, 2); text(L, box[0] + 104, box[1] + 8, { px: 22, weight: 700, color: C.paper }); }
  if (p.note) { ctx.globalAlpha = fadeIn(t, d * (p.noteAt || 0.5), 0.6); const nl = p.note, nw = 640, nh = 40 + nl.length * 54, nx = p.noteX || box[0] + box[2] - nw - 30, ny = p.noteY || box[1] + 40;
    paper(nx, ny, nw, nh, null, { plain: true }); nl.forEach((l, i) => text(l, nx + 30, ny + 62 + i * 54, { px: fitPx(l, i ? 32 : 40, nw - 60, { serif: !i }), serif: !i, weight: 700, color: i ? C.pInk : C.pGreen })); ctx.globalAlpha = 1; }
};

/* ---------------- frame ---------------- */
function chapterStarts() { const out = []; let prev = null; EP.storyboard.beats.forEach((b, i) => { if (b.chapter && b.chapter !== prev) out.push(EP.timeline.beats[i].start); prev = b.chapter || prev; }); return out; }
let CH = null;
function renderAt(T) {
  const tl = EP.timeline.beats; let k = 0;
  while (k < tl.length - 1 && T >= tl[k + 1].start) k++;
  const b = tl[k], beat = EP.storyboard.beats[k], t = Math.max(0, T - b.start), last = k === tl.length - 1, d = last ? (EP.timeline.total - b.start) : b.dur;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
  const dr = (T * 2) % 240; ctx.drawImage(background(), -dr * 0.5, -dr * 0.25);
  const g = ctx.createRadialGradient(W / 2, H / 2, 320, W / 2, H / 2, 1300); g.addColorStop(0, "rgba(14,42,33,0)"); g.addColorStop(1, "rgba(4,14,10,0.6)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const edge = Math.min(ease(prog(t, 0, 0.35)), last ? 1 : 1 - ease(prog(t, d - 0.25, d)));
  const z = 1 + 0.008 * prog(t, 0, d) + 0.02 * (1 - edge);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
  S[beat.scene](t, b.speech + 0.01, beat.p || {});
  ctx.restore(); ctx.globalAlpha = 1;
  if (edge < 1) { ctx.globalAlpha = 1 - edge; ctx.fillStyle = C.bg; ctx.fillRect(0, 96, W, H - 106); ctx.globalAlpha = 1; }
  if (beat.chapter) {   // chapter label: a cream ledger tab with a red margin stripe
    const fresh = k === 0 || EP.storyboard.beats[k - 1].chapter !== beat.chapter, s1 = fresh ? ease(prog(t, 0.05, 0.6)) : 1;
    const label = beat.chapter.toUpperCase(), w = measure(label, 23, false, 700) + 54; ctx.globalAlpha = s1;
    rect(56 - (1 - s1) * 40, 34, w, 46, C.paper, 3); ctx.fillStyle = C.pRed; ctx.fillRect(56 - (1 - s1) * 40, 34, 7, 46);
    text(label, 84 - (1 - s1) * 40, 66, { px: 23, weight: 700, color: C.pGreen }); ctx.globalAlpha = 1;
  }
  if (!CH) CH = chapterStarts();
  ctx.fillStyle = "#07170f"; ctx.fillRect(0, H - 8, W, 8); ctx.fillStyle = C.gold; ctx.fillRect(0, H - 8, W * (T / EP.timeline.total), 8);
  ctx.fillStyle = "#07170f"; CH.forEach((s) => ctx.fillRect(W * (s / EP.timeline.total) - 1, H - 8, 3, 8));
}
function init() { const c = document.getElementById("c"); ctx = c.getContext("2d");
  return Promise.all([`700 40px ${SERIF}`, `400 40px ${SERIF}`, `400 40px ${SANS}`, `700 40px ${SANS}`, `400 40px ${MONO}`, `700 40px ${MONO}`].map((f) => document.fonts.load(f))).then(() => true); }
function frameJPEG(T, q) { renderAt(T); return document.getElementById("c").toDataURL("image/jpeg", q || 0.93).split(",")[1]; }

/* ---------------- vertical Shorts ---------------- */
let shortCanvas = null;
function wrapLines(c2, str, maxW) { const words = str.split(" "), lines = []; let cur = "";
  for (const w of words) { const tt = cur ? cur + " " + w : w; if (c2.measureText(tt).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tt; }
  if (cur) lines.push(cur); return lines; }
function shortGround(c2, SW, SH) { c2.fillStyle = C.bg; c2.fillRect(0, 0, SW, SH); c2.drawImage(background(), 0, 0, W, H, -400, 0, W * 1.78, SH); c2.fillStyle = "rgba(4,14,10,0.35)"; c2.fillRect(0, 0, SW, SH); }
function frameShort(T, cfg) {
  renderAt(T);
  if (!shortCanvas) { shortCanvas = document.createElement("canvas"); shortCanvas.width = 1080; shortCanvas.height = 1920; }
  const c2 = shortCanvas.getContext("2d"), SW = 1080, SH = 1920, main = document.getElementById("c");
  shortGround(c2, SW, SH);
  const sx = cfg.sx, sw = cfg.sw, sy = cfg.sy || 100, sh = cfg.sh || 968, dh = Math.round(sh * SW / sw), dy = 520;
  if (!cfg.tag) { c2.drawImage(main, sx, sy, sw, sh, 0, dy, SW, dh); c2.fillStyle = C.gold; c2.fillRect(0, dy - 4, SW, 4); c2.fillRect(0, dy + dh, SW, 4); }
  c2.textAlign = "center"; c2.textBaseline = "alphabetic";
  cfg.head.forEach((l, i) => { c2.font = `700 76px ${SERIF}`; let s = 76; while (c2.measureText(l).width > 1000 && s > 40) { s -= 2; c2.font = `700 ${s}px ${SERIF}`; } c2.fillStyle = i === cfg.head.length - 1 ? C.gold : C.ink; c2.fillText(l, SW / 2, 290 + i * 96); });
  if (cfg.tag) { c2.font = `700 104px ${SERIF}`; c2.fillStyle = C.ink; c2.fillText("Money, Entirely", SW / 2, 880);
    c2.font = `400 42px ${SANS}`; c2.fillStyle = C.gold; c2.fillText("The entire story of money, from the data.", SW / 2, 960);
    c2.font = `700 52px ${SANS}`; c2.fillStyle = C.ink; wrapLines(c2, cfg.cap, 900).forEach((l, i) => c2.fillText(l, SW / 2, 1150 + i * 72)); }
  else if (cfg.cap) { const y0 = dy + dh + 120; let s = 54, lines;
    for (;;) { c2.font = `700 ${s}px ${SANS}`; lines = wrapLines(c2, cfg.cap, 940); if (y0 + (lines.length - 1) * s * 1.35 + s * 0.3 <= SH - 60 || s <= 32) break; s -= 2; }
    lines.forEach((l, i) => { c2.fillStyle = C.ink; c2.fillText(l, SW / 2, y0 + i * s * 1.35); }); }
  c2.fillStyle = C.paper; c2.fillRect(SW / 2 - 190, 92, 380, 56); c2.fillStyle = C.pRed; c2.fillRect(SW / 2 - 190, 92, 8, 56);
  c2.font = `700 32px ${SANS}`; c2.fillStyle = C.pGreen; c2.fillText("MONEY, ENTIRELY", SW / 2 + 4, 132);
  return shortCanvas.toDataURL("image/jpeg", 0.93).split(",")[1];
}
function thumbShort(T, cfg, th) {
  frameShort(T, cfg); const c = shortCanvas.getContext("2d"), SW = 1080;
  c.save(); c.beginPath(); c.rect(0, 0, SW, 508); c.clip(); shortGround(c, SW, 1920); c.restore(); c.textAlign = "center";
  c.fillStyle = C.paper; c.fillRect(SW / 2 - 190, 70, 380, 56); c.fillStyle = C.pRed; c.fillRect(SW / 2 - 190, 70, 8, 56);
  c.font = `700 32px ${SANS}`; c.fillStyle = C.pGreen; c.fillText("MONEY, ENTIRELY", SW / 2 + 4, 110);
  th.big.forEach((l, i) => { let s = 150; c.font = `700 ${s}px ${SERIF}`; while (c.measureText(l).width > 990) { s -= 4; c.font = `700 ${s}px ${SERIF}`; }
    c.fillStyle = i === th.big.length - 1 ? C.gold : C.ink; c.fillText(l, SW / 2, 280 + i * 160); });
  c.fillStyle = "rgba(14,42,33,0.92)"; c.fillRect(0, 1450, SW, 260);
  c.font = `700 62px ${SANS}`; c.fillStyle = C.gold; wrapLines(c, th.small, 960).forEach((l, i) => c.fillText(l, SW / 2, 1550 + i * 80));
  return shortCanvas.toDataURL("image/jpeg", 0.92).split(",")[1];
}
