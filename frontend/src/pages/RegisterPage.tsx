import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '', phone: '', country: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    try {
      const data = await register(form);
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([k, v]) => { errs[k] = (v as string[])[0]; });
        setErrors(errs);
      } else {
        setErrors({ general: err.response?.data?.message || 'Registration failed' });
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(p => ({ ...p, [key]: e.target.value })),
    className: `input-field ${errors[key] ? 'border-red-500' : ''}`,
  });

  const countries = ['United Kingdom', 'United States', 'Switzerland', 'Germany', 'France', 'Japan', 'Singapore', 'Hong Kong', 'UAE', 'Other'];

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-gold-500 text-2xl tracking-widest uppercase">The Auction House</Link>
          <h2 className="text-white text-xl mt-4 font-serif">Create Account</h2>
          <p className="text-obsidian-400 text-sm mt-1">Join the world's premier watch auction platform</p>
        </div>

        <div className="card p-8">
          {errors.general && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Full Name</label>
              <input type="text" {...field('name')} placeholder="John Smith" required />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Email Address</label>
              <input type="email" {...field('email')} placeholder="your@email.com" required />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Phone</label>
                <input type="tel" {...field('phone')} placeholder="+44 7xxx" />
              </div>
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Country</label>
                <select {...field('country')} className={`input-field text-sm ${errors.country ? 'border-red-500' : ''}`}>
                  <option value="">Select...</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Password</label>
              <input type="password" {...field('password')} placeholder="Min 8 characters" required />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">Confirm Password</label>
              <input type="password" {...field('password_confirmation')} placeholder="Repeat password" required />
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-obsidian-800 text-center">
            <p className="text-obsidian-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-gold-500 hover:text-gold-400 transition-colors">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
