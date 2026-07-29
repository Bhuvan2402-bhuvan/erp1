@echo off
echo ===================================================
echo     DELETING ALL ACCOUNTS AND RELATED DATA
echo ===================================================

echo.
echo Running delete-all-accounts.mjs...
call node --env-file=.env.local scripts/delete-all-accounts.mjs

echo.
pause
