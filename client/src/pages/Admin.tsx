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

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Admin — Users</h1>

      {roleError && <p className="text-sm text-red-600 mb-3">{roleError}</p>}

      {isLoading && <p className="text-sm text-gray-500">Loading users...</p>}

      {error && <p className="text-sm text-red-600">Failed to load users.</p>}

      {!isLoading && !error && users?.length === 0 && (
        <p className="text-sm text-gray-500">No users found.</p>
      )}

      {users && users.length > 0 && (
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-3 py-2 border-b">ID</th>
              <th className="px-3 py-2 border-b">Email</th>
              <th className="px-3 py-2 border-b">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 border-b text-gray-500">{u.id}</td>
                <td className="px-3 py-2 border-b">{u.email}</td>
                <td className="px-3 py-2 border-b">
                  <select
                    value={u.role}
                    disabled={updatingId === u.id && roleUpdate.isPending}
                    onChange={(e) => roleUpdate.mutate({ userId: u.id, role: e.target.value })}
                    className="text-xs border rounded px-2 py-0.5 disabled:opacity-50"
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
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Role Change Audit</h2>
        {auditLoading && <p className="text-sm text-gray-500">Loading audit log...</p>}
        {auditError && <p className="text-sm text-red-600">Failed to load audit log.</p>}
        {!auditLoading && !auditError && audit?.length === 0 && (
          <p className="text-sm text-gray-500">No role changes recorded.</p>
        )}
        {audit && audit.length > 0 && (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 border-b">Admin ID</th>
                <th className="px-3 py-2 border-b">Target User ID</th>
                <th className="px-3 py-2 border-b">Change</th>
                <th className="px-3 py-2 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((entry, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b text-gray-500">{entry.admin_id}</td>
                  <td className="px-3 py-2 border-b text-gray-500">{entry.target_user_id}</td>
                  <td className="px-3 py-2 border-b">
                    <span className="text-xs">{entry.old_role} → {entry.new_role}</span>
                  </td>
                  <td className="px-3 py-2 border-b text-xs text-gray-400">{new Date(entry.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Most Active Admins</h2>
        {analyticsLoading && <p className="text-sm text-gray-500">Loading analytics...</p>}
        {analyticsError && <p className="text-sm text-red-600">Failed to load analytics.</p>}
        {!analyticsLoading && !analyticsError && activeAdmins?.length === 0 && (
          <p className="text-sm text-gray-500">No admin activity recorded.</p>
        )}
        {activeAdmins && activeAdmins.length > 0 && (
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2 border-b">Admin ID</th>
                <th className="px-3 py-2 border-b">Email</th>
                <th className="px-3 py-2 border-b">Total Changes</th>
              </tr>
            </thead>
            <tbody>
              {activeAdmins.map((a) => (
                <tr key={a.admin_id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border-b text-gray-500">{a.admin_id}</td>
                  <td className="px-3 py-2 border-b">{a.email}</td>
                  <td className="px-3 py-2 border-b">{a.total_changes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
