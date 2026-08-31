param(
  [string]$Root = (Get-Location).Path,
  [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'
$rootPath = [System.IO.Path]::GetFullPath($Root)
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $Port)
$listener.Start()

$mime = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'application/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
  '.png' = 'image/png'
  '.jpg' = 'image/jpeg'
  '.jpeg' = 'image/jpeg'
  '.svg' = 'image/svg+xml'
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()

    if ([string]::IsNullOrWhiteSpace($requestLine)) {
      continue
    }

    $parts = $requestLine.Split(' ')
    $requestPath = if ($parts.Length -ge 2) { $parts[1] } else { '/' }
    $pathOnly = $requestPath.Split('?')[0].TrimStart('/')
    if ([string]::IsNullOrWhiteSpace($pathOnly)) {
      $pathOnly = 'indexMP.html'
    }

    $relativePath = [System.Uri]::UnescapeDataString($pathOnly).Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $fullPath = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($rootPath, $relativePath))
    $isAllowed = $fullPath.StartsWith($rootPath, [System.StringComparison]::OrdinalIgnoreCase)

    if (-not $isAllowed -or -not [System.IO.File]::Exists($fullPath)) {
      $status = '404 Not Found'
      $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
      $contentType = 'text/plain; charset=utf-8'
    } else {
      $status = '200 OK'
      $body = [System.IO.File]::ReadAllBytes($fullPath)
      $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
      $contentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { 'application/octet-stream' }
    }

    $header = "HTTP/1.1 $status`r`nContent-Type: $contentType`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($body, 0, $body.Length)
  } catch {
    # Keep the dev server alive even if the browser closes a request early.
  } finally {
    $client.Close()
  }
}
