import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BlockIcon from '@mui/icons-material/Block';
import { getRowMenuActions } from './constants';
import { useInviteResendCountdown } from './useInviteResendCountdown';
import { formatInviteResendCountdown } from './userUtils';

const ACTION_META = {
  deactivate: {
    label: 'Deactivate User',
    icon: PersonOffIcon,
    colorKey: 'dangerText',
    testId: 'action-deactivate',
  },
  reactivate: {
    label: 'Reactivate User',
    icon: HowToRegIcon,
    colorKey: 'successActionText',
    testId: 'action-activate',
  },
  reinvite: {
    label: 'Resend Invite',
    icon: RestartAltIcon,
    colorKey: 'statusInvitedText',
    testId: 'action-resend',
    cooldownAction: true,
  },
  revoke: {
    label: 'Revoke Invite',
    icon: BlockIcon,
    colorKey: 'dangerText',
    testId: 'action-remove',
  },
  inviteAgain: {
    label: 'Send invite again',
    icon: RestartAltIcon,
    colorKey: 'statusInvitedText',
    testId: 'action-invite-again',
  },
};

const UserActionsMenu = ({ user, onAction, isRowMutating, theme }) => {
  const c = theme.palette.custom;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl) && !isRowMutating;
  const resendCooldownSeconds = useInviteResendCountdown(user);

  const menuActions = getRowMenuActions(user);

  useEffect(() => {
    if (isRowMutating) setAnchorEl(null);
  }, [isRowMutating]);

  if (menuActions.length === 0) return null;

  const handleOpen = (event) => {
    if (isRowMutating) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const fire = (type) => {
    if (type === 'reinvite' && resendCooldownSeconds > 0) return;
    handleClose();
    onAction({ type, user });
  };

  const renderMenuItem = (type) => {
    const meta = ACTION_META[type];
    if (!meta) return null;
    const Icon = meta.icon;
    const color = c[meta.colorKey];
    const onCooldown = meta.cooldownAction && resendCooldownSeconds > 0;
    const countdownLabel = onCooldown
      ? formatInviteResendCountdown(resendCooldownSeconds)
      : '';
    const tooltip = onCooldown ? `Resend available in ${countdownLabel}` : '';

    const item = (
      <MenuItem
        key={type}
        onClick={() => fire(type)}
        disabled={onCooldown}
        data-testid={`${meta.testId}-${user.id}`}
        sx={{ color: onCooldown ? c.ashGray : color }}
      >
        <ListItemIcon>
          <Icon fontSize="small" sx={{ color: onCooldown ? c.ashGray : color }} />
        </ListItemIcon>
        <ListItemText
          primary={meta.label}
          secondary={onCooldown ? countdownLabel : undefined}
          slotProps={{
            secondary: {
              sx: { fontSize: 11, fontVariantNumeric: 'tabular-nums' },
            },
          }}
        />
      </MenuItem>
    );

    if (!onCooldown) return item;

    return (
      <Tooltip key={type} title={tooltip} placement="left">
        <span>{item}</span>
      </Tooltip>
    );
  };

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        disabled={isRowMutating}
        data-testid={`user-actions-trigger-${user.id}`}
        aria-label={
          isRowMutating ? `Processing action for ${user.name}` : `Actions for ${user.name}`
        }
        aria-busy={isRowMutating}
        sx={{
          width: 32,
          height: 32,
          ...(isRowMutating && { bgcolor: c.whisperGrey }),
        }}
      >
        {isRowMutating ? (
          <CircularProgress size={18} sx={{ color: c.tealAccent }} />
        ) : (
          <MoreVertIcon fontSize="small" sx={{ color: c.ashGray }} />
        )}
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        {menuActions.map((type) => renderMenuItem(type))}
      </Menu>
    </>
  );
};

UserActionsMenu.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    keycloakUserId: PropTypes.string,
    name: PropTypes.string.isRequired,
    apiStatus: PropTypes.string,
    availableActions: PropTypes.arrayOf(PropTypes.string),
    inviteResendSecondsRemaining: PropTypes.number,
    nextInviteEmailAllowedAt: PropTypes.string,
  }).isRequired,
  onAction: PropTypes.func.isRequired,
  isRowMutating: PropTypes.bool,
  theme: PropTypes.object.isRequired,
};

UserActionsMenu.defaultProps = {
  isRowMutating: false,
};

export default UserActionsMenu;
