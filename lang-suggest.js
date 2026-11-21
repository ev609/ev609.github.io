/* Мягкая подсказка сменить язык — БЕЗ авто-редиректа.
 * Google best practice: не редиректить по Accept-Language (краулер видит одну
 * версию → остальные выпадают из индекса). Вместо этого — ненавязчивый
 * дисмиссбл-баннер; URL альтернативы берём из hreflang самой страницы (если
 * перевода нет — тихо no-op); выбор запоминаем в localStorage (больше не нудим).
 * Поддерживает RU / EN / ZH / ES, светлую тему html[data-theme="light"],
 * запоминает ручной выбор в шапке (.lang a) и сохраняет #r=... при смене языка.
 */
(function () {
  'use strict';
  try {
    var KEY = 'af_lang_pref';
    var save = function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} };
    var baseLang = function (s) {
      s = (s || '').toLowerCase();
      if (s.indexOf('zh') === 0) return 'zh';
      return s.slice(0, 2);
    };
    var withHash = function (href) {
      if (!href || !location.hash || href.indexOf('#') >= 0) return href;
      return href + location.hash;
    };

    // Всегда слушаем ручное переключение языка в шапке (.lang a[hreflang]):
    // обновляем выбор в localStorage и переносим #r=... (снимок результата на /check/*).
    var wireSwitchers = function () {
      document.querySelectorAll('.lang a[hreflang]').forEach(function (a) {
        if (a.dataset.afLangWired) return;
        a.dataset.afLangWired = '1';
        a.addEventListener('click', function () {
          var code = baseLang(a.getAttribute('hreflang'));
          if (code) save(code);
          var rawHref = a.getAttribute('href');
          if (rawHref && location.hash && location.hash.indexOf('#r=') === 0 && rawHref.indexOf('#') < 0) {
            a.setAttribute('href', rawHref + location.hash);
          }
        });
      });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireSwitchers);
    else wireSwitchers();

    if (localStorage.getItem(KEY)) return; // выбор уже сделан — не навязываемся

    var cur = baseLang(document.documentElement.lang || 'en');

    // Собираем карту доступных переводов из <link rel="alternate" hreflang="...">
    var alts = {};
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (a) {
      var hl = (a.getAttribute('hreflang') || '').toLowerCase();
      if (!hl || hl === 'x-default') return;
      var code = baseLang(hl);
      if (!alts[code]) alts[code] = a.getAttribute('href');
    });
    if (!Object.keys(alts).length) return;

    // Выбираем первый предпочитаемый пользователем язык, для которого есть перевод
    var langs = navigator.languages && navigator.languages.length
      ? Array.prototype.slice.call(navigator.languages)
      : [navigator.language || ''];
    var want = null;
    for (var i = 0; i < langs.length; i++) {
      var code = baseLang(langs[i]);
      if (code === cur) return; // предпочитаемый язык уже открыт
      if (alts[code]) { want = code; break; }
    }
    if (!want && cur !== 'en' && alts.en) want = 'en';
    if (!want || want === cur) return;

    var target = alts[want];
    var norm = function (u) { return (u || '').split('#')[0].replace(/\/+$/, ''); };
    if (!target || norm(location.href) === norm(target)) return;

    var STAY = {
      ru: 'Остаться на русском',
      en: 'Stay in English',
      zh: '留在中文版',
      es: 'Seguir en español'
    };
    var COPY = {
      ru: { msg: 'Открыть страницу на русском?', yes: 'На русский' },
      en: { msg: 'View this page in English?', yes: 'English' },
      zh: { msg: '切换到中文版？', yes: '中文版' },
      es: { msg: '¿Ver esta página en español?', yes: 'Español' }
    };
    var T = COPY[want] || COPY.en;
    var stayTxt = STAY[cur] || 'Stay';

    var css = '\
.afl-bar{position:fixed;left:18px;bottom:24px;z-index:9998;display:flex;gap:10px;align-items:center;flex-wrap:wrap;\
padding:10px 14px;background:rgba(18,20,26,.94);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);\
border:1px solid rgba(255,255,255,.12);border-radius:13px;color:#f4f5f7;\
box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 32px rgba(0,0,0,.45);\
max-width:min(420px,calc(100vw - 36px));font:400 13.5px/1.4 "Golos Text",system-ui,-apple-system,sans-serif;\
opacity:0;transform:translateY(8px);transition:opacity .24s ease,transform .26s cubic-bezier(.16,1,.3,1)}\
.afl-bar.show{opacity:1;transform:translateY(0)}\
.afl-yes{background:linear-gradient(135deg,#4ae39e,#25b876);color:#07120c;padding:6px 13px;border-radius:8px;\
text-decoration:none;font-weight:600;font-size:13px;transition:filter .15s ease}\
.afl-yes:hover{filter:brightness(1.06)}\
.afl-no{background:transparent;color:#a0a6b0;border:1px solid rgba(255,255,255,.14);padding:6px 12px;border-radius:8px;\
cursor:pointer;font:inherit;font-size:13px;transition:color .15s,border-color .15s,background .15s}\
.afl-no:hover{color:#f4f5f7;border-color:rgba(255,255,255,.26);background:rgba(255,255,255,.05)}\
html[data-theme="light"] .afl-bar{background:rgba(255,255,255,.95);color:#111827;border-color:rgba(15,23,42,.12);\
box-shadow:0 10px 30px -8px rgba(15,23,42,.18),0 2px 6px rgba(15,23,42,.06)}\
html[data-theme="light"] .afl-yes{background:linear-gradient(135deg,#22c55e,#15803d);color:#ffffff}\
html[data-theme="light"] .afl-no{color:#4b5563;border-color:rgba(15,23,42,.14)}\
html[data-theme="light"] .afl-no:hover{color:#111827;border-color:rgba(15,23,42,.26);background:rgba(15,23,42,.04)}\
@media(prefers-reduced-motion:reduce){.afl-bar,.afl-yes,.afl-no{transition:none}}';

    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var bar = document.createElement('div');
    bar.className = 'afl-bar';
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-label', 'Language suggestion');

    var span = document.createElement('span');
    span.textContent = T.msg;

    var yes = document.createElement('a');
    yes.className = 'afl-yes';
    yes.href = withHash(target);
    yes.textContent = T.yes;
    yes.addEventListener('click', function () {
      save(want);
      yes.href = withHash(target);
    });

    var no = document.createElement('button');
    no.className = 'afl-no';
    no.type = 'button';
    no.textContent = stayTxt;
    no.addEventListener('click', function () {
      save(cur);
      bar.classList.remove('show');
      setTimeout(function () { if (bar.parentNode) bar.remove(); }, 220);
    });

    bar.appendChild(span);
    bar.appendChild(yes);
    bar.appendChild(no);
    document.body.appendChild(bar);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.classList.add('show'); });
    });
  } catch (e) { /* no-op */ }
})();
