@echo off
echo ===================================================
echo     INSTALLING DEPENDENCIES AND DEPLOYING
echo ===================================================

echo.
echo [1/2] Updating dependencies and package-lock.json...
call npm install

echo.
echo [2/2] Deploying to Vercel...
call npx vercel --prod

echo.
echo ===================================================
echo     DEPLOYMENT PROCESS FINISHED!
echo ===================================================
pause
