$ErrorActionPreference = 'Stop'
$south = -26.3116251
$west = -58.3342335
$north = -26.0959633
$east = -58.1038659
$steps = 4
$folder = Join-Path $PSScriptRoot '../../../map3d-source/osm'
New-Item -ItemType Directory -Force -Path $folder | Out-Null

for ($row = 0; $row -lt $steps; $row++) {
  for ($col = 0; $col -lt $steps; $col++) {
    $path = Join-Path $folder "r${row}c${col}.json"
    if (Test-Path $path) { continue }
    $s = $south + ($north - $south) * $row / $steps
    $n = $south + ($north - $south) * ($row + 1) / $steps
    $w = $west + ($east - $west) * $col / $steps
    $e = $west + ($east - $west) * ($col + 1) / $steps
    $bbox = [string]::Join(',', @($s, $w, $n, $e).ForEach({ $_.ToString('R', [System.Globalization.CultureInfo]::InvariantCulture) }))
    $query = '[out:json][timeout:120];(way["building"](' + $bbox + ');way["highway"](' + $bbox + '););out geom qt;'
    for ($attempt = 1; $attempt -le 4; $attempt++) {
      try {
        Invoke-WebRequest -Uri 'https://overpass-api.de/api/interpreter' -Method Post -Body @{ data = $query } -Headers @{ 'User-Agent' = 'Zuvia-Formosa-OfflineMap/1.0' } -OutFile $path -TimeoutSec 180
        Write-Host "$row,$col $((Get-Item $path).Length) bytes"
        break
      } catch {
        if (Test-Path $path) { Remove-Item -LiteralPath $path }
        if ($attempt -eq 4) { throw }
        Start-Sleep -Seconds (5 * $attempt)
      }
    }
    Start-Sleep -Seconds 2
  }
}
