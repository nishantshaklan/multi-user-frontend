import React from 'react';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsersTablePagination from '../../../src/components/userManagement/UsersTablePagination';
import theme from '../../../src/theme/Theme';
import { renderWithTheme } from '../../testUtils';

describe('UsersTablePagination', () => {
  it('returns null when only one page exists', () => {
    const { container } = renderWithTheme(
      <UsersTablePagination page={1} totalPages={1} onPageChange={jest.fn()} theme={theme} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders all page buttons when total pages are seven or fewer', async () => {
    const onPageChange = jest.fn();
    renderWithTheme(
      <UsersTablePagination page={2} totalPages={5} onPageChange={onPageChange} theme={theme} />,
    );
    expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
  });

  it('navigates pages and renders ellipsis for large page counts', async () => {
    const user = userEvent.setup();
    const onPageChange = jest.fn();

    renderWithTheme(
      <UsersTablePagination page={5} totalPages={20} onPageChange={onPageChange} theme={theme} />,
    );

    expect(screen.getByTestId('pagination')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(onPageChange).toHaveBeenCalledWith(6);
    await user.click(screen.getByRole('button', { name: 'Last page' }));
    expect(onPageChange).toHaveBeenCalledWith(20);
    expect(screen.getAllByText('…').length).toBeGreaterThan(0);
  });
});
