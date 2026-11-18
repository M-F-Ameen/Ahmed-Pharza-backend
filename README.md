# Cliste API

Standalone REST API for the Cliste public website and admin dashboard. It is intentionally separate from the Next.js frontend in `D:\Ahmed project\frontend`.

## First milestone status

- [x] Node 24 / TypeScript ESM foundation
- [x] NestJS NodeAdapter, `/v1` API prefix, Swagger at `/docs`, OpenAPI JSON at `/docs-json`
- [x] Environment validation, CORS, trusted-origin CSRF, Helmet, throttling, structured logging, problem-details errors
- [x] Prisma 7 PostgreSQL schema for users, roles, sessions, media, projects, revisions, and audit events
- [x] Local Docker PostgreSQL and protected bootstrap seed
- [ ] Auth endpoints and role guard
- [ ] Project CRUD/publish endpoints
- [ ] Signed media upload endpoints
- [ ] Frontend integration

## Local setup

1. Copy `.env.example` to `.env` and replace all secrets.
2. Start PostgreSQL: `docker compose up -d postgres`.
3. Install dependencies: `pnpm install`.
4. Generate Prisma client: `pnpm prisma:generate`.
5. Create/apply the first migration: `pnpm prisma:migrate --name initial`.
6. Set `BOOTSTRAP_ADMIN_EMAIL` and `BOOTSTRAP_ADMIN_PASSWORD` for the one-time seed, then run `pnpm prisma:seed`.
7. Run the API: `pnpm dev`.

The API binds to `127.0.0.1:4000` in development. Swagger is available at `http://127.0.0.1:4000/docs`; liveness is `http://127.0.0.1:4000/v1/health`; database readiness is `http://127.0.0.1:4000/v1/health/ready`.

## Safety rules

- Runtime queries use `DATABASE_URL`; Prisma CLI uses `DIRECT_URL`.
- Do not commit `.env`, database backups, or generated Prisma client files.
- The bootstrap password is never retained as a deployment secret after the administrator account exists.
- Do not connect the frontend until the authentication, project, media, and publishing modules are implemented and tested.
