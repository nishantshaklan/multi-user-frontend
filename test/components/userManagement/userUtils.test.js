import {
  formatCreatedDate,
  formatInviteResendCountdown,
  formatPhone,
  getAvatarColors,
  getInitials,
  getInviteResendSecondsRemaining,
  isInviteResendOnCooldown,
  isValidEmail,
  isValidIndianPhone,
  mapApiStatusToUi,
  mapApiUserToRow,
  normalizeIndianPhoneForApi,
  parseResendCooldownError,
  sanitizeIndianPhoneInput,
  splitFullName,
} from '../../../src/components/userManagement/userUtils';

describe('userUtils', () => {
  it('formats initials for empty, single, and multi-word names', () => {
    expect(getInitials('')).toBe('?');
    expect(getInitials('Ada')).toBe('AD');
    expect(getInitials('Ada Lovelace')).toBe('AL');
  });

  it('returns deterministic avatar colors', () => {
    const colors = getAvatarColors('Ada Lovelace', ['#111', '#222']);
    expect(colors).toHaveProperty('bg');
    expect(colors).toHaveProperty('fg');
  });

  it('formats created date and invalid dates', () => {
    expect(formatCreatedDate('2024-01-15T00:00:00.000Z')).toMatch(/Jan/);
    expect(formatCreatedDate('invalid')).toBe('—');
  });

  it('formats phone display', () => {
    expect(formatPhone(null)).toBe('—');
    expect(formatPhone('+911234567890')).toBe('+911234567890');
  });

  it('computes invite resend cooldown from timestamp or seconds field', () => {
    const future = new Date(Date.now() + 5000).toISOString();
    expect(getInviteResendSecondsRemaining({ nextInviteEmailAllowedAt: future })).toBeGreaterThan(0);
    expect(getInviteResendSecondsRemaining({ inviteResendSecondsRemaining: 30 })).toBe(30);
    expect(isInviteResendOnCooldown({ inviteResendSecondsRemaining: 5 })).toBe(true);
  });

  it('formats invite countdown labels', () => {
    expect(formatInviteResendCountdown(0)).toBe('');
    expect(formatInviteResendCountdown(45)).toBe('45s');
    expect(formatInviteResendCountdown(125)).toBe('2m 5s');
    expect(formatInviteResendCountdown(3700)).toBe('1h 1m');
  });

  it('parses resend cooldown API errors', () => {
    expect(parseResendCooldownError({ status: 400 })).toBeNull();
    expect(
      parseResendCooldownError({
        status: 429,
        raw: { code: 'INVITE_RESEND_COOLDOWN', inviteResendSecondsRemaining: 10 },
      }),
    ).toMatchObject({ inviteResendSecondsRemaining: 10 });
  });

  it('maps API statuses and user rows', () => {
    expect(mapApiStatusToUi('ACTIVE')).toBe('Active');
    expect(mapApiStatusToUi('UNKNOWN')).toBe('Inactive');
    expect(
      mapApiUserToRow({
        id: '1',
        keycloakUserId: 'kc-1',
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+911234567890',
        status: 'INVITED',
        createdAt: '2024-01-01',
        availableActions: ['RESEND_INVITE'],
      }),
    ).toMatchObject({
      name: 'Ada Lovelace',
      status: 'Invited',
      msisdn: '+911234567890',
      availableActions: ['RESEND_INVITE'],
    });
  });

  it('validates email and indian phone inputs', () => {
    expect(isValidEmail('bad')).toBe(false);
    expect(isValidEmail('good@example.com')).toBe(true);
    expect(sanitizeIndianPhoneInput('+91abc1234')).toBe('+911234');
    expect(sanitizeIndianPhoneInput('98abc7654')).toBe('987654');
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('+919876543210')).toBe(true);
    expect(isValidIndianPhone('123')).toBe(false);
    expect(normalizeIndianPhoneForApi('9876543210')).toBe('+919876543210');
  });

  it('parses resend cooldown API errors with fallback message', () => {
    expect(
      parseResendCooldownError({
        status: 429,
        raw: { inviteResendSecondsRemaining: 10 },
      }),
    ).toMatchObject({ message: expect.stringContaining('cooldown') });

    expect(
      parseResendCooldownError({
        status: 429,
        raw: { message: 'Custom cooldown message', inviteResendSecondsRemaining: 10 },
      }),
    ).toMatchObject({ message: 'Custom cooldown message' });
  });

  it('normalizes ten digit phone without changing prefixed numbers', () => {
    expect(normalizeIndianPhoneForApi('+919876543210')).toBe('+919876543210');
  });

  it('splits full names', () => {
    expect(splitFullName('')).toEqual({ firstName: '', lastName: '' });
    expect(splitFullName('Ada')).toEqual({ firstName: 'Ada', lastName: '' });
    expect(splitFullName('Ada Lovelace')).toEqual({ firstName: 'Ada', lastName: 'Lovelace' });
  });
});
