# Cricket Tournament Hub

A production-ready cricket tournament management platform built with **Node.js/Express** (backend) and **Next.js/React** (frontend).

## Features

- **Team Registration** — Register teams with exactly 11 players, photos, and tournament selection
- **Individual Player Registration** — Register solo players and assign them to any team later
- **Tournament Management** — Create tournaments, points tables, NRR, fixtures, and results
- **Match Management** — Schedule matches, enter scorecards, live scores, and commentary
- **Player Statistics** — Batting, bowling, fielding stats with career progression graphs
- **Admin Dashboard** — Team approval, player verification, analytics, and reports
- **Public Portal** — Browse teams, players, tournaments, leaderboards, and match schedules
- **Authentication** — JWT-based auth with role-based access (Admin, Team Manager, Visitor)
- **Security** — bcrypt, Helmet, rate limiting, input validation
- **SEO** — Dynamic meta tags, sitemap, robots.txt, Open Graph
- **Dark Mode** — Toggle between light and dark themes

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, Multer, Cloudinary, Swagger |
| Frontend | Next.js 15, React 19, Tailwind CSS, React Query, Redux Toolkit, Chart.js |
| Database | MongoDB |

## Project Structure

```
cricket/
├── backend/
│   ├── src/
│   │   ├── config/         # DB, Cloudinary, Swagger
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, upload, error handling
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Token, email, statistics
│   │   ├── seed/           # Database seeder
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router pages
│   │   ├── components/     # UI components
│   │   ├── lib/            # API client, utilities
│   │   ├── store/          # Redux store
│   │   └── types/          # TypeScript types
│   ├── .env.local.example
│   └── package.json
├── DEPLOYMENT.md
└── README.md
```

## Quick Start (Docker — Recommended)

### Prerequisites

- Docker & Docker Compose

```bash
cp .env.example .env   # optional — edit ports if 5000/3000 are in use
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api (or port set in `.env`) |
| Swagger Docs | http://localhost:5000/api/docs |

If port 5000 is already in use, set `BACKEND_HOST_PORT=5050` and `NEXT_PUBLIC_API_URL=http://localhost:5050/api` in `.env`, then rebuild.

The database is seeded automatically on first run. To reset everything:

```bash
docker compose down -v
docker compose up --build
```

---

## Quick Start (Manual)

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run seed    # Seed demo data
npm run dev     # Start on http://localhost:5000
```

API docs available at: `http://localhost:5000/api/docs`

### 2. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev     # Start on http://localhost:3000
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@crickethub.com | admin123 |
| Team Manager | manager@crickethub.com | manager123 |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/teams` | List teams |
| POST | `/api/teams/register` | Register team with 11 players |
| GET | `/api/players` | List/search players |
| GET | `/api/tournaments` | List tournaments |
| GET | `/api/matches/latest` | Latest matches |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/admin/dashboard` | Admin dashboard stats |

Full API documentation at `/api/docs` (Swagger UI).

## User Roles

- **Admin** — Full access: tournaments, teams, matches, scores, analytics
- **Team Manager** — Register team, manage players, view team stats
- **Public Visitor** — View tournaments, teams, players, leaderboards

## License

MIT


This is only for developer use