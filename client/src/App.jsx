import { useState, useEffect } from 'react';

function App() {
  const formatEventType = (type) => {
    const labels = { project_created: 'Project created', status_changed: 'Status changed' };
    return labels[type] || type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectSearch, setProjectSearch] = useState('');
  const [projectDashboard, setProjectDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityLimit, setActivityLimit] = useState('5');

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setProjectDashboard(null);
      setDashboardLoading(false);
      setDashboardError(null);
      return;
    }

    const fetchDashboard = async () => {
      setDashboardLoading(true);
      setDashboardError(null);
      try {
        const res = await fetch(
          `http://localhost:3000/api/projects/${selectedProject.id}/dashboard`,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        if (handleUnauthorized(res)) return;
        if (res.ok) {
          const data = await res.json();
          setProjectDashboard(data);
        } else {
          setDashboardError('Failed to load dashboard');
        }
      } catch {
        setProjectDashboard(null);
        setDashboardError('Could not connect to server');
      }
      setDashboardLoading(false);
    };

    fetchDashboard();
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/projects', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (handleUnauthorized(res)) return;
      if (!res.ok) {
        setError('Failed to load projects');
        return;
      }

      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  const [isRegistering, setIsRegistering] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      setMessage('Registration successful. You can now log in.');
      setIsRegistering(false);
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setMessage('Login successful');
      fetchProjects();
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });

      if (handleUnauthorized(res)) return;

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }

      setMessage(`Project "${data.name}" created`);
      setProjectName('');
      setProjectDescription('');
      fetchProjects();
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  const handleUnauthorized = (res) => {
    if (res.status === 401) {
      localStorage.removeItem('token');
      setToken(null);
      setProjects([]);
      setSelectedProject(null);
      setProjectDashboard(null);
      setError('Your session expired. Please log in again.');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setEmail('');
    setPassword('');
    setProjects([]);
    setSelectedProject(null);
    setProjectDashboard(null);
    setMessage(null);
    setError(null);
  };

  if (!token) {
    return (
      <div>
        <h1>LaunchForge</h1>
        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        </form>
        <p>
          {isRegistering ? 'Already have an account? ' : "Don't have an account? "}
          <button
            onClick={() => { setIsRegistering(!isRegistering); setMessage(null); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'blue', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
          >
            {isRegistering ? 'Login' : 'Register'}
          </button>
        </p>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>LaunchForge</h1>
        <button onClick={handleLogout}>Logout</button>
      </div>

      <h2>Your Projects</h2>
      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search projects..."
            value={projectSearch}
            onChange={(e) => setProjectSearch(e.target.value)}
            style={{ marginBottom: '0.5rem' }}
          />
          {(() => {
            const filtered = projects.filter((p) =>
              p.name.toLowerCase().includes(projectSearch.toLowerCase())
            );
            return filtered.length === 0 ? (
              <p>No projects match your search.</p>
            ) : (
              <ul>
                {filtered.map((p) => (
                  <li key={p.id} onClick={() => setSelectedProject(p)} style={{ cursor: 'pointer' }}>
                    <strong>{p.name}</strong> — {p.status} — {new Date(p.created_at).toLocaleDateString()}
                  </li>
                ))}
              </ul>
            );
          })()}
        </>
      )}

      {selectedProject && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h3>{selectedProject.name}</h3>
          <p><strong>Description:</strong> {selectedProject.description || 'None'}</p>
          <p>
            <strong>Status:</strong>{' '}
            <select
              value={selectedProject.status}
              onChange={async (e) => {
                const newStatus = e.target.value;
                try {
                  const res = await fetch(
                    `http://localhost:3000/api/projects/${selectedProject.id}/status`,
                    {
                      method: 'PATCH',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                      },
                      body: JSON.stringify({ status: newStatus }),
                    }
                  );
                  if (handleUnauthorized(res)) return;
                  if (res.ok) {
                    const updated = await res.json();
                    const merged = { ...selectedProject, status: updated.status, updated_at: updated.updated_at };
                    setSelectedProject(merged);
                    setProjects((prev) => prev.map((p) => (p.id === merged.id ? { ...p, status: merged.status, updated_at: merged.updated_at } : p)));
                  }
                } catch {
                  setError('Could not update status');
                }
              }}
            >
              <option value="planning">planning</option>
              <option value="active">active</option>
              <option value="completed">completed</option>
            </select>
          </p>
          <p><strong>Created:</strong> {new Date(selectedProject.created_at).toLocaleDateString()}</p>
          {dashboardLoading && <p>Loading dashboard...</p>}
          {dashboardError && <p style={{ color: 'red' }}>{dashboardError}</p>}
          {!dashboardLoading && !dashboardError && projectDashboard && (
            <>
              <p><strong>Days Since Created:</strong> {projectDashboard.daysSinceCreated}</p>
              <p><strong>Last Updated:</strong> {new Date(projectDashboard.lastUpdated).toLocaleDateString()}</p>
              <p><strong>Total Events:</strong> {projectDashboard.activitySummary.totalEvents}</p>
              {projectDashboard.recentActivity.length > 0 && (
                <>
                  <h4 style={{ display: 'inline', marginRight: '0.5rem' }}>Recent Activity</h4>
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                  >
                    <option value="all">All activity</option>
                    <option value="project_created">Project created</option>
                    <option value="status_changed">Status changed</option>
                  </select>
                  <select
                    value={activityLimit}
                    onChange={(e) => setActivityLimit(e.target.value)}
                    style={{ marginLeft: '0.5rem' }}
                  >
                    <option value="5">Show 5</option>
                    <option value="10">Show 10</option>
                    <option value="all">Show all</option>
                  </select>
                  {(() => {
                    const filtered = projectDashboard.recentActivity.filter(
                      (event) => activityFilter === 'all' || event.event_type === activityFilter
                    );
                    const limited = activityLimit === 'all'
                      ? filtered
                      : filtered.slice(0, Number(activityLimit));
                    return filtered.length === 0 ? (
                      <p>No activity matches this filter.</p>
                    ) : (
                      <ul>
                        {limited.map((event, i) => (
                          <li key={i}>
                            {formatEventType(event.event_type)} — {new Date(event.created_at).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </>
              )}
            </>
          )}
          <button onClick={() => setSelectedProject(null)}>Close</button>
        </div>
      )}

      <h2>Create Project</h2>
      <form onSubmit={handleCreateProject}>
        <div>
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
        </div>
        <button type="submit">Create</button>
      </form>

      {message && <p style={{ color: 'green' }}>{message}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default App;
