$files = @(
  'frontend\src\components\HomeSection.jsx',
  'frontend\src\components\SearchSection.jsx',
  'frontend\src\components\ProfileSection.jsx',
  'frontend\src\components\ChatSection.jsx',
  'frontend\src\App.jsx'
)

$base = 'c:\Users\WINDOWS 11\Documents\LostVilla'

foreach ($f in $files) {
  $path = Join-Path $base $f
  $content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

  # Replace fetch('/api/ with fetch(`${API_BASE}/api/
  $content = $content -replace "fetch\(`/api/", 'fetch(`${API_BASE}/api/'
  $content = $content -replace "fetch\('/api/", 'fetch(`${API_BASE}/api/'

  [System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
  Write-Host "Fixed: $f"
}
