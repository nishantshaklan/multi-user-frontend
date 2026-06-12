describe('runtimeEnv', () => {
  const originalApiUrl = process.env.VITE_MULTI_USER_API_URL;

  beforeEach(() => {
    delete globalThis._env_;
    jest.resetModules();
  });

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.VITE_MULTI_USER_API_URL;
    } else {
      process.env.VITE_MULTI_USER_API_URL = originalApiUrl;
    }
  });

  it('returns runtime override from globalThis._env_', async () => {
    globalThis._env_ = { VITE_MULTI_USER_API_URL: 'https://runtime.example/api' };
    const { runtimeEnv } = await import('../../src/config/runtimeEnv');
    expect(runtimeEnv('VITE_MULTI_USER_API_URL')).toBe('https://runtime.example/api');
  });

  it('returns fallback when value is missing everywhere', async () => {
    const { runtimeEnv } = await import('../../src/config/runtimeEnv');
    expect(runtimeEnv('VITE_MISSING', 'default-value')).toBe('default-value');
  });

  it('ignores empty runtime strings and uses build-time env', async () => {
    process.env.VITE_MULTI_USER_API_URL = 'https://build-time.example/api';
    globalThis._env_ = { VITE_MULTI_USER_API_URL: '' };
    const { runtimeEnv } = await import('../../src/config/runtimeEnv');
    expect(runtimeEnv('VITE_MULTI_USER_API_URL', 'fallback-url')).toBe(
      'https://build-time.example/api',
    );
  });

  it('uses fallback when runtime and build-time values are empty', async () => {
    delete process.env.VITE_MULTI_USER_API_URL;
    globalThis._env_ = { VITE_MULTI_USER_API_URL: '' };
    const { runtimeEnv } = await import('../../src/config/runtimeEnv');
    expect(runtimeEnv('VITE_MULTI_USER_API_URL', 'fallback-url')).toBe('fallback-url');
  });
});
