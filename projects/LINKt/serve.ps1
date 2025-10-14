# Simple static file server for PowerShell (uses HttpListener)
# Run: powershell -ExecutionPolicy Bypass -File .\serve.ps1
$base = Split-Path -Parent $MyInvocation.MyCommand.Path

# Scan for an available port starting from 8000
$port = 8000
while ($true) {
    $listener = New-Object System.Net.HttpListener
    $prefix = "http://localhost:$port/"
    $listener.Prefixes.Add($prefix)
    try {
        $listener.Start()
        break
    } catch {
        Write-Host "Port $port is in use. Trying next port..."
        $port++
        if ($port -gt 8100) {
            Write-Error "No available ports found between 8000 and 8100. Exiting."
            exit 1
        }
    }
}

Write-Host "Serving $base at $prefix`nPress Ctrl+C to stop"
try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $req = $context.Request
        $path = [System.Uri]::UnescapeDataString($req.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrEmpty($path)) { $path = 'link.html' }
        $file = Join-Path $base $path
        if (-not (Test-Path $file)) {
            $context.Response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
            $context.Response.Close()
            continue
        }
        $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        $mime = switch ($ext) {
            '.html' { 'text/html' }
            '.htm' { 'text/html' }
            '.js' { 'application/javascript' }
            '.css' { 'text/css' }
            '.png' { 'image/png' }
            '.jpg' { 'image/jpeg' }
            '.jpeg' { 'image/jpeg' }
            '.gif' { 'image/gif' }
            '.svg' { 'image/svg+xml' }
            '.json' { 'application/json' }
            default { 'application/octet-stream' }
        }
        $bytes = [System.IO.File]::ReadAllBytes($file)
        $context.Response.ContentType = $mime
        $context.Response.ContentLength64 = $bytes.Length
        $context.Response.OutputStream.Write($bytes, 0, $bytes.Length)
        $context.Response.Close()
    }
} finally {
    $listener.Stop()
}
