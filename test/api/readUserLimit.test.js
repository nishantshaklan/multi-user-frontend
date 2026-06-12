import { readUserLimit } from '../../src/api/readUserLimit';

describe('readUserLimit', () => {
  it('returns null for non-array input', () => {
    expect(readUserLimit(null)).toBeNull();
    expect(readUserLimit({})).toBeNull();
  });

  it('returns null when no active primary subscription exists', () => {
    expect(readUserLimit([{ status: 'INACTIVE', plan: { type: 'SUBSCRIPTION', category: 'PRIMARY' } }])).toBeNull();
  });

  it('reads numeric USER_LIMIT from active primary plan', () => {
    const planSubs = [{
      status: 'ACTIVE',
      plan: {
        type: 'SUBSCRIPTION',
        category: 'PRIMARY',
        features: [{ code: 'USER_LIMIT', value: 25 }],
      },
    }];
    expect(readUserLimit(planSubs)).toBe(25);
  });

  it('parses string USER_LIMIT and returns null for invalid string', () => {
    const valid = [{
      status: 'active',
      plan: {
        type: 'subscription',
        category: 'primary',
        features: [{ code: 'user_limit', value: '10' }],
      },
    }];
    const invalid = [{
      status: 'ACTIVE',
      plan: {
        type: 'SUBSCRIPTION',
        category: 'PRIMARY',
        features: [{ code: 'USER_LIMIT', value: 'not-a-number' }],
      },
    }];
    expect(readUserLimit(valid)).toBe(10);
    expect(readUserLimit(invalid)).toBeNull();
  });
});
