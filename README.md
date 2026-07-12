# rshields-website

A personal portfolio and private admin dashboard, built as a unified Next.js application. The public side showcases projects; the authenticated dashboard provides project management, a self-hosted file vault, and a live service-status panel.

## Overview

The site serves two audiences from one codebase:

- **Public portfolio** — a project listing rendered server-side from PostgreSQL, showing only published work.
- **Private dashboard** (behind login) — manage projects, browse and manage a file vault backed by self-hosted object storage, and monitor the health of the stack's dependencies.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack, React 19) |
| Language | TypeScript |
| Database | PostgreSQL 17 |
| ORM / query layer | Drizzle (schema introspected from the existing database) |
| Auth | `iron-session` — encrypted cookie sessions, bcrypt password verification |
| Object storage | Garage (self-hosted, S3-compatible) |
| S3 client | AWS SDK for JavaScript v3 (`@aws-sdk/client-s3`) |
| Cache / sessions store | Redis (available) |
| Runtime | Node 22, WSL2 Ubuntu (development) |

## Architecture

### Public site
Server components query PostgreSQL through Drizzle and render on the server — no client-side data fetching or API layer for the public listing. Only projects with `status = 'published'` are shown, ordered by `sort_order` then `published_at`.

### Authentication
Login verifies an email/password against the `users` table (bcrypt hashes) and issues an encrypted `iron-session` cookie. A route guard (`src/proxy.ts`) protects everything under `/dashboard`, redirecting unauthenticated requests to `/login`. Single-admin by design.

### File vault
The vault stores files in **Garage**, a self-hosted S3-compatible object store, using a custom UI rather than any third-party file manager. The key design principle: **file bytes never pass through the application server.**

- **Uploads** use presigned URLs. The Next.js server (holding the S3 credentials) signs a short-lived URL; the browser uploads bytes *directly* to Garage.
- **Large files** use S3 multipart upload — the browser splits the file into parts, each part gets its own presigned URL, parts upload in parallel, and Garage reassembles them. This handles very large files (10 GB+) without buffering anything in server memory.
- **Downloads** redirect the browser to a presigned GET URL, so the file streams directly from Garage.
- **Folders** are emulated via key prefixes (object storage has no real directories); the UI provides navigation, creation, rename (copy + delete), and recursive folder delete.

The S3 access keys stay server-side at all times; the browser only ever receives single-purpose, time-limited signed URLs. Every vault API route is gated by the dashboard session.

### Service status
A dashboard page runs live health checks against each dependency (PostgreSQL, Garage, Redis) on load and every 30 seconds, showing up/down state and response times. Checks run in parallel and each performs the cheapest operation that proves real reachability (`SELECT 1`, `HeadBucket`, `PING`).

## Project structure

```
src/
  app/
    page.tsx                     Public project listing (server component)
    login/                       Login page + server action
    dashboard/
      page.tsx                   Dashboard home (cards)
      projects/                  Projects CRUD (list, new, [id] edit)
      vault/                     File vault UI
      status/                    Service status page
    api/
      vault/                     Presign, multipart, list, download, delete,
                                 rename, folder create/delete routes
      status/                    Health-check route
  db/
    index.ts                     Drizzle client (postgres-js)
    schema.ts                    Introspected schema
    queries.ts                   Shared queries
  lib/
    session.ts                   iron-session config
    s3.ts                        Garage/S3 client
    health.ts                    Dependency health checks
    upload.ts                    Thumbnail upload helper
  proxy.ts                       Route guard (Next 16 middleware)
```

## Environment variables

Create `.env.local` in the project root:

```
DATABASE_URL=postgresql://<user>:<password>@127.0.0.1:5432/rshields_website
SESSION_SECRET=<32+ byte random string>

S3_ENDPOINT=http://127.0.0.1:3900
S3_REGION=garage
S3_BUCKET=vault
S3_ACCESS_KEY_ID=<garage access key>
S3_SECRET_ACCESS_KEY=<garage secret key>

REDIS_URL=redis://127.0.0.1:6379
```

Use `127.0.0.1` rather than `localhost` for PostgreSQL to force a TCP connection. Generate `SESSION_SECRET` with `openssl rand -base64 32`.

## Prerequisites

- Node 22+
- PostgreSQL 17 with a `rshields_website` database and a dedicated user
- Garage (S3-compatible object storage) with a `vault` bucket and an access key
- Redis (optional, for the status check and session store)

## Getting started

Install dependencies:

```
npm install
```

Pull the database schema into Drizzle (reads the live database, writes `src/db/schema.ts`):

```
npx drizzle-kit introspect
```

Seed an admin user — create a short seed script that hashes a password with bcrypt (cost 12) and inserts a `users` row, then run it with `node --env-file=.env.local --import tsx src/db/seed.ts`, and delete it afterward so no plaintext password sits in the repo.

Start the dev server:

```
npm run dev
```

The app runs at `http://localhost:3000`. The public site is at `/`, login at `/login`, dashboard at `/dashboard`.

## Running the stack (development)

On WSL2, services do not persist across restarts, so bring them up each session (e.g. via a `start-rshields.sh` script):

```
sudo service postgresql start
sudo service redis-server start
garage -c /etc/garage.toml server &   # backgrounded; logs to a file
npm run dev                           # run in the foreground
```

## Garage notes

- Garage runs as a single node with `replication_factor = 1` and the `lmdb` metadata engine.
- The S3 API is bound to `127.0.0.1:3900` — loopback only, reachable by the app server but not exposed externally.
- Storage locations are set by `metadata_dir` and `data_dir` in `/etc/garage.toml`; point these at the desired disk.
- Bucket CORS must allow the app origin with `PUT`/`GET`/`HEAD`/`POST`/`DELETE` and expose the `ETag` header (required for multipart upload completion).

## Design system

Rosé Pine palette (dark/light), Roboto variable font served locally via `next/font`. Accent `#9ccfd8`, error/destructive `#eb6f92`. Note: much of the current UI uses inline styles as a "get it working" pass — a full styling migration to the semantic Rosé Pine classes is pending.

## Roadmap

- **Deployment to a VPS** — the app currently runs on WSL2, which does not survive reboots. Production means systemd units for each service (start on boot, restart on failure), a real TLS certificate for Garage, and swapping localhost values for the production domain.
- Status history logging (using the `monitored_services` table) to record uptime over time rather than only live snapshots.
- Public project detail pages at `/projects/[slug]`.
- In-vault file search and inline previews (images, PDFs).
- Password change form in the dashboard.
- Full Rosé Pine styling pass to replace the placeholder inline styles.

## Notes on history

This project went through significant architectural evolution before settling on the current stack: it began on Laravel/Inertia/Vue with Docker, moved to native WSL2, then to a Slim 4 (PHP) API with a React/Vite SPA, and finally to this unified Next.js application. The file vault likewise evolved — from a custom SeaweedFS + tusd implementation, through an evaluation of Nextcloud, to the current Garage + presigned-URL approach. Docker was abandoned early due to Windows filesystem mount performance; everything runs natively.