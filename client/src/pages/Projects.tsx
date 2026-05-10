import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
}

export default function Projects() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');

  const { data: projects, isLoading, error } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data } = await api.get('/projects');
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/projects', { name, description });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setName('');
      setDescription('');
      setShowForm(false);
      setFormError('');
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setFormError(res.data?.error || 'Failed to create project');
      } else {
        setFormError('Could not connect to server');
      }
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    create.mutate();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="border rounded p-4 mb-6 space-y-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
            <input
              id="description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <button
            type="submit"
            disabled={create.isPending}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {create.isPending ? 'Creating...' : 'Create'}
          </button>
        </form>
      )}

      {isLoading && <p className="text-sm text-gray-500">Loading projects...</p>}

      {error && <p className="text-sm text-red-600">Failed to load projects.</p>}

      {!isLoading && !error && projects?.length === 0 && (
        <p className="text-sm text-gray-500">No projects yet.</p>
      )}

      {projects && projects.length > 0 && (
        <ul className="space-y-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                to={`/projects/${p.id}`}
                className="block border rounded p-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                    {p.status}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-600 mb-1">{p.description}</p>
                )}
                <p className="text-xs text-gray-400">
                  Created {new Date(p.created_at).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
