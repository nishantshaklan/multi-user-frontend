import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getUserManagementStyles } from './userManagementStyles';
import { formatInviteResendCountdown, getInviteResendSecondsRemaining, isInviteResendOnCooldown } from './userUtils';

const ConfirmActionDialog = ({
  pendingAction,
  actionConfig,
  onCancel,
  onConfirm,
  isSubmitting,
  theme,
}) => {
  const c = theme.palette.custom;
  const styles = getUserManagementStyles(c);
  const open = Boolean(pendingAction);
  const config = pendingAction ? actionConfig[pendingAction.type] : null;

  if (!config || !pendingAction) {
    return (
      <Dialog
        open={open}
        onClose={onCancel}
        data-testid="confirm-dialog"
        maxWidth={false}
        slotProps={{ paper: { sx: styles.confirmModalPaper, elevation: 0 } }}
      />
    );
  }

  const isDanger = config.tone === 'danger';
  const isResendCooldown =
    pendingAction.type === 'reinvite' && isInviteResendOnCooldown(pendingAction.user);
  const resendCooldownLabel = isResendCooldown
    ? formatInviteResendCountdown(getInviteResendSecondsRemaining(pendingAction.user))
    : '';

  return (
    <Dialog
      open={open}
      onClose={isSubmitting ? undefined : onCancel}
      data-testid="confirm-dialog"
      maxWidth={false}
      slotProps={{
        paper: { sx: styles.confirmModalPaper, elevation: 0 },
        backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.4)' } },
      }}
    >
      <Box sx={styles.modalHeader}>
        <Typography sx={styles.modalTitle} data-testid="confirm-dialog-title">
          {config.title}
        </Typography>
        <IconButton
          onClick={onCancel}
          disabled={isSubmitting}
          aria-label="Close dialog"
          sx={styles.modalCloseButton}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={styles.modalDivider} />

      <Box sx={styles.confirmModalBody}>
        <Typography sx={styles.confirmModalText} data-testid="confirm-dialog-description">
          {config.description(pendingAction.user)}
        </Typography>
        {isResendCooldown && (
          <Typography
            sx={{ ...styles.confirmModalText, mt: 1.5, color: c.statusInvitedText }}
            data-testid="confirm-dialog-cooldown"
          >
            Resend invite is on cooldown. Try again in {resendCooldownLabel}.
          </Typography>
        )}
      </Box>

      <Box sx={styles.modalActions}>
        <Button
          onClick={onCancel}
          disabled={isSubmitting}
          data-testid="confirm-dialog-cancel"
          sx={styles.modalOutlinedButton}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disableElevation
          disabled={isSubmitting || isResendCooldown}
          data-testid="confirm-dialog-confirm"
          startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={isDanger ? styles.modalDangerButton : styles.modalPrimaryButton}
          color={isDanger ? 'error' : 'inherit'}
        >
          {isSubmitting ? 'Working…' : config.confirmText}
        </Button>
      </Box>
    </Dialog>
  );
};

ConfirmActionDialog.propTypes = {
  pendingAction: PropTypes.shape({
    type: PropTypes.oneOf(['deactivate', 'reactivate', 'reinvite', 'inviteAgain', 'revoke'])
      .isRequired,
    user: PropTypes.shape({
      id: PropTypes.string.isRequired,
      keycloakUserId: PropTypes.string,
      name: PropTypes.string.isRequired,
      email: PropTypes.string.isRequired,
      inviteResendSecondsRemaining: PropTypes.number,
      nextInviteEmailAllowedAt: PropTypes.string,
    }).isRequired,
  }),
  actionConfig: PropTypes.object.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  theme: PropTypes.object.isRequired,
};

ConfirmActionDialog.defaultProps = {
  pendingAction: null,
  isSubmitting: false,
};

export default ConfirmActionDialog;
