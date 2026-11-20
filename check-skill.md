---
name: alfafond-network-check
description: Проверяет IP, VPN, доступность 18 ИИ-сервисов (ChatGPT, Claude и др.), репутацию адреса, утечки WebRTC/IPv6/DNS и отпечаток браузера через alfafond.com/check.
---

# AlfaFond Network Check Skill

Используй этот скилл, когда пользователь просит проверить VPN/прокси, диагностировать блокировку ChatGPT/Claude или найти утечки WebRTC/DNS/IPv6.

## Как запустить

- **macOS / Linux:**
  ```bash
  curl -fsSL https://alfafond.com/check.sh | sh -s -- --json
  ```
  (Если на машине нет браузера Chrome/Brave/Edge, добавь `--no-browser` — сработает быстрый CLI-режим.)

- **Windows (PowerShell):**
  ```powershell
  irm https://alfafond.com/check.ps1 | iex
  ```

- **В браузере:** открой `https://alfafond.com/check/` и нажми «Отчёт для нейросети».

## Как интерпретировать результат

1. **Балл (`score` 0–100):** ≥80 — хорошо; 50–79 — есть замечания; <50 — высокий риск блокировки.
2. **Страна выхода (`services[].loc`):** ChatGPT и Claude должны видеть поддерживаемую страну (`allowed: true`), и все домены внутри OpenAI / Anthropic должны выходить с одного IP.
3. **Репутация (`reputations`):** проверь флаги `isTor`, `isProxy`, `isVpn`, `isDatacenter`, `riskScore`.
4. **Утечки (`webrtc`, `ipProto`, `dns`):**
   - `webrtc.publicIps` из другой страны → включить проксирование UDP или ограничить WebRTC.
   - `ipProto.ipv6` из другой страны vs `ipv4` → завернуть IPv6 в VPN или отключить IPv6.
   - `dns.countryCode == "RU"` при зарубежном выходе → включить remote DNS / DoH.
5. **Вывод пользователю:** дай короткий вердикт (балл, ключевые риски) и конкретные 2–4 шага, что поправить в VPN/прокси/браузере.
