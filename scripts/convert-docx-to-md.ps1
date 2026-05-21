# scripts/convert-docx-to-md.ps1
#
# Convierte recursivamente todos los .docx en docs/content/source/ a .md
# usando pandoc. Los .md quedan al lado de los .docx con el mismo nombre.
#
# Requisitos:
#   - Pandoc instalado (https://pandoc.org/installing.html)
#     Verificá con: pandoc --version
#
# Uso:
#   Desde PowerShell, en la raíz del repo:
#     .\scripts\convert-docx-to-md.ps1
#
#   Si recibís error de execution policy:
#     PowerShell -ExecutionPolicy Bypass -File .\scripts\convert-docx-to-md.ps1

$source = "$PSScriptRoot\..\docs\content\source"

if (-not (Test-Path $source)) {
    Write-Error "Carpeta no encontrada: $source"
    exit 1
}

# Verificar que pandoc está disponible
try {
    $null = Get-Command pandoc -ErrorAction Stop
} catch {
    Write-Error "Pandoc no está instalado o no está en PATH. Bajalo de https://pandoc.org/installing.html"
    exit 1
}

$files = Get-ChildItem -Path $source -Recurse -Filter "*.docx"
$total = $files.Count
$converted = 0
$failed = 0

Write-Host "Encontrados $total archivos .docx para convertir..."
Write-Host ""

foreach ($file in $files) {
    $output = $file.FullName -replace '\.docx$', '.md'
    $relativePath = $file.FullName.Substring($source.Length + 1)

    try {
        pandoc $file.FullName -o $output --to gfm --wrap=none 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  [OK]   $relativePath"
            $converted++
        } else {
            Write-Host "  [FAIL] $relativePath (exit code $LASTEXITCODE)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  [FAIL] $relativePath - $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "============================================"
Write-Host "Convertidos: $converted / $total"
if ($failed -gt 0) {
    Write-Host "Fallaron: $failed" -ForegroundColor Red
}
Write-Host "Los .md quedaron al lado de los .docx originales."
