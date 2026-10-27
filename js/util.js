/* ===== 共用工具：常數、數值格式、Canvas 繪圖 ===== */
'use strict';
var PH = (function () {
  var K = {
    h: 6.62607015e-34, c: 2.99792458e8, e: 1.602176634e-19,
    me: 9.1093837015e-31, mp: 1.67262192369e-27, kB: 1.380649e-23,
    hbar: 1.054571817e-34, sigma: 5.670374419e-8, eps0: 8.8541878128e-12,
    a0: 5.29177210903e-11, R: 1.0973731568160e7, muB: 9.2740100783e-24
  };
  K.hc_eVnm = 1239.841984;  // eV·nm
  K.h_eVs = 4.135667696e-15;
  K.mec2 = 0.51099895;      // MeV
  K.mpc2 = 938.27208816;    // MeV
  return K;
})();

function num(x, sig) {
  sig = sig || 3;
  if (x === 0) return '0';
  if (!isFinite(x)) return (x > 0 ? '∞' : '−∞');
  var a = Math.abs(x);
  if (a >= 1e5 || a < 1e-3) {
    var ex = Math.floor(Math.log10(a));
    var m = x / Math.pow(10, ex);
    return m.toFixed(sig - 1) + '×10' + sup(ex);
  }
  return (+x.toPrecision(sig)).toString();
}
var SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function sup(n) { return String(n).split('').map(function (c) { return SUP[c] || c; }).join(''); }
function fmt(x, d) { return (+x).toFixed(d === undefined ? 2 : d); }

/* ---------- Canvas 繪圖工具 ---------- */
function Plot(cv) {
  this.cv = cv;
  this.xr = [0, 1]; this.yr = [0, 1];
  this.xl = ''; this.yl = ''; this.title = '';
  this.logy = false; this.logx = false;
  this.legend = [];
}
Plot.prototype.setup = function (o) {
  for (var k in o) this[k] = o[k];
  return this;
};
Plot.prototype._dims = function () {
  var cv = this.cv;
  var w = cv.clientWidth || 480, h = cv.clientHeight || 250;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx: ctx, w: w, h: h };
};
Plot.prototype._css = function (n) {
  var v = getComputedStyle(document.documentElement).getPropertyValue(n);
  return (v || '').trim() || '#888';
};
Plot.prototype.px = function (x) {
  var a = this.xr[0], b = this.xr[1];
  if (this.logx) { x = Math.log10(Math.max(x, 1e-300)); a = Math.log10(a); b = Math.log10(b); }
  return this.P.l + (x - a) / (b - a) * (this.W - this.P.l - this.P.r);
};
Plot.prototype.py = function (y) {
  var a = this.yr[0], b = this.yr[1];
  if (this.logy) { y = Math.log10(Math.max(y, 1e-300)); a = Math.log10(a); b = Math.log10(b); }
  return this.P.t + (b - y) / (b - a) * (this.H - this.P.t - this.P.b);
};
Plot.prototype.begin = function () {
  var d = this._dims();
  this.ctx = d.ctx; this.W = d.w; this.H = d.h;
  this.P = { l: 46, r: 12, t: this.title ? 24 : 12, b: 30 };
  var ctx = this.ctx;
  ctx.clearRect(0, 0, this.W, this.H);
  this.C = {
    ink: this._css('--ink'), mut: this._css('--mut'), line: this._css('--line'),
    line2: this._css('--line2'), acc: this._css('--acc'), bg: this._css('--panel2'),
    ok: this._css('--ok'), warn: this._css('--warn'), err: this._css('--err'),
    purple: this._css('--purple'), teal: this._css('--teal'), c5: this._css('--c5')
  };
  return this;
};
Plot.prototype.grid = function (nx, ny) {
  var ctx = this.ctx, C = this.C, i, x, y;
  nx = nx || 5; ny = ny || 4;
  ctx.strokeStyle = C.line2; ctx.lineWidth = 1;
  ctx.beginPath();
  for (i = 1; i < nx; i++) {
    x = this.P.l + i * (this.W - this.P.l - this.P.r) / nx;
    ctx.moveTo(x, this.P.t); ctx.lineTo(x, this.H - this.P.b);
  }
  for (i = 1; i < ny; i++) {
    y = this.P.t + i * (this.H - this.P.t - this.P.b) / ny;
    ctx.moveTo(this.P.l, y); ctx.lineTo(this.W - this.P.r, y);
  }
  ctx.stroke();
  // 外框 + 座標軸
  ctx.strokeStyle = C.line; ctx.lineWidth = 1;
  ctx.strokeRect(this.P.l, this.P.t, this.W - this.P.l - this.P.r, this.H - this.P.t - this.P.b);
  // 刻度數字
  ctx.fillStyle = C.mut; ctx.font = '10px ui-monospace,Consolas,monospace';
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  var a = this.xr[0], b = this.xr[1];
  for (i = 0; i <= nx; i++) {
    var xv = this._lin(a, b, i / nx);
    x = this.P.l + i * (this.W - this.P.l - this.P.r) / nx;
    ctx.fillText(this._tick(xv), x, this.H - this.P.b + 5);
  }
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  var c = this.yr[0], d2 = this.yr[1];
  for (i = 0; i <= ny; i++) {
    var yv = this._lin(c, d2, i / ny);
    y = this.P.t + (1 - i / ny) * (this.H - this.P.t - this.P.b);
    ctx.fillText(this._tick(yv), this.P.l - 6, y);
  }
  // 軸標題
  ctx.fillStyle = C.ink; ctx.font = '11px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  if (this.xl) ctx.fillText(this.xl, this.P.l + (this.W - this.P.l - this.P.r) / 2, this.H - 2);
  if (this.title) { ctx.font = 'bold 11.5px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(this.title, this.P.l - 2, this.P.t - 6); }
  if (this.yl) {
    ctx.save(); ctx.translate(11, this.P.t + (this.H - this.P.t - this.P.b) / 2); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(this.yl, 0, 0); ctx.restore();
  }
  return this;
};
Plot.prototype._lin = function (a, b, t) { return a + (b - a) * t; };
Plot.prototype._tick = function (v) {
  if (this.logy || this.logx) {
    var p = Math.round(v);
    if (Math.abs(v - p) < 0.01) return '10' + sup(p);
    return '';
  }
  var a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1e4 || a < 1e-2) return num(v, 2);
  if (a >= 100) return v.toFixed(0);
  if (a >= 1) return v.toFixed(1);
  return v.toFixed(2);
};
Plot.prototype.line = function (pts, color, width, dash) {
  var ctx = this.ctx; if (!pts || pts.length < 2) return this;
  ctx.save(); ctx.strokeStyle = color || this.C.acc; ctx.lineWidth = width || 2;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  var started = false, prevY = null;
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    if (!p || !isFinite(p[0]) || !isFinite(p[1])) { started = false; prevY = null; continue; }
    var X = this.px(p[0]), Y = this.py(p[1]);
    if (!isFinite(X) || !isFinite(Y)) { started = false; continue; }
    if (started && Math.abs(Y - prevY) > (this.H - this.P.t - this.P.b) * 0.75) { ctx.moveTo(X, Y); prevY = Y; continue; }
    if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
    prevY = Y;
  }
  ctx.stroke(); ctx.restore(); return this;
};
Plot.prototype.area = function (pts, color, alpha) {
  if (!pts || pts.length < 2) return this;
  var ctx = this.ctx, i;
  ctx.save(); ctx.globalAlpha = alpha === undefined ? 0.16 : alpha;
  ctx.fillStyle = color || this.C.acc; ctx.beginPath();
  ctx.moveTo(this.px(pts[0][0]), this.py(clamp(pts[0][1], this.yr[0], this.yr[1])));
  for (i = 1; i < pts.length; i++) ctx.lineTo(this.px(pts[i][0]), this.py(clamp(pts[i][1], this.yr[0], this.yr[1])));
  ctx.lineTo(this.px(pts[pts.length - 1][0]), this.py(this.yr[0] < 0 && this.yr[1] > 0 ? 0 : this.yr[0]));
  ctx.lineTo(this.px(pts[0][0]), this.py(this.yr[0] < 0 && this.yr[1] > 0 ? 0 : this.yr[0]));
  ctx.closePath(); ctx.fill(); ctx.restore(); return this;
};
function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
Plot.prototype.dot = function (x, y, color, r) {
  var ctx = this.ctx; ctx.save(); ctx.fillStyle = color || this.C.acc;
  ctx.beginPath(); ctx.arc(this.px(x), this.py(y), r || 4, 0, 6.2832); ctx.fill();
  ctx.strokeStyle = this.C.bg; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore(); return this;
};
Plot.prototype.vline = function (x, color, dash, label) {
  var ctx = this.ctx; ctx.save();
  ctx.strokeStyle = color || this.C.mut; ctx.lineWidth = 1.4; ctx.setLineDash(dash || [4, 3]);
  ctx.beginPath(); ctx.moveTo(this.px(x), this.P.t); ctx.lineTo(this.px(x), this.H - this.P.b); ctx.stroke();
  ctx.setLineDash([]);
  if (label) {
    ctx.fillStyle = color || this.C.mut; ctx.font = '10.5px ui-monospace,monospace';
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    var tx = this.px(x) + 4; if (tx > this.W - this.P.r - 70) { ctx.textAlign = 'right'; tx = this.px(x) - 4; }
    ctx.fillText(label, tx, this.P.t + 2);
  }
  ctx.restore(); return this;
};
Plot.prototype.hline = function (y, color, dash) {
  var ctx = this.ctx; ctx.save();
  ctx.strokeStyle = color || this.C.mut; ctx.lineWidth = 1.2; ctx.setLineDash(dash || [4, 3]);
  ctx.beginPath(); ctx.moveTo(this.P.l, this.py(y)); ctx.lineTo(this.W - this.P.r, this.py(y)); ctx.stroke();
  ctx.restore(); return this;
};
Plot.prototype.text = function (x, y, s, color, align) {
  var ctx = this.ctx; ctx.save();
  ctx.fillStyle = color || this.C.ink; ctx.font = '11px sans-serif';
  ctx.textAlign = align || 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y); ctx.restore(); return this;
};
Plot.prototype.leg = function (items, x, y) {
  var ctx = this.ctx; ctx.save(); ctx.font = '10.5px sans-serif';
  x = x === undefined ? this.P.l + 8 : x; y = y === undefined ? this.P.t + 8 : y;
  for (var i = 0; i < items.length; i++) {
    ctx.strokeStyle = items[i][1]; ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.lineTo(x + 16, y + 6); ctx.stroke();
    ctx.fillStyle = this.C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(items[i][0], x + 21, y + 6);
    y += 15;
  }
  ctx.restore(); return this;
};

/* 全域重繪註冊（插入 DOM 後、resize、換主題時都要重畫） */
var REDRAW = [];
function onRedraw(fn) { REDRAW.push(fn); }
function redrawAll() {
  for (var i = 0; i < REDRAW.length; i++) { try { REDRAW[i](); } catch (e) { } }
}
var _rt;
window.addEventListener('resize', function () { clearTimeout(_rt); _rt = setTimeout(redrawAll, 90); });
