import React, { useEffect, useState } from 'react';
import { isPushSupported, getPermission, requestPermission, isSubscribed } from '../../lib/onesignal';
import { useT } from '../../i18n/useLanguage';

export const NotificationBell: React.FC = () => {
  const { lang } = useT();
  const [perm, setPerm]   = useState<NotificationPermission>('default');
  const [opted, setOpted] = useState(false);
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    setPerm(getPermission());
    isSubscribed().then(setOpted);
  }, []);

  if (!isPushSupported()) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const result = typeof Notification !== 'undefined'
        ? await Notification.requestPermission()
        : 'denied';
      setPerm(result);
      setOpted(result === 'granted');
      if (result === 'granted') requestPermission().catch(() => {});
    } catch {
      // ignore
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const denied  = perm === 'denied';
  const enabled = perm === 'granted' || opted;

  return (
    <div className="relative">
      <button
        onClick={() => !enabled && !denied && setOpen(v => !v)}
        title={
          enabled ? (lang === 'ar' ? 'الإشعارات مفعّلة' : 'Notifications on')
          : denied ? (lang === 'ar' ? 'الإشعارات محجوبة من المتصفح' : 'Blocked by browser')
          : (lang === 'ar' ? 'تفعيل الإشعارات' : 'Enable notifications')
        }
        className="relative flex items-center justify-center w-8 h-8 text-obsidian-400 hover:text-gold-500 transition-colors"
        aria-label="notifications"
      >
        {/* Bell icon */}
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Green dot when enabled */}
        {enabled && (
          <span className="absolute top-1 end-1 w-2 h-2 rounded-full bg-green-500 border border-obsidian-950" />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute end-0 top-full mt-2 w-64 bg-obsidian-900 border border-obsidian-700 shadow-xl z-50 p-4">
          <p className="text-white text-sm font-medium mb-1">
            {lang === 'ar' ? 'إشعارات المزادات' : 'Auction Alerts'}
          </p>
          <p className="text-obsidian-400 text-xs mb-4 leading-relaxed">
            {lang === 'ar'
              ? 'فعّل الإشعارات ليصلك تنبيه فور إضافة مزاد أو قطعة جديدة'
              : 'Get notified instantly when a new auction or listing is added'}
          </p>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full btn-gold text-xs py-2 disabled:opacity-60"
          >
            {loading
              ? (lang === 'ar' ? 'جارٍ التفعيل...' : 'Enabling...')
              : (lang === 'ar' ? 'تفعيل الإشعارات' : 'Enable Notifications')}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full mt-2 text-obsidian-500 hover:text-obsidian-300 text-xs transition-colors"
          >
            {lang === 'ar' ? 'لاحقاً' : 'Later'}
          </button>
        </div>
      )}
    </div>
  );
};
