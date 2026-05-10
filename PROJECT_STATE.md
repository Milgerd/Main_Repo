# PROJECT_STATE.md — LaunchForge AI Recovery Snapshot

## 1. Project Overview

LaunchForge AI is a full-stack project management platform built as a portfolio project targeting SQL Developer, Power BI Developer, and Business Analyst roles. It demonstrates end-to-end development: backend API design, relational database modeling, JWT authentication, admin role management, and a React frontend consuming the API.

**Architecture:** Express REST API → PostgreSQL database with Redis caching layer. React SPA frontend communicates via Axios with JWT Bearer auth. Deployed baseline on AWS Elastic Beanstalk with GitHub Actions CI/CD.

## 2. Tech Stack

**Frontend:** React 19, TypeScript, Vite 6, React Router 7, Axios, TanStack Query 5, Tailwind CSS 4

**Backend:** Node.js, Express, PostgreSQL (pg driver), Redis, JWT (jsonwebtoken), bcrypt

**Infrastructure:** Docker, GitHub Actions, AWS Elastic Beanstalk

**Dev Tooling:** ESLint (flat config), Vitest (backend tests)

## 3. Completed Phases

**Phase 1 — Backend Foundation**
- Express server with health check
- PostgreSQL connection and schema (users, projects, tasks, project_activity, role_audit_log)
- User registration and login with bcrypt + JWT
- Authenticated change password endpoint
- Project CRUD with ownership scoping
- Project status updates and dashboard endpoint
- Task CRUD with status filtering
- Activity logging on all project/task mutations

**Phase 2 — Admin & Security Hardening**
- Role-based access control (user/admin)
- Admin user management with role updates
- Last-admin protection guard
- Self-modification prevention
- Role audit logging
- Admin analytics (most active admins)
- Rate limiting on admin routes (10 req/60s)
- Anomaly detection (rapid bulk changes, role flipping)
- Backend test coverage for admin flows

**Phase 3 — React Frontend**
- Vite + TypeScript scaffold with Tailwind CSS
- Axios client with env-based URL, auth interceptor, 401 redirect
- Login and registration flows
- Protected route system with ProtectedRoute component
- Shared NavBar with conditional admin link
- AppLayout with nested routing
- useAuth hook via TanStack Query (GET /me)
- Projects listing, creation, detail, editing, status updates, deletion
- Project dashboard summary with activity feed
- Task listing, creation, status updates, deletion, filtering
- Account page with change password
- Admin page: users table, role updates, audit log, analytics
- ESLint configured and passing clean

## 4. Current Backend API Surface

**AUTH**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/register | None | Create account |
| POST | /api/login | None | Returns JWT + user |
| POST | /api/change-password | Bearer | Change password |
| GET | /api/me | Bearer | Current user info |

**PROJECTS**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/projects | Bearer | Create project |
| GET | /api/projects | Bearer | List user's projects |
| GET | /api/projects/:id | Bearer | Get single project |
| PUT | /api/projects/:id | Bearer | Update name/description |
| PATCH | /api/projects/:id/status | Bearer | Update status |
| DELETE | /api/projects/:id | Bearer | Delete project (cascades) |
| GET | /api/projects/:id/dashboard | Bearer | Project summary + activity |

**TASKS**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | /api/projects/:id/tasks | Bearer | Create task |
| GET | /api/projects/:id/tasks | Bearer | List tasks (?status= filter) |
| PATCH | /api/tasks/:id | Bearer | Update task fields |
| DELETE | /api/tasks/:id | Bearer | Delete task |

**ADMIN** (requires admin role, rate-limited)
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/admin/users | Admin | List all users |
| PUT | /api/admin/users/:id/role | Admin | Update user role |
| GET | /api/admin/audit/roles | Admin | Role change audit log |
| GET | /api/admin/analytics/most-active-admins | Admin | Top 5 admins by changes |

**OTHER**
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | /api/health | None | Health check |

## 5. Frontend Routes Implemented

| Path | Protection | Component | Purpose |
|------|-----------|-----------|---------|
| / | Public | Landing | Welcome page with login/register links |
| /login | Public | Login | Auth form, redirects to /dashboard if token exists |
| /register | Public | Register | Registration form, redirects to /login on success |
| /dashboard | Protected | Dashboard | User email/role via useAuth |
| /projects | Protected | Projects | Project listing + creation |
| /projects/:id | Protected | ProjectDetail | Detail, edit, status, delete, dashboard, tasks |
| /account | Protected | Account | Change password form |
| /admin | Protected | Admin | Users table, role updates, audit log, analytics |
| * | Public | NotFound | 404 catch-all |

## 6. Auth Behavior

- **Token format:** JWT signed with JWT_SECRET, 1-hour expiry
- **Header:** Authorization: Bearer \<token\>
- **Token claims:** { id, email, role }
- **Storage:** localStorage key `launchforge_token`
- **Request interceptor:** Attaches Bearer token to all API calls when present
- **Response interceptor:** On 401, clears token and redirects to /login
- **Route protection:** ProtectedRoute checks localStorage for token, redirects to /login if absent
- **Login redirect:** Login page auto-redirects to /dashboard if token already exists
- **No refresh token:** User must re-login after 1-hour expiry

## 7. Current Features Implemented

- **Auth:** Register, login, logout, change password, session persistence via localStorage
- **Projects:** Full CRUD (create, list, read, update, delete), status management (planning/active/completed), project dashboard with activity summary
- **Tasks:** Full CRUD (create, list, update, delete), status management (open/in_progress/done), server-side status filtering
- **Admin:** Users table with role management, self-modification and last-admin guards, role change audit log with pagination support, most active admins analytics
- **Navigation:** Shared NavBar with conditional admin link, AppLayout with nested protected routes
- **User bootstrap:** useAuth hook fetches GET /me via TanStack Query, 5-min stale time

## 8. Known Constraints / Gaps

- **No refresh token endpoint** — user silently logged out after 1 hour
- **No user profile update** — cannot change email or display name (only password)
- **No global dashboard** — dashboard is per-project only, homepage aggregation requires multiple calls
- **No task pagination** — GET /projects/:id/tasks returns all tasks
- **Activity payload limited** — events have event_type + created_at but no detail about what changed
- **Ownership returns 404** — accessing another user's resource returns 404 not 403 (intentional, avoids leaking existence)

## 9. Deployment Status

- Frontend builds successfully (tsc + vite build)
- ESLint configured with flat config, passes clean (0 errors, 0 warnings)
- GitHub repository synced
- Backend deployed baseline on AWS Elastic Beanstalk exists from Phase 1/2
- client/dist excluded from git tracking

## 10. Next Planned Phase

**Phase 4** — placeholder for upcoming work. Scope not yet defined. Potential areas: global dashboard, task pagination, refresh tokens, profile management, deployment of frontend, end-to-end testing.
