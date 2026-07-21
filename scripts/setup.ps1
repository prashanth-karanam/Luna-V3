$ErrorActionPreference = "Stop"
$Host.UI.RawUI.WindowTitle = "Luna OS Setup Engine"

$tasks = @(
    "Checking Python & Node.js Dependencies",
    "Checking Ollama Installation",
    "Downloading Phi-3 AI Model",
    "Setting up Python Environment & Playwright",
    "Compiling Standalone LunaOS.exe"
)

$completed = 0
$total = $tasks.Count

function Update-UI {
    param([string]$CurrentAction, [int]$percent)
    Clear-Host
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "      Luna OS Interactive Installer      " -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    
    for ($i = 0; $i -lt $total; $i++) {
        if ($i -lt $completed) {
            Write-Host "[X] $($tasks[$i])" -ForegroundColor Green
        } elseif ($i -eq $completed) {
            Write-Host "[>] $($tasks[$i]) (In Progress...)" -ForegroundColor Yellow
        } else {
            Write-Host "[ ] $($tasks[$i])" -ForegroundColor Gray
        }
    }
    Write-Host ""
    Write-Host "Total Progress: $completed / $total tasks completed" -ForegroundColor Cyan
    Write-Progress -Activity "Luna OS Setup" -Status $CurrentAction -PercentComplete $percent
}

# Task 1: Check Python & Node
Update-UI -CurrentAction "Checking Python and Node.js..." -percent 10
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "error") { throw "Python error" }
} catch {
    Write-Host "`nERROR: Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Python 3.8+ before running setup." -ForegroundColor Yellow
    pause
    exit
}
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "error") { throw "Node error" }
} catch {
    Write-Host "`nERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please install Node.js before running setup." -ForegroundColor Yellow
    pause
    exit
}
Start-Sleep -Seconds 1
$completed++

# Task 2: Check Ollama
Update-UI -CurrentAction "Verifying Ollama..." -percent 30
try {
    $ollamaVersion = ollama --version 2>&1
    if ($ollamaVersion -match "error") { throw "Ollama error" }
} catch {
    Write-Host "`nERROR: Ollama is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Please download and install Ollama from https://ollama.com to run Phi-3 locally." -ForegroundColor Yellow
    Start-Process "https://ollama.com"
    pause
    exit
}
Start-Sleep -Seconds 1
$completed++

# Task 3: Pull Phi-3
Update-UI -CurrentAction "Pulling Phi-3 model via Ollama (This may take a while)..." -percent 50
Write-Host "`nDownloading Phi-3 (Wait for Ollama output below)..." -ForegroundColor Yellow
try {
    ollama pull phi3
} catch {
    Write-Host "`nFailed to pull phi3. Is Ollama running?" -ForegroundColor Red
    pause
    exit
}
$completed++

# Task 4: Python VENV & Playwright
Update-UI -CurrentAction "Setting up Python virtual environment and Playwright..." -percent 70
Write-Host "`nSetting up Python dependencies. This might take a few minutes..." -ForegroundColor Yellow
if (-not (Test-Path "venv")) {
    python -m venv venv
}
$env:VIRTUAL_ENV = "$PWD\venv"
$env:PATH = "$PWD\venv\Scripts;$env:PATH"
python -m pip install --upgrade pip
pip install -r tools\requirements.txt
playwright install chromium
$completed++

# Task 5: Compile Standalone EXE
Update-UI -CurrentAction "Installing Node modules and building LunaOS.exe..." -percent 90
Write-Host "`nInstalling node modules and building executable..." -ForegroundColor Yellow
npm install
npm run dist
$completed++

# Done
Update-UI -CurrentAction "Setup Complete!" -percent 100
Write-Host "`nSetup has finished successfully!" -ForegroundColor Green
Write-Host "Your standalone Luna OS executable has been generated in the 'dist' folder." -ForegroundColor Green
Write-Host "Press any key to exit..." -ForegroundColor Cyan
pause
