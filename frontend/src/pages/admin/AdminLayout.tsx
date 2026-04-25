import React, { useState } from 'react';
import { Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout as logoutApi } from '../../api/auth';
import { useT } from '../../i18n/useLanguage';

// ── Icons ─────────────────────────────────────────────────────────────────────

const Ic = {
  dashboard: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="3" width="7" height="7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="14" width="7" height="7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="14" y="14" width="7" height="7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,

  auctions: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>,

  plus: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>,

  users: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 20H3v-1a6 6 0 0112 0v1zm0 0h4v-1a6 6 0 00-3-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0zm6 3a2 2 0 100-4 2 2 0 000 4z"/></svg>,

  bids: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,

  valuations: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,

  signOut: <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>,

  listings: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>,

  banners: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,

  catalog: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,

  watchReqs: <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>,

  globe: <svg className="w-[16px] h-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"/></svg>,

  menu: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>,

  x: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>,
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  sub?: boolean;  // indented sub-item style
}

interface SidebarProps {
  navItems: NavItem[];
  location: { pathname: string };
  user: any;
  t: any;
  tr: any;
  lang: string;
  onNavClick: () => void;
  onLogout: () => void;
  onToggleLang: () => void;
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

const Sidebar: React.FC<SidebarProps> = ({
  navItems, location, user, t, tr, lang, onNavClick, onLogout, onToggleLang,
}) => {
  const isActive = (item: NavItem) =>
    item.exact
      ? location.pathname === item.path
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');

  return (
    <div className="flex flex-col h-full select-none">
      {/* Brand header */}
      <div className="px-5 py-6 border-b border-white/5">
        <p className="text-obsidian-500 text-[10px] uppercase tracking-[0.2em] mb-1">{t.panel}</p>
        <p className="font-serif text-gold-500 text-base tracking-widest uppercase leading-none">
          The Auction House
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => {
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavClick}
              className={`
                flex items-center gap-3 px-3 py-2.5 text-[13px] font-medium tracking-wide
                transition-all duration-150 rounded-[2px] group
                ${item.sub ? 'ms-4 text-[12px]' : ''}
                ${active
                  ? 'bg-gold-500/10 text-gold-400 border-s-2 border-gold-500 ps-[10px]'
                  : item.sub
                    ? 'text-obsidian-500 hover:text-obsidian-300'
                    : 'text-obsidian-400 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <span className={`flex-shrink-0 transition-colors ${active ? 'text-gold-400' : item.sub ? 'text-obsidian-600 group-hover:text-obsidian-400' : 'text-obsidian-500 group-hover:text-obsidian-300'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User & controls */}
      <div className="border-t border-white/5 p-4 space-y-3">
        {/* User info */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 text-sm font-semibold flex-shrink-0">
            {(user?.name || user?.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium leading-tight truncate">{user?.name || '—'}</p>
            <p className="text-obsidian-500 text-[10px] truncate">{user?.email}</p>
          </div>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onToggleLang}
            className="flex items-center justify-center gap-1.5 border border-obsidian-700 hover:border-obsidian-600 text-obsidian-500 hover:text-obsidian-300 py-1.5 text-[11px] transition-colors"
          >
            {Ic.globe}
            {lang === 'en' ? 'عربي' : 'English'}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-1.5 border border-obsidian-700 hover:border-red-500/50 text-obsidian-500 hover:text-red-400 py-1.5 text-[11px] transition-colors"
          >
            {Ic.signOut}
            {tr.nav.signOut}
          </button>
        </div>

        {/* Back to public site */}
        <Link
          to="/"
          className="block text-center text-obsidian-600 hover:text-obsidian-400 text-[11px] transition-colors py-0.5"
        >
          {t.backToSite}
        </Link>
      </div>
    </div>
  );
};

// ── AdminLayout ───────────────────────────────────────────────────────────────

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const location = useLocation();
  const navigate  = useNavigate();
  const { tr, lang, toggle } = useT();
  const t = tr.admin;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isRtl = lang === 'ar';

  if (!isAuthenticated || !user?.is_admin) {
    return <Navigate to="/admin/login" replace />;
  }

  const handleLogout = async () => {
    try { await logoutApi(); } catch {}
    logoutStore();
    navigate('/admin/login');
  };

  const navItems: NavItem[] = [
    { path: '/admin',                    label: t.dashboard,             icon: Ic.dashboard,  exact: true },
    { path: '/admin/auctions',           label: t.auctions,              icon: Ic.auctions,   exact: true },
    { path: '/admin/auctions/new',       label: t.actions.createAuction, icon: Ic.plus,       sub: true },
    { path: '/admin/users',              label: t.users,                 icon: Ic.users },
    { path: '/admin/bids',               label: t.bids,                  icon: Ic.bids },
    { path: '/admin/valuation-requests', label: t.valuationRequests,     icon: Ic.valuations },
    { path: '/admin/watch-requests',     label: t.watchRequestsNav,      icon: Ic.watchReqs  },
    { path: '/admin/listings',           label: t.listings ?? 'السوق',         icon: Ic.listings },
    { path: '/admin/banners',            label: t.banners  ?? 'البنرات',       icon: Ic.banners  },
    { path: '/admin/catalog',            label: 'أسعار الوكيل',                 icon: Ic.catalog  },
    { path: '/admin/catalog/import',    label: 'استيراد Excel',                icon: Ic.plus,    sub: true },
  ];

  const mobileSidebarStyle: React.CSSProperties = {
    position: 'fixed', top: 0, bottom: 0,
    [isRtl ? 'right' : 'left']: 0,
    width: '260px',
    transform: sidebarOpen
      ? 'translateX(0)'
      : isRtl ? 'translateX(100%)' : 'translateX(-100%)',
    transition: 'transform 220ms cubic-bezier(.4,0,.2,1)',
    zIndex: 50,
  };

  const sidebarProps: SidebarProps = {
    navItems, location, user, t, tr, lang,
    onNavClick:    () => setSidebarOpen(false),
    onLogout:      handleLogout,
    onToggleLang:  toggle,
  };

  return (
    <div className="min-h-screen bg-[#0c0c0f] flex" dir={isRtl ? 'rtl' : 'ltr'}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="lg:hidden bg-obsidian-900 border-e border-white/5 overflow-hidden"
        style={mobileSidebarStyle}
      >
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-[220px] xl:w-[240px] flex-shrink-0 bg-obsidian-900 border-e border-white/5 sticky top-0 h-screen overflow-y-auto">
        <Sidebar {...sidebarProps} />
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 bg-obsidian-950 border-b border-white/5">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="text-obsidian-400 hover:text-white p-1 transition-colors"
            aria-label="Toggle menu"
          >
            {sidebarOpen ? Ic.x : Ic.menu}
          </button>
          <p className="font-serif text-gold-500 text-sm tracking-widest uppercase flex-1 text-center">
            {t.panel}
          </p>
          {/* spacer */}
          <div className="w-7" />
        </header>

        {/* Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
