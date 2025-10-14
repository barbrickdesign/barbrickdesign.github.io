# Simple TCP-based static file server for PowerShell
# Run: powershell -ExecutionPolicy Bypass -NoProfile -File .\serve_tcp.ps1
# Binds to 127.0.0.1:8000 (loopback) and serves files from the script directory.
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$ip = [System.Net.IPAddress]::Loopback
$port = 8000
$listener = [System.Net.Sockets.TcpListener]::new($ip, $port)
try{
    $listener.Start()
}catch{
    Write-Error ("Failed to start TCP listener on {0}:{1} - {2}" -f $ip, $port, $_)
    exit 1
}
Write-Host ("Serving {0} at http://127.0.0.1:{1}/`nPress Ctrl+C to stop" -f $base, $port)

# Content type map
$mimeMap = @{
    '.html' = 'text/html; charset=utf-8'
    '.htm'  = 'text/html; charset=utf-8'
    '.js'   = 'application/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.gif'  = 'image/gif'
    '.svg'  = 'image/svg+xml'
    '.json' = 'application/json; charset=utf-8'
}

while ($true) {
    try{
        $client = $listener.AcceptTcpClient()
        $ns = $client.GetStream()
        $reader = New-Object System.IO.StreamReader($ns)
        # Read request line and headers (stop at blank line)
        $request = ''
        while (($line = $reader.ReadLine()) -ne $null) {
            if ($line -eq '') { break }
            $request += $line + "`n"
            # break early if we have at least the request line
            if ($request -match "^\S+\s+\S+\s+HTTP/\d\.\d") { }
        }
        if (-not $request) { $ns.Close(); $client.Close(); continue }
        $first = $request.Split("`n")[0]
        $parts = $first -split '\s+'
        $method = $parts[0]
        $urlPath = $parts[1]
        if ($urlPath -eq '/') { $urlPath = '/link.html' }
    # Convert URL path into a local Windows path safely
    $localPath = ($urlPath.TrimStart('/') -split '/') -join '\\'
        $file = Join-Path $base $localPath
        if (-not (Test-Path $file)){
            $body = "404 Not Found"
            $resp = "HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n$body"
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($resp)
            $ns.Write($bytes, 0, $bytes.Length)
            $ns.Flush()
            $ns.Close(); $client.Close(); continue
        }
        $ext = [System.IO.Path]::GetExtension($file).ToLowerInvariant()
        $mime = $mimeMap[$ext]
        if (-not $mime) { $mime = 'application/octet-stream' }
        $fileBytes = [System.IO.File]::ReadAllBytes($file)
        $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($fileBytes.Length)`r`nConnection: close`r`n`r`n"
        $hdrBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
        $ns.Write($hdrBytes, 0, $hdrBytes.Length)
        $ns.Write($fileBytes, 0, $fileBytes.Length)
        $ns.Flush()
        $ns.Close(); $client.Close()
    }catch{
        # log and continue
        Write-Warning ("Request handling failed: {0}" -f $_)
        try{ if($ns) { $ns.Close() } if($client) { $client.Close() } }catch{}
    }
}
