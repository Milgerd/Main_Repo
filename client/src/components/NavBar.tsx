import { NavLink, useNavigate } from 'react-router-dom';
import { TOKEN_KEY } from '../lib/axios';
import useAuth from '../hooks/useAuth';

export default function NavBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm font-medium transition ${isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b shadow-sm">
      <div className="flex items-center gap-6">
        <NavLink to="/dashboard" className="text-xl font-bold text-indigo-600 tracking-tight">
          LaunchForge
        </NavLink>
        <div className="flex items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/analytics" className={linkClass}>Analytics</NavLink>
          <NavLink to="/ai" className={linkClass}>AI Generate</NavLink>
          <NavLink to="/account" className={linkClass}>Account</NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) =>
              `px-3 py-1.5 rounded-md text-sm font-medium transition ${isActive ? 'bg-purple-50 text-purple-700' : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'}`
            }>Admin</NavLink>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user?.email && <span className="text-xs text-gray-400">{user.email}</span>}
        <button onClick={handleLogout} className="px-4 py-1.5 rounded-md text-sm font-medium border border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition">
          Logout
        </button>
      </div>
    </nav>
  );
}
