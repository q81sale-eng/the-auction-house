import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { useT } from '../../i18n/useLanguage';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const { tr } = useT();
  const t = tr.admin;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      if (!data.user.is_admin) {
        setError(t.login.notAdmin);
        setLoading(false);
        return;
      }
      setAuth(data.user, data.token);
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-gold-500 text-xl tracking-widest uppercase block mb-2">
            The Auction House
          </Link>
          <p className="text-obsidian-500 text-xs uppercase tracking-widest">{t.panel}</p>
          <h1 className="text-white text-2xl font-serif mt-6">{t.login.title}</h1>
          <p className="text-obsidian-400 text-sm mt-1">{t.login.subtitle}</p>
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-field"
                placeholder="admin@example.com"
                required
                autoFocus
              />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-4">
              {loading ? t.login.signingIn : t.login.button}
            </button>
          </form>
        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-obsidian-500 hover:text-obsidian-300 text-xs transition-colors">
            {t.backToSite}
          </Link>
        </p>
      </div>
    </div>
  );
};
