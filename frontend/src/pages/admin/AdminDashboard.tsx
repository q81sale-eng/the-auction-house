import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { getAdminDashboard } from '../../api/admin';
import { useT } from '../../i18n/useLanguage';
import { formatDateTime } from '../../utils/format';

const STATUS_COLORS: Record<string, string> = {
  live:      'bg-red-500/20 text-red-400',
  upcoming:  'bg-blue-500/20 text-blue-400',
  ended:     'bg-obsidian-800 text-obsidian-400',
  sold:      'bg-green-500/20 text-green-400',
  cancelled: 'bg-orange-500/20 text-orange-400',
};

export const AdminDashboard: React.FC = () => {
  const { tr } = useT();
  const t = tr.admin;
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard });

  const statCards = data ? [
    { label: t.stats.liveAuctions,     value: data.stats.live_auctions,     link: '/admin/auctions' },
    { label: t.stats.upcomingAuctions, value: data.stats.upcoming_auctions, link: '/admin/auctions' },
    { label: t.stats.totalUsers,       value: data.stats.total_users,       link: '/admin/users' },
    { label: t.stats.totalBids,        value: data.stats.total_bids,        link: '/admin/bids' },
  ] : [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">{t.dashboard}</h1>
        <p className="text-obsidian-400 text-sm">{t.overview}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-obsidian-900 border border-obsidian-800 p-6 h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map(({ label, value, link }) => (
            <Link key={label} to={link}
              className="bg-obsidian-900 border border-obsidian-800 p-6 hover:border-gold-500/30 transition-colors block">
              <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-2">{label}</p>
              <p className="text-white text-2xl font-semibold">{value}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Auctions */}
        <div className="bg-obsidian-900 border border-obsidian-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-obsidian-800">
            <h2 className="font-serif text-white text-lg">{t.table.recentAuctions}</h2>
            <Link to="/admin/auctions" className="text-gold-500 text-xs hover:text-gold-400">
              {t.table.viewAll}
            </Link>
          </div>
          <div className="divide-y divide-obsidian-800">
            {data?.recent_auctions?.length === 0 && (
              <p className="px-5 py-4 text-obsidian-500 text-sm">{t.table.noData}</p>
            )}
            {data?.recent_auctions?.map((a: any) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-white text-sm truncate">{a.title}</p>
                  <p className="text-obsidian-500 text-xs">{a.brand} · {formatDateTime(a.created_at)}</p>
                </div>
                <span className={`text-xs uppercase tracking-wider px-2 py-1 flex-shrink-0 ${STATUS_COLORS[a.status] || 'bg-obsidian-800 text-obsidian-400'}`}>
                  {t.status[a.status as keyof typeof t.status] ?? a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-obsidian-900 border border-obsidian-800 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-obsidian-800">
            <h2 className="font-serif text-white text-lg">{t.table.recentUsers}</h2>
            <Link to="/admin/users" className="text-gold-500 text-xs hover:text-gold-400">
              {t.table.viewAll}
            </Link>
          </div>
          <div className="divide-y divide-obsidian-800">
            {data?.recent_users?.length === 0 && (
              <p className="px-5 py-4 text-obsidian-500 text-sm">{t.table.noData}</p>
            )}
            {data?.recent_users?.map((u: any) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-gold-500/20 flex items-center justify-center text-gold-500 text-sm font-semibold flex-shrink-0">
                    {(u.name || u.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{u.name || '—'}</p>
                    <p className="text-obsidian-500 text-xs truncate">{u.email}</p>
                  </div>
                </div>
                {u.is_admin && (
                  <span className="text-gold-500 text-xs flex-shrink-0">{t.table.isAdmin}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
