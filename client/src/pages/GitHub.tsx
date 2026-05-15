import { useState } from 'react';
import axios from '../lib/axios';
import useAuth from '../hooks/useAuth';

interface RepoMetadata {
  name: string;
  description: string;
  language: string;
  stars: number;
  openIssues: number;
  lastPush: string;
  license: string | null;
  hasReadme: boolean;
  defaultBranch: string;
}

interface AnalysisResult {
  metadata: RepoMetadata;
  report: string;
}

export default function GitHub() {
  const { user } = useAuth();
  const [connectUrl, setConnectUrl] = useState('');
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [connectStatus, setConnectStatus] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [error, setError] = useState('');

  const workspaceId = 1; // Test workspace

  async function handleConnect() {
    setConnectStatus('');
    setError('');
    setConnectLoading(true);
    try {
      const res = await axios.post('/github/connect', {
        workspaceId,
        githubUrl: connectUrl,
      });
      setConnectStatus(res.data.message);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect repository');
    } finally {
      setConnectLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalysis(null);
    setError('');
    setAnalyzeLoading(true);
    try {
      const res = await axios.post('/github/analyze', {
        githubUrl: analyzeUrl,
      });
      setAnalysis(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to analyze repository');
    } finally {
      setAnalyzeLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-8">GitHub Integration</h1>

      {error && (
        <div className="mb-6 p-3 bg-red-100 text-red-700 rounded">{error}</div>
      )}

      {/* Connect Repo Section */}
      {user?.role !== 'viewer' && (
        <section className="mb-10 p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Connect Repository</h2>
          <p className="text-sm text-gray-500 mb-4">
            Save a GitHub repo URL to your workspace. Must be a public repository.
          </p>
          <input
            type="text"
            placeholder="https://github.com/owner/repo"
            value={connectUrl}
            onChange={(e) => setConnectUrl(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3 text-sm"
          />
          <button
            onClick={handleConnect}
            disabled={connectLoading || !connectUrl.trim()}
            className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            {connectLoading ? 'Connecting...' : 'Connect Repository'}
          </button>
          {connectStatus && (
            <p className="mt-3 text-green-600 text-sm">{connectStatus}</p>
          )}
        </section>
      )}

      {/* Analyze Repo Section */}
      <section className="p-6 border rounded-lg bg-white shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Deployment Readiness Analysis</h2>
        <p className="text-sm text-gray-500 mb-4">
          Fetch public repo metadata and generate an AI-powered deployment readiness report.
        </p>
        {user?.role !== 'viewer' && (
          <>
            <input
              type="text"
              placeholder="https://github.com/owner/repo"
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3 text-sm"
            />
            <button
              onClick={handleAnalyze}
              disabled={analyzeLoading || !analyzeUrl.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              {analyzeLoading ? 'Analyzing...' : 'Analyze Repository'}
            </button>
          </>
        )}

        {/* Metadata Card */}
        {analysis && (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Repository Overview</h3>
            <div className="grid grid-cols-2 gap-3 text-sm mb-6">
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500 block">Language</span>
                <span className="font-medium">{analysis.metadata.language}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500 block">Stars</span>
                <span className="font-medium">{analysis.metadata.stars}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500 block">Open Issues</span>
                <span className="font-medium">{analysis.metadata.openIssues}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500 block">Last Push</span>
                <span className="font-medium">
                  {new Date(analysis.metadata.lastPush).toLocaleDateString()}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500 block">License</span>
                <span className="font-medium">{analysis.metadata.license || 'None'}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <span className="text-gray-500 block">README</span>
                <span className="font-medium">{analysis.metadata.hasReadme ? '✅ Present' : '❌ Missing'}</span>
              </div>
            </div>

            {/* AI Report */}
            <h3 className="font-semibold mb-3">AI Readiness Report</h3>
            <div className="bg-gray-50 rounded p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {analysis.report}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
