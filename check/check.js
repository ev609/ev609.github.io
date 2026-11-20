/* AlfaFond /check — клиентская диагностика сети для ChatGPT, Claude и 16 ИИ-сервисов.
 * Все проверки выполняются прямо в браузере; IP пользователя на сервер AlfaFond не отправляется.
 */
(function () {
  'use strict';

  // 18 сервисов ИИ за Cloudflare (каждый отдаёт /cdn-cgi/trace с CORS Access-Control-Allow-Origin: *)
  const AI_SERVICES = [
    { id: 'chatgpt',       name: 'ChatGPT',          domain: 'chatgpt.com',          group: 'openai',    policy: 'openai' },
    { id: 'openai_api',    name: 'OpenAI API',       domain: 'api.openai.com',       group: 'openai',    policy: 'openai' },
    { id: 'openai_auth',   name: 'Вход в OpenAI',    domain: 'auth.openai.com',      group: 'openai',    policy: 'openai' },
    { id: 'sora',          name: 'Sora',             domain: 'sora.chatgpt.com',     group: 'openai',    policy: 'openai' },
    { id: 'claude',        name: 'Claude',           domain: 'claude.ai',            group: 'anthropic', policy: 'anthropic' },
    { id: 'claude_api',    name: 'Claude API',       domain: 'api.anthropic.com',    group: 'anthropic', policy: 'anthropic' },
    { id: 'claude_console',name: 'Консоль Claude',   domain: 'platform.claude.com',  group: 'anthropic', policy: 'anthropic' },
    { id: 'perplexity',    name: 'Perplexity',       domain: 'www.perplexity.ai',    group: 'other',     policy: null },
    { id: 'grok',          name: 'Grok',             domain: 'grok.com',             group: 'other',     policy: null },
    { id: 'mistral',       name: 'Le Chat (Mistral)',domain: 'chat.mistral.ai',      group: 'other',     policy: null },
    { id: 'copilot',       name: 'Copilot',          domain: 'copilot.microsoft.com',group: 'other',     policy: null },
    { id: 'midjourney',    name: 'Midjourney',       domain: 'www.midjourney.com',   group: 'other',     policy: null },
    { id: 'suno',          name: 'Suno',             domain: 'suno.com',             group: 'other',     policy: null },
    { id: 'openrouter',    name: 'OpenRouter',       domain: 'openrouter.ai',        group: 'other',     policy: null },
    { id: 'poe',           name: 'Poe',              domain: 'poe.com',              group: 'other',     policy: null },
    { id: 'character',     name: 'Character.AI',     domain: 'character.ai',         group: 'other',     policy: null },
    { id: 'lmarena',       name: 'LMArena',          domain: 'lmarena.ai',           group: 'other',     policy: null },
    { id: 'notion',        name: 'Notion',           domain: 'www.notion.so',        group: 'other',     policy: null }
  ];

  // Страны, где OpenAI / Anthropic официально недоступны (по публичным спискам)
  const BLOCKED_OPENAI = new Set([
    'RU', 'BY', 'CN', 'HK', 'MO', 'KP', 'IR', 'SY', 'CU', 'VE',
    'AF', 'CF', 'ER', 'LY', 'SD', 'SS', 'YE', 'SO', 'TD', 'ZW'
  ]);
  const BLOCKED_ANTHROPIC = new Set([
    'RU', 'BY', 'CN', 'HK', 'MO', 'KP', 'IR', 'SY', 'CU', 'VE',
    'AF', 'CF', 'CD', 'ET', 'LY', 'ML', 'MM', 'NI', 'SO', 'SS', 'SD', 'YE', 'ZW'
  ]);

  // Известные хостинг- и VPN-провайдеры (для кросс-проверки ASN)
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

  // Названия популярных стран на русском
  const COUNTRY_RU = {
    RU: 'Россия', US: 'США', NL: 'Нидерланды', DE: 'Германия', GB: 'Великобритания',
    FR: 'Франция', FI: 'Финляндия', SE: 'Швеция', NO: 'Норвегия', CH: 'Швейцария',
    AT: 'Австрия', PL: 'Польша', CZ: 'Чехия', EE: 'Эстония', LV: 'Латвия', LT: 'Литва',
    TR: 'Турция', KZ: 'Казахстан', AM: 'Армения', GE: 'Грузия', UA: 'Украина',
    BY: 'Беларусь', CA: 'Канада', SG: 'Сингапур', JP: 'Япония', KR: 'Южная Корея',
    AU: 'Австралия', IE: 'Ирландия', ES: 'Испания', IT: 'Италия', PT: 'Португалия',
    BE: 'Бельгия', DK: 'Дания', LU: 'Люксембург', RO: 'Румыния', BG: 'Болгария',
    HU: 'Венгрия', SK: 'Словакия', RS: 'Сербия', IL: 'Израиль', AE: 'ОАЭ',
    IN: 'Индия', BR: 'Бразилия', MX: 'Мексика', HK: 'Гонконг', CN: 'Китай',
    TW: 'Тайвань', MD: 'Молдова', CY: 'Кипр', GR: 'Греция', IS: 'Исландия'
  };

  // Карта соответствия таймзон → коды стран (базовые зоны)
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

  const HISTORY_KEY = 'af_netcheck_history_v1';

  const state = {
    running: false,
    hideIp: false,
    tab: 'simple',
    result: null
  };

  // --- Утилиты ---
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function countryName(code) {
    if (!code) return 'неизвестно';
    const c = String(code).toUpperCase();
    return COUNTRY_RU[c] ? `${COUNTRY_RU[c]} (${c})` : c;
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
      const text = await res.text();
      return { ok: res.ok, status: res.status, text, ms: Math.round(performance.now() - t0) };
    } catch (err) {
      return { ok: false, status: 0, text: '', ms: Math.round(performance.now() - t0), error: err.name === 'AbortError' ? 'таймаут' : 'недоступен' };
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

  // --- Этап 1: опрос 18 ИИ-сервисов + 1.1.1.1 (split-tunnel check) ---
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

  // --- Этап 2: IPv4 / IPv6 + 1.1.1.1 direct trace ---
  async function checkIpProtocols() {
    const [v4a, v4b, v6a, v6b, cfDirect] = await Promise.all([
      fetchTimeout('https://api4.ipify.org?format=json', {}, 5500),
      fetchTimeout('https://ipv4.icanhazip.com/', {}, 5500),
      fetchTimeout('https://api6.ipify.org?format=json', {}, 4500),
      fetchTimeout('https://ipv6.icanhazip.com/', {}, 4500),
      fetchTimeout('https://1.1.1.1/cdn-cgi/trace', {}, 5000)
    ]);

    let ipv4 = null;
    if (v4a.ok) {
      try { ipv4 = JSON.parse(v4a.text).ip || null; } catch (_) {}
    }
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
      if (kv.ip) cfTrace = { ip: kv.ip, loc: kv.loc || null, colo: kv.colo || null, ts: kv.ts ? parseFloat(kv.ts) : null };
    }

    return { ipv4, ipv6, cfTrace };
  }

  // --- Этап 3: Репутация уникальных IP (3 независимых источника с CORS) ---
  async function lookupIpReputation(ip) {
    const encoded = encodeURIComponent(ip);
    const [q1, q2, q3] = await Promise.all([
      fetchTimeout(`https://api.ipquery.io/${encoded}`, {}, 6500),
      fetchTimeout(`https://ipwho.is/${encoded}`, {}, 6500),
      fetchTimeout(`https://api.ipapi.is/?q=${encoded}`, {}, 6500)
    ]);

    const rep = {
      ip,
      version: isIPv6(ip) ? 'IPv6' : 'IPv4',
      sources: [],
      countryCode: null,
      country: null,
      city: null,
      timezone: null,
      asn: null,
      org: null,
      isp: null,
      isVpn: false,
      isProxy: false,
      isTor: false,
      isDatacenter: false,
      isMobile: false,
      riskScore: null,
      asnHeuristicHosting: false,
      asnHeuristicVpn: false,
      disagreement: false
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
            rep.isVpn = Boolean(d.risk.is_vpn);
            rep.isProxy = Boolean(d.risk.is_proxy);
            rep.isTor = Boolean(d.risk.is_tor);
            rep.isDatacenter = Boolean(d.risk.is_datacenter);
            rep.isMobile = Boolean(d.risk.is_mobile);
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
          rep.country = rep.country || d.country;
          rep.city = rep.city || d.city;
          rep.timezone = rep.timezone || d.timezone;
          rep.asn = rep.asn || (typeof d.asn === 'string' ? d.asn.split(' ')[0] : null);
          rep.org = rep.org || (typeof d.asn === 'string' ? d.asn.replace(/^AS\d+\s*/, '') : null) || d.company;
          if (!rep.isp && d.company && d.company !== 'Private Customer') rep.isp = d.company;
        }
      } catch (_) {}
    }

    const blob = `${rep.asn || ''} ${rep.org || ''} ${rep.isp || ''}`.toLowerCase();
    rep.asnHeuristicHosting = HOSTING_KEYWORDS.some((kw) => blob.includes(kw));
    rep.asnHeuristicVpn = VPN_KEYWORDS.some((kw) => blob.includes(kw));

    // Если ipquery не отметил datacenter/vpn, а ASN явно хостинговый — помечаем «спорно»
    if (!rep.isDatacenter && rep.asnHeuristicHosting) {
      rep.disagreement = true;
    }
    if (!rep.isVpn && rep.asnHeuristicVpn) {
      rep.disagreement = true;
    }

    return rep;
  }

  // --- Этап 4: WebRTC утечка (STUN Cloudflare + Google) ---
  function checkWebRTC() {
    return new Promise((resolve) => {
      const RTCPC = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      if (!RTCPC) {
        resolve({ supported: false, publicIps: [], localIps: [], mdns: false });
        return;
      }

      const publicIps = new Set();
      const localIps = new Set();
      let mdns = false;
      let finished = false;
      let pc = null;

      const finish = () => {
        if (finished) return;
        finished = true;
        try { if (pc) pc.close(); } catch (_) {}
        resolve({
          supported: true,
          publicIps: Array.from(publicIps),
          localIps: Array.from(localIps),
          mdns
        });
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
          if (!ev || !ev.candidate) {
            finish();
            return;
          }
          const cand = ev.candidate.candidate || '';
          const m = cand.match(/candidate:\S+\s+\d+\s+\S+\s+\d+\s+(\S+)\s+\d+\s+typ\s+(\S+)/);
          if (!m) return;
          const addr = m[1];
          const typ = m[2];
          if (addr.endsWith('.local')) {
            mdns = true;
            return;
          }
          if (isPrivateIP(addr)) {
            localIps.add(addr);
          } else if (typ === 'srflx' || typ === 'prflx' || typ === 'host') {
            publicIps.add(addr);
          }
        };
        pc.onicegatheringstatechange = () => {
          if (pc && pc.iceGatheringState === 'complete') finish();
        };
        pc.createOffer().then((offer) => pc.setLocalDescription(offer)).catch(finish);
        setTimeout(finish, 4200);
      } catch (_) {
        finish();
      }
    });
  }

  // --- Этап 5: DNS-утечка (edns.ip-api.com) ---
  async function checkDNS() {
    const r = await fetchTimeout(`https://edns.ip-api.com/json?_=${Date.now()}`, {}, 6500);
    if (!r.ok) {
      return { ok: false, ip: null, geo: null, countryCode: null, provider: null, error: r.error || `HTTP ${r.status}` };
    }
    try {
      const d = JSON.parse(r.text);
      const ip = d.dns?.ip || null;
      const geo = d.dns?.geo || null;
      let provider = null;
      if (geo && geo.includes(' - ')) {
        provider = geo.split(' - ').slice(1).join(' - ').trim();
      }
      // Определим точный код страны DNS-сервера
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
      return { ok: Boolean(ip), ip, geo, countryCode, provider };
    } catch (_) {
      return { ok: false, ip: null, geo: null, countryCode: null, provider: null, error: 'ошибка разбора' };
    }
  }

  // --- Этап 6: Браузер и отпечаток (100% локально) ---
  function checkBrowser(referenceServerTs) {
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const tz = (() => {
      try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; }
      catch (_) { return ''; }
    })();
    const tzOffsetMin = -new Date().getTimezoneOffset();
    const languages = Array.isArray(navigator.languages) ? navigator.languages.slice(0, 5) : [navigator.language || ''];
    const webdriver = Boolean(navigator.webdriver);
    const uaDataPlatform = navigator.userAgentData?.platform || null;
    const uaDataBrands = Array.isArray(navigator.userAgentData?.brands)
      ? navigator.userAgentData.brands.map((b) => `${b.brand} ${b.version}`).join(', ')
      : null;

    // Проверка несогласованности UA vs platform
    let uaMismatch = false;
    if (uaDataPlatform) {
      const pLow = uaDataPlatform.toLowerCase();
      const uaLow = ua.toLowerCase();
      if (pLow.includes('mac') && uaLow.includes('windows')) uaMismatch = true;
      if (pLow.includes('win') && uaLow.includes('mac os')) uaMismatch = true;
      if (pLow.includes('linux') && (uaLow.includes('windows') || uaLow.includes('mac os'))) uaMismatch = true;
    }

    // Дрейф системных часов против точного ts Cloudflare
    let clockDriftSec = null;
    if (typeof referenceServerTs === 'number' && Number.isFinite(referenceServerTs)) {
      clockDriftSec = Math.round(Date.now() / 1000 - referenceServerTs);
    }

    // WebGL renderer (локально, без отправки)
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
      ua,
      platform,
      uaDataPlatform,
      uaDataBrands,
      uaMismatch,
      webdriver,
      tz,
      tzCountryHint: TZ_COUNTRY_HINTS[tz] || null,
      tzOffsetMin,
      languages,
      clockDriftSec,
      screen: `${window.screen.width}×${window.screen.height} @${window.devicePixelRatio || 1}x`,
      cores: navigator.hardwareConcurrency || null,
      memoryGb: navigator.deviceMemory || null,
      webglRenderer,
      cookiesEnabled: navigator.cookieEnabled
    };
  }

  // --- Расчёт скоринга и находок ---
  function evaluateAll({ services, ipProto, reputations, webrtc, dns, browser }) {
    const findings = [];
    const addFinding = (severity, penalty, title, detail, fix) => {
      findings.push({ severity, penalty, title, detail, fix });
    };

    const byId = Object.fromEntries(services.map((s) => [s.id, s]));
    const chatgpt = byId.chatgpt;
    const claude = byId.claude;

    // 1. Доступность ChatGPT и Claude по стране
    if (chatgpt && chatgpt.ok && chatgpt.allowed === false) {
      addFinding('bad', 50,
        `ChatGPT видит неподдерживаемую страну: ${countryName(chatgpt.loc)}`,
        'OpenAI не обслуживает эту страну — вход и API будут заблокированы даже с оплаченной подпиской.',
        'Переключите VPN/прокси на поддерживаемую страну (например, Нидерланды, Германию, США, Финляндию).'
      );
    } else if (chatgpt && !chatgpt.ok) {
      addFinding('bad', 35,
        'ChatGPT недоступен из текущей сети',
        `Запрос к chatgpt.com завершился ошибкой (${chatgpt.error || 'нет ответа'}).`,
        'Проверьте, что домен chatgpt.com идёт через рабочий VPN/прокси.'
      );
    }

    if (claude && claude.ok && claude.allowed === false) {
      addFinding('bad', 50,
        `Claude видит неподдерживаемую страну: ${countryName(claude.loc)}`,
        'Anthropic ограничивает доступ из этой страны и может заблокировать аккаунт при входе.',
        'Направьте домены claude.ai, api.anthropic.com и platform.claude.com через поддерживаемую страну.'
      );
    } else if (claude && !claude.ok) {
      addFinding('bad', 35,
        'Claude недоступен из текущей сети',
        `Запрос к claude.ai завершился ошибкой (${claude.error || 'нет ответа'}).`,
        'Проверьте маршрутизацию claude.ai и api.anthropic.com в вашем VPN.'
      );
    }

    // 2. Один ли адрес у доменов OpenAI / Anthropic
    const openaiIps = new Set(services.filter((s) => s.group === 'openai' && s.ok && s.ip).map((s) => s.ip));
    const openaiLocs = new Set(services.filter((s) => s.group === 'openai' && s.ok && s.loc).map((s) => s.loc));
    if (openaiIps.size > 1) {
      addFinding('warn', 5,
        `Домены OpenAI видят разные IP (${openaiIps.size} адреса)`,
        `Сайты OpenAI выходят через разные узлы (${Array.from(openaiLocs).join(', ')}). Для антифрода это похоже на вход из разных мест сразу.`,
        'Настройте правила маршрутизации так, чтобы chatgpt.com, api.openai.com, auth.openai.com и sora.chatgpt.com шли через один выходной сервер.'
      );
    }

    const anthropicIps = new Set(services.filter((s) => s.group === 'anthropic' && s.ok && s.ip).map((s) => s.ip));
    const anthropicLocs = new Set(services.filter((s) => s.group === 'anthropic' && s.ok && s.loc).map((s) => s.loc));
    if (anthropicIps.size > 1) {
      addFinding('warn', 5,
        `Домены Anthropic видят разные IP (${anthropicIps.size} адреса)`,
        `Сайты Claude выходят с разных адресов (${Array.from(anthropicLocs).join(', ')}).`,
        'Пустите claude.ai, api.anthropic.com и platform.claude.com через один сервер VPN.'
      );
    }

    // 3. Репутация основных выходных IP (ChatGPT / Claude / IPv4)
    const primaryIps = new Set([chatgpt?.ip, claude?.ip, ipProto.ipv4].filter(Boolean));
    const primaryReps = Array.from(primaryIps).map((ip) => reputations[ip]).filter(Boolean);
    const anyTor = primaryReps.some((r) => r.isTor);
    const anyProxy = primaryReps.some((r) => r.isProxy);
    const anyVpn = primaryReps.some((r) => r.isVpn);
    const anyDc = primaryReps.some((r) => r.isDatacenter);
    const anyDisagreeDc = primaryReps.some((r) => !r.isDatacenter && r.asnHeuristicHosting);
    const highRisk = primaryReps.find((r) => typeof r.riskScore === 'number' && r.riskScore >= 50);

    if (anyTor) {
      addFinding('bad', 40,
        'Выходной адрес относится к сети Tor',
        'Почти все ИИ-сервисы блокируют выходные узлы Tor или требуют бесконечную капчу.',
        'Используйте обычный VPN или выделенный прокси вместо Tor.'
      );
    }
    if (anyProxy) {
      addFinding('bad', 30,
        'Адрес помечен как открытый прокси',
        'Базы репутации видят открытый прокси на выходном адресе — высокий риск блокировки.',
        'Смените сервер или провайдера VPN на приватный/выделенный IP.'
      );
    }
    if (highRisk) {
      addFinding('bad', 25,
        `Повышенный риск-скор адреса (${highRisk.riskScore}/100)`,
        'С этого адреса фиксировались злоупотребления или массовый бот-трафик.',
        'Переключитесь на другой сервер или менее загруженную локацию.'
      );
    }
    if (anyVpn) {
      addFinding('warn', 15,
        'Адрес числится в базах VPN',
        'Антифрод видит, что это публичный VPN-сервер. Само по себе не всегда блокирует, но повышает риск проверок.',
        'Если ловите частые капчи или отказы, попробуйте свой VPS, менее популярную локацию или резидентный выход.'
      );
    }
    if (anyDc) {
      addFinding('warn', 15,
        'Выходной IP принадлежит хостингу / дата-центру',
        `Организация: ${primaryReps.find((r) => r.isDatacenter)?.org || 'дата-центр'}. К адресам хостингов антифрод относится строже, чем к домашним ISP.`,
        'Для стабильной работы держите чистый выделенный VPS (не шаренный VPN) и не допускайте утечек WebRTC/DNS.'
      );
    } else if (anyDisagreeDc) {
      addFinding('warn', 8,
        'Источники расходятся: ASN похож на дата-центр',
        `База рисков не отметила хостинг, но ASN (${primaryReps.find((r) => r.asnHeuristicHosting)?.org || '—'}) относится к хостинг-провайдерам.`,
        'Обычно это нормально для своего VPS, но стоит следить за отсутствием утечек.'
      );
    }

    // 4. WebRTC утечка
    const aiCountry = chatgpt?.loc || claude?.loc || primaryReps[0]?.countryCode || null;
    const aiIps = new Set(services.filter((s) => s.ok && s.ip).map((s) => s.ip));
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
          `Утечка WebRTC в другую страну (${countryName(rep.countryCode)})`,
          'Браузер через STUN (UDP) раскрывает адрес из другой страны мимо VPN.',
          'Включите проксирование UDP в VPN-клиенте или ограничьте WebRTC в настройках браузера / расширении WebRTC Leak Prevent.'
        );
      } else if (leakSameCountry) {
        addFinding('warn', 5,
          'WebRTC раскрывает дополнительный публичный IP',
          'STUN возвращает публичный адрес, отличный от адреса ИИ-сервисов.',
          'Проверьте настройки WebRTC IP Handling Policy в браузере (disable_non_proxied_udp).'
        );
      }
      if (webrtcV6) {
        addFinding('warn', 10,
          'Браузер раскрывает публичный IPv6 через WebRTC',
          'Публичный IPv6-адрес виден сайтам напрямую через WebRTC.',
          'Отключите IPv6 на интерфейсе или заверните IPv6 и UDP полностью в VPN.'
        );
      }
    }

    // 5. IPv6 мимо VPN
    const v4Rep = ipProto.ipv4 ? reputations[ipProto.ipv4] : null;
    const v6Rep = ipProto.ipv6 ? reputations[ipProto.ipv6] : null;
    if (ipProto.ipv4 && ipProto.ipv6 && v4Rep?.countryCode && v6Rep?.countryCode &&
        v4Rep.countryCode.toUpperCase() !== v6Rep.countryCode.toUpperCase()) {
      addFinding('bad', 15,
        `IPv6 идёт мимо VPN (${countryName(v6Rep.countryCode)} вместо ${countryName(v4Rep.countryCode)})`,
        'IPv4 и IPv6 выходят из разных стран — сервисы с поддержкой IPv6 могут видеть ваш реальный адрес.',
        'Включите IPv6-туннель в VPN либо отключите IPv6 в системе/клиенте.'
      );
    }

    // 6. DNS утечка
    if (dns.ok && dns.countryCode && aiCountry) {
      const dnsC = dns.countryCode.toUpperCase();
      const aiC = aiCountry.toUpperCase();
      if (dnsC === 'RU' && aiC !== 'RU') {
        addFinding('warn', 10,
          `DNS-запросы идут через Россию (${dns.provider || dns.geo || 'RU'}) при зарубежном VPN`,
          'Ваш провайдер видит, к каким доменам вы обращаетесь, а несоответствие страны DNS и IP заметно антифроду.',
          'Включите DNS-over-HTTPS (DoH) в браузере или проксирование DNS (FakeIP / remote DNS) в VPN-клиенте.'
        );
      } else if (dnsC !== aiC) {
        addFinding('warn', 5,
          `DNS-резолвер в другой стране (${countryName(dnsC)} vs выход ${countryName(aiC)})`,
          `Резолвер: ${dns.geo || dns.provider || dnsC}. Для крупных глобальных DNS (Google/Cloudflare) это часто нормально, но лучше держать DNS ближе к выходу.`,
          'При желании настройте DNS внутри VPN-туннеля (DoH/DoT через выходной сервер).'
        );
      }
    }

    // 7. Браузер и отпечаток
    if (browser.webdriver) {
      addFinding('warn', 10,
        'Флаг navigator.webdriver = true (управление автоматизацией)',
        'Сайты видят, что браузер запущен под управлением скрипта или headless-драйвера.',
        'Для обычной работы используйте стандартный профиль браузера; при запуске через check.sh этот флаг ожидаем.'
      );
    }
    if (browser.tzCountryHint && aiCountry && browser.tzCountryHint !== aiCountry.toUpperCase()) {
      addFinding('warn', 5,
        `Часовой пояс браузера (${browser.tz}) не совпадает со страной IP (${countryName(aiCountry)})`,
        'Несоответствие таймзоны и IP — слабый вторичный признак VPN.',
        'Обычно не мешает работе, менять системное время не обязательно — достаточно, чтобы не было других утечек.'
      );
    }
    if (browser.uaMismatch) {
      addFinding('warn', 5,
        'Браузер называет разную ОС в User-Agent и Client Hints',
        `User-Agent и userAgentData (${browser.uaDataPlatform}) противоречат друг другу.`,
        'Отключите расширения, подменяющие только строку User-Agent без Client Hints.'
      );
    }
    if (browser.clockDriftSec !== null && Math.abs(browser.clockDriftSec) > 120) {
      addFinding('warn', 5,
        `Системные часы сбиты на ${Math.round(Math.abs(browser.clockDriftSec) / 60)} мин`,
        'Сильное расхождение времени ломает токены авторизации, 2FA и вызывает подозрения антифрода.',
        'Включите автоматическую синхронизацию времени по NTP в настройках ОС.'
      );
    }

    const totalPenalty = findings.reduce((acc, f) => acc + f.penalty, 0);
    const score = Math.max(0, Math.min(100, 100 - totalPenalty));

    let verdict = 'Отличное подключение';
    let tone = 'ok';
    if (score < 50) { verdict = 'Высокий риск блокировки'; tone = 'bad'; }
    else if (score < 80) { verdict = 'Есть замечания'; tone = 'warn'; }

    // Простые 6 карточек для вкладки «Простыми словами»
    const simpleCards = buildSimpleCards({ services, byId, ipProto, primaryReps, reputations, webrtc, dns, browser, openaiIps, anthropicIps, aiCountry });

    return { score, verdict, tone, findings, simpleCards, aiCountry };
  }

  function buildSimpleCards({ byId, ipProto, primaryReps, reputations, webrtc, dns, browser, openaiIps, anthropicIps, aiCountry }) {
    const cg = byId.chatgpt;
    const cl = byId.claude;

    // 1. Пустят ли ChatGPT и Claude
    let c1 = { status: 'ok', title: 'Пустят ли ChatGPT и Claude', text: '' };
    if (cg?.allowed === true && cl?.allowed === true) {
      c1.text = `Оба сервиса видят поддерживаемую страну: ChatGPT — ${countryName(cg.loc)}, Claude — ${countryName(cl.loc)}. По геоблокировке проблем нет.`;
    } else if (cg?.allowed === false || cl?.allowed === false) {
      c1.status = 'bad';
      c1.text = `Есть геоблокировка: ChatGPT видит ${cg?.ok ? countryName(cg.loc) : 'недоступен'}, Claude видит ${cl?.ok ? countryName(cl.loc) : 'недоступен'}. Нужен VPN в поддерживаемой стране.`;
    } else {
      c1.status = 'warn';
      c1.text = `Часть сервисов не ответила: ChatGPT (${cg?.ok ? countryName(cg.loc) : cg?.error || 'ошибка'}), Claude (${cl?.ok ? countryName(cl.loc) : cl?.error || 'ошибка'}).`;
    }

    // 2. Репутация адреса
    let c2 = { status: 'ok', title: 'Не подозрительный ли адрес', text: '' };
    const rep0 = primaryReps[0];
    if (!rep0) {
      c2.status = 'warn';
      c2.text = 'Базы репутации не ответили за отведённое время. Попробуйте повторить проверку.';
    } else if (rep0.isTor || rep0.isProxy || (rep0.riskScore || 0) >= 50) {
      c2.status = 'bad';
      c2.text = `Адрес (${rep0.org || rep0.asn || 'неизвестный провайдер'}) помечен как рискованный (Tor/прокси/злоупотребления). Лучше сменить сервер.`;
    } else if (rep0.isVpn || rep0.isDatacenter || rep0.asnHeuristicHosting) {
      c2.status = 'warn';
      c2.text = `Выход идёт через хостинг/VPN (${rep0.org || rep0.isp || rep0.asn || 'дата-центр'}). Для своего VPS это обычно работает нормально, но антифрод присматривается внимательнее.`;
    } else {
      c2.text = `Адрес выглядит чистым (${rep0.org || rep0.isp || 'обычный провайдер'}), в базах VPN, Tor и прокси не замечен.`;
    }

    // 3. Один ли адрес у каждой нейросети
    let c3 = { status: 'ok', title: 'Один ли адрес у каждой нейросети', text: '' };
    if (openaiIps.size > 1 || anthropicIps.size > 1) {
      c3.status = 'warn';
      c3.text = `Домены внутри одного сервиса видят разные IP (OpenAI: ${openaiIps.size}, Anthropic: ${anthropicIps.size}). Лучше пустить все домены одного сервиса через один сервер.`;
    } else if (openaiIps.size === 0 && anthropicIps.size === 0) {
      c3.status = 'bad';
      c3.text = 'Не удалось получить ответы ни от OpenAI, ни от Anthropic.';
    } else {
      c3.text = 'Все домены OpenAI видят один и тот же адрес, и все домены Anthropic — тоже один. Сессия выглядит цельной.';
    }

    // 4. WebRTC и IPv6
    let c4 = { status: 'ok', title: 'Не просвечивает ли настоящий адрес', text: '' };
    const v4Rep = ipProto.ipv4 ? reputations[ipProto.ipv4] : null;
    const v6Rep = ipProto.ipv6 ? reputations[ipProto.ipv6] : null;
    const v6Leak = ipProto.ipv4 && ipProto.ipv6 && v4Rep?.countryCode && v6Rep?.countryCode && v4Rep.countryCode !== v6Rep.countryCode;
    const rtcLeak = webrtc.publicIps.some((ip) => {
      const r = reputations[ip];
      return r?.countryCode && aiCountry && r.countryCode !== aiCountry;
    });
    if (v6Leak || rtcLeak) {
      c4.status = 'bad';
      c4.text = `${rtcLeak ? 'WebRTC выдаёт адрес из другой страны. ' : ''}${v6Leak ? 'IPv6 идёт мимо VPN в другую страну.' : ''}`.trim();
    } else if (webrtc.publicIps.length > 0) {
      c4.status = 'warn';
      c4.text = `WebRTC показывает ${webrtc.publicIps.length} публичный(х) IP, но из той же страны. IPv6 ${ipProto.ipv6 ? 'совпадает с VPN' : 'отключён — утечки нет'}.`;
    } else {
      c4.text = `WebRTC не раскрывает публичный IP (${webrtc.mdns ? 'защищён mDNS' : 'кандидатов нет'}). IPv6 ${ipProto.ipv6 ? 'идёт через ту же страну' : 'отключён — утечки не будет'}.`;
    }

    // 5. DNS
    let c5 = { status: 'ok', title: 'Видит ли провайдер, куда вы заходите', text: '' };
    if (!dns.ok) {
      c5.status = 'warn';
      c5.text = 'Не удалось определить DNS-резолвер (сервис edns.ip-api.com не ответил).';
    } else if (dns.countryCode === 'RU' && aiCountry && aiCountry !== 'RU') {
      c5.status = 'warn';
      c5.text = `DNS-запросы идут через Россию (${dns.provider || dns.geo}), хотя сам трафик выходит через ${countryName(aiCountry)}. Лучше включить DNS внутри VPN или DoH.`;
    } else if (dns.countryCode && aiCountry && dns.countryCode !== aiCountry) {
      c5.status = 'warn';
      c5.text = `DNS отвечает из ${countryName(dns.countryCode)} (${dns.provider || 'резолвер'}), а выход — в ${countryName(aiCountry)}. Это терпимо для Google/Cloudflare DNS.`;
    } else {
      c5.text = `DNS-резолвер (${dns.geo || dns.provider || countryName(dns.countryCode)}) совпадает со страной выхода — утечки к домашнему провайдеру не видно.`;
    }

    // 6. Браузер
    let c6 = { status: 'ok', title: 'Не странный ли браузер', text: '' };
    const issues = [];
    if (browser.webdriver) issues.push('обнаружен флаг webdriver (автоматизация)');
    if (browser.uaMismatch) issues.push('разная ОС в User-Agent и Client Hints');
    if (browser.clockDriftSec !== null && Math.abs(browser.clockDriftSec) > 120) issues.push('сбиты системные часы');
    if (browser.tzCountryHint && aiCountry && browser.tzCountryHint !== aiCountry) issues.push(`часовой пояс ${browser.tz} не совпадает со страной IP`);
    if (issues.length > 0) {
      c6.status = 'warn';
      c6.text = `Есть мелкие несовпадения: ${issues.join('; ')}. Отпечаток считается локально и никуда не отправляется.`;
    } else {
      c6.text = `Браузер выглядит естественно (${browser.tz || 'таймзона ок'}, часы точны, флагов автоматизации нет).`;
    }

    return [c1, c2, c3, c4, c5, c6];
  }

  // --- Генерация Markdown-отчёта для нейросети ---
  function buildAiReport(res) {
    const lines = [];
    lines.push(`# Проверка сети для ChatGPT и Claude (alfafond.com/check)`);
    lines.push(`Дата: ${new Date(res.timestamp).toLocaleString('ru-RU')}`);
    lines.push(`Балл подключения: **${res.score}/100** (${res.verdict})`);
    lines.push('');

    const cg = res.services.find((s) => s.id === 'chatgpt');
    const cl = res.services.find((s) => s.id === 'claude');
    lines.push('## Кратко');
    lines.push(`- ChatGPT: ${cg?.ok ? `${maskIp(cg.ip)} · ${countryName(cg.loc)} · colo ${cg.colo} · ${cg.allowed ? 'пустит' : 'ЗАБЛОКИРОВАН'}` : `ошибка (${cg?.error || 'нет ответа'})`}`);
    lines.push(`- Claude: ${cl?.ok ? `${maskIp(cl.ip)} · ${countryName(cl.loc)} · colo ${cl.colo} · ${cl.allowed ? 'пустит' : 'ЗАБЛОКИРОВАН'}` : `ошибка (${cl?.error || 'нет ответа'})`}`);
    lines.push(`- IPv4 выход: ${res.ipProto.ipv4 ? maskIp(res.ipProto.ipv4) : 'нет'} · IPv6 выход: ${res.ipProto.ipv6 ? maskIp(res.ipProto.ipv6) : 'нет'}`);
    if (res.ipProto.cfTrace) {
      lines.push(`- Прямой Cloudflare 1.1.1.1: ${maskIp(res.ipProto.cfTrace.ip)} · ${countryName(res.ipProto.cfTrace.loc)} · colo ${res.ipProto.cfTrace.colo}`);
    }
    lines.push(`- DNS-резолвер: ${res.dns.ok ? `${maskIp(res.dns.ip)} (${res.dns.geo || res.dns.provider || '—'})` : 'не определён'}`);
    lines.push(`- WebRTC публичные IP: ${res.webrtc.publicIps.length ? res.webrtc.publicIps.map(maskIp).join(', ') : (res.webrtc.mdns ? 'нет (mDNS защищён)' : 'нет')}`);
    lines.push('');

    lines.push('## Находки');
    if (!res.findings.length) {
      lines.push('- Проблем не обнаружено.');
    } else {
      for (const f of res.findings) {
        lines.push(`- [−${f.penalty}] **${f.title}** — ${f.detail} Совет: ${f.fix}`);
      }
    }
    lines.push('');

    lines.push('## Репутация выходных IP');
    for (const rep of Object.values(res.reputations)) {
      const flags = [
        rep.isTor && 'TOR',
        rep.isProxy && 'PROXY',
        rep.isVpn && 'VPN',
        (rep.isDatacenter || rep.asnHeuristicHosting) && (rep.isDatacenter ? 'DATACENTER' : 'DATACENTER (спорно)'),
        rep.isMobile && 'MOBILE'
      ].filter(Boolean);
      lines.push(`- ${maskIp(rep.ip)} (${rep.version}): ${countryName(rep.countryCode)}, ${rep.city || '—'}, ${rep.asn || '—'} ${rep.org || rep.isp || ''}, флаги: ${flags.length ? flags.join(', ') : 'чисто'}, risk=${rep.riskScore ?? '—'}`);
    }
    lines.push('');

    lines.push('## Сервисы ИИ (18)');
    for (const s of res.services) {
      const allowTxt = s.allowed === true ? 'OK' : s.allowed === false ? 'BLOCK' : '—';
      lines.push(`- ${s.name} (${s.domain}): ${s.ok ? `${maskIp(s.ip)} | ${s.loc || '—'} | ${s.colo || '—'} | ${allowTxt} | ${s.ms}мс` : `FAIL (${s.error})`}`);
    }
    lines.push('');

    lines.push('## Браузер (локально)');
    lines.push(`- Таймзона: ${res.browser.tz || '—'}, языки: ${res.browser.languages.join(', ')}, webdriver: ${res.browser.webdriver}, дрейф часов: ${res.browser.clockDriftSec ?? '—'}с, UA mismatch: ${res.browser.uaMismatch}`);
    lines.push('');
    lines.push('Проанализируй этот отчёт и скажи коротко по пунктам, что нужно поправить в VPN/прокси/браузере, чтобы ChatGPT и Claude работали стабильно и без риска блокировки.');
    return lines.join('\n');
  }

  // --- История в localStorage ---
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
      arr.unshift(item);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 8)));
    } catch (_) {}
  }

  function renderHistory() {
    const list = $('historyList');
    const count = $('historyCount');
    if (!list) return;
    const arr = loadHistory();
    if (count) count.textContent = arr.length ? `${arr.length} сохр.` : 'пусто';
    if (!arr.length) {
      list.innerHTML = '<li class="hist-empty">История хранится только в вашем браузере — после первой проверки здесь появится запись для сравнения разных VPN-серверов.</li>';
      return;
    }
    list.innerHTML = arr.map((it) => {
      const d = new Date(it.ts);
      const t = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const day = d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
      return `<li>
        <span class="hist-score ${esc(it.tone)}">${it.score}</span>
        <div class="hist-meta">
          <b>${esc(countryName(it.loc))}</b>
          <span>${esc(it.provider)} · находок: ${it.findings}</span>
        </div>
        <span class="hist-time">${day} ${t}</span>
      </li>`;
    }).join('');
  }

  // --- Рендер шагов и итогового UI ---
  function setStep(id, text, cls = '') {
    const el = $(`step-${id}`);
    if (!el) return;
    el.className = `step-pill ${cls}`;
    el.querySelector('b').textContent = text;
  }

  function renderAll(res) {
    // Главный балл
    const scoreNum = $('scoreNum');
    scoreNum.textContent = String(res.score);
    scoreNum.className = `score-num ${res.tone}`;
    $('scoreVerdict').textContent = res.verdict;
    $('scoreVerdict').className = `score-verdict ${res.tone}`;

    const cg = res.services.find((s) => s.id === 'chatgpt');
    const cl = res.services.find((s) => s.id === 'claude');
    $('sumChatgpt').innerHTML = cg?.ok
      ? `<span class="dot ${cg.allowed ? 'ok' : 'bad'}"></span>${esc(countryName(cg.loc))} · <code>${esc(maskIp(cg.ip))}</code>`
      : `<span class="dot bad"></span>${esc(cg?.error || 'недоступен')}`;
    $('sumClaude').innerHTML = cl?.ok
      ? `<span class="dot ${cl.allowed ? 'ok' : 'bad'}"></span>${esc(countryName(cl.loc))} · <code>${esc(maskIp(cl.ip))}</code>`
      : `<span class="dot bad"></span>${esc(cl?.error || 'недоступен')}`;
    $('sumCfDirect').innerHTML = res.ipProto.cfTrace
      ? `${esc(countryName(res.ipProto.cfTrace.loc))} · <code>${esc(maskIp(res.ipProto.cfTrace.ip))}</code> <span class="dim">(${esc(res.ipProto.cfTrace.colo || '—')})</span>`
      : '—';
    $('sumDns').innerHTML = res.dns.ok
      ? `${esc(res.dns.geo || res.dns.provider || countryName(res.dns.countryCode))} · <code>${esc(maskIp(res.dns.ip))}</code>`
      : '<span class="dim">не определён</span>';

    // Находки
    const flist = $('findingsList');
    if (!res.findings.length) {
      flist.innerHTML = `<div class="finding ok">
        <div class="f-head"><b>Критических проблем не найдено</b><span class="f-pen ok">−0</span></div>
        <p>Подключение выглядит чисто по всем проверенным признакам: страна поддерживается, утечек WebRTC/IPv6/DNS не обнаружено.</p>
      </div>`;
    } else {
      flist.innerHTML = res.findings.map((f) => `<div class="finding ${esc(f.severity)}">
        <div class="f-head"><b>${esc(f.title)}</b><span class="f-pen ${esc(f.severity)}">−${f.penalty}</span></div>
        <p>${esc(f.detail)}</p>
        <p class="f-fix"><b>Что сделать:</b> ${esc(f.fix)}</p>
      </div>`).join('');
    }

    // 6 простых карточек
    $('simpleGrid').innerHTML = res.simpleCards.map((c) => {
      const badge = c.status === 'ok' ? 'OK' : c.status === 'warn' ? 'Внимание' : 'Проблема';
      return `<div class="cell simple-card ${esc(c.status)}">
        <div class="sc-top"><h3>${esc(c.title)}</h3><span class="badge ${esc(c.status)}">${badge}</span></div>
        <p>${esc(c.text)}</p>
      </div>`;
    }).join('');

    // Таблица 18 сервисов
    $('servicesBody').innerHTML = res.services.map((s) => {
      let allowCell = '<span class="dim">нет списка</span>';
      if (s.allowed === true) allowCell = '<span class="badge ok">пустит</span>';
      else if (s.allowed === false) allowCell = '<span class="badge bad">блок</span>';
      return `<tr>
        <td><b>${esc(s.name)}</b><br><span class="dim mono-xs">${esc(s.domain)}</span></td>
        <td class="mono-xs">${s.ok ? esc(maskIp(s.ip)) : `<span class="bad-t">${esc(s.error || 'ошибка')}</span>`}</td>
        <td>${s.loc ? esc(countryName(s.loc)) : '—'}</td>
        <td class="mono-xs">${esc(s.colo || '—')}</td>
        <td>${allowCell}</td>
        <td class="mono-xs num">${s.ms} мс</td>
      </tr>`;
    }).join('');

    // Таблица репутации IP
    const reps = Object.values(res.reputations);
    $('repBody').innerHTML = reps.length ? reps.map((r) => {
      const badges = [];
      if (r.isTor) badges.push('<span class="badge bad">Tor</span>');
      if (r.isProxy) badges.push('<span class="badge bad">Proxy</span>');
      if (r.isVpn) badges.push('<span class="badge warn">VPN</span>');
      if (r.isDatacenter) badges.push('<span class="badge warn">Хостинг</span>');
      else if (r.asnHeuristicHosting) badges.push('<span class="badge warn">Хостинг (спорно)</span>');
      if (r.isMobile) badges.push('<span class="badge ok">Мобильный</span>');
      if (!badges.length) badges.push('<span class="badge ok">Чисто</span>');
      return `<tr>
        <td class="mono-xs">${esc(maskIp(r.ip))}<br><span class="dim">${esc(r.version)}</span></td>
        <td>${esc(countryName(r.countryCode))}<br><span class="dim">${esc(r.city || '—')}</span></td>
        <td><b>${esc(r.org || r.isp || '—')}</b><br><span class="dim mono-xs">${esc(r.asn || '—')}</span></td>
        <td><div class="badges">${badges.join('')}</div></td>
        <td class="mono-xs num">${r.riskScore !== null ? `${r.riskScore}/100` : '—'}</td>
        <td class="mono-xs dim">${esc(r.sources.join(', ') || '—')}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="6" class="dim">Нет данных по адресам.</td></tr>';

    // WebRTC / IPv6 / DNS
    $('leakWebrtc').innerHTML = `
      <div class="kv"><span>Поддержка</span><b>${res.webrtc.supported ? 'да' : 'отключён'}</b></div>
      <div class="kv"><span>Публичные IP (STUN)</span><code>${res.webrtc.publicIps.length ? esc(res.webrtc.publicIps.map(maskIp).join(', ')) : 'не обнаружены'}</code></div>
      <div class="kv"><span>mDNS защита</span><b>${res.webrtc.mdns ? 'да (.local)' : 'нет / не сработал'}</b></div>
      <div class="kv"><span>Локальные IP</span><code>${res.webrtc.localIps.length ? esc(res.webrtc.localIps.join(', ')) : 'скрыты'}</code></div>
    `;
    const v4r = res.ipProto.ipv4 ? res.reputations[res.ipProto.ipv4] : null;
    const v6r = res.ipProto.ipv6 ? res.reputations[res.ipProto.ipv6] : null;
    $('leakIpv6').innerHTML = `
      <div class="kv"><span>IPv4 выход</span><code>${res.ipProto.ipv4 ? esc(maskIp(res.ipProto.ipv4)) : 'нет ответа'}</code></div>
      <div class="kv"><span>Страна IPv4</span><b>${v4r?.countryCode ? esc(countryName(v4r.countryCode)) : '—'}</b></div>
      <div class="kv"><span>IPv6 выход</span><code>${res.ipProto.ipv6 ? esc(maskIp(res.ipProto.ipv6)) : 'отключён (утечки нет)'}</code></div>
      <div class="kv"><span>Страна IPv6</span><b>${v6r?.countryCode ? esc(countryName(v6r.countryCode)) : '—'}</b></div>
    `;
    $('leakDns').innerHTML = `
      <div class="kv"><span>IP резолвера</span><code>${res.dns.ok ? esc(maskIp(res.dns.ip)) : 'не определён'}</code></div>
      <div class="kv"><span>Страна / провайдер</span><b>${esc(res.dns.geo || res.dns.provider || '—')}</b></div>
      <div class="kv"><span>Источник</span><span class="dim mono-xs">edns.ip-api.com</span></div>
    `;

    // Браузер
    const b = res.browser;
    $('browserGrid').innerHTML = `
      <div class="kv"><span>Часовой пояс</span><b>${esc(b.tz || '—')} (UTC${b.tzOffsetMin >= 0 ? '+' : ''}${b.tzOffsetMin / 60})</b></div>
      <div class="kv"><span>Дрейф часов (vs CF)</span><b>${b.clockDriftSec !== null ? `${b.clockDriftSec > 0 ? '+' : ''}${b.clockDriftSec} сек` : '—'}</b></div>
      <div class="kv"><span>navigator.webdriver</span><b>${b.webdriver ? '<span class="bad-t">true</span>' : '<span class="ok-t">false</span>'}</b></div>
      <div class="kv"><span>Языки</span><b>${esc(b.languages.join(', ') || '—')}</b></div>
      <div class="kv"><span>Платформа / Client Hints</span><b>${esc(b.platform || '—')}${b.uaDataPlatform ? ` / ${esc(b.uaDataPlatform)}` : ''}</b></div>
      <div class="kv"><span>Экран / ядра / RAM</span><b>${esc(b.screen)} · ${b.cores || '—'} ядер · ${b.memoryGb ? `${b.memoryGb} ГБ` : '—'}</b></div>
      <div class="kv"><span>WebGL renderer</span><code class="wrap-code">${esc(b.webglRenderer)}</code></div>
      <div class="kv"><span>User-Agent</span><code class="wrap-code">${esc(b.ua)}</code></div>
    `;

    // Сохраняем машиночитаемый JSON для headless-скрипта check.sh / check.ps1
    let holder = $('alfafond-check-result');
    if (!holder) {
      holder = document.createElement('script');
      holder.id = 'alfafond-check-result';
      holder.type = 'application/json';
      document.body.appendChild(holder);
    }
    holder.textContent = JSON.stringify({
      version: 1,
      timestamp: res.timestamp,
      score: res.score,
      verdict: res.verdict,
      tone: res.tone,
      aiCountry: res.aiCountry,
      findings: res.findings,
      ipProto: res.ipProto,
      dns: res.dns,
      webrtc: res.webrtc,
      browser: res.browser,
      reputations: res.reputations,
      services: res.services,
      markdownReport: buildAiReport(res)
    });
    document.documentElement.setAttribute('data-check-done', '1');
  }

  // --- Главный запуск проверки ---
  async function runCheck() {
    if (state.running) return;
    state.running = true;
    document.documentElement.removeAttribute('data-check-done');
    const btn = $('btnRun');
    const btnCopy = $('btnCopyReport');
    btn.disabled = true;
    btn.classList.add('loading');
    btnCopy.disabled = true;

    $('scoreNum').textContent = '··';
    $('scoreNum').className = 'score-num';
    $('scoreVerdict').textContent = 'Проверяем подключение…';
    $('scoreVerdict').className = 'score-verdict';
    setStep('services', `0/${AI_SERVICES.length}`, 'active');
    setStep('rep', 'ждёт');
    setStep('webrtc', 'идёт', 'active');
    setStep('ipv6', 'идёт', 'active');
    setStep('dns', 'идёт', 'active');
    setStep('browser', 'ждёт');

    // Запускаем независимые ветки параллельно
    const servicesP = checkServices((d, total) => {
      setStep('services', `${d}/${total}`, d === total ? 'ok' : 'active');
    });
    const ipProtoP = checkIpProtocols().then((res) => {
      setStep('ipv6', res.ipv6 ? 'есть' : 'нет', 'ok');
      return res;
    });
    const webrtcP = checkWebRTC().then((res) => {
      setStep('webrtc', res.publicIps.length ? `${res.publicIps.length} IP` : 'чисто', res.publicIps.length ? 'warn' : 'ok');
      return res;
    });
    const dnsP = checkDNS().then((res) => {
      setStep('dns', res.ok ? (res.countryCode || 'ok') : 'ошибка', res.ok ? 'ok' : 'warn');
      return res;
    });

    const [services, ipProto, webrtc, dns] = await Promise.all([servicesP, ipProtoP, webrtcP, dnsP]);

    // Собираем уникальные публичные IP для проверки репутации (ограничиваем до 6, чтобы не бить лимиты API)
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
    }));
    if (!uniqueIps.length) setStep('rep', 'нет IP', 'warn');

    // Референсное время сервера Cloudflare (для проверки часов браузера)
    const refTs = cg?.ts || cl?.ts || ipProto.cfTrace?.ts || services.find((s) => s.ts)?.ts || null;
    const browser = checkBrowser(refTs);
    setStep('browser', browser.webdriver || browser.uaMismatch ? 'замечания' : 'ok', browser.webdriver || browser.uaMismatch ? 'warn' : 'ok');

    const evalRes = evaluateAll({ services, ipProto, reputations, webrtc, dns, browser });
    const fullResult = {
      timestamp: Date.now(),
      ...evalRes,
      services,
      ipProto,
      reputations,
      webrtc,
      dns,
      browser
    };

    state.result = fullResult;
    saveHistoryItem(fullResult);
    renderHistory();
    renderAll(fullResult);

    btn.disabled = false;
    btn.classList.remove('loading');
    btnCopy.disabled = false;
    state.running = false;
  }

  // --- Интерактив UI ---
  async function copyText(text, btn, okLabel) {
    const orig = btn.dataset.orig || btn.textContent;
    btn.dataset.orig = orig;
    try {
      await navigator.clipboard.writeText(text);
      btn.textContent = okLabel || 'Скопировано';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      btn.textContent = okLabel || 'Скопировано';
      setTimeout(() => { btn.textContent = orig; }, 2000);
    }
  }

  function initUI() {
    renderHistory();

    $('btnRun').addEventListener('click', runCheck);

    $('btnCopyReport').addEventListener('click', () => {
      if (!state.result) return;
      copyText(buildAiReport(state.result), $('btnCopyReport'), 'Отчёт скопирован');
    });

    $('btnHideIp').addEventListener('click', () => {
      state.hideIp = !state.hideIp;
      const b = $('btnHideIp');
      b.setAttribute('aria-pressed', String(state.hideIp));
      b.classList.toggle('active', state.hideIp);
      b.querySelector('span').textContent = state.hideIp ? 'Показать IP' : 'Скрыть IP';
      if (state.result) renderAll(state.result);
    });

    $('btnClearHistory').addEventListener('click', () => {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
    });

    // Переключение вкладок Простыми / Сложными словами
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

    // Ссылка «Сложными словами» внутри вкладки
    const goTech = $('goTechTab');
    if (goTech) {
      goTech.addEventListener('click', () => {
        document.querySelector('[data-tab="tech"]')?.click();
        $('tabsBar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Вкладки ОС для терминальной команды
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
      copyText($('agentCmd').textContent, $('btnCopyCmd'), 'Скопировано');
    });

    $('btnCopySkill').addEventListener('click', async () => {
      const btn = $('btnCopySkill');
      const r = await fetchTimeout('/check-skill.md', {}, 5000);
      if (r.ok && r.text) {
        copyText(r.text, btn, 'Скилл скопирован');
      } else {
        copyText('https://alfafond.com/check-skill.md', btn, 'Скопирована ссылка');
      }
    });

    // Автозапуск проверки при открытии страницы
    runCheck();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
  } else {
    initUI();
  }
})();
