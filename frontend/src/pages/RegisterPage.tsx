import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useT } from '../i18n/useLanguage';

const COUNTRIES = [
  { code: 'kw',    dial: '+965', flag: '🇰🇼', pattern: /^[569]\d{7}$/,  maxLen: 8,  hint: '51234567'    },
  { code: 'sa',    dial: '+966', flag: '🇸🇦', pattern: /^5\d{8}$/,      maxLen: 9,  hint: '512345678'   },
  { code: 'ae',    dial: '+971', flag: '🇦🇪', pattern: /^5\d{8}$/,      maxLen: 9,  hint: '501234567'   },
  { code: 'qa',    dial: '+974', flag: '🇶🇦', pattern: /^[3567]\d{7}$/, maxLen: 8,  hint: '51234567'    },
  { code: 'bh',    dial: '+973', flag: '🇧🇭', pattern: /^[36]\d{7}$/,   maxLen: 8,  hint: '31234567'    },
  { code: 'om',    dial: '+968', flag: '🇴🇲', pattern: /^[79]\d{7}$/,   maxLen: 8,  hint: '91234567'    },
  { code: 'gb',    dial: '+44',  flag: '🇬🇧', pattern: /^7\d{9}$/,      maxLen: 10, hint: '7911123456'  },
  { code: 'us',    dial: '+1',   flag: '🇺🇸', pattern: /^\d{10}$/,      maxLen: 10, hint: '2025551234'  },
  { code: 'ch',    dial: '+41',  flag: '🇨🇭', pattern: /^\d{9}$/,       maxLen: 9,  hint: '781234567'   },
  { code: 'de',    dial: '+49',  flag: '🇩🇪', pattern: /^\d{10,11}$/,   maxLen: 11, hint: '15123456789' },
  { code: 'fr',    dial: '+33',  flag: '🇫🇷', pattern: /^\d{9}$/,       maxLen: 9,  hint: '612345678'   },
  { code: 'jp',    dial: '+81',  flag: '🇯🇵', pattern: /^\d{10}$/,      maxLen: 10, hint: '9012345678'  },
  { code: 'sg',    dial: '+65',  flag: '🇸🇬', pattern: /^[89]\d{7}$/,   maxLen: 8,  hint: '81234567'    },
  { code: 'hk',    dial: '+852', flag: '🇭🇰', pattern: /^\d{8}$/,       maxLen: 8,  hint: '91234567'    },
  { code: 'other', dial: '',     flag: '🌐', pattern: /^\d{6,15}$/,     maxLen: 15, hint: '1234567890'  },
] as const;

type CountryCode = typeof COUNTRIES[number]['code'];

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);
  const { tr } = useT();
  const t = tr.register;

  const [form, setForm] = useState({
    name: '', email: '', password: '', password_confirmation: '',
  });
  const [countryCode, setCountryCode] = useState<CountryCode>('kw');
  const [localPhone, setLocalPhone] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected = COUNTRIES.find(c => c.code === countryCode)!;

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current && !triggerRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: 'fixed',
        top: r.bottom + 2,
        left: r.left,
        width: 288, // 72 * 4
        zIndex: 9999,
      });
    }
    setDropdownOpen(o => !o);
  };

  const clearPhoneError = () =>
    setErrors(prev => { const { phone: _, ...rest } = prev; return rest; });

  const validatePhone = (): boolean => {
    const local = localPhone.trim();
    if (!local || !selected.pattern.test(local)) {
      setErrors(prev => ({ ...prev, phone: t.invalidPhone }));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!validatePhone()) return;
    setLoading(true);

    const fullPhone = selected.dial
      ? `${selected.dial}${localPhone.replace(/^0/, '')}`
      : localPhone;
    const countryName = t.countries[countryCode as keyof typeof t.countries];

    try {
      const data = await register({ ...form, phone: fullPhone, country: countryName });
      setAuth(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errs: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(
          ([k, v]) => { errs[k] = (v as string[])[0]; }
        );
        setErrors(errs);
      } else {
        setErrors({ general: err.response?.data?.message || t.generalError });
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(p => ({ ...p, [key]: e.target.value })),
    className: `input-field ${errors[key] ? 'border-red-500' : ''}`,
  });

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-10">
          <Link to="/" className="font-serif text-gold-500 text-2xl tracking-widest uppercase">
            The Auction House
          </Link>
          <h2 className="text-white text-xl mt-4 font-serif">{t.title}</h2>
          <p className="text-obsidian-400 text-sm mt-1">{t.subtitle}</p>
        </div>

        {/* Use individual classes instead of .card to avoid overflow-hidden clipping the dropdown */}
        <div className="bg-obsidian-900 border border-obsidian-800 p-8">
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                {t.name}
              </label>
              <input type="text" {...field('name')} placeholder={t.namePlaceholder} required />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                {t.email}
              </label>
              <input type="email" {...field('email')} placeholder={t.emailPlaceholder} required />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Phone — always LTR regardless of document direction */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                {t.phone}
              </label>
              <div
                dir="ltr"
                className={`flex items-stretch bg-obsidian-900 border transition-colors ${
                  errors.phone ? 'border-red-500' : 'border-obsidian-700'
                } focus-within:border-gold-500`}
              >
                {/* Country-code trigger button */}
                <button
                  ref={triggerRef}
                  type="button"
                  onClick={openDropdown}
                  className="flex items-center gap-2 px-3 py-3 h-full border-r border-obsidian-700 text-white text-sm hover:bg-obsidian-800 transition-colors flex-shrink-0"
                  style={{ minWidth: '5.75rem' }}
                >
                  <span className="text-base leading-none">{selected.flag}</span>
                  <span className="tabular-nums font-medium">{selected.dial || '—'}</span>
                  <svg className="w-3 h-3 text-obsidian-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Local number input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={localPhone}
                  onChange={e => {
                    setLocalPhone(e.target.value.replace(/\D/g, ''));
                    clearPhoneError();
                  }}
                  placeholder={selected.hint}
                  maxLength={selected.maxLen}
                  className="flex-1 min-w-0 bg-transparent text-white text-sm px-4 py-3 outline-none placeholder-obsidian-600"
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                {t.password}
              </label>
              <input type="password" {...field('password')} placeholder={t.passwordPlaceholder} required />
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">
                {t.confirmPassword}
              </label>
              <input type="password" {...field('password_confirmation')} placeholder={t.confirmPlaceholder} required />
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
              {loading ? t.submitting : t.submit}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-obsidian-800 text-center">
            <p className="text-obsidian-400 text-sm">
              {t.haveAccount}{' '}
              <Link to="/login" className="text-gold-500 hover:text-gold-400 transition-colors">
                {t.signIn}
              </Link>
            </p>
          </div>
        </div>

      </div>

      {/* Dropdown rendered in a portal so parent overflow:hidden cannot clip it */}
      {dropdownOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-obsidian-900 border border-obsidian-700 shadow-2xl max-h-64 overflow-y-auto"
        >
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              type="button"
              onClick={() => {
                setCountryCode(c.code);
                setLocalPhone('');
                setDropdownOpen(false);
                clearPhoneError();
              }}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-obsidian-800 transition-colors ${
                c.code === countryCode ? 'text-gold-500 bg-obsidian-800' : 'text-white'
              }`}
            >
              <span className="text-base leading-none flex-shrink-0">{c.flag}</span>
              <span className="tabular-nums text-obsidian-400 w-11 flex-shrink-0">{c.dial || '—'}</span>
              <span className="truncate">{t.countries[c.code as keyof typeof t.countries]}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};
