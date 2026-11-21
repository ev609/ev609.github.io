/* AlfaFond /check — клиентская диагностика сети для ChatGPT, Claude и ИИ-сервисов (RU / EN / ZH / ES).
 * Все проверки выполняются прямо в браузере; IP пользователя на сервер AlfaFond не отправляется.
 */
(function () {
  'use strict';

  const RAW_LANG = (document.documentElement.lang || 'ru').toLowerCase();
  const LANG = RAW_LANG.startsWith('zh') ? 'zh'
    : RAW_LANG.startsWith('es') ? 'es'
    : RAW_LANG.startsWith('en') ? 'en' : 'ru';
  const LOCALE = { ru: 'ru-RU', en: 'en-US', zh: 'zh-CN', es: 'es-ES' }[LANG] || 'en-US';
  const REGION_LANG = LANG === 'zh' ? 'zh-Hans' : LANG;
  const DICT = (window.AF_CHECK_I18N && window.AF_CHECK_I18N[LANG]) || null;
  const CHECK_URL = LANG === 'ru' ? 'alfafond.com/check' : `alfafond.com/check/${LANG}`;
  const T = (ru, en) => {
    if (LANG === 'ru') return ru;
    if (DICT && Object.prototype.hasOwnProperty.call(DICT, en)) return DICT[en];
    return en;
  };
  const TF = (ru, en, vars) => T(ru, en).replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ''));

  const AI_SERVICES = [
    { id: 'chatgpt',        name: 'ChatGPT',           domain: 'chatgpt.com',           group: 'openai',    policy: 'openai' },
    { id: 'openai_api',     name: 'OpenAI API',        domain: 'api.openai.com',        group: 'openai',    policy: 'openai' },
    { id: 'openai_auth',    name: T('Вход в OpenAI', 'OpenAI Auth'), domain: 'auth.openai.com', group: 'openai', policy: 'openai' },
    { id: 'sora',           name: 'Sora',              domain: 'sora.chatgpt.com',      group: 'openai',    policy: 'openai' },
    { id: 'claude',         name: 'Claude',            domain: 'claude.ai',             group: 'anthropic', policy: 'anthropic' },
    { id: 'claude_api',     name: 'Claude API',        domain: 'api.anthropic.com',     group: 'anthropic', policy: 'anthropic' },
    { id: 'claude_console', name: T('Консоль Claude', 'Claude Console'), domain: 'platform.claude.com', group: 'anthropic', policy: 'anthropic' },
    { id: 'perplexity',     name: 'Perplexity',        domain: 'www.perplexity.ai',     group: 'other',     policy: null },
    { id: 'grok',           name: 'Grok',              domain: 'grok.com',              group: 'other',     policy: null },
    { id: 'mistral',        name: 'Le Chat (Mistral)', domain: 'chat.mistral.ai',       group: 'other',     policy: null },
    { id: 'copilot',        name: 'Copilot',           domain: 'copilot.microsoft.com', group: 'other',     policy: null },
    { id: 'midjourney',     name: 'Midjourney',        domain: 'www.midjourney.com',    group: 'other',     policy: null },
    { id: 'suno',           name: 'Suno',              domain: 'suno.com',              group: 'other',     policy: null },
    { id: 'openrouter',     name: 'OpenRouter',        domain: 'openrouter.ai',         group: 'other',     policy: null },
    { id: 'poe',            name: 'Poe',               domain: 'poe.com',               group: 'other',     policy: null },
    { id: 'character',      name: 'Character.AI',      domain: 'character.ai',          group: 'other',     policy: null },
    { id: 'lmarena',        name: 'LMArena',           domain: 'lmarena.ai',            group: 'other',     policy: null },
    { id: 'notion',         name: 'Notion',            domain: 'www.notion.so',         group: 'other',     policy: null }
  ];

  const EXTRA_PROBES = [
    { id: 'gemini',      name: 'Google Gemini',    domain: 'gemini.google.com',   url: 'https://gemini.google.com/favicon.ico' },
    { id: 'aistudio',    name: 'Google AI Studio', domain: 'aistudio.google.com', url: 'https://aistudio.google.com/favicon.ico' },
    { id: 'github',      name: 'GitHub',           domain: 'github.com',          url: 'https://github.com/favicon.ico' },
    { id: 'cursor',      name: 'Cursor',           domain: 'cursor.com',          url: 'https://www.cursor.com/favicon.ico' },
    { id: 'huggingface', name: 'HuggingFace',      domain: 'huggingface.co',      url: 'https://huggingface.co/favicon.ico' }
  ];

  const BLOCKED_OPENAI = new Set([
    'RU', 'BY', 'CN', 'HK', 'MO', 'KP', 'IR', 'SY', 'CU', 'VE',
    'AF', 'CF', 'ER', 'LY', 'SD', 'SS', 'YE', 'SO', 'TD', 'ZW'
  ]);
  const BLOCKED_ANTHROPIC = new Set([
    'RU', 'BY', 'CN', 'HK', 'MO', 'KP', 'IR', 'SY', 'CU', 'VE',
    'AF', 'CF', 'CD', 'ET', 'LY', 'ML', 'MM', 'NI', 'SO', 'SS', 'SD', 'YE', 'ZW'
  ]);

  const PUBLIC_DNS_KEYWORDS = [
    'google', 'cloudflare', 'quad9', 'opendns', 'cisco', 'adguard', 'nextdns', 'controld', 'mullvad', 'dns.sb', 'cleanbrowsing'
  ];

  const HOSTING_KEYWORDS = [
    'ovh', 'hetzner', 'digitalocean', 'amazon', 'aws', 'google cloud', 'microsoft azure',
    'linode', 'akamai connected', 'vultr', 'choopa', 'contabo', 'scaleway', 'online s.a.s',
    'leaseweb', 'datacamp', 'm247', 'aeza', 'pq hosting', 'stark industries', 'hostinger',
    'kamatera', 'upcloud', 'oracle cloud', 'alibaba', 'tencent', 'cloudflare', 'fastly',
    'cdn77', 'bunnyway', 'serverius', 'frantech', 'buyvm', 'cogent', 'nforce', 'worldstream',
    'timeweb', 'selectel', 'reg.ru', 'vdsina', 'firstvds', 'mullvad', 'nordvpn', 'proton',
    'surfshark', 'expressvpn', 'private internet access', 'cyberghost', 'zenlayer', 'packethub',
    'tzulo', 'xtom', 'gcore', 'hosting', 'datacenter', 'data center', 'vps', 'cloud'
  ];

  const VPN_KEYWORDS = [
    'mullvad', 'nordvpn', 'proton', 'surfshark', 'expressvpn', 'cyberghost',
    'private internet access', 'packethub', 'datacamp', 'm247', 'windscribe',
    'ivpn', 'hide.me', 'adguard', 'hotspot shield', 'tor exit'
  ];

  const GLOSSARY = {
    vpn: {
      title: T('Что такое VPN и прокси?', 'What are VPN and proxy?'),
      text: T(
        'Это промежуточный сервер, через который идёт ваш интернет-трафик. Для ChatGPT и Claude вы выглядите так, будто заходите из страны этого сервера, а не из дома.',
        'An intermediary server that routes your internet traffic. ChatGPT and Claude see the exit server country and IP instead of your local ISP.'
      )
    },
    split: {
      title: T('Что такое Split-tunneling (раздельная маршрутизация)?', 'What is split-tunneling?'),
      text: T(
        'Режим VPN, при котором зарубежные сайты и ИИ идут через сервер за границей, а локальные сервисы — напрямую. Это удобно и не является утечкой, если все домены одного ИИ идут через один зарубежный сервер.',
        'A VPN mode where selected services (like AI tools) go through the VPN tunnel while local traffic goes direct. It is normal and not a leak as long as all domains of each AI service share a single exit IP.'
      )
    },
    reputation: {
      title: T('Что такое репутация IP-адреса?', 'What is IP reputation?'),
      text: T(
        'Специальные базы отслеживают, был ли адрес замечен в спаме, ботах, открытых прокси или публичных VPN. Чем чище адрес, тем реже сервисы показывают капчи и блокируют вход.',
        'Threat and ASN databases track whether an IP is linked to abuse, open proxies, Tor, or crowded VPN exits. Cleaner IPs trigger fewer captchas and blocks.'
      )
    },
    datacenter: {
      title: T('Что такое адрес дата-центра?', 'What is a datacenter IP?'),
      text: T(
        'IP-адрес, принадлежащий хостинг-компании (OVH, Hetzner, AWS и т.п.), а не домашнему провайдеру. Свой чистый VPS обычно работает хорошо, но антифрод относится к хостингам строже.',
        'An IP owned by a hosting provider (OVH, Hetzner, AWS, etc.) rather than a residential ISP. A clean personal VPS usually works fine, though anti-fraud systems scrutinize hosting ranges more closely.'
      )
    },
    webrtc: {
      title: T('Что такое утечка WebRTC?', 'What is a WebRTC leak?'),
      text: T(
        'Технология звонков в браузере (используется и в голосовом режиме ИИ). Браузер спрашивает свой IP по UDP через STUN-сервер. Если прокси проксирует только TCP, сайт может увидеть настоящий домашний адрес.',
        'Browser real-time voice/video tech that discovers your external IP via STUN over UDP. If your proxy only tunnels TCP, WebRTC can expose your real IP.'
      )
    },
    ipv6: {
      title: T('Что такое утечка IPv6?', 'What is an IPv6 leak?'),
      text: T(
        'Современная версия интернет-адресов. Некоторые VPN заворачивают в туннель только IPv4, оставляя IPv6 идти напрямую через провайдера — тогда сайты с IPv6 видят вашу реальную страну.',
        'Some VPN setups tunnel only IPv4 while leaving IPv6 routed directly through your ISP, exposing your real country to dual-stack websites.'
      )
    },
    dns: {
      title: T('Что такое утечка DNS?', 'What is a DNS leak?'),
      text: T(
        'DNS переводит имя сайта в IP-адрес. Если DNS-запросы идут через домашнего провайдера мимо VPN, он видит список открываемых доменов. Публичные DNS (Google, Cloudflare) к домашнему провайдеру не относятся.',
        'DNS resolves domain names to IPs. If queries bypass your VPN and hit your local ISP resolver, the ISP sees every domain you visit. Public anycast DNS (Google/Cloudflare) is not an ISP leak.'
      )
    },
    fingerprint: {
      title: T('Что такое отпечаток браузера?', 'What is browser fingerprinting?'),
      text: T(
        'Набор параметров, которые браузер сообщает сайтам: часовой пояс, язык, точность системных часов, видеокарта, флаг webdriver. Сильные расхождения добавляют подозрений антифроду.',
        'Browser attributes visible without permissions: timezone, languages, clock accuracy, GPU renderer, and webdriver automation flag. Large mismatches can raise anti-fraud suspicion.'
      )
    }
  };

  const TZ_COUNTRY_HINTS = {
    'Europe/Moscow': 'RU', 'Europe/Samara': 'RU', 'Asia/Yekaterinburg': 'RU',
    'Asia/Omsk': 'RU', 'Asia/Novosibirsk': 'RU', 'Asia/Krasnoyarsk': 'RU',
    'Asia/Irkutsk': 'RU', 'Asia/Yakutsk': 'RU', 'Asia/Vladivostok': 'RU',
    'Asia/Magadan': 'RU', 'Asia/Kamchatka': 'RU', 'Europe/Kaliningrad': 'RU',
    'Europe/Minsk': 'BY', 'Europe/Kyiv': 'UA', 'Europe/Kiev': 'UA',
    'Asia/Almaty': 'KZ', 'Asia/Qyzylorda': 'KZ', 'Asia/Yerevan': 'AM', 'Asia/Tbilisi': 'GE',
    'Europe/Amsterdam': 'NL', 'Europe/Berlin': 'DE', 'Europe/London': 'GB',
    'Europe/Paris': 'FR', 'Europe/Helsinki': 'FI', 'Europe/Stockholm': 'SE',
    'Europe/Oslo': 'NO', 'Europe/Zurich': 'CH', 'Europe/Vienna': 'AT',
    'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Tallinn': 'EE',
    'Europe/Riga': 'LV', 'Europe/Vilnius': 'LT', 'Europe/Istanbul': 'TR',
    'Europe/Dublin': 'IE', 'Europe/Madrid': 'ES', 'Europe/Rome': 'IT',
    'Europe/Lisbon': 'PT', 'Europe/Brussels': 'BE', 'Europe/Copenhagen': 'DK',
    'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Budapest': 'HU',
    'Europe/Belgrade': 'RS', 'Asia/Dubai': 'AE', 'Asia/Singapore': 'SG',
    'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Jerusalem': 'IL',
    'America/New_York': 'US', 'America/Chicago': 'US', 'America/Denver': 'US',
    'America/Los_Angeles': 'US', 'America/Phoenix': 'US', 'America/Anchorage': 'US',
    'America/Toronto': 'CA', 'America/Vancouver': 'CA', 'Australia/Sydney': 'AU'
  };

  const regionNames = (() => {
    try { return new Intl.DisplayNames([REGION_LANG], { type: 'region' }); }
    catch (_) { return null; }
  })();

  const HISTORY_KEY = 'af_netcheck_history_v1';

  const state = {
    running: false,
    hideIp: false,
    tab: 'simple',
    svcFilter: 'all',
    activeTerm: null,
    result: null
  };

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function countryName(code) {
    if (!code) return T('неизвестно', 'unknown');
    const c = String(code).toUpperCase();
    if (regionNames) {
      try {
        const label = regionNames.of(c);
        if (label && label !== c) return `${label} (${c})`;
      } catch (_) {}
    }
    return c;
  }

  function isIPv6(ip) {
    return typeof ip === 'string' && ip.includes(':');
  }

  function isPrivateIP(ip) {
    if (!ip) return true;
    if (ip.endsWith('.local')) return true;
    if (/^(10\.|127\.|192\.168\.|169\.254\.|0\.)/.test(ip)) return true;
    if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
    if (/^(::1|fe80:|fc|fd)/i.test(ip)) return true;
    return false;
  }

  function isPublicAnycastDns(dns) {
    const blob = `${dns?.geo || ''} ${dns?.provider || ''}`.toLowerCase();
    return PUBLIC_DNS_KEYWORDS.some((kw) => blob.includes(kw));
  }

  function maskIp(ip) {
    if (!ip) return '—';
    if (!state.hideIp) return ip;
    if (isIPv6(ip)) {
      const parts = ip.split(':');
      return `${parts[0] || ''}::•••:${parts[parts.length - 1] || ''}`;
    }
    const parts = ip.split('.');
    if (parts.length === 4) return `${parts[0]}.${parts[1]}.•••.•••`;
    return '•••.•••';
  }

  async function fetchTimeout(url, opts = {}, timeoutMs = 7000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const t0 = performance.now();
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        ...opts,
        signal: ctrl.signal
      });
      const text = opts.mode === 'no-cors' ? '' : await res.text();
      return { ok: opts.mode === 'no-cors' ? true : res.ok, status: res.status, text, ms: Math.round(performance.now() - t0) };
    } catch (err) {
      return {
        ok: false, status: 0, text: '', ms: Math.round(performance.now() - t0),
        error: err.name === 'AbortError' ? T('таймаут', 'timeout') : T('недоступен', 'unreachable')
      };
    } finally {
      clearTimeout(t);
    }
  }

  function parseTrace(text) {
    const out = {};
    for (const line of String(text || '').trim().split('\n')) {
      const idx = line.indexOf('=');
      if (idx > 0) out[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return out;
  }

  function allowedByPolicy(policy, loc) {
    if (!policy || !loc) return null;
    const c = loc.toUpperCase();
    if (policy === 'openai') return !BLOCKED_OPENAI.has(c);
    if (policy === 'anthropic') return !BLOCKED_ANTHROPIC.has(c);
    return null;
  }

  function setProgress(pct) {
    const bar = $('progressBar');
    const fill = $('progressFill');
    if (!bar || !fill) return;
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    fill.style.width = `${clamped}%`;
    bar.classList.toggle('done', clamped >= 100);
  }

  async function checkServices(onProgress) {
    let done = 0;
    const tasks = AI_SERVICES.map(async (svc) => {
      const r = await fetchTimeout(`https://${svc.domain}/cdn-cgi/trace`, {}, 7500);
      done += 1;
      onProgress(done, AI_SERVICES.length);
      if (!r.ok) {
        return { ...svc, ok: false, ip: null, loc: null, colo: null, ts: null, warp: null, ms: r.ms, error: r.error || `HTTP ${r.status}`, allowed: null };
      }
      const kv = parseTrace(r.text);
      const loc = kv.loc ? kv.loc.toUpperCase() : null;
      return {
        ...svc,
        ok: Boolean(kv.ip),
        ip: kv.ip || null,
        loc,
        colo: kv.colo || null,
        ts: kv.ts ? parseFloat(kv.ts) : null,
        warp: kv.warp || null,
        http: kv.http || null,
        tls: kv.tls || null,
        ms: r.ms,
        allowed: allowedByPolicy(svc.policy, loc)
      };
    });
    return Promise.all(tasks);
  }

  async function checkExtraProbes() {
    return Promise.all(EXTRA_PROBES.map(async (p) => {
      const r = await fetchTimeout(`${p.url}?_=${Date.now()}`, { mode: 'no-cors' }, 6000);
      return { ...p, ok: r.ok, ms: r.ms, error: r.ok ? null : r.error };
    }));
  }

  async function checkIpProtocols() {
    const [v4a, v4b, v6a, v6b, cfDirect] = await Promise.all([
      fetchTimeout('https://api4.ipify.org?format=json', {}, 5500),
      fetchTimeout('https://ipv4.icanhazip.com/', {}, 5500),
      fetchTimeout('https://api6.ipify.org?format=json', {}, 4000),
      fetchTimeout('https://ipv6.icanhazip.com/', {}, 4000),
      fetchTimeout('https://1.1.1.1/cdn-cgi/trace', {}, 5000)
    ]);

    let ipv4 = null;
    if (v4a.ok) { try { ipv4 = JSON.parse(v4a.text).ip || null; } catch (_) {} }
    if (!ipv4 && v4b.ok) {
      const s = v4b.text.trim();
      if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) ipv4 = s;
    }

    let ipv6 = null;
    if (v6a.ok) {
      try {
        const cand = JSON.parse(v6a.text).ip || '';
        if (cand.includes(':')) ipv6 = cand;
      } catch (_) {}
    }
    if (!ipv6 && v6b.ok) {
      const s = v6b.text.trim();
      if (s.includes(':')) ipv6 = s;
    }

    let cfTrace = null;
    if (cfDirect.ok) {
      const kv = parseTrace(cfDirect.text);
      if (kv.ip) cfTrace = { ip: kv.ip, loc: kv.loc ? kv.loc.toUpperCase() : null, colo: kv.colo || null, ts: kv.ts ? parseFloat(kv.ts) : null };
    }

    return { ipv4, ipv6, cfTrace };
  }

  const PTR_VPN_RE = /(^|[.-])(vpn|tunnel|proxy|socks|wireguard|wg\d*|openvpn|ovpn|vless|vmess|xray|shadowsocks|nordvpn|mullvad|proton|surfshark|expressvpn|cyberghost|windscribe|hide\.me|torguard)([.-]|$)/i;
  const PTR_TOR_RE = /(^|[.-])(tor-?exit|exit-?node|tor-?relay|tor\.|exit\.)/i;

  function reverseIPv4(ip) {
    if (!ip || isIPv6(ip)) return null;
    const parts = String(ip).trim().split('.');
    if (parts.length !== 4 || !parts.every((p) => /^\d+$/.test(p))) return null;
    return parts.reverse().join('.');
  }

  async function lookupIpReputation(ip) {
    const encoded = encodeURIComponent(ip);
    const rev4 = reverseIPv4(ip);
    const [q1, q2, q3, qPtr, qTor, qDrone] = await Promise.all([
      fetchTimeout(`https://api.ipquery.io/${encoded}`, {}, 6500),
      fetchTimeout(`https://ipwho.is/${encoded}`, {}, 6500),
      fetchTimeout(`https://api.ipapi.is/?q=${encoded}`, {}, 6500),
      rev4 ? fetchTimeout(`https://dns.google/resolve?name=${rev4}.in-addr.arpa&type=PTR`, {}, 4500) : Promise.resolve({ ok: false }),
      rev4 ? fetchTimeout(`https://dns.google/resolve?name=${rev4}.dnsel.torproject.org&type=A`, {}, 4500) : Promise.resolve({ ok: false }),
      rev4 ? fetchTimeout(`https://dns.google/resolve?name=${rev4}.dnsbl.dronebl.org&type=A`, {}, 4500) : Promise.resolve({ ok: false })
    ]);

    const rep = {
      ip, version: isIPv6(ip) ? 'IPv6' : 'IPv4', sources: [],
      countryCode: null, country: null, city: null, timezone: null,
      asn: null, org: null, isp: null, ptr: null, vpnService: null,
      isVpn: false, isProxy: false, isTor: false, isDatacenter: false, isMobile: false, isAbuser: false,
      torConfirmed: false, dnsblHits: [],
      riskScore: null, asnHeuristicHosting: false, asnHeuristicVpn: false, ptrHeuristicVpn: false, disagreement: false
    };

    if (q1.ok) {
      try {
        const d = JSON.parse(q1.text);
        if (d && d.ip) {
          rep.sources.push('ipquery.io');
          rep.countryCode = d.location?.country_code || rep.countryCode;
          rep.country = d.location?.country || rep.country;
          rep.city = d.location?.city || rep.city;
          rep.timezone = d.location?.timezone || rep.timezone;
          rep.asn = d.isp?.asn || rep.asn;
          rep.org = d.isp?.org || rep.org;
          rep.isp = d.isp?.isp || rep.isp;
          if (d.risk) {
            if (d.risk.is_vpn) rep.isVpn = true;
            if (d.risk.is_proxy) rep.isProxy = true;
            if (d.risk.is_tor) rep.isTor = true;
            if (d.risk.is_datacenter) rep.isDatacenter = true;
            if (d.risk.is_mobile) rep.isMobile = true;
            if (typeof d.risk.risk_score === 'number') rep.riskScore = d.risk.risk_score;
          }
        }
      } catch (_) {}
    }

    if (q2.ok) {
      try {
        const d = JSON.parse(q2.text);
        if (d && d.success !== false && d.ip) {
          rep.sources.push('ipwho.is');
          rep.countryCode = rep.countryCode || d.country_code;
          rep.country = rep.country || d.country;
          rep.city = rep.city || d.city;
          rep.timezone = rep.timezone || d.timezone?.id;
          if (!rep.asn && d.connection?.asn) rep.asn = `AS${d.connection.asn}`;
          rep.org = rep.org || d.connection?.org;
          rep.isp = rep.isp || d.connection?.isp;
        }
      } catch (_) {}
    }

    if (q3.ok) {
      try {
        const d = JSON.parse(q3.text);
        if (d && d.ip) {
          rep.sources.push('ipapi.is');
          rep.countryCode = rep.countryCode || d.location?.country_code || null;
          rep.country = rep.country || d.location?.country || (typeof d.country === 'string' ? d.country : null);
          rep.city = rep.city || d.location?.city || (typeof d.city === 'string' ? d.city : null);
          rep.timezone = rep.timezone || d.location?.timezone || (typeof d.timezone === 'string' ? d.timezone : null);
          if (!rep.asn && d.asn) {
            rep.asn = typeof d.asn === 'object'
              ? (d.asn.asn ? `AS${d.asn.asn}` : null)
              : String(d.asn).split(' ')[0];
          }
          if (!rep.org && d.asn && typeof d.asn === 'object' && d.asn.org) rep.org = d.asn.org;
          if (!rep.org && d.company && typeof d.company === 'object' && d.company.name) rep.org = d.company.name;
          if (!rep.isp && d.company && typeof d.company === 'object' && d.company.name) rep.isp = d.company.name;
          if (d.is_tor) rep.isTor = true;
          if (d.is_proxy) rep.isProxy = true;
          if (d.is_vpn) rep.isVpn = true;
          if (d.is_datacenter) rep.isDatacenter = true;
          if (d.is_mobile) rep.isMobile = true;
          if (d.is_abuser) rep.isAbuser = true;
          if (d.vpn && d.vpn.service) rep.vpnService = d.vpn.service;
          const abScore = parseFloat(d.company?.abuser_score) || parseFloat(d.asn?.abuser_score) || 0;
          if (abScore > 0) {
            const scaled = Math.min(100, Math.round(abScore * 1000));
            if (rep.riskScore === null || scaled > rep.riskScore) rep.riskScore = scaled;
          }
        }
      } catch (_) {}
    }

    if (qPtr.ok) {
      try {
        const d = JSON.parse(qPtr.text);
        if (d && (d.Status === 0 || d.Status === 3)) {
          const ans = Array.isArray(d.Answer) ? d.Answer.find((a) => a.type === 12 && a.data) : null;
          if (ans) {
            rep.ptr = String(ans.data).replace(/\.$/, '');
            rep.sources.push('rDNS');
            if (PTR_TOR_RE.test(rep.ptr)) rep.isTor = true;
            if (PTR_VPN_RE.test(rep.ptr)) rep.ptrHeuristicVpn = true;
          }
        }
      } catch (_) {}
    }

    if (qTor.ok) {
      try {
        const d = JSON.parse(qTor.text);
        if (d && (d.Status === 0 || d.Status === 3)) {
          rep.sources.push('Tor DNSEL');
          const hits = Array.isArray(d.Answer) ? d.Answer.map((a) => a.data) : [];
          if (d.Status === 0 && hits.some((v) => String(v).trim() === '127.0.0.2')) {
            rep.isTor = true;
            rep.torConfirmed = true;
          }
        }
      } catch (_) {}
    }

    if (qDrone.ok) {
      try {
        const d = JSON.parse(qDrone.text);
        if (d && (d.Status === 0 || d.Status === 3)) {
          rep.sources.push('DroneBL');
          const hits = Array.isArray(d.Answer) ? d.Answer.map((a) => String(a.data || '').trim()) : [];
          const validHits = hits.filter((v) => /^127\.0\.0\.\d+$/.test(v) && v !== '127.0.0.255');
          if (d.Status === 0 && validHits.length) {
            rep.isAbuser = true;
            rep.dnsblHits.push('DroneBL');
            if (validHits.some((v) => ['127.0.0.8', '127.0.0.9', '127.0.0.10', '127.0.0.14', '127.0.0.15'].includes(v))) {
              rep.isProxy = true;
            }
          }
        }
      } catch (_) {}
    }

    const blob = `${rep.asn || ''} ${rep.org || ''} ${rep.isp || ''}`.toLowerCase();
    rep.asnHeuristicHosting = HOSTING_KEYWORDS.some((kw) => blob.includes(kw));
    rep.asnHeuristicVpn = VPN_KEYWORDS.some((kw) => blob.includes(kw));
    if (!rep.isDatacenter && rep.asnHeuristicHosting) rep.disagreement = true;
    if (!rep.isVpn && (rep.asnHeuristicVpn || rep.ptrHeuristicVpn)) rep.disagreement = true;

    return rep;
  }

  function checkWebRTC() {
    return new Promise((resolve) => {
      const RTCPC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      if (!RTCPC) { resolve({ supported: false, publicIps: [], localIps: [], mdns: false }); return; }

      const publicIps = new Set();
      const localIps = new Set();
      let mdns = false;
      let finished = false;
      let pc = null;

      const finish = () => {
        if (finished) return;
        finished = true;
        try { if (pc) pc.close(); } catch (_) {}
        resolve({ supported: true, publicIps: Array.from(publicIps), localIps: Array.from(localIps), mdns });
      };

      try {
        pc = new RTCPC({
          iceServers: [
            { urls: 'stun:stun.cloudflare.com:3478' },
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        pc.createDataChannel('af-check');
        pc.onicecandidate = (ev) => {
          if (!ev || !ev.candidate) { finish(); return; }
          const cand = ev.candidate.candidate || '';
          const m = cand.match(/candidate:\S+\s+\d+\s+\S+\s+\d+\s+(\S+)\s+\d+\s+typ\s+(\S+)/);
          if (!m) return;
          const addr = m[1];
          const typ = m[2];
          if (addr.endsWith('.local')) { mdns = true; return; }
          if (isPrivateIP(addr)) localIps.add(addr);
          else if (typ === 'srflx' || typ === 'prflx' || typ === 'host') publicIps.add(addr);
        };
        pc.onicegatheringstatechange = () => { if (pc && pc.iceGatheringState === 'complete') finish(); };
        pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(finish);
        setTimeout(finish, 4000);
      } catch (_) {
        finish();
      }
    });
  }

  async function checkDNS() {
    const r = await fetchTimeout(`https://edns.ip-api.com/json?_=${Date.now()}`, {}, 6500);
    if (!r.ok) {
      return { ok: false, ip: null, geo: null, countryCode: null, provider: null, isPublicAnycast: false, error: r.error || `HTTP ${r.status}` };
    }
    try {
      const d = JSON.parse(r.text);
      const ip = d.dns?.ip || null;
      const geo = d.dns?.geo || null;
      let provider = null;
      if (geo && geo.includes(' - ')) provider = geo.split(' - ').slice(1).join(' - ').trim();
      let countryCode = null;
      if (ip) {
        const rep = await fetchTimeout(`https://api.ipquery.io/${encodeURIComponent(ip)}`, {}, 5000);
        if (rep.ok) {
          try {
            const j = JSON.parse(rep.text);
            countryCode = j.location?.country_code || null;
            provider = provider || j.isp?.org || j.isp?.isp || null;
          } catch (_) {}
        }
      }
      if (!countryCode && geo) {
        const g = geo.toLowerCase();
        if (g.startsWith('russia')) countryCode = 'RU';
        else if (g.startsWith('united states')) countryCode = 'US';
        else if (g.startsWith('netherlands')) countryCode = 'NL';
        else if (g.startsWith('germany')) countryCode = 'DE';
        else if (g.startsWith('united kingdom')) countryCode = 'GB';
        else if (g.startsWith('finland')) countryCode = 'FI';
        else if (g.startsWith('sweden')) countryCode = 'SE';
        else if (g.startsWith('france')) countryCode = 'FR';
      }
      const res = { ok: Boolean(ip), ip, geo, countryCode, provider, isPublicAnycast: false };
      res.isPublicAnycast = isPublicAnycastDns(res);
      return res;
    } catch (_) {
      return { ok: false, ip: null, geo: null, countryCode: null, provider: null, isPublicAnycast: false, error: T('ошибка разбора', 'parse error') };
    }
  }

  function checkBrowser(referenceServerTs) {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) { return ''; } })();
    const tzOffsetMin = -new Date().getTimezoneOffset();
    const languages = Array.isArray(navigator.languages) ? navigator.languages.slice(0, 5) : [navigator.language || ''];
    const webdriver = Boolean(navigator.webdriver);
    const uaDataPlatform = navigator.userAgentData?.platform || null;

    let uaMismatch = false;
    if (uaDataPlatform) {
      const pLow = uaDataPlatform.toLowerCase();
      const uaLow = ua.toLowerCase();
      if (pLow.includes('mac') && uaLow.includes('windows')) uaMismatch = true;
      if (pLow.includes('win') && uaLow.includes('mac os')) uaMismatch = true;
      if (pLow.includes('linux') && (uaLow.includes('windows') || uaLow.includes('mac os'))) uaMismatch = true;
    }

    let clockDriftSec = null;
    if (typeof referenceServerTs === 'number' && Number.isFinite(referenceServerTs)) {
      clockDriftSec = Math.round(Date.now() / 1000 - referenceServerTs);
    }

    let webglRenderer = '—';
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        webglRenderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      }
    } catch (_) {}

    return {
      ua, platform, uaDataPlatform, uaMismatch, webdriver, tz,
      tzCountryHint: TZ_COUNTRY_HINTS[tz] || null,
      tzOffsetMin, languages, clockDriftSec,
      screen: `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio || 1}x`,
      cores: navigator.hardwareConcurrency || null,
      memoryGb: navigator.deviceMemory || null,
      webglRenderer, cookiesEnabled: navigator.cookieEnabled
    };
  }

  function evaluateAll({ services, ipProto, reputations, webrtc, dns, browser }) {
    const findings = [];
    const addFinding = (severity, penalty, title, detail, fix) => {
      findings.push({ severity, penalty, title, detail, fix });
    };

    const byId = Object.fromEntries(services.map((s) => [s.id, s]));
    const chatgpt = byId.chatgpt;
    const claude = byId.claude;

    if (chatgpt && chatgpt.ok && chatgpt.allowed === false) {
      addFinding('bad', 50,
        TF('ChatGPT видит неподдерживаемую страну: {country}', 'ChatGPT sees an unsupported country: {country}', { country: countryName(chatgpt.loc) }),
        T('OpenAI не обслуживает эту страну — вход и API будут заблокированы даже с оплаченной подпиской.', 'OpenAI does not serve this country — login and API calls will be blocked even on a paid plan.'),
        T('Переключите VPN/прокси на поддерживаемую страну (Нидерланды, Германия, США, Финляндия).', 'Switch your VPN/proxy to a supported country (e.g., US, Netherlands, Germany, Finland).')
      );
    } else if (chatgpt && !chatgpt.ok) {
      addFinding('bad', 35,
        T('ChatGPT недоступен из текущей сети', 'ChatGPT is unreachable from this network'),
        TF('Запрос к chatgpt.com завершился ошибкой ({err}).', 'Request to chatgpt.com failed ({err}).', { err: chatgpt.error || T('нет ответа', 'no response') }),
        T('Проверьте, что домен chatgpt.com идёт через рабочий VPN/прокси.', 'Ensure chatgpt.com is routed through a working VPN/proxy.')
      );
    }

    if (claude && claude.ok && claude.allowed === false) {
      addFinding('bad', 50,
        TF('Claude видит неподдерживаемую страну: {country}', 'Claude sees an unsupported country: {country}', { country: countryName(claude.loc) }),
        T('Anthropic ограничивает доступ из этой страны и может заблокировать аккаунт при входе.', 'Anthropic restricts access from this country and may flag or suspend accounts.'),
        T('Направьте домены claude.ai, api.anthropic.com и platform.claude.com через поддерживаемую страну.', 'Route claude.ai, api.anthropic.com, and platform.claude.com through a supported country.')
      );
    } else if (claude && !claude.ok) {
      addFinding('bad', 35,
        T('Claude недоступен из текущей сети', 'Claude is unreachable from this network'),
        TF('Запрос к claude.ai завершился ошибкой ({err}).', 'Request to claude.ai failed ({err}).', { err: claude.error || T('нет ответа', 'no response') }),
        T('Проверьте маршрутизацию claude.ai и api.anthropic.com в вашем VPN.', 'Check your VPN routing rules for claude.ai and api.anthropic.com.')
      );
    }

    const openaiIps = new Set(services.filter((s) => s.group === 'openai' && s.ok && s.ip).map((s) => s.ip));
    const openaiLocs = new Set(services.filter((s) => s.group === 'openai' && s.ok && s.loc).map((s) => s.loc));
    if (openaiIps.size > 1) {
      addFinding('warn', 5,
        TF('Домены OpenAI видят разные IP ({count} адреса)', 'OpenAI domains see different IPs ({count} addresses)', { count: openaiIps.size }),
        TF('Сайты OpenAI выходят через разные узлы ({locs}). Для антифрода это похоже на вход из разных мест сразу.', 'OpenAI endpoints exit via multiple nodes ({locs}), which looks like simultaneous logins from different places.', { locs: Array.from(openaiLocs).join(', ') }),
        T('Пустите chatgpt.com, api.openai.com, auth.openai.com и sora.chatgpt.com через один сервер.', 'Route chatgpt.com, api.openai.com, auth.openai.com, and sora.chatgpt.com through one exit server.')
      );
    }

    const anthropicIps = new Set(services.filter((s) => s.group === 'anthropic' && s.ok && s.ip).map((s) => s.ip));
    const anthropicLocs = new Set(services.filter((s) => s.group === 'anthropic' && s.ok && s.loc).map((s) => s.loc));
    if (anthropicIps.size > 1) {
      addFinding('warn', 5,
        TF('Домены Anthropic видят разные IP ({count} адреса)', 'Anthropic domains see different IPs ({count} addresses)', { count: anthropicIps.size }),
        TF('Сайты Claude выходят с разных адресов ({locs}).', 'Claude endpoints exit via multiple nodes ({locs}).', { locs: Array.from(anthropicLocs).join(', ') }),
        T('Пустите claude.ai, api.anthropic.com и platform.claude.com через один сервер VPN.', 'Route claude.ai, api.anthropic.com, and platform.claude.com through a single exit server.')
      );
    }

    const primaryIps = new Set([chatgpt?.ip, claude?.ip, ipProto.ipv4].filter(Boolean));
    const primaryReps = Array.from(primaryIps).map((ip) => reputations[ip]).filter(Boolean);
    const anyTor = primaryReps.some((r) => r.isTor);
    const anyProxy = primaryReps.some((r) => r.isProxy);
    const anyVpn = primaryReps.some((r) => r.isVpn);
    const anyDc = primaryReps.some((r) => r.isDatacenter);
    const anyAbuser = primaryReps.find((r) => r.isAbuser);
    const ptrVpn = primaryReps.find((r) => !r.isVpn && r.ptrHeuristicVpn);
    const anyDisagreeDc = primaryReps.some((r) => !r.isDatacenter && r.asnHeuristicHosting);
    const highRisk = primaryReps.find((r) => typeof r.riskScore === 'number' && r.riskScore >= 50);

    if (anyTor) {
      addFinding('bad', 40,
        T('Выходной адрес относится к сети Tor', 'Exit IP belongs to the Tor network'),
        T('Почти все ИИ-сервисы блокируют выходные узлы Tor или требуют бесконечную капчу.', 'Most AI platforms block Tor exit nodes or trigger endless captchas.'),
        T('Используйте обычный VPN или выделенный прокси вместо Tor.', 'Use a regular VPN or private proxy instead of Tor.')
      );
    }
    if (anyProxy) {
      addFinding('bad', 30,
        T('Адрес помечен как открытый прокси', 'IP is flagged as an open proxy'),
        T('Базы репутации видят открытый прокси на выходном адресе — высокий риск блокировки.', 'Reputation databases flag this address as an open proxy — high block risk.'),
        T('Смените сервер или провайдера VPN на приватный/выделенный IP.', 'Switch to a private VPN server or dedicated IP.')
      );
    }
    if (highRisk) {
      addFinding('bad', 25,
        TF('Повышенный риск-скор адреса ({score}/100)', 'Elevated IP risk score ({score}/100)', { score: highRisk.riskScore }),
        T('С этого адреса фиксировались злоупотребления или массовый бот-трафик.', 'Recent abuse or automated traffic has been linked to this exit IP.'),
        T('Переключитесь на другой сервер или менее загруженную локацию.', 'Switch to another server or less crowded exit location.')
      );
    } else if (anyAbuser) {
      const abSrc = anyAbuser.dnsblHits?.length ? anyAbuser.dnsblHits.join(', ') : 'ipapi.is';
      addFinding('bad', 20,
        TF('Адрес числится в базах злоупотреблений / DNSBL ({src})', 'IP is listed in abuse / DNSBL databases ({src})', { src: abSrc }),
        T('С этого адреса фиксировались бот-активность, спам или открытые прокси — повышенный риск блокировок и капч.', 'Automated traffic, spam, or open-proxy abuse has been reported from this IP — elevated risk of blocks and captchas.'),
        T('Смените сервер или используйте чистый выделенный IP.', 'Switch to a different server or a clean dedicated IP.')
      );
    }
    if (anyVpn) {
      addFinding('warn', 15,
        T('Адрес числится в базах VPN', 'Exit IP is listed in VPN databases'),
        T('Антифрод видит, что это публичный VPN-сервер. Само по себе не всегда блокирует, но повышает риск проверок.', 'Anti-fraud detects a public VPN exit. Not always an instant block, but increases challenge rate.'),
        T('При частых капчах попробуйте свой VPS, менее популярную локацию или резидентный выход.', 'If you hit frequent challenges, try a private VPS, less crowded location, or residential exit.')
      );
    } else if (ptrVpn) {
      addFinding('warn', 15,
        TF('Обратный DNS (PTR) указывает на VPN/туннель ({ptr})', 'Reverse DNS (PTR) indicates a VPN/tunnel ({ptr})', { ptr: ptrVpn.ptr }),
        T('Имя хоста явно выдаёт VPN-сервер или туннель. Антифрод и детекторы прокси учитывают PTR-записи даже при чистых публичных базах.', 'The hostname explicitly points to a VPN or tunnel endpoint. Anti-fraud systems inspect PTR records even when public lists are clean.'),
        T('Для своего VPS задайте нейтральную PTR-запись; если это общий VPN — выберите менее заметный сервер.', 'Set a neutral PTR record on a private VPS, or switch to a less crowded server if using a shared VPN.')
      );
    }
    if (anyDc) {
      const dcOrg = primaryReps.find((r) => r.isDatacenter)?.org || T('дата-центр', 'datacenter');
      addFinding('warn', 15,
        T('Выходной IP принадлежит хостингу / дата-центру', 'Exit IP belongs to a hosting / datacenter ASN'),
        TF('Организация: {org}. К адресам хостингов антифрод относится строже, чем к домашним ISP.', 'Provider: {org}. Anti-fraud scrutinizes hosting ranges more than residential ISPs.', { org: dcOrg }),
        T('Для стабильной работы держите чистый выделенный VPS (не шаренный VPN) и не допускайте утечек WebRTC/DNS.', 'Keep a clean dedicated VPS (not a shared VPN) and ensure no WebRTC/DNS leaks.')
      );
    } else if (anyDisagreeDc) {
      const hOrg = primaryReps.find((r) => r.asnHeuristicHosting)?.org || '—';
      addFinding('warn', 8,
        T('Источники расходятся: ASN похож на дата-центр', 'Sources disagree: ASN looks like hosting'),
        TF('База рисков не отметила хостинг, но ASN ({org}) относится к хостинг-провайдерам.', 'The risk API did not flag datacenter, but ASN ({org}) matches hosting providers.', { org: hOrg }),
        T('Обычно это нормально для своего VPS, но стоит следить за отсутствием утечек.', 'Usually fine for a personal VPS as long as there are no leaks.')
      );
    }

    const aiCountry = chatgpt?.loc || claude?.loc || primaryReps[0]?.countryCode || null;
    const aiIps = new Set(services.filter((s) => s.ok && s.ip).map((s) => s.ip));
    const splitTunnel = Boolean(
      ipProto.cfTrace?.loc && aiCountry && ipProto.cfTrace.loc.toUpperCase() !== aiCountry.toUpperCase()
    );

    if (webrtc.publicIps.length > 0) {
      const leakDiffCountry = webrtc.publicIps.find((ip) => {
        const rep = reputations[ip];
        return rep?.countryCode && aiCountry && rep.countryCode.toUpperCase() !== aiCountry.toUpperCase();
      });
      const leakSameCountry = webrtc.publicIps.find((ip) => !aiIps.has(ip));
      const webrtcV6 = webrtc.publicIps.find((ip) => isIPv6(ip));

      if (leakDiffCountry) {
        const rep = reputations[leakDiffCountry];
        addFinding('bad', 15,
          TF('Утечка WebRTC в другую страну ({country})', 'WebRTC leaks an IP from another country ({country})', { country: countryName(rep.countryCode) }),
          T('Браузер через STUN (UDP) раскрывает адрес из другой страны мимо VPN.', 'STUN over UDP exposes a public IP from a different country bypassing your VPN.'),
          T('Включите проксирование UDP в VPN-клиенте или ограничьте WebRTC в настройках браузера.', 'Enable UDP tunneling in your VPN client or restrict WebRTC IP handling in browser settings.')
        );
      } else if (leakSameCountry) {
        addFinding('warn', 5,
          T('WebRTC раскрывает дополнительный публичный IP', 'WebRTC exposes an additional public IP'),
          T('STUN возвращает публичный адрес, отличный от адреса ИИ-сервисов.', 'STUN returns a public address different from the AI exit IP.'),
          T('Проверьте настройки WebRTC IP Handling Policy в браузере (disable_non_proxied_udp).', 'Set browser WebRTC IP handling policy to disable_non_proxied_udp.')
        );
      }
      if (webrtcV6) {
        addFinding('warn', 10,
          T('Браузер раскрывает публичный IPv6 через WebRTC', 'Browser exposes a public IPv6 via WebRTC'),
          T('Публичный IPv6-адрес виден сайтам напрямую через WebRTC.', 'A public IPv6 address is directly visible to sites via WebRTC.'),
          T('Отключите IPv6 на интерфейсе или заверните IPv6 и UDP полностью в VPN.', 'Disable IPv6 on the interface or tunnel both IPv6 and UDP through your VPN.')
        );
      }
    }

    const v4Rep = ipProto.ipv4 ? reputations[ipProto.ipv4] : null;
    const v6Rep = ipProto.ipv6 ? reputations[ipProto.ipv6] : null;
    if (ipProto.ipv4 && ipProto.ipv6 && v4Rep?.countryCode && v6Rep?.countryCode &&
        v4Rep.countryCode.toUpperCase() !== v6Rep.countryCode.toUpperCase()) {
      addFinding('bad', 15,
        TF('IPv6 идёт мимо VPN ({v6} вместо {v4})', 'IPv6 bypasses VPN ({v6} vs IPv4 {v4})', { v6: countryName(v6Rep.countryCode), v4: countryName(v4Rep.countryCode) }),
        T('IPv4 и IPv6 выходят из разных стран — сервисы с поддержкой IPv6 могут видеть ваш реальный адрес.', 'IPv4 and IPv6 exit in different countries — dual-stack sites may see your real location.'),
        T('Включите IPv6-туннель в VPN либо отключите IPv6 в системе/клиенте.', 'Enable IPv6 tunneling in your VPN or disable IPv6 on your system.')
      );
    }

    if (dns.ok && dns.countryCode && aiCountry) {
      const dnsC = dns.countryCode.toUpperCase();
      const aiC = aiCountry.toUpperCase();
      if (dnsC === 'RU' && aiC !== 'RU') {
        addFinding('warn', 10,
          TF('DNS-запросы идут через Россию ({resolver}) при зарубежном VPN', 'DNS queries resolve in Russia ({resolver}) while exiting abroad', { resolver: dns.provider || dns.geo || 'RU' }),
          T('Домашний провайдер видит запрашиваемые домены, а несовпадение страны DNS и IP заметно антифроду.', 'Your local ISP can see queried domains, and DNS/IP country mismatch is visible to anti-fraud.'),
          T('Включите DNS-over-HTTPS (DoH) в браузере или проксирование DNS (FakeIP / remote DNS) в VPN-клиенте.', 'Enable DNS-over-HTTPS (DoH) in browser or remote DNS / FakeIP in your VPN client.')
        );
      } else if (dnsC !== aiC && !dns.isPublicAnycast) {
        addFinding('warn', 5,
          TF('DNS-резолвер стороннего провайдера в другой стране ({dnsCountry} vs {aiCountry})', 'Non-anycast DNS resolver in another country ({dnsCountry} vs {aiCountry})', { dnsCountry: countryName(dnsC), aiCountry: countryName(aiC) }),
          TF('Резолвер: {resolver}.', 'Resolver: {resolver}.', { resolver: dns.geo || dns.provider || dnsC }),
          T('Настройте DNS внутри VPN-туннеля или включите Cloudflare/Google DoH.', 'Route DNS inside your VPN tunnel or enable Cloudflare/Google DoH.')
        );
      }
    }

    if (browser.webdriver) {
      addFinding('warn', 10,
        T('Флаг navigator.webdriver = true (управление автоматизацией)', 'navigator.webdriver = true (automation detected)'),
        T('Сайты видят, что браузер запущен под управлением скрипта или headless-драйвера.', 'Websites detect that the browser is driven by automation or headless mode.'),
        T('Для обычной работы используйте стандартный профиль браузера; при запуске через check.sh этот флаг ожидаем.', 'Use a regular browser profile for normal sessions; this flag is expected when running check.sh.')
      );
    }
    if (browser.tzCountryHint && aiCountry && browser.tzCountryHint !== aiCountry.toUpperCase()) {
      addFinding('warn', 5,
        TF('Часовой пояс браузера ({tz}) не совпадает со страной IP ({country})', 'Browser timezone ({tz}) does not match exit country ({country})', { tz: browser.tz, country: countryName(aiCountry) }),
        T('Несоответствие таймзоны и IP — слабый вторичный признак VPN.', 'Timezone/IP mismatch is a mild secondary VPN signal.'),
        T('Обычно не мешает работе, менять системное время не обязательно — достаточно отсутствия утечек.', 'Usually harmless on its own; no need to change system time if there are no leaks.')
      );
    }
    if (browser.uaMismatch) {
      addFinding('warn', 5,
        T('Браузер называет разную ОС в User-Agent и Client Hints', 'User-Agent and Client Hints report conflicting OS'),
        TF('User-Agent и userAgentData ({platform}) противоречат друг другу.', 'User-Agent conflicts with userAgentData ({platform}).', { platform: browser.uaDataPlatform }),
        T('Отключите расширения, подменяющие только строку User-Agent без Client Hints.', 'Disable extensions that spoof User-Agent without updating Client Hints.')
      );
    }
    if (browser.clockDriftSec !== null && Math.abs(browser.clockDriftSec) > 120) {
      const mins = Math.round(Math.abs(browser.clockDriftSec) / 60);
      addFinding('warn', 5,
        TF('Системные часы сбиты на {mins} мин', 'System clock is off by {mins} min', { mins }),
        T('Сильное расхождение времени ломает токены авторизации, 2FA и вызывает подозрения антифрода.', 'Large clock skew breaks auth tokens, 2FA, and raises anti-fraud flags.'),
        T('Включите автоматическую синхронизацию времени по NTP в настройках ОС.', 'Enable automatic NTP time synchronization in your OS settings.')
      );
    }

    const totalPenalty = findings.reduce((acc, f) => acc + f.penalty, 0);
    const score = Math.max(0, Math.min(100, 100 - totalPenalty));

    let verdict = T('Отличное подключение', 'Great connection');
    let tone = 'ok';
    if (score < 50) { verdict = T('Высокий риск блокировки', 'High risk of blocks'); tone = 'bad'; }
    else if (score < 80) { verdict = T('Есть замечания', 'Some warnings'); tone = 'warn'; }

    const simpleCards = buildSimpleCards({
      byId, ipProto, primaryReps, reputations, webrtc, dns, browser,
      openaiIps, anthropicIps, aiCountry, splitTunnel
    });

    return { score, verdict, tone, findings, simpleCards, aiCountry, splitTunnel };
  }

  function buildSimpleCards({ byId, ipProto, primaryReps, reputations, webrtc, dns, browser, openaiIps, anthropicIps, aiCountry, splitTunnel }) {
    const cg = byId.chatgpt;
    const cl = byId.claude;

    let c1 = { status: 'ok', title: T('Пустят ли ChatGPT и Claude', 'Will ChatGPT and Claude let you in?'), terms: ['vpn', 'split'], text: '' };
    if (cg?.allowed === true && cl?.allowed === true) {
      c1.text = TF(
        'Оба сервиса видят поддерживаемую страну: ChatGPT — {cg}, Claude — {cl}.',
        'Both services see a supported country: ChatGPT — {cg}, Claude — {cl}.',
        { cg: countryName(cg.loc), cl: countryName(cl.loc) }
      ) + ' ' + (splitTunnel
        ? TF(
            'Прямой маршрут (1.1.1.1) идёт через {direct} — у вас работает split-tunneling, это нормально.',
            'Direct route (1.1.1.1) exits in {direct} — split-tunneling is active and working normally.',
            { direct: countryName(ipProto.cfTrace.loc) }
          )
        : T('По геоблокировке проблем нет.', 'No geo-blocking issues.'));
    } else if (cg?.allowed === false || cl?.allowed === false) {
      c1.status = 'bad';
      c1.text = TF(
        'Есть геоблокировка: ChatGPT видит {cg}, Claude видит {cl}. Нужен VPN в поддерживаемой стране.',
        'Geo-block detected: ChatGPT sees {cg}, Claude sees {cl}. Switch VPN to a supported region.',
        {
          cg: cg?.ok ? countryName(cg.loc) : T('недоступен', 'unreachable'),
          cl: cl?.ok ? countryName(cl.loc) : T('недоступен', 'unreachable')
        }
      );
    } else {
      c1.status = 'warn';
      c1.text = TF(
        'Часть сервисов не ответила: ChatGPT ({cg}), Claude ({cl}).',
        'Some services did not respond: ChatGPT ({cg}), Claude ({cl}).',
        {
          cg: cg?.ok ? countryName(cg.loc) : (cg?.error || T('ошибка', 'error')),
          cl: cl?.ok ? countryName(cl.loc) : (cl?.error || T('ошибка', 'error'))
        }
      );
    }

    let c2 = { status: 'ok', title: T('Не подозрительный ли адрес', 'Is the exit IP clean?'), terms: ['reputation', 'datacenter'], text: '' };
    const rep0 = primaryReps[0];
    if (!rep0) {
      c2.status = 'warn';
      c2.text = T('Базы репутации не ответили за отведённое время. Попробуйте повторить проверку.', 'Reputation APIs timed out. Try re-running the check.');
    } else if (rep0.isTor || rep0.isProxy || rep0.isAbuser || (rep0.riskScore || 0) >= 50) {
      c2.status = 'bad';
      c2.text = TF(
        'Адрес ({provider}) помечен как рискованный (Tor/прокси/злоупотребления). Лучше сменить сервер.',
        'Address ({provider}) is flagged as high-risk (Tor/proxy/abuse). Switch exit server.',
        { provider: rep0.org || rep0.asn || T('неизвестный провайдер', 'unknown provider') }
      );
    } else if (rep0.isVpn || rep0.ptrHeuristicVpn || rep0.isDatacenter || rep0.asnHeuristicHosting) {
      c2.status = 'warn';
      c2.text = TF(
        'Выход идёт через хостинг/VPN ({provider}). Для своего чистого VPS это обычно работает стабильно, но антифрод присматривается внимательнее.',
        'Traffic exits via hosting/VPN ({provider}). A clean personal VPS usually works fine, though anti-fraud watches hosting ranges closer.',
        { provider: rep0.org || rep0.isp || rep0.asn || T('дата-центр', 'datacenter') }
      );
    } else {
      c2.text = TF(
        'Адрес выглядит чистым ({provider}), в базах VPN, Tor и прокси не замечен.',
        'Address looks clean ({provider}), not listed in VPN, Tor, or open-proxy databases.',
        { provider: rep0.org || rep0.isp || T('обычный провайдер', 'regular ISP') }
      );
    }

    let c3 = { status: 'ok', title: T('Один ли адрес у каждой нейросети', 'Single exit IP per AI service?'), terms: ['split'], text: '' };
    if (openaiIps.size > 1 || anthropicIps.size > 1) {
      c3.status = 'warn';
      c3.text = TF(
        'Домены внутри одного сервиса видят разные IP (OpenAI: {oai}, Anthropic: {ant}). Лучше пустить все домены одного сервиса через один сервер.',
        'Subdomains of the same platform see multiple IPs (OpenAI: {oai}, Anthropic: {ant}). Route each service through one server.',
        { oai: openaiIps.size, ant: anthropicIps.size }
      );
    } else if (openaiIps.size === 0 && anthropicIps.size === 0) {
      c3.status = 'bad';
      c3.text = T('Не удалось получить ответы ни от OpenAI, ни от Anthropic.', 'Neither OpenAI nor Anthropic endpoints responded.');
    } else {
      c3.text = T(
        'Все домены OpenAI видят один и тот же адрес, и все домены Anthropic — тоже один. Сессия выглядит цельной.',
        'All OpenAI domains share one IP and all Anthropic domains share one IP. Sessions look consistent.'
      );
    }

    let c4 = { status: 'ok', title: T('Не просвечивает ли настоящий адрес', 'Any WebRTC or IPv6 leaks?'), terms: ['webrtc', 'ipv6'], text: '' };
    const v4Rep = ipProto.ipv4 ? reputations[ipProto.ipv4] : null;
    const v6Rep = ipProto.ipv6 ? reputations[ipProto.ipv6] : null;
    const v6Leak = ipProto.ipv4 && ipProto.ipv6 && v4Rep?.countryCode && v6Rep?.countryCode && v4Rep.countryCode !== v6Rep.countryCode;
    const rtcLeak = webrtc.publicIps.some((ip) => {
      const r = reputations[ip];
      return r?.countryCode && aiCountry && r.countryCode !== aiCountry;
    });
    if (v6Leak || rtcLeak) {
      c4.status = 'bad';
      const parts = [];
      if (rtcLeak) parts.push(T('WebRTC выдаёт адрес из другой страны.', 'WebRTC leaks an IP from another country.'));
      if (v6Leak) parts.push(T('IPv6 идёт мимо VPN в другую страну.', 'IPv6 bypasses VPN to another country.'));
      c4.text = parts.join(' ');
    } else if (webrtc.publicIps.length > 0) {
      c4.status = 'warn';
      c4.text = TF(
        'WebRTC показывает {count} публичный(х) IP, но из той же страны. IPv6 {v6state}.',
        'WebRTC reveals {count} public IP(s) in the same country. IPv6 is {v6state}.',
        {
          count: webrtc.publicIps.length,
          v6state: ipProto.ipv6 ? T('совпадает с VPN', 'aligned with VPN') : T('отключён — утечки нет', 'disabled — no leak')
        }
      );
    } else {
      c4.text = TF(
        'WebRTC не раскрывает публичный IP ({rtcState}). IPv6 {v6state}.',
        'WebRTC exposes no public IP ({rtcState}). IPv6 is {v6state}.',
        {
          rtcState: webrtc.mdns ? T('защищён mDNS', 'mDNS protected') : T('кандидатов нет', 'no candidates'),
          v6state: ipProto.ipv6 ? T('идёт через ту же страну', 'in the same country') : T('отключён — утечки не будет', 'disabled — no leak')
        }
      );
    }

    let c5 = { status: 'ok', title: T('Видит ли провайдер, куда вы заходите', 'Can your ISP see DNS queries?'), terms: ['dns'], text: '' };
    if (!dns.ok) {
      c5.status = 'warn';
      c5.text = T('Не удалось определить DNS-резолвер (сервис edns.ip-api.com не ответил).', 'Could not detect DNS resolver (edns.ip-api.com did not respond).');
    } else if (dns.countryCode === 'RU' && aiCountry && aiCountry !== 'RU') {
      c5.status = 'warn';
      c5.text = TF(
        'DNS-запросы идут через Россию ({resolver}), хотя сам трафик выходит через {country}. Лучше включить DNS внутри VPN или DoH.',
        'DNS resolves in Russia ({resolver}) while traffic exits in {country}. Enable remote DNS or DoH.',
        { resolver: dns.provider || dns.geo, country: countryName(aiCountry) }
      );
    } else if (dns.isPublicAnycast) {
      c5.text = TF(
        'Используется публичный anycast DNS ({resolver}) — утечки к домашнему провайдеру нет.',
        'Using public anycast DNS ({resolver}) — no leak to your home ISP.',
        { resolver: dns.geo || dns.provider }
      );
    } else if (dns.countryCode && aiCountry && dns.countryCode !== aiCountry) {
      c5.status = 'warn';
      c5.text = TF(
        'DNS отвечает из {dnsCountry} ({resolver}), а выход — в {aiCountry}.',
        'DNS resolves in {dnsCountry} ({resolver}) while traffic exits in {aiCountry}.',
        { dnsCountry: countryName(dns.countryCode), resolver: dns.provider || T('резолвер', 'resolver'), aiCountry: countryName(aiCountry) }
      );
    } else {
      c5.text = TF(
        'DNS-резолвер ({resolver}) совпадает со страной выхода — утечки к домашнему провайдеру не видно.',
        'DNS resolver ({resolver}) matches exit country — no ISP leak detected.',
        { resolver: dns.geo || dns.provider || countryName(dns.countryCode) }
      );
    }

    let c6 = { status: 'ok', title: T('Не странный ли браузер', 'Does your browser look normal?'), terms: ['fingerprint'], text: '' };
    const issues = [];
    if (browser.webdriver) issues.push(T('обнаружен флаг webdriver (автоматизация)', 'webdriver automation flag is true'));
    if (browser.uaMismatch) issues.push(T('разная ОС в User-Agent и Client Hints', 'OS mismatch between User-Agent and Client Hints'));
    if (browser.clockDriftSec !== null && Math.abs(browser.clockDriftSec) > 120) issues.push(T('сбиты системные часы', 'system clock is skewed'));
    if (browser.tzCountryHint && aiCountry && browser.tzCountryHint !== aiCountry) issues.push(TF('часовой пояс {tz} не совпадает со страной IP', 'timezone {tz} differs from exit country', { tz: browser.tz }));
    if (issues.length > 0) {
      c6.status = 'warn';
      c6.text = TF(
        'Есть мелкие несовпадения: {issues}. Отпечаток считается локально и никуда не отправляется.',
        'Minor mismatches: {issues}. Fingerprint stays strictly local in your browser.',
        { issues: issues.join('; ') }
      );
    } else {
      c6.text = TF(
        'Браузер выглядит естественно ({tz}, часы точны, флагов автоматизации нет).',
        'Browser looks natural ({tz}, clock accurate, no automation flags).',
        { tz: browser.tz || T('таймзона ок', 'timezone ok') }
      );
    }

    return [c1, c2, c3, c4, c5, c6];
  }

  function buildAiReport(res) {
    const lines = [];
    lines.push(T('# Проверка сети для ChatGPT и Claude (alfafond.com/check)', '# Network Check for ChatGPT & Claude (alfafond.com/check/en)'));
    lines.push(`${T('Дата', 'Date')}: ${new Date(res.timestamp).toLocaleString(LOCALE)}`);
    lines.push(`${T('Балл подключения', 'Connection score')}: **${res.score}/100** (${res.verdict})`);
    lines.push('');

    const cg = res.services.find((s) => s.id === 'chatgpt');
    const cl = res.services.find((s) => s.id === 'claude');
    lines.push(T('## Кратко', '## Summary'));
    lines.push(`- ChatGPT: ${cg?.ok ? `${maskIp(cg.ip)} · ${countryName(cg.loc)} · colo ${cg.colo} · ${cg.allowed ? T('пустит', 'allowed') : T('ЗАБЛОКИРОВАН', 'BLOCKED')}` : `${T('ошибка', 'error')} (${cg?.error || '—'})`}`);
    lines.push(`- Claude: ${cl?.ok ? `${maskIp(cl.ip)} · ${countryName(cl.loc)} · colo ${cl.colo} · ${cl.allowed ? T('пустит', 'allowed') : T('ЗАБЛОКИРОВАН', 'BLOCKED')}` : `${T('ошибка', 'error')} (${cl?.error || '—'})`}`);
    if (res.ipProto.cfTrace) {
      lines.push(`- Cloudflare 1.1.1.1: ${maskIp(res.ipProto.cfTrace.ip)} · ${countryName(res.ipProto.cfTrace.loc)} · colo ${res.ipProto.cfTrace.colo}${res.splitTunnel ? ' (split-tunneling)' : ''}`);
    }
    lines.push(`- IPv4: ${res.ipProto.ipv4 ? maskIp(res.ipProto.ipv4) : T('нет', 'none')} · IPv6: ${res.ipProto.ipv6 ? maskIp(res.ipProto.ipv6) : T('нет', 'none')}`);
    lines.push(`- DNS: ${res.dns.ok ? `${maskIp(res.dns.ip)} (${res.dns.geo || res.dns.provider || '—'}${res.dns.isPublicAnycast ? ', anycast' : ''})` : T('не определён', 'unknown')}`);
    lines.push(`- WebRTC public IPs: ${res.webrtc.publicIps.length ? res.webrtc.publicIps.map(maskIp).join(', ') : (res.webrtc.mdns ? T('нет (mDNS защищён)', 'none (mDNS protected)') : T('нет', 'none'))}`);
    lines.push('');

    lines.push(T('## Находки', '## Findings'));
    if (!res.findings.length) {
      lines.push(T('- Проблем не обнаружено.', '- No issues found.'));
    } else {
      for (const f of res.findings) {
        lines.push(`- [−${f.penalty}] **${f.title}** — ${f.detail} ${T('Совет', 'Fix')}: ${f.fix}`);
      }
    }
    lines.push('');

    lines.push(T('## Репутация выходных IP', '## Exit IP Reputation'));
    for (const rep of Object.values(res.reputations)) {
      const flags = [
        rep.isTor && 'TOR',
        rep.isProxy && 'PROXY',
        rep.isAbuser && 'ABUSE',
        rep.isVpn && 'VPN',
        !rep.isVpn && rep.ptrHeuristicVpn && 'VPN (PTR)',
        (rep.isDatacenter || rep.asnHeuristicHosting) && (rep.isDatacenter ? 'DATACENTER' : 'DATACENTER (disputed)'),
        rep.isMobile && 'MOBILE'
      ].filter(Boolean);
      lines.push(`- ${maskIp(rep.ip)} (${rep.version}): ${countryName(rep.countryCode)}, ${rep.city || '—'}, ${rep.asn || '—'} ${rep.org || rep.isp || ''}${rep.ptr ? `, PTR=${rep.ptr}` : ''}, flags: ${flags.length ? flags.join(', ') : 'clean'}, risk=${rep.riskScore ?? '—'}, sources=${rep.sources.join('/') || '—'}`);
    }
    lines.push('');

    lines.push(T('## Сервисы ИИ (18 · Cloudflare trace)', '## AI Services (18 · Cloudflare trace)'));
    for (const s of res.services) {
      const allowTxt = s.allowed === true ? 'OK' : s.allowed === false ? 'BLOCK' : '—';
      lines.push(`- ${s.name} (${s.domain}): ${s.ok ? `${maskIp(s.ip)} | ${s.loc || '—'} | ${s.colo || '—'} | ${allowTxt} | ${s.ms}ms` : `FAIL (${s.error})`}`);
    }
    lines.push('');

    if (res.extraProbes?.length) {
      lines.push(T('## Доп. доступность (пинг без чтения IP)', '## Extra Reachability (latency only, no IP read)'));
      for (const p of res.extraProbes) {
        lines.push(`- ${p.name} (${p.domain}): ${p.ok ? `${T('доступен', 'reachable')} (${p.ms}ms)` : `${T('недоступен', 'unreachable')} (${p.error})`}`);
      }
      lines.push('');
    }

    lines.push(T('## Браузер (локально)', '## Browser (local)'));
    lines.push(`- TZ: ${res.browser.tz || '—'}, langs: ${res.browser.languages.join(', ')}, webdriver: ${res.browser.webdriver}, clock drift: ${res.browser.clockDriftSec ?? '—'}s, UA mismatch: ${res.browser.uaMismatch}`);
    lines.push('');
    lines.push(T(
      'Проанализируй этот отчёт и скажи коротко по пунктам, что нужно поправить в VPN/прокси/браузере, чтобы ChatGPT и Claude работали стабильно и без риска блокировки.',
      'Analyze this report and list concise, actionable fixes for my VPN, proxy, or browser so ChatGPT and Claude work reliably without risk of blocks.'
    ));
    return lines.join('\n');
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (_) { return []; }
  }

  function saveHistoryItem(res) {
    try {
      const cg = res.services.find((s) => s.id === 'chatgpt');
      const primaryRep = cg?.ip ? res.reputations[cg.ip] : Object.values(res.reputations)[0];
      const item = {
        ts: res.timestamp,
        score: res.score,
        tone: res.tone,
        loc: cg?.loc || res.aiCountry || '—',
        provider: primaryRep?.org || primaryRep?.isp || '—',
        findings: res.findings.length
      };
      const arr = loadHistory();
      const top = arr[0];
      if (top && top.score === item.score && top.loc === item.loc && top.provider === item.provider && top.findings === item.findings) {
        top.ts = item.ts;
        top.hits = (top.hits || 1) + 1;
      } else {
        item.hits = 1;
        arr.unshift(item);
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 8)));
    } catch (_) {}
  }

  function renderHistory() {
    const list = $('historyList');
    const count = $('historyCount');
    if (!list) return;
    const arr = loadHistory();
    if (count) count.textContent = arr.length ? TF('{n} сохр.', '{n} saved', { n: arr.length }) : T('пусто', 'empty');
    if (!arr.length) {
      list.innerHTML = `<li class="hist-empty">${esc(T('История хранится только в вашем браузере — после первой проверки здесь появится запись для сравнения разных VPN-серверов.', 'History stays strictly in your browser — compare scores before and after switching VPN servers.'))}</li>`;
      return;
    }
    list.innerHTML = arr.map((it) => {
      const d = new Date(it.ts);
      const t = d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
      const day = d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' });
      return `<li>
        <span class="hist-score ${esc(it.tone)}">${it.score}</span>
        <div class="hist-meta">
          <b>${esc(countryName(it.loc))}</b>
          <span>${esc(it.provider)} · ${T('находок', 'findings')}: ${it.findings}</span>
        </div>
        <span class="hist-time">${it.hits > 1 ? `<span class="hist-cnt">×${it.hits}</span>` : ''}${day} ${t}</span>
      </li>`;
    }).join('');
  }

  function setStep(id, text, cls = '') {
    const el = $(`step-${id}`);
    if (!el) return;
    el.className = `step-pill ${cls}`;
    el.querySelector('b').textContent = text;
  }

  function renderServicesTable(res) {
    const filter = state.svcFilter;
    const filtered = res.services.filter((s) => {
      if (filter === 'core') return s.group === 'openai' || s.group === 'anthropic';
      if (filter === 'issues') return !s.ok || s.allowed === false;
      return true;
    });
    const okCount = res.services.filter((s) => s.ok && s.allowed !== false).length;
    const badge = $('svcSummaryBadge');
    if (badge) badge.textContent = TF('доступно {ok}/{total}', 'reachable {ok}/{total}', { ok: okCount, total: res.services.length });

    if (!filtered.length) {
      $('servicesBody').innerHTML = `<tr><td colspan="6" class="dim">${esc(T('По выбранному фильтру записей нет — все сервисы в норме.', 'No rows match this filter — all services look healthy.'))}</td></tr>`;
      return;
    }
    const msUnit = T('мс', 'ms');
    $('servicesBody').innerHTML = filtered.map((s) => {
      let allowCell = `<span class="dim">${T('нет списка', 'no list')}</span>`;
      if (s.allowed === true) allowCell = `<span class="badge ok">${T('пустит', 'allowed')}</span>`;
      else if (s.allowed === false) allowCell = `<span class="badge bad">${T('блок', 'blocked')}</span>`;
      return `<tr>
        <td><b>${esc(s.name)}</b><br><span class="dim mono-xs">${esc(s.domain)}</span></td>
        <td class="mono-xs">${s.ok ? esc(maskIp(s.ip)) : `<span class="bad-t">${esc(s.error || T('ошибка', 'error'))}</span>`}</td>
        <td>${s.loc ? esc(countryName(s.loc)) : '—'}</td>
        <td class="mono-xs">${esc(s.colo || '—')}</td>
        <td>${allowCell}</td>
        <td class="mono-xs num">${s.ms} ${msUnit}</td>
      </tr>`;
    }).join('');
  }

  function showGlossary(termKey) {
    const box = $('glossaryBox');
    if (!box) return;
    if (state.activeTerm === termKey) {
      state.activeTerm = null;
      box.hidden = true;
      document.querySelectorAll('.term-chip').forEach((b) => b.classList.remove('on'));
      return;
    }
    const g = GLOSSARY[termKey];
    if (!g) return;
    state.activeTerm = termKey;
    $('glossaryTitle').textContent = g.title;
    $('glossaryText').textContent = g.text;
    box.hidden = false;
    document.querySelectorAll('.term-chip').forEach((b) => b.classList.toggle('on', b.dataset.term === termKey));
  }

  function renderAll(res) {
    const scoreNum = $('scoreNum');
    scoreNum.textContent = String(res.score);
    scoreNum.className = `score-num ${res.tone}`;
    $('scoreVerdict').textContent = res.verdict;
    $('scoreVerdict').className = `score-verdict ${res.tone}`;

    const deltaEl = $('scoreDelta');
    if (deltaEl) {
      if (typeof res.prevScore === 'number') {
        const diff = res.score - res.prevScore;
        if (diff > 0) {
          deltaEl.textContent = TF('+{diff} к прошлой', '+{diff} vs previous', { diff });
          deltaEl.className = 'badge ok';
          deltaEl.hidden = false;
        } else if (diff < 0) {
          deltaEl.textContent = TF('{diff} к прошлой', '{diff} vs previous', { diff });
          deltaEl.className = 'badge bad';
          deltaEl.hidden = false;
        } else {
          deltaEl.textContent = T('как в прошлой', 'same as previous');
          deltaEl.className = 'badge';
          deltaEl.hidden = false;
        }
      } else {
        deltaEl.hidden = true;
      }
    }

    const cg = res.services.find((s) => s.id === 'chatgpt');
    const cl = res.services.find((s) => s.id === 'claude');
    $('sumChatgpt').innerHTML = cg?.ok
      ? `<span class="dot ${cg.allowed ? 'ok' : 'bad'}"></span>${esc(countryName(cg.loc))} · <code>${esc(maskIp(cg.ip))}</code>`
      : `<span class="dot bad"></span>${esc(cg?.error || T('недоступен', 'unreachable'))}`;
    $('sumClaude').innerHTML = cl?.ok
      ? `<span class="dot ${cl.allowed ? 'ok' : 'bad'}"></span>${esc(countryName(cl.loc))} · <code>${esc(maskIp(cl.ip))}</code>`
      : `<span class="dot bad"></span>${esc(cl?.error || T('недоступен', 'unreachable'))}`;
    $('sumCfDirect').innerHTML = res.ipProto.cfTrace
      ? `${res.splitTunnel ? '<span class="badge ok">split-tunnel</span>' : ''}${esc(countryName(res.ipProto.cfTrace.loc))} · <code>${esc(maskIp(res.ipProto.cfTrace.ip))}</code>`
      : '—';
    $('sumDns').innerHTML = res.dns.ok
      ? `${res.dns.isPublicAnycast ? '<span class="badge ok">anycast</span>' : ''}${esc(res.dns.geo || res.dns.provider || countryName(res.dns.countryCode))}`
      : `<span class="dim">${T('не определён', 'unknown')}</span>`;

    const flist = $('findingsList');
    if (!res.findings.length) {
      flist.innerHTML = `<div class="finding ok">
        <div class="f-head"><b>${T('Критических проблем не найдено', 'No critical issues found')}</b><span class="f-pen ok">−0</span></div>
        <p>${T('Подключение выглядит чисто: страна поддерживается, утечек WebRTC/IPv6/DNS не обнаружено.', 'Connection looks clean: country is supported and no WebRTC/IPv6/DNS leaks were detected.')}${res.splitTunnel ? T(' Split-tunneling работает корректно.', ' Split-tunneling works properly.') : ''}</p>
      </div>`;
    } else {
      flist.innerHTML = res.findings.map((f) => `<div class="finding ${esc(f.severity)}">
        <div class="f-head"><b>${esc(f.title)}</b><span class="f-pen ${esc(f.severity)}">−${f.penalty}</span></div>
        <p>${esc(f.detail)}</p>
        <p class="f-fix"><b>${T('Что сделать:', 'How to fix:')}</b> ${esc(f.fix)}</p>
      </div>`).join('');
    }

    const termLabels = {
      vpn: T('Что такое VPN?', 'What is VPN?'),
      split: T('Что такое split-tunneling?', 'What is split-tunneling?'),
      reputation: T('Репутация IP?', 'IP reputation?'),
      datacenter: T('Адрес дата-центра?', 'Datacenter IP?'),
      webrtc: T('Что такое WebRTC?', 'What is WebRTC?'),
      ipv6: T('Что такое IPv6?', 'What is IPv6?'),
      dns: T('Утечка DNS?', 'DNS leak?'),
      fingerprint: T('Отпечаток браузера?', 'Fingerprinting?')
    };
    $('simpleGrid').innerHTML = res.simpleCards.map((c) => {
      const badge = c.status === 'ok' ? 'OK' : c.status === 'warn' ? T('Внимание', 'Warning') : T('Проблема', 'Issue');
      const chips = (c.terms || []).map((t) =>
        `<button type="button" class="term-chip${state.activeTerm === t ? ' on' : ''}" data-term="${esc(t)}">${esc(termLabels[t] || t)}</button>`
      ).join('');
      return `<div class="cell simple-card ${esc(c.status)}">
        <div class="sc-top"><h3>${esc(c.title)}</h3><span class="badge ${esc(c.status)}">${badge}</span></div>
        <p>${esc(c.text)}</p>
        ${chips ? `<div class="term-row">${chips}</div>` : ''}
      </div>`;
    }).join('');

    $('simpleGrid').querySelectorAll('.term-chip').forEach((btn) => {
      btn.addEventListener('click', () => showGlossary(btn.dataset.term));
    });

    const extraEl = $('extraProbesGrid');
    const msUnit = T('мс', 'ms');
    if (extraEl && res.extraProbes) {
      extraEl.innerHTML = res.extraProbes.map((p) => `
        <div class="probe-pill ${p.ok ? 'ok' : 'bad'}">
          <span class="dot ${p.ok ? 'ok' : 'bad'}"></span>
          <b>${esc(p.name)}</b>
          <span class="mono-xs dim">${p.ok ? `${p.ms} ${msUnit}` : esc(p.error || T('недоступен', 'unreachable'))}</span>
        </div>
      `).join('');
    }

    renderServicesTable(res);

    const reps = Object.values(res.reputations);
    $('repBody').innerHTML = reps.length ? reps.map((r) => {
      const badges = [];
      if (r.isTor) badges.push('<span class="badge bad">Tor</span>');
      if (r.isProxy) badges.push('<span class="badge bad">Proxy</span>');
      if (r.isAbuser) badges.push(`<span class="badge bad">${T('Абьюз', 'Abuse')}</span>`);
      if (r.isVpn) badges.push('<span class="badge warn">VPN</span>');
      else if (r.ptrHeuristicVpn) badges.push(`<span class="badge warn">${T('VPN (PTR)', 'VPN (PTR)')}</span>`);
      if (r.isDatacenter) badges.push(`<span class="badge warn">${T('Хостинг', 'Hosting')}</span>`);
      else if (r.asnHeuristicHosting) badges.push(`<span class="badge warn">${T('Хостинг (спорно)', 'Hosting (disputed)')}</span>`);
      if (r.isMobile) badges.push(`<span class="badge ok">${T('Мобильный', 'Mobile')}</span>`);
      if (!badges.length) badges.push(`<span class="badge ok">${T('Чисто', 'Clean')}</span>`);
      return `<tr>
        <td class="mono-xs">${esc(maskIp(r.ip))}<br><span class="dim">${esc(r.version)}${r.ptr ? ` · ${esc(r.ptr)}` : ''}</span></td>
        <td>${esc(countryName(r.countryCode))}<br><span class="dim">${esc(r.city || '—')}</span></td>
        <td><b>${esc(r.org || r.isp || '—')}</b><br><span class="dim mono-xs">${esc(r.asn || '—')}</span></td>
        <td><div class="badges">${badges.join('')}</div></td>
        <td class="mono-xs num">${r.riskScore !== null ? `${r.riskScore}/100` : '—'}</td>
        <td class="mono-xs dim">${esc(r.sources.join(', ') || '—')}</td>
      </tr>`;
    }).join('') : `<tr><td colspan="6" class="dim">${T('Нет данных по адресам.', 'No IP data yet.')}</td></tr>`;

    $('leakWebrtc').innerHTML = `
      <div class="kv"><span>${T('Поддержка', 'Supported')}</span><b>${res.webrtc.supported ? T('да', 'yes') : T('отключён', 'disabled')}</b></div>
      <div class="kv"><span>${T('Публичные IP (STUN)', 'Public IPs (STUN)')}</span><code>${res.webrtc.publicIps.length ? esc(res.webrtc.publicIps.map(maskIp).join(', ')) : T('не обнаружены', 'none detected')}</code></div>
      <div class="kv"><span>${T('mDNS защита', 'mDNS protection')}</span><b>${res.webrtc.mdns ? T('да (.local)', 'yes (.local)') : T('нет / не сработал', 'none')}</b></div>
      <div class="kv"><span>${T('Локальные IP', 'Local IPs')}</span><code>${res.webrtc.localIps.length ? esc(res.webrtc.localIps.join(', ')) : T('скрыты', 'hidden')}</code></div>
    `;
    const v4r = res.ipProto.ipv4 ? res.reputations[res.ipProto.ipv4] : null;
    const v6r = res.ipProto.ipv6 ? res.reputations[res.ipProto.ipv6] : null;
    $('leakIpv6').innerHTML = `
      <div class="kv"><span>${T('IPv4 выход', 'IPv4 exit')}</span><code>${res.ipProto.ipv4 ? esc(maskIp(res.ipProto.ipv4)) : T('нет ответа', 'no response')}</code></div>
      <div class="kv"><span>${T('Страна IPv4', 'IPv4 country')}</span><b>${v4r?.countryCode ? esc(countryName(v4r.countryCode)) : '—'}</b></div>
      <div class="kv"><span>${T('IPv6 выход', 'IPv6 exit')}</span><code>${res.ipProto.ipv6 ? esc(maskIp(res.ipProto.ipv6)) : T('отключён (утечки нет)', 'disabled (no leak)')}</code></div>
      <div class="kv"><span>${T('Страна IPv6', 'IPv6 country')}</span><b>${v6r?.countryCode ? esc(countryName(v6r.countryCode)) : '—'}</b></div>
    `;
    $('leakDns').innerHTML = `
      <div class="kv"><span>${T('IP резолвера', 'Resolver IP')}</span><code>${res.dns.ok ? esc(maskIp(res.dns.ip)) : T('не определён', 'unknown')}</code></div>
      <div class="kv"><span>${T('Страна / провайдер', 'Country / provider')}</span><b>${esc(res.dns.geo || res.dns.provider || '—')}</b></div>
      <div class="kv"><span>${T('Тип DNS', 'DNS type')}</span><b>${res.dns.isPublicAnycast ? `<span class="ok-t">${T('Публичный anycast', 'Public anycast')}</span>` : T('Обычный / ISP', 'Standard / ISP')}</b></div>
    `;

    const b = res.browser;
    $('browserGrid').innerHTML = `
      <div class="kv"><span>${T('Часовой пояс', 'Timezone')}</span><b>${esc(b.tz || '—')} (UTC${b.tzOffsetMin >= 0 ? '+' : ''}${b.tzOffsetMin / 60})</b></div>
      <div class="kv"><span>${T('Дрейф часов (vs CF)', 'Clock drift (vs CF)')}</span><b>${b.clockDriftSec !== null ? `${b.clockDriftSec > 0 ? '+' : ''}${b.clockDriftSec} ${T('сек', 'sec')}` : '—'}</b></div>
      <div class="kv"><span>navigator.webdriver</span><b>${b.webdriver ? '<span class="bad-t">true</span>' : '<span class="ok-t">false</span>'}</b></div>
      <div class="kv"><span>${T('Языки', 'Languages')}</span><b>${esc(b.languages.join(', ') || '—')}</b></div>
      <div class="kv"><span>${T('Платформа / Client Hints', 'Platform / Client Hints')}</span><b>${esc(b.platform || '—')}${b.uaDataPlatform ? ` / ${esc(b.uaDataPlatform)}` : ''}</b></div>
      <div class="kv"><span>${T('Экран / ядра / RAM', 'Screen / cores / RAM')}</span><b>${esc(b.screen)} · ${b.cores || '—'} ${T('ядер', 'cores')} · ${b.memoryGb ? `${b.memoryGb} ${T('ГБ', 'GB')}` : '—'}</b></div>
      <div class="kv"><span>WebGL renderer</span><code class="wrap-code">${esc(b.webglRenderer)}</code></div>
      <div class="kv"><span>User-Agent</span><code class="wrap-code">${esc(b.ua)}</code></div>
    `;

    let holder = $('alfafond-check-result');
    if (!holder) {
      holder = document.createElement('script');
      holder.id = 'alfafond-check-result';
      holder.type = 'application/json';
      document.body.appendChild(holder);
    }
    holder.textContent = JSON.stringify({
      version: 3, lang: LANG,
      timestamp: res.timestamp, score: res.score, verdict: res.verdict, tone: res.tone,
      aiCountry: res.aiCountry, splitTunnel: res.splitTunnel, findings: res.findings,
      ipProto: res.ipProto, dns: res.dns, webrtc: res.webrtc, browser: res.browser,
      reputations: res.reputations, services: res.services, extraProbes: res.extraProbes,
      markdownReport: buildAiReport(res)
    });
    document.documentElement.setAttribute('data-check-done', '1');
  }

  async function runCheck() {
    if (state.running) return;
    state.running = true;
    document.documentElement.removeAttribute('data-check-done');
    const prevHistory = loadHistory();
    const prevScore = prevHistory.length ? prevHistory[0].score : null;

    const btn = $('btnRun');
    const btnCopy = $('btnCopyReport');
    const btnDl = $('btnDownloadReport');
    const btnShare = $('btnSharePng');
    const btnLink = $('btnShareLink');
    const banner = $('sharedBanner');
    if (banner) banner.hidden = true;
    if (location.hash && location.hash.startsWith('#r=')) {
      try { history.replaceState(null, '', location.pathname + location.search); } catch (_) {}
    }
    btn.disabled = true;
    btn.classList.add('loading');
    btnCopy.disabled = true;
    if (btnDl) btnDl.disabled = true;
    if (btnShare) btnShare.disabled = true;
    if (btnLink) btnLink.disabled = true;

    setProgress(6);
    $('scoreNum').textContent = '··';
    $('scoreNum').className = 'score-num';
    $('scoreVerdict').textContent = T('Проверяем подключение…', 'Checking connection…');
    $('scoreVerdict').className = 'score-verdict';
    if ($('scoreDelta')) $('scoreDelta').hidden = true;
    setStep('services', `0/${AI_SERVICES.length}`, 'active');
    setStep('rep', T('ждёт', 'waiting'));
    setStep('webrtc', T('идёт', 'running'), 'active');
    setStep('ipv6', T('идёт', 'running'), 'active');
    setStep('dns', T('идёт', 'running'), 'active');
    setStep('browser', T('ждёт', 'waiting'));

    let progressPts = 6;
    const bump = (delta) => { progressPts = Math.min(96, progressPts + delta); setProgress(progressPts); };

    const servicesP = checkServices((d, total) => {
      setStep('services', `${d}/${total}`, d === total ? 'ok' : 'active');
      bump(52 / total);
    });
    const extraP = checkExtraProbes().then((res) => { bump(6); return res; });
    const ipProtoP = checkIpProtocols().then((res) => {
      setStep('ipv6', res.ipv6 ? T('есть', 'yes') : T('нет', 'none'), 'ok');
      bump(8);
      return res;
    });
    const webrtcP = checkWebRTC().then((res) => {
      setStep('webrtc', res.publicIps.length ? `${res.publicIps.length} IP` : T('чисто', 'clean'), res.publicIps.length ? 'warn' : 'ok');
      bump(8);
      return res;
    });
    const dnsP = checkDNS().then((res) => {
      setStep('dns', res.ok ? (res.isPublicAnycast ? 'anycast' : (res.countryCode || 'ok')) : T('ошибка', 'error'), res.ok ? 'ok' : 'warn');
      bump(8);
      return res;
    });

    const [services, extraProbes, ipProto, webrtc, dns] = await Promise.all([servicesP, extraP, ipProtoP, webrtcP, dnsP]);

    const uniqueIps = [];
    const pushIp = (ip) => {
      if (ip && !isPrivateIP(ip) && !uniqueIps.includes(ip) && uniqueIps.length < 6) uniqueIps.push(ip);
    };
    const cg = services.find((s) => s.id === 'chatgpt');
    const cl = services.find((s) => s.id === 'claude');
    pushIp(cg?.ip);
    pushIp(cl?.ip);
    pushIp(ipProto.ipv4);
    pushIp(ipProto.ipv6);
    webrtc.publicIps.forEach(pushIp);
    services.forEach((s) => pushIp(s.ip));

    setStep('rep', `0/${uniqueIps.length}`, 'active');
    let repDone = 0;
    const reputations = {};
    await Promise.all(uniqueIps.map(async (ip) => {
      const r = await lookupIpReputation(ip);
      reputations[ip] = r;
      repDone += 1;
      setStep('rep', `${repDone}/${uniqueIps.length}`, repDone === uniqueIps.length ? 'ok' : 'active');
      bump(12 / Math.max(1, uniqueIps.length));
    }));
    if (!uniqueIps.length) setStep('rep', T('нет IP', 'no IP'), 'warn');

    const refTs = cg?.ts || cl?.ts || ipProto.cfTrace?.ts || services.find((s) => s.ts)?.ts || null;
    const browser = checkBrowser(refTs);
    setStep('browser', browser.webdriver || browser.uaMismatch ? T('замечания', 'warnings') : 'ok', browser.webdriver || browser.uaMismatch ? 'warn' : 'ok');
    setProgress(100);

    const evalRes = evaluateAll({ services, ipProto, reputations, webrtc, dns, browser });
    const fullResult = {
      timestamp: Date.now(), prevScore, ...evalRes,
      services, extraProbes, ipProto, reputations, webrtc, dns, browser
    };

    state.result = fullResult;
    saveHistoryItem(fullResult);
    renderHistory();
    renderAll(fullResult);

    btn.disabled = false;
    btn.classList.remove('loading');
    btnCopy.disabled = false;
    if (btnDl) btnDl.disabled = false;
    if (btnShare) btnShare.disabled = false;
    if (btnLink) btnLink.disabled = false;
    state.running = false;
  }

  async function copyText(text, btn, okLabel) {
    const span = btn.querySelector('span') || btn;
    const orig = btn.dataset.orig || span.textContent;
    btn.dataset.orig = orig;
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    span.textContent = okLabel || T('Скопировано', 'Copied');
    setTimeout(() => { span.textContent = orig; }, 2000);
  }

  function downloadMarkdown(res) {
    const md = buildAiReport(res);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const day = new Date(res.timestamp).toISOString().slice(0, 10);
    a.href = url;
    a.download = `alfafond-network-check-${day}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
  }

  function renderShareCardCanvas(res) {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const pal = isLight ? {
      bg: '#f6f7f9', card: '#ffffff', line: 'rgba(15,23,42,0.12)',
      txt: '#111827', sub: '#4b5563', dim: '#64748b',
      ok: '#15803d', okDim: 'rgba(21,128,61,0.11)',
      warn: '#b45309', warnDim: 'rgba(180,83,9,0.12)',
      bad: '#b91c1c', badDim: 'rgba(185,28,28,0.11)',
      tile: '#3ecf8e', tileTxt: '#0a0b0e'
    } : {
      bg: '#101217', card: '#161a23', line: 'rgba(255,255,255,0.10)',
      txt: '#f4f5f7', sub: '#a0a6b0', dim: '#8a909b',
      ok: '#3ecf8e', okDim: 'rgba(62,207,142,0.14)',
      warn: '#e0a23c', warnDim: 'rgba(224,162,60,0.15)',
      bad: '#e0675b', badDim: 'rgba(224,103,91,0.16)',
      tile: '#3ecf8e', tileTxt: '#0a0b0e'
    };

    const W = 1200, H = 630;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    // Фон + мягкое свечение сверху
    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, W, H);
    const grd = ctx.createRadialGradient(W * 0.5, -40, 20, W * 0.5, -40, 520);
    grd.addColorStop(0, isLight ? 'rgba(21,128,61,0.09)' : 'rgba(62,207,142,0.12)');
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // Шапка карточки — фирменная векторная плитка AF с градиентом (идентична SVG на сайте)
    rr(ctx, 56, 46, 40, 40, 10);
    const tileGrad = ctx.createLinearGradient(56, 46, 96, 86);
    tileGrad.addColorStop(0, '#4ae39e');
    tileGrad.addColorStop(1, '#25b876');
    ctx.fillStyle = tileGrad;
    ctx.fill();
    rr(ctx, 57, 47, 38, 38, 9);
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.save();
    ctx.translate(56, 46);
    ctx.scale(40 / 32, 40 / 32);
    ctx.fillStyle = pal.tileTxt;
    ctx.fill(new Path2D('M10 8.5H12L16.5 23.5H13.7L12.75 20.1H9.25L8.3 23.5H5.5L10 8.5ZM11 12.1L9.8 17.6H12.2L11 12.1Z'), 'evenodd');
    ctx.fill(new Path2D('M18.2 8.5H26.5V11.1H20.9V14.9H25V17.4H20.9V23.5H18.2V8.5Z'));
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.fillStyle = pal.txt;
    ctx.font = '700 22px Geologica, Arial, sans-serif';
    ctx.fillText('ALFAFOND', 110, 66);
    ctx.fillStyle = pal.ok;
    ctx.font = '500 18px "IBM Plex Mono", monospace';
    ctx.fillText('/check', 246, 66);

    ctx.textAlign = 'right';
    ctx.fillStyle = pal.dim;
    ctx.font = '400 15px "IBM Plex Mono", monospace';
    const dt = new Date(res.timestamp).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
    ctx.fillText(`${dt} · ${T('IP скрыты', 'IPs masked')}`, W - 56, 66);

    // Левая панель — главный балл
    const toneColor = res.tone === 'ok' ? pal.ok : res.tone === 'warn' ? pal.warn : pal.bad;
    const toneBg = res.tone === 'ok' ? pal.okDim : res.tone === 'warn' ? pal.warnDim : pal.badDim;
    rr(ctx, 56, 118, 430, 396, 20);
    ctx.fillStyle = pal.card;
    ctx.fill();
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = pal.dim;
    ctx.font = '500 14px "IBM Plex Mono", monospace';
    ctx.fillText(T('БАЛЛ ПОДКЛЮЧЕНИЯ', 'CONNECTION SCORE'), 88, 158);

    ctx.fillStyle = toneColor;
    ctx.font = '700 124px Geologica, Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    const scoreStr = String(res.score);
    ctx.fillText(scoreStr, 86, 294);
    const scoreW = ctx.measureText(scoreStr).width;
    ctx.fillStyle = pal.dim;
    ctx.font = '400 32px "IBM Plex Mono", monospace';
    ctx.fillText('/100', 86 + scoreW + 10, 294);

    // Вердикт-бейдж
    ctx.font = '600 20px Geologica, Arial, sans-serif';
    const vw = ctx.measureText(res.verdict).width;
    rr(ctx, 88, 320, Math.min(366, vw + 32), 40, 10);
    ctx.fillStyle = toneBg;
    ctx.fill();
    ctx.fillStyle = toneColor;
    ctx.textBaseline = 'middle';
    ctx.fillText(res.verdict, 104, 341);

    const cg = res.services.find((s) => s.id === 'chatgpt');
    const cl = res.services.find((s) => s.id === 'claude');
    const primaryRep = (cg?.ip && res.reputations[cg.ip]) || Object.values(res.reputations)[0];
    const okServices = res.services.filter((s) => s.ok && s.allowed !== false).length;

    ctx.fillStyle = pal.sub;
    ctx.font = '400 16px "Golos Text", Arial, sans-serif';
    ctx.fillText(`${T('Сервисы ИИ:', 'AI services:')} ${okServices}/${res.services.length}`, 88, 404);
    const prov = primaryRep ? `${primaryRep.org || primaryRep.isp || '—'}${primaryRep.asn ? ` (${primaryRep.asn})` : ''}` : '—';
    ctx.fillText(`${T('Провайдер:', 'Provider:')} ${prov.slice(0, 32)}`, 88, 434);
    ctx.fillText(`${T('Находок:', 'Findings:')} ${res.findings.length}${res.splitTunnel ? ' · split-tunnel' : ''}`, 88, 464);

    // Правая часть — 4 статусных плитки (без реальных IP)
    const cards = [
      {
        k: 'CHATGPT',
        v: cg?.ok ? countryName(cg.loc) : T('Недоступен', 'Unreachable'),
        sub: cg?.ok ? (cg.allowed ? `${T('Пустит', 'Allowed')} · ${cg.colo || 'CF'} · ${cg.ms}ms` : T('Заблокирован', 'Blocked')) : (cg?.error || 'error'),
        ok: Boolean(cg?.ok && cg?.allowed)
      },
      {
        k: 'CLAUDE',
        v: cl?.ok ? countryName(cl.loc) : T('Недоступен', 'Unreachable'),
        sub: cl?.ok ? (cl.allowed ? `${T('Пустит', 'Allowed')} · ${cl.colo || 'CF'} · ${cl.ms}ms` : T('Заблокирован', 'Blocked')) : (cl?.error || 'error'),
        ok: Boolean(cl?.ok && cl?.allowed)
      },
      {
        k: 'WEBRTC / IPV6',
        v: res.webrtc.publicIps.length ? TF('WebRTC: {n} IP', 'WebRTC: {n} IP', { n: res.webrtc.publicIps.length }) : T('Утечек нет', 'No leaks'),
        sub: `IPv6: ${res.ipProto.ipv6 ? T('включён', 'enabled') : T('отключён', 'disabled')} · mDNS: ${res.webrtc.mdns ? T('да', 'yes') : T('нет', 'no')}`,
        ok: res.webrtc.publicIps.length === 0
      },
      {
        k: 'DNS',
        v: res.dns.ok ? (res.dns.isPublicAnycast ? T('Публичный anycast', 'Public anycast') : countryName(res.dns.countryCode)) : T('Не определён', 'Unknown'),
        sub: (res.dns.geo || res.dns.provider || 'edns.ip-api.com').slice(0, 34),
        ok: Boolean(res.dns.ok && (res.dns.isPublicAnycast || res.dns.countryCode !== 'RU'))
      }
    ];

    cards.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = 514 + col * 324;
      const y = 118 + row * 144;
      rr(ctx, x, y, 306, 126, 16);
      ctx.fillStyle = pal.card;
      ctx.fill();
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = pal.dim;
      ctx.font = '500 13px "IBM Plex Mono", monospace';
      ctx.fillText(item.k, x + 22, y + 30);

      // Статусная точка
      ctx.beginPath();
      ctx.arc(x + 282, y + 30, 5, 0, Math.PI * 2);
      ctx.fillStyle = item.ok ? pal.ok : pal.warn;
      ctx.fill();

      ctx.fillStyle = pal.txt;
      ctx.font = '600 20px Geologica, Arial, sans-serif';
      ctx.fillText(item.v.slice(0, 23), x + 22, y + 66);

      ctx.fillStyle = pal.sub;
      ctx.font = '400 14px "IBM Plex Mono", monospace';
      ctx.fillText(item.sub.slice(0, 30), x + 22, y + 98);
    });

    // Блок главных находок справа внизу
    rr(ctx, 514, 406, 630, 108, 16);
    ctx.fillStyle = pal.card;
    ctx.fill();
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = pal.dim;
    ctx.font = '500 13px "IBM Plex Mono", monospace';
    ctx.fillText(T('ГЛАВНЫЕ НАХОДКИ', 'TOP FINDINGS'), 536, 434);
    ctx.fillStyle = pal.txt;
    ctx.font = '400 15px "Golos Text", Arial, sans-serif';
    if (!res.findings.length) {
      ctx.fillStyle = pal.ok;
      ctx.fillText(T('Проблем не обнаружено — подключение чистое.', 'No issues detected — connection looks clean.'), 536, 472);
    } else {
      res.findings.slice(0, 2).forEach((f, i) => {
        ctx.fillStyle = f.severity === 'bad' ? pal.bad : pal.warn;
        ctx.fillText(`−${f.penalty}  ${f.title}`.slice(0, 62), 536, 464 + i * 26);
      });
    }

    // Нижняя строка карточки
    ctx.fillStyle = pal.ok;
    ctx.font = '500 16px "IBM Plex Mono", monospace';
    ctx.fillText(CHECK_URL, 56, H - 46);
    ctx.textAlign = 'right';
    ctx.fillStyle = pal.dim;
    ctx.font = '400 14px "IBM Plex Mono", monospace';
    ctx.fillText(T('100% в браузере · без сохранения IP', '100% in-browser · zero IP logging'), W - 56, H - 46);

    return c;
  }

  async function shareResultPng(res, btn) {
    const span = btn.querySelector('span') || btn;
    const orig = btn.dataset.orig || span.textContent;
    btn.dataset.orig = orig;
    try {
      const canvas = renderShareCardCanvas(res);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) return;
      const filename = `alfafond-check-${res.score}.png`;
      const file = new File([blob], filename, { type: 'image/png' });

      // 1. Нативный Web Share на мобильных (Telegram / WhatsApp / AirDrop)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: TF('Проверка сети: {score}/100', 'Network check: {score}/100', { score: res.score }),
            text: TF('Мой результат проверки VPN для ChatGPT и Claude: {score}/100 — {url}', 'My VPN check for ChatGPT & Claude: {score}/100 — {url}', { score: res.score, url: CHECK_URL }),
            files: [file]
          });
          span.textContent = T('Отправлено', 'Shared');
          setTimeout(() => { span.textContent = orig; }, 2000);
          return;
        } catch (err) {
          if (err && err.name === 'AbortError') return;
        }
      }

      // 2. Десктоп: пробуем скопировать PNG в буфер + сохраняем файл
      let copied = false;
      if (navigator.clipboard && window.ClipboardItem) {
        try {
          await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
          copied = true;
        } catch (_) {}
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);

      span.textContent = copied ? T('PNG скопирован и скачан', 'PNG copied & saved') : T('PNG скачан', 'PNG saved');
      setTimeout(() => { span.textContent = orig; }, 2400);
    } catch (_) {
      span.textContent = T('Ошибка PNG', 'PNG error');
      setTimeout(() => { span.textContent = orig; }, 2000);
    }
  }

  // --- Ссылка-снимок результата в URL-хэше (#r=...) строго без реальных IP ---
  function b64uEncode(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function b64uDecode(b64u) {
    const b64 = b64u.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64u.length + 3) % 4);
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildShareUrl(res) {
    const cg = res.services.find((s) => s.id === 'chatgpt');
    const cl = res.services.find((s) => s.id === 'claude');
    const primaryRep = (cg?.ip && res.reputations[cg.ip]) || Object.values(res.reputations)[0] || null;
    const snap = {
      v: 1,
      ts: res.timestamp,
      s: res.score,
      t: res.tone,
      cg: cg ? [cg.ok ? 1 : 0, cg.loc || '', cg.colo || '', cg.allowed === true ? 1 : (cg.allowed === false ? 0 : -1), cg.ms || 0] : null,
      cl: cl ? [cl.ok ? 1 : 0, cl.loc || '', cl.colo || '', cl.allowed === true ? 1 : (cl.allowed === false ? 0 : -1), cl.ms || 0] : null,
      cf: res.ipProto.cfTrace ? [res.ipProto.cfTrace.loc || '', res.ipProto.cfTrace.colo || ''] : null,
      st: res.splitTunnel ? 1 : 0,
      so: res.services.filter((x) => x.ok && x.allowed !== false).length,
      sa: res.services.length,
      pr: primaryRep ? [
        (primaryRep.org || primaryRep.isp || '').slice(0, 48),
        (primaryRep.asn || '').slice(0, 16),
        primaryRep.countryCode || '',
        (primaryRep.city || '').slice(0, 32),
        primaryRep.isVpn ? 1 : 0,
        primaryRep.isDatacenter ? 1 : 0,
        primaryRep.isProxy ? 1 : 0,
        primaryRep.isTor ? 1 : 0,
        primaryRep.riskScore
      ] : null,
      wr: [res.webrtc.publicIps.length, res.webrtc.mdns ? 1 : 0],
      v6: res.ipProto.ipv6 ? 1 : 0,
      dn: res.dns.ok ? [res.dns.countryCode || '', (res.dns.geo || res.dns.provider || '').slice(0, 48), res.dns.isPublicAnycast ? 1 : 0] : null,
      f: res.findings.slice(0, 8).map((x) => [x.severity, x.penalty, x.title.slice(0, 110), x.detail.slice(0, 180), x.fix.slice(0, 160)])
    };
    const encoded = b64uEncode(JSON.stringify(snap));
    return `${location.origin}${location.pathname}#r=${encoded}`;
  }

  function decodeShareHash() {
    if (!location.hash || !location.hash.startsWith('#r=')) return null;
    try {
      const raw = location.hash.slice(3).trim();
      if (!raw || raw.length > 8000) return null;
      const snap = JSON.parse(b64uDecode(raw));
      if (!snap || snap.v !== 1 || typeof snap.s !== 'number') return null;
      return snap;
    } catch (_) {
      return null;
    }
  }

  function loadSharedSnapshot(snap) {
    const masked = T('скрыт в ссылке', 'hidden in link');
    const makeSvc = (base, arr) => ({
      ...base,
      ok: Boolean(arr && arr[0]),
      ip: arr && arr[0] ? masked : null,
      loc: arr && arr[1] ? String(arr[1]) : null,
      colo: arr && arr[2] ? String(arr[2]) : null,
      allowed: arr ? (arr[3] === 1 ? true : (arr[3] === 0 ? false : null)) : null,
      ms: arr ? Number(arr[4] || 0) : 0,
      error: arr && !arr[0] ? T('недоступен', 'unreachable') : null
    });

    const services = AI_SERVICES.map((base) => {
      if (base.id === 'chatgpt') return makeSvc(base, snap.cg);
      if (base.id === 'claude') return makeSvc(base, snap.cl);
      return { ...base, ok: false, ip: null, loc: null, colo: null, allowed: null, ms: 0, error: T('не сохраняется в короткой ссылке', 'omitted in share link') };
    });

    const reputations = {};
    if (snap.pr) {
      reputations[masked] = {
        ip: masked, version: '—', sources: ['shared'],
        org: String(snap.pr[0] || '—'), asn: String(snap.pr[1] || '—'),
        isp: String(snap.pr[0] || '—'), countryCode: String(snap.pr[2] || ''),
        city: String(snap.pr[3] || ''),
        isVpn: Boolean(snap.pr[4]), isDatacenter: Boolean(snap.pr[5]),
        isProxy: Boolean(snap.pr[6]), isTor: Boolean(snap.pr[7]),
        isMobile: false, riskScore: typeof snap.pr[8] === 'number' ? snap.pr[8] : null,
        asnHeuristicHosting: false, asnHeuristicVpn: false, disagreement: false
      };
    }

    const ipProto = {
      ipv4: masked,
      ipv6: snap.v6 ? masked : null,
      cfTrace: snap.cf ? { ip: masked, loc: String(snap.cf[0] || ''), colo: String(snap.cf[1] || '') } : null
    };
    const webrtc = {
      supported: true,
      publicIps: snap.wr && snap.wr[0] > 0 ? Array(Math.min(3, snap.wr[0])).fill(masked) : [],
      localIps: [],
      mdns: Boolean(snap.wr && snap.wr[1])
    };
    const dns = snap.dn ? {
      ok: true, ip: masked, countryCode: String(snap.dn[0] || ''),
      geo: String(snap.dn[1] || ''), provider: String(snap.dn[1] || ''),
      isPublicAnycast: Boolean(snap.dn[2])
    } : { ok: false, ip: null, geo: null, countryCode: null, provider: null, isPublicAnycast: false };

    const browser = {
      ua: T('не передаётся в ссылке', 'not included in shared link'),
      platform: '—', uaDataPlatform: null, uaMismatch: false, webdriver: false,
      tz: '—', tzCountryHint: null, tzOffsetMin: 0, languages: [],
      clockDriftSec: null, screen: '—', cores: null, memoryGb: null,
      webglRenderer: '—', cookiesEnabled: true
    };

    const findings = Array.isArray(snap.f) ? snap.f.map((x) => ({
      severity: ['ok', 'warn', 'bad'].includes(x[0]) ? x[0] : 'warn',
      penalty: Number(x[1] || 0),
      title: String(x[2] || ''),
      detail: String(x[3] || ''),
      fix: String(x[4] || '')
    })) : [];

    const score = Math.max(0, Math.min(100, Math.round(Number(snap.s) || 0)));
    const tone = ['ok', 'warn', 'bad'].includes(snap.t) ? snap.t : (score >= 80 ? 'ok' : score >= 50 ? 'warn' : 'bad');
    const verdict = tone === 'ok' ? T('Отличное подключение', 'Great connection')
      : tone === 'warn' ? T('Есть замечания', 'Some warnings') : T('Высокий риск блокировки', 'High risk of blocks');

    const byId = Object.fromEntries(services.map((s) => [s.id, s]));
    const aiCountry = byId.chatgpt?.loc || byId.claude?.loc || snap.pr?.[2] || null;
    const simpleCards = buildSimpleCards({
      byId, ipProto, primaryReps: Object.values(reputations), reputations, webrtc, dns, browser,
      openaiIps: new Set(byId.chatgpt?.ok ? [masked] : []),
      anthropicIps: new Set(byId.claude?.ok ? [masked] : []),
      aiCountry, splitTunnel: Boolean(snap.st)
    });

    const res = {
      timestamp: Number(snap.ts) || Date.now(),
      prevScore: null, score, verdict, tone, aiCountry,
      splitTunnel: Boolean(snap.st), findings, simpleCards,
      services, extraProbes: [], ipProto, reputations, webrtc, dns, browser
    };

    state.result = res;
    setProgress(100);
    setStep('services', `${snap.so ?? '—'}/${snap.sa ?? AI_SERVICES.length}`, 'ok');
    setStep('rep', snap.pr ? '1/1' : '—', 'ok');
    setStep('webrtc', webrtc.publicIps.length ? `${webrtc.publicIps.length} IP` : T('чисто', 'clean'), webrtc.publicIps.length ? 'warn' : 'ok');
    setStep('ipv6', ipProto.ipv6 ? T('есть', 'yes') : T('нет', 'none'), 'ok');
    setStep('dns', dns.ok ? (dns.isPublicAnycast ? 'anycast' : (dns.countryCode || 'ok')) : '—', dns.ok ? 'ok' : 'warn');
    setStep('browser', T('скрыт', 'private'), 'ok');

    renderAll(res);

    const banner = $('sharedBanner');
    const btxt = $('sharedBannerText');
    if (banner && btxt) {
      const dt = new Date(res.timestamp).toLocaleString(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });
      btxt.innerHTML = `<b>${T('Сохранённый результат', 'Shared snapshot')}</b> ${TF('от {dt} — IP-адреса и данные браузера отправителя не передаются.', 'from {dt} — sender IP addresses and browser fingerprint are excluded.', { dt })}`;
      banner.hidden = false;
    }

    ['btnCopyReport', 'btnDownloadReport', 'btnSharePng', 'btnShareLink'].forEach((id) => {
      const el = $(id);
      if (el) el.disabled = false;
    });
  }

  function initTheme() {
    const btn = $('btnTheme');
    if (!btn) return;
    const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>';
    const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
    const apply = (theme) => {
      const isLight = theme === 'light';
      document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
      btn.innerHTML = isLight ? MOON : SUN;
      const lbl = isLight ? T('Включить тёмную тему', 'Switch to dark theme') : T('Включить светлую тему', 'Switch to light theme');
      btn.setAttribute('aria-label', lbl);
      btn.setAttribute('title', lbl);
    };
    const saved = (() => { try { return localStorage.getItem('af_check_theme'); } catch (_) { return null; } })();
    apply(saved === 'light' ? 'light' : 'dark');
    btn.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('af_check_theme', next); } catch (_) {}
      apply(next);
    });
  }

  function initUI() {
    initTheme();
    renderHistory();

    $('btnRun').addEventListener('click', runCheck);

    const btnShare = $('btnSharePng');
    if (btnShare) {
      btnShare.addEventListener('click', () => {
        if (!state.result) return;
        shareResultPng(state.result, btnShare);
      });
    }

    const btnLink = $('btnShareLink');
    if (btnLink) {
      const LINK_SVG = btnLink.innerHTML;
      const CHECK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
      btnLink.addEventListener('click', async () => {
        if (!state.result) return;
        const url = buildShareUrl(state.result);
        try {
          await navigator.clipboard.writeText(url);
        } catch (_) {
          const ta = document.createElement('textarea');
          ta.value = url;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          ta.remove();
        }
        btnLink.classList.add('active');
        btnLink.innerHTML = CHECK_SVG;
        const origTitle = btnLink.getAttribute('title') || '';
        btnLink.setAttribute('title', T('Ссылка скопирована!', 'Link copied!'));
        setTimeout(() => {
          btnLink.classList.remove('active');
          btnLink.innerHTML = LINK_SVG;
          btnLink.setAttribute('title', origTitle);
        }, 2000);
      });
    }

    const btnRunOwn = $('btnRunOwn');
    if (btnRunOwn) {
      btnRunOwn.addEventListener('click', runCheck);
    }

    $('btnCopyReport').addEventListener('click', () => {
      if (!state.result) return;
      copyText(buildAiReport(state.result), $('btnCopyReport'), T('Скопировано', 'Copied'));
    });

    const btnDl = $('btnDownloadReport');
    if (btnDl) {
      btnDl.addEventListener('click', () => {
        if (!state.result) return;
        downloadMarkdown(state.result);
      });
    }

    $('btnHideIp').addEventListener('click', () => {
      state.hideIp = !state.hideIp;
      const b = $('btnHideIp');
      b.setAttribute('aria-pressed', String(state.hideIp));
      b.classList.toggle('active', state.hideIp);
      b.querySelector('span').textContent = state.hideIp ? T('Показать IP', 'Show IP') : T('Скрыть IP', 'Hide IP');
      if (state.result) renderAll(state.result);
    });

    $('btnClearHistory').addEventListener('click', () => {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
    });

    const closeG = $('glossaryClose');
    if (closeG) {
      closeG.addEventListener('click', () => {
        state.activeTerm = null;
        $('glossaryBox').hidden = true;
        document.querySelectorAll('.term-chip').forEach((b) => b.classList.remove('on'));
      });
    }

    document.querySelectorAll('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.tab;
        state.tab = t;
        document.querySelectorAll('[data-tab]').forEach((b) => {
          const on = b.dataset.tab === t;
          b.classList.toggle('on', on);
          b.setAttribute('aria-selected', String(on));
        });
        $('panelSimple').hidden = t !== 'simple';
        $('panelTech').hidden = t !== 'tech';
      });
    });

    document.querySelectorAll('[data-svc-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.svcFilter = btn.dataset.svcFilter;
        document.querySelectorAll('[data-svc-filter]').forEach((b) => {
          b.classList.toggle('on', b.dataset.svcFilter === state.svcFilter);
        });
        if (state.result) renderServicesTable(state.result);
      });
    });

    const goTech = $('goTechTab');
    if (goTech) {
      goTech.addEventListener('click', () => {
        document.querySelector('[data-tab="tech"]')?.click();
        $('tabsBar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    const cmds = {
      unix: 'curl -fsSL https://alfafond.com/check.sh | sh',
      win: 'irm https://alfafond.com/check.ps1 | iex'
    };
    document.querySelectorAll('[data-os]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const os = btn.dataset.os;
        document.querySelectorAll('[data-os]').forEach((b) => b.classList.toggle('on', b.dataset.os === os));
        $('agentCmd').textContent = cmds[os];
      });
    });

    $('btnCopyCmd').addEventListener('click', () => {
      copyText($('agentCmd').textContent, $('btnCopyCmd'), T('Скопировано', 'Copied'));
    });

    $('btnCopySkill').addEventListener('click', async () => {
      const btn = $('btnCopySkill');
      const r = await fetchTimeout('/check-skill.md', {}, 5000);
      if (r.ok && r.text) copyText(r.text, btn, T('Скилл скопирован', 'Skill copied'));
      else copyText('https://alfafond.com/check-skill.md', btn, T('Скопирована ссылка', 'Link copied'));
    });

    const shared = decodeShareHash();
    if (shared) {
      loadSharedSnapshot(shared);
    } else {
      runCheck();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
