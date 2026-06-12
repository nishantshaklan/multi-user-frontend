import React from 'react';
import { screen } from '@testing-library/react';
import StatusBadge from '../../../src/components/userManagement/StatusBadge';
import theme from '../../../src/theme/Theme';
import { renderWithTheme } from '../../testUtils';

describe('StatusBadge', () => {
  it.each(['Active', 'Invited', 'Inactive', 'Revoked'])('renders %s status', (status) => {
    renderWithTheme(<StatusBadge status={status} theme={theme} />);
    expect(screen.getByTestId(`status-badge-${status.toLowerCase()}`)).toHaveTextContent(status);
  });
});
