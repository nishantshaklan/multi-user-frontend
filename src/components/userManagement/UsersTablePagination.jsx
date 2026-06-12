import React from 'react';
import PropTypes from 'prop-types';
import { Box, IconButton, Typography } from '@mui/material';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const buildPageItems = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => ({
      type: 'page',
      key: `page-${i + 1}`,
      value: i + 1,
    }));
  }

  const pages = new Set([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const items = [];
  let prev = 0;

  sorted.forEach((p) => {
    if (p - prev > 1) {
      items.push({ type: 'ellipsis', key: `ellipsis-${prev}-${p}` });
    }
    items.push({ type: 'page', key: `page-${p}`, value: p });
    prev = p;
  });

  return items;
};

const NavButton = ({ children, onClick, disabled, ariaLabel, c }) => (
  <IconButton
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    sx={{
      width: 32,
      height: 32,
      borderRadius: '8px',
      color: c.ashGray,
      '&.Mui-disabled': { color: c.lightSlateGray },
    }}
  >
    {children}
  </IconButton>
);

NavButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string.isRequired,
  c: PropTypes.object.isRequired,
};

NavButton.defaultProps = {
  disabled: false,
};

const PageNumber = ({ value, isActive, onClick, c }) => (
  <Box
    component="button"
    type="button"
    onClick={onClick}
    aria-current={isActive ? 'page' : undefined}
    sx={{
      width: 32,
      height: 32,
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: 14,
      lineHeight: '18px',
      letterSpacing: '-0.14px',
      fontWeight: isActive ? 500 : 400,
      color: isActive ? c.pureBlack : c.ashGray,
      bgcolor: isActive ? c.platinum : c.pureWhite,
      '&:hover': {
        bgcolor: isActive ? c.platinum : c.whisperGrey,
      },
    }}
  >
    {value}
  </Box>
);

PageNumber.propTypes = {
  value: PropTypes.number.isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  c: PropTypes.object.isRequired,
};

const UsersTablePagination = ({ page, totalPages, onPageChange, theme }) => {
  const c = theme.palette.custom;

  if (totalPages <= 1) return null;

  const items = buildPageItems(page, totalPages);

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', gap: '2px' }}
      data-testid="pagination"
    >
      <NavButton
        c={c}
        ariaLabel="First page"
        disabled={page <= 1}
        onClick={() => onPageChange(1)}
      >
        <FirstPageIcon sx={{ fontSize: 20 }} />
      </NavButton>
      <NavButton
        c={c}
        ariaLabel="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeftIcon sx={{ fontSize: 20 }} />
      </NavButton>

      {items.map((item) =>
        item.type === 'ellipsis' ? (
          <Typography
            key={item.key}
            sx={{
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: c.ashGray,
            }}
          >
            …
          </Typography>
        ) : (
          <PageNumber
            key={item.key}
            value={item.value}
            isActive={item.value === page}
            onClick={() => onPageChange(item.value)}
            c={c}
          />
        ),
      )}

      <NavButton
        c={c}
        ariaLabel="Next page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRightIcon sx={{ fontSize: 20 }} />
      </NavButton>
      <NavButton
        c={c}
        ariaLabel="Last page"
        disabled={page >= totalPages}
        onClick={() => onPageChange(totalPages)}
      >
        <LastPageIcon sx={{ fontSize: 20 }} />
      </NavButton>
    </Box>
  );
};

UsersTablePagination.propTypes = {
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  theme: PropTypes.object.isRequired,
};

export default UsersTablePagination;
