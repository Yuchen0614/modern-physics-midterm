/* ===== 測驗引擎 ===== */
'use strict';

var QS = {
  key: 'mp_test_v1',
  data: { wrong: {}, answered: {}, right: 0, done: 0 },
  load: function () {
    try { var s = localStorage.getItem(this.key); if (s) this.data = JSON.parse(s); } catch (e) { }
    if (!this.data.wrong) this.data.wrong = {};
    if (!this.data.answered) this.data.answered = {};
    if (!this.data.right) this.data.right = 0;
    if (!this.data.done) this.data.done = 0;
  },
  save: function () {
    if (!this.data.hist) this.data.hist = [];
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { }
  },
  reset: function () {
    this.data = { wrong: {}, answered: {}, right: 0, done: 0, hist: [] };
    this.save();
  }
};

var QUIZ_VIEW = { list: [], i: 0, mode: 'all', justAnswered: false, lastCorrect: null };

function quizPool(mode) {
  if (mode === 'wrong') return QUIZ.filter(function (q, i) { return QS.data.wrong[qkey(q, i)]; });
  if (mode && mode.indexOf('ch') === 0) { var c = +mode.slice(2); return QUIZ.filter(function (q) { return q.ch === c; }); }
  return QUIZ.slice();
}
function qkey(q, i) { return 'q' + q.ch + '_' + (i === undefined ? QUIZ.indexOf(q) : i); }

function renderQuizTop() {
  var tot = QUIZ.length;
  var wrongN = 0, i;
  for (i = 0; i < tot; i++) if (QS.data.wrong[qkey(QUIZ[i], i)]) wrongN++;
  var rate = QS.data.done ? Math.round(QS.data.right / QS.data.done * 100) : 0;
  return '<h1>練習測驗</h1>' +
    '<p class="lede">共 ' + tot + ' 題中文選擇題，依章節分類，每題都有詳解。'
    + '答錯的題目會自動進入「錯題本」，可以重複練到會。</p>' +
    '<div class="grid g4" style="margin:16px 0">' +
    '<div class="stat"><div class="k">已作答</div><div class="v">' + QS.data.done + '</div></div>' +
    '<div class="stat"><div class="k">答對率</div><div class="v">' + rate + '%</div></div>' +
    '<div class="stat"><div class="k">錯題本</div><div class="v" style="color:var(--err)">' + wrongN + '</div></div>' +
    '<div class="stat"><div class="k">題庫總數</div><div class="v">' + tot + '</div></div>' +
    '</div>' +
    '<div class="qbar">' +
    '<button class="btn pri" data-qstart="all">開始全部 ' + tot + ' 題</button>' +
    [1, 2, 3, 4, 5, 6].map(function (c) {
      var n = QUIZ.filter(function (q) { return q.ch === c; }).length;
      return '<button class="btn" data-qstart="ch' + c + '">Ch' + c + '（' + n + '）</button>';
    }).join('') +
    '<button class="btn" data-qstart="wrong">只練錯題（' + wrongN + '）</button>' +
    '<button class="btn" data-qreset="1" style="margin-left:auto">清除紀錄</button>' +
    '</div>';
}

function renderQCard() {
  var q = QUIZ_VIEW.list[QUIZ_VIEW.i];
  if (!q) return '<div class="card">這個模式沒有題目 🎉</div>';
  var idx = QUIZ.indexOf(q);
  var k = qkey(q, idx);
  var h = '<div class="qbar"><span class="pill">第 ' + (QUIZ_VIEW.i + 1) + ' / ' + QUIZ_VIEW.list.length + ' 題</span>' +
    '<span class="pill gray">Chapter ' + q.ch + '</span>' +
    '<div class="prog"><i style="width:' + ((QUIZ_VIEW.i) / QUIZ_VIEW.list.length * 100) + '%"></i></div>' +
    '<button class="btn sm" data-qnav="-1">← 上一題</button>' +
    '<button class="btn sm" data-qnav="1">下一題 →</button>' +
    '<button class="btn sm" data-qback="1">回列表</button></div>';
  h += '<div class="qz" id="qcard"><p class="qq">' + q.q + '</p><div class="opts">';
  var LB = ['A', 'B', 'C', 'D', 'E', 'F'];
  q.opts.forEach(function (o, j) {
    h += '<div class="opt" data-qi="' + idx + '" data-oj="' + j + '"><span class="lb">' + LB[j] + '</span><span>' + o + '</span></div>';
  });
  h += '</div><div id="qexp"></div></div>';
  return h;
}

function bindQuiz(root) {
  root.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-qstart],[data-qi],[data-qnav],[data-qback],[data-qreset]') : null;
    if (!t) return;
    if (t.hasAttribute('data-qstart')) {
      QUIZ_VIEW.mode = t.getAttribute('data-qstart');
      QUIZ_VIEW.list = quizPool(QUIZ_VIEW.mode); QUIZ_VIEW.i = 0; QUIZ_VIEW.justAnswered = false;
      rerenderMain(); return;
    }
    if (t.hasAttribute('data-qreset')) { if (confirm('清除所有作答紀錄與錯題本？')) { QS.reset(); rerenderMain(); } return; }
    if (t.hasAttribute('data-qnav')) {
      var d = +t.getAttribute('data-qnav');
      QUIZ_VIEW.i = (QUIZ_VIEW.i + d + QUIZ_VIEW.list.length) % QUIZ_VIEW.list.length;
      QUIZ_VIEW.justAnswered = false; rerenderMain(); return;
    }
    if (t.hasAttribute('data-qback')) { QUIZ_VIEW.list = []; rerenderMain(); return; }
    if (t.hasAttribute('data-qi')) {
      var idx = +t.getAttribute('data-qi'), oj = +t.getAttribute('data-oj');
      var q = QUIZ[idx];
      if (QUIZ_VIEW.justAnswered) return;
      QUIZ_VIEW.justAnswered = true;
      var right = (oj === q.ans);
      var box = document.getElementById('qcard');
      if (!box) return;
      var opts = box.querySelectorAll('.opt');
      for (var i = 0; i < opts.length; i++) {
        if (+opts[i].getAttribute('data-oj') === q.ans) opts[i].classList.add('right');
        else if (+opts[i].getAttribute('data-oj') === oj) opts[i].classList.add('wrong');
      }
      var k = qkey(q, idx);
      QS.data.done++;
      if (right) { QS.data.right++; delete QS.data.wrong[k]; } else { QS.data.wrong[k] = 1; }
      QS.save();
      var ex = document.getElementById('qexp');
      ex.innerHTML = '<div class="exp"><span class="lbl">' + (right ? '✔ 答對了' : '✘ 答錯了') + '　正確答案：' + ['A', 'B', 'C', 'D', 'E'][q.ans] + '</span>' + q.exp + '</div>';
      typeset(ex);
      var qq = document.querySelector('.qz .qq');
      if (qq) typeset(qq);
      var oo = document.querySelectorAll('.qz .opt');
      for (var m = 0; m < oo.length; m++) typeset(oo[m]);
    }
  });
}
