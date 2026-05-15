# LaunchForge AI v3 — Master Roadmap & Progress Tracker
**Last Updated:** 2026-05-15
**Intern:** Milad Gerami | GitHub: Milad-Gerami / Main_Repo
**Purpose:** Close the product gap between what was built (v1 + v2) and what the internship program intended LaunchForge AI to be

---

## CONTEXT — WHY v3 EXISTS

v1 built the foundation (auth, RBAC, PostgreSQL, REST API, CI/CD, React frontend).
v2 added AI content generation, an analytics dashboard, and Redis caching.

After reviewing the internship program's intended product spec, the core gap identified is:

> What was built is a project/task management tool with AI generation.
> What was intended is a **startup launch operating system** — with workspaces, campaigns, feedback, GitHub integration, and notifications as first-class features.

v3 reframes and extends the existing codebase without breaking anything already built.
No v1 or v2 code is removed. Everything is additive.

---

## WHAT v1 + v2 DELIVERED (BASELINE)

| Component | Detail | Status |
|---|---|---|
| PostgreSQL schema | 5 tables: users, projects, tasks, project_activity, role_audit_log | ✅ Complete |
| REST API | 22+ endpoints | ✅ Complete |
| JWT Authentication | Register, login, token verification | ✅ Complete |
| RBAC | Admin + User roles, middleware, admin panel | ✅ Complete |
| Security | Helmet, 3-tier rate limiting, CORS guard | ✅ Complete |
| CI/CD | GitHub Actions — 79 passing tests | ✅ Complete |
| Redis Caching | Analytics + project summaries via Memurai | ✅ Complete |
| AI Generation | POST /api/ai/generate — launch plans + campaign copy | ✅ Complete |
| Analytics Dashboard | Task completion, project status, activity trends | ✅ Complete |
| React Frontend | TypeScript, Vite, TanStack Query, Tailwind CSS | ✅ Complete |
| Deployment Config | Render blueprint, Docker, environment templates | ✅ Complete |

---

## THE 6-PHASE v3 ROADMAP

---

### Phase 9 — Workspace Reframe & Data Model Extension
**Goal:** Add the missing database tables that make LaunchForge AI a startup launch platform, not just a task manager.

**Why:** The spec's central object is a *startup workspace* — an isolated environment per startup with a name, industry, GitHub repo, and team members. This is what separates the product from a generic project tool.

**What was added:**

| Table | Key Columns | Purpose |
|---|---|---|
| `workspaces` | id, owner_id, startup_name, industry, github_url, status, created_at | Central launch environment per startup |
| `campaigns` | id, workspace_id, campaign_type, content, status, generated_by_ai, created_at | Persisted AI-generated launch assets |
| `feedback` | id, workspace_id, submitted_by, feedback_text, rating, created_at | User feedback collection per workspace |
| `workspace_members` | id, workspace_id, user_id, role, joined_at | Multi-user workspace access |
| `notifications` | id, user_id, type, message, read, created_at | In-app alert system |

**Migration strategy:** Existing tables (projects, tasks, project_activity, role_audit_log) are kept intact. New tables are additive — no breaking changes. Database now has 10 tables total.

**Notes:**
- A test workspace row was seeded directly via SQL for Phase 10 development use (`workspace_id = 1`, owner = admin user). This is a dev seed only — workspace creation via API is handled in a later phase.

**Deliverables:**
- [x] Migration SQL script written
- [x] Migration applied to local PostgreSQL (launchforge_db)
- [x] All 5 new tables verified in psql
- [x] GitHub committed

**Status: ✅ Complete**

---

### Phase 10 — Campaigns Module
**Goal:** Persist AI-generated content as real campaign records with lifecycle management (draft → active → complete).

**Why:** The current AI feature generates text and returns it — nothing is saved. The spec requires campaigns to be a distinct entity that can be created, tracked, and managed. This is the difference between an AI text tool and a launch platform.

**What gets built:**

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| /api/campaigns | POST | Authenticated | Create campaign — calls AI, saves result to DB |
| /api/campaigns | GET | Authenticated | List all campaigns for current user's workspaces |
| /api/campaigns/:id | GET | Authenticated | Get single campaign with full content |
| /api/campaigns/:id/status | PUT | Authenticated | Update campaign status |
| /api/campaigns/:id | DELETE | Authenticated | Delete campaign |

**Frontend:**
- Campaigns page — list of saved campaigns with status badges (Draft / Active / Complete)
- Create Campaign form — workspace selector, campaign type, description → triggers AI → saves result
- Campaign detail view — full AI-generated content, status control

**Key shift:** `POST /api/ai/generate` stays as-is for backwards compatibility. The new campaigns endpoint wraps it and adds persistence.

**Ali checkpoint:** Campaign types and AI prompt templates to be confirmed with Ali (stakeholder) before finalizing prompt logic. Backend structure is built first with a working default; Ali is looped in before campaign types are locked in.

**Deliverables:**
- [x] campaigns routes, controller, service files created
- [x] AI generation wired into campaign creation flow
- [x] Campaign saved to DB on creation
- [x] Frontend Campaigns page built
- [x] Ali consulted on campaign types and AI output format — confirmed all 8 types, users choose from full list
- [x] GitHub committed

**Status: ✅ Complete**

---

### Phase 11 — Feedback System
**Goal:** Simple but demonstrable feedback collection tied to workspaces — one of the explicit demonstration requirements in the internship spec.

**Why:** The Definition of Done lists feedback analysis as a required demo item. A simple collect + display system satisfies this without over-engineering.

**Scope decision:** No NLP sentiment analysis. A 1–5 rating field serves as the sentiment proxy. Honest, defensible, and buildable.

**What gets built:**

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| /api/feedback | POST | Authenticated | Submit feedback for a workspace |
| /api/feedback/:workspaceId | GET | Authenticated | Retrieve all feedback for a workspace |
| /api/feedback/:workspaceId/summary | GET | Authenticated | Avg rating + count summary |

**Frontend:**
- Feedback tab on workspace view
- Submission form: rating (1–5) + text comment
- Feedback list: all submissions with rating and timestamp
- Summary card: average rating + total count

**Deliverables:**
- [ ] feedback routes, controller, service files created
- [ ] Frontend Feedback tab built
- [ ] Summary endpoint returning avg + count
- [ ] GitHub committed

**Status: ⏳ Pending**

---

### Phase 12 — GitHub Integration (Lightweight)
**Goal:** Connect a GitHub repository to a workspace and generate an AI-powered deployment readiness report from public repo metadata.

**Why:** GitHub integration is listed as both a core feature and a required demonstration item in the internship spec. Full codebase analysis is not realistic — but fetching public repo metadata and passing it to AI for a readiness summary is exactly what the spec describes and fully achievable.

**What gets built:**

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| /api/github/connect | POST | Authenticated | Save GitHub repo URL to workspace |
| /api/github/analyze | POST | Authenticated | Fetch repo metadata via GitHub API + generate AI readiness report |

**GitHub API data fetched (public, no auth token required for public repos):**
- Primary language
- Star count
- Last commit date
- Open issues count
- README existence
- License presence
- Description

**AI output:** Deployment readiness summary — what's in good shape, what's missing, recommended next steps.

**Frontend:**
- GitHub panel on workspace page
- Connect repo form (URL input)
- Repo stats display
- AI readiness report rendered as formatted text

**Deliverables:**
- [ ] github routes, controller, service files created
- [ ] GitHub public API call working
- [ ] AI readiness report generating correctly
- [ ] Frontend GitHub panel built
- [ ] GitHub committed

**Status: ⏳ Pending**

---

### Phase 13 — Notification System
**Goal:** In-app notifications written automatically on key events — satisfies the notification system requirement from the spec.

**Why:** The spec lists notifications as a required module. Keeping this in-app only (no email) keeps it achievable while still being fully functional and demonstrable.

**Trigger events (notifications auto-created when these happen):**
- Workspace created
- Campaign generated
- Feedback received on your workspace
- Team member added to workspace

**What gets built:**

| Endpoint | Method | Access | Purpose |
|---|---|---|---|
| /api/notifications | GET | Authenticated | Fetch all notifications for current user |
| /api/notifications/unread | GET | Authenticated | Fetch unread count only |
| /api/notifications/:id/read | PUT | Authenticated | Mark single notification as read |
| /api/notifications/read-all | PUT | Authenticated | Mark all as read |

**Frontend:**
- Bell icon in navbar with unread count badge
- Dropdown list of recent notifications on click
- Each notification shows type, message, timestamp, and read/unread state

**Deliverables:**
- [ ] notifications routes, controller, service files created
- [ ] Notification writes wired into workspace, campaign, and feedback creation events
- [ ] Frontend bell icon + dropdown built
- [ ] GitHub committed

**Status: ⏳ Pending**

---

### Phase 14 — RBAC Extension & Viewer Role
**Goal:** Add a `viewer` role that maps to the "investor" persona in the spec — read-only access to workspace analytics and campaigns.

**Why:** The spec defines 7 user roles. The existing system has 2 (admin, user). Adding one meaningful read-only role demonstrates that the RBAC system is extensible and purpose-built for the startup launch context.

**What gets built:**
- `viewer` role added to the allowed roles enum in the DB and middleware
- `requireRole` middleware extended to handle viewer-safe routes (GET only, no create/edit/delete)
- Admin panel updated — admin can assign viewer role to users
- Frontend: Role displayed on profile page; viewer users see dashboards and campaigns but all edit controls are hidden

**Viewer can access:**
- Workspace dashboard (read-only)
- Campaigns list (read-only)
- Analytics (read-only)

**Viewer cannot access:**
- Create/edit/delete anything
- Feedback submission
- GitHub connect/analyze
- Admin panel

**Deliverables:**
- [ ] viewer role added to DB and RBAC middleware
- [ ] Viewer-safe route guards implemented
- [ ] Admin panel updated to assign viewer role
- [ ] Frontend edit controls conditionally hidden for viewers
- [ ] GitHub committed

**Status: ⏳ Pending**

---

### Phase 15 — Documentation & Speak Guide
**Goal:** Complete documentation covering all v1 + v2 + v3 decisions for interview preparation and internship submission.

**Why:** The internship Definition of Done explicitly requires the intern to explain architecture, workflows, AI systems, database design, APIs, deployment, and security decisions. This phase turns the work into a story you can tell confidently.

**What gets built:**
- Updated `README.md` — full platform overview with v3 features
- `LAUNCHFORGE_V3_SPEAK_GUIDE.md` — interview prep doc covering every decision across all phases
- Updated `ARCHITECTURE.md` — reflects new tables and modules
- Basecamp final update — milestone post with screenshots

**Speak guide sections:**
- Product overview (the elevator pitch for v3)
- Data model decisions — why these tables, these relationships
- Workspace vs project — why the reframe mattered
- Campaigns as a lifecycle — draft → active → complete
- Feedback system design choices
- GitHub integration — what it does and what it doesn't do (and why that's honest)
- Notification pattern — event-driven writes
- RBAC extension — how roles map to real users
- Full API surface — every endpoint, what it does, who can call it
- What I would do differently / what comes next

**Deliverables:**
- [ ] README updated
- [ ] ARCHITECTURE.md updated
- [ ] LAUNCHFORGE_V3_SPEAK_GUIDE.md written
- [ ] Basecamp update drafted and posted
- [ ] Final GitHub push with all docs

**Status: ⏳ Pending**

---

## OVERALL v3 PROGRESS

| Phase | Title | Status |
|---|---|---|
| Phase 9 | Workspace Reframe & Data Model Extension | ✅ Complete |
| Phase 10 | Campaigns Module | ✅ Complete |
| Phase 11 | Feedback System | ⏳ Pending |
| Phase 12 | GitHub Integration | ⏳ Pending |
| Phase 13 | Notification System | ⏳ Pending |
| Phase 14 | RBAC Extension & Viewer Role | ⏳ Pending |
| Phase 15 | Documentation & Speak Guide | ⏳ Pending |

---

## WHAT THE COMPLETE PLATFORM COVERS (v1 + v2 + v3)

| Internship Spec Requirement | Covered By | Status After v3 |
|---|---|---|
| Authentication system | v1 | ✅ |
| Role-based access control | v1 + v3 Ph14 | ✅ |
| Startup workspace management | v3 Ph9 | ✅ |
| AI asset generation | v2 + v3 Ph10 | ✅ |
| Campaigns module | v3 Ph10 | ✅ |
| Analytics dashboard | v2 | ✅ |
| Feedback intelligence | v3 Ph11 | ✅ |
| GitHub integration | v3 Ph12 | ✅ |
| Notification system | v3 Ph13 | ✅ |
| CI/CD pipeline | v1 | ✅ |
| Redis caching | v2 | ✅ |
| Security hardening | v1 | ✅ |
| Documentation & speak guide | v3 Ph15 | ✅ |
| Billing system | — | ⏭️ Skipped (enterprise scope) |
| Adaptive AI learning | — | ⏭️ Skipped (enterprise scope) |

---

## WORKFLOW RULES (EVERY SESSION)

- Build one phase at a time — complete and verify before moving forward
- Evidence before moving on — if a step produces output, verify it before the next step
- Claude drafts prompts → Milad executes in Claude Code → reports output → Claude verifies → next step
- PowerShell commands issued as separate steps — no `&&` chaining
- Git commit at the end of every phase with a clear message
- Basecamp update after each meaningful milestone

---

## GIT COMMIT MILESTONES

| Milestone | Commit Message | Status |
|---|---|---|
| Phase 9 complete | `feat: add workspaces, campaigns, feedback, notifications schema (v3 migration)` | ✅ |
| Phase 10 complete | `feat: add campaigns module with AI generation and persistence` | ✅ |
| Phase 11 complete | `feat: add feedback collection and summary endpoints` | ⏳ |
| Phase 12 complete | `feat: add GitHub integration with AI readiness report` | ⏳ |
| Phase 13 complete | `feat: add in-app notification system` | ⏳ |
| Phase 14 complete | `feat: extend RBAC with viewer role` | ⏳ |
| Phase 15 complete | `docs: add v3 speak guide, update README and architecture docs` | ⏳ |

---

*v3 does not rebuild — it reframes and extends. Every v1 and v2 component remains intact.*
