@echo off
echo =====================================
echo  ClothERP Live Publisher
echo =====================================
echo [1/2] Launching Backend Server...
start cmd /k "cd backend && node server.js"
echo [2/2] Launching Ngrok Global Tunnel...
start cmd /k "ngrok http 5000"
echo.
echo Your app is now live at your Ngrok URL!
echo Check the Ngrok window for your public link.
echo =====================================
pause
