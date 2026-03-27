@echo off
echo Starting ClothERP Servers...

echo Starting Backend...
start cmd /k "cd backend && npm install && npm run dev"

echo Starting Frontend...
start cmd /k "cd frontend && npm install && npm run dev"

echo Successfully initialized start commands!
echo Note: You must have Node.js installed for these to work.
