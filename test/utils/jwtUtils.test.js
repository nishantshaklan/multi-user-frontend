import { decodeJwtPayload } from '../../src/utils/jwtUtils';
import { makeJwt } from '../testUtils';

describe('decodeJwtPayload', () => {
  it('returns null for missing token', () => {
    expect(decodeJwtPayload()).toBeNull();
    expect(decodeJwtPayload('')).toBeNull();
  });

  it('returns null for malformed token', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('a.b')).toBeNull();
  });

  it('decodes a valid payload with unicode name', () => {
    const payload = { enterpriseId: 'ent-1', name: 'José 🎉' };
    expect(decodeJwtPayload(makeJwt(payload))).toEqual(payload);
  });

  it('returns null when payload is invalid JSON', () => {
    const bad = `${Buffer.from('{}').toString('base64')}.%%%invalid%%%.sig`;
    expect(decodeJwtPayload(bad)).toBeNull();
  });
});
