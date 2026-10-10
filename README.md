# Quba Infotech Attendance Tracker

Responsive web attendance system for **Quba Infotech** — staff punch in/out, leave requests, holidays, and an admin panel for staff and reports.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Prisma + **PostgreSQL** (use **pgAdmin** to manage the database)
- Auth.js (NextAuth) — username + password
- Brand colors: primary `#006FC7`, cyan `#04BEF9`

## Features (v1)

### Admin
- Dashboard overview
- Add / edit / deactivate staff
- Attendance report with filters + CSV export
- Approve / reject leave requests
- Manage company holidays

### Staff
- Mobile-first punch screen (Check In / Check Out)
- Calendar with attendance, holidays, and leaves
- Submit leave requests
- Profile + logout

> Salary / payout letter and GPS geo-fencing are deferred.

## Prerequisites

1. **Node.js** 18+
2. **PostgreSQL** running locally (or Docker)
3. **pgAdmin** (optional but recommended) to create/inspect the database

## Database setup (pgAdmin)

1. Open pgAdmin and connect to your PostgreSQL server.
2. Create a database named `wheyer_tracker` (or any name you prefer).
3. Note the host, port, username, and password.

### Docker alternative (dev)

If you prefer Docker instead of a local Postgres install:

```bash
docker run -d --name wheyer-tracker-db \
  -e POSTGRES_USER=wheyer \
  -e POSTGRES_PASSWORD=wheyer123 \
  -e POSTGRES_DB=wheyer_tracker \
  -p 5433:5432 \
  postgres:16-alpine
```

Connect pgAdmin to `localhost:5433` with user `wheyer` / password `wheyer123`.

## App setup

```bash
cd tracker
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/wheyer_tracker?schema=public"
NEXTAUTH_SECRET="replace-with-a-long-random-string"
NEXTAUTH_URL="http://localhost:3000"
```

Then:

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Default logins (seed)

| Role  | Username | Password  |
|-------|----------|-----------|
| Admin | `admin`  | `admin123` |
| Staff | `hassan` | `staff123` |

Change these after first login in production.

## Useful scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed admin + demo staff |
| `npm run db:studio` | Open Prisma Studio |
| `npm run build` | Production build |

## Project structure

```
src/app/
  login/           # Username + password login
  staff/           # Staff punch, calendar, leaves, profile
  admin/           # Admin dashboard, staff, reports, leaves, holidays
  api/             # Route handlers
prisma/
  schema.prisma    # Data model
  seed.ts          # Seed script
```
# Hr-managment
