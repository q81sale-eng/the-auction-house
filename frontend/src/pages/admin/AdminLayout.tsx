import React, { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n/useLanguage';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();
  const { tr, lang } = useT();
  const t = tr.admin;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRtl = lang === 'ar';

  if (!isAuthenticated || !user?.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const navItems = [
    { path: '/admin',          label: t.dashboard, exact: true },
    { path: '/admin/auctions', label: t.auctions },
    { path: '/admin/users',    label: t.users },
    { path: '/admin/bids',     label: t.bids },
  ];

  const sidebarStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    bottom: 0,
    [isRtl ? 'right' : 'left']: 0,
    transform: sidebarOpen ? 'translateX(0)' : isRtl ? 'translateX(100%)' : 'translateX(-100%)',
    transition: 'transform 200ms ease',
    zIndex: 30,
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="lg:hidden w-56 bg-obsidian-900 border-obsidian-800 flex flex-col"
        style={{ ...sidebarStyle, borderInlineEndWidth: '1px', borderColor: 'rgb(39 39 42 / 1)' }}
      >
        <SidebarNav navItems={navItems} location={location} t={t} onNavClick={() => setSidebarOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-shrink-0 bg-obsidian-900 border-e border-obsidian-800 flex-col">
        <SidebarNav navItems={navItems} location={location} t={t} onNavClick={() => {}} />
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-obsidian-900 border-b border-obsidian-800">
          <Link to="/" className="font-serif text-gold-500 text-sm tracking-widest uppercase">
            The Auction House
          </Link>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-obsidian-400 hover:text-white p-1"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

interface NavItem { path: string; label: string; exact?: boolean; }

const SidebarNav: React.FC<{
  navItems: NavItem[];
  location: { pathname: string };
  t: any;
  onNavClick: () => void;
}> = ({ navItems, location, t, onNavClick }) => (
  <>
    <div className="p-6 border-b border-obsidian-800">
      <Link to="/" className="font-serif text-gold-500 text-sm tracking-widest uppercase block">
        The Auction House
      </Link>
      <p className="text-obsidian-500 text-xs mt-1">{t.panel}</p>
    </div>
    <nav className="flex-1 p-4 space-y-1">
      {navItems.map(item => {
        const isActive = item.exact
          ? location.pathname === item.path
          : location.pathname.startsWith(item.path);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={onNavClick}
            className={`block px-4 py-2.5 text-sm transition-colors ${
              isActive
                ? 'bg-gold-500/10 text-gold-500 border-s-2 border-gold-500'
                : 'text-obsidian-400 hover:text-white hover:bg-obsidian-800'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
    <div className="p-4 border-t border-obsidian-800">
      <Link to="/" className="text-obsidian-500 hover:text-white text-xs transition-colors">
        {t.backToSite}
      </Link>
    </div>
  </>
);
