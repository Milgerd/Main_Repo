import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import api from '../lib/axios';

export default function Analytics() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => api.get('/analytics').then(r => r.data),
  });

  if (isLoading) return <div className="flex justify-center pt-24"><p className="text-sm text-gray-500">Loading analytics...</p></div>;
  if (error) return <div className="flex justify-center pt-24"><p className="text-sm text-red-500">Failed to load analytics.</p></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 pt-12 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Tasks by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.taskStats}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Projects by Status</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.projectStats}>
              <XAxis dataKey="status" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Activity (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data.activityTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Top Users by Activity</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">User</th>
              <th className="pb-2 text-right">Events</th>
            </tr>
          </thead>
          <tbody>
            {data.userEngagement.map((u: { email: string; activity_count: number }) => (
              <tr key={u.email} className="border-b last:border-0">
                <td className="py-2 text-gray-700">{u.email}</td>
                <td className="py-2 text-right font-medium text-indigo-600">{u.activity_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-4 text-right">Source: {data.source}</p>
    </div>
  );
}