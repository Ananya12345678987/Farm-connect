# FarmConnect

A marketplace where farmers list what is ready and buyers source it direct,
with no chain of agents in between. Farmers set their own rate, buyers see
exactly which farm grew each lot, and administrators verify farms before they
can list.

This repository holds both halves of the project:

| Folder | What it is | Status |
| --- | --- | --- |
| `frontend/` | React + Vite single-page app | Complete UI, running on sample data |
| `backend/` | Express + MongoDB API | In progress |

## Frontend

Plain JavaScript (JSX), React 19, Vite, React Router 7, no UI framework.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build
npm run preview
```

### Routes

| Path | Screen |
| --- | --- |
| `/` | Home |
| `/about` | About |
| `/login` | Log in |
| `/farmer-register` | Farmer registration |
| `/buyer-register` | Buyer registration |
| `/admin-register` | Administrator access |
| `/farmer-dashboard` | Farmer dashboard |
| `/buyer-dashboard` | Buyer dashboard |
| `/admin-dashboard` | Admin dashboard |
| `*` | Not found |

### How the frontend is organised

```
frontend/src/
  styles/      tokens.css (design tokens) and base.css (reset, utilities)
  utils/       cn, format (INR, dates), validation
  hooks/       reveal, count-up, parallax, tilt, scroll, form
  data/        site copy, product catalogue, dashboard sample data
  services/    api.js (the one place that calls fetch) and per-area services
  components/  one folder per component, each with its own CSS
  sections/    sections of the home page
  layouts/     SiteLayout, PlainLayout, DashboardLayout
  pages/       one component per route
```

A page renders inside a layout, is built from components, and reads either
sample data (`data/`) or, once connected, the API (`services/`). Components
never call `fetch` directly.

### Configuration

Copy `frontend/.env.production.example` for a deployed build. Only variables
that start with `VITE_` reach the browser, so never put a secret in them.

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend API |
| `VITE_SOCKET_URL` | Base URL for real-time messaging |

## Backend

Express and MongoDB. Setup instructions will be added as it is built.