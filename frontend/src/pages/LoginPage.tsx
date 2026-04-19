import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useT } from '../i18n/useLanguage';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const { tr } = useT();
  const t = tr.login;
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-gold-500 text-2xl tracking-widest uppercase">The Auction House</Link>
          <h2 className="text-white text-xl mt-4 font-serif">{t.title}</h2>
          <p className="text-obsidian-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.email}</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field" placeholder={t.emailPlaceholder} required />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.password}</label>
              <input type="password" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? t.submitting : t.submit}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-obsidian-800 text-center">
            <p className="text-obsidian-400 text-sm">
              {t.noAccount}{' '}
              <Link to="/register" className="text-gold-500 hover:text-gold-400 transition-colors">{t.createAccount}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
