/* AlfaFond — централизованное подключение privacy-friendly веб-аналитики для всех страниц.
 * Заполните ОДИН (или несколько) идентификаторов ниже — остальные провайдеры не загружаются.
 * Пока все поля пусты, скрипт не делает ни одного сетевого запроса.
 */
(function () {
  'use strict';

  var CF_BEACON_TOKEN = 'c881004b94ff4a1cb3666ce7db5257ea'; // Cloudflare Web Analytics (бесплатно, 0 cookies)
  var GOATCOUNTER_SITE = ''; // GoatCounter: поддомен вида 'alfafond' (https://alfafond.goatcounter.com)
  var YM_ID = 0;             // Яндекс.Метрика: числовой ID счётчика (если нужен РФ-трафик)

  // Не считаем локальную отладку и headless-проверки check.sh / check.ps1
  var host = location.hostname || '';
  if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return;
  if (location.search && location.search.indexOf('headless=1') !== -1) return;

  function loadScript(attrs) {
    var s = document.createElement('script');
    s.defer = true;
    Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    document.head.appendChild(s);
  }

  if (CF_BEACON_TOKEN) {
    loadScript({
      src: 'https://static.cloudflareinsights.com/beacon.min.js',
      'data-cf-beacon': JSON.stringify({ token: CF_BEACON_TOKEN })
    });
  }

  if (GOATCOUNTER_SITE) {
    loadScript({
      src: 'https://gc.zgo.at/count.js',
      'data-goatcounter': 'https://' + GOATCOUNTER_SITE + '.goatcounter.com/count'
    });
  }

  if (YM_ID) {
    (function (m, e, t, r, i, k, a) {
      m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
      m[i].l = 1 * new Date();
      k = e.createElement(t); a = e.getElementsByTagName(t)[0];
      k.async = 1; k.src = r; a.parentNode.insertBefore(k, a);
    })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');
    window.ym(YM_ID, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true });
  }
})();
