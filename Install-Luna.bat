@echo off
title Luna OS Setup Engine
echo Starting Luna Setup Engine...
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0scripts\setup.ps1"
