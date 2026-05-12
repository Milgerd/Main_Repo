import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/axios';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/register', { email, password });
      setSuccess('Account created — redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { error?: string } } }).response;
        setError(res.data?.error || 'Registration failed');
      } else {
        setError('Could not connect to server');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative" style={{ backgroundImage: "url('/login-bg.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.35)' }} />
      <div className="flex items-center gap-16 max-w-5xl w-full relative z-10">
        <div className="hidden md:block flex-1" style={{ transform: 'rotate(-2deg)' }}>
          <div className="relative rounded-sm px-10 py-12" style={{ backgroundColor: '#fef9c3', boxShadow: '2px 4px 12px rgba(0,0,0,0.12)' }}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-4 rounded-sm" style={{ backgroundColor: '#d97706', opacity: 0.7 }} />
            <h2 className="font-bold mb-4" style={{ fontFamily: "'Caveat', cursive", color: '#92400e', fontSize: '32px' }}>Start here.</h2>
            <p className="leading-relaxed" style={{ fontFamily: "'Caveat', cursive", color: '#78350f', fontSize: '20px' }}>
              Create your account in seconds and let LaunchForge AI handle the heavy lifting — from planning to launch, we've got your back.
            </p>
          </div>
        </div>
        <div className="w-full max-w-sm shrink-0 p-6 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <button
            type="submit"
            disabled={loading || !!success}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all duration-200"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
      </div>
    </div>
  );
}
