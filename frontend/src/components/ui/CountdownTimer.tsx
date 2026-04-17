import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  endsAt: string;
  onExpire?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ endsAt, onExpire }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        onExpire?.();
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  if (timeLeft.expired) {
    return <span className="text-obsidian-400 text-sm uppercase tracking-wider">Auction Ended</span>;
  }

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 1;

  return (
    <div className={`flex items-center gap-2 ${isUrgent ? 'text-red-400' : 'text-white'}`}>
      {timeLeft.days > 0 && (
        <>
          <div className="text-center">
            <div className="text-2xl font-mono font-bold">{pad(timeLeft.days)}</div>
            <div className="text-xs text-obsidian-400 uppercase tracking-wider">Days</div>
          </div>
          <span className="text-obsidian-600 text-xl">:</span>
        </>
      )}
      <div className="text-center">
        <div className="text-2xl font-mono font-bold">{pad(timeLeft.hours)}</div>
        <div className="text-xs text-obsidian-400 uppercase tracking-wider">Hrs</div>
      </div>
      <span className="text-obsidian-600 text-xl">:</span>
      <div className="text-center">
        <div className="text-2xl font-mono font-bold">{pad(timeLeft.minutes)}</div>
        <div className="text-xs text-obsidian-400 uppercase tracking-wider">Min</div>
      </div>
      <span className="text-obsidian-600 text-xl">:</span>
      <div className="text-center">
        <div className={`text-2xl font-mono font-bold ${isUrgent ? 'animate-pulse' : ''}`}>{pad(timeLeft.seconds)}</div>
        <div className="text-xs text-obsidian-400 uppercase tracking-wider">Sec</div>
      </div>
    </div>
  );
};
