import theme from '../../src/theme/Theme';
import { queryClient } from '../../src/query/queryClient';

describe('theme and query client', () => {
  it('exports MUI theme with custom palette', () => {
    expect(theme.palette.custom.pureWhite).toBe('#ffffff');
    expect(theme.typography.fontFamily).toContain('DM Sans');
  });

  it('configures react-query defaults', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1);
    expect(queryClient.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
  });
});
