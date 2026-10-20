(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  var slides = $$('.slide');
  var navLinks = $$('#nav a');
  var body = document.body;

  /* ---------- count-up ---------- */
  function runCounts(root) {
    $$('.count', root).forEach(function (el) {
      var to = parseFloat(el.dataset.to), dec = parseInt(el.dataset.dec || '0', 10);
      if (reduce) { el.textContent = to.toFixed(dec); return; }
      var t0 = null, dur = 1300;
      function tick(t) {
        if (t0 === null) t0 = t;
        var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---------- scroll reveal ---------- */
  if ('IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        if (en.target.querySelector('.count')) runCounts(en.target);
        rio.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    $$('.reveal').forEach(function (el) { rio.observe(el); });
  } else {
    $$('.reveal').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- active nav + progress ---------- */
  var bar = $('#progressBar');
  function onScroll() {
    if (body.classList.contains('present')) return;
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    var cur = null, y = window.innerHeight * 0.35;
    slides.forEach(function (s) { if (s.getBoundingClientRect().top <= y) cur = s; });
    navLinks.forEach(function (a) {
      var on = cur && a.getAttribute('href') === '#' + cur.id;
      a.classList.toggle('on', !!on);
      if (on) {
        var n = $('#nav');
        var left = a.offsetLeft - n.clientWidth / 2 + a.clientWidth / 2;
        if (Math.abs(n.scrollLeft - left) > 40) n.scrollLeft = left;
      }
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- tabs (กฎหมายคอมพิวเตอร์ / ลิขสิทธิ์) ---------- */
  var tabs = $$('.tab');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (x) {
        var on = x === t;
        x.classList.toggle('on', on);
        x.setAttribute('aria-selected', on);
        $('#' + x.getAttribute('aria-controls')).classList.toggle('on', on);
      });
    });
  });

  /* ---------- stepper (กรณีเสียงปลอม) ---------- */
  var stBtns = $$('.st'), stPanels = $$('.stp'), si = 0;
  function setStep(i) {
    si = Math.max(0, Math.min(stBtns.length - 1, i));
    stBtns.forEach(function (b, k) { b.classList.toggle('on', k === si); b.setAttribute('aria-selected', k === si); });
    stPanels.forEach(function (p, k) { p.classList.toggle('on', k === si); });
    $('#stPrev').disabled = si === 0; $('#stNext').disabled = si === stBtns.length - 1;
    $('#stPrev').style.opacity = si === 0 ? .4 : 1; $('#stNext').style.opacity = si === stBtns.length - 1 ? .4 : 1;
  }
  stBtns.forEach(function (b, k) { b.addEventListener('click', function () { setStep(k); }); });
  $('#stPrev').addEventListener('click', function () { setStep(si - 1); });
  $('#stNext').addEventListener('click', function () { setStep(si + 1); });
  setStep(0);

  /* ---------- parties (ผู้เกี่ยวข้อง) ---------- */
  var nodes = $$('.node'), infos = $$('.pi');
  nodes.forEach(function (n, k) {
    n.addEventListener('click', function () {
      nodes.forEach(function (x, j) { x.classList.toggle('on', j === k); x.setAttribute('aria-selected', j === k); });
      infos.forEach(function (x, j) { x.classList.toggle('on', j === k); });
    });
  });

  /* ---------- presentation mode ---------- */
  var pbar = $('#pbar'), idx = 0;

  function show(i) {
    idx = Math.max(0, Math.min(slides.length - 1, i));
    slides.forEach(function (s, k) { s.classList.toggle('current', k === idx); });
    var cur = slides[idx];
    cur.scrollTop = 0;
    $('#pCount').textContent = (idx + 1) + ' / ' + slides.length;
    $('#pTitle').textContent = cur.dataset.title || '';
    $$('.reveal', cur).forEach(function (el) { el.classList.add('is-in'); });
    runCounts(cur);
    try { history.replaceState(null, '', '#' + cur.id); } catch (e) {}
  }

  function currentIndex() {
    var y = window.innerHeight * 0.35, c = 0;
    slides.forEach(function (s, k) { if (s.getBoundingClientRect().top <= y) c = k; });
    return c;
  }

  function startPresent(from) {
    var start = typeof from === 'number' ? from : currentIndex();
    body.classList.add('present');
    pbar.hidden = false;
    show(start);
  }

  function exitPresent() {
    if (!body.classList.contains('present')) return;
    var cur = slides[idx];
    body.classList.remove('present');
    pbar.hidden = true;
    slides.forEach(function (s) { s.classList.remove('current'); });
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
    cur.scrollIntoView();
    onScroll();
  }

  function toggleFull() {
    if (!document.fullscreenEnabled) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(function () {});
  }

  $('#presentBtn').addEventListener('click', function () { startPresent(); });
  $$('[data-start-present]').forEach(function (b) { b.addEventListener('click', function () { startPresent(0); }); });
  $('#pNext').addEventListener('click', function () { show(idx + 1); });
  $('#pPrev').addEventListener('click', function () { show(idx - 1); });
  $('#pExit').addEventListener('click', exitPresent);
  $('#pFull').addEventListener('click', toggleFull);
  if (!document.fullscreenEnabled) $('#pFull').hidden = true;

  document.addEventListener('keydown', function (e) {
    if (!body.classList.contains('present')) return;
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    var k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); show(idx + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); show(idx - 1); }
    else if (k === ' ' && tag !== 'button' && tag !== 'a') { e.preventDefault(); show(idx + (e.shiftKey ? -1 : 1)); }
    else if (k === 'Home') { e.preventDefault(); show(0); }
    else if (k === 'End') { e.preventDefault(); show(slides.length - 1); }
    else if (k === 'Escape') { exitPresent(); }
    else if (k === 'f' || k === 'F') { toggleFull(); }
  });

  // swipe on touch screens
  var tx = null, ty = null;
  document.addEventListener('touchstart', function (e) {
    if (!body.classList.contains('present')) return;
    tx = e.touches[0].clientX; ty = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (tx === null || !body.classList.contains('present')) return;
    var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
    tx = ty = null;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();
