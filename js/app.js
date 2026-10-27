/* ===== 路由、首頁、進度 ===== */
'use strict';

var LS_READ = 'mp_read_v1';
var LS_THEME = 'mp_theme_v1';
var READ = {};
try { READ = JSON.parse(localStorage.getItem(LS_READ) || '{}') || {}; } catch (e) { READ = {}; }
function saveRead() { try { localStorage.setItem(LS_READ, JSON.stringify(READ)); } catch (e) { } }

function chById(id) { for (var i = 0; i < CONTENT.length; i++) if (CONTENT[i].id === id) return CONTENT[i]; return null; }

/* ---------- 首頁 ---------- */
function totalSections() { return CONTENT.reduce(function (a, c) { return a + c.sections.length; }, 0); }
function readCount() { var n = 0; for (var k in READ) if (READ[k]) n++; return n; }

function renderHome() {
  var ts = totalSections(), rd = readCount();
  var h = '';
  h += '<div style="margin-top:26px">' +
    '<span class="pill">逢甲大學 · 近代物理</span>' +
    '<h1 style="font-size:34px;margin-top:10px">近代物理期中考　總複習</h1>' +
    '<p class="lede" style="max-width:820px">這份教材把老師提供的六章講義、作業題、'
    + '各校題庫與考古題全部讀過之後，整理成「<b>看得懂的中文＋一定要會的公式＋可以自己算的例題</b>」。'
    + '沒有基礎也看得懂：每個公式都先講「為什麼要有它」，再講「怎麼用」。</p></div>';

  h += '<div class="card" style="border-left:5px solid var(--acc)">' +
    '<h4 style="margin-top:0">📌 先確認考試範圍（很重要）</h4>' +
    '<p>老師提供的講義涵蓋 <b>Chapter 1–6</b>。大學近代物理通常把課程切成兩半：</p>' +
    '<table class="t"><thead><tr><th>考試</th><th>通常範圍</th><th>主題</th></tr></thead><tbody>' +
    '<tr><td><b>期中考</b></td><td>Ch1–Ch4</td><td>相對論、光的粒子性、物質波、原子結構</td></tr>' +
    '<tr><td>期末考</td><td>Ch5–Ch6</td><td>量子力學（薛丁格方程式）、氫原子量子理論</td></tr>' +
    '</tbody><caption>這是 Beiser 課本最常見的切法。'
    + '<b>如果老師有宣布範圍，請以老師說的為準；沒有宣布的話，六章都唸最保險。</b>'
    + '這份教材六章都完整整理好了。</caption></table>' +
    '<p class="hint">另外準備了三張紙本：<b>A4 筆記（單面／雙面）</b>可以影印帶進考場，'
    + '<b>重點整理 Word 檔</b>方便你自己加註。檔案都在這個資料夾裡。</p></div>';

  // 章節卡
  h += '<h2>六章內容</h2><div class="grid g3">' + CONTENT.map(function (c) {
    var color = 'var(--' + CHCOLOR[c.id] + ')';
    var r = c.sections.filter(function (s) { return READ[c.id + '/' + s.id]; }).length;
    return '<a class="card" href="#/s/' + c.id + '" style="text-decoration:none;color:inherit;display:block;border-top:4px solid ' + color + '">' +
      '<div style="font-size:12px;font-weight:800;color:' + color + '">CHAPTER ' + c.num + '</div>' +
      '<div style="font-size:19px;font-weight:800;margin:2px 0 4px">' + c.title + '</div>' +
      '<div class="hint">' + c.en + '</div>' +
      '<div class="hint" style="margin-top:8px">' + c.sections.length + ' 節 · ' + c.formulas.length + ' 條公式 · '
      + c.examples.length + ' 個例題</div>' +
      '<div class="prog" style="margin-top:9px"><i style="width:' + (r / c.sections.length * 100) + '%;background:' + color + '"></i></div>' +
      '</a>';
  }).join('') + '</div>';

  // 學習路徑
  h += '<h2>建議的讀書順序</h2><div class="card"><ol class="pts">' +
    '<li><b>先看每一章的「這個章節在講什麼？」</b>＋「這一章怎麼唸」，花 5 分鐘建立地圖。'
    + '不要一開始就想背公式，先知道這章要解決什麼問題。</li>' +
    '<li><b>逐節讀觀念，邊讀邊玩「🔬 動手玩」的互動圖。</b>'
    + '例如 Ch1 拖動 β 看 γ 暴衝、Ch2 拖溫度看黑體峰值跑掉 —— 圖像記憶比文字牢 10 倍。</li>' +
    '<li><b>把公式卡掃一遍</b>，挑出「我講不出來它是什麼」的公式，回去看那一節。</li>' +
    '<li><b>例題先自己算一遍再看解答。</b>看解答時重點不是答案，是「第一步為什麼這樣設」。</li>' +
    '<li><b>做練習測驗</b>（每章 15–20 題）。答錯的會進錯題本，隔天再練一次錯題本。</li>' +
    '<li><b>考前用閃卡＋A4 筆記做最後複習。</b>' +
    '閃卡幫助你「講得出來」，A4 筆記幫助你「考試時查得到」。</li>' +
    '</ol></div>';

  // 進度
  h += '<h2>我的進度</h2><div class="grid g4">' +
    '<div class="stat"><div class="k">已讀節數</div><div class="v">' + rd + '/' + ts + '</div></div>' +
    '<div class="stat"><div class="k">測驗作答</div><div class="v">' + (QS.data.done || 0) + '</div></div>' +
    '<div class="stat"><div class="k">答對率</div><div class="v">' +
    (QS.data.done ? Math.round(QS.data.right / QS.data.done * 100) + '%' : '—') + '</div></div>' +
    '<div class="stat"><div class="k">錯題本</div><div class="v">' + Object.keys(QS.data.wrong || {}).length + '</div></div>' +
    '</div><p class="hint">進度存在你自己的瀏覽器裡（localStorage），不會上傳到任何地方。'
    + '換瀏覽器或清除資料就會歸零。</p>';

  var online = /^https?:/.test(location.protocol);
  h += '<h2>檔案清單</h2><div class="card"><ul class="pts">' +
    '<li><b>index.html</b> —— 這份互動教材（雙擊即可用，不需要網路）。</li>' +
    '<li><a href="近代物理_A4筆記_單面.pdf" target="_blank"><b>近代物理_A4筆記_單面.pdf</b></a>'
    + ' —— 一張 A4 一頁，最精簡版，影印後帶進考場。</li>' +
    '<li><a href="近代物理_A4筆記_雙面.pdf" target="_blank"><b>近代物理_A4筆記_雙面.pdf</b></a>'
    + ' —— 一張 A4 兩面（正反面），內容較完整。</li>' +
    '<li><a href="近代物理期中考重點整理.docx" target="_blank"><b>近代物理期中考重點整理.docx</b></a>'
    + ' —— Word 版，方便自己加註或列印。</li>' +
    '<li><a href="使用說明.txt" target="_blank"><b>使用說明.txt</b></a>'
    + ' —— 檔案用途、讀書順序與列印設定。</li>' +
    '</ul>' + (online
      ? '<p class="hint" style="margin-bottom:0">你現在看的是線上版。把這個網址存起來，'
      + '手機、平板、學校電腦都能開：<span class="kbd">' + location.origin + location.pathname + '</span></p>'
      : '<p class="hint" style="margin-bottom:0">你現在看的是離線版。線上版網址：'
      + '<a href="https://yuchen0614.github.io/modern-physics-midterm/" target="_blank">'
      + 'https://yuchen0614.github.io/modern-physics-midterm/</a>'
      + '（沒有網路時就繼續用這個資料夾的 index.html，功能完全一樣）。</p>') +
    '</div>';
  return h;
}

/* ---------- A4 筆記頁 ---------- */
function renderSheet() {
  var pages = [
    { head: '近代物理 期中考 A4 筆記', css: 'one', sub: SHEET_SUB + '（單面版）', items: SHEET_SINGLE, extras: [SHEET_BOX_CONST] },
    { head: '近代物理 期中考 A4 筆記', side: '正面', sub: SHEET_SUB + '（雙面版 · 1/2）', items: SHEET_FRONT, extras: [SHEET_BOX_CONST] },
    { head: '近代物理 期中考 A4 筆記', side: '背面', sub: SHEET_SUB + '（雙面版 · 2/2）', items: SHEET_BACK, extras: [SHEET_BOX_ERR] }
  ];
  var h = '<h1>A4 筆記</h1>' +
    '<p class="lede">老師允許帶一張 A4 筆記進考場。這裡準備了兩個版本，直接列印或照抄都可以。</p>';
  h += '<div class="sheetbar noprint">' +
    '<button class="btn pri" id="printsheet">🖨 列印（A4，2 欄）</button>' +
    '<span class="hint">列印設定：紙張 A4、方向直式、邊界「無」或「最小」、'
    + '關閉「頁首頁尾」、縮放 100%。</span></div>';
  h += '<div class="grid g2" style="grid-template-columns:repeat(auto-fit,minmax(320px,1fr))">' +
    '<div class="card tight"><b>版本 A：單面一張</b><p class="hint" style="margin:4px 0 0">'
    + '只放最核心的公式與陷阱，字比較大、比較好讀。適合「翻得到就好」。</p></div>' +
    '<div class="card tight"><b>版本 B：雙面一張（正面＋背面）</b><p class="hint" style="margin:4px 0 0">'
    + '每章再多幾個次要條目與常數表。適合想多帶一點安全感。</p></div>' +
    '</div>';
  h += '<h2>預覽（點「列印」會輸出這三頁；只印第一頁就是一張單面）</h2>';
  h += '<div class="sheetwrap darkok" id="sheetwrap">' + sheetHTML(pages) + '</div>';
  return h;
}
function renderPlan() {
  var h = '<h1>考前衝刺計畫</h1><p class="lede">假設你現在沒什麼基礎，這是一份按天數排的計畫。'
    + '如果時間更緊，就按「優先順序」跳著做。</p>';
  h += '<div class="card"><table class="t"><thead><tr><th>階段</th><th>做什麼</th><th>時間</th><th>怎麼確認學會了</th></tr></thead><tbody>';
  [
    ['① 掃描', '首頁 → 每章的「這個章節在講什麼？」。六章全部看過一遍，不求懂。', '30 分',
      '能說出每章在解決什麼問題（例如 Ch2＝為什麼光的能量是一包一包的）'],
    ['② 主攻 Ch1', '讀 1.1–1.6，玩 γ 與孿生子互動圖，例題 1.3 / 1.4 / 1.7 各算一遍。', '2 小時',
      '能不查公式寫出 γ、長度收縮、時間膨脹，並判斷題目裡誰是 Δt₀'],
    ['③ 主攻 Ch2', '讀 2.2–2.7，玩黑體／光電／X 光／康普頓四張圖，例題算 2.2 / 2.3 / 2.4。', '2.5 小時',
      '看到波長能立刻換算能量（1240/λ），知道光電與康普頓的關鍵差異'],
    ['④ 主攻 Ch3+Ch4', 'Ch3 的 λ=h/p 與不確定性；Ch4 的氫能階與瑞德堡公式。', '2.5 小時',
      '能不查表寫出氫能階前四階，並算出任意兩階躍遷的波長'],
    ['⑤ 練題', '做 Ch1–Ch4 的練習測驗（每章 15–20 題），錯的進錯題本。', '1.5 小時',
      '答對率 75% 以上'],
    ['⑥ 補強', '重做錯題本；把每章「常見錯誤與陷阱」念一遍。', '1 小時',
      '錯題本降到 5 題以內'],
    ['⑦ 抄筆記', '照著 A4 筆記，自己抄一遍（自己抄才有記憶效果）。', '40 分',
      '抄的時候能說出每一條在幹什麼'],
    ['⑧ 考前 20 分', '只看 A4 筆記與閃卡，不看新東西。', '20 分', '——'],
  ].forEach(function (r) {
    h += '<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>';
  });
  h += '</tbody><caption>如果只考 Ch1–Ch4，做到 ⑤ 就夠了；Ch5–Ch6 留到期末考前再看一次。</caption></table></div>';

  h += '<h2>如果只剩今晚</h2><div class="card" style="border-left:5px solid var(--err)">' +
    '<ol class="pts">' +
    '<li><b>Ch4 先看</b>（投報率最高）：$E_n=-13.6/n^{2}$ eV、$1/\\lambda=R(1/n_f^2-1/n_i^2)$、'
    + '$\\lambda(\\mathrm{nm})=1240/\\Delta E(\\mathrm{eV})$。三條公式可以吃掉大部分計算題。</li>' +
    '<li><b>Ch2 的 1240 eV·nm</b>：光電效應、X 光、康普頓都會用到，只要會這一招就能算一半。</li>' +
    '<li><b>Ch1 的 γ</b>：會算 γ、會分辨 $L_0$ 與 $\\Delta t_0$，Ch1 的分數就拿到了。</li>' +
    '<li><b>Ch3/Ch5 只記結論</b>：$\\lambda=h/p$、$E_n=n^2h^2/8mL^2$、$\\Delta x\\Delta p\\ge\\hbar/2$、'
    + '$T\\approx e^{-2kL}$，知道每個符號是什麼即可。</li>' +
    '<li><b>Ch6 只記取值範圍</b>：$n\\ge1$、$0\\le l\\le n-1$、$-l\\le m_l\\le l$、狀態數 $n^{2}$。</li>' +
    '</ol></div>';
  return h;
}

/* ---------- 主渲染 ---------- */
var MAIN;
function rerenderMain() {
  var hash = location.hash.replace(/^#\/?/, '');
  var parts = hash.split('/');
  var html = '', nav = 'home';
  if (parts[0] === 's' && parts[1]) {
    var CH = chById(parts[1]);
    if (CH) { html = renderChapter(CH); nav = CH.id; }
  } else if (parts[0] === 'ref') { html = renderRef(); nav = 'ref'; }
  else if (parts[0] === 'sheet') { html = renderSheet(); nav = 'sheet'; }
  else if (parts[0] === 'quiz') { html = renderQuizTop(); if (QUIZ_VIEW.list.length) html = renderQuizTop() + renderQCard(); nav = 'quiz'; }
  else if (parts[0] === 'cards') { html = renderCards(); nav = 'cards'; }
  else if (parts[0] === 'plan') { html = renderPlan(); nav = 'plan'; }
  else html = renderHome();

  REDRAW.length = 0;   // 舊章節的 lab 已經被移除，重繪函式必須一起清掉
  MAIN.innerHTML = html;
  document.querySelectorAll('nav.main a').forEach(function (a) {
    a.classList.toggle('on', a.getAttribute('data-nav') === nav);
  });
  typeset(MAIN);
  mountAll();
  if (parts[0] === 's' && parts[2]) {
    var el = document.getElementById(parts[2]);
    if (el) el.scrollIntoView({ block: 'start' });
  } else {
    window.scrollTo(0, 0);
  }
}

function mountAll() {
  // 互動實驗室
  var hosts = MAIN.querySelectorAll('.lab');
  for (var i = 0; i < hosts.length; i++) {
    var id = hosts[i].getAttribute('data-lab');
    var box = hosts[i].querySelector('.lb');
    if (id && LABS[id] && box && !box.getAttribute('data-mounted')) {
      box.setAttribute('data-mounted', '1');
      try { LABS[id].build(box); } catch (e) { box.innerHTML = '<div class="hint">圖表載入失敗：' + e.message + '</div>'; console.error(e); }
    }
  }
  // 已讀勾選
  MAIN.querySelectorAll('[data-read]').forEach(function (cb) {
    var k = cb.getAttribute('data-read');
    cb.checked = !!READ[k];
    cb.onchange = function () { READ[k] = cb.checked; saveRead(); };
  });
  // 綁定互動
  if (!MAIN.getAttribute('data-bound')) {
    MAIN.setAttribute('data-bound', '1');
    bindQuiz(MAIN);
    bindCards(MAIN);
    MAIN.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'printsheet') window.print();
    });
  }
  requestAnimationFrame(function () { redrawAll(); setTimeout(redrawAll, 80); });
}

/* ---------- 主題 ---------- */
function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(LS_THEME, t); } catch (e) { }
  var b = document.getElementById('themebtn');
  if (b) b.textContent = t === 'dark' ? '☀ 亮色' : '🌙 暗色';
  setTimeout(redrawAll, 30);
}

/* ---------- 啟動 ---------- */
window.addEventListener('DOMContentLoaded', function () {
  MAIN = document.getElementById('main');
  QS.load();
  var saved = 'light';
  try { saved = localStorage.getItem(LS_THEME) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'); } catch (e) { }
  applyTheme(saved);
  document.getElementById('themebtn').onclick = function () {
    applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  };
  window.addEventListener('hashchange', rerenderMain);
  rerenderMain();
});
