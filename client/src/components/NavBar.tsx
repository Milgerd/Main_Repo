import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import axios from '../lib/axios';
import { TOKEN_KEY } from '../lib/axios';
import useAuth from '../hooks/useAuth';

interface Notification {
  id: number;
  type: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NavBar() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate('/login');
  };

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  async function fetchUnreadCount() {
    try {
      const res = await axios.get('/notifications/unread');
      setUnreadCount(res.data.count);
    } catch {
      // silently fail
    }
  }

  async function fetchNotifications() {
    try {
      const res = await axios.get('/notifications');
      setNotifications(res.data);
    } catch {
      // silently fail
    }
  }

  async function handleBellClick() {
    const next = !open;
    setOpen(next);
    if (next) {
      await fetchNotifications();
      await axios.put('/notifications/read-all');
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 bg-white border-b shadow-[0_2px_6px_rgba(0,0,0,0.08)]">
      <div className="flex items-center gap-6">
        <NavLink to="/dashboard" className="text-xl font-bold text-indigo-600 tracking-tight">
          LaunchForge
        </NavLink>
        <div className="flex items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>
          <NavLink to="/projects" className={linkClass}>Projects</NavLink>
          <NavLink to="/analytics" className={linkClass}>Analytics</NavLink>
          <NavLink to="/ai" className={linkClass}>AI Generate</NavLink>
          <NavLink to="/generate-plan" className={linkClass}>Launch Plan</NavLink>
          <NavLink to="/campaigns" className={linkClass}>Campaigns</NavLink>
          <NavLink to="/feedback" className={linkClass}>Feedback</NavLink>
          <NavLink to="/github" className={linkClass}>GitHub</NavLink>
          <NavLink to="/account" className={linkClass}>Account</NavLink>
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-purple-100 text-purple-700' : 'text-purple-600 hover:bg-purple-50 hover:text-purple-700'}`
            }>Admin</NavLink>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleBellClick}
            className="relative text-gray-600 hover:text-indigo-600 focus:outline-none"
            aria-label="Notifications"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
              <div className="px-4 py-3 border-b font-semibold text-sm text-gray-700">
                Notifications
              </div>
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">No notifications yet</div>
              ) : (
                <ul className="max-h-80 overflow-y-auto divide-y">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={`px-4 py-3 text-sm hover:bg-gray-50 ${!n.read ? 'bg-indigo-50' : ''}`}
                    >
                      <p className={`${!n.read ? 'font-semibold text-gray-800' : 'text-gray-600'}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        {user?.email && <span className="text-xs text-gray-400">{user.email}</span>}
        <button onClick={handleLogout} className="px-4 py-1.5 rounded-lg text-sm font-medium border border-gray-300 text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
          Logout
        </button>
      </div>
    </nav>
  );
}
