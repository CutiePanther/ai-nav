#Requires -Version 5.1
<#
  ai-dev-nav AI Worker 一键部署脚本（Windows）

  流程：安装依赖 → 登录检查 → 创建 KV 并自动改写 wrangler.toml
        → 上传索引 → 引导配置密钥 → 发布 → 健康检查 → 输出主站变量提示

  用法：
    powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1

  说明：
    - 首次运行会在「配置密钥」步骤暂停，4 个 wrangler secret put 需你手动粘贴输入（含换行的提示文案已内置）。
    - 重跑幂等：KV 已创建、占位符已替换时会自动复用，不会重复建命名空间。
#>

$ErrorActionPreference = 'Stop'
$WorkerDir = Split-Path -Parent $PSScriptRoot
Set-Location $WorkerDir

function Invoke-Step {
  param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][scriptblock]$Body)
  Write-Host "`n===== $Name =====" -ForegroundColor Cyan
  try { & $Body } catch { Write-Error "步骤「$Name」失败：$_"; throw }
}

# ---------- 0. 依赖 ----------
Invoke-Step -Name '安装依赖' -Body {
  if (Test-Path 'node_modules') { Write-Host 'node_modules 已存在，跳过 npm i' -ForegroundColor DarkGray }
  else { npm i }
}

# ---------- 1. 登录检查 ----------
Invoke-Step -Name 'Cloudflare 登录检查' -Body {
  $out = @(npx wrangler whoami 2>&1 | ForEach-Object { "$_" })
  $joined = $out -join "`n"
  if ($LASTEXITCODE -ne 0 -or $joined -match 'not logged in|not authenticated') {
    Write-Host '未检测到登录，将打开浏览器授权...' -ForegroundColor Yellow
    npx wrangler login
    if ($LASTEXITCODE -ne 0) { throw 'wrangler login 未完成，请重试' }
    Write-Host '登录完成' -ForegroundColor Green
  } else {
    Write-Host $joined
  }
}

# ---------- 2. 补齐 account_id 与 ALLOWED_ORIGIN（必须先于建命名空间，否则请求会拿占位符失败）----------
$TomlPath = Join-Path (Get-Location) 'wrangler.toml'
# 显式按 UTF-8 读取，避免 PowerShell 5.1 默认 GBK 把中文注释读乱
$toml = [System.IO.File]::ReadAllText($TomlPath, [System.Text.Encoding]::UTF8)

Invoke-Step -Name '补齐 account_id 与 ALLOWED_ORIGIN' -Body {
  if ($toml -match '(?m)^account_id\s*=\s*"your_account_id"') {
    $acct = Read-Host '  请粘贴 Cloudflare Account ID（运行 npx wrangler whoami 查看）'
    if (-not $acct) { throw 'account_id 不能为空' }
    $toml = $toml -replace '(?m)^account_id\s*=\s*"[^"]*"', "account_id = `"$acct`""
  }
  if ($toml -match 'https://your-site\.vercel\.app') {
    $origin = Read-Host '  请粘贴主站生产域名，如 https://ai-nav-flax.vercel.app'
    if (-not $origin) { throw 'ALLOWED_ORIGIN 不能为空' }
    $toml = $toml -replace 'https://your-site\.vercel\.app', $origin
  }
}

Invoke-Step -Name '创建/校验 KV 命名空间' -Body {
  $idNow = [regex]::Match($toml, '(?m)^id\s*=\s*"([^"]+)"').Groups[1].Value
  if ($idNow -eq 'your_namespace_id') {
    Write-Host '创建 KV 命名空间 AI_DOCS ...'
    $createOut = @(npx wrangler kv namespace create AI_DOCS 2>&1 | ForEach-Object { "$_" })
    $id = ([regex]::Match(($createOut -join "`n"), 'id[=:]\s*"?([0-9a-fA-F]{32})')).Groups[1].Value
    if (-not $id) {
      # 兜底：输出里任意 32 位十六进制串视为命名空间 id
      $id = ([regex]::Match(($createOut -join "`n"), '\b([0-9a-fA-F]{32})\b')).Groups[1].Value
    }
    if (-not $id) { throw "无法解析命名空间 id，输出：`n$($createOut -join "`n")" }
    $toml = $toml -replace '(?m)^id\s*=\s*"your_namespace_id"', "id = `"$id`""
    Write-Host "KV 命名空间 id=$id" -ForegroundColor Green
  } else {
    $id = $idNow
    Write-Host "复用已有 KV 命名空间 id=$id" -ForegroundColor Green
  }
}

# 统一写回 wrangler.toml（保证 account_id / 域名 / 命名空间 id 都落盘后再进入后续步骤）
Invoke-Step -Name '写回 wrangler.toml' -Body {
  [System.IO.File]::WriteAllText($TomlPath, $toml, (New-Object System.Text.UTF8Encoding $true))
  Write-Host 'wrangler.toml 已更新' -ForegroundColor Green
}

# ---------- 3. 上传索引到 KV ----------
Invoke-Step -Name '上传索引到 KV' -Body {
  node scripts/upload-kv.mjs
  if ($LASTEXITCODE -ne 0) { throw '生成 bulk.json 失败' }
  # 作用域：上面 scriptblock 里的 $id 传不出来，这里从 toml 重新解析命名空间 id
  $id = [regex]::Match($toml, '(?m)^id\s*=\s*"([^"]+)"').Groups[1].Value
  if (-not $id) { throw "未从 wrangler.toml 解析到 KV 命名空间 id" }
  npx wrangler kv bulk put data/bulk.json --namespace-id=$id --remote
  if ($LASTEXITCODE -ne 0) { throw "索引上传失败（namespace id=$id）" }
}

# ---------- 4. 配置密钥（手动）----------
Invoke-Step -Name '配置 LLM 密钥' -Body {
  Write-Host @'

请在以下每组「Value」处粘贴对应值并回车。需要 5 个值：
  1) OPENAI_API_KEY       网关的 API Key
  2) OPENAI_BASE_URL      网关地址，如 https://api.deepseek.com/v1
  3) MODEL                生成模型，如 deepseek-chat
  4) EMBEDDING_MODEL      embedding 模型，如 qwen3-embedding-4b
  （若 embedding 与 LLM 网关不同，再补：EMBEDDING_BASE_URL / EMBEDDING_API_KEY）

若暂时没有网关，可跳过（回车）后续 secret put，Worker 会以「骨架已就绪」模式运行并验证检索链路。
'@ -ForegroundColor Yellow

  foreach ($name in @('OPENAI_API_KEY','OPENAI_BASE_URL','MODEL','EMBEDDING_MODEL')) {
    Write-Host ''
    Read-Host "准备写入密钥 $name ，按回车继续（Enter 跳过）" | Out-Null
    npx wrangler secret put $name
  }
}

# ---------- 5. 发布 ----------
Invoke-Step -Name '发布 Worker' -Body {
  npm run deploy
  if ($LASTEXITCODE -ne 0) { throw '发布失败，请查看上面的日志' }
}

# ---------- 6. 健康检查与收尾 ----------
Invoke-Step -Name '健康检查与输出' -Body {
  # 子域名依赖账号，部署日志里 wrangler 会打印实际 workers.dev 地址，这里请手动粘贴
  $base = Read-Host '  请粘贴发布成功后的 workers.dev 地址（wrangler 输出里那一行，含 https://）'
  if (-not $base) { throw '未提供 workers.dev 地址' }
  # PS 5.1 默认非 TLS1.2，连接 Cloudflare 会被拒；先强制启用
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  $resp = Invoke-RestMethod "$base/health" -TimeoutSec 30 -UseBasicParsing
  Write-Host "health 返回：$($resp | ConvertTo-Json -Compress)" -ForegroundColor Green
  Write-Host @"

部署完成！
AI 服务地址(API_BASE)： $base

最后一步：到 Vercel 项目 → Settings → Environment Variables 新增
  PUBLIC_AI_API_BASE=$base
并用新值重新触发一次部署即可线上点亮 AI 助手入口。
"@
}

Write-Host "`n全部完成 ✔" -ForegroundColor Green