/* ===== 互動實驗室 ===== */
'use strict';

function mkLab(host, opts) {
  host.innerHTML = '';
  var ctrls = document.createElement('div'); ctrls.className = 'ctrls';
  var right = document.createElement('div');
  var cv = document.createElement('canvas'); cv.className = 'plot' + (opts && opts.tall ? ' tall' : '');
  right.appendChild(cv);
  var ro = document.createElement('div'); ro.className = 'readout'; ro.style.marginTop = '10px';
  right.appendChild(ro);
  host.appendChild(ctrls); host.appendChild(right);
  return { ctrls: ctrls, cv: cv, ro: ro, right: right };
}
function slider(parent, label, min, max, step, val, unit, fmtFn) {
  var w = document.createElement('div'); w.className = 'ctrl';
  var l = document.createElement('label');
  l.innerHTML = '<span>' + label + '</span><span class="val"></span>';
  var inp = document.createElement('input');
  inp.type = 'range'; inp.min = min; inp.max = max; inp.step = step; inp.value = val;
  w.appendChild(l); w.appendChild(inp); parent.appendChild(w);
  var vv = l.querySelector('.val');
  function upd() { vv.textContent = (fmtFn ? fmtFn(+inp.value) : (+inp.value)) + (unit || ''); }
  upd();
  return { el: inp, wrap: w, update: upd, label: l, set: function (v) { inp.value = v; upd(); } };
}
function picker(parent, label, options, val) {
  var w = document.createElement('div'); w.className = 'ctrl';
  var l = document.createElement('label'); l.innerHTML = '<span>' + label + '</span>';
  var s = document.createElement('select');
  options.forEach(function (o) {
    var op = document.createElement('option');
    if (typeof o === 'string') { op.value = o; op.textContent = o; } else { op.value = o.v; op.textContent = o.t; }
    s.appendChild(op);
  });
  s.value = val;
  w.appendChild(l); w.appendChild(s); parent.appendChild(w);
  return { el: s };
}
function btn(parent, text, fn, cls) {
  var b = document.createElement('button');
  b.className = 'btn ' + (cls || ''); b.textContent = text; b.onclick = fn;
  parent.appendChild(b); return b;
}
function roLine(ro, pairs) {
  ro.innerHTML = pairs.map(function (p) {
    return '<div>' + p[0] + '：<b>' + p[1] + '</b></div>';
  }).join('');
}

var LABS = {};

/* ---------- Ch1：γ、長度收縮、時間膨脹 ---------- */
LABS.gamma = {
  title: 'γ 因子實驗室', sub: '拖動速度看相對論效應有多誇張',
  build: function (host) {
    var d = mkLab(host);
    var sB = slider(d.ctrls, '速度 β = v/c', 0, 0.999, 0.001, 0.6, '', function (v) { return v.toFixed(3); });
    var sL = slider(d.ctrls, '固有長度 L₀ (m)', 1, 100, 1, 100, ' m');
    var ro2 = document.createElement('div'); ro2.className = 'readout'; d.ctrls.appendChild(ro2);
    var p = new Plot(d.cv);
    function upd() {
      var b = +sB.el.value, g = 1 / Math.sqrt(1 - b * b), L0 = +sL.el.value;
      roLine(d.ro, [
        ['γ', num(g, 5)],
        ['長度 L', num(L0 / g, 4) + ' m（縮短 ' + fmt((1 - 1 / g) * 100, 2) + '%）'],
        ['1 秒（船上）在地面是', num(g, 4) + ' 秒'],
        ['100 m 衝刺所需的粒子動能比', num(g, 4) + ' 倍（古典）']
      ]);
      roLine(ro2, [['β²', num(b * b, 4)], ['√(1−β²)', num(Math.sqrt(1 - b * b), 5)]]);
      var pts = [];
      for (var i = 0; i <= 400; i++) { var bb = i / 400 * 0.99999; pts.push([bb, 1 / Math.sqrt(1 - bb * bb)]); }
      p.setup({ xr: [0, 1], yr: [1, 10], xl: 'β = v/c', yl: 'γ', title: 'γ 隨 β 的變化' }).begin().grid(5, 4);
      p.line(pts, p.C.acc, 2.4);
      p.vline(b, p.C.err, [4, 3], 'β=' + b.toFixed(3));
      var gy = clamp(g, 1, 10); p.dot(b, gy, p.C.err, 4.5);
      p.hline(1, p.C.mut, [3, 3]);
    }
    sB.el.oninput = upd; sL.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch1：孿生子 ---------- */
LABS.twin = {
  title: '孿生子悖論計算器', sub: '調整距離與速度，看兩人回來時差幾歲',
  build: function (host) {
    var d = mkLab(host);
    var sB = slider(d.ctrls, '速度 β = v/c', 0.1, 0.99, 0.01, 0.8, '', function (v) { return v.toFixed(2); });
    var sD = slider(d.ctrls, '星球距離 (光年)', 1, 100, 1, 20, ' ly');
    var p = new Plot(d.cv);
    function upd() {
      var b = +sB.el.value, D = +sD.el.value, g = 1 / Math.sqrt(1 - b * b);
      var tJane = 2 * D / b, tDick = tJane / g;
      roLine(d.ro, [
        ['γ', fmt(g, 3)],
        ['Jane 經過', fmt(tJane, 1) + ' 年'],
        ['Dick 經過', fmt(tDick, 1) + ' 年'],
        ['年齡差', fmt(tJane - tDick, 1) + ' 年（Jane 較老）']
      ]);
      var items = [];
      for (var i = 1; i <= 6; i++) { var bb = 0.15 * i; if (bb > 0.99) break; var gg = 1 / Math.sqrt(1 - bb * bb); items.push([bb, 2 * 20 / bb / gg]); }
      p.setup({ xr: [0, 1], yr: [0, 2 * D], xl: 'β', yl: 'Dick 經過的時間（年）', title: '距離 ' + D + ' ly 時 Dick 的鐘走多久' }).begin().grid(5, 4);
      var pts = [];
      for (var j = 1; j <= 400; j++) { var b2 = 0.05 + j / 400 * 0.94; var g2 = 1 / Math.sqrt(1 - b2 * b2); pts.push([b2, 2 * D / b2 / g2]); }
      p.line(pts, p.C.acc, 2.4);
      p.vline(b, p.C.err, [4, 3], 'β=' + b.toFixed(2));
      p.dot(b, clamp(tDick, 0, 2 * D), p.C.err, 4.5);
    }
    sB.el.oninput = upd; sD.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch2：黑體輻射 ---------- */
LABS.blackbody = {
  title: '黑體輻射光譜', sub: '改變溫度看峰值怎麼跑（Planck vs Rayleigh–Jeans）',
  build: function (host) {
    var d = mkLab(host, { tall: true });
    var sT = slider(d.ctrls, '溫度 T (K)', 1000, 8000, 50, 5800, ' K');
    var sS = picker(d.ctrls, '顯示', [{ v: 'abs', t: 'Planck 曲線（絕對）' }, { v: 'norm', t: '正規化比較' },
    { v: 'rj', t: '加入 Rayleigh–Jeans' }], 'abs');
    var p = new Plot(d.cv);
    function planck(lam, T) { // lam in nm -> 相對能量密度 (λ 形式)
      var l = lam * 1e-9;
      var x = PH.h * PH.c / (l * PH.kB * T);
      if (x > 700) return 0;
      return (2 * PH.h * PH.c * PH.c / Math.pow(l, 5)) / (Math.exp(x) - 1);
    }
    function rj(lam, T) {
      var l = lam * 1e-9;
      return 2 * PH.c * PH.kB * T / Math.pow(l, 4);
    }
    function upd() {
      var T = +sT.el.value, mode = sS.el.value;
      var lmax = 2.897771955e6 / T; // nm
      roLine(d.ro, [
        ['峰值波長 λ_max', fmt(lmax, 0) + ' nm'],
        ['區段', lmax < 380 ? '紫外光' : (lmax <= 780 ? '可見光' : '紅外光')],
        ['峰值頻率 ν_max', num(5.879e10 * T, 3) + ' Hz'],
        ['總輻射功率 / 面積', num(PH.sigma * Math.pow(T, 4), 3) + ' W/m²']
      ]);
      var N = 260, lo = 100, hi = 3000;
      var ymax = 0, i, L, arr = [], arrR = [];
      for (i = 0; i <= N; i++) {
        L = lo + (hi - lo) * i / N;
        arr.push([L, planck(L, T)]);
        arrR.push([L, rj(L, T)]);
        ymax = Math.max(ymax, arr[i][1]);
      }
      // 先 begin() 讓色彩表（p.C）就緒，稍後再設定 y 軸範圍
      p.setup({ xr: [lo, hi], yr: [0, 1], xl: '波長 λ (nm)', yl: '相對強度', title: '黑體輻射頻譜' }).begin();
      var curves = [];
      var mk = function (TT) {
        var a = [], m = 0;
        for (var k = 0; k <= N; k++) { var L2 = lo + (hi - lo) * k / N; var v2 = planck(L2, TT); a.push([L2, v2]); m = Math.max(m, v2); }
        return { pts: a, max: m };
      };
      if (mode === 'abs') {
        curves.push({ name: 'T = ' + T + ' K', c: p.C.acc, pts: arr, max: ymax, w: 2.5 });
        [2000, 4000, 6500].forEach(function (TT) {
          var o = mk(TT);
          curves.push({ name: 'T = ' + TT + ' K', c: p.C.line, pts: o.pts, max: o.max, w: 1.3, dash: [5, 3] });
        });
        ymax = Math.max(ymax, Math.max.apply(null, curves.map(function (c) { return c.max; })));
      } else if (mode === 'norm') {
        var norm = function (a) { var m = 0; a.forEach(function (q) { m = Math.max(m, q[1]); }); return a.map(function (q) { return [q[0], q[1] / m]; }); };
        curves.push({ name: 'T = ' + T + ' K（正規化）', c: p.C.acc, pts: norm(arr), max: 1, w: 2.5 });
        [3000, 6000].forEach(function (TT) {
          curves.push({ name: 'T = ' + TT + ' K', c: p.C.line, pts: norm(mk(TT).pts), max: 1, w: 1.3, dash: [5, 3] });
        });
        ymax = 1;
      } else {
        curves.push({ name: 'Planck', c: p.C.acc, pts: arr, max: ymax, w: 2.5 });
        curves.push({ name: 'Rayleigh–Jeans（古典）', c: p.C.err, pts: arrR, max: Math.max.apply(null, arrR.map(function (q) { return q[1]; })), w: 2 });
        ymax = Math.max.apply(null, curves.map(function (c) { return c.max; }));
      }
      ymax = ymax || 1;
      p.yr = [0, ymax * 1.08];
      p.grid(6, 4);
      // 可見光區
      p.area([[380, 0], [380, ymax * 1.08], [780, ymax * 1.08], [780, 0]], p.C.warn, 0.10);
      p.text(p.px(430), p.P.t + 12, '可見光', p.C.warn);
      curves.forEach(function (c) { p.line(c.pts, c.c, c.w, c.dash || null); });
      p.vline(lmax, p.C.ok, [4, 3], 'λmax');
      p.leg(curves.map(function (c) { return [c.name, c.c]; }));
    }
    sT.el.oninput = upd; sS.el.onchange = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch2：光電效應 ---------- */
LABS.photo = {
  title: '光電效應實驗', sub: '改變波長與功函數，看截止電壓與光電流',
  build: function (host) {
    var d = mkLab(host);
    var sL = slider(d.ctrls, '入射波長 λ (nm)', 100, 700, 1, 350, ' nm');
    var sP = picker(d.ctrls, '金屬', [{ v: '2.2', t: '鉀 K（φ=2.2 eV）' }, { v: '4.5', t: '銅 Cu（φ=4.5 eV）' },
    { v: '2.14', t: '銫 Cs（φ=2.14 eV）' }, { v: '4.9', t: '鎢 W（φ=4.9 eV）' }], '2.2');
    var sI = slider(d.ctrls, '相對光強度', 0.2, 5, 0.1, 1, '×');
    var p = new Plot(d.cv);
    function upd() {
      var lam = +sL.el.value, phi = +sP.el.value, I = +sI.el.value;
      var E = PH.hc_eVnm / lam, KEmax = E - phi, Vs = Math.max(0, KEmax);
      var ok = KEmax > 0;
      roLine(d.ro, [
        ['光子能量 hc/λ', fmt(E, 3) + ' eV'],
        ['功函數 φ', fmt(phi, 2) + ' eV'],
        ['有無光電效應', ok ? '有' : '沒有（頻率太低）'],
        ['最大動能 KE_max', ok ? fmt(KEmax, 3) + ' eV' : '—'],
        ['截止電壓 V_s', ok ? fmt(Vs, 3) + ' V' : '—'],
        ['截止波長 λ₀', fmt(PH.hc_eVnm / phi, 0) + ' nm']
      ]);
      p.setup({ xr: [-Vs - 1 > -1 ? -Math.max(Vs * 1.4, 1) : -1, 3], yr: [0, 1.15], xl: '外加電壓 V (V)', yl: '光電流（歸一化）', title: '光電流 — 電壓曲線' }).begin().grid(5, 4);
      if (ok) {
        var pts = [], N = 160;
        for (var i = 0; i <= N; i++) {
          var V = -Math.max(Vs * 1.4, 1) + (3 + Math.max(Vs * 1.4, 1)) * i / N;
          var cur;
          if (V <= -Vs) cur = 0;
          else cur = Math.min(1, Math.pow((V + Vs) / Math.max(Vs * 0.35, 0.15), 0.6));
          pts.push([V, cur * Math.min(I, 5) / 5]);
        }
        p.area(pts, p.C.acc, 0.14); p.line(pts, p.C.acc, 2.4);
        p.vline(-Vs, p.C.err, [4, 3], '−Vs = −' + fmt(Vs, 2) + ' V');
        p.hline(0, p.C.mut, [3, 3]);
      } else {
        p.text(p.px(0), p.P.t + 20, 'λ 太長（' + lam + ' nm > λ₀=' + fmt(PH.hc_eVnm / phi, 0) + ' nm），沒有光電子', p.C.err);
      }
    }
    sL.el.oninput = upd; sP.el.onchange = upd; sI.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch2：康普頓 ---------- */
LABS.compton = {
  title: '康普頓效應', sub: '散射角決定波長位移，和入射波長無關',
  build: function (host) {
    var d = mkLab(host);
    var sA = slider(d.ctrls, '散射角 φ', 0, 180, 1, 45, '°');
    var sL = slider(d.ctrls, '入射波長 λ (pm)', 1, 100, 1, 10, ' pm');
    var p = new Plot(d.cv);
    var LC = 2.42631023867; // pm
    function upd() {
      var phi = +sA.el.value * Math.PI / 180, lam0 = +sL.el.value;
      var dlam = LC * (1 - Math.cos(phi)), lam1 = lam0 + dlam;
      var E0 = 1239.841984 / (lam0 * 1000) * 1000; // keV
      var E1 = 1239.841984 / (lam1 * 1000) * 1000;
      roLine(d.ro, [
        ['λ′−λ', fmt(dlam, 4) + ' pm'],
        ['散射光波長 λ′', fmt(lam1, 4) + ' pm'],
        ['入射光子能量', fmt(E0, 2) + ' keV'],
        ['散射光子能量', fmt(E1, 2) + ' keV'],
        ['反衝電子動能', fmt(E0 - E1, 3) + ' keV'],
        ['反衝電子角度 θ', fmt(Math.atan(1 / ((1 + E0 / 511) * Math.tan(phi / 2))) * 180 / Math.PI, 1) + '°']
      ]);
      p.setup({ xr: [0, 180], yr: [0, 5.0], xl: '散射角 φ (度)', yl: 'Δλ (pm)', title: '康普頓位移 Δλ = λC(1−cosφ)' }).begin().grid(6, 4);
      var pts = [];
      for (var i = 0; i <= 360; i++) { var a = i / 360 * Math.PI; pts.push([i / 2, LC * (1 - Math.cos(a))]); }
      p.area(pts, p.C.acc, 0.12); p.line(pts, p.C.acc, 2.4);
      p.vline(+sA.el.value, p.C.err, [4, 3]);
      p.dot(+sA.el.value, dlam, p.C.err, 4.5);
      p.hline(2 * LC, p.C.ok, [4, 3]);
      p.text(p.px(120), p.py(2 * LC) - 10, '最大 2λC = 4.853 pm', p.C.ok);
    }
    sA.el.oninput = upd; sL.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch3：德布羅依 ---------- */
LABS.debroglie = {
  title: '德布羅依波長計算機', sub: '換粒子、換能量，看波長差多少個數量級',
  build: function (host) {
    var d = mkLab(host);
    var sP = picker(d.ctrls, '粒子', [{ v: 'me', t: '電子（m=9.11e-31 kg）' }, { v: 'mp', t: '質子（1.67e-27 kg）' },
    { v: 'a', t: 'α 粒子（6.64e-27 kg）' }, { v: 'ball', t: '高爾夫球（0.046 kg）' }], 'me');
    var sK = slider(d.ctrls, '動能 (eV)', -2, 6, 0.02, 1.7, ' ', function (v) { return num(Math.pow(10, v), 3); });
    var p = new Plot(d.cv);
    var MASS = { me: 9.1093837015e-31, mp: 1.67262192369e-27, a: 6.6446573357e-27, ball: 0.046 };
    function upd() {
      var m = MASS[sP.el.value], KE = Math.pow(10, +sK.el.value) * PH.e;
      var p1 = Math.sqrt(2 * m * KE), lam = PH.h / p1;
      roLine(d.ro, [
        ['動能', num(KE / PH.e, 3) + ' eV'],
        ['動量 p', num(p1, 3) + ' kg·m/s'],
        ['德布羅依波長 λ', num(lam, 4) + ' m'],
        ['＝', num(lam * 1e9, 4) + ' nm'],
        ['和原子的比例', num(lam / 1e-10, 3) + ' 倍（原子 ~0.1 nm）']
      ]);
      p.setup({ xr: [-2, 6], yr: [-18, 2], xl: 'log₁₀(動能 / eV)', yl: 'log₁₀(λ / m)', logy: false, logx: false, title: 'λ 隨動能的變化（雙對數）' }).begin().grid(6, 4);
      var cur = [];
      for (var i = 0; i <= 200; i++) {
        var e = -2 + 8 * i / 200, ke = Math.pow(10, e) * PH.e;
        cur.push([e, Math.log10(PH.h / Math.sqrt(2 * m * ke))]);
      }
      p.line(cur, p.C.acc, 2.4);
      var lx = +sK.el.value, ly = Math.log10(lam);
      p.dot(lx, clamp(ly, -18, 2), p.C.err, 4.5);
      p.vline(lx, p.C.err, [4, 3]);
      p.text(p.P.l + 10, p.P.t + 16, '座標軸為對數值（10 的次方）', p.C.mut);
    }
    sP.el.onchange = upd; sK.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch3/5：盒中粒子 ---------- */
LABS.box = {
  title: '盒中粒子', sub: '波函數、機率密度與能階',
  build: function (host) {
    var d = mkLab(host, { tall: true });
    var sN = slider(d.ctrls, '量子數 n', 1, 6, 1, 1, '');
    var sL = slider(d.ctrls, '盒子寬度 L (nm)', 0.05, 2, 0.05, 0.10, ' nm', function (v) { return v.toFixed(2); });
    var sM = picker(d.ctrls, '粒子', [{ v: 'me', t: '電子' }, { v: 'mp', t: '質子' }], 'me');
    var p = new Plot(d.cv);
    var MASS = { me: 9.1093837015e-31, mp: 1.67262192369e-27 };
    function upd() {
      var n = +sN.el.value, L = +sL.el.value * 1e-9, m = MASS[sM.el.value];
      var E1 = PH.h * PH.h / (8 * m * L * L) / PH.e;
      var En = E1 * n * n;
      roLine(d.ro, [
        ['E₁', num(E1, 4) + ' eV'],
        ['E' + n, num(En, 4) + ' eV'],
        ['E' + n + ' − E' + (n - 1) + '（n>1 時）', n > 1 ? num(E1 * (2 * n - 1), 4) + ' eV' : '—'],
        ['對應波長 λ' + n + '→' + (n > 0 ? '' : ''), num(PH.hc_eVnm / Math.abs(E1 * (2 * n - 1)), 4) + ' nm']
      ]);
      p.setup({ xr: [0, 1], yr: [-1.6, 1.6], xl: 'x / L', yl: 'ψ 與 |ψ|²', title: 'ψ' + n + '(x) 與 |ψ' + n + '|²  （L=' + (+sL.el.value).toFixed(2) + ' nm）' }).begin().grid(4, 4);
      var A = [], B = [];
      for (var i = 0; i <= 400; i++) {
        var t = i / 400, s = Math.sin(n * Math.PI * t);
        A.push([t, s]); B.push([t, s * s]);
      }
      p.area(B, p.C.ok, 0.18);
      p.line(A, p.C.acc, 2.2);
      p.line(B.map(function (q) { return [q[0], q[1]]; }), p.C.ok, 2.2);
      p.hline(0, p.C.mut, [3, 3]);
      p.leg([['ψ' + n, p.C.acc], ['|ψ' + n + '|²', p.C.ok]], p.P.l + 8, p.P.t + 6);
      // 節點標記
      for (var k = 1; k < n; k++) p.dot(k / n, 0, p.C.err, 3.5);
      p.vline(0, p.C.ink, [2, 2]); p.vline(1, p.C.ink, [2, 2]);
    }
    sN.el.oninput = upd; sL.el.oninput = upd; sM.el.onchange = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch4：波爾能階 ---------- */
LABS.bohr = {
  title: '氫原子能階與躍遷', sub: '選起始與終止能階，算出譜線波長',
  build: function (host) {
    var d = mkLab(host, { tall: true });
    var opts = [1, 2, 3, 4, 5, 6].map(function (n) { return { v: String(n), t: 'n = ' + n }; });
    var sI = picker(d.ctrls, '起始能階 nᵢ', opts, '3');
    var sF = picker(d.ctrls, '終止能階 n_f', opts, '2');
    var p = new Plot(d.cv);
    function En(n) { return -13.6057 / (n * n); }
    function upd() {
      var ni = +sI.el.value, nf = +sF.el.value;
      var dE = En(ni) - En(nf);
      var lam = PH.hc_eVnm / Math.abs(dE);
      var series = nf === 1 ? 'Lyman（紫外）' : nf === 2 ? 'Balmer（部分可見）' : nf === 3 ? 'Paschen（紅外）' :
        nf === 4 ? 'Brackett（紅外）' : 'Pfund（紅外）';
      roLine(d.ro, [
        ['E' + ni, fmt(En(ni), 3) + ' eV'],
        ['E' + nf, fmt(En(nf), 3) + ' eV'],
        ['ΔE', fmt(Math.abs(dE), 3) + ' eV',],
        ['光子波長 λ', fmt(lam, 2) + ' nm'],
        ['所屬系列', series],
        ['方向', dE > 0 ? '放出光子（發射）' : '需要吸收光子']
      ]);
      p.setup({ xr: [0, 10], yr: [-14.5, 1.0], xl: '', yl: '能量 (eV)', title: '氫原子能階圖' }).begin().grid(2, 7);
      for (var n = 1; n <= 6; n++) {
        var y = En(n);
        var isI = n === ni, isF = n === nf;
        p.line([[0.6, y], [5.2, y]], isI ? p.C.acc : (isF ? p.C.ok : p.C.line), isI || isF ? 3 : 1.6);
        p.text(p.px(5.4), p.py(y), 'n=' + n + '  (' + fmt(y, 2) + ' eV)', p.C.ink);
      }
      p.line([[0.6, 0], [5.2, 0]], p.C.mut, 1.4, [4, 3]);
      p.text(p.px(5.4), p.py(0), 'n=∞  (0 eV, 游離)', p.C.mut);
      // 箭頭
      var x0 = 3.4;
      p.line([[x0, En(ni)], [x0, En(nf)]], p.C.err, 3);
      var dir = En(nf) > En(ni) ? 1 : -1;
      var yh = En(nf) - dir * 0.5;
      p.line([[x0 - 0.28, yh + dir * 0.28], [x0, yh], [x0 + 0.28, yh + dir * 0.28]], p.C.err, 3);
    }
    sI.el.onchange = upd; sF.el.onchange = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch3：不確定性原理 ---------- */
LABS.uncert = {
  title: '不確定性原理', sub: '位置越確定，動量越不確定',
  build: function (host) {
    var d = mkLab(host);
    var sX = slider(d.ctrls, '位置不確定度 Δx', -16, -8, 0.1, -11, ' m', function (v) { return num(Math.pow(10, v), 2); });
    var sM = picker(d.ctrls, '粒子', [{ v: 'me', t: '電子' }, { v: 'mp', t: '質子' }], 'me');
    var p = new Plot(d.cv);
    var MASS = { me: 9.1093837015e-31, mp: 1.67262192369e-27 };
    function upd() {
      var dx = Math.pow(10, +sX.el.value), m = MASS[sM.el.value];
      var dp = PH.hbar / (2 * dx), dv = dp / m;
      var KEmin = dp * dp / (2 * m) / PH.e;
      roLine(d.ro, [
        ['Δx', num(dx, 3) + ' m'],
        ['Δp ≥ ħ/2Δx', num(dp, 3) + ' kg·m/s'],
        ['Δv ≥', num(dv, 3) + ' m/s'],
        ['最小動能估計', num(KEmin, 3) + ' eV'],
        ['1 秒後位置不確定度', num(dv * 1, 3) + ' m']
      ]);
      p.setup({ xr: [-16, -8], yr: [-36, -18], xl: 'log₁₀(Δx) [m]', yl: 'log₁₀(Δp) [kg·m/s]', title: 'Δp = ħ/(2Δx)　（雙對數座標）' }).begin().grid(8, 4);
      var pts = [];
      for (var i = 0; i <= 200; i++) { var e = -16 + 8 * i / 200; pts.push([e, Math.log10(PH.hbar / (2 * Math.pow(10, e)))]); }
      p.line(pts, p.C.acc, 2.4);
      p.dot(+sX.el.value, clamp(Math.log10(dp), -36, -18), p.C.err, 4.5);
      p.vline(+sX.el.value, p.C.err, [4, 3]);
      p.text(p.P.l + 10, p.P.t + 16, '座標軸為對數值（10 的次方）', p.C.mut);
    }
    sX.el.oninput = upd; sM.el.onchange = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch5：穿隧 ---------- */
LABS.tunnel = {
  title: '穿隧機率', sub: '位障寬度稍微增加，穿透率就掉一個數量級',
  build: function (host) {
    var d = mkLab(host);
    var sL = slider(d.ctrls, '位障寬度 L (nm)', 0.02, 1.5, 0.01, 0.10, ' nm', function (v) { return v.toFixed(2); });
    var sU = slider(d.ctrls, '位障高度 U (eV)', 1, 20, 0.1, 10, ' eV', function (v) { return v.toFixed(1); });
    var sE = slider(d.ctrls, '粒子能量 E (eV)', 0.1, 19, 0.1, 5, ' eV', function (v) { return v.toFixed(1); });
    var sM = picker(d.ctrls, '粒子', [{ v: 'me', t: '電子' }, { v: 'mp', t: '質子' }], 'me');
    var p = new Plot(d.cv);
    var MASS = { me: 9.1093837015e-31, mp: 1.67262192369e-27 };
    function upd() {
      var L = +sL.el.value * 1e-9, U = +sU.el.value, E = +sE.el.value, m = MASS[sM.el.value];
      if (E >= U) { sE.set(Math.min(U - 0.2, 19)); E = +sE.el.value; }
      var dU = (U - E) * PH.e;
      var k = Math.sqrt(2 * m * dU) / PH.hbar;
      var T = Math.exp(-2 * k * L);
      roLine(d.ro, [
        ['U − E', fmt(U - E, 2) + ' eV'],
        ['k = √(2m(U−E))/ħ', num(k, 3) + ' m⁻¹'],
        ['2kL', num(2 * k * L, 4)],
        ['穿隧機率 T ≈ e^(−2kL)', num(T, 3)],
        ['位障變成兩倍寬時的 T', num(Math.exp(-2 * k * 2 * L), 3)]
      ]);
      p.setup({ xr: [0, 1.5], yr: [-30, 1], xl: '位障寬度 L (nm)', yl: 'log₁₀(T)', title: 'T 隨 L 的變化（對數）' }).begin().grid(5, 4);
      var pts = [];
      for (var i = 0; i <= 200; i++) { var L2 = 0.02 + 1.48 * i / 200; pts.push([L2, Math.log10(Math.max(Math.exp(-2 * k * L2 * 1e-9), 1e-300))]); }
      p.line(pts, p.C.acc, 2.4);
      p.dot(+sL.el.value, clamp(Math.log10(T), -30, 1), p.C.err, 4.5);
      p.vline(+sL.el.value, p.C.err, [4, 3]);
      p.text(p.P.l + 10, p.P.t + 16, '縱軸為對數值（10 的次方）', p.C.mut);
    }
    sL.el.oninput = upd; sU.el.oninput = upd; sE.el.oninput = upd; sM.el.onchange = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch5：諧振子 ---------- */
LABS.osc = {
  title: '量子諧振子', sub: '能階間距均勻，而且最低能量不是 0',
  build: function (host) {
    var d = mkLab(host);
    var sN = slider(d.ctrls, '量子數 n', 0, 6, 1, 0, '');
    var sF = slider(d.ctrls, '振動頻率 f (10¹⁴ Hz)', 0.5, 5, 0.1, 1, ' ×10¹⁴ Hz', function (v) { return v.toFixed(1); });
    var p = new Plot(d.cv, { tall: true });
    function upd() {
      var n = +sN.el.value, f = +sF.el.value * 1e14;
      var hf = PH.h * f / PH.e;
      var En = (n + 0.5) * hf;
      roLine(d.ro, [
        ['能量量子 hf', fmt(hf, 3) + ' eV'],
        ['E₀（零點能）', fmt(0.5 * hf, 3) + ' eV'],
        ['E' + n, fmt(En, 3) + ' eV'],
        ['能階間距', fmt(hf, 3) + ' eV（與 n 無關）']
      ]);
      p.setup({ xr: [-3, 3], yr: [-0.5, 7.5], xl: '位移 x（任意單位）', yl: 'n', title: '拋物線位能與能階' }).begin().grid(6, 7);
      // 拋物線 U(x) 正規化到 level 6
      var top = 6.5, pts = [];
      for (var i = 0; i <= 200; i++) { var x = -3 + 6 * i / 200; pts.push([x, top * Math.min(x * x / 9, 1.05)]); }
      p.line(pts, p.C.line, 2);
      for (var k = 0; k <= 6; k++) {
        var y = k + 0.5;
        var w = 3 * Math.sqrt(y / top);
        p.line([[-w, y], [w, y]], k === n ? p.C.acc : p.C.line2, k === n ? 3.4 : 1.6);
        if (k === n) p.text(p.px(0), p.py(y) - 11, 'n=' + k + '，E=' + fmt(y * hf, 3) + ' eV', p.C.acc, 'center');
      }
      p.hline(0.5, p.C.ok, [4, 3]);
      p.text(p.px(-2.9), p.py(0.5) - 9, '零點能 ½hf', p.C.ok);
    }
    sN.el.oninput = upd; sF.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch6：徑向機率 ---------- */
LABS.radial = {
  title: '電子徑向機率密度', sub: '1s / 2s / 2p 的「電子雲」離核多遠',
  build: function (host) {
    var d = mkLab(host, { tall: true });
    var sS = picker(d.ctrls, '狀態', [{ v: '10', t: '1s（n=1, l=0）' }, { v: '20', t: '2s（n=2, l=0）' },
    { v: '21', t: '2p（n=2, l=1）' }], '10');
    var p = new Plot(d.cv);
    function R(rho, st) { // rho = r/a0
      if (st === '10') return 2 * Math.exp(-rho);
      if (st === '20') return (1 / (2 * Math.SQRT2)) * (2 - rho) * Math.exp(-rho / 2);
      return (1 / (2 * Math.sqrt(6))) * rho * Math.exp(-rho / 2);
    }
    function nrm(st) {
      if (st === '10') return { z: 1, n: 1 };
      if (st === '20') return { z: 2, n: 2 };
      return { z: 2, n: 2 };
    }
    function upd() {
      var st = sS.el.value;
      var rs = [], a0 = PH.a0;
      var maxv = 0, rmax = 0, N = 600, hi = st === '10' ? 6 : 16;
      for (var i = 0; i <= N; i++) {
        var rho = hi * i / N, P = rho * rho * R(rho, st) * R(rho, st);
        rs.push([rho, P]); if (P > maxv) { maxv = P; rmax = rho; }
      }
      var avgr = st === '10' ? 1.5 : (st === '20' ? 6 : 5);
      roLine(d.ro, [
        ['最可能距離 r', fmt(rmax, 2) + ' a₀ = ' + fmt(rmax * a0 * 1e9, 3) + ' nm'],
        ['理論平均值 ⟨r⟩', (st === '10' ? '1.5' : (st === '20' ? '6.0' : '5.0')) + ' a₀'],
        ['對 a₀ 的倍數', fmt(rmax, 2)],
        ['節點（不含 r=0 與 ∞）', st === '20' ? '有 1 個（在 r = 2a₀）' : '沒有']
      ]);
      p.setup({ xr: [0, hi], yr: [0, maxv * 1.12], xl: 'r / a₀', yl: 'P(r) = r²|R(r)|²', title: (st === '10' ? '1s' : st === '20' ? '2s' : '2p') + ' 的徑向機率密度' }).begin().grid(hi > 10 ? 8 : 6, 4);
      p.area(rs, p.C.acc, 0.15); p.line(rs, p.C.acc, 2.4);
      p.vline(rmax, p.C.err, [4, 3], 'r=' + fmt(rmax, 2) + 'a₀');
      p.vline(1, p.C.ok, [3, 3], 'a₀');
      if (st === '20') p.vline(2, p.C.warn, [3, 3], '2a₀（節點）');
    }
    sS.el.onchange = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch6：量子數組合 ---------- */
LABS.qn = {
  title: '量子數組合計數器', sub: '同一個 n 到底有幾個狀態？',
  build: function (host) {
    var d = mkLab(host);
    var sN = slider(d.ctrls, '主量子數 n', 1, 7, 1, 3, '');
    var p = new Plot(d.cv);
    var LET = ['s', 'p', 'd', 'f', 'g', 'h', 'i'];
    function upd() {
      var n = +sN.el.value, tot = 0, rows = [];
      for (var l = 0; l < n; l++) {
        var cnt = 2 * l + 1;
        tot += cnt;
        var ml = [];
        for (var m = -l; m <= l; m++) ml.push(m);
        rows.push([l, LET[l], ml.join(', '), cnt]);
      }
      var html = '<div style="margin-bottom:6px">共 <b>' + tot + '</b> 個狀態（= n² = ' + (n * n) + '，不計自旋）</div>';
      html += '<table style="border-collapse:collapse;font-size:12.5px;font-family:var(--mono)">';
      html += '<tr style="color:var(--mut)"><th style="text-align:left;padding:2px 8px 2px 0">l</th>' +
        '<th style="text-align:left;padding:2px 8px 2px 0">軌道</th>' +
        '<th style="text-align:left;padding:2px 8px 2px 0">m_l</th>' +
        '<th style="text-align:left;padding:2px 0">個數</th></tr>';
      rows.forEach(function (r) {
        html += '<tr><td style="padding:1px 8px 1px 0">' + r[0] + '</td><td style="padding:1px 8px 1px 0">' + n + r[1] +
          '</td><td style="padding:1px 8px 1px 0">' + r[2] + '</td><td style="padding:1px 0"><b>' + r[3] + '</b></td></tr>';
      });
      html += '</table>';
      d.ro.innerHTML = html;
      p.setup({ xr: [1, 7], yr: [0, 52], xl: 'n', yl: '狀態數', title: '狀態數 = n²' }).begin().grid(6, 4);
      var pts = [];
      for (var k = 1; k <= 7; k++) pts.push([k, k * k]);
      p.area(pts, p.C.acc, 0.14); p.line(pts, p.C.acc, 2.4);
      pts.forEach(function (q) { p.dot(q[0], q[1], q[0] === n ? p.C.err : p.C.acc, q[0] === n ? 5 : 3); });
      p.text(p.px(n), p.py(n * n) - 14, (n * n) + ' 個', p.C.err, 'center');
    }
    sN.el.oninput = upd; onRedraw(upd); upd();
  }
};

/* ---------- Ch2：X 光最短波長 ---------- */
LABS.xray = {
  title: 'X 光光譜與最短波長', sub: '加速電壓決定連續譜的短波長端點',
  build: function (host) {
    var d = mkLab(host);
    var sV = slider(d.ctrls, '加速電壓 V (kV)', 5, 100, 1, 35, ' kV');
    var p = new Plot(d.cv);
    function upd() {
      var V = +sV.el.value; // kV
      var lmin = 1.239841984 / (V * 1000) * 1000; // nm  (hc in keV·nm) => nm
      roLine(d.ro, [
        ['λ_min', num(lmin, 4) + ' nm'],
        ['＝', num(lmin * 1000, 4) + ' pm'],
        ['電子動能 eV', fmt(V, 0) + ' keV'],
        ['最短光子的能量', fmt(V, 3) + ' keV'],
        ['與靶材的關係', '無關（只取決於 V）']
      ]);
      p.setup({ xr: [0, 0.25], yr: [0, 1.18], xl: '波長 (nm)', yl: '相對強度', title: 'X 光連續譜（示意）' }).begin().grid(5, 4);
      // 連續譜：從 lmin 開始，強度先升後緩降
      var pts = [], N = 300;
      for (var i = 0; i <= N; i++) {
        var L = 0.25 * i / N;
        var v = 0;
        if (L >= lmin) {
          var t = (L - lmin) / Math.max(0.02, 0.06 * V / 35);
          v = Math.exp(-Math.pow(Math.max(0, t - 0.25), 1.5)) * (1 - Math.exp(-Math.pow(t, 1.4) * 4));
        }
        pts.push([L, v]);
      }
      p.area(pts, p.C.acc, 0.14); p.line(pts, p.C.acc, 2.3);
      // 兩個特徵峰（Mo / W 位置固定）
      [0.071, 0.063].forEach(function (pk, idx) {
        var hp = [], N2 = 60;
        for (var j = 0; j <= N2; j++) { var LL = pk - 0.012 + 0.024 * j / N2; hp.push([LL, 0.72 * Math.exp(-Math.pow((LL - pk) / 0.0035, 2))]); }
        p.line(hp, idx ? p.C.purple : p.C.err, 1.6);
      });
      p.vline(lmin, p.C.err, [4, 3], 'λmin');
      p.text(p.px(0.12), p.P.t + 14, '峰值（特徵 X 光）由靶材決定；端點由 V 決定', p.C.mut);
    }
    sV.el.oninput = upd; onRedraw(upd); upd();
  }
};
