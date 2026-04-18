import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from './AdminLayout';
import { getAdminUsers, updateUser, deleteUser } from '../../api/admin';
import { useT } from '../../i18n/useLanguage';
import { formatDateTime } from '../../utils/format';

export const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const { tr } = useT();
  const t = tr.admin;
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ is_admin: boolean }>({ is_admin: false });

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: () => getAdminUsers({ page }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, any> }) => updateUser(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }); setEditId(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">{t.users}</h1>
        <p className="text-obsidian-400 text-sm">{data?.total ?? 0} {t.registered}</p>
      </div>

      <div className="bg-obsidian-900 border border-obsidian-800 overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-obsidian-800 border-b border-obsidian-700">
            <tr>
              {[t.table.user, t.table.phone, t.table.country, t.table.joined, t.table.isAdmin, t.table.actions].map(h => (
                <th key={h} className="text-left px-4 py-3 text-obsidian-400 text-xs uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 bg-obsidian-800 animate-pulse" />
                    </td>
                  </tr>
                ))
              : data?.data?.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-obsidian-500">{t.table.noData}</td>
                </tr>
              )
              : data?.data?.map((u: any) => (
                <tr key={u.id} className="hover:bg-obsidian-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gold-500/20 flex items-center justify-center text-gold-500 text-xs font-bold flex-shrink-0">
                        {(u.name || u.email || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate max-w-[160px]">{u.name || '—'}</p>
                        <p className="text-obsidian-500 text-xs truncate max-w-[160px]">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-obsidian-300 text-xs">{u.phone || '—'}</td>
                  <td className="px-4 py-3 text-obsidian-300 text-xs">{u.country || '—'}</td>
                  <td className="px-4 py-3 text-obsidian-500 text-xs whitespace-nowrap">
                    {u.created_at ? formatDateTime(u.created_at) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editForm.is_admin}
                          onChange={e => setEditForm({ is_admin: e.target.checked })}
                          className="accent-gold-500"
                        />
                        <span className="text-xs text-obsidian-300">{t.table.isAdmin}</span>
                      </label>
                    ) : (
                      u.is_admin
                        ? <span className="text-gold-500 text-xs">{t.table.isAdmin}</span>
                        : <span className="text-obsidian-600 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editId === u.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: u.id, payload: editForm })}
                          className="text-gold-500 text-xs hover:text-gold-400">
                          {t.actions.saveChanges}
                        </button>
                        <button onClick={() => setEditId(null)} className="text-obsidian-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => { setEditId(u.id); setEditForm({ is_admin: !!u.is_admin }); }}
                          className="text-obsidian-400 hover:text-gold-500 text-xs transition-colors">
                          {t.actions.edit}
                        </button>
                        <button
                          onClick={() => { if (window.confirm(t.actions.confirmDeleteUser)) deleteMutation.mutate(u.id); }}
                          className="text-obsidian-400 hover:text-red-400 text-xs transition-colors">
                          {t.actions.delete}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
        {(data?.last_page ?? 0) > 1 && (
          <div className="flex gap-2 p-4">
            {Array.from({ length: data!.last_page }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 text-xs transition-colors ${p === page ? 'bg-gold-500 text-obsidian-950' : 'border border-obsidian-700 text-obsidian-400 hover:border-gold-500'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
