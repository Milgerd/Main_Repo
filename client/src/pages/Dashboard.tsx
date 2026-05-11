import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  return (
    <div className="flex justify-center pt-24 px-4">
      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : user ? (
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200 p-8 text-center">
            <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
            <p className="text-gray-500 mb-6">{user.email}</p>

            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-8 ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
              {user.role}
            </span>

            <div className="flex flex-col gap-3">
              <Link to="/projects" className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all duration-200">
                <p className="font-medium text-gray-900">Projects</p>
                <p className="text-xs text-gray-500 mt-1">Manage your work</p>
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all duration-200">
                  <p className="font-medium text-gray-900">Admin</p>
                  <p className="text-xs text-gray-500 mt-1">Users &amp; audit log</p>
                </Link>
              )}
              <Link to="/account" className="block rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-all duration-200">
                <p className="font-medium text-gray-900">Account</p>
                <p className="text-xs text-gray-500 mt-1">Password &amp; settings</p>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Unable to load user info.</p>
      )}
    </div>
  );
}
