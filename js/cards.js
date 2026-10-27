/* ===== 閃卡 ===== */
'use strict';

var CARD_VIEW = { ch: 0, shuffled: false, order: null };

function cardPool() {
  var p = CARD_VIEW.ch ? CARDS.filter(function (c) { return c.ch === CARD_VIEW.ch; }) : CARDS.slice();
  if (CARD_VIEW.shuffled) {
    p = p.slice();
    for (var i = p.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = p[i]; p[i] = p[j]; p[j] = t; }
  }
  return p;
}

function renderCards() {
  var pool = cardPool();
  var h = '<h1>閃卡</h1><p class="lede">先自己講出答案，再點卡片翻面。'
    + '把答不出來的挑出來重複，比從頭讀一遍有效得多。</p>';
  h += '<div class="qbar">' +
    '<button class="btn ' + (CARD_VIEW.ch === 0 ? 'pri' : '') + '" data-cc="0">全部（' + CARDS.length + '）</button>' +
    [1, 2, 3, 4, 5, 6].map(function (c) {
      var n = CARDS.filter(function (x) { return x.ch === c; }).length;
      return '<button class="btn ' + (CARD_VIEW.ch === c ? 'pri' : '') + '" data-cc="' + c + '">Ch' + c + '（' + n + '）</button>';
    }).join('') +
    '<button class="btn" data-cshuffle="1">🔀 洗牌</button>' +
    '<button class="btn" data-cflip="1" style="margin-left:auto">全部翻面 / 蓋回</button>' +
    '</div>';
  h += '<div class="deck" id="deck">' + pool.map(function (c, i) {
    return '<div class="fc" data-fc="' + i + '"><span class="tag">Ch' + c.ch + ' · ' + c.tag + '</span>' +
      '<div class="side q">' + c.front + '</div><span class="hint">點我翻面</span></div>';
  }).join('') + '</div>';
  return h;
}

function bindCards(root) {
  var flipped = {};
  root.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-cc],[data-cshuffle],[data-cflip],[data-fc]') : null;
    if (!t) return;
    if (t.hasAttribute('data-cc')) { CARD_VIEW.ch = +t.getAttribute('data-cc'); rerenderMain(); return; }
    if (t.hasAttribute('data-cshuffle')) { CARD_VIEW.shuffled = !CARD_VIEW.shuffled; rerenderMain(); return; }
    if (t.hasAttribute('data-cflip')) {
      var all = root.querySelectorAll('.fc'), any = false;
      for (var i = 0; i < all.length; i++) if (flipped[i] !== true) { any = true; break; }
      var target = !any;
      var pool = cardPool();
      for (var j = 0; j < all.length; j++) {
        flipped[j] = target;
        setFace(all[j], pool[j], target);
      }
      return;
    }
    if (t.hasAttribute('data-fc')) {
      var idx = +t.getAttribute('data-fc');
      var pool2 = cardPool();
      flipped[idx] = !flipped[idx];
      setFace(t, pool2[idx], flipped[idx]);
    }
  });
}
function setFace(el, c, ans) {
  var side = el.querySelector('.side');
  side.className = 'side' + (ans ? ' ans' : ' q');
  side.innerHTML = ans ? c.back : c.front;
  typeset(el);
}
