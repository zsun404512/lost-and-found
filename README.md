
# Lost & Found

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
- Tooling: ESLint, Vitest (frontend), Jest + Supertest (backend), Cucumber

## Monorepo Structure (tree)
```
lost-and-found/
├─ .gitignore
├─ README.md
├─ package.json               # npm workspaces + scripts
├─ package-lock.json
├─ test-results/             # test output artifacts (e.g., coverage, reports)
├─ playwright-tests/         # Playwright end-to-end tests (if used)
├─ backend/
│  ├─ .env.example
│  ├─ package.json
│  ├─ test/
│  │  ├─ features/          # Cucumber feature files
│  │  ├─ steps/             # Cucumber step definitions
│  │  └─ support/           # Cucumber support & hooks
│  └─ src/
│     ├─ index.js           # API server entry
│     ├─ routes/            # Express route definitions
│     │  └─ __tests__/      # route-level Jest tests
│     ├─ controllers/       # request handlers / business logic
│     │  └─ __tests__/      # controller tests
│     ├─ models/            # Mongoose models (MongoDB)
│     ├─ middleware/        # custom Express middleware
│     └─ messages/          # shared response / validation messages
└─ frontend/
   ├─ package.json          # Vite + React app
   ├─ vite.config.js        # dev proxy: /api -> http://localhost:4000
   ├─ index.html
   ├─ eslint.config.js
   ├─ public/
   │  ├─ index.html
   │  └─ decorations/       # static UI assets
   ├─ tests/
   │  ├─ components/        # React component tests
   │  ├─ pages/             # page-level tests
   │  ├─ context/           # context/provider tests
   │  └─ utils/             # utility tests
   └─ src/
      ├─ main.jsx           # React entry
      ├─ App.jsx            # top-level app + routes
      ├─ index.jsx          # legacy/alternate entry (if used)
      ├─ styles.css
      ├─ assets/            # images, icons, etc.
      ├─ components/        # shared UI components
      ├─ pages/             # route components / screens
      ├─ context/           # React context providers
      ├─ hooks/             # custom React hooks
      └─ utils/             # shared helpers
```

## Getting Started
From the repository root:

1) Install dependencies (workspaces: frontend + backend)
```bash
npm install
```

2) Paste the contents of `.env.example` into `.env` and update the values as needed. For a functional setup, you can just paste the contents as-is for now. (If you want to have a personalized configuration, [see how to set up .env and MongoDB](#manually-setting-up-env-file-and-mongodb)
).

3) Run both frontend and backend together
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

## Testing

### Frontend tests

- Frontend tests are performed by `vitest` in the form of unit test and integration tests.
- Notice that you need to have the frontend and backend running to test components that depend on API calls.

```bash
cd frontend
npx vitest # run all tests
```

### Backend tests 

- Backend tests are written in Node.js and use `vitest`.
- Notice that you need a running backend and frontend to test API calls.

```bash
cd backend
node --test test/*.test.mjs
node --test test/individual_file.test.mjs # you can run it all or indivually
```

### End-to-end tests: Cucumber

- Notice that you need to switch to local MongoDB instance for these tests to work properly.
- For configuration, see [local setup instructions](#local-mongodb-community-edition) in [how to set up .env and MongoDB](#manually-setting-up-env-file-and-mongodb)


```bash
cd backend
MONGODB_URI="mongodb://127.0.0.1:27017/lostandfound-test" npm run dev
# open another terminal to run the tests
cd backend
MONGODB_URI="mongodb://127.0.0.1:27017/lostandfound-test" npm run cucumber 
```

### End-to-end with Playwright

- The Playwright tests provide browser-level end-to-end testing using real browsers, and it also needs a running backend with local MongoDB instance.
- The Playwright tests are run in the root project folder.

```bash
MONGODB_URI="mongodb://127.0.0.1:27017/lostandfound-test" npm run dev
npm run test:e2e # run this in another terminal
```

### Test Doubles

- Test Doubles are performed by `jest`.
- The commands are run from the root project folder.

```bash
npm test --workspace backend # run all tests from project root
```

## Manually Setting up `.env` file and MongoDB
If you want the backend to persist items to MongoDB, set up a MongoDB instance (MongoDB Atlas or local) and provide the connection string in `backend/.env` as `MONGODB_URI`.

### Local MongoDB (Community Edition)

#### MacOS with Homebrew
1. Install MongoDB Community Edition (one-time):

    ```bash
    brew tap mongodb/brew
    brew install mongodb-community
    ```

2. Start MongoDB now and on login:

    ```bash
    brew services start mongodb-community
    ```

3. Verify the server is running:

    ```bash
    mongod --version
    mongosh "mongodb://localhost:27017/lostandfound"
    ```

    You should see a `lostandfound>` prompt in `mongosh` without connection errors.

4. Set the connection string in `backend/.env`:

    ```bash
    MONGODB_URI=mongodb://localhost:27017/lostandfound
    ```

    Then (from the repo root) start the app:

    ```bash
    npm run dev
    ```

    If the backend can connect, it will log `Connected to MongoDB` and use the `lostandfound` database for `/api/items`.

#### Windows with MongoDB Community Server (Not Recommended)

If you prefer to run MongoDB locally on Windows:

1. Install MongoDB Community Server (one-time):

   - Go to https://www.mongodb.com/try/download/community
   - Download the Windows installer (MSI).
   - During setup, keep defaults and **install MongoDB as a Service**.

2. Start (or verify) the MongoDB service:

   Open PowerShell **as Administrator** and run:

   ```powershell
   # Start the MongoDB Windows service (name may be 'MongoDB' or 'MongoDB Server')
   net start MongoDB
   ```

### Cloud MongoDB (MongoDB Atlas)
You can also use a cloud-hosted MongoDB instance via MongoDB Atlas. Here's the basic setup:

1. Create a free cluster at https://www.mongodb.com/cloud/atlas and create a database user.
2. Get the connection string and replace placeholders, e.g.:

```
MONGODB_URI=mongodb+srv://user:password@cluster0.abcde.mongodb.net/lostandfound?retryWrites=true&w=majority
```

3. Put that value into `backend/.env` (create the file from `backend/.env.example`) and start the backend.

Behavior: if `MONGODB_URI` is set and the backend can connect, the API will use MongoDB for GET/POST `/api/items`. If no `MONGODB_URI` is provided or the DB connection fails, the backend will fall back to an in-memory store (so the app still works for local dev).

## Project Reference

### Environment Variables
Backend (`backend/.env` — create from `backend/.env.example`):
- `PORT` (optional, default 4000)
- `MONGODB_URI` (optional) — if set and reachable, the API uses MongoDB; otherwise it falls back to in-memory storage loaded from `src/data.json`.

### API Endpoints (Backend)
- `GET /api` → `{ message: "Hello from the Lost and Found API!" }`
- `GET /api/ping` → `{ message: "pong", time: <ISO> }`
- `GET /api/items` → list items (MongoDB if configured, else in-memory)
- `POST /api/items` → create item (JSON body: `{ title, type, description, location, date }`)
- `GET /api/items/:id` → get single item by id
- `PUT /api/items/:id` → update item (auth, owner only)
- `DELETE /api/items/:id` → delete item (auth, owner only)
- `PUT /api/items/:id/toggle-resolve` → toggle item status (auth, owner only)
- `POST /api/auth/register` → register user `{ email, password }`
- `POST /api/auth/login` → log in and get JWT
- `POST /api/upload` → upload image file (auth)
- `GET /api/images/:id` → fetch image by id
- `GET /api/messages/conversations` → list conversations (auth)
- `POST /api/messages/conversations` → create/get conversation (auth)
- `GET /api/messages/conversations/:conversationId/messages` → list messages (auth)
- `POST /api/messages/conversations/:conversationId/messages` → send message (auth)

### Class Diagram

![Class Diagram](diagram/class.png)

### Login/Signup Sequence Diagram

![Login/Signup Sequence Diagram](diagram/login_signup_sequence.png)

### Post Item Sequence Diagram

![Post Item Sequence Diagram](diagram/post_sequence.png)

### Message Sequence Diagram

![Message Sequence Diagram](diagram/message_sequence.png)

### Linting (Frontend)
ESLint is configured in `frontend/eslint.config.js`.
```bash
cd frontend
npm run lint
```
You can also apply safe fixes:
```bash
npx eslint . --fix
```

### Notes
- The Vite dev server proxies `/api` to `http://localhost:4000` (see `frontend/vite.config.js`).
- CORS is enabled on the backend for development.
- If you don’t set `MONGODB_URI`, everything still works using in-memory data.
