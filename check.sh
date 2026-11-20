#!/usr/bin/env sh
# AlfaFond /check — проверка сети для ChatGPT, Claude и ИИ-сервисов из терминала.
# Использование:
#   curl -fsSL https://alfafond.com/check.sh | sh
#   curl -fsSL https://alfafond.com/check.sh | sh -s -- --json
#   curl -fsSL https://alfafond.com/check.sh | sh -s -- --no-browser
set -eu

JSON_OUT=0
NO_BROWSER=0
for arg in "$@"; do
  case "$arg" in
    --json) JSON_OUT=1 ;;
    --no-browser) NO_BROWSER=1 ;;
  esac
done

URL="https://alfafond.com/check/?headless=1"

find_browser() {
  for cand in \
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" \
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge" \
    "/Applications/Chromium.app/Contents/MacOS/Chromium" \
    "/Applications/Yandex.app/Contents/MacOS/Yandex" \
    google-chrome google-chrome-stable chromium chromium-browser brave-browser microsoft-edge yandex-browser; do
    if [ -x "$cand" ]; then
      printf '%s\n' "$cand"
      return 0
    fi
    if command -v "$cand" >/dev/null 2>&1; then
      command -v "$cand"
      return 0
    fi
  done
  return 1
}

run_browser_mode() {
  BROWSER="$1"
  TMP_DOM="$(mktemp)"
  trap 'rm -f "$TMP_DOM"' EXIT INT TERM
  "$BROWSER" --headless=new --disable-gpu --no-first-run --no-default-browser-check \
    --virtual-time-budget=22000 --dump-dom "$URL" >"$TMP_DOM" 2>/dev/null || return 1

  if command -v python3 >/dev/null 2>&1; then
    python3 - "$TMP_DOM" "$JSON_OUT" <<'PY'
import json, re, sys
raw = open(sys.argv[1], 'r', encoding='utf-8', errors='ignore').read()
m = re.search(r'<script[^>]+id="alfafond-check-result"[^>]*>(.*?)</script>', raw, re.S)
if not m:
    sys.exit(2)
data = json.loads(m.group(1))
if sys.argv[2] == '1':
    print(json.dumps(data, ensure_ascii=False, indent=2))
else:
    print(data.get('markdownReport', ''))
PY
    return $?
  fi
  return 1
}

run_cli_fallback() {
  if ! command -v python3 >/dev/null 2>&1; then
    echo "Нужен python3 или Chrome/Brave/Edge для запуска проверки." >&2
    exit 1
  fi
  python3 - "$JSON_OUT" <<'PY'
import json, sys, time, urllib.request

SERVICES = [
    ("ChatGPT", "chatgpt.com", "openai"),
    ("OpenAI API", "api.openai.com", "openai"),
    ("Claude", "claude.ai", "anthropic"),
    ("Claude API", "api.anthropic.com", "anthropic"),
    ("Perplexity", "www.perplexity.ai", None),
    ("Grok", "grok.com", None),
    ("OpenRouter", "openrouter.ai", None),
]
BLOCKED = {"RU", "BY", "CN", "HK", "MO", "KP", "IR", "SY", "CU", "VE"}

def get(url, timeout=6):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return True, r.read().decode("utf-8", errors="ignore"), int((time.time() - t0) * 1000)
    except Exception as e:
        return False, str(e), int((time.time() - t0) * 1000)

res = {"mode": "cli-fallback", "services": [], "reputation": {}, "dns": None}
ips = []
for name, dom, pol in SERVICES:
    ok, body, ms = get(f"https://{dom}/cdn-cgi/trace")
    kv = dict(line.split("=", 1) for line in body.splitlines() if "=" in line) if ok else {}
    ip = kv.get("ip")
    loc = kv.get("loc")
    if ip and ip not in ips:
        ips.append(ip)
    res["services"].append({
        "name": name, "domain": dom, "ok": bool(ip),
        "ip": ip, "loc": loc, "colo": kv.get("colo"),
        "allowed": (loc not in BLOCKED) if (pol and loc) else None, "ms": ms
    })

for ip in ips[:3]:
    ok, body, _ = get(f"https://api.ipquery.io/{ip}")
    if ok:
        try:
            res["reputation"][ip] = json.loads(body)
        except Exception:
            pass

ok_dns, body_dns, _ = get("https://edns.ip-api.com/json")
if ok_dns:
    try:
        res["dns"] = json.loads(body_dns).get("dns")
    except Exception:
        pass

if sys.argv[1] == "1":
    print(json.dumps(res, ensure_ascii=False, indent=2))
else:
    print("# Проверка сети AlfaFond /check (CLI-режим без WebRTC)")
    for s in res["services"]:
        st = "OK" if s["allowed"] is True else ("BLOCK" if s["allowed"] is False else "-")
        print(f"- {s['name']:12s}: {s['ip'] or 'ERR':38s} | {s['loc'] or '-':3s} | {s['colo'] or '-':4s} | {st:5s} | {s['ms']}ms")
    if res["dns"]:
        print(f"\nDNS: {res['dns'].get('ip')} ({res['dns'].get('geo')})")
    for ip, rep in res["reputation"].items():
        risk = rep.get("risk", {})
        isp = rep.get("isp", {})
        flags = [k.replace("is_", "") for k in ("is_tor", "is_proxy", "is_vpn", "is_datacenter") if risk.get(k)]
        print(f"IP {ip}: {isp.get('asn')} {isp.get('org')} | флаги: {', '.join(flags) or 'чисто'} | risk={risk.get('risk_score')}")
PY
}

if [ "$NO_BROWSER" -eq 0 ]; then
  if BROWSER="$(find_browser 2>/dev/null)"; then
    if run_browser_mode "$BROWSER"; then
      exit 0
    fi
  fi
fi

run_cli_fallback
