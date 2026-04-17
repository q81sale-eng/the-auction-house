import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
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
      setError(err.response?.data?.message || err.response?.data?.errors?.email?.[0] || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-gold-500 text-2xl tracking-widest uppercase">The Auction House</Link>
          <h2 className="text-white text-xl mt-4 font-serif">Welcome Back</h2>
          <p className="text-obsidian-400 text-sm mt-1">Sign in to access your account</p>
        </div>

        <div className="card p-8">
          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className="input-field" placeholder="your@email.com" required />
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Password</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="input-field" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-obsidian-800 text-center">
            <p className="text-obsidian-400 text-sm">
              Don't have an account?{' '}
              <Link to="/register" className="text-gold-500 hover:text-gold-400 transition-colors">Create Account</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-obsidian-600 text-xs mt-6">
          Demo: admin@theauctionhouse.com / password
        </p>
      </div>
    </div>
  );
};
