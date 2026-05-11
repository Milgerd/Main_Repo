import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

interface AdminUser {
  id: number;
  email: string;
  role: string;
}

interface AuditEntry {
  admin_id: number;
  target_user_id: number;
  old_role: string;
  new_role: string;
  created_at: string;
}

interface ActiveAdmin {
  admin_id: number;
  email: string;
  total_changes: number;
}

export default function Admin() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [roleError, setRoleError] = useState('');

  const { data: users, isLoading, error } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return data;
    },
  });

  const roleUpdate = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      setUpdatingId(userId);
      setRoleError('');
      const { data } = await api.put(`/admin/users/${userId}/role`, { role });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'audit'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] });
      setUpdatingId(null);
    },
    onError: (err: unknown) => {
      if (err && typeof err === 'object' && 'response' in err) {
        const res = (err as { response: { data?: { message?: string; error?: string } } }).response;
        setRoleError(res.data?.message || res.data?.error || 'Failed to update role');
      } else {
        setRoleError('Could not connect to server');
      }
      setUpdatingId(null);
    },
  });

  const { data: audit, isLoading: auditLoading, error: auditError } = useQuery<AuditEntry[]>({
    queryKey: ['admin', 'audit'],
    queryFn: async () => {
      const { data } = await api.get('/admin/audit/roles');
      return data;
    },
  });

  const { data: activeAdmins, isLoading: analyticsLoading, error: analyticsError } = useQuery<ActiveAdmin[]>({
    queryKey: ['admin', 'analytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/analytics/most-active-admins');
      return data;
    },
  });

  const roleBadge = (role: string) => (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
      {role}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Admin Panel</h1>

      {roleError && <p className="text-sm text-red-600">{roleError}</p>}

      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Users {users && <span className="text-sm font-normal text-gray-400">({users.length})</span>}</h2>
        </div>
        {isLoading && <p className="text-sm text-gray-500 px-6 py-4">Loading users...</p>}
        {error && <p className="text-sm text-red-600 px-6 py-4">Failed to load users.</p>}
        {users && users.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-3 text-gray-400">{u.id}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{u.email}</td>
                  <td className="px-6 py-3">{roleBadge(u.role)}</td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      disabled={updatingId === u.id && roleUpdate.isPending}
                      onChange={(e) => roleUpdate.mutate({ userId: u.id, role: e.target.value })}
                      className="text-xs border border-gray-300 rounded-lg px-2 py-1 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Role Change Audit {audit && <span className="text-sm font-normal text-gray-400">({audit.length})</span>}</h2>
        </div>
        {auditLoading && <p className="text-sm text-gray-500 px-6 py-4">Loading audit log...</p>}
        {auditError && <p className="text-sm text-red-600 px-6 py-4">Failed to load audit log.</p>}
        {audit && audit.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Admin ID</th>
                <th className="px-6 py-3 font-medium">Target User</th>
                <th className="px-6 py-3 font-medium">Change</th>
                <th className="px-6 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {audit.map((entry, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-3 text-gray-400">{entry.admin_id}</td>
                  <td className="px-6 py-3 text-gray-400">{entry.target_user_id}</td>
                  <td className="px-6 py-3">
                    {roleBadge(entry.old_role)}
                    <span className="mx-2 text-gray-400">→</span>
                    {roleBadge(entry.new_role)}
                  </td>
                  <td className="px-6 py-3 text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-all duration-200">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Most Active Admins {activeAdmins && <span className="text-sm font-normal text-gray-400">({activeAdmins.length})</span>}</h2>
        </div>
        {analyticsLoading && <p className="text-sm text-gray-500 px-6 py-4">Loading analytics...</p>}
        {analyticsError && <p className="text-sm text-red-600 px-6 py-4">Failed to load analytics.</p>}
        {activeAdmins && activeAdmins.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-6 py-3 font-medium">Admin ID</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Total Changes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {activeAdmins.map((a) => (
                <tr key={a.admin_id} className="hover:bg-gray-50 transition-all duration-200">
                  <td className="px-6 py-3 text-gray-400">{a.admin_id}</td>
                  <td className="px-6 py-3 font-medium text-gray-900">{a.email}</td>
                  <td className="px-6 py-3">
                    <span className="inline-block bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full text-xs font-medium">{a.total_changes}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
