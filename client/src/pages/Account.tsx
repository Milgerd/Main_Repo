import { useState, type FormEvent } from 'react';
import api from '../lib/axios';

export default function Account() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/change-password', { currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setError(res.data?.error || 'Failed to change password');
      } else {
        setError('Could not connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center pt-24 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-2xl font-bold text-center mb-1">Account</h1>
          <p className="text-gray-500 text-center mb-8">Update your password</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="current-pw" className="block text-sm font-medium mb-1">Current Password</label>
              <input
                id="current-pw"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label htmlFor="new-pw" className="block text-sm font-medium mb-1">New Password</label>
              <input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-green-600">{success}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
