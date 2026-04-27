import OneSignal from 'react-onesignal';

const APP_ID   = process.env.REACT_APP_ONESIGNAL_APP_ID   || '';
const REST_KEY = process.env.REACT_APP_ONESIGNAL_REST_KEY || '';

let initialised = false;

export const initOneSignal = async () => {
  if (!APP_ID || initialised) return;
  initialised = true;
  await OneSignal.init({
    appId: APP_ID,
    allowLocalhostAsSecureOrigin: true,
  });
};

export const isPushSupported = () =>
  typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window;

export const getPermission = (): NotificationPermission =>
  typeof Notification !== 'undefined' ? Notification.permission : 'default';

export const requestPermission = async () => {
  await OneSignal.Notifications.requestPermission();
};

export const isSubscribed = async (): Promise<boolean> => {
  try { return await OneSignal.User.PushSubscription.optedIn ?? false; }
  catch { return false; }
};

// Called by admin after creating auction or listing
export const sendPushNotification = async (opts: {
  titleAr: string;
  titleEn: string;
  bodyAr:  string;
  bodyEn:  string;
  url:     string;
}) => {
  if (!REST_KEY || !APP_ID) return;
  await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${REST_KEY}`,
    },
    body: JSON.stringify({
      app_id:             APP_ID,
      included_segments:  ['All'],
      headings:  { en: opts.titleEn, ar: opts.titleAr },
      contents:  { en: opts.bodyEn,  ar: opts.bodyAr  },
      url:       opts.url,
    }),
  });
};
