import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth';
import { formatCurrency } from '../../utils/format';
import { useT } from '../../i18n/useLanguage';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { tr, lang, toggle } = useT();

  const handleLogout = async () => {
    try { await logout(); } catch {}
    logoutStore();
    navigate('/login');
  };

  return (
    <nav className="bg-obsidian-950 border-b border-obsidian-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="font-serif text-gold-500 text-xl tracking-widest uppercase">
            The Auction House
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/auctions" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">{tr.nav.auctions}</Link>
            <Link to="/marketplace" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">{tr.nav.marketplace}</Link>
            {isAuthenticated && (
              <Link to="/vault" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">{tr.nav.vault}</Link>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="flex items-center border border-obsidian-700 hover:border-gold-500/50 transition-colors"
              aria-label="Switch language"
            >
              <span className={`px-2.5 py-1 text-xs uppercase tracking-widest transition-colors ${lang === 'en' ? 'text-gold-500 bg-gold-500/10' : 'text-obsidian-500 hover:text-obsidian-300'}`}>EN</span>
              <span className="w-px h-4 bg-obsidian-700" />
              <span className={`px-2.5 py-1 text-xs uppercase tracking-widest transition-colors ${lang === 'ar' ? 'text-gold-500 bg-gold-500/10' : 'text-obsidian-500 hover:text-obsidian-300'}`}>AR</span>
            </button>

            {isAuthenticated ? (
              <>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-gold-500 text-xs">{formatCurrency(user?.deposit_balance || 0)} {tr.nav.balance}</p>
                </div>
                <Link to="/profile" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">{tr.nav.profile}</Link>
                {user?.is_admin && (
                  <Link to="/admin" className="border border-gold-500/60 text-gold-500 hover:bg-gold-500 hover:text-obsidian-950 text-xs uppercase tracking-wider px-3 py-1.5 transition-colors">
                    {tr.nav.admin}
                  </Link>
                )}
                <button onClick={handleLogout} className="text-obsidian-400 hover:text-white text-sm transition-colors">
                  {tr.nav.signOut}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-obsidian-300 hover:text-white text-sm uppercase tracking-wider transition-colors">{tr.nav.signIn}</Link>
                <Link to="/register" className="btn-gold text-xs py-2 px-4">{tr.nav.joinNow}</Link>
              </>
            )}
          </div>

          {/* Mobile menu btn */}
          <button className="md:hidden text-obsidian-400" onClick={() => setMenuOpen(!menuOpen)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-obsidian-800 py-4 space-y-3">
            <Link to="/auctions" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>{tr.nav.auctions}</Link>
            <Link to="/marketplace" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>{tr.nav.marketplace}</Link>
            {isAuthenticated && (
              <>
                <Link to="/vault" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>{tr.nav.vault}</Link>
                <Link to="/profile" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>{tr.nav.profile}</Link>
                {user?.is_admin && (
                  <Link to="/admin" className="block text-gold-500 text-sm uppercase tracking-wider py-2 font-medium" onClick={() => setMenuOpen(false)}>{tr.nav.admin}</Link>
                )}
                <button onClick={handleLogout} className="block text-obsidian-400 text-sm py-2">{tr.nav.signOut}</button>
              </>
            )}
            {/* Language toggle — above auth links */}
            <div className="pt-2 border-t border-obsidian-800">
              <button
                onClick={toggle}
                className="flex items-center border border-obsidian-700 hover:border-gold-500/50 transition-colors"
                aria-label="Switch language"
              >
                <span className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${lang === 'en' ? 'text-gold-500 bg-gold-500/10' : 'text-obsidian-500'}`}>EN</span>
                <span className="w-px h-4 bg-obsidian-700" />
                <span className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${lang === 'ar' ? 'text-gold-500 bg-gold-500/10' : 'text-obsidian-500'}`}>AR</span>
              </button>
            </div>

            {!isAuthenticated && (
              <>
                <Link to="/login" className="block text-obsidian-300 text-sm py-2" onClick={() => setMenuOpen(false)}>{tr.nav.signIn}</Link>
                <Link to="/register" className="block btn-gold text-center" onClick={() => setMenuOpen(false)}>{tr.nav.joinNow}</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
