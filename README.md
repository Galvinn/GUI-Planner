# GUI Agent - Next Action Planner

A client-server system that recommends the next UI action from a phone screenshot and user goal, using vision language models (VLMs).

## Project structure

- **frontend/** – React + Vite web app
- **backend/** – Flask server backed by SQLite

## How to run the project

To start both the backend and frontend from the repo root:

```bash
./run.sh
```

Wait until you see `==> Backend: ready`, then open `http://localhost:3000`.

### What `run.sh` does

- Creates/uses a Python virtual environment at `backend/venv`
- Installs backend dependencies from `backend/requirements.txt`
- Starts the Flask backend at `http://127.0.0.1:5001`
- Installs frontend dependencies (if needed) and starts Vite at `http://localhost:3000`

## Setup (manual)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Server runs at `http://127.0.0.1:5001`.

Database file is stored at `backend/instance/plans.db`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs on the Vite dev server (default `http://localhost:5173`) and proxies `/api` to the Flask backend at `http://127.0.0.1:5001`.

To use port 3000 (to match `run.sh`):

```bash
npm run dev -- --port 3000 --strictPort
```

## Usage

1. Upload a screenshot (phone UI).
2. Enter a goal (e.g. “open YouTube app”).
3. (Optional) Select a model.
4. Click **Plan** – the backend is called and the suggested next action is shown.
5. Use **Yes** / **No** for feedback (no backend call yet).

## Troubleshooting

### Reset plans database

Stop the backend first, then delete:

- `backend/instance/plans.db`
