import { enterpriseUsersKeys } from '../../../src/components/userManagement/queryKeys';

describe('enterpriseUsersKeys', () => {
  it('builds stable list and banner keys', () => {
    expect(enterpriseUsersKeys.all).toEqual(['enterprise-users']);
    expect(enterpriseUsersKeys.list('ent-1', 'ACTIVE', 'john', 2)).toEqual([
      'enterprise-users',
      'list',
      'ent-1',
      'ACTIVE',
      'john',
      2,
    ]);
    expect(enterpriseUsersKeys.banner('ent-1')).toEqual(['enterprise-users', 'banner', 'ent-1']);
  });
});
