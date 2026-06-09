@echo off
echo ===================================================
echo     GENERATING HIERARCHICAL TEST ACCOUNTS
echo ===================================================

echo.
echo Running seed-users.mjs...
call node --env-file=.env.local scripts/seed-users.mjs

echo.
pause
