import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  Drawer,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SendIcon from '@mui/icons-material/Send';
import { getUserManagementStyles } from './userManagementStyles';
import {
  isValidEmail,
  isValidIndianPhone,
  normalizeIndianPhoneForApi,
  sanitizeIndianPhoneInput,
} from './userUtils';

const InviteUserDialog = ({ open, onClose, onInvite, isSubmitting, theme }) => {
  const c = theme.palette.custom;
  const styles = getUserManagementStyles(c);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!open) {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setErrors({});
      setSubmitError('');
    }
  }, [open]);

  const validate = () => {
    const next = {};
    if (!firstName.trim()) next.firstName = 'First name is required';
    if (!lastName.trim()) next.lastName = 'Last name is required';
    if (!email.trim()) next.email = 'Email is required';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address';
    if (!phone.trim()) next.phone = 'Phone number is required';
    else if (!isValidIndianPhone(phone)) {
      next.phone = 'Enter 10 digits or +91 followed by 10 digits (no spaces)';
    }
    return next;
  };

  const clearFieldError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setSubmitError('');
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();
    setSubmitError('');
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const result = await onInvite({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: normalizeIndianPhoneForApi(phone),
    });

    if (result?.ok) {
      onClose();
      return;
    }

    if (result?.fieldErrors && typeof result.fieldErrors === 'object') {
      setErrors((prev) => ({ ...prev, ...result.fieldErrors }));
    }
    if (result?.errorMessage) {
      setSubmitError(result.errorMessage);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={isSubmitting ? undefined : onClose}
      slotProps={{
        paper: { sx: styles.sideDrawerPaper, elevation: 0 },
        backdrop: { sx: { bgcolor: 'rgba(0, 0, 0, 0.35)' } },
      }}
    >
      <Box component="form" onSubmit={handleSubmit} sx={styles.sideDrawerRoot}>
        <Box sx={styles.modalHeader}>
          <Box sx={styles.modalHeaderMain}>
            <Box sx={styles.modalIconWrap}>
              <MailOutlineIcon sx={{ color: c.statusInvitedText, fontSize: 22 }} />
            </Box>
            <Box>
              <Typography sx={styles.modalTitle}>Invite via Email</Typography>
              <Typography sx={styles.modalSubtitle}>
                Send an invitation link to a new teammate.
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close invite panel"
            sx={styles.modalCloseButton}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={styles.modalDivider} />

        <Box sx={styles.sideDrawerBody}>
          <TextField
            label="First name"
            placeholder="e.g., Alex"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError('firstName');
            }}
            error={Boolean(errors.firstName)}
            helperText={errors.firstName || ' '}
            fullWidth
            sx={styles.modalField}
            slotProps={{ htmlInput: { 'data-testid': 'invite-first-name-input' } }}
          />
          <TextField
            label="Last name"
            placeholder="e.g., Morgan"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearFieldError('lastName');
            }}
            error={Boolean(errors.lastName)}
            helperText={errors.lastName || ' '}
            fullWidth
            sx={styles.modalField}
            slotProps={{ htmlInput: { 'data-testid': 'invite-last-name-input' } }}
          />
          <TextField
            label="Email"
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError('email');
            }}
            error={Boolean(errors.email)}
            helperText={errors.email || ' '}
            fullWidth
            sx={styles.modalField}
            slotProps={{ htmlInput: { 'data-testid': 'invite-email-input' } }}
          />
          <TextField
            label="Phone"
            placeholder="8178517483 or +918178517483"
            value={phone}
            onChange={(e) => {
              setPhone(sanitizeIndianPhoneInput(e.target.value));
              clearFieldError('phone');
            }}
            error={Boolean(errors.phone)}
            helperText={errors.phone || ' '}
            fullWidth
            sx={styles.modalField}
            slotProps={{
              htmlInput: {
                'data-testid': 'invite-phone-input',
                inputMode: 'tel',
                pattern: '[0-9+]*',
              },
            }}
          />
          {submitError && (
            <Alert severity="error" sx={styles.modalField}>
              {submitError}
            </Alert>
          )}
          <Alert severity="info" sx={styles.modalInfoAlert}>
            The user will receive an invitation email and appear in the list with status{' '}
            <strong>Invited</strong>.
          </Alert>
        </Box>

        <Box sx={styles.sideDrawerActions}>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
            data-testid="invite-cancel-btn"
            sx={styles.modalCancelButton}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={isSubmitting}
            startIcon={<SendIcon sx={{ fontSize: 18 }} />}
            data-testid="invite-send-btn"
            sx={styles.modalPrimaryButton}
          >
            {isSubmitting ? 'Sending…' : 'Send Invite'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

InviteUserDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  theme: PropTypes.object.isRequired,
};

InviteUserDialog.defaultProps = {
  isSubmitting: false,
};

export default InviteUserDialog;
