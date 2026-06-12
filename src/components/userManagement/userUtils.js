const AVATAR_FG = ['#92400E', '#166534', '#1E40AF', '#9D174D', '#5B21B6', '#9F1239', '#115E59', '#854D0E'];

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const getAvatarColors = (name, avatarPalette = ['#FCECCB', '#DCEDE1', '#FFE8E4', '#DEF2FF']) => {
  const seed = (name || '').split('').reduce((sum, ch) => sum + ch.codePointAt(0), 0);
  const bg = avatarPalette[seed % avatarPalette.length];
  const fg = AVATAR_FG[seed % AVATAR_FG.length];
  return { bg, fg };
};

export const formatCreatedDate = (iso) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const formatPhone = (phone) => {
  if (!phone) return '—';
  return String(phone);
};

export const getInviteResendSecondsRemaining = (user, nowMs = Date.now()) => {
  if (user?.nextInviteEmailAllowedAt) {
    const allowedAt = new Date(user.nextInviteEmailAllowedAt).getTime();
    if (!Number.isNaN(allowedAt)) {
      return Math.max(0, Math.ceil((allowedAt - nowMs) / 1000));
    }
  }
  if (typeof user?.inviteResendSecondsRemaining === 'number') {
    return Math.max(0, user.inviteResendSecondsRemaining);
  }
  return 0;
};

export const isInviteResendOnCooldown = (user, nowMs = Date.now()) =>
  getInviteResendSecondsRemaining(user, nowMs) > 0;

export const formatInviteResendCountdown = (totalSeconds) => {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (s <= 0) return '';
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
};

export const parseResendCooldownError = (err) => {
  if (err?.status !== 429) return null;
  const raw = err?.raw && typeof err.raw === 'object' ? err.raw : {};
  const code = raw.code ?? raw.errorCode ?? raw.reason;
  const hasCooldownFields =
    raw.inviteResendSecondsRemaining != null || raw.nextInviteEmailAllowedAt != null;
  const isCooldown =
    code === 'INVITE_RESEND_COOLDOWN' ||
    hasCooldownFields ||
    (typeof raw.message === 'string' && raw.message.toLowerCase().includes('cooldown'));

  if (!isCooldown) return null;

  const seconds = getInviteResendSecondsRemaining({
    inviteResendSecondsRemaining: raw.inviteResendSecondsRemaining,
    nextInviteEmailAllowedAt: raw.nextInviteEmailAllowedAt,
  });

  const countdown = formatInviteResendCountdown(seconds);
  let message = '';
  if (typeof raw.message === 'string' && raw.message.trim()) {
    message = raw.message;
  } else if (countdown) {
    message = `Resend invite is on cooldown. Try again in ${countdown}.`;
  } else {
    message = 'Resend invite is on cooldown. Please try again later.';
  }

  return {
    message,
    inviteResendSecondsRemaining: seconds,
    nextInviteEmailAllowedAt: raw.nextInviteEmailAllowedAt || null,
  };
};

export const mapApiStatusToUi = (apiStatus) => {
  switch (apiStatus) {
    case 'ACTIVE':
      return 'Active';
    case 'INVITED':
      return 'Invited';
    case 'INACTIVE':
      return 'Inactive';
    case 'REVOKED':
      return 'Revoked';
    default:
      return 'Inactive';
  }
};

export const mapApiUserToRow = (item) => {
  const name = [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email;
  return {
    id: item.id,
    keycloakUserId: item.keycloakUserId,
    name,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    phone: item.phone || null,
    msisdn: formatPhone(item.phone),
    status: mapApiStatusToUi(item.status),
    apiStatus: item.status,
    createdAt: item.createdAt,
    role: item.role,
    availableActions: Array.isArray(item.availableActions) ? item.availableActions : [],
    lastInviteEmailSentAt: item.lastInviteEmailSentAt || null,
    nextInviteEmailAllowedAt: item.nextInviteEmailAllowedAt || null,
    inviteResendSecondsRemaining:
      typeof item.inviteResendSecondsRemaining === 'number'
        ? item.inviteResendSecondsRemaining
        : null,
  };
};

const hasInvalidEmailChar = (part) => {
  for (const ch of part) {
    if (ch === '@' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      return true;
    }
  }
  return false;
};

export const isValidEmail = (email) => {
  const trimmed = String(email).trim();
  if (!trimmed) return false;

  const atIndex = trimmed.indexOf('@');
  if (atIndex <= 0 || atIndex !== trimmed.lastIndexOf('@')) return false;

  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  if (!local || !domain || hasInvalidEmailChar(local) || hasInvalidEmailChar(domain)) {
    return false;
  }

  const dotIndex = domain.indexOf('.');
  if (dotIndex <= 0) return false;

  const domainBeforeDot = domain.slice(0, dotIndex);
  const domainAfterDot = domain.slice(dotIndex + 1);
  return Boolean(domainAfterDot) && !hasInvalidEmailChar(domainBeforeDot) && !hasInvalidEmailChar(domainAfterDot);
};

/** Strip letters/spaces; keep digits only, or + at start for +91… */
export const sanitizeIndianPhoneInput = (value) => {
  const s = String(value);
  if (s.startsWith('+')) {
    const digits = s.slice(1).replaceAll(/\D/g, '');
    return `+${digits}`.slice(0, 13);
  }
  return s.replaceAll(/\D/g, '').slice(0, 10);
};

/** 10 digits, or +91 immediately followed by 10 digits (no spaces). */
export const isValidIndianPhone = (phone) => {
  const trimmed = String(phone).trim();
  return /^\d{10}$/.test(trimmed) || /^\+91\d{10}$/.test(trimmed);
};

/** Prefix +91 when the user entered only 10 digits. */
export const normalizeIndianPhoneForApi = (phone) => {
  const trimmed = String(phone).trim();
  if (/^\d{10}$/.test(trimmed)) return `+91${trimmed}`;
  return trimmed;
};

export const splitFullName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};
