/* Браузерный порт ядра бота из github.com/ev609/telegram-bot (dialog.py+config.py+faq.py).
   Тот же сценарий: меню → пошаговая заявка → ответы по базе знаний с честным «не знаю».
   Работает прямо на странице, без бэкенда. Кнопки кликабельны, как в Telegram. */
(function () {
  "use strict";
  var MENU = ["Услуги", "Цены", "Оставить заявку", "Задать вопрос"];
  var GREETING = "Здравствуйте! Это бот веб-студии (демо).\n\nЧем помочь? Выберите пункт меню или просто напишите вопрос.";
  var SERVICES = "Что мы делаем:\n• Сайты и лендинги под ключ\n• Telegram-боты и чат-ассистенты\n• Интеграции и автоматизация (CRM, оплаты, уведомления)\n\nНажмите «Оставить заявку» — обсудим вашу задачу.";
  var PRICES = "Ориентиры по стоимости:\n• Лендинг — от 30 000 ₽\n• Telegram-бот — от 25 000 ₽\n• Интеграция/автоматизация — от 20 000 ₽\n\nТочная цена — после короткого обсуждения задачи.";
  var FAQ = [
    [["срок", "скольк", "времен", "долго", "быстр"], "Сроки зависят от объёма: лендинг — 5–10 дней, типовой бот — 1–2 недели. Точный срок назовём после обсуждения задачи."],
    [["оплат", "плати", "предопл", "рассроч", "этап"], "Работаем по этапам: предоплата 30–50%, остаток — после сдачи. Для первых заказов возможна безопасная сделка/эскроу."],
    [["правк", "дорабо", "гаран", "поддерж", "сопров"], "После сдачи — бесплатные правки по согласованному ТЗ в течение 2 недель, далее — поддержка по договорённости."],
    [["хостин", "сервер", "разве", "размес", "домен"], "Развернём на вашем сервере или поможем с хостингом и доменом. Доступы и данные остаются у вас."],
    [["бот", "telegr", "телегр", "чат"], "Делаем Telegram-ботов: меню, приём заявок, ответы на вопросы, интеграции. Этот бот — пример нашей работы."]
  ];
  var NO_ANSWER = "Пока не могу ответить на этот вопрос по базе знаний. Нажмите «Оставить заявку» — менеджер ответит лично.";
  var TOKEN_RE = /[a-zA-Zа-яёА-ЯЁ0-9]+/g;

  function faqAnswer(q) {
    // Совпадение темы — если слово вопроса начинается с маркера-корня («срок» → «сроки»).
    var words = (q.toLowerCase().match(TOKEN_RE) || []).filter(function (w) { return w.length > 2; });
    var best = null, bestScore = 0;
    FAQ.forEach(function (pair) {
      var s = 0;
      pair[0].forEach(function (mk) { if (words.some(function (w) { return w.indexOf(mk) === 0; })) s++; });
      if (s > bestScore) { best = pair[1]; bestScore = s; }
    });
    return bestScore < 1 || !best ? NO_ANSWER : best;
  }
  function norm(s) { return (s || "").trim().toLowerCase(); }
  function newSession() { return { state: "menu", lead: {} }; }

  function handle(s, text) {
    var t = norm(text);
    if (t === "/start" || t === "начать") { Object.assign(s, newSession()); return { text: GREETING, buttons: MENU.slice() }; }
    if (t === "отмена" || t === "меню" || t === "/menu") { Object.assign(s, newSession()); return { text: "Окей, вернулись в меню.", buttons: MENU.slice() }; }
    var st = s.state;
    if (st === "lead_name") { s.lead.name = text.trim(); s.state = "lead_contact"; return { text: "Как с вами связаться? Телефон, e-mail или @username в Telegram.", buttons: [] }; }
    if (st === "lead_contact") { s.lead.contact = text.trim(); s.state = "lead_task"; return { text: "Коротко опишите задачу — что нужно сделать?", buttons: [] }; }
    if (st === "lead_task") { s.lead.task = text.trim(); s.state = "lead_confirm"; var l = s.lead;
      return { text: "Проверьте заявку:\n• Имя: " + l.name + "\n• Контакт: " + l.contact + "\n• Задача: " + l.task + "\n\nВсё верно?", buttons: ["да", "отмена"] }; }
    if (st === "lead_confirm") {
      if (t === "да" || t === "верно" || t === "ок" || t === "подтверждаю") { var lead = Object.assign({}, s.lead); Object.assign(s, newSession());
        return { text: "Готово! Заявка принята, менеджер свяжется с вами по указанному контакту. Спасибо 🙌", buttons: MENU.slice(), leadDone: lead }; }
      Object.assign(s, newSession()); return { text: "Заявка отменена. Если что — выберите пункт меню.", buttons: MENU.slice() };
    }
    if (t === "услуги") return { text: SERVICES, buttons: MENU.slice() };
    if (t === "цены") return { text: PRICES, buttons: MENU.slice() };
    if (t === "оставить заявку") { s.state = "lead_name"; return { text: "Оформим заявку. Как вас зовут?", buttons: [] }; }
    if (t === "задать вопрос") { s.state = "ask"; return { text: "Задайте вопрос — отвечу по базе знаний.", buttons: [] }; }
    // Любой свободный текст — отвечаем по базе знаний (faqAnswer сам вежливо
    // ответит «не знаю» при промахе — это лучше сухого «не понял»).
    return { text: faqAnswer(text), buttons: MENU.slice() };
  }

  // ---- UI ----
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function init() {
    var log = document.getElementById("tg-log"), form = document.getElementById("tg-form"), input = document.getElementById("tg-q");
    if (!log || !form || !input) return;
    var session = newSession();
    function addUser(q) { var m = el("div", "rag-msg rag-u", q); log.appendChild(m); }
    function addBot(res) {
      var m = el("div", "rag-msg rag-b" + (res.text === NO_ANSWER ? " rag-no" : ""));
      m.appendChild(el("div", "rag-txt", res.text));
      if (res.leadDone) { var d = el("div", "rag-src", "↳ реальный бот шлёт менеджеру: " + res.leadDone.name + " / " + res.leadDone.contact); m.appendChild(d); }
      if (res.buttons && res.buttons.length) {
        var row = el("div", "tg-btns");
        res.buttons.forEach(function (b) { var btn = el("button", "tg-btn", b); btn.type = "button";
          btn.addEventListener("click", function () { send(b); }); row.appendChild(btn); });
        m.appendChild(row);
      }
      log.appendChild(m); log.scrollTop = log.scrollHeight;
    }
    function send(q) { q = (q || "").trim(); if (!q) return; addUser(q); addBot(handle(session, q)); log.scrollTop = log.scrollHeight; }
    form.addEventListener("submit", function (e) { e.preventDefault(); send(input.value); input.value = ""; input.focus(); });
    addBot(handle(session, "/start"));  // приветствие + меню
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
