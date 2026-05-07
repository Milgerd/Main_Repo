CREATE TABLE IF NOT EXISTS project_activity (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  event_type VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_project_activity_project_id ON project_activity(project_id);
