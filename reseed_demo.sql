-- ============================================================
-- LaunchForge Demo Reseed Script
-- ============================================================
BEGIN;

-- STEP 1: CLEAN (FK-safe order)
DELETE FROM role_audit_log;
DELETE FROM project_activity;
DELETE FROM tasks;
DELETE FROM projects;
DELETE FROM users;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE projects_id_seq RESTART WITH 1;
ALTER SEQUENCE tasks_id_seq RESTART WITH 1;
ALTER SEQUENCE project_activity_id_seq RESTART WITH 1;
ALTER SEQUENCE role_audit_log_id_seq RESTART WITH 1;

-- STEP 2: RESEED USERS
INSERT INTO users (email, password, role) VALUES
  ('milad.gerami@launchforge.io',   '$2b$10$1fA5R20dJYdZWsF1DFfn0eTas7amW4H6xXvgzAjYUL59pumKlLIjS', 'admin'),
  ('sarah.chen@launchforge.io',     '$2b$10$1fA5R20dJYdZWsF1DFfn0eTas7amW4H6xXvgzAjYUL59pumKlLIjS', 'admin'),
  ('james.walker@launchforge.io',   '$2b$10$1fA5R20dJYdZWsF1DFfn0eTas7amW4H6xXvgzAjYUL59pumKlLIjS', 'user'),
  ('priya.patel@launchforge.io',    '$2b$10$1fA5R20dJYdZWsF1DFfn0eTas7amW4H6xXvgzAjYUL59pumKlLIjS', 'user'),
  ('daniel.nguyen@launchforge.io',  '$2b$10$1fA5R20dJYdZWsF1DFfn0eTas7amW4H6xXvgzAjYUL59pumKlLIjS', 'user');
-- IDs: milad=1, sarah=2, james=3, priya=4, daniel=5

-- STEP 3: RESEED PROJECTS
INSERT INTO projects (user_id, name, description, status, created_at, updated_at) VALUES
  -- milad
  (1, 'EV Fleet Analytics Platform',      'Internal analytics tool tracking fleet electrification KPIs across 12 regions.',         'active',    NOW() - INTERVAL '25 days', NOW() - INTERVAL '1 day'),
  (1, 'Customer Onboarding Redesign',     'End-to-end redesign of the onboarding funnel to reduce drop-off by 40%.',               'completed', NOW() - INTERVAL '28 days', NOW() - INTERVAL '3 days'),
  -- sarah
  (2, 'AI Campaign Generator',            'AI-powered marketing copy engine integrated into the launch workflow.',                  'active',    NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),
  (2, 'Q3 Launch Readiness Dashboard',    'Executive dashboard surfacing go/no-go metrics ahead of Q3 product launch.',             'planning',  NOW() - INTERVAL '10 days', NOW() - INTERVAL '1 day'),
  -- james
  (3, 'Social Media Automation Suite',    'Automated scheduling and performance tracking for multi-platform campaigns.',            'active',    NOW() - INTERVAL '22 days', NOW() - INTERVAL '2 days'),
  (3, 'Competitor Benchmarking Report',   'Quarterly competitive analysis across pricing, features, and market positioning.',       'draft',     NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),
  -- priya
  (4, 'Product Roadmap Portal',           'Internal portal for teams to view, comment on, and track roadmap milestones.',           'active',    NOW() - INTERVAL '18 days', NOW() - INTERVAL '1 day'),
  (4, 'Beta User Feedback Pipeline',      'Structured pipeline to capture, tag, and route beta tester feedback to product.',        'planning',  NOW() - INTERVAL '12 days', NOW() - INTERVAL '4 days'),
  -- daniel
  (5, 'Email Drip Campaign Builder',      'Drag-and-drop builder for multi-step drip sequences with A/B testing support.',          'completed', NOW() - INTERVAL '27 days', NOW() - INTERVAL '5 days'),
  (5, 'Launch Metrics Tracker',           'Real-time tracker for launch KPIs: signups, activation rate, churn, and NPS.',           'active',    NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day');
-- IDs: EV Fleet=1, Onboarding=2, AI Campaign=3, Q3 Dashboard=4,
--       Social Media=5, Competitor=6, Roadmap=7, Beta Feedback=8,
--       Email Drip=9, Launch Metrics=10

-- STEP 4: RESEED TASKS
INSERT INTO tasks (project_id, user_id, title, description, status, due_date, created_at, updated_at) VALUES
  -- Project 1: EV Fleet Analytics Platform (milad)
  (1, 1, 'Design fleet KPI data model',             'Define tables for vehicle telemetry, charging events, and regional rollups.',      'completed',   '2026-05-18', NOW() - INTERVAL '24 days', NOW() - INTERVAL '10 days'),
  (1, 1, 'Build regional comparison dashboard',     'Power BI page comparing electrification rates across all 12 regions.',            'in_progress', '2026-06-01', NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days'),
  (1, 1, 'Integrate telematics API feed',           'Connect to OEM telematics API and schedule hourly data pulls.',                   'in_progress', '2026-06-10', NOW() - INTERVAL '15 days', NOW() - INTERVAL '3 days'),
  (1, 1, 'Create executive summary report',         'One-page PDF export summarizing fleet transition progress for leadership.',       'open',        '2026-06-20', NOW() - INTERVAL '5 days',  NOW() - INTERVAL '5 days'),

  -- Project 2: Customer Onboarding Redesign (milad)
  (2, 1, 'Map current onboarding funnel',           'Document every step and drop-off point in the existing signup flow.',             'completed',   '2026-05-15', NOW() - INTERVAL '27 days', NOW() - INTERVAL '20 days'),
  (2, 1, 'Design new welcome sequence',             'Wireframe the streamlined 3-step welcome flow with progress indicator.',         'completed',   '2026-05-22', NOW() - INTERVAL '25 days', NOW() - INTERVAL '15 days'),
  (2, 1, 'Implement A/B test framework',            'Set up feature flags and analytics events for onboarding experiments.',          'completed',   '2026-05-30', NOW() - INTERVAL '20 days', NOW() - INTERVAL '8 days'),
  (2, 1, 'Analyze conversion lift results',         'Compare control vs. variant conversion rates and write recommendation.',         'completed',   '2026-06-05', NOW() - INTERVAL '10 days', NOW() - INTERVAL '4 days'),

  -- Project 3: AI Campaign Generator (sarah)
  (3, 2, 'Define prompt templates for ad copy',     'Create reusable prompt templates for headline, body, and CTA generation.',       'completed',   '2026-05-20', NOW() - INTERVAL '19 days', NOW() - INTERVAL '10 days'),
  (3, 2, 'Build generation API endpoint',           'REST endpoint accepting campaign brief and returning generated variants.',       'in_progress', '2026-06-01', NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
  (3, 2, 'Add tone and brand voice controls',       'UI sliders for formality, humor, and urgency that modify prompt parameters.',    'open',        '2026-06-15', NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),
  (3, 2, 'Integrate with campaign scheduler',       'Connect generated copy to the existing campaign scheduling workflow.',           'open',        '2026-06-25', NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days'),

  -- Project 4: Q3 Launch Readiness Dashboard (sarah)
  (4, 2, 'Identify go/no-go KPIs with stakeholders','Workshop with PM and eng leads to finalize the 8 readiness metrics.',           'completed',   '2026-05-18', NOW() - INTERVAL '9 days',  NOW() - INTERVAL '5 days'),
  (4, 2, 'Design dashboard wireframes',             'Figma mockups for the executive readiness view with status indicators.',         'in_progress', '2026-05-28', NOW() - INTERVAL '7 days',  NOW() - INTERVAL '2 days'),
  (4, 2, 'Set up data pipeline for launch metrics', 'ETL job pulling from Jira, GitHub, and QA test results into warehouse.',         'open',        '2026-06-10', NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),

  -- Project 5: Social Media Automation Suite (james)
  (5, 3, 'Build multi-platform post scheduler',     'Unified scheduler supporting Twitter, LinkedIn, and Instagram via APIs.',        'completed',   '2026-05-20', NOW() - INTERVAL '21 days', NOW() - INTERVAL '12 days'),
  (5, 3, 'Implement engagement analytics panel',    'Dashboard showing likes, shares, clicks, and follower growth per platform.',     'in_progress', '2026-06-05', NOW() - INTERVAL '16 days', NOW() - INTERVAL '3 days'),
  (5, 3, 'Add AI-powered caption suggestions',      'Generate caption variants based on image content and past engagement data.',     'open',        '2026-06-18', NOW() - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),
  (5, 3, 'Create automated reporting emails',       'Weekly email digest summarizing social performance sent to stakeholders.',       'open',        '2026-06-28', NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days'),

  -- Project 6: Competitor Benchmarking Report (james)
  (6, 3, 'Compile competitor pricing data',         'Scrape and normalize pricing tiers from top 5 competitors.',                    'open',        '2026-05-25', NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),
  (6, 3, 'Analyze feature parity matrix',           'Spreadsheet comparing feature coverage across all competitors.',                'open',        '2026-06-05', NOW() - INTERVAL '3 days',  NOW() - INTERVAL '3 days'),
  (6, 3, 'Draft executive summary',                 'Two-page brief with key findings and strategic recommendations.',               'open',        '2026-06-15', NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),

  -- Project 7: Product Roadmap Portal (priya)
  (7, 4, 'Design roadmap timeline component',       'Interactive timeline with drag-and-drop milestone reordering.',                  'completed',   '2026-05-22', NOW() - INTERVAL '17 days', NOW() - INTERVAL '8 days'),
  (7, 4, 'Build commenting and voting system',      'Threaded comments and upvote mechanism on each roadmap item.',                  'in_progress', '2026-06-01', NOW() - INTERVAL '12 days', NOW() - INTERVAL '2 days'),
  (7, 4, 'Add team permission controls',            'Role-based access so only PMs can edit milestones, others can comment.',        'in_progress', '2026-06-12', NOW() - INTERVAL '7 days',  NOW() - INTERVAL '3 days'),
  (7, 4, 'Implement milestone notifications',       'Email and in-app alerts when milestones are completed or at risk.',             'open',        '2026-06-25', NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days'),

  -- Project 8: Beta User Feedback Pipeline (priya)
  (8, 4, 'Design feedback intake form',             'Multi-step form with category tags, severity, and screenshot upload.',          'completed',   '2026-05-20', NOW() - INTERVAL '11 days', NOW() - INTERVAL '6 days'),
  (8, 4, 'Build auto-tagging classifier',           'ML model to auto-categorize feedback into bug, feature request, or UX issue.', 'in_progress', '2026-06-08', NOW() - INTERVAL '8 days',  NOW() - INTERVAL '2 days'),
  (8, 4, 'Set up routing rules to product teams',   'Configurable rules engine routing tagged feedback to the right Slack channel.', 'open',        '2026-06-20', NOW() - INTERVAL '4 days',  NOW() - INTERVAL '4 days'),

  -- Project 9: Email Drip Campaign Builder (daniel)
  (9, 5, 'Build drag-and-drop email editor',        'Visual editor with reusable content blocks and template library.',              'completed',   '2026-05-18', NOW() - INTERVAL '26 days', NOW() - INTERVAL '15 days'),
  (9, 5, 'Implement drip sequence logic',           'Backend engine for time-based and event-triggered email sequences.',            'completed',   '2026-05-25', NOW() - INTERVAL '22 days', NOW() - INTERVAL '10 days'),
  (9, 5, 'Add A/B testing for subject lines',       'Split test framework with statistical significance calculator.',               'completed',   '2026-06-01', NOW() - INTERVAL '18 days', NOW() - INTERVAL '7 days'),
  (9, 5, 'Create campaign performance dashboard',   'Metrics view showing open rates, click rates, and conversion per drip step.',   'completed',   '2026-06-10', NOW() - INTERVAL '12 days', NOW() - INTERVAL '6 days'),

  -- Project 10: Launch Metrics Tracker (daniel)
  (10, 5, 'Define core launch KPIs',                'Align with product on the 6 metrics to track: signups, activation, etc.',      'completed',   '2026-05-18', NOW() - INTERVAL '14 days', NOW() - INTERVAL '8 days'),
  (10, 5, 'Build real-time metrics ingestion',      'Streaming pipeline consuming events from Segment and writing to Postgres.',    'in_progress', '2026-06-01', NOW() - INTERVAL '10 days', NOW() - INTERVAL '2 days'),
  (10, 5, 'Design KPI dashboard with alerts',       'Live dashboard with threshold-based alerts for activation and churn.',         'open',        '2026-06-15', NOW() - INTERVAL '6 days',  NOW() - INTERVAL '6 days'),
  (10, 5, 'Set up daily digest email for leadership','Automated morning email with previous-day metrics and trends.',               'open',        '2026-06-30', NOW() - INTERVAL '2 days',  NOW() - INTERVAL '2 days');

-- STEP 5: RESEED PROJECT_ACTIVITY
INSERT INTO project_activity (user_id, project_id, event_type, created_at) VALUES
  -- Project 1: EV Fleet Analytics Platform
  (1, 1, 'project_created', NOW() - INTERVAL '25 days'),
  (1, 1, 'task_added',      NOW() - INTERVAL '24 days'),
  (1, 1, 'member_added',    NOW() - INTERVAL '23 days'),
  (1, 1, 'task_added',      NOW() - INTERVAL '20 days'),
  (1, 1, 'status_changed',  NOW() - INTERVAL '10 days'),
  (1, 1, 'ai_generation',   NOW() - INTERVAL '3 days'),

  -- Project 2: Customer Onboarding Redesign
  (1, 2, 'project_created', NOW() - INTERVAL '28 days'),
  (1, 2, 'task_added',      NOW() - INTERVAL '27 days'),
  (1, 2, 'task_added',      NOW() - INTERVAL '25 days'),
  (1, 2, 'status_changed',  NOW() - INTERVAL '15 days'),
  (1, 2, 'ai_generation',   NOW() - INTERVAL '8 days'),
  (1, 2, 'status_changed',  NOW() - INTERVAL '3 days'),

  -- Project 3: AI Campaign Generator
  (2, 3, 'project_created', NOW() - INTERVAL '20 days'),
  (2, 3, 'task_added',      NOW() - INTERVAL '19 days'),
  (2, 3, 'ai_generation',   NOW() - INTERVAL '15 days'),
  (2, 3, 'member_added',    NOW() - INTERVAL '12 days'),
  (2, 3, 'status_changed',  NOW() - INTERVAL '8 days'),

  -- Project 4: Q3 Launch Readiness Dashboard
  (2, 4, 'project_created', NOW() - INTERVAL '10 days'),
  (2, 4, 'task_added',      NOW() - INTERVAL '9 days'),
  (2, 4, 'member_added',    NOW() - INTERVAL '7 days'),
  (2, 4, 'task_added',      NOW() - INTERVAL '4 days'),
  (2, 4, 'ai_generation',   NOW() - INTERVAL '2 days'),

  -- Project 5: Social Media Automation Suite
  (3, 5, 'project_created', NOW() - INTERVAL '22 days'),
  (3, 5, 'task_added',      NOW() - INTERVAL '21 days'),
  (3, 5, 'task_added',      NOW() - INTERVAL '16 days'),
  (3, 5, 'status_changed',  NOW() - INTERVAL '12 days'),
  (3, 5, 'ai_generation',   NOW() - INTERVAL '6 days'),
  (3, 5, 'member_added',    NOW() - INTERVAL '3 days'),

  -- Project 6: Competitor Benchmarking Report
  (3, 6, 'project_created', NOW() - INTERVAL '5 days'),
  (3, 6, 'task_added',      NOW() - INTERVAL '4 days'),
  (3, 6, 'task_added',      NOW() - INTERVAL '3 days'),
  (3, 6, 'task_added',      NOW() - INTERVAL '2 days'),

  -- Project 7: Product Roadmap Portal
  (4, 7, 'project_created', NOW() - INTERVAL '18 days'),
  (4, 7, 'task_added',      NOW() - INTERVAL '17 days'),
  (4, 7, 'member_added',    NOW() - INTERVAL '14 days'),
  (4, 7, 'status_changed',  NOW() - INTERVAL '8 days'),
  (4, 7, 'ai_generation',   NOW() - INTERVAL '5 days'),
  (4, 7, 'task_added',      NOW() - INTERVAL '2 days'),

  -- Project 8: Beta User Feedback Pipeline
  (4, 8, 'project_created', NOW() - INTERVAL '12 days'),
  (4, 8, 'task_added',      NOW() - INTERVAL '11 days'),
  (4, 8, 'ai_generation',   NOW() - INTERVAL '8 days'),
  (4, 8, 'member_added',    NOW() - INTERVAL '6 days'),
  (4, 8, 'status_changed',  NOW() - INTERVAL '4 days'),

  -- Project 9: Email Drip Campaign Builder
  (5, 9, 'project_created', NOW() - INTERVAL '27 days'),
  (5, 9, 'task_added',      NOW() - INTERVAL '26 days'),
  (5, 9, 'task_added',      NOW() - INTERVAL '22 days'),
  (5, 9, 'status_changed',  NOW() - INTERVAL '15 days'),
  (5, 9, 'ai_generation',   NOW() - INTERVAL '10 days'),
  (5, 9, 'status_changed',  NOW() - INTERVAL '5 days'),

  -- Project 10: Launch Metrics Tracker
  (5, 10, 'project_created', NOW() - INTERVAL '15 days'),
  (5, 10, 'task_added',      NOW() - INTERVAL '14 days'),
  (5, 10, 'member_added',    NOW() - INTERVAL '10 days'),
  (5, 10, 'ai_generation',   NOW() - INTERVAL '6 days'),
  (5, 10, 'task_added',      NOW() - INTERVAL '2 days');

-- STEP 6: RESEED ROLE_AUDIT_LOG (milad promoting/demoting users over past 2 weeks)
INSERT INTO role_audit_log (admin_id, target_user_id, old_role, new_role, created_at) VALUES
  (1, 3, 'user',  'admin', NOW() - INTERVAL '13 days'),
  (1, 3, 'admin', 'user',  NOW() - INTERVAL '11 days'),
  (1, 4, 'user',  'admin', NOW() - INTERVAL '10 days'),
  (1, 5, 'user',  'admin', NOW() - INTERVAL '8 days'),
  (1, 5, 'admin', 'user',  NOW() - INTERVAL '6 days'),
  (1, 4, 'admin', 'user',  NOW() - INTERVAL '4 days'),
  (1, 3, 'user',  'admin', NOW() - INTERVAL '2 days'),
  (1, 3, 'admin', 'user',  NOW() - INTERVAL '1 day');

COMMIT;

-- VERIFICATION
SELECT 'users' AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'projects', COUNT(*) FROM projects
UNION ALL SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL SELECT 'project_activity', COUNT(*) FROM project_activity
UNION ALL SELECT 'role_audit_log', COUNT(*) FROM role_audit_log;
