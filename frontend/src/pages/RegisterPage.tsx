import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchProfile } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useT } from '../i18n/useLanguage';

type CountryCode =
  | 'kw' | 'sa' | 'ae' | 'qa' | 'bh' | 'om'
  | 'gb' | 'us' | 'ch' | 'de' | 'fr' | 'jp' | 'sg' | 'hk' | 'other';

type Country = { code: CountryCode; dial: string; flag: string; pattern: RegExp; maxLen: number; hint: string };

const COUNTRIES: Country[] = [
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
];

// ── 6-box OTP Input ──────────────────────────────────────────────────────────
const OtpInput: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const refs = [
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
  ];

  const handleChange = (i: number, ch: string) => {
    const digit = ch.replace(/\D/g, '').slice(-1);
    const arr = value.padEnd(6, ' ').split('');
    arr[i] = digit || ' ';
    onChange(arr.join('').trimEnd());
    if (digit && i < 5) refs[i + 1].current?.focus();
  };

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) refs[i - 1].current?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text);
    refs[Math.min(text.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div className="flex gap-2 justify-center" dir="ltr">
      {refs.map((ref, i) => (
        <input key={i} ref={ref} type="text" inputMode="numeric" maxLength={1}
          value={value[i] ?? ''}
          onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-xl font-bold text-white bg-obsidian-900 border border-obsidian-700 focus:border-gold-500 outline-none transition-colors"
        />
      ))}
    </div>
  );
};

// ── RegisterPage ─────────────────────────────────────────────────────────────
export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth  = useAuthStore(s => s.setAuth);
  const { tr }   = useT();
  const t        = tr.register;

  const [step, setStep]                   = useState<'form' | 'otp'>('form');
  const [form, setForm]                   = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [countryCode, setCountryCode]     = useState<CountryCode>('kw');
  const [localPhone, setLocalPhone]       = useState('');
  const [fullPhone, setFullPhone]         = useState('');
  const [otp, setOtp]                     = useState('');
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [loading, setLoading]             = useState(false);
  const [resendTimer, setResendTimer]     = useState(0);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selected    = COUNTRIES.find(c => c.code === countryCode)!;

  useEffect(() => {
    if (resendTimer <= 0) return;
    const id = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(id);
  }, [resendTimer]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current && !dropdownRef.current.contains(target) &&
        triggerRef.current  && !triggerRef.current.contains(target)
      ) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const openDropdown = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setDropdownStyle({ position: 'fixed', top: r.bottom + 2, left: r.left, width: 288, zIndex: 9999 });
    }
    setDropdownOpen(o => !o);
  };

  const clearErr = (...keys: string[]) =>
    setErrors(prev => { const n = { ...prev }; keys.forEach(k => delete n[k]); return n; });

  // ── Step 1 ───────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const local = localPhone.trim();
    if (!local || !selected.pattern.test(local)) {
      setErrors({ phone: t.invalidPhone }); return;
    }
    if (form.password !== form.password_confirmation) {
      setErrors({ password_confirmation: 'كلمة المرور غير متطابقة' }); return;
    }
    if (form.password.length < 8) {
      setErrors({ password: 'كلمة المرور 8 أحرف على الأقل' }); return;
    }

    const phone = selected.dial
      ? `${selected.dial}${local.replace(/^0/, '')}`
      : local;

    setLoading(true);
    try {
      const { data: auth, error: signUpErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { name: form.name, phone, country: t.countries[countryCode as keyof typeof t.countries] } },
      });
      if (signUpErr) throw new Error(signUpErr.message);
      if (!auth.user) throw new Error('فشل إنشاء الحساب');

      const { error: otpErr } = await supabase.auth.signInWithOtp({ phone });
      if (otpErr) throw new Error(otpErr.message);

      setFullPhone(phone);
      setResendTimer(60);
      setStep('otp');
    } catch (err: any) {
      const msg = (err.message ?? '').toLowerCase();
      if (msg.includes('already registered') || msg.includes('already exists')) {
        setErrors({ email: 'هذا البريد الإلكتروني مسجل مسبقاً' });
      } else if (msg.includes('phone') || msg.includes('sms')) {
        setErrors({ phone: 'تعذّر إرسال رمز التحقق — تحقق من رقم الهاتف' });
      } else {
        setErrors({ general: err.message || t.generalError });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 ───────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    const code = otp.replace(/\s/g, '');
    if (code.length < 6) { setErrors({ otp: 'أدخل الرمز المكوّن من 6 أرقام' }); return; }
    setLoading(true);
    setErrors({});
    try {
      const { data, error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: code, type: 'sms' });
      if (error) throw error;
      const user    = data.user!;
      const m       = user.user_metadata ?? {};
      const profile = await fetchProfile(user.id, user.email ?? undefined);
      setAuth({
        id: user.id, name: m.name || user.email || '', email: user.email || '',
        is_admin: profile.is_admin, is_verified: true,
        deposit_balance: profile.deposit_balance, phone: m.phone, country: m.country,
      }, data.session?.access_token ?? '');
      navigate('/');
    } catch {
      setErrors({ otp: 'رمز التحقق غير صحيح أو منتهي الصلاحية' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(''); setErrors({});
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (error) { setErrors({ otp: 'تعذّر إعادة الإرسال' }); return; }
    setResendTimer(60);
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-gold-500 text-2xl tracking-widest uppercase">
            The Auction House
          </Link>
          <h2 className="text-white text-xl mt-4 font-serif">
            {step === 'form' ? t.title : 'التحقق من الهاتف'}
          </h2>
          <p className="text-obsidian-400 text-sm mt-1">
            {step === 'form' ? t.subtitle : `تم إرسال رمز مكوّن من 6 أرقام إلى ${fullPhone}`}
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center mb-6">
          {(['بيانات التسجيل', 'التحقق من الهاتف'] as const).map((label, i) => {
            const active = (step === 'form' && i === 0) || (step === 'otp' && i === 1);
            const done   = step === 'otp' && i === 0;
            return (
              <React.Fragment key={i}>
                {i > 0 && <div className={`flex-1 h-px mx-2 ${done ? 'bg-gold-500' : 'bg-obsidian-800'}`} />}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold border ${
                    done   ? 'bg-gold-500 border-gold-500 text-obsidian-950' :
                    active ? 'border-gold-500 text-gold-500' :
                             'border-obsidian-700 text-obsidian-600'
                  }`}>{done ? '✓' : i + 1}</div>
                  <span className={`text-xs hidden sm:block ${active || done ? 'text-white' : 'text-obsidian-600'}`}>{label}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="bg-obsidian-900 border border-obsidian-800 p-8">

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 mb-6">{errors.general}</div>
          )}

          {/* ── Form ── */}
          {step === 'form' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.name}</label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder={t.namePlaceholder} className={`input-field ${errors.name ? 'border-red-500' : ''}`} required />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.email}</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder={t.emailPlaceholder} className={`input-field ${errors.email ? 'border-red-500' : ''}`} required />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.phone}</label>
                <div dir="ltr" className={`flex items-stretch bg-obsidian-900 border transition-colors ${errors.phone ? 'border-red-500' : 'border-obsidian-700'} focus-within:border-gold-500`}>
                  <button ref={triggerRef} type="button" onClick={openDropdown}
                    className="flex items-center gap-2 px-3 py-3 border-r border-obsidian-700 text-white text-sm hover:bg-obsidian-800 transition-colors flex-shrink-0"
                    style={{ minWidth: '5.75rem' }}>
                    <span className="text-base leading-none">{selected.flag}</span>
                    <span className="tabular-nums font-medium">{selected.dial || '—'}</span>
                    <svg className="w-3 h-3 text-obsidian-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <input type="tel" inputMode="numeric" value={localPhone}
                    onChange={e => { setLocalPhone(e.target.value.replace(/\D/g, '')); clearErr('phone'); }}
                    placeholder={selected.hint} maxLength={selected.maxLen}
                    className="flex-1 min-w-0 bg-transparent text-white text-sm px-4 py-3 outline-none placeholder-obsidian-600" />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.password}</label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder={t.passwordPlaceholder} className={`input-field ${errors.password ? 'border-red-500' : ''}`} required />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="text-obsidian-400 text-xs uppercase tracking-wider block mb-2">{t.confirmPassword}</label>
                <input type="password" value={form.password_confirmation} onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                  placeholder={t.confirmPlaceholder} className={`input-field ${errors.password_confirmation ? 'border-red-500' : ''}`} required />
                {errors.password_confirmation && <p className="text-red-400 text-xs mt-1">{errors.password_confirmation}</p>}
              </div>

              <button type="submit" disabled={loading} className="btn-gold w-full mt-6">
                {loading ? 'جارٍ الإرسال…' : 'إرسال رمز التحقق'}
              </button>
            </form>
          )}

          {/* ── OTP ── */}
          {step === 'otp' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-gold-500/10 border border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-obsidian-400 text-sm">أدخل الرمز المكوّن من 6 أرقام</p>
              </div>

              <OtpInput value={otp} onChange={v => { setOtp(v); clearErr('otp'); }} />
              {errors.otp && <p className="text-red-400 text-xs text-center">{errors.otp}</p>}

              <button onClick={handleVerifyOtp} disabled={loading || otp.replace(/\s/g, '').length < 6}
                className="btn-gold w-full disabled:opacity-50">
                {loading ? 'جارٍ التحقق…' : 'تأكيد الحساب'}
              </button>

              <div className="text-center space-y-3">
                {resendTimer > 0 ? (
                  <p className="text-obsidian-500 text-xs">
                    إعادة الإرسال بعد <span className="text-gold-500 tabular-nums">{resendTimer}</span> ثانية
                  </p>
                ) : (
                  <button onClick={handleResend} className="text-gold-500 hover:text-gold-400 text-xs transition-colors">
                    لم يصلك الرمز؟ أعد الإرسال
                  </button>
                )}
                <div>
                  <button onClick={() => { setStep('form'); setOtp(''); setErrors({}); }}
                    className="text-obsidian-500 hover:text-obsidian-300 text-xs transition-colors">
                    ← تعديل البيانات
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="mt-6 pt-6 border-t border-obsidian-800 text-center">
              <p className="text-obsidian-400 text-sm">
                {t.haveAccount}{' '}
                <Link to="/login" className="text-gold-500 hover:text-gold-400 transition-colors">{t.signIn}</Link>
              </p>
            </div>
          )}
        </div>
      </div>

      {dropdownOpen && createPortal(
        <div ref={dropdownRef} style={dropdownStyle}
          className="bg-obsidian-900 border border-obsidian-700 shadow-2xl max-h-64 overflow-y-auto">
          {COUNTRIES.map(c => (
            <button key={c.code} type="button"
              onClick={() => { setCountryCode(c.code); setLocalPhone(''); setDropdownOpen(false); clearErr('phone'); }}
              className={`w-full text-left flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-obsidian-800 transition-colors ${c.code === countryCode ? 'text-gold-500 bg-obsidian-800' : 'text-white'}`}>
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
