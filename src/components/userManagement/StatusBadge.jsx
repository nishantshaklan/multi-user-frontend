import React from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

const getStatusStyle = (status, c) => {
  switch (status) {
    case 'Active':
      return { bg: c.statusActiveBg, text: c.statusActiveText, dot: c.statusActiveDot };
    case 'Invited':
      return { bg: c.statusInvitedBg, text: c.statusInvitedText, dot: c.statusInvitedDot };
    case 'Inactive':
      return { bg: c.statusInactiveBg, text: c.statusInactiveText, dot: c.statusInactiveDot };
    case 'Revoked':
      return { bg: c.statusRevokedBg, text: c.statusRevokedText, dot: c.statusRevokedDot };
    default:
      return { bg: c.statusInactiveBg, text: c.statusInactiveText, dot: c.statusInactiveDot };
  }
};

const StatusBadge = ({ status, theme }) => {
  const c = theme.palette.custom;
  const style = getStatusStyle(status, c);

  return (
    <Box
      data-testid={`status-badge-${status.toLowerCase()}`}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        bgcolor: style.bg,
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: 999, bgcolor: style.dot, flexShrink: 0 }} />
      <Typography
        sx={{
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1,
          letterSpacing: '-0.12px',
          color: style.text,
        }}
      >
        {status}
      </Typography>
    </Box>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['Active', 'Invited', 'Inactive', 'Revoked']).isRequired,
  theme: PropTypes.object.isRequired,
};

export default StatusBadge;
