import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface Campaign {
  id: number;
  workspace_id: number;
  campaign_type: string;
  content: string;
  status: string;
  generated_by_ai: boolean;
  created_at: string;
  startup_name?: string;
}

type View = 'list' | 'create' | 'detail';

const CAMPAIGN_TYPES = [
  'email',
  'social_media',
  'press_release',
  'product_hunt',
  'landing_page',
  'cold_outreach',
  'blog_post',
  'investor_pitch',
];

function toTitleCase(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-700',
    complete: 'bg-blue-100 text-blue-700',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {toTitleCase(status)}
    </span>
  );
}

export default function Campaigns() {
  const [view, setView] = useState<View>('list');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Create form state
  const [workspaceId, setWorkspaceId] = useState(1);
  const [campaignType, setCampaignType] = useState(CAMPAIGN_TYPES[0]);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Detail view state
  const [newStatus, setNewStatus] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/campaigns');
      setCampaigns(data);
    } catch {
      setError('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const openDetail = (campaign: Campaign) => {
    setSelected(campaign);
    setNewStatus(campaign.status);
    setStatusMsg('');
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setSelected(null);
    setCreateError('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setCreateError('');
    try {
      const { data } = await api.post('/campaigns', {
        workspaceId,
        campaignType,
        description,
      });
      setCampaigns((prev) => [data, ...prev]);
      setDescription('');
      openDetail(data);
    } catch {
      setCreateError('Failed to generate campaign. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    setStatusMsg('');
    try {
      const { data } = await api.put(`/campaigns/${selected.id}/status`, { status: newStatus });
      setSelected(data);
      setCampaigns((prev) => prev.map((c) => (c.id === data.id ? { ...c, status: data.status } : c)));
      setStatusMsg('Status updated');
      setTimeout(() => setStatusMsg(''), 2000);
    } catch {
      setStatusMsg('Failed to update status.');
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await api.delete(`/campaigns/${selected.id}`);
      setCampaigns((prev) => prev.filter((c) => c.id !== selected.id));
      backToList();
    } catch {
      setStatusMsg('Failed to delete campaign.');
    } finally {
      setDeleting(false);
    }
  };

  // ─── CREATE VIEW ───
  if (view === 'create') {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">
        <button onClick={backToList} className="text-sm text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
          ← Back to Campaigns
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h1>

        <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workspace ID</label>
            <input
              type="number"
              value={workspaceId}
              onChange={(e) => setWorkspaceId(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
            <select
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>{toTitleCase(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your campaign goal or target audience..."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          {createError && <p className="text-sm text-red-500">{createError}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
          >
            {submitting ? 'Generating...' : 'Generate Campaign'}
          </button>
        </form>
      </div>
    );
  }

  // ─── DETAIL VIEW ───
  if (view === 'detail' && selected) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">
        <button onClick={backToList} className="text-sm text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
          ← Back to Campaigns
        </button>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
            {toTitleCase(selected.campaign_type)}
          </span>
          <StatusBadge status={selected.status} />
        </div>
        <p className="text-xs text-gray-400 mb-6">
          Created {new Date(selected.created_at).toLocaleDateString()}
        </p>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6 max-h-[28rem] overflow-y-auto">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-mono">{selected.content}</pre>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Update Status</label>
          <div className="flex items-center gap-3">
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="complete">Complete</option>
            </select>
            <button
              onClick={handleStatusUpdate}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200"
            >
              Update Status
            </button>
            {statusMsg && (
              <span className={`text-sm ${statusMsg.includes('Failed') ? 'text-red-500' : 'text-green-600'}`}>
                {statusMsg}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
        >
          {deleting ? 'Deleting...' : 'Delete Campaign'}
        </button>
      </div>
    );
  }

  // ─── LIST VIEW ───
  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <button
          onClick={() => setView('create')}
          className="px-3 py-1 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200"
        >
          Create Campaign
        </button>
      </div>
      <p className="text-gray-500 mb-8 text-sm">AI-generated launch assets, saved and managed</p>

      {loading && <p className="text-sm text-gray-500">Loading campaigns...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!loading && !error && campaigns.length === 0 && (
        <p className="text-sm text-gray-500">No campaigns yet. Create your first one.</p>
      )}

      {!loading && !error && campaigns.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {toTitleCase(c.campaign_type)}
                </span>
                <StatusBadge status={c.status} />
              </div>
              <p className="text-sm text-gray-600 mb-3 flex-1">
                {c.content && c.content.length > 100 ? c.content.slice(0, 100) + '…' : c.content}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString()}
                </p>
                <button
                  onClick={() => openDetail(c)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
