import useAuth from '../hooks/useAuth';

export default function Dashboard() {
  const { user, isLoading } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

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
