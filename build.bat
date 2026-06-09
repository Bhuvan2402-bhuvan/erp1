@echo off
echo ===================================================
echo     RUNNING LOCAL NEXT.JS BUILD TO FIND ERRORS
echo ===================================================

echo.
call npm run build

echo.
echo ===================================================
echo     BUILD PROCESS FINISHED!
echo ===================================================
pause
