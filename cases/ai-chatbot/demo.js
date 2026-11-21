/* Браузерный порт RAG-движка из github.com/ev609/rag-chatbot (kb_engine.py + kb_answer.py).
   Тот же BM25-поиск, тот же лёгкий стеммер, те же гейты — работает прямо в браузере,
   без бэкенда и без API-ключей (extractive-режим). Поддерживает RU и EN по html[lang]. */
(function () {
  "use strict";
  var IS_EN = (document.documentElement.lang || "ru").toLowerCase().indexOf("en") === 0;
  var STOP = new Set((
    "и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по ее мне о из ли если или был для " +
    "the a an to of in is it and or for how do does i you can what with my this that are our your we be on at by from"
  ).split(" "));
  var TOKEN_RE = /[a-zA-Zа-яёА-ЯЁ0-9]+/g;
  var RU_SUF = ["иями","ями","ами","ость","ение","ания","ения","ться","тся","ишь","ешь","ите","ете","ают","яют","уют",
    "ает","яет","ого","его","ому","ему","ыми","ими","ых","их","ая","яя","ою","ею","ое","ее","ый","ий","ой","ом","ем",
    "ах","ях","ов","ев","ью","ия","ие","ть","ел","ал","ил","ыл","ла","ло","ли","на","но","ны","ет","ит","ут","ют","ат",
    "ят","ам","ям","а","я","о","е","ы","и","у","ю","ь"];
  var EN_SUF = ["ation","ment","ness","ing","ies","ed","es","s"];
  var K1 = 1.5, B = 0.75, MIN_RELEVANCE = 1.15, MIN_COVERAGE = 0.35;

  var DOCS_RU = [
    { doc: "01_services.md", section: "Что мы делаем", text: "Разрабатываем на Python: ИИ-чатботы с базой знаний (RAG), Telegram-боты, парсеры и сбор данных, интеграции и API, автоматизацию бизнес-процессов. Отдельная экспертиза — торговая инфраструктура (биржевые коннекторы, реальное время, бэктесты), на ней отработаны надёжность и работа 24/7." },
    { doc: "01_services.md", section: "ИИ-чатбот по базе знаний", text: "Бот отвечает на вопросы по вашим документам со ссылками на источник и честно говорит «не знаю», когда ответа в базе нет — без выдумок. Подходит для поддержки клиентов и сотрудников. Открытое демо и описание — в кейсе «ИИ-чатбот по базе знаний»." },
    { doc: "01_services.md", section: "Telegram-бот под ключ", text: "Меню, пошаговый приём заявок с уведомлением менеджеру, ответы на вопросы, интеграции с CRM и оплатами. Открытое демо — в кейсе «Telegram-бот под ключ»." },
    { doc: "01_services.md", section: "Парсеры и интеграции", text: "Сбор данных с сайтов и маркетплейсов, выгрузка в нужный формат, интеграции с amoCRM, Bitrix24, Google Sheets, платёжными системами и мессенджерами." },
    { doc: "02_process_pricing.md", section: "Как начинаем", text: "Вы описываете задачу (и присылаете пример документов или ТЗ, если есть). Я оцениваю объём и называю фиксированную цену или формат почасовой/ретейнер. Дальше — сборка, показ результата на ваших данных, передача с документацией. Можно начать с бесплатного разбора задачи или платного пилота на части объёма." },
    { doc: "02_process_pricing.md", section: "Как происходит оплата", text: "Оплата по этапам. Оплатить можно в рублях, для прямых заказов — также в USDT/USDC. Для первых заказов оплата идёт через безопасную сделку биржи или эскроу, чтобы вы судили о реальной работе до полной оплаты. Деньги клиента в управление не берём." },
    { doc: "02_process_pricing.md", section: "Сроки", text: "Сроки зависят от объёма: лендинг — примерно 5–10 дней, типовой бот — 1–2 недели, интеграция — по объёму. Точный срок называем после обсуждения задачи, всегда с запасом на правки." },
    { doc: "02_process_pricing.md", section: "Сколько стоит", text: "Это ориентиры, точная стоимость — после обсуждения. Telegram-бот (телеграм-бот): цена 25 000 ₽ и выше. ИИ-чатбот с базой знаний: стоит 50 000 ₽ и выше. Лендинг: 30 000 ₽ и выше. Интеграция или автоматизация: 20 000 ₽ и выше. Цена зависит от сложности, объёма базы знаний и нужных интеграций." },
    { doc: "02_process_pricing.md", section: "Гарантии и передача", text: "После сдачи — бесплатные правки по согласованному ТЗ в течение 2 недель. Код передаём вам, разворачиваем на вашем сервере или в вашем облаке; доступы и данные остаются у вас." },
    { doc: "03_tech_trust.md", section: "Стек", text: "Python — основной язык. ИИ-чатботы строим на RAG: поиск по вашим документам (лексический и семантический, эмбеддинги, векторное хранилище pgvector/Qdrant) и ответ строго по найденному. Telegram-боты — на aiogram. Бэкенды и API — на FastAPI. Развёртывание на вашем сервере или в облаке, с мониторингом и работой 24/7." },
    { doc: "03_tech_trust.md", section: "Может ли бот выдумать ответ", text: "Нет. ИИ-чатбот отвечает только по найденным фрагментам вашей базы и ссылается на источник. Если релевантного фрагмента нет — бот честно говорит, что ответа в базе нет, и не выдумывает. Так мы защищаемся от галлюцинаций — это снимает главный риск ИИ-ботов для бизнеса." },
    { doc: "03_tech_trust.md", section: "Открытый код и демо", text: "Демо-движки выложены открыто, их можно запустить и посмотреть код до оплаты: github.com/ev609/rag-chatbot (чатбот по базе знаний) и github.com/ev609/telegram-bot (Telegram-бот). Живые демо работают прямо на страницах кейсов." },
    { doc: "03_tech_trust.md", section: "Конфиденциальность", text: "Данные клиента остаются у клиента: бот разворачивается на вашей инфраструктуре, ключи и доступы третьим лицам не передаём." },
    { doc: "04_contact.md", section: "Как связаться", text: "Опишите задачу через форму на странице (раздел «Заказать») — укажите контакт (e-mail или @telegram) и в двух словах задачу. Отвечаю по указанному контакту. Данные использую только чтобы ответить." },
    { doc: "04_contact.md", section: "Что прислать для оценки", text: "Чтобы быстро оценить работу, опишите: что за бизнес, что должен делать бот или сервис, где он должен работать (сайт, Telegram, поддержка), и примерный объём (сколько документов в базе знаний, какие интеграции). Этого достаточно для предварительной оценки и цены." },
    { doc: "04_contact.md", section: "Без обязательств", text: "Можно начать с бесплатного разбора задачи или склонировать открытое демо и посмотреть код самостоятельно. Платный пилот на части объёма — чтобы оценить реальную работу до полного внедрения." }
  ];

  var DOCS_EN = [
    { doc: "01_services.md", section: "What we build", text: "We build production Python systems: RAG knowledge-base AI chatbots, Telegram bots, scrapers and data pipelines, API integrations, web services / SaaS MVPs, and 24/7 trading infrastructure." },
    { doc: "01_services.md", section: "AI knowledge-base chatbot", text: "The RAG chatbot answers strictly from your documents with source citations and honestly says 'I don't know' when the answer is not in the knowledge base — zero hallucinations." },
    { doc: "01_services.md", section: "Turnkey Telegram bot", text: "Interactive menus, step-by-step lead capture with instant manager alerts, knowledge-base answers, CRM and payment integrations built on aiogram." },
    { doc: "01_services.md", section: "Scrapers & integrations", text: "Automated web/marketplace data collection, structured exports, and integrations with amoCRM, Bitrix24, Google Sheets, payment gateways, and messengers." },
    { doc: "02_process_pricing.md", section: "How we start", text: "You describe your scope (and share sample documents or a spec if available). We size the work and quote a fixed-scope price or retainer. You can start with a free discovery chat or a small paid pilot." },
    { doc: "02_process_pricing.md", section: "Payment & escrow", text: "Milestone-based billing for fixed-scope builds, monthly for retainers. Payment in USDC/USDT (any chain), bank wire, or RUB. First engagements can use escrow so you judge real work before full payment." },
    { doc: "02_process_pricing.md", section: "Timeline & delivery", text: "Typical timelines: landing page ~5–10 days, standard bot 1–2 weeks, custom integrations or SaaS by scope. Exact delivery date is confirmed after scoping, with buffer for revisions." },
    { doc: "02_process_pricing.md", section: "Pricing & cost", text: "How much it costs (ballpark pricing, exact quote after scoping): Telegram bot costs from 25,000 ₽ · AI knowledge-base chatbot costs from 50,000 ₽ · landing page from 30,000 ₽ · integration/automation from 20,000 ₽ · SaaS MVP from 150,000 ₽." },
    { doc: "02_process_pricing.md", section: "Warranty & handover", text: "2 weeks of free fixes within the agreed spec after delivery. Full source code is handed over and deployed on your server or cloud — all keys and data stay yours." },
    { doc: "03_tech_trust.md", section: "Tech stack", text: "Python 3.13 (FastAPI, asyncio, aiogram), RAG (lexical + semantic search, embeddings, pgvector/Qdrant), PostgreSQL/TimescaleDB, Redis, TypeScript/Svelte 5, Docker." },
    { doc: "03_tech_trust.md", section: "Can the bot hallucinate?", text: "No. The RAG chatbot answers strictly from retrieved passages in your knowledge base and cites the source section. If nothing relevant is found, it explicitly says it does not know instead of inventing facts." },
    { doc: "03_tech_trust.md", section: "Open-source demos", text: "Inspect working code before paying anything: github.com/ev609/rag-chatbot (RAG chatbot) and github.com/ev609/telegram-bot (Telegram bot). Live demos run right on the case pages." },
    { doc: "03_tech_trust.md", section: "Privacy & security", text: "Your data stays on your own infrastructure. We never share keys, credentials, or client data with third parties." },
    { doc: "04_contact.md", section: "How to contact", text: "Describe your task via the inquiry form at the bottom of the page — leave your e-mail or @telegram and a short summary. A real engineer replies directly." },
    { doc: "04_contact.md", section: "What to send for a quote", text: "For a fast estimate, tell us: your business/use case, what the bot should do, where it will run (website, Telegram, support), and rough document volume or integrations." },
    { doc: "04_contact.md", section: "No obligation", text: "Start with a free scoping chat, clone the open-source demo repo yourself, or begin with a small paid pilot via escrow before committing to a full build." }
  ];

  function isAscii(s) { return /^[\x00-\x7F]*$/.test(s); }
  function stem(w) {
    var i, suf;
    if (isAscii(w)) {
      for (i = 0; i < EN_SUF.length; i++) { suf = EN_SUF[i];
        if (w.length - suf.length >= 4 && w.slice(-suf.length) === suf) return w.slice(0, -suf.length); }
      return w;
    }
    for (i = 0; i < RU_SUF.length; i++) { suf = RU_SUF[i];
      if (w.length - suf.length >= 4 && w.slice(-suf.length) === suf) return w.slice(0, -suf.length); }
    return w;
  }
  function tokenize(text) {
    var raw = (text || "").toLowerCase().match(TOKEN_RE) || [], out = [], i, t;
    for (i = 0; i < raw.length; i++) { t = raw[i]; if (t.length > 1 && !STOP.has(t)) out.push(stem(t)); }
    return out;
  }
  function buildIndex(docs) {
    var df = {}, tot = 0;
    var chunks = docs.map(function (d) {
      var toks = tokenize(d.section + " " + d.text);
      tot += toks.length;
      new Set(toks).forEach(function (t) { df[t] = (df[t] || 0) + 1; });
      return { doc: d.doc, section: d.section, text: d.text, tokens: toks };
    });
    return { N: chunks.length, avg_len: tot / chunks.length, doc_freq: df, chunks: chunks };
  }
  var RAG_INDEX = buildIndex(IS_EN ? DOCS_EN : DOCS_RU);

  function idf(term) {
    var n = RAG_INDEX.doc_freq[term] || 0, N = RAG_INDEX.N;
    return Math.log(1 + (N - n + 0.5) / (n + 0.5));
  }
  function score(qTokens, chunk) {
    if (!chunk.tokens.length) return 0;
    var tf = {}, i, t;
    for (i = 0; i < chunk.tokens.length; i++) { t = chunk.tokens[i]; tf[t] = (tf[t] || 0) + 1; }
    var dl = chunk.tokens.length, s = 0;
    for (i = 0; i < qTokens.length; i++) {
      var f = tf[qTokens[i]] || 0; if (!f) continue;
      var denom = f + K1 * (1 - B + B * dl / RAG_INDEX.avg_len);
      s += idf(qTokens[i]) * (f * (K1 + 1)) / denom;
    }
    return s;
  }
  function search(q, topK) {
    var qt = tokenize(q); if (!qt.length) return [];
    var scored = RAG_INDEX.chunks.map(function (c) { return { c: c, s: score(qt, c) }; })
      .filter(function (x) { return x.s > 0; });
    scored.sort(function (a, b) { return b.s - a.s; });
    return scored.slice(0, topK || 4);
  }
  function coverage(q) {
    var qt = new Set(tokenize(q)); if (!qt.size) return 0;
    var known = 0; qt.forEach(function (t) { if ((RAG_INDEX.doc_freq[t] || 0) > 0) known++; });
    return known / qt.size;
  }
  function answer(q) {
    var hits = search(q, 4);
    if (!hits.length || hits[0].s < MIN_RELEVANCE || coverage(q) < MIN_COVERAGE) {
      return {
        ok: false,
        text: IS_EN
          ? "I didn't find that in our service knowledge base — and I won't make it up. Describe your task in the inquiry form below."
          : "В базе о нашем сервисе нет ответа на это — и я не выдумываю. Опишите задачу в разделе «Заказать» ниже.",
        sources: []
      };
    }
    var srcSet = {}; hits.forEach(function (h) { srcSet[h.c.doc + " › " + h.c.section] = 1; });
    return { ok: true, text: hits[0].c.text, sources: Object.keys(srcSet), score: hits[0].s };
  }

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function escape(s) { return s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function init() {
    var log = document.getElementById("rag-log");
    var form = document.getElementById("rag-form");
    var input = document.getElementById("rag-q");
    if (!log || !form || !input) return;

    function addUser(q) { var m = el("div", "rag-msg rag-u", escape(q)); log.appendChild(m); }
    function addBot(res) {
      var m = el("div", "rag-msg rag-b" + (res.ok ? "" : " rag-no"));
      m.appendChild(el("div", "rag-txt", escape(res.text)));
      if (res.sources.length) {
        var src = el("div", "rag-src");
        src.textContent = (IS_EN ? "source: " : "источник: ") + res.sources.map(function (s) { return s.replace(".md", ""); }).join(" · ");
        m.appendChild(src);
      }
      log.appendChild(m);
      log.scrollTop = log.scrollHeight;
    }
    function ask(q) { q = (q || "").trim(); if (!q) return; addUser(q); addBot(answer(q)); log.scrollTop = log.scrollHeight; }

    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; input.focus(); });
    document.querySelectorAll(".rag-chip").forEach(function (c) {
      c.addEventListener("click", function () { input.value = c.textContent; ask(c.textContent); input.value = ""; });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
