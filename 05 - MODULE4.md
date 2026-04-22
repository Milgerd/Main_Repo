# Module 4 — Database + Cache Baseline

## Status
In Progress

## Objective
Establish verified PostgreSQL and Redis connections from the FastAPI backend.
Prove both are reachable before any feature is built on top of them.

## Utilities
- PostgreSQL 18.3 (local)
- Redis via Memurai (local)

## Steps
- [x] Install and verify PostgreSQL
- [x] Install and verify Redis (Memurai)
- [x] Create LaunchForge database in PostgreSQL
- [x] Connect FastAPI to PostgreSQL
- [x] Connect FastAPI to Redis
- [x] Verify both connections respond correctly

## Rules
- One connection at a time
- Verify before moving forward
- No feature code until both connections are confirmed