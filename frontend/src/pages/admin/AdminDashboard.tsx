import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminLayout } from './AdminLayout';
import { getAdminDashboard } from '../../api/admin';
import { formatCurrency, formatDateTime } from '../../utils/format';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard });

  const statCards = data ? [
    { label: 'Total Users', value: data.stats.total_users, link: '/admin/users' },
    { label: 'Live Auctions', value: data.stats.live_auctions, link: '/admin/auctions' },
    { label: 'Total Auctions', value: data.stats.total_auctions, link: '/admin/auctions' },
    { label: 'Marketplace Listings', value: data.stats.total_listings, link: '/admin/watches' },
    { label: 'Total Bids', value: data.stats.total_bids, link: '/admin/auctions' },
    { label: 'Total Revenue', value: formatCurrency(data.stats.total_revenue), link: '/admin/auctions' },
  ] : [];

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-white mb-1">Dashboard</h1>
        <p className="text-obsidian-400 text-sm">Platform overview</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-6 h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
          {statCards.map(({ label, value, link }) => (
            <Link key={label} to={link} className="card p-6 hover:border-gold-500/30 transition-colors block">
              <p className="text-obsidian-400 text-xs uppercase tracking-wider mb-2">{label}</p>
              <p className="text-white text-2xl font-semibold">{value}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Auctions */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-obsidian-800">
            <h2 className="font-serif text-white text-lg">Recent Auctions</h2>
            <Link to="/admin/auctions" className="text-gold-500 text-xs hover:text-gold-400">View All →</Link>
          </div>
          <div className="divide-y divide-obsidian-800">
            {data?.recent_auctions?.map((a: any) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-white text-sm">{a.watch?.brand} {a.watch?.model}</p>
                  <p className="text-obsidian-500 text-xs">{a.seller?.name} · {formatDateTime(a.created_at)}</p>
                </div>
                <span className={`text-xs uppercase tracking-wider px-2 py-1 ${a.status === 'live' ? 'bg-red-500/20 text-red-400' : a.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' : 'bg-obsidian-800 text-obsidian-400'}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-obsidian-800">
            <h2 className="font-serif text-white text-lg">Recent Users</h2>
            <Link to="/admin/users" className="text-gold-500 text-xs hover:text-gold-400">View All →</Link>
          </div>
          <div className="divide-y divide-obsidian-800">
            {data?.recent_users?.map((u: any) => (
              <div key={u.id} className="px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gold-500/20 flex items-center justify-center text-gold-500 text-sm font-semibold">
                    {u.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white text-sm">{u.name}</p>
                    <p className="text-obsidian-500 text-xs">{u.email}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {u.is_admin && <span className="text-gold-500 text-xs">Admin</span>}
                  {u.is_verified && <span className="text-green-400 text-xs">✓</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
