/* Мягкая подсказка сменить язык — БЕЗ авто-редиректа.
 * Google best practice: не редиректить по Accept-Language (краулер видит одну
 * версию → остальные выпадают из индекса). Вместо этого — ненавязчивый
 * дисмиссбл-баннер; URL альтернативы берём из hreflang самой страницы (если
 * перевода нет — тихо no-op); выбор запоминаем в localStorage (больше не нудим).
 */
(function () {
  'use strict';
  try {
    var KEY = 'af_lang_pref';
    if (localStorage.getItem(KEY)) return;             // выбор уже сделан — не навязываемся

    var cur = (document.documentElement.lang || 'en').slice(0, 2).toLowerCase();
    var langs = navigator.languages || [navigator.language || ''];
    var want = langs.some(function (l) { return /^ru/i.test(l); }) ? 'ru' : 'en';
    if (want === cur) return;                           // уже на нужном языке

    var target = null;
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (a) {
      if ((a.getAttribute('hreflang') || '').slice(0, 2).toLowerCase() === want) {
        target = a.getAttribute('href');
      }
    });
    if (!target) return;                                // нет переведённой версии этой страницы
    var norm = function (u) { return (u || '').replace(/\/+$/, ''); };
    if (norm(location.href) === norm(target)) return;   // альтернатива = текущий URL

    var T = want === 'ru'
      ? { msg: 'Открыть сайт на русском?', yes: 'На русский', no: 'Stay in English' }
      : { msg: 'View this site in English?', yes: 'English', no: 'Остаться на русском' };

    var save = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };

    var bar = document.createElement('div');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Language suggestion');
    bar.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:18px;' +
      'z-index:9998;display:flex;gap:10px;align-items:center;flex-wrap:wrap;' +
      'justify-content:center;padding:10px 14px;background:#11141a;border:1px solid #2a2f3a;' +
      'border-radius:12px;color:#e8eaed;box-shadow:0 8px 30px rgba(0,0,0,.45);' +
      'max-width:calc(100% - 32px);' +
      'font:500 14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';

    var span = document.createElement('span');
    span.textContent = T.msg;

    var yes = document.createElement('a');
    yes.href = target;
    yes.textContent = T.yes;
    yes.style.cssText = 'background:#3ecf8e;color:#06251a;padding:6px 14px;border-radius:8px;' +
      'text-decoration:none;font-weight:600';
    yes.addEventListener('click', function () { save(want); });

    var no = document.createElement('button');
    no.type = 'button';
    no.textContent = T.no;
    no.style.cssText = 'background:transparent;color:#9aa3b2;border:1px solid #2a2f3a;' +
      'padding:6px 14px;border-radius:8px;cursor:pointer;font:inherit';
    no.addEventListener('click', function () { save(cur); bar.remove(); });

    bar.appendChild(span);
    bar.appendChild(yes);
    bar.appendChild(no);
    document.body.appendChild(bar);
  } catch (e) { /* no-op */ }
})();
