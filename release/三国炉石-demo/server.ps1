# Sanguo Lushi Demo - PowerShell static file server
# Zero dependencies, uses only built-in Windows PowerShell

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$root = Join-Path $PSScriptRoot 'dist'

if (-not (Test-Path $root)) {
    Write-Host "ERROR: dist folder not found at $root" -ForegroundColor Red
    Write-Host "Make sure server.ps1 and dist are in the same directory." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$mime = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.mjs'  = 'application/javascript; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.webp' = 'image/webp'
    '.ico'  = 'image/x-icon'
    '.mp4'  = 'video/mp4'
    '.webm' = 'video/webm'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
    '.ttf'  = 'font/ttf'
    '.otf'  = 'font/otf'
    '.txt'  = 'text/plain; charset=utf-8'
}

$listener = $null
$port = 5173
while (-not $listener -and $port -lt 5190) {
    try {
        $l = New-Object System.Net.HttpListener
        $l.Prefixes.Add("http://localhost:$port/")
        $l.Start()
        $listener = $l
    } catch {
        $port++
    }
}

if (-not $listener) {
    Write-Host "ERROR: cannot start listener on ports 5173-5189" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$url = "http://localhost:$port/"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Server running at $url" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Keep this window open while playing." -ForegroundColor White
Write-Host "  Close window or press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""

Start-Process $url

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $resp = $context.Response

        try {
            $urlPath = $req.Url.LocalPath
            if ($urlPath -eq '/') { $urlPath = '/index.html' }

            $sep = [System.IO.Path]::DirectorySeparatorChar
            $relPath = [System.Uri]::UnescapeDataString($urlPath).TrimStart('/').Replace('/', $sep)
            $filePath = Join-Path $root $relPath

            $fullRoot = [System.IO.Path]::GetFullPath($root)
            $fullFile = [System.IO.Path]::GetFullPath($filePath)

            if (-not $fullFile.StartsWith($fullRoot)) {
                $resp.StatusCode = 403
            } elseif (Test-Path $filePath -PathType Leaf) {
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                if ($mime.ContainsKey($ext)) {
                    $resp.ContentType = $mime[$ext]
                } else {
                    $resp.ContentType = 'application/octet-stream'
                }
                $resp.ContentLength64 = $bytes.Length
                $resp.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $resp.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $resp.OutputStream.Write($msg, 0, $msg.Length)
            }
        } catch {
            $resp.StatusCode = 500
        } finally {
            try { $resp.OutputStream.Close() } catch {}
        }
    }
} finally {
    if ($listener) {
        $listener.Stop()
        $listener.Close()
    }
}
