@echo off
REM Open backend virtual environment and run app.py
start cmd /K "cd backend\environ\Scripts && activate.bat && pip install -r requirements.txt && cd .. && cd .. && python app.py"

REM Open frontend and run npm install followed by vite dev
start cmd /K "cd frontend && npm install && npm run dev"
