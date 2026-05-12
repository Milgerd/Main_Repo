import { useState, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

interface Project {
  id: number;
  name: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ActivityEvent {
  event_type: string;
  created_at: string;
}

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  assigned_email: string;
  created_at: string;
  updated_at: string;
}

interface Dashboard {
  projectId: number;
  projectName: string;
  status: string;
  daysSinceCreated: number;
  lastUpdated: string;
  activitySummary: { totalEvents: number };
  recentActivity: ActivityEvent[];
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const STATUSES = ['planning', 'active', 'completed'] as const;

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [statusError, setStatusError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [taskError, setTaskError] = useState('');
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [taskFilter, setTaskFilter] = useState('all');

  const { data: project, isLoading, error } = useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}`);
      return data;
    },
  });

  const { data: dashboard, isLoading: dashLoading, error: dashError } = useQuery<Dashboard>({
    queryKey: ['dashboard', id],
    queryFn: async () => {
      const { data } = await api.get(`/projects/${id}/dashboard`);
      return data;
    },
    enabled: !!project,
  });

  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery<Task[]>({
    queryKey: ['tasks', id, taskFilter],
    queryFn: async () => {
      const url = taskFilter === 'all'
        ? `/projects/${id}/tasks`
        : `/projects/${id}/tasks?status=${taskFilter}`;
      const { data } = await api.get(url);
      return data;
    },
    enabled: !!project,
  });

  const startEditing = () => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? '');
    }
    setEditing(true);
  };

  const update = useMutation({
    mutationFn: async () => {
      const { data } = await api.put(`/projects/${id}`, { name, description });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setEditing(false);
      setFormError('');
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setFormError(res.data?.error || 'Failed to update project');
      } else {
        setFormError('Could not connect to server');
      }
    },
  });

  const statusUpdate = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch(`/projects/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setStatusError('');
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setStatusError(res.data?.error || 'Failed to update status');
      } else {
        setStatusError('Could not connect to server');
      }
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setDeleteError(res.data?.error || 'Failed to delete project');
      } else {
        setDeleteError('Could not connect to server');
      }
    },
  });

  const createTask = useMutation({
    mutationFn: async () => {
      const body: { title: string; description?: string; due_date?: string } = { title: taskTitle };
      if (taskDesc) body.description = taskDesc;
      if (taskDue) body.due_date = taskDue;
      const { data } = await api.post(`/projects/${id}/tasks`, body);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      setTaskTitle('');
      setTaskDesc('');
      setTaskDue('');
      setShowTaskForm(false);
      setTaskError('');
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setTaskError(res.data?.error || 'Failed to create task');
      } else {
        setTaskError('Could not connect to server');
      }
    },
  });

  const handleTaskSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTaskError('');
    createTask.mutate();
  };

  const TASK_STATUSES = ['open', 'in_progress', 'done'] as const;

  const taskStatusUpdate = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: string }) => {
      setUpdatingTaskId(taskId);
      const { data } = await api.patch(`/tasks/${taskId}`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      setUpdatingTaskId(null);
    },
    onError: () => {
      setUpdatingTaskId(null);
    },
  });

  const removeTask = useMutation({
    mutationFn: async (taskId: number) => {
      setDeletingTaskId(taskId);
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', id] });
      setDeletingTaskId(null);
    },
    onError: () => {
      setDeletingTaskId(null);
    },
  });

  const handleDelete = () => {
    if (window.confirm('Delete this project? This cannot be undone.')) {
      setDeleteError('');
      remove.mutate();
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    update.mutate();
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Link to="/projects" className="text-sm text-blue-600 hover:underline">&larr; Back to Projects</Link>

      {isLoading && <p className="mt-4 text-sm text-gray-500">Loading project...</p>}

      {error && <p className="mt-4 text-sm text-red-600">Project not found.</p>}

      {project && !editing && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <div className="flex items-center gap-2">
              <select
                value={project.status}
                disabled={statusUpdate.isPending}
                onChange={(e) => statusUpdate.mutate(e.target.value)}
                className="text-xs border rounded-lg px-2 py-0.5 disabled:opacity-50 transition-all duration-200"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button
                onClick={startEditing}
                className="text-xs px-2 py-0.5 font-medium border rounded-lg hover:bg-gray-50 transition-all duration-200"
              >
                Edit
              </button>
            </div>
          </div>
          {statusError && <p className="text-sm text-red-600 mt-1">{statusError}</p>}
          {project.description && (
            <p className="text-sm text-gray-600 mb-3">{project.description}</p>
          )}
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>Created {new Date(project.created_at).toLocaleDateString()}</p>
            <p>Updated {new Date(project.updated_at).toLocaleDateString()}</p>
          </div>
          <div className="mt-4 border-t pt-3">
            <h2 className="text-sm font-semibold mb-2">Project Summary</h2>
            {dashLoading && <p className="text-xs text-gray-500">Loading summary...</p>}
            {dashError && <p className="text-xs text-red-600">Failed to load summary.</p>}
            {dashboard && (
              <div className="text-xs text-gray-600 space-y-1">
                <p><span className="font-medium">Age:</span> {dashboard.daysSinceCreated} day{dashboard.daysSinceCreated !== 1 ? 's' : ''}</p>
                <p><span className="font-medium">Last updated:</span> {new Date(dashboard.lastUpdated).toLocaleString()}</p>
                <p><span className="font-medium">Total events:</span> {dashboard.activitySummary.totalEvents}</p>
                {dashboard.recentActivity.length > 0 && (
                  <>
                    <p className="font-medium pt-1">Recent activity</p>
                    <ul className="space-y-0.5 pl-3 list-disc">
                      {dashboard.recentActivity.slice(0, 5).map((e, i) => (
                        <li key={i}>
                          {e.event_type.replace(/_/g, ' ')} — {new Date(e.created_at).toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Tasks</h2>
              <button
                onClick={() => setShowTaskForm(!showTaskForm)}
                className="text-xs px-2 py-0.5 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                {showTaskForm ? 'Cancel' : 'Add Task'}
              </button>
            </div>
            {showTaskForm && (
              <form onSubmit={handleTaskSubmit} className="border rounded p-3 mb-3 space-y-2">
                <div>
                  <label htmlFor="task-title" className="block text-xs font-medium mb-0.5">Title</label>
                  <input
                    id="task-title"
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    required
                    className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="task-desc" className="block text-xs font-medium mb-0.5">Description</label>
                  <input
                    id="task-desc"
                    type="text"
                    value={taskDesc}
                    onChange={(e) => setTaskDesc(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="task-due" className="block text-xs font-medium mb-0.5">Due date</label>
                  <input
                    id="task-due"
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {taskError && <p className="text-xs text-red-600">{taskError}</p>}
                <button
                  type="submit"
                  disabled={createTask.isPending}
                  className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
                >
                  {createTask.isPending ? 'Creating...' : 'Create Task'}
                </button>
              </form>
            )}
            <div className="flex gap-1 mb-2">
              {['all', 'open', 'in_progress', 'done'].map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`text-xs px-2 py-0.5 rounded-lg border font-medium transition-all duration-200 ${taskFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {f === 'all' ? 'All' : f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            {tasksLoading && <p className="text-xs text-gray-500">Loading tasks...</p>}
            {tasksError && <p className="text-xs text-red-600">Failed to load tasks.</p>}
            {!tasksLoading && !tasksError && tasks?.length === 0 && (
              <p className="text-xs text-gray-500">
                {taskFilter === 'all' ? 'No tasks yet.' : `No ${taskFilter.replace(/_/g, ' ')} tasks.`}
              </p>
            )}
            {tasks && tasks.length > 0 && (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t.title}</span>
                      <select
                        value={t.status}
                        disabled={updatingTaskId === t.id && taskStatusUpdate.isPending}
                        onChange={(e) => taskStatusUpdate.mutate({ taskId: t.id, status: e.target.value })}
                        className="text-xs border rounded-lg px-2 py-0.5 disabled:opacity-50 transition-all duration-200"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                        ))}
                      </select>
                    </div>
                    {t.description && <p className="text-xs text-gray-600 mt-1">{t.description}</p>}
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                      {t.due_date && <span>Due {new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      <span>Assigned to {t.assigned_email}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-400">Created {new Date(t.created_at).toLocaleDateString()}</p>
                      <button
                        onClick={() => { if (window.confirm('Delete this task?')) removeTask.mutate(t.id); }}
                        disabled={deletingTaskId === t.id && removeTask.isPending}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-all duration-200"
                      >
                        {deletingTaskId === t.id && removeTask.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {deleteError && <p className="text-sm text-red-600 mt-2">{deleteError}</p>}
          <button
            onClick={handleDelete}
            disabled={remove.isPending}
            className="mt-3 px-3 py-1 text-xs font-medium border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-all duration-200"
          >
            {remove.isPending ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      )}

      {project && editing && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 p-4 space-y-3">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Name</label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="edit-desc" className="block text-sm font-medium mb-1">Description</label>
            <input
              id="edit-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={update.isPending}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
            >
              {update.isPending ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => { setEditing(false); setFormError(''); }}
              className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
