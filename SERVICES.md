# LaunchForge AI - Initial Service Structure

## Frontend
Responsible for the user interface, dashboard views, authentication screens, and workflow interaction.

## API Layer
Responsible for routing requests, validating inputs, exposing application endpoints, and coordinating access to backend services.

## Authentication Service
Responsible for user registration, login, session handling, and access identity management.

## Core Application Service
Responsible for MVP launch workflow orchestration, feedback handling, asset coordination, and core platform business logic.

## Analytics Service
Responsible for metrics collection, dashboard data preparation, and reporting support.

## Media Asset Service
Responsible for storing, retrieving, and managing campaign and launch-related media assets.

## Database Layer
PostgreSQL is the primary system of record for structured application data.

## Cache Layer
Redis is used for caching and fast-access temporary data.

## Infrastructure Layer
AWS provides the cloud baseline, and GitHub Actions provides CI/CD workflow automation.

## Boundary Rules
- Authentication logic must not be mixed into unrelated services
- Analytics responsibilities must remain separate from core transaction logic
- Cache is not the source of truth
- Intelligence features are not part of the Phase 1 service structure