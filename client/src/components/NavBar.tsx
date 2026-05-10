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
    `text-sm ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`;

  return (
    <nav className="flex items-center justify-between px-4 py-3 bg-white border-b">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg">LaunchForge</span>
        <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
        <NavLink to="/projects" className={linkClass}>Projects</NavLink>
        <NavLink to="/account" className={linkClass}>Account</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}
      </div>
      <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700">Logout</button>
    </nav>
  );
}
