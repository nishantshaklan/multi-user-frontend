import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Users as UsersIcon } from 'lucide-react';
import { useUserManagement } from './useUserManagement';
import UsersTable from './UsersTable';
import UsersTablePagination from './UsersTablePagination';
import InviteUserDialog from './InviteUserDialog';
import ConfirmActionDialog from './ConfirmActionDialog';
import { getUserManagementStyles } from './userManagementStyles';
import { PAGE_SIZE, STATUS_FILTERS } from './constants';

const customPalettePropType = PropTypes.shape({
  ashGray: PropTypes.string,
  pureWhite: PropTypes.string,
  silverGray: PropTypes.string,
  chipYellowBackground: PropTypes.string,
  statusInvitedText: PropTypes.string,
  pureBlack: PropTypes.string,
  offWhite: PropTypes.string,
  tealAccent: PropTypes.string,
});

const panelStylesPropType = PropTypes.shape({
  toolbarRow: PropTypes.object,
  searchField: PropTypes.object,
  filterSelect: PropTypes.object,
  primaryButton: PropTypes.object,
  footerRow: PropTypes.object,
  footerText: PropTypes.object,
  pageTitle: PropTypes.object,
  pageSubtitle: PropTypes.object,
  dataCard: PropTypes.object,
  tableWrap: PropTypes.object,
});

const statsStatLabelSx = (c) => ({
  fontSize: 11,
  letterSpacing: '0.08em',
  color: c.ashGray,
  fontWeight: 600,
  textTransform: 'uppercase',
  lineHeight: 1.2,
});

const statsStatValueSx = (c) => ({
  fontSize: 22,
  fontWeight: 700,
  color: c.pureBlack,
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.2,
  mt: 0.25,
});

const StatsDivider = ({ borderColor }) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    <Box sx={{ width: '1px', height: 36, bgcolor: borderColor }} />
  </Box>
);

StatsDivider.propTypes = {
  borderColor: PropTypes.string.isRequired,
};

const StatsSegment = ({ label, value, bannerLoading, c }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', pl: 3, pr: 3.5, py: 1.5 }}>
    <Box>
      <Typography sx={statsStatLabelSx(c)}>{label}</Typography>
      <Typography sx={statsStatValueSx(c)}>{bannerLoading ? '…' : value}</Typography>
    </Box>
  </Box>
);

StatsSegment.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  bannerLoading: PropTypes.bool.isRequired,
  c: customPalettePropType.isRequired,
};

const StatsCard = ({ userLimit, activeUsers, invitedUsers, bannerLoading, c }) => (
    <Paper
      variant="outlined"
      sx={{
        display: 'inline-flex',
        alignItems: 'stretch',
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: c.pureWhite,
        borderColor: c.silverGray,
        alignSelf: { xs: 'stretch', sm: 'flex-start' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pl: 2, pr: 3.5, py: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: c.chipYellowBackground,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <UsersIcon size={22} color={c.statusInvitedText} strokeWidth={2} />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: 11,
              letterSpacing: '0.08em',
              color: c.ashGray,
              fontWeight: 600,
              textTransform: 'uppercase',
              lineHeight: 1.2,
            }}
          >
            User Limit
          </Typography>
          <Typography
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: c.pureBlack,
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.2,
              mt: 0.25,
            }}
          >
            {bannerLoading ? '…' : userLimit ?? '—'}
          </Typography>
        </Box>
      </Box>
      <StatsDivider borderColor={c.silverGray} />
      <StatsSegment label="Active User" value={activeUsers} bannerLoading={bannerLoading} c={c} />
      <StatsDivider borderColor={c.silverGray} />
      <StatsSegment label="Invited User" value={invitedUsers} bannerLoading={bannerLoading} c={c} />
    </Paper>
);

StatsCard.propTypes = {
  userLimit: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  activeUsers: PropTypes.number.isRequired,
  invitedUsers: PropTypes.number.isRequired,
  bannerLoading: PropTypes.bool.isRequired,
  c: customPalettePropType.isRequired,
};

StatsCard.defaultProps = {
  userLimit: null,
};

const DataCardToolbar = ({
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  onAddUser,
  canAddUser,
  addUserDisabledReason,
  styles,
  c,
}) => (
  <Box sx={styles.toolbarRow}>
    <TextField
        placeholder="Search by name, email, or phone"
      value={query}
      onChange={(e) => onQueryChange(e.target.value)}
      sx={styles.searchField}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start" sx={{ mr: 0.5 }}>
              <SearchIcon sx={{ color: c.ashGray, fontSize: 20 }} />
            </InputAdornment>
          ),
        },
        htmlInput: { 'data-testid': 'search-input' },
      }}
    />
    <Select
      value={statusFilter}
      onChange={(e) => onStatusFilterChange(e.target.value)}
      displayEmpty
      data-testid="status-filter-trigger"
      sx={styles.filterSelect}
      IconComponent={KeyboardArrowDownIcon}
      renderValue={(value) => value || 'All'}
    >
      {STATUS_FILTERS.map((s) => (
        <MenuItem key={s} value={s} data-testid={`status-filter-${s.toLowerCase()}`}>
          {s}
        </MenuItem>
      ))}
    </Select>
    <Box sx={{ flex: 1, minWidth: 8 }} />
    <Tooltip title={canAddUser ? '' : addUserDisabledReason} disableHoverListener={canAddUser}>
      <span>
        <Button
          onClick={onAddUser}
          variant="contained"
          startIcon={<AddIcon />}
          data-testid="add-user-btn"
          sx={styles.primaryButton}
          disabled={!canAddUser}
        >
          Add User
        </Button>
      </span>
    </Tooltip>
  </Box>
);

DataCardToolbar.propTypes = {
  query: PropTypes.string.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  statusFilter: PropTypes.string.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  onAddUser: PropTypes.func.isRequired,
  canAddUser: PropTypes.bool.isRequired,
  addUserDisabledReason: PropTypes.string.isRequired,
  styles: panelStylesPropType.isRequired,
  c: customPalettePropType.isRequired,
};

const DataCardFooter = ({ total, page, totalPages, onPageChange, styles, theme }) => {
  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);

  return (
    <Box sx={styles.footerRow}>
      <Typography sx={styles.footerText} data-testid="users-count-footer">
        {total === 0
          ? 'Showing results 0 of 0'
          : `Showing results ${start}-${end} of ${total}`}
      </Typography>
      <UsersTablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        theme={theme}
      />
    </Box>
  );
};

DataCardFooter.propTypes = {
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  totalPages: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  styles: panelStylesPropType.isRequired,
  theme: PropTypes.shape({
    palette: PropTypes.shape({
      custom: customPalettePropType,
    }),
  }).isRequired,
};

const UserManagementPanel = () => {
  const theme = useTheme();
  const c = theme.palette.custom;
  const styles = getUserManagementStyles(c);
  const ux = useUserManagement();

  return (
    <Box sx={{ minHeight: '100%', bgcolor: c.offWhite, p: { xs: 2, sm: 3, md: 5 } }}>
      <Box sx={{ maxWidth: 1120, mx: 'auto' }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            justifyContent: 'space-between',
            alignItems: { lg: 'flex-start' },
            gap: 3,
            mb: 3,
          }}
        >
          <Box>
            <Typography data-testid="page-title" sx={styles.pageTitle}>
              Users
            </Typography>
            <Typography sx={styles.pageSubtitle}>
              Manage team access, invitations, and permissions.
            </Typography>
          </Box>
          <StatsCard
            userLimit={ux.userLimit}
            activeUsers={ux.activeUsers}
            invitedUsers={ux.invitedUsers}
            bannerLoading={ux.bannerLoading}
            c={c}
          />
        </Box>

        {!ux.enterpriseId && !ux.loading && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Enterprise ID is not available. User management APIs require a tenant context from your
            session.
          </Alert>
        )}

        {ux.error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={ux.refetchList}>
                Retry
              </Button>
            }
          >
            {ux.error}
          </Alert>
        )}

        <Paper elevation={0} sx={styles.dataCard}>
          <DataCardToolbar
            query={ux.query}
            onQueryChange={ux.setQuery}
            statusFilter={ux.statusFilter}
            onStatusFilterChange={ux.setStatusFilter}
            onAddUser={() => ux.setIsInviteOpen(true)}
            canAddUser={ux.canAddUser}
            addUserDisabledReason={
              ux.userLimit == null
                ? 'Plan seat limit is unavailable. Add user is disabled until plan data loads.'
                : `Seat limit reached (${ux.seatsUsed} of ${ux.userLimit} seats in use).`
            }
            styles={styles}
            c={c}
          />

          <Box sx={styles.tableWrap}>
            {ux.loading && ux.rows.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={36} sx={{ color: c.tealAccent }} />
              </Box>
            ) : (
              <UsersTable
                rows={ux.rows}
                loading={ux.loading}
                mutatingUserId={ux.mutatingUserId}
                onAction={({ type, user }) => ux.setPendingAction({ type, user })}
                theme={theme}
              />
            )}
          </Box>

          <DataCardFooter
            total={ux.total}
            page={ux.page}
            totalPages={ux.totalPages}
            onPageChange={ux.setPage}
            styles={styles}
            theme={theme}
          />
        </Paper>
      </Box>

      <InviteUserDialog
        open={ux.isInviteOpen}
        onClose={() => ux.setIsInviteOpen(false)}
        onInvite={ux.invite}
        isSubmitting={ux.isMutating}
        theme={theme}
      />

      <ConfirmActionDialog
        pendingAction={ux.pendingAction}
        actionConfig={ux.actionConfig}
        onCancel={() => ux.setPendingAction(null)}
        onConfirm={ux.confirmPendingAction}
        isSubmitting={ux.isMutating}
        theme={theme}
      />
    </Box>
  );
};

export default UserManagementPanel;
