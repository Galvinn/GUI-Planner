# GUI Agent - Next Action Planner

A client-server system that recommends the next UI action from a phone screenshot and user goal, using vision language models (VLMs).

## Project structure

- **frontend/** – React + Vite web app
- **backend/** – Flask server with placeholder planner endpoint

## Setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Server runs at `http://127.0.0.1:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173` and proxies `/api` to the Flask backend.

## Usage

1. Upload a screenshot (phone UI).
2. Enter a goal (e.g. “open YouTube app”).
3. (Optional) Select a model.
4. Click **Plan** – the backend is called and the suggested next action is shown.
5. Use **Yes** / **No** for feedback (no backend call yet).
