export const enterpriseUsersKeys = {
  all: ['enterprise-users'],
  list: (enterpriseId, status, search, page) => [
    ...enterpriseUsersKeys.all,
    'list',
    enterpriseId,
    status,
    search,
    page,
  ],
  banner: (enterpriseId) => [...enterpriseUsersKeys.all, 'banner', enterpriseId],
};
