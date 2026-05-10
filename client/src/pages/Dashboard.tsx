import { useNavigate } from 'react-router-dom';
import { TOKEN_KEY } from '../lib/axios';
import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate('/login');
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="px-3 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50"
        >
          Logout
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : user ? (
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Email:</span> {user.email}</p>
          <p><span className="font-medium">Role:</span> {user.role}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Unable to load user info.</p>
      )}
    </div>
  );
}
