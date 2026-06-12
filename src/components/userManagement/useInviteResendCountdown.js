import { useEffect, useState } from 'react';
import { getInviteResendSecondsRemaining } from './userUtils';

/** Live countdown for invite resend cooldown (ticks every second). */
export function useInviteResendCountdown(user) {
  const [seconds, setSeconds] = useState(() => getInviteResendSecondsRemaining(user));

  useEffect(() => {
    if (user?.nextInviteEmailAllowedAt) {
      const tick = () => setSeconds(getInviteResendSecondsRemaining(user));
      tick();
      if (getInviteResendSecondsRemaining(user) <= 0) return undefined;
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    }

    const initial =
      typeof user?.inviteResendSecondsRemaining === 'number'
        ? user.inviteResendSecondsRemaining
        : 0;
    if (initial <= 0) {
      setSeconds(0);
      return undefined;
    }

    const startedAt = Date.now();
    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setSeconds(Math.max(0, initial - elapsed));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [user?.inviteResendSecondsRemaining, user?.nextInviteEmailAllowedAt]);

  return seconds;
}
