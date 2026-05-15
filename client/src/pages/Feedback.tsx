import { useState, useEffect } from 'react';
import api from '../lib/axios';
import useAuth from '../hooks/useAuth';

interface FeedbackEntry {
  id: number;
  workspace_id: number;
  submitted_by: number;
  submitted_by_email: string;
  feedback_text: string;
  rating: number;
  created_at: string;
}

interface FeedbackSummary {
  count: number;
  average_rating: number | null;
}

function Stars({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <span className="text-amber-400 tracking-wide">
      {Array.from({ length: max }, (_, i) => (i < rating ? '★' : '☆')).join('')}
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
          className={`text-2xl transition-colors ${n <= (hover || value) ? 'text-amber-400' : 'text-gray-300'}`}
        >
          {'★'}
        </button>
      ))}
    </div>
  );
}

export default function Feedback() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [summary, setSummary] = useState<FeedbackSummary>({ count: 0, average_rating: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchEntries = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/feedback/1');
      setEntries(data);
    } catch {
      setError('Failed to load feedback.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const { data } = await api.get('/feedback/1/summary');
      setSummary(data);
    } catch {
      /* summary is non-critical */
    }
  };

  useEffect(() => {
    fetchEntries();
    fetchSummary();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Please select a rating.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await api.post('/feedback', {
        workspace_id: 1,
        feedback_text: feedbackText,
        rating,
      });
      setRating(0);
      setFeedbackText('');
      setSubmitSuccess('Feedback submitted!');
      setTimeout(() => setSubmitSuccess(''), 3000);
      fetchEntries();
      fetchSummary();
    } catch {
      setSubmitError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 pt-12 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Feedback</h1>
      <p className="text-gray-500 mb-8 text-sm">Workspace feedback and satisfaction ratings</p>

      {/* ─── SUMMARY CARD ─── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-5 mb-8 flex items-center gap-6">
        {summary.count === 0 ? (
          <p className="text-sm text-gray-500">No feedback yet</p>
        ) : (
          <>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">
                {summary.average_rating !== null ? summary.average_rating.toFixed(1) : '—'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Avg Rating</p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900">{summary.count}</p>
              <p className="text-xs text-gray-400 mt-1">{summary.count === 1 ? 'Submission' : 'Submissions'}</p>
            </div>
          </>
        )}
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* ─── SUBMIT FORM ─── */}
        {user?.role !== 'viewer' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Submit Feedback</h2>
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <StarPicker value={rating} onChange={setRating} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Share your thoughts about this workspace..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              {submitSuccess && <p className="text-sm text-green-600">{submitSuccess}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          </div>
        )}

        {/* ─── FEEDBACK LIST ─── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">All Feedback</h2>

          {loading && <p className="text-sm text-gray-500">Loading feedback...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}

          {!loading && !error && entries.length === 0 && (
            <p className="text-sm text-gray-500">No feedback submitted yet</p>
          )}

          {!loading && !error && entries.length > 0 && (
            <ul className="space-y-3">
              {entries.map((f) => (
                <li
                  key={f.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <Stars rating={f.rating} />
                    <span className="text-xs text-gray-400">
                      {new Date(f.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{f.submitted_by_email}</p>
                  {f.feedback_text && (
                    <p className="text-sm text-gray-700">{f.feedback_text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
