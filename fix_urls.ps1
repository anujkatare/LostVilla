$pattern = '\(([a-zA-Z?.]+\s*\|\|\s*'''')\s*\)\s*\.startsWith\(''http''\)\s*\?\s*([a-zA-Z?.]+)\s*:\s*`http://localhost:5050\$\{([a-zA-Z?.]+)\}`'
$replacement = 'resolveUrl($1)'

$files = @(
  'c:\Users\WINDOWS 11\Documents\LostVilla\frontend\src\components\SearchSection.jsx',
  'c:\Users\WINDOWS 11\Documents\LostVilla\frontend\src\components\ProfileSection.jsx',
  'c:\Users\WINDOWS 11\Documents\LostVilla\frontend\src\components\HomeSection.jsx',
  'c:\Users\WINDOWS 11\Documents\LostVilla\frontend\src\components\ChatSection.jsx'
)

foreach ($f in $files) {
  $content = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
  $updated = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement)
  [System.IO.File]::WriteAllText($f, $updated, [System.Text.Encoding]::UTF8)
  Write-Host "Done: $f"
}
