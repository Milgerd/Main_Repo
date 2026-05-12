# LaunchForge AI v2 — Architecture Overview

## What This Is
A production-grade, AI-powered project and launch management platform.
Users create projects, manage tasks, generate AI-powered launch plans,
and track performance through a live analytics dashboard.

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TanStack Query, Tailwind CSS |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL — 5 tables, foreign keys, indexes, cascading deletes |
| Cache | Redis via Memurai |
| Auth | JWT + bcrypt |
| AI Layer | LLM API — structured prompts, activity logging |
| Security | Helmet, 3-tier rate limiting, CORS production guard |
| CI/CD | GitHub Actions — automated test pipeline, Docker build |
| Deployment | Render blueprint, Docker, environment variable templates |

## Database Schema
- users — authentication, roles (user / admin)
- projects — owned by users, status lifecycle (draft → planning → active → completed)
- tasks — belong to projects, assigned to users, status tracking (open / in_progress / completed)
- project_activity — append-only audit log of all platform events
- role_audit_log — record of every admin role change with before/after state

## Architecture Pattern
Request → Route → Controller → Service → Database

- Routes: define URL paths and attach middleware
- Controllers: handle request/response, validate input
- Services: business logic, database interaction
- Middleware: JWT auth, role enforcement
- Cache layer: Redis sits in front of PostgreSQL for analytics endpoints

## Key Design Decisions
- JWT authentication with bcrypt password hashing
- Role-based access control enforced at middleware level
- Every significant platform action logged to project_activity (audit trail pattern)
- Redis caching with TTL on analytics endpoints to reduce database load
- AI generations logged to project_activity alongside all other events
- Idempotent database migrations — safe to re-run

## Phases Completed
- Phase 1-5 (v1): Database, REST API (22 endpoints), JWT auth, RBAC, security hardening, CI/CD, React frontend
- Phase 6 (v2): AI content generation layer
- Phase 7 (v2): Analytics dashboard
- Phase 8 (v2): Redis caching integration