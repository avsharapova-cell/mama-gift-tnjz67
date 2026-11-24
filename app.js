/* Логика сайта-подарка. Тексты экранов — в index.html, квиза/воспоминаний — ниже, медиа — в config.js */
(function () {
  'use strict';
  var G = window.GIFT || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var stage = $('#stage');
  var PAL = ['#f09bb2', '#e58aa0', '#f6b48a', '#c690c1', '#d23c4e', '#f4c35a'];

  /* ---------- Масштаб: сцена 1920×1080 вписывается в любой экран ---------- */
  function stageScale() { return Math.min(window.innerWidth / 1920, window.innerHeight / 1080); }
  function fit() { stage.style.transform = 'translate(-50%,-50%) scale(' + stageScale() + ')'; }
  window.addEventListener('resize', fit); fit();
  function toStage(cx, cy) { var r = stage.getBoundingClientRect(), s = stageScale(); return [(cx - r.left) / s, (cy - r.top) / s]; }

  /* ---------- Живопись: мазки кисти на canvas (щетина, сухая кисть) ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function samplePath(pts, n) {
    var P = [pts[0]].concat(pts, [pts[pts.length - 1]]), segs = pts.length - 1, out = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n * segs, k = Math.min(Math.floor(t), segs - 1), u = t - k;
      var p0 = P[k], p1 = P[k + 1], p2 = P[k + 2], p3 = P[k + 3];
      var f = function (a, b, c, d) { return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u); };
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
    return out;
  }
  function jitter(rgb, r) { return rgb.map(function (c) { return Math.max(0, Math.min(255, Math.round(c + (r() - .5) * 34))); }).join(','); }
  function brushStroke(ctx, pts, width, rgb, r, alpha) {
    var poly = samplePath(pts, 150), N = poly.length;
    var nor = poly.map(function (p, i) {
      var a = poly[Math.max(0, i - 1)], b = poly[Math.min(N - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      return [-dy / l, dx / l];
    });
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    /* мягкая основа */
    ctx.strokeStyle = 'rgba(' + rgb.join(',') + ',' + (alpha * .32) + ')'; ctx.lineWidth = width * .78; ctx.beginPath();
    poly.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
    /* щетина */
    var nb = Math.round(width / 2.2);
    for (var b = 0; b < nb; b++) {
      var off = (b / (nb - 1) - .5), s0 = Math.floor(r() * N * .1), s1 = N - 1 - Math.floor(r() * N * .24);
      var lw = 1.2 + r() * 3.4, a = alpha * (.22 + r() * .55), ph = r() * 6.28, wob = (r() - .5) * .1;
      ctx.strokeStyle = 'rgba(' + jitter(rgb, r) + ',' + a + ')'; ctx.lineWidth = lw; ctx.beginPath();
      var pen = false;
      for (var i = s0; i <= s1; i++) {
        var t = i / (N - 1), taper = Math.pow(Math.sin(Math.PI * t), .32), w = width * taper;
        var o = off * w + Math.sin(t * 11 + ph) * width * wob;
        if (r() < .006) { pen = false; continue; }
        var x = poly[i][0] + nor[i][0] * o, y = poly[i][1] + nor[i][1] * o;
        if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  var BRUSH = ['240,160,182', '247,189,156', '178,122,185', '226,116,143', '244,170,140'].map(function (s) { return s.split(',').map(Number); });
  function paintScreen(sec, seed) {
    var c = document.createElement('canvas'); c.width = 1920; c.height = 1080; c.className = 'paint';
    sec.insertBefore(c, sec.firstChild);
    var r = rng(seed * 7919 + 13), ctx = c.getContext('2d');
    var pick = function () { return BRUSH[Math.floor(r() * BRUSH.length)]; };
    brushStroke(ctx, [[-60, 90 + r() * 50], [500, 40 + r() * 70], [1100, 120 + r() * 60], [1980, 60 + r() * 70]], 70 + r() * 30, pick(), r, .34);
    brushStroke(ctx, [[-60, 950 + r() * 60], [600, 900 + r() * 60], [1300, 990 + r() * 50], [1980, 930 + r() * 60]], 70 + r() * 30, pick(), r, .34);
    brushStroke(ctx, [[40 + r() * 40, 300 + r() * 60], [70, 520], [40, 760], [60 + r() * 40, 900]], 40 + r() * 14, pick(), r, .28);
    brushStroke(ctx, [[1870 - r() * 40, 160 + r() * 80], [1850, 420], [1890, 700], [1860, 880]], 40 + r() * 14, pick(), r, .28);
    /* пара мазков-«мазочков» */
    brushStroke(ctx, [[1500 + r() * 200, 1020], [1650, 1000 - r() * 30], [1800 + r() * 80, 1030]], 26, pick(), r, .28);
    brushStroke(ctx, [[120 + r() * 100, 40 + r() * 20], [260, 70], [360 + r() * 60, 40]], 22, pick(), r, .28);
  }
  function underline(seed, rgb) {
    var c = document.createElement('canvas'); c.width = 760; c.height = 60;
    var r = rng(seed), ctx = c.getContext('2d');
    brushStroke(ctx, [[14, 34], [200, 22 + r() * 12], [420, 36], [740, 24 + r() * 10]], 22, rgb, r, .9);
    return 'url(' + c.toDataURL('image/png') + ')';
  }
  document.documentElement.style.setProperty('--ul', underline(5, [226, 116, 143]));

  /* ---------- Плавающие сердечки в полях ---------- */
  (function () {
    var box = $('#floaters');
    for (var i = 0; i < 9; i++) {
      var d = document.createElement('div'); d.className = 'fl';
      var left = i % 2 ? 1760 + Math.random() * 120 : 20 + Math.random() * 130, sz = 26 + Math.random() * 26;
      d.style.cssText = 'left:' + left + 'px;width:' + sz + 'px;height:' + sz + 'px;color:' + PAL[i % 4] +
        ';animation-duration:' + (16 + Math.random() * 12) + 's;animation-delay:-' + (Math.random() * 20) + 's';
      d.innerHTML = '<svg><use href="#i-heart"/></svg>';
      box.appendChild(d);
    }
  })();

  /* ---------- Лепестки, падающие на фоне ---------- */
  (function () {
    var box = $('#petals'), cols = ['#f7c6d2', '#fff1f0', '#f4a9bb', '#fbd5bd', '#ecc4dc'];
    for (var i = 0; i < 16; i++) {
      var d = document.createElement('div'); d.className = 'pt';
      var sz = 22 + Math.random() * 20;
      d.style.cssText = 'left:' + (Math.random() * 1880) + 'px;width:' + (sz * .6) + 'px;height:' + sz + 'px;color:' + cols[i % cols.length] +
        ';--dx:' + ((Math.random() - .5) * 360) + 'px;--rot:' + (300 + Math.random() * 500) + 'deg;animation-duration:' + (16 + Math.random() * 14) + 's;animation-delay:-' + (Math.random() * 28) + 's';
      d.innerHTML = '<svg><use href="#i-petal"/></svg>';
      box.appendChild(d);
    }
  })();

  /* ---------- Флора: настоящие цветы (гравюры CC0) по краям экранов ---------- */
  var FR = { bouquet: .72, passion: .83, 'rose-pink': .63, moss: .77, crimson: .71, pompon: .61, peony: .77, amaryllis: .79, crocus: .47, hyacinth: .52,
    wild1: .73, 'photo-daisies': 1.076, 'photo-tulip': .43, 'photo-tulip-red': .635, 'photo-daisy': 1, wild2: .76, wild3: .75, cabbage: .79, darkrose: .67, sprig1: .73, sprig2: .63, white: .77, white2: .68, pale: .73, leaf: .85, delicate: .59 };
  /* [имя, центр x, центр y, высота, поворот°, зеркало, глубина параллакса, поверх карточек] */
  /* [имя, x, y, высота, поворот°, зеркало, глубина, поверх, бонус-письма, вращается] */
  var FLORA = {
    's-cover': [['pompon', 330, 790, 720, -5, 0, 14], ['moss', 1590, 740, 780, 6, 1, 14], ['sprig1', 110, 1010, 330, -20, 0, 8], ['sprig2', 1820, 1030, 330, 22, 1, 8], ['white2', 650, 905, 300, -72, 0, 20, 1],
      ['rose-pink', 1860, 300, 360, 160, 0, 10], ['wild3', 40, 250, 300, 20, 0, 10], ['photo-daisy', 150, 70, 200, 0, 0, 6, 0, 0, 1], ['photo-daisy', 1790, 990, 170, 0, 0, 6, 0, 0, 1]],
    's-mom': [['wild1', -20, 970, 560, -6, 0, 12], ['white', 1840, 110, 560, 196, 1, 10], ['peony', 1800, 985, 560, 10, 0, 12], ['sprig2', 560, 1030, 240, -86, 0, 8], ['photo-daisy', 70, 120, 160, 0, 0, 6, 0, 0, 1]],
    's-wisdom': [['amaryllis', 60, 930, 520, -6, 0, 12], ['crocus', 1870, 930, 480, 6, 1, 12], ['hyacinth', 1800, 40, 480, 190, 0, 10], ['rose-pink', 20, 40, 480, 160, 0, 10], ['sprig1', 960, 1030, 220, -90, 0, 8], ['photo-daisy', 1850, 540, 150, 0, 0, 6, 0, 0, 1]],
    's-mem': [['sprig2', 20, 900, 520, -8, 0, 12], ['cabbage', 1850, 1010, 480, 8, 0, 12], ['wild1', 60, 560, 300, 80, 0, 8], ['photo-daisy', 1870, 60, 170, 0, 0, 6, 0, 0, 1]],
    's-trips': [['crimson', 70, 960, 620, -7, 0, 14], ['darkrose', 1850, 950, 620, 7, 1, 14], ['wild2', 1840, 60, 480, 196, 1, 10], ['white', 20, 60, 400, 160, 0, 10], ['photo-daisy', 960, 1000, 150, 0, 0, 6, 0, 0, 1]],
    's-quiz': [['wild3', 40, 940, 540, -5, 0, 12], ['white2', 1880, 90, 500, 200, 1, 10], ['sprig1', 1870, 980, 420, 10, 1, 12], ['photo-daisy', 60, 80, 150, 0, 0, 6, 0, 0, 1], ['pale', 30, 520, 300, 90, 0, 8]],
    's-sisters': [['pale', 80, 940, 560, -8, 0, 12], ['moss', 1840, 930, 560, 8, 1, 12], ['hyacinth', 1830, 90, 480, 190, 0, 10], ['wild1', 10, 60, 400, 160, 0, 10], ['photo-daisy', 1560, 330, 150, 0, 0, 6, 0, 0, 1], ['amaryllis', 980, 1030, 260, -88, 0, 8]],
    's-bouquet': [['wild1', 1870, 990, 420, 8, 1, 10], ['sprig2', 1850, 80, 380, 195, 1, 8], ['photo-daisy', 1100, 1000, 140, 0, 0, 6, 0, 0, 1], ['white2', 1860, 540, 300, 180, 1, 8]],
    's-belief': [['rose-pink', 30, 640, 640, -3, 0, 12], ['peony', 1890, 640, 640, 3, 1, 12], ['sprig2', 200, 1020, 300, -25, 0, 8], ['sprig1', 1720, 1030, 300, 25, 1, 8], ['photo-daisy', 1750, 90, 150, 0, 0, 6, 0, 0, 1], ['photo-daisy', 120, 130, 130, 0, 0, 6, 0, 0, 1]],
    's-letter': [['crimson', 20, 610, 720, -3, 0, 10], ['darkrose', 1900, 610, 720, 3, 1, 10], ['bouquet', 100, 960, 300, -8, 0, 8, 1, 1], ['wild2', 1810, 1010, 240, 50, 1, 6, 1]],
    's-garden': [['hyacinth', 1850, 60, 440, 190, 1, 10], ['rose-pink', 60, 60, 440, 160, 0, 10], ['photo-daisy', 1790, 330, 140, 0, 0, 6, 0, 0, 1]],
    's-wish': [['wild2', 50, 930, 480, -6, 0, 12], ['peony', 1800, 960, 520, 8, 1, 12], ['hyacinth', 1850, 90, 440, 190, 1, 10], ['photo-daisy', 80, 120, 160, 0, 0, 6, 0, 0, 1]],
    's-clip': [['white2', 60, 940, 520, -6, 0, 12], ['cabbage', 1860, 980, 500, 8, 1, 12], ['hyacinth', 1860, 90, 460, 190, 0, 10], ['photo-daisy', 120, 110, 160, 0, 0, 6, 0, 0, 1]],
    's-song': [['white2', 60, 940, 520, -6, 0, 12], ['cabbage', 1860, 980, 500, 8, 1, 12], ['hyacinth', 1860, 90, 460, 190, 0, 10], ['photo-daisy', 120, 110, 160, 0, 0, 6, 0, 0, 1]]
  };
  function addFlora(sec, items) {
    (items || []).forEach(function (it, k) {
      var n = it[0], h = it[3], w = h * (FR[n] || .7), img = new Image();
      img.src = 'assets/flowers/' + n + '.webp'; img.alt = ''; img.draggable = false;
      img.className = 'flw' + (it[7] ? ' front' : '') + (it[8] ? ' bonus' : '') + (it[9] ? ' spin' : '') + (n.indexOf('photo-') === 0 ? ' photo' : '');
      img.dataset.r = it[4] || 0; img.dataset.fx = it[5] ? -1 : 1; img.dataset.n = n;
      img.style.cssText = 'left:' + (it[1] - w / 2) + 'px;top:' + (it[2] - h / 2) + 'px;width:' + w + 'px;height:' + h + 'px;--r:' + (it[4] || 0) + 'deg;--fx:' + (it[5] ? -1 : 1) +
        ';--d:' + (it[6] == null ? 10 : it[6]) + ';--sw:' + (5 + Math.random() * 3).toFixed(1) + 's;--fd:' + (0.1 + k * 0.15).toFixed(2) + 's;--sp:' + (70 + Math.random() * 50).toFixed(0) + 's';
      sec.insertBefore(img, sec.firstChild);
    });
  }
  /* вращающиеся венки из цветов: [секция, центр x, y, радиус, число цветов, высота цветка, прозрачность] */
  var WREATHS = { 's-letter': [960, 600, 450, 14, 140, .38], 's-song': [450, 450, 330, 11, 120, .45] };
  function addWreath(sec, cfg) {
    var names = ['rose-pink', 'wild1', 'white', 'cabbage', 'moss', 'peony', 'pale', 'wild3', 'white2', 'crimson'], w = document.createElement('div');
    w.className = 'wreath'; w.style.cssText = 'left:' + (cfg[0] - cfg[2] - 100) + 'px;top:' + (cfg[1] - cfg[2] - 100) + 'px;width:' + (cfg[2] * 2 + 200) + 'px;height:' + (cfg[2] * 2 + 200) + 'px;opacity:' + cfg[5];
    for (var i = 0; i < cfg[3]; i++) {
      var a = i / cfg[3] * Math.PI * 2, n = names[i % names.length], h = cfg[4] * (0.8 + Math.random() * 0.5), im = new Image();
      im.src = 'assets/flowers/' + n + '.webp'; im.alt = '';
      im.style.cssText = 'left:' + (cfg[2] + 100 + Math.cos(a) * cfg[2] - h * (FR[n] || .7) / 2) + 'px;top:' + (cfg[2] + 100 + Math.sin(a) * cfg[2] - h / 2) + 'px;width:' + (h * (FR[n] || .7)) + 'px;height:' + h + 'px;rotate:' + ((a * 180 / Math.PI) + 90) + 'deg';
      w.appendChild(im);
    }
    sec.insertBefore(w, sec.firstChild);
  }
  var pxRaf = 0;
  document.addEventListener('pointermove', function (e) {
    if (pxRaf) return;
    pxRaf = requestAnimationFrame(function () {
      pxRaf = 0; var p = toStage(e.clientX, e.clientY);
      stage.style.setProperty('--px', (Math.max(-1, Math.min(1, p[0] / 960 - 1))).toFixed(3));
      stage.style.setProperty('--py', (Math.max(-1, Math.min(1, p[1] / 540 - 1))).toFixed(3));
    });
  });

  /* ---------- Эффекты: сердечки, лепестки, искры за курсором ---------- */
  var fx = $('#fx');
  function burst(x, y, n, spread) {
    spread = spread || 1;
    for (var i = 0; i < n; i++) {
      var d = document.createElement('div'); d.className = 'fxh';
      var sz = 22 + Math.random() * 30, ico = Math.random() < .3 ? 'i-petal' : (Math.random() < .2 ? 'i-sparkle' : 'i-heart');
      d.style.cssText = 'left:' + (x - sz / 2) + 'px;top:' + (y - sz / 2) + 'px;width:' + sz + 'px;height:' + sz + 'px;color:' + PAL[Math.floor(Math.random() * PAL.length)] +
        ';--dx:' + ((Math.random() - .5) * 700 * spread) + 'px;--dy:' + (-(120 + Math.random() * 380) * spread) + 'px;--rot:' + ((Math.random() - .5) * 200) + 'deg;--t:' + (1.2 + Math.random() * .9) + 's';
      d.innerHTML = '<svg><use href="#' + ico + '"/></svg>';
      fx.appendChild(d);
      (function (el) { setTimeout(function () { el.remove(); }, 2300); })(d);
    }
  }
  var lastSp = 0, lx = -999, ly = -999;
  document.addEventListener('pointermove', function (e) {
    var now = Date.now(); touch();
    if (now - lastSp < 70 || fx.childElementCount > 40) return;
    var p = toStage(e.clientX, e.clientY);
    if (Math.hypot(p[0] - lx, p[1] - ly) < 46) return;
    lastSp = now; lx = p[0]; ly = p[1];
    var s = document.createElement('div'); s.className = 'spark';
    s.style.left = p[0] + 'px'; s.style.top = p[1] + 'px'; s.innerHTML = '<svg><use href="#i-sparkle"/></svg>';
    fx.appendChild(s); setTimeout(function () { s.remove(); }, 850);
  });
  document.addEventListener('click', function (e) {
    touch();
    if (e.target.closest('button,.env,.polaroid,input,label,#modal,.belief,.candle,a,.fi,.fh,.gp')) return;
    if (flowerAt(e.clientX, e.clientY)) return;
    var p = toStage(e.clientX, e.clientY); burst(p[0], p[1], 4, .35);
  });

  /* ---------- Автоподгон текста (чтобы ничего не вылезало за края) ---------- */
  function fitText(box, inner, cols) {
    if (!box || !inner || !box.clientHeight) return;
    inner.style.fontSize = '';
    var fs = parseFloat(getComputedStyle(inner).fontSize), cs = getComputedStyle(box);
    var avail = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var g = 0;
    if (cols) { while (inner.scrollWidth > inner.clientWidth + 2 && fs > 20 && g++ < 60) { fs -= 1; inner.style.fontSize = fs + 'px'; } return; }
    while (inner.scrollHeight > avail && fs > 20 && g++ < 60) { fs -= 1; inner.style.fontSize = fs + 'px'; }
  }
  function fitQuiz() {
    var card = $('#quiz-card'), body = $('#quiz-body');
    if (!card || card.hidden || !card.clientHeight) return;
    var cs = getComputedStyle(card), avail = card.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 80;
    var rea = $('.q-react', body), qt = $('.q-text', body), g = 0;
    if (rea) rea.style.fontSize = ''; if (qt) qt.style.fontSize = '';
    var fr = rea ? parseFloat(getComputedStyle(rea).fontSize) : 0, fq = qt ? parseFloat(getComputedStyle(qt).fontSize) : 0;
    while (body.scrollHeight > avail && g++ < 40) {
      if (rea && fr > 26) { fr -= 1; rea.style.fontSize = fr + 'px'; }
      else if (qt && fq > 30) { fq -= 1; qt.style.fontSize = fq + 'px'; } else break;
    }
  }
  function fitAll() {
    fitText($('.mem-card'), $('#mem-text'));
    fitText($('#belief-card'), $('#belief-text'));
    fitText($('.letter-body'), $('.letter-body'), true);
    fitQuiz();
    $$('.flip .face.back').forEach(function (f) { fitText(f, $('.bi', f)); });
    $$('.pc .face.back .pc-body').forEach(function (f) { fitText(f, $('.bi', f)); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(fitAll, 50); });

  /* ---------- Фото: подгрузка по именам файлов, заглушки ---------- */
  function loadPhoto(el) {
    var slot = el.dataset.photo, ph = $('.ph', el), cap = $('.cap', el);
    var caption = (G.captions && G.captions[slot]) || '', ov = G.photos && G.photos[slot], ovTried = false;
    if (ov && ov.caption != null) caption = ov.caption;
    if (cap) cap.textContent = caption;
    var exts = G.photoExts || ['jpg', 'jpeg', 'png', 'webp'], dir = G.photoDir || 'assets/photos/', k = 0;
    el._caption = caption; el._slot = slot;
    function next() {
      var url;
      if (ov && ov.file && !ovTried) { ovTried = true; url = ov.file; }
      else if (k >= exts.length) { empty(); return; }
      else url = dir + slot + '.' + exts[k++];
      var img = new Image();
      img.onload = function () { ph.innerHTML = ''; img.alt = caption; ph.appendChild(img); el.classList.add('has'); el._src = url; };
      img.onerror = next; img.src = url;
    }
    function empty() {
      el.classList.add('empty');
      ph.innerHTML = G.showPlaceholders === false
        ? '<div class="ph-empty soft"><svg><use href="#i-heart"/></svg></div>'
        : '<div class="ph-empty"><svg><use href="#i-heart"/></svg><b>Здесь будет фото</b><small>' + caption + '</small><code>' + dir + slot + '.jpg</code></div>';
    }
    next();
  }
  $$('[data-photo]').forEach(loadPhoto);

  /* ---------- Перетаскивание фото по «альбому» ---------- */
  var zTop = 20;
  $$('.polaroid.drag').forEach(function (el) {
    el.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      var st = stageScale(), sx = e.clientX, sy = e.clientY, l0 = el.offsetLeft, t0 = el.offsetTop, moved = false;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      function mv(ev) {
        var dx = (ev.clientX - sx) / st, dy = (ev.clientY - sy) / st;
        if (!moved && Math.hypot(dx, dy) > 7) { moved = true; el.classList.add('dragging'); el.style.zIndex = ++zTop; }
        if (moved) {
          el.style.left = Math.max(-40, Math.min(1920 - el.offsetWidth + 40, l0 + dx)) + 'px';
          el.style.top = Math.max(-20, Math.min(1080 - el.offsetHeight - 60, t0 + dy)) + 'px';
        }
      }
      function up() {
        el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up);
        el.classList.remove('dragging');
        if (moved) { el._dragged = true; setTimeout(function () { el._dragged = false; }, 50); }
      }
      el.addEventListener('pointermove', mv); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    });
    el.addEventListener('click', function () { if (el._dragged) return; openPhoto(el); });
  });

  /* ---------- Модальное окно ---------- */
  var modal = $('#modal'), mInner = $('#m-inner'), onModalClose = null, lbList = [], lbIdx = 0, lbActive = false;
  function fitModal() {
    var t = $('.m-text', mInner), g = 0; if (!t) return;
    var fs = parseFloat(getComputedStyle(t).fontSize);
    while (mInner.scrollHeight > mInner.clientHeight + 2 && fs > 26 && g++ < 40) { fs -= 1; t.style.fontSize = fs + 'px'; }
  }
  var lastFocus = null;
  function openModal(html, onClose) {
    lastFocus = document.activeElement; stage.classList.add('mopen'); mInner.innerHTML = html; modal.hidden = false; onModalClose = onClose || null; fitModal();
    var cb = $('[data-close]', mInner); if (cb) { try { cb.focus({ preventScroll: true }); } catch (e) {} }
    return mInner;
  }
  function closeModal() {
    if (modal.hidden) return;
    modal.hidden = true; lbActive = false; stage.classList.remove('mopen');
    var cb = onModalClose; onModalClose = null; mInner.innerHTML = '';
    if (lastFocus && document.contains(lastFocus) && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) {} }
    if (cb) { try { cb(); } catch (e) {} }
  }
  modal.addEventListener('click', function (e) {
    if (e.target === modal || e.target.closest('[data-close]')) { closeModal(); return; }
    var n = e.target.closest('[data-lb]'); if (n) lbGo(+n.dataset.lb);
  });
  var CLOSE = '<button class="btn" data-close>Закрыть</button>';

  function renderLb() {
    var el = lbList[lbIdx], multi = lbList.length > 1;
    var img = el._src ? '<img class="m-photo" src="' + el._src + '" alt="">'
      : '<div class="m-ph"><b>Здесь будет фото</b>' + (el._caption || '') + '<code>' + (G.photoDir || 'assets/photos/') + el._slot + '.jpg</code></div>';
    mInner.innerHTML = '<div class="lb">' + (multi ? '<button class="lb-nav prev" data-lb="-1" aria-label="Назад">‹</button><button class="lb-nav next" data-lb="1" aria-label="Дальше">›</button>' : '') +
      (multi ? '<div class="lb-count">' + (lbIdx + 1) + ' из ' + lbList.length + '</div>' : '') + img +
      (el._caption ? '<div class="m-cap">' + el._caption + '</div>' : '') + '</div>' + CLOSE;
  }
  function lbGo(d) { lbIdx = (lbIdx + d + lbList.length) % lbList.length; renderLb(); }
  function openPhoto(el) {
    lbList = $$('.polaroid.click', el.closest('.screen')); lbIdx = Math.max(0, lbList.indexOf(el));
    openModal('', function () { lbActive = false; }); lbActive = true; renderLb();
  }

  /* ---------- Записки-послания ---------- */
  var note = $('#note'), noteTimer = null, noteAt = 0, noteSeq = 0;
  function closeNote() { note.hidden = true; clearTimeout(noteTimer); }
  function showNote(x, y, text, ms) {
    noteAt = Date.now(); noteSeq++;
    note.className = 'n' + (noteSeq % 4);
    note.textContent = text; note.hidden = false;
    note.style.left = Math.max(40, Math.min(1920 - 480, x - 220)) + 'px'; note.style.top = '0px';
    var h = note.offsetHeight, top = y - h - 34;
    if (top < 100) top = y + 54;
    note.style.top = Math.max(96, Math.min(1080 - h - 110, top)) + 'px';
    note.style.animation = 'none'; void note.offsetWidth; note.style.animation = '';
    clearTimeout(noteTimer); noteTimer = setTimeout(closeNote, ms || 6500);
  }
  document.addEventListener('click', function () { if (Date.now() - noteAt > 120) closeNote(); });

  /* ---------- Воспоминания ---------- */
  var MEM = [
    { t: 'Шаурма со сладким чаем', p: 'Шаурма со сладким чаем в детстве, которую ты сама готовила. Столько вкусной еды! Спасибо тебе за это.' },
    { t: 'Чай с бутербродиками', p: 'Чай с бутербродиками с утра перед школой. Спасибо тебе за заботу.' },
    { t: 'Кухня до пяти утра', p: 'Как мы на кухне разговаривали с тобой и с папой до пяти утра — наши разговоры, мега-прокачки, когда я приехал из Алабуги. Очень многое в моём личном росте — благодаря тебе.' },
    { t: 'Твой труд', p: 'Ты без устали много лет трудилась и убирала наш дом. Очень много работала, чтобы мы были счастливы. Как бы ни было трудно сражаться с бардаком — ты делала это. Мы очень благодарны.' },
    { t: 'Наша активная жизнь', p: 'С детства у нас была очень активная жизнь: велосипеды, Соль-Илецк, Казань, Москва — всей семьёй. Мне кажется, вы с папой водили нас на всё, что было в Ульяновске: ёлки, представления, аниматоры, костюмы. Я безумно благодарен.' }
  ];
  (function () {
    var box = $('#mem-tags'), txt = $('#mem-text');
    MEM.forEach(function (m, i) {
      var b = document.createElement('button'); b.className = 'tag reveal'; b.style.setProperty('--d', (0.4 + i * 0.12).toFixed(2));
      b.textContent = m.t; b.addEventListener('click', function () { sel(i); }); box.appendChild(b);
    });
    function sel(i) {
      $$('.tag', box).forEach(function (t, k) { t.classList.toggle('on', k === i); });
      var clone = txt.cloneNode(false); clone.id = 'mem-text';
      clone.innerHTML = '<b>' + MEM[i].t + '</b>' + MEM[i].p;
      txt.parentNode.replaceChild(clone, txt); txt = clone;
      fitText($('.mem-card'), txt);
    }
    sel(0);
  })();

  /* ---------- Квиз + сокровища ---------- */
  var QUIZ = [
    { q: 'Что ты готовила нам в детстве и подавала со сладким чаем?', a: ['Домашнюю шаурму', 'Пельмени', 'Блинчики'], ok: 0,
      yes: 'Точно! Домашняя шаурма со сладким чаем. Спасибо за самую вкусную еду!', no: 'Хороший вариант! Но та самая — домашняя шаурма со сладким чаем.' },
    { q: 'До которого часа однажды затянулся наш разговор на кухне — с тобой и папой?', a: ['До полуночи', 'До двух ночи', 'До пяти утра'], ok: 2,
      yes: 'Точно! До пяти утра — с тобой и папой, когда я приехал из Алабуги. Эти разговоры дали мне очень много.', no: 'Ещё позже — до пяти утра! Эти разговоры дали мне очень много.' },
    { q: 'Куда вы с папой возили меня, когда мне был всего один годик?', a: ['В Сочи', 'В Казань', 'В Москву'], ok: 0,
      yes: 'В Сочи! Мне был один годик, и вся наша семья тогда — это мы втроём.', no: 'И туда мы ездили! Но в год — это был Сочи.' },
    { q: 'Что ты любишь делать вместе с папой перед сном?', a: ['Смотреть кино', 'Гулять по улице', 'Играть в настольные игры'], ok: 1,
      yes: 'Точно! Гулять по улице — вы с папой так делаете перед сном.', no: 'Нет — гулять по улице перед сном, вдвоём с папой.' },
    { q: 'Что нам с Артуром было страшно делать, когда мы были совсем маленькими?', a: ['Танцевать с аниматорами', 'Петь песню', 'Читать стихи'], ok: 0,
      yes: 'Точно! Вы с папой нас подтолкнули — и мы раскрепостились. Дальше расскажу об этом подробнее.', no: 'Танцевать с аниматорами! Вы с папой нас подтолкнули — и мы раскрепостились.' }
  ];
  var TREASURES = [
    { t: 'Твоя мудрость', p: 'Что бы ни происходило — в любой ситуации и в любом человеке искать лучшее. Всё делается к лучшему. Этому ты учишь нас.' },
    { t: 'Ты выросла над собой', p: 'Ты выросла над собой: раньше ты очень боялась проявляться, а сейчас ты открыто делишься светом. Ты помогаешь сотням людей через Международную ассоциацию здоровья «ВИЕДА», даришь людям помощь и свет. Я думаю, ты гордишься собой.' },
    { t: 'После пожара', p: 'Мы восстановились после пожара — всей семьёй. Я думаю, ты очень гордишься этим: собой, папой и нами.' },
    { t: 'Спасибо за труд', p: 'За то, что ты столько лет без устали трудилась и убирала наш дом. Чтобы мы были счастливы.' },
    { t: 'Твои радости', p: 'Ты любишь развиваться, узнавать что-то новое, помогать людям. И гулять с папой по улице перед сном.' }
  ];
  var qi = 0, quizDone = false, opened = {};

  function renderQuiz() {
    $('#treasures').hidden = true; $('#quiz-card').hidden = false;
    $('#quiz-title').textContent = 'Помнишь?';
    $('#quiz-hint').textContent = 'Покумекай — ты это любишь. Ошибиться нельзя.';
    var q = QUIZ[qi], box = $('#quiz-body');
    var hearts = QUIZ.map(function (_, i) { return '<svg class="' + (i < qi ? 'on' : '') + '"><use href="#i-heart"/></svg>'; }).join('');
    box.innerHTML = '<div class="q-top"><div class="q-count">Вопрос ' + (qi + 1) + ' из ' + QUIZ.length + '</div><div class="q-hearts">' + hearts + '</div></div>' +
      '<div class="q-text">' + q.q + '</div>' +
      '<div class="q-answers">' + q.a.map(function (t, i) { return '<button class="ans" data-i="' + i + '">' + t + '</button>'; }).join('') + '</div>' +
      '<div class="q-react" id="q-react"></div>' +
      '<div class="q-foot"><button class="link" id="q-skip">Пропустить к сокровищам</button>' +
      '<button class="btn" id="q-next" hidden>' + (qi === QUIZ.length - 1 ? 'Открыть сокровища ♥' : 'Дальше →') + '</button></div>';
    $$('.ans', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = +b.dataset.i, right = q.ok === -1 ? true : i === q.ok;
        $$('.ans', box).forEach(function (x, k) { x.disabled = true; if (q.ok === -1 || k === q.ok) x.classList.add('right'); });
        b.classList.add('picked');
        $('#q-react').textContent = right ? q.yes : q.no;
        $$('.q-hearts svg', box)[qi].classList.add('on');
        $('#q-next').hidden = false;
        var r = b.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top); burst(p[0], p[1], right ? 7 : 3, .5);
        fitQuiz();
      });
    });
    $('#q-skip').addEventListener('click', showTreasures);
    $('#q-next').addEventListener('click', function () { qi++; if (qi >= QUIZ.length) showTreasures(); else renderQuiz(); });
    fitQuiz();
  }

  function showTreasures() {
    quizDone = true;
    $('#quiz-card').hidden = true;
    $('#quiz-title').textContent = 'Мамины сокровища';
    $('#quiz-hint').textContent = 'Нажми на каждый конверт — внутри то, что я хочу тебе сказать';
    var box = $('#treasures'); box.hidden = false;
    var W = 250, gap = 80, total = TREASURES.length * W + (TREASURES.length - 1) * gap, x0 = (1920 - total) / 2;
    box.innerHTML = '';
    TREASURES.forEach(function (t, i) {
      var w = document.createElement('div'); w.className = 'tr-wrap';
      w.style.left = (x0 + i * (W + gap)) + 'px'; w.style.top = (380 + (i % 2 ? 40 : 0)) + 'px';
      w.innerHTML = '<div class="env sm ' + (i % 2 ? 'pk' : '') + (opened[i] ? ' open' : '') + '" role="button" aria-label="' + t.t + '" style="animation-delay:-' + i + 's">' +
        '<div class="env-back"></div><div class="env-paper"><span>♥</span></div><div class="env-front"></div><div class="env-flap"></div><div class="env-seal"><svg><use href="#i-heart"/></svg></div></div>' +
        '<div class="tr-label">' + t.t + '</div>';
      w.querySelector('.env').addEventListener('click', function () {
        this.classList.add('open'); opened[i] = true; updCount();
        var all = Object.keys(opened).length >= TREASURES.length, r = this.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top);
        burst(p[0], p[1], 8, .6);
        openModal('<div class="m-title">' + t.t + '</div><div class="m-text">' + t.p + '</div>' + CLOSE, function () {
          if (all) burst(960, 760, 40, 1.6);
        });
      });
      box.appendChild(w);
    });
    var c = document.createElement('div'); c.className = 'tr-counter'; c.id = 'tr-counter'; box.appendChild(c);
    var again = document.createElement('button'); again.className = 'btn ghost tr-again'; again.textContent = '↺ Пройти квиз ещё раз';
    again.addEventListener('click', function () { qi = 0; quizDone = false; renderQuiz(); });
    box.appendChild(again);
    var bonus = document.createElement('button'); bonus.className = 'btn tr-bonus'; bonus.textContent = '🌸 Бонус: найди пары';
    bonus.addEventListener('click', openPairs); box.appendChild(bonus);
    updCount();
  }
  function updCount() {
    var n = Object.keys(opened).length, el = $('#tr-counter'); if (!el) return;
    el.textContent = n >= TREASURES.length ? 'Все сокровища собраны! ♥' : 'Открыто ' + n + ' из ' + TREASURES.length;
  }

  /* ---------- Видео сестёр ---------- */
  $$('.env[data-who]').forEach(function (e) {
    e.addEventListener('click', function () {
      var who = e.dataset.who, name = who === 'darina' ? 'Дарины' : 'Дианы';
      e.classList.add('open');
      var src = G.videos && G.videos[who];
      var inner = openModal('<div class="m-title">Видео от ' + name + '</div><div id="vbox"></div>' + CLOSE, function () {
        var v = $('video', mInner); if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
      });
      var box = $('#vbox', inner);
      function placeholder() {
        box.innerHTML = '<div class="m-ph"><b>Видео от ' + name + ' скоро появится</b>' + (G.showPlaceholders === false ? '' : '<code>' + src + '</code>') + '</div>';
      }
      if (!src) { placeholder(); return; }
      var v = document.createElement('video'); v.className = 'm-video'; v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = 'auto';
      v.addEventListener('error', placeholder);
      v.addEventListener('play', function () { if (audio && !audio.paused) audio.pause(); if (clip && !clip.paused) clip.pause(); if (typeof bgm !== 'undefined' && !bgm.paused) bgm.pause(); });
      box.appendChild(v); v.src = src;
      var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
    });
  });

  /* ---------- Кульминация (пошаговый текст) ---------- */
  var BEL = [
    { h: 'Я помню один момент. Мы с Артуром совсем маленькие — по-моему, в кинотеатре «Луна» в Ульяновске. Аниматоры танцуют — Человек-паук, какой-то пират, — вокруг столько незнакомых детей, и нам страшно. Мы стоим и мнёмся.' },
    { h: 'А вы с папой нас подталкиваете: «Давайте, давайте!» — и ты особенно. И мы раскрепостились, начали танцевать и веселиться — потому что почувствовали вашу любовь и поддержку.' },
    { h: 'Если бы вы нас не подтолкнули, мы бы так и стояли и мялись. Без вашей поддержки мы были бы гораздо более зажатыми и не верили бы сами в себя.' },
    { h: 'Ты считаешь нас всех очень талантливыми, и, мне кажется, именно твоя вера в нас делает нас такими. Мы с Артуром верим в себя, потому что в нас верит мама.' },
    { big: true, h: 'Это невозможно описать словами. Это одно из самых дорогих чувств, что у меня есть в жизни. Оно сидит глубоко внутри: <em>мама верит в меня.</em>' }
  ];
  var bs = 0;
  function renderBelief(fromClick) {
    var el = $('#belief-text'), s = BEL[bs];
    var clone = el.cloneNode(false); clone.id = 'belief-text'; clone.className = s.big ? 'big' : '';
    clone.innerHTML = s.h; el.parentNode.replaceChild(clone, el);
    $('#belief-dots').innerHTML = BEL.map(function (_, i) { return '<i class="' + (i === bs ? 'on' : '') + '"></i>'; }).join('');
    $('.b-next').style.visibility = bs === BEL.length - 1 ? 'hidden' : 'visible';
    fitText($('#belief-card'), clone);
    if (s.big && fromClick !== 'init') burst(960, 560, 26, 1.3);
  }
  $('#belief-card').addEventListener('click', function () { if (bs < BEL.length - 1) { bs++; renderBelief(); } });

  /* ---------- Торт: задуй свечи ---------- */
  var candlesOut = 0, CANDLES = [[400, 276, -4], [445, 286, -2], [490, 289, 0], [535, 286, 2], [580, 276, 4]];
  (function () {
    var g = $('#candles'), html = '';
    html += '<defs><linearGradient id="fl-g" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff7a1a"/><stop offset=".55" stop-color="#ffb23a"/><stop offset="1" stop-color="#fff2a8"/></linearGradient>' +
      '<radialGradient id="fl-glow"><stop offset="0" stop-color="#ffd66b" stop-opacity=".95"/><stop offset=".5" stop-color="#ffb24a" stop-opacity=".35"/><stop offset="1" stop-color="#ff9a3a" stop-opacity="0"/></radialGradient></defs>';
    CANDLES.forEach(function (c, i) {
      html += '<g class="candle" data-i="' + i + '" transform="translate(' + c[0] + ' ' + c[1] + ') rotate(' + c[2] + ')" role="button" aria-label="Свеча ' + (i + 1) + '">' +
        '<rect x="-50" y="-210" width="100" height="230" fill="transparent"/>' +
        '<ellipse cx="0" cy="3" rx="16" ry="6" fill="rgba(60,20,20,.3)"/>' +
        '<rect x="-10" y="-96" width="20" height="98" rx="4" fill="#fff8f3" stroke="#e6c7bd" stroke-width="2"/>' +
        '<path d="M-10 -80l20 -13M-10 -62l20 -13M-10 -44l20 -13M-10 -26l20 -13M-10 -8l20 -13" stroke="' + (i % 2 ? '#a58be0' : '#f08aa4') + '" stroke-width="7"/>' +
        '<path d="M0 -96v-12" stroke="#5a3a3a" stroke-width="3.5" stroke-linecap="round"/>' +
        '<circle class="fglow" cx="0" cy="-140" r="70" fill="url(#fl-glow)"/>' +
        '<g class="flame"><path d="M0 -104C-19 -122 -16 -150 0 -178C16 -150 19 -122 0 -104Z" fill="url(#fl-g)"/><path d="M0 -108C-8 -120 -7 -136 0 -150C7 -136 8 -120 0 -108Z" fill="#fffbe0" opacity=".95"/></g>' +
        '<g class="smoke"><path d="M0 -112c-14 -16 14 -30 0 -48s14 -30 0 -48" fill="none" stroke="rgba(120,100,110,.55)" stroke-width="6" stroke-linecap="round"/></g></g>';
    });
    g.innerHTML = html;
    $$('.candle', g).forEach(function (c) {
      c.addEventListener('click', function () { blow(c); });
    });
  })();
  function lightLevel() { $('#cake-halo').style.opacity = (CANDLES.length - candlesOut) / CANDLES.length; }
  function blow(c) {
    if (c.classList.contains('out')) return;
    c.classList.add('out'); candlesOut++;
    $('#wish-count').textContent = 'Свечей горит: ' + (CANDLES.length - candlesOut);
    lightLevel();
    var r = c.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height * .3);
    burst(p[0], p[1], 4, .4);
    if (candlesOut >= CANDLES.length) finishWish();
  }
  function finishWish() {
    $('#wish-prompt').hidden = true; $('#wish-count').hidden = true; $('#wish-done').hidden = false;
    $('.hint', $('#s-wish')).textContent = 'Ура! Желание загадано';
    burst(600, 420, 34, 1.5); setTimeout(function () { burst(1300, 500, 30, 1.5); }, 350);
    var st = document.createElement('div'); st.className = 'wish-star'; st.innerHTML = '<svg><use href="#i-sparkle"/></svg>';
    $('#s-wish').appendChild(st); setTimeout(function () { st.remove(); }, 4200);
  }
  $('#relight').addEventListener('click', function () {
    candlesOut = 0; $$('.candle').forEach(function (c) { c.classList.remove('out'); });
    $('#wish-prompt').hidden = false; $('#wish-count').hidden = false; $('#wish-done').hidden = true;
    $('#wish-count').textContent = 'Свечей горит: ' + CANDLES.length;
    $('.hint', $('#s-wish')).textContent = 'Нажимай на огоньки — задуй все свечи'; lightLevel();
  });
  $('#blow-all').addEventListener('click', function () { $$('.candle').forEach(function (c, i) { setTimeout(function () { blow(c); }, i * 160); }); });

  /* ---------- Мамины мудрости: переворачивающиеся карточки ---------- */
  var WIS = [
    { t: 'Всё делается к лучшему', f: 'moss', x: 'Что бы ни происходило и что бы ни совершил человек — всё делается к лучшему.' },
    { t: 'Искать лучшее', f: 'white', x: 'В любой ситуации и в любом человеке искать лучшее. Этому ты учишь нас.' },
    { t: 'Все мы — отражения', f: 'cabbage', x: 'Любой человек — это отражение каких-то твоих качеств. Если что-то в нём задевает, значит, тебе что-то не нравится в себе.' },
    { t: 'Всегда учиться', f: 'wild1', x: 'Ты постоянно совершенствуешься, учишься на своих ошибках и любишь узнавать что-то новое.' }
  ];
  var wisSeen = {};
  (function () {
    var grid = $('#wis-grid');
    WIS.forEach(function (w, i) {
      var c = document.createElement('div'); c.className = 'flip reveal'; c.style.cssText = 'left:' + (200 + i * 410) + 'px;top:' + (i % 2 ? 40 : 10) + 'px;rotate:' + [-1.5, 1.2, -1, 1.6][i] + 'deg;--d:' + (0.5 + i * .18).toFixed(2);
      c.setAttribute('role', 'button'); c.setAttribute('aria-label', w.t);
      c.innerHTML = '<div class="flip-in"><div class="face front"><img src="assets/flowers/' + w.f + '.webp" alt=""><div class="ft">' + w.t + '</div><div class="fh">нажми, чтобы перевернуть</div></div>' +
        '<div class="face back"><div class="bi"><div class="bt">' + w.t + '</div><div class="bx">' + w.x + '</div></div></div></div>';
      c.addEventListener('click', function () {
        var on = c.classList.toggle('on'); wisSeen[i] = wisSeen[i] || on;
        var r = c.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2); if (on) burst(p[0], p[1], 8, .5);
        var n = Object.keys(wisSeen).filter(function (k) { return wisSeen[k]; }).length;
        $('#wis-count').textContent = n >= WIS.length ? 'Все мудрости собраны ♥' : 'Прочитано ' + n + ' из ' + WIS.length;
        if (n >= WIS.length && on) setTimeout(function () { burst(960, 800, 30, 1.4); }, 400);
        setTimeout(fitAll, 30);
      });
      grid.appendChild(c);
    });
    $('#wis-count').textContent = 'Прочитано 0 из ' + WIS.length;
  })();

  /* ---------- Открытки из поездок ---------- */
  var TRIPS = [
    { p: 'Соль-Илецк', s: 'всей семьёй', f: 'rose-pink', st: 'pale', si: 'i-heart', sc: '#e2708b', x: 'Мы несколько раз ездили в Соль-Илецк всей семьёй. Оттуда у нас много фотографий.' },
    { p: 'Казань', s: 'всей семьёй', f: 'wild2', st: 'white2', si: 'i-star', sc: '#e0a83a', x: 'Одна из наших поездок всей семьёй, которые я помню с детства.' },
    { p: 'Москва', s: 'всей семьёй', f: 'peony', st: 'wild1', si: 'i-sparkle', sc: '#9a6ec8', x: 'Поездка в Москву всей семьёй — ещё одна страница нашего детства, когда мы часто куда-нибудь выбирались.' },
    { p: 'Сочи', s: 'мне был один годик', f: 'crocus', st: 'sprig1', si: 'i-heart', sc: '#c0394f', x: 'Мне было около года. Мама, папа и я — вся наша семья тогда.' },
    { p: 'Ульяновск', s: 'наш город', f: 'white', st: 'delicate', si: 'i-star', sc: '#e2708b', x: 'Мне кажется, вы с папой водили нас на всё, что было в нашем городе: ёлки, представления, аниматоры, костюмы. Нас наряжали.' }
  ];
  (function () {
    var grid = $('#trip-grid'), pos = [[200, 250, -1.8], [725, 270, 1.4], [1250, 250, -1], [460, 630, 1.6], [990, 640, -1.5]];
    TRIPS.forEach(function (t, i) {
      var c = document.createElement('div'); c.className = 'pc reveal';
      c.style.cssText = 'left:' + pos[i][0] + 'px;top:' + pos[i][1] + 'px;rotate:' + pos[i][2] + 'deg;--d:' + (0.4 + i * .2).toFixed(2);
      c.setAttribute('role', 'button'); c.setAttribute('aria-label', 'Открытка: ' + t.p);
      c.innerHTML = '<div class="pc-in"><div class="face front"><div class="edge"></div><div class="pc-body"><svg class="pc-img" viewBox="0 0 24 24" style="fill:' + t.sc + '"><use href="#' + t.si + '"/></svg>' +
        '<div class="place">' + t.p + '</div><div class="sub">' + t.s + '</div></div>' +
        '<div class="stamp"><div><svg style="width:62%;fill:' + t.sc + '"><use href="#' + t.si + '"/></svg></div></div><svg class="pmark"><use href="#i-postmark"/></svg></div>' +
        '<div class="face back"><div class="edge"></div><div class="pc-body"><div class="bi"><b>' + t.p + '</b>' + t.x + '</div></div>' +
        '<div class="stamp" style="right:30px;top:24px;width:70px;height:86px;transform:rotate(-3deg)"><div><svg style="width:60%;fill:#e2708b"><use href="#i-heart"/></svg></div></div></div></div>';
      c.addEventListener('click', function () {
        var on = c.classList.toggle('on'), r = c.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2);
        if (on) burst(p[0], p[1], 6, .5); setTimeout(fitAll, 30);
      });
      grid.appendChild(c);
    });
  })();

  /* ---------- Букет пожеланий ---------- */
  var BQ_BASE = [560, 985];
  var BQ = [
    /* филлеры без пожеланий */
    { n: 'leaf', a: -64, h: 380 }, { n: 'sprig2', a: 60, h: 430 }, { n: 'sprig1', a: -76, h: 330 },
    /* цветы с пожеланиями */
    { n: 'crimson', a: -46, h: 600, fx: .52, fy: .1, t: 'Счастья', x: 'Я очень хочу, чтобы ты была счастлива. Спасибо тебе за всё, что у меня есть.' },
    { n: 'peony', a: -27, h: 690, fx: .53, fy: .23, t: 'Здоровья', x: 'Будь здорова. Я очень хочу, чтобы ты была здорова.' },
    { n: 'white', a: 24, h: 720, fx: .42, fy: .12, t: 'Времени на себя', x: 'Чтобы у тебя было больше времени на себя — на то, что тебе в удовольствие. Я люблю тебя такой, какая ты есть.' },
    { n: 'rose-pink', a: -9, h: 760, fx: .51, fy: .27, t: 'Долгой жизни', x: 'Живи очень долго и очень, очень счастливо.' },
    { n: 'wild1', a: 8, h: 700, fx: .53, fy: .16, t: 'Любви', x: 'Я тебя очень, очень сильно люблю. Ты человек, которым я восхищаюсь. Правда.' },
    { n: 'moss', a: 40, h: 620, fx: .32, fy: .36, t: 'Чтобы всё сбывалось', x: 'Многое из того, что ты загадываешь, у тебя уже сбывается: путешествия, достаток, здоровье семьи. Это здорово.' },
    { n: 'passion', a: 0, h: 430, fx: .59, fy: .44, t: 'Широкой улыбки', x: 'Широко-широко улыбайся.' },
    { n: 'photo-daisies', a: -28, h: 230, fx: .5, fy: .42, t: 'Спасибо тебе', x: 'Очень многое в моём личном росте — благодаря тебе. И ты учишь нас в любой ситуации искать лучшее.' },
    { n: 'leaf', a: -34, h: 300 }, { n: 'sprig1', a: 32, h: 300 }, { n: 'sprig2', a: -10, h: 250 }
  ];
  var bqSeen = {};
  (function () {
    var box = $('#bq'), wishes = BQ.filter(function (b) { return b.t; });
    BQ.forEach(function (b, k) {
      var w = b.h * (FR[b.n] || .7), el = new Image();
      el.src = 'assets/flowers/' + b.n + '.webp'; el.alt = ''; el.draggable = false; el.className = 'bq-flower' + (b.n.indexOf('photo-') === 0 ? ' photo' : '');
      el.style.cssText = 'left:' + (BQ_BASE[0] - w / 2) + 'px;top:' + (BQ_BASE[1] - b.h) + 'px;width:' + w + 'px;height:' + b.h + 'px;rotate:' + b.a + 'deg';
      box.appendChild(el); b.el = el; b.w = w;
    });
    /* шпагат вокруг стеблей и картонная бирка */
    [[-170, -3, 214], [-150, 2, 208]].forEach(function (t) {
      var tw = document.createElement('div'); tw.className = 'bq-twine';
      tw.style.cssText = 'left:' + (BQ_BASE[0] - t[2] / 2) + 'px;top:' + (BQ_BASE[1] + t[0]) + 'px;width:' + t[2] + 'px;rotate:' + t[1] + 'deg'; box.appendChild(tw);
    });
    var tag = document.createElement('div'); tag.className = 'bq-tag'; tag.style.cssText = 'left:' + (BQ_BASE[0] + 40) + 'px;top:' + (BQ_BASE[1] - 150) + 'px';
    tag.innerHTML = '<i></i><span>Маме</span>'; box.appendChild(tag);
    var hearts = $('#wc-hearts'); hearts.innerHTML = wishes.map(function () { return '<svg><use href="#i-heart"/></svg>'; }).join('');
    wishes.forEach(function (b, wi) {
      var th = b.a * Math.PI / 180, dx = (b.fx - .5) * b.w, dy = (b.fy - 1) * b.h;
      var x = BQ_BASE[0] + dx * Math.cos(th) - dy * Math.sin(th), y = BQ_BASE[1] + dx * Math.sin(th) + dy * Math.cos(th);
      var hot = document.createElement('button'); hot.className = 'hot pulse'; hot.style.cssText = 'left:' + x + 'px;top:' + y + 'px';
      hot.setAttribute('aria-label', b.t); hot.innerHTML = '<svg class="tick"><use href="#i-heart"/></svg>';
      hot.addEventListener('click', function () {
        BQ.forEach(function (o) { if (o.el) o.el.classList.remove('sel'); }); b.el.classList.add('sel');
        $('#wc-title').textContent = b.t;
        var t = $('#wc-text'); t.innerHTML = '<div class="wi"></div>'; $('.wi', t).textContent = b.x; t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
        bqSeen[wi] = true; hot.classList.add('done'); hot.classList.remove('pulse');
        $$('#wc-hearts svg').forEach(function (h, i) { h.classList.toggle('on', !!bqSeen[i]); });
        var r = hot.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2); burst(p[0], p[1], 9, .6);
        var n = Object.keys(bqSeen).length;
        if (n >= wishes.length) { $('#s-letter').classList.add('has-bouquet'); $('#wc-title').textContent = b.t; setTimeout(function () { burst(960, 800, 36, 1.5); }, 350); }
        fitText($('#wc-text'), $('.wi', t));
      });
      box.appendChild(hot);
    });
  })();

  /* ---------- Игра «найди пары» (бонус) ---------- */
  var MOTIFS = [
    ['☕', 'Сладкий чай', 'Шаурма со сладким чаем, которую ты сама готовила.'],
    ['🥪', 'Бутерброды', 'Чай с бутербродиками с утра перед школой.'],
    ['🌙', 'Ночная кухня', 'Разговор с тобой и папой на кухне до пяти утра.'],
    ['💃', 'Танцы', 'Аниматоры в кинотеатре, где вы с папой подбодрили нас с Артуром потанцевать.'],
    ['🌳', 'Прогулка', 'Ты любишь гулять с папой по улице перед сном.'],
    ['🚲', 'Велосипеды', 'Наши поездки на велосипедах — очень активная жизнь с детства.']
  ];
  function openPairs() {
    var deck = [];
    MOTIFS.forEach(function (m, i) { deck.push(i, i); });
    for (var i = deck.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    openModal('<div class="m-title">Найди пары</div><div style="font-size:30px;color:#6b4757;margin-bottom:14px">Переворачивай по две карточки — за каждой парой спрятано воспоминание. Ошибки не считаются.</div>' +
      '<div class="pairs">' + deck.map(function (n) { var m = MOTIFS[n]; return '<div class="pair" data-n="' + n + '"><div class="pair-in"><div class="face front"><svg><use href="#i-heart"/></svg></div><div class="face back"><div class="pe">' + m[0] + '</div><div class="pl">' + m[1] + '</div></div></div></div>'; }).join('') +
      '</div><div class="pairs-msg" id="pairs-msg">Пар найдено: 0 из ' + MOTIFS.length + '</div>' + CLOSE);
    var first = null, lock = false, found = 0, moves = 0;
    $$('.pair', mInner).forEach(function (c) {
      c.addEventListener('click', function () {
        if (lock || c.classList.contains('on') || c.classList.contains('ok')) return;
        c.classList.add('on');
        if (!first) { first = c; return; }
        moves++; var a = first; first = null;
        if (a.dataset.n === c.dataset.n) {
          a.classList.add('ok'); c.classList.add('ok'); found++;
          var r = c.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2); burst(p[0], p[1], 6, .5);
          $('#pairs-msg').textContent = found === MOTIFS.length ? 'Все пары собраны! ♥' : 'Пар: ' + found + ' из ' + MOTIFS.length + '. ' + MOTIFS[+c.dataset.n][2];
          if (found === MOTIFS.length) setTimeout(function () { burst(960, 540, 40, 1.6); }, 300);
        } else {
          $('#pairs-msg').textContent = 'Не совпало — пробуй ещё. Пар: ' + found + ' из ' + MOTIFS.length + '.';
          lock = true; setTimeout(function () { a.classList.remove('on'); c.classList.remove('on'); lock = false; }, 1400);
        }
      });
    });
  }

  /* ---------- Музыка ---------- */
  var audio = new Audio(), audioFail = false;
  audio.preload = 'auto'; audio.src = G.audio || 'assets/audio/song.mp3'; audio.volume = 0.8;
  /* клип (видео в финале) */
  var clip = $('#clip'), clipFrame = $('#clip-frame');
  clip.src = G.clip || 'assets/video/clip.mp4'; clip.volume = 0.9;
  clip.addEventListener('play', function () {
    clipFrame.classList.add('playing');
    if (!audio.paused) audio.pause();
    if (typeof bgm !== 'undefined' && !bgm.paused) bgm.pause();
  });
  clip.addEventListener('pause', function () { clipFrame.classList.remove('playing'); });
  clip.addEventListener('ended', function () { clipFrame.classList.remove('playing'); });
  $('#clip-big').addEventListener('click', function () { var p = clip.play(); if (p && p.catch) p.catch(function () {}); });
  function clipFs() {
    if (document.fullscreenElement === clip) { document.exitFullscreen(); return; }
    var f = clip.requestFullscreen || clip.webkitRequestFullscreen;
    if (f) { var pr = f.call(clip); if (pr && pr.catch) pr.catch(function () {}); }
  }
  $('#clip-fs').addEventListener('click', clipFs);
  $('#song-title').textContent = G.songTitle || 'Песня для тебя';
  var playBtn = $('#play-btn'), playIc = $('#play-ic'), seek = $('#seek'), songArt = $('#song-art'), songMsg = $('#song-msg'), mini = $('#mini');
  function fmt(t) { t = Math.floor(t || 0); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
  function missing() {
    audioFail = true;
    songMsg.textContent = 'Песня скоро появится здесь.';
    setPlaying(false);
  }
  audio.addEventListener('error', missing);
  audio.addEventListener('loadedmetadata', function () { $('#t-dur').textContent = fmt(audio.duration); });
  audio.addEventListener('timeupdate', function () {
    if (audio.duration) seek.value = Math.round(audio.currentTime / audio.duration * 1000);
    $('#t-cur').textContent = fmt(audio.currentTime);
  });
  audio.addEventListener('ended', function () { setPlaying(false); seek.value = 0; });
  audio.addEventListener('play', function () { setPlaying(true); if (!clip.paused) clip.pause(); });
  audio.addEventListener('pause', function () { setPlaying(false); });
  function setPlaying(p) {
    playIc.innerHTML = '<use href="#' + (p ? 'i-pause' : 'i-play') + '"/>';
    songArt.classList.toggle('playing', p);
    $('#mini-ic').innerHTML = '<use href="#' + (p ? 'i-pause' : 'i-play') + '"/>';
    updMini();
  }
  function updMini() {
    var started = !audioFail && (!audio.paused || audio.currentTime > 0);
    mini.hidden = !(started && cur !== idOf('s-song'));
  }
  function toggle() {
    if (audioFail) { missing(); return; }
    if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () { missing(); }); songMsg.textContent = ''; }
    else audio.pause();
  }
  playBtn.addEventListener('click', toggle);
  mini.addEventListener('click', toggle);
  $('#restart-btn').addEventListener('click', function () {
    if (audioFail) { missing(); return; }
    audio.currentTime = 0; var p = audio.play(); if (p && p.catch) p.catch(function () { missing(); });
  });
  seek.addEventListener('input', function () { if (audio.duration) audio.currentTime = seek.value / 1000 * audio.duration; });
  $('#vol').addEventListener('input', function () { audio.volume = this.value / 100; });
  if (!G.lyrics) $('#lyrics-btn').hidden = true;
  $('#lyrics-btn').addEventListener('click', function () {
    openModal('<div class="m-title">' + (G.songTitle || 'Слова песни') + '</div><div class="m-lyrics"></div>' + CLOSE);
    $('.m-lyrics', mInner).textContent = G.lyrics || 'Слова песни пока не добавлены.';
  });

  /* ---------- Экраны и навигация ---------- */
  var screens = $$('.screen');
  if (G.showSisters === false) { var ss = $('#s-sisters'); screens = screens.filter(function (s) { return s !== ss; }); ss.remove(); }
  screens.forEach(function (s, i) { addFlora(s, FLORA[s.id]); if (WREATHS[s.id]) addWreath(s, WREATHS[s.id]); paintScreen(s, i + 1); });
  var cur = -1;
  function idOf(id) { return screens.indexOf($('#' + id)); }
  var letterOpen = false, letterBusy = false;
  function renderLetter() {
    var pre = $('#letter-pre'), sheet = $('#letter-sheet');
    pre.hidden = letterOpen; sheet.hidden = !letterOpen; $('#s-letter').classList.toggle('letter-open', letterOpen);
    if (!letterOpen) { pre.classList.remove('opening'); pre.classList.remove('gone'); $('#letter-env').classList.remove('open'); }
  }
  function setNextLabel() {
    var id = screens[cur] && screens[cur].id;
    next.textContent = cur >= idOf('s-clip') ? '↺ В начало' : (id === 's-letter' && !letterOpen ? 'Открыть письмо →' : 'Дальше →');
  }
  function openLetter() {
    if (letterOpen || letterBusy) return; letterBusy = true;
    var pre = $('#letter-pre'), env = $('#letter-env');
    pre.classList.add('opening'); env.classList.add('open');
    setTimeout(function () { var r = env.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top); burst(p[0], p[1], 26, 1.3); }, 700);
    setTimeout(function () {
      pre.classList.add('gone');
      setTimeout(function () { letterOpen = true; letterBusy = false; renderLetter(); setNextLabel(); fitAll(); }, 450);
    }, 1700);
  }
  $('#letter-env').addEventListener('click', openLetter);

  function resetAll() {
    qi = 0; quizDone = false; opened = {}; wisSeen = {}; bqSeen = {}; bs = 0; letterOpen = false; letterBusy = false;
    $$('.flip.on, .pc.on').forEach(function (c) { c.classList.remove('on'); });
    $('#wis-count').textContent = 'Прочитано 0 из ' + WIS.length;
    BQ.forEach(function (o) { if (o.el) o.el.classList.remove('sel'); });
    $$('.hot').forEach(function (h) { h.classList.remove('done'); h.classList.add('pulse'); });
    $('#wc-title').textContent = 'Выбери цветок';
    $('#wc-text').textContent = 'В каждом цветке — одно моё пожелание или слово благодарности.';
    $$('#wc-hearts svg').forEach(function (h) { h.classList.remove('on'); });
    $('#s-letter').classList.remove('has-bouquet');
    $('#relight').click();
    audio.pause(); try { audio.currentTime = 0; } catch (e) {} clip.pause(); try { clip.currentTime = 0; } catch (e) {}
    clearGarden(); msgTotal = 0; $('#mc-n').textContent = '0'; renderLetter();
  }

  var hooks = {
    's-garden': { enter: function () { updGarden(); } },
    's-letter': {
      enter: renderLetter,
      next: function () { if (!letterOpen) { openLetter(); return true; } return false; }
    },
    's-quiz': { enter: function () { if (quizDone) showTreasures(); else renderQuiz(); } },
    's-belief': {
      enter: function (dir) { bs = dir < 0 ? BEL.length - 1 : 0; renderBelief('init'); },
      next: function () { if (bs < BEL.length - 1) { bs++; renderBelief(); return true; } return false; },
      prev: function () { if (bs > 0) { bs--; renderBelief('init'); return true; } return false; }
    }
  };
  var dotsBox = $('#dots'), prev = $('#prev'), next = $('#next');
  screens.forEach(function (s, i) {
    if (s.id === 's-song') return;
    var d = document.createElement('button'); d.setAttribute('aria-label', s.dataset.title || ('Экран ' + (i + 1))); d.title = s.dataset.title || '';
    d.addEventListener('click', function () { go(i); }); dotsBox.appendChild(d);
  });

  function go(i, dir) {
    if (i < 0 || i >= screens.length) return;
    closeNote(); closeModal();
    screens.forEach(function (s) { s.classList.remove('active'); });
    var s = screens[i]; cur = i; s.classList.add('active');
    if (s.id !== 's-clip' && !clip.paused) clip.pause();
    stage.dataset.i = i; stage.dataset.id = s.id;
    var h = hooks[s.id]; if (h && h.enter) h.enter(dir || 1);
    $$('button', dotsBox).forEach(function (d, k) { d.classList.toggle('on', k === i); });
    prev.hidden = i === 0;
    enterExtras(s);
    setNextLabel(); $('#chap').textContent = s.id === 's-song' ? 'Песня' : (i + 1) + ' / ' + (screens.length - 1) + ' · ' + (s.dataset.title || '');
    updMini(); fitAll();
    try { history.replaceState(null, '', '#' + i); } catch (e) {}
  }
  function goNext() {
    var h = hooks[screens[cur].id]; if (h && h.next && h.next()) return;
    if (cur >= idOf('s-clip')) { resetAll(); go(0); } else go(cur + 1, 1);
  }
  function goPrev() {
    var h = hooks[screens[cur].id]; if (h && h.prev && h.prev()) return;
    go(cur - 1, -1);
  }
  $('#to-song').addEventListener('click', function () { go(idOf('s-song'), 1); });
  $('#to-clip').addEventListener('click', function () { go(idOf('s-clip'), -1); });
  next.addEventListener('click', goNext);
  prev.addEventListener('click', goPrev);
  document.addEventListener('keydown', function (e) {
    touch();
    if (!modal.hidden) {
      if (e.key === 'Escape') closeModal();
      else if (lbActive && e.key === 'ArrowRight') lbGo(1);
      else if (lbActive && e.key === 'ArrowLeft') lbGo(-1);
      return;
    }
    if (e.target.closest && e.target.closest('input')) return;
    if (cur === 0) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); openCover(); } return; }
    if (e.key === 'ArrowRight' || e.key === 'PageDown') goNext();
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') goPrev();
  });

  /* ---------- Подсказка «Дальше», если долго ничего не нажимают ---------- */
  var lastAct = Date.now();
  function touch() { lastAct = Date.now(); next.classList.remove('nudge'); }
  setInterval(function () { if (cur > 0 && Date.now() - lastAct > 14000 && modal.hidden) next.classList.add('nudge'); }, 2000);

  /* ---------- Обложка ---------- */
  var coverEnv = $('#cover-env'), opening = false, coverSec = $('#s-cover');
  function openCover() {
    if (opening) return; opening = true; coverSec.classList.add('opening'); coverEnv.classList.add('open');
    if (G.bgmAutoStart !== false && !bgStarted && BG.length) bgPlay();
    setTimeout(function () { var r = coverEnv.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top); burst(p[0], p[1], 30, 1.4); }, 700);
    setTimeout(function () { go(1, 1); opening = false; coverSec.classList.remove('opening'); coverEnv.classList.remove('open'); }, 1900);
  }
  coverEnv.addEventListener('click', openCover);
  $('#open-btn').addEventListener('click', openCover);
  function toggleFs() {
    var d = document.documentElement;
    if (!document.fullscreenElement) { (d.requestFullscreen || function () {}).call(d); } else document.exitFullscreen();
  }
  $('#fsb').addEventListener('click', toggleFs);
  $('#brand').addEventListener('click', function () { go(0); });
  document.addEventListener('fullscreenchange', function () { $('#fs-label').textContent = document.fullscreenElement === document.documentElement ? 'Свернуть' : 'На весь экран'; });


  /* ======================================================================
     ПОСЛАНИЯ: сердечки, цветы, падающие цветочки, сад, торт
     ====================================================================== */
  var MSGS = window.MSG || { heart: [], flower: [], catch: [], garden: [], once: [] };
  var msgTotal = 0, bags = {}, onceLeft = (MSGS.once || []).slice(), shownCount = 0, MILES = [10, 25, 50, 100];
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function drawMsg(kind) {
    shownCount++;
    if (onceLeft.length && ((shownCount >= 7 && Math.random() < 0.1) || shownCount >= 18)) return onceLeft.shift();
    var b = bags[kind];
    if (!b || !b.length) b = bags[kind] = shuffle((MSGS[kind] || MSGS.heart || ['♥']).slice());
    return b.pop() || '♥';
  }
  function say(kind, x, y) {
    showNote(x, y, drawMsg(kind));
    msgTotal++; var mc = $('#msgcount'); $('#mc-n').textContent = msgTotal;
    mc.classList.remove('bump'); void mc.offsetWidth; mc.classList.add('bump');
    if (MILES.indexOf(msgTotal) >= 0) setTimeout(function () {
      showNote(960, 620, 'Найдено посланий: ' + msgTotal + '! И ещё много спрятано. ♥', 5200); burst(960, 620, 40, 1.6);
    }, 1400);
  }

  /* --- попадание по цветам по непрозрачным пикселям --- */
  var masks = {};
  function maskFor(img) {
    var key = img.currentSrc || img.src; if (masks[key]) return masks[key];
    if (!img.complete || !img.naturalWidth) return null;
    var w = 120, h = Math.max(1, Math.round(120 * img.naturalHeight / img.naturalWidth)), c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h); var dd = x.getImageData(0, 0, w, h).data, a = new Uint8Array(w * h);
    for (var i = 0; i < w * h; i++) a[i] = dd[i * 4 + 3];
    return masks[key] = { w: w, h: h, a: a };
  }
  function alphaAt(img, cx, cy) {
    var m = maskFor(img); if (!m) return 0;
    var r = img.getBoundingClientRect(), s2 = stageScale(), ox = (cx - (r.left + r.width / 2)) / s2, oy = (cy - (r.top + r.height / 2)) / s2;
    var rot = img.classList.contains('spin') ? 0 : (+img.dataset.r || 0), th = rot * Math.PI / 180, co = Math.cos(th), si = Math.sin(th);
    var x = ox * co + oy * si, y = -ox * si + oy * co; if (img.dataset.fx === '-1') x = -x;
    var u = x / img.offsetWidth + 0.5, v = y / img.offsetHeight + 0.5;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return 0;
    return m.a[Math.floor(v * m.h) * m.w + Math.floor(u * m.w)];
  }
  function flowerAt(cx, cy, th) {
    var sec = screens[cur]; if (!sec) return null; th = th || 40;
    var list = $$('.flw', sec);
    for (var i = list.length - 1; i >= 0; i--) if (!list[i].classList.contains('bonus') || sec.classList.contains('has-bouquet')) if (alphaAt(list[i], cx, cy) > th) return list[i];
    return null;
  }
  function freeTarget(t) { return t && t.classList && (t.classList.contains('screen') || t.id === 'viewport' || t.id === 'stage' || t.classList.contains('bg')); }
  var hovFl = null, hovRaf = 0;
  document.addEventListener('pointermove', function (e) {
    if (hovRaf) return; var tg = e.target, cx = e.clientX, cy = e.clientY;
    hovRaf = requestAnimationFrame(function () {
      hovRaf = 0; var f = freeTarget(tg) ? flowerAt(cx, cy) : null;
      if (f !== hovFl) { if (hovFl) hovFl.classList.remove('hov'); if (f) f.classList.add('hov'); hovFl = f; var sc = screens[cur]; if (sc) sc.style.cursor = f ? 'pointer' : ''; }
    });
  });
  document.addEventListener('click', function (e) {
    if (!freeTarget(e.target)) return;
    var f = flowerAt(e.clientX, e.clientY); if (!f) return;
    var p = toStage(e.clientX, e.clientY);
    try { f.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.06) rotate(2.5deg)' }, { transform: 'scale(.99) rotate(-1.5deg)' }, { transform: 'scale(1)' }], { duration: 750, easing: 'ease-in-out' }); } catch (x) {}
    burst(p[0], p[1], 7, .55); say('flower', p[0], p[1]);
  });

  /* --- сердечки, звёздочки и рисованные цветочки, плавно плавающие на каждой странице --- */
  var HT = [
    { i: '#i-heart', c: ['#f09bb2', '#d23c4e', '#b684c4', '#e58aa0'] }, { i: '#i-heart', c: ['#f09bb2', '#d23c4e', '#b684c4'] },
    { i: '#i-star', c: ['#f4c35a', '#f7a9bb'] }, { i: '#i-flower', c: ['#f09bb2', '#b684c4', '#f6b48a'] }, { i: '#i-sparkle', c: ['#f4c35a', '#c690c1'] }
  ];
  var EXCL = '.h2,.hint,.traits,.drag-hint,.polaroid,.paper,.tags,.tag,.flip,.pc,.env,.env-label,.song-info,.song-art,.clip-head,.clip-frame,.clip-cap,.clip-btns,.wish-side,#cake,#bq,.wish-card,.belief,.letter,.quiz-card,.mem-card,.tr-wrap,.tr-counter,.tr-again,.tr-bonus,#garden-zone,.garden-tools,.cover-title,.cover-sub,.cover-ded,.cover-hint,#open-btn,.keys-hint,.wis-count';
  function stRect(el) { var r = el.getBoundingClientRect(), a = toStage(r.left, r.top), b = toStage(r.right, r.bottom); return [a[0], a[1], b[0], b[1]]; }
  function collectExcl(sec) {
    var out = [[0, 0, 1920, 104], [0, 962, 1920, 1080], [1300, 0, 1920, 170]];
    $$(EXCL, sec).forEach(function (el) { if (el.closest('[hidden]')) return; var r = stRect(el); if (r[2] - r[0] > 2) out.push([r[0] - 22, r[1] - 22, r[2] + 22, r[3] + 22]); });
    $$('.fh', sec).forEach(function (el) { var r = stRect(el); out.push([r[0] - 60, r[1] - 60, r[2] + 60, r[3] + 60]); });
    return out;
  }
  function freeSpot(sec, size, excl) {
    var sr = stage.getBoundingClientRect(), sc = stageScale();
    for (var k = 0; k < 260; k++) {
      var x = 50 + Math.random() * 1780, y = 110 + Math.random() * 840, ok = true;
      for (var i = 0; i < excl.length && ok; i++) { var e = excl[i]; if (x + size > e[0] - 24 && x < e[2] + 24 && y + size > e[1] - 24 && y < e[3] + 24) ok = false; }
      if (!ok) continue;
      var pts = [[0, 0]]; for (var a = 0; a < 8; a++) pts.push([Math.cos(a * .785) * (size * .8 + 24), Math.sin(a * .785) * (size * .8 + 24)]);
      for (var q = 0; q < pts.length && ok; q++) if (flowerAt(sr.left + (x + size / 2 + pts[q][0]) * sc, sr.top + (y + size / 2 + pts[q][1]) * sc, 25)) ok = false;
      if (ok) return [x, y];
    }
    return null;
  }
  function makeHeart(sec, box, excl) {
    var size = 46 + Math.random() * 30, pos = freeSpot(sec, size, excl); if (!pos) return;
    var t = HT[Math.floor(Math.random() * HT.length)], col = t.c[Math.floor(Math.random() * t.c.length)];
    var b = document.createElement('button'); b.className = 'fh'; b.type = 'button'; b.setAttribute('aria-label', 'Послание');
    b.style.cssText = 'left:' + pos[0] + 'px;top:' + pos[1] + 'px;width:' + size + 'px;height:' + size + 'px;color:' + col + ';--dx:' + ((Math.random() - .5) * 70).toFixed(0) + 'px;--dy:' + ((Math.random() - .5) * 60).toFixed(0) +
      'px;--dur:' + (30 + Math.random() * 30).toFixed(0) + 's;--del:-' + (Math.random() * 30).toFixed(0) + 's;--rr:' + ((Math.random() - .5) * 24).toFixed(0) + 'deg';
    b.innerHTML = '<svg><use href="' + t.i + '"/></svg>';
    b.addEventListener('click', function (e) {
      e.stopPropagation(); var r = b.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2);
      b.classList.add('pop'); say('heart', p[0], p[1]); burst(p[0], p[1], 7, .55);
      setTimeout(function () { b.remove(); }, 480);
      setTimeout(function () { if (screens[cur] === sec) fillHearts(sec); }, 4500);
    });
    box.appendChild(b);
  }
  function fillHearts(sec) {
    var box = $('.hearts', sec); if (!box) { box = document.createElement('div'); box.className = 'hearts'; sec.appendChild(box); }
    var quiet = { 's-letter': 1, 's-belief': 1, 's-song': 1, 's-clip': 1, 's-wish': 1, 's-quiz': 1 }, have = box.childElementCount, want = quiet[sec.id] ? 5 : 8; if (have >= want) return;
    var excl = collectExcl(sec);
    for (var i = have; i < want; i++) makeHeart(sec, box, excl), excl = collectExcl(sec);
  }
  function enterExtras(sec) { setTimeout(function () { if (screens[cur] === sec) fillHearts(sec); }, 1800); }

  /* --- падающие цветочки и звёздочки: их можно поймать --- */
  function spawnFall(force) {
    if (cur < 1 || !modal.hidden || document.hidden || $('#fall').childElementCount > 1 || (!force && Math.random() < 0.25)) return;
    var t = HT[Math.floor(Math.random() * HT.length)], col = t.c[Math.floor(Math.random() * t.c.length)], size = 54 + Math.random() * 26;
    var el = document.createElement('button'); el.className = 'fi'; el.type = 'button'; el.setAttribute('aria-label', 'Поймать');
    el.style.cssText = 'left:' + (140 + Math.random() * 1640) + 'px;width:' + size + 'px;height:' + size + 'px;color:' + col + ';--t:' + (15 + Math.random() * 7).toFixed(1) + 's';
    el.innerHTML = '<i><svg><use href="' + t.i + '"/></svg></i>';
    el.addEventListener('click', function (e) {
      e.stopPropagation(); var r = el.getBoundingClientRect(), p = toStage(r.left + r.width / 2, r.top + r.height / 2);
      say('catch', p[0], p[1]); burst(p[0], p[1], 9, .7); el.remove();
    });
    el.addEventListener('animationend', function () { el.remove(); });
    $('#fall').appendChild(el);
  }
  setInterval(spawnFall, 7000);
  document.addEventListener('spawnfall', function () { spawnFall(true); });

  setTimeout(function () { if (cur > 0) { var t = $('#fall'); if (!t.childElementCount) document.dispatchEvent(new CustomEvent('spawnfall')); } }, 3800);
  /* --- сад: нажимай на землю, и вырастают цветы --- */
  var GN = ['rose-pink', 'wild1', 'white', 'cabbage', 'moss', 'peony', 'pale', 'wild3', 'white2', 'crimson', 'darkrose', 'amaryllis', 'crocus', 'hyacinth', 'delicate', 'sprig1', 'passion', 'pompon'];
  var gCount = 0, gZone = $('#garden-zone');
  function updGarden() { $('#garden-count').textContent = 'Посажено: ' + gCount; }
  function clearGarden() { $$('.gp', gZone).forEach(function (g) { g.remove(); }); gCount = 0; updGarden(); }
  $('#garden-clear').addEventListener('click', clearGarden);
  gZone.addEventListener('click', function (e) {
    var r = gZone.getBoundingClientRect(), s2 = stageScale(), x = (e.clientX - r.left) / s2, y = Math.max(330, (e.clientY - r.top) / s2), n = GN[Math.floor(Math.random() * GN.length)];
    var h = 200 + Math.random() * 190, w = h * (FR[n] || .7), im = new Image();
    im.src = 'assets/flowers/' + n + '.webp'; im.alt = ''; im.draggable = false; im.className = 'gp';
    im.style.cssText = 'left:' + (x - w / 2) + 'px;top:' + (y - h) + 'px;width:' + w + 'px;height:' + h + 'px;z-index:' + Math.round(y) + ';--tilt:' + ((Math.random() - .5) * 8).toFixed(1) + 'deg;animation-delay:0s,1.7s';
    im.addEventListener('click', function (ev) {
      ev.stopPropagation(); var rr = im.getBoundingClientRect(), p = toStage(rr.left + rr.width / 2, rr.top + rr.height * .25);
      try { im.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(4deg) scale(1.05)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], { duration: 700 }); } catch (x2) {}
      say('flower', p[0], p[1]); burst(p[0], p[1], 5, .5);
    });
    gZone.appendChild(im); gCount++;
    var all = $$('.gp', gZone); if (all.length > 40) all[0].remove();
    gCount = $$('.gp', gZone).length; updGarden(); var p0 = toStage(e.clientX, e.clientY); burst(p0[0], p0[1], 3, .3);
    if (gCount === 12) setTimeout(function () { showNote(960, 520, 'Целый сад! Он растёт так же щедро, как твоё сердце. ♥', 5200); burst(960, 520, 36, 1.5); }, 900);
    else if (gCount % 5 === 0) { var m = drawMsg('garden'); setTimeout(function () { showNote(x, y + 250, m); }, 700); }
  });

  /* --- торт: иллюстрация --- */
  (function () {
    var cx = 490, A = { y: 500, rx: 330, ry: 66, h: 140 }, B = { y: 372, rx: 235, ry: 48, h: 128 }, C = { y: 262, rx: 150, ry: 31, h: 110 };
    var o = '<defs>' +
      '<linearGradient id="cg-a" x1="0" x2="1"><stop offset="0" stop-color="#d98f83"/><stop offset=".22" stop-color="#f7bfae"/><stop offset=".6" stop-color="#fbd6c6"/><stop offset="1" stop-color="#d98f83"/></linearGradient>' +
      '<linearGradient id="cg-b" x1="0" x2="1"><stop offset="0" stop-color="#d27a98"/><stop offset=".22" stop-color="#f4a8c0"/><stop offset=".6" stop-color="#f9c4d5"/><stop offset="1" stop-color="#d27a98"/></linearGradient>' +
      '<linearGradient id="cg-c" x1="0" x2="1"><stop offset="0" stop-color="#b996d1"/><stop offset=".22" stop-color="#dcc0ee"/><stop offset=".6" stop-color="#ead8f4"/><stop offset="1" stop-color="#b996d1"/></linearGradient>' +
      '<linearGradient id="cg-cream" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#fff3ee"/><stop offset="1" stop-color="#f6dcd2"/></linearGradient>' +
      '<radialGradient id="cg-plate" cx=".5" cy=".4"><stop offset="0" stop-color="#fffaf4"/><stop offset=".8" stop-color="#f3e2d4"/><stop offset="1" stop-color="#dfc3ae"/></radialGradient>' +
      '<radialGradient id="cg-pearl" cx=".35" cy=".3"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="#fbe6e2"/><stop offset="1" stop-color="#e8bdb6"/></radialGradient></defs>';
    function arcY(T, x) { var k = (x - cx) / T.rx; return T.y + T.ry * Math.sqrt(Math.max(0, 1 - k * k)); }
    /* тарелка с кружевной каймой */
    o += '<ellipse cx="' + cx + '" cy="676" rx="456" ry="58" fill="rgba(110,50,60,.22)"/>';
    o += '<ellipse cx="' + cx + '" cy="650" rx="450" ry="62" fill="url(#cg-plate)" stroke="#d8b59b" stroke-width="3"/>';
    for (var i = 0; i < 46; i++) { var a = i / 46 * Math.PI * 2; o += '<circle cx="' + (cx + Math.cos(a) * 428).toFixed(1) + '" cy="' + (650 + Math.sin(a) * 52).toFixed(1) + '" r="7" fill="#fff9f3" stroke="#e5cdb9" stroke-width="1.5"/>'; }
    o += '<ellipse cx="' + cx + '" cy="650" rx="395" ry="44" fill="none" stroke="#e7c27a" stroke-width="3" opacity=".8"/>';
    function tier(T, grad, ribbon, hue) {
      var yb = T.y + T.h, l = cx - T.rx, r = cx + T.rx, s = '';
      s += '<path d="M' + l + ' ' + T.y + 'L' + l + ' ' + yb + 'A' + T.rx + ' ' + T.ry + ' 0 0 0 ' + r + ' ' + yb + 'L' + r + ' ' + T.y + 'Z" fill="url(#' + grad + ')"/>';
      /* текстура крема: тонкие вертикальные штрихи */
      for (var x = l + 14; x < r - 10; x += 16) { var yy = arcY(T, x); s += '<path d="M' + x + ' ' + (yy + 26) + 'L' + x + ' ' + (yy + T.h - 22) + '" stroke="rgba(255,255,255,.18)" stroke-width="3" stroke-linecap="round"/>'; }
      /* лента */
      var ro = T.h * .52;
      s += '<path d="M' + l + ' ' + (T.y + ro) + 'A' + T.rx + ' ' + T.ry + ' 0 0 0 ' + r + ' ' + (T.y + ro) + 'L' + r + ' ' + (T.y + ro + 24) + 'A' + T.rx + ' ' + T.ry + ' 0 0 1 ' + l + ' ' + (T.y + ro + 24) + 'Z" fill="' + ribbon + '"/>';
      s += '<path d="M' + (l + 6) + ' ' + (T.y + ro + 12) + 'A' + (T.rx - 6) + ' ' + (T.ry - 3) + ' 0 0 0 ' + (r - 6) + ' ' + (T.y + ro + 12) + '" fill="none" stroke="rgba(255,255,255,.75)" stroke-width="2.5" stroke-dasharray="3 9" stroke-linecap="round"/>';
      /* жемчужины по нижнему краю */
      for (var k = 0; k <= 22; k++) { var a = k / 22, xx = l + 14 + a * (T.rx * 2 - 28), yy2 = yb + T.ry * Math.sqrt(Math.max(0, 1 - Math.pow((xx - cx) / T.rx, 2))) - 6; s += '<circle cx="' + xx.toFixed(1) + '" cy="' + yy2.toFixed(1) + '" r="' + (T.rx > 280 ? 8 : 6.5) + '" fill="url(#cg-pearl)" stroke="rgba(160,100,100,.35)" stroke-width="1"/>'; }
      /* верх, глазурь и подтёки */
      s += '<ellipse cx="' + cx + '" cy="' + T.y + '" rx="' + T.rx + '" ry="' + T.ry + '" fill="url(#cg-cream)"/>';
      s += '<ellipse cx="' + cx + '" cy="' + T.y + '" rx="' + (T.rx - 14) + '" ry="' + (T.ry - 7) + '" fill="none" stroke="rgba(230,190,180,.55)" stroke-width="2"/>';
      var band = '', n = Math.round(T.rx / 14), seed = T.rx;
      for (var j = 0; j <= n * 2; j++) { var xx2 = l + (j / (n * 2)) * T.rx * 2, drop = (j % 2 ? 12 : 22) + ((j * 37 + seed) % 22); band += '<ellipse cx="' + xx2.toFixed(1) + '" cy="' + (arcY(T, xx2) + 12 + drop / 2).toFixed(1) + '" rx="9.5" ry="' + (drop / 2 + 6).toFixed(1) + '" />'; }
      s += '<g fill="url(#cg-cream)" stroke="rgba(214,170,160,.4)" stroke-width="1.5">' + band + '</g>';
      s += '<path d="M' + l + ' ' + T.y + 'A' + T.rx + ' ' + T.ry + ' 0 0 0 ' + r + ' ' + T.y + 'L' + r + ' ' + (T.y + 16) + 'A' + T.rx + ' ' + T.ry + ' 0 0 1 ' + l + ' ' + (T.y + 16) + 'Z" fill="url(#cg-cream)"/>';
      /* блик */
      s += '<path d="M' + (l + 24) + ' ' + (T.y + 30) + 'L' + (l + 24) + ' ' + (yb - 24) + '" stroke="rgba(255,255,255,.5)" stroke-width="9" stroke-linecap="round"/>';
      return s;
    }
    o += tier(A, 'cg-a', '#e0708b'); o += tier(B, 'cg-b', '#8f5fb5'); o += tier(C, 'cg-c', '#e0708b');
    /* бантики на лентах */
    o += '<use href="#i-bow" x="' + (cx - 55) + '" y="' + (A.y + A.h * .52 + 36) + '" width="110" height="80"/>';
    o += '<use href="#i-bow" x="' + (cx - 40) + '" y="' + (B.y + B.h * .52 + 36) + '" width="80" height="58"/>';
    /* конфетти-посыпка на верхушке и сердечки */
    var cols = ['#f08aa4', '#f7c453', '#b684c4', '#7fc9a8', '#f6a97c'];
    for (var q = 0; q < 34; q++) { var qa = (q * 2.399) % 6.283, qr = Math.sqrt(q / 34) * 0.78; o += '<rect x="' + (cx + Math.cos(qa) * qr * C.rx - 4).toFixed(1) + '" y="' + (C.y + Math.sin(qa) * qr * C.ry - 1.5).toFixed(1) + '" width="8" height="3.2" rx="1.6" fill="' + cols[q % 5] + '" transform="rotate(' + (q * 47 % 180) + ' ' + (cx + Math.cos(qa) * qr * C.rx).toFixed(1) + ' ' + (C.y + Math.sin(qa) * qr * C.ry).toFixed(1) + ')"/>'; }
    for (var hh = 0; hh < 7; hh++) { var hx = cx - 270 + hh * 90 + (hh % 2) * 14; o += '<use href="#i-heart" x="' + hx + '" y="' + (A.y + 22 + (hh % 2) * 8 + 8) + '" width="22" height="20" fill="#fff" opacity=".85"/>'; }
    /* ботанические цветы как украшение */
    function fl(n, x, y, w, h, r, fx) { return '<image href="assets/flowers/' + n + '.webp" x="' + (x - w / 2) + '" y="' + (y - h / 2) + '" width="' + w + '" height="' + h + '" transform="rotate(' + r + ' ' + x + ' ' + y + ')' + (fx ? ' translate(' + (2 * x) + ' 0) scale(-1 1)' : '') + '" preserveAspectRatio="xMidYMid meet" style="filter:drop-shadow(0 6px 5px rgba(80,30,40,.35))"/>'; }
    o += fl('rose-pink', 150, 560, 150, 200, -64, 0) + fl('wild1', 830, 568, 150, 200, 66, 1);
    o += fl('peony', 258, 420, 92, 122, -50, 0) + fl('crimson', 722, 422, 92, 122, 52, 1);
    $('#cake-art').innerHTML = o;
  })();

  /* ---------- Фоновая музыка (плеер в шапке) ---------- */
  var BG = (G.bgm && G.bgm.length) ? G.bgm : [], bgi = 0, bgm = new Audio(), bgStarted = false;
  bgm.volume = 0.3; bgm.preload = 'none';
  function bgMark() { $$('#bgm-list .bgm-item').forEach(function (b, k) { b.classList.toggle('cur', k === bgi); b.setAttribute('aria-selected', k === bgi ? 'true' : 'false'); }); }
  function bgSet(i) { if (!BG.length) return; bgi = (i + BG.length) % BG.length; bgm.src = BG[bgi].file; $('#bgm-title').textContent = BG[bgi].title; bgMark(); var cb = $('#bgm-list .cur'); if (cb && !$('#bgm-list').hidden) cb.scrollIntoView({ block: 'nearest' }); }
  function bgPlay() {
    if (!BG.length) return; if (!bgm.src) bgSet(bgi);
    if (audio && !audio.paused) audio.pause(); if (clip && !clip.paused) clip.pause();
    var p = bgm.play(); if (p && p.catch) p.catch(function () {}); bgStarted = true; $('#bgm-play').classList.remove('nudge');
  }
  function bgPause() { bgm.pause(); }
  function bgIcon() { var pl = !bgm.paused; $('#bgm-ic').innerHTML = '<use href="#' + (pl ? 'i-pause' : 'i-play') + '"/>'; $('#bgm').classList.toggle('on', pl); }
  if (!BG.length) { $('#bgm').hidden = true; }
  else {
    var lst = $('#bgm-list');
    BG.forEach(function (t, k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'bgm-item'; b.setAttribute('role', 'option');
      b.innerHTML = '<i>' + (k + 1) + '</i><span>' + t.title + '</span><em>♪</em>';
      b.addEventListener('click', function (e) { e.stopPropagation(); bgSet(k); bgPlay(); });
      lst.appendChild(b);
    });
    function bgList(open) { lst.hidden = !open; $('#bgm-open').setAttribute('aria-expanded', open ? 'true' : 'false'); $('#bgm').classList.toggle('open', open); if (open) { bgMark(); var cb = $('.cur', lst); if (cb) cb.scrollIntoView({ block: 'nearest' }); } }
    $('#bgm-open').addEventListener('click', function (e) { e.stopPropagation(); bgList(lst.hidden); });
    document.addEventListener('click', function (e) { if (!lst.hidden && !e.target.closest('#bgm')) bgList(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !lst.hidden) bgList(false); });
    bgSet(0); bgIcon();
    bgm.addEventListener('play', bgIcon); bgm.addEventListener('pause', bgIcon);
    bgm.addEventListener('ended', function () { bgSet(bgi + 1); bgPlay(); });
    bgm.addEventListener('error', function () { if (BG.length > 1) { bgSet(bgi + 1); } });
    $('#bgm-play').addEventListener('click', function () { if (bgm.paused) bgPlay(); else bgPause(); });
    $('#bgm-next').addEventListener('click', function () { bgSet(bgi + 1); bgPlay(); });
    $('#bgm-prev').addEventListener('click', function () { bgSet(bgi - 1); bgPlay(); });
    $('#bgm-vol').addEventListener('input', function () { bgm.volume = this.value / 100; });
    /* повтор и перемотка */
    var seek = $('#bgm-seek'), dragging = false;
    function fmt(t) { if (!isFinite(t)) return '0:00'; t = Math.floor(t); return Math.floor(t / 60) + ':' + ('0' + (t % 60)).slice(-2); }
    function bgTime() { $('#bgm-cur').textContent = fmt(bgm.currentTime); $('#bgm-dur').textContent = fmt(bgm.duration); if (!dragging && bgm.duration) seek.value = Math.round(bgm.currentTime / bgm.duration * 1000); }
    ['timeupdate', 'loadedmetadata', 'durationchange', 'emptied'].forEach(function (n) { bgm.addEventListener(n, bgTime); });
    seek.addEventListener('input', function () { dragging = true; if (bgm.duration) { bgm.currentTime = seek.value / 1000 * bgm.duration; $('#bgm-cur').textContent = fmt(bgm.currentTime); } });
    seek.addEventListener('change', function () { dragging = false; });
    seek.addEventListener('pointerup', function () { dragging = false; });
    $('#bgm-loop').addEventListener('click', function () { bgm.loop = !bgm.loop; this.classList.toggle('on', bgm.loop); this.setAttribute('aria-pressed', bgm.loop ? 'true' : 'false'); });
    $('#bgm-play').classList.add('nudge');
    /* песня и видео заглушают фон */
    audio.addEventListener('play', function () { bgPause(); });
  }

  window.addEventListener('hashchange', function () { var n = parseInt((location.hash || '').slice(1), 10); if (!isNaN(n) && n !== cur && n >= 0 && n < screens.length) go(n); });

  /* ---------- Старт ---------- */
  var start = parseInt((location.hash || '').slice(1), 10);
  go(isNaN(start) ? 0 : Math.min(Math.max(start, 0), screens.length - 1));
})();
