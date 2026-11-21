/* Браузерный порт ядра бота из github.com/ev609/telegram-bot (dialog.py+config.py+faq.py).
   Тот же сценарий: меню → пошаговая заявка → ответы по базе знаний с честным «не знаю».
   Работает прямо на странице, без бэкенда. Поддерживает RU и EN по html[lang]. */
(function () {
  "use strict";
  var IS_EN = (document.documentElement.lang || "ru").toLowerCase().indexOf("en") === 0;
  var MENU = IS_EN
    ? ["Services", "Pricing", "Submit inquiry", "Ask a question"]
    : ["Услуги", "Цены", "Оставить заявку", "Задать вопрос"];
  var GREETING = IS_EN
    ? "Hi! This is the AlfaFond demo bot — both a live sample of our work and real answers about our services.\n\nPick a menu item or type a question."
    : "Здравствуйте! Это демо-бот AlfaFond — и пример нашей работы, и реальные ответы про наш сервис.\n\nВыберите пункт меню или напишите вопрос.";
  var SERVICES = IS_EN
    ? "What we build:\n• Turnkey Telegram bots & AI assistants\n• RAG knowledge-base chatbots\n• Integrations & automation (CRM, payments, alerts)\n\nTap 'Submit inquiry' to discuss your project."
    : "Что мы делаем:\n• Сайты и лендинги под ключ\n• Telegram-боты и чат-ассистенты\n• Интеграции и автоматизация (CRM, оплаты, уведомления)\n\nНажмите «Оставить заявку» — обсудим вашу задачу.";
  var PRICES = IS_EN
    ? "Ballpark pricing:\n• Landing page — from 30,000 ₽\n• Telegram bot — from 25,000 ₽\n• Integration / automation — from 20,000 ₽\n\nExact quote after a short scoping chat (paid in USDC/USDT, wire, or RUB)."
    : "Ориентиры по стоимости:\n• Лендинг — от 30 000 ₽\n• Telegram-бот — от 25 000 ₽\n• Интеграция/автоматизация — от 20 000 ₽\n\nТочная цена — после короткого обсуждения задачи.";
  var FAQ = IS_EN ? [
    [["timelin", "long", "day", "week", "fast", "time"], "Timelines depend on scope: landing page ~5–10 days, standard bot 1–2 weeks. Exact delivery date is confirmed after scoping."],
    [["pay", "escrow", "usdt", "usdc", "wire", "mileston"], "Milestone-based billing: 30–50% upfront, remainder on delivery. First engagements can use escrow. Payable in USDC/USDT, wire, or RUB."],
    [["warrant", "fix", "support", "maint"], "2 weeks of free fixes within the agreed spec after delivery, with optional ongoing maintenance."],
    [["host", "server", "deploy", "cloud", "domain"], "We deploy on your server or cloud and help with hosting setup. All keys, credentials, and data stay yours."],
    [["bot", "telegr", "chat"], "We build turnkey Telegram bots: menus, lead intake, knowledge-base answers, and CRM/payment integrations. This live widget runs the exact same dialog core."],
    [["crm", "amocrm", "bitrix", "sheet", "integrat", "export"], "Leads flow straight into your CRM (amoCRM, Bitrix24) or Google Sheets automatically, mapped to your fields."],
    [["data", "privac", "secur", "store"], "Client data stays on your infrastructure: deployed on your server/cloud, zero third-party sharing."]
  ] : [
    [["срок", "скольк", "времен", "долго", "быстр"], "Сроки зависят от объёма: лендинг — 5–10 дней, типовой бот — 1–2 недели. Точный срок назовём после обсуждения задачи."],
    [["оплат", "плати", "предопл", "рассроч", "этап"], "Работаем по этапам: предоплата 30–50%, остаток — после сдачи. Для первых заказов возможна безопасная сделка/эскроу."],
    [["правк", "дорабо", "гаран", "поддерж", "сопров"], "После сдачи — бесплатные правки по согласованному ТЗ в течение 2 недель, далее — поддержка по договорённости."],
    [["хостин", "сервер", "разве", "размес", "домен"], "Развернём на вашем сервере или поможем с хостингом и доменом. Доступы и данные остаются у вас."],
    [["бот", "telegr", "телегр", "чат"], "Делаем Telegram-ботов: меню, приём заявок, ответы на вопросы, интеграции. Этот бот — пример нашей работы."],
    [["crm", "срм", "amocrm", "амосрм", "битрикс", "bitrix", "интегр", "выгр", "экспорт"], "Заявки из бота уходят прямо в вашу CRM (amoCRM, Bitrix24) или Google Sheets — без ручного переноса. Настраиваем под ваш аккаунт и поля."],
    [["данны", "конфид", "безопас", "персональн", "храни"], "Данные клиентов остаются у вас: бот разворачивается на вашем сервере или в вашем облаке, токены и доступы третьим лицам не передаём."],
    [["рассыл", "напомин", "уведомл"], "Настраиваем рассылки и напоминания клиентам — по событию или расписанию, с сегментами по нужным признакам."]
  ];
  var NO_ANSWER = IS_EN
    ? "I don't have an answer to that in the FAQ yet. Tap 'Submit inquiry' and an engineer will reply directly."
    : "Пока не могу ответить на этот вопрос по базе знаний. Нажмите «Оставить заявку» — менеджер ответит лично.";
  var TOKEN_RE = /[a-zA-Zа-яёА-ЯЁ0-9]+/g;

  function faqAnswer(q) {
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
    if (t === "/start" || t === "начать" || t === "start") { Object.assign(s, newSession()); return { text: GREETING, buttons: MENU.slice() }; }
    if (t === "отмена" || t === "меню" || t === "/menu" || t === "cancel" || t === "menu") {
      Object.assign(s, newSession());
      return { text: IS_EN ? "Back to main menu." : "Окей, вернулись в меню.", buttons: MENU.slice() };
    }
    var st = s.state;
    if (st === "lead_name") {
      s.lead.name = text.trim(); s.state = "lead_contact";
      return { text: IS_EN ? "How should we reach you? Phone, e-mail, or @telegram username." : "Как с вами связаться? Телефон, e-mail или @username в Telegram.", buttons: [] };
    }
    if (st === "lead_contact") {
      s.lead.contact = text.trim(); s.state = "lead_task";
      return { text: IS_EN ? "Briefly describe the task — what do you need built?" : "Коротко опишите задачу — что нужно сделать?", buttons: [] };
    }
    if (st === "lead_task") {
      s.lead.task = text.trim(); s.state = "lead_confirm"; var l = s.lead;
      return IS_EN
        ? { text: "Please review your inquiry:\n• Name: " + l.name + "\n• Contact: " + l.contact + "\n• Task: " + l.task + "\n\nLooks good?", buttons: ["yes", "cancel"] }
        : { text: "Проверьте заявку:\n• Имя: " + l.name + "\n• Контакт: " + l.contact + "\n• Задача: " + l.task + "\n\nВсё верно?", buttons: ["да", "отмена"] };
    }
    if (st === "lead_confirm") {
      if (t === "да" || t === "верно" || t === "ок" || t === "подтверждаю" || t === "yes" || t === "ok" || t === "confirm") {
        var lead = Object.assign({}, s.lead); Object.assign(s, newSession());
        return {
          text: IS_EN
            ? "Done! Inquiry captured — in production the bot forwards this straight to the manager's Telegram / CRM."
            : "Готово! Заявка принята, менеджер свяжется с вами по указанному контакту. Спасибо!",
          buttons: MENU.slice(),
          leadDone: lead
        };
      }
      Object.assign(s, newSession());
      return { text: IS_EN ? "Inquiry canceled. Pick a menu item anytime." : "Заявка отменена. Если что — выберите пункт меню.", buttons: MENU.slice() };
    }
    if (t === "услуги" || t === "services") return { text: SERVICES, buttons: MENU.slice() };
    if (t === "цены" || t === "pricing") return { text: PRICES, buttons: MENU.slice() };
    if (t === "оставить заявку" || t === "submit inquiry") {
      s.state = "lead_name";
      return { text: IS_EN ? "Let's capture your inquiry. What is your name?" : "Оформим заявку. Как вас зовут?", buttons: [] };
    }
    if (t === "задать вопрос" || t === "ask a question") {
      s.state = "ask";
      return { text: IS_EN ? "Type your question — I'll answer from our knowledge base." : "Задайте вопрос — отвечу по базе знаний.", buttons: [] };
    }
    return { text: faqAnswer(text), buttons: MENU.slice() };
  }

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }
  function init() {
    var log = document.getElementById("tg-log"), form = document.getElementById("tg-form"), input = document.getElementById("tg-q");
    if (!log || !form || !input) return;
    var session = newSession();
    function addUser(q) { var m = el("div", "rag-msg rag-u", q); log.appendChild(m); }
    function addBot(res) {
      var m = el("div", "rag-msg rag-b" + (res.text === NO_ANSWER ? " rag-no" : ""));
      m.appendChild(el("div", "rag-txt", res.text));
      if (res.leadDone) {
        var d = el("div", "rag-src", (IS_EN ? "↳ production bot alerts manager: " : "↳ реальный бот шлёт менеджеру: ") + res.leadDone.name + " / " + res.leadDone.contact);
        m.appendChild(d);
      }
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
    addBot(handle(session, "/start"));
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
