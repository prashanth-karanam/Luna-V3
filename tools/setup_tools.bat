@echo off
echo ====================================================
echo Luna OS Core Tools Setup
echo ====================================================
echo.
echo Checking for Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please download and install Python 3.10+ from python.org
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b
)

echo Installing required packages...
pip install -r requirements.txt

echo.
echo Setup Complete! Luna can now read PDFs and Word Documents.
pause
