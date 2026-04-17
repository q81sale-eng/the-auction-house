import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/admin', label: 'Dashboard', exact: true },
  { path: '/admin/auctions', label: 'Auctions' },
  { path: '/admin/watches', label: 'Watches' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/valuations', label: 'Valuations' },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-obsidian-950 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-obsidian-900 border-r border-obsidian-800 flex flex-col">
        <div className="p-6 border-b border-obsidian-800">
          <Link to="/" className="font-serif text-gold-500 text-sm tracking-widest uppercase block">The Auction House</Link>
          <p className="text-obsidian-500 text-xs mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => {
            const isActive = item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path}
                className={`block px-4 py-2.5 text-sm transition-colors rounded-sm ${isActive ? 'bg-gold-500/10 text-gold-500 border-l-2 border-gold-500' : 'text-obsidian-400 hover:text-white hover:bg-obsidian-800'}`}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-obsidian-800">
          <Link to="/" className="text-obsidian-500 hover:text-white text-xs transition-colors">← Back to Site</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
};
