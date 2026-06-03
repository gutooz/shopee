# SupplierHub - Inicializacao sem Docker
# Uso: .\start.ps1 [api|seed|worker|beat|all]
# Padrao (sem argumento): sobe apenas o API

param(
    [string]$Mode = "api"
)

$BackendDir = "$PSScriptRoot\backend"
$VenvDir = "$BackendDir\.venv"
$Python = "$VenvDir\Scripts\python.exe"
$Pip = "$VenvDir\Scripts\pip.exe"
$Uvicorn = "$VenvDir\Scripts\uvicorn.exe"
$Celery = "$VenvDir\Scripts\celery.exe"

function Ensure-Venv {
    if (-not (Test-Path $Python)) {
        Write-Host "[setup] Criando ambiente virtual..." -ForegroundColor Cyan
        python -m venv $VenvDir
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[erro] Falha ao criar venv. Verifique se Python 3.11+ esta instalado." -ForegroundColor Red
            exit 1
        }
    }

    Write-Host "[setup] Instalando dependencias..." -ForegroundColor Cyan
    & $Pip install -r "$BackendDir\requirements.txt" -q
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[erro] Falha ao instalar dependencias." -ForegroundColor Red
        exit 1
    }
}

function Start-Api {
    Write-Host "[api] Iniciando FastAPI em http://localhost:8000" -ForegroundColor Green
    Write-Host "[api] Docs: http://localhost:8000/docs" -ForegroundColor Green
    Set-Location $BackendDir
    & $Uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

function Run-Seed {
    Write-Host "[seed] Populando banco com dados iniciais..." -ForegroundColor Cyan
    Set-Location $BackendDir
    & $Python seed.py
}

function Start-Worker {
    Write-Host "[celery] Iniciando worker..." -ForegroundColor Yellow
    Set-Location $BackendDir
    & $Celery -A app.celery_app worker --loglevel=info --concurrency=2
}

function Start-Beat {
    Write-Host "[celery] Iniciando beat scheduler..." -ForegroundColor Yellow
    Set-Location $BackendDir
    & $Celery -A app.celery_app beat --loglevel=info
}

# --- Main ---
Ensure-Venv

switch ($Mode) {
    "api"    { Start-Api }
    "seed"   { Run-Seed }
    "worker" { Start-Worker }
    "beat"   { Start-Beat }
    "all" {
        Write-Host "[all] Iniciando API + Worker + Beat em janelas separadas..." -ForegroundColor Magenta
        Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$BackendDir'; & '$Uvicorn' app.main:app --reload --host 0.0.0.0 --port 8000`""
        Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$BackendDir'; & '$Celery' -A app.celery_app worker --loglevel=info --concurrency=2`""
        Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$BackendDir'; & '$Celery' -A app.celery_app beat --loglevel=info`""
        Write-Host "[all] Processos iniciados em 3 janelas separadas." -ForegroundColor Green
    }
    default {
        Write-Host "Uso: .\start.ps1 [api|seed|worker|beat|all]" -ForegroundColor Yellow
        Write-Host "  api    - Sobe o FastAPI (padrao)"
        Write-Host "  seed   - Popula o banco com dados iniciais"
        Write-Host "  worker - Sobe o Celery worker"
        Write-Host "  beat   - Sobe o Celery beat scheduler"
        Write-Host "  all    - Sobe API + Worker + Beat"
    }
}
