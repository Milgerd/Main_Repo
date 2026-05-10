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
    <div className="p-4 max-w-sm mx-auto">
      <h1 className="text-2xl font-bold mb-6">Account</h1>

      <h2 className="text-sm font-semibold mb-3">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="current-pw" className="block text-sm font-medium mb-1">Current Password</label>
          <input
            id="current-pw"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}
