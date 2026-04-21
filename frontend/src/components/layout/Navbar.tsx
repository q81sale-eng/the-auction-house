import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth';
import { formatCurrency } from '../../utils/format';
import { useT } from '../../i18n/useLanguage';
import { useCurrencyStore, CURRENCIES, CURRENCY_SYMBOLS, convertFromGBP, type Currency } from '../../store/currencyStore';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);
  const { tr, lang, toggle } = useT();
  const { currency, setCurrency } = useCurrencyStore();

  // Close admin dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setAdminOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
            <Link to="/pave" className="text-gold-500/70 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors font-serif italic">{tr.nav.pave}</Link>
            {isAuthenticated && (
              <Link to="/vault" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">{tr.nav.vault}</Link>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-4">
            {/* Currency selector */}
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as Currency)}
              className="bg-obsidian-950 border border-obsidian-700 hover:border-gold-500/50 text-obsidian-300 text-xs uppercase tracking-wider px-2 py-1 cursor-pointer transition-colors focus:outline-none focus:border-gold-500/50"
              aria-label="Select currency"
            >
              {CURRENCIES.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>)}
            </select>

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
                <div className="text-end">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-gold-500 text-xs">{formatCurrency(convertFromGBP(user?.deposit_balance || 0, currency), currency)} {tr.nav.balance}</p>
                </div>
                <Link to="/profile" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">{tr.nav.profile}</Link>
                {user?.is_admin && (
                  <div className="relative" ref={adminRef}>
                    <button
                      onClick={() => setAdminOpen(v => !v)}
                      className="flex items-center gap-1 border border-gold-500/60 text-gold-500 hover:bg-gold-500 hover:text-obsidian-950 text-xs uppercase tracking-wider px-3 py-1.5 transition-colors"
                    >
                      {tr.nav.admin}
                      <svg className={`w-3 h-3 transition-transform ${adminOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {adminOpen && (
                      <div className="absolute end-0 top-full mt-1 w-52 bg-obsidian-900 border border-obsidian-700 shadow-lg z-50">
                        <Link
                          to="/admin"
                          onClick={() => setAdminOpen(false)}
                          className="block px-4 py-2.5 text-xs uppercase tracking-wider text-gold-500 hover:bg-obsidian-800 border-b border-obsidian-800"
                        >
                          {tr.nav.admin}
                        </Link>
                        <Link
                          to="/admin/valuation-requests"
                          onClick={() => setAdminOpen(false)}
                          className="block px-4 py-2.5 text-xs uppercase tracking-wider text-obsidian-300 hover:text-gold-500 hover:bg-obsidian-800 border-b border-obsidian-800"
                        >
                          {tr.admin.valuationRequests}
                        </Link>
                        <Link
                          to="/admin/auctions/new"
                          onClick={() => setAdminOpen(false)}
                          className="block px-4 py-2.5 text-xs uppercase tracking-wider text-obsidian-300 hover:text-gold-500 hover:bg-obsidian-800"
                        >
                          {tr.admin.actions.createAuction}
                        </Link>
                      </div>
                    )}
                  </div>
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
          <button className="md:hidden text-obsidian-300 hover:text-white p-2 -me-2 transition-colors" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu — full-width dropdown */}
        {menuOpen && (
          <div className="md:hidden border-t border-obsidian-800 overflow-y-auto max-h-[calc(100vh-4rem)]">

            {/* Explore */}
            <div className="px-2 pt-4 pb-3">
              <p className="text-obsidian-600 text-xs uppercase tracking-widest mb-2 px-1">{tr.nav.explore}</p>
              <Link to="/" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.home}</Link>
              <Link to="/auctions" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.auctions}</Link>
              <Link to="/marketplace" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.marketplace}</Link>
              <Link to="/pave" className="block text-gold-500/80 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 font-serif italic" onClick={() => setMenuOpen(false)}>{tr.nav.pave}</Link>
            </div>

            {/* My Account */}
            {isAuthenticated && (
              <div className="border-t border-obsidian-800 px-2 pt-4 pb-3">
                <p className="text-obsidian-600 text-xs uppercase tracking-widest mb-2 px-1">{tr.nav.myAccount}</p>
                <Link to="/vault" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.vault}</Link>
                <Link to="/profile" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.profile}</Link>
                <Link to="/profile?tab=bids" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.myOffers}</Link>
                <Link to="/profile?tab=deposits" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.deposits}</Link>
                <Link to="/profile?tab=security" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2.5 px-1" onClick={() => setMenuOpen(false)}>{tr.nav.security}</Link>
              </div>
            )}

            {/* Admin */}
            {user?.is_admin && (
              <div className="border-t border-obsidian-800 px-2 pt-4 pb-3">
                <p className="text-obsidian-600 text-xs uppercase tracking-widest mb-2 px-1">{tr.nav.admin}</p>
                <Link to="/admin" className="block text-gold-500 hover:text-gold-400 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.nav.admin}</Link>
                <Link to="/admin/valuation-requests" className="block text-gold-500 hover:text-gold-400 text-sm uppercase tracking-wider py-2.5 px-1 border-b border-obsidian-900" onClick={() => setMenuOpen(false)}>{tr.admin.valuationRequests}</Link>
                <Link to="/admin/auctions/new" className="block text-gold-500 hover:text-gold-400 text-sm uppercase tracking-wider py-2.5 px-1" onClick={() => setMenuOpen(false)}>{tr.admin.actions.createAuction}</Link>
              </div>
            )}

            {/* Language, currency, auth */}
            <div className="border-t border-obsidian-800 px-2 pt-4 pb-6 space-y-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggle}
                  className="flex items-center border border-obsidian-700 hover:border-gold-500/50 transition-colors"
                  aria-label="Switch language"
                >
                  <span className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${lang === 'en' ? 'text-gold-500 bg-gold-500/10' : 'text-obsidian-500'}`}>EN</span>
                  <span className="w-px h-4 bg-obsidian-700" />
                  <span className={`px-3 py-1.5 text-xs uppercase tracking-widest transition-colors ${lang === 'ar' ? 'text-gold-500 bg-gold-500/10' : 'text-obsidian-500'}`}>AR</span>
                </button>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value as Currency)}
                  className="bg-obsidian-950 border border-obsidian-700 text-obsidian-300 text-xs uppercase tracking-wider px-2 py-1.5 cursor-pointer focus:outline-none"
                  aria-label="Select currency"
                >
                  {CURRENCIES.map(c => <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>)}
                </select>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{user?.name}</p>
                    <p className="text-gold-500 text-xs">{formatCurrency(convertFromGBP(user?.deposit_balance || 0, currency), currency)} {tr.nav.balance}</p>
                  </div>
                  <button onClick={() => { setMenuOpen(false); handleLogout(); }} className="text-obsidian-400 hover:text-white text-sm uppercase tracking-wider transition-colors">
                    {tr.nav.signOut}
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Link to="/login" className="flex-1 text-center border border-obsidian-700 text-obsidian-300 text-sm py-2.5 uppercase tracking-wider hover:border-gold-500 hover:text-gold-500 transition-colors" onClick={() => setMenuOpen(false)}>{tr.nav.signIn}</Link>
                  <Link to="/register" className="flex-1 btn-gold text-center text-xs py-2.5" onClick={() => setMenuOpen(false)}>{tr.nav.joinNow}</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
