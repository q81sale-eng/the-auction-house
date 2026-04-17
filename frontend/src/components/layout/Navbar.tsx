import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth';
import { formatCurrency } from '../../utils/format';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout: logoutStore } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

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
            <Link to="/auctions" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">Auctions</Link>
            <Link to="/marketplace" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">Marketplace</Link>
            {isAuthenticated && (
              <Link to="/vault" className="text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider transition-colors">Watch Vault</Link>
            )}
          </div>

          {/* Auth area */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="text-right">
                  <p className="text-white text-sm font-medium">{user?.name}</p>
                  <p className="text-gold-500 text-xs">{formatCurrency(user?.deposit_balance || 0)} balance</p>
                </div>
                {user?.is_admin && (
                  <Link to="/admin" className="text-obsidian-400 hover:text-gold-500 text-xs uppercase tracking-wider transition-colors">Admin</Link>
                )}
                <button onClick={handleLogout} className="text-obsidian-400 hover:text-white text-sm transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-obsidian-300 hover:text-white text-sm uppercase tracking-wider transition-colors">Sign In</Link>
                <Link to="/register" className="btn-gold text-xs py-2 px-4">Join Now</Link>
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
            <Link to="/auctions" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>Auctions</Link>
            <Link to="/marketplace" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>Marketplace</Link>
            {isAuthenticated && (
              <>
                <Link to="/vault" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>Watch Vault</Link>
                <Link to="/profile" className="block text-obsidian-300 hover:text-gold-500 text-sm uppercase tracking-wider py-2" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block text-obsidian-400 text-sm py-2">Sign Out</button>
              </>
            )}
            {!isAuthenticated && (
              <>
                <Link to="/login" className="block text-obsidian-300 text-sm py-2" onClick={() => setMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="block btn-gold text-center" onClick={() => setMenuOpen(false)}>Join Now</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
