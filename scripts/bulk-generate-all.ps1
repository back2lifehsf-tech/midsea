# Bulk generation de los 8 cursos del Pilot Mínimo (Epic 04 Tarea 4).
#
# Uso (desde PowerShell, en la raíz del repo):
#   .\scripts\bulk-generate-all.ps1
#
# Corre los 8 cursos secuencialmente con --concurrency 3 + --skip-existing.
# El retry de 429/5xx que vive dentro de generate-lesson.mjs hace que esto
# sea desatendido — podés cerrar la sesión de SSH/laptop si es necesario
# (el proceso muere si cerrás la ventana de PowerShell, así que lo ideal
# es dejarla abierta).
#
# Logs:
#   - Salida en consola en tiempo real.
#   - Copia completa en outputs\bulk-generate-<timestamp>.log.
#
# Cómo monitorear desde otra terminal:
#   Get-Content outputs\bulk-generate-*.log -Tail 20 -Wait
#
# Si necesitás abortar: Ctrl+C en la ventana donde corre.

$ErrorActionPreference = 'Continue'

# Orden: chicos primero para warm-up + feedback rápido, luego los grandes.
$courses = @(
    'music-grade-9',
    'history-ancient-civ-2-grade-9-10',
    'math-grade-9',
    'math-grade-10',
    'language-grade-9-10',
    'english-esl-grade-9',
    'english-esl-grade-10',
    'science-biology-grade-9-10'
)

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logDir = Join-Path $PSScriptRoot '..\outputs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$logFile = Join-Path $logDir "bulk-generate-$timestamp.log"

$summary = @()
$startAll = Get-Date

Write-Host ""
Write-Host "Bulk generation Pilot Minimo - 8 cursos" -ForegroundColor Cyan
Write-Host "Iniciado: $startAll" -ForegroundColor Cyan
Write-Host "Log: $logFile" -ForegroundColor Cyan
Write-Host ""

foreach ($course in $courses) {
    $courseStart = Get-Date
    Write-Host ""
    Write-Host "=== $course ===" -ForegroundColor Yellow
    Write-Host "Inicio: $courseStart"

    "" | Out-File -Append $logFile
    "=== $course ===" | Out-File -Append $logFile
    "Inicio: $courseStart" | Out-File -Append $logFile

    & node scripts/generate-course.mjs --course $course --concurrency 3 --skip-existing 2>&1 |
        Tee-Object -FilePath $logFile -Append

    $exitCode = $LASTEXITCODE
    $courseEnd = Get-Date
    $duration = $courseEnd - $courseStart

    $summary += [pscustomobject]@{
        Course   = $course
        ExitCode = $exitCode
        Duration = "$([math]::Round($duration.TotalMinutes, 1)) min"
        Status   = if ($exitCode -eq 0) { 'OK' } else { 'FAIL' }
    }

    "Fin: $courseEnd (exit=$exitCode)" | Out-File -Append $logFile
}

$endAll = Get-Date
$totalDuration = $endAll - $startAll

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
$summary | Format-Table -AutoSize
Write-Host "Total wallclock: $([math]::Round($totalDuration.TotalMinutes, 1)) min" -ForegroundColor Cyan
Write-Host "Log completo: $logFile" -ForegroundColor Cyan

"`n=== RESUMEN ===" | Out-File -Append $logFile
$summary | Format-Table -AutoSize | Out-String | Out-File -Append $logFile
"Total wallclock: $([math]::Round($totalDuration.TotalMinutes, 1)) min" | Out-File -Append $logFile

# Conteo rapido de JSONs generados.
Write-Host ""
Write-Host "JSONs generados por curso:" -ForegroundColor Cyan
foreach ($course in $courses) {
    $genDir = Join-Path $logDir "gen\$course"
    if (Test-Path $genDir) {
        $count = (Get-ChildItem $genDir -Filter '*.json' -ErrorAction SilentlyContinue).Count
        Write-Host "  $course : $count lecciones"
    } else {
        Write-Host "  $course : (sin carpeta gen/)" -ForegroundColor Yellow
    }
}
