import { useState, useEffect } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectDashboard, setProjectDashboard] = useState(null);

  useEffect(() => {
    if (token) {
      fetchProjects(token);
    }
  }, []);

  useEffect(() => {
    if (!selectedProject) {
      setProjectDashboard(null);
      return;
    }

    const fetchDashboard = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/projects/${selectedProject.id}/dashboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.ok) {
          const data = await res.json();
          setProjectDashboard(data);
        }
      } catch {
        setProjectDashboard(null);
      }
    };

    fetchDashboard();
  }, [selectedProject]);

  const fetchProjects = async (authToken) => {
    try {
      const res = await fetch('http://localhost:3000/api/projects', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('http://localhost:3000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setMessage('Login successful');
      fetchProjects(data.token);
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: projectName, description: projectDescription }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create project');
        return;
      }

      setMessage(`Project "${data.name}" created`);
      setProjectName('');
      setProjectDescription('');
      fetchProjects(token);
    } catch (err) {
      setError('Could not connect to server');
    }
  };

  if (!token) {
    return (
      <div>
        <h1>LaunchForge</h1>
        <form onSubmit={handleLogin}>
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <h1>LaunchForge</h1>

      <h2>Your Projects</h2>
      {projects.length === 0 ? (
        <p>No projects yet.</p>
      ) : (
        <ul>
          {projects.map((p) => (
            <li key={p.id} onClick={() => setSelectedProject(p)} style={{ cursor: 'pointer' }}>
              <strong>{p.name}</strong> — {p.status} — {new Date(p.created_at).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}

      {selectedProject && (
        <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid #ccc' }}>
          <h3>{selectedProject.name}</h3>
          <p><strong>Description:</strong> {selectedProject.description || 'None'}</p>
          <p><strong>Status:</strong> {selectedProject.status}</p>
          <p><strong>Created:</strong> {new Date(selectedProject.created_at).toLocaleDateString()}</p>
          {projectDashboard && (
            <>
              <p><strong>Days Since Created:</strong> {projectDashboard.daysSinceCreated}</p>
              <p><strong>Last Updated:</strong> {new Date(projectDashboard.lastUpdated).toLocaleDateString()}</p>
              <p><strong>Total Events:</strong> {projectDashboard.activitySummary.totalEvents}</p>
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
