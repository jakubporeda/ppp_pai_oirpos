1. Wymagania

Python 3.11

Node.js 18

2. Backend (FastAPI)

2.1. Wejście do folderu backendu
cd api

2.2. Utwórz wirtualne środowisko
Windows:
python -m venv venv
venv\Scripts\activate

2.3. Zainstaluj wymagania
pip install -r requirements.txt

2.4. Uruchom backend

Z poziomu folderu api:

uvicorn app.main:app --reload

3. Frontend (React + Tailwind)
3.1. Wejście do folderu frontendowego
cd web

3.2. Instalacja paczek Node
npm install

3.3. Uruchomienie projektu
npm start


