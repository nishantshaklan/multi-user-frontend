import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import StatusBadge from './StatusBadge';
import UserActionsMenu from './UserActionsMenu';
import { getUserManagementStyles } from './userManagementStyles';
import { formatCreatedDate, getAvatarColors, getInitials } from './userUtils';

const Avatar = ({ name, avatarPalette, textColor }) => {
  const colors = getAvatarColors(name, avatarPalette);
  return (
    <Box
      aria-hidden
      sx={{
        width: 32,
        height: 32,
        borderRadius: 999,
        bgcolor: colors.bg,
        color: textColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {getInitials(name)}
    </Box>
  );
};

Avatar.propTypes = {
  name: PropTypes.string.isRequired,
  avatarPalette: PropTypes.arrayOf(PropTypes.string),
  textColor: PropTypes.string.isRequired,
};

const UsersTable = ({ rows, onAction, loading, mutatingUserId, theme }) => {
  const c = theme.palette.custom;
  const styles = getUserManagementStyles(c);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      {loading && rows.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            bgcolor: 'rgba(255,255,255,0.6)',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={28} sx={{ color: c.tealAccent }} />
        </Box>
      )}
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ ...styles.tableHeaderCell, minWidth: 220 }}>Name</TableCell>
              <TableCell sx={{ ...styles.tableHeaderCell, minWidth: 200 }}>Email</TableCell>
              <TableCell sx={{ ...styles.tableHeaderCell, minWidth: 140 }}>MSISDN</TableCell>
              <TableCell sx={{ ...styles.tableHeaderCell, minWidth: 120 }}>Status</TableCell>
              <TableCell sx={{ ...styles.tableHeaderCell, minWidth: 120 }}>Created</TableCell>
              <TableCell
                aria-hidden
                sx={{
                  ...styles.tableHeaderCell,
                  width: 67,
                  p: '12px 24px 8px',
                }}
              />
            </TableRow>
          </TableHead>
          <TableBody data-testid="users-table-body">
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  sx={{
                    ...styles.tableBodyCell,
                    textAlign: 'center',
                    py: 6,
                    borderBottom: 'none',
                  }}
                  data-testid="empty-state"
                >
                  {loading ? 'Loading users…' : 'No users match your filters.'}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((user) => (
                <TableRow
                  key={user.id}
                  data-testid={`user-row-${user.id}`}
                  hover
                  sx={{
                    '&:hover td': { bgcolor: c.whisperGrey },
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  <TableCell sx={styles.tableBodyCell}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        name={user.name}
                        avatarPalette={c.avatarColors}
                        textColor={c.pureBlack}
                      />
                      <Typography sx={styles.tableNameText}>{user.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={styles.tableBodyCell}>{user.email}</TableCell>
                  <TableCell sx={{ ...styles.tableBodyCell, fontVariantNumeric: 'tabular-nums' }}>
                    {user.msisdn}
                  </TableCell>
                  <TableCell sx={styles.tableBodyCell}>
                    <StatusBadge status={user.status} theme={theme} />
                  </TableCell>
                  <TableCell sx={styles.tableBodyCell}>
                    {formatCreatedDate(user.createdAt)}
                  </TableCell>
                  <TableCell sx={{ ...styles.tableBodyCell, textAlign: 'right' }}>
                    <UserActionsMenu
                      user={user}
                      onAction={onAction}
                      isRowMutating={mutatingUserId === user.id}
                      theme={theme}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

UsersTable.propTypes = {
  rows: PropTypes.array.isRequired,
  onAction: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  mutatingUserId: PropTypes.string,
  theme: PropTypes.object.isRequired,
};

UsersTable.defaultProps = {
  loading: false,
  mutatingUserId: null,
};

export default UsersTable;
