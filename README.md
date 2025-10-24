
# CS-35L Group Project

Lost & Found tracker with a Vite + React frontend and an Express backend. The backend can use MongoDB if available, or fall back to in-memory storage for local development.

## Features
- Lost/Found items list with quick submit form (frontend)
- REST API: ping/status, list/create items, get item by id (backend)
- Vite dev server with proxy to backend (`/api`)
- CORS enabled on backend for development
- ESLint with React hooks and Vite Fast Refresh rules

## Tech Stack
- Frontend: React 18, Vite, React Router
- Backend: Node.js, Express, Mongoose (optional), CORS, Morgan
- Tooling: ESLint

## Monorepo Structure (tree)
```
CS-35L-Group-Project/
├─ .gitignore
├─ README.md
├─ package.json               # npm workspaces + scripts
├─ package-lock.json
├─ backend/
│  ├─ .env.example
│  ├─ package.json
│  └─ src/
│     ├─ index.js            # API server
│     └─ data.json           # sample data (in-memory fallback)
└─ frontend/
   ├─ package.json           # Vite + React app
   ├─ vite.config.js         # dev proxy: /api -> http://localhost:4000
   ├─ index.html
   ├─ eslint.config.js
   ├─ public/
   │  └─ index.html
   └─ src/
      ├─ App.jsx            # UI (Home) + router pages
      ├─ main.jsx
      ├─ index.jsx
      ├─ styles.css
      └─ assets/
         └─ react.svg
```

## Getting Started (macOS / zsh)
From the repository root:

1) Install dependencies (workspaces: frontend + backend)
```bash
npm install --workspaces
```

2) Run both frontend and backend together
```bash
npm run dev
```
- Frontend: http://localhost:3000
- Backend API (proxied): http://localhost:3000/api
- Backend direct: http://localhost:4000

Alternatively, run individually:
```bash
# Backend
cd backend
npm run dev

# Frontend (in a second terminal)
cd frontend
npm run dev
```

## Environment Variables
Backend (`backend/.env` — create from `backend/.env.example`):
- `PORT` (optional, default 4000)
- `MONGODB_URI` (optional) — if set and reachable, the API uses MongoDB; otherwise it falls back to in-memory storage loaded from `src/data.json`.

## API Endpoints (Backend)
- `GET /api` → `{ message: "Hello from the Lost and Found API!" }`
- `GET /api/ping` → `{ message: "pong", time: <ISO> }`
- `GET /api/items` → list items (MongoDB if configured, else in-memory)
- `POST /api/items` → create item (JSON body: `{ title, type, description, location, date }`)
- `GET /api/items/:id` → get single item by id

## Linting (Frontend)
ESLint is configured in `frontend/eslint.config.js`.
```bash
cd frontend
npm run lint
```
You can also apply safe fixes:
```bash
npx eslint . --fix
```

## Notes
- The Vite dev server proxies `/api` to `http://localhost:4000` (see `frontend/vite.config.js`).
- CORS is enabled on the backend for development.
- If you don’t set `MONGODB_URI`, everything still works using in-memory data.

## Next Steps
- Replace placeholder Login/Sign Up pages with real forms
- Add tests and CI
- Add deployment config (Docker, Render, Fly.io, or Azure)

## Using MongoDB (optional)
If you want the backend to persist items to MongoDB, set up a MongoDB instance (MongoDB Atlas or local) and provide the connection string in `backend/.env` as `MONGODB_URI`.

Example steps with MongoDB Atlas:

1. Create a free cluster at https://www.mongodb.com/cloud/atlas and create a database user.
2. Get the connection string and replace placeholders, e.g.:

```
MONGODB_URI=mongodb+srv://user:password@cluster0.abcde.mongodb.net/lostandfound?retryWrites=true&w=majority
```

3. Put that value into `backend/.env` (create the file from `backend/.env.example`) and start the backend.

Behavior: if `MONGODB_URI` is set and the backend can connect, the API will use MongoDB for GET/POST `/api/items`. If no `MONGODB_URI` is provided or the DB connection fails, the backend will fall back to an in-memory store (so the app still works for local dev).
