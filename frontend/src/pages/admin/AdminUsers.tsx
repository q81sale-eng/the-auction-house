import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminUsers, updateUser, deleteUser } from '../../api/admin';
import { formatCurrency, formatDateTime } from '../../utils/format';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data, isLoading } = useQuery({ queryKey: ['admin', 'users', page], queryFn: () => getAdminUsers({ page }) });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => updateUser(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">Users</h1>
        <p className="text-obsidian-400 text-sm">{data?.total || 0} registered</p>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {['User', 'Country', 'Balance', 'Bids', 'Auctions', 'Flags', 'Joined', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4 py-4"><div className="h-4 bg-obsidian-800 rounded animate-pulse" /></td></tr>
              ))
            ) : data?.data?.map((u: any) => (
              <tr key={u.id} className="hover:bg-obsidian-900/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gold-500/20 flex items-center justify-center text-gold-500 text-xs font-bold flex-shrink-0">
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-white text-xs font-medium">{u.name}</p>
                      <p className="text-obsidian-500 text-xs">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">{u.country || '—'}</td>
                <td className="px-4 py-3 text-white text-xs">{formatCurrency(parseFloat(u.deposit_balance || 0))}</td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">{u.bids_count}</td>
                <td className="px-4 py-3 text-obsidian-300 text-xs">{u.auctions_count}</td>
                <td className="px-4 py-3">
                  {editId === u.id ? (
                    <div className="flex flex-col gap-1">
                      <label className="flex items-center gap-1 text-xs text-obsidian-300 cursor-pointer">
                        <input type="checkbox" defaultChecked={u.is_admin}
                          onChange={e => setEditForm(p => ({ ...p, is_admin: e.target.checked }))} className="accent-gold-500" />
                        Admin
                      </label>
                      <label className="flex items-center gap-1 text-xs text-obsidian-300 cursor-pointer">
                        <input type="checkbox" defaultChecked={u.is_verified}
                          onChange={e => setEditForm(p => ({ ...p, is_verified: e.target.checked }))} className="accent-gold-500" />
                        Verified
                      </label>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      {u.is_admin && <span className="text-gold-500 text-xs">Admin</span>}
                      {u.is_verified && <span className="text-green-400 text-xs">✓ Ver.</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-obsidian-500 text-xs">{formatDateTime(u.created_at)}</td>
                <td className="px-4 py-3">
                  {editId === u.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => updateMutation.mutate({ id: u.id, data: editForm })} className="text-gold-500 text-xs">Save</button>
                      <button onClick={() => setEditId(null)} className="text-obsidian-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditId(u.id); setEditForm({ is_admin: u.is_admin, is_verified: u.is_verified }); }}
                        className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors">Edit</button>
                      <button onClick={() => { if (window.confirm('Delete user?')) deleteMutation.mutate(u.id); }}
                        className="text-obsidian-400 hover:text-red-400 text-xs transition-colors">Del</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data?.last_page > 1 && (
          <div className="flex gap-2 p-4">
            {Array.from({ length: data.last_page }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400 hover:border-gold-500'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
