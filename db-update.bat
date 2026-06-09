@echo off
echo ===================================================
echo     UPDATING DATABASE SCHEMA FOR NSS ERP
echo ===================================================

echo.
echo [0/3] Preparing environment for Prisma...
copy /Y .env.local .env >nul

echo.
echo [1/3] Generating Prisma Client...
call npx prisma generate

echo.
echo [2/3] Pushing Prisma Schema to Supabase...
call npx prisma db push

echo.
echo [3/3] Seeding the Academic Branches...
call node --env-file=.env.local prisma/seed.mjs

echo.
echo ===================================================
echo     DATABASE UPDATE FINISHED!
echo     Run generate-test-accounts.bat next.
echo ===================================================
pause
