# AlfaFond /check — проверка сети для ChatGPT, Claude и ИИ-сервисов (Windows PowerShell)
# Использование:
#   irm https://alfafond.com/check.ps1 | iex
param(
    [switch]$Json,
    [switch]$NoBrowser
)

$ErrorActionPreference = "SilentlyContinue"
$Url = "https://alfafond.com/check/?headless=1"

function Find-Browser {
    $candidates = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LocalAppData\Google\Chrome\Application\chrome.exe",
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
        "$env:ProgramFiles\BraveSoftware\Brave-Browser\Application\brave.exe",
        "$env:LocalAppData\Yandex\YandexBrowser\Application\browser.exe"
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    return $null
}

if (-not $NoBrowser) {
    $browser = Find-Browser
    if ($browser) {
        $dom = & $browser --headless=new --disable-gpu --no-first-run --virtual-time-budget=22000 --dump-dom $Url 2>$null | Out-String
        if ($dom -match '<script[^>]+id="alfafond-check-result"[^>]*>(.*?)</script>') {
            $rawJson = $Matches[1]
            if ($Json) {
                Write-Output $rawJson
            } else {
                $obj = $rawJson | ConvertFrom-Json
                Write-Output $obj.markdownReport
            }
            exit 0
        }
    }
}

# Фолбэк без браузера (CLI-проверка ключевых доменов)
$services = @(
    @{ Name = "ChatGPT"; Domain = "chatgpt.com" },
    @{ Name = "OpenAI API"; Domain = "api.openai.com" },
    @{ Name = "Claude"; Domain = "claude.ai" },
    @{ Name = "Claude API"; Domain = "api.anthropic.com" },
    @{ Name = "Perplexity"; Domain = "www.perplexity.ai" },
    @{ Name = "OpenRouter"; Domain = "openrouter.ai" }
)
$out = @()
foreach ($s in $services) {
    try {
        $resp = Invoke-WebRequest -Uri "https://$($s.Domain)/cdn-cgi/trace" -TimeoutSec 6 -UseBasicParsing
        $kv = @{}
        foreach ($line in ($resp.Content -split "`n")) {
            if ($line -match "^([^=]+)=(.*)$") { $kv[$Matches[1].Trim()] = $Matches[2].Trim() }
        }
        $out += [PSCustomObject]@{ Service = $s.Name; IP = $kv["ip"]; Country = $kv["loc"]; Colo = $kv["colo"] }
    } catch {
        $out += [PSCustomObject]@{ Service = $s.Name; IP = "ERR"; Country = "-"; Colo = "-" }
    }
}
if ($Json) {
    $out | ConvertTo-Json -Depth 4
} else {
    Write-Output "# Проверка сети AlfaFond /check (PowerShell CLI)"
    $out | Format-Table -AutoSize
}
