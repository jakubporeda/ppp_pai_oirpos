Write-Host "START: Backend + Frontend"

#backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/api'; .\venv\Scripts\Activate.ps1; uvicorn app.main:app --reload"

#frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/web'; npm start"
