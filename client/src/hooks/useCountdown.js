import { useState, useEffect } from 'react';

export function useCountdown(targetDate, onExpire) {
  const calculateTimeLeft = () => {
    if (!targetDate) return 0;
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    return Math.max(0, Math.floor(diff / 1000));
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) {
          onExpire();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpired = timeLeft <= 0;

  return {
    timeLeft,
    minutes,
    seconds,
    formattedTime,
    isExpired,
  };
}
