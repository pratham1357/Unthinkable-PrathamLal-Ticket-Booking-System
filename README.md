# TicketVault — Ticket Booking System

Unthinkable Solutions placement process assignment submission.

A full-stack ticket booking platform for movies and concerts — real-time seat maps, timed seat holds, QR-coded e-tickets, a waitlist with automatic offer cascading, and role-based dashboards for customers, event organisers, and admins.

## Live Demo

| | URL |
|---|---|
| Frontend | _add your Vercel URL here after deploying_ |
| Backend API | _add your Render URL here after deploying_ |

## Tech Stack

**Frontend** — React 19, Vite, React Router, Axios, plain CSS (custom properties, no framework)

**Backend** — Node.js, Express, Prisma ORM, SQLite, JWT auth, bcrypt, node-cron, nodemailer, qrcode

## Features

**Customer**
- Browse and search events by title/type
- Real-time seat map with live availability polling
- Timed seat holds (configurable TTL) with a live countdown before checkout
- Booking confirmation, QR-code e-ticket, and an emailed ticket (or console-logged in dev if no SMTP is configured)
- Booking history and cancellation
- Join a waitlist per seat category when sold out; automatically offered the next available seat when someone cancels

**Event Organiser**
- Create events against a venue's seat layout
- Dashboard listing owned events
- Per-event analytics: revenue, seats booked/held/available, occupancy, and a bookings list

**Admin**
- Create venues with a configurable row/seat layout
- View all registered users and their roles
- Platform-wide revenue and booking overview

**Background jobs**
- A cron job runs every minute to release expired seat holds and expire stale waitlist offers, automatically cascading the offer to the next person in line.

## Demo Accounts

Seeded by `npm run db:seed` in the `server` directory:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Organiser | `organiser@example.com` | `organiser123` |
| Customer | `customer@example.com` | `customer123` |

## Project Structure

```
client/    React + Vite frontend
  src/
    pages/        Route-level views
    components/   Reusable UI (seat map, event card, navbar)
    hooks/         useAuth (JWT session context)
    utils/api.js   Axios instance (base URL configurable via VITE_API_URL)

server/    Express + Prisma backend
  src/
    routes/        auth, events, bookings, waitlist, organizer, admin
    middleware/    JWT authentication + role guards
    utils/         QR code generation, email sending, hold/waitlist cron
    prisma/        schema.prisma, migrations, seed script
```

## Getting Started Locally

### Prerequisites
- Node.js 18+
- npm

### 1. Backend setup

```bash
cd server
npm install
cp .env.example .env   # then edit JWT_SECRET if you like — see table below
npm run db:generate    # prisma generate
npm run db:migrate     # applies migrations, creates dev.db
npm run db:seed        # seeds demo accounts, a venue, and two events
npm run dev            # starts on http://localhost:5000
```

### 2. Frontend setup

```bash
cd client
npm install
npm run dev             # starts on http://localhost:5173
```

The Vite dev server proxies `/api` requests to `http://localhost:5000` automatically (see `vite.config.js`), so no `.env` is needed for local frontend development.

### 3. Open the app

Visit `http://localhost:5173` and log in with one of the demo accounts above.

Prisma Studio (optional DB browser): `cd server && npm run db:studio`

## Environment Variables

**server/.env**

| Variable | Description | Example |
|---|---|---|
| `PORT` | Backend port | `5000` |
| `JWT_SECRET` | Secret used to sign auth tokens | any random string |
| `DATABASE_URL` | Prisma SQLite connection string | `file:./prisma/dev.db` |
| `HOLD_TTL_MINUTES` | How long a seat hold lasts before auto-release | `10` |
| `WAITLIST_OFFER_MINUTES` | How long a waitlist offer stays valid | `30` |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | Optional SMTP config for real emails | — omit to log emails to the console instead |

**client** (only needed for production builds — local dev uses the Vite proxy)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full URL of the deployed backend API | `https://your-app.onrender.com/api` |

## Deployment

- **Frontend** deploys to Vercel: root directory `client`, framework preset Vite, with `VITE_API_URL` set to the deployed backend's URL.
- **Backend** deploys to Render (or any host that runs a persistent Node process): root directory `server`, build command runs `prisma generate`, `prisma migrate deploy`, and the seed script, start command `npm start`.

SQLite is used for simplicity; because it's a single file on disk, it needs a host with a persistent (non-serverless) filesystem — a plain Node process host like Render, Railway, or Fly.io, rather than a serverless platform.

## API Overview

All endpoints are prefixed with `/api`. Authenticated routes expect `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Get a JWT |
| GET | `/events` | List events (supports `?search=` and `?type=`) |
| GET | `/events/:id` | Event details |
| GET | `/events/:id/seats` | Seat map for an event |
| POST | `/events/:id/hold` | Hold seats (auth required) |
| POST | `/events` | Create event (organiser/admin) |
| POST | `/bookings` | Confirm a booking from a held selection |
| GET | `/bookings` | Current user's bookings |
| GET | `/bookings/:id` | Single booking / ticket |
| POST | `/bookings/:id/cancel` | Cancel a booking |
| POST | `/events/:eventId/waitlist` | Join a category waitlist |
| GET | `/waitlist` | Current user's waitlist entries |
| GET | `/organiser/events` | Organiser's own events |
| GET | `/organiser/events/:id/summary` | Revenue/occupancy analytics |
| GET/POST | `/admin/venues` | List/create venues |
| GET | `/admin/users` | All registered users |
| GET | `/admin/overview` | Platform-wide stats |
