@echo off
echo ====================================================
echo Booting Luna OS...
echo ====================================================
echo.
echo Note: Ollama will automatically load qwythos-9b, Qwen, 
echo and minicpm-v into memory the exact moment Luna needs them!
echo You do not need to launch them manually.
echo.
rem call npm install
call npx electron .
