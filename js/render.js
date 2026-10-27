/* ===== 內容渲染 ===== */
'use strict';

var LAB_PLACEMENT = {
  ch1: [['c1-4', 'gamma'], ['c1-5', 'twin']],
  ch2: [['c2-1', 'blackbody'], ['c2-2', 'photo'], ['c2-4', 'xray'], ['c2-6', 'compton']],
  ch3: [['c3-1', 'debroglie'], ['c3-4', 'box'], ['c3-5', 'uncert']],
  ch4: [['c4-4', 'bohr']],
  ch5: [['c5-5', 'box'], ['c5-6', 'tunnel'], ['c5-7', 'osc']],
  ch6: [['c6-5', 'radial'], ['c6-3', 'qn']]
};
var CHCOLOR = { ch1: 'c1', ch2: 'c2', ch3: 'c3', ch4: 'c4', ch5: 'c5', ch6: 'c6' };

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function typeset(el) {
  if (typeof renderMathInElement !== 'function') return;
  try {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false, errorColor: '#d43a3a', strict: false, trust: false
    });
  } catch (e) { console.warn('katex', e); }
}

function blockHTML(b) {
  switch (b.t) {
    case 'p': return '<p' + (b.cls ? ' class="' + b.cls + '"' : '') + '>' + b.x + '</p>';
    case 'tex': return '<div class="fml">' + (b.label ? '<div class="lbl">' + b.label + '</div>' : '') + '$$' + b.x + '$$</div>';
    case 'ul': return '<ul class="pts">' + b.x.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
    case 'ol': return '<ol class="pts">' + b.x.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ol>';
    case 'note':
      return '<div class="callout ' + (b.kind || 'tip') + '"><div class="ct">' + b.title + '</div><p>' + b.x + '</p></div>';
    case 'table':
      return '<table class="t"><thead><tr>' + b.head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
        '</tr></thead><tbody>' + b.rows.map(function (r) {
          return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
        }).join('') + '</tbody>' + (b.caption ? '<caption>' + b.caption + '</caption>' : '') + '</table>';
    case 'ex':
      return '<div class="ex"><div class="exh"><span class="pill">例題</span><span>' + b.src + '</span></div><div class="exb">' +
        '<p class="q">' + b.q + '</p><ol class="steps">' +
        b.steps.map(function (s) {
          return '<li><span style="font-size:14px">$$' + s[0] + '$$</span>' +
            (s[1] ? '<span class="why">' + s[1] + '</span>' : '') + '</li>';
        }).join('') + '</ol>' +
        '<div class="ansbox"><span class="lbl">答案</span>$$' + b.ans + '$$</div>' +
        (b.why ? '<p class="hint" style="margin-top:9px">💡 ' + b.why + '</p>' : '') + '</div></div>';
    default: return '';
  }
}

/* ---------- 章節頁 ---------- */
function renderChapter(CH) {
  var color = 'var(--' + CHCOLOR[CH.id] + ')';
  var h = '';
  h += '<div style="margin-top:18px">' +
    '<div class="pill" style="background:color-mix(in srgb,' + color + ' 15%,transparent);color:' + color + '">Chapter ' + CH.num + '</div>' +
    '<h1 style="color:' + color + '">' + CH.title + '</h1>' +
    '<p class="lede">' + CH.en + '</p></div>';
  h += '<div class="card"><h4 style="margin-top:0;color:' + color + '">這個章節在講什麼？</h4><p style="margin:0">' + CH.why + '</p>' +
    '<p class="hint" style="margin:9px 0 0">📘 ' + CH.hw + '</p></div>';

  h += '<div class="subnav">' + CH.sections.map(function (s, i) {
    return '<a href="#/s/' + CH.id + '/' + s.id + '">' + (i + 1) + '. ' + s.title.replace(/^[0-9.]+　/, '') + '</a>';
  }).join('') + '<a href="#/s/' + CH.id + '/formulas">公式卡</a><a href="#/s/' + CH.id + '/examples">例題</a>' +
    '<a href="#/s/' + CH.id + '/pitfalls">常見錯誤</a></div>';

  if (CH.mins && CH.mins.length) {
    h += '<div class="card" style="border-left:4px solid ' + color + '"><h4 style="margin-top:0">🎯 這一章怎麼唸</h4><div class="grid g2">' +
      CH.mins.map(function (m) { return '<div><b>' + m[0] + '</b><p class="hint" style="margin:2px 0 0">' + m[1] + '</p></div>'; }).join('') +
      '</div></div>';
  }

  CH.sections.forEach(function (s) {
    h += '<section class="sec" id="' + s.id + '"><div class="sec-h">' +
      (s.tag ? '<span class="pill gray">' + s.tag + '</span>' : '') + '<h3>' + s.title + '</h3>' +
      '<label class="tick" style="margin-left:auto"><input type="checkbox" data-read="' + CH.id + '/' + s.id + '"><span class="hint">已讀</span></label>' +
      '</div>';
    s.blocks.forEach(function (b) { h += blockHTML(b); });
    (LAB_PLACEMENT[CH.id] || []).forEach(function (pair) {
      if (pair[0] === s.id && LABS[pair[1]]) {
        h += '<div class="lab" data-lab="' + pair[1] + '"><div class="lh"><span class="pill">🔬 動手玩</span>' +
          '<b>' + LABS[pair[1]].title + '</b><span>' + LABS[pair[1]].sub + '</span></div>' +
          '<div class="lb"></div></div>';
      }
    });
    h += '</section>';
  });

  h += '<section class="sec" id="formulas"><h3 style="border-bottom:2px solid ' + color + ';padding-bottom:6px">公式卡（Chapter ' + CH.num + '）</h3>';
  h += '<div class="grid g2">' + CH.formulas.map(function (f) {
    return '<div class="fcard"><div class="fn">' + f.name + '</div><div>$$' + f.tex + '$$</div>' +
      (f.note ? '<div class="fnote">' + f.note + '</div>' : '') + '</div>';
  }).join('') + '</div></section>';

  h += '<section class="sec" id="examples"><h3 style="border-bottom:2px solid ' + color + ';padding-bottom:6px">例題詳解</h3>';
  CH.examples.forEach(function (e) { h += blockHTML(e); });
  h += '</section>';

  h += '<section class="sec" id="pitfalls"><h3 style="border-bottom:2px solid var(--err);padding-bottom:6px">⚠️ 常見錯誤與陷阱</h3>' +
    '<div class="card"><ul class="pts">' + CH.pitfalls.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul></div></section>';

  h += '<div style="display:flex;justify-content:space-between;gap:12px;margin-top:26px">' +
    (CH.num > 1 ? '<a class="btn" href="#/s/ch' + (CH.num - 1) + '">← 第 ' + (CH.num - 1) + ' 章</a>' : '<span></span>') +
    (CH.num < 6 ? '<a class="btn pri" href="#/s/ch' + (CH.num + 1) + '">第 ' + (CH.num + 1) + ' 章 →</a>' : '<span></span>') + '</div>';
  return h;
}

/* ---------- 公式總表 ---------- */
function renderRef() {
  var h = '<h1>快速查詢：全部公式</h1><p class="lede">考前最後掃一遍用。點章節標題可以回到該章。</p>';
  CONTENT.forEach(function (CH) {
    var color = 'var(--' + CHCOLOR[CH.id] + ')';
    h += '<h2 style="color:' + color + '"><a href="#/s/' + CH.id + '" style="color:inherit">Ch' + CH.num + '　' + CH.title + '</a></h2>' +
      '<div class="grid g2">' + CH.formulas.map(function (f) {
        return '<div class="fcard"><div class="fn">' + f.name + '</div><div>$$' + f.tex + '$$</div>' +
          (f.note ? '<div class="fnote">' + f.note + '</div>' : '') + '</div>';
      }).join('') + '</div>';
  });
  return h;
}

/* ---------- A4 筆記 ----------
   pages: [{ head, sub, items:[cheat item], extras:[{title, items:[html]}] }, ...]
   第一頁標題會加上「（正面）」；單獨一頁時不加。 */
function sheetHTML(pages) {
  return pages.map(function (pg, pi) {
    var h = '<div class="a4' + (pg.css ? ' ' + pg.css : '') + '">';
    var head = pg.head || '近代物理 期中考 A4 筆記';
    if (pg.side) head += '（' + pg.side + '）';
    h += '<h1>' + head + '</h1>' +
      '<p class="subt">' + (pg.sub || 'Beiser《Concepts of Modern Physics》Ch1–Ch6　·　考前最後掃描用') + '</p>';
    h += '<div class="cols">';
    var byCh = {};
    pg.items.forEach(function (it) { (byCh[it.ch] = byCh[it.ch] || []).push(it); });
    [1, 2, 3, 4, 5, 6].forEach(function (c) {
      if (!byCh[c]) return;
      h += '<div class="cbox"><h2 style="background:#16324f">' + byCh[c][0].title + '</h2>';
      byCh[c].forEach(function (it) {
        h += '<div class="it"><div class="k">' + it.k + '</div><div class="v">' + it.v + '</div></div>';
      });
      h += '</div>';
    });
    (pg.extras || []).forEach(function (box) {
      h += '<div class="xbox"><h2>■ ' + box.title + '</h2><ul>' +
        box.items.map(function (l) { return '<li>' + l + '</li>'; }).join('') + '</ul></div>';
    });
    h += '</div>';
    h += '<div class="fnote">★ 考場提醒：先寫下已知與所求 → 挑公式 → 檢查單位。'
      + (pi === 0 ? '　先算 γ；波長↔能量用 1240 eV·nm。' : '') + '</div>';
    h += '</div>';
    return h;
  }).join('');
}
