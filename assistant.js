/* Плавающий ИИ-ассистент AlfaFond — dogfooding: чат-бот, который мы продаём, прямо на
   сайте отвечает на вопросы о нашем сервисе (цены/сроки/технологии) со ссылкой на раздел
   и честным «не знаю». Тот же BM25-движок, что в github.com/ev609/rag-chatbot, в браузере.
   Самоинъектируемый: один <script src> добавляет и стили, и виджет.
   Поддерживает RU / EN / ZH / ES (автоопределение по html[lang]) и светлую тему [data-theme="light"]. */
(function () {
  "use strict";

  var RAW_LANG = (document.documentElement.lang || "ru").toLowerCase();
  var LANG = RAW_LANG.indexOf("zh") === 0 ? "zh"
    : RAW_LANG.indexOf("es") === 0 ? "es"
    : RAW_LANG.indexOf("en") === 0 ? "en" : "ru";

  var DOCS = {
    ru: [
      { section: "Что мы делаем", text: "Разрабатываем на Python: ИИ-чатботы с базой знаний (RAG), Telegram-боты, парсеры и сбор данных, интеграции и API, автоматизацию бизнес-процессов. Отдельная экспертиза — торговая инфраструктура (биржевые коннекторы, реальное время, бэктесты), на ней отработаны надёжность и работа 24/7." },
      { section: "ИИ-чатбот по базе знаний", text: "Бот отвечает на вопросы по вашим документам со ссылками на источник и честно говорит «не знаю», когда ответа в базе нет — без выдумок. Подходит для поддержки клиентов и сотрудников. Открытое демо и описание — в кейсе «ИИ-чатбот по базе знаний»." },
      { section: "Telegram-бот под ключ", text: "Меню, пошаговый приём заявок с уведомлением менеджеру, ответы на вопросы, интеграции с CRM и оплатами. Открытое демо — в кейсе «Telegram-бот под ключ»." },
      { section: "Парсеры и интеграции", text: "Сбор данных с сайтов и маркетплейсов, выгрузка в нужный формат, интеграции с amoCRM, Bitrix24, Google Sheets, платёжными системами и мессенджерами." },
      { section: "Как начинаем", text: "Вы описываете задачу (и присылаете пример документов или ТЗ, если есть). Я оцениваю объём и называю фиксированную цену или формат почасовой/ретейнер. Дальше — сборка, показ результата на ваших данных, передача с документацией. Можно начать с бесплатного разбора задачи или платного пилота на части объёма." },
      { section: "Как происходит оплата", text: "Оплата по этапам. Оплатить можно в рублях, для прямых заказов — также в USDT/USDC. Для первых заказов оплата идёт через безопасную сделку биржи или эскроу, чтобы вы судили о реальной работе до полной оплаты. Деньги клиента в управление не берём." },
      { section: "Сроки", text: "Сроки зависят от объёма: лендинг — примерно 5–10 дней, типовой бот — 1–2 недели, интеграция — по объёму. Точный срок называем после обсуждения задачи, всегда с запасом на правки." },
      { section: "Сколько стоит", text: "Это ориентиры, точная стоимость — после обсуждения. Telegram-бот (телеграм-бот): цена 25 000 ₽ и выше. ИИ-чатбот с базой знаний: стоит 50 000 ₽ и выше. Лендинг: 30 000 ₽ и выше. Интеграция или автоматизация: 20 000 ₽ и выше. Цена зависит от сложности, объёма базы знаний и нужных интеграций." },
      { section: "Гарантии и передача", text: "После сдачи — бесплатные правки по согласованному ТЗ в течение 2 недель. Код передаём вам, разворачиваем на вашем сервере или в вашем облаке; доступы и данные остаются у вас." },
      { section: "Стек", text: "Python — основной язык. ИИ-чатботы строим на RAG: поиск по вашим документам (лексический и семантический, эмбеддинги, векторное хранилище pgvector/Qdrant) и ответ строго по найденному. Telegram-боты — на aiogram. Бэкенды и API — на FastAPI. Развёртывание на вашем сервере или в облаке, с мониторингом и работой 24/7." },
      { section: "Может ли бот выдумать ответ", text: "Нет. ИИ-чатбот отвечает только по найденным фрагментам вашей базы и ссылается на источник. Если релевантного фрагмента нет — бот честно говорит, что ответа в базе нет, и не выдумывает. Так мы защищаемся от галлюцинаций — это снимает главный риск ИИ-ботов для бизнеса." },
      { section: "Открытый код и демо", text: "Демо-движки выложены открыто, их можно запустить и посмотреть код до оплаты: github.com/ev609/rag-chatbot (чатбот по базе знаний) и github.com/ev609/telegram-bot (Telegram-бот). Живые демо работают прямо на страницах кейсов." },
      { section: "Конфиденциальность", text: "Данные клиента остаются у клиента: бот разворачивается на вашей инфраструктуре, ключи и доступы третьим лицам не передаём." },
      { section: "Как связаться", text: "Опишите задачу через форму на странице (раздел «Заказать») — укажите контакт (e-mail или @telegram) и в двух словах задачу. Отвечаю по указанному контакту. Данные использую только чтобы ответить." },
      { section: "Что прислать для оценки", text: "Чтобы быстро оценить работу, опишите: что за бизнес, что должен делать бот или сервис, где он должен работать (сайт, Telegram, поддержка), и примерный объём (сколько документов в базе знаний, какие интеграции). Этого достаточно для предварительной оценки и цены." },
      { section: "Без обязательств", text: "Можно начать с бесплатного разбора задачи или склонировать открытое демо и посмотреть код самостоятельно. Платный пилот на части объёма — чтобы оценить реальную работу до полного внедрения." }
    ],
    en: [
      { section: "What we build", text: "We build production Python systems: RAG knowledge-base AI chatbots, Telegram bots, scrapers and data pipelines, API integrations, web services / SaaS MVPs, and trading infrastructure (exchange connectors, real-time 24/7 execution, honest out-of-sample backtesting)." },
      { section: "AI knowledge-base chatbot", text: "Our RAG chatbot answers strictly from your documents with source citations and honestly says 'I don't know' when the answer is missing — no hallucinations. Ideal for customer and internal support. Open demo: github.com/ev609/rag-chatbot." },
      { section: "Turnkey Telegram bot", text: "Interactive menus, step-by-step lead capture with instant manager alerts, knowledge-base answers, CRM and payment integrations built on aiogram. Open demo: github.com/ev609/telegram-bot." },
      { section: "Scrapers & integrations", text: "Automated web/marketplace data collection, structured exports, and integrations with amoCRM, Bitrix24, Google Sheets, payment gateways, webhooks, and messengers." },
      { section: "How we start", text: "Describe your scope (and share sample documents or a spec if you have one). We estimate the work and quote a fixed-scope price or retainer. You can start with a free discovery chat or a low-risk paid pilot." },
      { section: "Payment & escrow", text: "Milestone-based billing for fixed-scope projects, monthly for retainers. Payment in USDC/USDT (any chain), bank wire, or RUB. First engagements can use escrow so you judge real work before full payment. Zero custody of client funds." },
      { section: "Timeline & delivery", text: "Typical timelines: landing page ~5–10 days, standard Telegram or RAG bot 1–2 weeks, custom integrations or SaaS by scope. Exact delivery date is confirmed after scoping, with buffer for revisions." },
      { section: "Pricing & cost", text: "How much it costs (ballpark pricing, exact quote after scoping): Telegram bot costs from 25,000 ₽ · AI knowledge-base chatbot costs from 50,000 ₽ · landing page from 30,000 ₽ · integration/automation from 20,000 ₽ · SaaS MVP from 150,000 ₽. Final price depends on scope, document volume, and integrations." },
      { section: "Warranty & handover", text: "2 weeks of free fixes within the agreed spec after delivery. Full source code is handed over and deployed to your server or cloud — all keys, credentials, and data stay strictly yours." },
      { section: "Tech stack", text: "Core stack: Python 3.13 (FastAPI, asyncio, aiogram), RAG (lexical + semantic search, embeddings, pgvector/Qdrant), PostgreSQL/TimescaleDB, Redis, TypeScript/Svelte 5, Docker, with 24/7 monitoring." },
      { section: "Can the bot hallucinate?", text: "No. The RAG chatbot answers strictly from retrieved passages in your knowledge base and cites the source section. If nothing relevant is found, it explicitly says it does not know instead of inventing facts." },
      { section: "Open-source demos", text: "Inspect working code before paying anything: github.com/ev609/rag-chatbot (RAG chatbot), github.com/ev609/telegram-bot (Telegram bot), and github.com/ev609/strategy-lab (out-of-sample strategy validation)." },
      { section: "Privacy & security", text: "Your data stays on your own infrastructure. We never share keys, credentials, or client data with third parties, and we never take custody of trading funds." },
      { section: "How to contact", text: "Leave your e-mail or @telegram handle right here in chat or via the inquiry form on alfafond.com/dev/. A real engineer replies directly — contact details are used only to respond." },
      { section: "What to send for a quote", text: "For a fast estimate, tell us: your business/use case, what the bot or service should do, where it will run (website, Telegram, internal), and rough volume (number of docs or integrations)." },
      { section: "No obligation", text: "Start with a free scoping chat, run our open-source demos yourself, or begin with a small paid pilot via escrow before committing to a full build." }
    ],
    zh: [
      { section: "核心服务", text: "我们专注 Python 生产级开发：基于企业知识库的 RAG 智能客服机器人、Telegram 机器人、数据采集与 API 集成、Web/SaaS MVP 以及 7×24 交易基础设施与回测验证。" },
      { section: "知识库 AI 聊天机器人", text: "严格依据您的文档检索作答并附带来源章节；知识库中没有答案时诚实回复“不知道”，杜绝模型胡编乱造。开源演示：github.com/ev609/rag-chatbot。" },
      { section: "Telegram 机器人定制", text: "交互菜单、分步线索收集与经理实时通知、知识库问答、CRM 与支付对接，基于 aiogram 构建。开源演示：github.com/ev609/telegram-bot。" },
      { section: "爬虫与系统集成", text: "网站与平台数据抓取、结构化导出，以及与 CRM、Google Sheets、支付接口和即时通讯工具的自动化对接。" },
      { section: "合作流程", text: "您先简述需求（可附文档样本或说明），我们评估工作量并给出固定报价或按月协作方案。可从免费需求沟通或小规模付费试点开始。" },
      { section: "付款方式与托管", text: "按里程碑分阶段付款，支持 USDC/USDT（多链）、银行转账或卢布结算。首次合作支持担保托管（escrow），先看实际成果再付尾款。不托管任何客户交易资金。" },
      { section: "开发周期", text: "常见周期：落地页约 5–10 天，常规 Telegram 或 RAG 机器人约 1–2 周，复杂集成或 SaaS 视需求评估，均预留修改缓冲时间。" },
      { section: "价格参考（多少钱）", text: "常见项目多少钱（参考起步价，具体以需求评估为准）：Telegram 机器人 25,000 ₽ 起，知识库 AI 聊天机器人 50,000 ₽ 起，落地页 30,000 ₽ 起，集成自动化 20,000 ₽ 起，SaaS MVP 150,000 ₽ 起。支持 USDT/USDC 折算结算。" },
      { section: "质保与源码交付", text: "交付后提供 2 周协议范围内免费修复。完整源码交付并部署至您的服务器或云端，所有密钥和数据完全归您所有。" },
      { section: "技术栈", text: "Python 3.13（FastAPI、asyncio、aiogram）、RAG（混合检索 + 向量库 pgvector/Qdrant）、PostgreSQL/TimescaleDB、Redis、TypeScript/Svelte 5、Docker。" },
      { section: "机器人会胡说八道吗？", text: "不会。RAG 机器人仅根据检索到的知识库片段回答并标注来源；若找不到相关内容，会直接说明知识库中没有该信息，有效防止 AI 幻觉。" },
      { section: "开源代码与演示", text: "付款前即可查看并运行公开代码：github.com/ev609/rag-chatbot、github.com/ev609/telegram-bot 与 github.com/ev609/strategy-lab。" },
      { section: "隐私与安全", text: "所有数据保留在您的基础设施中，绝不向第三方共享密钥或文档，也绝不接触或托管客户资金。" },
      { section: "联系方式", text: "直接在当前聊天框或 alfafond.com/dev/ 表单留下邮箱或 @telegram 账号即可，由工程师本人直接回复。" },
      { section: "估价所需信息", text: "简述业务场景、机器人要完成的功能、部署平台（网站/Telegram/内部系统）及大致文档量或对接需求，即可快速给出估价。" },
      { section: "零门槛开始", text: "可先免费沟通需求，或直接运行我们的开源 Demo，也可通过托管先做小范围试点验证。" }
    ],
    es: [
      { section: "Qué desarrollamos", text: "Desarrollamos sistemas en Python listos para producción: chatbots de IA con base de conocimiento (RAG), bots de Telegram, scrapers e integraciones API, servicios web / SaaS MVP e infraestructura de trading 24/7 con backtesting honesto." },
      { section: "Chatbot IA con base de conocimiento", text: "Responde estrictamente según tus documentos citando la fuente y dice honestamente «no lo sé» cuando no hay respuesta en la base, sin alucinaciones. Demo abierta: github.com/ev609/rag-chatbot." },
      { section: "Bot de Telegram llave en mano", text: "Menús, captura de leads paso a paso con alertas al equipo, respuestas automáticas e integraciones con CRM y pagos usando aiogram. Demo: github.com/ev609/telegram-bot." },
      { section: "Scrapers e integraciones", text: "Recolección de datos web, exportación estructurada e integraciones con amoCRM, Bitrix24, Google Sheets, pasarelas de pago y mensajería." },
      { section: "Cómo empezamos", text: "Nos describes el objetivo (y compartes ejemplos de documentos o especificación si tienes). Evaluamos el alcance y damos precio cerrado o modalidad mensual. Puedes empezar con un análisis gratuito o un piloto acotado." },
      { section: "Pago y escrow", text: "Pago por hitos en proyectos de alcance cerrado o mensual en retainer. Aceptamos USDC/USDT (cualquier red), transferencia bancaria o RUB. En primeros proyectos podemos trabajar con escrow. Nunca custodiamos fondos del cliente." },
      { section: "Plazos de entrega", text: "Plazos habituales: landing page ~5–10 días, bot estándar 1–2 semanas, integraciones o SaaS según alcance. Siempre confirmamos fecha exacta con margen para ajustes." },
      { section: "Precios y cuánto cuesta", text: "Cuánto cuesta cada proyecto (precios orientativos, presupuesto exacto tras revisar el alcance): bot de Telegram desde 25.000 ₽ · chatbot IA con base de conocimiento desde 50.000 ₽ · landing desde 30.000 ₽ · integración/automatización desde 20.000 ₽ · SaaS MVP desde 150.000 ₽. Pagable en USDC/USDT o transferencia." },
      { section: "Garantía y entrega", text: "2 semanas de correcciones gratuitas dentro del alcance acordado tras la entrega. Entregamos el código completo y lo desplegamos en tu servidor o nube; tus claves y datos son siempre tuyos." },
      { section: "Stack tecnológico", text: "Python 3.13 (FastAPI, asyncio, aiogram), RAG (búsqueda léxica y semántica, embeddings, pgvector/Qdrant), PostgreSQL/TimescaleDB, Redis, TypeScript/Svelte 5 y Docker." },
      { section: "¿Puede el bot inventar respuestas?", text: "No. El chatbot RAG responde solo a partir de los fragmentos recuperados de tu base y cita la sección fuente. Si no encuentra información relevante, lo dice claramente en lugar de alucinar." },
      { section: "Código abierto y demos", text: "Puedes revisar el código y probar demos antes de pagar nada: github.com/ev609/rag-chatbot, github.com/ev609/telegram-bot y github.com/ev609/strategy-lab." },
      { section: "Privacidad y seguridad", text: "Tus datos permanecen en tu propia infraestructura. No compartimos claves ni accesos con terceros y nunca custodiamos fondos de clientes." },
      { section: "Cómo contactar", text: "Deja tu e-mail o @telegram aquí mismo en el chat o en el formulario de alfafond.com/dev/. Un ingeniero responde personalmente." },
      { section: "Qué enviar para cotizar", text: "Cuéntanos brevemente tu negocio, qué debe hacer el bot o servicio, dónde operará (web, Telegram, soporte interno) y el volumen aproximado de documentos o integraciones." },
      { section: "Sin compromiso", text: "Puedes empezar con una consulta gratuita, probar nuestras demos de código abierto o arrancar con un pequeño piloto mediante escrow." }
    ]
  };

  var I18N = {
    ru: {
      launchAria: "Открыть чат-ассистент",
      hideAria: "Скрыть",
      closeAria: "Закрыть",
      sendAria: "Отправить",
      inputAria: "Вопрос",
      nudgeTop: "Вопросы по сервису?",
      nudgeCta: "Спросите ИИ-ассистента",
      headTitle: "ИИ-ассистент AlfaFond",
      headSub: "отвечает по нашему сервису · демо продукта",
      placeholder: "Спросите про сервис…",
      foot: "RAG-движок в браузере · ответы по базе о сервисе",
      greeting: "Здравствуйте! Я ИИ-ассистент AlfaFond — отвечаю по нашему сервису со ссылкой на раздел. Спросите про цены, сроки или технологии (это и есть тот бот, которого мы делаем).",
      noAnswer: "Не нашёл это в базе о сервисе — и не выдумываю. Опишите задачу в разделе «Заказать», отвечу лично.",
      srcPrefix: "раздел: ",
      chips: ["Сколько стоит чат-бот?", "Какие сроки?", "Бот может выдумать ответ?", "Как происходит оплата?"],
      high: ["стоит","стоимост","цена","сколько","бюджет","срок","когда","как начать","начать","заказ","оплат","эскроу","usdt","договор"],
      taskOpts: ["ИИ-чатбот по базе знаний", "Telegram-бот", "Парсер / интеграция", "Другое — напишу сам"],
      otherMark: "Другое",
      ctaEstimate: "Оценить мою задачу →",
      ctaBrowse: "Просто смотрю",
      ctaHuman: "Передать вопрос человеку →",
      cancelLabel: "← Отмена",
      cancelReply: "Без проблем — смотрите, сколько нужно. Будет вопрос по цене, срокам или технологиям — спрашивайте, я рядом.",
      askTask: "Опишу пару вопросов — задача, объём, контакт. Это быстро. Что нужно сделать и где будет работать?",
      askTaskFree: "Опишите задачу в двух словах.",
      askScope: "Примерный объём — для точной оценки: сколько документов в базе и какие интеграции (CRM, оплаты, Sheets)? Не знаете — пропустите.",
      skipLabel: "Пропустить",
      skipUser: "(пропустить)",
      notSpecified: "не указан",
      askContact: "Куда прислать оценку? Оставьте e-mail или @telegram — отвечу лично. Данные использую только чтобы ответить, третьим лицам не передаю.",
      badContact: "Кажется, это не похоже на e-mail или @telegram. Проверьте — куда удобнее ответить?",
      confirmText: function (l) { return "Проверим:\n• Задача: " + (l.task || "—") + "\n• Объём: " + (l.scope || "не указан") + "\n• Контакт: " + l.contact + "\n\nОтправляю — заявку получит живой человек и ответит лично."; },
      sendLead: "Отправить →",
      editLead: "Поправить",
      sending: "Отправляю…",
      leadOk: function (c) { return "Готово — заявка ушла на " + c + ". Её получит живой человек (я бот-ассистент, заявку передал) и ответит лично. Пока можно глянуть открытый код: github.com/ev609/rag-chatbot"; },
      leadErr: "Не получилось отправить из чата. Продублируйте контакт и задачу через форму на странице — она шлёт на ту же почту.",
      openForm: "Открыть форму заявки",
      useButtons: "Нажмите кнопку ниже, чтобы продолжить.",
      formSending: "Отправляю…",
      formOk: "✓ Заявка отправлена — отвечу лично по указанному контакту. Спасибо!",
      formErr: "Не удалось отправить — проверьте соединение и попробуйте ещё раз, или напишите на контакт в подвале."
    },
    en: {
      launchAria: "Open AI assistant chat",
      hideAria: "Dismiss",
      closeAria: "Close",
      sendAria: "Send",
      inputAria: "Question",
      nudgeTop: "Questions about our work?",
      nudgeCta: "Ask the AI assistant",
      headTitle: "AlfaFond AI Assistant",
      headSub: "answers from our docs · live product demo",
      placeholder: "Ask about pricing, stack, timeline…",
      foot: "In-browser RAG engine · zero hallucinations",
      greeting: "Hi! I'm the AlfaFond AI assistant — I answer questions about our services with source citations. Ask about pricing, timelines, or stack (this is the actual RAG bot we build).",
      noAnswer: "I didn't find that in our service docs — and I won't make it up. Leave your question or scope and an engineer will reply directly.",
      srcPrefix: "section: ",
      chips: ["How much does a chatbot cost?", "What are the timelines?", "Can the bot hallucinate?", "How does payment work?"],
      high: ["cost","price","pricing","much","budget","timeline","long","days","week","start","hire","order","pay","payment","escrow","usdt","usdc","quote"],
      taskOpts: ["RAG knowledge-base chatbot", "Telegram bot", "Scraper / API integration", "Other — I'll describe it"],
      otherMark: "Other",
      ctaEstimate: "Estimate my project →",
      ctaBrowse: "Just browsing",
      ctaHuman: "Ask a human engineer →",
      cancelLabel: "← Cancel",
      cancelReply: "No problem — take your time. If any questions come up about pricing, timelines, or tech, I'm right here.",
      askTask: "Just 3 quick questions — task, scope, and contact. What do you need built and where will it run?",
      askTaskFree: "Describe your task in a sentence or two.",
      askScope: "Rough scope for an accurate quote: how many documents or which integrations (CRM, payments, Sheets)? Skip if unsure.",
      skipLabel: "Skip",
      skipUser: "(skip)",
      notSpecified: "not specified",
      askContact: "Where should we send the estimate? Leave your e-mail or @telegram — an engineer replies personally. Used only to respond.",
      badContact: "That doesn't look like an e-mail or @telegram handle. Please double-check where to reach you.",
      confirmText: function (l) { return "Let's double-check:\n• Task: " + (l.task || "—") + "\n• Scope: " + (l.scope || "not specified") + "\n• Contact: " + l.contact + "\n\nSending — a real engineer receives this and replies personally."; },
      sendLead: "Send →",
      editLead: "Edit",
      sending: "Sending…",
      leadOk: function (c) { return "Done — sent with contact " + c + ". A real engineer (I'm the assistant bot handing this over) will reply personally. Meanwhile, inspect our open code: github.com/ev609/rag-chatbot"; },
      leadErr: "Couldn't submit from chat right now. Please send your inquiry via the form on /dev/ — it goes to the same inbox.",
      openForm: "Open inquiry form",
      useButtons: "Please pick one of the buttons below to continue.",
      formSending: "Sending…",
      formOk: "✓ Inquiry sent — I'll reply directly to the contact you gave. Thank you!",
      formErr: "Could not send — please check your connection and try again."
    },
    zh: {
      launchAria: "打开 AI 助手聊天",
      hideAria: "关闭提示",
      closeAria: "关闭",
      sendAria: "发送",
      inputAria: "输入问题",
      nudgeTop: "有定制开发或服务疑问？",
      nudgeCta: "询问 AI 助手",
      headTitle: "AlfaFond AI 助手",
      headSub: "基于服务文档检索回答 · 产品演示",
      placeholder: "询问价格、周期或技术栈…",
      foot: "浏览器本地 RAG 引擎 · 严格按文档回答",
      greeting: "您好！我是 AlfaFond AI 助手，严格依据我们的服务文档回答并附来源章节。可以询问价格、周期、付款或技术栈（这就是我们交付的同款 RAG 机器人）。",
      noAnswer: "文档中未找到相关内容，我不会随意编造。您可以留下需求，工程师会亲自回复。",
      srcPrefix: "来源：",
      chips: ["聊天机器人多少钱？", "开发周期多久？", "机器人会胡说八道吗？", "如何付款和托管？"],
      high: ["价格","多少","钱","费用","报价","预算","周期","多久","时间","合作","定制","付款","支付","托管","usdt","usdc","price","cost"],
      taskOpts: ["知识库 RAG 机器人", "Telegram 机器人", "数据采集 / API 集成", "其他 — 手动填写"],
      otherMark: "其他",
      ctaEstimate: "帮我评估需求 →",
      ctaBrowse: "先看看",
      ctaHuman: "转人工工程师 →",
      cancelLabel: "← 取消",
      cancelReply: "没问题，您随时浏览。如有关于价格、周期或技术的疑问，随时问我。",
      askTask: "只需 3 个简短问题（需求、规模、联系方式）。您想做什么系统，部署在哪里？",
      askTaskFree: "请用一两句话描述您的需求。",
      askScope: "大致规模（便于准确估价）：文档数量或需要对接哪些系统（CRM、支付、表格）？不确定可跳过。",
      skipLabel: "跳过",
      skipUser: "（跳过）",
      notSpecified: "未指定",
      askContact: "请留下您的邮箱或 @telegram 账号，工程师会亲自回复。仅用于回复本次咨询。",
      badContact: "看起来不太像邮箱或 @telegram 账号，请检查后再输入一次。",
      confirmText: function (l) { return "请确认信息：\n• 需求：" + (l.task || "—") + "\n• 规模：" + (l.scope || "未指定") + "\n• 联系：" + l.contact + "\n\n发送后将由工程师本人直接回复。"; },
      sendLead: "发送 →",
      editLead: "修改",
      sending: "正在发送…",
      leadOk: function (c) { return "已发送，联系方式：" + c + "。工程师本人会尽快与您联系。等待期间可先查看开源代码：github.com/ev609/rag-chatbot"; },
      leadErr: "聊天框提交失败，请通过 /dev/ 页面表单提交，邮件会发往同一邮箱。",
      openForm: "打开需求表单",
      useButtons: "请点击下方按钮继续。",
      formSending: "正在发送…",
      formOk: "✓ 已提交 — 工程师会通过您留下的方式回复，感谢！",
      formErr: "发送失败，请检查网络连接后重试。"
    },
    es: {
      launchAria: "Abrir chat del asistente IA",
      hideAria: "Ocultar",
      closeAria: "Cerrar",
      sendAria: "Enviar",
      inputAria: "Pregunta",
      nudgeTop: "¿Dudas sobre nuestros servicios?",
      nudgeCta: "Pregunta al asistente IA",
      headTitle: "Asistente IA AlfaFond",
      headSub: "responde según nuestra documentación · demo",
      placeholder: "Pregunta sobre precios, plazos o stack…",
      foot: "Motor RAG en navegador · sin alucinaciones",
      greeting: "¡Hola! Soy el asistente IA de AlfaFond: respondo sobre nuestros servicios citando la sección fuente. Pregunta por precios, plazos o tecnología (es el mismo bot RAG que desarrollamos).",
      noAnswer: "No encontré esa información en nuestra base de servicio y prefiero no inventar. Deja tu consulta y un ingeniero te responderá personalmente.",
      srcPrefix: "sección: ",
      chips: ["¿Cuánto cuesta un chatbot?", "¿Cuáles son los plazos?", "¿Puede inventar respuestas?", "¿Cómo funciona el pago?"],
      high: ["cuesta","precio","precios","presupuesto","plazo","plazos","tiempo","días","semana","empezar","contratar","pago","pagar","escrow","usdt","usdc","cotizar"],
      taskOpts: ["Chatbot IA con base de datos (RAG)", "Bot de Telegram", "Scraper / integración API", "Otro — lo describo"],
      otherMark: "Otro",
      ctaEstimate: "Cotizar mi proyecto →",
      ctaBrowse: "Solo estoy mirando",
      ctaHuman: "Pasar consulta a un ingeniero →",
      cancelLabel: "← Cancelar",
      cancelReply: "Sin problema, tómate tu tiempo. Si tienes dudas sobre precios, plazos o stack, aquí estoy.",
      askTask: "Solo 3 preguntas rápidas: proyecto, alcance y contacto. ¿Qué necesitas desarrollar y dónde funcionará?",
      askTaskFree: "Describe brevemente tu proyecto.",
      askScope: "Alcance aproximado para cotizar mejor: ¿cuántos documentos o qué integraciones (CRM, pagos, Sheets)? Puedes omitirlo.",
      skipLabel: "Omitir",
      skipUser: "(omitir)",
      notSpecified: "no especificado",
      askContact: "¿Dónde te enviamos la estimación? Deja tu e-mail o @telegram — responderá un ingeniero. Solo lo usamos para contestar.",
      badContact: "No parece un e-mail ni un usuario de @telegram válido. Compruébalo por favor.",
      confirmText: function (l) { return "Revisemos:\n• Proyecto: " + (l.task || "—") + "\n• Alcance: " + (l.scope || "no especificado") + "\n• Contacto: " + l.contact + "\n\nAl enviar, un ingeniero real recibirá tu consulta y responderá personalmente."; },
      sendLead: "Enviar →",
      editLead: "Corregir",
      sending: "Enviando…",
      leadOk: function (c) { return "Listo — enviado con contacto " + c + ". Un ingeniero real te responderá personalmente. Mientras tanto puedes revisar nuestro código abierto: github.com/ev609/rag-chatbot"; },
      leadErr: "No se pudo enviar desde el chat. Puedes usar el formulario en /dev/, llega al mismo correo.",
      openForm: "Abrir formulario",
      useButtons: "Pulsa uno de los botones de abajo para continuar.",
      formSending: "Enviando…",
      formOk: "✓ Solicitud enviada — responderemos directamente al contacto indicado. ¡Gracias!",
      formErr: "No se pudo enviar — comprueba tu conexión e inténtalo de nuevo."
    }
  };

  var UI = I18N[LANG] || I18N.en;

  var STOP = new Set((
    "и в во не что он на я с со как а то все она так его но да ты к у же вы за бы по ее мне о из ли если или был для " +
    "the a an to of in is it and or for how do does i you can what with my this that are our your we be on at by from " +
    "el la los las un una de del en y o para por con que es son como qué cuál cuáles cuánto cómo se su sus tu tus mi mis un unos unas"
  ).split(" "));

  var RU_SUF = ["иями","ями","ами","ость","ение","ания","ения","ться","тся","ишь","ешь","ите","ете","ают","яют","уют",
    "ает","яет","ого","его","ому","ему","ыми","ими","ых","их","ая","яя","ою","ею","ое","ее","ый","ий","ой","ом","ем",
    "ах","ях","ов","ев","ью","ия","ие","ть","ел","ал","ил","ыл","ла","ло","ли","на","но","ны","ет","ит","ут","ют","ат",
    "ят","ам","ям","а","я","о","е","ы","и","у","ю","ь"];
  var EN_SUF = ["ation","ment","ness","ing","ies","ed","es","s"];
  var ES_SUF = ["aciones","ación","miento","iendo","ando","mente","ar","er","ir","es","s"];
  var WORD_RE = /[a-zA-Z0-9а-яёА-ЯЁáéíóúüñÁÉÍÓÚÜÑ]+/g;
  var CJK_RE = /[\u4e00-\u9fff]+/g;
  var CJK_STOP = new Set("的 了 是 在 我 有 和 就 不 人 都 一 一个 上 也 很 到 说 要 去 你 会 着 没有 看 好 自己 这 那 吗 呢 吧 啊 怎么 什么 如何 哪 哪些 多少 可以 能否 吗".split(" "));

  function normEs(s) {
    return s.replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u");
  }
  function stemWord(w) {
    var i, s, sufs = LANG === "ru" ? RU_SUF : (LANG === "es" ? ES_SUF : EN_SUF);
    if (/^[a-z0-9]+$/.test(w) && LANG === "ru") sufs = EN_SUF;
    if (LANG === "es") w = normEs(w);
    for (i = 0; i < sufs.length; i++) {
      s = sufs[i];
      if (w.length - s.length >= 4 && w.slice(-s.length) === s) return w.slice(0, -s.length);
    }
    return w;
  }
  function tokenize(t) {
    var str = (t || "").toLowerCase(), out = [];
    var words = str.match(WORD_RE) || [];
    for (var i = 0; i < words.length; i++) {
      var x = words[i];
      if (x.length > 1 && !STOP.has(x) && !STOP.has(normEs(x))) out.push(stemWord(x));
    }
    var cjk = str.match(CJK_RE) || [];
    for (var j = 0; j < cjk.length; j++) {
      var seg = cjk[j];
      for (var k = 0; k < seg.length; k++) {
        var ch = seg[k];
        if (!CJK_STOP.has(ch)) out.push(ch);
        if (k + 1 < seg.length) {
          var bg = seg.slice(k, k + 2);
          if (!CJK_STOP.has(bg)) out.push(bg);
        }
      }
    }
    return out;
  }

  function buildIndex(rawDocs) {
    var doc_freq = {}, totalLen = 0;
    var chunks = rawDocs.map(function (d) {
      var toks = tokenize(d.section + " " + d.text);
      totalLen += toks.length;
      var uniq = new Set(toks);
      uniq.forEach(function (tok) { doc_freq[tok] = (doc_freq[tok] || 0) + 1; });
      return { section: d.section, text: d.text, tokens: toks };
    });
    return { N: chunks.length, avg_len: totalLen / Math.max(1, chunks.length), doc_freq: doc_freq, chunks: chunks };
  }

  var K1 = 1.5, B = 0.75, MIN_RELEVANCE = LANG === "zh" ? 1.5 : 1.15, MIN_COVERAGE = LANG === "zh" ? 0.28 : 0.35;
  var IDX = buildIndex(DOCS[LANG] || DOCS.en);

  function idf(t) { var n = IDX.doc_freq[t] || 0, N = IDX.N; return Math.log(1 + (N - n + 0.5) / (n + 0.5)); }
  function score(q, c) {
    if (!c.tokens.length) return 0;
    var tf = {}, i, t;
    for (i = 0; i < c.tokens.length; i++) { t = c.tokens[i]; tf[t] = (tf[t] || 0) + 1; }
    var dl = c.tokens.length, s = 0;
    for (i = 0; i < q.length; i++) {
      var f = tf[q[i]] || 0;
      if (!f) continue;
      var d = f + K1 * (1 - B + B * dl / IDX.avg_len);
      s += idf(q[i]) * (f * (K1 + 1)) / d;
    }
    return s;
  }
  function search(q) {
    var qt = tokenize(q);
    if (!qt.length) return [];
    var sc = IDX.chunks.map(function (c) { return { c: c, s: score(qt, c) }; }).filter(function (x) { return x.s > 0; });
    sc.sort(function (a, b) { return b.s - a.s; });
    return sc.slice(0, 4);
  }
  function coverage(q) {
    var qt = new Set(tokenize(q));
    if (!qt.size) return 0;
    var k = 0;
    qt.forEach(function (t) { if ((IDX.doc_freq[t] || 0) > 0) k++; });
    return k / qt.size;
  }
  function answer(q) {
    var h = search(q);
    if (!h.length || h[0].s < MIN_RELEVANCE || coverage(q) < MIN_COVERAGE) return { ok: false, text: UI.noAnswer, src: "" };
    return { ok: true, text: h[0].c.text, src: h[0].c.section };
  }

  // Экспорт функции ответа для автотестов в Node (если DOM отсутствует)
  if (typeof window === "undefined" || typeof document === "undefined") return;

  var CSS = "\
@keyframes afaPulse{0%{transform:scale(1);opacity:.45}36%{transform:scale(1.44);opacity:0}100%{transform:scale(1.44);opacity:0}}\
@keyframes afaIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}\
.afa-launch{position:fixed;right:24px;bottom:24px;width:56px;height:56px;border-radius:50%;border:none;cursor:pointer;\
background:linear-gradient(135deg,#4ae39e 0%,#25b876 100%);color:#07120c;display:flex;align-items:center;justify-content:center;z-index:99998;\
box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 10px 28px rgba(37,184,118,.34),0 2px 6px rgba(0,0,0,.35);\
transition:transform .18s cubic-bezier(.16,1,.3,1),box-shadow .18s ease,opacity .18s ease}\
.afa-launch::before{content:'';position:absolute;inset:0;border-radius:50%;border:1.5px solid rgba(74,227,158,.65);\
pointer-events:none;animation:afaPulse 4.6s cubic-bezier(.22,1,.36,1) infinite}\
.afa-launch:hover{transform:translateY(-2px) scale(1.03);box-shadow:inset 0 1px 0 rgba(255,255,255,.38),0 14px 34px rgba(37,184,118,.42),0 4px 10px rgba(0,0,0,.4)}\
.afa-launch:hover::before,.afa-launch:focus-visible::before,.afa-launch.afa-hidden::before{animation:none;opacity:0}\
.afa-launch:active{transform:scale(.95)}\
.afa-launch:focus-visible{outline:2px solid #4ae39e;outline-offset:3px}\
.afa-launch.afa-hidden{opacity:0;transform:scale(.82);pointer-events:none}\
.afa-launch svg{width:24px;height:24px;display:block}\
.afa-nudge{position:fixed;right:92px;bottom:24px;max-width:264px;background:rgba(18,20,26,.92);color:#f4f5f7;\
backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);\
border:1px solid rgba(255,255,255,.12);border-radius:13px;padding:10px 32px 10px 14px;\
font:400 13px/1.4 'Golos Text','PingFang SC','Microsoft YaHei',sans-serif;z-index:99997;\
box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 12px 32px rgba(0,0,0,.45);cursor:pointer;\
opacity:0;transform:translateY(8px) scale(.97);transition:opacity .26s ease,transform .28s cubic-bezier(.16,1,.3,1),border-color .18s ease}\
.afa-nudge.show{opacity:1;transform:translateY(0) scale(1)}\
.afa-nudge:hover{border-color:rgba(62,207,142,.38)}\
.afa-nudge::after{content:'';position:absolute;right:-5px;top:50%;width:9px;height:9px;margin-top:-4.5px;\
background:#12141a;border-top:1px solid rgba(255,255,255,.12);border-right:1px solid rgba(255,255,255,.12);\
transform:rotate(45deg);transition:border-color .18s ease}\
.afa-nudge:hover::after{border-color:rgba(62,207,142,.38)}\
.afa-nt{display:block;font-size:12px;color:#a0a6b0;margin-bottom:2px}\
.afa-nb{display:inline-flex;align-items:center;gap:4px;font-size:13.5px;font-weight:500;color:#3ecf8e}\
.afa-arr{display:inline-block;transition:transform .18s ease}\
.afa-nudge:hover .afa-arr{transform:translateX(3px)}\
.afa-nudge .afa-x{position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:6px;background:transparent;\
border:none;color:#717784;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;\
transition:background .15s ease,color .15s ease}\
.afa-nudge .afa-x:hover{background:rgba(255,255,255,.08);color:#f4f5f7}\
.afa-nudge .afa-x svg{width:12px;height:12px;pointer-events:none}\
.afa-panel{position:fixed;right:24px;bottom:92px;width:380px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 120px);\
background:rgba(13,15,19,.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);\
border:1px solid rgba(255,255,255,.11);border-radius:16px;z-index:99999;display:flex;flex-direction:column;\
overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,.05),0 24px 64px rgba(0,0,0,.55);font-family:'Golos Text','PingFang SC','Microsoft YaHei',sans-serif;\
opacity:0;visibility:hidden;pointer-events:none;transform:translateY(12px) scale(.96);transform-origin:bottom right;\
transition:opacity .2s ease,transform .22s cubic-bezier(.16,1,.3,1),visibility .2s}\
.afa-panel.open{opacity:1;visibility:visible;pointer-events:auto;transform:translateY(0) scale(1)}\
.afa-head{display:flex;align-items:center;gap:10px;padding:13px 14px 13px 16px;border-bottom:1px solid rgba(255,255,255,.08);background:rgba(10,11,14,.85)}\
.afa-head .dot{width:8px;height:8px;border-radius:50%;background:#3ecf8e;box-shadow:0 0 0 3px rgba(62,207,142,.18);flex:none}\
.afa-head .t{font:600 14px 'Geologica','PingFang SC','Microsoft YaHei',sans-serif;color:#f4f5f7;flex:1;min-width:0}\
.afa-head .t span{display:block;font:400 11px 'IBM Plex Mono','PingFang SC',monospace;color:#717784;margin-top:1px}\
.afa-head .afa-close{background:transparent;border:none;color:#a0a6b0;width:28px;height:28px;border-radius:7px;\
display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:background .15s ease,color .15s ease}\
.afa-head .afa-close:hover{background:rgba(255,255,255,.08);color:#f4f5f7}\
.afa-head .afa-close svg{width:14px;height:14px}\
.afa-log{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:9px}\
.afa-msg{max-width:88%;padding:10px 13px;border-radius:13px;font-size:13.5px;line-height:1.5;white-space:pre-line;animation:afaIn .18s ease-out both}\
.afa-u{align-self:flex-end;background:linear-gradient(135deg,#4ae39e,#25b876);color:#07120c;border-bottom-right-radius:4px;font-weight:500}\
.afa-b{align-self:flex-start;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);color:#f4f5f7;border-bottom-left-radius:4px}\
.afa-b.afa-no{border-color:rgba(224,162,60,.4);background:rgba(224,162,60,.08)}\
.afa-src{margin-top:7px;font:400 11px 'IBM Plex Mono','PingFang SC',monospace;color:#3ecf8e}\
.afa-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}\
.afa-chip{font:400 12px 'IBM Plex Mono','PingFang SC',monospace;color:#a0a6b0;background:rgba(255,255,255,.03);\
border:1px solid rgba(255,255,255,.1);border-radius:99px;padding:6px 11px;cursor:pointer;transition:color .15s,border-color .15s,background .15s}\
.afa-chip:hover{color:#f4f5f7;border-color:rgba(255,255,255,.22);background:rgba(255,255,255,.06)}\
.afa-acts{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}\
.afa-act{font:400 12.5px 'Golos Text','PingFang SC',sans-serif;color:#3ecf8e;background:rgba(62,207,142,.08);\
border:1px solid rgba(62,207,142,.3);border-radius:9px;padding:7px 12px;cursor:pointer;transition:background .15s,border-color .15s}\
.afa-act:hover{background:rgba(62,207,142,.16)}\
.afa-act.afa-act-dim{color:#a0a6b0;background:rgba(255,255,255,.03);border-color:rgba(255,255,255,.12)}\
.afa-act.afa-act-dim:hover{background:rgba(255,255,255,.07);color:#f4f5f7}\
.afa-form{display:flex;gap:8px;padding:12px 14px;border-top:1px solid rgba(255,255,255,.08)}\
.afa-form input{flex:1;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.1);border-radius:9px;\
padding:10px 12px;color:#f4f5f7;font-size:13.5px;font-family:inherit;transition:border-color .15s}\
.afa-form input:focus{outline:none;border-color:#3ecf8e}\
.afa-form button{background:linear-gradient(135deg,#4ae39e,#25b876);color:#07120c;border:none;border-radius:9px;padding:0 15px;\
font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;transition:filter .15s,transform .15s}\
.afa-form button:hover{filter:brightness(1.06)}\
.afa-form button:active{transform:scale(.96)}\
.afa-foot{font:400 10px 'IBM Plex Mono','PingFang SC',monospace;color:#5a606b;text-align:center;padding:0 14px 10px}\
html[data-theme='light'] .afa-launch{background:linear-gradient(135deg,#22c55e 0%,#15803d 100%);color:#ffffff;\
box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 10px 26px rgba(21,128,61,.28),0 2px 6px rgba(15,23,42,.12)}\
html[data-theme='light'] .afa-launch::before{border-color:rgba(21,128,61,.5)}\
html[data-theme='light'] .afa-launch:hover{box-shadow:inset 0 1px 0 rgba(255,255,255,.35),0 14px 32px rgba(21,128,61,.34),0 4px 10px rgba(15,23,42,.14)}\
html[data-theme='light'] .afa-launch:focus-visible{outline-color:#15803d}\
html[data-theme='light'] .afa-nudge{background:rgba(255,255,255,.95);color:#111827;border-color:rgba(15,23,42,.12);\
box-shadow:0 10px 30px -8px rgba(15,23,42,.18),0 2px 6px rgba(15,23,42,.06)}\
html[data-theme='light'] .afa-nudge::after{background:#ffffff;border-color:rgba(15,23,42,.12)}\
html[data-theme='light'] .afa-nudge:hover,html[data-theme='light'] .afa-nudge:hover::after{border-color:rgba(21,128,61,.4)}\
html[data-theme='light'] .afa-nt{color:#4b5563}\
html[data-theme='light'] .afa-nb{color:#15803d}\
html[data-theme='light'] .afa-nudge .afa-x{color:#64748b}\
html[data-theme='light'] .afa-nudge .afa-x:hover{background:rgba(15,23,42,.06);color:#111827}\
html[data-theme='light'] .afa-panel{background:rgba(255,255,255,.97);border-color:rgba(15,23,42,.12);\
box-shadow:0 24px 60px -12px rgba(15,23,42,.22),0 4px 14px rgba(15,23,42,.06)}\
html[data-theme='light'] .afa-head{background:#f8fafc;border-bottom-color:rgba(15,23,42,.08)}\
html[data-theme='light'] .afa-head .dot{background:#15803d;box-shadow:0 0 0 3px rgba(21,128,61,.16)}\
html[data-theme='light'] .afa-head .t{color:#111827}\
html[data-theme='light'] .afa-head .t span{color:#64748b}\
html[data-theme='light'] .afa-head .afa-close{color:#64748b}\
html[data-theme='light'] .afa-head .afa-close:hover{background:rgba(15,23,42,.06);color:#111827}\
html[data-theme='light'] .afa-u{background:linear-gradient(135deg,#22c55e,#15803d);color:#ffffff}\
html[data-theme='light'] .afa-b{background:#f1f5f9;border-color:rgba(15,23,42,.08);color:#111827}\
html[data-theme='light'] .afa-b.afa-no{background:rgba(180,83,9,.08);border-color:rgba(180,83,9,.35)}\
html[data-theme='light'] .afa-src{color:#15803d}\
html[data-theme='light'] .afa-chip{background:#f8fafc;border-color:rgba(15,23,42,.12);color:#4b5563}\
html[data-theme='light'] .afa-chip:hover{color:#111827;border-color:rgba(15,23,42,.24);background:#eef1f5}\
html[data-theme='light'] .afa-act{color:#15803d;background:rgba(21,128,61,.08);border-color:rgba(21,128,61,.3)}\
html[data-theme='light'] .afa-act:hover{background:rgba(21,128,61,.15)}\
html[data-theme='light'] .afa-act.afa-act-dim{color:#4b5563;background:#f8fafc;border-color:rgba(15,23,42,.12)}\
html[data-theme='light'] .afa-act.afa-act-dim:hover{background:#eef1f5;color:#111827}\
html[data-theme='light'] .afa-form{border-top-color:rgba(15,23,42,.08);background:#ffffff}\
html[data-theme='light'] .afa-form input{background:#f8fafc;border-color:rgba(15,23,42,.12);color:#111827}\
html[data-theme='light'] .afa-form input:focus{border-color:#15803d}\
html[data-theme='light'] .afa-form button{background:linear-gradient(135deg,#22c55e,#15803d);color:#ffffff}\
html[data-theme='light'] .afa-foot{color:#64748b}\
@media(max-width:560px){.afa-panel{right:8px;bottom:84px;height:70vh}.afa-nudge{display:none}}\
@media(prefers-reduced-motion:reduce){\
.afa-launch::before,.afa-msg{animation:none}\
.afa-launch,.afa-nudge,.afa-nudge::after,.afa-arr,.afa-panel,.afa-chip,.afa-act,.afa-form button{transition:none}}";

  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  function init() {
    var style = el("style"); style.textContent = CSS; document.head.appendChild(style);

    var launch = el("button", "afa-launch"); launch.type = "button"; launch.setAttribute("aria-label", UI.launchAria);
    launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 5.5h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9l-4.5 3.5V6.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="8.75" cy="11" r="1.15" fill="currentColor"/><circle cx="12" cy="11" r="1.15" fill="currentColor"/><circle cx="15.25" cy="11" r="1.15" fill="currentColor"/></svg>';
    document.body.appendChild(launch);

    var nudge = el("div", "afa-nudge");
    var xBtn = el("button", "afa-x"); xBtn.type = "button"; xBtn.setAttribute("aria-label", UI.hideAria);
    xBtn.innerHTML = '<svg viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
    nudge.appendChild(xBtn);
    nudge.appendChild(el("span", "afa-nt", UI.nudgeTop));
    var nb = el("span", "afa-nb"); nb.appendChild(document.createTextNode(UI.nudgeCta + " ")); nb.appendChild(el("span", "afa-arr", "→"));
    nudge.appendChild(nb);

    var panel = el("div", "afa-panel"); panel.setAttribute("aria-hidden", "true");
    var head = el("div", "afa-head");
    head.appendChild(el("span", "dot"));
    var titleSpan = el("span", "t", UI.headTitle);
    titleSpan.appendChild(el("span", null, UI.headSub));
    head.appendChild(titleSpan);
    var closeBtn = el("button", "afa-close"); closeBtn.type = "button"; closeBtn.setAttribute("aria-label", UI.closeAria);
    closeBtn.innerHTML = '<svg viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    head.appendChild(closeBtn);
    panel.appendChild(head);

    var log = el("div", "afa-log"); log.id = "afa-log"; log.setAttribute("aria-live", "polite"); panel.appendChild(log);
    var chips = el("div", "afa-chips"); chips.id = "afa-chips"; panel.appendChild(chips);

    var form = el("form", "afa-form"); form.id = "afa-form"; form.setAttribute("autocomplete", "off");
    var input = el("input"); input.id = "afa-q"; input.placeholder = UI.placeholder; input.setAttribute("aria-label", UI.inputAria);
    var sendBtn = el("button", null, "→"); sendBtn.type = "submit"; sendBtn.setAttribute("aria-label", UI.sendAria);
    form.appendChild(input); form.appendChild(sendBtn); panel.appendChild(form);
    panel.appendChild(el("div", "afa-foot", UI.foot));
    document.body.appendChild(panel);

    var greeted = false, nudged = false;
    var WEB3 = "500d8f26-693d-481a-9062-b02aa72a97db";
    var fsm = null, ctaOff = false, ctaCd = 0;

    function highIntent(q) {
      q = (q || "").toLowerCase();
      for (var i = 0; i < UI.high.length; i++) if (q.indexOf(UI.high[i]) >= 0) return true;
      return false;
    }
    function validContact(v) { v = (v || "").trim(); return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || /^@?[A-Za-z0-9_]{4,32}$/.test(v); }

    function addUser(q) { log.appendChild(el("div", "afa-msg afa-u", q)); log.scrollTop = log.scrollHeight; }
    function botMsg(text, opts) {
      opts = opts || {};
      var m = el("div", "afa-msg afa-b" + (opts.no ? " afa-no" : ""));
      m.appendChild(el("div", null, text));
      if (opts.src) m.appendChild(el("div", "afa-src", UI.srcPrefix + opts.src));
      if (opts.acts && opts.acts.length) {
        var row = el("div", "afa-acts");
        opts.acts.forEach(function (a) {
          var b = el("button", "afa-act" + (a.dim ? " afa-act-dim" : ""), a.label);
          b.type = "button";
          b.addEventListener("click", function () { a.fn(); });
          row.appendChild(b);
        });
        m.appendChild(row);
      }
      log.appendChild(m); log.scrollTop = log.scrollHeight; return m;
    }
    function cancelAct() { return { label: UI.cancelLabel, dim: true, fn: function () { fsm = null; botMsg(UI.cancelReply); } }; }

    // ----- Захват лида в чате (FSM) -----
    function startCapture(prefillTask) {
      fsm = { step: "task", lead: {}, tries: 0 };
      if (prefillTask) { fsm.lead.task = prefillTask; askScope(); return; }
      botMsg(UI.askTask, { acts: UI.taskOpts.map(function (o) { return { label: o, fn: function () { pickTask(o); } }; }).concat([cancelAct()]) });
    }
    function pickTask(o) {
      addUser(o);
      if (o.indexOf(UI.otherMark) >= 0) { fsm.step = "task_free"; botMsg(UI.askTaskFree, { acts: [cancelAct()] }); }
      else { fsm.lead.task = o; askScope(); }
    }
    function askScope() {
      fsm.step = "scope";
      botMsg(UI.askScope, { acts: [{ label: UI.skipLabel, dim: true, fn: function () { addUser(UI.skipUser); fsm.lead.scope = UI.notSpecified; askContact(); } }, cancelAct()] });
    }
    function askContact() { fsm.step = "contact"; botMsg(UI.askContact, { acts: [cancelAct()] }); }
    function askConfirm() {
      fsm.step = "confirm";
      botMsg(UI.confirmText(fsm.lead), { acts: [{ label: UI.sendLead, fn: submitLead }, { label: UI.editLead, dim: true, fn: function () { startCapture(); } }, cancelAct()] });
    }
    function submitLead() {
      var l = fsm.lead; fsm = null; ctaOff = true; botMsg(UI.sending);
      var fd = new FormData();
      fd.append("access_key", WEB3);
      fd.append("subject", "AlfaFond /dev (" + LANG + ") — заявка из чат-ассистента");
      fd.append("from_name", "alfafond.com /dev · chat (" + LANG + ")");
      fd.append("Контакт", l.contact);
      fd.append("Задача", l.task || "—");
      fd.append("Объём", l.scope || UI.notSpecified);
      fd.append("Язык", LANG);
      fd.append("Страница", location.pathname + location.search);
      fd.append("Источник", document.referrer || "(direct)");
      fetch("https://api.web3forms.com/submit", { method: "POST", body: fd })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && j.success) botMsg(UI.leadOk(l.contact));
          else throw 0;
        })
        .catch(function () {
          botMsg(UI.leadErr, {
            no: true,
            acts: [{
              label: UI.openForm,
              fn: function () {
                close();
                var c = document.getElementById("contact") || document.getElementById("hire");
                if (c) c.scrollIntoView({ behavior: "smooth" });
                else location.href = LANG === "ru" ? "/dev/ru/#contact" : "/dev/#hire";
              }
            }]
          });
        });
    }

    function ask(q) {
      q = (q || "").trim(); if (!q) return;
      addUser(q);
      if (fsm) { handleFsm(q); return; }
      setTimeout(function () {
        var res = answer(q); if (ctaCd > 0) ctaCd--;
        if (res.ok) {
          var acts = null;
          if (!ctaOff && ctaCd <= 0 && highIntent(q)) {
            ctaCd = 2;
            acts = [{ label: UI.ctaEstimate, fn: function () { startCapture(); } }, { label: UI.ctaBrowse, dim: true, fn: function () { ctaOff = true; } }];
          }
          botMsg(res.text, { src: res.src, acts: acts });
        } else {
          botMsg(res.text, { no: true, acts: ctaOff ? null : [{ label: UI.ctaHuman, dim: true, fn: function () { startCapture(q); } }] });
        }
      }, 150);
    }
    function handleFsm(q) {
      if (fsm.step === "task_free") { fsm.lead.task = q; askScope(); return; }
      if (fsm.step === "scope") { fsm.lead.scope = q; askContact(); return; }
      if (fsm.step === "contact") {
        if (validContact(q) || fsm.tries >= 1) { fsm.lead.contact = q; askConfirm(); }
        else { fsm.tries++; botMsg(UI.badContact, { no: true, acts: [cancelAct()] }); }
        return;
      }
      botMsg(UI.useButtons);
    }
    function renderChips() {
      chips.innerHTML = "";
      UI.chips.forEach(function (c) {
        var b = el("button", "afa-chip", c); b.type = "button";
        b.addEventListener("click", function () { ask(c); });
        chips.appendChild(b);
      });
    }

    function hideNudge() {
      if (!nudge.parentNode) return;
      nudge.classList.remove("show");
      setTimeout(function () { if (nudge.parentNode) nudge.remove(); }, 240);
    }
    function open() {
      panel.classList.add("open"); panel.setAttribute("aria-hidden", "false");
      launch.classList.add("afa-hidden"); hideNudge();
      if (!greeted) { greeted = true; botMsg(UI.greeting); renderChips(); }
      setTimeout(function () { input.focus(); }, 60);
    }
    function close() {
      panel.classList.remove("open"); panel.setAttribute("aria-hidden", "true");
      launch.classList.remove("afa-hidden");
    }

    launch.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) close(); });
    form.addEventListener("submit", function (e) { e.preventDefault(); ask(input.value); input.value = ""; });
    nudge.addEventListener("click", function (e) { if (e.target.closest && e.target.closest(".afa-x")) { hideNudge(); return; } open(); });

    // Проактивный пузырь — по поведению (≥12с + скролл/короткая страница, ИЛИ exit-intent), один раз, НЕ на load
    function showNudge() {
      if (!greeted && !nudged) {
        nudged = true; document.body.appendChild(nudge);
        requestAnimationFrame(function () { requestAnimationFrame(function () { nudge.classList.add("show"); }); });
      }
    }
    setTimeout(function () { if (window.scrollY > 200 || document.documentElement.scrollHeight <= window.innerHeight * 1.5) showNudge(); }, 12000);
    document.addEventListener("mouseout", function (e) { if (e.clientY <= 0) showNudge(); });
  }

  /* Атрибуция лида для всех form.contact на странице (локализованный inline-успех вместо JSON web3forms). */
  function wireForms() {
    document.querySelectorAll("form.contact").forEach(function (f) {
      if (f.dataset.attr) return;
      f.dataset.attr = "1";
      function hid(name, val) {
        var i = document.createElement("input");
        i.type = "hidden"; i.name = name; i.value = val; f.appendChild(i);
      }
      hid("Страница", location.pathname + location.search);
      hid("Источник", document.referrer || "(direct)");
      hid("Язык", LANG);
      f.addEventListener("submit", function (e) {
        e.preventDefault();
        var btn = f.querySelector('button[type="submit"], .btn-ok');
        var origTxt = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = UI.formSending; }
        fetch(f.action, { method: "POST", body: new FormData(f) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (!j || !j.success) throw 0;
            var ok = document.createElement("p");
            ok.style.cssText = "margin-top:14px;color:#3ecf8e;font-size:.92rem";
            ok.textContent = UI.formOk;
            f.innerHTML = ""; f.appendChild(ok);
          })
          .catch(function () {
            if (btn) { btn.disabled = false; btn.textContent = origTxt; }
            var er = f.querySelector(".f-err") || document.createElement("p");
            er.className = "f-err"; er.style.cssText = "margin-top:12px;color:#e0a23c;font-size:.85rem";
            er.textContent = UI.formErr;
            if (!er.parentNode) f.appendChild(er);
          });
      });
    });
  }

  function boot() { init(); wireForms(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
