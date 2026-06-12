import { renderHook, act } from '@testing-library/react';
import { useInviteResendCountdown } from '../../src/components/userManagement/useInviteResendCountdown';

describe('useInviteResendCountdown', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('counts down using inviteResendSecondsRemaining', () => {
    const { result } = renderHook(() =>
      useInviteResendCountdown({ inviteResendSecondsRemaining: 3 }),
    );
    expect(result.current).toBe(3);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(result.current).toBe(2);
  });

  it('uses nextInviteEmailAllowedAt when provided', () => {
    const future = new Date(Date.now() + 5000).toISOString();
    const { result } = renderHook(() => useInviteResendCountdown({ nextInviteEmailAllowedAt: future }));
    expect(result.current).toBeGreaterThan(0);
  });

  it('returns zero when no cooldown data exists', () => {
    const { result } = renderHook(() => useInviteResendCountdown({}));
    expect(result.current).toBe(0);
  });
});
