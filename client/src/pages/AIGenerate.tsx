import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface Task {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  userId: number;
}

interface Project {
  name: string;
  description: string;
  tasks: Task[];
}

interface UserOption {
  id: number;
  email: string;
}

interface SavedProject {
  id: number;
  name: string;
  description: string;
}

interface GeneratedCampaign {
  project_id: number;
  campaign_type: string;
  content: string;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const campaignTypeBadge: Record<string, string> = {
  launch_email: 'bg-blue-100 text-blue-700',
  social_media: 'bg-pink-100 text-pink-700',
  ad_creative: 'bg-orange-100 text-orange-700',
};

export default function AIGenerate() {
  const [description, setDescription] = useState('');
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [generatedCampaigns, setGeneratedCampaigns] = useState<GeneratedCampaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  useEffect(() => {
    api.get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setProjects(null);
    setSaveSuccess('');
    setGenerating(true);
    try {
      const res = await api.post('/ai/generate-plan', {
        startupDescription: description,
        workspaceId: 1,
      });
      const plan: Project[] = res.data.projects.map((p: Project) => ({
        ...p,
        tasks: p.tasks.map((t) => ({ ...t, userId: users[0]?.id || 0 })),
      }));
      setProjects(plan);
    } catch {
      setError('Failed to generate plan. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  function updateTaskUser(projectIdx: number, taskIdx: number, userId: number) {
    setProjects((prev) => {
      if (!prev) return prev;
      return prev.map((p, pi) =>
        pi !== projectIdx
          ? p
          : {
              ...p,
              tasks: p.tasks.map((t, ti) =>
                ti !== taskIdx ? t : { ...t, userId }
              ),
            }
      );
    });
  }

  async function handleSave() {
    if (!projects) return;
    setSaving(true);
    setError('');
    setSaveSuccess('');
    try {
      const res = await api.post('/ai/save-plan', { workspaceId: 1, projects });
      setSavedProjects(res.data.projects);
      setSaveSuccess('Plan saved! Projects and tasks are now live in your workspace.');
    } catch {
      setError('Failed to save plan. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload() {
    if (!projects) return;
    setDownloading(true);
    try {
      const res = await api.post('/ai/download-plan', { plan: { projects } }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LaunchForge-Plan.docx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to download document.');
    } finally {
      setDownloading(false);
    }
  }

  async function handleGenerateCampaigns() {
    setCampaignsLoading(true);
    setError('');
    try {
      const res = await api.post('/ai/generate-campaigns', { projects: savedProjects });
      setGeneratedCampaigns(res.data.campaigns);
    } catch {
      setError('Failed to generate campaign assets.');
    } finally {
      setCampaignsLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">AI Launch Planner</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Describe your startup and AI will generate a structured launch plan with projects and tasks
      </p>

      <form onSubmit={handleGenerate} className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Startup Description</label>
          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your startup, target market, and launch goals..."
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>
        {error && !projects && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={generating}
          className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
        >
          {generating ? 'Generating your plan...' : 'Generate Launch Plan'}
        </button>
      </form>

      {projects && (
        <>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Generated Launch Plan</h2>

          <div className="space-y-6 mb-6">
            {projects.map((project, pi) => (
              <div key={pi} className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{project.description}</p>

                <ul className="space-y-3">
                  {project.tasks.map((task, ti) => (
                    <li key={ti} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{task.description}</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap ${priorityColors[task.priority] || 'bg-gray-100 text-gray-600'}`}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Assign to:</label>
                        <select
                          value={task.userId}
                          onChange={(e) => updateTaskUser(pi, ti, Number(e.target.value))}
                          className="text-xs border border-gray-300 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          {users.length === 0 && <option value={0}>No users loaded</option>}
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>{u.email}</option>
                          ))}
                        </select>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}
          {saveSuccess && <p className="text-sm text-green-600 mb-4">{saveSuccess}</p>}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || !!saveSuccess}
              className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Plan'}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="px-6 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 disabled:opacity-50"
            >
              {downloading ? 'Downloading...' : 'Download as Word'}
            </button>
          </div>

          {saveSuccess && generatedCampaigns.length === 0 && (
            <div className="mt-8 bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 text-center">
              <button
                onClick={handleGenerateCampaigns}
                disabled={campaignsLoading}
                className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
              >
                {campaignsLoading ? 'Generating campaign assets...' : 'Generate Campaign Assets'}
              </button>
              <p className="text-xs text-gray-500 mt-2">
                AI will create a marketing campaign for each project in your plan
              </p>
            </div>
          )}

          {generatedCampaigns.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Campaign Assets</h2>
              <div className="space-y-4">
                {generatedCampaigns.map((c, i) => {
                  const projectName = savedProjects.find((p) => p.id === c.project_id)?.name || `Project #${c.project_id}`;
                  return (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-900">{projectName}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${campaignTypeBadge[c.campaign_type] || 'bg-gray-100 text-gray-600'}`}>
                          {c.campaign_type.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="bg-gray-50 border border-gray-100 rounded-md p-4 text-sm text-gray-700 whitespace-pre-wrap">
                        {c.content}
                      </div>
                    </div>
                  );
                })}
              </div>
              <a
                href="/campaigns"
                className="inline-block mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                View All Campaigns →
              </a>
            </div>
          )}
        </>
      )}
    </div>
  );
}
