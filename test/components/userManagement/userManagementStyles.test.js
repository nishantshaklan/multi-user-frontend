import { getUserManagementStyles } from '../../../src/components/userManagement/userManagementStyles';

describe('getUserManagementStyles', () => {
  const palette = {
    pureWhite: '#fff',
    silverGray: '#eee',
    lightGrayCCC: '#ccc',
    stoneGray: '#999',
    ashGray: '#666',
    pureBlack: '#000',
    tealAccent: '#007171',
    whisperGrey: '#f5f5f5',
    statusInvitedText: '#92400E',
    platinum: '#e5e7ea',
    dangerText: '#b91c1c',
    successActionText: '#047857',
  };

  it('returns style objects for toolbar, table, and modal sections', () => {
    const styles = getUserManagementStyles(palette);
    expect(styles.toolbarRow).toBeDefined();
    expect(styles.searchField).toBeDefined();
    expect(styles.confirmModalPaper).toBeDefined();
    expect(styles.sideDrawerPaper).toBeDefined();
  });
});
