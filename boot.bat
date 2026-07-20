@echo off
echo ====================================================
echo Booting Luna OS...
echo ====================================================
echo.
echo Note: Ollama will automatically load phi3:mini, Qwen, 
echo and minicpm-v into memory the exact moment Luna needs them!
echo You do not need to launch them manually.
echo.
rem call npm install
call npm run boot
